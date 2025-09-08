module.exports = (app, { appData, JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, bcrypt, jwt, logAuditEvent, generateId }) => {

    // Login endpoint
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password, rememberMe = false } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Find user by email
            const user = appData.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
            if (!user) {
                logAuditEvent(null, 'LOGIN_FAILED', 'user', null, { email, reason: 'USER_NOT_FOUND' });
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                logAuditEvent(user.id, 'LOGIN_FAILED', 'user', user.id, { email, reason: 'INVALID_PASSWORD' });
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Generate tokens
            const tokenExpiry = rememberMe ? '30d' : JWT_EXPIRES_IN;
            const accessToken = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    role: user.role,
                    permissions: user.permissions
                },
                JWT_SECRET,
                { expiresIn: tokenExpiry }
            );

            const refreshToken = jwt.sign(
                { userId: user.id, tokenId: generateId('refresh-') },
                JWT_REFRESH_SECRET,
                { expiresIn: JWT_REFRESH_EXPIRES_IN }
            );

            // Store refresh token
            const refreshTokenEntry = {
                id: generateId('refresh-'),
                userId: user.id,
                token: refreshToken,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
                isActive: true
            };
            appData.refreshTokens.push(refreshTokenEntry);

            // Update user last login
            user.lastLogin = new Date();

            // Log successful login
            logAuditEvent(user.id, 'LOGIN_SUCCESS', 'user', user.id, { email });

            res.json({
                success: true,
                data: {
                    accessToken,
                    refreshToken,
                    expiresIn: tokenExpiry,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        permissions: user.permissions,
                        companyId: user.companyId
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed',
                code: 'LOGIN_ERROR'
            });
        }
    });

    // Refresh token endpoint
    app.post('/api/auth/refresh', async (req, res) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Refresh token is required',
                    code: 'MISSING_REFRESH_TOKEN'
                });
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            
            // Find refresh token in storage
            const storedToken = appData.refreshTokens.find(rt => 
                rt.token === refreshToken && 
                rt.userId === decoded.userId && 
                rt.isActive && 
                rt.expiresAt > new Date()
            );

            if (!storedToken) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid or expired refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }

            // Find user
            const user = appData.users.find(u => u.id === decoded.userId && u.isActive);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    role: user.role,
                    permissions: user.permissions
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Log token refresh
            logAuditEvent(user.id, 'TOKEN_REFRESH', 'user', user.id, {});

            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    expiresIn: JWT_EXPIRES_IN
                }
            });

        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid or expired refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }

            console.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                error: 'Token refresh failed',
                code: 'REFRESH_ERROR'
            });
        }
    });

    // Logout endpoint
    app.post('/api/auth/logout', async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            let userId = null;

            // Try to get user ID from access token
            if (token) {
                try {
                    const decoded = jwt.verify(token, JWT_SECRET);
                    userId = decoded.userId;
                } catch (error) {
                    // Token might be expired, continue with logout
                }
            }

            // Invalidate refresh token if provided
            if (refreshToken) {
                const tokenIndex = appData.refreshTokens.findIndex(rt => rt.token === refreshToken);
                if (tokenIndex !== -1) {
                    appData.refreshTokens[tokenIndex].isActive = false;
                    if (!userId) {
                        userId = appData.refreshTokens[tokenIndex].userId;
                    }
                }
            }

            // Log logout
            if (userId) {
                logAuditEvent(userId, 'LOGOUT', 'user', userId, {});
            }

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Logout failed',
                code: 'LOGOUT_ERROR'
            });
        }
    });

    // Register endpoint (admin only)
    app.post('/api/auth/register', async (req, res) => {
        try {
            // Basic auth check for admin operations
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const adminUser = appData.users.find(u => u.id === decoded.userId && u.permissions.includes('admin'));

            if (!adminUser) {
                return res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                    code: 'ADMIN_REQUIRED'
                });
            }

            const { email, password, name, role = 'employee', permissions = ['read'] } = req.body;

            // Validate input
            if (!email || !password || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'Email, password, and name are required',
                    code: 'MISSING_FIELDS'
                });
            }

            // Check if user already exists
            const existingUser = appData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'User with this email already exists',
                    code: 'USER_EXISTS'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const newUser = {
                id: generateId('user-'),
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                role,
                permissions: Array.isArray(permissions) ? permissions : [permissions],
                companyId: adminUser.companyId,
                createdAt: new Date(),
                lastLogin: null,
                isActive: true
            };

            appData.users.push(newUser);

            // Log user creation
            logAuditEvent(adminUser.id, 'USER_CREATED', 'user', newUser.id, { email, name, role });

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                        role: newUser.role,
                        permissions: newUser.permissions,
                        createdAt: newUser.createdAt
                    }
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed',
                code: 'REGISTRATION_ERROR'
            });
        }
    });

    // Get current user info
    app.get('/api/auth/me', async (req, res) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Access token required',
                    code: 'MISSING_TOKEN'
                });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = appData.users.find(u => u.id === decoded.userId && u.isActive);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token or user not found',
                    code: 'INVALID_TOKEN'
                });
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        permissions: user.permissions,
                        companyId: user.companyId,
                        lastLogin: user.lastLogin,
                        createdAt: user.createdAt
                    }
                }
            });

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            console.error('Get user info error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user info',
                code: 'USER_INFO_ERROR'
            });
        }
    });

    // Change password
    app.post('/api/auth/change-password', async (req, res) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = appData.users.find(u => u.id === decoded.userId && u.isActive);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password and new password are required',
                    code: 'MISSING_PASSWORDS'
                });
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                logAuditEvent(user.id, 'PASSWORD_CHANGE_FAILED', 'user', user.id, { reason: 'INVALID_CURRENT_PASSWORD' });
                return res.status(400).json({
                    success: false,
                    error: 'Current password is incorrect',
                    code: 'INVALID_CURRENT_PASSWORD'
                });
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedNewPassword;

            // Invalidate all refresh tokens for this user (force re-login)
            appData.refreshTokens = appData.refreshTokens.map(rt => 
                rt.userId === user.id ? { ...rt, isActive: false } : rt
            );

            // Log password change
            logAuditEvent(user.id, 'PASSWORD_CHANGED', 'user', user.id, {});

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                error: 'Password change failed',
                code: 'PASSWORD_CHANGE_ERROR'
            });
        }
    });

    // OAuth2 Authorization endpoint (for third-party integrations)
    app.get('/api/auth/oauth2/authorize', async (req, res) => {
        try {
            const { client_id, redirect_uri, response_type, scope, state } = req.query;

            // Validate OAuth2 parameters
            if (!client_id || !redirect_uri || response_type !== 'code') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid OAuth2 parameters',
                    code: 'INVALID_OAUTH_PARAMS'
                });
            }

            // In a real implementation, you would:
            // 1. Validate the client_id against registered applications
            // 2. Show a consent screen to the user
            // 3. Generate an authorization code
            // 4. Redirect back with the code

            // For demo purposes, return a mock authorization code
            const authCode = generateId('auth_code_');
            
            // Store the authorization code temporarily (normally in Redis or similar)
            const authCodeEntry = {
                code: authCode,
                clientId: client_id,
                redirectUri: redirect_uri,
                scope: scope || 'read',
                state,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                isUsed: false
            };

            // Store in memory (in production, use proper storage)
            if (!appData.authCodes) appData.authCodes = [];
            appData.authCodes.push(authCodeEntry);

            // Redirect back to the client application
            const redirectUrl = new URL(redirect_uri);
            redirectUrl.searchParams.append('code', authCode);
            if (state) redirectUrl.searchParams.append('state', state);

            res.redirect(redirectUrl.toString());

        } catch (error) {
            console.error('OAuth2 authorize error:', error);
            res.status(500).json({
                success: false,
                error: 'Authorization failed',
                code: 'OAUTH_AUTHORIZE_ERROR'
            });
        }
    });

    // OAuth2 Token endpoint
    app.post('/api/auth/oauth2/token', async (req, res) => {
        try {
            const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

            if (grant_type !== 'authorization_code') {
                return res.status(400).json({
                    error: 'unsupported_grant_type',
                    error_description: 'Only authorization_code grant type is supported'
                });
            }

            if (!code || !client_id) {
                return res.status(400).json({
                    error: 'invalid_request',
                    error_description: 'Missing required parameters'
                });
            }

            // Find the authorization code
            const authCodeEntry = (appData.authCodes || []).find(ac => 
                ac.code === code && 
                ac.clientId === client_id &&
                ac.redirectUri === redirect_uri &&
                !ac.isUsed &&
                ac.expiresAt > new Date()
            );

            if (!authCodeEntry) {
                return res.status(400).json({
                    error: 'invalid_grant',
                    error_description: 'Invalid or expired authorization code'
                });
            }

            // Mark code as used
            authCodeEntry.isUsed = true;

            // Generate OAuth2 access token
            const accessToken = jwt.sign(
                { 
                    client_id,
                    scope: authCodeEntry.scope,
                    token_type: 'Bearer'
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({
                access_token: accessToken,
                token_type: 'Bearer',
                expires_in: 3600,
                scope: authCodeEntry.scope
            });

        } catch (error) {
            console.error('OAuth2 token error:', error);
            res.status(500).json({
                error: 'server_error',
                error_description: 'Internal server error'
            });
        }
    });

    // Revoke refresh token
    app.post('/api/auth/revoke', async (req, res) => {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'Token is required',
                    code: 'MISSING_TOKEN'
                });
            }

            // Find and revoke the refresh token
            const tokenIndex = appData.refreshTokens.findIndex(rt => rt.token === token);
            if (tokenIndex !== -1) {
                appData.refreshTokens[tokenIndex].isActive = false;
                logAuditEvent(appData.refreshTokens[tokenIndex].userId, 'TOKEN_REVOKED', 'token', token, {});
            }

            res.json({
                success: true,
                message: 'Token revoked successfully'
            });

        } catch (error) {
            console.error('Token revoke error:', error);
            res.status(500).json({
                success: false,
                error: 'Token revocation failed',
                code: 'REVOKE_ERROR'
            });
        }
    });

};

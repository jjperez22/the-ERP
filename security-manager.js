/**
 * ConstructERP Security Manager
 * Central security controller for authentication, authorization, and security operations
 * 
 * Features:
 * - Role-based access control (RBAC)
 * - Session management
 * - Security policy enforcement
 * - Threat detection and prevention
 * - Integration with audit logging
 */

class SecurityManager {
    constructor() {
        this.currentUser = null;
        this.sessionData = null;
        this.securityPolicies = this.initializeSecurityPolicies();
        this.failedLoginAttempts = new Map();
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.maxFailedAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        
        console.log('🔐 SecurityManager initialized');
    }

    /**
     * Initialize security policies and role definitions
     */
    initializeSecurityPolicies() {
        return {
            roles: {
                'Administrator': {
                    level: 100,
                    permissions: [
                        'system:admin',
                        'user:manage',
                        'data:all',
                        'reports:all',
                        'audit:view',
                        'settings:manage',
                        'export:all',
                        'import:all',
                        'delete:all'
                    ],
                    modules: ['*'] // Access to all modules
                },
                'Manager': {
                    level: 75,
                    permissions: [
                        'data:read',
                        'data:write',
                        'reports:view',
                        'reports:create',
                        'export:standard',
                        'user:view',
                        'approve:orders',
                        'approve:purchases'
                    ],
                    modules: [
                        'dashboard',
                        'inventory',
                        'customers',
                        'orders',
                        'reports',
                        'supply-chain',
                        'hr'
                    ]
                },
                'Employee': {
                    level: 50,
                    permissions: [
                        'data:read',
                        'data:write:own',
                        'reports:view:own',
                        'export:basic'
                    ],
                    modules: [
                        'dashboard',
                        'inventory',
                        'customers',
                        'orders'
                    ]
                },
                'Guest': {
                    level: 10,
                    permissions: [
                        'data:read:limited'
                    ],
                    modules: [
                        'dashboard'
                    ]
                }
            },
            sensitiveActions: [
                'delete',
                'export:all',
                'user:manage',
                'settings:manage',
                'audit:view',
                'approve:high-value'
            ],
            dataClassification: {
                'public': ['dashboard-stats', 'general-info'],
                'internal': ['inventory', 'customers', 'orders'],
                'confidential': ['financials', 'employee-data', 'vendor-contracts'],
                'restricted': ['audit-logs', 'security-settings', 'user-passwords']
            }
        };
    }

    /**
     * Authenticate user with enhanced security
     */
    async authenticateUser(credentials) {
        const { email, password, rememberMe = false } = credentials;
        
        try {
            // Check if user is locked out
            if (this.isUserLockedOut(email)) {
                const lockoutInfo = this.failedLoginAttempts.get(email);
                const remainingTime = Math.ceil((lockoutInfo.lockedUntil - Date.now()) / 1000 / 60);
                
                await this.auditLog('LOGIN_ATTEMPT_LOCKED', {
                    email,
                    remainingLockoutMinutes: remainingTime
                });
                
                throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
            }

            // Simulate authentication (in production, this would validate against secure backend)
            const user = await this.validateCredentials(email, password);
            
            if (!user) {
                await this.handleFailedLogin(email);
                throw new Error('Invalid email or password');
            }

            // Clear any previous failed attempts
            this.failedLoginAttempts.delete(email);

            // Create secure session
            const sessionData = await this.createSecureSession(user, rememberMe);
            
            this.currentUser = user;
            this.sessionData = sessionData;

            // Log successful authentication
            await this.auditLog('LOGIN_SUCCESS', {
                userId: user.id,
                email: user.email,
                role: user.role,
                sessionId: sessionData.sessionId
            });

            // Start session monitoring
            this.startSessionMonitoring();

            console.log(`✅ User ${user.name} authenticated successfully`);
            return {
                success: true,
                user,
                sessionData
            };

        } catch (error) {
            console.error('🔐 Authentication failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate user credentials (mock implementation)
     */
    async validateCredentials(email, password) {
        // Mock user database - in production, this would be secure backend validation
        const mockUsers = {
            'admin@constructerp.com': {
                id: 'user_001',
                name: 'John Admin',
                email: 'admin@constructerp.com',
                role: 'Administrator',
                permissions: 'full',
                passwordHash: 'mock_admin_hash', // In production: bcrypt.compare(password, hash)
                department: 'IT',
                lastLogin: null
            },
            'manager@constructerp.com': {
                id: 'user_002',
                name: 'Sarah Manager',
                email: 'manager@constructerp.com',
                role: 'Manager',
                permissions: 'limited',
                passwordHash: 'mock_manager_hash',
                department: 'Operations',
                lastLogin: null
            },
            'employee@constructerp.com': {
                id: 'user_003',
                name: 'Mike Employee',
                email: 'employee@constructerp.com',
                role: 'Employee',
                permissions: 'basic',
                passwordHash: 'mock_employee_hash',
                department: 'Construction',
                lastLogin: null
            }
        };

        const user = mockUsers[email.toLowerCase()];
        
        // In production: const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        const isValidPassword = password.length >= 4; // Mock validation
        
        if (user && isValidPassword) {
            user.lastLogin = new Date().toISOString();
            return user;
        }
        
        return null;
    }

    /**
     * Handle failed login attempts with lockout mechanism
     */
    async handleFailedLogin(email) {
        const attempts = this.failedLoginAttempts.get(email) || { count: 0, firstAttempt: Date.now() };
        attempts.count++;
        attempts.lastAttempt = Date.now();

        if (attempts.count >= this.maxFailedAttempts) {
            attempts.lockedUntil = Date.now() + this.lockoutDuration;
            
            await this.auditLog('LOGIN_LOCKOUT', {
                email,
                failedAttempts: attempts.count,
                lockedUntil: new Date(attempts.lockedUntil).toISOString()
            });
            
            console.warn(`⚠️ Account ${email} locked due to ${attempts.count} failed attempts`);
        } else {
            await this.auditLog('LOGIN_FAILED', {
                email,
                attempt: attempts.count,
                remainingAttempts: this.maxFailedAttempts - attempts.count
            });
        }

        this.failedLoginAttempts.set(email, attempts);
    }

    /**
     * Check if user account is locked out
     */
    isUserLockedOut(email) {
        const attempts = this.failedLoginAttempts.get(email);
        return attempts && attempts.lockedUntil && Date.now() < attempts.lockedUntil;
    }

    /**
     * Create secure session with enhanced security
     */
    async createSecureSession(user, rememberMe = false) {
        const sessionId = this.generateSecureSessionId();
        const now = Date.now();
        const expiresAt = now + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : this.sessionTimeout);

        const sessionData = {
            sessionId,
            userId: user.id,
            role: user.role,
            permissions: this.getRolePermissions(user.role),
            createdAt: now,
            expiresAt,
            lastActivity: now,
            rememberMe,
            ipAddress: this.getClientIP(), // In browser environment, this would be handled server-side
            userAgent: navigator.userAgent
        };

        // Store session securely (in production, use secure backend storage)
        this.storeSessionSecurely(sessionId, sessionData);

        return sessionData;
    }

    /**
     * Generate cryptographically secure session ID
     */
    generateSecureSessionId() {
        // In production, use crypto.getRandomValues() or server-side crypto
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result + Date.now().toString(36);
    }

    /**
     * Get role permissions
     */
    getRolePermissions(roleName) {
        const role = this.securityPolicies.roles[roleName];
        return role ? role.permissions : [];
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(permission, userId = null) {
        const user = userId ? this.getUserById(userId) : this.currentUser;
        if (!user) return false;

        const userPermissions = this.getRolePermissions(user.role);
        
        // Check for wildcard permissions
        if (userPermissions.includes('*') || userPermissions.includes('system:admin')) {
            return true;
        }

        return userPermissions.includes(permission);
    }

    /**
     * Check if user can access specific module
     */
    canAccessModule(moduleName, userId = null) {
        const user = userId ? this.getUserById(userId) : this.currentUser;
        if (!user) return false;

        const role = this.securityPolicies.roles[user.role];
        if (!role) return false;

        // Check for wildcard access
        if (role.modules.includes('*')) return true;

        return role.modules.includes(moduleName);
    }

    /**
     * Authorize specific action with context
     */
    async authorizeAction(action, context = {}) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            // Check session validity
            if (!this.isSessionValid()) {
                throw new Error('Session expired');
            }

            // Check basic permission
            if (!this.hasPermission(action)) {
                await this.auditLog('ACCESS_DENIED', {
                    userId: this.currentUser.id,
                    action,
                    context,
                    reason: 'insufficient_permissions'
                });
                throw new Error('Insufficient permissions');
            }

            // Additional checks for sensitive actions
            if (this.securityPolicies.sensitiveActions.includes(action)) {
                const allowed = await this.validateSensitiveAction(action, context);
                if (!allowed) {
                    await this.auditLog('SENSITIVE_ACTION_DENIED', {
                        userId: this.currentUser.id,
                        action,
                        context
                    });
                    throw new Error('Sensitive action not authorized');
                }
            }

            // Update session activity
            this.updateSessionActivity();

            await this.auditLog('ACTION_AUTHORIZED', {
                userId: this.currentUser.id,
                action,
                context
            });

            return true;

        } catch (error) {
            console.warn('🔒 Authorization failed:', error.message);
            throw error;
        }
    }

    /**
     * Validate sensitive actions with additional checks
     */
    async validateSensitiveAction(action, context) {
        // Additional validation for high-risk actions
        const userRole = this.securityPolicies.roles[this.currentUser.role];
        
        // Check role level for sensitive operations
        if (action.includes('delete') && userRole.level < 75) {
            return false;
        }

        if (action.includes('export:all') && userRole.level < 100) {
            return false;
        }

        if (action.includes('user:manage') && userRole.level < 100) {
            return false;
        }

        // Additional context-based checks
        if (context.dataType && this.isRestrictedData(context.dataType)) {
            return userRole.level >= 100;
        }

        return true;
    }

    /**
     * Check if data type is restricted
     */
    isRestrictedData(dataType) {
        const restricted = this.securityPolicies.dataClassification.restricted;
        const confidential = this.securityPolicies.dataClassification.confidential;
        
        return restricted.includes(dataType) || confidential.includes(dataType);
    }

    /**
     * Check if current session is valid
     */
    isSessionValid() {
        if (!this.sessionData) return false;
        
        const now = Date.now();
        const isExpired = now > this.sessionData.expiresAt;
        const isInactive = (now - this.sessionData.lastActivity) > this.sessionTimeout;

        return !isExpired && !isInactive;
    }

    /**
     * Update session activity timestamp
     */
    updateSessionActivity() {
        if (this.sessionData) {
            this.sessionData.lastActivity = Date.now();
        }
    }

    /**
     * Start session monitoring for security
     */
    startSessionMonitoring() {
        // Check session validity every 5 minutes
        setInterval(() => {
            if (!this.isSessionValid() && this.currentUser) {
                this.handleSessionExpiry();
            }
        }, 5 * 60 * 1000);

        // Monitor for suspicious activity
        this.monitorUserActivity();
    }

    /**
     * Handle session expiry
     */
    async handleSessionExpiry() {
        if (this.currentUser) {
            await this.auditLog('SESSION_EXPIRED', {
                userId: this.currentUser.id,
                sessionId: this.sessionData?.sessionId
            });
            
            console.log('⏱️ Session expired for user:', this.currentUser.name);
        }

        await this.logout();
    }

    /**
     * Monitor user activity for suspicious behavior
     */
    monitorUserActivity() {
        // This would implement behavioral analysis in production
        // For now, basic monitoring
        let actionCount = 0;
        const actionWindow = 60 * 1000; // 1 minute
        
        setInterval(() => {
            if (actionCount > 100) { // Suspiciously high activity
                this.auditLog('SUSPICIOUS_ACTIVITY', {
                    userId: this.currentUser?.id,
                    actionsPerMinute: actionCount,
                    timestamp: new Date().toISOString()
                });
            }
            actionCount = 0;
        }, actionWindow);
    }

    /**
     * Logout user and clean up session
     */
    async logout() {
        if (this.currentUser) {
            await this.auditLog('LOGOUT', {
                userId: this.currentUser.id,
                sessionId: this.sessionData?.sessionId,
                sessionDuration: this.sessionData ? 
                    Date.now() - this.sessionData.createdAt : 0
            });
            
            console.log(`👋 User ${this.currentUser.name} logged out`);
        }

        // Clear session data
        if (this.sessionData) {
            this.removeStoredSession(this.sessionData.sessionId);
        }

        this.currentUser = null;
        this.sessionData = null;
    }

    /**
     * Get current user info (safe for client-side)
     */
    getCurrentUser() {
        if (!this.currentUser) return null;
        
        // Return sanitized user info (no sensitive data)
        return {
            id: this.currentUser.id,
            name: this.currentUser.name,
            email: this.currentUser.email,
            role: this.currentUser.role,
            permissions: this.getRolePermissions(this.currentUser.role),
            sessionValid: this.isSessionValid()
        };
    }

    /**
     * Store session securely (mock - use secure backend in production)
     */
    storeSessionSecurely(sessionId, sessionData) {
        // In production: store in secure database with encryption
        sessionStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
    }

    /**
     * Remove stored session
     */
    removeStoredSession(sessionId) {
        sessionStorage.removeItem(`session_${sessionId}`);
    }

    /**
     * Get client IP (mock - handled server-side in production)
     */
    getClientIP() {
        return '127.0.0.1'; // Mock IP
    }

    /**
     * Get user by ID (mock implementation)
     */
    getUserById(userId) {
        if (this.currentUser && this.currentUser.id === userId) {
            return this.currentUser;
        }
        return null; // In production, query from secure database
    }

    /**
     * Audit logging integration
     * This will be enhanced when we implement the AuditLogger
     */
    async auditLog(eventType, details) {
        // For now, console logging - will integrate with AuditLogger
        console.log(`🔍 AUDIT [${eventType}]:`, {
            timestamp: new Date().toISOString(),
            userId: this.currentUser?.id,
            sessionId: this.sessionData?.sessionId,
            ...details
        });
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SecurityManager = SecurityManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}

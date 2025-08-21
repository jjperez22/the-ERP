import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Mock user data (in a real app, this would be from a database)
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

// Pre-created users for testing
const users: User[] = [
  {
    id: '1',
    email: 'admin@construction-erp.com',
    password: bcrypt.hashSync('admin123', 10), // Hashed version of 'admin123'
    name: 'Administrator',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    email: 'manager@construction-erp.com',
    password: bcrypt.hashSync('manager123', 10), // Hashed version of 'manager123'
    name: 'Project Manager',
    role: 'manager',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    email: 'user@construction-erp.com',
    password: bcrypt.hashSync('user123', 10), // Hashed version of 'user123'
    name: 'Regular User',
    role: 'user',
    isActive: true,
    createdAt: new Date('2024-01-01')
  }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@construction-erp.com
 *         password:
 *           type: string
 *           format: password
 *           example: admin123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT access token
 *             user:
 *               $ref: '#/components/schemas/UserProfile'
 *             expiresIn:
 *               type: string
 *               example: "24h"
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, manager, user]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         lastLogin:
 *           type: string
 *           format: date-time
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, manager, user]
 *           default: user
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid email or password
 *                 code:
 *                   type: string
 *                   example: AUTH_INVALID_CREDENTIALS
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'AUTH_MISSING_CREDENTIALS'
      });
    }

    // Find user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'AUTH_INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
        code: 'AUTH_ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'AUTH_INVALID_CREDENTIALS'
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Return success response
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login',
      code: 'AUTH_LOGIN_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid input or email already exists
 *       401:
 *         description: Authentication required (admin only)
 */
router.post('/register', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only admins can register new users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can register new users',
        code: 'AUTH_ADMIN_REQUIRED'
      });
    }

    const { email, password, name, role = 'user' } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
        code: 'VALIDATION_PASSWORD_TOO_SHORT'
      });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
        code: 'AUTH_EMAIL_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: User = {
      id: (users.length + 1).toString(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: role as 'admin' | 'manager' | 'user',
      isActive: true,
      createdAt: new Date()
    };

    users.push(newUser);

    // Return user profile (without password)
    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration',
      code: 'AUTH_REGISTRATION_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Authentication required
 */
router.get('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = users.find(u => u.id === req.user?.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     expiresIn:
 *                       type: string
 *       401:
 *         description: Authentication required
 */
router.post('/refresh', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = users.find(u => u.id === req.user?.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Generate new token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

export default router;

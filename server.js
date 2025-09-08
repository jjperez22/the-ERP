const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Environment configuration
const JWT_SECRET = process.env.JWT_SECRET || 'construction-erp-secret-key-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'construction-erp-refresh-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
        error: 'Too many authentication attempts from this IP, please try again later.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// File upload configuration
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/json' || file.mimetype === 'text/xml') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV, JSON, and XML files are allowed.'));
        }
    }
});

// In-memory data store (in production, this would be a database)
let appData = {
    users: [
        {
            id: 'user-001',
            email: 'admin@constructerp.com',
            password: '$2a$10$8K1p/a0dClulGk0g7n9ZJeL4dDrBuNVQ8lYvRLSV3tLZUr2XvUq6q', // 'admin123'
            name: 'John Admin',
            role: 'administrator',
            permissions: ['read', 'write', 'delete', 'admin'],
            companyId: 'company-001',
            createdAt: new Date('2024-01-01'),
            lastLogin: null,
            isActive: true
        },
        {
            id: 'user-002',
            email: 'manager@constructerp.com',
            password: '$2a$10$8K1p/a0dClulGk0g7n9ZJeL4dDrBuNVQ8lYvRLSV3tLZUr2XvUq6q', // 'manager123'
            name: 'Sarah Manager',
            role: 'manager',
            permissions: ['read', 'write'],
            companyId: 'company-001',
            createdAt: new Date('2024-01-01'),
            lastLogin: null,
            isActive: true
        }
    ],
    refreshTokens: [], // Store refresh tokens
    products: [
        {
            "id": "P001",
            "sku": "LUM-2x4-001",
            "name": "2x4 Lumber - 8ft",
            "category": "Lumber",
            "price": 4.99,
            "cost": 3.24,
            "stock": 450,
            "reorderPoint": 100,
            "supplier": "Northwest Lumber Co",
            "location": "Warehouse A",
            "createdAt": new Date('2024-01-01'),
            "updatedAt": new Date('2024-01-01')
        },
        {
            "id": "P002",
            "sku": "CON-BAG-002",
            "name": "Portland Cement - 94lb Bag",
            "category": "Concrete",
            "price": 8.49,
            "cost": 5.99,
            "stock": 89,
            "reorderPoint": 150,
            "supplier": "Cement Supply Inc",
            "location": "Warehouse B",
            "createdAt": new Date('2024-01-01'),
            "updatedAt": new Date('2024-01-01')
        }
    ],
    customers: [
        {
            "id": "C001",
            "name": "ABC Construction Co",
            "type": "General Contractor",
            "revenue": 245000,
            "orders": 23,
            "status": "Active",
            "paymentTerms": "Net 30",
            "churnRisk": "Low",
            "lastOrder": "2024-08-10",
            "email": "contact@abcconstruction.com",
            "phone": "(555) 123-4567",
            "address": "123 Construction Way, Phoenix, AZ 85001",
            "createdAt": new Date('2024-01-01'),
            "updatedAt": new Date('2024-01-01')
        }
    ],
    orders: [
        {
            "id": "ORD001",
            "customer": "ABC Construction Co",
            "customerId": "C001",
            "date": "2024-08-10",
            "total": 4567.89,
            "status": "Shipped",
            "items": [
                { "productId": "P001", "quantity": 100, "unitPrice": 4.99, "total": 499.00 },
                { "productId": "P002", "quantity": 50, "unitPrice": 8.49, "total": 424.50 }
            ],
            "createdAt": new Date('2024-08-10'),
            "updatedAt": new Date('2024-08-10')
        }
    ],
    employees: [
        {
            "id": "EMP001",
            "employeeNumber": "E2024001",
            "firstName": "John",
            "lastName": "Smith",
            "fullName": "John Smith",
            "department": "Construction",
            "position": "Project Manager",
            "email": "john.smith@constructerp.com",
            "phone": "(555) 123-4567",
            "status": "Active",
            "hireDate": "2022-03-15",
            "salary": 85000,
            "payType": "Salary",
            "manager": "Sarah Johnson",
            "location": "Phoenix Office",
            "emergencyContact": "Jane Smith - (555) 987-6543",
            "skills": ["Project Management", "Construction", "Safety"],
            "performanceRating": 4.5,
            "createdAt": new Date('2022-03-15'),
            "updatedAt": new Date('2024-01-01')
        }
    ],
    integrations: {
        accounting: {
            quickbooks: {
                enabled: false,
                clientId: null,
                clientSecret: null,
                accessToken: null,
                refreshToken: null,
                companyId: null,
                lastSync: null
            },
            xero: {
                enabled: false,
                clientId: null,
                clientSecret: null,
                accessToken: null,
                refreshToken: null,
                tenantId: null,
                lastSync: null
            }
        },
        crm: {
            salesforce: {
                enabled: false,
                clientId: null,
                clientSecret: null,
                accessToken: null,
                refreshToken: null,
                instanceUrl: null,
                lastSync: null
            },
            hubspot: {
                enabled: false,
                apiKey: null,
                accessToken: null,
                refreshToken: null,
                lastSync: null
            }
        },
        ecommerce: {
            shopify: {
                enabled: false,
                shopDomain: null,
                accessToken: null,
                apiKey: null,
                apiSecret: null,
                lastSync: null
            },
            woocommerce: {
                enabled: false,
                siteUrl: null,
                consumerKey: null,
                consumerSecret: null,
                lastSync: null
            }
        }
    },
    webhooks: [],
    apiKeys: [],
    auditLog: []
};

// Helper functions
const generateId = (prefix = '') => `${prefix}${uuidv4()}`;

const logAuditEvent = (userId, action, resource, resourceId, details = {}) => {
    appData.auditLog.unshift({
        id: generateId('audit-'),
        userId,
        action,
        resource,
        resourceId,
        details,
        timestamp: new Date(),
        ip: null // Would be filled from request in real implementation
    });
    
    // Keep only last 1000 audit entries
    if (appData.auditLog.length > 1000) {
        appData.auditLog = appData.auditLog.slice(0, 1000);
    }
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Access token required',
            code: 'MISSING_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = appData.users.find(u => u.id === decoded.userId && u.isActive);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

// Permission middleware
const requirePermissions = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const hasPermission = permissions.some(permission => 
            req.user.permissions.includes(permission) || req.user.permissions.includes('admin')
        );

        if (!hasPermission) {
            return res.status(403).json({ 
                success: false, 
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS',
                required: permissions,
                current: req.user.permissions
            });
        }

        next();
    };
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Static file serving for the main app
app.use(express.static('.', {
    index: 'index.html',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Import route modules
require('./routes/auth')(app, { appData, JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, bcrypt, jwt, logAuditEvent, generateId });
require('./routes/products')(app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId });
require('./routes/customers')(app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId });
require('./routes/orders')(app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId });
require('./routes/employees')(app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId });
require('./routes/integrations')(app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId });
require('./routes/import-export')(app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId, upload, csv, createCsvWriter, fs, path });
require('./routes/webhooks')(app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId });

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.',
                code: 'FILE_TOO_LARGE'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum is 1 file per upload.',
                code: 'TOO_MANY_FILES'
            });
        }
    }

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        code: 'NOT_FOUND',
        path: req.path,
        method: req.method
    });
});

// Catch-all handler for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Construction ERP API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: Helmet enabled, CORS configured, Rate limiting active`);
    console.log(`📁 Static files served from: ${__dirname}`);
});

module.exports = app;

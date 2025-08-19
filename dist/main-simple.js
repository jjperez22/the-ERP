"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Simple AI-Powered Construction ERP - Express.js Version
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv.config();
class ConstructionERPApp {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '3000');
        this.initializeApplication();
    }
    initializeApplication() {
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)());
        // CORS
        this.app.use((0, cors_1.default)({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true
        }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Logging
        this.app.use((0, morgan_1.default)('combined'));
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Static files
        this.app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
    }
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                services: {
                    api: 'active',
                    database: 'simulated',
                    ai: 'simulated'
                },
                performance: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    pid: process.pid
                }
            };
            res.json(health);
        });
        // API Status
        this.app.get('/api/status', (req, res) => {
            res.json({
                success: true,
                message: 'AI-Powered Construction ERP API is running',
                features: [
                    '🏗️ Construction Project Management',
                    '📊 Supply Chain Optimization',
                    '🗣️ Voice AI Integration',
                    '🔧 Predictive Maintenance',
                    '🔐 Advanced Security & Fraud Detection',
                    '🤖 AI-Powered Analytics'
                ],
                endpoints: {
                    health: '/health',
                    products: '/api/products',
                    inventory: '/api/inventory',
                    customers: '/api/customers',
                    orders: '/api/orders',
                    projects: '/api/projects',
                    ai_insights: '/api/ai/insights',
                    voice_ai: '/api/voice',
                    maintenance: '/api/maintenance',
                    security: '/api/security'
                }
            });
        });
        // Simulated API endpoints for demonstration
        this.app.get('/api/products', (req, res) => {
            res.json({
                success: true,
                data: [
                    {
                        id: '1',
                        name: 'Steel Rebar 12mm',
                        category: 'Materials',
                        price: 150.00,
                        unit: 'ton',
                        description: 'High-grade steel rebar for construction'
                    },
                    {
                        id: '2',
                        name: 'Portland Cement',
                        category: 'Materials',
                        price: 8.50,
                        unit: 'bag',
                        description: 'Type I Portland cement, 50kg bags'
                    }
                ],
                total: 2
            });
        });
        this.app.get('/api/inventory', (req, res) => {
            res.json({
                success: true,
                data: [
                    {
                        id: '1',
                        productId: '1',
                        productName: 'Steel Rebar 12mm',
                        quantity: 250,
                        minimumStock: 50,
                        location: 'Warehouse A',
                        status: 'in_stock'
                    },
                    {
                        id: '2',
                        productId: '2',
                        productName: 'Portland Cement',
                        quantity: 25,
                        minimumStock: 100,
                        location: 'Warehouse B',
                        status: 'low_stock'
                    }
                ],
                analytics: {
                    totalValue: 38750.00,
                    lowStockItems: 1,
                    outOfStock: 0
                }
            });
        });
        this.app.get('/api/ai/insights', (req, res) => {
            res.json({
                success: true,
                insights: [
                    {
                        id: '1',
                        title: '📊 Inventory Alert',
                        description: 'Portland Cement is running low - recommend reorder',
                        type: 'inventory_alert',
                        severity: 'medium',
                        recommendations: [
                            'Order 200 bags of Portland Cement',
                            'Consider bulk discount options',
                            'Review seasonal demand patterns'
                        ],
                        confidence: 0.89,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: '2',
                        title: '💰 Cost Optimization',
                        description: 'Steel prices expected to drop 8% next month',
                        type: 'cost_optimization',
                        severity: 'low',
                        recommendations: [
                            'Delay non-critical steel purchases',
                            'Lock in current cement prices',
                            'Review supplier contracts'
                        ],
                        confidence: 0.76,
                        created_at: new Date().toISOString()
                    }
                ],
                summary: {
                    totalInsights: 2,
                    criticalAlerts: 0,
                    potentialSavings: 15200
                }
            });
        });
        this.app.get('/api/projects', (req, res) => {
            res.json({
                success: true,
                data: [
                    {
                        id: '1',
                        name: 'Downtown Office Complex',
                        status: 'in_progress',
                        completion: 65,
                        budget: 2500000,
                        spent: 1625000,
                        startDate: '2024-01-15',
                        expectedCompletion: '2024-08-30'
                    },
                    {
                        id: '2',
                        name: 'Residential Tower Phase 1',
                        status: 'planning',
                        completion: 15,
                        budget: 4200000,
                        spent: 630000,
                        startDate: '2024-03-01',
                        expectedCompletion: '2025-02-15'
                    }
                ]
            });
        });
        // Voice AI simulation
        this.app.post('/api/voice/command', (req, res) => {
            const { command } = req.body;
            res.json({
                success: true,
                command: command || 'show inventory status',
                response: {
                    text: 'Here is your current inventory status: You have 250 tons of steel rebar in stock, and Portland Cement is running low with only 25 bags remaining.',
                    audioUrl: '/audio/response.mp3', // Simulated
                    actions: [
                        'Display inventory dashboard',
                        'Create reorder alert for cement'
                    ]
                },
                processed_at: new Date().toISOString()
            });
        });
        // Maintenance predictions
        this.app.get('/api/maintenance/predictions', (req, res) => {
            res.json({
                success: true,
                predictions: [
                    {
                        equipmentId: 'EQ001',
                        equipmentName: 'Tower Crane #1',
                        healthScore: 0.78,
                        riskLevel: 'medium',
                        predictedFailureDate: '2024-09-15',
                        recommendations: [
                            'Schedule hydraulic system inspection',
                            'Replace worn cables within 30 days',
                            'Calibrate load sensors'
                        ]
                    },
                    {
                        equipmentId: 'EQ002',
                        equipmentName: 'Concrete Mixer #2',
                        healthScore: 0.92,
                        riskLevel: 'low',
                        predictedFailureDate: '2025-01-20',
                        recommendations: [
                            'Continue regular maintenance schedule',
                            'Monitor drum bearings'
                        ]
                    }
                ]
            });
        });
        // Security alerts
        this.app.get('/api/security/alerts', (req, res) => {
            res.json({
                success: true,
                alerts: [
                    {
                        id: 'SEC001',
                        type: 'unusual_activity',
                        severity: 'low',
                        title: 'Unusual Login Pattern Detected',
                        description: 'User admin@company.com logged in from new location',
                        timestamp: new Date().toISOString(),
                        resolved: false
                    }
                ],
                riskScore: 0.23,
                systemHealth: 'secure'
            });
        });
        // Customers API
        this.app.get('/api/customers', (req, res) => {
            res.json({
                success: true,
                data: [
                    {
                        id: '1',
                        name: 'ABC Construction Ltd.',
                        type: 'general_contractor',
                        projects: ['Downtown Office Complex'],
                        contact: {
                            email: 'contact@abcconstruction.com',
                            phone: '+1-555-0123',
                            address: '123 Main St, City, State 12345'
                        },
                        status: 'active',
                        totalValue: 2500000
                    },
                    {
                        id: '2',
                        name: 'MegaBuild Corp',
                        type: 'residential_developer',
                        projects: ['Residential Tower Phase 1'],
                        contact: {
                            email: 'info@megabuild.com',
                            phone: '+1-555-0456',
                            address: '456 Business Ave, City, State 12345'
                        },
                        status: 'active',
                        totalValue: 4200000
                    }
                ],
                total: 2,
                analytics: {
                    totalRevenue: 6700000,
                    activeCustomers: 2,
                    avgProjectValue: 3350000
                }
            });
        });
        // Orders API
        this.app.get('/api/orders', (req, res) => {
            res.json({
                success: true,
                data: [
                    {
                        id: 'ORD001',
                        customerId: '1',
                        customerName: 'ABC Construction Ltd.',
                        items: [
                            { productId: '1', productName: 'Steel Rebar 12mm', quantity: 50, unitPrice: 150 },
                            { productId: '2', productName: 'Portland Cement', quantity: 200, unitPrice: 8.5 }
                        ],
                        totalAmount: 9200,
                        status: 'pending',
                        orderDate: '2024-08-15',
                        deliveryDate: '2024-08-25'
                    },
                    {
                        id: 'ORD002',
                        customerId: '2',
                        customerName: 'MegaBuild Corp',
                        items: [
                            { productId: '1', productName: 'Steel Rebar 12mm', quantity: 100, unitPrice: 150 }
                        ],
                        totalAmount: 15000,
                        status: 'completed',
                        orderDate: '2024-08-10',
                        deliveryDate: '2024-08-20'
                    }
                ],
                total: 2,
                analytics: {
                    totalRevenue: 24200,
                    pendingOrders: 1,
                    completedOrders: 1
                }
            });
        });
        // API 404 handler for unmatched /api routes
        this.app.get('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Not Found',
                message: `API endpoint '${req.path}' not found`
            });
        });
        // Root route
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: '🏗️ AI-Powered Construction ERP API',
                version: '1.0.0',
                documentation: {
                    health: '/health',
                    status: '/api/status',
                    endpoints: [
                        '/api/products',
                        '/api/inventory',
                        '/api/customers',
                        '/api/orders',
                        '/api/projects',
                        '/api/ai/insights',
                        '/api/voice/command',
                        '/api/maintenance/predictions',
                        '/api/security/alerts'
                    ]
                },
                features: [
                    '🏗️ Construction Project Management',
                    '📊 Supply Chain Optimization',
                    '🗣️ Voice AI Integration',
                    '🔧 Predictive Maintenance',
                    '🔐 Advanced Security & Fraud Detection',
                    '🤖 AI-Powered Analytics'
                ]
            });
        });
        // Catch-all 404 for non-API routes
        this.app.get('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Not Found',
                message: 'Page not found. This is an API server. Visit / for documentation.'
            });
        });
        // Error handling
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });
    }
    start() {
        this.app.listen(this.port, () => {
            console.log('🏗️  AI-POWERED CONSTRUCTION ERP');
            console.log('=====================================');
            console.log(`🚀 Server running on http://localhost:${this.port}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('');
            console.log('📋 Available Endpoints:');
            console.log(`   Health Check:    http://localhost:${this.port}/health`);
            console.log(`   API Status:      http://localhost:${this.port}/api/status`);
            console.log(`   AI Insights:     http://localhost:${this.port}/api/ai/insights`);
            console.log(`   Products:        http://localhost:${this.port}/api/products`);
            console.log(`   Inventory:       http://localhost:${this.port}/api/inventory`);
            console.log(`   Projects:        http://localhost:${this.port}/api/projects`);
            console.log(`   Voice AI:        http://localhost:${this.port}/api/voice/command`);
            console.log(`   Maintenance:     http://localhost:${this.port}/api/maintenance/predictions`);
            console.log(`   Security:        http://localhost:${this.port}/api/security/alerts`);
            console.log('');
            console.log('🤖 AI Features:');
            console.log('   ✅ Supply Chain Optimization');
            console.log('   ✅ Voice AI Integration');
            console.log('   ✅ Predictive Maintenance');
            console.log('   ✅ Advanced Security & Fraud Detection');
            console.log('=====================================');
        });
    }
}
// Start the application
const app = new ConstructionERPApp();
app.start();

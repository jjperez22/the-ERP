// main.ts - AI-Powered Construction ERP Application Entry Point
import express from 'express';
import { createServer, Server } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import dotenv from 'dotenv';

// Import API routes
import productRoutes from './api/routes/products';
import authRoutes from './api/routes/auth';
import projectRoutes from './api/routes/projects';
import inventoryRoutes from './api/routes/inventory';
import customerRoutes from './api/routes/customers';
import orderRoutes from './api/routes/orders';

// Import Swagger setup
import { setupSwagger } from './api/docs/swagger';

// Import existing controllers for backward compatibility
import { ProductController } from './controllers/ProductController';
import { AnalyticsController } from './controllers/AnalyticsController';
import { AIService } from './services/AIService';
import { AdvancedConstructionAI } from './services/AdvancedAI';

// Load environment variables
dotenv.config();

class ConstructionERPApplication {
  private app: express.Application;
  private server: Server;
  private port: number;
  private productController: ProductController;
  private analyticsController: AnalyticsController;
  private aiService: AIService;
  private advancedAI: AdvancedConstructionAI;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    
    // Initialize services and controllers
    this.aiService = new AIService();
    this.advancedAI = new AdvancedConstructionAI();
    this.productController = new ProductController();
    this.analyticsController = new AnalyticsController();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.server = createServer(this.app);
  }

  private setupMiddleware() {
    // Security and performance middleware
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Setup Swagger documentation
    setupSwagger(this.app as any);
    
    // Mount RESTful API routes
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/inventory', inventoryRoutes);
    this.app.use('/api/customers', customerRoutes);
    this.app.use('/api/orders', orderRoutes);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const advancedAIHealth = this.advancedAI.getHealthStatus();
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          server: 'active',
          database: 'ready',
          basicAI: 'ready',
          advancedAI: advancedAIHealth.status
        },
        performance: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        },
        aiFeatures: {
          basic: ['Inventory Recommendations', 'Demand Forecasting', 'Price Suggestions'],
          advanced: advancedAIHealth.features
        }
      };
      res.json(health);
    });

    // Analytics routes
    this.app.get('/api/analytics/dashboard', async (req, res) => {
      try {
        const data = await this.analyticsController.getDashboardData();
        res.json({ success: true, data });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.get('/api/analytics/sales', async (req, res) => {
      try {
        const data = await this.analyticsController.getSalesPerformance();
        res.json({ success: true, data });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // AI routes
    this.app.get('/api/ai/insights', async (req, res) => {
      try {
        const insights = await this.aiService.generateInventoryRecommendations('all');
        res.json({ success: true, data: insights });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/api/ai/demand-forecast/:productId', async (req, res) => {
      try {
        const { productId } = req.params;
        const { horizon } = req.body;
        const forecast = await this.aiService.generateDemandForecast(productId, horizon);
        res.json({ success: true, data: forecast });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/api/ai/price-suggestion', async (req, res) => {
      try {
        const suggestedPrice = await this.aiService.suggestPrice(req.body);
        res.json({ success: true, data: { suggestedPrice } });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Advanced AI routes
    this.app.get('/api/ai/advanced/health', async (req, res) => {
      try {
        const healthStatus = this.advancedAI.getHealthStatus();
        res.json({ success: true, data: healthStatus });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/api/ai/advanced/seasonal-forecast', async (req, res): Promise<void> => {
      try {
        const { category, weatherData, economicIndicators, parameters } = req.body;
        
        if (!category || !weatherData || !economicIndicators) {
          res.status(400).json({
            success: false,
            error: 'Missing required fields: category, weatherData, economicIndicators'
          });
          return;
        }
        
        const forecast = await this.advancedAI.generateSeasonalDemandForecast(
          category,
          weatherData,
          economicIndicators,
          parameters
        );
        res.json({ success: true, data: forecast });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: (error as Error).message,
          code: 'SEASONAL_FORECAST_ERROR'
        });
      }
    });

    this.app.post('/api/ai/advanced/dynamic-pricing', async (req, res): Promise<void> => {
      try {
        const { productId, marketConditions } = req.body;
        
        if (!productId || !marketConditions) {
          res.status(400).json({
            success: false,
            error: 'Missing required fields: productId, marketConditions'
          });
          return;
        }
        
        const analysis = await this.advancedAI.analyzeDynamicPricing(productId, marketConditions);
        res.json({ success: true, data: analysis });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: (error as Error).message,
          code: 'DYNAMIC_PRICING_ERROR'
        });
      }
    });

    this.app.post('/api/ai/advanced/supplier-risk', async (req, res): Promise<void> => {
      try {
        const { supplierId, includeAlternatives = true } = req.body;
        
        if (!supplierId) {
          res.status(400).json({
            success: false,
            error: 'Missing required field: supplierId'
          });
          return;
        }
        
        const assessment = await this.advancedAI.assessSupplierRisk(supplierId, includeAlternatives);
        res.json({ success: true, data: assessment });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: (error as Error).message,
          code: 'SUPPLIER_RISK_ERROR'
        });
      }
    });

    // Default route with API documentation
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Construction ERP System',
        version: '2.0.0',
        description: 'AI-Powered Construction Materials Management',
        status: 'running',
        framework: 'Express.js',
        documentation: '/api-docs',
        endpoints: {
          health: '/health',
          auth: {
            login: 'POST /api/auth/login',
            register: 'POST /api/auth/register',
            profile: 'GET /api/auth/profile',
            refresh: 'POST /api/auth/refresh'
          },
          products: {
            list: 'GET /api/products',
            get: 'GET /api/products/:id',
            create: 'POST /api/products',
            update: 'PUT /api/products/:id',
            delete: 'DELETE /api/products/:id'
          },
          projects: {
            list: 'GET /api/projects',
            get: 'GET /api/projects/:id',
            create: 'POST /api/projects',
            update: 'PUT /api/projects/:id',
            delete: 'DELETE /api/projects/:id'
          },
          analytics: {
            dashboard: 'GET /api/analytics/dashboard',
            sales: 'GET /api/analytics/sales'
          },
          ai: {
            insights: 'GET /api/ai/insights',
            forecast: 'POST /api/ai/demand-forecast/:productId',
            pricing: 'POST /api/ai/price-suggestion'
          },
          advancedAI: {
            health: 'GET /api/ai/advanced/health',
            seasonalForecast: 'POST /api/ai/advanced/seasonal-forecast',
            dynamicPricing: 'POST /api/ai/advanced/dynamic-pricing',
            supplierRisk: 'POST /api/ai/advanced/supplier-risk'
          }
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /api-docs',
          'GET /api/products',
          'GET /api/projects',
          'POST /api/auth/login',
          'GET /api/analytics/dashboard',
          'GET /api/ai/insights',
          'GET /api/ai/advanced/health',
          'POST /api/ai/advanced/seasonal-forecast',
          'POST /api/ai/advanced/dynamic-pricing',
          'POST /api/ai/advanced/supplier-risk'
        ]
      });
    });

    // Global error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });
  }

  public start(): void {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log('🚀 Construction ERP System - RESTful API with Advanced AI');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🌐 Server: http://localhost:${this.port}`);
      console.log(`📚 API Docs: http://localhost:${this.port}/api-docs`);
      console.log(`🔐 Auth API: http://localhost:${this.port}/api/auth/login`);
      console.log(`📦 Products API: http://localhost:${this.port}/api/products`);
      console.log(`🏗️ Projects API: http://localhost:${this.port}/api/projects`);
      console.log(`📊 Health: http://localhost:${this.port}/health`);
      console.log(`📈 Analytics: http://localhost:${this.port}/api/analytics/dashboard`);
      console.log(`🧠 Basic AI: http://localhost:${this.port}/api/ai/insights`);
      console.log(`🤖 Advanced AI: http://localhost:${this.port}/api/ai/advanced/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ RESTful API with Advanced AI Integration - Ready!');
      console.log('🎯 Advanced AI Features:');
      const aiHealth = this.advancedAI.getHealthStatus();
      aiHealth.features.forEach(feature => console.log(`   • ${feature}`));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private shutdown(): void {
    console.log('\n🛑 Shutting down Construction ERP System...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ Express.js server closed gracefully');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Start the application
const app = new ConstructionERPApplication();
app.start();

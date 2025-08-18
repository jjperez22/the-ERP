
// main.ts - AI-Powered Construction ERP Application Entry Point
import { Warp } from '@varld/warp';
import { createServer } from 'http';
import express from 'express';
import path from 'path';

// Controllers
import { ProductController } from './controllers/ProductController';
import { InventoryController } from './controllers/InventoryController';
import { CustomerController } from './controllers/CustomerController';
import { OrderController } from './controllers/OrderController';
import { PurchaseController } from './controllers/PurchaseController';
import { ProjectController } from './controllers/ProjectController';
import { AIInsightController } from './controllers/AIInsightController';
import { AnalyticsController } from './controllers/AnalyticsController';
import { SupplyChainController } from './controllers/SupplyChainController';
import { VoiceAIController } from './controllers/VoiceAIController';

// Services
import { DatabaseService } from './services/DatabaseService';
import { AIService } from './services/AIService';
import { NotificationService } from './services/NotificationService';
import { AIOrchestrator } from './src/services/AIOrchestrator';
import { RealTimeService } from './src/services/RealTimeService';
import { AutomationService } from './src/services/AutomationService';
import { ConstructionAIService } from './src/services/ConstructionAIService';

class ConstructionERPApplication {
  private app: Warp;
  private httpServer: any;
  private aiOrchestrator: AIOrchestrator;
  private realTimeService: RealTimeService;
  private automationService: AutomationService;
  private constructionAI: ConstructionAIService;

  constructor() {
    this.initializeApplication();
  }

  private initializeApplication() {
    // Create Warp application
    this.app = new Warp({
      cors: true,
      port: process.env.PORT || 3000
    });

    // Create HTTP server for WebSocket support
    const expressApp = express();
    expressApp.use(express.static(path.join(__dirname, '../public')));
    this.httpServer = createServer(expressApp);

    // Initialize AI services
    this.aiOrchestrator = new AIOrchestrator();
    this.constructionAI = new ConstructionAIService();
    this.realTimeService = new RealTimeService(this.aiOrchestrator, this.httpServer);
    this.automationService = new AutomationService(this.aiOrchestrator, this.realTimeService);

    this.setupServices();
    this.setupControllers();
    this.setupEventHandlers();
    this.setupHealthChecks();
  }

  private setupServices() {
    // Register core services
    this.app.register('database', DatabaseService);
    this.app.register('ai', AIService);
    this.app.register('notifications', NotificationService);
    
    // Register advanced AI services
    this.app.register('aiOrchestrator', () => this.aiOrchestrator);
    this.app.register('constructionAI', () => this.constructionAI);
    this.app.register('realTimeService', () => this.realTimeService);
    this.app.register('automationService', () => this.automationService);
  }

  private setupControllers() {
    // Register all controllers
    this.app.controller(ProductController);
    this.app.controller(InventoryController);
    this.app.controller(CustomerController);
    this.app.controller(OrderController);
    this.app.controller(PurchaseController);
    this.app.controller(ProjectController);
    this.app.controller(AIInsightController);
    this.app.controller(AnalyticsController);
    this.app.controller(SupplyChainController);
    this.app.controller(VoiceAIController);
  }

  private setupEventHandlers() {
    // Cross-service event handling
    this.realTimeService.on('event_broadcasted', (event) => {
      console.log(`📡 Real-time event: ${event.type}`, event.data);
    });

    this.automationService.on('workflow_executed', (execution) => {
      console.log(`🔄 Workflow executed: ${execution.workflowId}`);
      this.realTimeService.broadcastEvent({
        type: 'system_notification',
        data: {
          title: 'Automation Executed',
          message: `Workflow ${execution.workflowId} completed successfully`,
          category: 'automation'
        },
        timestamp: new Date(),
        priority: 'low'
      });
    });

    this.automationService.on('workflow_error', (error) => {
      console.error(`❌ Workflow error: ${error.workflowId}`, error.error);
      this.realTimeService.broadcastEvent({
        type: 'alert',
        data: {
          title: 'Automation Error',
          message: `Workflow ${error.workflowId} failed: ${error.error}`,
          severity: 'warning',
          category: 'automation'
        },
        timestamp: new Date(),
        priority: 'high'
      });
    });
  }

  private setupHealthChecks() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          realTime: {
            status: 'active',
            connections: this.realTimeService.getConnectedClientsCount()
          },
          automation: {
            status: 'active',
            ...this.automationService.getWorkflowStats()
          },
          ai: {
            status: 'active',
            orchestrator: 'running',
            constructionAI: 'running'
          }
        },
        performance: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };

      res.json(health);
    });

    // AI insights endpoint
    this.app.get('/api/ai/comprehensive-insights', async (req, res) => {
      try {
        const context = {
          userRole: req.query.role as string || 'user',
          companySize: req.query.size as 'small' | 'midsize' | 'enterprise' || 'midsize',
          industry: 'construction' as const,
          preferences: req.query.preferences ? JSON.parse(req.query.preferences as string) : {}
        };

        const insights = await this.aiOrchestrator.generateComprehensiveInsights(context);
        res.json({ success: true, insights });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Construction-specific AI endpoints
    this.app.post('/api/ai/smart-pricing', async (req, res) => {
      try {
        const { productIds } = req.body;
        const recommendations = await this.constructionAI.generateSmartPricingRecommendations(productIds);
        res.json({ success: true, recommendations });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/ai/seasonal-forecast', async (req, res) => {
      try {
        const { category, horizon } = req.body;
        const forecast = await this.constructionAI.generateSeasonalDemandForecast(category, horizon);
        res.json({ success: true, forecast });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/ai/supplier-risk', async (req, res) => {
      try {
        const { supplierId } = req.body;
        const analysis = await this.constructionAI.analyzeSupplierRisk(supplierId);
        res.json({ success: true, analysis });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Automation management endpoints
    this.app.get('/api/automation/workflows', async (req, res) => {
      const workflows = this.automationService.getWorkflows();
      res.json({ success: true, workflows });
    });

    this.app.post('/api/automation/workflows/:id/toggle', async (req, res) => {
      const { id } = req.params;
      const isActive = this.automationService.toggleWorkflow(id);
      res.json({ success: true, workflowId: id, isActive });
    });
  }

  public async start() {
    try {
      console.log('🚀 Starting AI-Powered Construction ERP System...');
      
      // Start the HTTP server for WebSockets
      const port = process.env.PORT || 3000;
      this.httpServer.listen(port, () => {
        console.log(`📡 WebSocket server running on port ${port}`);
      });

      // Start the Warp application
      await this.app.start();
      
      console.log('✅ Construction ERP System started successfully!');
      console.log('🧠 AI Orchestrator: Active');
      console.log('📊 Real-time Service: Active');
      console.log('🔄 Automation Service: Active');
      console.log('🏗️  Construction AI: Active');
      console.log('');
      console.log('🌐 Dashboard: http://localhost:3000');
      console.log('📈 Health Check: http://localhost:3000/health');
      console.log('🧠 AI Insights: http://localhost:3000/api/ai/comprehensive-insights');
      
    } catch (error) {
      console.error('❌ Failed to start Construction ERP System:', error);
      process.exit(1);
    }
  }

  public async shutdown() {
    console.log('🛑 Shutting down Construction ERP System...');
    
    try {
      if (this.httpServer) {
        this.httpServer.close();
      }
      
      // Clean shutdown of services
      // Add cleanup logic here
      
      console.log('✅ Construction ERP System shut down successfully');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

// Application entry point
const erpApp = new ConstructionERPApplication();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await erpApp.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await erpApp.shutdown();
  process.exit(0);
});

// Start the application
erpApp.start().catch((error) => {
  console.error('💥 Fatal error starting application:', error);
  process.exit(1);
});

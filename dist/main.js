"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const warp_1 = require("@varld/warp");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const ProductController_1 = require("./controllers/ProductController");
const InventoryController_1 = require("./controllers/InventoryController");
const CustomerController_1 = require("./controllers/CustomerController");
const OrderController_1 = require("./controllers/OrderController");
const PurchaseController_1 = require("./controllers/PurchaseController");
const ProjectController_1 = require("./controllers/ProjectController");
const AIInsightController_1 = require("./controllers/AIInsightController");
const AnalyticsController_1 = require("./controllers/AnalyticsController");
const SupplyChainController_1 = require("./controllers/SupplyChainController");
const VoiceAIController_1 = require("./controllers/VoiceAIController");
const PredictiveMaintenanceController_1 = require("./src/controllers/PredictiveMaintenanceController");
const DatabaseService_1 = require("./services/DatabaseService");
const AIService_1 = require("./services/AIService");
const NotificationService_1 = require("./services/NotificationService");
const AIOrchestrator_1 = require("./src/services/AIOrchestrator");
const RealTimeService_1 = require("./src/services/RealTimeService");
const AutomationService_1 = require("./src/services/AutomationService");
const ConstructionAIService_1 = require("./src/services/ConstructionAIService");
const SensorDataService_1 = require("./src/services/SensorDataService");
const AnomalyDetectionService_1 = require("./src/services/AnomalyDetectionService");
const HealthScoringService_1 = require("./src/services/HealthScoringService");
const MaintenanceAlertService_1 = require("./src/services/MaintenanceAlertService");
const EquipmentMonitoringEngine_1 = require("./src/services/EquipmentMonitoringEngine");
class ConstructionERPApplication {
    app;
    httpServer;
    aiOrchestrator;
    realTimeService;
    automationService;
    constructionAI;
    constructor() {
        this.initializeApplication();
    }
    initializeApplication() {
        this.app = new warp_1.Warp({
            cors: true,
            port: process.env.PORT || 3000
        });
        const expressApp = (0, express_1.default)();
        expressApp.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
        this.httpServer = (0, http_1.createServer)(expressApp);
        this.aiOrchestrator = new AIOrchestrator_1.AIOrchestrator();
        this.constructionAI = new ConstructionAIService_1.ConstructionAIService();
        this.realTimeService = new RealTimeService_1.RealTimeService(this.aiOrchestrator, this.httpServer);
        this.automationService = new AutomationService_1.AutomationService(this.aiOrchestrator, this.realTimeService);
        this.setupServices();
        this.setupControllers();
        this.setupEventHandlers();
        this.setupHealthChecks();
    }
    setupServices() {
        this.app.register('database', DatabaseService_1.DatabaseService);
        this.app.register('ai', AIService_1.AIService);
        this.app.register('notifications', NotificationService_1.NotificationService);
        this.app.register('aiOrchestrator', () => this.aiOrchestrator);
        this.app.register('constructionAI', () => this.constructionAI);
        this.app.register('realTimeService', () => this.realTimeService);
        this.app.register('automationService', () => this.automationService);
        this.app.register('sensorDataService', SensorDataService_1.SensorDataService);
        this.app.register('anomalyDetectionService', AnomalyDetectionService_1.AnomalyDetectionService);
        this.app.register('healthScoringService', HealthScoringService_1.HealthScoringService);
        this.app.register('maintenanceAlertService', MaintenanceAlertService_1.MaintenanceAlertService);
        this.app.register('equipmentMonitoringEngine', EquipmentMonitoringEngine_1.EquipmentMonitoringEngine);
    }
    setupControllers() {
        this.app.controller(ProductController_1.ProductController);
        this.app.controller(InventoryController_1.InventoryController);
        this.app.controller(CustomerController_1.CustomerController);
        this.app.controller(OrderController_1.OrderController);
        this.app.controller(PurchaseController_1.PurchaseController);
        this.app.controller(ProjectController_1.ProjectController);
        this.app.controller(AIInsightController_1.AIInsightController);
        this.app.controller(AnalyticsController_1.AnalyticsController);
        this.app.controller(SupplyChainController_1.SupplyChainController);
        this.app.controller(VoiceAIController_1.VoiceAIController);
        this.app.controller(PredictiveMaintenanceController_1.PredictiveMaintenanceController);
    }
    setupEventHandlers() {
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
    setupHealthChecks() {
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
        this.app.get('/api/ai/comprehensive-insights', async (req, res) => {
            try {
                const context = {
                    userRole: req.query.role || 'user',
                    companySize: req.query.size || 'midsize',
                    industry: 'construction',
                    preferences: req.query.preferences ? JSON.parse(req.query.preferences) : {}
                };
                const insights = await this.aiOrchestrator.generateComprehensiveInsights(context);
                res.json({ success: true, insights });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.post('/api/ai/smart-pricing', async (req, res) => {
            try {
                const { productIds } = req.body;
                const recommendations = await this.constructionAI.generateSmartPricingRecommendations(productIds);
                res.json({ success: true, recommendations });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.post('/api/ai/seasonal-forecast', async (req, res) => {
            try {
                const { category, horizon } = req.body;
                const forecast = await this.constructionAI.generateSeasonalDemandForecast(category, horizon);
                res.json({ success: true, forecast });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.post('/api/ai/supplier-risk', async (req, res) => {
            try {
                const { supplierId } = req.body;
                const analysis = await this.constructionAI.analyzeSupplierRisk(supplierId);
                res.json({ success: true, analysis });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
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
    async start() {
        try {
            console.log('🚀 Starting AI-Powered Construction ERP System...');
            const port = process.env.PORT || 3000;
            this.httpServer.listen(port, () => {
                console.log(`📡 WebSocket server running on port ${port}`);
            });
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
        }
        catch (error) {
            console.error('❌ Failed to start Construction ERP System:', error);
            process.exit(1);
        }
    }
    async shutdown() {
        console.log('🛑 Shutting down Construction ERP System...');
        try {
            if (this.httpServer) {
                this.httpServer.close();
            }
            console.log('✅ Construction ERP System shut down successfully');
        }
        catch (error) {
            console.error('❌ Error during shutdown:', error);
        }
    }
}
const erpApp = new ConstructionERPApplication();
process.on('SIGTERM', async () => {
    await erpApp.shutdown();
    process.exit(0);
});
process.on('SIGINT', async () => {
    await erpApp.shutdown();
    process.exit(0);
});
erpApp.start().catch((error) => {
    console.error('💥 Fatal error starting application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map
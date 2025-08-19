"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplyChainController = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../services/DatabaseService");
const NotificationService_1 = require("../services/NotificationService");
const SupplyChainAnalyticsEngine_1 = require("../src/services/SupplyChainAnalyticsEngine");
const SupplyChainOptimizer_1 = require("../src/services/SupplyChainOptimizer");
let SupplyChainController = class SupplyChainController {
    databaseService;
    notificationService;
    analyticsEngine;
    optimizer;
    constructor(databaseService, notificationService, analyticsEngine, optimizer) {
        this.databaseService = databaseService;
        this.notificationService = notificationService;
        this.analyticsEngine = analyticsEngine;
        this.optimizer = optimizer;
    }
    async getSupplyChainPerformance(query) {
        try {
            const { startDate, endDate } = query;
            const timeframe = {
                start: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                end: endDate ? new Date(endDate) : new Date()
            };
            const performance = await this.analyticsEngine.analyzeSupplyChainPerformance(timeframe);
            return {
                success: true,
                data: performance,
                timeframe
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getSupplyChainKPIs() {
        try {
            const kpis = await this.analyticsEngine.getSupplyChainKPIs();
            return {
                success: true,
                data: kpis
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getOptimizationRecommendations() {
        try {
            const recommendations = await this.optimizer.generateOptimizationRecommendations();
            return {
                success: true,
                data: recommendations,
                summary: {
                    total: recommendations.length,
                    critical: recommendations.filter(r => r.priority === 'critical').length,
                    high: recommendations.filter(r => r.priority === 'high').length,
                    totalSavings: recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0)
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getReorderPoints() {
        try {
            const lowStockItems = await this.databaseService.find('inventory', {
                $or: [
                    { status: 'low_stock' },
                    { status: 'out_of_stock' }
                ]
            });
            const reorderPoints = [];
            for (const item of lowStockItems) {
                const reorderPoint = await this.optimizer.calculateOptimalReorderPoint(item);
                reorderPoints.push(reorderPoint);
            }
            return {
                success: true,
                data: reorderPoints
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async optimizeSupplierSelection(request) {
        try {
            const { productId } = request;
            if (!productId) {
                return { success: false, error: 'productId is required' };
            }
            const optimization = await this.optimizer.optimizeSupplierSelection(productId);
            return {
                success: true,
                data: optimization
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getAutomaticPurchaseOrders() {
        try {
            const autoOrders = await this.optimizer.generateAutomaticPurchaseOrders();
            return {
                success: true,
                data: autoOrders,
                summary: {
                    total: autoOrders.length,
                    critical: autoOrders.filter(o => o.urgency === 'critical').length,
                    estimatedTotalCost: autoOrders.reduce((sum, o) => sum + o.estimatedCost, 0)
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async executeAutomaticOrders(request) {
        try {
            const { orderIds, approved } = request;
            if (!approved) {
                return { success: false, error: 'Orders must be approved before execution' };
            }
            const autoOrders = await this.optimizer.generateAutomaticPurchaseOrders();
            const ordersToExecute = autoOrders.slice(0, orderIds.length);
            const createdPurchases = [];
            for (const order of ordersToExecute) {
                const purchaseData = {
                    supplierId: order.supplierId,
                    items: [{
                            productId: order.productId,
                            productName: order.productName,
                            quantity: order.quantity,
                            unitCost: order.estimatedCost / order.quantity,
                            totalCost: order.estimatedCost
                        }],
                    notes: `Auto-generated order: ${order.reasoning}`
                };
                const purchase = {
                    id: this.generateId(),
                    ...purchaseData,
                    status: 'pending',
                    createdAt: new Date()
                };
                await this.databaseService.create('purchases', purchase);
                createdPurchases.push(purchase);
                await this.notificationService.send({
                    type: 'auto_purchase_created',
                    title: 'Automatic Purchase Order Created',
                    message: `Auto-generated purchase order for ${order.productName} - Qty: ${order.quantity}`,
                    data: purchase,
                    priority: order.urgency === 'critical' ? 'high' : 'medium'
                });
            }
            return {
                success: true,
                data: createdPurchases,
                message: `Successfully created ${createdPurchases.length} automatic purchase orders`
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getSupplierRiskAssessment() {
        try {
            const timeframe = {
                start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                end: new Date()
            };
            const performance = await this.analyticsEngine.analyzeSupplyChainPerformance(timeframe);
            const riskCategories = {
                low: performance.supplierAnalysis.filter(s => s.riskScore < 20),
                medium: performance.supplierAnalysis.filter(s => s.riskScore >= 20 && s.riskScore < 50),
                high: performance.supplierAnalysis.filter(s => s.riskScore >= 50 && s.riskScore < 80),
                critical: performance.supplierAnalysis.filter(s => s.riskScore >= 80)
            };
            return {
                success: true,
                data: {
                    riskCategories,
                    summary: {
                        totalSuppliers: performance.supplierAnalysis.length,
                        lowRisk: riskCategories.low.length,
                        mediumRisk: riskCategories.medium.length,
                        highRisk: riskCategories.high.length,
                        criticalRisk: riskCategories.critical.length,
                        averageRiskScore: performance.supplierAnalysis.reduce((sum, s) => sum + s.riskScore, 0) / performance.supplierAnalysis.length
                    }
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getSpendAnalysis(query) {
        try {
            const { startDate, endDate } = query;
            const dateFilter = {
                createdAt: {
                    $gte: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                    $lte: endDate ? new Date(endDate) : new Date()
                }
            };
            const purchases = await this.databaseService.find('purchases', dateFilter);
            const suppliers = await this.databaseService.find('suppliers', {});
            const spendBySupplier = suppliers.map(supplier => {
                const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id);
                const totalSpend = supplierPurchases.reduce((sum, p) => sum + p.total, 0);
                const orderCount = supplierPurchases.length;
                return {
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    totalSpend,
                    orderCount,
                    averageOrderValue: orderCount > 0 ? totalSpend / orderCount : 0,
                    spendPercentage: 0
                };
            });
            const totalSpend = spendBySupplier.reduce((sum, s) => sum + s.totalSpend, 0);
            spendBySupplier.forEach(supplier => {
                supplier.spendPercentage = totalSpend > 0 ? (supplier.totalSpend / totalSpend) * 100 : 0;
            });
            spendBySupplier.sort((a, b) => b.totalSpend - a.totalSpend);
            return {
                success: true,
                data: {
                    spendBySupplier: spendBySupplier.slice(0, 10),
                    summary: {
                        totalSpend,
                        supplierCount: suppliers.length,
                        activeSuppliers: spendBySupplier.filter(s => s.totalSpend > 0).length,
                        averageSpendPerSupplier: suppliers.length > 0 ? totalSpend / suppliers.length : 0,
                        top3Suppliers: spendBySupplier.slice(0, 3)
                    }
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async setupSupplyChainAlerts(alertConfig) {
        try {
            await this.databaseService.create('supply_chain_alerts', {
                id: this.generateId(),
                ...alertConfig,
                createdAt: new Date()
            });
            return {
                success: true,
                message: 'Supply chain alerts configured successfully',
                data: alertConfig
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    generateId() {
        return 'sc_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.SupplyChainController = SupplyChainController;
__decorate([
    (0, warp_1.Get)('/analytics/performance'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "getSupplyChainPerformance", null);
__decorate([
    (0, warp_1.Get)('/analytics/kpis'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "getSupplyChainKPIs", null);
__decorate([
    (0, warp_1.Get)('/optimization/recommendations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "getOptimizationRecommendations", null);
__decorate([
    (0, warp_1.Get)('/optimization/reorder-points'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "getReorderPoints", null);
__decorate([
    (0, warp_1.Post)('/optimization/supplier-selection'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "optimizeSupplierSelection", null);
__decorate([
    (0, warp_1.Get)('/automation/purchase-orders'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "getAutomaticPurchaseOrders", null);
__decorate([
    (0, warp_1.Post)('/automation/execute-orders'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "executeAutomaticOrders", null);
__decorate([
    (0, warp_1.Get)('/risk-assessment/suppliers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "getSupplierRiskAssessment", null);
__decorate([
    (0, warp_1.Get)('/cost-analysis/spend-overview'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "getSpendAnalysis", null);
__decorate([
    (0, warp_1.Post)('/alerts/setup'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupplyChainController.prototype, "setupSupplyChainAlerts", null);
exports.SupplyChainController = SupplyChainController = __decorate([
    (0, warp_1.Injectable)(),
    (0, warp_1.Controller)('/api/supply-chain'),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        NotificationService_1.NotificationService,
        SupplyChainAnalyticsEngine_1.SupplyChainAnalyticsEngine,
        SupplyChainOptimizer_1.SupplyChainOptimizer])
], SupplyChainController);
//# sourceMappingURL=SupplyChainController.js.map
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
exports.AnalyticsController = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../services/DatabaseService");
const AIService_1 = require("../services/AIService");
let AnalyticsController = class AnalyticsController {
    database;
    ai;
    constructor(database, ai) {
        this.database = database;
        this.ai = ai;
    }
    async getDashboardData(filters) {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const metrics = await Promise.all([
            this.database.salesOrders.count({
                where: {
                    createdAt: { gte: startOfMonth }
                }
            }),
            this.database.salesOrders.aggregate({
                where: {
                    createdAt: { gte: startOfMonth },
                    status: { in: ['invoiced', 'paid'] }
                },
                _sum: { totalAmount: true }
            }),
            this.database.inventory.count({
                where: {
                    quantityOnHand: { lte: { reorderPoint: true } }
                }
            }),
            this.database.customers.count({
                where: {
                    status: 'active'
                }
            })
        ]);
        const aiInsights = await this.ai.generateInventoryRecommendations('all');
        return {
            metrics: {
                ordersThisMonth: metrics[0],
                revenueThisMonth: metrics[1]._sum.totalAmount || 0,
                lowStockItems: metrics[2],
                activeCustomers: metrics[3]
            },
            insights: aiInsights,
            trends: {
                salesGrowth: await this.calculateSalesGrowth(),
                topProducts: await this.getTopSellingProducts(10),
                customerActivity: await this.getCustomerActivityTrends()
            }
        };
    }
    async getSalesPerformance(params) {
        const { startDate, endDate, groupBy = 'month' } = params;
        return {
            timeSeries: [],
            comparisons: {},
            predictions: await this.ai.generateDemandForecast('aggregate', 30),
            recommendations: []
        };
    }
    async getInventoryOptimization() {
        const insights = await this.ai.generateInventoryRecommendations('all');
        return {
            overstock: [],
            understock: [],
            obsolete: [],
            recommendations: insights,
            projectedSavings: 0
        };
    }
    async getCustomerInsights() {
        return {
            segmentation: [],
            churnRisk: [],
            opportunities: [],
            satisfaction: {}
        };
    }
    async calculateSalesGrowth() {
        return 12.5;
    }
    async getTopSellingProducts(limit) {
        return [];
    }
    async getCustomerActivityTrends() {
        return {};
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, warp_1.Get)('/dashboard'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardData", null);
__decorate([
    (0, warp_1.Get)('/sales-performance'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSalesPerformance", null);
__decorate([
    (0, warp_1.Get)('/inventory-optimization'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getInventoryOptimization", null);
__decorate([
    (0, warp_1.Get)('/customer-insights'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCustomerInsights", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, warp_1.Controller)('/api/analytics'),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        AIService_1.AIService])
], AnalyticsController);
//# sourceMappingURL=AnalyticsController.js.map
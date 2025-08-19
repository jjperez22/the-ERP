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
exports.AIInsightController = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../services/DatabaseService");
const AIService_1 = require("../services/AIService");
const NotificationService_1 = require("../services/NotificationService");
let AIInsightController = class AIInsightController {
    databaseService;
    aiService;
    notificationService;
    constructor(databaseService, aiService, notificationService) {
        this.databaseService = databaseService;
        this.aiService = aiService;
        this.notificationService = notificationService;
    }
    async getAllInsights(query) {
        try {
            const { type, severity, acknowledged, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
            let filters = {};
            if (type)
                filters.type = type;
            if (severity)
                filters.severity = severity;
            if (acknowledged !== undefined)
                filters.acknowledged = acknowledged === 'true';
            const skip = (page - 1) * limit;
            const insights = await this.databaseService.find('ai_insights', filters, {
                skip,
                limit: parseInt(limit),
                sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
            });
            const total = await this.databaseService.count('ai_insights', filters);
            return {
                success: true,
                data: insights,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getDashboardInsights() {
        try {
            const criticalInsights = await this.databaseService.find('ai_insights', {
                severity: 'critical',
                acknowledged: false
            }, { limit: 5, sort: { createdAt: -1 } });
            const warningInsights = await this.databaseService.find('ai_insights', {
                severity: 'warning',
                acknowledged: false
            }, { limit: 10, sort: { createdAt: -1 } });
            const actionableInsights = await this.databaseService.find('ai_insights', {
                actionable: true,
                acknowledged: false
            }, { limit: 15, sort: { confidence: -1 } });
            return {
                success: true,
                data: {
                    critical: criticalInsights,
                    warnings: warningInsights,
                    actionable: actionableInsights,
                    summary: {
                        total_unacknowledged: await this.databaseService.count('ai_insights', { acknowledged: false }),
                        critical_count: criticalInsights.length,
                        warning_count: warningInsights.length,
                        actionable_count: actionableInsights.length
                    }
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async generateInsights(request) {
        try {
            const insights = await this.aiService.generateSpecificInsights(request.type, request.context, request.timeframe, request.filters);
            const savedInsights = [];
            for (const insight of insights) {
                const saved = await this.databaseService.create('ai_insights', {
                    ...insight,
                    id: this.generateId(),
                    createdAt: new Date(),
                    acknowledged: false
                });
                savedInsights.push(saved);
            }
            return { success: true, data: savedInsights };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async acknowledgeInsight(id, acknowledgeData) {
        try {
            const insight = await this.databaseService.findById('ai_insights', id);
            if (!insight) {
                return { success: false, error: 'Insight not found' };
            }
            const updated = await this.databaseService.update('ai_insights', id, {
                acknowledged: true,
                acknowledgedBy: acknowledgeData.acknowledgedBy,
                acknowledgedAt: new Date()
            });
            return { success: true, data: updated };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getInsightAnalytics(query) {
        try {
            const { startDate, endDate } = query;
            let dateFilter = {};
            if (startDate || endDate) {
                dateFilter = {
                    createdAt: {
                        ...(startDate && { $gte: new Date(startDate) }),
                        ...(endDate && { $lte: new Date(endDate) })
                    }
                };
            }
            const insights = await this.databaseService.find('ai_insights', dateFilter);
            const analytics = {
                total_insights: insights.length,
                by_type: this.groupBy(insights, 'type'),
                by_severity: this.groupBy(insights, 'severity'),
                acknowledged_rate: insights.length > 0 ?
                    (insights.filter(i => i.acknowledged).length / insights.length) * 100 : 0,
                average_confidence: insights.length > 0 ?
                    insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length : 0,
                actionable_insights: insights.filter(i => i.actionable).length
            };
            return { success: true, data: analytics };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    groupBy(items, field) {
        return items.reduce((acc, item) => {
            const key = item[field] || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }
    generateId() {
        return 'insight_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.AIInsightController = AIInsightController;
__decorate([
    (0, warp_1.Get)('/'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIInsightController.prototype, "getAllInsights", null);
__decorate([
    (0, warp_1.Get)('/dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AIInsightController.prototype, "getDashboardInsights", null);
__decorate([
    (0, warp_1.Post)('/generate'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIInsightController.prototype, "generateInsights", null);
__decorate([
    (0, warp_1.Post)('/:id/acknowledge'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AIInsightController.prototype, "acknowledgeInsight", null);
__decorate([
    (0, warp_1.Get)('/analytics'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIInsightController.prototype, "getInsightAnalytics", null);
exports.AIInsightController = AIInsightController = __decorate([
    (0, warp_1.Injectable)(),
    (0, warp_1.Controller)('/api/ai-insights'),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        AIService_1.AIService,
        NotificationService_1.NotificationService])
], AIInsightController);
//# sourceMappingURL=AIInsightController.js.map
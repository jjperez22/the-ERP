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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const warp_1 = require("@varld/warp");
let AIService = class AIService {
    openaiKey;
    constructor() {
        this.openaiKey = process.env.OPENAI_API_KEY || '';
    }
    async generateSKU(productData) {
        const categoryCode = productData.category?.name?.substring(0, 3).toUpperCase() || 'GEN';
        const supplierCode = productData.supplier?.code?.substring(0, 2).toUpperCase() || 'XX';
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${categoryCode}-${supplierCode}-${randomSuffix}`;
    }
    async suggestPrice(productData) {
        const baseCost = productData.costPrice || 0;
        const defaultMarkup = 0.25;
        const suggestedPrice = baseCost * (1 + defaultMarkup);
        return Math.round(suggestedPrice * 100) / 100;
    }
    async generateDemandForecast(productId, horizon = 90) {
        const forecast = [];
        const baseDate = new Date();
        for (let i = 0; i < horizon; i += 7) {
            const forecastDate = new Date(baseDate);
            forecastDate.setDate(baseDate.getDate() + i);
            const predictedDemand = this.simulateDemandPrediction(productId, forecastDate);
            forecast.push({
                productId,
                locationId: 'main-warehouse',
                period: 'week',
                forecastDate,
                predictedDemand,
                confidence: 0.75 + Math.random() * 0.2,
                factors: this.identifyForecastFactors(forecastDate)
            });
        }
        return forecast;
    }
    simulateDemandPrediction(productId, date) {
        const monthOfYear = date.getMonth() + 1;
        const dayOfWeek = date.getDay();
        let baseDemand = 100;
        if (monthOfYear >= 3 && monthOfYear <= 10) {
            baseDemand *= 1.3;
        }
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            baseDemand *= 0.3;
        }
        const randomFactor = 0.8 + Math.random() * 0.4;
        return Math.round(baseDemand * randomFactor);
    }
    identifyForecastFactors(date) {
        const factors = [];
        const month = date.getMonth() + 1;
        if (month >= 3 && month <= 10) {
            factors.push({
                type: 'seasonal',
                impact: 0.3,
                description: 'Peak construction season'
            });
        }
        if (month === 12 || month === 1) {
            factors.push({
                type: 'seasonal',
                impact: -0.4,
                description: 'Winter construction slowdown'
            });
        }
        return factors;
    }
    async generateInventoryRecommendations(productId) {
        const insights = [];
        insights.push({
            id: `insight-${Date.now()}`,
            type: 'inventory_optimization',
            title: 'Reorder Point Adjustment Recommended',
            description: 'Based on recent demand patterns, consider increasing reorder point by 15%',
            severity: 'warning',
            confidence: 0.85,
            actionable: true,
            recommendations: [
                'Increase reorder point from 50 to 58 units',
                'Consider setting up automatic reordering',
                'Review supplier lead times for accuracy'
            ],
            data: {
                currentReorderPoint: 50,
                recommendedReorderPoint: 58,
                reasonCode: 'INCREASED_DEMAND_TREND'
            },
            createdAt: new Date()
        });
        return insights;
    }
    async predictCustomerChurn(customerId) {
        const churnProbability = Math.random() * 0.3;
        return {
            churnProbability,
            riskFactors: [
                'Decreased order frequency (30% decline in last 60 days)',
                'Late payments increasing',
                'Reduced order values'
            ],
            recommendations: [
                'Schedule account manager call',
                'Offer loyalty discount',
                'Provide additional payment terms flexibility'
            ]
        };
    }
    async optimizeSupplyChain() {
        const insights = [];
        insights.push({
            id: `supply-chain-${Date.now()}`,
            type: 'supplier_risk',
            title: 'Supplier Diversification Recommended',
            description: '78% of concrete supplies from single vendor creates risk exposure',
            severity: 'warning',
            confidence: 0.92,
            actionable: true,
            recommendations: [
                'Identify 2-3 alternative concrete suppliers',
                'Negotiate backup supply agreements',
                'Implement supplier performance monitoring'
            ],
            data: {
                category: 'concrete',
                concentrationRisk: 0.78,
                impactLevel: 'high'
            },
            createdAt: new Date()
        });
        return insights;
    }
};
exports.AIService = AIService;
exports.AIService = AIService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AIService);
//# sourceMappingURL=AIService.js.map
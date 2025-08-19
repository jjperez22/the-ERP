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
exports.AIOrchestrator = void 0;
const warp_1 = require("@varld/warp");
const openai_1 = require("openai");
const events_1 = require("events");
let AIOrchestrator = class AIOrchestrator extends events_1.EventEmitter {
    openai;
    aiModels = new Map();
    activeInsights = new Map();
    constructor() {
        super();
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY || ''
        });
        this.initializeAIModels();
        this.startRealTimeProcessing();
    }
    initializeAIModels() {
        this.aiModels.set('demand_forecasting', new DemandForecastingModel());
        this.aiModels.set('inventory_optimization', new InventoryOptimizationModel());
        this.aiModels.set('price_intelligence', new PriceIntelligenceModel());
        this.aiModels.set('customer_intelligence', new CustomerIntelligenceModel());
        this.aiModels.set('supply_chain_optimization', new SupplyChainOptimizationModel());
        this.aiModels.set('project_intelligence', new ProjectIntelligenceModel());
    }
    startRealTimeProcessing() {
        setInterval(() => {
            this.processRealTimeInsights();
        }, 30000);
        setInterval(() => {
            this.processCriticalAlerts();
        }, 5000);
    }
    async generateComprehensiveInsights(context) {
        const insights = [];
        try {
            const [demandInsights, inventoryInsights, customerInsights, supplyChainInsights, projectInsights, marketInsights] = await Promise.all([
                this.getDemandForecasts(context),
                this.getInventoryOptimization(context),
                this.getCustomerIntelligence(context),
                this.getSupplyChainOptimization(context),
                this.getProjectIntelligence(context),
                this.getMarketIntelligence(context)
            ]);
            insights.push(...demandInsights, ...inventoryInsights, ...customerInsights, ...supplyChainInsights, ...projectInsights, ...marketInsights);
            return this.prioritizeInsights(insights, context);
        }
        catch (error) {
            console.error('AI Orchestration Error:', error);
            return [];
        }
    }
    async getDemandForecasts(context) {
        const model = this.aiModels.get('demand_forecasting');
        const forecasts = await model.generateForecasts(context);
        return forecasts.map(forecast => ({
            id: `demand-${Date.now()}-${Math.random()}`,
            type: 'demand_forecast',
            title: `Demand Forecast: ${forecast.productName}`,
            description: `Predicted ${forecast.trend > 0 ? 'increase' : 'decrease'} of ${Math.abs(forecast.trend)}% in next ${forecast.horizon} days`,
            severity: this.calculateSeverity(forecast.confidence, forecast.impact),
            confidence: forecast.confidence,
            actionable: true,
            recommendations: forecast.recommendations,
            data: forecast,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + forecast.horizon * 24 * 60 * 60 * 1000)
        }));
    }
    async getInventoryOptimization(context) {
        const model = this.aiModels.get('inventory_optimization');
        const optimizations = await model.optimize(context);
        return optimizations.map(opt => ({
            id: `inventory-${Date.now()}-${Math.random()}`,
            type: 'inventory_optimization',
            title: opt.title,
            description: opt.description,
            severity: opt.severity,
            confidence: opt.confidence,
            actionable: true,
            recommendations: opt.actions,
            data: opt.data,
            createdAt: new Date()
        }));
    }
    async getCustomerIntelligence(context) {
        const model = this.aiModels.get('customer_intelligence');
        const insights = await model.analyzeCustomers(context);
        return insights.map(insight => ({
            id: `customer-${Date.now()}-${Math.random()}`,
            type: 'customer_churn',
            title: insight.title,
            description: insight.description,
            severity: insight.churnRisk > 0.7 ? 'critical' : insight.churnRisk > 0.4 ? 'warning' : 'info',
            confidence: insight.confidence,
            actionable: true,
            recommendations: insight.retentionStrategies,
            data: insight.data,
            createdAt: new Date()
        }));
    }
    async getSupplyChainOptimization(context) {
        const model = this.aiModels.get('supply_chain_optimization');
        const optimizations = await model.optimizeSupplyChain(context);
        return optimizations.map(opt => ({
            id: `supply-${Date.now()}-${Math.random()}`,
            type: 'supplier_risk',
            title: opt.title,
            description: opt.description,
            severity: opt.riskLevel,
            confidence: opt.confidence,
            actionable: true,
            recommendations: opt.mitigationStrategies,
            data: opt.data,
            createdAt: new Date()
        }));
    }
    async getProjectIntelligence(context) {
        const model = this.aiModels.get('project_intelligence');
        const insights = await model.analyzeProjects(context);
        return insights.map(insight => ({
            id: `project-${Date.now()}-${Math.random()}`,
            type: 'seasonal_trend',
            title: insight.title,
            description: insight.description,
            severity: insight.severity,
            confidence: insight.confidence,
            actionable: true,
            recommendations: insight.recommendations,
            data: insight.data,
            createdAt: new Date()
        }));
    }
    async getMarketIntelligence(context) {
        const prompt = `
      Analyze the current construction materials market for a ${context.companySize} company.
      Focus on:
      - Price trends and volatility
      - Supply chain disruptions
      - Seasonal patterns
      - Competitive landscape changes
      - Economic indicators impact
      
      Provide actionable insights with confidence scores.
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are an expert construction industry AI analyst providing market intelligence.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 2000
            });
            const analysis = JSON.parse(response.choices[0].message.content || '{}');
            return [{
                    id: `market-${Date.now()}`,
                    type: 'price_opportunity',
                    title: 'Market Intelligence Update',
                    description: analysis.summary || 'Current market conditions analysis',
                    severity: 'info',
                    confidence: 0.8,
                    actionable: true,
                    recommendations: analysis.recommendations || [],
                    data: analysis,
                    createdAt: new Date()
                }];
        }
        catch (error) {
            console.error('Market intelligence error:', error);
            return [];
        }
    }
    prioritizeInsights(insights, context) {
        return insights
            .sort((a, b) => {
            const scoreA = this.calculateInsightScore(a, context);
            const scoreB = this.calculateInsightScore(b, context);
            return scoreB - scoreA;
        })
            .slice(0, 20);
    }
    calculateInsightScore(insight, context) {
        let score = 0;
        const severityWeight = { critical: 100, warning: 70, info: 40 };
        score += severityWeight[insight.severity];
        score += insight.confidence * 50;
        if (insight.actionable)
            score += 30;
        const typePriority = this.getTypePriorityForCompany(insight.type, context.companySize);
        score += typePriority;
        return score;
    }
    getTypePriorityForCompany(type, companySize) {
        const priorities = {
            small: {
                'inventory_optimization': 50,
                'cash_flow_prediction': 45,
                'demand_forecast': 40,
                'customer_churn': 35,
                'supplier_risk': 30,
                'price_opportunity': 25
            },
            midsize: {
                'demand_forecast': 50,
                'supplier_risk': 45,
                'inventory_optimization': 40,
                'customer_churn': 35,
                'price_opportunity': 30,
                'seasonal_trend': 25
            },
            enterprise: {
                'supplier_risk': 50,
                'demand_forecast': 45,
                'seasonal_trend': 40,
                'price_opportunity': 35,
                'inventory_optimization': 30,
                'customer_churn': 25
            }
        };
        return priorities[companySize]?.[type] || 20;
    }
    calculateSeverity(confidence, impact) {
        const riskScore = confidence * impact;
        if (riskScore > 0.8)
            return 'critical';
        if (riskScore > 0.5)
            return 'warning';
        return 'info';
    }
    async processRealTimeInsights() {
        this.emit('insights_updated', await this.generateComprehensiveInsights({
            userRole: 'admin',
            companySize: 'midsize',
            industry: 'construction',
            preferences: {}
        }));
    }
    async processCriticalAlerts() {
        const criticalInsights = Array.from(this.activeInsights.values())
            .filter(insight => insight.severity === 'critical')
            .filter(insight => !insight.expiresAt || insight.expiresAt > new Date());
        if (criticalInsights.length > 0) {
            this.emit('critical_alerts', criticalInsights);
        }
    }
};
exports.AIOrchestrator = AIOrchestrator;
exports.AIOrchestrator = AIOrchestrator = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AIOrchestrator);
class DemandForecastingModel {
    async generateForecasts(context) {
        return [
            {
                productName: 'Portland Cement',
                trend: 15.5,
                horizon: 30,
                confidence: 0.89,
                impact: 0.7,
                recommendations: [
                    'Increase inventory by 20% before peak season',
                    'Negotiate volume discounts with suppliers',
                    'Consider alternative suppliers for backup'
                ]
            }
        ];
    }
}
class InventoryOptimizationModel {
    async optimize(context) {
        return [
            {
                title: 'Overstock Alert: Roofing Materials',
                description: 'Current inventory levels 40% above optimal for next 60 days',
                severity: 'warning',
                confidence: 0.85,
                actions: [
                    'Run promotional campaign on roofing materials',
                    'Defer next planned purchase order',
                    'Consider bundling with other products'
                ],
                data: { category: 'roofing', overstockPercentage: 40, estimatedCarryCost: 12500 }
            }
        ];
    }
}
class CustomerIntelligenceModel {
    async analyzeCustomers(context) {
        return [
            {
                title: 'High-Value Customer Churn Risk',
                description: 'Elite Residential Builders showing 78% churn probability',
                churnRisk: 0.78,
                confidence: 0.91,
                retentionStrategies: [
                    'Schedule immediate account review meeting',
                    'Offer extended payment terms',
                    'Provide exclusive pricing tier',
                    'Assign dedicated account manager'
                ],
                data: { customerId: 'C004', lifetimeValue: 450000, riskFactors: ['payment_delays', 'order_frequency_decline'] }
            }
        ];
    }
}
class SupplyChainOptimizationModel {
    async optimizeSupplyChain(context) {
        return [
            {
                title: 'Supplier Concentration Risk',
                description: '78% of concrete supplies from single vendor creates vulnerability',
                riskLevel: 'warning',
                confidence: 0.92,
                mitigationStrategies: [
                    'Identify 2-3 backup concrete suppliers',
                    'Negotiate secondary supply agreements',
                    'Implement supplier performance monitoring'
                ],
                data: { category: 'concrete', concentration: 0.78, alternativeSuppliers: 2 }
            }
        ];
    }
}
class ProjectIntelligenceModel {
    async analyzeProjects(context) {
        return [
            {
                title: 'Seasonal Demand Spike Incoming',
                description: 'Construction activity expected to increase 35% in next 30 days',
                severity: 'warning',
                confidence: 0.87,
                recommendations: [
                    'Increase inventory levels across all categories',
                    'Prepare for higher staffing needs',
                    'Review pricing strategy for peak season'
                ],
                data: { expectedIncrease: 35, peakMonths: ['March', 'April', 'May'], historicalPattern: 'spring_surge' }
            }
        ];
    }
}
//# sourceMappingURL=AIOrchestrator.js.map
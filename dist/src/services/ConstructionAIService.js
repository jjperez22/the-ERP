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
exports.ConstructionAIService = void 0;
const warp_1 = require("@varld/warp");
const openai_1 = require("openai");
let ConstructionAIService = class ConstructionAIService {
    openai;
    marketDataCache = new Map();
    priceModels = new Map();
    constructor() {
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY || ''
        });
        this.initializePricingModels();
        this.startMarketDataUpdates();
    }
    initializePricingModels() {
        const categories = ['lumber', 'concrete', 'steel', 'roofing', 'electrical', 'plumbing'];
        categories.forEach(category => {
            this.priceModels.set(category, new MaterialPricingModel(category));
        });
    }
    startMarketDataUpdates() {
        setInterval(async () => {
            await this.updateMarketData();
        }, 3600000);
    }
    async generateSmartPricingRecommendations(productIds) {
        const recommendations = [];
        for (const productId of productIds) {
            try {
                const recommendation = await this.generatePricingRecommendation(productId);
                recommendations.push(recommendation);
            }
            catch (error) {
                console.error(`Error generating pricing for ${productId}:`, error);
            }
        }
        return recommendations;
    }
    async generatePricingRecommendation(productId) {
        const product = await this.getProductData(productId);
        const marketData = this.marketDataCache.get(product.category) || await this.getMarketData(product.category);
        const prompt = `
      Analyze optimal pricing for a construction material with these characteristics:
      - Product: ${product.name}
      - Category: ${product.category}
      - Current Price: $${product.currentPrice}
      - Cost: $${product.cost}
      - Market Price: $${marketData.currentPrice}
      - Market Volatility: ${marketData.priceVolatility}
      - Demand Trend: ${marketData.demandTrend}
      - Supply Risk: ${marketData.supplyChainRisk}
      - Seasonal Factor: ${marketData.seasonalFactor}

      Consider:
      1. Competitive positioning
      2. Market conditions
      3. Profit optimization
      4. Demand elasticity
      5. Seasonal adjustments

      Provide a JSON response with recommendedPrice, confidence (0-1), reasoning, and key factors.
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are an expert construction materials pricing analyst. Provide precise, data-driven pricing recommendations.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            });
            const analysis = JSON.parse(response.choices[0].message.content || '{}');
            return {
                productId,
                currentPrice: product.currentPrice,
                recommendedPrice: analysis.recommendedPrice || product.currentPrice,
                confidence: analysis.confidence || 0.7,
                reasoning: analysis.reasoning || 'AI pricing analysis completed',
                marketFactors: analysis.marketFactors || [],
                competitiveBenchmark: marketData.currentPrice,
                profitMargin: (analysis.recommendedPrice - product.cost) / analysis.recommendedPrice,
                demandElasticity: analysis.demandElasticity || 0.5
            };
        }
        catch (error) {
            console.error('AI pricing error:', error);
            return this.fallbackPricingRecommendation(productId, product, marketData);
        }
    }
    async generateSeasonalDemandForecast(category, horizon = 90) {
        const historicalData = await this.getHistoricalDemandData(category);
        const marketData = await this.getMarketData(category);
        const prompt = `
      Generate a seasonal demand forecast for ${category} construction materials over ${horizon} days.
      
      Historical patterns:
      - Q1: ${historicalData.q1Avg} units (winter slowdown)
      - Q2: ${historicalData.q2Avg} units (spring surge)
      - Q3: ${historicalData.q3Avg} units (peak season)
      - Q4: ${historicalData.q4Avg} units (fall completion rush)
      
      Current market conditions:
      - Interest rates: ${marketData.economicIndicators?.interestRates || 5.5}%
      - Housing starts trend: ${marketData.economicIndicators?.housingStarts || 'stable'}
      - Weather impact: ${marketData.weatherImpact || 0}
      
      Consider:
      1. Seasonal construction patterns
      2. Weather dependencies
      3. Economic indicators
      4. Holiday impacts
      5. Supply chain factors
      
      Provide weekly forecasts with confidence intervals and key driving factors.
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are a construction industry demand forecasting expert with deep knowledge of seasonal patterns.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' }
            });
            return JSON.parse(response.choices[0].message.content || '{}');
        }
        catch (error) {
            console.error('Seasonal forecast error:', error);
            return this.fallbackSeasonalForecast(category, horizon);
        }
    }
    async analyzeSupplierRisk(supplierId) {
        const supplierData = await this.getSupplierData(supplierId);
        const prompt = `
      Analyze the risk profile of this construction materials supplier:
      
      Supplier Profile:
      - Name: ${supplierData.name}
      - Years in business: ${supplierData.yearsInBusiness}
      - Financial rating: ${supplierData.financialRating}
      - On-time delivery: ${supplierData.onTimeDelivery}%
      - Quality rating: ${supplierData.qualityRating}/10
      - Geographic concentration: ${supplierData.locations?.length || 1} locations
      - Product categories: ${supplierData.categories?.join(', ')}
      
      Recent performance:
      - Late deliveries: ${supplierData.recentLateDeliveries}
      - Quality issues: ${supplierData.recentQualityIssues}
      - Price volatility: ${supplierData.priceVolatility}%
      
      Assess risks in:
      1. Financial stability
      2. Operational reliability
      3. Geographic concentration
      4. Market dependencies
      5. Regulatory compliance
      
      Provide risk score (0-100), critical factors, and mitigation recommendations.
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are a supply chain risk analyst specializing in construction materials suppliers.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            });
            return JSON.parse(response.choices[0].message.content || '{}');
        }
        catch (error) {
            console.error('Supplier risk analysis error:', error);
            return this.fallbackSupplierRiskAnalysis(supplierData);
        }
    }
    async optimizeInventoryLevels(locationId) {
        const inventoryData = await this.getInventoryData(locationId);
        const demandForecasts = await this.getDemandForecasts(locationId);
        const optimizationResults = [];
        for (const item of inventoryData) {
            const forecast = demandForecasts.find(f => f.productId === item.productId);
            const optimization = await this.optimizeProductInventory(item, forecast);
            optimizationResults.push(optimization);
        }
        return {
            locationId,
            totalOptimizations: optimizationResults.length,
            potentialSavings: optimizationResults.reduce((sum, opt) => sum + opt.potentialSavings, 0),
            optimizations: optimizationResults.filter(opt => opt.recommendedAction !== 'maintain'),
            summary: this.generateInventoryOptimizationSummary(optimizationResults)
        };
    }
    async optimizeProductInventory(item, forecast) {
        const currentStock = item.quantityOnHand;
        const reorderPoint = item.reorderPoint;
        const avgDemand = forecast?.averageDemand || item.averageDemand;
        const leadTime = item.supplier?.leadTime || 7;
        const carryingCost = item.cost * 0.25;
        const optimalReorderPoint = Math.ceil(avgDemand * (leadTime / 7) * 1.2);
        const optimalOrderQuantity = Math.ceil(Math.sqrt(2 * avgDemand * 50 / carryingCost));
        let recommendedAction = 'maintain';
        let potentialSavings = 0;
        let reasoning = '';
        if (currentStock < optimalReorderPoint) {
            recommendedAction = 'reorder';
            potentialSavings = avgDemand * item.sellingPrice * 0.02;
            reasoning = `Stock below optimal level. Risk of stockout.`;
        }
        else if (currentStock > optimalOrderQuantity * 2) {
            recommendedAction = 'reduce';
            potentialSavings = (currentStock - optimalOrderQuantity) * carryingCost;
            reasoning = `Excess inventory carrying unnecessary costs.`;
        }
        else if (Math.abs(reorderPoint - optimalReorderPoint) > reorderPoint * 0.2) {
            recommendedAction = 'adjust_reorder_point';
            potentialSavings = Math.abs(reorderPoint - optimalReorderPoint) * carryingCost * 0.5;
            reasoning = `Reorder point optimization opportunity identified.`;
        }
        return {
            productId: item.productId,
            productName: item.productName,
            currentStock,
            optimalReorderPoint,
            optimalOrderQuantity,
            recommendedAction,
            potentialSavings,
            reasoning,
            confidence: 0.8,
            currentCarryingCost: currentStock * carryingCost,
            optimizedCarryingCost: optimalOrderQuantity * carryingCost
        };
    }
    async generateProjectMaterialRequirements(projectData) {
        const prompt = `
      Calculate material requirements for this construction project:
      
      Project Details:
      - Type: ${projectData.type}
      - Size: ${projectData.squareFootage} sq ft
      - Stories: ${projectData.stories}
      - Foundation: ${projectData.foundationType}
      - Framing: ${projectData.framingType}
      - Roofing: ${projectData.roofingType}
      - Timeline: ${projectData.duration} months
      
      Calculate detailed material requirements including:
      1. Concrete (foundation, slabs)
      2. Lumber (framing, decking)
      3. Roofing materials
      4. Electrical supplies
      5. Plumbing materials
      6. Insulation
      7. Drywall and finishing
      
      Provide quantities, timing, and delivery scheduling recommendations.
      Include 10% waste factor and suggest staging/storage requirements.
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are a construction materials expert with deep knowledge of building requirements and material calculations.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            });
            const requirements = JSON.parse(response.choices[0].message.content || '{}');
            return await this.enhanceWithPricingData(requirements);
        }
        catch (error) {
            console.error('Project material requirements error:', error);
            return this.fallbackProjectRequirements(projectData);
        }
    }
    async enhanceWithPricingData(requirements) {
        for (const category in requirements.materials) {
            const materials = requirements.materials[category];
            for (const material of materials) {
                const marketData = await this.getMarketData(category);
                material.currentPrice = marketData.currentPrice;
                material.availability = marketData.supplyChainRisk === 'low' ? 'good' : 'limited';
                material.estimatedCost = material.quantity * material.currentPrice;
                material.leadTime = this.getEstimatedLeadTime(category);
            }
        }
        return requirements;
    }
    async getProductData(productId) {
        return {
            id: productId,
            name: 'Sample Product',
            category: 'lumber',
            currentPrice: 4.99,
            cost: 3.24,
            averageDemand: 50
        };
    }
    async getMarketData(category) {
        if (this.marketDataCache.has(category)) {
            return this.marketDataCache.get(category);
        }
        const data = {
            materialCategory: category,
            currentPrice: Math.random() * 100 + 50,
            priceVolatility: Math.random() * 0.3,
            seasonalFactor: 1 + (Math.random() - 0.5) * 0.4,
            supplyChainRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            demandTrend: ['decreasing', 'stable', 'increasing'][Math.floor(Math.random() * 3)],
            weatherImpact: (Math.random() - 0.5) * 0.2,
            economicIndicators: {
                housingStarts: 1200000 + Math.random() * 200000,
                constructionSpending: 1500 + Math.random() * 200,
                interestRates: 5 + Math.random() * 3
            }
        };
        this.marketDataCache.set(category, data);
        return data;
    }
    fallbackPricingRecommendation(productId, product, marketData) {
        return {
            productId,
            currentPrice: product.currentPrice,
            recommendedPrice: product.currentPrice * (1 + Math.random() * 0.1 - 0.05),
            confidence: 0.5,
            reasoning: 'Fallback pricing calculation based on market conditions',
            marketFactors: ['market_volatility', 'seasonal_adjustment'],
            competitiveBenchmark: marketData.currentPrice,
            profitMargin: 0.3,
            demandElasticity: 0.5
        };
    }
    fallbackSeasonalForecast(category, horizon) {
        return {
            category,
            horizon,
            forecasts: Array.from({ length: Math.ceil(horizon / 7) }, (_, i) => ({
                week: i + 1,
                predictedDemand: 100 + Math.sin(i * 0.2) * 30 + Math.random() * 20,
                confidence: 0.6,
                factors: ['seasonal_pattern']
            }))
        };
    }
    async updateMarketData() {
        const categories = ['lumber', 'concrete', 'steel', 'roofing', 'electrical', 'plumbing'];
        for (const category of categories) {
            const data = await this.getMarketData(category);
            this.marketDataCache.set(category, data);
        }
    }
    generateInventoryOptimizationSummary(optimizations) {
        const totalSavings = optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0);
        const actionCounts = optimizations.reduce((counts, opt) => {
            counts[opt.recommendedAction] = (counts[opt.recommendedAction] || 0) + 1;
            return counts;
        }, {});
        return `Analyzed ${optimizations.length} products. Potential savings: $${totalSavings.toFixed(2)}. Actions: ${JSON.stringify(actionCounts)}`;
    }
    getEstimatedLeadTime(category) {
        const leadTimes = {
            lumber: 3,
            concrete: 1,
            steel: 7,
            roofing: 5,
            electrical: 2,
            plumbing: 4
        };
        return leadTimes[category] || 5;
    }
    async getHistoricalDemandData(category) {
        return {
            q1Avg: 800,
            q2Avg: 1200,
            q3Avg: 1500,
            q4Avg: 1100
        };
    }
    async getSupplierData(supplierId) {
        return {
            id: supplierId,
            name: 'Sample Supplier',
            yearsInBusiness: 15,
            financialRating: 'B+',
            onTimeDelivery: 94,
            qualityRating: 8.5,
            locations: ['Location1', 'Location2'],
            categories: ['lumber', 'concrete'],
            recentLateDeliveries: 2,
            recentQualityIssues: 1,
            priceVolatility: 5.2
        };
    }
    fallbackSupplierRiskAnalysis(supplierData) {
        return {
            riskScore: 35,
            riskLevel: 'medium',
            criticalFactors: ['delivery_consistency', 'price_stability'],
            recommendations: ['Monitor delivery performance', 'Establish backup suppliers']
        };
    }
    async getInventoryData(locationId) {
        return [
            {
                productId: 'P001',
                productName: '2x4 Lumber',
                quantityOnHand: 450,
                reorderPoint: 100,
                cost: 3.24,
                sellingPrice: 4.99,
                averageDemand: 50,
                supplier: { leadTime: 7 }
            }
        ];
    }
    async getDemandForecasts(locationId) {
        return [
            {
                productId: 'P001',
                averageDemand: 50,
                trend: 'stable'
            }
        ];
    }
    fallbackProjectRequirements(projectData) {
        return {
            projectId: projectData.id,
            totalEstimatedCost: 50000,
            materials: {
                lumber: [
                    { name: '2x4 Lumber', quantity: 100, unit: 'pieces' }
                ],
                concrete: [
                    { name: 'Ready Mix Concrete', quantity: 10, unit: 'yards' }
                ]
            }
        };
    }
};
exports.ConstructionAIService = ConstructionAIService;
exports.ConstructionAIService = ConstructionAIService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ConstructionAIService);
class MaterialPricingModel {
    category;
    constructor(category) {
        this.category = category;
    }
    predict(features) {
        return features.basePrice * (1 + Math.random() * 0.1 - 0.05);
    }
}
//# sourceMappingURL=ConstructionAIService.js.map
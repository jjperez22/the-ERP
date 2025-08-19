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
exports.SupplyChainOptimizer = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../../services/DatabaseService");
const SupplyChainAnalyticsEngine_1 = require("./SupplyChainAnalyticsEngine");
let SupplyChainOptimizer = class SupplyChainOptimizer {
    databaseService;
    analyticsEngine;
    constructor(databaseService, analyticsEngine) {
        this.databaseService = databaseService;
        this.analyticsEngine = analyticsEngine;
    }
    async generateOptimizationRecommendations() {
        try {
            const recommendations = [];
            const timeframe = {
                start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                end: new Date()
            };
            const analysis = await this.analyticsEngine.analyzeSupplyChainPerformance(timeframe);
            const reorderRecs = await this.generateReorderRecommendations();
            recommendations.push(...reorderRecs);
            const supplierRecs = await this.generateSupplierOptimizationRecommendations(analysis.supplierAnalysis);
            recommendations.push(...supplierRecs);
            const consolidationRecs = await this.generateConsolidationRecommendations();
            recommendations.push(...consolidationRecs);
            const safetyStockRecs = await this.generateSafetyStockRecommendations(analysis.demandPatterns);
            recommendations.push(...safetyStockRecs);
            return recommendations.sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                }
                return b.estimatedSavings - a.estimatedSavings;
            });
        }
        catch (error) {
            console.error('Error generating optimization recommendations:', error);
            throw error;
        }
    }
    async generateReorderRecommendations() {
        const recommendations = [];
        const lowStockItems = await this.databaseService.find('inventory', {
            $or: [
                { status: 'low_stock' },
                { status: 'out_of_stock' }
            ]
        });
        for (const item of lowStockItems) {
            const reorderPoint = await this.calculateOptimalReorderPoint(item);
            const priority = item.status === 'out_of_stock' ? 'critical' : 'high';
            const estimatedSavings = this.calculateReorderSavings(item, reorderPoint);
            recommendations.push({
                type: 'reorder',
                priority,
                description: `Reorder ${item.productName} - Current stock: ${item.quantity}, Optimal order: ${reorderPoint.optimalOrderQuantity}`,
                expectedBenefit: `Prevent stockouts and maintain ${Math.round(reorderPoint.optimalOrderQuantity / item.quantity * 100)}% service level`,
                estimatedSavings,
                implementationEffort: 'low',
                data: reorderPoint
            });
        }
        return recommendations;
    }
    async generateSupplierOptimizationRecommendations(supplierAnalysis) {
        const recommendations = [];
        const underperformers = supplierAnalysis.filter(s => s.reliability < 85 || s.priceCompetitiveness < 90);
        for (const supplier of underperformers) {
            const alternatives = supplierAnalysis.filter(s => s.id !== supplier.id &&
                s.reliability > supplier.reliability + 5 &&
                s.priceCompetitiveness > supplier.priceCompetitiveness);
            if (alternatives.length > 0) {
                const bestAlternative = alternatives[0];
                const costSavings = (bestAlternative.priceCompetitiveness - supplier.priceCompetitiveness) / 100 * supplier.totalSpend;
                recommendations.push({
                    type: 'supplier_switch',
                    priority: 'medium',
                    description: `Switch from ${supplier.name} to ${bestAlternative.name} for better performance`,
                    expectedBenefit: `Improve reliability by ${Math.round(bestAlternative.reliability - supplier.reliability)}% and reduce costs`,
                    estimatedSavings: Math.round(costSavings),
                    implementationEffort: 'medium',
                    data: {
                        currentSupplier: supplier,
                        recommendedSupplier: bestAlternative,
                        improvementMetrics: {
                            reliabilityGain: bestAlternative.reliability - supplier.reliability,
                            costSavings: costSavings
                        }
                    }
                });
            }
        }
        return recommendations;
    }
    async generateConsolidationRecommendations() {
        const recommendations = [];
        const purchases = await this.databaseService.find('purchases', {
            createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        });
        const productSupplierMap = new Map();
        for (const purchase of purchases) {
            for (const item of purchase.items) {
                if (!productSupplierMap.has(item.productId)) {
                    productSupplierMap.set(item.productId, new Set());
                }
                productSupplierMap.get(item.productId).add(purchase.supplierId);
            }
        }
        for (const [productId, suppliers] of productSupplierMap) {
            if (suppliers.size > 1) {
                const product = await this.databaseService.findOne('inventory', { productId });
                recommendations.push({
                    type: 'consolidation',
                    priority: 'low',
                    description: `Consolidate ${product?.productName || productId} to single supplier to reduce complexity`,
                    expectedBenefit: `Simplify procurement process and potentially negotiate better rates`,
                    estimatedSavings: Math.round(Math.random() * 5000 + 1000),
                    implementationEffort: 'medium',
                    data: {
                        productId,
                        productName: product?.productName,
                        currentSuppliers: Array.from(suppliers),
                        supplierCount: suppliers.size
                    }
                });
            }
        }
        return recommendations.slice(0, 5);
    }
    async generateSafetyStockRecommendations(demandPatterns) {
        const recommendations = [];
        const volatileItems = demandPatterns.filter(p => p.volatility === 'high');
        for (const item of volatileItems) {
            const inventory = await this.databaseService.findOne('inventory', { productId: item.productId });
            if (inventory) {
                const currentSafetyStock = inventory.minimumStock;
                const recommendedSafetyStock = Math.round(currentSafetyStock * 1.5);
                recommendations.push({
                    type: 'safety_stock',
                    priority: 'medium',
                    description: `Increase safety stock for ${item.productName} from ${currentSafetyStock} to ${recommendedSafetyStock}`,
                    expectedBenefit: `Reduce stockout risk for high-volatility item by 60%`,
                    estimatedSavings: Math.round((recommendedSafetyStock - currentSafetyStock) * inventory.unitCost * -0.2),
                    implementationEffort: 'low',
                    data: {
                        productId: item.productId,
                        productName: item.productName,
                        currentSafetyStock,
                        recommendedSafetyStock,
                        volatility: item.volatility,
                        predictability: item.predictability
                    }
                });
            }
        }
        return recommendations.slice(0, 3);
    }
    async calculateOptimalReorderPoint(inventoryItem) {
        const orders = await this.databaseService.find('orders', {
            createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        });
        let totalDemand = 0;
        let demandCount = 0;
        for (const order of orders) {
            for (const item of order.items) {
                if (item.productId === inventoryItem.productId) {
                    totalDemand += item.quantity;
                    demandCount++;
                }
            }
        }
        const avgDailyDemand = demandCount > 0 ? totalDemand / 90 : 1;
        const leadTime = 7;
        const serviceLevel = 0.95;
        const safetyStock = Math.ceil(avgDailyDemand * leadTime * 0.2);
        const reorderPoint = Math.ceil(avgDailyDemand * leadTime + safetyStock);
        const optimalOrderQuantity = Math.ceil(Math.sqrt((2 * avgDailyDemand * 30 * 100) / (inventoryItem.unitCost * 0.2)));
        const suppliers = await this.databaseService.find('suppliers', { status: 'active' });
        const suggestedSupplierId = suppliers.length > 0 ? suppliers[0].id : 'default';
        return {
            productId: inventoryItem.productId,
            productName: inventoryItem.productName,
            currentStock: inventoryItem.quantity,
            reorderPoint,
            optimalOrderQuantity,
            suggestedSupplierId,
            reasoning: `Based on ${avgDailyDemand.toFixed(1)} avg daily demand, ${leadTime} day lead time, and ${serviceLevel * 100}% service level`
        };
    }
    calculateReorderSavings(inventoryItem, reorderPoint) {
        const stockoutCost = inventoryItem.unitCost * 1.5;
        const preventedStockouts = Math.max(0, reorderPoint.reorderPoint - inventoryItem.quantity);
        return Math.round(preventedStockouts * stockoutCost);
    }
    async optimizeSupplierSelection(productId) {
        const suppliers = await this.databaseService.find('suppliers', { status: 'active' });
        const purchases = await this.databaseService.find('purchases', {
            'items.productId': productId
        });
        const supplierPerformance = new Map();
        for (const supplier of suppliers) {
            const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id);
            if (supplierPurchases.length === 0)
                continue;
            const avgPrice = supplierPurchases.reduce((sum, p) => {
                const item = p.items.find((i) => i.productId === productId);
                return sum + (item ? item.unitCost : 0);
            }, 0) / supplierPurchases.length;
            const onTimeDeliveries = supplierPurchases.filter(p => {
                if (!p.expectedDelivery || !p.actualDelivery)
                    return true;
                return new Date(p.actualDelivery) <= new Date(p.expectedDelivery);
            }).length;
            const onTimeRate = supplierPurchases.length > 0 ? onTimeDeliveries / supplierPurchases.length : 1;
            supplierPerformance.set(supplier.id, {
                supplier,
                avgPrice,
                onTimeRate,
                totalOrders: supplierPurchases.length,
                score: (onTimeRate * 0.6) + ((1 / avgPrice) * 1000 * 0.4)
            });
        }
        const performanceArray = Array.from(supplierPerformance.values());
        const currentSupplier = performanceArray[0]?.supplier;
        const bestSupplier = performanceArray.sort((a, b) => b.score - a.score)[0];
        const savings = currentSupplier && bestSupplier ?
            Math.round((performanceArray.find(p => p.supplier.id === currentSupplier.id)?.avgPrice || 0) - bestSupplier.avgPrice) : 0;
        return {
            currentSupplier: currentSupplier || null,
            recommendedSupplier: bestSupplier?.supplier || null,
            savings: Math.max(0, savings),
            reasoning: bestSupplier ?
                `Recommended supplier has ${Math.round(bestSupplier.onTimeRate * 100)}% on-time delivery and $${bestSupplier.avgPrice.toFixed(2)} avg unit cost` :
                'No supplier performance data available'
        };
    }
    async generateAutomaticPurchaseOrders() {
        const autoOrders = [];
        const lowStockItems = await this.databaseService.find('inventory', {
            $or: [
                { status: 'low_stock' },
                { status: 'out_of_stock' }
            ]
        });
        for (const item of lowStockItems) {
            const reorderPoint = await this.calculateOptimalReorderPoint(item);
            const supplierOptimization = await this.optimizeSupplierSelection(item.productId);
            if (supplierOptimization.recommendedSupplier) {
                autoOrders.push({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: reorderPoint.optimalOrderQuantity,
                    supplierId: supplierOptimization.recommendedSupplier.id,
                    supplierName: supplierOptimization.recommendedSupplier.name,
                    urgency: item.status === 'out_of_stock' ? 'critical' : 'high',
                    estimatedCost: reorderPoint.optimalOrderQuantity * (supplierOptimization.recommendedSupplier.avgPrice || item.unitCost),
                    reasoning: reorderPoint.reasoning
                });
            }
        }
        return autoOrders.sort((a, b) => {
            const urgencyOrder = { critical: 3, high: 2, medium: 1, low: 0 };
            return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        });
    }
};
exports.SupplyChainOptimizer = SupplyChainOptimizer;
exports.SupplyChainOptimizer = SupplyChainOptimizer = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        SupplyChainAnalyticsEngine_1.SupplyChainAnalyticsEngine])
], SupplyChainOptimizer);
//# sourceMappingURL=SupplyChainOptimizer.js.map
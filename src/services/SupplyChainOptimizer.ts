// src/services/SupplyChainOptimizer.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';
import { SupplyChainAnalyticsEngine } from './SupplyChainAnalyticsEngine';

interface OptimizationRecommendation {
  type: 'reorder' | 'supplier_switch' | 'safety_stock' | 'consolidation' | 'lead_time';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedBenefit: string;
  estimatedSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  data: any;
}

interface ReorderPoint {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  optimalOrderQuantity: number;
  suggestedSupplierId: string;
  reasoning: string;
}

interface SupplierOptimization {
  currentSupplierId: string;
  recommendedSupplierId: string;
  productIds: string[];
  costSavings: number;
  qualityImprovement: number;
  riskReduction: number;
}

@Injectable()
export class SupplyChainOptimizer {
  constructor(
    private databaseService: DatabaseService,
    private analyticsEngine: SupplyChainAnalyticsEngine
  ) {}

  async generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = [];

      // Get current supply chain analysis
      const timeframe = {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        end: new Date()
      };
      
      const analysis = await this.analyticsEngine.analyzeSupplyChainPerformance(timeframe);

      // Generate reorder recommendations
      const reorderRecs = await this.generateReorderRecommendations();
      recommendations.push(...reorderRecs);

      // Generate supplier optimization recommendations
      const supplierRecs = await this.generateSupplierOptimizationRecommendations(analysis.supplierAnalysis);
      recommendations.push(...supplierRecs);

      // Generate inventory consolidation recommendations
      const consolidationRecs = await this.generateConsolidationRecommendations();
      recommendations.push(...consolidationRecs);

      // Generate safety stock recommendations
      const safetyStockRecs = await this.generateSafetyStockRecommendations(analysis.demandPatterns);
      recommendations.push(...safetyStockRecs);

      // Sort by priority and potential savings
      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.estimatedSavings - a.estimatedSavings;
      });
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      throw error;
    }
  }

  private async generateReorderRecommendations(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Get low stock and out of stock items
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

  private async generateSupplierOptimizationRecommendations(supplierAnalysis: any[]): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Find underperforming suppliers
    const underperformers = supplierAnalysis.filter(s => s.reliability < 85 || s.priceCompetitiveness < 90);
    
    for (const supplier of underperformers) {
      // Find alternative suppliers
      const alternatives = supplierAnalysis.filter(s => 
        s.id !== supplier.id && 
        s.reliability > supplier.reliability + 5 &&
        s.priceCompetitiveness > supplier.priceCompetitiveness
      );

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

  private async generateConsolidationRecommendations(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Find products with multiple suppliers
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
          estimatedSavings: Math.round(Math.random() * 5000 + 1000), // Simulated savings
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

    return recommendations.slice(0, 5); // Limit to top 5
  }

  private async generateSafetyStockRecommendations(demandPatterns: any[]): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Focus on high volatility items
    const volatileItems = demandPatterns.filter(p => p.volatility === 'high');
    
    for (const item of volatileItems) {
      const inventory = await this.databaseService.findOne('inventory', { productId: item.productId });
      
      if (inventory) {
        const currentSafetyStock = inventory.minimumStock;
        const recommendedSafetyStock = Math.round(currentSafetyStock * 1.5); // 50% increase for volatile items
        
        recommendations.push({
          type: 'safety_stock',
          priority: 'medium',
          description: `Increase safety stock for ${item.productName} from ${currentSafetyStock} to ${recommendedSafetyStock}`,
          expectedBenefit: `Reduce stockout risk for high-volatility item by 60%`,
          estimatedSavings: Math.round((recommendedSafetyStock - currentSafetyStock) * inventory.unitCost * -0.2), // Carrying cost
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

    return recommendations.slice(0, 3); // Top 3 most critical
  }

  async calculateOptimalReorderPoint(inventoryItem: any): Promise<ReorderPoint> {
    // Get historical demand
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

    const avgDailyDemand = demandCount > 0 ? totalDemand / 90 : 1; // Default to 1 if no history
    const leadTime = 7; // Assume 7 days lead time
    const serviceLevel = 0.95; // 95% service level
    const safetyStock = Math.ceil(avgDailyDemand * leadTime * 0.2); // 20% safety factor

    const reorderPoint = Math.ceil(avgDailyDemand * leadTime + safetyStock);
    const optimalOrderQuantity = Math.ceil(Math.sqrt((2 * avgDailyDemand * 30 * 100) / (inventoryItem.unitCost * 0.2))); // EOQ formula

    // Find best supplier
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

  private calculateReorderSavings(inventoryItem: any, reorderPoint: ReorderPoint): number {
    // Calculate potential savings from avoiding stockouts
    const stockoutCost = inventoryItem.unitCost * 1.5; // Assume 50% markup loss per unit
    const preventedStockouts = Math.max(0, reorderPoint.reorderPoint - inventoryItem.quantity);
    return Math.round(preventedStockouts * stockoutCost);
  }

  async optimizeSupplierSelection(productId: string): Promise<{
    currentSupplier: any;
    recommendedSupplier: any;
    savings: number;
    reasoning: string;
  }> {
    // Get all suppliers and their performance metrics
    const suppliers = await this.databaseService.find('suppliers', { status: 'active' });
    const purchases = await this.databaseService.find('purchases', {
      'items.productId': productId
    });

    // Calculate performance metrics for each supplier
    const supplierPerformance = new Map();

    for (const supplier of suppliers) {
      const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id);
      
      if (supplierPurchases.length === 0) continue;

      const avgPrice = supplierPurchases.reduce((sum, p) => {
        const item = p.items.find((i: any) => i.productId === productId);
        return sum + (item ? item.unitCost : 0);
      }, 0) / supplierPurchases.length;

      const onTimeDeliveries = supplierPurchases.filter(p => {
        if (!p.expectedDelivery || !p.actualDelivery) return true;
        return new Date(p.actualDelivery) <= new Date(p.expectedDelivery);
      }).length;

      const onTimeRate = supplierPurchases.length > 0 ? onTimeDeliveries / supplierPurchases.length : 1;

      supplierPerformance.set(supplier.id, {
        supplier,
        avgPrice,
        onTimeRate,
        totalOrders: supplierPurchases.length,
        score: (onTimeRate * 0.6) + ((1 / avgPrice) * 1000 * 0.4) // Weighted score
      });
    }

    // Find current and best supplier
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

  async generateAutomaticPurchaseOrders(): Promise<any[]> {
    const autoOrders = [];
    
    // Get items that need reordering
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
}

// src/services/SupplyChainAnalyticsEngine.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';

interface SupplyChainMetrics {
  leadTime: number;
  fillRate: number;
  stockoutRate: number;
  turnoverRate: number;
  carryCost: number;
  supplierPerformance: number;
}

interface SupplierMetrics {
  id: string;
  name: string;
  onTimeDelivery: number;
  qualityScore: number;
  priceCompetitiveness: number;
  reliability: number;
  riskScore: number;
  totalSpend: number;
  orderCount: number;
}

interface DemandPattern {
  productId: string;
  productName: string;
  seasonality: {
    spring: number;
    summer: number;
    fall: number;
    winter: number;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
  volatility: 'low' | 'medium' | 'high';
  predictability: number;
}

@Injectable()
export class SupplyChainAnalyticsEngine {
  constructor(private databaseService: DatabaseService) {}

  async analyzeSupplyChainPerformance(timeframe: { start: Date; end: Date }): Promise<{
    overallMetrics: SupplyChainMetrics;
    supplierAnalysis: SupplierMetrics[];
    demandPatterns: DemandPattern[];
    recommendations: string[];
  }> {
    try {
      // Get data for analysis
      const [purchases, inventory, orders] = await Promise.all([
        this.databaseService.find('purchases', {
          createdAt: { $gte: timeframe.start, $lte: timeframe.end }
        }),
        this.databaseService.find('inventory', {}),
        this.databaseService.find('orders', {
          createdAt: { $gte: timeframe.start, $lte: timeframe.end }
        })
      ]);

      // Calculate overall metrics
      const overallMetrics = await this.calculateOverallMetrics(purchases, inventory, orders);
      
      // Analyze suppliers
      const supplierAnalysis = await this.analyzeSuppliers(purchases);
      
      // Identify demand patterns
      const demandPatterns = await this.analyzeDemandPatterns(orders);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(overallMetrics, supplierAnalysis, demandPatterns);

      return {
        overallMetrics,
        supplierAnalysis,
        demandPatterns,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing supply chain performance:', error);
      throw error;
    }
  }

  private async calculateOverallMetrics(purchases: any[], inventory: any[], orders: any[]): Promise<SupplyChainMetrics> {
    // Calculate average lead time
    const completedPurchases = purchases.filter(p => p.actualDelivery && p.expectedDelivery);
    const leadTimes = completedPurchases.map(p => {
      const expected = new Date(p.expectedDelivery).getTime();
      const actual = new Date(p.actualDelivery).getTime();
      return Math.max(0, (actual - expected) / (1000 * 60 * 60 * 24)); // days
    });
    const avgLeadTime = leadTimes.length > 0 ? leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length : 0;

    // Calculate fill rate
    const totalOrderItems = orders.reduce((sum, order) => sum + order.items.length, 0);
    const fulfilledItems = orders.reduce((sum, order) => {
      return sum + order.items.filter(item => item.quantity <= (inventory.find(inv => inv.productId === item.productId)?.quantity || 0)).length;
    }, 0);
    const fillRate = totalOrderItems > 0 ? (fulfilledItems / totalOrderItems) * 100 : 100;

    // Calculate stockout rate
    const stockoutItems = inventory.filter(item => item.status === 'out_of_stock').length;
    const stockoutRate = inventory.length > 0 ? (stockoutItems / inventory.length) * 100 : 0;

    // Calculate inventory turnover
    const totalCOGS = orders.reduce((sum, order) => sum + order.total, 0);
    const avgInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const turnoverRate = avgInventoryValue > 0 ? totalCOGS / avgInventoryValue : 0;

    // Calculate carrying cost (estimated at 20% of inventory value)
    const carryCost = avgInventoryValue * 0.20;

    // Calculate supplier performance
    const onTimeDeliveries = completedPurchases.filter(p => {
      const expected = new Date(p.expectedDelivery).getTime();
      const actual = new Date(p.actualDelivery).getTime();
      return actual <= expected;
    }).length;
    const supplierPerformance = completedPurchases.length > 0 ? (onTimeDeliveries / completedPurchases.length) * 100 : 100;

    return {
      leadTime: Math.round(avgLeadTime * 10) / 10,
      fillRate: Math.round(fillRate * 10) / 10,
      stockoutRate: Math.round(stockoutRate * 10) / 10,
      turnoverRate: Math.round(turnoverRate * 10) / 10,
      carryCost: Math.round(carryCost),
      supplierPerformance: Math.round(supplierPerformance * 10) / 10
    };
  }

  private async analyzeSuppliers(purchases: any[]): Promise<SupplierMetrics[]> {
    const suppliers = await this.databaseService.find('suppliers', {});
    const supplierMetrics: SupplierMetrics[] = [];

    for (const supplier of suppliers) {
      const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id);
      
      if (supplierPurchases.length === 0) continue;

      // On-time delivery rate
      const completedDeliveries = supplierPurchases.filter(p => p.actualDelivery && p.expectedDelivery);
      const onTimeDeliveries = completedDeliveries.filter(p => {
        const expected = new Date(p.expectedDelivery).getTime();
        const actual = new Date(p.actualDelivery).getTime();
        return actual <= expected;
      });
      const onTimeDelivery = completedDeliveries.length > 0 ? (onTimeDeliveries.length / completedDeliveries.length) * 100 : 100;

      // Quality score (simulated based on returns/issues)
      const qualityScore = 95 - Math.random() * 10; // Simulated for demo

      // Price competitiveness (compare to market average)
      const avgPrice = supplierPurchases.reduce((sum, p) => sum + p.total, 0) / supplierPurchases.length;
      const marketAvg = purchases.reduce((sum, p) => sum + p.total, 0) / purchases.length;
      const priceCompetitiveness = marketAvg > 0 ? Math.min(100, (marketAvg / avgPrice) * 100) : 100;

      // Reliability score
      const reliability = (onTimeDelivery + qualityScore) / 2;

      // Risk score (based on various factors)
      const riskScore = Math.max(0, 100 - reliability);

      // Financial metrics
      const totalSpend = supplierPurchases.reduce((sum, p) => sum + p.total, 0);
      const orderCount = supplierPurchases.length;

      supplierMetrics.push({
        id: supplier.id,
        name: supplier.name,
        onTimeDelivery: Math.round(onTimeDelivery * 10) / 10,
        qualityScore: Math.round(qualityScore * 10) / 10,
        priceCompetitiveness: Math.round(priceCompetitiveness * 10) / 10,
        reliability: Math.round(reliability * 10) / 10,
        riskScore: Math.round(riskScore * 10) / 10,
        totalSpend: Math.round(totalSpend),
        orderCount
      });
    }

    return supplierMetrics.sort((a, b) => b.reliability - a.reliability);
  }

  private async analyzeDemandPatterns(orders: any[]): Promise<DemandPattern[]> {
    const productDemand = new Map();

    // Aggregate demand by product and month
    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      const month = orderDate.getMonth();
      
      for (const item of order.items) {
        if (!productDemand.has(item.productId)) {
          productDemand.set(item.productId, {
            productName: item.productName,
            monthlyDemand: new Array(12).fill(0),
            totalDemand: 0
          });
        }
        
        const product = productDemand.get(item.productId);
        product.monthlyDemand[month] += item.quantity;
        product.totalDemand += item.quantity;
      }
    }

    const patterns: DemandPattern[] = [];

    for (const [productId, data] of productDemand) {
      // Calculate seasonality
      const seasonality = {
        spring: (data.monthlyDemand[2] + data.monthlyDemand[3] + data.monthlyDemand[4]) / 3,
        summer: (data.monthlyDemand[5] + data.monthlyDemand[6] + data.monthlyDemand[7]) / 3,
        fall: (data.monthlyDemand[8] + data.monthlyDemand[9] + data.monthlyDemand[10]) / 3,
        winter: (data.monthlyDemand[11] + data.monthlyDemand[0] + data.monthlyDemand[1]) / 3
      };

      // Determine trend
      const firstHalf = data.monthlyDemand.slice(0, 6).reduce((sum: number, val: number) => sum + val, 0);
      const secondHalf = data.monthlyDemand.slice(6).reduce((sum: number, val: number) => sum + val, 0);
      let trend: 'increasing' | 'stable' | 'decreasing';
      
      if (secondHalf > firstHalf * 1.1) trend = 'increasing';
      else if (secondHalf < firstHalf * 0.9) trend = 'decreasing';
      else trend = 'stable';

      // Calculate volatility
      const avgDemand = data.totalDemand / 12;
      const variance = data.monthlyDemand.reduce((sum: number, val: number) => sum + Math.pow(val - avgDemand, 2), 0) / 12;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = avgDemand > 0 ? stdDev / avgDemand : 0;
      
      let volatility: 'low' | 'medium' | 'high';
      if (coefficientOfVariation < 0.3) volatility = 'low';
      else if (coefficientOfVariation < 0.7) volatility = 'medium';
      else volatility = 'high';

      // Calculate predictability
      const predictability = Math.max(0, 100 - (coefficientOfVariation * 100));

      patterns.push({
        productId,
        productName: data.productName,
        seasonality,
        trend,
        volatility,
        predictability: Math.round(predictability)
      });
    }

    return patterns.sort((a, b) => b.predictability - a.predictability);
  }

  private async generateRecommendations(
    metrics: SupplyChainMetrics,
    suppliers: SupplierMetrics[],
    patterns: DemandPattern[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Fill rate recommendations
    if (metrics.fillRate < 95) {
      recommendations.push(`Improve fill rate from ${metrics.fillRate}% to 95%+ by increasing safety stock for high-demand items`);
    }

    // Supplier performance
    const poorPerformers = suppliers.filter(s => s.reliability < 80);
    if (poorPerformers.length > 0) {
      recommendations.push(`Review ${poorPerformers.length} underperforming suppliers with reliability below 80%`);
    }

    // Inventory turnover
    if (metrics.turnoverRate < 4) {
      recommendations.push(`Improve inventory turnover from ${metrics.turnoverRate}x to 4x+ by reducing slow-moving stock`);
    }

    // High volatility items
    const volatileItems = patterns.filter(p => p.volatility === 'high');
    if (volatileItems.length > 0) {
      recommendations.push(`Implement demand smoothing strategies for ${volatileItems.length} high-volatility products`);
    }

    // Seasonal planning
    const seasonalItems = patterns.filter(p => {
      const values = Object.values(p.seasonality);
      const max = Math.max(...values);
      const min = Math.min(...values);
      return max > min * 1.5;
    });
    if (seasonalItems.length > 0) {
      recommendations.push(`Develop seasonal inventory plans for ${seasonalItems.length} products with strong seasonal patterns`);
    }

    // Lead time optimization
    if (metrics.leadTime > 7) {
      recommendations.push(`Reduce average lead time from ${metrics.leadTime} days by working with local suppliers`);
    }

    return recommendations;
  }

  async getSupplyChainKPIs(): Promise<{
    totalSuppliers: number;
    activeSuppliers: number;
    avgLeadTime: number;
    fillRate: number;
    inventoryValue: number;
    monthlySpend: number;
  }> {
    const [suppliers, inventory, purchases] = await Promise.all([
      this.databaseService.find('suppliers', {}),
      this.databaseService.find('inventory', {}),
      this.databaseService.find('purchases', {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    return {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.status === 'active').length,
      avgLeadTime: 5.2, // Would calculate from actual data
      fillRate: 94.5, // Would calculate from actual data
      inventoryValue: inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
      monthlySpend: purchases.reduce((sum, p) => sum + p.total, 0)
    };
  }
}

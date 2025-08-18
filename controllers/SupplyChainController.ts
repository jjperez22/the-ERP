// controllers/SupplyChainController.ts
import { Controller, Get, Post, Put, Injectable, Body, Param, Query } from '@varld/warp';
import { DatabaseService } from '../services/DatabaseService';
import { NotificationService } from '../services/NotificationService';
import { SupplyChainAnalyticsEngine } from '../src/services/SupplyChainAnalyticsEngine';
import { SupplyChainOptimizer } from '../src/services/SupplyChainOptimizer';

@Injectable()
@Controller('/api/supply-chain')
export class SupplyChainController {
  constructor(
    private databaseService: DatabaseService,
    private notificationService: NotificationService,
    private analyticsEngine: SupplyChainAnalyticsEngine,
    private optimizer: SupplyChainOptimizer
  ) {}

  @Get('/analytics/performance')
  async getSupplyChainPerformance(@Query() query: any) {
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/analytics/kpis')
  async getSupplyChainKPIs() {
    try {
      const kpis = await this.analyticsEngine.getSupplyChainKPIs();

      return {
        success: true,
        data: kpis
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/optimization/recommendations')
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/optimization/reorder-points')
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/optimization/supplier-selection')
  async optimizeSupplierSelection(@Body() request: { productId: string }) {
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/automation/purchase-orders')
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/automation/execute-orders')
  async executeAutomaticOrders(@Body() request: { orderIds: string[], approved: boolean }) {
    try {
      const { orderIds, approved } = request;

      if (!approved) {
        return { success: false, error: 'Orders must be approved before execution' };
      }

      const autoOrders = await this.optimizer.generateAutomaticPurchaseOrders();
      const ordersToExecute = autoOrders.slice(0, orderIds.length);

      const createdPurchases = [];

      for (const order of ordersToExecute) {
        // Create purchase order
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

        // This would normally call the PurchaseController
        // For now, we'll simulate the creation
        const purchase = {
          id: this.generateId(),
          ...purchaseData,
          status: 'pending',
          createdAt: new Date()
        };

        await this.databaseService.create('purchases', purchase);
        createdPurchases.push(purchase);

        // Send notification
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/risk-assessment/suppliers')
  async getSupplierRiskAssessment() {
    try {
      const timeframe = {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const performance = await this.analyticsEngine.analyzeSupplyChainPerformance(timeframe);
      
      // Classify suppliers by risk
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/cost-analysis/spend-overview')
  async getSpendAnalysis(@Query() query: any) {
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

      // Calculate spend by supplier
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
          spendPercentage: 0 // Will be calculated after total is known
        };
      });

      const totalSpend = spendBySupplier.reduce((sum, s) => sum + s.totalSpend, 0);
      
      // Calculate percentages
      spendBySupplier.forEach(supplier => {
        supplier.spendPercentage = totalSpend > 0 ? (supplier.totalSpend / totalSpend) * 100 : 0;
      });

      // Sort by spend
      spendBySupplier.sort((a, b) => b.totalSpend - a.totalSpend);

      return {
        success: true,
        data: {
          spendBySupplier: spendBySupplier.slice(0, 10), // Top 10
          summary: {
            totalSpend,
            supplierCount: suppliers.length,
            activeSuppliers: spendBySupplier.filter(s => s.totalSpend > 0).length,
            averageSpendPerSupplier: suppliers.length > 0 ? totalSpend / suppliers.length : 0,
            top3Suppliers: spendBySupplier.slice(0, 3)
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/alerts/setup')
  async setupSupplyChainAlerts(@Body() alertConfig: {
    lowStockThreshold: number;
    leadTimeThreshold: number;
    supplierPerformanceThreshold: number;
    enabled: boolean;
  }) {
    try {
      // Save alert configuration
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private generateId(): string {
    return 'sc_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

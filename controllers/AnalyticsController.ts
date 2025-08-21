
// controllers/AnalyticsController.ts
// Simple analytics controller
export class AnalyticsController {
  async getDashboardData(): Promise<any> {
    return {
      metrics: {
        ordersThisMonth: 42,
        revenueThisMonth: 125000,
        lowStockItems: 8,
        activeCustomers: 156
      },
      trends: {
        salesGrowth: 12.5,
        customerGrowth: 8.3
      }
    };
  }

  async getSalesPerformance(): Promise<any> {
    return {
      revenue: 125000,
      growth: '+12.5%',
      topProducts: [
        { name: 'Portland Cement', sales: 25000 },
        { name: 'Steel Rebar', sales: 18500 }
      ]
    };
  }
}

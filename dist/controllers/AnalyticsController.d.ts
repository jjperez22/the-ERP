import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
export declare class AnalyticsController {
    private database;
    private ai;
    constructor(database: DatabaseService, ai: AIService);
    getDashboardData(filters?: any): Promise<any>;
    getSalesPerformance(params: {
        startDate?: string;
        endDate?: string;
        groupBy?: 'day' | 'week' | 'month';
    }): Promise<any>;
    getInventoryOptimization(): Promise<any>;
    getCustomerInsights(): Promise<any>;
    private calculateSalesGrowth;
    private getTopSellingProducts;
    private getCustomerActivityTrends;
}
//# sourceMappingURL=AnalyticsController.d.ts.map
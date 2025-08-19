import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';
interface AIInsight {
    id: string;
    type: 'demand_forecast' | 'inventory_optimization' | 'price_intelligence' | 'customer_churn' | 'supplier_risk' | 'seasonal_trend';
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    confidence: number;
    actionable: boolean;
    recommendations: string[];
    data: any;
    createdAt: Date;
    expiresAt?: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}
interface InsightRequest {
    type: string;
    context: any;
    timeframe?: string;
    filters?: any;
}
export declare class AIInsightController {
    private databaseService;
    private aiService;
    private notificationService;
    constructor(databaseService: DatabaseService, aiService: AIService, notificationService: NotificationService);
    getAllInsights(query: any): Promise<{
        success: boolean;
        data: AIInsight[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        pagination?: undefined;
    }>;
    getDashboardInsights(): Promise<{
        success: boolean;
        data: {
            critical: AIInsight[];
            warnings: AIInsight[];
            actionable: AIInsight[];
            summary: {
                total_unacknowledged: number;
                critical_count: number;
                warning_count: number;
                actionable_count: number;
            };
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    generateInsights(request: InsightRequest): Promise<{
        success: boolean;
        data: any[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    acknowledgeInsight(id: string, acknowledgeData: {
        acknowledgedBy: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        data: {
            acknowledged: boolean;
            acknowledgedBy: string;
            acknowledgedAt: Date;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    getInsightAnalytics(query: any): Promise<{
        success: boolean;
        data: {
            total_insights: number;
            by_type: Record<string, number>;
            by_severity: Record<string, number>;
            acknowledged_rate: number;
            average_confidence: number;
            actionable_insights: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    private groupBy;
    private generateId;
}
export {};
//# sourceMappingURL=AIInsightController.d.ts.map
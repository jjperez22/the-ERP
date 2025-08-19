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
export declare class SupplyChainAnalyticsEngine {
    private databaseService;
    constructor(databaseService: DatabaseService);
    analyzeSupplyChainPerformance(timeframe: {
        start: Date;
        end: Date;
    }): Promise<{
        overallMetrics: SupplyChainMetrics;
        supplierAnalysis: SupplierMetrics[];
        demandPatterns: DemandPattern[];
        recommendations: string[];
    }>;
    private calculateOverallMetrics;
    private analyzeSuppliers;
    private analyzeDemandPatterns;
    private generateRecommendations;
    getSupplyChainKPIs(): Promise<{
        totalSuppliers: number;
        activeSuppliers: number;
        avgLeadTime: number;
        fillRate: number;
        inventoryValue: number;
        monthlySpend: number;
    }>;
}
export {};
//# sourceMappingURL=SupplyChainAnalyticsEngine.d.ts.map
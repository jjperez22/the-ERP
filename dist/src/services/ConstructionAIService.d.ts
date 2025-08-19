export interface ConstructionMarketData {
    materialCategory: string;
    currentPrice: number;
    priceVolatility: number;
    seasonalFactor: number;
    supplyChainRisk: 'low' | 'medium' | 'high';
    demandTrend: 'decreasing' | 'stable' | 'increasing';
    weatherImpact: number;
    economicIndicators: {
        housingStarts: number;
        constructionSpending: number;
        interestRates: number;
    };
}
export interface SmartPricingRecommendation {
    productId: string;
    currentPrice: number;
    recommendedPrice: number;
    confidence: number;
    reasoning: string;
    marketFactors: string[];
    competitiveBenchmark: number;
    profitMargin: number;
    demandElasticity: number;
}
export interface PredictiveMaintenanceAlert {
    equipmentId: string;
    equipmentType: string;
    riskScore: number;
    predictedFailureDate: Date;
    maintenanceRecommendations: string[];
    costAvoidance: number;
    criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}
export declare class ConstructionAIService {
    private openai;
    private marketDataCache;
    private priceModels;
    constructor();
    private initializePricingModels;
    private startMarketDataUpdates;
    generateSmartPricingRecommendations(productIds: string[]): Promise<SmartPricingRecommendation[]>;
    private generatePricingRecommendation;
    generateSeasonalDemandForecast(category: string, horizon?: number): Promise<any>;
    analyzeSupplierRisk(supplierId: string): Promise<any>;
    optimizeInventoryLevels(locationId: string): Promise<any>;
    private optimizeProductInventory;
    generateProjectMaterialRequirements(projectData: any): Promise<any>;
    private enhanceWithPricingData;
    private getProductData;
    private getMarketData;
    private fallbackPricingRecommendation;
    private fallbackSeasonalForecast;
    private updateMarketData;
    private generateInventoryOptimizationSummary;
    private getEstimatedLeadTime;
    private getHistoricalDemandData;
    private getSupplierData;
    private fallbackSupplierRiskAnalysis;
    private getInventoryData;
    private getDemandForecasts;
    private fallbackProjectRequirements;
}
//# sourceMappingURL=ConstructionAIService.d.ts.map
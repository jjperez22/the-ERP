import { Product, DemandForecast, AIInsight } from '../models/DataModels';
export declare class AIService {
    private openaiKey;
    constructor();
    generateSKU(productData: Partial<Product>): Promise<string>;
    suggestPrice(productData: Partial<Product>): Promise<number>;
    generateDemandForecast(productId: string, horizon?: number): Promise<DemandForecast[]>;
    private simulateDemandPrediction;
    private identifyForecastFactors;
    generateInventoryRecommendations(productId: string): Promise<AIInsight[]>;
    predictCustomerChurn(customerId: string): Promise<{
        churnProbability: number;
        riskFactors: string[];
        recommendations: string[];
    }>;
    optimizeSupplyChain(): Promise<AIInsight[]>;
}
//# sourceMappingURL=AIService.d.ts.map
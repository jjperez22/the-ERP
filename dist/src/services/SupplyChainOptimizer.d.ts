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
export declare class SupplyChainOptimizer {
    private databaseService;
    private analyticsEngine;
    constructor(databaseService: DatabaseService, analyticsEngine: SupplyChainAnalyticsEngine);
    generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]>;
    private generateReorderRecommendations;
    private generateSupplierOptimizationRecommendations;
    private generateConsolidationRecommendations;
    private generateSafetyStockRecommendations;
    calculateOptimalReorderPoint(inventoryItem: any): Promise<ReorderPoint>;
    private calculateReorderSavings;
    optimizeSupplierSelection(productId: string): Promise<{
        currentSupplier: any;
        recommendedSupplier: any;
        savings: number;
        reasoning: string;
    }>;
    generateAutomaticPurchaseOrders(): Promise<any[]>;
}
export {};
//# sourceMappingURL=SupplyChainOptimizer.d.ts.map
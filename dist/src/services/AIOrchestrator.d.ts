import { AIInsight } from '../models/DataModels';
import { EventEmitter } from 'events';
export interface AIContext {
    userRole: string;
    companySize: 'small' | 'midsize' | 'enterprise';
    industry: 'construction' | 'distribution' | 'manufacturing';
    preferences: Record<string, any>;
}
export declare class AIOrchestrator extends EventEmitter {
    private openai;
    private aiModels;
    private activeInsights;
    constructor();
    private initializeAIModels;
    private startRealTimeProcessing;
    generateComprehensiveInsights(context: AIContext): Promise<AIInsight[]>;
    getDemandForecasts(context: AIContext): Promise<AIInsight[]>;
    getInventoryOptimization(context: AIContext): Promise<AIInsight[]>;
    getCustomerIntelligence(context: AIContext): Promise<AIInsight[]>;
    getSupplyChainOptimization(context: AIContext): Promise<AIInsight[]>;
    getProjectIntelligence(context: AIContext): Promise<AIInsight[]>;
    getMarketIntelligence(context: AIContext): Promise<AIInsight[]>;
    private prioritizeInsights;
    private calculateInsightScore;
    private getTypePriorityForCompany;
    private calculateSeverity;
    private processRealTimeInsights;
    private processCriticalAlerts;
}
//# sourceMappingURL=AIOrchestrator.d.ts.map
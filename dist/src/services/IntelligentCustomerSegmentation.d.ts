import { EventEmitter } from 'events';
export interface CustomerSegment {
    id: string;
    name: string;
    description: string;
    characteristics: SegmentCharacteristics;
    customerCount: number;
    averageValue: number;
    churnRate: number;
    profitability: number;
    growthPotential: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
    recommendedStrategies: SegmentStrategy[];
    createdAt: Date;
    updatedAt: Date;
}
export interface SegmentCharacteristics {
    demographics: {
        businessType: string[];
        companySize: string[];
        yearlyRevenue: {
            min: number;
            max: number;
        };
        employeeCount: {
            min: number;
            max: number;
        };
        geography: string[];
    };
    behaviorPatterns: {
        orderFrequency: 'low' | 'medium' | 'high';
        orderValue: 'low' | 'medium' | 'high';
        seasonality: string[];
        preferredProducts: string[];
        paymentBehavior: 'excellent' | 'good' | 'poor';
        communicationPreference: string[];
    };
    engagementMetrics: {
        interactionFrequency: number;
        responseRate: number;
        satisfactionScore: number;
        loyaltyIndex: number;
        referralRate: number;
    };
}
export interface SegmentStrategy {
    type: 'pricing' | 'marketing' | 'service' | 'retention' | 'acquisition';
    strategy: string;
    description: string;
    expectedImpact: string;
    estimatedROI: number;
    implementationEffort: 'low' | 'medium' | 'high';
    priority: number;
    timeline: string;
}
export interface CustomerProfile {
    customerId: string;
    segmentId: string;
    segmentConfidence: number;
    riskFactors: RiskFactor[];
    opportunities: CustomerOpportunity[];
    personalizedRecommendations: PersonalizedRecommendation[];
    churnPrediction: ChurnPrediction;
    valueScore: number;
    loyaltyScore: number;
    lastAnalyzed: Date;
}
export interface RiskFactor {
    type: 'payment' | 'engagement' | 'competition' | 'satisfaction' | 'economic';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    mitigation: string;
    probability: number;
}
export interface CustomerOpportunity {
    type: 'upsell' | 'cross_sell' | 'retention' | 'expansion' | 'loyalty';
    description: string;
    estimatedValue: number;
    probability: number;
    timeframe: string;
    requiredActions: string[];
    priority: number;
}
export interface PersonalizedRecommendation {
    category: 'pricing' | 'product' | 'service' | 'communication' | 'timing';
    recommendation: string;
    reasoning: string;
    expectedOutcome: string;
    confidence: number;
    priority: number;
}
export interface ChurnPrediction {
    churnProbability: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyIndicators: string[];
    timeToChurn: number;
    preventionActions: string[];
    retentionStrategies: string[];
    estimatedLostValue: number;
}
export interface SegmentationModel {
    id: string;
    name: string;
    algorithm: 'kmeans' | 'hierarchical' | 'dbscan' | 'gaussian_mixture';
    features: string[];
    parameters: Record<string, any>;
    accuracy: number;
    silhouetteScore: number;
    lastTrained: Date;
    trainingData: {
        customerCount: number;
        featureCount: number;
        trainingDuration: number;
    };
}
export interface SegmentPerformanceMetrics {
    segmentId: string;
    metrics: {
        revenue: {
            current: number;
            growth: number;
            trend: 'up' | 'down' | 'stable';
        };
        profitability: {
            current: number;
            growth: number;
            trend: 'up' | 'down' | 'stable';
        };
        customerCount: {
            current: number;
            growth: number;
            trend: 'up' | 'down' | 'stable';
        };
        churnRate: {
            current: number;
            change: number;
            trend: 'up' | 'down' | 'stable';
        };
        satisfactionScore: {
            current: number;
            change: number;
            trend: 'up' | 'down' | 'stable';
        };
        engagementScore: {
            current: number;
            change: number;
            trend: 'up' | 'down' | 'stable';
        };
    };
    benchmarks: {
        industryAverage: number;
        topQuartile: number;
        competitorComparison: number;
    };
    recommendations: string[];
    lastUpdated: Date;
}
export interface PricingStrategy {
    segmentId: string;
    strategy: 'value_based' | 'competitive' | 'premium' | 'economy' | 'dynamic';
    basePrice: number;
    discountRange: {
        min: number;
        max: number;
    };
    priceElasticity: number;
    sensitivityFactors: string[];
    recommendations: PricingRecommendation[];
    expectedImpact: {
        revenueChange: number;
        volumeChange: number;
        profitChange: number;
    };
}
export interface PricingRecommendation {
    productCategory: string;
    currentPrice: number;
    recommendedPrice: number;
    reasoning: string;
    confidence: number;
    expectedResult: string;
}
export declare class IntelligentCustomerSegmentation extends EventEmitter {
    private openai;
    private segments;
    private customerProfiles;
    private segmentationModels;
    private performanceMetrics;
    private pricingStrategies;
    private mlEngine;
    private churnPredictor;
    private personalizationEngine;
    constructor();
    private initializeCustomerSegmentation;
    private createInitialSegments;
    private initializeMLModels;
    analyzeCustomer(customerId: string, customerData: any): Promise<CustomerProfile>;
    retrainSegmentationModels(): Promise<void>;
    generateSegmentStrategies(segmentId: string): Promise<SegmentStrategy[]>;
    optimizePricingForSegment(segmentId: string): Promise<PricingStrategy>;
    trackSegmentPerformance(): Promise<SegmentPerformanceMetrics[]>;
    private extractCustomerFeatures;
    private identifyCustomerOpportunities;
    private identifyRiskFactors;
    private calculateValueScore;
    private calculateLoyaltyScore;
    private createSegment;
    private collectTrainingData;
    private reanalyzeAllCustomers;
    private parseStrategies;
    private parsePricingRecommendations;
    private calculateSegmentMetrics;
    private generatePerformanceInsights;
    private startContinuousLearning;
    private startAutomatedAnalysis;
    private processNewCustomers;
    getSegments(): CustomerSegment[];
    getCustomerProfiles(): CustomerProfile[];
    getSegmentationModels(): SegmentationModel[];
    getPricingStrategies(): PricingStrategy[];
    getCustomerRecommendations(customerId: string): Promise<PersonalizedRecommendation[]>;
    getSegmentInsights(segmentId: string): Promise<any>;
    getSystemStats(): any;
}
//# sourceMappingURL=IntelligentCustomerSegmentation.d.ts.map
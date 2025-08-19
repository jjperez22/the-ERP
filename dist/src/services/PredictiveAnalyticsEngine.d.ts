import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
export interface PredictionResult {
    prediction: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    factors: PredictionFactor[];
    timestamp: Date;
}
export interface PredictionFactor {
    name: string;
    impact: number;
    importance: number;
}
export interface MarketSignal {
    signal: string;
    strength: number;
    timeframe: string;
    impact: 'bullish' | 'bearish' | 'neutral';
}
export interface NeuralNetworkModel {
    model: tf.Sequential;
    accuracy: number;
    lastTrained: Date;
    version: string;
}
export declare class PredictiveAnalyticsEngine extends EventEmitter {
    private models;
    private dataBuffer;
    private realtimeProcessors;
    private marketSignals;
    constructor();
    private initializeNeuralNetworks;
    predictDemand(productId: string, horizon?: number): Promise<PredictionResult>;
    predictPrice(productId: string, marketConditions: any): Promise<PredictionResult>;
    optimizeInventory(locationId: string): Promise<any>;
    detectAnomalies(dataType: string, data: any[]): Promise<any[]>;
    generateMarketInsights(): Promise<any>;
    private startRealtimeProcessing;
    private processRealtimeData;
    private setupMarketSignalDetection;
    private prepareDemandFeatures;
    private preparePriceFeatures;
    private prepareInventoryFeatures;
    private analyzeTrend;
    private identifyDemandFactors;
    private fetchRealtimeData;
    private calculateAnomalyThreshold;
    private calculateAnomalyScore;
    private analyzePriceTrend;
    private identifyPriceFactors;
    private getInventoryTimeSeries;
    private generateInventoryRecommendation;
    private calculatePotentialSavings;
    private explainAnomaly;
    private retrainModels;
    private detectMarketSignals;
    private analyzeMarketTrends;
    private analyzePriceMovements;
    private analyzeDemandShifts;
    private identifySeasonalPatterns;
    private gatherCompetitiveIntelligence;
    private identifyRiskFactors;
    private identifyOpportunities;
    private detectPriceBreakout;
    private detectDemandSurge;
    private detectSupplyDisruption;
    private detectSeasonalShift;
}
//# sourceMappingURL=PredictiveAnalyticsEngine.d.ts.map
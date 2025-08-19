import { EventEmitter } from 'events';
export interface DashboardMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
    status: 'healthy' | 'warning' | 'critical';
    threshold: MetricThreshold;
    history: MetricDataPoint[];
    predictedValue?: number;
    aiInsights: string[];
    lastUpdated: Date;
}
export interface MetricThreshold {
    warning: number;
    critical: number;
    direction: 'above' | 'below';
}
export interface MetricDataPoint {
    timestamp: Date;
    value: number;
    anomalyScore?: number;
}
export interface AnomalyAlert {
    id: string;
    metricId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'spike' | 'drop' | 'pattern_change' | 'threshold_breach' | 'ai_detected';
    description: string;
    detectedAt: Date;
    currentValue: number;
    expectedValue: number;
    confidence: number;
    suggestedActions: string[];
    isResolved: boolean;
    resolvedAt?: Date;
}
export interface PredictiveAlert {
    id: string;
    title: string;
    description: string;
    predictedTime: Date;
    probability: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    category: 'inventory' | 'finance' | 'operations' | 'customer' | 'supplier';
    preventionActions: string[];
    estimatedCost: number;
}
export interface DashboardWidget {
    id: string;
    type: 'metric' | 'chart' | 'table' | 'alert' | 'ai_insight' | 'prediction';
    title: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: Record<string, any>;
    data: any;
    isVisible: boolean;
    priority: number;
    adaptiveSettings: AdaptiveSettings;
}
export interface AdaptiveSettings {
    showBasedOnRole: string[];
    hideWhenNotRelevant: boolean;
    autoResize: boolean;
    alertThreshold: number;
    refreshInterval: number;
}
export interface UserBehaviorPattern {
    userId: string;
    mostViewedMetrics: string[];
    timeSpentOnWidgets: Record<string, number>;
    interactionPatterns: string[];
    preferredTimeframe: string;
    alertPreferences: Record<string, boolean>;
    dashboardPersonalization: Record<string, any>;
}
export interface AIVisualizationSuggestion {
    widgetType: string;
    dataSource: string;
    reason: string;
    confidence: number;
    priority: number;
    suggestedPosition: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export declare class RealTimeMonitoringDashboard extends EventEmitter {
    private openai;
    private metrics;
    private widgets;
    private anomalyAlerts;
    private predictiveAlerts;
    private userBehaviorPatterns;
    private aiVisualizationEngine;
    private anomalyDetector;
    private realTimeStreams;
    constructor();
    private initializeMetrics;
    private initializeDefaultWidgets;
    private setupRealTimeStreams;
    private startAnomalyDetection;
    private initializePredictiveAlerts;
    updateMetricValue(metricId: string, newValue: number): Promise<void>;
    private calculateTrend;
    private calculateMetricStatus;
    private generateAIInsights;
    private predictNextValue;
    private checkThresholdBreach;
    private generateThresholdActions;
    private handleAnomalyDetection;
    private generatePredictiveAlerts;
    private simulateRevenueData;
    private simulateOrdersData;
    private simulateInventoryData;
    private simulateCashFlowData;
    private simulateCustomerSatisfactionData;
    private simulateSupplierPerformanceData;
    addMetric(metric: Partial<DashboardMetric>): void;
    addWidget(widget: Partial<DashboardWidget>): void;
    getMetrics(): DashboardMetric[];
    getWidgets(): DashboardWidget[];
    getAnomalyAlerts(limit?: number): AnomalyAlert[];
    getPredictiveAlerts(limit?: number): PredictiveAlert[];
    adaptDashboardForUser(userId: string, userRole: string): Promise<DashboardWidget[]>;
    private adaptWidget;
    getDashboardStats(): any;
}
//# sourceMappingURL=RealTimeMonitoringDashboard.d.ts.map
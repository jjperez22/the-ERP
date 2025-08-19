import { SecurityOrchestrationEngine } from '../services/SecurityOrchestrationEngine';
import { GeoLocation, DeviceFingerprint } from '../services/types/Security';
export declare class SecurityController {
    private securityEngine;
    constructor(securityEngine: SecurityOrchestrationEngine);
    startMonitoring(): Promise<{
        success: boolean;
        message: string;
    }>;
    stopMonitoring(): Promise<{
        success: boolean;
        message: string;
    }>;
    recordLoginAttempt(loginData: {
        userId: string;
        userEmail: string;
        ipAddress: string;
        userAgent: string;
        success: boolean;
        location?: GeoLocation;
        deviceFingerprint?: DeviceFingerprint;
        failureReason?: string;
    }): Promise<{
        success: boolean;
        data: any;
        blocked: any;
        alerts: any;
        riskLevel: any;
    }>;
    recordTransaction(transactionData: {
        userId: string;
        ipAddress: string;
        userAgent: string;
        amount: number;
        currency: string;
        merchant?: string;
        category?: string;
        location?: GeoLocation;
    }): Promise<{
        success: boolean;
        data: any;
        blocked: any;
        fraudScore: any;
        alerts: any;
        riskLevel: any;
    }>;
    getSecurityDashboard(userId?: string): Promise<any>;
    getUserSecurityProfile(userId: string): Promise<any>;
    getActiveAlerts(filters: {
        severity?: string;
        type?: string;
        userId?: string;
        category?: string;
    }): Promise<any>;
    getCriticalAlerts(): Promise<any>;
    acknowledgeAlert(alertId: string, data: {
        userId?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    resolveAlert(alertId: string, data: {
        resolution: 'resolved' | 'false_positive';
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getThreatIntelligence(query: {
        type?: string;
        threatLevel?: string;
        source?: string;
        limit?: number;
    }): Promise<{
        threats: any;
        statistics: any;
    }>;
    checkIPReputation(data: {
        ipAddress: string;
    }): Promise<{
        ipAddress: string;
        isThreat: boolean;
        threatLevel: string;
        message: string;
    }>;
    getUserRiskAssessment(userId: string): Promise<any>;
    getSecurityEvents(filters: {
        userId?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<{
        events: any;
        statistics: any;
    }>;
    getUserSecurityEvents(userId: string, options: {
        days?: number;
        limit?: number;
    }): Promise<{
        events: any;
        summary: any;
    }>;
    getSecurityConfiguration(): Promise<{
        fraudDetection: {
            enabled: boolean;
            maxTransactionAmount: number;
            maxDailyTransactions: number;
            geoFencing: boolean;
            deviceTracking: boolean;
        };
        behaviorAnalysis: {
            enabled: boolean;
            learningPeriod: number;
            anomalyThreshold: number;
        };
        alerting: {
            enabled: boolean;
            emailNotifications: boolean;
            realTimeAlerts: boolean;
        };
        threatIntelligence: {
            enabled: boolean;
            updateInterval: number;
            autoBlock: boolean;
        };
    }>;
    updateSecurityConfiguration(config: any): Promise<{
        success: boolean;
        message: string;
    }>;
    simulateLoginAttack(data: {
        targetUserId: string;
        attackerIP: string;
        attemptCount: number;
    }): Promise<{
        success: boolean;
        simulation: {
            totalAttempts: number;
            blockedAttempts: number;
            alertsGenerated: any;
            detectionRate: string;
        };
        message: string;
    }>;
    simulateFraudTransaction(data: {
        userId: string;
        amount: number;
        merchant?: string;
    }): Promise<{
        success: boolean;
        simulation: {
            blocked: any;
            fraudScore: any;
            alertsGenerated: any;
            riskLevel: any;
        };
        message: string;
    }>;
    getSecurityStatistics(days?: number): Promise<{
        period: string;
        summary: any;
        alerts: any;
        events: any;
        threats: any;
    }>;
    getSecurityHealth(): Promise<{
        status: string;
        components: {
            monitoring: any;
            threatIntelligence: string;
            fraudDetection: string;
            behaviorAnalysis: string;
            alerting: string;
        };
        metrics: {
            activeAlerts: any;
            criticalAlerts: any;
            threatIndicators: any;
            processingLatency: string;
            uptime: string;
        };
        lastUpdate: string;
        message?: undefined;
    } | {
        status: string;
        message: string;
        components?: undefined;
        metrics?: undefined;
        lastUpdate?: undefined;
    }>;
}
//# sourceMappingURL=SecurityController.d.ts.map
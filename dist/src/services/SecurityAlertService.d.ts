import { EventEmitter } from 'events';
import { DatabaseService } from '../../services/DatabaseService';
import { NotificationService } from '../../services/NotificationService';
import { SecurityAlert, SecurityEvent, FraudIndicator } from './types/Security';
export declare class SecurityAlertService extends EventEmitter {
    private databaseService;
    private notificationService;
    private activeAlerts;
    private alertRules;
    constructor(databaseService: DatabaseService, notificationService: NotificationService);
    createAlert(alertData: Omit<SecurityAlert, 'id' | 'detectedAt' | 'status'>): Promise<SecurityAlert>;
    createBehaviorAnomalyAlert(userId: string, event: SecurityEvent, anomalyData: {
        anomalyScore: number;
        reasons: string[];
    }): Promise<SecurityAlert>;
    createFraudAlert(userId: string, event: SecurityEvent, fraudData: {
        riskScore: number;
        indicators: FraudIndicator[];
    }): Promise<SecurityAlert>;
    createSecurityBreachAlert(userId: string, event: SecurityEvent, breachData: {
        type: string;
        description: string;
        severity: string;
    }): Promise<SecurityAlert>;
    acknowledgeAlert(alertId: string, userId?: string): Promise<boolean>;
    resolveAlert(alertId: string, resolution: 'resolved' | 'false_positive'): Promise<boolean>;
    getActiveAlerts(filters?: {
        severity?: string[];
        type?: string[];
        userId?: string;
        category?: string[];
    }): Promise<SecurityAlert[]>;
    getCriticalAlerts(): Promise<SecurityAlert[]>;
    getAlertsByUser(userId: string): Promise<SecurityAlert[]>;
    getAlertHistory(days?: number): Promise<SecurityAlert[]>;
    getAlertStatistics(days?: number): Promise<any>;
    private sendAlertNotifications;
    private calculateSeverityFromScore;
    private calculateImpact;
    private getCategoryFromEventType;
    private generateRecommendedActions;
    private generateFraudRecommendations;
    private generateBreachRecommendations;
    private calculateAverageResolutionTime;
    private loadActiveAlerts;
    private initializeAlertRules;
    private generateId;
}
//# sourceMappingURL=SecurityAlertService.d.ts.map
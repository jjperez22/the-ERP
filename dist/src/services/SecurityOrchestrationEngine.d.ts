import { EventEmitter } from 'events';
import { DatabaseService } from '../../services/DatabaseService';
import { BehaviorAnalysisService } from './BehaviorAnalysisService';
import { FraudDetectionService } from './FraudDetectionService';
import { SecurityAlertService } from './SecurityAlertService';
import { RiskAssessmentService } from './RiskAssessmentService';
import { SecurityEventService } from './SecurityEventService';
import { ThreatIntelligenceService } from './ThreatIntelligenceService';
import { SecurityEvent, SecurityAlert, RiskAssessment, GeoLocation, DeviceFingerprint, SecurityConfig } from './types/Security';
export declare class SecurityOrchestrationEngine extends EventEmitter {
    private databaseService;
    private behaviorAnalysisService;
    private fraudDetectionService;
    private securityAlertService;
    private riskAssessmentService;
    private securityEventService;
    private threatIntelligenceService;
    private isMonitoring;
    private config;
    constructor(databaseService: DatabaseService, behaviorAnalysisService: BehaviorAnalysisService, fraudDetectionService: FraudDetectionService, securityAlertService: SecurityAlertService, riskAssessmentService: RiskAssessmentService, securityEventService: SecurityEventService, threatIntelligenceService: ThreatIntelligenceService);
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;
    processSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'riskScore'>): Promise<{
        event: SecurityEvent;
        riskAssessment?: RiskAssessment;
        alerts: SecurityAlert[];
        blocked: boolean;
    }>;
    recordLoginAttempt(userId: string, userEmail: string, ipAddress: string, userAgent: string, success: boolean, location?: GeoLocation, deviceFingerprint?: DeviceFingerprint, failureReason?: string): Promise<any>;
    recordTransaction(userId: string, ipAddress: string, userAgent: string, amount: number, currency: string, merchant?: string, category?: string, location?: GeoLocation): Promise<any>;
    getSecurityDashboard(userId?: string): Promise<any>;
    getUserSecurityProfile(userId: string): Promise<any>;
    updateSecurityConfiguration(newConfig: Partial<SecurityConfig>): Promise<void>;
    private checkThreatIntelligence;
    private analyzeBehavior;
    private analyzeFraud;
    private initializeConfiguration;
    private setupEventHandlers;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=SecurityOrchestrationEngine.d.ts.map
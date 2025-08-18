// src/services/SecurityOrchestrationEngine.ts
import { Injectable } from '@varld/warp';
import { EventEmitter } from 'events';
import { DatabaseService } from '../../services/DatabaseService';
import { BehaviorAnalysisService } from './BehaviorAnalysisService';
import { FraudDetectionService } from './FraudDetectionService';
import { SecurityAlertService } from './SecurityAlertService';
import { RiskAssessmentService } from './RiskAssessmentService';
import { SecurityEventService } from './SecurityEventService';
import { ThreatIntelligenceService } from './ThreatIntelligenceService';
import { 
  SecurityEvent, 
  SecurityAlert, 
  RiskAssessment, 
  GeoLocation, 
  DeviceFingerprint, 
  SecurityConfig 
} from './types/Security';

@Injectable()
export class SecurityOrchestrationEngine extends EventEmitter {
  private isMonitoring: boolean = false;
  private config: SecurityConfig;

  constructor(
    private databaseService: DatabaseService,
    private behaviorAnalysisService: BehaviorAnalysisService,
    private fraudDetectionService: FraudDetectionService,
    private securityAlertService: SecurityAlertService,
    private riskAssessmentService: RiskAssessmentService,
    private securityEventService: SecurityEventService,
    private threatIntelligenceService: ThreatIntelligenceService
  ) {
    super();
    this.initializeConfiguration();
    this.setupEventHandlers();
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Security monitoring is already active');
      return;
    }

    console.log('🔐 Starting Advanced Security & Fraud Detection system...');
    this.isMonitoring = true;

    // Initialize threat intelligence feeds
    await this.threatIntelligenceService.updateThreatFeeds();

    this.emit('monitoring_started', { timestamp: new Date() });
    console.log('✅ Security monitoring system started successfully');
  }

  async stopMonitoring(): Promise<void> {
    console.log('🛑 Stopping security monitoring system...');
    this.isMonitoring = false;
    this.emit('monitoring_stopped', { timestamp: new Date() });
    console.log('✅ Security monitoring system stopped');
  }

  async processSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'riskScore'>): Promise<{
    event: SecurityEvent;
    riskAssessment?: RiskAssessment;
    alerts: SecurityAlert[];
    blocked: boolean;
  }> {
    try {
      if (!this.isMonitoring) {
        throw new Error('Security monitoring is not active');
      }

      // Step 1: Record the security event
      const event = await this.securityEventService.recordSecurityEvent(eventData);
      
      const results = {
        event,
        riskAssessment: undefined as RiskAssessment | undefined,
        alerts: [] as SecurityAlert[],
        blocked: false
      };

      // Step 2: Check threat intelligence first
      const threatCheck = await this.checkThreatIntelligence(event);
      if (threatCheck.blocked) {
        results.blocked = true;
        const threatAlert = await this.securityAlertService.createSecurityBreachAlert(
          event.userId,
          event,
          {
            type: 'threat_detected',
            description: `Threat detected: ${threatCheck.reason}`,
            severity: 'critical'
          }
        );
        results.alerts.push(threatAlert);
        return results;
      }

      // Step 3: Parallel analysis for performance
      const [behaviorAnalysis, fraudAnalysis] = await Promise.all([
        this.analyzeBehavior(event),
        this.analyzeFraud(event)
      ]);

      // Step 4: Update event with anomaly flags
      if (behaviorAnalysis.isAnomalous || fraudAnalysis.isFraudulent) {
        event.flaggedAsAnomaly = true;
        event.riskScore = Math.max(
          behaviorAnalysis.anomalyScore * 100,
          fraudAnalysis.riskScore * 100
        );
      }

      // Step 5: Create alerts if needed
      if (behaviorAnalysis.isAnomalous) {
        const behaviorAlert = await this.securityAlertService.createBehaviorAnomalyAlert(
          event.userId,
          event,
          behaviorAnalysis
        );
        results.alerts.push(behaviorAlert);
      }

      if (fraudAnalysis.isFraudulent) {
        const fraudAlert = await this.securityAlertService.createFraudAlert(
          event.userId,
          event,
          fraudAnalysis
        );
        results.alerts.push(fraudAlert);
        
        // Auto-block critical fraud
        if (fraudAnalysis.riskScore > 0.9) {
          results.blocked = true;
        }
      }

      // Step 6: Calculate risk assessment
      const recentEvents = await this.securityEventService.getRecentUserEvents(event.userId, 24);
      const behaviorProfile = await this.behaviorAnalysisService.getUserProfile(event.userId);
      
      const riskAssessment = await this.riskAssessmentService.calculateUserRisk(
        event.userId,
        recentEvents,
        behaviorProfile
      );
      results.riskAssessment = riskAssessment;

      // Step 7: Additional security actions based on risk level
      if (riskAssessment.overallRisk === 'very_high') {
        results.blocked = true;
        const riskAlert = await this.securityAlertService.createSecurityBreachAlert(
          event.userId,
          event,
          {
            type: 'high_risk_user',
            description: `User risk level is very high (${riskAssessment.riskScore})`,
            severity: 'high'
          }
        );
        results.alerts.push(riskAlert);
      }

      // Step 8: Emit events for real-time monitoring
      this.emit('security_event_processed', {
        event,
        riskAssessment,
        alerts: results.alerts,
        blocked: results.blocked
      });

      if (results.alerts.length > 0) {
        this.emit('security_alerts_generated', results.alerts);
      }

      console.log(`🔍 Processed security event: ${event.type} for user ${event.userId} (Risk: ${riskAssessment.overallRisk})`);
      return results;

    } catch (error) {
      console.error('Error processing security event:', error);
      throw error;
    }
  }

  async recordLoginAttempt(
    userId: string,
    userEmail: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    location?: GeoLocation,
    deviceFingerprint?: DeviceFingerprint,
    failureReason?: string
  ): Promise<any> {
    return this.processSecurityEvent({
      type: 'login_attempt',
      userId,
      userEmail,
      ipAddress,
      userAgent,
      success,
      location,
      deviceFingerprint,
      metadata: {
        failureReason: failureReason || null
      }
    });
  }

  async recordTransaction(
    userId: string,
    ipAddress: string,
    userAgent: string,
    amount: number,
    currency: string,
    merchant?: string,
    category?: string,
    location?: GeoLocation
  ): Promise<any> {
    return this.processSecurityEvent({
      type: 'transaction',
      userId,
      ipAddress,
      userAgent,
      success: true,
      location,
      metadata: {
        amount: amount.toString(),
        currency,
        merchant,
        category: category || 'general'
      }
    });
  }

  async getSecurityDashboard(userId?: string): Promise<any> {
    try {
      const [
        activeAlerts,
        criticalAlerts,
        recentEvents,
        threatStats,
        alertStats
      ] = await Promise.all([
        this.securityAlertService.getActiveAlerts(userId ? { userId } : undefined),
        this.securityAlertService.getCriticalAlerts(),
        this.securityEventService.getSecurityEvents({ limit: 100 }),
        this.threatIntelligenceService.getThreatStatistics(),
        this.securityAlertService.getAlertStatistics()
      ]);

      return {
        summary: {
          activeAlerts: activeAlerts.length,
          criticalAlerts: criticalAlerts.length,
          recentEvents: recentEvents.length,
          threatIndicators: threatStats.total || 0,
          systemStatus: this.isMonitoring ? 'active' : 'inactive'
        },
        alerts: {
          active: activeAlerts.slice(0, 10),
          critical: criticalAlerts,
          statistics: alertStats
        },
        threats: {
          statistics: threatStats,
          recentIndicators: (await this.threatIntelligenceService.getThreatFeeds()).slice(0, 10)
        },
        events: {
          recent: recentEvents.slice(0, 20),
          statistics: await this.securityEventService.getSecurityEventStatistics()
        }
      };

    } catch (error) {
      console.error('Error getting security dashboard:', error);
      throw error;
    }
  }

  async getUserSecurityProfile(userId: string): Promise<any> {
    try {
      const [
        behaviorProfile,
        riskAssessment,
        userAlerts,
        userEvents,
        activitySummary
      ] = await Promise.all([
        this.behaviorAnalysisService.getUserProfile(userId),
        this.riskAssessmentService.calculateUserRisk(userId, [], undefined),
        this.securityAlertService.getAlertsByUser(userId),
        this.securityEventService.getRecentUserEvents(userId, 168), // 7 days
        this.securityEventService.getUserActivitySummary(userId, 30)
      ]);

      return {
        userId,
        behaviorProfile,
        riskAssessment,
        alerts: {
          active: userAlerts.filter(a => a.status === 'open'),
          total: userAlerts.length
        },
        activity: {
          recentEvents: userEvents.slice(0, 50),
          summary: activitySummary
        }
      };

    } catch (error) {
      console.error('Error getting user security profile:', error);
      throw error;
    }
  }

  async updateSecurityConfiguration(newConfig: Partial<SecurityConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.databaseService.update('security_config', { id: 'main' }, this.config);
    
    this.emit('configuration_updated', this.config);
    console.log('⚙️ Security configuration updated');
  }

  private async checkThreatIntelligence(event: SecurityEvent): Promise<{ blocked: boolean; reason?: string }> {
    try {
      // Check IP reputation
      const ipCheck = await this.threatIntelligenceService.checkIPReputation(event.ipAddress);
      if (ipCheck.isThreat && (ipCheck.threatLevel === 'critical' || ipCheck.threatLevel === 'high')) {
        return { blocked: true, reason: `Malicious IP: ${event.ipAddress}` };
      }

      // Additional threat checks can be added here
      return { blocked: false };

    } catch (error) {
      console.error('Error checking threat intelligence:', error);
      return { blocked: false };
    }
  }

  private async analyzeBehavior(event: SecurityEvent): Promise<{ isAnomalous: boolean; anomalyScore: number; reasons: string[] }> {
    if (!this.config.behaviorAnalysis.enabled) {
      return { isAnomalous: false, anomalyScore: 0, reasons: [] };
    }

    return await this.behaviorAnalysisService.analyzeEvent(event);
  }

  private async analyzeFraud(event: SecurityEvent): Promise<{ isFraudulent: boolean; riskScore: number; indicators: any[] }> {
    if (!this.config.fraudDetection.enabled) {
      return { isFraudulent: false, riskScore: 0, indicators: [] };
    }

    return await this.fraudDetectionService.analyzeTransaction(event);
  }

  private initializeConfiguration(): void {
    this.config = {
      fraudDetection: {
        enabled: true,
        maxTransactionAmount: 50000,
        maxDailyTransactions: 20,
        maxVelocity: 10,
        geoFencing: true,
        deviceTracking: true
      },
      behaviorAnalysis: {
        enabled: true,
        learningPeriod: 30,
        anomalyThreshold: 0.7,
        profileUpdateInterval: 6
      },
      alerting: {
        enabled: true,
        emailNotifications: true,
        slackNotifications: false,
        smsNotifications: true,
        realTimeAlerts: true
      },
      threatIntelligence: {
        enabled: true,
        updateInterval: 6,
        sources: ['internal', 'external_feeds'],
        autoBlock: true
      }
    };
  }

  private setupEventHandlers(): void {
    // Listen to alert service events
    this.securityAlertService.on('alert_created', (alert: SecurityAlert) => {
      this.emit('security_alert', alert);
    });

    this.securityAlertService.on('alert_resolved', (data: any) => {
      this.emit('alert_resolved', data);
    });

    console.log('🔗 Security event handlers initialized');
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    await this.stopMonitoring();
    await this.securityEventService.cleanup();
    await this.threatIntelligenceService.cleanup();
    console.log('🧹 SecurityOrchestrationEngine cleanup completed');
  }
}

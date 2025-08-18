// src/services/SecurityAlertService.ts
import { Injectable } from '@varld/warp';
import { EventEmitter } from 'events';
import { DatabaseService } from '../../services/DatabaseService';
import { NotificationService } from '../../services/NotificationService';
import { SecurityAlert, SecurityEvent, FraudIndicator } from './types/Security';

@Injectable()
export class SecurityAlertService extends EventEmitter {
  private activeAlerts: Map<string, SecurityAlert> = new Map();
  private alertRules: Map<string, any> = new Map();

  constructor(
    private databaseService: DatabaseService,
    private notificationService: NotificationService
  ) {
    super();
    this.initializeAlertRules();
    this.loadActiveAlerts();
  }

  async createAlert(alertData: Omit<SecurityAlert, 'id' | 'detectedAt' | 'status'>): Promise<SecurityAlert> {
    try {
      const alert: SecurityAlert = {
        id: this.generateId(),
        ...alertData,
        detectedAt: new Date(),
        status: 'open'
      };

      // Store in database
      await this.databaseService.create('security_alerts', alert);
      
      // Cache the alert
      this.activeAlerts.set(alert.id, alert);

      // Send notifications based on severity
      await this.sendAlertNotifications(alert);

      // Emit alert event
      this.emit('alert_created', alert);

      console.log(`🚨 Security alert created: ${alert.title} (${alert.severity})`);
      return alert;

    } catch (error) {
      console.error('Error creating security alert:', error);
      throw error;
    }
  }

  async createBehaviorAnomalyAlert(
    userId: string, 
    event: SecurityEvent, 
    anomalyData: { anomalyScore: number; reasons: string[] }
  ): Promise<SecurityAlert> {
    const severity = this.calculateSeverityFromScore(anomalyData.anomalyScore);
    const impact = this.calculateImpact(event, anomalyData.anomalyScore);

    return this.createAlert({
      type: 'behavioral_anomaly',
      severity,
      title: 'Behavioral Anomaly Detected',
      description: `Unusual behavior detected for user ${userId}: ${anomalyData.reasons.join(', ')}`,
      userId,
      relatedEvents: [event.id],
      riskScore: Math.round(anomalyData.anomalyScore * 100),
      confidence: Math.round(anomalyData.anomalyScore * 100),
      recommendedActions: this.generateRecommendedActions(event, anomalyData),
      impact,
      category: this.getCategoryFromEventType(event.type)
    });
  }

  async createFraudAlert(
    userId: string,
    event: SecurityEvent,
    fraudData: { riskScore: number; indicators: FraudIndicator[] }
  ): Promise<SecurityAlert> {
    const severity = fraudData.riskScore > 0.8 ? 'critical' : fraudData.riskScore > 0.6 ? 'high' : 'medium';
    const impact = fraudData.riskScore > 0.9 ? 'critical' : fraudData.riskScore > 0.7 ? 'high' : 'medium';

    const indicatorDescriptions = fraudData.indicators
      .filter(i => i.exceeded)
      .map(i => i.description);

    return this.createAlert({
      type: 'fraud_detection',
      severity: severity as any,
      title: 'Fraudulent Transaction Detected',
      description: `Potential fraud detected for user ${userId}: ${indicatorDescriptions.join(', ')}`,
      userId,
      relatedEvents: [event.id],
      riskScore: Math.round(fraudData.riskScore * 100),
      confidence: Math.round(fraudData.riskScore * 100),
      recommendedActions: this.generateFraudRecommendations(fraudData.indicators),
      impact: impact as any,
      category: 'financial'
    });
  }

  async createSecurityBreachAlert(
    userId: string,
    event: SecurityEvent,
    breachData: { type: string; description: string; severity: string }
  ): Promise<SecurityAlert> {
    return this.createAlert({
      type: 'security_breach',
      severity: breachData.severity as any,
      title: `Security Breach: ${breachData.type}`,
      description: breachData.description,
      userId,
      relatedEvents: [event.id],
      riskScore: breachData.severity === 'critical' ? 95 : breachData.severity === 'high' ? 80 : 60,
      confidence: 90,
      recommendedActions: this.generateBreachRecommendations(breachData.type),
      impact: breachData.severity as any,
      category: 'system_integrity'
    });
  }

  async acknowledgeAlert(alertId: string, userId?: string): Promise<boolean> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        return false;
      }

      alert.status = 'investigating';
      if (userId) {
        alert.assignedTo = userId;
      }

      // Update in database
      await this.databaseService.update('security_alerts', { id: alertId }, {
        status: alert.status,
        assignedTo: alert.assignedTo
      });

      this.emit('alert_acknowledged', alert);
      console.log(`✅ Alert acknowledged: ${alert.title}`);

      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  async resolveAlert(alertId: string, resolution: 'resolved' | 'false_positive'): Promise<boolean> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        return false;
      }

      alert.status = resolution;
      
      // Update in database
      await this.databaseService.update('security_alerts', { id: alertId }, {
        status: alert.status,
        resolvedAt: new Date()
      });

      // Remove from active alerts if resolved
      if (resolution === 'resolved' || resolution === 'false_positive') {
        this.activeAlerts.delete(alertId);
      }

      this.emit('alert_resolved', { alert, resolution });
      console.log(`✅ Alert resolved: ${alert.title} (${resolution})`);

      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  async getActiveAlerts(filters?: {
    severity?: string[];
    type?: string[];
    userId?: string;
    category?: string[];
  }): Promise<SecurityAlert[]> {
    let alerts = Array.from(this.activeAlerts.values());

    if (filters) {
      if (filters.severity && filters.severity.length > 0) {
        alerts = alerts.filter(alert => filters.severity!.includes(alert.severity));
      }
      if (filters.type && filters.type.length > 0) {
        alerts = alerts.filter(alert => filters.type!.includes(alert.type));
      }
      if (filters.userId) {
        alerts = alerts.filter(alert => alert.userId === filters.userId);
      }
      if (filters.category && filters.category.length > 0) {
        alerts = alerts.filter(alert => filters.category!.includes(alert.category));
      }
    }

    return alerts.sort((a, b) => {
      // Sort by severity first, then by detection time
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return b.detectedAt.getTime() - a.detectedAt.getTime();
    });
  }

  async getCriticalAlerts(): Promise<SecurityAlert[]> {
    return this.getActiveAlerts({ severity: ['critical'] });
  }

  async getAlertsByUser(userId: string): Promise<SecurityAlert[]> {
    return this.getActiveAlerts({ userId });
  }

  async getAlertHistory(days: number = 30): Promise<SecurityAlert[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return await this.databaseService.find('security_alerts', {
        detectedAt: { $gte: cutoffDate }
      }, { sort: { detectedAt: -1 } });
    } catch (error) {
      console.error('Error getting alert history:', error);
      return [];
    }
  }

  async getAlertStatistics(days: number = 30): Promise<any> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const alerts = await this.databaseService.find('security_alerts', {
        detectedAt: { $gte: cutoffDate }
      });

      const stats = {
        total: alerts.length,
        bySeverity: {
          critical: alerts.filter(a => a.severity === 'critical').length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length,
          info: alerts.filter(a => a.severity === 'info').length
        },
        byType: {
          fraud_detection: alerts.filter(a => a.type === 'fraud_detection').length,
          behavioral_anomaly: alerts.filter(a => a.type === 'behavioral_anomaly').length,
          security_breach: alerts.filter(a => a.type === 'security_breach').length,
          unauthorized_access: alerts.filter(a => a.type === 'unauthorized_access').length,
          data_leak: alerts.filter(a => a.type === 'data_leak').length,
          suspicious_transaction: alerts.filter(a => a.type === 'suspicious_transaction').length
        },
        byStatus: {
          open: alerts.filter(a => a.status === 'open').length,
          investigating: alerts.filter(a => a.status === 'investigating').length,
          resolved: alerts.filter(a => a.status === 'resolved').length,
          false_positive: alerts.filter(a => a.status === 'false_positive').length
        },
        avgResolutionTime: this.calculateAverageResolutionTime(alerts),
        period: `${days} days`
      };

      return stats;
    } catch (error) {
      console.error('Error getting alert statistics:', error);
      return {
        total: 0,
        bySeverity: {},
        byType: {},
        byStatus: {},
        avgResolutionTime: 0,
        period: `${days} days`
      };
    }
  }

  private async sendAlertNotifications(alert: SecurityAlert): Promise<void> {
    try {
      const notificationTitle = `Security Alert: ${alert.title}`;
      const notificationMessage = `${alert.description} (Risk Score: ${alert.riskScore})`;

      // Send different notifications based on severity
      if (alert.severity === 'critical') {
        // Send immediate notifications for critical alerts
        await this.notificationService.sendNotification({
          userId: 'admin',
          type: 'security_alert',
          title: `🚨 CRITICAL: ${notificationTitle}`,
          message: notificationMessage,
          priority: 'high',
          channels: ['email', 'sms', 'push']
        });
      } else if (alert.severity === 'high') {
        await this.notificationService.sendNotification({
          userId: 'admin',
          type: 'security_alert',
          title: `⚠️ HIGH: ${notificationTitle}`,
          message: notificationMessage,
          priority: 'medium',
          channels: ['email', 'push']
        });
      } else {
        await this.notificationService.sendNotification({
          userId: 'admin',
          type: 'security_alert',
          title: notificationTitle,
          message: notificationMessage,
          priority: 'low',
          channels: ['push']
        });
      }
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }

  private calculateSeverityFromScore(score: number): 'info' | 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    if (score >= 0.3) return 'low';
    return 'info';
  }

  private calculateImpact(event: SecurityEvent, score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (event.type === 'transaction' && score > 0.8) return 'critical';
    if (event.type === 'system_access' && score > 0.7) return 'high';
    if (score > 0.6) return 'medium';
    return 'low';
  }

  private getCategoryFromEventType(eventType: string): SecurityAlert['category'] {
    const mapping = {
      login_attempt: 'authentication',
      transaction: 'financial',
      data_access: 'data_access',
      permission_change: 'authorization',
      system_access: 'system_integrity',
      file_access: 'data_access'
    };
    return mapping[eventType] || 'system_integrity';
  }

  private generateRecommendedActions(event: SecurityEvent, anomalyData: any): string[] {
    const actions: string[] = [];

    if (anomalyData.reasons.some((r: string) => r.includes('location'))) {
      actions.push('Verify user location and require additional authentication');
      actions.push('Consider temporarily blocking account until verification');
    }

    if (anomalyData.reasons.some((r: string) => r.includes('device'))) {
      actions.push('Require device re-authentication');
      actions.push('Send security notification to user');
    }

    if (anomalyData.reasons.some((r: string) => r.includes('time'))) {
      actions.push('Verify unusual login time with user');
    }

    if (event.type === 'transaction') {
      actions.push('Review transaction details for legitimacy');
      actions.push('Consider temporary payment restrictions');
    }

    if (actions.length === 0) {
      actions.push('Investigate user activity patterns');
      actions.push('Monitor subsequent user actions');
    }

    return actions;
  }

  private generateFraudRecommendations(indicators: FraudIndicator[]): string[] {
    const actions: string[] = [];

    const hasAmountIndicator = indicators.some(i => i.type === 'amount');
    const hasVelocityIndicator = indicators.some(i => i.type === 'velocity');
    const hasLocationIndicator = indicators.some(i => i.type === 'location');

    if (hasAmountIndicator) {
      actions.push('Immediately freeze transaction and verify with cardholder');
      actions.push('Review transaction amount against user profile');
    }

    if (hasVelocityIndicator) {
      actions.push('Implement temporary transaction velocity limits');
      actions.push('Require additional authentication for subsequent transactions');
    }

    if (hasLocationIndicator) {
      actions.push('Block IP address and require location verification');
      actions.push('Notify user of suspicious location access');
    }

    actions.push('Add transaction to manual review queue');
    actions.push('Update user risk profile and monitoring rules');

    return actions;
  }

  private generateBreachRecommendations(breachType: string): string[] {
    const actions: string[] = [];

    switch (breachType) {
      case 'data_exfiltration':
        actions.push('Immediately revoke user access credentials');
        actions.push('Audit data access logs for scope of breach');
        actions.push('Notify affected parties and compliance team');
        break;
      case 'unauthorized_system_access':
        actions.push('Disable compromised account immediately');
        actions.push('Force password reset for all related accounts');
        actions.push('Review system access logs');
        break;
      case 'malware_detection':
        actions.push('Isolate affected systems');
        actions.push('Run comprehensive security scan');
        actions.push('Update security definitions');
        break;
      default:
        actions.push('Investigate security incident thoroughly');
        actions.push('Implement additional monitoring');
    }

    return actions;
  }

  private calculateAverageResolutionTime(alerts: SecurityAlert[]): number {
    const resolvedAlerts = alerts.filter(a => 
      (a.status === 'resolved' || a.status === 'false_positive') && 
      a.detectedAt && (a as any).resolvedAt
    );

    if (resolvedAlerts.length === 0) return 0;

    const totalResolutionTime = resolvedAlerts.reduce((sum, alert) => {
      const resolutionTime = ((alert as any).resolvedAt?.getTime() || Date.now()) - alert.detectedAt.getTime();
      return sum + resolutionTime;
    }, 0);

    return Math.round(totalResolutionTime / resolvedAlerts.length / (1000 * 60 * 60)); // Hours
  }

  private async loadActiveAlerts(): Promise<void> {
    try {
      const alerts = await this.databaseService.find('security_alerts', {
        status: { $in: ['open', 'investigating'] }
      });

      for (const alert of alerts) {
        this.activeAlerts.set(alert.id, alert);
      }

      console.log(`🔐 Loaded ${alerts.length} active security alerts`);
    } catch (error) {
      console.error('Error loading active alerts:', error);
    }
  }

  private initializeAlertRules(): void {
    // Initialize alert severity and escalation rules
    this.alertRules.set('critical_auto_escalate', true);
    this.alertRules.set('high_notify_admin', true);
    this.alertRules.set('fraud_auto_block', true);
    this.alertRules.set('breach_immediate_response', true);
  }

  private generateId(): string {
    return 'alert_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

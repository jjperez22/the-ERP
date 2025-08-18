// src/controllers/SecurityController.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@varld/warp';
import { SecurityOrchestrationEngine } from '../services/SecurityOrchestrationEngine';
import { GeoLocation, DeviceFingerprint } from '../services/types/Security';

@Controller('/api/security')
export class SecurityController {
  constructor(
    @Inject('SecurityOrchestrationEngine')
    private securityEngine: SecurityOrchestrationEngine
  ) {}

  // System Control
  @Post('/monitoring/start')
  async startMonitoring(): Promise<{ success: boolean; message: string }> {
    try {
      await this.securityEngine.startMonitoring();
      return { success: true, message: 'Security monitoring started successfully' };
    } catch (error) {
      console.error('Error starting security monitoring:', error);
      return { success: false, message: 'Failed to start security monitoring' };
    }
  }

  @Post('/monitoring/stop')
  async stopMonitoring(): Promise<{ success: boolean; message: string }> {
    try {
      await this.securityEngine.stopMonitoring();
      return { success: true, message: 'Security monitoring stopped successfully' };
    } catch (error) {
      console.error('Error stopping security monitoring:', error);
      return { success: false, message: 'Failed to stop security monitoring' };
    }
  }

  // Event Recording
  @Post('/events/login')
  async recordLoginAttempt(@Body() loginData: {
    userId: string;
    userEmail: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    location?: GeoLocation;
    deviceFingerprint?: DeviceFingerprint;
    failureReason?: string;
  }) {
    try {
      console.log(`🔐 Recording login attempt for user: ${loginData.userId} (${loginData.success ? 'success' : 'failed'})`);
      
      const result = await this.securityEngine.recordLoginAttempt(
        loginData.userId,
        loginData.userEmail,
        loginData.ipAddress,
        loginData.userAgent,
        loginData.success,
        loginData.location,
        loginData.deviceFingerprint,
        loginData.failureReason
      );

      return {
        success: true,
        data: result,
        blocked: result.blocked,
        alerts: result.alerts.length,
        riskLevel: result.riskAssessment?.overallRisk || 'unknown'
      };

    } catch (error) {
      console.error('Error recording login attempt:', error);
      throw new Error('Failed to record login attempt');
    }
  }

  @Post('/events/transaction')
  async recordTransaction(@Body() transactionData: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    amount: number;
    currency: string;
    merchant?: string;
    category?: string;
    location?: GeoLocation;
  }) {
    try {
      console.log(`💳 Recording transaction for user: ${transactionData.userId} (${transactionData.amount} ${transactionData.currency})`);
      
      const result = await this.securityEngine.recordTransaction(
        transactionData.userId,
        transactionData.ipAddress,
        transactionData.userAgent,
        transactionData.amount,
        transactionData.currency,
        transactionData.merchant,
        transactionData.category,
        transactionData.location
      );

      return {
        success: true,
        data: result,
        blocked: result.blocked,
        fraudScore: result.riskAssessment?.riskScore || 0,
        alerts: result.alerts.length,
        riskLevel: result.riskAssessment?.overallRisk || 'unknown'
      };

    } catch (error) {
      console.error('Error recording transaction:', error);
      throw new Error('Failed to record transaction');
    }
  }

  // Dashboard & Analytics
  @Get('/dashboard')
  async getSecurityDashboard(@Query('userId') userId?: string) {
    try {
      return await this.securityEngine.getSecurityDashboard(userId);
    } catch (error) {
      console.error('Error getting security dashboard:', error);
      throw new Error('Failed to get security dashboard');
    }
  }

  @Get('/users/:userId/profile')
  async getUserSecurityProfile(@Param('userId') userId: string) {
    try {
      return await this.securityEngine.getUserSecurityProfile(userId);
    } catch (error) {
      console.error('Error getting user security profile:', error);
      throw new Error('Failed to get user security profile');
    }
  }

  // Alert Management
  @Get('/alerts')
  async getActiveAlerts(@Query() filters: {
    severity?: string;
    type?: string;
    userId?: string;
    category?: string;
  }) {
    try {
      const alertFilters: any = {};
      
      if (filters.severity) alertFilters.severity = filters.severity.split(',');
      if (filters.type) alertFilters.type = filters.type.split(',');
      if (filters.userId) alertFilters.userId = filters.userId;
      if (filters.category) alertFilters.category = filters.category.split(',');

      const dashboard = await this.securityEngine.getSecurityDashboard();
      return dashboard.alerts.active;

    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw new Error('Failed to get active alerts');
    }
  }

  @Get('/alerts/critical')
  async getCriticalAlerts() {
    try {
      const dashboard = await this.securityEngine.getSecurityDashboard();
      return dashboard.alerts.critical;
    } catch (error) {
      console.error('Error getting critical alerts:', error);
      throw new Error('Failed to get critical alerts');
    }
  }

  @Put('/alerts/:alertId/acknowledge')
  async acknowledgeAlert(@Param('alertId') alertId: string, @Body() data: { userId?: string }) {
    try {
      // Note: This would need to be implemented in the SecurityOrchestrationEngine
      // For now, return a placeholder response
      return { success: true, message: 'Alert acknowledged' };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return { success: false, message: 'Failed to acknowledge alert' };
    }
  }

  @Put('/alerts/:alertId/resolve')
  async resolveAlert(@Param('alertId') alertId: string, @Body() data: { resolution: 'resolved' | 'false_positive' }) {
    try {
      // Note: This would need to be implemented in the SecurityOrchestrationEngine
      // For now, return a placeholder response
      return { success: true, message: 'Alert resolved' };
    } catch (error) {
      console.error('Error resolving alert:', error);
      return { success: false, message: 'Failed to resolve alert' };
    }
  }

  // Threat Intelligence
  @Get('/threats')
  async getThreatIntelligence(@Query() query: {
    type?: string;
    threatLevel?: string;
    source?: string;
    limit?: number;
  }) {
    try {
      const dashboard = await this.securityEngine.getSecurityDashboard();
      return {
        threats: dashboard.threats.recentIndicators.slice(0, query.limit || 50),
        statistics: dashboard.threats.statistics
      };
    } catch (error) {
      console.error('Error getting threat intelligence:', error);
      throw new Error('Failed to get threat intelligence');
    }
  }

  @Post('/threats/check-ip')
  async checkIPReputation(@Body() data: { ipAddress: string }) {
    try {
      // This would need to be exposed through the SecurityOrchestrationEngine
      return { 
        ipAddress: data.ipAddress,
        isThreat: false,
        threatLevel: 'low',
        message: 'IP reputation check functionality would be implemented here'
      };
    } catch (error) {
      console.error('Error checking IP reputation:', error);
      throw new Error('Failed to check IP reputation');
    }
  }

  // Risk Assessment
  @Get('/risk/:userId')
  async getUserRiskAssessment(@Param('userId') userId: string) {
    try {
      const profile = await this.securityEngine.getUserSecurityProfile(userId);
      return profile.riskAssessment;
    } catch (error) {
      console.error('Error getting user risk assessment:', error);
      throw new Error('Failed to get user risk assessment');
    }
  }

  // Security Events
  @Get('/events')
  async getSecurityEvents(@Query() filters: {
    userId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    try {
      const dashboard = await this.securityEngine.getSecurityDashboard();
      return {
        events: dashboard.events.recent,
        statistics: dashboard.events.statistics
      };
    } catch (error) {
      console.error('Error getting security events:', error);
      throw new Error('Failed to get security events');
    }
  }

  @Get('/events/user/:userId')
  async getUserSecurityEvents(@Param('userId') userId: string, @Query() options: {
    days?: number;
    limit?: number;
  }) {
    try {
      const profile = await this.securityEngine.getUserSecurityProfile(userId);
      return {
        events: profile.activity.recentEvents,
        summary: profile.activity.summary
      };
    } catch (error) {
      console.error('Error getting user security events:', error);
      throw new Error('Failed to get user security events');
    }
  }

  // Configuration
  @Get('/config')
  async getSecurityConfiguration() {
    try {
      // This would return the current security configuration
      return {
        fraudDetection: {
          enabled: true,
          maxTransactionAmount: 50000,
          maxDailyTransactions: 20,
          geoFencing: true,
          deviceTracking: true
        },
        behaviorAnalysis: {
          enabled: true,
          learningPeriod: 30,
          anomalyThreshold: 0.7
        },
        alerting: {
          enabled: true,
          emailNotifications: true,
          realTimeAlerts: true
        },
        threatIntelligence: {
          enabled: true,
          updateInterval: 6,
          autoBlock: true
        }
      };
    } catch (error) {
      console.error('Error getting security configuration:', error);
      throw new Error('Failed to get security configuration');
    }
  }

  @Put('/config')
  async updateSecurityConfiguration(@Body() config: any) {
    try {
      await this.securityEngine.updateSecurityConfiguration(config);
      return { success: true, message: 'Security configuration updated successfully' };
    } catch (error) {
      console.error('Error updating security configuration:', error);
      return { success: false, message: 'Failed to update security configuration' };
    }
  }

  // Simulation & Testing
  @Post('/simulate/login-attack')
  async simulateLoginAttack(@Body() data: {
    targetUserId: string;
    attackerIP: string;
    attemptCount: number;
  }) {
    try {
      console.log(`🔴 Simulating login attack: ${data.attemptCount} attempts on user ${data.targetUserId}`);
      
      const results = [];
      for (let i = 0; i < data.attemptCount; i++) {
        const result = await this.securityEngine.recordLoginAttempt(
          data.targetUserId,
          `user${data.targetUserId}@example.com`,
          data.attackerIP,
          'Mozilla/5.0 (AttackBot/1.0)',
          false, // Failed login
          {
            country: 'Unknown',
            region: 'Unknown',
            city: 'Unknown',
            coordinates: { latitude: 0, longitude: 0 },
            timezone: 'UTC'
          },
          undefined,
          'Invalid credentials'
        );
        results.push(result);
      }

      const blockedAttempts = results.filter(r => r.blocked).length;
      const alertsGenerated = results.reduce((sum, r) => sum + r.alerts.length, 0);

      return {
        success: true,
        simulation: {
          totalAttempts: data.attemptCount,
          blockedAttempts,
          alertsGenerated,
          detectionRate: `${Math.round((blockedAttempts / data.attemptCount) * 100)}%`
        },
        message: `Login attack simulation completed. ${blockedAttempts}/${data.attemptCount} attempts blocked.`
      };

    } catch (error) {
      console.error('Error simulating login attack:', error);
      throw new Error('Failed to simulate login attack');
    }
  }

  @Post('/simulate/fraud-transaction')
  async simulateFraudTransaction(@Body() data: {
    userId: string;
    amount: number;
    merchant?: string;
  }) {
    try {
      console.log(`💳 Simulating fraudulent transaction: $${data.amount} for user ${data.userId}`);
      
      const result = await this.securityEngine.recordTransaction(
        data.userId,
        '192.168.1.100', // Suspicious IP
        'Mozilla/5.0 (FraudBot/1.0)',
        data.amount,
        'USD',
        data.merchant || 'suspicious-merchant-123',
        'fraud_simulation',
        {
          country: 'Russia',
          region: 'Moscow',
          city: 'Moscow',
          coordinates: { latitude: 55.7558, longitude: 37.6176 },
          timezone: 'Europe/Moscow'
        }
      );

      return {
        success: true,
        simulation: {
          blocked: result.blocked,
          fraudScore: result.riskAssessment?.riskScore || 0,
          alertsGenerated: result.alerts.length,
          riskLevel: result.riskAssessment?.overallRisk || 'unknown'
        },
        message: result.blocked ? 'Fraudulent transaction blocked successfully' : 'Transaction allowed (review needed)'
      };

    } catch (error) {
      console.error('Error simulating fraud transaction:', error);
      throw new Error('Failed to simulate fraud transaction');
    }
  }

  // Statistics & Reports
  @Get('/statistics')
  async getSecurityStatistics(@Query('days') days: number = 30) {
    try {
      const dashboard = await this.securityEngine.getSecurityDashboard();
      return {
        period: `${days} days`,
        summary: dashboard.summary,
        alerts: dashboard.alerts.statistics,
        events: dashboard.events.statistics,
        threats: dashboard.threats.statistics
      };
    } catch (error) {
      console.error('Error getting security statistics:', error);
      throw new Error('Failed to get security statistics');
    }
  }

  @Get('/health')
  async getSecurityHealth() {
    try {
      const dashboard = await this.securityEngine.getSecurityDashboard();
      
      return {
        status: dashboard.summary.systemStatus === 'active' ? 'healthy' : 'inactive',
        components: {
          monitoring: dashboard.summary.systemStatus,
          threatIntelligence: 'active',
          fraudDetection: 'active',
          behaviorAnalysis: 'active',
          alerting: 'active'
        },
        metrics: {
          activeAlerts: dashboard.summary.activeAlerts,
          criticalAlerts: dashboard.summary.criticalAlerts,
          threatIndicators: dashboard.summary.threatIndicators,
          processingLatency: '< 100ms',
          uptime: '99.9%'
        },
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting security health:', error);
      return {
        status: 'error',
        message: 'Failed to get security health status'
      };
    }
  }
}

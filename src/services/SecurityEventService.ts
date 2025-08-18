// src/services/SecurityEventService.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';
import { SecurityEvent, GeoLocation, DeviceFingerprint, AuditLog } from './types/Security';

@Injectable()
export class SecurityEventService {
  private eventBuffer: SecurityEvent[] = [];
  private bufferFlushInterval: NodeJS.Timeout;
  private maxBufferSize: number = 100;

  constructor(private databaseService: DatabaseService) {
    // Flush buffer every 30 seconds
    this.bufferFlushInterval = setInterval(() => {
      this.flushEventBuffer();
    }, 30000);
  }

  async recordSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'riskScore'>): Promise<SecurityEvent> {
    try {
      const event: SecurityEvent = {
        id: this.generateId(),
        ...eventData,
        riskScore: 0, // Will be calculated later
        timestamp: eventData.timestamp || new Date()
      };

      // Add to buffer for batch processing
      this.eventBuffer.push(event);

      // Flush buffer if it gets too large
      if (this.eventBuffer.length >= this.maxBufferSize) {
        await this.flushEventBuffer();
      }

      console.log(`🔒 Security event recorded: ${event.type} for user ${event.userId}`);
      return event;

    } catch (error) {
      console.error('Error recording security event:', error);
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
  ): Promise<SecurityEvent> {
    return this.recordSecurityEvent({
      type: 'login_attempt',
      userId,
      userEmail,
      ipAddress,
      userAgent,
      success,
      location,
      deviceFingerprint,
      metadata: {
        failureReason: failureReason || null,
        sessionId: this.generateSessionId()
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
    paymentMethod?: string,
    success: boolean = true,
    location?: GeoLocation
  ): Promise<SecurityEvent> {
    return this.recordSecurityEvent({
      type: 'transaction',
      userId,
      ipAddress,
      userAgent,
      success,
      location,
      metadata: {
        amount: amount.toString(),
        currency,
        merchant,
        category: category || 'general',
        paymentMethod: paymentMethod || 'unknown',
        transactionId: this.generateTransactionId()
      }
    });
  }

  async recordDataAccess(
    userId: string,
    ipAddress: string,
    userAgent: string,
    resource: string,
    action: string,
    success: boolean,
    dataVolume?: number,
    location?: GeoLocation
  ): Promise<SecurityEvent> {
    return this.recordSecurityEvent({
      type: 'data_access',
      userId,
      ipAddress,
      userAgent,
      success,
      location,
      metadata: {
        resource,
        action,
        dataVolume: dataVolume || 0,
        accessTime: new Date().toISOString()
      }
    });
  }

  async recordSystemAccess(
    userId: string,
    ipAddress: string,
    userAgent: string,
    system: string,
    action: string,
    success: boolean,
    privilegeLevel?: string,
    location?: GeoLocation
  ): Promise<SecurityEvent> {
    return this.recordSecurityEvent({
      type: 'system_access',
      userId,
      ipAddress,
      userAgent,
      success,
      location,
      metadata: {
        system,
        action,
        privilegeLevel: privilegeLevel || 'user',
        accessTime: new Date().toISOString()
      }
    });
  }

  async recordPermissionChange(
    userId: string,
    targetUserId: string,
    ipAddress: string,
    userAgent: string,
    oldPermissions: string[],
    newPermissions: string[],
    success: boolean
  ): Promise<SecurityEvent> {
    return this.recordSecurityEvent({
      type: 'permission_change',
      userId,
      ipAddress,
      userAgent,
      success,
      metadata: {
        targetUserId,
        oldPermissions,
        newPermissions,
        changeType: this.determineChangeType(oldPermissions, newPermissions)
      }
    });
  }

  async recordFileAccess(
    userId: string,
    ipAddress: string,
    userAgent: string,
    filePath: string,
    action: 'read' | 'write' | 'delete' | 'download' | 'upload',
    success: boolean,
    fileSize?: number,
    location?: GeoLocation
  ): Promise<SecurityEvent> {
    return this.recordSecurityEvent({
      type: 'file_access',
      userId,
      ipAddress,
      userAgent,
      success,
      location,
      metadata: {
        filePath,
        action,
        fileSize: fileSize || 0,
        accessTime: new Date().toISOString()
      }
    });
  }

  async getSecurityEvents(filters: {
    userId?: string;
    type?: SecurityEvent['type'];
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    limit?: number;
  }): Promise<SecurityEvent[]> {
    try {
      const query: any = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.type) query.type = filters.type;
      if (filters.success !== undefined) query.success = filters.success;

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }

      const options: any = {
        sort: { timestamp: -1 }
      };

      if (filters.limit) {
        options.limit = filters.limit;
      }

      return await this.databaseService.find('security_events', query, options);

    } catch (error) {
      console.error('Error getting security events:', error);
      return [];
    }
  }

  async getRecentUserEvents(userId: string, hours: number = 24, limit: number = 100): Promise<SecurityEvent[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getSecurityEvents({
      userId,
      startDate,
      limit
    });
  }

  async getUserActivitySummary(userId: string, days: number = 7): Promise<any> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const events = await this.getSecurityEvents({
        userId,
        startDate
      });

      const summary = {
        totalEvents: events.length,
        eventsByType: {} as Record<string, number>,
        eventsByDay: {} as Record<string, number>,
        failedEvents: events.filter(e => !e.success).length,
        uniqueLocations: new Set<string>(),
        uniqueIPs: new Set<string>(),
        riskEvents: events.filter(e => e.flaggedAsAnomaly).length
      };

      events.forEach(event => {
        // Count by type
        summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;

        // Count by day
        const day = event.timestamp.toISOString().split('T')[0];
        summary.eventsByDay[day] = (summary.eventsByDay[day] || 0) + 1;

        // Track locations and IPs
        if (event.location) {
          summary.uniqueLocations.add(`${event.location.city}, ${event.location.country}`);
        }
        summary.uniqueIPs.add(event.ipAddress);
      });

      return {
        ...summary,
        uniqueLocations: Array.from(summary.uniqueLocations),
        uniqueIPs: Array.from(summary.uniqueIPs),
        period: `${days} days`
      };

    } catch (error) {
      console.error('Error getting user activity summary:', error);
      return null;
    }
  }

  async createAuditLog(auditData: Omit<AuditLog, 'id'>): Promise<AuditLog> {
    try {
      const auditLog: AuditLog = {
        id: this.generateId(),
        ...auditData,
        timestamp: auditData.timestamp || new Date()
      };

      await this.databaseService.create('audit_logs', auditLog);
      console.log(`📋 Audit log created: ${auditLog.action} by user ${auditLog.userId}`);

      return auditLog;

    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: 'info' | 'warning' | 'error';
    limit?: number;
  }): Promise<AuditLog[]> {
    try {
      const query: any = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.action) query.action = filters.action;
      if (filters.resource) query.resource = filters.resource;
      if (filters.severity) query.severity = filters.severity;

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }

      const options: any = {
        sort: { timestamp: -1 }
      };

      if (filters.limit) {
        options.limit = filters.limit;
      }

      return await this.databaseService.find('audit_logs', query, options);

    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  async getSecurityEventStatistics(days: number = 30): Promise<any> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const events = await this.getSecurityEvents({ startDate });

      const stats = {
        totalEvents: events.length,
        eventsByType: {} as Record<string, number>,
        failureRate: 0,
        anomalousEvents: 0,
        topIPs: {} as Record<string, number>,
        topUserAgents: {} as Record<string, number>,
        dailyActivity: {} as Record<string, number>
      };

      const failedEvents = events.filter(e => !e.success);
      stats.failureRate = events.length > 0 ? (failedEvents.length / events.length) * 100 : 0;
      stats.anomalousEvents = events.filter(e => e.flaggedAsAnomaly).length;

      events.forEach(event => {
        // Count by type
        stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;

        // Count by IP
        stats.topIPs[event.ipAddress] = (stats.topIPs[event.ipAddress] || 0) + 1;

        // Count by user agent
        const shortUA = event.userAgent.substring(0, 50);
        stats.topUserAgents[shortUA] = (stats.topUserAgents[shortUA] || 0) + 1;

        // Count by day
        const day = event.timestamp.toISOString().split('T')[0];
        stats.dailyActivity[day] = (stats.dailyActivity[day] || 0) + 1;
      });

      // Sort and limit top IPs and user agents
      const sortEntries = (obj: Record<string, number>) => 
        Object.entries(obj).sort(([,a], [,b]) => b - a).slice(0, 10);

      return {
        ...stats,
        failureRate: Math.round(stats.failureRate * 100) / 100,
        topIPs: Object.fromEntries(sortEntries(stats.topIPs)),
        topUserAgents: Object.fromEntries(sortEntries(stats.topUserAgents)),
        period: `${days} days`
      };

    } catch (error) {
      console.error('Error getting security event statistics:', error);
      return {};
    }
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const eventsToFlush = [...this.eventBuffer];
      this.eventBuffer = [];

      // Batch insert to database
      await this.databaseService.createMany('security_events', eventsToFlush);
      console.log(`💾 Flushed ${eventsToFlush.length} security events to database`);

    } catch (error) {
      console.error('Error flushing event buffer:', error);
      // Re-add events back to buffer on failure
      this.eventBuffer.unshift(...this.eventBuffer);
    }
  }

  private determineChangeType(oldPermissions: string[], newPermissions: string[]): string {
    const added = newPermissions.filter(p => !oldPermissions.includes(p));
    const removed = oldPermissions.filter(p => !newPermissions.includes(p));

    if (added.length > 0 && removed.length > 0) return 'modified';
    if (added.length > 0) return 'elevated';
    if (removed.length > 0) return 'reduced';
    return 'unchanged';
  }

  private generateId(): string {
    return 'event_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 12);
  }

  private generateTransactionId(): string {
    return 'tx_' + Math.random().toString(36).substr(2, 12);
  }

  // Cleanup method to be called on shutdown
  async cleanup(): Promise<void> {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }
    await this.flushEventBuffer();
    console.log('🧹 SecurityEventService cleanup completed');
  }
}

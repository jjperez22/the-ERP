import { DatabaseService } from '../../services/DatabaseService';
import { SecurityEvent, GeoLocation, DeviceFingerprint, AuditLog } from './types/Security';
export declare class SecurityEventService {
    private databaseService;
    private eventBuffer;
    private bufferFlushInterval;
    private maxBufferSize;
    constructor(databaseService: DatabaseService);
    recordSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'riskScore'>): Promise<SecurityEvent>;
    recordLoginAttempt(userId: string, userEmail: string, ipAddress: string, userAgent: string, success: boolean, location?: GeoLocation, deviceFingerprint?: DeviceFingerprint, failureReason?: string): Promise<SecurityEvent>;
    recordTransaction(userId: string, ipAddress: string, userAgent: string, amount: number, currency: string, merchant?: string, category?: string, paymentMethod?: string, success?: boolean, location?: GeoLocation): Promise<SecurityEvent>;
    recordDataAccess(userId: string, ipAddress: string, userAgent: string, resource: string, action: string, success: boolean, dataVolume?: number, location?: GeoLocation): Promise<SecurityEvent>;
    recordSystemAccess(userId: string, ipAddress: string, userAgent: string, system: string, action: string, success: boolean, privilegeLevel?: string, location?: GeoLocation): Promise<SecurityEvent>;
    recordPermissionChange(userId: string, targetUserId: string, ipAddress: string, userAgent: string, oldPermissions: string[], newPermissions: string[], success: boolean): Promise<SecurityEvent>;
    recordFileAccess(userId: string, ipAddress: string, userAgent: string, filePath: string, action: 'read' | 'write' | 'delete' | 'download' | 'upload', success: boolean, fileSize?: number, location?: GeoLocation): Promise<SecurityEvent>;
    getSecurityEvents(filters: {
        userId?: string;
        type?: SecurityEvent['type'];
        startDate?: Date;
        endDate?: Date;
        success?: boolean;
        limit?: number;
    }): Promise<SecurityEvent[]>;
    getRecentUserEvents(userId: string, hours?: number, limit?: number): Promise<SecurityEvent[]>;
    getUserActivitySummary(userId: string, days?: number): Promise<any>;
    createAuditLog(auditData: Omit<AuditLog, 'id'>): Promise<AuditLog>;
    getAuditLogs(filters: {
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        severity?: 'info' | 'warning' | 'error';
        limit?: number;
    }): Promise<AuditLog[]>;
    getSecurityEventStatistics(days?: number): Promise<any>;
    private flushEventBuffer;
    private determineChangeType;
    private generateId;
    private generateSessionId;
    private generateTransactionId;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=SecurityEventService.d.ts.map
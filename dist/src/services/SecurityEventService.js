"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityEventService = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../../services/DatabaseService");
let SecurityEventService = class SecurityEventService {
    databaseService;
    eventBuffer = [];
    bufferFlushInterval;
    maxBufferSize = 100;
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.bufferFlushInterval = setInterval(() => {
            this.flushEventBuffer();
        }, 30000);
    }
    async recordSecurityEvent(eventData) {
        try {
            const event = {
                id: this.generateId(),
                ...eventData,
                riskScore: 0,
                timestamp: eventData.timestamp || new Date()
            };
            this.eventBuffer.push(event);
            if (this.eventBuffer.length >= this.maxBufferSize) {
                await this.flushEventBuffer();
            }
            console.log(`🔒 Security event recorded: ${event.type} for user ${event.userId}`);
            return event;
        }
        catch (error) {
            console.error('Error recording security event:', error);
            throw error;
        }
    }
    async recordLoginAttempt(userId, userEmail, ipAddress, userAgent, success, location, deviceFingerprint, failureReason) {
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
    async recordTransaction(userId, ipAddress, userAgent, amount, currency, merchant, category, paymentMethod, success = true, location) {
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
    async recordDataAccess(userId, ipAddress, userAgent, resource, action, success, dataVolume, location) {
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
    async recordSystemAccess(userId, ipAddress, userAgent, system, action, success, privilegeLevel, location) {
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
    async recordPermissionChange(userId, targetUserId, ipAddress, userAgent, oldPermissions, newPermissions, success) {
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
    async recordFileAccess(userId, ipAddress, userAgent, filePath, action, success, fileSize, location) {
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
    async getSecurityEvents(filters) {
        try {
            const query = {};
            if (filters.userId)
                query.userId = filters.userId;
            if (filters.type)
                query.type = filters.type;
            if (filters.success !== undefined)
                query.success = filters.success;
            if (filters.startDate || filters.endDate) {
                query.timestamp = {};
                if (filters.startDate)
                    query.timestamp.$gte = filters.startDate;
                if (filters.endDate)
                    query.timestamp.$lte = filters.endDate;
            }
            const options = {
                sort: { timestamp: -1 }
            };
            if (filters.limit) {
                options.limit = filters.limit;
            }
            return await this.databaseService.find('security_events', query, options);
        }
        catch (error) {
            console.error('Error getting security events:', error);
            return [];
        }
    }
    async getRecentUserEvents(userId, hours = 24, limit = 100) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.getSecurityEvents({
            userId,
            startDate,
            limit
        });
    }
    async getUserActivitySummary(userId, days = 7) {
        try {
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const events = await this.getSecurityEvents({
                userId,
                startDate
            });
            const summary = {
                totalEvents: events.length,
                eventsByType: {},
                eventsByDay: {},
                failedEvents: events.filter(e => !e.success).length,
                uniqueLocations: new Set(),
                uniqueIPs: new Set(),
                riskEvents: events.filter(e => e.flaggedAsAnomaly).length
            };
            events.forEach(event => {
                summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;
                const day = event.timestamp.toISOString().split('T')[0];
                summary.eventsByDay[day] = (summary.eventsByDay[day] || 0) + 1;
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
        }
        catch (error) {
            console.error('Error getting user activity summary:', error);
            return null;
        }
    }
    async createAuditLog(auditData) {
        try {
            const auditLog = {
                id: this.generateId(),
                ...auditData,
                timestamp: auditData.timestamp || new Date()
            };
            await this.databaseService.create('audit_logs', auditLog);
            console.log(`📋 Audit log created: ${auditLog.action} by user ${auditLog.userId}`);
            return auditLog;
        }
        catch (error) {
            console.error('Error creating audit log:', error);
            throw error;
        }
    }
    async getAuditLogs(filters) {
        try {
            const query = {};
            if (filters.userId)
                query.userId = filters.userId;
            if (filters.action)
                query.action = filters.action;
            if (filters.resource)
                query.resource = filters.resource;
            if (filters.severity)
                query.severity = filters.severity;
            if (filters.startDate || filters.endDate) {
                query.timestamp = {};
                if (filters.startDate)
                    query.timestamp.$gte = filters.startDate;
                if (filters.endDate)
                    query.timestamp.$lte = filters.endDate;
            }
            const options = {
                sort: { timestamp: -1 }
            };
            if (filters.limit) {
                options.limit = filters.limit;
            }
            return await this.databaseService.find('audit_logs', query, options);
        }
        catch (error) {
            console.error('Error getting audit logs:', error);
            return [];
        }
    }
    async getSecurityEventStatistics(days = 30) {
        try {
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const events = await this.getSecurityEvents({ startDate });
            const stats = {
                totalEvents: events.length,
                eventsByType: {},
                failureRate: 0,
                anomalousEvents: 0,
                topIPs: {},
                topUserAgents: {},
                dailyActivity: {}
            };
            const failedEvents = events.filter(e => !e.success);
            stats.failureRate = events.length > 0 ? (failedEvents.length / events.length) * 100 : 0;
            stats.anomalousEvents = events.filter(e => e.flaggedAsAnomaly).length;
            events.forEach(event => {
                stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
                stats.topIPs[event.ipAddress] = (stats.topIPs[event.ipAddress] || 0) + 1;
                const shortUA = event.userAgent.substring(0, 50);
                stats.topUserAgents[shortUA] = (stats.topUserAgents[shortUA] || 0) + 1;
                const day = event.timestamp.toISOString().split('T')[0];
                stats.dailyActivity[day] = (stats.dailyActivity[day] || 0) + 1;
            });
            const sortEntries = (obj) => Object.entries(obj).sort(([, a], [, b]) => b - a).slice(0, 10);
            return {
                ...stats,
                failureRate: Math.round(stats.failureRate * 100) / 100,
                topIPs: Object.fromEntries(sortEntries(stats.topIPs)),
                topUserAgents: Object.fromEntries(sortEntries(stats.topUserAgents)),
                period: `${days} days`
            };
        }
        catch (error) {
            console.error('Error getting security event statistics:', error);
            return {};
        }
    }
    async flushEventBuffer() {
        if (this.eventBuffer.length === 0)
            return;
        try {
            const eventsToFlush = [...this.eventBuffer];
            this.eventBuffer = [];
            await this.databaseService.createMany('security_events', eventsToFlush);
            console.log(`💾 Flushed ${eventsToFlush.length} security events to database`);
        }
        catch (error) {
            console.error('Error flushing event buffer:', error);
            this.eventBuffer.unshift(...this.eventBuffer);
        }
    }
    determineChangeType(oldPermissions, newPermissions) {
        const added = newPermissions.filter(p => !oldPermissions.includes(p));
        const removed = oldPermissions.filter(p => !newPermissions.includes(p));
        if (added.length > 0 && removed.length > 0)
            return 'modified';
        if (added.length > 0)
            return 'elevated';
        if (removed.length > 0)
            return 'reduced';
        return 'unchanged';
    }
    generateId() {
        return 'event_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 12);
    }
    generateTransactionId() {
        return 'tx_' + Math.random().toString(36).substr(2, 12);
    }
    async cleanup() {
        if (this.bufferFlushInterval) {
            clearInterval(this.bufferFlushInterval);
        }
        await this.flushEventBuffer();
        console.log('🧹 SecurityEventService cleanup completed');
    }
};
exports.SecurityEventService = SecurityEventService;
exports.SecurityEventService = SecurityEventService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService])
], SecurityEventService);
//# sourceMappingURL=SecurityEventService.js.map
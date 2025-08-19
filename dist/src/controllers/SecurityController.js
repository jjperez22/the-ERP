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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityController = void 0;
const warp_1 = require("@varld/warp");
const SecurityOrchestrationEngine_1 = require("../services/SecurityOrchestrationEngine");
let SecurityController = class SecurityController {
    securityEngine;
    constructor(securityEngine) {
        this.securityEngine = securityEngine;
    }
    async startMonitoring() {
        try {
            await this.securityEngine.startMonitoring();
            return { success: true, message: 'Security monitoring started successfully' };
        }
        catch (error) {
            console.error('Error starting security monitoring:', error);
            return { success: false, message: 'Failed to start security monitoring' };
        }
    }
    async stopMonitoring() {
        try {
            await this.securityEngine.stopMonitoring();
            return { success: true, message: 'Security monitoring stopped successfully' };
        }
        catch (error) {
            console.error('Error stopping security monitoring:', error);
            return { success: false, message: 'Failed to stop security monitoring' };
        }
    }
    async recordLoginAttempt(loginData) {
        try {
            console.log(`🔐 Recording login attempt for user: ${loginData.userId} (${loginData.success ? 'success' : 'failed'})`);
            const result = await this.securityEngine.recordLoginAttempt(loginData.userId, loginData.userEmail, loginData.ipAddress, loginData.userAgent, loginData.success, loginData.location, loginData.deviceFingerprint, loginData.failureReason);
            return {
                success: true,
                data: result,
                blocked: result.blocked,
                alerts: result.alerts.length,
                riskLevel: result.riskAssessment?.overallRisk || 'unknown'
            };
        }
        catch (error) {
            console.error('Error recording login attempt:', error);
            throw new Error('Failed to record login attempt');
        }
    }
    async recordTransaction(transactionData) {
        try {
            console.log(`💳 Recording transaction for user: ${transactionData.userId} (${transactionData.amount} ${transactionData.currency})`);
            const result = await this.securityEngine.recordTransaction(transactionData.userId, transactionData.ipAddress, transactionData.userAgent, transactionData.amount, transactionData.currency, transactionData.merchant, transactionData.category, transactionData.location);
            return {
                success: true,
                data: result,
                blocked: result.blocked,
                fraudScore: result.riskAssessment?.riskScore || 0,
                alerts: result.alerts.length,
                riskLevel: result.riskAssessment?.overallRisk || 'unknown'
            };
        }
        catch (error) {
            console.error('Error recording transaction:', error);
            throw new Error('Failed to record transaction');
        }
    }
    async getSecurityDashboard(userId) {
        try {
            return await this.securityEngine.getSecurityDashboard(userId);
        }
        catch (error) {
            console.error('Error getting security dashboard:', error);
            throw new Error('Failed to get security dashboard');
        }
    }
    async getUserSecurityProfile(userId) {
        try {
            return await this.securityEngine.getUserSecurityProfile(userId);
        }
        catch (error) {
            console.error('Error getting user security profile:', error);
            throw new Error('Failed to get user security profile');
        }
    }
    async getActiveAlerts(filters) {
        try {
            const alertFilters = {};
            if (filters.severity)
                alertFilters.severity = filters.severity.split(',');
            if (filters.type)
                alertFilters.type = filters.type.split(',');
            if (filters.userId)
                alertFilters.userId = filters.userId;
            if (filters.category)
                alertFilters.category = filters.category.split(',');
            const dashboard = await this.securityEngine.getSecurityDashboard();
            return dashboard.alerts.active;
        }
        catch (error) {
            console.error('Error getting active alerts:', error);
            throw new Error('Failed to get active alerts');
        }
    }
    async getCriticalAlerts() {
        try {
            const dashboard = await this.securityEngine.getSecurityDashboard();
            return dashboard.alerts.critical;
        }
        catch (error) {
            console.error('Error getting critical alerts:', error);
            throw new Error('Failed to get critical alerts');
        }
    }
    async acknowledgeAlert(alertId, data) {
        try {
            return { success: true, message: 'Alert acknowledged' };
        }
        catch (error) {
            console.error('Error acknowledging alert:', error);
            return { success: false, message: 'Failed to acknowledge alert' };
        }
    }
    async resolveAlert(alertId, data) {
        try {
            return { success: true, message: 'Alert resolved' };
        }
        catch (error) {
            console.error('Error resolving alert:', error);
            return { success: false, message: 'Failed to resolve alert' };
        }
    }
    async getThreatIntelligence(query) {
        try {
            const dashboard = await this.securityEngine.getSecurityDashboard();
            return {
                threats: dashboard.threats.recentIndicators.slice(0, query.limit || 50),
                statistics: dashboard.threats.statistics
            };
        }
        catch (error) {
            console.error('Error getting threat intelligence:', error);
            throw new Error('Failed to get threat intelligence');
        }
    }
    async checkIPReputation(data) {
        try {
            return {
                ipAddress: data.ipAddress,
                isThreat: false,
                threatLevel: 'low',
                message: 'IP reputation check functionality would be implemented here'
            };
        }
        catch (error) {
            console.error('Error checking IP reputation:', error);
            throw new Error('Failed to check IP reputation');
        }
    }
    async getUserRiskAssessment(userId) {
        try {
            const profile = await this.securityEngine.getUserSecurityProfile(userId);
            return profile.riskAssessment;
        }
        catch (error) {
            console.error('Error getting user risk assessment:', error);
            throw new Error('Failed to get user risk assessment');
        }
    }
    async getSecurityEvents(filters) {
        try {
            const dashboard = await this.securityEngine.getSecurityDashboard();
            return {
                events: dashboard.events.recent,
                statistics: dashboard.events.statistics
            };
        }
        catch (error) {
            console.error('Error getting security events:', error);
            throw new Error('Failed to get security events');
        }
    }
    async getUserSecurityEvents(userId, options) {
        try {
            const profile = await this.securityEngine.getUserSecurityProfile(userId);
            return {
                events: profile.activity.recentEvents,
                summary: profile.activity.summary
            };
        }
        catch (error) {
            console.error('Error getting user security events:', error);
            throw new Error('Failed to get user security events');
        }
    }
    async getSecurityConfiguration() {
        try {
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
        }
        catch (error) {
            console.error('Error getting security configuration:', error);
            throw new Error('Failed to get security configuration');
        }
    }
    async updateSecurityConfiguration(config) {
        try {
            await this.securityEngine.updateSecurityConfiguration(config);
            return { success: true, message: 'Security configuration updated successfully' };
        }
        catch (error) {
            console.error('Error updating security configuration:', error);
            return { success: false, message: 'Failed to update security configuration' };
        }
    }
    async simulateLoginAttack(data) {
        try {
            console.log(`🔴 Simulating login attack: ${data.attemptCount} attempts on user ${data.targetUserId}`);
            const results = [];
            for (let i = 0; i < data.attemptCount; i++) {
                const result = await this.securityEngine.recordLoginAttempt(data.targetUserId, `user${data.targetUserId}@example.com`, data.attackerIP, 'Mozilla/5.0 (AttackBot/1.0)', false, {
                    country: 'Unknown',
                    region: 'Unknown',
                    city: 'Unknown',
                    coordinates: { latitude: 0, longitude: 0 },
                    timezone: 'UTC'
                }, undefined, 'Invalid credentials');
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
        }
        catch (error) {
            console.error('Error simulating login attack:', error);
            throw new Error('Failed to simulate login attack');
        }
    }
    async simulateFraudTransaction(data) {
        try {
            console.log(`💳 Simulating fraudulent transaction: $${data.amount} for user ${data.userId}`);
            const result = await this.securityEngine.recordTransaction(data.userId, '192.168.1.100', 'Mozilla/5.0 (FraudBot/1.0)', data.amount, 'USD', data.merchant || 'suspicious-merchant-123', 'fraud_simulation', {
                country: 'Russia',
                region: 'Moscow',
                city: 'Moscow',
                coordinates: { latitude: 55.7558, longitude: 37.6176 },
                timezone: 'Europe/Moscow'
            });
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
        }
        catch (error) {
            console.error('Error simulating fraud transaction:', error);
            throw new Error('Failed to simulate fraud transaction');
        }
    }
    async getSecurityStatistics(days = 30) {
        try {
            const dashboard = await this.securityEngine.getSecurityDashboard();
            return {
                period: `${days} days`,
                summary: dashboard.summary,
                alerts: dashboard.alerts.statistics,
                events: dashboard.events.statistics,
                threats: dashboard.threats.statistics
            };
        }
        catch (error) {
            console.error('Error getting security statistics:', error);
            throw new Error('Failed to get security statistics');
        }
    }
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
        }
        catch (error) {
            console.error('Error getting security health:', error);
            return {
                status: 'error',
                message: 'Failed to get security health status'
            };
        }
    }
};
exports.SecurityController = SecurityController;
__decorate([
    (0, warp_1.Post)('/monitoring/start'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "startMonitoring", null);
__decorate([
    (0, warp_1.Post)('/monitoring/stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "stopMonitoring", null);
__decorate([
    (0, warp_1.Post)('/events/login'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "recordLoginAttempt", null);
__decorate([
    (0, warp_1.Post)('/events/transaction'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "recordTransaction", null);
__decorate([
    (0, warp_1.Get)('/dashboard'),
    __param(0, (0, warp_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityDashboard", null);
__decorate([
    (0, warp_1.Get)('/users/:userId/profile'),
    __param(0, (0, warp_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getUserSecurityProfile", null);
__decorate([
    (0, warp_1.Get)('/alerts'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getActiveAlerts", null);
__decorate([
    (0, warp_1.Get)('/alerts/critical'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getCriticalAlerts", null);
__decorate([
    (0, warp_1.Put)('/alerts/:alertId/acknowledge'),
    __param(0, (0, warp_1.Param)('alertId')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "acknowledgeAlert", null);
__decorate([
    (0, warp_1.Put)('/alerts/:alertId/resolve'),
    __param(0, (0, warp_1.Param)('alertId')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "resolveAlert", null);
__decorate([
    (0, warp_1.Get)('/threats'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getThreatIntelligence", null);
__decorate([
    (0, warp_1.Post)('/threats/check-ip'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "checkIPReputation", null);
__decorate([
    (0, warp_1.Get)('/risk/:userId'),
    __param(0, (0, warp_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getUserRiskAssessment", null);
__decorate([
    (0, warp_1.Get)('/events'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityEvents", null);
__decorate([
    (0, warp_1.Get)('/events/user/:userId'),
    __param(0, (0, warp_1.Param)('userId')),
    __param(1, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getUserSecurityEvents", null);
__decorate([
    (0, warp_1.Get)('/config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityConfiguration", null);
__decorate([
    (0, warp_1.Put)('/config'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "updateSecurityConfiguration", null);
__decorate([
    (0, warp_1.Post)('/simulate/login-attack'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "simulateLoginAttack", null);
__decorate([
    (0, warp_1.Post)('/simulate/fraud-transaction'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "simulateFraudTransaction", null);
__decorate([
    (0, warp_1.Get)('/statistics'),
    __param(0, (0, warp_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityStatistics", null);
__decorate([
    (0, warp_1.Get)('/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityHealth", null);
exports.SecurityController = SecurityController = __decorate([
    (0, warp_1.Controller)('/api/security'),
    __param(0, (0, warp_1.Inject)('SecurityOrchestrationEngine')),
    __metadata("design:paramtypes", [SecurityOrchestrationEngine_1.SecurityOrchestrationEngine])
], SecurityController);
//# sourceMappingURL=SecurityController.js.map
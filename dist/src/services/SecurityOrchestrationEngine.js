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
exports.SecurityOrchestrationEngine = void 0;
const warp_1 = require("@varld/warp");
const events_1 = require("events");
const DatabaseService_1 = require("../../services/DatabaseService");
const BehaviorAnalysisService_1 = require("./BehaviorAnalysisService");
const FraudDetectionService_1 = require("./FraudDetectionService");
const SecurityAlertService_1 = require("./SecurityAlertService");
const RiskAssessmentService_1 = require("./RiskAssessmentService");
const SecurityEventService_1 = require("./SecurityEventService");
const ThreatIntelligenceService_1 = require("./ThreatIntelligenceService");
let SecurityOrchestrationEngine = class SecurityOrchestrationEngine extends events_1.EventEmitter {
    databaseService;
    behaviorAnalysisService;
    fraudDetectionService;
    securityAlertService;
    riskAssessmentService;
    securityEventService;
    threatIntelligenceService;
    isMonitoring = false;
    config;
    constructor(databaseService, behaviorAnalysisService, fraudDetectionService, securityAlertService, riskAssessmentService, securityEventService, threatIntelligenceService) {
        super();
        this.databaseService = databaseService;
        this.behaviorAnalysisService = behaviorAnalysisService;
        this.fraudDetectionService = fraudDetectionService;
        this.securityAlertService = securityAlertService;
        this.riskAssessmentService = riskAssessmentService;
        this.securityEventService = securityEventService;
        this.threatIntelligenceService = threatIntelligenceService;
        this.initializeConfiguration();
        this.setupEventHandlers();
    }
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Security monitoring is already active');
            return;
        }
        console.log('🔐 Starting Advanced Security & Fraud Detection system...');
        this.isMonitoring = true;
        await this.threatIntelligenceService.updateThreatFeeds();
        this.emit('monitoring_started', { timestamp: new Date() });
        console.log('✅ Security monitoring system started successfully');
    }
    async stopMonitoring() {
        console.log('🛑 Stopping security monitoring system...');
        this.isMonitoring = false;
        this.emit('monitoring_stopped', { timestamp: new Date() });
        console.log('✅ Security monitoring system stopped');
    }
    async processSecurityEvent(eventData) {
        try {
            if (!this.isMonitoring) {
                throw new Error('Security monitoring is not active');
            }
            const event = await this.securityEventService.recordSecurityEvent(eventData);
            const results = {
                event,
                riskAssessment: undefined,
                alerts: [],
                blocked: false
            };
            const threatCheck = await this.checkThreatIntelligence(event);
            if (threatCheck.blocked) {
                results.blocked = true;
                const threatAlert = await this.securityAlertService.createSecurityBreachAlert(event.userId, event, {
                    type: 'threat_detected',
                    description: `Threat detected: ${threatCheck.reason}`,
                    severity: 'critical'
                });
                results.alerts.push(threatAlert);
                return results;
            }
            const [behaviorAnalysis, fraudAnalysis] = await Promise.all([
                this.analyzeBehavior(event),
                this.analyzeFraud(event)
            ]);
            if (behaviorAnalysis.isAnomalous || fraudAnalysis.isFraudulent) {
                event.flaggedAsAnomaly = true;
                event.riskScore = Math.max(behaviorAnalysis.anomalyScore * 100, fraudAnalysis.riskScore * 100);
            }
            if (behaviorAnalysis.isAnomalous) {
                const behaviorAlert = await this.securityAlertService.createBehaviorAnomalyAlert(event.userId, event, behaviorAnalysis);
                results.alerts.push(behaviorAlert);
            }
            if (fraudAnalysis.isFraudulent) {
                const fraudAlert = await this.securityAlertService.createFraudAlert(event.userId, event, fraudAnalysis);
                results.alerts.push(fraudAlert);
                if (fraudAnalysis.riskScore > 0.9) {
                    results.blocked = true;
                }
            }
            const recentEvents = await this.securityEventService.getRecentUserEvents(event.userId, 24);
            const behaviorProfile = await this.behaviorAnalysisService.getUserProfile(event.userId);
            const riskAssessment = await this.riskAssessmentService.calculateUserRisk(event.userId, recentEvents, behaviorProfile);
            results.riskAssessment = riskAssessment;
            if (riskAssessment.overallRisk === 'very_high') {
                results.blocked = true;
                const riskAlert = await this.securityAlertService.createSecurityBreachAlert(event.userId, event, {
                    type: 'high_risk_user',
                    description: `User risk level is very high (${riskAssessment.riskScore})`,
                    severity: 'high'
                });
                results.alerts.push(riskAlert);
            }
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
        }
        catch (error) {
            console.error('Error processing security event:', error);
            throw error;
        }
    }
    async recordLoginAttempt(userId, userEmail, ipAddress, userAgent, success, location, deviceFingerprint, failureReason) {
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
    async recordTransaction(userId, ipAddress, userAgent, amount, currency, merchant, category, location) {
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
    async getSecurityDashboard(userId) {
        try {
            const [activeAlerts, criticalAlerts, recentEvents, threatStats, alertStats] = await Promise.all([
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
        }
        catch (error) {
            console.error('Error getting security dashboard:', error);
            throw error;
        }
    }
    async getUserSecurityProfile(userId) {
        try {
            const [behaviorProfile, riskAssessment, userAlerts, userEvents, activitySummary] = await Promise.all([
                this.behaviorAnalysisService.getUserProfile(userId),
                this.riskAssessmentService.calculateUserRisk(userId, [], undefined),
                this.securityAlertService.getAlertsByUser(userId),
                this.securityEventService.getRecentUserEvents(userId, 168),
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
        }
        catch (error) {
            console.error('Error getting user security profile:', error);
            throw error;
        }
    }
    async updateSecurityConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        await this.databaseService.update('security_config', { id: 'main' }, this.config);
        this.emit('configuration_updated', this.config);
        console.log('⚙️ Security configuration updated');
    }
    async checkThreatIntelligence(event) {
        try {
            const ipCheck = await this.threatIntelligenceService.checkIPReputation(event.ipAddress);
            if (ipCheck.isThreat && (ipCheck.threatLevel === 'critical' || ipCheck.threatLevel === 'high')) {
                return { blocked: true, reason: `Malicious IP: ${event.ipAddress}` };
            }
            return { blocked: false };
        }
        catch (error) {
            console.error('Error checking threat intelligence:', error);
            return { blocked: false };
        }
    }
    async analyzeBehavior(event) {
        if (!this.config.behaviorAnalysis.enabled) {
            return { isAnomalous: false, anomalyScore: 0, reasons: [] };
        }
        return await this.behaviorAnalysisService.analyzeEvent(event);
    }
    async analyzeFraud(event) {
        if (!this.config.fraudDetection.enabled) {
            return { isFraudulent: false, riskScore: 0, indicators: [] };
        }
        return await this.fraudDetectionService.analyzeTransaction(event);
    }
    initializeConfiguration() {
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
    setupEventHandlers() {
        this.securityAlertService.on('alert_created', (alert) => {
            this.emit('security_alert', alert);
        });
        this.securityAlertService.on('alert_resolved', (data) => {
            this.emit('alert_resolved', data);
        });
        console.log('🔗 Security event handlers initialized');
    }
    async cleanup() {
        await this.stopMonitoring();
        await this.securityEventService.cleanup();
        await this.threatIntelligenceService.cleanup();
        console.log('🧹 SecurityOrchestrationEngine cleanup completed');
    }
};
exports.SecurityOrchestrationEngine = SecurityOrchestrationEngine;
exports.SecurityOrchestrationEngine = SecurityOrchestrationEngine = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        BehaviorAnalysisService_1.BehaviorAnalysisService,
        FraudDetectionService_1.FraudDetectionService,
        SecurityAlertService_1.SecurityAlertService,
        RiskAssessmentService_1.RiskAssessmentService,
        SecurityEventService_1.SecurityEventService,
        ThreatIntelligenceService_1.ThreatIntelligenceService])
], SecurityOrchestrationEngine);
//# sourceMappingURL=SecurityOrchestrationEngine.js.map
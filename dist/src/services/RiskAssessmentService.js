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
exports.RiskAssessmentService = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../../services/DatabaseService");
let RiskAssessmentService = class RiskAssessmentService {
    databaseService;
    riskProfiles = new Map();
    defaultRiskValidityHours = 24;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async calculateUserRisk(userId, recentEvents, behaviorProfile) {
        try {
            const cached = this.riskProfiles.get(userId);
            if (cached && cached.validUntil > new Date()) {
                return cached;
            }
            const behavioralRisk = this.calculateBehavioralRisk(recentEvents, behaviorProfile);
            const geographicalRisk = this.calculateGeographicalRisk(recentEvents);
            const transactionalRisk = this.calculateTransactionalRisk(recentEvents);
            const temporalRisk = this.calculateTemporalRisk(recentEvents);
            const deviceRisk = this.calculateDeviceRisk(recentEvents);
            const overallScore = this.calculateOverallRiskScore({
                behavioral: behavioralRisk,
                geographical: geographicalRisk,
                transactional: transactionalRisk,
                temporal: temporalRisk,
                device: deviceRisk
            });
            const overallRisk = this.categorizeRiskLevel(overallScore);
            const recommendations = this.generateRiskRecommendations(overallRisk, {
                behavioral: behavioralRisk,
                geographical: geographicalRisk,
                transactional: transactionalRisk,
                temporal: temporalRisk,
                device: deviceRisk
            });
            const assessment = {
                userId,
                overallRisk,
                riskScore: Math.round(overallScore),
                factors: {
                    behavioral: Math.round(behavioralRisk),
                    geographical: Math.round(geographicalRisk),
                    transactional: Math.round(transactionalRisk),
                    temporal: Math.round(temporalRisk),
                    device: Math.round(deviceRisk)
                },
                recommendations,
                timestamp: new Date(),
                validUntil: new Date(Date.now() + this.defaultRiskValidityHours * 60 * 60 * 1000)
            };
            this.riskProfiles.set(userId, assessment);
            await this.databaseService.create('risk_assessments', assessment);
            console.log(`📊 Risk assessment completed for user ${userId}: ${overallRisk} (${overallScore})`);
            return assessment;
        }
        catch (error) {
            console.error('Error calculating user risk:', error);
            return this.createDefaultRiskAssessment(userId);
        }
    }
    calculateBehavioralRisk(events, profile) {
        let riskScore = 0;
        const anomalousEvents = events.filter(e => e.flaggedAsAnomaly);
        const anomalyRate = events.length > 0 ? anomalousEvents.length / events.length : 0;
        riskScore += anomalyRate * 40;
        if (profile) {
            if (profile.riskIndicators.anomalyCount > 10)
                riskScore += 20;
            if (profile.riskIndicators.highRiskActions > 5)
                riskScore += 15;
            if (profile.riskIndicators.suspiciousPatterns.length > 3)
                riskScore += 10;
        }
        const failedLogins = events.filter(e => e.type === 'login_attempt' && !e.success);
        if (failedLogins.length > 3)
            riskScore += 15;
        return Math.min(riskScore, 100);
    }
    calculateGeographicalRisk(events) {
        let riskScore = 0;
        const locationsUsed = new Set();
        const countries = new Set();
        events.forEach(event => {
            if (event.location) {
                const locationKey = `${event.location.city},${event.location.country}`;
                locationsUsed.add(locationKey);
                countries.add(event.location.country);
            }
        });
        if (countries.size > 2)
            riskScore += 30;
        else if (countries.size > 1)
            riskScore += 15;
        if (locationsUsed.size > 5)
            riskScore += 20;
        else if (locationsUsed.size > 3)
            riskScore += 10;
        const eventsWithLocation = events.filter(e => e.location);
        for (let i = 1; i < eventsWithLocation.length; i++) {
            const prev = eventsWithLocation[i - 1];
            const curr = eventsWithLocation[i];
            if (this.isImpossibleTravel(prev, curr)) {
                riskScore += 40;
                break;
            }
        }
        return Math.min(riskScore, 100);
    }
    calculateTransactionalRisk(events) {
        let riskScore = 0;
        const transactions = events.filter(e => e.type === 'transaction');
        if (transactions.length === 0)
            return 0;
        if (transactions.length > 10)
            riskScore += 25;
        else if (transactions.length > 5)
            riskScore += 15;
        const amounts = transactions
            .map(t => parseFloat(t.metadata.amount || '0'))
            .filter(a => a > 0);
        if (amounts.length > 0) {
            const maxAmount = Math.max(...amounts);
            const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
            if (maxAmount > 50000)
                riskScore += 30;
            else if (maxAmount > 20000)
                riskScore += 20;
            else if (maxAmount > 10000)
                riskScore += 10;
            if (avgAmount > 5000)
                riskScore += 15;
        }
        let consecutiveFailures = 0;
        for (const tx of transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())) {
            if (!tx.success) {
                consecutiveFailures++;
            }
            else {
                if (consecutiveFailures >= 3) {
                    riskScore += 20;
                }
                consecutiveFailures = 0;
            }
        }
        return Math.min(riskScore, 100);
    }
    calculateTemporalRisk(events) {
        let riskScore = 0;
        const nightActivity = events.filter(e => {
            const hour = e.timestamp.getHours();
            return hour >= 2 && hour <= 6;
        });
        if (nightActivity.length > 5)
            riskScore += 20;
        else if (nightActivity.length > 2)
            riskScore += 10;
        const weekendActivity = events.filter(e => {
            const day = e.timestamp.getDay();
            return day === 0 || day === 6;
        });
        if (weekendActivity.length > events.length * 0.3)
            riskScore += 15;
        const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        let maxBurst = 0;
        let currentBurst = 0;
        let lastEventTime = 0;
        for (const event of sortedEvents) {
            const eventTime = event.timestamp.getTime();
            if (lastEventTime > 0 && (eventTime - lastEventTime) < 60000) {
                currentBurst++;
            }
            else {
                maxBurst = Math.max(maxBurst, currentBurst);
                currentBurst = 1;
            }
            lastEventTime = eventTime;
        }
        if (maxBurst > 20)
            riskScore += 25;
        else if (maxBurst > 10)
            riskScore += 15;
        return Math.min(riskScore, 100);
    }
    calculateDeviceRisk(events) {
        let riskScore = 0;
        const devices = new Set();
        const ips = new Set();
        events.forEach(event => {
            if (event.deviceFingerprint) {
                const deviceKey = `${event.deviceFingerprint.browserName}-${event.deviceFingerprint.operatingSystem}`;
                devices.add(deviceKey);
            }
            ips.add(event.ipAddress);
        });
        if (devices.size > 5)
            riskScore += 20;
        else if (devices.size > 3)
            riskScore += 10;
        if (ips.size > 10)
            riskScore += 30;
        else if (ips.size > 5)
            riskScore += 15;
        const suspiciousEvents = events.filter(e => {
            const ua = e.userAgent.toLowerCase();
            return ua.includes('bot') || ua.includes('crawler') || ua.includes('automated');
        });
        if (suspiciousEvents.length > 0)
            riskScore += 25;
        return Math.min(riskScore, 100);
    }
    calculateOverallRiskScore(factors) {
        const weights = {
            behavioral: 0.3,
            transactional: 0.25,
            geographical: 0.2,
            device: 0.15,
            temporal: 0.1
        };
        return (factors.behavioral * weights.behavioral +
            factors.transactional * weights.transactional +
            factors.geographical * weights.geographical +
            factors.device * weights.device +
            factors.temporal * weights.temporal);
    }
    categorizeRiskLevel(score) {
        if (score >= 80)
            return 'very_high';
        if (score >= 60)
            return 'high';
        if (score >= 40)
            return 'medium';
        if (score >= 20)
            return 'low';
        return 'very_low';
    }
    generateRiskRecommendations(overallRisk, factors) {
        const recommendations = [];
        if (overallRisk === 'very_high' || overallRisk === 'high') {
            recommendations.push('Implement enhanced authentication requirements');
            recommendations.push('Consider temporary account restrictions');
            recommendations.push('Require manual approval for high-value transactions');
        }
        if (factors.behavioral > 60) {
            recommendations.push('Review and update user behavioral profile');
            recommendations.push('Increase monitoring frequency for this user');
        }
        if (factors.geographical > 60) {
            recommendations.push('Implement geofencing controls');
            recommendations.push('Require location verification for new regions');
        }
        if (factors.transactional > 60) {
            recommendations.push('Implement transaction velocity limits');
            recommendations.push('Require additional verification for large amounts');
        }
        if (factors.device > 60) {
            recommendations.push('Implement device registration requirements');
            recommendations.push('Consider blocking unrecognized devices');
        }
        if (factors.temporal > 60) {
            recommendations.push('Implement time-based access controls');
            recommendations.push('Alert on unusual time patterns');
        }
        if (recommendations.length === 0) {
            recommendations.push('Continue standard monitoring');
            recommendations.push('Maintain current security posture');
        }
        return recommendations;
    }
    isImpossibleTravel(event1, event2) {
        if (!event1.location || !event2.location)
            return false;
        const distance = this.calculateDistance(event1.location.coordinates, event2.location.coordinates);
        const timeDiff = Math.abs(event2.timestamp.getTime() - event1.timestamp.getTime()) / (1000 * 60 * 60);
        const maxSpeed = distance / timeDiff;
        return maxSpeed > 1000;
    }
    calculateDistance(coord1, coord2) {
        const R = 6371;
        const dLat = this.toRadians(coord2.latitude - coord1.latitude);
        const dLon = this.toRadians(coord2.longitude - coord1.longitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    createDefaultRiskAssessment(userId) {
        return {
            userId,
            overallRisk: 'medium',
            riskScore: 50,
            factors: {
                behavioral: 50,
                geographical: 50,
                transactional: 50,
                temporal: 50,
                device: 50
            },
            recommendations: ['Unable to calculate risk - insufficient data'],
            timestamp: new Date(),
            validUntil: new Date(Date.now() + this.defaultRiskValidityHours * 60 * 60 * 1000)
        };
    }
    async getUserRiskHistory(userId, days = 30) {
        try {
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            return await this.databaseService.find('risk_assessments', {
                userId,
                timestamp: { $gte: cutoffDate }
            }, { sort: { timestamp: -1 } });
        }
        catch (error) {
            console.error('Error getting user risk history:', error);
            return [];
        }
    }
    async invalidateUserRisk(userId) {
        this.riskProfiles.delete(userId);
        console.log(`🔄 Invalidated risk profile for user: ${userId}`);
    }
};
exports.RiskAssessmentService = RiskAssessmentService;
exports.RiskAssessmentService = RiskAssessmentService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService])
], RiskAssessmentService);
//# sourceMappingURL=RiskAssessmentService.js.map
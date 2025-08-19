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
exports.BehaviorAnalysisService = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../../services/DatabaseService");
let BehaviorAnalysisService = class BehaviorAnalysisService {
    databaseService;
    behaviorProfiles = new Map();
    learningPeriod = 30;
    anomalyThreshold = 0.7;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async analyzeEvent(event) {
        try {
            const profile = await this.getUserProfile(event.userId);
            const anomalyReasons = [];
            let anomalyScore = 0;
            if (!profile) {
                await this.createUserProfile(event.userId, event);
                return { isAnomalous: false, anomalyScore: 0, reasons: ['New user - creating behavioral profile'] };
            }
            const locationAnomaly = this.analyzeLocationAnomaly(event, profile);
            const timeAnomaly = this.analyzeTimeAnomaly(event, profile);
            const deviceAnomaly = this.analyzeDeviceAnomaly(event, profile);
            const velocityAnomaly = this.analyzeVelocityAnomaly(event, profile);
            const patternAnomaly = this.analyzePatternAnomaly(event, profile);
            anomalyScore = Math.max(locationAnomaly.score, timeAnomaly.score, deviceAnomaly.score, velocityAnomaly.score, patternAnomaly.score);
            if (locationAnomaly.isAnomalous)
                anomalyReasons.push(locationAnomaly.reason);
            if (timeAnomaly.isAnomalous)
                anomalyReasons.push(timeAnomaly.reason);
            if (deviceAnomaly.isAnomalous)
                anomalyReasons.push(deviceAnomaly.reason);
            if (velocityAnomaly.isAnomalous)
                anomalyReasons.push(velocityAnomaly.reason);
            if (patternAnomaly.isAnomalous)
                anomalyReasons.push(patternAnomaly.reason);
            const isAnomalous = anomalyScore > this.anomalyThreshold;
            await this.updateUserProfile(event.userId, event);
            return { isAnomalous, anomalyScore, reasons: anomalyReasons };
        }
        catch (error) {
            console.error('Error analyzing behavioral event:', error);
            return { isAnomalous: false, anomalyScore: 0, reasons: ['Analysis error'] };
        }
    }
    async getUserProfile(userId) {
        try {
            if (this.behaviorProfiles.has(userId)) {
                return this.behaviorProfiles.get(userId);
            }
            const profile = await this.databaseService.findOne('user_behavior_profiles', { userId });
            if (profile) {
                this.behaviorProfiles.set(userId, profile);
                return profile;
            }
            return null;
        }
        catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }
    async createUserProfile(userId, initialEvent) {
        const profile = {
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            loginPatterns: {
                typicalHours: [new Date().getHours()],
                typicalDays: [new Date().getDay()],
                frequentLocations: initialEvent.location ? [initialEvent.location] : [],
                averageSessionDuration: 3600,
                typicalDevices: initialEvent.deviceFingerprint ? [initialEvent.deviceFingerprint] : []
            },
            transactionPatterns: {
                averageAmount: 0,
                maxAmount: 0,
                frequentCategories: [],
                typicalFrequency: 0,
                timeDistribution: Array(24).fill(0)
            },
            accessPatterns: {
                frequentModules: [],
                permissionLevels: [],
                dataAccessVolume: 0,
                operationTypes: []
            },
            riskIndicators: {
                anomalyCount: 0,
                highRiskActions: 0,
                suspiciousPatterns: []
            }
        };
        await this.databaseService.create('user_behavior_profiles', profile);
        this.behaviorProfiles.set(userId, profile);
        console.log(`🧠 Created behavioral profile for user: ${userId}`);
        return profile;
    }
    analyzeLocationAnomaly(event, profile) {
        if (!event.location || profile.loginPatterns.frequentLocations.length === 0) {
            return { isAnomalous: false, score: 0, reason: '' };
        }
        const isKnownLocation = profile.loginPatterns.frequentLocations.some(loc => this.calculateDistance(event.location, loc) < 100);
        if (!isKnownLocation) {
            return {
                isAnomalous: true,
                score: 0.8,
                reason: `Login from unusual location: ${event.location.city}, ${event.location.country}`
            };
        }
        return { isAnomalous: false, score: 0, reason: '' };
    }
    analyzeTimeAnomaly(event, profile) {
        const eventHour = event.timestamp.getHours();
        const eventDay = event.timestamp.getDay();
        const isTypicalHour = profile.loginPatterns.typicalHours.includes(eventHour);
        const isTypicalDay = profile.loginPatterns.typicalDays.includes(eventDay);
        if (!isTypicalHour && !isTypicalDay) {
            return {
                isAnomalous: true,
                score: 0.6,
                reason: `Login at unusual time: ${eventHour}:00 on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][eventDay]}`
            };
        }
        return { isAnomalous: false, score: 0, reason: '' };
    }
    analyzeDeviceAnomaly(event, profile) {
        if (!event.deviceFingerprint || profile.loginPatterns.typicalDevices.length === 0) {
            return { isAnomalous: false, score: 0, reason: '' };
        }
        const isKnownDevice = profile.loginPatterns.typicalDevices.some(device => this.compareDeviceFingerprints(event.deviceFingerprint, device) > 0.8);
        if (!isKnownDevice) {
            return {
                isAnomalous: true,
                score: 0.7,
                reason: `Login from unrecognized device: ${event.deviceFingerprint.browserName} on ${event.deviceFingerprint.operatingSystem}`
            };
        }
        return { isAnomalous: false, score: 0, reason: '' };
    }
    analyzeVelocityAnomaly(event, profile) {
        if (!event.location) {
            return { isAnomalous: false, score: 0, reason: '' };
        }
        const oneHourAgo = new Date(event.timestamp.getTime() - 60 * 60 * 1000);
        return { isAnomalous: false, score: 0, reason: '' };
    }
    analyzePatternAnomaly(event, profile) {
        if (event.type === 'transaction' && event.metadata.amount) {
            const amount = parseFloat(event.metadata.amount);
            if (amount > profile.transactionPatterns.maxAmount * 2) {
                return {
                    isAnomalous: true,
                    score: 0.9,
                    reason: `Transaction amount (${amount}) significantly exceeds typical maximum (${profile.transactionPatterns.maxAmount})`
                };
            }
            if (amount > profile.transactionPatterns.averageAmount * 10) {
                return {
                    isAnomalous: true,
                    score: 0.8,
                    reason: `Transaction amount (${amount}) is 10x higher than average (${profile.transactionPatterns.averageAmount})`
                };
            }
        }
        return { isAnomalous: false, score: 0, reason: '' };
    }
    async updateUserProfile(userId, event) {
        try {
            const profile = this.behaviorProfiles.get(userId);
            if (!profile)
                return;
            const eventHour = event.timestamp.getHours();
            const eventDay = event.timestamp.getDay();
            if (!profile.loginPatterns.typicalHours.includes(eventHour)) {
                profile.loginPatterns.typicalHours.push(eventHour);
            }
            if (!profile.loginPatterns.typicalDays.includes(eventDay)) {
                profile.loginPatterns.typicalDays.push(eventDay);
            }
            if (event.location) {
                const existingLocation = profile.loginPatterns.frequentLocations.find(loc => this.calculateDistance(event.location, loc) < 10);
                if (!existingLocation) {
                    profile.loginPatterns.frequentLocations.push(event.location);
                    if (profile.loginPatterns.frequentLocations.length > 10) {
                        profile.loginPatterns.frequentLocations = profile.loginPatterns.frequentLocations.slice(-10);
                    }
                }
            }
            if (event.deviceFingerprint) {
                const existingDevice = profile.loginPatterns.typicalDevices.find(device => this.compareDeviceFingerprints(event.deviceFingerprint, device) > 0.9);
                if (!existingDevice) {
                    profile.loginPatterns.typicalDevices.push(event.deviceFingerprint);
                    if (profile.loginPatterns.typicalDevices.length > 5) {
                        profile.loginPatterns.typicalDevices = profile.loginPatterns.typicalDevices.slice(-5);
                    }
                }
            }
            if (event.type === 'transaction' && event.metadata.amount) {
                const amount = parseFloat(event.metadata.amount);
                profile.transactionPatterns.averageAmount =
                    (profile.transactionPatterns.averageAmount + amount) / 2;
                profile.transactionPatterns.maxAmount =
                    Math.max(profile.transactionPatterns.maxAmount, amount);
                profile.transactionPatterns.typicalFrequency++;
            }
            profile.updatedAt = new Date();
            await this.databaseService.update('user_behavior_profiles', { userId }, profile);
            console.log(`🔄 Updated behavioral profile for user: ${userId}`);
        }
        catch (error) {
            console.error('Error updating user profile:', error);
        }
    }
    calculateDistance(loc1, loc2) {
        const R = 6371;
        const dLat = this.toRadians(loc2.coordinates.latitude - loc1.coordinates.latitude);
        const dLon = this.toRadians(loc2.coordinates.longitude - loc1.coordinates.longitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(loc1.coordinates.latitude)) *
                Math.cos(this.toRadians(loc2.coordinates.latitude)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    compareDeviceFingerprints(fp1, fp2) {
        let score = 0;
        let totalChecks = 0;
        const checks = [
            { match: fp1.browserName === fp2.browserName, weight: 0.2 },
            { match: fp1.operatingSystem === fp2.operatingSystem, weight: 0.2 },
            { match: fp1.screenResolution === fp2.screenResolution, weight: 0.1 },
            { match: fp1.timezone === fp2.timezone, weight: 0.1 },
            { match: fp1.language === fp2.language, weight: 0.1 },
            { match: fp1.canvas === fp2.canvas, weight: 0.15 },
            { match: fp1.webgl === fp2.webgl, weight: 0.15 }
        ];
        checks.forEach(check => {
            if (check.match) {
                score += check.weight;
            }
            totalChecks += check.weight;
        });
        return score / totalChecks;
    }
    async getRiskProfile(userId) {
        const profile = await this.getUserProfile(userId);
        if (!profile) {
            return { riskLevel: 'unknown', factors: ['No behavioral profile'], score: 0.5 };
        }
        const factors = [];
        let riskScore = 0;
        if (profile.riskIndicators.anomalyCount > 10) {
            factors.push('High anomaly count');
            riskScore += 0.3;
        }
        if (profile.riskIndicators.highRiskActions > 5) {
            factors.push('Multiple high-risk actions');
            riskScore += 0.2;
        }
        if (profile.loginPatterns.frequentLocations.length > 10) {
            factors.push('Multiple login locations');
            riskScore += 0.1;
        }
        const riskLevel = riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low';
        return { riskLevel, factors, score: riskScore };
    }
    generateId() {
        return 'behavior_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.BehaviorAnalysisService = BehaviorAnalysisService;
exports.BehaviorAnalysisService = BehaviorAnalysisService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService])
], BehaviorAnalysisService);
//# sourceMappingURL=BehaviorAnalysisService.js.map
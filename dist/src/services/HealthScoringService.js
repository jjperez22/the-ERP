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
exports.HealthScoringService = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../../services/DatabaseService");
let HealthScoringService = class HealthScoringService {
    databaseService;
    healthScores = new Map();
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async calculateHealthScore(equipmentId, recentReadings) {
        if (recentReadings.length === 0) {
            return this.createDefaultHealthScore(equipmentId);
        }
        const tempReadings = recentReadings.filter(r => r.sensorType === 'temperature');
        const vibrationReadings = recentReadings.filter(r => r.sensorType === 'vibration');
        const pressureReadings = recentReadings.filter(r => r.sensorType === 'pressure');
        const oilReadings = recentReadings.filter(r => r.sensorType === 'oil_level');
        const engineScore = this.calculateComponentScore(tempReadings, 'temperature');
        const hydraulicsScore = this.calculateComponentScore(pressureReadings, 'pressure');
        const electricalScore = this.calculateComponentScore(vibrationReadings, 'vibration');
        const mechanicalScore = this.calculateComponentScore(oilReadings, 'oil_level');
        const overallScore = (engineScore + hydraulicsScore + electricalScore + mechanicalScore) / 4;
        const oldHealth = this.healthScores.get(equipmentId);
        let trendDirection = 'stable';
        if (oldHealth) {
            const scoreDiff = overallScore - oldHealth.overallScore;
            if (scoreDiff > 2)
                trendDirection = 'improving';
            else if (scoreDiff < -2)
                trendDirection = 'declining';
        }
        const riskLevel = this.calculateRiskLevel(overallScore);
        const healthScore = {
            equipmentId,
            overallScore: Math.round(overallScore),
            componentScores: {
                engine: Math.round(engineScore),
                hydraulics: Math.round(hydraulicsScore),
                electrical: Math.round(electricalScore),
                mechanical: Math.round(mechanicalScore)
            },
            lastUpdated: new Date(),
            trendDirection,
            riskLevel
        };
        this.healthScores.set(equipmentId, healthScore);
        await this.databaseService.create('equipment_health', healthScore);
        return healthScore;
    }
    async getHealthScore(equipmentId) {
        if (this.healthScores.has(equipmentId)) {
            return this.healthScores.get(equipmentId);
        }
        try {
            const healthData = await this.databaseService.findOne('equipment_health', { equipmentId });
            if (healthData) {
                this.healthScores.set(equipmentId, healthData);
                return healthData;
            }
        }
        catch (error) {
            console.error('Error loading health score:', error);
        }
        return null;
    }
    calculateComponentScore(readings, sensorType) {
        if (readings.length === 0)
            return 85;
        const anomalyCount = readings.filter(r => r.isAnomaly).length;
        const anomalyRate = anomalyCount / readings.length;
        let score = 100 - (anomalyRate * 50);
        const avgValue = readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
        switch (sensorType) {
            case 'temperature':
                if (avgValue > 100)
                    score -= 10;
                if (avgValue > 120)
                    score -= 20;
                break;
            case 'vibration':
                if (avgValue > 3.5)
                    score -= 15;
                if (avgValue > 4.5)
                    score -= 25;
                break;
            case 'oil_level':
                if (avgValue < 30)
                    score -= 25;
                if (avgValue < 20)
                    score -= 40;
                break;
            case 'pressure':
                if (avgValue > 180)
                    score -= 15;
                if (avgValue < 80)
                    score -= 15;
                break;
        }
        return Math.max(0, Math.min(100, score));
    }
    calculateRiskLevel(overallScore) {
        if (overallScore < 30)
            return 'critical';
        if (overallScore < 50)
            return 'high';
        if (overallScore < 70)
            return 'medium';
        return 'low';
    }
    createDefaultHealthScore(equipmentId) {
        const defaultHealth = {
            equipmentId,
            overallScore: 85,
            componentScores: {
                engine: 85,
                hydraulics: 85,
                electrical: 85,
                mechanical: 85
            },
            lastUpdated: new Date(),
            trendDirection: 'stable',
            riskLevel: 'low'
        };
        this.healthScores.set(equipmentId, defaultHealth);
        return defaultHealth;
    }
    async getAllHealthScores() {
        try {
            return Array.from(this.healthScores.values())
                .sort((a, b) => a.overallScore - b.overallScore);
        }
        catch (error) {
            console.error('Error getting all health scores:', error);
            return [];
        }
    }
};
exports.HealthScoringService = HealthScoringService;
exports.HealthScoringService = HealthScoringService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService])
], HealthScoringService);
//# sourceMappingURL=HealthScoringService.js.map
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
exports.AnomalyDetectionService = void 0;
const warp_1 = require("@varld/warp");
let AnomalyDetectionService = class AnomalyDetectionService {
    thresholds = new Map();
    constructor() {
        this.initializeThresholds();
    }
    async detectAnomaly(reading, historicalData) {
        const statisticalAnomaly = this.detectStatisticalAnomaly(reading, historicalData);
        const thresholdAnomaly = this.detectThresholdAnomaly(reading);
        return statisticalAnomaly || thresholdAnomaly;
    }
    detectStatisticalAnomaly(reading, historicalData) {
        if (historicalData.length < 10) {
            return false;
        }
        const values = historicalData
            .filter(r => r.sensorType === reading.sensorType)
            .map(r => r.value)
            .slice(-50);
        if (values.length < 10) {
            return false;
        }
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const threshold = 3 * stdDev;
        const deviation = Math.abs(reading.value - mean);
        return deviation > threshold;
    }
    detectThresholdAnomaly(reading) {
        const threshold = this.thresholds.get(reading.sensorType);
        if (!threshold) {
            return false;
        }
        if (threshold.minValue !== undefined && reading.value < threshold.minValue) {
            return true;
        }
        if (threshold.maxValue !== undefined && reading.value > threshold.maxValue) {
            return true;
        }
        return false;
    }
    calculateAnomalySeverity(reading, historicalData) {
        const criticalSensors = ['temperature', 'pressure', 'oil_level'];
        const threshold = this.thresholds.get(reading.sensorType);
        let baseSeverity = 'medium';
        if (criticalSensors.includes(reading.sensorType)) {
            baseSeverity = 'high';
        }
        if (threshold) {
            if (threshold.maxValue && reading.value > threshold.maxValue * 1.2) {
                return 'critical';
            }
            if (threshold.minValue && reading.value < threshold.minValue * 0.8) {
                return 'critical';
            }
        }
        if (historicalData.length >= 10) {
            const values = historicalData
                .filter(r => r.sensorType === reading.sensorType)
                .map(r => r.value)
                .slice(-30);
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
            const deviation = Math.abs(reading.value - mean) / stdDev;
            if (deviation > 4)
                return 'critical';
            if (deviation > 3.5)
                return 'high';
            if (deviation > 3)
                return baseSeverity;
        }
        return baseSeverity;
    }
    initializeThresholds() {
        this.thresholds.set('temperature', {
            sensorType: 'temperature',
            minValue: -10,
            maxValue: 120
        });
        this.thresholds.set('pressure', {
            sensorType: 'pressure',
            minValue: 50,
            maxValue: 200
        });
        this.thresholds.set('oil_level', {
            sensorType: 'oil_level',
            minValue: 20,
            maxValue: 100
        });
        this.thresholds.set('fuel_level', {
            sensorType: 'fuel_level',
            minValue: 10,
            maxValue: 100
        });
        this.thresholds.set('vibration', {
            sensorType: 'vibration',
            minValue: 0,
            maxValue: 5.0
        });
        this.thresholds.set('rpm', {
            sensorType: 'rpm',
            minValue: 800,
            maxValue: 2500
        });
        this.thresholds.set('load', {
            sensorType: 'load',
            minValue: 0,
            maxValue: 100
        });
    }
};
exports.AnomalyDetectionService = AnomalyDetectionService;
exports.AnomalyDetectionService = AnomalyDetectionService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AnomalyDetectionService);
//# sourceMappingURL=AnomalyDetectionService.js.map
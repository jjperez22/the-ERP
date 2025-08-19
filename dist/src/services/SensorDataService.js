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
exports.SensorDataService = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../../services/DatabaseService");
let SensorDataService = class SensorDataService {
    databaseService;
    sensorData = new Map();
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async processSensorReading(reading) {
        try {
            const newReading = {
                id: this.generateId(),
                ...reading,
                timestamp: new Date()
            };
            await this.databaseService.create('sensor_readings', newReading);
            if (!this.sensorData.has(reading.equipmentId)) {
                this.sensorData.set(reading.equipmentId, []);
            }
            const readings = this.sensorData.get(reading.equipmentId);
            readings.push(newReading);
            if (readings.length > 1000) {
                readings.splice(0, readings.length - 1000);
            }
            return newReading;
        }
        catch (error) {
            console.error('Error processing sensor reading:', error);
            throw error;
        }
    }
    async getRecentReadings(equipmentId, limit = 100) {
        try {
            if (this.sensorData.has(equipmentId)) {
                return this.sensorData.get(equipmentId).slice(-limit);
            }
            const readings = await this.databaseService.find('sensor_readings', { equipmentId }, { limit, sort: { timestamp: -1 } });
            this.sensorData.set(equipmentId, readings.reverse());
            return readings;
        }
        catch (error) {
            console.error('Error getting recent readings:', error);
            return [];
        }
    }
    async getHistoricalData(equipmentId, sensorType, hours = 24) {
        try {
            const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            return await this.databaseService.find('sensor_readings', {
                equipmentId,
                sensorType,
                timestamp: { $gte: startTime }
            }, { sort: { timestamp: 1 } });
        }
        catch (error) {
            console.error('Error getting historical data:', error);
            return [];
        }
    }
    simulateReading(equipmentId, sensorType) {
        const baseValues = {
            temperature: { value: 85, unit: '°C', variance: 15 },
            vibration: { value: 2.5, unit: 'mm/s', variance: 1.0 },
            pressure: { value: 150, unit: 'bar', variance: 20 },
            oil_level: { value: 75, unit: '%', variance: 10 },
            fuel_level: { value: 60, unit: '%', variance: 15 },
            rpm: { value: 1800, unit: 'rpm', variance: 200 },
            load: { value: 65, unit: '%', variance: 20 }
        };
        const base = baseValues[sensorType];
        const value = base.value + (Math.random() - 0.5) * base.variance;
        return {
            equipmentId,
            sensorType,
            value: Math.round(value * 100) / 100,
            unit: base.unit,
            timestamp: new Date()
        };
    }
    generateId() {
        return 'sensor_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.SensorDataService = SensorDataService;
exports.SensorDataService = SensorDataService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService])
], SensorDataService);
//# sourceMappingURL=SensorDataService.js.map
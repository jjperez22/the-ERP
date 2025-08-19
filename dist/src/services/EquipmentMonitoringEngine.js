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
exports.EquipmentMonitoringEngine = void 0;
const warp_1 = require("@varld/warp");
const events_1 = require("events");
const DatabaseService_1 = require("../../services/DatabaseService");
const SensorDataService_1 = require("./SensorDataService");
const AnomalyDetectionService_1 = require("./AnomalyDetectionService");
const HealthScoringService_1 = require("./HealthScoringService");
const MaintenanceAlertService_1 = require("./MaintenanceAlertService");
let EquipmentMonitoringEngine = class EquipmentMonitoringEngine extends events_1.EventEmitter {
    databaseService;
    sensorDataService;
    anomalyDetectionService;
    healthScoringService;
    maintenanceAlertService;
    monitoringActive = false;
    simulationInterval;
    healthUpdateInterval;
    constructor(databaseService, sensorDataService, anomalyDetectionService, healthScoringService, maintenanceAlertService) {
        super();
        this.databaseService = databaseService;
        this.sensorDataService = sensorDataService;
        this.anomalyDetectionService = anomalyDetectionService;
        this.healthScoringService = healthScoringService;
        this.maintenanceAlertService = maintenanceAlertService;
        this.initializeEventHandlers();
    }
    async startMonitoring() {
        if (this.monitoringActive) {
            console.log('⚠️ Monitoring is already active');
            return;
        }
        console.log('🔍 Starting equipment monitoring system...');
        this.monitoringActive = true;
        this.startSensorSimulation();
        this.startHealthScoreUpdates();
        this.emit('monitoring_started', { timestamp: new Date() });
        console.log('✅ Equipment monitoring system started successfully');
    }
    async stopMonitoring() {
        console.log('🛑 Stopping equipment monitoring system...');
        this.monitoringActive = false;
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
        if (this.healthUpdateInterval) {
            clearInterval(this.healthUpdateInterval);
        }
        this.emit('monitoring_stopped', { timestamp: new Date() });
        console.log('✅ Equipment monitoring system stopped');
    }
    async addEquipment(equipment) {
        try {
            const newEquipment = {
                id: this.generateId(),
                ...equipment,
                operatingHours: 0,
                status: 'active'
            };
            await this.databaseService.create('equipment', newEquipment);
            console.log(`🏗️ Added equipment: ${newEquipment.name} (${newEquipment.type})`);
            this.emit('equipment_added', newEquipment);
            return newEquipment;
        }
        catch (error) {
            console.error('Error adding equipment:', error);
            throw error;
        }
    }
    async processSensorReading(reading) {
        try {
            const processedReading = await this.sensorDataService.processSensorReading(reading);
            const historicalData = await this.sensorDataService.getRecentReadings(reading.equipmentId, 100);
            const isAnomaly = await this.anomalyDetectionService.detectAnomaly(processedReading, historicalData);
            if (isAnomaly) {
                processedReading.isAnomaly = true;
                const severity = this.anomalyDetectionService.calculateAnomalySeverity(processedReading, historicalData);
                await this.maintenanceAlertService.createAnomalyAlert(processedReading, severity);
                this.emit('anomaly_detected', { reading: processedReading, severity });
            }
            await this.updateEquipmentHealth(reading.equipmentId);
            return processedReading;
        }
        catch (error) {
            console.error('Error processing sensor reading:', error);
            throw error;
        }
    }
    async getEquipmentHealth(equipmentId) {
        return await this.healthScoringService.getHealthScore(equipmentId);
    }
    async getAllEquipmentHealth() {
        return await this.healthScoringService.getAllHealthScores();
    }
    async getActiveAlerts(equipmentId) {
        return await this.maintenanceAlertService.getActiveAlerts(equipmentId);
    }
    async getCriticalAlerts() {
        return await this.maintenanceAlertService.getCriticalAlerts();
    }
    async acknowledgeAlert(alertId) {
        return await this.maintenanceAlertService.acknowledgeAlert(alertId);
    }
    async resolveAlert(alertId) {
        return await this.maintenanceAlertService.resolveAlert(alertId);
    }
    async getEquipmentList() {
        try {
            return await this.databaseService.find('equipment', {});
        }
        catch (error) {
            console.error('Error getting equipment list:', error);
            return [];
        }
    }
    async updateEquipmentHealth(equipmentId) {
        try {
            const recentReadings = await this.sensorDataService.getRecentReadings(equipmentId, 50);
            await this.healthScoringService.calculateHealthScore(equipmentId, recentReadings);
        }
        catch (error) {
            console.error('Error updating equipment health:', error);
        }
    }
    startSensorSimulation() {
        this.simulationInterval = setInterval(async () => {
            if (!this.monitoringActive)
                return;
            try {
                const equipment = await this.getEquipmentList();
                const activeEquipment = equipment.filter(eq => eq.status === 'active');
                for (const eq of activeEquipment) {
                    const sensorTypes = ['temperature', 'vibration', 'pressure', 'oil_level', 'fuel_level', 'rpm', 'load'];
                    for (const sensorType of sensorTypes) {
                        if (Math.random() > 0.4) {
                            const simulatedReading = this.sensorDataService.simulateReading(eq.id, sensorType);
                            await this.processSensorReading(simulatedReading);
                        }
                    }
                }
            }
            catch (error) {
                console.error('Error in sensor simulation:', error);
            }
        }, 30000);
    }
    startHealthScoreUpdates() {
        this.healthUpdateInterval = setInterval(async () => {
            if (!this.monitoringActive)
                return;
            try {
                const equipment = await this.getEquipmentList();
                const activeEquipment = equipment.filter(eq => eq.status === 'active');
                for (const eq of activeEquipment) {
                    await this.updateEquipmentHealth(eq.id);
                }
                console.log(`🔄 Updated health scores for ${activeEquipment.length} equipment units`);
            }
            catch (error) {
                console.error('Error updating health scores:', error);
            }
        }, 300000);
    }
    initializeEventHandlers() {
        this.maintenanceAlertService.on('alert_created', (alert) => {
            this.emit('maintenance_alert', alert);
        });
        this.maintenanceAlertService.on('alert_acknowledged', (alert) => {
            this.emit('alert_acknowledged', alert);
        });
        this.maintenanceAlertService.on('alert_resolved', (alert) => {
            this.emit('alert_resolved', alert);
        });
    }
    generateId() {
        return 'eq_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.EquipmentMonitoringEngine = EquipmentMonitoringEngine;
exports.EquipmentMonitoringEngine = EquipmentMonitoringEngine = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        SensorDataService_1.SensorDataService,
        AnomalyDetectionService_1.AnomalyDetectionService,
        HealthScoringService_1.HealthScoringService,
        MaintenanceAlertService_1.MaintenanceAlertService])
], EquipmentMonitoringEngine);
//# sourceMappingURL=EquipmentMonitoringEngine.js.map
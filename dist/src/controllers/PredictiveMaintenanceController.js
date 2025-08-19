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
exports.PredictiveMaintenanceController = void 0;
const warp_1 = require("@varld/warp");
const EquipmentMonitoringEngine_1 = require("../services/EquipmentMonitoringEngine");
let PredictiveMaintenanceController = class PredictiveMaintenanceController {
    equipmentMonitoringEngine;
    constructor(equipmentMonitoringEngine) {
        this.equipmentMonitoringEngine = equipmentMonitoringEngine;
    }
    async addEquipment(equipmentData) {
        try {
            console.log('🏗️ Adding new equipment:', equipmentData.name);
            return await this.equipmentMonitoringEngine.addEquipment(equipmentData);
        }
        catch (error) {
            console.error('Error adding equipment:', error);
            throw new Error('Failed to add equipment');
        }
    }
    async getEquipmentList() {
        try {
            return await this.equipmentMonitoringEngine.getEquipmentList();
        }
        catch (error) {
            console.error('Error getting equipment list:', error);
            throw new Error('Failed to get equipment list');
        }
    }
    async startMonitoring() {
        try {
            await this.equipmentMonitoringEngine.startMonitoring();
            return { success: true, message: 'Equipment monitoring started successfully' };
        }
        catch (error) {
            console.error('Error starting monitoring:', error);
            return { success: false, message: 'Failed to start monitoring' };
        }
    }
    async stopMonitoring() {
        try {
            await this.equipmentMonitoringEngine.stopMonitoring();
            return { success: true, message: 'Equipment monitoring stopped successfully' };
        }
        catch (error) {
            console.error('Error stopping monitoring:', error);
            return { success: false, message: 'Failed to stop monitoring' };
        }
    }
    async processSensorReading(reading) {
        try {
            console.log('📊 Processing sensor reading:', reading.sensorType, reading.value);
            return await this.equipmentMonitoringEngine.processSensorReading(reading);
        }
        catch (error) {
            console.error('Error processing sensor reading:', error);
            throw new Error('Failed to process sensor reading');
        }
    }
    async getEquipmentHealth(equipmentId) {
        try {
            const health = await this.equipmentMonitoringEngine.getEquipmentHealth(equipmentId);
            if (!health) {
                throw new Error('Equipment health data not found');
            }
            return health;
        }
        catch (error) {
            console.error('Error getting equipment health:', error);
            throw error;
        }
    }
    async getAllEquipmentHealth() {
        try {
            return await this.equipmentMonitoringEngine.getAllEquipmentHealth();
        }
        catch (error) {
            console.error('Error getting all equipment health:', error);
            throw new Error('Failed to get equipment health data');
        }
    }
    async getActiveAlerts(equipmentId) {
        try {
            return await this.equipmentMonitoringEngine.getActiveAlerts(equipmentId);
        }
        catch (error) {
            console.error('Error getting active alerts:', error);
            throw new Error('Failed to get maintenance alerts');
        }
    }
    async getCriticalAlerts() {
        try {
            return await this.equipmentMonitoringEngine.getCriticalAlerts();
        }
        catch (error) {
            console.error('Error getting critical alerts:', error);
            throw new Error('Failed to get critical alerts');
        }
    }
    async acknowledgeAlert(alertId) {
        try {
            const success = await this.equipmentMonitoringEngine.acknowledgeAlert(alertId);
            return { success };
        }
        catch (error) {
            console.error('Error acknowledging alert:', error);
            return { success: false };
        }
    }
    async resolveAlert(alertId) {
        try {
            const success = await this.equipmentMonitoringEngine.resolveAlert(alertId);
            return { success };
        }
        catch (error) {
            console.error('Error resolving alert:', error);
            return { success: false };
        }
    }
    async getDashboardData() {
        try {
            const [equipment, healthScores, alerts, criticalAlerts] = await Promise.all([
                this.equipmentMonitoringEngine.getEquipmentList(),
                this.equipmentMonitoringEngine.getAllEquipmentHealth(),
                this.equipmentMonitoringEngine.getActiveAlerts(),
                this.equipmentMonitoringEngine.getCriticalAlerts()
            ]);
            const activeEquipment = equipment.filter(eq => eq.status === 'active');
            const criticalEquipment = healthScores.filter(health => health.riskLevel === 'critical').length;
            const highRiskEquipment = healthScores.filter(health => health.riskLevel === 'high').length;
            return {
                summary: {
                    totalEquipment: equipment.length,
                    activeEquipment: activeEquipment.length,
                    criticalEquipment,
                    highRiskEquipment,
                    activeAlerts: alerts.length,
                    criticalAlerts: criticalAlerts.length
                },
                equipment: activeEquipment,
                healthScores: healthScores.slice(0, 10),
                recentAlerts: alerts.slice(0, 10),
                criticalAlerts: criticalAlerts
            };
        }
        catch (error) {
            console.error('Error getting dashboard data:', error);
            throw new Error('Failed to get dashboard data');
        }
    }
    async getAnalyticsTrends(days = 7) {
        try {
            const healthScores = await this.equipmentMonitoringEngine.getAllEquipmentHealth();
            const trends = {
                healthTrends: healthScores.map(health => ({
                    equipmentId: health.equipmentId,
                    overallScore: health.overallScore,
                    trendDirection: health.trendDirection,
                    riskLevel: health.riskLevel
                })),
                improvingEquipment: healthScores.filter(h => h.trendDirection === 'improving').length,
                decliningEquipment: healthScores.filter(h => h.trendDirection === 'declining').length,
                stableEquipment: healthScores.filter(h => h.trendDirection === 'stable').length
            };
            return trends;
        }
        catch (error) {
            console.error('Error getting analytics trends:', error);
            throw new Error('Failed to get analytics trends');
        }
    }
    async simulateEquipment() {
        try {
            const simulatedEquipment = [
                {
                    name: 'CAT 320 Excavator #1',
                    type: 'excavator',
                    model: 'CAT 320',
                    manufacturer: 'Caterpillar',
                    serialNumber: 'EX001-2023',
                    purchaseDate: new Date('2023-01-15'),
                    installationDate: new Date('2023-02-01'),
                    location: 'Site A - Block 1'
                },
                {
                    name: 'Liebherr LTM 1090 Crane',
                    type: 'crane',
                    model: 'LTM 1090',
                    manufacturer: 'Liebherr',
                    serialNumber: 'CR002-2022',
                    purchaseDate: new Date('2022-08-20'),
                    installationDate: new Date('2022-09-10'),
                    location: 'Site B - Central'
                },
                {
                    name: 'CAT D6T Bulldozer',
                    type: 'bulldozer',
                    model: 'D6T',
                    manufacturer: 'Caterpillar',
                    serialNumber: 'BD003-2023',
                    purchaseDate: new Date('2023-03-10'),
                    installationDate: new Date('2023-03-25'),
                    location: 'Site C - Zone 2'
                }
            ];
            const createdEquipment = [];
            for (const eq of simulatedEquipment) {
                const equipment = await this.equipmentMonitoringEngine.addEquipment(eq);
                createdEquipment.push(equipment);
            }
            return {
                message: `Created ${createdEquipment.length} simulated equipment units`,
                equipment: createdEquipment
            };
        }
        catch (error) {
            console.error('Error simulating equipment:', error);
            throw new Error('Failed to create simulated equipment');
        }
    }
};
exports.PredictiveMaintenanceController = PredictiveMaintenanceController;
__decorate([
    (0, warp_1.Post)('/equipment'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "addEquipment", null);
__decorate([
    (0, warp_1.Get)('/equipment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "getEquipmentList", null);
__decorate([
    (0, warp_1.Post)('/monitoring/start'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "startMonitoring", null);
__decorate([
    (0, warp_1.Post)('/monitoring/stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "stopMonitoring", null);
__decorate([
    (0, warp_1.Post)('/sensor-reading'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "processSensorReading", null);
__decorate([
    (0, warp_1.Get)('/health/:equipmentId'),
    __param(0, (0, warp_1.Param)('equipmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "getEquipmentHealth", null);
__decorate([
    (0, warp_1.Get)('/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "getAllEquipmentHealth", null);
__decorate([
    (0, warp_1.Get)('/alerts'),
    __param(0, (0, warp_1.Query)('equipmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "getActiveAlerts", null);
__decorate([
    (0, warp_1.Get)('/alerts/critical'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "getCriticalAlerts", null);
__decorate([
    (0, warp_1.Put)('/alerts/:alertId/acknowledge'),
    __param(0, (0, warp_1.Param)('alertId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "acknowledgeAlert", null);
__decorate([
    (0, warp_1.Put)('/alerts/:alertId/resolve'),
    __param(0, (0, warp_1.Param)('alertId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "resolveAlert", null);
__decorate([
    (0, warp_1.Get)('/dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "getDashboardData", null);
__decorate([
    (0, warp_1.Get)('/analytics/trends'),
    __param(0, (0, warp_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "getAnalyticsTrends", null);
__decorate([
    (0, warp_1.Post)('/simulate/equipment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PredictiveMaintenanceController.prototype, "simulateEquipment", null);
exports.PredictiveMaintenanceController = PredictiveMaintenanceController = __decorate([
    (0, warp_1.Controller)('/api/predictive-maintenance'),
    __param(0, (0, warp_1.Inject)('EquipmentMonitoringEngine')),
    __metadata("design:paramtypes", [EquipmentMonitoringEngine_1.EquipmentMonitoringEngine])
], PredictiveMaintenanceController);
//# sourceMappingURL=PredictiveMaintenanceController.js.map
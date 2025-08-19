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
exports.MaintenanceAlertService = void 0;
const warp_1 = require("@varld/warp");
const events_1 = require("events");
const DatabaseService_1 = require("../../services/DatabaseService");
let MaintenanceAlertService = class MaintenanceAlertService extends events_1.EventEmitter {
    databaseService;
    activeAlerts = new Map();
    constructor(databaseService) {
        super();
        this.databaseService = databaseService;
        this.loadActiveAlerts();
    }
    async createAlert(alertData) {
        try {
            const alert = {
                id: this.generateId(),
                ...alertData,
                createdAt: new Date(),
                acknowledged: false
            };
            await this.databaseService.create('maintenance_alerts', alert);
            this.activeAlerts.set(alert.id, alert);
            this.emit('alert_created', alert);
            console.log(`🚨 Maintenance alert created: ${alert.title} (${alert.severity})`);
            return alert;
        }
        catch (error) {
            console.error('Error creating maintenance alert:', error);
            throw error;
        }
    }
    async createAnomalyAlert(reading, severity) {
        const alertData = {
            equipmentId: reading.equipmentId,
            type: 'predictive',
            severity,
            title: `Anomaly Detected: ${reading.sensorType}`,
            description: `Abnormal ${reading.sensorType} reading: ${reading.value} ${reading.unit}`,
            recommendedAction: this.getRecommendedAction(reading.sensorType, severity),
            estimatedDowntime: this.estimateDowntime(severity),
            estimatedCost: this.estimateCost(severity)
        };
        return this.createAlert(alertData);
    }
    async acknowledgeAlert(alertId) {
        try {
            const alert = this.activeAlerts.get(alertId);
            if (!alert) {
                return false;
            }
            alert.acknowledged = true;
            await this.databaseService.update('maintenance_alerts', { id: alertId }, { acknowledged: true });
            this.emit('alert_acknowledged', alert);
            console.log(`✅ Alert acknowledged: ${alert.title}`);
            return true;
        }
        catch (error) {
            console.error('Error acknowledging alert:', error);
            return false;
        }
    }
    async resolveAlert(alertId) {
        try {
            const alert = this.activeAlerts.get(alertId);
            if (!alert) {
                return false;
            }
            this.activeAlerts.delete(alertId);
            await this.databaseService.update('maintenance_alerts', { id: alertId }, {
                resolved: true,
                resolvedAt: new Date()
            });
            this.emit('alert_resolved', alert);
            console.log(`✅ Alert resolved: ${alert.title}`);
            return true;
        }
        catch (error) {
            console.error('Error resolving alert:', error);
            return false;
        }
    }
    async getActiveAlerts(equipmentId) {
        let alerts = Array.from(this.activeAlerts.values());
        if (equipmentId) {
            alerts = alerts.filter(alert => alert.equipmentId === equipmentId);
        }
        return alerts.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }
    async getCriticalAlerts() {
        return Array.from(this.activeAlerts.values())
            .filter(alert => alert.severity === 'critical')
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    async getAlertsByEquipment(equipmentId) {
        return this.getActiveAlerts(equipmentId);
    }
    async getAlertHistory(equipmentId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            return await this.databaseService.find('maintenance_alerts', {
                equipmentId,
                createdAt: { $gte: startDate }
            }, { sort: { createdAt: -1 } });
        }
        catch (error) {
            console.error('Error getting alert history:', error);
            return [];
        }
    }
    async loadActiveAlerts() {
        try {
            const alerts = await this.databaseService.find('maintenance_alerts', {
                resolved: { $ne: true }
            });
            for (const alert of alerts) {
                this.activeAlerts.set(alert.id, alert);
            }
            console.log(`📋 Loaded ${alerts.length} active maintenance alerts`);
        }
        catch (error) {
            console.error('Error loading active alerts:', error);
        }
    }
    getRecommendedAction(sensorType, severity) {
        const actions = {
            temperature: {
                low: 'Monitor temperature trends closely',
                medium: 'Check cooling system and ventilation',
                high: 'Inspect cooling system immediately',
                critical: 'Shut down equipment and inspect cooling system'
            },
            pressure: {
                low: 'Monitor pressure readings',
                medium: 'Check hydraulic system for leaks',
                high: 'Inspect hydraulic system and filters immediately',
                critical: 'Emergency shutdown - inspect hydraulic system'
            },
            oil_level: {
                low: 'Check oil level at next scheduled maintenance',
                medium: 'Add oil and check for leaks',
                high: 'Add oil immediately and inspect for leaks',
                critical: 'Stop operation and add oil immediately'
            },
            vibration: {
                low: 'Monitor vibration patterns',
                medium: 'Check mechanical components and alignment',
                high: 'Inspect bearings and mechanical components',
                critical: 'Emergency shutdown - inspect all mechanical components'
            },
            fuel_level: {
                low: 'Schedule fuel refill',
                medium: 'Refill fuel tank',
                high: 'Refill fuel tank immediately',
                critical: 'Equipment will stop - refill fuel tank'
            },
            rpm: {
                low: 'Monitor engine performance',
                medium: 'Check engine tuning and filters',
                high: 'Inspect engine immediately',
                critical: 'Emergency shutdown - engine malfunction'
            },
            load: {
                low: 'Monitor load distribution',
                medium: 'Check load balancing',
                high: 'Redistribute load immediately',
                critical: 'Emergency stop - overload condition'
            }
        };
        return actions[sensorType]?.[severity] ||
            'Contact maintenance team for inspection';
    }
    estimateDowntime(severity) {
        const downtimes = {
            low: 1,
            medium: 2,
            high: 4,
            critical: 8
        };
        return downtimes[severity] || 2;
    }
    estimateCost(severity) {
        const costs = {
            low: 200,
            medium: 500,
            high: 1200,
            critical: 3000
        };
        return costs[severity] || 500;
    }
    generateId() {
        return 'alert_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.MaintenanceAlertService = MaintenanceAlertService;
exports.MaintenanceAlertService = MaintenanceAlertService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService])
], MaintenanceAlertService);
//# sourceMappingURL=MaintenanceAlertService.js.map
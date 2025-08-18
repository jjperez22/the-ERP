// src/services/MaintenanceAlertService.ts
import { Injectable } from '@varld/warp';
import { EventEmitter } from 'events';
import { DatabaseService } from '../../services/DatabaseService';
import { MaintenanceAlert, SensorReading } from './types/Equipment';

@Injectable()
export class MaintenanceAlertService extends EventEmitter {
  private activeAlerts: Map<string, MaintenanceAlert> = new Map();

  constructor(private databaseService: DatabaseService) {
    super();
    this.loadActiveAlerts();
  }

  async createAlert(alertData: Omit<MaintenanceAlert, 'id' | 'createdAt' | 'acknowledged'>): Promise<MaintenanceAlert> {
    try {
      const alert: MaintenanceAlert = {
        id: this.generateId(),
        ...alertData,
        createdAt: new Date(),
        acknowledged: false
      };

      // Store in database
      await this.databaseService.create('maintenance_alerts', alert);
      
      // Cache the alert
      this.activeAlerts.set(alert.id, alert);

      // Emit alert event
      this.emit('alert_created', alert);
      console.log(`🚨 Maintenance alert created: ${alert.title} (${alert.severity})`);

      return alert;
    } catch (error) {
      console.error('Error creating maintenance alert:', error);
      throw error;
    }
  }

  async createAnomalyAlert(reading: SensorReading, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<MaintenanceAlert> {
    const alertData = {
      equipmentId: reading.equipmentId,
      type: 'predictive' as const,
      severity,
      title: `Anomaly Detected: ${reading.sensorType}`,
      description: `Abnormal ${reading.sensorType} reading: ${reading.value} ${reading.unit}`,
      recommendedAction: this.getRecommendedAction(reading.sensorType, severity),
      estimatedDowntime: this.estimateDowntime(severity),
      estimatedCost: this.estimateCost(severity)
    };

    return this.createAlert(alertData);
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        return false;
      }

      alert.acknowledged = true;
      
      // Update in database
      await this.databaseService.update('maintenance_alerts', { id: alertId }, { acknowledged: true });
      
      this.emit('alert_acknowledged', alert);
      console.log(`✅ Alert acknowledged: ${alert.title}`);

      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        return false;
      }

      // Remove from active alerts
      this.activeAlerts.delete(alertId);
      
      // Update in database (mark as resolved)
      await this.databaseService.update('maintenance_alerts', { id: alertId }, { 
        resolved: true,
        resolvedAt: new Date()
      });
      
      this.emit('alert_resolved', alert);
      console.log(`✅ Alert resolved: ${alert.title}`);

      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  async getActiveAlerts(equipmentId?: string): Promise<MaintenanceAlert[]> {
    let alerts = Array.from(this.activeAlerts.values());
    
    if (equipmentId) {
      alerts = alerts.filter(alert => alert.equipmentId === equipmentId);
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  async getCriticalAlerts(): Promise<MaintenanceAlert[]> {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.severity === 'critical')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getAlertsByEquipment(equipmentId: string): Promise<MaintenanceAlert[]> {
    return this.getActiveAlerts(equipmentId);
  }

  async getAlertHistory(equipmentId: string, days: number = 30): Promise<MaintenanceAlert[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await this.databaseService.find('maintenance_alerts', {
        equipmentId,
        createdAt: { $gte: startDate }
      }, { sort: { createdAt: -1 } });
    } catch (error) {
      console.error('Error getting alert history:', error);
      return [];
    }
  }

  private async loadActiveAlerts(): Promise<void> {
    try {
      const alerts = await this.databaseService.find('maintenance_alerts', {
        resolved: { $ne: true }
      });

      for (const alert of alerts) {
        this.activeAlerts.set(alert.id, alert);
      }

      console.log(`📋 Loaded ${alerts.length} active maintenance alerts`);
    } catch (error) {
      console.error('Error loading active alerts:', error);
    }
  }

  private getRecommendedAction(sensorType: string, severity: string): string {
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

    return actions[sensorType as keyof typeof actions]?.[severity as keyof typeof actions.temperature] || 
           'Contact maintenance team for inspection';
  }

  private estimateDowntime(severity: string): number {
    const downtimes = {
      low: 1,
      medium: 2,
      high: 4,
      critical: 8
    };
    return downtimes[severity as keyof typeof downtimes] || 2;
  }

  private estimateCost(severity: string): number {
    const costs = {
      low: 200,
      medium: 500,
      high: 1200,
      critical: 3000
    };
    return costs[severity as keyof typeof costs] || 500;
  }

  private generateId(): string {
    return 'alert_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// src/services/EquipmentMonitoringEngine.ts
import { Injectable } from '@varld/warp';
import { EventEmitter } from 'events';
import { DatabaseService } from '../../services/DatabaseService';
import { SensorDataService } from './SensorDataService';
import { AnomalyDetectionService } from './AnomalyDetectionService';
import { HealthScoringService } from './HealthScoringService';
import { MaintenanceAlertService } from './MaintenanceAlertService';
import { Equipment, SensorReading, HealthScore, MaintenanceAlert } from './types/Equipment';

@Injectable()
export class EquipmentMonitoringEngine extends EventEmitter {
  private monitoringActive: boolean = false;
  private simulationInterval?: NodeJS.Timeout;
  private healthUpdateInterval?: NodeJS.Timeout;

  constructor(
    private databaseService: DatabaseService,
    private sensorDataService: SensorDataService,
    private anomalyDetectionService: AnomalyDetectionService,
    private healthScoringService: HealthScoringService,
    private maintenanceAlertService: MaintenanceAlertService
  ) {
    super();
    this.initializeEventHandlers();
  }

  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.log('⚠️ Monitoring is already active');
      return;
    }

    console.log('🔍 Starting equipment monitoring system...');
    this.monitoringActive = true;

    // Start sensor data simulation
    this.startSensorSimulation();
    
    // Start periodic health score updates
    this.startHealthScoreUpdates();

    this.emit('monitoring_started', { timestamp: new Date() });
    console.log('✅ Equipment monitoring system started successfully');
  }

  async stopMonitoring(): Promise<void> {
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

  async addEquipment(equipment: Omit<Equipment, 'id'>): Promise<Equipment> {
    try {
      const newEquipment: Equipment = {
        id: this.generateId(),
        ...equipment,
        operatingHours: 0,
        status: 'active'
      };

      await this.databaseService.create('equipment', newEquipment);
      
      console.log(`🏗️ Added equipment: ${newEquipment.name} (${newEquipment.type})`);
      this.emit('equipment_added', newEquipment);

      return newEquipment;
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw error;
    }
  }

  async processSensorReading(reading: Omit<SensorReading, 'id'>): Promise<SensorReading> {
    try {
      // Process the sensor reading
      const processedReading = await this.sensorDataService.processSensorReading(reading);
      
      // Get historical data for anomaly detection
      const historicalData = await this.sensorDataService.getRecentReadings(reading.equipmentId, 100);
      
      // Check for anomalies
      const isAnomaly = await this.anomalyDetectionService.detectAnomaly(processedReading, historicalData);
      
      if (isAnomaly) {
        processedReading.isAnomaly = true;
        
        // Calculate anomaly severity
        const severity = this.anomalyDetectionService.calculateAnomalySeverity(processedReading, historicalData);
        
        // Create maintenance alert
        await this.maintenanceAlertService.createAnomalyAlert(processedReading, severity);
        
        this.emit('anomaly_detected', { reading: processedReading, severity });
      }

      // Update health score
      await this.updateEquipmentHealth(reading.equipmentId);

      return processedReading;
    } catch (error) {
      console.error('Error processing sensor reading:', error);
      throw error;
    }
  }

  async getEquipmentHealth(equipmentId: string): Promise<HealthScore | null> {
    return await this.healthScoringService.getHealthScore(equipmentId);
  }

  async getAllEquipmentHealth(): Promise<HealthScore[]> {
    return await this.healthScoringService.getAllHealthScores();
  }

  async getActiveAlerts(equipmentId?: string): Promise<MaintenanceAlert[]> {
    return await this.maintenanceAlertService.getActiveAlerts(equipmentId);
  }

  async getCriticalAlerts(): Promise<MaintenanceAlert[]> {
    return await this.maintenanceAlertService.getCriticalAlerts();
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    return await this.maintenanceAlertService.acknowledgeAlert(alertId);
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    return await this.maintenanceAlertService.resolveAlert(alertId);
  }

  async getEquipmentList(): Promise<Equipment[]> {
    try {
      return await this.databaseService.find('equipment', {});
    } catch (error) {
      console.error('Error getting equipment list:', error);
      return [];
    }
  }

  private async updateEquipmentHealth(equipmentId: string): Promise<void> {
    try {
      const recentReadings = await this.sensorDataService.getRecentReadings(equipmentId, 50);
      await this.healthScoringService.calculateHealthScore(equipmentId, recentReadings);
    } catch (error) {
      console.error('Error updating equipment health:', error);
    }
  }

  private startSensorSimulation(): void {
    this.simulationInterval = setInterval(async () => {
      if (!this.monitoringActive) return;
      
      try {
        const equipment = await this.getEquipmentList();
        const activeEquipment = equipment.filter(eq => eq.status === 'active');
        
        for (const eq of activeEquipment) {
          // Generate random sensor readings
          const sensorTypes: Array<SensorReading['sensorType']> = 
            ['temperature', 'vibration', 'pressure', 'oil_level', 'fuel_level', 'rpm', 'load'];
          
          for (const sensorType of sensorTypes) {
            if (Math.random() > 0.4) { // 60% chance of reading
              const simulatedReading = this.sensorDataService.simulateReading(eq.id, sensorType);
              await this.processSensorReading(simulatedReading);
            }
          }
        }
      } catch (error) {
        console.error('Error in sensor simulation:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private startHealthScoreUpdates(): void {
    this.healthUpdateInterval = setInterval(async () => {
      if (!this.monitoringActive) return;
      
      try {
        const equipment = await this.getEquipmentList();
        const activeEquipment = equipment.filter(eq => eq.status === 'active');
        
        for (const eq of activeEquipment) {
          await this.updateEquipmentHealth(eq.id);
        }
        
        console.log(`🔄 Updated health scores for ${activeEquipment.length} equipment units`);
      } catch (error) {
        console.error('Error updating health scores:', error);
      }
    }, 300000); // Every 5 minutes
  }

  private initializeEventHandlers(): void {
    // Handle maintenance alert events
    this.maintenanceAlertService.on('alert_created', (alert: MaintenanceAlert) => {
      this.emit('maintenance_alert', alert);
    });

    this.maintenanceAlertService.on('alert_acknowledged', (alert: MaintenanceAlert) => {
      this.emit('alert_acknowledged', alert);
    });

    this.maintenanceAlertService.on('alert_resolved', (alert: MaintenanceAlert) => {
      this.emit('alert_resolved', alert);
    });
  }

  private generateId(): string {
    return 'eq_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

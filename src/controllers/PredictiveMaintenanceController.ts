// src/controllers/PredictiveMaintenanceController.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@varld/warp';
import { EquipmentMonitoringEngine } from '../services/EquipmentMonitoringEngine';
import { Equipment, SensorReading } from '../services/types/Equipment';

@Controller('/api/predictive-maintenance')
export class PredictiveMaintenanceController {
  constructor(
    @Inject('EquipmentMonitoringEngine') 
    private equipmentMonitoringEngine: EquipmentMonitoringEngine
  ) {}

  // Equipment Management
  @Post('/equipment')
  async addEquipment(@Body() equipmentData: Omit<Equipment, 'id'>): Promise<Equipment> {
    try {
      console.log('🏗️ Adding new equipment:', equipmentData.name);
      return await this.equipmentMonitoringEngine.addEquipment(equipmentData);
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw new Error('Failed to add equipment');
    }
  }

  @Get('/equipment')
  async getEquipmentList(): Promise<Equipment[]> {
    try {
      return await this.equipmentMonitoringEngine.getEquipmentList();
    } catch (error) {
      console.error('Error getting equipment list:', error);
      throw new Error('Failed to get equipment list');
    }
  }

  // Monitoring Control
  @Post('/monitoring/start')
  async startMonitoring(): Promise<{ success: boolean; message: string }> {
    try {
      await this.equipmentMonitoringEngine.startMonitoring();
      return { success: true, message: 'Equipment monitoring started successfully' };
    } catch (error) {
      console.error('Error starting monitoring:', error);
      return { success: false, message: 'Failed to start monitoring' };
    }
  }

  @Post('/monitoring/stop')
  async stopMonitoring(): Promise<{ success: boolean; message: string }> {
    try {
      await this.equipmentMonitoringEngine.stopMonitoring();
      return { success: true, message: 'Equipment monitoring stopped successfully' };
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      return { success: false, message: 'Failed to stop monitoring' };
    }
  }

  // Sensor Data
  @Post('/sensor-reading')
  async processSensorReading(@Body() reading: Omit<SensorReading, 'id'>): Promise<SensorReading> {
    try {
      console.log('📊 Processing sensor reading:', reading.sensorType, reading.value);
      return await this.equipmentMonitoringEngine.processSensorReading(reading);
    } catch (error) {
      console.error('Error processing sensor reading:', error);
      throw new Error('Failed to process sensor reading');
    }
  }

  // Health Monitoring
  @Get('/health/:equipmentId')
  async getEquipmentHealth(@Param('equipmentId') equipmentId: string) {
    try {
      const health = await this.equipmentMonitoringEngine.getEquipmentHealth(equipmentId);
      if (!health) {
        throw new Error('Equipment health data not found');
      }
      return health;
    } catch (error) {
      console.error('Error getting equipment health:', error);
      throw error;
    }
  }

  @Get('/health')
  async getAllEquipmentHealth() {
    try {
      return await this.equipmentMonitoringEngine.getAllEquipmentHealth();
    } catch (error) {
      console.error('Error getting all equipment health:', error);
      throw new Error('Failed to get equipment health data');
    }
  }

  // Maintenance Alerts
  @Get('/alerts')
  async getActiveAlerts(@Query('equipmentId') equipmentId?: string) {
    try {
      return await this.equipmentMonitoringEngine.getActiveAlerts(equipmentId);
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw new Error('Failed to get maintenance alerts');
    }
  }

  @Get('/alerts/critical')
  async getCriticalAlerts() {
    try {
      return await this.equipmentMonitoringEngine.getCriticalAlerts();
    } catch (error) {
      console.error('Error getting critical alerts:', error);
      throw new Error('Failed to get critical alerts');
    }
  }

  @Put('/alerts/:alertId/acknowledge')
  async acknowledgeAlert(@Param('alertId') alertId: string): Promise<{ success: boolean }> {
    try {
      const success = await this.equipmentMonitoringEngine.acknowledgeAlert(alertId);
      return { success };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return { success: false };
    }
  }

  @Put('/alerts/:alertId/resolve')
  async resolveAlert(@Param('alertId') alertId: string): Promise<{ success: boolean }> {
    try {
      const success = await this.equipmentMonitoringEngine.resolveAlert(alertId);
      return { success };
    } catch (error) {
      console.error('Error resolving alert:', error);
      return { success: false };
    }
  }

  // Analytics & Insights
  @Get('/dashboard')
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
        healthScores: healthScores.slice(0, 10), // Top 10 worst health scores
        recentAlerts: alerts.slice(0, 10), // Most recent alerts
        criticalAlerts: criticalAlerts
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to get dashboard data');
    }
  }

  @Get('/analytics/trends')
  async getAnalyticsTrends(@Query('days') days: number = 7) {
    try {
      const healthScores = await this.equipmentMonitoringEngine.getAllEquipmentHealth();
      
      // Simplified trend analysis
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
    } catch (error) {
      console.error('Error getting analytics trends:', error);
      throw new Error('Failed to get analytics trends');
    }
  }

  @Post('/simulate/equipment')
  async simulateEquipment(): Promise<{ message: string; equipment: Equipment[] }> {
    try {
      const simulatedEquipment = [
        {
          name: 'CAT 320 Excavator #1',
          type: 'excavator' as const,
          model: 'CAT 320',
          manufacturer: 'Caterpillar',
          serialNumber: 'EX001-2023',
          purchaseDate: new Date('2023-01-15'),
          installationDate: new Date('2023-02-01'),
          location: 'Site A - Block 1'
        },
        {
          name: 'Liebherr LTM 1090 Crane',
          type: 'crane' as const,
          model: 'LTM 1090',
          manufacturer: 'Liebherr',
          serialNumber: 'CR002-2022',
          purchaseDate: new Date('2022-08-20'),
          installationDate: new Date('2022-09-10'),
          location: 'Site B - Central'
        },
        {
          name: 'CAT D6T Bulldozer',
          type: 'bulldozer' as const,
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
    } catch (error) {
      console.error('Error simulating equipment:', error);
      throw new Error('Failed to create simulated equipment');
    }
  }
}

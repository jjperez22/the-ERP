// src/services/SensorDataService.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';
import { SensorReading } from './types/Equipment';

@Injectable()
export class SensorDataService {
  private sensorData: Map<string, SensorReading[]> = new Map();

  constructor(private databaseService: DatabaseService) {}

  async processSensorReading(reading: Omit<SensorReading, 'id'>): Promise<SensorReading> {
    try {
      const newReading: SensorReading = {
        id: this.generateId(),
        ...reading,
        timestamp: new Date()
      };

      // Store reading in database
      await this.databaseService.create('sensor_readings', newReading);
      
      // Update in-memory cache
      if (!this.sensorData.has(reading.equipmentId)) {
        this.sensorData.set(reading.equipmentId, []);
      }
      
      const readings = this.sensorData.get(reading.equipmentId)!;
      readings.push(newReading);
      
      // Keep only recent readings (last 1000)
      if (readings.length > 1000) {
        readings.splice(0, readings.length - 1000);
      }

      return newReading;
    } catch (error) {
      console.error('Error processing sensor reading:', error);
      throw error;
    }
  }

  async getRecentReadings(equipmentId: string, limit: number = 100): Promise<SensorReading[]> {
    try {
      // Check cache first
      if (this.sensorData.has(equipmentId)) {
        return this.sensorData.get(equipmentId)!.slice(-limit);
      }

      // Fetch from database
      const readings = await this.databaseService.find('sensor_readings', 
        { equipmentId },
        { limit, sort: { timestamp: -1 } }
      );

      // Update cache
      this.sensorData.set(equipmentId, readings.reverse());

      return readings;
    } catch (error) {
      console.error('Error getting recent readings:', error);
      return [];
    }
  }

  async getHistoricalData(equipmentId: string, sensorType: string, hours: number = 24): Promise<SensorReading[]> {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      return await this.databaseService.find('sensor_readings', {
        equipmentId,
        sensorType,
        timestamp: { $gte: startTime }
      }, { sort: { timestamp: 1 } });
    } catch (error) {
      console.error('Error getting historical data:', error);
      return [];
    }
  }

  simulateReading(equipmentId: string, sensorType: SensorReading['sensorType']): Omit<SensorReading, 'id'> {
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

  private generateId(): string {
    return 'sensor_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

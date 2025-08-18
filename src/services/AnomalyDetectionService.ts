// src/services/AnomalyDetectionService.ts
import { Injectable } from '@varld/warp';
import { SensorReading } from './types/Equipment';

interface AnomalyThreshold {
  sensorType: string;
  minValue?: number;
  maxValue?: number;
  maxDeviation?: number;
}

@Injectable()
export class AnomalyDetectionService {
  private thresholds: Map<string, AnomalyThreshold> = new Map();

  constructor() {
    this.initializeThresholds();
  }

  async detectAnomaly(reading: SensorReading, historicalData: SensorReading[]): Promise<boolean> {
    // Statistical anomaly detection
    const statisticalAnomaly = this.detectStatisticalAnomaly(reading, historicalData);
    
    // Threshold-based anomaly detection
    const thresholdAnomaly = this.detectThresholdAnomaly(reading);
    
    return statisticalAnomaly || thresholdAnomaly;
  }

  private detectStatisticalAnomaly(reading: SensorReading, historicalData: SensorReading[]): boolean {
    if (historicalData.length < 10) {
      return false; // Need more data for statistical analysis
    }

    const values = historicalData
      .filter(r => r.sensorType === reading.sensorType)
      .map(r => r.value)
      .slice(-50); // Use last 50 readings

    if (values.length < 10) {
      return false;
    }

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Anomaly detection: value is more than 3 standard deviations from mean
    const threshold = 3 * stdDev;
    const deviation = Math.abs(reading.value - mean);

    return deviation > threshold;
  }

  private detectThresholdAnomaly(reading: SensorReading): boolean {
    const threshold = this.thresholds.get(reading.sensorType);
    
    if (!threshold) {
      return false;
    }

    // Check min/max thresholds
    if (threshold.minValue !== undefined && reading.value < threshold.minValue) {
      return true;
    }

    if (threshold.maxValue !== undefined && reading.value > threshold.maxValue) {
      return true;
    }

    return false;
  }

  calculateAnomalySeverity(reading: SensorReading, historicalData: SensorReading[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalSensors = ['temperature', 'pressure', 'oil_level'];
    const threshold = this.thresholds.get(reading.sensorType);

    // Base severity on sensor type
    let baseSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (criticalSensors.includes(reading.sensorType)) {
      baseSeverity = 'high';
    }

    // Adjust based on threshold violations
    if (threshold) {
      if (threshold.maxValue && reading.value > threshold.maxValue * 1.2) {
        return 'critical';
      }
      if (threshold.minValue && reading.value < threshold.minValue * 0.8) {
        return 'critical';
      }
    }

    // Adjust based on statistical deviation
    if (historicalData.length >= 10) {
      const values = historicalData
        .filter(r => r.sensorType === reading.sensorType)
        .map(r => r.value)
        .slice(-30);

      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
      const deviation = Math.abs(reading.value - mean) / stdDev;

      if (deviation > 4) return 'critical';
      if (deviation > 3.5) return 'high';
      if (deviation > 3) return baseSeverity;
    }

    return baseSeverity;
  }

  private initializeThresholds(): void {
    // Initialize sensor thresholds based on equipment specifications
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
}

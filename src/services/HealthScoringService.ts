// src/services/HealthScoringService.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';
import { HealthScore, SensorReading } from './types/Equipment';

@Injectable()
export class HealthScoringService {
  private healthScores: Map<string, HealthScore> = new Map();

  constructor(private databaseService: DatabaseService) {}

  async calculateHealthScore(equipmentId: string, recentReadings: SensorReading[]): Promise<HealthScore> {
    if (recentReadings.length === 0) {
      // Default health score for equipment without data
      return this.createDefaultHealthScore(equipmentId);
    }

    // Calculate component scores based on sensor readings
    const tempReadings = recentReadings.filter(r => r.sensorType === 'temperature');
    const vibrationReadings = recentReadings.filter(r => r.sensorType === 'vibration');
    const pressureReadings = recentReadings.filter(r => r.sensorType === 'pressure');
    const oilReadings = recentReadings.filter(r => r.sensorType === 'oil_level');

    const engineScore = this.calculateComponentScore(tempReadings, 'temperature');
    const hydraulicsScore = this.calculateComponentScore(pressureReadings, 'pressure');
    const electricalScore = this.calculateComponentScore(vibrationReadings, 'vibration');
    const mechanicalScore = this.calculateComponentScore(oilReadings, 'oil_level');

    const overallScore = (engineScore + hydraulicsScore + electricalScore + mechanicalScore) / 4;

    // Determine trend direction
    const oldHealth = this.healthScores.get(equipmentId);
    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (oldHealth) {
      const scoreDiff = overallScore - oldHealth.overallScore;
      if (scoreDiff > 2) trendDirection = 'improving';
      else if (scoreDiff < -2) trendDirection = 'declining';
    }

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(overallScore);

    const healthScore: HealthScore = {
      equipmentId,
      overallScore: Math.round(overallScore),
      componentScores: {
        engine: Math.round(engineScore),
        hydraulics: Math.round(hydraulicsScore),
        electrical: Math.round(electricalScore),
        mechanical: Math.round(mechanicalScore)
      },
      lastUpdated: new Date(),
      trendDirection,
      riskLevel
    };

    // Cache and store the health score
    this.healthScores.set(equipmentId, healthScore);
    await this.databaseService.create('equipment_health', healthScore);

    return healthScore;
  }

  async getHealthScore(equipmentId: string): Promise<HealthScore | null> {
    // Check cache first
    if (this.healthScores.has(equipmentId)) {
      return this.healthScores.get(equipmentId)!;
    }

    // Try to load from database
    try {
      const healthData = await this.databaseService.findOne('equipment_health', { equipmentId });
      if (healthData) {
        this.healthScores.set(equipmentId, healthData);
        return healthData;
      }
    } catch (error) {
      console.error('Error loading health score:', error);
    }

    return null;
  }

  private calculateComponentScore(readings: SensorReading[], sensorType: string): number {
    if (readings.length === 0) return 85; // Default score

    const anomalyCount = readings.filter(r => r.isAnomaly).length;
    const anomalyRate = anomalyCount / readings.length;

    // Base score starts at 100, reduced by anomaly rate
    let score = 100 - (anomalyRate * 50);

    // Additional penalties based on sensor type
    const avgValue = readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
    
    switch (sensorType) {
      case 'temperature':
        if (avgValue > 100) score -= 10; // High temperature penalty
        if (avgValue > 120) score -= 20;
        break;
      case 'vibration':
        if (avgValue > 3.5) score -= 15; // High vibration penalty
        if (avgValue > 4.5) score -= 25;
        break;
      case 'oil_level':
        if (avgValue < 30) score -= 25; // Low oil penalty
        if (avgValue < 20) score -= 40;
        break;
      case 'pressure':
        if (avgValue > 180) score -= 15; // High pressure penalty
        if (avgValue < 80) score -= 15; // Low pressure penalty
        break;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateRiskLevel(overallScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (overallScore < 30) return 'critical';
    if (overallScore < 50) return 'high';
    if (overallScore < 70) return 'medium';
    return 'low';
  }

  private createDefaultHealthScore(equipmentId: string): HealthScore {
    const defaultHealth: HealthScore = {
      equipmentId,
      overallScore: 85,
      componentScores: { 
        engine: 85, 
        hydraulics: 85, 
        electrical: 85, 
        mechanical: 85 
      },
      lastUpdated: new Date(),
      trendDirection: 'stable',
      riskLevel: 'low'
    };
    
    this.healthScores.set(equipmentId, defaultHealth);
    return defaultHealth;
  }

  async getAllHealthScores(): Promise<HealthScore[]> {
    try {
      return Array.from(this.healthScores.values())
        .sort((a, b) => a.overallScore - b.overallScore); // Worst first
    } catch (error) {
      console.error('Error getting all health scores:', error);
      return [];
    }
  }
}

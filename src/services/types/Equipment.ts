// src/services/types/Equipment.ts

export interface Equipment {
  id: string;
  name: string;
  type: 'excavator' | 'crane' | 'bulldozer' | 'generator' | 'compressor' | 'mixer' | 'pump';
  model: string;
  manufacturer: string;
  serialNumber: string;
  purchaseDate: Date;
  installationDate: Date;
  location: string;
  status: 'active' | 'maintenance' | 'breakdown' | 'retired';
  operatingHours: number;
  lastMaintenanceDate?: Date;
  nextScheduledMaintenance?: Date;
  warrantyCoverage?: Date;
}

export interface SensorReading {
  id: string;
  equipmentId: string;
  sensorType: 'temperature' | 'vibration' | 'pressure' | 'oil_level' | 'fuel_level' | 'rpm' | 'load';
  value: number;
  unit: string;
  timestamp: Date;
  location?: string;
  isAnomaly?: boolean;
}

export interface HealthScore {
  equipmentId: string;
  overallScore: number;
  componentScores: {
    engine: number;
    hydraulics: number;
    electrical: number;
    mechanical: number;
  };
  lastUpdated: Date;
  trendDirection: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceAlert {
  id: string;
  equipmentId: string;
  type: 'scheduled' | 'predictive' | 'emergency' | 'inspection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendedAction: string;
  predictedFailureDate?: Date;
  estimatedDowntime: number;
  estimatedCost: number;
  createdAt: Date;
  acknowledged: boolean;
}

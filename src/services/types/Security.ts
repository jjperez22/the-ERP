// src/services/types/Security.ts

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'transaction' | 'data_access' | 'permission_change' | 'system_access' | 'file_access';
  userId: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  location?: GeoLocation;
  deviceFingerprint?: DeviceFingerprint;
  success: boolean;
  metadata: Record<string, any>;
  riskScore: number;
  flaggedAsAnomaly?: boolean;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  isp?: string;
}

export interface DeviceFingerprint {
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  screenResolution: string;
  timezone: string;
  language: string;
  cookiesEnabled: boolean;
  javaScriptEnabled: boolean;
  flashEnabled: boolean;
  plugins: string[];
  fonts: string[];
  canvas: string;
  webgl: string;
}

export interface UserBehaviorProfile {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  loginPatterns: {
    typicalHours: number[];
    typicalDays: number[];
    frequentLocations: GeoLocation[];
    averageSessionDuration: number;
    typicalDevices: DeviceFingerprint[];
  };
  transactionPatterns: {
    averageAmount: number;
    maxAmount: number;
    frequentCategories: string[];
    typicalFrequency: number;
    timeDistribution: number[];
  };
  accessPatterns: {
    frequentModules: string[];
    permissionLevels: string[];
    dataAccessVolume: number;
    operationTypes: string[];
  };
  riskIndicators: {
    anomalyCount: number;
    lastAnomalyDate?: Date;
    highRiskActions: number;
    suspiciousPatterns: string[];
  };
}

export interface SecurityAlert {
  id: string;
  type: 'fraud_detection' | 'behavioral_anomaly' | 'security_breach' | 'unauthorized_access' | 'data_leak' | 'suspicious_transaction';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  userId: string;
  relatedEvents: string[];
  detectedAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  riskScore: number;
  confidence: number;
  recommendedActions: string[];
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'financial' | 'system_integrity';
}

export interface FraudIndicator {
  type: 'velocity' | 'amount' | 'location' | 'device' | 'pattern' | 'behavioral';
  description: string;
  weight: number;
  value: any;
  threshold: any;
  exceeded: boolean;
}

export interface ThreatIntelligence {
  id: string;
  type: 'ip_reputation' | 'malware_hash' | 'domain_reputation' | 'attack_pattern' | 'vulnerability';
  value: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  lastUpdated: Date;
  description: string;
  tags: string[];
  iocs: string[]; // Indicators of Compromise
}

export interface AccessAttempt {
  id: string;
  userId: string;
  resource: string;
  action: string;
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  reason?: string;
  riskFactors: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  changes?: Record<string, { before: any; after: any }>;
  metadata: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

export interface SecurityConfig {
  fraudDetection: {
    enabled: boolean;
    maxTransactionAmount: number;
    maxDailyTransactions: number;
    maxVelocity: number;
    geoFencing: boolean;
    deviceTracking: boolean;
  };
  behaviorAnalysis: {
    enabled: boolean;
    learningPeriod: number; // days
    anomalyThreshold: number;
    profileUpdateInterval: number; // hours
  };
  alerting: {
    enabled: boolean;
    emailNotifications: boolean;
    slackNotifications: boolean;
    smsNotifications: boolean;
    realTimeAlerts: boolean;
  };
  threatIntelligence: {
    enabled: boolean;
    updateInterval: number; // hours
    sources: string[];
    autoBlock: boolean;
  };
}

export interface RiskAssessment {
  userId: string;
  overallRisk: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  riskScore: number; // 0-100
  factors: {
    behavioral: number;
    geographical: number;
    transactional: number;
    temporal: number;
    device: number;
  };
  recommendations: string[];
  timestamp: Date;
  validUntil: Date;
}

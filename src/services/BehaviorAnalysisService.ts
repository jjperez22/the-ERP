// src/services/BehaviorAnalysisService.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';
import { SecurityEvent, UserBehaviorProfile, GeoLocation, DeviceFingerprint } from './types/Security';

@Injectable()
export class BehaviorAnalysisService {
  private behaviorProfiles: Map<string, UserBehaviorProfile> = new Map();
  private learningPeriod: number = 30; // days
  private anomalyThreshold: number = 0.7; // 70% confidence for anomaly

  constructor(private databaseService: DatabaseService) {}

  async analyzeEvent(event: SecurityEvent): Promise<{ isAnomalous: boolean; anomalyScore: number; reasons: string[] }> {
    try {
      const profile = await this.getUserProfile(event.userId);
      const anomalyReasons: string[] = [];
      let anomalyScore = 0;

      if (!profile) {
        // New user - create profile but don't flag as anomalous
        await this.createUserProfile(event.userId, event);
        return { isAnomalous: false, anomalyScore: 0, reasons: ['New user - creating behavioral profile'] };
      }

      // Analyze different behavioral aspects
      const locationAnomaly = this.analyzeLocationAnomaly(event, profile);
      const timeAnomaly = this.analyzeTimeAnomaly(event, profile);
      const deviceAnomaly = this.analyzeDeviceAnomaly(event, profile);
      const velocityAnomaly = this.analyzeVelocityAnomaly(event, profile);
      const patternAnomaly = this.analyzePatternAnomaly(event, profile);

      anomalyScore = Math.max(locationAnomaly.score, timeAnomaly.score, deviceAnomaly.score, velocityAnomaly.score, patternAnomaly.score);

      if (locationAnomaly.isAnomalous) anomalyReasons.push(locationAnomaly.reason);
      if (timeAnomaly.isAnomalous) anomalyReasons.push(timeAnomaly.reason);
      if (deviceAnomaly.isAnomalous) anomalyReasons.push(deviceAnomaly.reason);
      if (velocityAnomaly.isAnomalous) anomalyReasons.push(velocityAnomaly.reason);
      if (patternAnomaly.isAnomalous) anomalyReasons.push(patternAnomaly.reason);

      const isAnomalous = anomalyScore > this.anomalyThreshold;

      // Update user profile with new event
      await this.updateUserProfile(event.userId, event);

      return { isAnomalous, anomalyScore, reasons: anomalyReasons };

    } catch (error) {
      console.error('Error analyzing behavioral event:', error);
      return { isAnomalous: false, anomalyScore: 0, reasons: ['Analysis error'] };
    }
  }

  async getUserProfile(userId: string): Promise<UserBehaviorProfile | null> {
    try {
      // Check cache first
      if (this.behaviorProfiles.has(userId)) {
        return this.behaviorProfiles.get(userId)!;
      }

      // Load from database
      const profile = await this.databaseService.findOne('user_behavior_profiles', { userId });
      if (profile) {
        this.behaviorProfiles.set(userId, profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async createUserProfile(userId: string, initialEvent: SecurityEvent): Promise<UserBehaviorProfile> {
    const profile: UserBehaviorProfile = {
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      loginPatterns: {
        typicalHours: [new Date().getHours()],
        typicalDays: [new Date().getDay()],
        frequentLocations: initialEvent.location ? [initialEvent.location] : [],
        averageSessionDuration: 3600, // Default 1 hour
        typicalDevices: initialEvent.deviceFingerprint ? [initialEvent.deviceFingerprint] : []
      },
      transactionPatterns: {
        averageAmount: 0,
        maxAmount: 0,
        frequentCategories: [],
        typicalFrequency: 0,
        timeDistribution: Array(24).fill(0)
      },
      accessPatterns: {
        frequentModules: [],
        permissionLevels: [],
        dataAccessVolume: 0,
        operationTypes: []
      },
      riskIndicators: {
        anomalyCount: 0,
        highRiskActions: 0,
        suspiciousPatterns: []
      }
    };

    await this.databaseService.create('user_behavior_profiles', profile);
    this.behaviorProfiles.set(userId, profile);

    console.log(`🧠 Created behavioral profile for user: ${userId}`);
    return profile;
  }

  private analyzeLocationAnomaly(event: SecurityEvent, profile: UserBehaviorProfile): { isAnomalous: boolean; score: number; reason: string } {
    if (!event.location || profile.loginPatterns.frequentLocations.length === 0) {
      return { isAnomalous: false, score: 0, reason: '' };
    }

    const isKnownLocation = profile.loginPatterns.frequentLocations.some(loc => 
      this.calculateDistance(event.location!, loc) < 100 // within 100km
    );

    if (!isKnownLocation) {
      return { 
        isAnomalous: true, 
        score: 0.8, 
        reason: `Login from unusual location: ${event.location.city}, ${event.location.country}` 
      };
    }

    return { isAnomalous: false, score: 0, reason: '' };
  }

  private analyzeTimeAnomaly(event: SecurityEvent, profile: UserBehaviorProfile): { isAnomalous: boolean; score: number; reason: string } {
    const eventHour = event.timestamp.getHours();
    const eventDay = event.timestamp.getDay();

    const isTypicalHour = profile.loginPatterns.typicalHours.includes(eventHour);
    const isTypicalDay = profile.loginPatterns.typicalDays.includes(eventDay);

    if (!isTypicalHour && !isTypicalDay) {
      return { 
        isAnomalous: true, 
        score: 0.6, 
        reason: `Login at unusual time: ${eventHour}:00 on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][eventDay]}` 
      };
    }

    return { isAnomalous: false, score: 0, reason: '' };
  }

  private analyzeDeviceAnomaly(event: SecurityEvent, profile: UserBehaviorProfile): { isAnomalous: boolean; score: number; reason: string } {
    if (!event.deviceFingerprint || profile.loginPatterns.typicalDevices.length === 0) {
      return { isAnomalous: false, score: 0, reason: '' };
    }

    const isKnownDevice = profile.loginPatterns.typicalDevices.some(device => 
      this.compareDeviceFingerprints(event.deviceFingerprint!, device) > 0.8
    );

    if (!isKnownDevice) {
      return { 
        isAnomalous: true, 
        score: 0.7, 
        reason: `Login from unrecognized device: ${event.deviceFingerprint.browserName} on ${event.deviceFingerprint.operatingSystem}` 
      };
    }

    return { isAnomalous: false, score: 0, reason: '' };
  }

  private analyzeVelocityAnomaly(event: SecurityEvent, profile: UserBehaviorProfile): { isAnomalous: boolean; score: number; reason: string } {
    // Check for impossible travel (login from different locations too quickly)
    if (!event.location) {
      return { isAnomalous: false, score: 0, reason: '' };
    }

    // Get recent events from the last hour
    const oneHourAgo = new Date(event.timestamp.getTime() - 60 * 60 * 1000);
    
    // This would require checking recent security events - simplified for demo
    // In a real implementation, you'd query recent events from the database
    
    return { isAnomalous: false, score: 0, reason: '' };
  }

  private analyzePatternAnomaly(event: SecurityEvent, profile: UserBehaviorProfile): { isAnomalous: boolean; score: number; reason: string } {
    // Analyze transaction patterns for financial events
    if (event.type === 'transaction' && event.metadata.amount) {
      const amount = parseFloat(event.metadata.amount);
      
      if (amount > profile.transactionPatterns.maxAmount * 2) {
        return { 
          isAnomalous: true, 
          score: 0.9, 
          reason: `Transaction amount (${amount}) significantly exceeds typical maximum (${profile.transactionPatterns.maxAmount})` 
        };
      }

      if (amount > profile.transactionPatterns.averageAmount * 10) {
        return { 
          isAnomalous: true, 
          score: 0.8, 
          reason: `Transaction amount (${amount}) is 10x higher than average (${profile.transactionPatterns.averageAmount})` 
        };
      }
    }

    return { isAnomalous: false, score: 0, reason: '' };
  }

  private async updateUserProfile(userId: string, event: SecurityEvent): Promise<void> {
    try {
      const profile = this.behaviorProfiles.get(userId);
      if (!profile) return;

      const eventHour = event.timestamp.getHours();
      const eventDay = event.timestamp.getDay();

      // Update typical hours and days
      if (!profile.loginPatterns.typicalHours.includes(eventHour)) {
        profile.loginPatterns.typicalHours.push(eventHour);
      }
      if (!profile.loginPatterns.typicalDays.includes(eventDay)) {
        profile.loginPatterns.typicalDays.push(eventDay);
      }

      // Update locations
      if (event.location) {
        const existingLocation = profile.loginPatterns.frequentLocations.find(loc => 
          this.calculateDistance(event.location!, loc) < 10
        );
        if (!existingLocation) {
          profile.loginPatterns.frequentLocations.push(event.location);
          // Keep only top 10 locations
          if (profile.loginPatterns.frequentLocations.length > 10) {
            profile.loginPatterns.frequentLocations = profile.loginPatterns.frequentLocations.slice(-10);
          }
        }
      }

      // Update device fingerprints
      if (event.deviceFingerprint) {
        const existingDevice = profile.loginPatterns.typicalDevices.find(device => 
          this.compareDeviceFingerprints(event.deviceFingerprint!, device) > 0.9
        );
        if (!existingDevice) {
          profile.loginPatterns.typicalDevices.push(event.deviceFingerprint);
          // Keep only top 5 devices
          if (profile.loginPatterns.typicalDevices.length > 5) {
            profile.loginPatterns.typicalDevices = profile.loginPatterns.typicalDevices.slice(-5);
          }
        }
      }

      // Update transaction patterns
      if (event.type === 'transaction' && event.metadata.amount) {
        const amount = parseFloat(event.metadata.amount);
        profile.transactionPatterns.averageAmount = 
          (profile.transactionPatterns.averageAmount + amount) / 2;
        profile.transactionPatterns.maxAmount = 
          Math.max(profile.transactionPatterns.maxAmount, amount);
        profile.transactionPatterns.typicalFrequency++;
      }

      profile.updatedAt = new Date();
      
      // Save to database
      await this.databaseService.update('user_behavior_profiles', { userId }, profile);

      console.log(`🔄 Updated behavioral profile for user: ${userId}`);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  private calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(loc2.coordinates.latitude - loc1.coordinates.latitude);
    const dLon = this.toRadians(loc2.coordinates.longitude - loc1.coordinates.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.coordinates.latitude)) * 
      Math.cos(this.toRadians(loc2.coordinates.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private compareDeviceFingerprints(fp1: DeviceFingerprint, fp2: DeviceFingerprint): number {
    let score = 0;
    let totalChecks = 0;

    const checks = [
      { match: fp1.browserName === fp2.browserName, weight: 0.2 },
      { match: fp1.operatingSystem === fp2.operatingSystem, weight: 0.2 },
      { match: fp1.screenResolution === fp2.screenResolution, weight: 0.1 },
      { match: fp1.timezone === fp2.timezone, weight: 0.1 },
      { match: fp1.language === fp2.language, weight: 0.1 },
      { match: fp1.canvas === fp2.canvas, weight: 0.15 },
      { match: fp1.webgl === fp2.webgl, weight: 0.15 }
    ];

    checks.forEach(check => {
      if (check.match) {
        score += check.weight;
      }
      totalChecks += check.weight;
    });

    return score / totalChecks;
  }

  async getRiskProfile(userId: string): Promise<{ riskLevel: string; factors: string[]; score: number }> {
    const profile = await this.getUserProfile(userId);
    
    if (!profile) {
      return { riskLevel: 'unknown', factors: ['No behavioral profile'], score: 0.5 };
    }

    const factors: string[] = [];
    let riskScore = 0;

    // Analyze risk factors
    if (profile.riskIndicators.anomalyCount > 10) {
      factors.push('High anomaly count');
      riskScore += 0.3;
    }

    if (profile.riskIndicators.highRiskActions > 5) {
      factors.push('Multiple high-risk actions');
      riskScore += 0.2;
    }

    if (profile.loginPatterns.frequentLocations.length > 10) {
      factors.push('Multiple login locations');
      riskScore += 0.1;
    }

    const riskLevel = riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low';

    return { riskLevel, factors, score: riskScore };
  }

  private generateId(): string {
    return 'behavior_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

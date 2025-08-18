// src/services/RiskAssessmentService.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';
import { SecurityEvent, RiskAssessment, UserBehaviorProfile } from './types/Security';

@Injectable()
export class RiskAssessmentService {
  private riskProfiles: Map<string, RiskAssessment> = new Map();
  private defaultRiskValidityHours: number = 24;

  constructor(private databaseService: DatabaseService) {}

  async calculateUserRisk(
    userId: string, 
    recentEvents: SecurityEvent[], 
    behaviorProfile?: UserBehaviorProfile
  ): Promise<RiskAssessment> {
    try {
      // Check for cached assessment
      const cached = this.riskProfiles.get(userId);
      if (cached && cached.validUntil > new Date()) {
        return cached;
      }

      // Calculate risk factors
      const behavioralRisk = this.calculateBehavioralRisk(recentEvents, behaviorProfile);
      const geographicalRisk = this.calculateGeographicalRisk(recentEvents);
      const transactionalRisk = this.calculateTransactionalRisk(recentEvents);
      const temporalRisk = this.calculateTemporalRisk(recentEvents);
      const deviceRisk = this.calculateDeviceRisk(recentEvents);

      // Calculate weighted overall risk score
      const overallScore = this.calculateOverallRiskScore({
        behavioral: behavioralRisk,
        geographical: geographicalRisk,
        transactional: transactionalRisk,
        temporal: temporalRisk,
        device: deviceRisk
      });

      const overallRisk = this.categorizeRiskLevel(overallScore);
      const recommendations = this.generateRiskRecommendations(overallRisk, {
        behavioral: behavioralRisk,
        geographical: geographicalRisk,
        transactional: transactionalRisk,
        temporal: temporalRisk,
        device: deviceRisk
      });

      const assessment: RiskAssessment = {
        userId,
        overallRisk,
        riskScore: Math.round(overallScore),
        factors: {
          behavioral: Math.round(behavioralRisk),
          geographical: Math.round(geographicalRisk),
          transactional: Math.round(transactionalRisk),
          temporal: Math.round(temporalRisk),
          device: Math.round(deviceRisk)
        },
        recommendations,
        timestamp: new Date(),
        validUntil: new Date(Date.now() + this.defaultRiskValidityHours * 60 * 60 * 1000)
      };

      // Cache the assessment
      this.riskProfiles.set(userId, assessment);
      
      // Store in database
      await this.databaseService.create('risk_assessments', assessment);

      console.log(`📊 Risk assessment completed for user ${userId}: ${overallRisk} (${overallScore})`);
      return assessment;

    } catch (error) {
      console.error('Error calculating user risk:', error);
      return this.createDefaultRiskAssessment(userId);
    }
  }

  private calculateBehavioralRisk(events: SecurityEvent[], profile?: UserBehaviorProfile): number {
    let riskScore = 0;

    // Base risk on anomaly count
    const anomalousEvents = events.filter(e => e.flaggedAsAnomaly);
    const anomalyRate = events.length > 0 ? anomalousEvents.length / events.length : 0;
    riskScore += anomalyRate * 40; // Up to 40 points

    // Factor in behavioral profile indicators
    if (profile) {
      if (profile.riskIndicators.anomalyCount > 10) riskScore += 20;
      if (profile.riskIndicators.highRiskActions > 5) riskScore += 15;
      if (profile.riskIndicators.suspiciousPatterns.length > 3) riskScore += 10;
    }

    // Recent failed login attempts
    const failedLogins = events.filter(e => e.type === 'login_attempt' && !e.success);
    if (failedLogins.length > 3) riskScore += 15;

    return Math.min(riskScore, 100);
  }

  private calculateGeographicalRisk(events: SecurityEvent[]): number {
    let riskScore = 0;
    const locationsUsed = new Set<string>();
    const countries = new Set<string>();

    events.forEach(event => {
      if (event.location) {
        const locationKey = `${event.location.city},${event.location.country}`;
        locationsUsed.add(locationKey);
        countries.add(event.location.country);
      }
    });

    // Multiple countries in short time = higher risk
    if (countries.size > 2) riskScore += 30;
    else if (countries.size > 1) riskScore += 15;

    // Multiple cities in short time = moderate risk
    if (locationsUsed.size > 5) riskScore += 20;
    else if (locationsUsed.size > 3) riskScore += 10;

    // Check for impossible travel patterns
    const eventsWithLocation = events.filter(e => e.location);
    for (let i = 1; i < eventsWithLocation.length; i++) {
      const prev = eventsWithLocation[i - 1];
      const curr = eventsWithLocation[i];
      
      if (this.isImpossibleTravel(prev, curr)) {
        riskScore += 40;
        break;
      }
    }

    return Math.min(riskScore, 100);
  }

  private calculateTransactionalRisk(events: SecurityEvent[]): number {
    let riskScore = 0;
    const transactions = events.filter(e => e.type === 'transaction');

    if (transactions.length === 0) return 0;

    // High velocity transactions
    if (transactions.length > 10) riskScore += 25;
    else if (transactions.length > 5) riskScore += 15;

    // Large transaction amounts
    const amounts = transactions
      .map(t => parseFloat(t.metadata.amount || '0'))
      .filter(a => a > 0);

    if (amounts.length > 0) {
      const maxAmount = Math.max(...amounts);
      const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

      if (maxAmount > 50000) riskScore += 30;
      else if (maxAmount > 20000) riskScore += 20;
      else if (maxAmount > 10000) riskScore += 10;

      if (avgAmount > 5000) riskScore += 15;
    }

    // Failed transactions followed by successful ones
    let consecutiveFailures = 0;
    for (const tx of transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())) {
      if (!tx.success) {
        consecutiveFailures++;
      } else {
        if (consecutiveFailures >= 3) {
          riskScore += 20;
        }
        consecutiveFailures = 0;
      }
    }

    return Math.min(riskScore, 100);
  }

  private calculateTemporalRisk(events: SecurityEvent[]): number {
    let riskScore = 0;

    // Activity during unusual hours (2 AM - 6 AM)
    const nightActivity = events.filter(e => {
      const hour = e.timestamp.getHours();
      return hour >= 2 && hour <= 6;
    });

    if (nightActivity.length > 5) riskScore += 20;
    else if (nightActivity.length > 2) riskScore += 10;

    // Weekend activity for business accounts
    const weekendActivity = events.filter(e => {
      const day = e.timestamp.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });

    if (weekendActivity.length > events.length * 0.3) riskScore += 15;

    // Burst activity (many events in short time)
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let maxBurst = 0;
    let currentBurst = 0;
    let lastEventTime = 0;

    for (const event of sortedEvents) {
      const eventTime = event.timestamp.getTime();
      if (lastEventTime > 0 && (eventTime - lastEventTime) < 60000) { // Within 1 minute
        currentBurst++;
      } else {
        maxBurst = Math.max(maxBurst, currentBurst);
        currentBurst = 1;
      }
      lastEventTime = eventTime;
    }

    if (maxBurst > 20) riskScore += 25;
    else if (maxBurst > 10) riskScore += 15;

    return Math.min(riskScore, 100);
  }

  private calculateDeviceRisk(events: SecurityEvent[]): number {
    let riskScore = 0;
    const devices = new Set<string>();
    const ips = new Set<string>();

    events.forEach(event => {
      if (event.deviceFingerprint) {
        const deviceKey = `${event.deviceFingerprint.browserName}-${event.deviceFingerprint.operatingSystem}`;
        devices.add(deviceKey);
      }
      ips.add(event.ipAddress);
    });

    // Multiple devices = moderate risk
    if (devices.size > 5) riskScore += 20;
    else if (devices.size > 3) riskScore += 10;

    // Multiple IP addresses = higher risk
    if (ips.size > 10) riskScore += 30;
    else if (ips.size > 5) riskScore += 15;

    // Check for suspicious user agents or device characteristics
    const suspiciousEvents = events.filter(e => {
      const ua = e.userAgent.toLowerCase();
      return ua.includes('bot') || ua.includes('crawler') || ua.includes('automated');
    });

    if (suspiciousEvents.length > 0) riskScore += 25;

    return Math.min(riskScore, 100);
  }

  private calculateOverallRiskScore(factors: {
    behavioral: number;
    geographical: number;
    transactional: number;
    temporal: number;
    device: number;
  }): number {
    // Weighted average of risk factors
    const weights = {
      behavioral: 0.3,    // 30% - Most important
      transactional: 0.25, // 25% - Financial risk
      geographical: 0.2,   // 20% - Location anomalies
      device: 0.15,       // 15% - Device patterns
      temporal: 0.1       // 10% - Time patterns
    };

    return (
      factors.behavioral * weights.behavioral +
      factors.transactional * weights.transactional +
      factors.geographical * weights.geographical +
      factors.device * weights.device +
      factors.temporal * weights.temporal
    );
  }

  private categorizeRiskLevel(score: number): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  private generateRiskRecommendations(
    overallRisk: string, 
    factors: { behavioral: number; geographical: number; transactional: number; temporal: number; device: number }
  ): string[] {
    const recommendations: string[] = [];

    if (overallRisk === 'very_high' || overallRisk === 'high') {
      recommendations.push('Implement enhanced authentication requirements');
      recommendations.push('Consider temporary account restrictions');
      recommendations.push('Require manual approval for high-value transactions');
    }

    if (factors.behavioral > 60) {
      recommendations.push('Review and update user behavioral profile');
      recommendations.push('Increase monitoring frequency for this user');
    }

    if (factors.geographical > 60) {
      recommendations.push('Implement geofencing controls');
      recommendations.push('Require location verification for new regions');
    }

    if (factors.transactional > 60) {
      recommendations.push('Implement transaction velocity limits');
      recommendations.push('Require additional verification for large amounts');
    }

    if (factors.device > 60) {
      recommendations.push('Implement device registration requirements');
      recommendations.push('Consider blocking unrecognized devices');
    }

    if (factors.temporal > 60) {
      recommendations.push('Implement time-based access controls');
      recommendations.push('Alert on unusual time patterns');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue standard monitoring');
      recommendations.push('Maintain current security posture');
    }

    return recommendations;
  }

  private isImpossibleTravel(event1: SecurityEvent, event2: SecurityEvent): boolean {
    if (!event1.location || !event2.location) return false;

    const distance = this.calculateDistance(
      event1.location.coordinates,
      event2.location.coordinates
    );

    const timeDiff = Math.abs(event2.timestamp.getTime() - event1.timestamp.getTime()) / (1000 * 60 * 60); // hours
    const maxSpeed = distance / timeDiff; // km/h

    return maxSpeed > 1000; // Impossible to travel faster than 1000 km/h
  }

  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private createDefaultRiskAssessment(userId: string): RiskAssessment {
    return {
      userId,
      overallRisk: 'medium',
      riskScore: 50,
      factors: {
        behavioral: 50,
        geographical: 50,
        transactional: 50,
        temporal: 50,
        device: 50
      },
      recommendations: ['Unable to calculate risk - insufficient data'],
      timestamp: new Date(),
      validUntil: new Date(Date.now() + this.defaultRiskValidityHours * 60 * 60 * 1000)
    };
  }

  async getUserRiskHistory(userId: string, days: number = 30): Promise<RiskAssessment[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return await this.databaseService.find('risk_assessments', {
        userId,
        timestamp: { $gte: cutoffDate }
      }, { sort: { timestamp: -1 } });
    } catch (error) {
      console.error('Error getting user risk history:', error);
      return [];
    }
  }

  async invalidateUserRisk(userId: string): Promise<void> {
    this.riskProfiles.delete(userId);
    console.log(`🔄 Invalidated risk profile for user: ${userId}`);
  }
}

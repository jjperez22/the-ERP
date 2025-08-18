// src/services/FraudDetectionService.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';
import { SecurityEvent, FraudIndicator, UserBehaviorProfile } from './types/Security';

interface TransactionData {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  merchant?: string;
  category: string;
  timestamp: Date;
  ipAddress: string;
  location?: any;
  paymentMethod: string;
}

@Injectable()
export class FraudDetectionService {
  private fraudRules: Map<string, any> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private blacklistedMerchants: Set<string> = new Set();

  constructor(private databaseService: DatabaseService) {
    this.initializeFraudRules();
    this.loadThreatIntelligence();
  }

  async analyzeTransaction(event: SecurityEvent): Promise<{ isFraudulent: boolean; riskScore: number; indicators: FraudIndicator[] }> {
    try {
      if (event.type !== 'transaction') {
        return { isFraudulent: false, riskScore: 0, indicators: [] };
      }

      const transactionData = this.extractTransactionData(event);
      const indicators: FraudIndicator[] = [];
      let riskScore = 0;

      // Run fraud detection rules
      const amountCheck = await this.checkTransactionAmount(transactionData);
      const velocityCheck = await this.checkTransactionVelocity(transactionData);
      const locationCheck = await this.checkTransactionLocation(transactionData);
      const patternCheck = await this.checkTransactionPatterns(transactionData);
      const merchantCheck = await this.checkMerchantReputation(transactionData);
      const timeCheck = await this.checkTransactionTime(transactionData);

      indicators.push(...amountCheck.indicators);
      indicators.push(...velocityCheck.indicators);
      indicators.push(...locationCheck.indicators);
      indicators.push(...patternCheck.indicators);
      indicators.push(...merchantCheck.indicators);
      indicators.push(...timeCheck.indicators);

      // Calculate weighted risk score
      riskScore = indicators.reduce((score, indicator) => {
        return score + (indicator.exceeded ? indicator.weight : 0);
      }, 0);

      // Normalize risk score to 0-1 range
      riskScore = Math.min(riskScore, 1.0);

      const isFraudulent = riskScore > 0.7 || indicators.some(i => i.type === 'amount' && i.exceeded && i.weight > 0.8);

      if (isFraudulent) {
        console.log(`🚨 Fraudulent transaction detected for user ${transactionData.userId}: Risk Score ${riskScore}`);
        await this.recordFraudulentTransaction(transactionData, riskScore, indicators);
      }

      return { isFraudulent, riskScore, indicators };

    } catch (error) {
      console.error('Error analyzing transaction:', error);
      return { isFraudulent: false, riskScore: 0, indicators: [] };
    }
  }

  private extractTransactionData(event: SecurityEvent): TransactionData {
    return {
      id: event.id,
      userId: event.userId,
      amount: parseFloat(event.metadata.amount || '0'),
      currency: event.metadata.currency || 'USD',
      merchant: event.metadata.merchant,
      category: event.metadata.category || 'general',
      timestamp: event.timestamp,
      ipAddress: event.ipAddress,
      location: event.location,
      paymentMethod: event.metadata.paymentMethod || 'unknown'
    };
  }

  private async checkTransactionAmount(transaction: TransactionData): Promise<{ indicators: FraudIndicator[] }> {
    const indicators: FraudIndicator[] = [];

    // Get user's historical transaction data
    const userHistory = await this.getUserTransactionHistory(transaction.userId, 30); // Last 30 days
    
    if (userHistory.length === 0) {
      return { indicators };
    }

    const averageAmount = userHistory.reduce((sum, t) => sum + t.amount, 0) / userHistory.length;
    const maxAmount = Math.max(...userHistory.map(t => t.amount));

    // Check for unusually high amounts
    if (transaction.amount > maxAmount * 5) {
      indicators.push({
        type: 'amount',
        description: 'Transaction amount significantly exceeds historical maximum',
        weight: 0.9,
        value: transaction.amount,
        threshold: maxAmount * 5,
        exceeded: true
      });
    } else if (transaction.amount > averageAmount * 10) {
      indicators.push({
        type: 'amount',
        description: 'Transaction amount is 10x higher than average',
        weight: 0.7,
        value: transaction.amount,
        threshold: averageAmount * 10,
        exceeded: true
      });
    }

    // Check for round number fraud (criminals often use round numbers)
    if (transaction.amount % 100 === 0 && transaction.amount > 1000) {
      indicators.push({
        type: 'pattern',
        description: 'Large round number transaction',
        weight: 0.3,
        value: transaction.amount,
        threshold: 'round_number',
        exceeded: true
      });
    }

    return { indicators };
  }

  private async checkTransactionVelocity(transaction: TransactionData): Promise<{ indicators: FraudIndicator[] }> {
    const indicators: FraudIndicator[] = [];

    // Check transactions in the last hour
    const oneHourAgo = new Date(transaction.timestamp.getTime() - 60 * 60 * 1000);
    const recentTransactions = await this.getRecentTransactions(transaction.userId, oneHourAgo);

    if (recentTransactions.length > 10) {
      indicators.push({
        type: 'velocity',
        description: 'Too many transactions in short time period',
        weight: 0.8,
        value: recentTransactions.length,
        threshold: 10,
        exceeded: true
      });
    }

    // Check total amount in last hour
    const totalAmountLastHour = recentTransactions.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    if (totalAmountLastHour > 10000) {
      indicators.push({
        type: 'velocity',
        description: 'High transaction volume in short time period',
        weight: 0.9,
        value: totalAmountLastHour,
        threshold: 10000,
        exceeded: true
      });
    }

    return { indicators };
  }

  private async checkTransactionLocation(transaction: TransactionData): Promise<{ indicators: FraudIndicator[] }> {
    const indicators: FraudIndicator[] = [];

    if (!transaction.location) {
      return { indicators };
    }

    // Check if IP is in suspicious list
    if (this.suspiciousIPs.has(transaction.ipAddress)) {
      indicators.push({
        type: 'location',
        description: 'Transaction from known suspicious IP address',
        weight: 0.9,
        value: transaction.ipAddress,
        threshold: 'suspicious_ip',
        exceeded: true
      });
    }

    // Check for impossible travel (transactions from different countries within impossible timeframe)
    const recentTransactions = await this.getRecentTransactions(transaction.userId, new Date(Date.now() - 2 * 60 * 60 * 1000)); // Last 2 hours
    
    for (const recentTx of recentTransactions) {
      if (recentTx.location && transaction.location) {
        const distance = this.calculateDistance(
          { lat: transaction.location.coordinates.latitude, lon: transaction.location.coordinates.longitude },
          { lat: recentTx.location.coordinates.latitude, lon: recentTx.location.coordinates.longitude }
        );
        
        const timeElapsed = (transaction.timestamp.getTime() - new Date(recentTx.timestamp).getTime()) / (1000 * 60 * 60); // hours
        const maxPossibleSpeed = distance / timeElapsed; // km/h
        
        if (maxPossibleSpeed > 1000) { // Impossible to travel faster than 1000 km/h
          indicators.push({
            type: 'location',
            description: 'Impossible travel speed detected',
            weight: 0.95,
            value: maxPossibleSpeed,
            threshold: 1000,
            exceeded: true
          });
        }
      }
    }

    return { indicators };
  }

  private async checkTransactionPatterns(transaction: TransactionData): Promise<{ indicators: FraudIndicator[] }> {
    const indicators: FraudIndicator[] = [];

    // Check for transactions at unusual times
    const hour = transaction.timestamp.getHours();
    if (hour >= 2 && hour <= 5) { // 2 AM to 5 AM
      indicators.push({
        type: 'pattern',
        description: 'Transaction during unusual hours',
        weight: 0.4,
        value: hour,
        threshold: 'unusual_hours',
        exceeded: true
      });
    }

    // Check for repeated failed attempts followed by success
    const recentEvents = await this.getRecentSecurityEvents(transaction.userId, 30 * 60 * 1000); // Last 30 minutes
    const failedAttempts = recentEvents.filter(e => e.type === 'transaction' && !e.success).length;
    
    if (failedAttempts >= 3) {
      indicators.push({
        type: 'pattern',
        description: 'Multiple failed attempts before successful transaction',
        weight: 0.6,
        value: failedAttempts,
        threshold: 3,
        exceeded: true
      });
    }

    return { indicators };
  }

  private async checkMerchantReputation(transaction: TransactionData): Promise<{ indicators: FraudIndicator[] }> {
    const indicators: FraudIndicator[] = [];

    if (!transaction.merchant) {
      return { indicators };
    }

    // Check if merchant is blacklisted
    if (this.blacklistedMerchants.has(transaction.merchant)) {
      indicators.push({
        type: 'pattern',
        description: 'Transaction with blacklisted merchant',
        weight: 0.95,
        value: transaction.merchant,
        threshold: 'blacklisted',
        exceeded: true
      });
    }

    // Check for new merchant with high-value transaction
    const merchantHistory = await this.getMerchantTransactionHistory(transaction.merchant);
    if (merchantHistory.length === 0 && transaction.amount > 1000) {
      indicators.push({
        type: 'pattern',
        description: 'First-time high-value transaction with new merchant',
        weight: 0.5,
        value: transaction.amount,
        threshold: 'new_merchant_high_value',
        exceeded: true
      });
    }

    return { indicators };
  }

  private async checkTransactionTime(transaction: TransactionData): Promise<{ indicators: FraudIndicator[] }> {
    const indicators: FraudIndicator[] = [];

    // Check for transactions on holidays or weekends with high amounts
    const day = transaction.timestamp.getDay();
    const hour = transaction.timestamp.getHours();
    
    if ((day === 0 || day === 6) && transaction.amount > 5000) { // Weekend
      indicators.push({
        type: 'pattern',
        description: 'High-value weekend transaction',
        weight: 0.3,
        value: transaction.amount,
        threshold: 'weekend_high_value',
        exceeded: true
      });
    }

    if ((hour < 6 || hour > 23) && transaction.amount > 2000) { // Night hours
      indicators.push({
        type: 'pattern',
        description: 'High-value transaction during night hours',
        weight: 0.4,
        value: transaction.amount,
        threshold: 'night_high_value',
        exceeded: true
      });
    }

    return { indicators };
  }

  private async getUserTransactionHistory(userId: string, days: number): Promise<any[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return await this.databaseService.find('security_events', {
        userId,
        type: 'transaction',
        timestamp: { $gte: cutoffDate }
      });
    } catch (error) {
      console.error('Error getting user transaction history:', error);
      return [];
    }
  }

  private async getRecentTransactions(userId: string, since: Date): Promise<any[]> {
    try {
      return await this.databaseService.find('security_events', {
        userId,
        type: 'transaction',
        timestamp: { $gte: since }
      });
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return [];
    }
  }

  private async getRecentSecurityEvents(userId: string, timeWindowMs: number): Promise<SecurityEvent[]> {
    try {
      const since = new Date(Date.now() - timeWindowMs);
      return await this.databaseService.find('security_events', {
        userId,
        timestamp: { $gte: since }
      });
    } catch (error) {
      console.error('Error getting recent security events:', error);
      return [];
    }
  }

  private async getMerchantTransactionHistory(merchant: string): Promise<any[]> {
    try {
      return await this.databaseService.find('security_events', {
        'metadata.merchant': merchant,
        type: 'transaction'
      });
    } catch (error) {
      console.error('Error getting merchant history:', error);
      return [];
    }
  }

  private calculateDistance(point1: { lat: number; lon: number }, point2: { lat: number; lon: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLon = this.toRadians(point2.lon - point1.lon);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async recordFraudulentTransaction(transaction: TransactionData, riskScore: number, indicators: FraudIndicator[]): Promise<void> {
    try {
      const fraudRecord = {
        id: this.generateId(),
        transactionId: transaction.id,
        userId: transaction.userId,
        riskScore,
        indicators,
        detectedAt: new Date(),
        status: 'detected',
        investigationStatus: 'pending'
      };

      await this.databaseService.create('fraud_detections', fraudRecord);
      console.log(`📝 Recorded fraudulent transaction: ${transaction.id}`);
    } catch (error) {
      console.error('Error recording fraudulent transaction:', error);
    }
  }

  private initializeFraudRules(): void {
    // Initialize fraud detection rules
    this.fraudRules.set('max_transaction_amount', 50000);
    this.fraudRules.set('max_daily_transactions', 20);
    this.fraudRules.set('max_hourly_amount', 10000);
    this.fraudRules.set('suspicious_round_amounts', [1000, 2000, 5000, 10000]);
    this.fraudRules.set('risky_categories', ['gambling', 'cryptocurrency', 'money_transfer']);
  }

  private loadThreatIntelligence(): void {
    // Load suspicious IPs and blacklisted merchants
    // In a real implementation, this would be loaded from external threat intelligence feeds
    this.suspiciousIPs.add('192.168.1.100');
    this.suspiciousIPs.add('10.0.0.50');
    
    this.blacklistedMerchants.add('suspicious-merchant-123');
    this.blacklistedMerchants.add('fraud-store-xyz');
  }

  async updateThreatIntelligence(): Promise<void> {
    try {
      // In a real implementation, this would fetch from external APIs
      console.log('🔄 Updating threat intelligence feeds...');
      
      // Simulate loading new suspicious IPs
      const newSuspiciousIPs = ['203.0.113.1', '198.51.100.2'];
      newSuspiciousIPs.forEach(ip => this.suspiciousIPs.add(ip));
      
      console.log(`✅ Updated threat intelligence: ${this.suspiciousIPs.size} suspicious IPs, ${this.blacklistedMerchants.size} blacklisted merchants`);
    } catch (error) {
      console.error('Error updating threat intelligence:', error);
    }
  }

  async getFraudStatistics(days: number = 30): Promise<any> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const totalFraud = await this.databaseService.count('fraud_detections', {
        detectedAt: { $gte: cutoffDate }
      });
      
      const totalTransactions = await this.databaseService.count('security_events', {
        type: 'transaction',
        timestamp: { $gte: cutoffDate }
      });
      
      const fraudRate = totalTransactions > 0 ? (totalFraud / totalTransactions) * 100 : 0;
      
      return {
        totalTransactions,
        totalFraud,
        fraudRate: Math.round(fraudRate * 100) / 100,
        period: `${days} days`
      };
    } catch (error) {
      console.error('Error getting fraud statistics:', error);
      return { totalTransactions: 0, totalFraud: 0, fraudRate: 0, period: `${days} days` };
    }
  }

  private generateId(): string {
    return 'fraud_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

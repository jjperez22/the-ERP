// src/services/ThreatIntelligenceService.ts
import { Injectable } from '@varld/warp';
import { DatabaseService } from '../../services/DatabaseService';
import { ThreatIntelligence } from './types/Security';

@Injectable()
export class ThreatIntelligenceService {
  private threatCache: Map<string, ThreatIntelligence> = new Map();
  private updateInterval: NodeJS.Timeout;
  private suspiciousIPs: Set<string> = new Set();
  private blacklistedDomains: Set<string> = new Set();
  private knownMalwareHashes: Set<string> = new Set();

  constructor(private databaseService: DatabaseService) {
    this.initializeThreatData();
    this.startPeriodicUpdates();
  }

  async checkIPReputation(ipAddress: string): Promise<{ isThreat: boolean; threatLevel: string; details?: ThreatIntelligence }> {
    try {
      // Check cache first
      const cacheKey = `ip_${ipAddress}`;
      if (this.threatCache.has(cacheKey)) {
        const threat = this.threatCache.get(cacheKey)!;
        return {
          isThreat: threat.threatLevel !== 'low',
          threatLevel: threat.threatLevel,
          details: threat
        };
      }

      // Check static lists
      if (this.suspiciousIPs.has(ipAddress)) {
        return { isThreat: true, threatLevel: 'high' };
      }

      // Check database
      const threatData = await this.databaseService.findOne('threat_intelligence', {
        type: 'ip_reputation',
        value: ipAddress
      });

      if (threatData) {
        this.threatCache.set(cacheKey, threatData);
        return {
          isThreat: threatData.threatLevel !== 'low',
          threatLevel: threatData.threatLevel,
          details: threatData
        };
      }

      // If no threat data found, consider it safe
      return { isThreat: false, threatLevel: 'low' };

    } catch (error) {
      console.error('Error checking IP reputation:', error);
      return { isThreat: false, threatLevel: 'low' };
    }
  }

  async checkDomainReputation(domain: string): Promise<{ isThreat: boolean; threatLevel: string; details?: ThreatIntelligence }> {
    try {
      const cacheKey = `domain_${domain}`;
      if (this.threatCache.has(cacheKey)) {
        const threat = this.threatCache.get(cacheKey)!;
        return {
          isThreat: threat.threatLevel !== 'low',
          threatLevel: threat.threatLevel,
          details: threat
        };
      }

      if (this.blacklistedDomains.has(domain)) {
        return { isThreat: true, threatLevel: 'critical' };
      }

      const threatData = await this.databaseService.findOne('threat_intelligence', {
        type: 'domain_reputation',
        value: domain
      });

      if (threatData) {
        this.threatCache.set(cacheKey, threatData);
        return {
          isThreat: threatData.threatLevel !== 'low',
          threatLevel: threatData.threatLevel,
          details: threatData
        };
      }

      return { isThreat: false, threatLevel: 'low' };

    } catch (error) {
      console.error('Error checking domain reputation:', error);
      return { isThreat: false, threatLevel: 'low' };
    }
  }

  async checkMalwareHash(hash: string): Promise<{ isMalware: boolean; threatLevel: string; details?: ThreatIntelligence }> {
    try {
      const cacheKey = `hash_${hash}`;
      if (this.threatCache.has(cacheKey)) {
        const threat = this.threatCache.get(cacheKey)!;
        return {
          isMalware: threat.threatLevel !== 'low',
          threatLevel: threat.threatLevel,
          details: threat
        };
      }

      if (this.knownMalwareHashes.has(hash)) {
        return { isMalware: true, threatLevel: 'critical' };
      }

      const threatData = await this.databaseService.findOne('threat_intelligence', {
        type: 'malware_hash',
        value: hash
      });

      if (threatData) {
        this.threatCache.set(cacheKey, threatData);
        return {
          isMalware: threatData.threatLevel !== 'low',
          threatLevel: threatData.threatLevel,
          details: threatData
        };
      }

      return { isMalware: false, threatLevel: 'low' };

    } catch (error) {
      console.error('Error checking malware hash:', error);
      return { isMalware: false, threatLevel: 'low' };
    }
  }

  async addThreatIndicator(threat: Omit<ThreatIntelligence, 'id' | 'lastUpdated'>): Promise<ThreatIntelligence> {
    try {
      const threatIntel: ThreatIntelligence = {
        id: this.generateId(),
        ...threat,
        lastUpdated: new Date()
      };

      await this.databaseService.create('threat_intelligence', threatIntel);
      
      // Add to appropriate cache
      const cacheKey = `${threat.type}_${threat.value}`;
      this.threatCache.set(cacheKey, threatIntel);

      // Add to static lists for faster lookup
      this.updateStaticLists(threatIntel);

      console.log(`🛡️ Added threat indicator: ${threat.type} - ${threat.value} (${threat.threatLevel})`);
      return threatIntel;

    } catch (error) {
      console.error('Error adding threat indicator:', error);
      throw error;
    }
  }

  async updateThreatIndicator(id: string, updates: Partial<ThreatIntelligence>): Promise<boolean> {
    try {
      const result = await this.databaseService.update('threat_intelligence', { id }, {
        ...updates,
        lastUpdated: new Date()
      });

      if (result) {
        // Invalidate cache for this indicator
        const threat = await this.databaseService.findOne('threat_intelligence', { id });
        if (threat) {
          const cacheKey = `${threat.type}_${threat.value}`;
          this.threatCache.delete(cacheKey);
        }
      }

      return result;

    } catch (error) {
      console.error('Error updating threat indicator:', error);
      return false;
    }
  }

  async removeThreatIndicator(id: string): Promise<boolean> {
    try {
      const threat = await this.databaseService.findOne('threat_intelligence', { id });
      if (!threat) return false;

      const result = await this.databaseService.delete('threat_intelligence', { id });
      
      if (result) {
        // Remove from cache and static lists
        const cacheKey = `${threat.type}_${threat.value}`;
        this.threatCache.delete(cacheKey);
        this.removeFromStaticLists(threat);
      }

      return result;

    } catch (error) {
      console.error('Error removing threat indicator:', error);
      return false;
    }
  }

  async getThreatFeeds(): Promise<ThreatIntelligence[]> {
    try {
      return await this.databaseService.find('threat_intelligence', {}, {
        sort: { lastUpdated: -1 },
        limit: 1000
      });
    } catch (error) {
      console.error('Error getting threat feeds:', error);
      return [];
    }
  }

  async searchThreats(query: {
    type?: ThreatIntelligence['type'];
    threatLevel?: ThreatIntelligence['threatLevel'];
    source?: string;
    tags?: string[];
    value?: string;
  }): Promise<ThreatIntelligence[]> {
    try {
      const searchQuery: any = {};

      if (query.type) searchQuery.type = query.type;
      if (query.threatLevel) searchQuery.threatLevel = query.threatLevel;
      if (query.source) searchQuery.source = query.source;
      if (query.value) searchQuery.value = { $regex: query.value, $options: 'i' };
      if (query.tags && query.tags.length > 0) {
        searchQuery.tags = { $in: query.tags };
      }

      return await this.databaseService.find('threat_intelligence', searchQuery, {
        sort: { lastUpdated: -1 },
        limit: 500
      });

    } catch (error) {
      console.error('Error searching threats:', error);
      return [];
    }
  }

  async getThreatStatistics(): Promise<any> {
    try {
      const threats = await this.getThreatFeeds();

      const stats = {
        total: threats.length,
        byType: {} as Record<string, number>,
        byThreatLevel: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        recentUpdates: 0,
        oldestThreat: null as Date | null,
        newestThreat: null as Date | null
      };

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      threats.forEach(threat => {
        // Count by type
        stats.byType[threat.type] = (stats.byType[threat.type] || 0) + 1;

        // Count by threat level
        stats.byThreatLevel[threat.threatLevel] = (stats.byThreatLevel[threat.threatLevel] || 0) + 1;

        // Count by source
        stats.bySource[threat.source] = (stats.bySource[threat.source] || 0) + 1;

        // Count recent updates
        if (now - threat.lastUpdated.getTime() < oneDay) {
          stats.recentUpdates++;
        }

        // Track oldest and newest
        if (!stats.oldestThreat || threat.lastUpdated < stats.oldestThreat) {
          stats.oldestThreat = threat.lastUpdated;
        }
        if (!stats.newestThreat || threat.lastUpdated > stats.newestThreat) {
          stats.newestThreat = threat.lastUpdated;
        }
      });

      return stats;

    } catch (error) {
      console.error('Error getting threat statistics:', error);
      return {};
    }
  }

  async updateThreatFeeds(): Promise<void> {
    try {
      console.log('🔄 Updating threat intelligence feeds...');

      // Simulate fetching from external threat intelligence sources
      const newThreats = await this.simulateThreatFeedUpdate();
      
      for (const threat of newThreats) {
        await this.addThreatIndicator(threat);
      }

      // Clean up old threat indicators (older than 90 days)
      await this.cleanupOldThreats();

      console.log(`✅ Updated threat intelligence: ${newThreats.length} new indicators added`);

    } catch (error) {
      console.error('Error updating threat feeds:', error);
    }
  }

  private async initializeThreatData(): Promise<void> {
    try {
      // Load existing threat data from database
      const threats = await this.getThreatFeeds();
      
      threats.forEach(threat => {
        const cacheKey = `${threat.type}_${threat.value}`;
        this.threatCache.set(cacheKey, threat);
        this.updateStaticLists(threat);
      });

      // Add some initial threat data for demo
      await this.addInitialThreats();

      console.log(`🛡️ Initialized threat intelligence with ${threats.length} indicators`);

    } catch (error) {
      console.error('Error initializing threat data:', error);
    }
  }

  private async addInitialThreats(): Promise<void> {
    const initialThreats = [
      {
        type: 'ip_reputation' as const,
        value: '192.168.1.100',
        threatLevel: 'high' as const,
        source: 'internal_detection',
        description: 'Multiple failed login attempts detected',
        tags: ['bruteforce', 'authentication'],
        iocs: ['failed_login_attempts']
      },
      {
        type: 'domain_reputation' as const,
        value: 'malicious-site.com',
        threatLevel: 'critical' as const,
        source: 'threat_feed',
        description: 'Known phishing domain',
        tags: ['phishing', 'credential_theft'],
        iocs: ['phishing_indicators']
      },
      {
        type: 'malware_hash' as const,
        value: 'a1b2c3d4e5f6789',
        threatLevel: 'critical' as const,
        source: 'malware_analysis',
        description: 'Known trojan signature',
        tags: ['trojan', 'malware'],
        iocs: ['file_hash']
      }
    ];

    for (const threat of initialThreats) {
      try {
        const existing = await this.databaseService.findOne('threat_intelligence', {
          type: threat.type,
          value: threat.value
        });
        
        if (!existing) {
          await this.addThreatIndicator(threat);
        }
      } catch (error) {
        // Continue with other threats if one fails
        console.error('Error adding initial threat:', error);
      }
    }
  }

  private async simulateThreatFeedUpdate(): Promise<Array<Omit<ThreatIntelligence, 'id' | 'lastUpdated'>>> {
    // Simulate fetching from external threat intelligence APIs
    const mockThreats = [
      {
        type: 'ip_reputation' as const,
        value: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        threatLevel: 'medium' as const,
        source: 'external_feed',
        description: 'Suspicious IP detected in honeypot',
        tags: ['honeypot', 'scanning'],
        iocs: ['port_scanning']
      },
      {
        type: 'domain_reputation' as const,
        value: `suspicious-${Date.now()}.net`,
        threatLevel: 'low' as const,
        source: 'domain_analysis',
        description: 'Newly registered domain with suspicious patterns',
        tags: ['newly_registered', 'suspicious_pattern'],
        iocs: ['domain_generation']
      }
    ];

    return mockThreats;
  }

  private async cleanupOldThreats(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      
      const oldThreats = await this.databaseService.find('threat_intelligence', {
        lastUpdated: { $lt: cutoffDate }
      });

      for (const threat of oldThreats) {
        await this.removeThreatIndicator(threat.id);
      }

      if (oldThreats.length > 0) {
        console.log(`🧹 Cleaned up ${oldThreats.length} old threat indicators`);
      }

    } catch (error) {
      console.error('Error cleaning up old threats:', error);
    }
  }

  private updateStaticLists(threat: ThreatIntelligence): void {
    switch (threat.type) {
      case 'ip_reputation':
        if (threat.threatLevel === 'high' || threat.threatLevel === 'critical') {
          this.suspiciousIPs.add(threat.value);
        }
        break;
      case 'domain_reputation':
        if (threat.threatLevel === 'high' || threat.threatLevel === 'critical') {
          this.blacklistedDomains.add(threat.value);
        }
        break;
      case 'malware_hash':
        if (threat.threatLevel === 'high' || threat.threatLevel === 'critical') {
          this.knownMalwareHashes.add(threat.value);
        }
        break;
    }
  }

  private removeFromStaticLists(threat: ThreatIntelligence): void {
    switch (threat.type) {
      case 'ip_reputation':
        this.suspiciousIPs.delete(threat.value);
        break;
      case 'domain_reputation':
        this.blacklistedDomains.delete(threat.value);
        break;
      case 'malware_hash':
        this.knownMalwareHashes.delete(threat.value);
        break;
    }
  }

  private startPeriodicUpdates(): void {
    // Update threat feeds every 6 hours
    this.updateInterval = setInterval(() => {
      this.updateThreatFeeds();
    }, 6 * 60 * 60 * 1000);

    console.log('📡 Started periodic threat intelligence updates (every 6 hours)');
  }

  private generateId(): string {
    return 'threat_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    console.log('🧹 ThreatIntelligenceService cleanup completed');
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatIntelligenceService = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../../services/DatabaseService");
let ThreatIntelligenceService = class ThreatIntelligenceService {
    databaseService;
    threatCache = new Map();
    updateInterval;
    suspiciousIPs = new Set();
    blacklistedDomains = new Set();
    knownMalwareHashes = new Set();
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.initializeThreatData();
        this.startPeriodicUpdates();
    }
    async checkIPReputation(ipAddress) {
        try {
            const cacheKey = `ip_${ipAddress}`;
            if (this.threatCache.has(cacheKey)) {
                const threat = this.threatCache.get(cacheKey);
                return {
                    isThreat: threat.threatLevel !== 'low',
                    threatLevel: threat.threatLevel,
                    details: threat
                };
            }
            if (this.suspiciousIPs.has(ipAddress)) {
                return { isThreat: true, threatLevel: 'high' };
            }
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
            return { isThreat: false, threatLevel: 'low' };
        }
        catch (error) {
            console.error('Error checking IP reputation:', error);
            return { isThreat: false, threatLevel: 'low' };
        }
    }
    async checkDomainReputation(domain) {
        try {
            const cacheKey = `domain_${domain}`;
            if (this.threatCache.has(cacheKey)) {
                const threat = this.threatCache.get(cacheKey);
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
        }
        catch (error) {
            console.error('Error checking domain reputation:', error);
            return { isThreat: false, threatLevel: 'low' };
        }
    }
    async checkMalwareHash(hash) {
        try {
            const cacheKey = `hash_${hash}`;
            if (this.threatCache.has(cacheKey)) {
                const threat = this.threatCache.get(cacheKey);
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
        }
        catch (error) {
            console.error('Error checking malware hash:', error);
            return { isMalware: false, threatLevel: 'low' };
        }
    }
    async addThreatIndicator(threat) {
        try {
            const threatIntel = {
                id: this.generateId(),
                ...threat,
                lastUpdated: new Date()
            };
            await this.databaseService.create('threat_intelligence', threatIntel);
            const cacheKey = `${threat.type}_${threat.value}`;
            this.threatCache.set(cacheKey, threatIntel);
            this.updateStaticLists(threatIntel);
            console.log(`🛡️ Added threat indicator: ${threat.type} - ${threat.value} (${threat.threatLevel})`);
            return threatIntel;
        }
        catch (error) {
            console.error('Error adding threat indicator:', error);
            throw error;
        }
    }
    async updateThreatIndicator(id, updates) {
        try {
            const result = await this.databaseService.update('threat_intelligence', { id }, {
                ...updates,
                lastUpdated: new Date()
            });
            if (result) {
                const threat = await this.databaseService.findOne('threat_intelligence', { id });
                if (threat) {
                    const cacheKey = `${threat.type}_${threat.value}`;
                    this.threatCache.delete(cacheKey);
                }
            }
            return result;
        }
        catch (error) {
            console.error('Error updating threat indicator:', error);
            return false;
        }
    }
    async removeThreatIndicator(id) {
        try {
            const threat = await this.databaseService.findOne('threat_intelligence', { id });
            if (!threat)
                return false;
            const result = await this.databaseService.delete('threat_intelligence', { id });
            if (result) {
                const cacheKey = `${threat.type}_${threat.value}`;
                this.threatCache.delete(cacheKey);
                this.removeFromStaticLists(threat);
            }
            return result;
        }
        catch (error) {
            console.error('Error removing threat indicator:', error);
            return false;
        }
    }
    async getThreatFeeds() {
        try {
            return await this.databaseService.find('threat_intelligence', {}, {
                sort: { lastUpdated: -1 },
                limit: 1000
            });
        }
        catch (error) {
            console.error('Error getting threat feeds:', error);
            return [];
        }
    }
    async searchThreats(query) {
        try {
            const searchQuery = {};
            if (query.type)
                searchQuery.type = query.type;
            if (query.threatLevel)
                searchQuery.threatLevel = query.threatLevel;
            if (query.source)
                searchQuery.source = query.source;
            if (query.value)
                searchQuery.value = { $regex: query.value, $options: 'i' };
            if (query.tags && query.tags.length > 0) {
                searchQuery.tags = { $in: query.tags };
            }
            return await this.databaseService.find('threat_intelligence', searchQuery, {
                sort: { lastUpdated: -1 },
                limit: 500
            });
        }
        catch (error) {
            console.error('Error searching threats:', error);
            return [];
        }
    }
    async getThreatStatistics() {
        try {
            const threats = await this.getThreatFeeds();
            const stats = {
                total: threats.length,
                byType: {},
                byThreatLevel: {},
                bySource: {},
                recentUpdates: 0,
                oldestThreat: null,
                newestThreat: null
            };
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            threats.forEach(threat => {
                stats.byType[threat.type] = (stats.byType[threat.type] || 0) + 1;
                stats.byThreatLevel[threat.threatLevel] = (stats.byThreatLevel[threat.threatLevel] || 0) + 1;
                stats.bySource[threat.source] = (stats.bySource[threat.source] || 0) + 1;
                if (now - threat.lastUpdated.getTime() < oneDay) {
                    stats.recentUpdates++;
                }
                if (!stats.oldestThreat || threat.lastUpdated < stats.oldestThreat) {
                    stats.oldestThreat = threat.lastUpdated;
                }
                if (!stats.newestThreat || threat.lastUpdated > stats.newestThreat) {
                    stats.newestThreat = threat.lastUpdated;
                }
            });
            return stats;
        }
        catch (error) {
            console.error('Error getting threat statistics:', error);
            return {};
        }
    }
    async updateThreatFeeds() {
        try {
            console.log('🔄 Updating threat intelligence feeds...');
            const newThreats = await this.simulateThreatFeedUpdate();
            for (const threat of newThreats) {
                await this.addThreatIndicator(threat);
            }
            await this.cleanupOldThreats();
            console.log(`✅ Updated threat intelligence: ${newThreats.length} new indicators added`);
        }
        catch (error) {
            console.error('Error updating threat feeds:', error);
        }
    }
    async initializeThreatData() {
        try {
            const threats = await this.getThreatFeeds();
            threats.forEach(threat => {
                const cacheKey = `${threat.type}_${threat.value}`;
                this.threatCache.set(cacheKey, threat);
                this.updateStaticLists(threat);
            });
            await this.addInitialThreats();
            console.log(`🛡️ Initialized threat intelligence with ${threats.length} indicators`);
        }
        catch (error) {
            console.error('Error initializing threat data:', error);
        }
    }
    async addInitialThreats() {
        const initialThreats = [
            {
                type: 'ip_reputation',
                value: '192.168.1.100',
                threatLevel: 'high',
                source: 'internal_detection',
                description: 'Multiple failed login attempts detected',
                tags: ['bruteforce', 'authentication'],
                iocs: ['failed_login_attempts']
            },
            {
                type: 'domain_reputation',
                value: 'malicious-site.com',
                threatLevel: 'critical',
                source: 'threat_feed',
                description: 'Known phishing domain',
                tags: ['phishing', 'credential_theft'],
                iocs: ['phishing_indicators']
            },
            {
                type: 'malware_hash',
                value: 'a1b2c3d4e5f6789',
                threatLevel: 'critical',
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
            }
            catch (error) {
                console.error('Error adding initial threat:', error);
            }
        }
    }
    async simulateThreatFeedUpdate() {
        const mockThreats = [
            {
                type: 'ip_reputation',
                value: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                threatLevel: 'medium',
                source: 'external_feed',
                description: 'Suspicious IP detected in honeypot',
                tags: ['honeypot', 'scanning'],
                iocs: ['port_scanning']
            },
            {
                type: 'domain_reputation',
                value: `suspicious-${Date.now()}.net`,
                threatLevel: 'low',
                source: 'domain_analysis',
                description: 'Newly registered domain with suspicious patterns',
                tags: ['newly_registered', 'suspicious_pattern'],
                iocs: ['domain_generation']
            }
        ];
        return mockThreats;
    }
    async cleanupOldThreats() {
        try {
            const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            const oldThreats = await this.databaseService.find('threat_intelligence', {
                lastUpdated: { $lt: cutoffDate }
            });
            for (const threat of oldThreats) {
                await this.removeThreatIndicator(threat.id);
            }
            if (oldThreats.length > 0) {
                console.log(`🧹 Cleaned up ${oldThreats.length} old threat indicators`);
            }
        }
        catch (error) {
            console.error('Error cleaning up old threats:', error);
        }
    }
    updateStaticLists(threat) {
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
    removeFromStaticLists(threat) {
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
    startPeriodicUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateThreatFeeds();
        }, 6 * 60 * 60 * 1000);
        console.log('📡 Started periodic threat intelligence updates (every 6 hours)');
    }
    generateId() {
        return 'threat_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    async cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        console.log('🧹 ThreatIntelligenceService cleanup completed');
    }
};
exports.ThreatIntelligenceService = ThreatIntelligenceService;
exports.ThreatIntelligenceService = ThreatIntelligenceService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService])
], ThreatIntelligenceService);
//# sourceMappingURL=ThreatIntelligenceService.js.map
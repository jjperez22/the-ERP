import { DatabaseService } from '../../services/DatabaseService';
import { ThreatIntelligence } from './types/Security';
export declare class ThreatIntelligenceService {
    private databaseService;
    private threatCache;
    private updateInterval;
    private suspiciousIPs;
    private blacklistedDomains;
    private knownMalwareHashes;
    constructor(databaseService: DatabaseService);
    checkIPReputation(ipAddress: string): Promise<{
        isThreat: boolean;
        threatLevel: string;
        details?: ThreatIntelligence;
    }>;
    checkDomainReputation(domain: string): Promise<{
        isThreat: boolean;
        threatLevel: string;
        details?: ThreatIntelligence;
    }>;
    checkMalwareHash(hash: string): Promise<{
        isMalware: boolean;
        threatLevel: string;
        details?: ThreatIntelligence;
    }>;
    addThreatIndicator(threat: Omit<ThreatIntelligence, 'id' | 'lastUpdated'>): Promise<ThreatIntelligence>;
    updateThreatIndicator(id: string, updates: Partial<ThreatIntelligence>): Promise<boolean>;
    removeThreatIndicator(id: string): Promise<boolean>;
    getThreatFeeds(): Promise<ThreatIntelligence[]>;
    searchThreats(query: {
        type?: ThreatIntelligence['type'];
        threatLevel?: ThreatIntelligence['threatLevel'];
        source?: string;
        tags?: string[];
        value?: string;
    }): Promise<ThreatIntelligence[]>;
    getThreatStatistics(): Promise<any>;
    updateThreatFeeds(): Promise<void>;
    private initializeThreatData;
    private addInitialThreats;
    private simulateThreatFeedUpdate;
    private cleanupOldThreats;
    private updateStaticLists;
    private removeFromStaticLists;
    private startPeriodicUpdates;
    private generateId;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=ThreatIntelligenceService.d.ts.map
import { DatabaseService } from '../../services/DatabaseService';
import { SecurityEvent, FraudIndicator } from './types/Security';
export declare class FraudDetectionService {
    private databaseService;
    private fraudRules;
    private suspiciousIPs;
    private blacklistedMerchants;
    constructor(databaseService: DatabaseService);
    analyzeTransaction(event: SecurityEvent): Promise<{
        isFraudulent: boolean;
        riskScore: number;
        indicators: FraudIndicator[];
    }>;
    private extractTransactionData;
    private checkTransactionAmount;
    private checkTransactionVelocity;
    private checkTransactionLocation;
    private checkTransactionPatterns;
    private checkMerchantReputation;
    private checkTransactionTime;
    private getUserTransactionHistory;
    private getRecentTransactions;
    private getRecentSecurityEvents;
    private getMerchantTransactionHistory;
    private calculateDistance;
    private toRadians;
    private recordFraudulentTransaction;
    private initializeFraudRules;
    private loadThreatIntelligence;
    updateThreatIntelligence(): Promise<void>;
    getFraudStatistics(days?: number): Promise<any>;
    private generateId;
}
//# sourceMappingURL=FraudDetectionService.d.ts.map
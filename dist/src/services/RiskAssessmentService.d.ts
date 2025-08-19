import { DatabaseService } from '../../services/DatabaseService';
import { SecurityEvent, RiskAssessment, UserBehaviorProfile } from './types/Security';
export declare class RiskAssessmentService {
    private databaseService;
    private riskProfiles;
    private defaultRiskValidityHours;
    constructor(databaseService: DatabaseService);
    calculateUserRisk(userId: string, recentEvents: SecurityEvent[], behaviorProfile?: UserBehaviorProfile): Promise<RiskAssessment>;
    private calculateBehavioralRisk;
    private calculateGeographicalRisk;
    private calculateTransactionalRisk;
    private calculateTemporalRisk;
    private calculateDeviceRisk;
    private calculateOverallRiskScore;
    private categorizeRiskLevel;
    private generateRiskRecommendations;
    private isImpossibleTravel;
    private calculateDistance;
    private toRadians;
    private createDefaultRiskAssessment;
    getUserRiskHistory(userId: string, days?: number): Promise<RiskAssessment[]>;
    invalidateUserRisk(userId: string): Promise<void>;
}
//# sourceMappingURL=RiskAssessmentService.d.ts.map
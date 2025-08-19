import { DatabaseService } from '../../services/DatabaseService';
import { SecurityEvent, UserBehaviorProfile } from './types/Security';
export declare class BehaviorAnalysisService {
    private databaseService;
    private behaviorProfiles;
    private learningPeriod;
    private anomalyThreshold;
    constructor(databaseService: DatabaseService);
    analyzeEvent(event: SecurityEvent): Promise<{
        isAnomalous: boolean;
        anomalyScore: number;
        reasons: string[];
    }>;
    getUserProfile(userId: string): Promise<UserBehaviorProfile | null>;
    createUserProfile(userId: string, initialEvent: SecurityEvent): Promise<UserBehaviorProfile>;
    private analyzeLocationAnomaly;
    private analyzeTimeAnomaly;
    private analyzeDeviceAnomaly;
    private analyzeVelocityAnomaly;
    private analyzePatternAnomaly;
    private updateUserProfile;
    private calculateDistance;
    private toRadians;
    private compareDeviceFingerprints;
    getRiskProfile(userId: string): Promise<{
        riskLevel: string;
        factors: string[];
        score: number;
    }>;
    private generateId;
}
//# sourceMappingURL=BehaviorAnalysisService.d.ts.map
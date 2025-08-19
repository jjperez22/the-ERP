import { DatabaseService } from '../../services/DatabaseService';
import { HealthScore, SensorReading } from './types/Equipment';
export declare class HealthScoringService {
    private databaseService;
    private healthScores;
    constructor(databaseService: DatabaseService);
    calculateHealthScore(equipmentId: string, recentReadings: SensorReading[]): Promise<HealthScore>;
    getHealthScore(equipmentId: string): Promise<HealthScore | null>;
    private calculateComponentScore;
    private calculateRiskLevel;
    private createDefaultHealthScore;
    getAllHealthScores(): Promise<HealthScore[]>;
}
//# sourceMappingURL=HealthScoringService.d.ts.map
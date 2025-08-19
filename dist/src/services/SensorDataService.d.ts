import { DatabaseService } from '../../services/DatabaseService';
import { SensorReading } from './types/Equipment';
export declare class SensorDataService {
    private databaseService;
    private sensorData;
    constructor(databaseService: DatabaseService);
    processSensorReading(reading: Omit<SensorReading, 'id'>): Promise<SensorReading>;
    getRecentReadings(equipmentId: string, limit?: number): Promise<SensorReading[]>;
    getHistoricalData(equipmentId: string, sensorType: string, hours?: number): Promise<SensorReading[]>;
    simulateReading(equipmentId: string, sensorType: SensorReading['sensorType']): Omit<SensorReading, 'id'>;
    private generateId;
}
//# sourceMappingURL=SensorDataService.d.ts.map
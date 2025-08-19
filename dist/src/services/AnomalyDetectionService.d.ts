import { SensorReading } from './types/Equipment';
export declare class AnomalyDetectionService {
    private thresholds;
    constructor();
    detectAnomaly(reading: SensorReading, historicalData: SensorReading[]): Promise<boolean>;
    private detectStatisticalAnomaly;
    private detectThresholdAnomaly;
    calculateAnomalySeverity(reading: SensorReading, historicalData: SensorReading[]): 'low' | 'medium' | 'high' | 'critical';
    private initializeThresholds;
}
//# sourceMappingURL=AnomalyDetectionService.d.ts.map
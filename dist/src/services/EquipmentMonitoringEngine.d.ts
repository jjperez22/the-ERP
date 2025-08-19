import { EventEmitter } from 'events';
import { DatabaseService } from '../../services/DatabaseService';
import { SensorDataService } from './SensorDataService';
import { AnomalyDetectionService } from './AnomalyDetectionService';
import { HealthScoringService } from './HealthScoringService';
import { MaintenanceAlertService } from './MaintenanceAlertService';
import { Equipment, SensorReading, HealthScore, MaintenanceAlert } from './types/Equipment';
export declare class EquipmentMonitoringEngine extends EventEmitter {
    private databaseService;
    private sensorDataService;
    private anomalyDetectionService;
    private healthScoringService;
    private maintenanceAlertService;
    private monitoringActive;
    private simulationInterval?;
    private healthUpdateInterval?;
    constructor(databaseService: DatabaseService, sensorDataService: SensorDataService, anomalyDetectionService: AnomalyDetectionService, healthScoringService: HealthScoringService, maintenanceAlertService: MaintenanceAlertService);
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;
    addEquipment(equipment: Omit<Equipment, 'id'>): Promise<Equipment>;
    processSensorReading(reading: Omit<SensorReading, 'id'>): Promise<SensorReading>;
    getEquipmentHealth(equipmentId: string): Promise<HealthScore | null>;
    getAllEquipmentHealth(): Promise<HealthScore[]>;
    getActiveAlerts(equipmentId?: string): Promise<MaintenanceAlert[]>;
    getCriticalAlerts(): Promise<MaintenanceAlert[]>;
    acknowledgeAlert(alertId: string): Promise<boolean>;
    resolveAlert(alertId: string): Promise<boolean>;
    getEquipmentList(): Promise<Equipment[]>;
    private updateEquipmentHealth;
    private startSensorSimulation;
    private startHealthScoreUpdates;
    private initializeEventHandlers;
    private generateId;
}
//# sourceMappingURL=EquipmentMonitoringEngine.d.ts.map
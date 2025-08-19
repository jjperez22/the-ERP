import { EventEmitter } from 'events';
import { DatabaseService } from '../../services/DatabaseService';
import { MaintenanceAlert, SensorReading } from './types/Equipment';
export declare class MaintenanceAlertService extends EventEmitter {
    private databaseService;
    private activeAlerts;
    constructor(databaseService: DatabaseService);
    createAlert(alertData: Omit<MaintenanceAlert, 'id' | 'createdAt' | 'acknowledged'>): Promise<MaintenanceAlert>;
    createAnomalyAlert(reading: SensorReading, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<MaintenanceAlert>;
    acknowledgeAlert(alertId: string): Promise<boolean>;
    resolveAlert(alertId: string): Promise<boolean>;
    getActiveAlerts(equipmentId?: string): Promise<MaintenanceAlert[]>;
    getCriticalAlerts(): Promise<MaintenanceAlert[]>;
    getAlertsByEquipment(equipmentId: string): Promise<MaintenanceAlert[]>;
    getAlertHistory(equipmentId: string, days?: number): Promise<MaintenanceAlert[]>;
    private loadActiveAlerts;
    private getRecommendedAction;
    private estimateDowntime;
    private estimateCost;
    private generateId;
}
//# sourceMappingURL=MaintenanceAlertService.d.ts.map
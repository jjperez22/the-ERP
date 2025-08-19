import { EquipmentMonitoringEngine } from '../services/EquipmentMonitoringEngine';
import { Equipment, SensorReading } from '../services/types/Equipment';
export declare class PredictiveMaintenanceController {
    private equipmentMonitoringEngine;
    constructor(equipmentMonitoringEngine: EquipmentMonitoringEngine);
    addEquipment(equipmentData: Omit<Equipment, 'id'>): Promise<Equipment>;
    getEquipmentList(): Promise<Equipment[]>;
    startMonitoring(): Promise<{
        success: boolean;
        message: string;
    }>;
    stopMonitoring(): Promise<{
        success: boolean;
        message: string;
    }>;
    processSensorReading(reading: Omit<SensorReading, 'id'>): Promise<SensorReading>;
    getEquipmentHealth(equipmentId: string): Promise<import("../services/types/Equipment").HealthScore>;
    getAllEquipmentHealth(): Promise<import("../services/types/Equipment").HealthScore[]>;
    getActiveAlerts(equipmentId?: string): Promise<import("../services/types/Equipment").MaintenanceAlert[]>;
    getCriticalAlerts(): Promise<import("../services/types/Equipment").MaintenanceAlert[]>;
    acknowledgeAlert(alertId: string): Promise<{
        success: boolean;
    }>;
    resolveAlert(alertId: string): Promise<{
        success: boolean;
    }>;
    getDashboardData(): Promise<{
        summary: {
            totalEquipment: number;
            activeEquipment: number;
            criticalEquipment: number;
            highRiskEquipment: number;
            activeAlerts: number;
            criticalAlerts: number;
        };
        equipment: Equipment[];
        healthScores: import("../services/types/Equipment").HealthScore[];
        recentAlerts: import("../services/types/Equipment").MaintenanceAlert[];
        criticalAlerts: import("../services/types/Equipment").MaintenanceAlert[];
    }>;
    getAnalyticsTrends(days?: number): Promise<{
        healthTrends: {
            equipmentId: string;
            overallScore: number;
            trendDirection: "stable" | "declining" | "improving";
            riskLevel: "critical" | "high" | "low" | "medium";
        }[];
        improvingEquipment: number;
        decliningEquipment: number;
        stableEquipment: number;
    }>;
    simulateEquipment(): Promise<{
        message: string;
        equipment: Equipment[];
    }>;
}
//# sourceMappingURL=PredictiveMaintenanceController.d.ts.map
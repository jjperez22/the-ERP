import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';
interface InventoryItem {
    id: string;
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    minimumStock: number;
    maximumStock: number;
    unit: string;
    unitCost: number;
    location: string;
    supplier: string;
    lastUpdated: Date;
    expirationDate?: Date;
    batchNumber?: string;
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}
interface InventoryAdjustment {
    inventoryId: string;
    newQuantity: number;
    reason: string;
    notes?: string;
}
export declare class InventoryController {
    private databaseService;
    private aiService;
    private notificationService;
    constructor(databaseService: DatabaseService, aiService: AIService, notificationService: NotificationService);
    getAllInventory(query: any): Promise<{
        success: boolean;
        data: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
        insights: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        pagination?: undefined;
        insights?: undefined;
    }>;
    getInventoryById(id: string): Promise<{
        success: boolean;
        data: {
            movements: unknown[];
            recommendations: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    createInventoryItem(inventoryData: Partial<InventoryItem>): Promise<{
        success: boolean;
        data: InventoryItem;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    updateInventoryItem(id: string, updateData: Partial<InventoryItem>): Promise<{
        success: boolean;
        data: {
            lastUpdated: Date;
            id: string;
            productId: string;
            productName: string;
            category: string;
            quantity: number;
            minimumStock: number;
            maximumStock: number;
            unit: string;
            unitCost: number;
            location: string;
            supplier: string;
            expirationDate: Date;
            batchNumber: string;
            status: "in_stock" | "low_stock" | "out_of_stock" | "expired";
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    deleteInventoryItem(id: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    adjustInventory(id: string, adjustment: InventoryAdjustment): Promise<{
        success: boolean;
        data: {
            quantity: number;
            lastUpdated: Date;
            status: string;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        message?: undefined;
    }>;
    bulkUpdateInventory(updates: Array<{
        id: string;
        quantity: number;
        reason: string;
    }>): Promise<{
        success: boolean;
        results: ({
            success: boolean;
            data: {
                quantity: number;
                lastUpdated: Date;
                status: string;
            };
            message: string;
            error?: undefined;
            id: string;
        } | {
            success: boolean;
            error: any;
            data?: undefined;
            message?: undefined;
            id: string;
        })[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        results?: undefined;
    }>;
    getStockLevelAnalytics(): Promise<{
        success: boolean;
        data: {
            aiInsights: any;
            total_items: number;
            in_stock: number;
            low_stock: number;
            out_of_stock: number;
            expired: number;
            total_value: unknown;
            categories: Record<string, {
                count: number;
                value: number;
            }>;
            locations: Record<string, {
                count: number;
                value: number;
            }>;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    getStockMovements(inventoryId: string, query: any): Promise<{
        success: boolean;
        data: unknown[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        pagination?: undefined;
    }>;
    private determineStockStatus;
    private createStockMovement;
    private checkStockAlerts;
    private groupByCategory;
    private groupByLocation;
    private generateId;
}
export {};
//# sourceMappingURL=InventoryController.d.ts.map
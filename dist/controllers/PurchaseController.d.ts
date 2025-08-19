import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';
interface Purchase {
    id: string;
    purchaseNumber: string;
    supplierId: string;
    supplierName: string;
    items: PurchaseItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue';
    paymentTerms: string;
    expectedDelivery?: Date;
    actualDelivery?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    approvedBy?: string;
    approvedAt?: Date;
}
interface PurchaseItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    receivedQuantity?: number;
    notes?: string;
}
interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    paymentTerms: string;
    creditLimit: number;
    status: 'active' | 'inactive' | 'blocked';
    rating: number;
}
interface PurchaseApproval {
    approved: boolean;
    notes?: string;
    approvedBy: string;
}
export declare class PurchaseController {
    private databaseService;
    private aiService;
    private notificationService;
    constructor(databaseService: DatabaseService, aiService: AIService, notificationService: NotificationService);
    getAllPurchases(query: any): Promise<{
        success: boolean;
        data: Purchase[];
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
    getPurchaseById(id: string): Promise<{
        success: boolean;
        data: {
            supplier: unknown;
            recommendations: any;
            id: string;
            purchaseNumber: string;
            supplierId: string;
            supplierName: string;
            items: PurchaseItem[];
            subtotal: number;
            tax: number;
            shipping: number;
            discount: number;
            total: number;
            status: "draft" | "pending" | "approved" | "ordered" | "received" | "cancelled";
            paymentStatus: "pending" | "paid" | "partial" | "overdue";
            paymentTerms: string;
            expectedDelivery?: Date;
            actualDelivery?: Date;
            notes?: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
            approvedBy?: string;
            approvedAt?: Date;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    createPurchase(purchaseData: Partial<Purchase>): Promise<{
        success: boolean;
        data: Purchase;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    updatePurchase(id: string, updateData: Partial<Purchase>): Promise<{
        success: boolean;
        data: {
            updatedAt: Date;
            id: string;
            purchaseNumber: string;
            supplierId: string;
            supplierName: string;
            items: PurchaseItem[];
            subtotal: number;
            tax: number;
            shipping: number;
            discount: number;
            total: number;
            status: "draft" | "pending" | "approved" | "ordered" | "received" | "cancelled";
            paymentStatus: "pending" | "paid" | "partial" | "overdue";
            paymentTerms: string;
            expectedDelivery: Date;
            actualDelivery: Date;
            notes: string;
            createdAt: Date;
            createdBy: string;
            approvedBy: string;
            approvedAt: Date;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    deletePurchase(id: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    approvePurchase(id: string, approval: PurchaseApproval): Promise<{
        success: boolean;
        data: Purchase;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    receivePurchase(id: string, receiptData: {
        items: Array<{
            productId: string;
            receivedQuantity: number;
            notes?: string;
        }>;
        partialReceipt?: boolean;
        notes?: string;
    }): Promise<{
        success: boolean;
        data: {
            items: PurchaseItem[];
            status: "draft" | "approved" | "cancelled" | "pending" | "received" | "ordered";
            actualDelivery: Date;
            updatedAt: Date;
            notes: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    getSuppliers(query: any): Promise<{
        success: boolean;
        data: Supplier[];
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
    createSupplier(supplierData: Partial<Supplier>): Promise<{
        success: boolean;
        data: Supplier;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    getPurchaseAnalytics(query: any): Promise<{
        success: boolean;
        data: {
            aiInsights: any;
            total_purchases: number;
            total_spend: number;
            average_purchase_value: number;
            by_status: Record<string, number>;
            by_payment_status: Record<string, number>;
            top_suppliers: {
                id: string;
                name: string;
                totalSpend: number;
                orderCount: number;
            }[];
            pending_approvals: number;
            overdue_deliveries: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    getReorderRecommendations(): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    private calculatePurchaseTotals;
    private generatePurchaseNumber;
    private updateInventoryFromReceipt;
    private getTopSuppliers;
    private groupBy;
    private generateId;
}
export {};
//# sourceMappingURL=PurchaseController.d.ts.map
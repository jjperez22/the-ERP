import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';
interface Order {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded';
    shippingAddress: Address;
    billingAddress: Address;
    notes?: string;
    expectedDelivery?: Date;
    actualDelivery?: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
}
interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}
interface OrderStatusUpdate {
    status: Order['status'];
    notes?: string;
    notifyCustomer?: boolean;
}
export declare class OrderController {
    private databaseService;
    private aiService;
    private notificationService;
    constructor(databaseService: DatabaseService, aiService: AIService, notificationService: NotificationService);
    getAllOrders(query: any): Promise<{
        success: boolean;
        data: Order[];
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
    getOrderById(id: string): Promise<{
        success: boolean;
        data: {
            customer: unknown;
            recommendations: any;
            id: string;
            orderNumber: string;
            customerId: string;
            customerName: string;
            items: OrderItem[];
            subtotal: number;
            tax: number;
            shipping: number;
            discount: number;
            total: number;
            status: "draft" | "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
            paymentStatus: "pending" | "paid" | "partial" | "overdue" | "refunded";
            shippingAddress: Address;
            billingAddress: Address;
            notes?: string;
            expectedDelivery?: Date;
            actualDelivery?: Date;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    createOrder(orderData: Partial<Order>): Promise<{
        success: boolean;
        data: Order;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    updateOrder(id: string, updateData: Partial<Order>): Promise<{
        success: boolean;
        data: {
            updatedAt: Date;
            id: string;
            orderNumber: string;
            customerId: string;
            customerName: string;
            items: OrderItem[];
            subtotal: number;
            tax: number;
            shipping: number;
            discount: number;
            total: number;
            status: "draft" | "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
            paymentStatus: "pending" | "paid" | "partial" | "overdue" | "refunded";
            shippingAddress: Address;
            billingAddress: Address;
            notes: string;
            expectedDelivery: Date;
            actualDelivery: Date;
            createdAt: Date;
            createdBy: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    deleteOrder(id: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    updateOrderStatus(id: string, statusUpdate: OrderStatusUpdate): Promise<{
        success: boolean;
        data: {
            actualDelivery: Date;
            status: "draft" | "shipped" | "delivered" | "cancelled" | "pending" | "processing" | "confirmed";
            updatedAt: Date;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    confirmOrder(id: string): Promise<{
        success: boolean;
        error: string;
        details: string[];
        data?: undefined;
    } | {
        success: boolean;
        data: {
            status: string;
            updatedAt: Date;
        };
        error?: undefined;
        details?: undefined;
    } | {
        success: boolean;
        error: any;
        details?: undefined;
        data?: undefined;
    }>;
    getOrderTracking(id: string): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    getOrdersOverview(query: any): Promise<{
        success: boolean;
        data: {
            aiInsights: any;
            total_orders: number;
            total_revenue: number;
            average_order_value: number;
            by_status: Record<string, number>;
            by_payment_status: Record<string, number>;
            pending_orders: number;
            overdue_payments: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    private calculateOrderTotals;
    private generateOrderNumber;
    private checkInventoryAvailability;
    private reserveInventory;
    private getTrackingInfo;
    private groupBy;
    private generateId;
}
export {};
//# sourceMappingURL=OrderController.d.ts.map
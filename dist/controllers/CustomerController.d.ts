import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';
interface Customer {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    businessType: 'general_contractor' | 'subcontractor' | 'homeowner' | 'developer' | 'architect';
    creditLimit: number;
    paymentTerms: string;
    taxId?: string;
    website?: string;
    notes?: string;
    status: 'active' | 'inactive' | 'blocked';
    createdAt: Date;
    lastOrderDate?: Date;
    totalOrders: number;
    totalSpent: number;
    riskScore: number;
    loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
}
interface CustomerContact {
    id: string;
    customerId: string;
    type: 'email' | 'phone' | 'meeting' | 'quote_request';
    subject: string;
    content: string;
    timestamp: Date;
    userId: string;
    outcome?: string;
}
interface CustomerAnalytics {
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
    lastOrderDays: number;
    paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
    growthTrend: 'growing' | 'stable' | 'declining';
}
export declare class CustomerController {
    private databaseService;
    private aiService;
    private notificationService;
    constructor(databaseService: DatabaseService, aiService: AIService, notificationService: NotificationService);
    getAllCustomers(query: any): Promise<{
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
    getCustomerById(id: string): Promise<{
        success: boolean;
        data: {
            orders: unknown[];
            contacts: unknown[];
            analytics: CustomerAnalytics;
            aiRecommendations: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    createCustomer(customerData: Partial<Customer>): Promise<{
        success: boolean;
        data: Customer;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    updateCustomer(id: string, updateData: Partial<Customer>): Promise<{
        success: boolean;
        data: {
            id: string;
            companyName: string;
            contactPerson: string;
            email: string;
            phone: string;
            address: {
                street: string;
                city: string;
                state: string;
                zipCode: string;
                country: string;
            };
            businessType: "general_contractor" | "subcontractor" | "homeowner" | "developer" | "architect";
            creditLimit: number;
            paymentTerms: string;
            taxId: string;
            website: string;
            notes: string;
            status: "active" | "inactive" | "blocked";
            createdAt: Date;
            lastOrderDate: Date;
            totalOrders: number;
            totalSpent: number;
            riskScore: number;
            loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    deleteCustomer(id: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    addCustomerContact(id: string, contactData: Partial<CustomerContact>): Promise<{
        success: boolean;
        data: CustomerContact;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    getCustomerAnalytics(id: string): Promise<{
        success: boolean;
        data: {
            aiInsights: any;
            revenue: number;
            orderCount: number;
            averageOrderValue: number;
            lastOrderDays: number;
            paymentHistory: "excellent" | "good" | "fair" | "poor";
            growthTrend: "growing" | "stable" | "declining";
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    getCustomersOverview(): Promise<{
        success: boolean;
        data: {
            aiInsights: any;
            total_customers: number;
            active_customers: number;
            inactive_customers: number;
            blocked_customers: number;
            business_types: Record<string, number>;
            loyalty_tiers: Record<string, number>;
            total_revenue: unknown;
            average_order_value: number;
            high_risk_customers: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    bulkUpdateLoyaltyTiers(): Promise<{
        success: boolean;
        message: string;
        updates: {
            id: any;
            oldTier: any;
            newTier: "bronze" | "silver" | "gold" | "platinum";
        }[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        updates?: undefined;
    }>;
    getCustomerRecommendations(id: string): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    private calculateCustomerAnalytics;
    private createCustomerContact;
    private calculateLoyaltyTier;
    private groupByBusinessType;
    private groupByLoyaltyTier;
    private calculateAverageOrderValue;
    private generateId;
}
export {};
//# sourceMappingURL=CustomerController.d.ts.map
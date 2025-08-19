"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../services/DatabaseService");
const AIService_1 = require("../services/AIService");
const NotificationService_1 = require("../services/NotificationService");
let CustomerController = class CustomerController {
    databaseService;
    aiService;
    notificationService;
    constructor(databaseService, aiService, notificationService) {
        this.databaseService = databaseService;
        this.aiService = aiService;
        this.notificationService = notificationService;
    }
    async getAllCustomers(query) {
        try {
            const { businessType, status, loyaltyTier, searchTerm, page = 1, limit = 50, sortBy = 'companyName', sortOrder = 'asc' } = query;
            let filters = {};
            if (businessType)
                filters.businessType = businessType;
            if (status)
                filters.status = status;
            if (loyaltyTier)
                filters.loyaltyTier = loyaltyTier;
            if (searchTerm) {
                filters.$or = [
                    { companyName: { $regex: searchTerm, $options: 'i' } },
                    { contactPerson: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } }
                ];
            }
            const skip = (page - 1) * limit;
            const customers = await this.databaseService.find('customers', filters, {
                skip,
                limit: parseInt(limit),
                sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
            });
            const total = await this.databaseService.count('customers', filters);
            const insights = await this.aiService.generateCustomerInsights(customers);
            return {
                success: true,
                data: customers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                insights
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getCustomerById(id) {
        try {
            const customer = await this.databaseService.findById('customers', id);
            if (!customer) {
                return { success: false, error: 'Customer not found' };
            }
            const orders = await this.databaseService.find('orders', { customerId: id }, { sort: { createdAt: -1 }, limit: 10 });
            const contacts = await this.databaseService.find('customer_contacts', { customerId: id }, { sort: { timestamp: -1 }, limit: 20 });
            const analytics = await this.calculateCustomerAnalytics(id);
            const aiRecommendations = await this.aiService.getCustomerRecommendations(customer, analytics);
            return {
                success: true,
                data: {
                    ...customer,
                    orders,
                    contacts,
                    analytics,
                    aiRecommendations
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async createCustomer(customerData) {
        try {
            const requiredFields = ['companyName', 'contactPerson', 'email', 'phone', 'businessType'];
            for (const field of requiredFields) {
                if (!customerData[field]) {
                    return { success: false, error: `${field} is required` };
                }
            }
            const existingCustomer = await this.databaseService.findOne('customers', { email: customerData.email });
            if (existingCustomer) {
                return { success: false, error: 'Customer with this email already exists' };
            }
            const newCustomer = {
                id: this.generateId(),
                creditLimit: 10000,
                paymentTerms: 'Net 30',
                status: 'active',
                createdAt: new Date(),
                totalOrders: 0,
                totalSpent: 0,
                riskScore: 0.5,
                loyaltyTier: 'bronze',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'USA'
                },
                ...customerData
            };
            newCustomer.riskScore = await this.aiService.calculateCustomerRiskScore(newCustomer);
            const saved = await this.databaseService.create('customers', newCustomer);
            await this.createCustomerContact({
                customerId: saved.id,
                type: 'email',
                subject: 'Welcome to our system',
                content: 'Customer account created successfully',
                timestamp: new Date(),
                userId: 'system'
            });
            return { success: true, data: saved };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async updateCustomer(id, updateData) {
        try {
            const existing = await this.databaseService.findById('customers', id);
            if (!existing) {
                return { success: false, error: 'Customer not found' };
            }
            const updated = {
                ...existing,
                ...updateData
            };
            if (updateData.creditLimit || updateData.paymentTerms || updateData.businessType) {
                updated.riskScore = await this.aiService.calculateCustomerRiskScore(updated);
            }
            updated.loyaltyTier = this.calculateLoyaltyTier(updated.totalSpent);
            const saved = await this.databaseService.update('customers', id, updated);
            return { success: true, data: saved };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async deleteCustomer(id) {
        try {
            const existing = await this.databaseService.findById('customers', id);
            if (!existing) {
                return { success: false, error: 'Customer not found' };
            }
            const activeOrders = await this.databaseService.count('orders', { customerId: id, status: { $in: ['pending', 'processing', 'shipped'] } });
            if (activeOrders > 0) {
                return { success: false, error: 'Cannot delete customer with active orders' };
            }
            await this.databaseService.update('customers', id, { status: 'inactive' });
            return { success: true, message: 'Customer deactivated successfully' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async addCustomerContact(id, contactData) {
        try {
            const customer = await this.databaseService.findById('customers', id);
            if (!customer) {
                return { success: false, error: 'Customer not found' };
            }
            const contact = await this.createCustomerContact({
                customerId: id,
                type: contactData.type || 'email',
                subject: contactData.subject || '',
                content: contactData.content || '',
                timestamp: new Date(),
                userId: contactData.userId || 'system',
                outcome: contactData.outcome
            });
            return { success: true, data: contact };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getCustomerAnalytics(id) {
        try {
            const customer = await this.databaseService.findById('customers', id);
            if (!customer) {
                return { success: false, error: 'Customer not found' };
            }
            const analytics = await this.calculateCustomerAnalytics(id);
            const aiInsights = await this.aiService.generateCustomerAnalytics(customer, analytics);
            return {
                success: true,
                data: {
                    ...analytics,
                    aiInsights
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getCustomersOverview() {
        try {
            const customers = await this.databaseService.find('customers', {});
            const overview = {
                total_customers: customers.length,
                active_customers: customers.filter(c => c.status === 'active').length,
                inactive_customers: customers.filter(c => c.status === 'inactive').length,
                blocked_customers: customers.filter(c => c.status === 'blocked').length,
                business_types: this.groupByBusinessType(customers),
                loyalty_tiers: this.groupByLoyaltyTier(customers),
                total_revenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
                average_order_value: this.calculateAverageOrderValue(customers),
                high_risk_customers: customers.filter(c => c.riskScore > 0.7).length
            };
            const aiInsights = await this.aiService.generateCustomerBaseAnalytics(overview);
            return { success: true, data: { ...overview, aiInsights } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async bulkUpdateLoyaltyTiers() {
        try {
            const customers = await this.databaseService.find('customers', {});
            const updates = [];
            for (const customer of customers) {
                const newTier = this.calculateLoyaltyTier(customer.totalSpent);
                if (newTier !== customer.loyaltyTier) {
                    await this.databaseService.update('customers', customer.id, { loyaltyTier: newTier });
                    updates.push({ id: customer.id, oldTier: customer.loyaltyTier, newTier });
                }
            }
            return {
                success: true,
                message: `Updated ${updates.length} customer loyalty tiers`,
                updates
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getCustomerRecommendations(id) {
        try {
            const customer = await this.databaseService.findById('customers', id);
            if (!customer) {
                return { success: false, error: 'Customer not found' };
            }
            const analytics = await this.calculateCustomerAnalytics(id);
            const recommendations = await this.aiService.getCustomerRecommendations(customer, analytics);
            return { success: true, data: recommendations };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async calculateCustomerAnalytics(customerId) {
        const orders = await this.databaseService.find('orders', { customerId });
        const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const orderCount = orders.length;
        const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;
        const lastOrder = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const lastOrderDays = lastOrder ?
            Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)) :
            999;
        const paidOrders = orders.filter(order => order.paymentStatus === 'paid');
        const paymentRatio = orderCount > 0 ? paidOrders.length / orderCount : 1;
        let paymentHistory;
        if (paymentRatio >= 0.95)
            paymentHistory = 'excellent';
        else if (paymentRatio >= 0.85)
            paymentHistory = 'good';
        else if (paymentRatio >= 0.7)
            paymentHistory = 'fair';
        else
            paymentHistory = 'poor';
        const recentOrders = orders.filter(order => new Date(order.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
        const olderOrders = orders.filter(order => new Date(order.createdAt) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) &&
            new Date(order.createdAt) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000));
        const recentRevenue = recentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const olderRevenue = olderOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        let growthTrend;
        if (recentRevenue > olderRevenue * 1.1)
            growthTrend = 'growing';
        else if (recentRevenue < olderRevenue * 0.9)
            growthTrend = 'declining';
        else
            growthTrend = 'stable';
        return {
            revenue,
            orderCount,
            averageOrderValue,
            lastOrderDays,
            paymentHistory,
            growthTrend
        };
    }
    async createCustomerContact(contactData) {
        const contact = {
            id: this.generateId(),
            ...contactData
        };
        return await this.databaseService.create('customer_contacts', contact);
    }
    calculateLoyaltyTier(totalSpent) {
        if (totalSpent >= 100000)
            return 'platinum';
        if (totalSpent >= 50000)
            return 'gold';
        if (totalSpent >= 15000)
            return 'silver';
        return 'bronze';
    }
    groupByBusinessType(customers) {
        return customers.reduce((acc, customer) => {
            if (!acc[customer.businessType]) {
                acc[customer.businessType] = 0;
            }
            acc[customer.businessType]++;
            return acc;
        }, {});
    }
    groupByLoyaltyTier(customers) {
        return customers.reduce((acc, customer) => {
            if (!acc[customer.loyaltyTier]) {
                acc[customer.loyaltyTier] = 0;
            }
            acc[customer.loyaltyTier]++;
            return acc;
        }, {});
    }
    calculateAverageOrderValue(customers) {
        const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
        const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
        return totalOrders > 0 ? totalSpent / totalOrders : 0;
    }
    generateId() {
        return 'cust_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.CustomerController = CustomerController;
__decorate([
    (0, warp_1.Get)('/'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getAllCustomers", null);
__decorate([
    (0, warp_1.Get)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCustomerById", null);
__decorate([
    (0, warp_1.Post)('/'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "createCustomer", null);
__decorate([
    (0, warp_1.Put)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "updateCustomer", null);
__decorate([
    (0, warp_1.Delete)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "deleteCustomer", null);
__decorate([
    (0, warp_1.Post)('/:id/contacts'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "addCustomerContact", null);
__decorate([
    (0, warp_1.Get)('/:id/analytics'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCustomerAnalytics", null);
__decorate([
    (0, warp_1.Get)('/analytics/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCustomersOverview", null);
__decorate([
    (0, warp_1.Post)('/bulk-update-tier'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "bulkUpdateLoyaltyTiers", null);
__decorate([
    (0, warp_1.Get)('/:id/recommendations'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCustomerRecommendations", null);
exports.CustomerController = CustomerController = __decorate([
    (0, warp_1.Injectable)(),
    (0, warp_1.Controller)('/api/customers'),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        AIService_1.AIService,
        NotificationService_1.NotificationService])
], CustomerController);
//# sourceMappingURL=CustomerController.js.map
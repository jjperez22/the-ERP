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
exports.OrderController = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../services/DatabaseService");
const AIService_1 = require("../services/AIService");
const NotificationService_1 = require("../services/NotificationService");
let OrderController = class OrderController {
    databaseService;
    aiService;
    notificationService;
    constructor(databaseService, aiService, notificationService) {
        this.databaseService = databaseService;
        this.aiService = aiService;
        this.notificationService = notificationService;
    }
    async getAllOrders(query) {
        try {
            const { status, paymentStatus, customerId, startDate, endDate, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = query;
            let filters = {};
            if (status)
                filters.status = status;
            if (paymentStatus)
                filters.paymentStatus = paymentStatus;
            if (customerId)
                filters.customerId = customerId;
            if (startDate || endDate) {
                filters.createdAt = {};
                if (startDate)
                    filters.createdAt.$gte = new Date(startDate);
                if (endDate)
                    filters.createdAt.$lte = new Date(endDate);
            }
            const skip = (page - 1) * limit;
            const orders = await this.databaseService.find('orders', filters, {
                skip,
                limit: parseInt(limit),
                sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
            });
            const total = await this.databaseService.count('orders', filters);
            const insights = await this.aiService.generateOrderInsights(orders);
            return {
                success: true,
                data: orders,
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
    async getOrderById(id) {
        try {
            const order = await this.databaseService.findById('orders', id);
            if (!order) {
                return { success: false, error: 'Order not found' };
            }
            const customer = await this.databaseService.findById('customers', order.customerId);
            const recommendations = await this.aiService.getOrderRecommendations(order);
            return {
                success: true,
                data: {
                    ...order,
                    customer,
                    recommendations
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async createOrder(orderData) {
        try {
            const requiredFields = ['customerId', 'items', 'shippingAddress'];
            for (const field of requiredFields) {
                if (!orderData[field]) {
                    return { success: false, error: `${field} is required` };
                }
            }
            if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
                return { success: false, error: 'Order must contain at least one item' };
            }
            const customer = await this.databaseService.findById('customers', orderData.customerId);
            if (!customer) {
                return { success: false, error: 'Customer not found' };
            }
            const calculations = await this.calculateOrderTotals(orderData.items);
            const orderNumber = await this.generateOrderNumber();
            const newOrder = {
                id: this.generateId(),
                orderNumber,
                customerId: orderData.customerId,
                customerName: customer.companyName,
                items: orderData.items,
                subtotal: calculations.subtotal,
                tax: calculations.tax,
                shipping: calculations.shipping,
                discount: orderData.discount || 0,
                total: calculations.total - (orderData.discount || 0),
                status: 'draft',
                paymentStatus: 'pending',
                shippingAddress: orderData.shippingAddress,
                billingAddress: orderData.billingAddress || orderData.shippingAddress,
                notes: orderData.notes,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system'
            };
            newOrder.expectedDelivery = await this.aiService.calculateExpectedDelivery(newOrder);
            const saved = await this.databaseService.create('orders', newOrder);
            await this.notificationService.send({
                type: 'order_confirmation',
                title: 'Order Confirmation',
                message: `Order ${orderNumber} has been created successfully`,
                data: saved,
                recipientId: customer.id,
                recipientEmail: customer.email
            });
            return { success: true, data: saved };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async updateOrder(id, updateData) {
        try {
            const existing = await this.databaseService.findById('orders', id);
            if (!existing) {
                return { success: false, error: 'Order not found' };
            }
            if (['delivered', 'cancelled'].includes(existing.status)) {
                return { success: false, error: 'Cannot update completed orders' };
            }
            let updated = {
                ...existing,
                ...updateData,
                updatedAt: new Date()
            };
            if (updateData.items) {
                const calculations = await this.calculateOrderTotals(updateData.items);
                updated = {
                    ...updated,
                    subtotal: calculations.subtotal,
                    tax: calculations.tax,
                    shipping: calculations.shipping,
                    total: calculations.total - (updated.discount || 0)
                };
            }
            const saved = await this.databaseService.update('orders', id, updated);
            return { success: true, data: saved };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async deleteOrder(id) {
        try {
            const existing = await this.databaseService.findById('orders', id);
            if (!existing) {
                return { success: false, error: 'Order not found' };
            }
            if (existing.status !== 'draft') {
                return { success: false, error: 'Only draft orders can be deleted' };
            }
            await this.databaseService.delete('orders', id);
            return { success: true, message: 'Order deleted successfully' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async updateOrderStatus(id, statusUpdate) {
        try {
            const order = await this.databaseService.findById('orders', id);
            if (!order) {
                return { success: false, error: 'Order not found' };
            }
            const updated = await this.databaseService.update('orders', id, {
                status: statusUpdate.status,
                updatedAt: new Date(),
                ...(statusUpdate.status === 'delivered' && { actualDelivery: new Date() })
            });
            if (statusUpdate.notifyCustomer) {
                const customer = await this.databaseService.findById('customers', order.customerId);
                if (customer) {
                    await this.notificationService.send({
                        type: 'order_status_update',
                        title: 'Order Status Update',
                        message: `Order ${order.orderNumber} status changed to ${statusUpdate.status}`,
                        data: { order: updated, notes: statusUpdate.notes },
                        recipientId: customer.id,
                        recipientEmail: customer.email
                    });
                }
            }
            return { success: true, data: updated };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async confirmOrder(id) {
        try {
            const order = await this.databaseService.findById('orders', id);
            if (!order) {
                return { success: false, error: 'Order not found' };
            }
            if (order.status !== 'draft' && order.status !== 'pending') {
                return { success: false, error: 'Only draft or pending orders can be confirmed' };
            }
            const inventoryCheck = await this.checkInventoryAvailability(order.items);
            if (!inventoryCheck.available) {
                return {
                    success: false,
                    error: 'Insufficient inventory',
                    details: inventoryCheck.issues
                };
            }
            await this.reserveInventory(order.items);
            const updated = await this.databaseService.update('orders', id, {
                status: 'confirmed',
                updatedAt: new Date()
            });
            return { success: true, data: updated };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getOrderTracking(id) {
        try {
            const order = await this.databaseService.findById('orders', id);
            if (!order) {
                return { success: false, error: 'Order not found' };
            }
            const tracking = await this.getTrackingInfo(order);
            return { success: true, data: tracking };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getOrdersOverview(query) {
        try {
            const { startDate, endDate } = query;
            let dateFilter = {};
            if (startDate || endDate) {
                dateFilter = {
                    createdAt: {
                        ...(startDate && { $gte: new Date(startDate) }),
                        ...(endDate && { $lte: new Date(endDate) })
                    }
                };
            }
            const orders = await this.databaseService.find('orders', dateFilter);
            const overview = {
                total_orders: orders.length,
                total_revenue: orders.reduce((sum, order) => sum + order.total, 0),
                average_order_value: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
                by_status: this.groupBy(orders, 'status'),
                by_payment_status: this.groupBy(orders, 'paymentStatus'),
                pending_orders: orders.filter(o => o.status === 'pending').length,
                overdue_payments: orders.filter(o => o.paymentStatus === 'overdue').length
            };
            const aiInsights = await this.aiService.generateOrderAnalytics(overview);
            return { success: true, data: { ...overview, aiInsights } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async calculateOrderTotals(items) {
        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = subtotal * 0.08;
        const shipping = subtotal > 500 ? 0 : 50;
        const total = subtotal + tax + shipping;
        return { subtotal, tax, shipping, total };
    }
    async generateOrderNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const ordersThisMonth = await this.databaseService.count('orders', {
            orderNumber: { $regex: `^ORD-${year}${month}` }
        });
        const sequence = String(ordersThisMonth + 1).padStart(4, '0');
        return `ORD-${year}${month}-${sequence}`;
    }
    async checkInventoryAvailability(items) {
        const issues = [];
        for (const item of items) {
            const inventory = await this.databaseService.findOne('inventory', { productId: item.productId });
            if (!inventory) {
                issues.push(`Product ${item.productName} not found in inventory`);
            }
            else if (inventory.quantity < item.quantity) {
                issues.push(`Insufficient stock for ${item.productName}. Available: ${inventory.quantity}, Required: ${item.quantity}`);
            }
        }
        return {
            available: issues.length === 0,
            issues
        };
    }
    async reserveInventory(items) {
        for (const item of items) {
            const inventory = await this.databaseService.findOne('inventory', { productId: item.productId });
            if (inventory) {
                await this.databaseService.update('inventory', inventory.id, {
                    quantity: inventory.quantity - item.quantity,
                    lastUpdated: new Date()
                });
                await this.databaseService.create('stock_movements', {
                    id: this.generateId(),
                    inventoryId: inventory.id,
                    type: 'out',
                    quantity: item.quantity,
                    reason: 'Order fulfillment',
                    reference: `Order reservation`,
                    timestamp: new Date(),
                    userId: 'system'
                });
            }
        }
    }
    async getTrackingInfo(order) {
        const stages = [
            { status: 'Order Placed', completed: true, timestamp: order.createdAt },
            { status: 'Confirmed', completed: order.status !== 'draft', timestamp: order.status !== 'draft' ? order.updatedAt : null },
            { status: 'Processing', completed: ['processing', 'shipped', 'delivered'].includes(order.status), timestamp: null },
            { status: 'Shipped', completed: ['shipped', 'delivered'].includes(order.status), timestamp: null },
            { status: 'Delivered', completed: order.status === 'delivered', timestamp: order.actualDelivery }
        ];
        return {
            orderNumber: order.orderNumber,
            currentStatus: order.status,
            expectedDelivery: order.expectedDelivery,
            actualDelivery: order.actualDelivery,
            stages
        };
    }
    groupBy(items, field) {
        return items.reduce((acc, item) => {
            const key = item[field] || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }
    generateId() {
        return 'order_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, warp_1.Get)('/'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getAllOrders", null);
__decorate([
    (0, warp_1.Get)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrderById", null);
__decorate([
    (0, warp_1.Post)('/'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "createOrder", null);
__decorate([
    (0, warp_1.Put)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "updateOrder", null);
__decorate([
    (0, warp_1.Delete)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "deleteOrder", null);
__decorate([
    (0, warp_1.Post)('/:id/status'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "updateOrderStatus", null);
__decorate([
    (0, warp_1.Post)('/:id/confirm'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "confirmOrder", null);
__decorate([
    (0, warp_1.Get)('/:id/tracking'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrderTracking", null);
__decorate([
    (0, warp_1.Get)('/analytics/overview'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrdersOverview", null);
exports.OrderController = OrderController = __decorate([
    (0, warp_1.Injectable)(),
    (0, warp_1.Controller)('/api/orders'),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        AIService_1.AIService,
        NotificationService_1.NotificationService])
], OrderController);
//# sourceMappingURL=OrderController.js.map
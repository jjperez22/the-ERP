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
exports.PurchaseController = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../services/DatabaseService");
const AIService_1 = require("../services/AIService");
const NotificationService_1 = require("../services/NotificationService");
let PurchaseController = class PurchaseController {
    databaseService;
    aiService;
    notificationService;
    constructor(databaseService, aiService, notificationService) {
        this.databaseService = databaseService;
        this.aiService = aiService;
        this.notificationService = notificationService;
    }
    async getAllPurchases(query) {
        try {
            const { status, paymentStatus, supplierId, startDate, endDate, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = query;
            let filters = {};
            if (status)
                filters.status = status;
            if (paymentStatus)
                filters.paymentStatus = paymentStatus;
            if (supplierId)
                filters.supplierId = supplierId;
            if (startDate || endDate) {
                filters.createdAt = {};
                if (startDate)
                    filters.createdAt.$gte = new Date(startDate);
                if (endDate)
                    filters.createdAt.$lte = new Date(endDate);
            }
            const skip = (page - 1) * limit;
            const purchases = await this.databaseService.find('purchases', filters, {
                skip,
                limit: parseInt(limit),
                sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
            });
            const total = await this.databaseService.count('purchases', filters);
            const insights = await this.aiService.generatePurchaseInsights(purchases);
            return {
                success: true,
                data: purchases,
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
    async getPurchaseById(id) {
        try {
            const purchase = await this.databaseService.findById('purchases', id);
            if (!purchase) {
                return { success: false, error: 'Purchase not found' };
            }
            const supplier = await this.databaseService.findById('suppliers', purchase.supplierId);
            const recommendations = await this.aiService.getPurchaseRecommendations(purchase);
            return {
                success: true,
                data: {
                    ...purchase,
                    supplier,
                    recommendations
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async createPurchase(purchaseData) {
        try {
            const requiredFields = ['supplierId', 'items'];
            for (const field of requiredFields) {
                if (!purchaseData[field]) {
                    return { success: false, error: `${field} is required` };
                }
            }
            if (!Array.isArray(purchaseData.items) || purchaseData.items.length === 0) {
                return { success: false, error: 'Purchase must contain at least one item' };
            }
            const supplier = await this.databaseService.findById('suppliers', purchaseData.supplierId);
            if (!supplier) {
                return { success: false, error: 'Supplier not found' };
            }
            if (supplier.status !== 'active') {
                return { success: false, error: 'Cannot create purchase for inactive supplier' };
            }
            const calculations = await this.calculatePurchaseTotals(purchaseData.items);
            const purchaseNumber = await this.generatePurchaseNumber();
            const newPurchase = {
                id: this.generateId(),
                purchaseNumber,
                supplierId: purchaseData.supplierId,
                supplierName: supplier.name,
                items: purchaseData.items,
                subtotal: calculations.subtotal,
                tax: calculations.tax,
                shipping: calculations.shipping,
                discount: purchaseData.discount || 0,
                total: calculations.total - (purchaseData.discount || 0),
                status: 'draft',
                paymentStatus: 'pending',
                paymentTerms: supplier.paymentTerms,
                notes: purchaseData.notes,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system'
            };
            newPurchase.expectedDelivery = await this.aiService.calculateExpectedPurchaseDelivery(newPurchase, supplier);
            const saved = await this.databaseService.create('purchases', newPurchase);
            return { success: true, data: saved };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async updatePurchase(id, updateData) {
        try {
            const existing = await this.databaseService.findById('purchases', id);
            if (!existing) {
                return { success: false, error: 'Purchase not found' };
            }
            if (['received', 'cancelled'].includes(existing.status)) {
                return { success: false, error: 'Cannot update completed purchases' };
            }
            let updated = {
                ...existing,
                ...updateData,
                updatedAt: new Date()
            };
            if (updateData.items) {
                const calculations = await this.calculatePurchaseTotals(updateData.items);
                updated = {
                    ...updated,
                    subtotal: calculations.subtotal,
                    tax: calculations.tax,
                    shipping: calculations.shipping,
                    total: calculations.total - (updated.discount || 0)
                };
            }
            const saved = await this.databaseService.update('purchases', id, updated);
            return { success: true, data: saved };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async deletePurchase(id) {
        try {
            const existing = await this.databaseService.findById('purchases', id);
            if (!existing) {
                return { success: false, error: 'Purchase not found' };
            }
            if (existing.status !== 'draft') {
                return { success: false, error: 'Only draft purchases can be deleted' };
            }
            await this.databaseService.delete('purchases', id);
            return { success: true, message: 'Purchase deleted successfully' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async approvePurchase(id, approval) {
        try {
            const purchase = await this.databaseService.findById('purchases', id);
            if (!purchase) {
                return { success: false, error: 'Purchase not found' };
            }
            if (purchase.status !== 'pending') {
                return { success: false, error: 'Only pending purchases can be approved' };
            }
            const supplier = await this.databaseService.findById('suppliers', purchase.supplierId);
            if (supplier && purchase.total > supplier.creditLimit) {
                return {
                    success: false,
                    error: `Purchase amount exceeds supplier credit limit of $${supplier.creditLimit}`
                };
            }
            const updateData = {
                status: approval.approved ? 'approved' : 'cancelled',
                updatedAt: new Date()
            };
            if (approval.approved) {
                updateData.approvedBy = approval.approvedBy;
                updateData.approvedAt = new Date();
            }
            if (approval.notes) {
                updateData.notes = (purchase.notes || '') + '\n' + approval.notes;
            }
            const updated = await this.databaseService.update('purchases', id, updateData);
            if (approval.approved && supplier) {
                await this.notificationService.send({
                    type: 'purchase_approved',
                    title: 'Purchase Order Approved',
                    message: `Purchase order ${purchase.purchaseNumber} has been approved`,
                    data: updated,
                    recipientEmail: supplier.email
                });
            }
            return { success: true, data: updated };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async receivePurchase(id, receiptData) {
        try {
            const purchase = await this.databaseService.findById('purchases', id);
            if (!purchase) {
                return { success: false, error: 'Purchase not found' };
            }
            if (!['approved', 'ordered'].includes(purchase.status)) {
                return { success: false, error: 'Purchase must be approved or ordered to receive items' };
            }
            const updatedItems = purchase.items.map(item => {
                const received = receiptData.items.find(r => r.productId === item.productId);
                if (received) {
                    return {
                        ...item,
                        receivedQuantity: (item.receivedQuantity || 0) + received.receivedQuantity,
                        notes: received.notes || item.notes
                    };
                }
                return item;
            });
            await this.updateInventoryFromReceipt(receiptData.items);
            const allReceived = updatedItems.every(item => (item.receivedQuantity || 0) >= item.quantity);
            const newStatus = allReceived ? 'received' : purchase.status;
            const actualDelivery = allReceived ? new Date() : purchase.actualDelivery;
            const updated = await this.databaseService.update('purchases', id, {
                items: updatedItems,
                status: newStatus,
                actualDelivery,
                updatedAt: new Date(),
                notes: receiptData.notes ? (purchase.notes || '') + '\n' + receiptData.notes : purchase.notes
            });
            return { success: true, data: updated };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getSuppliers(query) {
        try {
            const { status = 'active', page = 1, limit = 50 } = query;
            const filters = {};
            if (status)
                filters.status = status;
            const skip = (page - 1) * limit;
            const suppliers = await this.databaseService.find('suppliers', filters, {
                skip,
                limit: parseInt(limit),
                sort: { name: 1 }
            });
            const total = await this.databaseService.count('suppliers', filters);
            return {
                success: true,
                data: suppliers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async createSupplier(supplierData) {
        try {
            const requiredFields = ['name', 'contactPerson', 'email', 'phone'];
            for (const field of requiredFields) {
                if (!supplierData[field]) {
                    return { success: false, error: `${field} is required` };
                }
            }
            const existingSupplier = await this.databaseService.findOne('suppliers', { email: supplierData.email });
            if (existingSupplier) {
                return { success: false, error: 'Supplier with this email already exists' };
            }
            const newSupplier = {
                id: this.generateId(),
                paymentTerms: 'Net 30',
                creditLimit: 50000,
                status: 'active',
                rating: 3.0,
                address: '',
                ...supplierData
            };
            const saved = await this.databaseService.create('suppliers', newSupplier);
            return { success: true, data: saved };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getPurchaseAnalytics(query) {
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
            const purchases = await this.databaseService.find('purchases', dateFilter);
            const suppliers = await this.databaseService.find('suppliers', {});
            const analytics = {
                total_purchases: purchases.length,
                total_spend: purchases.reduce((sum, p) => sum + p.total, 0),
                average_purchase_value: purchases.length > 0 ? purchases.reduce((sum, p) => sum + p.total, 0) / purchases.length : 0,
                by_status: this.groupBy(purchases, 'status'),
                by_payment_status: this.groupBy(purchases, 'paymentStatus'),
                top_suppliers: this.getTopSuppliers(purchases, suppliers),
                pending_approvals: purchases.filter(p => p.status === 'pending').length,
                overdue_deliveries: purchases.filter(p => p.expectedDelivery &&
                    new Date() > p.expectedDelivery &&
                    p.status !== 'received').length
            };
            const aiInsights = await this.aiService.generatePurchaseAnalytics(analytics);
            return { success: true, data: { ...analytics, aiInsights } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getReorderRecommendations() {
        try {
            const lowStockItems = await this.databaseService.find('inventory', {
                status: { $in: ['low_stock', 'out_of_stock'] }
            });
            const recommendations = await this.aiService.generateReorderRecommendations(lowStockItems);
            return { success: true, data: recommendations };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async calculatePurchaseTotals(items) {
        const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
        const tax = subtotal * 0.08;
        const shipping = subtotal > 1000 ? 0 : 100;
        const total = subtotal + tax + shipping;
        return { subtotal, tax, shipping, total };
    }
    async generatePurchaseNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const purchasesThisMonth = await this.databaseService.count('purchases', {
            purchaseNumber: { $regex: `^PO-${year}${month}` }
        });
        const sequence = String(purchasesThisMonth + 1).padStart(4, '0');
        return `PO-${year}${month}-${sequence}`;
    }
    async updateInventoryFromReceipt(items) {
        for (const item of items) {
            const inventory = await this.databaseService.findOne('inventory', { productId: item.productId });
            if (inventory) {
                await this.databaseService.update('inventory', inventory.id, {
                    quantity: inventory.quantity + item.receivedQuantity,
                    lastUpdated: new Date()
                });
                await this.databaseService.create('stock_movements', {
                    id: this.generateId(),
                    inventoryId: inventory.id,
                    type: 'in',
                    quantity: item.receivedQuantity,
                    reason: 'Purchase receipt',
                    reference: 'Purchase order',
                    timestamp: new Date(),
                    userId: 'system'
                });
            }
        }
    }
    getTopSuppliers(purchases, suppliers) {
        const supplierStats = new Map();
        for (const purchase of purchases) {
            const existing = supplierStats.get(purchase.supplierId) || {
                totalSpend: 0,
                orderCount: 0
            };
            supplierStats.set(purchase.supplierId, {
                totalSpend: existing.totalSpend + purchase.total,
                orderCount: existing.orderCount + 1
            });
        }
        return Array.from(supplierStats.entries())
            .map(([supplierId, stats]) => {
            const supplier = suppliers.find(s => s.id === supplierId);
            return {
                id: supplierId,
                name: supplier?.name || 'Unknown',
                ...stats
            };
        })
            .sort((a, b) => b.totalSpend - a.totalSpend)
            .slice(0, 10);
    }
    groupBy(items, field) {
        return items.reduce((acc, item) => {
            const key = item[field] || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }
    generateId() {
        return 'purchase_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.PurchaseController = PurchaseController;
__decorate([
    (0, warp_1.Get)('/'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getAllPurchases", null);
__decorate([
    (0, warp_1.Get)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getPurchaseById", null);
__decorate([
    (0, warp_1.Post)('/'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "createPurchase", null);
__decorate([
    (0, warp_1.Put)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "updatePurchase", null);
__decorate([
    (0, warp_1.Delete)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "deletePurchase", null);
__decorate([
    (0, warp_1.Post)('/:id/approve'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "approvePurchase", null);
__decorate([
    (0, warp_1.Post)('/:id/receive'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "receivePurchase", null);
__decorate([
    (0, warp_1.Get)('/suppliers'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getSuppliers", null);
__decorate([
    (0, warp_1.Post)('/suppliers'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "createSupplier", null);
__decorate([
    (0, warp_1.Get)('/analytics/overview'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getPurchaseAnalytics", null);
__decorate([
    (0, warp_1.Get)('/recommendations/reorder'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getReorderRecommendations", null);
exports.PurchaseController = PurchaseController = __decorate([
    (0, warp_1.Injectable)(),
    (0, warp_1.Controller)('/api/purchases'),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        AIService_1.AIService,
        NotificationService_1.NotificationService])
], PurchaseController);
//# sourceMappingURL=PurchaseController.js.map
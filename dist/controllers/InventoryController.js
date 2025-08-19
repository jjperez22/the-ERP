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
exports.InventoryController = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../services/DatabaseService");
const AIService_1 = require("../services/AIService");
const NotificationService_1 = require("../services/NotificationService");
let InventoryController = class InventoryController {
    databaseService;
    aiService;
    notificationService;
    constructor(databaseService, aiService, notificationService) {
        this.databaseService = databaseService;
        this.aiService = aiService;
        this.notificationService = notificationService;
    }
    async getAllInventory(query) {
        try {
            const { category, location, status, lowStockOnly, page = 1, limit = 50, sortBy = 'productName', sortOrder = 'asc' } = query;
            let filters = {};
            if (category)
                filters.category = category;
            if (location)
                filters.location = location;
            if (status)
                filters.status = status;
            if (lowStockOnly === 'true') {
                filters.quantity = { $lte: { $ref: 'minimumStock' } };
            }
            const skip = (page - 1) * limit;
            const inventory = await this.databaseService.find('inventory', filters, {
                skip,
                limit: parseInt(limit),
                sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
            });
            const total = await this.databaseService.count('inventory', filters);
            const insights = await this.aiService.generateInventoryInsights(inventory);
            return {
                success: true,
                data: inventory,
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
    async getInventoryById(id) {
        try {
            const inventory = await this.databaseService.findById('inventory', id);
            if (!inventory) {
                return { success: false, error: 'Inventory item not found' };
            }
            const movements = await this.databaseService.find('stock_movements', { inventoryId: id }, { sort: { timestamp: -1 }, limit: 20 });
            const recommendations = await this.aiService.getInventoryRecommendations(inventory);
            return {
                success: true,
                data: {
                    ...inventory,
                    movements,
                    recommendations
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async createInventoryItem(inventoryData) {
        try {
            const requiredFields = ['productId', 'productName', 'category', 'quantity', 'unit', 'location'];
            for (const field of requiredFields) {
                if (!inventoryData[field]) {
                    return { success: false, error: `${field} is required` };
                }
            }
            const newInventory = {
                id: this.generateId(),
                minimumStock: 10,
                maximumStock: 1000,
                unitCost: 0,
                supplier: '',
                lastUpdated: new Date(),
                status: 'in_stock',
                ...inventoryData
            };
            newInventory.status = this.determineStockStatus(newInventory);
            const saved = await this.databaseService.create('inventory', newInventory);
            await this.createStockMovement({
                inventoryId: saved.id,
                type: 'in',
                quantity: newInventory.quantity,
                reason: 'Initial stock',
                reference: 'INITIAL',
                timestamp: new Date(),
                userId: 'system'
            });
            if (newInventory.status === 'low_stock') {
                await this.notificationService.send({
                    type: 'low_stock_alert',
                    title: 'Low Stock Alert',
                    message: `${newInventory.productName} is below minimum stock level`,
                    data: newInventory
                });
            }
            return { success: true, data: saved };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async updateInventoryItem(id, updateData) {
        try {
            const existing = await this.databaseService.findById('inventory', id);
            if (!existing) {
                return { success: false, error: 'Inventory item not found' };
            }
            const updated = {
                ...existing,
                ...updateData,
                lastUpdated: new Date()
            };
            updated.status = this.determineStockStatus(updated);
            const saved = await this.databaseService.update('inventory', id, updated);
            await this.checkStockAlerts(saved);
            return { success: true, data: saved };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async deleteInventoryItem(id) {
        try {
            const existing = await this.databaseService.findById('inventory', id);
            if (!existing) {
                return { success: false, error: 'Inventory item not found' };
            }
            await this.databaseService.delete('inventory', id);
            await this.databaseService.deleteMany('stock_movements', { inventoryId: id });
            return { success: true, message: 'Inventory item deleted successfully' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async adjustInventory(id, adjustment) {
        try {
            const inventory = await this.databaseService.findById('inventory', id);
            if (!inventory) {
                return { success: false, error: 'Inventory item not found' };
            }
            const oldQuantity = inventory.quantity;
            const quantityDifference = adjustment.newQuantity - oldQuantity;
            const updated = await this.databaseService.update('inventory', id, {
                quantity: adjustment.newQuantity,
                lastUpdated: new Date(),
                status: this.determineStockStatus({
                    ...inventory,
                    quantity: adjustment.newQuantity
                })
            });
            await this.createStockMovement({
                inventoryId: id,
                type: 'adjustment',
                quantity: Math.abs(quantityDifference),
                reason: adjustment.reason,
                reference: `ADJ-${Date.now()}`,
                timestamp: new Date(),
                userId: 'system'
            });
            await this.checkStockAlerts(updated);
            return {
                success: true,
                data: updated,
                message: `Inventory adjusted from ${oldQuantity} to ${adjustment.newQuantity}`
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async bulkUpdateInventory(updates) {
        try {
            const results = [];
            for (const update of updates) {
                try {
                    const result = await this.adjustInventory(update.id, {
                        inventoryId: update.id,
                        newQuantity: update.quantity,
                        reason: update.reason
                    });
                    results.push({ id: update.id, ...result });
                }
                catch (error) {
                    results.push({ id: update.id, success: false, error: error.message });
                }
            }
            return { success: true, results };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getStockLevelAnalytics() {
        try {
            const inventory = await this.databaseService.find('inventory', {});
            const analytics = {
                total_items: inventory.length,
                in_stock: inventory.filter(item => item.status === 'in_stock').length,
                low_stock: inventory.filter(item => item.status === 'low_stock').length,
                out_of_stock: inventory.filter(item => item.status === 'out_of_stock').length,
                expired: inventory.filter(item => item.status === 'expired').length,
                total_value: inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
                categories: this.groupByCategory(inventory),
                locations: this.groupByLocation(inventory)
            };
            const aiInsights = await this.aiService.generateInventoryAnalytics(analytics);
            return { success: true, data: { ...analytics, aiInsights } };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getStockMovements(inventoryId, query) {
        try {
            const { page = 1, limit = 20 } = query;
            const skip = (page - 1) * limit;
            const movements = await this.databaseService.find('stock_movements', { inventoryId }, {
                skip,
                limit: parseInt(limit),
                sort: { timestamp: -1 }
            });
            const total = await this.databaseService.count('stock_movements', { inventoryId });
            return {
                success: true,
                data: movements,
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
    determineStockStatus(inventory) {
        if (inventory.expirationDate && new Date() > inventory.expirationDate) {
            return 'expired';
        }
        if (inventory.quantity <= 0) {
            return 'out_of_stock';
        }
        if (inventory.quantity <= inventory.minimumStock) {
            return 'low_stock';
        }
        return 'in_stock';
    }
    async createStockMovement(movement) {
        const stockMovement = {
            id: this.generateId(),
            ...movement
        };
        return await this.databaseService.create('stock_movements', stockMovement);
    }
    async checkStockAlerts(inventory) {
        if (inventory.status === 'low_stock' || inventory.status === 'out_of_stock') {
            await this.notificationService.send({
                type: `${inventory.status}_alert`,
                title: `${inventory.status === 'low_stock' ? 'Low' : 'Out of'} Stock Alert`,
                message: `${inventory.productName} ${inventory.status === 'low_stock' ? 'is below minimum stock level' : 'is out of stock'}`,
                data: inventory,
                priority: inventory.status === 'out_of_stock' ? 'high' : 'medium'
            });
        }
    }
    groupByCategory(inventory) {
        return inventory.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = { count: 0, value: 0 };
            }
            acc[item.category].count++;
            acc[item.category].value += item.quantity * item.unitCost;
            return acc;
        }, {});
    }
    groupByLocation(inventory) {
        return inventory.reduce((acc, item) => {
            if (!acc[item.location]) {
                acc[item.location] = { count: 0, value: 0 };
            }
            acc[item.location].count++;
            acc[item.location].value += item.quantity * item.unitCost;
            return acc;
        }, {});
    }
    generateId() {
        return 'inv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, warp_1.Get)('/'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getAllInventory", null);
__decorate([
    (0, warp_1.Get)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventoryById", null);
__decorate([
    (0, warp_1.Post)('/'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createInventoryItem", null);
__decorate([
    (0, warp_1.Put)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateInventoryItem", null);
__decorate([
    (0, warp_1.Delete)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deleteInventoryItem", null);
__decorate([
    (0, warp_1.Post)('/:id/adjust'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "adjustInventory", null);
__decorate([
    (0, warp_1.Post)('/bulk-update'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "bulkUpdateInventory", null);
__decorate([
    (0, warp_1.Get)('/analytics/stock-levels'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStockLevelAnalytics", null);
__decorate([
    (0, warp_1.Get)('/movements/:inventoryId'),
    __param(0, (0, warp_1.Param)('inventoryId')),
    __param(1, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStockMovements", null);
exports.InventoryController = InventoryController = __decorate([
    (0, warp_1.Injectable)(),
    (0, warp_1.Controller)('/api/inventory'),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        AIService_1.AIService,
        NotificationService_1.NotificationService])
], InventoryController);
//# sourceMappingURL=InventoryController.js.map
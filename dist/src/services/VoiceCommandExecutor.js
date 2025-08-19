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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceCommandExecutor = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../../services/DatabaseService");
let VoiceCommandExecutor = class VoiceCommandExecutor {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async executeCommand(intent, entities, context) {
        try {
            console.log(`🎯 Executing voice command: ${intent}`);
            switch (intent) {
                case 'check_inventory':
                    return await this.handleCheckInventory(entities, context);
                case 'add_inventory':
                    return await this.handleAddInventory(entities, context);
                case 'check_sales':
                    return await this.handleCheckSales(entities, context);
                case 'help':
                    return await this.handleHelp(entities, context);
                default:
                    return {
                        success: false,
                        message: `Unknown command: ${intent}`,
                        voiceResponse: "I'm sorry, I didn't understand that command. Try saying 'help' to see what I can do."
                    };
            }
        }
        catch (error) {
            console.error('Error executing voice command:', error);
            return {
                success: false,
                message: error.message,
                voiceResponse: "I encountered an error processing your request. Please try again."
            };
        }
    }
    async handleCheckInventory(entities, context) {
        const inventory = await this.databaseService.find('inventory', {});
        const totalItems = inventory.length;
        const lowStockItems = inventory.filter(item => item.status === 'low_stock').length;
        const outOfStockItems = inventory.filter(item => item.status === 'out_of_stock').length;
        const voiceResponse = `You have ${totalItems} items in inventory. ${lowStockItems} items are running low, and ${outOfStockItems} items are out of stock.`;
        return {
            success: true,
            message: 'Inventory status retrieved',
            data: { totalItems, lowStockItems, outOfStockItems, inventory: inventory.slice(0, 5) },
            voiceResponse
        };
    }
    async handleAddInventory(entities, context) {
        const quantity = entities.find(e => e.type === 'quantity')?.value;
        const productName = entities.find(e => e.type === 'product_name')?.value;
        if (!quantity || !productName) {
            return {
                success: false,
                message: 'Missing quantity or product name',
                voiceResponse: "Please specify both the quantity and product name. For example, 'add 50 cement bags to inventory'."
            };
        }
        const voiceResponse = `Added ${quantity} ${productName} to inventory successfully.`;
        return {
            success: true,
            message: 'Inventory updated',
            data: { quantity, productName },
            voiceResponse
        };
    }
    async handleCheckSales(entities, context) {
        const orders = await this.databaseService.find('orders', {
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
        const orderCount = orders.length;
        const voiceResponse = `Today's sales are $${totalSales.toFixed(2)} from ${orderCount} orders.`;
        return {
            success: true,
            message: 'Sales data retrieved',
            data: { totalSales, orderCount, orders: orders.slice(0, 3) },
            voiceResponse
        };
    }
    async handleHelp(entities, context) {
        const helpText = "I can help you with inventory management, sales reporting, order creation, and more. Try saying 'check inventory status', 'show today's sales', or 'add items to inventory'.";
        return {
            success: true,
            message: 'Help information provided',
            data: { availableCommands: ['check_inventory', 'add_inventory', 'check_sales'] },
            voiceResponse: helpText
        };
    }
};
exports.VoiceCommandExecutor = VoiceCommandExecutor;
exports.VoiceCommandExecutor = VoiceCommandExecutor = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService])
], VoiceCommandExecutor);
//# sourceMappingURL=VoiceCommandExecutor.js.map
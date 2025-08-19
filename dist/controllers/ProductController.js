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
exports.ProductController = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../services/DatabaseService");
const AIService_1 = require("../services/AIService");
let ProductController = class ProductController {
    database;
    ai;
    constructor(database, ai) {
        this.database = database;
        this.ai = ai;
    }
    async getAllProducts(filters) {
        const products = await this.database.products.findMany({
            where: filters,
            include: {
                category: true,
                supplier: true,
                inventory: true
            }
        });
        return products;
    }
    async getProduct(id) {
        const product = await this.database.products.findUnique({
            where: { id },
            include: {
                category: true,
                supplier: true,
                inventory: true,
                demandForecast: true
            }
        });
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }
    async createProduct(productData) {
        if (!productData.sku) {
            productData.sku = await this.ai.generateSKU(productData);
        }
        if (!productData.sellingPrice) {
            productData.sellingPrice = await this.ai.suggestPrice(productData);
        }
        const product = await this.database.products.create({
            data: productData
        });
        return product;
    }
    async updateProduct(id, updateData) {
        const product = await this.database.products.update({
            where: { id },
            data: updateData
        });
        return product;
    }
    async deleteProduct(id) {
        await this.database.products.delete({
            where: { id }
        });
        return { success: true };
    }
    async getDemandForecast(id) {
        const forecast = await this.ai.generateDemandForecast(id);
        return forecast;
    }
    async getCategories() {
        return await this.database.categories.findMany({
            include: {
                attributes: true,
                children: true
            }
        });
    }
    async bulkImport(products) {
        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };
        for (const productData of products) {
            try {
                await this.createProduct(productData);
                results.successful++;
            }
            catch (error) {
                results.failed++;
                results.errors.push({ product: productData, error: error.message });
            }
        }
        return results;
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, warp_1.Get)('/'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getAllProducts", null);
__decorate([
    (0, warp_1.Get)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getProduct", null);
__decorate([
    (0, warp_1.Post)('/'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "createProduct", null);
__decorate([
    (0, warp_1.Put)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __param(1, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updateProduct", null);
__decorate([
    (0, warp_1.Delete)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "deleteProduct", null);
__decorate([
    (0, warp_1.Get)('/:id/demand-forecast'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getDemandForecast", null);
__decorate([
    (0, warp_1.Get)('/categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getCategories", null);
__decorate([
    (0, warp_1.Post)('/bulk-import'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "bulkImport", null);
exports.ProductController = ProductController = __decorate([
    (0, warp_1.Controller)('/api/products'),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        AIService_1.AIService])
], ProductController);
//# sourceMappingURL=ProductController.js.map
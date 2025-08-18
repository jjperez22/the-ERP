
// controllers/ProductController.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@varld/warp';
import { Product, ProductCategory } from '../models/DataModels';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';

@Controller('/api/products')
export class ProductController {
  constructor(
    private database: DatabaseService,
    private ai: AIService
  ) {}

  @Get('/')
  async getAllProducts(@Query() filters?: any): Promise<Product[]> {
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

  @Get('/:id')
  async getProduct(@Param('id') id: string): Promise<Product> {
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

  @Post('/')
  async createProduct(@Body() productData: Partial<Product>): Promise<Product> {
    // AI-powered SKU generation
    if (!productData.sku) {
      productData.sku = await this.ai.generateSKU(productData);
    }

    // AI pricing suggestions
    if (!productData.sellingPrice) {
      productData.sellingPrice = await this.ai.suggestPrice(productData);
    }

    const product = await this.database.products.create({
      data: productData
    });

    return product;
  }

  @Put('/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateData: Partial<Product>
  ): Promise<Product> {
    const product = await this.database.products.update({
      where: { id },
      data: updateData
    });

    return product;
  }

  @Delete('/:id')
  async deleteProduct(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.database.products.delete({
      where: { id }
    });

    return { success: true };
  }

  @Get('/:id/demand-forecast')
  async getDemandForecast(@Param('id') id: string): Promise<any> {
    const forecast = await this.ai.generateDemandForecast(id);
    return forecast;
  }

  @Get('/categories')
  async getCategories(): Promise<ProductCategory[]> {
    return await this.database.categories.findMany({
      include: {
        attributes: true,
        children: true
      }
    });
  }

  @Post('/bulk-import')
  async bulkImport(@Body() products: Partial<Product>[]): Promise<{ 
    successful: number;
    failed: number;
    errors: any[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const productData of products) {
      try {
        await this.createProduct(productData);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({ product: productData, error: error.message });
      }
    }

    return results;
  }
}

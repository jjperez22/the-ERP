// controllers/InventoryController.ts
import { Controller, Get, Post, Put, Delete, Injectable, Body, Param, Query } from '@varld/warp';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  unitCost: number;
  location: string;
  supplier: string;
  lastUpdated: Date;
  expirationDate?: Date;
  batchNumber?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

interface StockMovement {
  id: string;
  inventoryId: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  reason: string;
  reference: string;
  timestamp: Date;
  userId: string;
}

interface InventoryAdjustment {
  inventoryId: string;
  newQuantity: number;
  reason: string;
  notes?: string;
}

@Injectable()
@Controller('/api/inventory')
export class InventoryController {
  constructor(
    private databaseService: DatabaseService,
    private aiService: AIService,
    private notificationService: NotificationService
  ) {}

  @Get('/')
  async getAllInventory(@Query() query: any) {
    try {
      const { 
        category,
        location,
        status,
        lowStockOnly,
        page = 1,
        limit = 50,
        sortBy = 'productName',
        sortOrder = 'asc'
      } = query;

      let filters: any = {};
      
      if (category) filters.category = category;
      if (location) filters.location = location;
      if (status) filters.status = status;
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

      // Get AI insights for inventory optimization
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/:id')
  async getInventoryById(@Param('id') id: string) {
    try {
      const inventory = await this.databaseService.findById('inventory', id);
      if (!inventory) {
        return { success: false, error: 'Inventory item not found' };
      }

      // Get stock movement history
      const movements = await this.databaseService.find('stock_movements', 
        { inventoryId: id },
        { sort: { timestamp: -1 }, limit: 20 }
      );

      // Get AI recommendations for this item
      const recommendations = await this.aiService.getInventoryRecommendations(inventory);

      return {
        success: true,
        data: {
          ...inventory,
          movements,
          recommendations
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/')
  async createInventoryItem(@Body() inventoryData: Partial<InventoryItem>) {
    try {
      // Validate required fields
      const requiredFields = ['productId', 'productName', 'category', 'quantity', 'unit', 'location'];
      for (const field of requiredFields) {
        if (!inventoryData[field]) {
          return { success: false, error: `${field} is required` };
        }
      }

      // Set default values
      const newInventory: InventoryItem = {
        id: this.generateId(),
        minimumStock: 10,
        maximumStock: 1000,
        unitCost: 0,
        supplier: '',
        lastUpdated: new Date(),
        status: 'in_stock',
        ...inventoryData
      } as InventoryItem;

      // Determine stock status
      newInventory.status = this.determineStockStatus(newInventory);

      const saved = await this.databaseService.create('inventory', newInventory);

      // Create initial stock movement record
      await this.createStockMovement({
        inventoryId: saved.id,
        type: 'in',
        quantity: newInventory.quantity,
        reason: 'Initial stock',
        reference: 'INITIAL',
        timestamp: new Date(),
        userId: 'system'
      });

      // Send notification if low stock
      if (newInventory.status === 'low_stock') {
        await this.notificationService.send({
          type: 'low_stock_alert',
          title: 'Low Stock Alert',
          message: `${newInventory.productName} is below minimum stock level`,
          data: newInventory
        });
      }

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Put('/:id')
  async updateInventoryItem(@Param('id') id: string, @Body() updateData: Partial<InventoryItem>) {
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

      // Update stock status
      updated.status = this.determineStockStatus(updated);

      const saved = await this.databaseService.update('inventory', id, updated);

      // Check for stock level alerts
      await this.checkStockAlerts(saved);

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Delete('/:id')
  async deleteInventoryItem(@Param('id') id: string) {
    try {
      const existing = await this.databaseService.findById('inventory', id);
      if (!existing) {
        return { success: false, error: 'Inventory item not found' };
      }

      await this.databaseService.delete('inventory', id);
      
      // Also delete related stock movements
      await this.databaseService.deleteMany('stock_movements', { inventoryId: id });

      return { success: true, message: 'Inventory item deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/:id/adjust')
  async adjustInventory(@Param('id') id: string, @Body() adjustment: InventoryAdjustment) {
    try {
      const inventory = await this.databaseService.findById('inventory', id);
      if (!inventory) {
        return { success: false, error: 'Inventory item not found' };
      }

      const oldQuantity = inventory.quantity;
      const quantityDifference = adjustment.newQuantity - oldQuantity;

      // Update inventory quantity
      const updated = await this.databaseService.update('inventory', id, {
        quantity: adjustment.newQuantity,
        lastUpdated: new Date(),
        status: this.determineStockStatus({
          ...inventory,
          quantity: adjustment.newQuantity
        })
      });

      // Create stock movement record
      await this.createStockMovement({
        inventoryId: id,
        type: 'adjustment',
        quantity: Math.abs(quantityDifference),
        reason: adjustment.reason,
        reference: `ADJ-${Date.now()}`,
        timestamp: new Date(),
        userId: 'system' // Should come from auth context
      });

      // Check for alerts
      await this.checkStockAlerts(updated);

      return { 
        success: true, 
        data: updated,
        message: `Inventory adjusted from ${oldQuantity} to ${adjustment.newQuantity}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/bulk-update')
  async bulkUpdateInventory(@Body() updates: Array<{id: string, quantity: number, reason: string}>) {
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
        } catch (error) {
          results.push({ id: update.id, success: false, error: error.message });
        }
      }

      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/analytics/stock-levels')
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

      // Get AI insights for inventory optimization
      const aiInsights = await this.aiService.generateInventoryAnalytics(analytics);

      return { success: true, data: { ...analytics, aiInsights } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/movements/:inventoryId')
  async getStockMovements(@Param('inventoryId') inventoryId: string, @Query() query: any) {
    try {
      const { page = 1, limit = 20 } = query;
      const skip = (page - 1) * limit;

      const movements = await this.databaseService.find('stock_movements',
        { inventoryId },
        { 
          skip,
          limit: parseInt(limit),
          sort: { timestamp: -1 }
        }
      );

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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private determineStockStatus(inventory: InventoryItem): string {
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

  private async createStockMovement(movement: Omit<StockMovement, 'id'>) {
    const stockMovement: StockMovement = {
      id: this.generateId(),
      ...movement
    };
    return await this.databaseService.create('stock_movements', stockMovement);
  }

  private async checkStockAlerts(inventory: InventoryItem) {
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

  private groupByCategory(inventory: InventoryItem[]) {
    return inventory.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, value: 0 };
      }
      acc[item.category].count++;
      acc[item.category].value += item.quantity * item.unitCost;
      return acc;
    }, {} as Record<string, {count: number, value: number}>);
  }

  private groupByLocation(inventory: InventoryItem[]) {
    return inventory.reduce((acc, item) => {
      if (!acc[item.location]) {
        acc[item.location] = { count: 0, value: 0 };
      }
      acc[item.location].count++;
      acc[item.location].value += item.quantity * item.unitCost;
      return acc;
    }, {} as Record<string, {count: number, value: number}>);
  }

  private generateId(): string {
    return 'inv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

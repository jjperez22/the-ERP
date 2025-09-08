// services/InventoryService.ts
// Enhanced inventory management service with comprehensive edit capabilities

import { z } from 'zod';

// Validation schemas for inventory operations
export const InventoryItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().min(0, 'Cost must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  reservedStock: z.number().int().min(0, 'Reserved stock cannot be negative').default(0),
  reorderPoint: z.number().int().min(0, 'Reorder point must be positive'),
  reorderQuantity: z.number().int().min(0, 'Reorder quantity must be positive').default(0),
  maxStock: z.number().int().min(0, 'Max stock must be positive').optional(),
  minStock: z.number().int().min(0, 'Min stock must be positive').optional(),
  unit: z.string().default('pcs'),
  weight: z.number().min(0, 'Weight cannot be negative').optional(),
  dimensions: z.string().optional(),
  location: z.string().optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().default(true),
  isTracked: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier is required'),
  customFields: z.record(z.any()).optional(),
  images: z.array(z.string().url()).default([]),
  documents: z.array(z.string().url()).default([])
});

export const InventoryUpdateSchema = InventoryItemSchema.partial().omit({ sku: true });

export const StockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(-999999, 'Invalid quantity'),
  reason: z.string().min(1, 'Reason is required'),
  type: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN'])
});

export type InventoryItem = z.infer<typeof InventoryItemSchema> & {
  availableStock?: number; // Computed field: stock - reservedStock
};
export type InventoryUpdate = z.infer<typeof InventoryUpdateSchema>;
export type StockAdjustment = z.infer<typeof StockAdjustmentSchema>;

export interface InventoryFilter {
  category?: string;
  subcategory?: string;
  brand?: string;
  isActive?: boolean;
  isTracked?: boolean;
  lowStock?: boolean;
  outOfStock?: boolean;
  location?: string;
  supplierId?: string;
  tags?: string[];
  search?: string;
}

export interface InventorySearchResult {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class InventoryService {
  // Mock data storage - in production this would use Prisma/database
  private items: Map<string, InventoryItem> = new Map();
  private transactions: Array<{ id: string; productId: string; type: string; quantity: number; reason: string; createdAt: Date; createdBy: string }> = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockItems: InventoryItem[] = [
      {
        sku: 'STL-001',
        name: 'Premium Steel Beam',
        description: 'High-quality structural steel beam for construction',
        category: 'Steel',
        subcategory: 'Beams',
        brand: 'SteelPro',
        model: 'SP-200x100',
        price: 299.99,
        cost: 220.00,
        stock: 45,
        reservedStock: 5,
        reorderPoint: 10,
        reorderQuantity: 20,
        maxStock: 100,
        minStock: 5,
        unit: 'pcs',
        weight: 25.5,
        dimensions: '200x100x3000mm',
        location: 'Warehouse A-1',
        barcode: '1234567890123',
        isActive: true,
        isTracked: true,
        tags: ['steel', 'structural', 'beam'],
        notes: 'Store in dry conditions',
        supplierId: 'SUP-001',
        customFields: {
          fireRating: 'R60',
          loadCapacity: '2000kg'
        },
        images: [],
        documents: []
      },
      {
        sku: 'CEM-001',
        name: 'Portland Cement',
        description: 'Type I Portland cement for general construction',
        category: 'Cement',
        subcategory: 'Portland',
        brand: 'CementCorp',
        model: 'PC-42.5',
        price: 12.50,
        cost: 8.75,
        stock: 200,
        reservedStock: 20,
        reorderPoint: 50,
        reorderQuantity: 100,
        maxStock: 500,
        minStock: 25,
        unit: 'bags',
        weight: 50.0,
        dimensions: '400x600x120mm',
        location: 'Warehouse B-2',
        barcode: '2345678901234',
        isActive: true,
        isTracked: true,
        tags: ['cement', 'portland', 'construction'],
        notes: 'Keep away from moisture',
        supplierId: 'SUP-002',
        customFields: {
          compressiveStrength: '42.5MPa',
          settingTime: '45min'
        },
        images: [],
        documents: []
      }
    ];

    mockItems.forEach((item, index) => {
      const id = `item-${index + 1}`;
      this.items.set(id, { ...item });
    });
  }

  // Get all inventory items with filtering and pagination
  async getInventoryItems(filter: InventoryFilter = {}, page: number = 1, limit: number = 10): Promise<InventorySearchResult> {
    let filteredItems = Array.from(this.items.values());

    // Apply filters
    if (filter.category) {
      filteredItems = filteredItems.filter(item => 
        item.category.toLowerCase().includes(filter.category!.toLowerCase())
      );
    }

    if (filter.subcategory) {
      filteredItems = filteredItems.filter(item => 
        item.subcategory?.toLowerCase().includes(filter.subcategory!.toLowerCase())
      );
    }

    if (filter.brand) {
      filteredItems = filteredItems.filter(item => 
        item.brand?.toLowerCase().includes(filter.brand!.toLowerCase())
      );
    }

    if (filter.isActive !== undefined) {
      filteredItems = filteredItems.filter(item => item.isActive === filter.isActive);
    }

    if (filter.isTracked !== undefined) {
      filteredItems = filteredItems.filter(item => item.isTracked === filter.isTracked);
    }

    if (filter.lowStock) {
      filteredItems = filteredItems.filter(item => 
        item.stock <= item.reorderPoint
      );
    }

    if (filter.outOfStock) {
      filteredItems = filteredItems.filter(item => item.stock === 0);
    }

    if (filter.location) {
      filteredItems = filteredItems.filter(item => 
        item.location?.toLowerCase().includes(filter.location!.toLowerCase())
      );
    }

    if (filter.supplierId) {
      filteredItems = filteredItems.filter(item => item.supplierId === filter.supplierId);
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredItems = filteredItems.filter(item => 
        filter.tags!.some(tag => item.tags.includes(tag))
      );
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.sku.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.brand?.toLowerCase().includes(searchTerm)
      );
    }

    // Calculate available stock
    filteredItems = filteredItems.map(item => ({
      ...item,
      availableStock: item.stock - item.reservedStock
    }));

    // Apply pagination
    const total = filteredItems.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get single inventory item by ID
  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    const item = this.items.get(id);
    if (!item) return null;

    return {
      ...item,
      availableStock: item.stock - item.reservedStock
    };
  }

  // Get inventory item by SKU
  async getInventoryItemBySku(sku: string): Promise<InventoryItem | null> {
    const item = Array.from(this.items.values()).find(item => item.sku === sku);
    if (!item) return null;

    return {
      ...item,
      availableStock: item.stock - item.reservedStock
    };
  }

  // Validate inventory item data
  private validateInventoryItem(data: any): InventoryItem {
    try {
      return InventoryItemSchema.parse(data);
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }
  }

  // Validate inventory update data
  private validateInventoryUpdate(data: any): InventoryUpdate {
    try {
      return InventoryUpdateSchema.parse(data);
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }
  }

  // Business rule validations
  private async validateBusinessRules(data: InventoryItem | InventoryUpdate, isUpdate: boolean = false): Promise<void> {
    // Check SKU uniqueness for new items
    if (!isUpdate && 'sku' in data) {
      const existing = await this.getInventoryItemBySku(data.sku);
      if (existing) {
        throw new Error(`SKU '${data.sku}' already exists`);
      }
    }

    // Validate stock levels
    if ('stock' in data && 'minStock' in data && data.minStock && data.stock !== undefined && data.stock < data.minStock) {
      throw new Error('Stock cannot be below minimum stock level');
    }

    if ('stock' in data && 'maxStock' in data && data.maxStock && data.stock !== undefined && data.stock > data.maxStock) {
      throw new Error('Stock cannot exceed maximum stock level');
    }

    // Validate price vs cost
    if ('price' in data && 'cost' in data && data.price !== undefined && data.cost !== undefined && data.price < data.cost) {
      console.warn('Warning: Price is lower than cost');
    }

    // Validate reorder logic
    if ('reorderPoint' in data && 'minStock' in data && data.minStock && data.reorderPoint !== undefined && data.reorderPoint < data.minStock) {
      throw new Error('Reorder point should not be below minimum stock level');
    }
  }

  // Create new inventory item
  async createInventoryItem(data: any, createdBy: string = 'system'): Promise<{ id: string; item: InventoryItem }> {
    const validatedData = this.validateInventoryItem(data);
    await this.validateBusinessRules(validatedData);

    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const item: InventoryItem = {
      ...validatedData,
      availableStock: validatedData.stock - validatedData.reservedStock
    };

    this.items.set(id, item);

    // Log creation transaction
    this.transactions.push({
      id: `txn-${Date.now()}`,
      productId: id,
      type: 'ADJUSTMENT',
      quantity: validatedData.stock,
      reason: 'Initial stock creation',
      createdAt: new Date(),
      createdBy
    });

    return { id, item };
  }

  // Update inventory item
  async updateInventoryItem(id: string, data: any, updatedBy: string = 'system'): Promise<InventoryItem> {
    const existingItem = this.items.get(id);
    if (!existingItem) {
      throw new Error('Inventory item not found');
    }

    const validatedData = this.validateInventoryUpdate(data);
    await this.validateBusinessRules(validatedData, true);

    const updatedItem: InventoryItem = {
      ...existingItem,
      ...validatedData,
      availableStock: (validatedData.stock ?? existingItem.stock) - (validatedData.reservedStock ?? existingItem.reservedStock)
    };

    this.items.set(id, updatedItem);

    // Log stock adjustment if stock changed
    if (validatedData.stock !== undefined && validatedData.stock !== existingItem.stock) {
      const quantityChange = validatedData.stock - existingItem.stock;
      this.transactions.push({
        id: `txn-${Date.now()}`,
        productId: id,
        type: 'ADJUSTMENT',
        quantity: quantityChange,
        reason: 'Stock adjustment via update',
        createdAt: new Date(),
        createdBy: updatedBy
      });
    }

    return updatedItem;
  }

  // Adjust stock levels
  async adjustStock(adjustment: StockAdjustment, createdBy: string = 'system'): Promise<InventoryItem> {
    const validatedAdjustment = StockAdjustmentSchema.parse(adjustment);
    
    const existingItem = this.items.get(validatedAdjustment.productId);
    if (!existingItem) {
      throw new Error('Inventory item not found');
    }

    const newStock = existingItem.stock + validatedAdjustment.quantity;
    
    if (newStock < 0) {
      throw new Error('Insufficient stock for this adjustment');
    }

    const updatedItem: InventoryItem = {
      ...existingItem,
      stock: newStock,
      availableStock: newStock - existingItem.reservedStock
    };

    this.items.set(validatedAdjustment.productId, updatedItem);

    // Log transaction
    this.transactions.push({
      id: `txn-${Date.now()}`,
      productId: validatedAdjustment.productId,
      type: validatedAdjustment.type,
      quantity: validatedAdjustment.quantity,
      reason: validatedAdjustment.reason,
      createdAt: new Date(),
      createdBy
    });

    return updatedItem;
  }

  // Reserve stock
  async reserveStock(productId: string, quantity: number, reason: string = 'Stock reservation'): Promise<InventoryItem> {
    const item = this.items.get(productId);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    const currentAvailableStock = item.stock - item.reservedStock;
    if (currentAvailableStock < quantity) {
      throw new Error('Insufficient available stock');
    }

    const updatedItem: InventoryItem = {
      ...item,
      reservedStock: item.reservedStock + quantity,
      availableStock: currentAvailableStock - quantity
    };

    this.items.set(productId, updatedItem);
    return updatedItem;
  }

  // Release reserved stock
  async releaseStock(productId: string, quantity: number, reason: string = 'Stock release'): Promise<InventoryItem> {
    const item = this.items.get(productId);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    if (item.reservedStock < quantity) {
      throw new Error('Cannot release more stock than reserved');
    }

    const updatedItem: InventoryItem = {
      ...item,
      reservedStock: item.reservedStock - quantity,
      availableStock: item.stock - (item.reservedStock - quantity)
    };

    this.items.set(productId, updatedItem);
    return updatedItem;
  }

  // Get inventory transactions for an item
  async getInventoryTransactions(productId: string, limit: number = 50): Promise<any[]> {
    return this.transactions
      .filter(txn => txn.productId === productId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Get low stock items
  async getLowStockItems(): Promise<InventoryItem[]> {
    const result = await this.getInventoryItems({ lowStock: true }, 1, 1000);
    return result.items;
  }

  // Get out of stock items
  async getOutOfStockItems(): Promise<InventoryItem[]> {
    const result = await this.getInventoryItems({ outOfStock: true }, 1, 1000);
    return result.items;
  }

  // Delete inventory item (soft delete by setting inactive)
  async deleteInventoryItem(id: string, deletedBy: string = 'system'): Promise<boolean> {
    const item = this.items.get(id);
    if (!item) {
      return false;
    }

    // Soft delete - mark as inactive
    const updatedItem: InventoryItem = {
      ...item,
      isActive: false
    };

    this.items.set(id, updatedItem);

    // Log deletion
    this.transactions.push({
      id: `txn-${Date.now()}`,
      productId: id,
      type: 'ADJUSTMENT',
      quantity: 0,
      reason: 'Item deactivated/deleted',
      createdAt: new Date(),
      createdBy: deletedBy
    });

    return true;
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();

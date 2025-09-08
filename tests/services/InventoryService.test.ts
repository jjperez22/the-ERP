// tests/services/InventoryService.test.ts
// Basic tests for inventory service functionality

import { InventoryService } from '../../services/InventoryService';

describe('InventoryService', () => {
  let inventoryService: InventoryService;

  beforeEach(() => {
    inventoryService = new InventoryService();
  });

  describe('getInventoryItems', () => {
    test('should return paginated inventory items', async () => {
      const result = await inventoryService.getInventoryItems({}, 1, 10);
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(Array.isArray(result.items)).toBe(true);
    });

    test('should filter items by category', async () => {
      const result = await inventoryService.getInventoryItems({ category: 'Steel' });
      
      result.items.forEach(item => {
        expect(item.category.toLowerCase()).toContain('steel');
      });
    });

    test('should filter low stock items', async () => {
      const result = await inventoryService.getInventoryItems({ lowStock: true });
      
      result.items.forEach(item => {
        expect(item.stock).toBeLessThanOrEqual(item.reorderPoint);
      });
    });
  });

  describe('getInventoryItem', () => {
    test('should return item by ID', async () => {
      const item = await inventoryService.getInventoryItem('item-1');
      
      expect(item).not.toBeNull();
      expect(item).toHaveProperty('sku');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('availableStock');
    });

    test('should return null for non-existent item', async () => {
      const item = await inventoryService.getInventoryItem('non-existent');
      
      expect(item).toBeNull();
    });
  });

  describe('createInventoryItem', () => {
    test('should create new inventory item with valid data', async () => {
      const itemData = {
        sku: 'TEST-001',
        name: 'Test Item',
        category: 'Test',
        price: 100,
        cost: 80,
        stock: 50,
        reorderPoint: 10,
        supplierId: 'SUP-001',
        unit: 'pcs',
        isActive: true,
        isTracked: true,
        tags: ['test'],
        reservedStock: 0,
        reorderQuantity: 20
      };

      const result = await inventoryService.createInventoryItem(itemData);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('item');
      expect(result.item.sku).toBe('TEST-001');
      expect(result.item.name).toBe('Test Item');
    });

    test('should throw error for missing required fields', async () => {
      const invalidData = {
        name: 'Test Item'
        // Missing required fields
      };

      await expect(inventoryService.createInventoryItem(invalidData))
        .rejects.toThrow('Validation failed');
    });

    test('should throw error for duplicate SKU', async () => {
      const itemData = {
        sku: 'STL-001', // Existing SKU in mock data
        name: 'Test Item',
        category: 'Test',
        price: 100,
        cost: 80,
        stock: 50,
        reorderPoint: 10,
        supplierId: 'SUP-001',
        unit: 'pcs',
        isActive: true,
        isTracked: true,
        tags: [],
        reservedStock: 0,
        reorderQuantity: 20
      };

      await expect(inventoryService.createInventoryItem(itemData))
        .rejects.toThrow('already exists');
    });
  });

  describe('updateInventoryItem', () => {
    test('should update existing inventory item', async () => {
      const updateData = {
        name: 'Updated Name',
        price: 350.00
      };

      const updatedItem = await inventoryService.updateInventoryItem('item-1', updateData);
      
      expect(updatedItem.name).toBe('Updated Name');
      expect(updatedItem.price).toBe(350.00);
    });

    test('should throw error for non-existent item', async () => {
      const updateData = { name: 'Updated Name' };

      await expect(inventoryService.updateInventoryItem('non-existent', updateData))
        .rejects.toThrow('not found');
    });
  });

  describe('adjustStock', () => {
    test('should adjust stock levels correctly', async () => {
      const adjustment = {
        productId: 'item-1',
        quantity: 10,
        reason: 'Test adjustment',
        type: 'ADJUSTMENT' as const
      };

      const updatedItem = await inventoryService.adjustStock(adjustment);
      
      expect(updatedItem.stock).toBeGreaterThan(0);
      expect(updatedItem.availableStock).toBeDefined();
    });

    test('should prevent negative stock', async () => {
      const adjustment = {
        productId: 'item-1',
        quantity: -1000, // Large negative adjustment
        reason: 'Test negative adjustment',
        type: 'ADJUSTMENT' as const
      };

      await expect(inventoryService.adjustStock(adjustment))
        .rejects.toThrow('Insufficient stock');
    });
  });

  describe('reserveStock', () => {
    test('should reserve available stock', async () => {
      const originalItem = await inventoryService.getInventoryItem('item-1');
      const reserveQuantity = 5;
      
      const updatedItem = await inventoryService.reserveStock('item-1', reserveQuantity, 'Test reservation');
      
      expect(updatedItem.reservedStock).toBe((originalItem?.reservedStock || 0) + reserveQuantity);
      expect(updatedItem.availableStock).toBe(updatedItem.stock - updatedItem.reservedStock);
    });

    test('should prevent over-reservation', async () => {
      await expect(inventoryService.reserveStock('item-1', 1000, 'Over-reserve test'))
        .rejects.toThrow('Insufficient available stock');
    });
  });

  describe('getLowStockItems', () => {
    test('should return items with stock at or below reorder point', async () => {
      const lowStockItems = await inventoryService.getLowStockItems();
      
      lowStockItems.forEach(item => {
        expect(item.stock).toBeLessThanOrEqual(item.reorderPoint);
      });
    });
  });

  describe('getInventoryTransactions', () => {
    test('should return transaction history for item', async () => {
      const transactions = await inventoryService.getInventoryTransactions('item-1');
      
      expect(Array.isArray(transactions)).toBe(true);
      transactions.forEach(transaction => {
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('type');
        expect(transaction).toHaveProperty('quantity');
        expect(transaction).toHaveProperty('reason');
        expect(transaction).toHaveProperty('createdAt');
        expect(transaction).toHaveProperty('createdBy');
      });
    });
  });
});

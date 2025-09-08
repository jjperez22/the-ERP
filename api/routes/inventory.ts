// api/routes/inventory.ts
// Basic inventory API routes with edit capabilities

import express, { Request, Response } from 'express';
import { inventoryService } from '../../services/InventoryService';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/inventory - Get all inventory items with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      subcategory,
      brand,
      isActive,
      isTracked,
      lowStock,
      outOfStock,
      location,
      supplierId,
      search,
      page = '1',
      limit = '10'
    } = req.query;

    const filters = {
      category: category as string,
      subcategory: subcategory as string,
      brand: brand as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isTracked: isTracked === 'true' ? true : isTracked === 'false' ? false : undefined,
      lowStock: lowStock === 'true',
      outOfStock: outOfStock === 'true',
      location: location as string,
      supplierId: supplierId as string,
      search: search as string
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const result = await inventoryService.getInventoryItems(
      filters,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory items',
      code: 'INVENTORY_FETCH_ERROR'
    });
  }
});

// GET /api/inventory/:id - Get single inventory item
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await inventoryService.getInventoryItem(id);

    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Inventory item not found',
        code: 'ITEM_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory item',
      code: 'ITEM_FETCH_ERROR'
    });
  }
});

// POST /api/inventory - Create new inventory item
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await inventoryService.createInventoryItem(
      req.body, 
      req.user?.id || 'unknown'
    );

    res.status(201).json({
      success: true,
      data: result.item,
      id: result.id
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create inventory item',
      code: 'ITEM_CREATE_ERROR'
    });
  }
});

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedItem = await inventoryService.updateInventoryItem(
      id,
      req.body,
      req.user?.id || 'unknown'
    );

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'ITEM_NOT_FOUND'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update inventory item',
      code: 'ITEM_UPDATE_ERROR'
    });
  }
});

// POST /api/inventory/:id/adjust - Adjust stock levels
router.post('/:id/adjust', authenticateToken, requireRole(['admin', 'manager', 'warehouse']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, reason, type = 'ADJUSTMENT' } = req.body;

    if (!quantity || !reason) {
      res.status(400).json({
        success: false,
        error: 'Quantity and reason are required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const adjustment = {
      productId: id,
      quantity: parseFloat(quantity),
      reason,
      type
    };

    const updatedItem = await inventoryService.adjustStock(
      adjustment,
      req.user?.id || 'unknown'
    );

    res.json({
      success: true,
      data: updatedItem,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'ITEM_NOT_FOUND'
      });
      return;
    }
    if (error instanceof Error && error.message.includes('Insufficient')) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'INSUFFICIENT_STOCK'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to adjust stock',
      code: 'STOCK_ADJUSTMENT_ERROR'
    });
  }
});

// GET /api/inventory/:id/transactions - Get transaction history
router.get('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '50' } = req.query;
    
    const transactions = await inventoryService.getInventoryTransactions(
      id,
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction history',
      code: 'TRANSACTIONS_FETCH_ERROR'
    });
  }
});

// POST /api/inventory/:id/reserve - Reserve stock
router.post('/:id/reserve', authenticateToken, requireRole(['admin', 'manager', 'sales']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, reason = 'Stock reservation' } = req.body;

    if (!quantity || quantity <= 0) {
      res.status(400).json({
        success: false,
        error: 'Valid quantity is required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const updatedItem = await inventoryService.reserveStock(id, quantity, reason);

    res.json({
      success: true,
      data: updatedItem,
      message: 'Stock reserved successfully'
    });
  } catch (error) {
    console.error('Error reserving stock:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'ITEM_NOT_FOUND'
      });
      return;
    }
    if (error instanceof Error && error.message.includes('Insufficient')) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'INSUFFICIENT_STOCK'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reserve stock',
      code: 'STOCK_RESERVE_ERROR'
    });
  }
});

// POST /api/inventory/:id/release - Release reserved stock
router.post('/:id/release', authenticateToken, requireRole(['admin', 'manager', 'sales']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, reason = 'Stock release' } = req.body;

    if (!quantity || quantity <= 0) {
      res.status(400).json({
        success: false,
        error: 'Valid quantity is required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const updatedItem = await inventoryService.releaseStock(id, quantity, reason);

    res.json({
      success: true,
      data: updatedItem,
      message: 'Stock released successfully'
    });
  } catch (error) {
    console.error('Error releasing stock:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'ITEM_NOT_FOUND'
      });
      return;
    }
    if (error instanceof Error && error.message.includes('Cannot release')) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'INVALID_RELEASE_QUANTITY'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release stock',
      code: 'STOCK_RELEASE_ERROR'
    });
  }
});

// GET /api/inventory/reports/low-stock - Get low stock report
router.get('/reports/low-stock', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lowStockItems = await inventoryService.getLowStockItems();

    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    console.error('Error fetching low stock report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock report',
      code: 'LOW_STOCK_REPORT_ERROR'
    });
  }
});

export default router;

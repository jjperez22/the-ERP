// api/routes/orders.ts
// Order API routes with comprehensive edit capabilities

import express, { Request, Response } from 'express';
import { orderService } from '../../services/OrderService';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/orders - Get all orders with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      paymentStatus,
      customerId,
      customerName,
      priority,
      salesRepId,
      dateStart,
      dateEnd,
      amountMin,
      amountMax,
      search,
      page = '1',
      limit = '10'
    } = req.query;

    const filters = {
      status: status as string,
      paymentStatus: paymentStatus as string,
      customerId: customerId as string,
      customerName: customerName as string,
      priority: priority as string,
      salesRepId: salesRepId as string,
      dateRange: (dateStart || dateEnd) ? {
        start: dateStart ? new Date(dateStart as string) : undefined,
        end: dateEnd ? new Date(dateEnd as string) : undefined
      } : undefined,
      amountRange: (amountMin || amountMax) ? {
        min: amountMin ? parseFloat(amountMin as string) : undefined,
        max: amountMax ? parseFloat(amountMax as string) : undefined
      } : undefined,
      search: search as string
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const result = await orderService.getOrders(
      filters,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: result.orders,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      code: 'ORDERS_FETCH_ERROR'
    });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrder(id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      code: 'ORDER_FETCH_ERROR'
    });
  }
});

// POST /api/orders - Create new order
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'sales']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await orderService.createOrder(
      req.body,
      req.user?.id || 'unknown'
    );

    res.status(201).json({
      success: true,
      data: result.order,
      id: result.id,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
      code: 'ORDER_CREATE_ERROR'
    });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', authenticateToken, requireRole(['admin', 'manager', 'sales']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedOrder = await orderService.updateOrder(
      id,
      req.body,
      req.user?.id || 'unknown'
    );

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'ORDER_NOT_FOUND'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order',
      code: 'ORDER_UPDATE_ERROR'
    });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', authenticateToken, requireRole(['admin', 'manager', 'warehouse', 'sales']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Status is required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const updatedOrder = await orderService.updateOrderStatus(
      id,
      status,
      req.user?.id || 'unknown'
    );

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'ORDER_NOT_FOUND'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status',
      code: 'ORDER_STATUS_UPDATE_ERROR'
    });
  }
});

// GET /api/orders/customer/:customerId - Get orders by customer
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const orders = await orderService.getOrdersByCustomer(customerId);

    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer orders',
      code: 'CUSTOMER_ORDERS_FETCH_ERROR'
    });
  }
});

// GET /api/orders/number/:orderNumber - Get order by order number
router.get('/number/:orderNumber', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber } = req.params;
    const order = await orderService.getOrderByNumber(orderNumber);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order by number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      code: 'ORDER_FETCH_ERROR'
    });
  }
});

// GET /api/orders/reports/stats - Get order statistics
router.get('/reports/stats', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await orderService.getOrderStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order statistics',
      code: 'ORDER_STATS_ERROR'
    });
  }
});

export default router;

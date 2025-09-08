// api/routes/customers.ts
// Customer API routes with comprehensive edit capabilities

import express, { Request, Response } from 'express';
import { customerService } from '../../services/CustomerService';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/customers - Get all customers with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      customerType,
      isActive,
      city,
      state,
      tags,
      search,
      creditLimitMin,
      creditLimitMax,
      balanceMin,
      balanceMax,
      page = '1',
      limit = '10'
    } = req.query;

    const filters = {
      customerType: customerType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      city: city as string,
      state: state as string,
      tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
      search: search as string,
      creditLimitRange: (creditLimitMin || creditLimitMax) ? {
        min: creditLimitMin ? parseFloat(creditLimitMin as string) : undefined,
        max: creditLimitMax ? parseFloat(creditLimitMax as string) : undefined
      } : undefined,
      balanceRange: (balanceMin || balanceMax) ? {
        min: balanceMin ? parseFloat(balanceMin as string) : undefined,
        max: balanceMax ? parseFloat(balanceMax as string) : undefined
      } : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const result = await customerService.getCustomers(
      filters,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: result.customers,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      code: 'CUSTOMERS_FETCH_ERROR'
    });
  }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomer(id);

    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer',
      code: 'CUSTOMER_FETCH_ERROR'
    });
  }
});

// POST /api/customers - Create new customer
router.post('/', authenticateToken, requireRole(['admin', 'manager', 'sales']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await customerService.createCustomer(req.body);

    res.status(201).json({
      success: true,
      data: result.customer,
      id: result.id,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer',
      code: 'CUSTOMER_CREATE_ERROR'
    });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', authenticateToken, requireRole(['admin', 'manager', 'sales']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedCustomer = await customerService.updateCustomer(id, req.body);

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'CUSTOMER_NOT_FOUND'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update customer',
      code: 'CUSTOMER_UPDATE_ERROR'
    });
  }
});

// POST /api/customers/:id/balance - Update customer balance
router.post('/:id/balance', authenticateToken, requireRole(['admin', 'manager', 'accounting']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, reason = 'Manual balance adjustment' } = req.body;

    if (amount === undefined || typeof amount !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Amount is required and must be a number',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    const updatedCustomer = await customerService.updateBalance(id, amount, reason);

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer balance updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer balance:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'CUSTOMER_NOT_FOUND'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update balance',
      code: 'BALANCE_UPDATE_ERROR'
    });
  }
});

// PUT /api/customers/:id/deactivate - Deactivate customer
router.put('/:id/deactivate', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedCustomer = await customerService.deactivateCustomer(id);

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating customer:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'CUSTOMER_NOT_FOUND'
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate customer',
      code: 'CUSTOMER_DEACTIVATE_ERROR'
    });
  }
});

// GET /api/customers/reports/overdue - Get customers with overdue balances
router.get('/reports/overdue', authenticateToken, requireRole(['admin', 'manager', 'accounting']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const overdueCustomers = await customerService.getOverdueCustomers();

    res.json({
      success: true,
      data: overdueCustomers,
      count: overdueCustomers.length
    });
  } catch (error) {
    console.error('Error fetching overdue customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue customers report',
      code: 'OVERDUE_REPORT_ERROR'
    });
  }
});

// GET /api/customers/reports/stats - Get customer statistics
router.get('/reports/stats', authenticateToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await customerService.getCustomerStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer statistics',
      code: 'CUSTOMER_STATS_ERROR'
    });
  }
});

export default router;

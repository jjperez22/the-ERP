// controllers/PurchaseController.ts
import { Controller, Get, Post, Put, Delete, Injectable, Body, Param, Query } from '@varld/warp';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue';
  paymentTerms: string;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  creditLimit: number;
  status: 'active' | 'inactive' | 'blocked';
  rating: number;
}

interface PurchaseApproval {
  approved: boolean;
  notes?: string;
  approvedBy: string;
}

@Injectable()
@Controller('/api/purchases')
export class PurchaseController {
  constructor(
    private databaseService: DatabaseService,
    private aiService: AIService,
    private notificationService: NotificationService
  ) {}

  @Get('/')
  async getAllPurchases(@Query() query: any) {
    try {
      const {
        status,
        paymentStatus,
        supplierId,
        startDate,
        endDate,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      let filters: any = {};
      
      if (status) filters.status = status;
      if (paymentStatus) filters.paymentStatus = paymentStatus;
      if (supplierId) filters.supplierId = supplierId;
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      const purchases = await this.databaseService.find<Purchase>('purchases', filters, {
        skip,
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
      });

      const total = await this.databaseService.count('purchases', filters);

      // Get AI insights for purchasing patterns
      const insights = await this.aiService.generatePurchaseInsights(purchases);

      return {
        success: true,
        data: purchases,
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
  async getPurchaseById(@Param('id') id: string) {
    try {
      const purchase = await this.databaseService.findById<Purchase>('purchases', id);
      if (!purchase) {
        return { success: false, error: 'Purchase not found' };
      }

      // Get supplier details
      const supplier = await this.databaseService.findById('suppliers', purchase.supplierId);
      
      // Get AI recommendations for cost optimization
      const recommendations = await this.aiService.getPurchaseRecommendations(purchase);

      return {
        success: true,
        data: {
          ...purchase,
          supplier,
          recommendations
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/')
  async createPurchase(@Body() purchaseData: Partial<Purchase>) {
    try {
      // Validate required fields
      const requiredFields = ['supplierId', 'items'];
      for (const field of requiredFields) {
        if (!purchaseData[field]) {
          return { success: false, error: `${field} is required` };
        }
      }

      // Validate items
      if (!Array.isArray(purchaseData.items) || purchaseData.items.length === 0) {
        return { success: false, error: 'Purchase must contain at least one item' };
      }

      // Get supplier details
      const supplier = await this.databaseService.findById('suppliers', purchaseData.supplierId!);
      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }

      if (supplier.status !== 'active') {
        return { success: false, error: 'Cannot create purchase for inactive supplier' };
      }

      // Calculate totals
      const calculations = await this.calculatePurchaseTotals(purchaseData.items!);
      
      // Generate purchase number
      const purchaseNumber = await this.generatePurchaseNumber();

      // Set default values
      const newPurchase: Purchase = {
        id: this.generateId(),
        purchaseNumber,
        supplierId: purchaseData.supplierId!,
        supplierName: supplier.name,
        items: purchaseData.items!,
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        shipping: calculations.shipping,
        discount: purchaseData.discount || 0,
        total: calculations.total - (purchaseData.discount || 0),
        status: 'draft',
        paymentStatus: 'pending',
        paymentTerms: supplier.paymentTerms,
        notes: purchaseData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system' // Should come from auth context
      };

      // Use AI to predict delivery date
      newPurchase.expectedDelivery = await this.aiService.calculateExpectedPurchaseDelivery(newPurchase, supplier);

      const saved = await this.databaseService.create('purchases', newPurchase);

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Put('/:id')
  async updatePurchase(@Param('id') id: string, @Body() updateData: Partial<Purchase>) {
    try {
      const existing = await this.databaseService.findById<Purchase>('purchases', id);
      if (!existing) {
        return { success: false, error: 'Purchase not found' };
      }

      // Prevent updates to completed purchases
      if (['received', 'cancelled'].includes(existing.status)) {
        return { success: false, error: 'Cannot update completed purchases' };
      }

      let updated = {
        ...existing,
        ...updateData,
        updatedAt: new Date()
      };

      // Recalculate totals if items changed
      if (updateData.items) {
        const calculations = await this.calculatePurchaseTotals(updateData.items);
        updated = {
          ...updated,
          subtotal: calculations.subtotal,
          tax: calculations.tax,
          shipping: calculations.shipping,
          total: calculations.total - (updated.discount || 0)
        };
      }

      const saved = await this.databaseService.update('purchases', id, updated);

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Delete('/:id')
  async deletePurchase(@Param('id') id: string) {
    try {
      const existing = await this.databaseService.findById<Purchase>('purchases', id);
      if (!existing) {
        return { success: false, error: 'Purchase not found' };
      }

      // Only allow deletion of draft purchases
      if (existing.status !== 'draft') {
        return { success: false, error: 'Only draft purchases can be deleted' };
      }

      await this.databaseService.delete('purchases', id);

      return { success: true, message: 'Purchase deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/:id/approve')
  async approvePurchase(@Param('id') id: string, @Body() approval: PurchaseApproval) {
    try {
      const purchase = await this.databaseService.findById<Purchase>('purchases', id);
      if (!purchase) {
        return { success: false, error: 'Purchase not found' };
      }

      if (purchase.status !== 'pending') {
        return { success: false, error: 'Only pending purchases can be approved' };
      }

      // Check supplier credit limit
      const supplier = await this.databaseService.findById('suppliers', purchase.supplierId);
      if (supplier && purchase.total > supplier.creditLimit) {
        return {
          success: false,
          error: `Purchase amount exceeds supplier credit limit of $${supplier.creditLimit}`
        };
      }

      const updateData: Partial<Purchase> = {
        status: approval.approved ? 'approved' : 'cancelled',
        updatedAt: new Date()
      };

      if (approval.approved) {
        updateData.approvedBy = approval.approvedBy;
        updateData.approvedAt = new Date();
      }

      if (approval.notes) {
        updateData.notes = (purchase.notes || '') + '\n' + approval.notes;
      }

      const updated = await this.databaseService.update('purchases', id, updateData);

      // Send notification to supplier if approved
      if (approval.approved && supplier) {
        await this.notificationService.send({
          type: 'purchase_approved',
          title: 'Purchase Order Approved',
          message: `Purchase order ${purchase.purchaseNumber} has been approved`,
          data: updated,
          recipientEmail: supplier.email
        });
      }

      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/:id/receive')
  async receivePurchase(@Param('id') id: string, @Body() receiptData: {
    items: Array<{ productId: string; receivedQuantity: number; notes?: string }>;
    partialReceipt?: boolean;
    notes?: string;
  }) {
    try {
      const purchase = await this.databaseService.findById<Purchase>('purchases', id);
      if (!purchase) {
        return { success: false, error: 'Purchase not found' };
      }

      if (!['approved', 'ordered'].includes(purchase.status)) {
        return { success: false, error: 'Purchase must be approved or ordered to receive items' };
      }

      // Update received quantities
      const updatedItems = purchase.items.map(item => {
        const received = receiptData.items.find(r => r.productId === item.productId);
        if (received) {
          return {
            ...item,
            receivedQuantity: (item.receivedQuantity || 0) + received.receivedQuantity,
            notes: received.notes || item.notes
          };
        }
        return item;
      });

      // Update inventory for received items
      await this.updateInventoryFromReceipt(receiptData.items);

      // Determine new status
      const allReceived = updatedItems.every(item => 
        (item.receivedQuantity || 0) >= item.quantity
      );

      const newStatus = allReceived ? 'received' : purchase.status;
      const actualDelivery = allReceived ? new Date() : purchase.actualDelivery;

      const updated = await this.databaseService.update('purchases', id, {
        items: updatedItems,
        status: newStatus,
        actualDelivery,
        updatedAt: new Date(),
        notes: receiptData.notes ? (purchase.notes || '') + '\n' + receiptData.notes : purchase.notes
      });

      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/suppliers')
  async getSuppliers(@Query() query: any) {
    try {
      const { status = 'active', page = 1, limit = 50 } = query;
      
      const filters: any = {};
      if (status) filters.status = status;

      const skip = (page - 1) * limit;
      const suppliers = await this.databaseService.find<Supplier>('suppliers', filters, {
        skip,
        limit: parseInt(limit),
        sort: { name: 1 }
      });

      const total = await this.databaseService.count('suppliers', filters);

      return {
        success: true,
        data: suppliers,
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

  @Post('/suppliers')
  async createSupplier(@Body() supplierData: Partial<Supplier>) {
    try {
      const requiredFields = ['name', 'contactPerson', 'email', 'phone'];
      for (const field of requiredFields) {
        if (!supplierData[field]) {
          return { success: false, error: `${field} is required` };
        }
      }

      // Check for duplicate email
      const existingSupplier = await this.databaseService.findOne('suppliers', { email: supplierData.email });
      if (existingSupplier) {
        return { success: false, error: 'Supplier with this email already exists' };
      }

      const newSupplier: Supplier = {
        id: this.generateId(),
        paymentTerms: 'Net 30',
        creditLimit: 50000,
        status: 'active',
        rating: 3.0,
        address: '',
        ...supplierData
      } as Supplier;

      const saved = await this.databaseService.create('suppliers', newSupplier);

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/analytics/overview')
  async getPurchaseAnalytics(@Query() query: any) {
    try {
      const { startDate, endDate } = query;
      
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter = {
          createdAt: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        };
      }

      const purchases = await this.databaseService.find<Purchase>('purchases', dateFilter);
      const suppliers = await this.databaseService.find<Supplier>('suppliers', {});
      
      const analytics = {
        total_purchases: purchases.length,
        total_spend: purchases.reduce((sum, p) => sum + p.total, 0),
        average_purchase_value: purchases.length > 0 ? purchases.reduce((sum, p) => sum + p.total, 0) / purchases.length : 0,
        by_status: this.groupBy(purchases, 'status'),
        by_payment_status: this.groupBy(purchases, 'paymentStatus'),
        top_suppliers: this.getTopSuppliers(purchases, suppliers),
        pending_approvals: purchases.filter(p => p.status === 'pending').length,
        overdue_deliveries: purchases.filter(p => 
          p.expectedDelivery && 
          new Date() > p.expectedDelivery && 
          p.status !== 'received'
        ).length
      };

      // Get AI insights
      const aiInsights = await this.aiService.generatePurchaseAnalytics(analytics);

      return { success: true, data: { ...analytics, aiInsights } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/recommendations/reorder')
  async getReorderRecommendations() {
    try {
      // Get low stock items
      const lowStockItems = await this.databaseService.find('inventory', {
        status: { $in: ['low_stock', 'out_of_stock'] }
      });

      // Get AI recommendations for reordering
      const recommendations = await this.aiService.generateReorderRecommendations(lowStockItems);

      return { success: true, data: recommendations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async calculatePurchaseTotals(items: PurchaseItem[]): Promise<{
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  }> {
    const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = subtotal > 1000 ? 0 : 100; // Free shipping over $1000
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  }

  private async generatePurchaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const purchasesThisMonth = await this.databaseService.count('purchases', {
      purchaseNumber: { $regex: `^PO-${year}${month}` }
    });
    
    const sequence = String(purchasesThisMonth + 1).padStart(4, '0');
    return `PO-${year}${month}-${sequence}`;
  }

  private async updateInventoryFromReceipt(items: Array<{ productId: string; receivedQuantity: number }>): Promise<void> {
    for (const item of items) {
      const inventory = await this.databaseService.findOne('inventory', { productId: item.productId });
      if (inventory) {
        await this.databaseService.update('inventory', inventory.id, {
          quantity: inventory.quantity + item.receivedQuantity,
          lastUpdated: new Date()
        });

        // Create stock movement record
        await this.databaseService.create('stock_movements', {
          id: this.generateId(),
          inventoryId: inventory.id,
          type: 'in',
          quantity: item.receivedQuantity,
          reason: 'Purchase receipt',
          reference: 'Purchase order',
          timestamp: new Date(),
          userId: 'system'
        });
      }
    }
  }

  private getTopSuppliers(purchases: Purchase[], suppliers: Supplier[]): Array<{
    id: string;
    name: string;
    totalSpend: number;
    orderCount: number;
  }> {
    const supplierStats = new Map();
    
    for (const purchase of purchases) {
      const existing = supplierStats.get(purchase.supplierId) || {
        totalSpend: 0,
        orderCount: 0
      };
      
      supplierStats.set(purchase.supplierId, {
        totalSpend: existing.totalSpend + purchase.total,
        orderCount: existing.orderCount + 1
      });
    }

    return Array.from(supplierStats.entries())
      .map(([supplierId, stats]) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return {
          id: supplierId,
          name: supplier?.name || 'Unknown',
          ...stats
        };
      })
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10);
  }

  private groupBy(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private generateId(): string {
    return 'purchase_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

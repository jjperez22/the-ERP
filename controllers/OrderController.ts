// controllers/OrderController.ts
import { Controller, Get, Post, Put, Delete, Injectable, Body, Param, Query } from '@varld/warp';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded';
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderStatusUpdate {
  status: Order['status'];
  notes?: string;
  notifyCustomer?: boolean;
}

@Injectable()
@Controller('/api/orders')
export class OrderController {
  constructor(
    private databaseService: DatabaseService,
    private aiService: AIService,
    private notificationService: NotificationService
  ) {}

  @Get('/')
  async getAllOrders(@Query() query: any) {
    try {
      const {
        status,
        paymentStatus,
        customerId,
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
      if (customerId) filters.customerId = customerId;
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      const orders = await this.databaseService.find<Order>('orders', filters, {
        skip,
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
      });

      const total = await this.databaseService.count('orders', filters);

      // Get AI insights for order patterns
      const insights = await this.aiService.generateOrderInsights(orders);

      return {
        success: true,
        data: orders,
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
  async getOrderById(@Param('id') id: string) {
    try {
      const order = await this.databaseService.findById<Order>('orders', id);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Get customer details
      const customer = await this.databaseService.findById('customers', order.customerId);
      
      // Get AI recommendations for similar orders
      const recommendations = await this.aiService.getOrderRecommendations(order);

      return {
        success: true,
        data: {
          ...order,
          customer,
          recommendations
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/')
  async createOrder(@Body() orderData: Partial<Order>) {
    try {
      // Validate required fields
      const requiredFields = ['customerId', 'items', 'shippingAddress'];
      for (const field of requiredFields) {
        if (!orderData[field]) {
          return { success: false, error: `${field} is required` };
        }
      }

      // Validate items
      if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
        return { success: false, error: 'Order must contain at least one item' };
      }

      // Get customer details
      const customer = await this.databaseService.findById('customers', orderData.customerId!);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      // Calculate totals
      const calculations = await this.calculateOrderTotals(orderData.items!);
      
      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Set default values
      const newOrder: Order = {
        id: this.generateId(),
        orderNumber,
        customerId: orderData.customerId!,
        customerName: customer.companyName,
        items: orderData.items!,
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        shipping: calculations.shipping,
        discount: orderData.discount || 0,
        total: calculations.total - (orderData.discount || 0),
        status: 'draft',
        paymentStatus: 'pending',
        shippingAddress: orderData.shippingAddress!,
        billingAddress: orderData.billingAddress || orderData.shippingAddress!,
        notes: orderData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system' // Should come from auth context
      };

      // Use AI to suggest delivery date
      newOrder.expectedDelivery = await this.aiService.calculateExpectedDelivery(newOrder);

      const saved = await this.databaseService.create('orders', newOrder);

      // Send order confirmation notification
      await this.notificationService.send({
        type: 'order_confirmation',
        title: 'Order Confirmation',
        message: `Order ${orderNumber} has been created successfully`,
        data: saved,
        recipientId: customer.id,
        recipientEmail: customer.email
      });

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Put('/:id')
  async updateOrder(@Param('id') id: string, @Body() updateData: Partial<Order>) {
    try {
      const existing = await this.databaseService.findById<Order>('orders', id);
      if (!existing) {
        return { success: false, error: 'Order not found' };
      }

      // Prevent updates to completed orders
      if (['delivered', 'cancelled'].includes(existing.status)) {
        return { success: false, error: 'Cannot update completed orders' };
      }

      let updated = {
        ...existing,
        ...updateData,
        updatedAt: new Date()
      };

      // Recalculate totals if items changed
      if (updateData.items) {
        const calculations = await this.calculateOrderTotals(updateData.items);
        updated = {
          ...updated,
          subtotal: calculations.subtotal,
          tax: calculations.tax,
          shipping: calculations.shipping,
          total: calculations.total - (updated.discount || 0)
        };
      }

      const saved = await this.databaseService.update('orders', id, updated);

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Delete('/:id')
  async deleteOrder(@Param('id') id: string) {
    try {
      const existing = await this.databaseService.findById<Order>('orders', id);
      if (!existing) {
        return { success: false, error: 'Order not found' };
      }

      // Only allow deletion of draft orders
      if (existing.status !== 'draft') {
        return { success: false, error: 'Only draft orders can be deleted' };
      }

      await this.databaseService.delete('orders', id);

      return { success: true, message: 'Order deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() statusUpdate: OrderStatusUpdate) {
    try {
      const order = await this.databaseService.findById<Order>('orders', id);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const updated = await this.databaseService.update('orders', id, {
        status: statusUpdate.status,
        updatedAt: new Date(),
        ...(statusUpdate.status === 'delivered' && { actualDelivery: new Date() })
      });

      // Send status update notification
      if (statusUpdate.notifyCustomer) {
        const customer = await this.databaseService.findById('customers', order.customerId);
        if (customer) {
          await this.notificationService.send({
            type: 'order_status_update',
            title: 'Order Status Update',
            message: `Order ${order.orderNumber} status changed to ${statusUpdate.status}`,
            data: { order: updated, notes: statusUpdate.notes },
            recipientId: customer.id,
            recipientEmail: customer.email
          });
        }
      }

      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/:id/confirm')
  async confirmOrder(@Param('id') id: string) {
    try {
      const order = await this.databaseService.findById<Order>('orders', id);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      if (order.status !== 'draft' && order.status !== 'pending') {
        return { success: false, error: 'Only draft or pending orders can be confirmed' };
      }

      // Check inventory availability
      const inventoryCheck = await this.checkInventoryAvailability(order.items);
      if (!inventoryCheck.available) {
        return {
          success: false,
          error: 'Insufficient inventory',
          details: inventoryCheck.issues
        };
      }

      // Reserve inventory
      await this.reserveInventory(order.items);

      const updated = await this.databaseService.update('orders', id, {
        status: 'confirmed',
        updatedAt: new Date()
      });

      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/:id/tracking')
  async getOrderTracking(@Param('id') id: string) {
    try {
      const order = await this.databaseService.findById<Order>('orders', id);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Get tracking information
      const tracking = await this.getTrackingInfo(order);
      
      return { success: true, data: tracking };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/analytics/overview')
  async getOrdersOverview(@Query() query: any) {
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

      const orders = await this.databaseService.find<Order>('orders', dateFilter);
      
      const overview = {
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + order.total, 0),
        average_order_value: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
        by_status: this.groupBy(orders, 'status'),
        by_payment_status: this.groupBy(orders, 'paymentStatus'),
        pending_orders: orders.filter(o => o.status === 'pending').length,
        overdue_payments: orders.filter(o => o.paymentStatus === 'overdue').length
      };

      // Get AI insights
      const aiInsights = await this.aiService.generateOrderAnalytics(overview);

      return { success: true, data: { ...overview, aiInsights } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async calculateOrderTotals(items: OrderItem[]): Promise<{
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  }> {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping over $500
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const ordersThisMonth = await this.databaseService.count('orders', {
      orderNumber: { $regex: `^ORD-${year}${month}` }
    });
    
    const sequence = String(ordersThisMonth + 1).padStart(4, '0');
    return `ORD-${year}${month}-${sequence}`;
  }

  private async checkInventoryAvailability(items: OrderItem[]): Promise<{
    available: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    for (const item of items) {
      const inventory = await this.databaseService.findOne('inventory', { productId: item.productId });
      if (!inventory) {
        issues.push(`Product ${item.productName} not found in inventory`);
      } else if (inventory.quantity < item.quantity) {
        issues.push(`Insufficient stock for ${item.productName}. Available: ${inventory.quantity}, Required: ${item.quantity}`);
      }
    }

    return {
      available: issues.length === 0,
      issues
    };
  }

  private async reserveInventory(items: OrderItem[]): Promise<void> {
    for (const item of items) {
      const inventory = await this.databaseService.findOne('inventory', { productId: item.productId });
      if (inventory) {
        await this.databaseService.update('inventory', inventory.id, {
          quantity: inventory.quantity - item.quantity,
          lastUpdated: new Date()
        });

        // Create stock movement record
        await this.databaseService.create('stock_movements', {
          id: this.generateId(),
          inventoryId: inventory.id,
          type: 'out',
          quantity: item.quantity,
          reason: 'Order fulfillment',
          reference: `Order reservation`,
          timestamp: new Date(),
          userId: 'system'
        });
      }
    }
  }

  private async getTrackingInfo(order: Order): Promise<any> {
    // Mock tracking information
    const stages = [
      { status: 'Order Placed', completed: true, timestamp: order.createdAt },
      { status: 'Confirmed', completed: order.status !== 'draft', timestamp: order.status !== 'draft' ? order.updatedAt : null },
      { status: 'Processing', completed: ['processing', 'shipped', 'delivered'].includes(order.status), timestamp: null },
      { status: 'Shipped', completed: ['shipped', 'delivered'].includes(order.status), timestamp: null },
      { status: 'Delivered', completed: order.status === 'delivered', timestamp: order.actualDelivery }
    ];

    return {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      expectedDelivery: order.expectedDelivery,
      actualDelivery: order.actualDelivery,
      stages
    };
  }

  private groupBy(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private generateId(): string {
    return 'order_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// services/OrderService.ts
// Order management service with comprehensive edit capabilities

import { z } from 'zod';

// Validation schemas for order operations
export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  sku: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discount: z.number().min(0).max(100, 'Discount must be between 0 and 100').default(0),
  totalPrice: z.number().min(0, 'Total price cannot be negative'),
  notes: z.string().optional()
});

export const OrderSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).default('PENDING'),
  orderDate: z.date().default(() => new Date()),
  requiredDate: z.date().optional(),
  shippedDate: z.date().optional(),
  deliveredDate: z.date().optional(),
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100').default(0),
  taxAmount: z.number().min(0, 'Tax amount cannot be negative').default(0),
  shippingCost: z.number().min(0, 'Shipping cost cannot be negative').default(0),
  totalAmount: z.number().min(0, 'Total amount cannot be negative'),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']).default('PENDING'),
  paymentMethod: z.string().optional(),
  paymentTerms: z.string().default('Net 30'),
  shippingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('USA')
  }).optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('USA')
  }).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  salesRepId: z.string().optional(),
  customFields: z.record(z.any()).optional()
});

export const OrderUpdateSchema = OrderSchema.partial().omit({ orderNumber: true });

export type OrderItem = z.infer<typeof OrderItemSchema> & {
  id?: string;
};

export type Order = z.infer<typeof OrderSchema> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  items: OrderItem[];
};

export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;

export interface OrderFilter {
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  customerName?: string;
  priority?: string;
  salesRepId?: string;
  dateRange?: { start?: Date; end?: Date };
  amountRange?: { min?: number; max?: number };
  search?: string;
}

export interface OrderSearchResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class OrderService {
  // Mock data storage - in production this would use Prisma/database
  private orders: Map<string, Order> = new Map();
  private orderCounter: number = 1000;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockOrders: Order[] = [
      {
        id: 'order-001',
        orderNumber: 'ORD-001001',
        customerId: 'cust-001',
        customerName: 'ABC Construction LLC',
        status: 'CONFIRMED',
        orderDate: new Date('2024-01-20'),
        requiredDate: new Date('2024-01-25'),
        items: [
          {
            id: 'item-1',
            productId: 'prod-001',
            productName: 'Premium Steel Beam',
            sku: 'STL-001',
            quantity: 10,
            unitPrice: 299.99,
            discount: 5,
            totalPrice: 2849.91,
            notes: 'Special handling required'
          },
          {
            id: 'item-2',
            productId: 'prod-002',
            productName: 'Portland Cement',
            sku: 'CEM-001',
            quantity: 50,
            unitPrice: 12.50,
            discount: 0,
            totalPrice: 625.00
          }
        ],
        subtotal: 3474.91,
        taxRate: 8.5,
        taxAmount: 295.37,
        shippingCost: 150.00,
        totalAmount: 3920.28,
        paymentStatus: 'PENDING',
        paymentTerms: 'Net 30',
        priority: 'HIGH',
        shippingAddress: {
          street: '456 Work Site Ave',
          city: 'Worktown',
          state: 'ST',
          zipCode: '12346',
          country: 'USA'
        },
        notes: 'Delivery to construction site entrance',
        internalNotes: 'Customer has good credit history',
        salesRepId: 'rep-001',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        createdBy: 'sales-user',
        customFields: {
          projectName: 'Downtown Office Building',
          contractNumber: 'CNT-2024-001'
        }
      },
      {
        id: 'order-002',
        orderNumber: 'ORD-001002',
        customerId: 'cust-002',
        customerName: 'Mike Johnson',
        status: 'DELIVERED',
        orderDate: new Date('2024-02-15'),
        requiredDate: new Date('2024-02-18'),
        shippedDate: new Date('2024-02-17'),
        deliveredDate: new Date('2024-02-18'),
        items: [
          {
            id: 'item-3',
            productId: 'prod-003',
            productName: 'Wood Planks',
            sku: 'WOD-001',
            quantity: 100,
            unitPrice: 15.75,
            discount: 10,
            totalPrice: 1417.50
          }
        ],
        subtotal: 1417.50,
        taxRate: 8.5,
        taxAmount: 120.49,
        shippingCost: 75.00,
        totalAmount: 1612.99,
        paymentStatus: 'PAID',
        paymentMethod: 'Credit Card',
        paymentTerms: 'Net 15',
        priority: 'NORMAL',
        shippingAddress: {
          street: '789 Oak Street',
          city: 'Hometown',
          state: 'ST',
          zipCode: '12347',
          country: 'USA'
        },
        notes: 'Call before delivery',
        salesRepId: 'rep-002',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-18'),
        createdBy: 'sales-user',
        customFields: {
          projectName: 'Kitchen Renovation',
          deliveryInstructions: 'Leave at side door'
        }
      }
    ];

    mockOrders.forEach(order => {
      this.orders.set(order.id!, order);
    });
    this.orderCounter = 1002;
  }

  // Generate next order number
  private generateOrderNumber(): string {
    this.orderCounter++;
    return `ORD-${this.orderCounter.toString().padStart(6, '0')}`;
  }

  // Calculate order totals
  private calculateOrderTotals(items: OrderItem[], taxRate: number = 0, shippingCost: number = 0): {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = (itemTotal * item.discount) / 100;
      return sum + (itemTotal - discountAmount);
    }, 0);

    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount + shippingCost;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  // Validate order data
  private validateOrder(data: any): Order {
    try {
      const validated = OrderSchema.parse(data);
      
      // Calculate and validate totals
      const calculated = this.calculateOrderTotals(validated.items, validated.taxRate, validated.shippingCost);
      
      return {
        ...validated,
        subtotal: calculated.subtotal,
        taxAmount: calculated.taxAmount,
        totalAmount: calculated.totalAmount,
        items: validated.items.map(item => ({
          ...item,
          totalPrice: Math.round((item.quantity * item.unitPrice * (1 - item.discount / 100)) * 100) / 100
        }))
      };
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }
  }

  // Validate order update data
  private validateOrderUpdate(data: any): OrderUpdate {
    try {
      const validated = OrderUpdateSchema.parse(data);
      
      // Recalculate totals if items are being updated
      if (validated.items) {
        const calculated = this.calculateOrderTotals(
          validated.items, 
          validated.taxRate || 0, 
          validated.shippingCost || 0
        );
        
        return {
          ...validated,
          subtotal: calculated.subtotal,
          taxAmount: calculated.taxAmount,
          totalAmount: calculated.totalAmount,
          items: validated.items.map(item => ({
            ...item,
            totalPrice: Math.round((item.quantity * item.unitPrice * (1 - item.discount / 100)) * 100) / 100
          }))
        };
      }
      
      return validated;
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }
  }

  // Business rule validations
  private async validateBusinessRules(data: Order | OrderUpdate, isUpdate: boolean = false): Promise<void> {
    // Validate order status transitions
    if ('status' in data && data.status) {
      const validTransitions: Record<string, string[]> = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['PROCESSING', 'CANCELLED'],
        'PROCESSING': ['SHIPPED', 'CANCELLED'],
        'SHIPPED': ['DELIVERED'],
        'DELIVERED': [],
        'CANCELLED': []
      };

      if (isUpdate) {
        // In a real application, you'd check the current status and validate the transition
        console.log(`Status transition validation would happen here for status: ${data.status}`);
      }
    }

    // Validate required date
    if ('requiredDate' in data && 'orderDate' in data && data.requiredDate && data.orderDate) {
      if (data.requiredDate < data.orderDate) {
        throw new Error('Required date cannot be before order date');
      }
    }

    // Validate delivered date logic
    if ('deliveredDate' in data && 'shippedDate' in data && data.deliveredDate && data.shippedDate) {
      if (data.deliveredDate < data.shippedDate) {
        throw new Error('Delivered date cannot be before shipped date');
      }
    }
  }

  // Get all orders with filtering and pagination
  async getOrders(filter: OrderFilter = {}, page: number = 1, limit: number = 10): Promise<OrderSearchResult> {
    let filteredOrders = Array.from(this.orders.values());

    // Apply filters
    if (filter.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filter.status);
    }

    if (filter.paymentStatus) {
      filteredOrders = filteredOrders.filter(order => order.paymentStatus === filter.paymentStatus);
    }

    if (filter.customerId) {
      filteredOrders = filteredOrders.filter(order => order.customerId === filter.customerId);
    }

    if (filter.customerName) {
      filteredOrders = filteredOrders.filter(order => 
        order.customerName.toLowerCase().includes(filter.customerName!.toLowerCase())
      );
    }

    if (filter.priority) {
      filteredOrders = filteredOrders.filter(order => order.priority === filter.priority);
    }

    if (filter.salesRepId) {
      filteredOrders = filteredOrders.filter(order => order.salesRepId === filter.salesRepId);
    }

    if (filter.dateRange) {
      if (filter.dateRange.start) {
        filteredOrders = filteredOrders.filter(order => order.orderDate >= filter.dateRange!.start!);
      }
      if (filter.dateRange.end) {
        filteredOrders = filteredOrders.filter(order => order.orderDate <= filter.dateRange!.end!);
      }
    }

    if (filter.amountRange) {
      if (filter.amountRange.min) {
        filteredOrders = filteredOrders.filter(order => order.totalAmount >= filter.amountRange!.min!);
      }
      if (filter.amountRange.max) {
        filteredOrders = filteredOrders.filter(order => order.totalAmount <= filter.amountRange!.max!);
      }
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.notes?.toLowerCase().includes(searchTerm) ||
        order.items.some(item => 
          item.productName.toLowerCase().includes(searchTerm) ||
          item.sku?.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Sort by order date (newest first)
    filteredOrders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());

    // Apply pagination
    const total = filteredOrders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get single order by ID
  async getOrder(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  // Get order by order number
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const order = Array.from(this.orders.values()).find(o => o.orderNumber === orderNumber);
    return order || null;
  }

  // Create new order
  async createOrder(data: any, createdBy: string = 'system'): Promise<{ id: string; order: Order }> {
    const orderData = {
      ...data,
      orderNumber: this.generateOrderNumber()
    };

    const validatedData = this.validateOrder(orderData);
    await this.validateBusinessRules(validatedData);

    const id = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const order: Order = {
      ...validatedData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };

    this.orders.set(id, order);
    return { id, order };
  }

  // Update order
  async updateOrder(id: string, data: any, updatedBy: string = 'system'): Promise<Order> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const validatedData = this.validateOrderUpdate(data);
    await this.validateBusinessRules(validatedData, true);

    const updatedOrder: Order = {
      ...existingOrder,
      ...validatedData,
      updatedAt: new Date(),
      updatedBy
    };

    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Update order status
  async updateOrderStatus(id: string, status: string, updatedBy: string = 'system'): Promise<Order> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const updates: any = { status };

    // Set dates based on status
    if (status === 'SHIPPED' && !existingOrder.shippedDate) {
      updates.shippedDate = new Date();
    }
    if (status === 'DELIVERED' && !existingOrder.deliveredDate) {
      updates.deliveredDate = new Date();
    }

    return this.updateOrder(id, updates, updatedBy);
  }

  // Get orders by customer
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.customerId === customerId);
  }

  // Get order statistics
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const orders = Array.from(this.orders.values());
    
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
      processing: orders.filter(o => o.status === 'PROCESSING').length,
      shipped: orders.filter(o => o.status === 'SHIPPED').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: 0
    };

    stats.averageOrderValue = stats.total > 0 ? stats.totalRevenue / stats.total : 0;
    return stats;
  }
}

// Export singleton instance
export const orderService = new OrderService();

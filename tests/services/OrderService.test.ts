// tests/services/OrderService.test.ts
// Tests for order service edit functionalities

import { OrderService } from '../../services/OrderService';

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
  });

  describe('getOrders', () => {
    test('should return paginated orders', async () => {
      const result = await orderService.getOrders({}, 1, 10);
      
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(Array.isArray(result.orders)).toBe(true);
    });

    test('should filter orders by status', async () => {
      const result = await orderService.getOrders({ status: 'CONFIRMED' });
      
      result.orders.forEach(order => {
        expect(order.status).toBe('CONFIRMED');
      });
    });

    test('should filter orders by customer', async () => {
      const result = await orderService.getOrders({ customerId: 'cust-001' });
      
      result.orders.forEach(order => {
        expect(order.customerId).toBe('cust-001');
      });
    });
  });

  describe('createOrder', () => {
    test('should create new order with valid data', async () => {
      const orderData = {
        customerId: 'cust-001',
        customerName: 'Test Customer',
        items: [
          {
            productId: 'prod-001',
            productName: 'Test Product',
            sku: 'TEST-001',
            quantity: 2,
            unitPrice: 100.00,
            discount: 0,
            totalPrice: 200.00
          }
        ],
        taxRate: 8.5,
        shippingCost: 25.00,
        paymentTerms: 'Net 30',
        priority: 'NORMAL'
      };

      const result = await orderService.createOrder(orderData);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('order');
      expect(result.order.customerName).toBe('Test Customer');
      expect(result.order.items).toHaveLength(1);
      expect(result.order.subtotal).toBe(200.00);
      expect(result.order.taxAmount).toBe(17.00); // 8.5% of 200
      expect(result.order.totalAmount).toBe(242.00); // 200 + 17 + 25
    });

    test('should generate order number automatically', async () => {
      const orderData = {
        customerId: 'cust-001',
        customerName: 'Test Customer',
        items: [
          {
            productId: 'prod-001',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 50.00,
            discount: 0,
            totalPrice: 50.00
          }
        ]
      };

      const result = await orderService.createOrder(orderData);
      
      expect(result.order.orderNumber).toMatch(/^ORD-\d{6}$/);
    });

    test('should calculate totals correctly with discounts', async () => {
      const orderData = {
        customerId: 'cust-001',
        customerName: 'Test Customer',
        items: [
          {
            productId: 'prod-001',
            productName: 'Test Product',
            quantity: 10,
            unitPrice: 100.00,
            discount: 10, // 10% discount
            totalPrice: 900.00 // Should be calculated automatically
          }
        ],
        taxRate: 10,
        shippingCost: 50.00
      };

      const result = await orderService.createOrder(orderData);
      
      expect(result.order.subtotal).toBe(900.00); // 1000 - 100 (10% discount)
      expect(result.order.taxAmount).toBe(90.00); // 10% of 900
      expect(result.order.totalAmount).toBe(1040.00); // 900 + 90 + 50
    });

    test('should throw error for missing required fields', async () => {
      const invalidData = {
        customerName: 'Test Customer'
        // Missing customerId and items
      };

      await expect(orderService.createOrder(invalidData))
        .rejects.toThrow('Validation failed');
    });

    test('should throw error for empty items array', async () => {
      const invalidData = {
        customerId: 'cust-001',
        customerName: 'Test Customer',
        items: [] // Empty items array
      };

      await expect(orderService.createOrder(invalidData))
        .rejects.toThrow('Order must have at least one item');
    });
  });

  describe('updateOrder', () => {
    test('should update existing order', async () => {
      const updateData = {
        priority: 'HIGH',
        notes: 'Updated notes'
      };

      const updatedOrder = await orderService.updateOrder('order-001', updateData);
      
      expect(updatedOrder.priority).toBe('HIGH');
      expect(updatedOrder.notes).toBe('Updated notes');
    });

    test('should recalculate totals when items are updated', async () => {
      const updateData = {
        items: [
          {
            productId: 'prod-001',
            productName: 'Updated Product',
            quantity: 5,
            unitPrice: 200.00,
            discount: 0,
            totalPrice: 1000.00
          }
        ],
        taxRate: 5
      };

      const updatedOrder = await orderService.updateOrder('order-001', updateData);
      
      expect(updatedOrder.subtotal).toBe(1000.00);
      expect(updatedOrder.taxAmount).toBe(50.00); // 5% of 1000
    });

    test('should throw error for non-existent order', async () => {
      const updateData = { priority: 'HIGH' };

      await expect(orderService.updateOrder('non-existent', updateData))
        .rejects.toThrow('Order not found');
    });
  });

  describe('updateOrderStatus', () => {
    test('should update order status', async () => {
      const updatedOrder = await orderService.updateOrderStatus('order-001', 'PROCESSING');
      
      expect(updatedOrder.status).toBe('PROCESSING');
    });

    test('should set shipped date when status is SHIPPED', async () => {
      const updatedOrder = await orderService.updateOrderStatus('order-002', 'SHIPPED');
      
      expect(updatedOrder.status).toBe('SHIPPED');
      expect(updatedOrder.shippedDate).toBeInstanceOf(Date);
    });

    test('should set delivered date when status is DELIVERED', async () => {
      const updatedOrder = await orderService.updateOrderStatus('order-002', 'DELIVERED');
      
      expect(updatedOrder.status).toBe('DELIVERED');
      expect(updatedOrder.deliveredDate).toBeInstanceOf(Date);
    });
  });

  describe('getOrdersByCustomer', () => {
    test('should return orders for specific customer', async () => {
      const orders = await orderService.getOrdersByCustomer('cust-001');
      
      orders.forEach(order => {
        expect(order.customerId).toBe('cust-001');
      });
    });
  });

  describe('getOrderByNumber', () => {
    test('should return order by order number', async () => {
      const order = await orderService.getOrderByNumber('ORD-001001');
      
      expect(order).not.toBeNull();
      expect(order?.orderNumber).toBe('ORD-001001');
    });

    test('should return null for non-existent order number', async () => {
      const order = await orderService.getOrderByNumber('ORD-999999');
      
      expect(order).toBeNull();
    });
  });

  describe('getOrderStats', () => {
    test('should return order statistics', async () => {
      const stats = await orderService.getOrderStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('confirmed');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('shipped');
      expect(stats).toHaveProperty('delivered');
      expect(stats).toHaveProperty('cancelled');
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats).toHaveProperty('averageOrderValue');
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.totalRevenue).toBeGreaterThan(0);
      expect(stats.averageOrderValue).toBeGreaterThan(0);
    });
  });

  describe('order validation', () => {
    test('should validate required date is not before order date', async () => {
      const invalidData = {
        customerId: 'cust-001',
        customerName: 'Test Customer',
        orderDate: new Date('2024-02-01'),
        requiredDate: new Date('2024-01-31'), // Before order date
        items: [
          {
            productId: 'prod-001',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 100.00,
            discount: 0,
            totalPrice: 100.00
          }
        ]
      };

      await expect(orderService.createOrder(invalidData))
        .rejects.toThrow('Required date cannot be before order date');
    });

    test('should validate tax rate is within valid range', async () => {
      const invalidData = {
        customerId: 'cust-001',
        customerName: 'Test Customer',
        items: [
          {
            productId: 'prod-001',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 100.00,
            discount: 0,
            totalPrice: 100.00
          }
        ],
        taxRate: 150 // Invalid tax rate > 100
      };

      await expect(orderService.createOrder(invalidData))
        .rejects.toThrow('Validation failed');
    });
  });
});

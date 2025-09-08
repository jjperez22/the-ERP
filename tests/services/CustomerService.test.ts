// tests/services/CustomerService.test.ts
// Tests for customer service edit functionalities

import { CustomerService } from '../../services/CustomerService';

describe('CustomerService', () => {
  let customerService: CustomerService;

  beforeEach(() => {
    customerService = new CustomerService();
  });

  describe('getCustomers', () => {
    test('should return paginated customers', async () => {
      const result = await customerService.getCustomers({}, 1, 10);
      
      expect(result).toHaveProperty('customers');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(Array.isArray(result.customers)).toBe(true);
    });

    test('should filter customers by type', async () => {
      const result = await customerService.getCustomers({ customerType: 'Business' });
      
      result.customers.forEach(customer => {
        expect(customer.customerType).toBe('Business');
      });
    });

    test('should filter customers by search term', async () => {
      const result = await customerService.getCustomers({ search: 'ABC' });
      
      result.customers.forEach(customer => {
        expect(
          customer.name.toLowerCase().includes('abc') ||
          customer.email?.toLowerCase().includes('abc') ||
          customer.company?.toLowerCase().includes('abc')
        ).toBe(true);
      });
    });
  });

  describe('createCustomer', () => {
    test('should create new customer with valid data', async () => {
      const customerData = {
        name: 'Test Customer',
        email: 'test@example.com',
        customerType: 'Individual',
        creditLimit: 5000,
        paymentTerms: 'Net 30',
        isActive: true,
        tags: ['test']
      };

      const result = await customerService.createCustomer(customerData);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('customer');
      expect(result.customer.name).toBe('Test Customer');
      expect(result.customer.email).toBe('test@example.com');
    });

    test('should throw error for missing required fields', async () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing required name field
      };

      await expect(customerService.createCustomer(invalidData))
        .rejects.toThrow('Validation failed');
    });

    test('should require company for business customers', async () => {
      const businessData = {
        name: 'Test Business',
        customerType: 'Business',
        creditLimit: 10000
        // Missing company field
      };

      await expect(customerService.createCustomer(businessData))
        .rejects.toThrow('Company name is required for business customers');
    });
  });

  describe('updateCustomer', () => {
    test('should update existing customer', async () => {
      const updateData = {
        name: 'Updated Name',
        creditLimit: 7500
      };

      const updatedCustomer = await customerService.updateCustomer('cust-001', updateData);
      
      expect(updatedCustomer.name).toBe('Updated Name');
      expect(updatedCustomer.creditLimit).toBe(7500);
    });

    test('should throw error for non-existent customer', async () => {
      const updateData = { name: 'Updated Name' };

      await expect(customerService.updateCustomer('non-existent', updateData))
        .rejects.toThrow('Customer not found');
    });
  });

  describe('updateBalance', () => {
    test('should update customer balance', async () => {
      const updatedCustomer = await customerService.updateBalance('cust-001', 100, 'Test payment');
      
      expect(updatedCustomer.currentBalance).toBeGreaterThan(0);
    });

    test('should handle negative balance adjustments', async () => {
      const originalCustomer = await customerService.getCustomer('cust-001');
      const originalBalance = originalCustomer?.currentBalance || 0;
      
      const updatedCustomer = await customerService.updateBalance('cust-001', -50, 'Refund');
      
      expect(updatedCustomer.currentBalance).toBe(originalBalance - 50);
    });
  });

  describe('getCustomerStats', () => {
    test('should return customer statistics', async () => {
      const stats = await customerService.getCustomerStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('inactive');
      expect(stats).toHaveProperty('business');
      expect(stats).toHaveProperty('individual');
      expect(stats).toHaveProperty('totalCreditLimit');
      expect(stats).toHaveProperty('totalOutstanding');
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.active).toBeGreaterThanOrEqual(0);
      expect(stats.inactive).toBeGreaterThanOrEqual(0);
    });
  });

  describe('deactivateCustomer', () => {
    test('should deactivate customer', async () => {
      const deactivatedCustomer = await customerService.deactivateCustomer('cust-002');
      
      expect(deactivatedCustomer.isActive).toBe(false);
    });
  });

  describe('getOverdueCustomers', () => {
    test('should return customers with outstanding balances', async () => {
      const overdueCustomers = await customerService.getOverdueCustomers();
      
      overdueCustomers.forEach(customer => {
        expect(customer.currentBalance).toBeGreaterThan(0);
        expect(customer.isActive).toBe(true);
      });
    });
  });
});

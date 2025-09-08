// services/CustomerService.ts
// Customer management service with comprehensive edit capabilities

import { z } from 'zod';

// Validation schemas for customer operations
export const CustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  taxId: z.string().optional(),
  creditLimit: z.number().min(0, 'Credit limit cannot be negative').default(0),
  currentBalance: z.number().default(0),
  isActive: z.boolean().default(true),
  customerType: z.enum(['Individual', 'Business', 'Contractor', 'Supplier']).default('Individual'),
  paymentTerms: z.string().default('Net 30'),
  preferredContact: z.enum(['Email', 'Phone', 'Mail']).default('Email'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('USA')
  }).optional(),
  shippingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('USA')
  }).optional(),
  customFields: z.record(z.any()).optional()
});

export const CustomerUpdateSchema = CustomerSchema.partial();

export type Customer = z.infer<typeof CustomerSchema> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastOrderDate?: Date;
  totalOrders?: number;
  totalSpent?: number;
};

export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;

export interface CustomerFilter {
  customerType?: string;
  isActive?: boolean;
  city?: string;
  state?: string;
  tags?: string[];
  search?: string;
  creditLimitRange?: { min?: number; max?: number };
  balanceRange?: { min?: number; max?: number };
}

export interface CustomerSearchResult {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CustomerService {
  // Mock data storage - in production this would use Prisma/database
  private customers: Map<string, Customer> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockCustomers: Customer[] = [
      {
        id: 'cust-001',
        name: 'ABC Construction LLC',
        email: 'contact@abcconstruction.com',
        phone: '+1-555-0123',
        address: '123 Main St, Anytown, ST 12345',
        company: 'ABC Construction LLC',
        taxId: '12-3456789',
        creditLimit: 50000,
        currentBalance: 2500.50,
        isActive: true,
        customerType: 'Business',
        paymentTerms: 'Net 30',
        preferredContact: 'Email',
        tags: ['construction', 'commercial', 'priority'],
        notes: 'Large commercial contractor, excellent payment history',
        billingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          zipCode: '12345',
          country: 'USA'
        },
        shippingAddress: {
          street: '456 Work Site Ave',
          city: 'Worktown',
          state: 'ST',
          zipCode: '12346',
          country: 'USA'
        },
        customFields: {
          projectManager: 'John Smith',
          preferredDeliveryTime: 'Morning'
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        lastOrderDate: new Date('2024-01-20'),
        totalOrders: 15,
        totalSpent: 125000.75
      },
      {
        id: 'cust-002',
        name: 'Mike Johnson',
        email: 'mike.johnson@email.com',
        phone: '+1-555-0456',
        address: '789 Oak Street, Hometown, ST 12347',
        customerType: 'Individual',
        creditLimit: 5000,
        currentBalance: 0,
        isActive: true,
        paymentTerms: 'Net 15',
        preferredContact: 'Phone',
        tags: ['residential', 'diy'],
        notes: 'DIY homeowner, occasional large purchases',
        billingAddress: {
          street: '789 Oak Street',
          city: 'Hometown',
          state: 'ST',
          zipCode: '12347',
          country: 'USA'
        },
        customFields: {
          homeType: 'Single Family',
          projectType: 'Kitchen Renovation'
        },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-15'),
        lastOrderDate: new Date('2024-02-15'),
        totalOrders: 3,
        totalSpent: 3250.25
      }
    ];

    mockCustomers.forEach(customer => {
      this.customers.set(customer.id!, customer);
    });
  }

  // Get all customers with filtering and pagination
  async getCustomers(filter: CustomerFilter = {}, page: number = 1, limit: number = 10): Promise<CustomerSearchResult> {
    let filteredCustomers = Array.from(this.customers.values());

    // Apply filters
    if (filter.customerType) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.customerType === filter.customerType
      );
    }

    if (filter.isActive !== undefined) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.isActive === filter.isActive
      );
    }

    if (filter.city) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.billingAddress?.city?.toLowerCase().includes(filter.city!.toLowerCase())
      );
    }

    if (filter.state) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.billingAddress?.state?.toLowerCase().includes(filter.state!.toLowerCase())
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredCustomers = filteredCustomers.filter(customer => 
        filter.tags!.some(tag => customer.tags.includes(tag))
      );
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.company?.toLowerCase().includes(searchTerm) ||
        customer.phone?.includes(searchTerm)
      );
    }

    if (filter.creditLimitRange) {
      filteredCustomers = filteredCustomers.filter(customer => {
        const credit = customer.creditLimit;
        const min = filter.creditLimitRange?.min;
        const max = filter.creditLimitRange?.max;
        return (!min || credit >= min) && (!max || credit <= max);
      });
    }

    if (filter.balanceRange) {
      filteredCustomers = filteredCustomers.filter(customer => {
        const balance = customer.currentBalance;
        const min = filter.balanceRange?.min;
        const max = filter.balanceRange?.max;
        return (!min || balance >= min) && (!max || balance <= max);
      });
    }

    // Apply pagination
    const total = filteredCustomers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    return {
      customers: paginatedCustomers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get single customer by ID
  async getCustomer(id: string): Promise<Customer | null> {
    return this.customers.get(id) || null;
  }

  // Get customer by email
  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const customer = Array.from(this.customers.values()).find(c => c.email === email);
    return customer || null;
  }

  // Validate customer data
  private validateCustomer(data: any): Customer {
    try {
      return CustomerSchema.parse(data);
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }
  }

  // Validate customer update data
  private validateCustomerUpdate(data: any): CustomerUpdate {
    try {
      return CustomerUpdateSchema.parse(data);
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }
  }

  // Business rule validations
  private async validateBusinessRules(data: Customer | CustomerUpdate, isUpdate: boolean = false): Promise<void> {
    // Check email uniqueness for new customers or email changes
    if (('email' in data && data.email) && !isUpdate) {
      const existing = await this.getCustomerByEmail(data.email);
      if (existing) {
        throw new Error(`Customer with email '${data.email}' already exists`);
      }
    }

    // Validate credit limit vs current balance
    if ('creditLimit' in data && 'currentBalance' in data && 
        data.creditLimit !== undefined && data.currentBalance !== undefined &&
        data.currentBalance > data.creditLimit) {
      console.warn('Warning: Current balance exceeds credit limit');
    }

    // Validate required fields for business customers
    if ('customerType' in data && data.customerType === 'Business') {
      if (!('company' in data) || !data.company) {
        throw new Error('Company name is required for business customers');
      }
    }
  }

  // Create new customer
  async createCustomer(data: any): Promise<{ id: string; customer: Customer }> {
    const validatedData = this.validateCustomer(data);
    await this.validateBusinessRules(validatedData);

    const id = `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const customer: Customer = {
      ...validatedData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalOrders: 0,
      totalSpent: 0
    };

    this.customers.set(id, customer);
    return { id, customer };
  }

  // Update customer
  async updateCustomer(id: string, data: any): Promise<Customer> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    const validatedData = this.validateCustomerUpdate(data);
    await this.validateBusinessRules(validatedData, true);

    const updatedCustomer: Customer = {
      ...existingCustomer,
      ...validatedData,
      updatedAt: new Date()
    };

    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Update customer balance (for order processing)
  async updateBalance(id: string, amount: number, reason: string = 'Balance adjustment'): Promise<Customer> {
    const customer = this.customers.get(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedCustomer: Customer = {
      ...customer,
      currentBalance: customer.currentBalance + amount,
      updatedAt: new Date()
    };

    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Deactivate customer (soft delete)
  async deactivateCustomer(id: string): Promise<Customer> {
    const customer = this.customers.get(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedCustomer: Customer = {
      ...customer,
      isActive: false,
      updatedAt: new Date()
    };

    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Get customers with overdue balances
  async getOverdueCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(customer => 
      customer.currentBalance > 0 && customer.isActive
    );
  }

  // Get customer statistics
  async getCustomerStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    business: number;
    individual: number;
    totalCreditLimit: number;
    totalOutstanding: number;
  }> {
    const customers = Array.from(this.customers.values());
    
    return {
      total: customers.length,
      active: customers.filter(c => c.isActive).length,
      inactive: customers.filter(c => !c.isActive).length,
      business: customers.filter(c => c.customerType === 'Business').length,
      individual: customers.filter(c => c.customerType === 'Individual').length,
      totalCreditLimit: customers.reduce((sum, c) => sum + c.creditLimit, 0),
      totalOutstanding: customers.reduce((sum, c) => sum + c.currentBalance, 0)
    };
  }
}

// Export singleton instance
export const customerService = new CustomerService();

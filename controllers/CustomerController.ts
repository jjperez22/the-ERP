// controllers/CustomerController.ts
import { Controller, Get, Post, Put, Delete, Injectable, Body, Param, Query } from '@varld/warp';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  businessType: 'general_contractor' | 'subcontractor' | 'homeowner' | 'developer' | 'architect';
  creditLimit: number;
  paymentTerms: string;
  taxId?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  lastOrderDate?: Date;
  totalOrders: number;
  totalSpent: number;
  riskScore: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface CustomerContact {
  id: string;
  customerId: string;
  type: 'email' | 'phone' | 'meeting' | 'quote_request';
  subject: string;
  content: string;
  timestamp: Date;
  userId: string;
  outcome?: string;
}

interface CustomerAnalytics {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  lastOrderDays: number;
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  growthTrend: 'growing' | 'stable' | 'declining';
}

@Injectable()
@Controller('/api/customers')
export class CustomerController {
  constructor(
    private databaseService: DatabaseService,
    private aiService: AIService,
    private notificationService: NotificationService
  ) {}

  @Get('/')
  async getAllCustomers(@Query() query: any) {
    try {
      const { 
        businessType,
        status,
        loyaltyTier,
        searchTerm,
        page = 1,
        limit = 50,
        sortBy = 'companyName',
        sortOrder = 'asc'
      } = query;

      let filters: any = {};
      
      if (businessType) filters.businessType = businessType;
      if (status) filters.status = status;
      if (loyaltyTier) filters.loyaltyTier = loyaltyTier;
      if (searchTerm) {
        filters.$or = [
          { companyName: { $regex: searchTerm, $options: 'i' } },
          { contactPerson: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const customers = await this.databaseService.find('customers', filters, {
        skip,
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
      });

      const total = await this.databaseService.count('customers', filters);

      // Get AI insights for customer segmentation
      const insights = await this.aiService.generateCustomerInsights(customers);

      return {
        success: true,
        data: customers,
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
  async getCustomerById(@Param('id') id: string) {
    try {
      const customer = await this.databaseService.findById('customers', id);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      // Get customer orders
      const orders = await this.databaseService.find('orders', 
        { customerId: id },
        { sort: { createdAt: -1 }, limit: 10 }
      );

      // Get customer contacts/interactions
      const contacts = await this.databaseService.find('customer_contacts',
        { customerId: id },
        { sort: { timestamp: -1 }, limit: 20 }
      );

      // Get AI-powered customer analytics
      const analytics = await this.calculateCustomerAnalytics(id);
      const aiRecommendations = await this.aiService.getCustomerRecommendations(customer, analytics);

      return {
        success: true,
        data: {
          ...customer,
          orders,
          contacts,
          analytics,
          aiRecommendations
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/')
  async createCustomer(@Body() customerData: Partial<Customer>) {
    try {
      // Validate required fields
      const requiredFields = ['companyName', 'contactPerson', 'email', 'phone', 'businessType'];
      for (const field of requiredFields) {
        if (!customerData[field]) {
          return { success: false, error: `${field} is required` };
        }
      }

      // Check for duplicate email
      const existingCustomer = await this.databaseService.findOne('customers', { email: customerData.email });
      if (existingCustomer) {
        return { success: false, error: 'Customer with this email already exists' };
      }

      // Set default values
      const newCustomer: Customer = {
        id: this.generateId(),
        creditLimit: 10000,
        paymentTerms: 'Net 30',
        status: 'active',
        createdAt: new Date(),
        totalOrders: 0,
        totalSpent: 0,
        riskScore: 0.5,
        loyaltyTier: 'bronze',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        ...customerData
      } as Customer;

      // Calculate initial risk score using AI
      newCustomer.riskScore = await this.aiService.calculateCustomerRiskScore(newCustomer);

      const saved = await this.databaseService.create('customers', newCustomer);

      // Create welcome contact record
      await this.createCustomerContact({
        customerId: saved.id,
        type: 'email',
        subject: 'Welcome to our system',
        content: 'Customer account created successfully',
        timestamp: new Date(),
        userId: 'system'
      });

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Put('/:id')
  async updateCustomer(@Param('id') id: string, @Body() updateData: Partial<Customer>) {
    try {
      const existing = await this.databaseService.findById('customers', id);
      if (!existing) {
        return { success: false, error: 'Customer not found' };
      }

      const updated = {
        ...existing,
        ...updateData
      };

      // Recalculate risk score if relevant data changed
      if (updateData.creditLimit || updateData.paymentTerms || updateData.businessType) {
        updated.riskScore = await this.aiService.calculateCustomerRiskScore(updated);
      }

      // Update loyalty tier based on spending
      updated.loyaltyTier = this.calculateLoyaltyTier(updated.totalSpent);

      const saved = await this.databaseService.update('customers', id, updated);

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Delete('/:id')
  async deleteCustomer(@Param('id') id: string) {
    try {
      const existing = await this.databaseService.findById('customers', id);
      if (!existing) {
        return { success: false, error: 'Customer not found' };
      }

      // Check if customer has active orders
      const activeOrders = await this.databaseService.count('orders', 
        { customerId: id, status: { $in: ['pending', 'processing', 'shipped'] } }
      );

      if (activeOrders > 0) {
        return { success: false, error: 'Cannot delete customer with active orders' };
      }

      // Soft delete by setting status to inactive
      await this.databaseService.update('customers', id, { status: 'inactive' });

      return { success: true, message: 'Customer deactivated successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/:id/contacts')
  async addCustomerContact(@Param('id') id: string, @Body() contactData: Partial<CustomerContact>) {
    try {
      const customer = await this.databaseService.findById('customers', id);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      const contact = await this.createCustomerContact({
        customerId: id,
        type: contactData.type || 'email',
        subject: contactData.subject || '',
        content: contactData.content || '',
        timestamp: new Date(),
        userId: contactData.userId || 'system',
        outcome: contactData.outcome
      });

      return { success: true, data: contact };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/:id/analytics')
  async getCustomerAnalytics(@Param('id') id: string) {
    try {
      const customer = await this.databaseService.findById('customers', id);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      const analytics = await this.calculateCustomerAnalytics(id);
      const aiInsights = await this.aiService.generateCustomerAnalytics(customer, analytics);

      return {
        success: true,
        data: {
          ...analytics,
          aiInsights
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/analytics/overview')
  async getCustomersOverview() {
    try {
      const customers = await this.databaseService.find('customers', {});
      
      const overview = {
        total_customers: customers.length,
        active_customers: customers.filter(c => c.status === 'active').length,
        inactive_customers: customers.filter(c => c.status === 'inactive').length,
        blocked_customers: customers.filter(c => c.status === 'blocked').length,
        business_types: this.groupByBusinessType(customers),
        loyalty_tiers: this.groupByLoyaltyTier(customers),
        total_revenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
        average_order_value: this.calculateAverageOrderValue(customers),
        high_risk_customers: customers.filter(c => c.riskScore > 0.7).length
      };

      // Get AI insights for customer base
      const aiInsights = await this.aiService.generateCustomerBaseAnalytics(overview);

      return { success: true, data: { ...overview, aiInsights } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/bulk-update-tier')
  async bulkUpdateLoyaltyTiers() {
    try {
      const customers = await this.databaseService.find('customers', {});
      const updates = [];

      for (const customer of customers) {
        const newTier = this.calculateLoyaltyTier(customer.totalSpent);
        if (newTier !== customer.loyaltyTier) {
          await this.databaseService.update('customers', customer.id, { loyaltyTier: newTier });
          updates.push({ id: customer.id, oldTier: customer.loyaltyTier, newTier });
        }
      }

      return { 
        success: true, 
        message: `Updated ${updates.length} customer loyalty tiers`,
        updates 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/:id/recommendations')
  async getCustomerRecommendations(@Param('id') id: string) {
    try {
      const customer = await this.databaseService.findById('customers', id);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      const analytics = await this.calculateCustomerAnalytics(id);
      const recommendations = await this.aiService.getCustomerRecommendations(customer, analytics);

      return { success: true, data: recommendations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async calculateCustomerAnalytics(customerId: string): Promise<CustomerAnalytics> {
    const orders = await this.databaseService.find('orders', { customerId });
    
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;
    
    const lastOrder = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const lastOrderDays = lastOrder ? 
      Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 
      999;

    // Calculate payment history score
    const paidOrders = orders.filter(order => order.paymentStatus === 'paid');
    const paymentRatio = orderCount > 0 ? paidOrders.length / orderCount : 1;
    
    let paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
    if (paymentRatio >= 0.95) paymentHistory = 'excellent';
    else if (paymentRatio >= 0.85) paymentHistory = 'good';
    else if (paymentRatio >= 0.7) paymentHistory = 'fair';
    else paymentHistory = 'poor';

    // Calculate growth trend
    const recentOrders = orders.filter(order => 
      new Date(order.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );
    const olderOrders = orders.filter(order => 
      new Date(order.createdAt) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) &&
      new Date(order.createdAt) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    );

    const recentRevenue = recentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const olderRevenue = olderOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    let growthTrend: 'growing' | 'stable' | 'declining';
    if (recentRevenue > olderRevenue * 1.1) growthTrend = 'growing';
    else if (recentRevenue < olderRevenue * 0.9) growthTrend = 'declining';
    else growthTrend = 'stable';

    return {
      revenue,
      orderCount,
      averageOrderValue,
      lastOrderDays,
      paymentHistory,
      growthTrend
    };
  }

  private async createCustomerContact(contactData: Omit<CustomerContact, 'id'>): Promise<CustomerContact> {
    const contact: CustomerContact = {
      id: this.generateId(),
      ...contactData
    };
    return await this.databaseService.create('customer_contacts', contact);
  }

  private calculateLoyaltyTier(totalSpent: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (totalSpent >= 100000) return 'platinum';
    if (totalSpent >= 50000) return 'gold';
    if (totalSpent >= 15000) return 'silver';
    return 'bronze';
  }

  private groupByBusinessType(customers: Customer[]) {
    return customers.reduce((acc, customer) => {
      if (!acc[customer.businessType]) {
        acc[customer.businessType] = 0;
      }
      acc[customer.businessType]++;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByLoyaltyTier(customers: Customer[]) {
    return customers.reduce((acc, customer) => {
      if (!acc[customer.loyaltyTier]) {
        acc[customer.loyaltyTier] = 0;
      }
      acc[customer.loyaltyTier]++;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverageOrderValue(customers: Customer[]): number {
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
    return totalOrders > 0 ? totalSpent / totalOrders : 0;
  }

  private generateId(): string {
    return 'cust_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

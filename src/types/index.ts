// Construction ERP - Type Definitions

// Core ERP Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderPoint: number;
  supplier: string;
  location: string;
  description?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Customer {
  id: string;
  name: string;
  type: 'General Contractor' | 'Trade Contractor' | 'Retailer' | 'Residential Contractor';
  revenue: number;
  orders: number;
  status: 'Active' | 'Inactive' | 'Pending';
  paymentTerms: string;
  churnRisk: 'Low' | 'Medium' | 'High';
  lastOrder: string;
  contactInfo?: {
    email: string;
    phone: string;
    address: string;
  };
}

export interface Order {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: number;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

// AI & Analytics Types
export interface AIInsight {
  id?: string;
  type: 'inventory' | 'pricing' | 'demand' | 'customer' | 'financial' | 'operational';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action: string;
  timestamp?: string;
  confidence?: number;
  impact?: 'high' | 'medium' | 'low';
  category?: string;
}

export interface DashboardMetrics {
  monthlyRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  lowStockItems: number;
  salesGrowth: number;
  inventoryTurnover: number;
  avgOrderValue: number;
  customerSatisfaction: number;
}

// Module Types
export type ModuleName = 
  | 'dashboard'
  | 'inventory' 
  | 'customers'
  | 'orders'
  | 'financial'
  | 'supply-chain'
  | 'insights'
  | 'reports';

export interface ModuleConfig {
  name: ModuleName;
  title: string;
  icon: string;
  permissions: string[];
  dependencies?: string[];
  lazy?: boolean;
}

// User & Authentication Types
export interface UserRole {
  name: string;
  permissions: Permission[];
  modules: ModuleName[];
}

export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
}

// Configuration Types
export interface ERPConfig {
  apiUrl: string;
  wsUrl?: string;
  enableOfflineMode: boolean;
  modules: ModuleConfig[];
  theme: 'light' | 'dark' | 'auto';
  locale: string;
  debug: boolean;
}

// API Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Chart & Analytics Types
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'area';
  data: any;
  options?: any;
  responsive?: boolean;
}

export interface AnalyticsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }[];
}

// Financial Types
export interface FinancialData {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  accountsReceivable: number;
  accountsPayable: number;
  period: string;
}

// Supply Chain Types
export interface Vendor {
  id: string;
  name: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Under Review';
  rating: number;
  paymentTerms: string;
  leadTime: string;
  onTimeDelivery: number;
  qualityScore: number;
  ytdSpend: number;
  contactInfo: {
    person: string;
    phone: string;
    email: string;
    address: string;
  };
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  date: string;
  total: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Receiving' | 'Completed';
  expectedDelivery: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  data?: any;
  style?: 'primary' | 'secondary' | 'danger';
}

// Event Types
export type ERPEvent = 
  | 'erp-navigate'
  | 'erp-data-update'
  | 'erp-user-login'
  | 'erp-user-logout'
  | 'erp-module-load'
  | 'erp-notification';

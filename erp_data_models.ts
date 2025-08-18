
// Core Data Models for Construction Materials ERP

export interface Company {
  id: string;
  name: string;
  type: 'small' | 'midsize' | 'enterprise';
  revenue: number;
  employees: number;
  locations: Location[];
  settings: CompanySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  type: 'warehouse' | 'office' | 'yard' | 'showroom';
  isActive: boolean;
}

export interface CompanySettings {
  currency: string;
  timezone: string;
  fiscalYearStart: number; // Month (1-12)
  defaultMarkup: number;
  autoReorderEnabled: boolean;
  aiInsightsEnabled: boolean;
}

// Product & Inventory Models
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  specifications: Record<string, any>;
  unitOfMeasure: UnitOfMeasure;
  supplier: Supplier;
  costPrice: number;
  sellingPrice: number;
  markup: number;
  weight?: number;
  dimensions?: Dimensions;
  hazmatInfo?: HazmatInfo;
  sustainability?: SustainabilityInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
  attributes: CategoryAttribute[];
}

export interface CategoryAttribute {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  required: boolean;
  options?: string[];
}

export interface UnitOfMeasure {
  primary: string; // 'each', 'ft', 'yard', 'ton', etc.
  conversions: {
    unit: string;
    factor: number;
  }[];
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface HazmatInfo {
  isHazardous: boolean;
  unNumber?: string;
  shippingName?: string;
  hazardClass?: string;
  packingGroup?: string;
}

export interface SustainabilityInfo {
  carbonFootprint?: number;
  recyclable: boolean;
  sustainabilityRating?: number;
  certifications: string[];
}

// Inventory Management
export interface InventoryItem {
  id: string;
  productId: string;
  locationId: string;
  quantityOnHand: number;
  quantityAllocated: number;
  quantityAvailable: number;
  reorderPoint: number;
  maxStock: number;
  avgCost: number;
  lastCountDate: Date;
  bins: BinLocation[];
  serialNumbers?: string[];
  lotNumbers?: LotInfo[];
}

export interface BinLocation {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  shelf: string;
  quantity: number;
}

export interface LotInfo {
  lotNumber: string;
  quantity: number;
  expirationDate?: Date;
  receivedDate: Date;
  cost: number;
}

// Customer Management
export interface Customer {
  id: string;
  code: string;
  name: string;
  type: 'contractor' | 'retailer' | 'homeowner' | 'commercial';
  status: 'active' | 'inactive' | 'credit_hold';
  contactInfo: ContactInfo;
  billingAddress: Address;
  shippingAddresses: Address[];
  creditLimit: number;
  paymentTerms: PaymentTerms;
  priceLevel: string;
  salesRep: string;
  taxExempt: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  primaryContact: string;
  phone: string;
  email: string;
  website?: string;
  fax?: string;
}

export interface Address {
  id: string;
  type: 'billing' | 'shipping' | 'jobsite';
  name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface PaymentTerms {
  code: string;
  description: string;
  netDays: number;
  discountPercent?: number;
  discountDays?: number;
}

// Supplier Management
export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactInfo: ContactInfo;
  address: Address;
  paymentTerms: PaymentTerms;
  leadTime: number; // days
  minimumOrder?: number;
  preferredSupplier: boolean;
  performance: SupplierPerformance;
  contracts: SupplierContract[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierPerformance {
  onTimeDeliveryRate: number; // percentage
  qualityRating: number; // 1-10
  responseTime: number; // hours
  lastEvaluated: Date;
}

export interface SupplierContract {
  id: string;
  type: 'price_agreement' | 'volume_discount' | 'exclusivity';
  startDate: Date;
  endDate: Date;
  terms: Record<string, any>;
  isActive: boolean;
}

// Sales & Orders
export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerPO?: string;
  status: OrderStatus;
  orderDate: Date;
  requestedDate: Date;
  promisedDate?: Date;
  salesRep: string;
  billingAddress: Address;
  shippingAddress: Address;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'picking' 
  | 'packed' 
  | 'shipped' 
  | 'delivered' 
  | 'invoiced' 
  | 'paid' 
  | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  taxCode?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  type: 'cash' | 'check' | 'credit_card' | 'ach' | 'wire';
  amount: number;
  date: Date;
  reference: string;
  status: 'pending' | 'cleared' | 'failed';
}

export interface Shipment {
  id: string;
  trackingNumber?: string;
  carrier: string;
  service: string;
  weight?: number;
  shippedDate: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  items: ShipmentItem[];
}

export interface ShipmentItem {
  orderItemId: string;
  quantityShipped: number;
  serialNumbers?: string[];
  lotNumbers?: string[];
}

// Purchase Orders
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: PurchaseOrderItem[];
  receipts: Receipt[];
  approvals: Approval[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseOrderStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'sent' 
  | 'acknowledged' 
  | 'partially_received' 
  | 'received' 
  | 'closed' 
  | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  quantityReceived: number;
  notes?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  receivedDate: Date;
  receivedBy: string;
  items: ReceiptItem[];
  notes: string;
}

export interface ReceiptItem {
  poItemId: string;
  quantityReceived: number;
  unitCost: number;
  condition: 'good' | 'damaged' | 'defective';
  serialNumbers?: string[];
  lotNumbers?: string[];
}

export interface Approval {
  id: string;
  approver: string;
  level: number;
  status: 'pending' | 'approved' | 'rejected';
  date?: Date;
  comments?: string;
}

// Project Management
export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  customerId: string;
  status: ProjectStatus;
  type: 'residential' | 'commercial' | 'industrial' | 'infrastructure';
  startDate: Date;
  endDate: Date;
  budget: number;
  actualCost: number;
  profitMargin: number;
  phases: ProjectPhase[];
  materials: ProjectMaterial[];
  jobsiteAddress: Address;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 
  | 'planning' 
  | 'approved' 
  | 'in_progress' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled';

export interface ProjectPhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  budget: number;
  actualCost: number;
}

export interface ProjectMaterial {
  id: string;
  productId: string;
  phaseId?: string;
  quantityRequired: number;
  quantityAllocated: number;
  quantityDelivered: number;
  estimatedCost: number;
  actualCost: number;
}

// Financial Models
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  orderIds: string[];
  status: InvoiceStatus;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'viewed' 
  | 'partial_payment' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxCode?: string;
}

// AI & Analytics Models
export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number; // 0-1
  actionable: boolean;
  recommendations: string[];
  data: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export type InsightType = 
  | 'demand_forecast' 
  | 'inventory_optimization' 
  | 'price_opportunity' 
  | 'supplier_risk' 
  | 'customer_churn' 
  | 'cash_flow_prediction' 
  | 'seasonal_trend';

export interface DemandForecast {
  productId: string;
  locationId: string;
  period: 'week' | 'month' | 'quarter';
  forecastDate: Date;
  predictedDemand: number;
  confidence: number;
  factors: ForecastFactor[];
}

export interface ForecastFactor {
  type: 'seasonal' | 'trend' | 'event' | 'promotion';
  impact: number; // -1 to 1
  description: string;
}

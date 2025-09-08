// src/components/OrderEditForm.tsx
// React component for editing orders with line items and calculations

import React, { useState, useEffect } from 'react';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  notes?: string;
}

interface Order {
  id?: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  orderDate: Date;
  requiredDate?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  paymentMethod?: string;
  paymentTerms: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  notes?: string;
  internalNotes?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  salesRepId?: string;
  customFields?: Record<string, any>;
}

interface OrderEditFormProps {
  order?: Order | null;
  onSave: (order: Partial<Order>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({
  order,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<Order>>({
    customerId: '',
    customerName: '',
    status: 'PENDING',
    orderDate: new Date(),
    items: [],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    shippingCost: 0,
    totalAmount: 0,
    paymentStatus: 'PENDING',
    paymentTerms: 'Net 30',
    priority: 'NORMAL',
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    notes: '',
    internalNotes: '',
    customFields: {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sameAsBilling, setSameAsBilling] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData(order);
    }
  }, [order]);

  // Recalculate totals when items, tax rate, or shipping changes
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.taxRate, formData.shippingCost]);

  const calculateTotals = () => {
    if (!formData.items || formData.items.length === 0) {
      setFormData(prev => ({
        ...prev,
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0
      }));
      return;
    }

    const subtotal = formData.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = (itemTotal * item.discount) / 100;
      return sum + (itemTotal - discountAmount);
    }, 0);

    const taxAmount = (subtotal * (formData.taxRate || 0)) / 100;
    const totalAmount = subtotal + taxAmount + (formData.shippingCost || 0);

    setFormData(prev => ({
      ...prev,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId?.trim()) {
      newErrors.customerId = 'Customer is required';
    }

    if (!formData.customerName?.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.items || formData.items.length === 0) {
      newErrors.items = 'Order must have at least one item';
    }

    if (formData.taxRate !== undefined && (formData.taxRate < 0 || formData.taxRate > 100)) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }

    if (formData.shippingCost !== undefined && formData.shippingCost < 0) {
      newErrors.shippingCost = 'Shipping cost cannot be negative';
    }

    if (formData.requiredDate && formData.orderDate && formData.requiredDate < formData.orderDate) {
      newErrors.requiredDate = 'Required date cannot be before order date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleInputChange = (field: keyof Order) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked
      : e.target.type === 'date'
      ? new Date(e.target.value)
      : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: e.target.type === 'number' ? parseFloat(value as string) || 0 : value
    }));
  };

  const handleAddressChange = (addressType: 'billingAddress' | 'shippingAddress') => 
    (field: keyof Address) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          [field]: e.target.value
        }
      }));
    };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate item total
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const item = updatedItems[index];
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = (itemTotal * item.discount) / 100;
      updatedItems[index].totalPrice = Math.round((itemTotal - discountAmount) * 100) / 100;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    const newItem: OrderItem = {
      productId: '',
      productName: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      totalPrice: 0,
      notes: ''
    };

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items?.filter((_, i) => i !== index) || [];
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleSameAsBilling = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress }
      }));
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="order-edit-form">
      <div className="form-header">
        <h2>{order ? `Edit Order ${order.orderNumber}` : 'Create New Order'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="form-content">
        {/* Order Information */}
        <section className="form-section">
          <h3>Order Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input
                type="text"
                id="customerName"
                value={formData.customerName || ''}
                onChange={handleInputChange('customerName')}
                className={errors.customerName ? 'error' : ''}
              />
              {errors.customerName && <span className="error-message">{errors.customerName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status || 'PENDING'}
                onChange={handleInputChange('status')}
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="orderDate">Order Date</label>
              <input
                type="date"
                id="orderDate"
                value={formatDate(formData.orderDate)}
                onChange={handleInputChange('orderDate')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="requiredDate">Required Date</label>
              <input
                type="date"
                id="requiredDate"
                value={formatDate(formData.requiredDate)}
                onChange={handleInputChange('requiredDate')}
                className={errors.requiredDate ? 'error' : ''}
              />
              {errors.requiredDate && <span className="error-message">{errors.requiredDate}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={formData.priority || 'NORMAL'}
                onChange={handleInputChange('priority')}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paymentStatus">Payment Status</label>
              <select
                id="paymentStatus"
                value={formData.paymentStatus || 'PENDING'}
                onChange={handleInputChange('paymentStatus')}
              >
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>
        </section>

        {/* Order Items */}
        <section className="form-section">
          <h3>Order Items</h3>
          {errors.items && <span className="error-message">{errors.items}</span>}
          
          <div className="items-table">
            <div className="items-header">
              <span>Product</span>
              <span>SKU</span>
              <span>Qty</span>
              <span>Unit Price</span>
              <span>Discount %</span>
              <span>Total</span>
              <span>Actions</span>
            </div>
            
            {formData.items?.map((item, index) => (
              <div key={index} className="item-row">
                <input
                  type="text"
                  placeholder="Product name"
                  value={item.productName}
                  onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={item.sku || ''}
                  onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.discount}
                  onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                />
                <span className="item-total">${item.totalPrice.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="btn-remove-item"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button type="button" onClick={addItem} className="btn-add-item">
              Add Item
            </button>
          </div>
        </section>

        {/* Pricing */}
        <section className="form-section">
          <h3>Pricing</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="taxRate">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                id="taxRate"
                value={formData.taxRate || ''}
                onChange={handleInputChange('taxRate')}
                className={errors.taxRate ? 'error' : ''}
              />
              {errors.taxRate && <span className="error-message">{errors.taxRate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="shippingCost">Shipping Cost</label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="shippingCost"
                value={formData.shippingCost || ''}
                onChange={handleInputChange('shippingCost')}
                className={errors.shippingCost ? 'error' : ''}
              />
              {errors.shippingCost && <span className="error-message">{errors.shippingCost}</span>}
            </div>
          </div>

          <div className="pricing-summary">
            <div className="summary-line">
              <span>Subtotal:</span>
              <span>${formData.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-line">
              <span>Tax Amount:</span>
              <span>${formData.taxAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-line">
              <span>Shipping:</span>
              <span>${formData.shippingCost?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-line total-line">
              <span>Total Amount:</span>
              <span>${formData.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="form-section">
          <h3>Notes</h3>
          
          <div className="form-group">
            <label htmlFor="notes">Customer Notes</label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={handleInputChange('notes')}
              rows={3}
              placeholder="Notes visible to customer..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="internalNotes">Internal Notes</label>
            <textarea
              id="internalNotes"
              value={formData.internalNotes || ''}
              onChange={handleInputChange('internalNotes')}
              rows={3}
              placeholder="Internal notes for staff only..."
            />
          </div>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-save">
            {isLoading ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
          </button>
        </div>
      </form>
    </div>
  );
};

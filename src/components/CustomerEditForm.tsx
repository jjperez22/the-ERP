// src/components/CustomerEditForm.tsx
// React component for editing customer information

import React, { useState, useEffect } from 'react';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface Customer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  taxId?: string;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  customerType: 'Individual' | 'Business' | 'Contractor' | 'Supplier';
  paymentTerms: string;
  preferredContact: 'Email' | 'Phone' | 'Mail';
  tags: string[];
  notes?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  customFields?: Record<string, any>;
}

interface CustomerEditFormProps {
  customer?: Customer | null;
  onSave: (customer: Partial<Customer>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CustomerEditForm: React.FC<CustomerEditFormProps> = ({
  customer,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    taxId: '',
    creditLimit: 0,
    currentBalance: 0,
    isActive: true,
    customerType: 'Individual',
    paymentTerms: 'Net 30',
    preferredContact: 'Email',
    tags: [],
    notes: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    customFields: {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const [sameAsBlling, setSameAsBilling] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.creditLimit !== undefined && formData.creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit cannot be negative';
    }

    if (formData.customerType === 'Business' && !formData.company?.trim()) {
      newErrors.company = 'Company name is required for business customers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleInputChange = (field: keyof Customer) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked
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

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
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

  return (
    <div className="customer-edit-form">
      <div className="form-header">
        <h2>{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="form-content">
        {/* Basic Information */}
        <section className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name || ''}
                onChange={handleInputChange('name')}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="customerType">Customer Type</label>
              <select
                id="customerType"
                value={formData.customerType || 'Individual'}
                onChange={handleInputChange('customerType')}
              >
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
                <option value="Contractor">Contractor</option>
                <option value="Supplier">Supplier</option>
              </select>
            </div>
          </div>

          {formData.customerType === 'Business' && (
            <div className="form-group">
              <label htmlFor="company">Company Name *</label>
              <input
                type="text"
                id="company"
                value={formData.company || ''}
                onChange={handleInputChange('company')}
                className={errors.company ? 'error' : ''}
              />
              {errors.company && <span className="error-message">{errors.company}</span>}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email || ''}
                onChange={handleInputChange('email')}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone || ''}
                onChange={handleInputChange('phone')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="taxId">Tax ID</label>
            <input
              type="text"
              id="taxId"
              value={formData.taxId || ''}
              onChange={handleInputChange('taxId')}
            />
          </div>
        </section>

        {/* Financial Information */}
        <section className="form-section">
          <h3>Financial Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="creditLimit">Credit Limit</label>
              <input
                type="number"
                step="0.01"
                id="creditLimit"
                value={formData.creditLimit || ''}
                onChange={handleInputChange('creditLimit')}
                className={errors.creditLimit ? 'error' : ''}
              />
              {errors.creditLimit && <span className="error-message">{errors.creditLimit}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="paymentTerms">Payment Terms</label>
              <select
                id="paymentTerms"
                value={formData.paymentTerms || 'Net 30'}
                onChange={handleInputChange('paymentTerms')}
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="COD">Cash on Delivery</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>
          </div>

          {customer && (
            <div className="form-group">
              <label>Current Balance: ${formData.currentBalance?.toFixed(2) || '0.00'}</label>
              <small>Balance can be adjusted through the accounting module</small>
            </div>
          )}
        </section>

        {/* Billing Address */}
        <section className="form-section">
          <h3>Billing Address</h3>
          
          <div className="form-group">
            <label htmlFor="billingStreet">Street Address</label>
            <input
              type="text"
              id="billingStreet"
              value={formData.billingAddress?.street || ''}
              onChange={handleAddressChange('billingAddress')('street')}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="billingCity">City</label>
              <input
                type="text"
                id="billingCity"
                value={formData.billingAddress?.city || ''}
                onChange={handleAddressChange('billingAddress')('city')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="billingState">State</label>
              <input
                type="text"
                id="billingState"
                value={formData.billingAddress?.state || ''}
                onChange={handleAddressChange('billingAddress')('state')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="billingZip">ZIP Code</label>
              <input
                type="text"
                id="billingZip"
                value={formData.billingAddress?.zipCode || ''}
                onChange={handleAddressChange('billingAddress')('zipCode')}
              />
            </div>
          </div>
        </section>

        {/* Shipping Address */}
        <section className="form-section">
          <h3>Shipping Address</h3>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={sameAsBlling}
                onChange={(e) => handleSameAsBilling(e.target.checked)}
              />
              Same as billing address
            </label>
          </div>

          {!sameAsBlling && (
            <>
              <div className="form-group">
                <label htmlFor="shippingStreet">Street Address</label>
                <input
                  type="text"
                  id="shippingStreet"
                  value={formData.shippingAddress?.street || ''}
                  onChange={handleAddressChange('shippingAddress')('street')}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="shippingCity">City</label>
                  <input
                    type="text"
                    id="shippingCity"
                    value={formData.shippingAddress?.city || ''}
                    onChange={handleAddressChange('shippingAddress')('city')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="shippingState">State</label>
                  <input
                    type="text"
                    id="shippingState"
                    value={formData.shippingAddress?.state || ''}
                    onChange={handleAddressChange('shippingAddress')('state')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="shippingZip">ZIP Code</label>
                  <input
                    type="text"
                    id="shippingZip"
                    value={formData.shippingAddress?.zipCode || ''}
                    onChange={handleAddressChange('shippingAddress')('zipCode')}
                  />
                </div>
              </div>
            </>
          )}
        </section>

        {/* Communication Preferences */}
        <section className="form-section">
          <h3>Communication</h3>
          
          <div className="form-group">
            <label htmlFor="preferredContact">Preferred Contact Method</label>
            <select
              id="preferredContact"
              value={formData.preferredContact || 'Email'}
              onChange={handleInputChange('preferredContact')}
            >
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="Mail">Mail</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
              />
              <button type="button" onClick={handleTagAdd}>Add</button>
            </div>
            
            <div className="tags-list">
              {formData.tags?.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button type="button" onClick={() => handleTagRemove(tag)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={handleInputChange('notes')}
              rows={4}
              placeholder="Additional notes about this customer..."
            />
          </div>
        </section>

        {/* Status */}
        <section className="form-section">
          <h3>Status</h3>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive || false}
                onChange={handleInputChange('isActive')}
              />
              Active Customer
            </label>
          </div>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-save">
            {isLoading ? 'Saving...' : (customer ? 'Update Customer' : 'Create Customer')}
          </button>
        </div>
      </form>
    </div>
  );
};

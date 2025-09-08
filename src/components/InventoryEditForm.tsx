// src/components/InventoryEditForm.tsx
// React component for editing inventory items with all customizable fields

import React, { useState, useEffect } from 'react';

interface InventoryItem {
  id?: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  price: number;
  cost: number;
  stock: number;
  reservedStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  maxStock?: number;
  minStock?: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  location?: string;
  barcode?: string;
  isActive: boolean;
  isTracked: boolean;
  tags: string[];
  notes?: string;
  supplierId: string;
  customFields?: Record<string, any>;
  images: string[];
  documents: string[];
}

interface InventoryEditFormProps {
  item?: InventoryItem | null;
  onSave: (item: Partial<InventoryItem>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InventoryEditForm: React.FC<InventoryEditFormProps> = ({
  item,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    sku: '',
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    model: '',
    price: 0,
    cost: 0,
    stock: 0,
    reservedStock: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    maxStock: undefined,
    minStock: undefined,
    unit: 'pcs',
    weight: undefined,
    dimensions: '',
    location: '',
    barcode: '',
    isActive: true,
    isTracked: true,
    tags: [],
    notes: '',
    supplierId: '',
    customFields: {},
    images: [],
    documents: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku?.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.category?.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!formData.supplierId?.trim()) {
      newErrors.supplierId = 'Supplier is required';
    }
    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    if (formData.cost !== undefined && formData.cost < 0) {
      newErrors.cost = 'Cost cannot be negative';
    }
    if (formData.stock !== undefined && formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }
    if (formData.price !== undefined && formData.cost !== undefined && formData.price < formData.cost) {
      newErrors.price = 'Price should not be lower than cost';
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
      console.error('Error saving inventory item:', error);
    }
  };

  const handleInputChange = (field: keyof InventoryItem) => (
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

  return (
    <div className="inventory-edit-form">
      <div className="form-header">
        <h2>{item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="form-content">
        {/* Basic Information Section */}
        <section className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sku">SKU *</label>
              <input
                type="text"
                id="sku"
                value={formData.sku || ''}
                onChange={handleInputChange('sku')}
                disabled={!!item} // SKU cannot be changed after creation
                className={errors.sku ? 'error' : ''}
              />
              {errors.sku && <span className="error-message">{errors.sku}</span>}
            </div>

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
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={handleInputChange('description')}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={formData.category || ''}
                onChange={handleInputChange('category')}
                className={errors.category ? 'error' : ''}
              >
                <option value="">Select Category</option>
                <option value="Steel">Steel</option>
                <option value="Cement">Cement</option>
                <option value="Wood">Wood</option>
                <option value="Tools">Tools</option>
                <option value="Hardware">Hardware</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
              </select>
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="subcategory">Subcategory</label>
              <input
                type="text"
                id="subcategory"
                value={formData.subcategory || ''}
                onChange={handleInputChange('subcategory')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">Brand</label>
              <input
                type="text"
                id="brand"
                value={formData.brand || ''}
                onChange={handleInputChange('brand')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="model">Model</label>
              <input
                type="text"
                id="model"
                value={formData.model || ''}
                onChange={handleInputChange('model')}
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="form-section">
          <h3>Pricing</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cost">Cost</label>
              <input
                type="number"
                step="0.01"
                id="cost"
                value={formData.cost || ''}
                onChange={handleInputChange('cost')}
                className={errors.cost ? 'error' : ''}
              />
              {errors.cost && <span className="error-message">{errors.cost}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                type="number"
                step="0.01"
                id="price"
                value={formData.price || ''}
                onChange={handleInputChange('price')}
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
          </div>
        </section>

        {/* Stock Management Section */}
        <section className="form-section">
          <h3>Stock Management</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stock">Current Stock</label>
              <input
                type="number"
                id="stock"
                value={formData.stock || ''}
                onChange={handleInputChange('stock')}
                className={errors.stock ? 'error' : ''}
              />
              {errors.stock && <span className="error-message">{errors.stock}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit</label>
              <select
                id="unit"
                value={formData.unit || 'pcs'}
                onChange={handleInputChange('unit')}
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="m">Meters</option>
                <option value="m2">Square Meters</option>
                <option value="m3">Cubic Meters</option>
                <option value="l">Liters</option>
                <option value="bags">Bags</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reorderPoint">Reorder Point</label>
              <input
                type="number"
                id="reorderPoint"
                value={formData.reorderPoint || ''}
                onChange={handleInputChange('reorderPoint')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reorderQuantity">Reorder Quantity</label>
              <input
                type="number"
                id="reorderQuantity"
                value={formData.reorderQuantity || ''}
                onChange={handleInputChange('reorderQuantity')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="minStock">Min Stock</label>
              <input
                type="number"
                id="minStock"
                value={formData.minStock || ''}
                onChange={handleInputChange('minStock')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxStock">Max Stock</label>
              <input
                type="number"
                id="maxStock"
                value={formData.maxStock || ''}
                onChange={handleInputChange('maxStock')}
              />
            </div>
          </div>
        </section>

        {/* Physical Properties Section */}
        <section className="form-section">
          <h3>Physical Properties</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                id="weight"
                value={formData.weight || ''}
                onChange={handleInputChange('weight')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dimensions">Dimensions</label>
              <input
                type="text"
                id="dimensions"
                value={formData.dimensions || ''}
                onChange={handleInputChange('dimensions')}
                placeholder="e.g., 200x100x3000mm"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                value={formData.location || ''}
                onChange={handleInputChange('location')}
                placeholder="e.g., Warehouse A-1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="barcode">Barcode</label>
              <input
                type="text"
                id="barcode"
                value={formData.barcode || ''}
                onChange={handleInputChange('barcode')}
              />
            </div>
          </div>
        </section>

        {/* Tags Section */}
        <section className="form-section">
          <h3>Tags</h3>
          
          <div className="form-group">
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
        </section>

        {/* Status Section */}
        <section className="form-section">
          <h3>Status</h3>
          
          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={handleInputChange('isActive')}
                />
                Active
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isTracked || false}
                  onChange={handleInputChange('isTracked')}
                />
                Tracked
              </label>
            </div>
          </div>
        </section>

        {/* Notes Section */}
        <section className="form-section">
          <h3>Additional Information</h3>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={handleInputChange('notes')}
              rows={4}
              placeholder="Additional notes about this item..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="supplierId">Supplier ID *</label>
            <input
              type="text"
              id="supplierId"
              value={formData.supplierId || ''}
              onChange={handleInputChange('supplierId')}
              className={errors.supplierId ? 'error' : ''}
            />
            {errors.supplierId && <span className="error-message">{errors.supplierId}</span>}
          </div>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-save">
            {isLoading ? 'Saving...' : (item ? 'Update Item' : 'Create Item')}
          </button>
        </div>
      </form>
    </div>
  );
};

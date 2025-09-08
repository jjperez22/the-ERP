/**
 * Low-Code Workflow Builder - Part 2A2a: Basic ERP Data Node Types
 * ERP-specific nodes for data operations
 */

class ERPWorkflowNodes {
    constructor(workflowFoundation) {
        this.workflowFoundation = workflowFoundation;
        this.init();
    }

    init() {
        this.registerERPNodes();
        console.log('🔧 ERP Workflow Nodes initialized');
    }

    registerERPNodes() {
        // Get Product node
        this.workflowFoundation.registerNodeType('get-product', {
            name: 'Get Product',
            category: 'erp-data',
            icon: '📦',
            inputs: ['input'],
            outputs: ['product', 'not-found'],
            properties: {
                sku: { type: 'string', default: '' },
                searchField: { type: 'select', options: ['sku', 'id', 'name'], default: 'sku' }
            },
            execute: async (context) => {
                const { sku, searchField } = context.properties;
                const searchValue = sku || context.input;
                
                context.log(`Searching for product by ${searchField}: ${searchValue}`);
                
                try {
                    // Get products data from global app data
                    const products = window.productsData || [];
                    let product = null;
                    
                    switch (searchField) {
                        case 'sku':
                            product = products.find(p => p.sku === searchValue);
                            break;
                        case 'id':
                            product = products.find(p => p.id === searchValue);
                            break;
                        case 'name':
                            product = products.find(p => p.name.toLowerCase().includes(searchValue.toLowerCase()));
                            break;
                    }
                    
                    if (product) {
                        context.log(`Product found: ${product.name}`);
                        return { product: product };
                    } else {
                        context.log(`Product not found: ${searchValue}`);
                        return { 'not-found': searchValue };
                    }
                    
                } catch (error) {
                    context.log(`Error getting product: ${error.message}`);
                    return { 'not-found': searchValue };
                }
            }
        });

        // Get Customer node
        this.workflowFoundation.registerNodeType('get-customer', {
            name: 'Get Customer',
            category: 'erp-data',
            icon: '👤',
            inputs: ['input'],
            outputs: ['customer', 'not-found'],
            properties: {
                customerId: { type: 'string', default: '' },
                searchField: { type: 'select', options: ['id', 'name', 'email'], default: 'id' }
            },
            execute: async (context) => {
                const { customerId, searchField } = context.properties;
                const searchValue = customerId || context.input;
                
                context.log(`Searching for customer by ${searchField}: ${searchValue}`);
                
                try {
                    // Get customers data from global app data
                    const customers = window.customersData || [];
                    let customer = null;
                    
                    switch (searchField) {
                        case 'id':
                            customer = customers.find(c => c.id === searchValue);
                            break;
                        case 'name':
                            customer = customers.find(c => c.name.toLowerCase().includes(searchValue.toLowerCase()));
                            break;
                        case 'email':
                            customer = customers.find(c => c.email === searchValue);
                            break;
                    }
                    
                    if (customer) {
                        context.log(`Customer found: ${customer.name}`);
                        return { customer: customer };
                    } else {
                        context.log(`Customer not found: ${searchValue}`);
                        return { 'not-found': searchValue };
                    }
                    
                } catch (error) {
                    context.log(`Error getting customer: ${error.message}`);
                    return { 'not-found': searchValue };
                }
            }
        });

        // Check Stock Level node
        this.workflowFoundation.registerNodeType('check-stock', {
            name: 'Check Stock Level',
            category: 'erp-data',
            icon: '📊',
            inputs: ['product'],
            outputs: ['low-stock', 'normal-stock', 'out-of-stock'],
            properties: {
                lowStockThreshold: { type: 'number', default: 10 },
                usePercentage: { type: 'boolean', default: false },
                percentageThreshold: { type: 'number', default: 20 }
            },
            execute: async (context) => {
                const { lowStockThreshold, usePercentage, percentageThreshold } = context.properties;
                const product = context.input;
                
                if (!product || !product.stock) {
                    context.log('No product data or stock information available');
                    return { 'out-of-stock': product };
                }
                
                const currentStock = parseInt(product.stock) || 0;
                context.log(`Checking stock for ${product.name}: ${currentStock} units`);
                
                if (currentStock === 0) {
                    context.log(`Product is out of stock`);
                    return { 'out-of-stock': product };
                }
                
                let isLowStock = false;
                
                if (usePercentage && product.maxStock) {
                    const percentage = (currentStock / product.maxStock) * 100;
                    isLowStock = percentage <= percentageThreshold;
                    context.log(`Stock percentage: ${percentage.toFixed(1)}%`);
                } else {
                    isLowStock = currentStock <= lowStockThreshold;
                }
                
                if (isLowStock) {
                    context.log(`Low stock detected for ${product.name}`);
                    return { 'low-stock': product };
                } else {
                    context.log(`Normal stock level for ${product.name}`);
                    return { 'normal-stock': product };
                }
            }
        });

        // Calculate Price node
        this.workflowFoundation.registerNodeType('calculate-price', {
            name: 'Calculate Price',
            category: 'erp-data',
            icon: '💰',
            inputs: ['input'],
            outputs: ['result'],
            properties: {
                basePrice: { type: 'number', default: 0 },
                quantity: { type: 'number', default: 1 },
                discountPercent: { type: 'number', default: 0 },
                taxPercent: { type: 'number', default: 0 },
                useInputPrice: { type: 'boolean', default: true }
            },
            execute: async (context) => {
                const { basePrice, quantity, discountPercent, taxPercent, useInputPrice } = context.properties;
                const input = context.input;
                
                let price = basePrice;
                let qty = quantity;
                
                // Use input data if available
                if (useInputPrice && input) {
                    if (typeof input === 'number') {
                        price = input;
                    } else if (input.price) {
                        price = parseFloat(input.price);
                    }
                    
                    if (input.quantity) {
                        qty = parseInt(input.quantity);
                    }
                }
                
                context.log(`Calculating price: ${price} x ${qty} units`);
                
                // Calculate subtotal
                let subtotal = price * qty;
                context.log(`Subtotal: $${subtotal.toFixed(2)}`);
                
                // Apply discount
                let discount = 0;
                if (discountPercent > 0) {
                    discount = subtotal * (discountPercent / 100);
                    subtotal -= discount;
                    context.log(`Discount (${discountPercent}%): -$${discount.toFixed(2)}`);
                }
                
                // Apply tax
                let tax = 0;
                if (taxPercent > 0) {
                    tax = subtotal * (taxPercent / 100);
                    context.log(`Tax (${taxPercent}%): +$${tax.toFixed(2)}`);
                }
                
                const total = subtotal + tax;
                context.log(`Final total: $${total.toFixed(2)}`);
                
                const result = {
                    basePrice: price,
                    quantity: qty,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    discount: parseFloat(discount.toFixed(2)),
                    tax: parseFloat(tax.toFixed(2)),
                    total: parseFloat(total.toFixed(2)),
                    discountPercent: discountPercent,
                    taxPercent: taxPercent
                };
                
                return { result: result };
            }
        });

        // Filter Products node
        this.workflowFoundation.registerNodeType('filter-products', {
            name: 'Filter Products',
            category: 'erp-data',
            icon: '🔍',
            inputs: ['products'],
            outputs: ['filtered', 'empty'],
            properties: {
                category: { type: 'string', default: '' },
                minPrice: { type: 'number', default: 0 },
                maxPrice: { type: 'number', default: 0 },
                inStock: { type: 'boolean', default: false },
                searchTerm: { type: 'string', default: '' }
            },
            execute: async (context) => {
                const { category, minPrice, maxPrice, inStock, searchTerm } = context.properties;
                let products = context.input;
                
                // If input is not an array, get all products
                if (!Array.isArray(products)) {
                    products = window.productsData || [];
                }
                
                context.log(`Filtering ${products.length} products`);
                
                let filtered = products;
                
                // Filter by category
                if (category) {
                    filtered = filtered.filter(p => 
                        p.category && p.category.toLowerCase().includes(category.toLowerCase())
                    );
                    context.log(`After category filter: ${filtered.length} products`);
                }
                
                // Filter by price range
                if (minPrice > 0) {
                    filtered = filtered.filter(p => parseFloat(p.price || 0) >= minPrice);
                    context.log(`After min price filter: ${filtered.length} products`);
                }
                
                if (maxPrice > 0) {
                    filtered = filtered.filter(p => parseFloat(p.price || 0) <= maxPrice);
                    context.log(`After max price filter: ${filtered.length} products`);
                }
                
                // Filter by stock status
                if (inStock) {
                    filtered = filtered.filter(p => parseInt(p.stock || 0) > 0);
                    context.log(`After stock filter: ${filtered.length} products`);
                }
                
                // Filter by search term
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    filtered = filtered.filter(p => 
                        (p.name && p.name.toLowerCase().includes(term)) ||
                        (p.sku && p.sku.toLowerCase().includes(term)) ||
                        (p.description && p.description.toLowerCase().includes(term))
                    );
                    context.log(`After search term filter: ${filtered.length} products`);
                }
                
                if (filtered.length > 0) {
                    context.log(`Filter completed: ${filtered.length} products found`);
                    return { filtered: filtered };
                } else {
                    context.log('No products match the filter criteria');
                    return { empty: [] };
                }
            }
        });

        // Update Stock node
        this.workflowFoundation.registerNodeType('update-stock', {
            name: 'Update Stock',
            category: 'erp-data',
            icon: '📝',
            inputs: ['product'],
            outputs: ['updated', 'error'],
            properties: {
                operation: { type: 'select', options: ['add', 'subtract', 'set'], default: 'add' },
                quantity: { type: 'number', default: 1 },
                reason: { type: 'string', default: 'Workflow update' }
            },
            execute: async (context) => {
                const { operation, quantity, reason } = context.properties;
                const product = context.input;
                
                if (!product || !product.sku) {
                    context.log('No product data provided');
                    return { error: 'No product data' };
                }
                
                const currentStock = parseInt(product.stock || 0);
                let newStock = currentStock;
                
                switch (operation) {
                    case 'add':
                        newStock = currentStock + quantity;
                        break;
                    case 'subtract':
                        newStock = Math.max(0, currentStock - quantity);
                        break;
                    case 'set':
                        newStock = quantity;
                        break;
                }
                
                context.log(`Updating stock for ${product.name}: ${currentStock} → ${newStock} (${operation} ${quantity})`);
                
                try {
                    // Update the product data
                    const updatedProduct = { ...product, stock: newStock };
                    
                    // Update in global products array if available
                    if (window.productsData) {
                        const index = window.productsData.findIndex(p => p.sku === product.sku);
                        if (index !== -1) {
                            window.productsData[index].stock = newStock;
                        }
                    }
                    
                    // Save to offline storage if available
                    if (window.saveProductOffline) {
                        await window.saveProductOffline(updatedProduct);
                    }
                    
                    context.log(`Stock updated successfully. Reason: ${reason}`);
                    return { updated: updatedProduct };
                    
                } catch (error) {
                    context.log(`Error updating stock: ${error.message}`);
                    return { error: error.message };
                }
            }
        });

        // Format Currency node
        this.workflowFoundation.registerNodeType('format-currency', {
            name: 'Format Currency',
            category: 'erp-utility',
            icon: '💲',
            inputs: ['input'],
            outputs: ['formatted'],
            properties: {
                currency: { type: 'select', options: ['USD', 'EUR', 'GBP', 'CAD'], default: 'USD' },
                locale: { type: 'string', default: 'en-US' },
                includeSymbol: { type: 'boolean', default: true }
            },
            execute: async (context) => {
                const { currency, locale, includeSymbol } = context.properties;
                const input = context.input;
                
                let amount = 0;
                if (typeof input === 'number') {
                    amount = input;
                } else if (input && input.total) {
                    amount = input.total;
                } else if (input && input.price) {
                    amount = input.price;
                } else {
                    amount = parseFloat(input) || 0;
                }
                
                try {
                    let formatted;
                    
                    if (includeSymbol) {
                        formatted = new Intl.NumberFormat(locale, {
                            style: 'currency',
                            currency: currency
                        }).format(amount);
                    } else {
                        formatted = new Intl.NumberFormat(locale, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }).format(amount);
                    }
                    
                    context.log(`Formatted ${amount} as ${formatted}`);
                    return { formatted: formatted };
                    
                } catch (error) {
                    context.log(`Error formatting currency: ${error.message}`);
                    return { formatted: amount.toString() };
                }
            }
        });
    }
}

// Auto-register ERP nodes when WorkflowFoundation is available
if (typeof window !== 'undefined' && window.WorkflowFoundation) {
    window.ERPWorkflowNodes = ERPWorkflowNodes;
    
    // Auto-initialize if workflow foundation exists
    document.addEventListener('DOMContentLoaded', () => {
        if (window.workflowFoundation) {
            new ERPWorkflowNodes(window.workflowFoundation);
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ERPWorkflowNodes;
} else {
    window.ERPWorkflowNodes = ERPWorkflowNodes;
}

console.log('🔧 ERP Workflow Nodes (Part 2A2a) loaded - Basic ERP Data Node Types');

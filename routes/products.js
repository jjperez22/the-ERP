module.exports = (app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId }) => {

    // Get all products with filtering and pagination
    app.get('/api/products', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                category,
                supplier,
                location,
                lowStock,
                search,
                sortBy = 'name',
                sortOrder = 'asc'
            } = req.query;

            let products = [...appData.products];

            // Apply filters
            if (category) {
                products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
            }

            if (supplier) {
                products = products.filter(p => p.supplier.toLowerCase().includes(supplier.toLowerCase()));
            }

            if (location) {
                products = products.filter(p => p.location.toLowerCase().includes(location.toLowerCase()));
            }

            if (lowStock === 'true') {
                products = products.filter(p => p.stock <= p.reorderPoint);
            }

            if (search) {
                const searchTerm = search.toLowerCase();
                products = products.filter(p => 
                    p.name.toLowerCase().includes(searchTerm) ||
                    p.sku.toLowerCase().includes(searchTerm) ||
                    p.category.toLowerCase().includes(searchTerm) ||
                    p.supplier.toLowerCase().includes(searchTerm)
                );
            }

            // Apply sorting
            products.sort((a, b) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];
                
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (sortOrder === 'desc') {
                    return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
                } else {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }
            });

            // Apply pagination
            const startIndex = (parseInt(page) - 1) * parseInt(limit);
            const endIndex = startIndex + parseInt(limit);
            const paginatedProducts = products.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    products: paginatedProducts,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(products.length / parseInt(limit)),
                        totalItems: products.length,
                        itemsPerPage: parseInt(limit),
                        hasNextPage: endIndex < products.length,
                        hasPrevPage: startIndex > 0
                    }
                }
            });

        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch products',
                code: 'FETCH_PRODUCTS_ERROR'
            });
        }
    });

    // Get single product by ID
    app.get('/api/products/:id', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { id } = req.params;
            const product = appData.products.find(p => p.id === id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                data: { product }
            });

        } catch (error) {
            console.error('Get product error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch product',
                code: 'FETCH_PRODUCT_ERROR'
            });
        }
    });

    // Create new product
    app.post('/api/products', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const {
                sku,
                name,
                category,
                price,
                cost,
                stock = 0,
                reorderPoint = 10,
                supplier,
                location = 'Warehouse A'
            } = req.body;

            // Validate required fields
            if (!sku || !name || !category || price === undefined || cost === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: sku, name, category, price, cost',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            // Check if SKU already exists
            const existingProduct = appData.products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
            if (existingProduct) {
                return res.status(409).json({
                    success: false,
                    error: 'Product with this SKU already exists',
                    code: 'SKU_EXISTS'
                });
            }

            // Validate numeric fields
            if (price < 0 || cost < 0 || stock < 0 || reorderPoint < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Price, cost, stock, and reorder point must be non-negative',
                    code: 'INVALID_NUMERIC_VALUES'
                });
            }

            const newProduct = {
                id: generateId('P'),
                sku: sku.trim(),
                name: name.trim(),
                category: category.trim(),
                price: parseFloat(price),
                cost: parseFloat(cost),
                stock: parseInt(stock),
                reorderPoint: parseInt(reorderPoint),
                supplier: supplier ? supplier.trim() : 'Unknown Supplier',
                location: location.trim(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            appData.products.push(newProduct);

            logAuditEvent(req.user.id, 'PRODUCT_CREATED', 'product', newProduct.id, {
                sku: newProduct.sku,
                name: newProduct.name,
                category: newProduct.category
            });

            res.status(201).json({
                success: true,
                data: { product: newProduct }
            });

        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create product',
                code: 'CREATE_PRODUCT_ERROR'
            });
        }
    });

    // Update product
    app.put('/api/products/:id', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const product = appData.products.find(p => p.id === id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                });
            }

            // If updating SKU, check for duplicates
            if (updates.sku && updates.sku !== product.sku) {
                const existingProduct = appData.products.find(p => 
                    p.sku.toLowerCase() === updates.sku.toLowerCase() && p.id !== id
                );
                if (existingProduct) {
                    return res.status(409).json({
                        success: false,
                        error: 'Product with this SKU already exists',
                        code: 'SKU_EXISTS'
                    });
                }
            }

            // Validate numeric fields if provided
            const numericFields = ['price', 'cost', 'stock', 'reorderPoint'];
            for (const field of numericFields) {
                if (updates[field] !== undefined && updates[field] < 0) {
                    return res.status(400).json({
                        success: false,
                        error: `${field} must be non-negative`,
                        code: 'INVALID_NUMERIC_VALUE'
                    });
                }
            }

            // Store original values for audit log
            const originalValues = { ...product };

            // Apply updates
            const allowedUpdates = ['sku', 'name', 'category', 'price', 'cost', 'stock', 'reorderPoint', 'supplier', 'location'];
            const changes = {};

            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined && updates[field] !== product[field]) {
                    changes[field] = {
                        from: product[field],
                        to: updates[field]
                    };
                    
                    if (field === 'price' || field === 'cost') {
                        product[field] = parseFloat(updates[field]);
                    } else if (field === 'stock' || field === 'reorderPoint') {
                        product[field] = parseInt(updates[field]);
                    } else {
                        product[field] = typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
                    }
                }
            });

            product.updatedAt = new Date();

            if (Object.keys(changes).length > 0) {
                logAuditEvent(req.user.id, 'PRODUCT_UPDATED', 'product', product.id, {
                    changes,
                    sku: product.sku,
                    name: product.name
                });
            }

            res.json({
                success: true,
                data: { product }
            });

        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update product',
                code: 'UPDATE_PRODUCT_ERROR'
            });
        }
    });

    // Delete product
    app.delete('/api/products/:id', authenticateToken, requirePermissions(['delete']), async (req, res) => {
        try {
            const { id } = req.params;
            const productIndex = appData.products.findIndex(p => p.id === id);

            if (productIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                });
            }

            const product = appData.products[productIndex];

            // Check if product is referenced in any orders
            const referencedInOrders = appData.orders.some(order => 
                order.items && order.items.some(item => item.productId === id)
            );

            if (referencedInOrders) {
                return res.status(409).json({
                    success: false,
                    error: 'Cannot delete product that is referenced in orders',
                    code: 'PRODUCT_REFERENCED'
                });
            }

            appData.products.splice(productIndex, 1);

            logAuditEvent(req.user.id, 'PRODUCT_DELETED', 'product', id, {
                sku: product.sku,
                name: product.name,
                category: product.category
            });

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });

        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete product',
                code: 'DELETE_PRODUCT_ERROR'
            });
        }
    });

    // Bulk update stock levels
    app.post('/api/products/bulk-update-stock', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { updates } = req.body;

            if (!Array.isArray(updates)) {
                return res.status(400).json({
                    success: false,
                    error: 'Updates must be an array',
                    code: 'INVALID_UPDATES_FORMAT'
                });
            }

            const results = {
                updated: [],
                failed: []
            };

            for (const update of updates) {
                const { id, sku, stock } = update;

                // Find product by ID or SKU
                const product = appData.products.find(p => p.id === id || p.sku === sku);

                if (!product) {
                    results.failed.push({
                        id: id || 'unknown',
                        sku: sku || 'unknown',
                        error: 'Product not found'
                    });
                    continue;
                }

                if (stock === undefined || stock < 0) {
                    results.failed.push({
                        id: product.id,
                        sku: product.sku,
                        error: 'Invalid stock value'
                    });
                    continue;
                }

                const oldStock = product.stock;
                product.stock = parseInt(stock);
                product.updatedAt = new Date();

                results.updated.push({
                    id: product.id,
                    sku: product.sku,
                    name: product.name,
                    oldStock,
                    newStock: product.stock
                });
            }

            logAuditEvent(req.user.id, 'PRODUCTS_BULK_UPDATE_STOCK', 'product', 'bulk', {
                updatedCount: results.updated.length,
                failedCount: results.failed.length
            });

            res.json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Bulk update stock error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to bulk update stock',
                code: 'BULK_UPDATE_STOCK_ERROR'
            });
        }
    });

    // Get products by category
    app.get('/api/products/category/:category', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { category } = req.params;
            const products = appData.products.filter(p => 
                p.category.toLowerCase() === category.toLowerCase()
            );

            res.json({
                success: true,
                data: {
                    category,
                    products,
                    count: products.length
                }
            });

        } catch (error) {
            console.error('Get products by category error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch products by category',
                code: 'FETCH_PRODUCTS_BY_CATEGORY_ERROR'
            });
        }
    });

    // Get low stock products
    app.get('/api/products/low-stock', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const lowStockProducts = appData.products.filter(p => p.stock <= p.reorderPoint);

            res.json({
                success: true,
                data: {
                    products: lowStockProducts,
                    count: lowStockProducts.length
                }
            });

        } catch (error) {
            console.error('Get low stock products error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch low stock products',
                code: 'FETCH_LOW_STOCK_ERROR'
            });
        }
    });

    // Get product analytics
    app.get('/api/products/analytics', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const totalProducts = appData.products.length;
            const totalValue = appData.products.reduce((sum, p) => sum + (p.price * p.stock), 0);
            const totalCost = appData.products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
            const lowStockCount = appData.products.filter(p => p.stock <= p.reorderPoint).length;
            const outOfStockCount = appData.products.filter(p => p.stock === 0).length;

            // Category distribution
            const categoryStats = appData.products.reduce((acc, product) => {
                acc[product.category] = (acc[product.category] || 0) + 1;
                return acc;
            }, {});

            // Top categories by value
            const categoryValues = appData.products.reduce((acc, product) => {
                const value = product.price * product.stock;
                acc[product.category] = (acc[product.category] || 0) + value;
                return acc;
            }, {});

            const topCategoriesByValue = Object.entries(categoryValues)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, value]) => ({ category, value }));

            // Supplier distribution
            const supplierStats = appData.products.reduce((acc, product) => {
                acc[product.supplier] = (acc[product.supplier] || 0) + 1;
                return acc;
            }, {});

            res.json({
                success: true,
                data: {
                    summary: {
                        totalProducts,
                        totalValue,
                        totalCost,
                        grossMargin: totalValue - totalCost,
                        marginPercentage: totalValue > 0 ? ((totalValue - totalCost) / totalValue * 100).toFixed(2) : 0,
                        lowStockCount,
                        outOfStockCount
                    },
                    categoryStats,
                    topCategoriesByValue,
                    supplierStats
                }
            });

        } catch (error) {
            console.error('Get product analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch product analytics',
                code: 'FETCH_ANALYTICS_ERROR'
            });
        }
    });

};

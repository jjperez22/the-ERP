module.exports = (app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId }) => {

    // Get all orders with filtering and pagination
    app.get('/api/orders', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                status,
                customerId,
                dateFrom,
                dateTo,
                search,
                sortBy = 'date',
                sortOrder = 'desc'
            } = req.query;

            let orders = [...appData.orders];

            // Apply filters
            if (status) {
                orders = orders.filter(o => o.status.toLowerCase() === status.toLowerCase());
            }

            if (customerId) {
                orders = orders.filter(o => o.customerId === customerId);
            }

            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                orders = orders.filter(o => new Date(o.date || o.createdAt) >= fromDate);
            }

            if (dateTo) {
                const toDate = new Date(dateTo);
                orders = orders.filter(o => new Date(o.date || o.createdAt) <= toDate);
            }

            if (search) {
                const searchTerm = search.toLowerCase();
                orders = orders.filter(o => 
                    o.id.toLowerCase().includes(searchTerm) ||
                    o.customer.toLowerCase().includes(searchTerm) ||
                    o.status.toLowerCase().includes(searchTerm)
                );
            }

            // Apply sorting
            orders.sort((a, b) => {
                let aValue, bValue;
                
                if (sortBy === 'date') {
                    aValue = new Date(a.date || a.createdAt);
                    bValue = new Date(b.date || b.createdAt);
                } else {
                    aValue = a[sortBy];
                    bValue = b[sortBy];
                    
                    if (typeof aValue === 'string') {
                        aValue = aValue.toLowerCase();
                        bValue = bValue.toLowerCase();
                    }
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
            const paginatedOrders = orders.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    orders: paginatedOrders,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(orders.length / parseInt(limit)),
                        totalItems: orders.length,
                        itemsPerPage: parseInt(limit),
                        hasNextPage: endIndex < orders.length,
                        hasPrevPage: startIndex > 0
                    }
                }
            });

        } catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch orders',
                code: 'FETCH_ORDERS_ERROR'
            });
        }
    });

    // Get single order by ID
    app.get('/api/orders/:id', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { id } = req.params;
            const order = appData.orders.find(o => o.id === id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                });
            }

            // Enrich order with product details if items exist
            let enrichedOrder = { ...order };
            if (order.items && Array.isArray(order.items)) {
                enrichedOrder.items = order.items.map(item => {
                    const product = appData.products.find(p => p.id === item.productId);
                    return {
                        ...item,
                        product: product ? {
                            id: product.id,
                            sku: product.sku,
                            name: product.name,
                            category: product.category
                        } : null
                    };
                });
            }

            res.json({
                success: true,
                data: { order: enrichedOrder }
            });

        } catch (error) {
            console.error('Get order error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch order',
                code: 'FETCH_ORDER_ERROR'
            });
        }
    });

    // Create new order
    app.post('/api/orders', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const {
                customerId,
                items = [],
                status = 'Processing',
                date,
                notes,
                priority = 'Standard'
            } = req.body;

            // Validate required fields
            if (!customerId || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Customer ID and at least one item are required',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            // Find customer
            const customer = appData.customers.find(c => c.id === customerId);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found',
                    code: 'CUSTOMER_NOT_FOUND'
                });
            }

            // Validate and calculate items
            let calculatedTotal = 0;
            const processedItems = [];

            for (const item of items) {
                const { productId, quantity, unitPrice } = item;

                if (!productId || !quantity || quantity <= 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Each item must have productId and positive quantity',
                        code: 'INVALID_ITEM_DATA'
                    });
                }

                // Find product
                const product = appData.products.find(p => p.id === productId);
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        error: `Product not found: ${productId}`,
                        code: 'PRODUCT_NOT_FOUND'
                    });
                }

                // Use provided unit price or product price
                const finalUnitPrice = unitPrice !== undefined ? parseFloat(unitPrice) : product.price;
                const itemTotal = finalUnitPrice * quantity;

                processedItems.push({
                    productId,
                    quantity: parseInt(quantity),
                    unitPrice: finalUnitPrice,
                    total: itemTotal
                });

                calculatedTotal += itemTotal;
            }

            const newOrder = {
                id: generateId('ORD'),
                customerId,
                customer: customer.name,
                date: date || new Date().toISOString().split('T')[0],
                total: calculatedTotal,
                status,
                items: processedItems,
                notes: notes || null,
                priority,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            appData.orders.push(newOrder);

            // Update customer's last order date
            customer.lastOrder = newOrder.date;
            customer.updatedAt = new Date();

            // Update product stock levels
            for (const item of processedItems) {
                const product = appData.products.find(p => p.id === item.productId);
                if (product) {
                    product.stock = Math.max(0, product.stock - item.quantity);
                    product.updatedAt = new Date();
                }
            }

            logAuditEvent(req.user.id, 'ORDER_CREATED', 'order', newOrder.id, {
                customer: customer.name,
                total: calculatedTotal,
                itemCount: processedItems.length
            });

            res.status(201).json({
                success: true,
                data: { order: newOrder }
            });

        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create order',
                code: 'CREATE_ORDER_ERROR'
            });
        }
    });

    // Update order
    app.put('/api/orders/:id', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const order = appData.orders.find(o => o.id === id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                });
            }

            // Store original values for audit log
            const originalOrder = { ...order };
            const changes = {};

            // Handle status update
            if (updates.status && updates.status !== order.status) {
                const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Pending'];
                if (!validStatuses.includes(updates.status)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid status value',
                        code: 'INVALID_STATUS'
                    });
                }
                changes.status = { from: order.status, to: updates.status };
                order.status = updates.status;
            }

            // Handle items update (recalculate total)
            if (updates.items && Array.isArray(updates.items)) {
                let newTotal = 0;
                const processedItems = [];

                for (const item of updates.items) {
                    const { productId, quantity, unitPrice } = item;

                    if (!productId || !quantity || quantity <= 0) {
                        return res.status(400).json({
                            success: false,
                            error: 'Each item must have productId and positive quantity',
                            code: 'INVALID_ITEM_DATA'
                        });
                    }

                    const product = appData.products.find(p => p.id === productId);
                    if (!product) {
                        return res.status(404).json({
                            success: false,
                            error: `Product not found: ${productId}`,
                            code: 'PRODUCT_NOT_FOUND'
                        });
                    }

                    const finalUnitPrice = unitPrice !== undefined ? parseFloat(unitPrice) : product.price;
                    const itemTotal = finalUnitPrice * quantity;

                    processedItems.push({
                        productId,
                        quantity: parseInt(quantity),
                        unitPrice: finalUnitPrice,
                        total: itemTotal
                    });

                    newTotal += itemTotal;
                }

                changes.items = { from: order.items, to: processedItems };
                changes.total = { from: order.total, to: newTotal };
                order.items = processedItems;
                order.total = newTotal;
            }

            // Handle other simple field updates
            const simpleFields = ['notes', 'priority'];
            simpleFields.forEach(field => {
                if (updates[field] !== undefined && updates[field] !== order[field]) {
                    changes[field] = { from: order[field], to: updates[field] };
                    order[field] = updates[field];
                }
            });

            order.updatedAt = new Date();

            if (Object.keys(changes).length > 0) {
                logAuditEvent(req.user.id, 'ORDER_UPDATED', 'order', order.id, {
                    changes,
                    customer: order.customer
                });
            }

            res.json({
                success: true,
                data: { order }
            });

        } catch (error) {
            console.error('Update order error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update order',
                code: 'UPDATE_ORDER_ERROR'
            });
        }
    });

    // Delete order
    app.delete('/api/orders/:id', authenticateToken, requirePermissions(['delete']), async (req, res) => {
        try {
            const { id } = req.params;
            const orderIndex = appData.orders.findIndex(o => o.id === id);

            if (orderIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                });
            }

            const order = appData.orders[orderIndex];

            // Check if order can be deleted (not shipped or delivered)
            if (order.status === 'Shipped' || order.status === 'Delivered') {
                return res.status(409).json({
                    success: false,
                    error: 'Cannot delete shipped or delivered orders',
                    code: 'ORDER_CANNOT_BE_DELETED'
                });
            }

            // Restore product stock if order was processing
            if (order.status === 'Processing' && order.items) {
                for (const item of order.items) {
                    const product = appData.products.find(p => p.id === item.productId);
                    if (product) {
                        product.stock += item.quantity;
                        product.updatedAt = new Date();
                    }
                }
            }

            appData.orders.splice(orderIndex, 1);

            logAuditEvent(req.user.id, 'ORDER_DELETED', 'order', id, {
                customer: order.customer,
                total: order.total,
                status: order.status
            });

            res.json({
                success: true,
                message: 'Order deleted successfully'
            });

        } catch (error) {
            console.error('Delete order error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete order',
                code: 'DELETE_ORDER_ERROR'
            });
        }
    });

    // Get orders by status
    app.get('/api/orders/status/:status', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { status } = req.params;
            const orders = appData.orders.filter(o => 
                o.status.toLowerCase() === status.toLowerCase()
            );

            res.json({
                success: true,
                data: {
                    status,
                    orders,
                    count: orders.length
                }
            });

        } catch (error) {
            console.error('Get orders by status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch orders by status',
                code: 'FETCH_ORDERS_BY_STATUS_ERROR'
            });
        }
    });

    // Get order analytics
    app.get('/api/orders/analytics', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const totalOrders = appData.orders.length;
            const totalValue = appData.orders.reduce((sum, o) => sum + (o.total || 0), 0);
            const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

            // Status distribution
            const statusDistribution = appData.orders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {});

            // Orders by month (last 12 months)
            const monthlyOrders = {};
            const now = new Date();
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
                monthlyOrders[monthKey] = 0;
            }

            appData.orders.forEach(order => {
                const orderDate = new Date(order.date || order.createdAt);
                const monthKey = orderDate.toISOString().substring(0, 7);
                if (monthlyOrders.hasOwnProperty(monthKey)) {
                    monthlyOrders[monthKey]++;
                }
            });

            // Revenue by month
            const monthlyRevenue = {};
            Object.keys(monthlyOrders).forEach(month => {
                monthlyRevenue[month] = 0;
            });

            appData.orders.forEach(order => {
                const orderDate = new Date(order.date || order.createdAt);
                const monthKey = orderDate.toISOString().substring(0, 7);
                if (monthlyRevenue.hasOwnProperty(monthKey)) {
                    monthlyRevenue[monthKey] += order.total || 0;
                }
            });

            // Top customers by order value
            const customerTotals = appData.orders.reduce((acc, order) => {
                acc[order.customer] = (acc[order.customer] || 0) + (order.total || 0);
                return acc;
            }, {});

            const topCustomers = Object.entries(customerTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([customer, total]) => ({ customer, total }));

            // Recent orders (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentOrders = appData.orders.filter(order => {
                const orderDate = new Date(order.date || order.createdAt);
                return orderDate >= thirtyDaysAgo;
            });

            res.json({
                success: true,
                data: {
                    summary: {
                        totalOrders,
                        totalValue,
                        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
                        recentOrdersCount: recentOrders.length,
                        recentOrdersValue: recentOrders.reduce((sum, o) => sum + (o.total || 0), 0)
                    },
                    statusDistribution,
                    monthlyOrders,
                    monthlyRevenue,
                    topCustomers
                }
            });

        } catch (error) {
            console.error('Get order analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch order analytics',
                code: 'FETCH_ANALYTICS_ERROR'
            });
        }
    });

    // Update order status
    app.patch('/api/orders/:id/status', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Pending'];
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status value',
                    code: 'INVALID_STATUS',
                    validStatuses
                });
            }

            const order = appData.orders.find(o => o.id === id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                });
            }

            const oldStatus = order.status;
            order.status = status;
            order.updatedAt = new Date();

            if (notes) {
                order.notes = notes;
            }

            // Handle stock adjustments for status changes
            if (oldStatus === 'Processing' && status === 'Cancelled' && order.items) {
                // Restore stock for cancelled orders
                for (const item of order.items) {
                    const product = appData.products.find(p => p.id === item.productId);
                    if (product) {
                        product.stock += item.quantity;
                        product.updatedAt = new Date();
                    }
                }
            }

            logAuditEvent(req.user.id, 'ORDER_STATUS_UPDATED', 'order', order.id, {
                customer: order.customer,
                oldStatus,
                newStatus: status,
                notes
            });

            res.json({
                success: true,
                data: { 
                    order: {
                        id: order.id,
                        status: order.status,
                        updatedAt: order.updatedAt
                    },
                    statusChanged: oldStatus !== status
                }
            });

        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update order status',
                code: 'UPDATE_ORDER_STATUS_ERROR'
            });
        }
    });

};

module.exports = (app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId }) => {

    // Get all customers with filtering and pagination
    app.get('/api/customers', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                type,
                status,
                churnRisk,
                search,
                sortBy = 'name',
                sortOrder = 'asc'
            } = req.query;

            let customers = [...appData.customers];

            // Apply filters
            if (type) {
                customers = customers.filter(c => c.type.toLowerCase() === type.toLowerCase());
            }

            if (status) {
                customers = customers.filter(c => c.status.toLowerCase() === status.toLowerCase());
            }

            if (churnRisk) {
                customers = customers.filter(c => c.churnRisk.toLowerCase() === churnRisk.toLowerCase());
            }

            if (search) {
                const searchTerm = search.toLowerCase();
                customers = customers.filter(c => 
                    c.name.toLowerCase().includes(searchTerm) ||
                    (c.email && c.email.toLowerCase().includes(searchTerm)) ||
                    (c.phone && c.phone.includes(searchTerm)) ||
                    c.type.toLowerCase().includes(searchTerm)
                );
            }

            // Apply sorting
            customers.sort((a, b) => {
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
            const paginatedCustomers = customers.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    customers: paginatedCustomers,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(customers.length / parseInt(limit)),
                        totalItems: customers.length,
                        itemsPerPage: parseInt(limit),
                        hasNextPage: endIndex < customers.length,
                        hasPrevPage: startIndex > 0
                    }
                }
            });

        } catch (error) {
            console.error('Get customers error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch customers',
                code: 'FETCH_CUSTOMERS_ERROR'
            });
        }
    });

    // Get single customer by ID
    app.get('/api/customers/:id', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { id } = req.params;
            const customer = appData.customers.find(c => c.id === id);

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found',
                    code: 'CUSTOMER_NOT_FOUND'
                });
            }

            // Get customer's orders
            const customerOrders = appData.orders.filter(o => o.customerId === id);
            
            res.json({
                success: true,
                data: { 
                    customer: {
                        ...customer,
                        ordersHistory: customerOrders
                    }
                }
            });

        } catch (error) {
            console.error('Get customer error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch customer',
                code: 'FETCH_CUSTOMER_ERROR'
            });
        }
    });

    // Create new customer
    app.post('/api/customers', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const {
                name,
                type,
                email,
                phone,
                address,
                paymentTerms = 'Net 30',
                status = 'Active',
                churnRisk = 'Low',
                revenue = 0,
                orders = 0
            } = req.body;

            // Validate required fields
            if (!name || !type) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: name, type',
                    code: 'MISSING_REQUIRED_FIELDS'
                });
            }

            // Validate email format if provided
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid email format',
                        code: 'INVALID_EMAIL'
                    });
                }

                // Check if email already exists
                const existingCustomer = appData.customers.find(c => 
                    c.email && c.email.toLowerCase() === email.toLowerCase()
                );
                if (existingCustomer) {
                    return res.status(409).json({
                        success: false,
                        error: 'Customer with this email already exists',
                        code: 'EMAIL_EXISTS'
                    });
                }
            }

            // Validate numeric fields
            if (revenue < 0 || orders < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Revenue and orders must be non-negative',
                    code: 'INVALID_NUMERIC_VALUES'
                });
            }

            const newCustomer = {
                id: generateId('C'),
                name: name.trim(),
                type: type.trim(),
                email: email ? email.trim().toLowerCase() : null,
                phone: phone ? phone.trim() : null,
                address: address ? address.trim() : null,
                paymentTerms: paymentTerms.trim(),
                status: status.trim(),
                churnRisk: churnRisk.trim(),
                revenue: parseFloat(revenue),
                orders: parseInt(orders),
                lastOrder: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            appData.customers.push(newCustomer);

            logAuditEvent(req.user.id, 'CUSTOMER_CREATED', 'customer', newCustomer.id, {
                name: newCustomer.name,
                type: newCustomer.type,
                email: newCustomer.email
            });

            res.status(201).json({
                success: true,
                data: { customer: newCustomer }
            });

        } catch (error) {
            console.error('Create customer error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create customer',
                code: 'CREATE_CUSTOMER_ERROR'
            });
        }
    });

    // Update customer
    app.put('/api/customers/:id', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const customer = appData.customers.find(c => c.id === id);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found',
                    code: 'CUSTOMER_NOT_FOUND'
                });
            }

            // If updating email, check for duplicates
            if (updates.email && updates.email !== customer.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(updates.email)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid email format',
                        code: 'INVALID_EMAIL'
                    });
                }

                const existingCustomer = appData.customers.find(c => 
                    c.email && c.email.toLowerCase() === updates.email.toLowerCase() && c.id !== id
                );
                if (existingCustomer) {
                    return res.status(409).json({
                        success: false,
                        error: 'Customer with this email already exists',
                        code: 'EMAIL_EXISTS'
                    });
                }
            }

            // Validate numeric fields if provided
            const numericFields = ['revenue', 'orders'];
            for (const field of numericFields) {
                if (updates[field] !== undefined && updates[field] < 0) {
                    return res.status(400).json({
                        success: false,
                        error: `${field} must be non-negative`,
                        code: 'INVALID_NUMERIC_VALUE'
                    });
                }
            }

            // Apply updates
            const allowedUpdates = ['name', 'type', 'email', 'phone', 'address', 'paymentTerms', 'status', 'churnRisk', 'revenue', 'orders'];
            const changes = {};

            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined && updates[field] !== customer[field]) {
                    changes[field] = {
                        from: customer[field],
                        to: updates[field]
                    };
                    
                    if (field === 'revenue') {
                        customer[field] = parseFloat(updates[field]);
                    } else if (field === 'orders') {
                        customer[field] = parseInt(updates[field]);
                    } else if (field === 'email' && updates[field]) {
                        customer[field] = updates[field].toLowerCase();
                    } else {
                        customer[field] = typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
                    }
                }
            });

            customer.updatedAt = new Date();

            if (Object.keys(changes).length > 0) {
                logAuditEvent(req.user.id, 'CUSTOMER_UPDATED', 'customer', customer.id, {
                    changes,
                    name: customer.name
                });
            }

            res.json({
                success: true,
                data: { customer }
            });

        } catch (error) {
            console.error('Update customer error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update customer',
                code: 'UPDATE_CUSTOMER_ERROR'
            });
        }
    });

    // Delete customer
    app.delete('/api/customers/:id', authenticateToken, requirePermissions(['delete']), async (req, res) => {
        try {
            const { id } = req.params;
            const customerIndex = appData.customers.findIndex(c => c.id === id);

            if (customerIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found',
                    code: 'CUSTOMER_NOT_FOUND'
                });
            }

            const customer = appData.customers[customerIndex];

            // Check if customer has orders
            const customerOrders = appData.orders.filter(o => o.customerId === id);
            if (customerOrders.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Cannot delete customer with existing orders',
                    code: 'CUSTOMER_HAS_ORDERS',
                    data: {
                        orderCount: customerOrders.length
                    }
                });
            }

            appData.customers.splice(customerIndex, 1);

            logAuditEvent(req.user.id, 'CUSTOMER_DELETED', 'customer', id, {
                name: customer.name,
                type: customer.type
            });

            res.json({
                success: true,
                message: 'Customer deleted successfully'
            });

        } catch (error) {
            console.error('Delete customer error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete customer',
                code: 'DELETE_CUSTOMER_ERROR'
            });
        }
    });

    // Get customers by type
    app.get('/api/customers/type/:type', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { type } = req.params;
            const customers = appData.customers.filter(c => 
                c.type.toLowerCase() === type.toLowerCase()
            );

            res.json({
                success: true,
                data: {
                    type,
                    customers,
                    count: customers.length
                }
            });

        } catch (error) {
            console.error('Get customers by type error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch customers by type',
                code: 'FETCH_CUSTOMERS_BY_TYPE_ERROR'
            });
        }
    });

    // Get high-risk customers
    app.get('/api/customers/high-risk', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const highRiskCustomers = appData.customers.filter(c => c.churnRisk === 'High');

            res.json({
                success: true,
                data: {
                    customers: highRiskCustomers,
                    count: highRiskCustomers.length
                }
            });

        } catch (error) {
            console.error('Get high-risk customers error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch high-risk customers',
                code: 'FETCH_HIGH_RISK_ERROR'
            });
        }
    });

    // Get customer analytics
    app.get('/api/customers/analytics', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const totalCustomers = appData.customers.length;
            const activeCustomers = appData.customers.filter(c => c.status === 'Active').length;
            const totalRevenue = appData.customers.reduce((sum, c) => sum + (c.revenue || 0), 0);
            const totalOrders = appData.customers.reduce((sum, c) => sum + (c.orders || 0), 0);

            // Customer type distribution
            const typeDistribution = appData.customers.reduce((acc, customer) => {
                acc[customer.type] = (acc[customer.type] || 0) + 1;
                return acc;
            }, {});

            // Churn risk distribution
            const churnRiskDistribution = appData.customers.reduce((acc, customer) => {
                acc[customer.churnRisk] = (acc[customer.churnRisk] || 0) + 1;
                return acc;
            }, {});

            // Revenue by customer type
            const revenueByType = appData.customers.reduce((acc, customer) => {
                acc[customer.type] = (acc[customer.type] || 0) + (customer.revenue || 0);
                return acc;
            }, {});

            // Top customers by revenue
            const topCustomersByRevenue = appData.customers
                .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
                .slice(0, 10)
                .map(customer => ({
                    id: customer.id,
                    name: customer.name,
                    type: customer.type,
                    revenue: customer.revenue || 0,
                    orders: customer.orders || 0,
                    churnRisk: customer.churnRisk
                }));

            // Average revenue per customer
            const avgRevenue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
            const avgOrders = totalCustomers > 0 ? totalOrders / totalCustomers : 0;

            res.json({
                success: true,
                data: {
                    summary: {
                        totalCustomers,
                        activeCustomers,
                        inactiveCustomers: totalCustomers - activeCustomers,
                        totalRevenue,
                        totalOrders,
                        avgRevenue: parseFloat(avgRevenue.toFixed(2)),
                        avgOrders: parseFloat(avgOrders.toFixed(2))
                    },
                    typeDistribution,
                    churnRiskDistribution,
                    revenueByType,
                    topCustomersByRevenue
                }
            });

        } catch (error) {
            console.error('Get customer analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch customer analytics',
                code: 'FETCH_ANALYTICS_ERROR'
            });
        }
    });

    // Update customer churn risk assessment
    app.post('/api/customers/:id/assess-churn-risk', authenticateToken, requirePermissions(['write']), async (req, res) => {
        try {
            const { id } = req.params;
            const customer = appData.customers.find(c => c.id === id);

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found',
                    code: 'CUSTOMER_NOT_FOUND'
                });
            }

            // Simple churn risk assessment algorithm
            let riskScore = 0;

            // Factor 1: Recent order activity
            const customerOrders = appData.orders.filter(o => o.customerId === id);
            const recentOrders = customerOrders.filter(o => {
                const orderDate = new Date(o.date || o.createdAt);
                const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
                return daysSinceOrder <= 90; // Last 90 days
            });

            if (recentOrders.length === 0) riskScore += 30;
            else if (recentOrders.length <= 2) riskScore += 15;

            // Factor 2: Revenue trend (simplified)
            if (customer.revenue < 10000) riskScore += 20;
            else if (customer.revenue < 50000) riskScore += 10;

            // Factor 3: Order frequency
            if (customer.orders < 5) riskScore += 15;
            else if (customer.orders < 15) riskScore += 8;

            // Factor 4: Payment terms (Net 45+ is riskier)
            if (customer.paymentTerms?.includes('45') || customer.paymentTerms?.includes('60')) {
                riskScore += 10;
            }

            // Determine risk level
            let newChurnRisk;
            if (riskScore >= 40) newChurnRisk = 'High';
            else if (riskScore >= 20) newChurnRisk = 'Medium';
            else newChurnRisk = 'Low';

            const oldChurnRisk = customer.churnRisk;
            customer.churnRisk = newChurnRisk;
            customer.updatedAt = new Date();

            logAuditEvent(req.user.id, 'CUSTOMER_CHURN_RISK_ASSESSED', 'customer', customer.id, {
                name: customer.name,
                oldRisk: oldChurnRisk,
                newRisk: newChurnRisk,
                riskScore
            });

            res.json({
                success: true,
                data: {
                    customer: {
                        id: customer.id,
                        name: customer.name,
                        churnRisk: newChurnRisk,
                        riskScore,
                        assessmentDate: new Date()
                    },
                    assessment: {
                        riskFactors: {
                            recentOrderActivity: recentOrders.length,
                            revenueLevel: customer.revenue,
                            orderFrequency: customer.orders,
                            paymentTerms: customer.paymentTerms
                        },
                        riskChanged: oldChurnRisk !== newChurnRisk
                    }
                }
            });

        } catch (error) {
            console.error('Assess churn risk error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to assess churn risk',
                code: 'CHURN_RISK_ASSESSMENT_ERROR'
            });
        }
    });

    // Get customer order history
    app.get('/api/customers/:id/orders', authenticateToken, requirePermissions(['read']), async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const customer = appData.customers.find(c => c.id === id);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    error: 'Customer not found',
                    code: 'CUSTOMER_NOT_FOUND'
                });
            }

            const customerOrders = appData.orders
                .filter(o => o.customerId === id)
                .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

            // Apply pagination
            const startIndex = (parseInt(page) - 1) * parseInt(limit);
            const endIndex = startIndex + parseInt(limit);
            const paginatedOrders = customerOrders.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    customer: {
                        id: customer.id,
                        name: customer.name,
                        type: customer.type
                    },
                    orders: paginatedOrders,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(customerOrders.length / parseInt(limit)),
                        totalItems: customerOrders.length,
                        itemsPerPage: parseInt(limit),
                        hasNextPage: endIndex < customerOrders.length,
                        hasPrevPage: startIndex > 0
                    }
                }
            });

        } catch (error) {
            console.error('Get customer orders error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch customer orders',
                code: 'FETCH_CUSTOMER_ORDERS_ERROR'
            });
        }
    });

};

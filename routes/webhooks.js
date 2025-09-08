module.exports = (app, { appData, authenticateToken, requirePermissions, logAuditEvent, generateId }) => {

    // Create webhook endpoint
    app.post('/api/webhooks', authenticateToken, requirePermissions(['admin']), async (req, res) => {
        try {
            const {
                url,
                events = [],
                active = true,
                description
            } = req.body;

            if (!url || !Array.isArray(events) || events.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'URL and at least one event type are required',
                    code: 'MISSING_WEBHOOK_DATA'
                });
            }

            // Validate URL format
            try {
                new URL(url);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid URL format',
                    code: 'INVALID_URL'
                });
            }

            const webhook = {
                id: generateId('webhook_'),
                url,
                events,
                active,
                description: description || null,
                secret: generateId('whsec_'),
                createdAt: new Date(),
                updatedAt: new Date(),
                lastTriggered: null,
                deliveryCount: 0,
                failureCount: 0
            };

            if (!appData.webhooks) {
                appData.webhooks = [];
            }

            appData.webhooks.push(webhook);

            logAuditEvent(req.user.id, 'WEBHOOK_CREATED', 'webhook', webhook.id, {
                url,
                events,
                active
            });

            res.status(201).json({
                success: true,
                data: { webhook }
            });

        } catch (error) {
            console.error('Create webhook error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create webhook',
                code: 'CREATE_WEBHOOK_ERROR'
            });
        }
    });

    // Get all webhooks
    app.get('/api/webhooks', authenticateToken, requirePermissions(['admin']), async (req, res) => {
        try {
            const webhooks = appData.webhooks || [];
            
            res.json({
                success: true,
                data: { webhooks }
            });

        } catch (error) {
            console.error('Get webhooks error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch webhooks',
                code: 'FETCH_WEBHOOKS_ERROR'
            });
        }
    });

    // Update webhook
    app.put('/api/webhooks/:id', authenticateToken, requirePermissions(['admin']), async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            if (!appData.webhooks) {
                appData.webhooks = [];
            }

            const webhook = appData.webhooks.find(w => w.id === id);
            if (!webhook) {
                return res.status(404).json({
                    success: false,
                    error: 'Webhook not found',
                    code: 'WEBHOOK_NOT_FOUND'
                });
            }

            // Validate URL if being updated
            if (updates.url) {
                try {
                    new URL(updates.url);
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid URL format',
                        code: 'INVALID_URL'
                    });
                }
            }

            // Apply updates
            const allowedUpdates = ['url', 'events', 'active', 'description'];
            const changes = {};

            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined && updates[field] !== webhook[field]) {
                    changes[field] = { from: webhook[field], to: updates[field] };
                    webhook[field] = updates[field];
                }
            });

            webhook.updatedAt = new Date();

            if (Object.keys(changes).length > 0) {
                logAuditEvent(req.user.id, 'WEBHOOK_UPDATED', 'webhook', webhook.id, { changes });
            }

            res.json({
                success: true,
                data: { webhook }
            });

        } catch (error) {
            console.error('Update webhook error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update webhook',
                code: 'UPDATE_WEBHOOK_ERROR'
            });
        }
    });

    // Delete webhook
    app.delete('/api/webhooks/:id', authenticateToken, requirePermissions(['admin']), async (req, res) => {
        try {
            const { id } = req.params;

            if (!appData.webhooks) {
                appData.webhooks = [];
            }

            const webhookIndex = appData.webhooks.findIndex(w => w.id === id);
            if (webhookIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Webhook not found',
                    code: 'WEBHOOK_NOT_FOUND'
                });
            }

            const webhook = appData.webhooks[webhookIndex];
            appData.webhooks.splice(webhookIndex, 1);

            logAuditEvent(req.user.id, 'WEBHOOK_DELETED', 'webhook', id, {
                url: webhook.url,
                events: webhook.events
            });

            res.json({
                success: true,
                message: 'Webhook deleted successfully'
            });

        } catch (error) {
            console.error('Delete webhook error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete webhook',
                code: 'DELETE_WEBHOOK_ERROR'
            });
        }
    });

    // Webhook receiver endpoints for third-party systems
    
    // QuickBooks webhook receiver
    app.post('/api/webhooks/quickbooks', async (req, res) => {
        try {
            const signature = req.headers['intuit-signature'];
            const payload = req.body;

            // In production, verify webhook signature here
            console.log('QuickBooks webhook received:', payload);

            // Process QuickBooks webhook data
            if (payload.eventNotifications) {
                for (const notification of payload.eventNotifications) {
                    for (const entity of notification.dataChangeEvent?.entities || []) {
                        await processQuickBooksEntity(entity, notification.realmId);
                    }
                }
            }

            // Trigger internal webhooks
            await triggerWebhooks('quickbooks.data_changed', {
                source: 'QuickBooks',
                data: payload,
                timestamp: new Date()
            });

            res.status(200).json({ success: true });

        } catch (error) {
            console.error('QuickBooks webhook error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    });

    // Salesforce webhook receiver
    app.post('/api/webhooks/salesforce', async (req, res) => {
        try {
            const payload = req.body;
            console.log('Salesforce webhook received:', payload);

            // Process Salesforce webhook data
            if (payload.records) {
                for (const record of payload.records) {
                    await processSalesforceRecord(record);
                }
            }

            // Trigger internal webhooks
            await triggerWebhooks('salesforce.record_updated', {
                source: 'Salesforce',
                data: payload,
                timestamp: new Date()
            });

            res.status(200).json({ success: true });

        } catch (error) {
            console.error('Salesforce webhook error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    });

    // Shopify webhook receiver
    app.post('/api/webhooks/shopify', async (req, res) => {
        try {
            const topic = req.headers['x-shopify-topic'];
            const payload = req.body;

            console.log(`Shopify webhook received (${topic}):`, payload);

            // Process different Shopify webhook types
            switch (topic) {
                case 'orders/create':
                case 'orders/updated':
                    await processShopifyOrder(payload);
                    break;
                case 'products/create':
                case 'products/update':
                    await processShopifyProduct(payload);
                    break;
                case 'customers/create':
                case 'customers/update':
                    await processShopifyCustomer(payload);
                    break;
            }

            // Trigger internal webhooks
            await triggerWebhooks(`shopify.${topic?.replace('/', '.')}`, {
                source: 'Shopify',
                topic,
                data: payload,
                timestamp: new Date()
            });

            res.status(200).json({ success: true });

        } catch (error) {
            console.error('Shopify webhook error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    });

    // Manual webhook trigger for testing
    app.post('/api/webhooks/trigger/:event', authenticateToken, requirePermissions(['admin']), async (req, res) => {
        try {
            const { event } = req.params;
            const { data = {} } = req.body;

            const payload = {
                event,
                data,
                triggeredBy: req.user.id,
                timestamp: new Date()
            };

            await triggerWebhooks(event, payload);

            logAuditEvent(req.user.id, 'WEBHOOK_TRIGGERED_MANUALLY', 'webhook', event, { event, data });

            res.json({
                success: true,
                data: {
                    event,
                    triggered: true,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            console.error('Manual webhook trigger error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to trigger webhook',
                code: 'TRIGGER_WEBHOOK_ERROR'
            });
        }
    });

    // Helper functions

    async function processQuickBooksEntity(entity, realmId) {
        // Process QuickBooks entity changes
        console.log(`Processing QuickBooks ${entity.name} change for realm ${realmId}:`, entity);
        
        // Update local data based on QuickBooks changes
        // This is a simplified example - in production you'd sync actual data
        if (entity.name === 'Customer') {
            // Update customer data
        } else if (entity.name === 'Item') {
            // Update product/item data
        }
    }

    async function processSalesforceRecord(record) {
        // Process Salesforce record changes
        console.log('Processing Salesforce record:', record);
        
        // Update local customer/lead data based on Salesforce changes
        if (record.sobjectType === 'Contact' || record.sobjectType === 'Lead') {
            // Update customer data
        }
    }

    async function processShopifyOrder(order) {
        // Process Shopify order
        console.log('Processing Shopify order:', order);
        
        // Create or update order in local system
        const existingOrder = appData.orders.find(o => o.externalId === order.id?.toString());
        
        if (!existingOrder && order.id) {
            // Create new order from Shopify
            const newOrder = {
                id: generateId('ORD'),
                externalId: order.id.toString(),
                customer: order.customer?.first_name + ' ' + order.customer?.last_name || 'Unknown',
                date: new Date(order.created_at).toISOString().split('T')[0],
                total: parseFloat(order.total_price) || 0,
                status: mapShopifyOrderStatus(order.fulfillment_status),
                items: order.line_items?.length || 0,
                source: 'Shopify',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            appData.orders.push(newOrder);
        }
    }

    async function processShopifyProduct(product) {
        // Process Shopify product
        console.log('Processing Shopify product:', product);
        
        // Create or update product in local system
        const existingProduct = appData.products.find(p => p.externalId === product.id?.toString());
        
        if (!existingProduct && product.id && product.variants?.[0]) {
            const variant = product.variants[0];
            const newProduct = {
                id: generateId('P'),
                externalId: product.id.toString(),
                sku: variant.sku || `SHOP-${product.id}`,
                name: product.title || 'Unknown Product',
                category: product.product_type || 'General',
                price: parseFloat(variant.price) || 0,
                cost: 0, // Shopify doesn't provide cost
                stock: parseInt(variant.inventory_quantity) || 0,
                reorderPoint: 10,
                supplier: product.vendor || 'Shopify',
                location: 'Online Store',
                source: 'Shopify',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            appData.products.push(newProduct);
        }
    }

    async function processShopifyCustomer(customer) {
        // Process Shopify customer
        console.log('Processing Shopify customer:', customer);
        
        // Create or update customer in local system
        const existingCustomer = appData.customers.find(c => c.email === customer.email);
        
        if (!existingCustomer && customer.email) {
            const newCustomer = {
                id: generateId('C'),
                name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
                type: 'Online Customer',
                email: customer.email,
                phone: customer.phone || null,
                address: customer.default_address ? 
                    `${customer.default_address.address1}, ${customer.default_address.city}, ${customer.default_address.province}` : null,
                paymentTerms: 'Immediate',
                status: 'Active',
                churnRisk: 'Low',
                revenue: parseFloat(customer.total_spent) || 0,
                orders: parseInt(customer.orders_count) || 0,
                lastOrder: customer.last_order_id ? new Date().toISOString().split('T')[0] : null,
                source: 'Shopify',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            appData.customers.push(newCustomer);
        }
    }

    function mapShopifyOrderStatus(fulfillmentStatus) {
        switch (fulfillmentStatus) {
            case 'fulfilled': return 'Delivered';
            case 'partial': return 'Shipped';
            case 'unfulfilled': return 'Processing';
            default: return 'Pending';
        }
    }

    async function triggerWebhooks(event, payload) {
        if (!appData.webhooks) return;

        const relevantWebhooks = appData.webhooks.filter(w => 
            w.active && w.events.includes(event)
        );

        for (const webhook of relevantWebhooks) {
            try {
                // In production, you would make actual HTTP requests to webhook URLs
                console.log(`Would trigger webhook ${webhook.id} for event ${event}:`, {
                    url: webhook.url,
                    payload
                });

                webhook.lastTriggered = new Date();
                webhook.deliveryCount++;

                // Simulate webhook delivery (in production, use actual HTTP client)
                // await fetch(webhook.url, {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         'X-Webhook-Signature': generateWebhookSignature(payload, webhook.secret)
                //     },
                //     body: JSON.stringify(payload)
                // });

            } catch (error) {
                console.error(`Webhook ${webhook.id} delivery failed:`, error);
                webhook.failureCount++;
            }
        }
    }

    function generateWebhookSignature(payload, secret) {
        // In production, generate proper HMAC signature
        const crypto = require('crypto');
        return crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }

};

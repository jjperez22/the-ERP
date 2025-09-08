// services/WorkflowEngine.js
// Simple workflow automation engine for basic business processes
// Handles if-then rules for invoice approval, order processing, etc.

class WorkflowEngine {
    constructor() {
        this.isInitialized = false;
        this.enabled = true;
        this.rules = [];
        this.executionLog = [];
        this.config = {
            maxLogEntries: 1000,
            enableLogging: true,
            retryAttempts: 3,
            retryDelay: 1000 // ms
        };
    }

    // Initialize the workflow engine
    async initialize() {
        try {
            console.log('🔄 Initializing Workflow Engine...');
            
            // Load saved rules from localStorage
            this.loadRules();
            
            // Load configuration
            this.loadConfiguration();
            
            // Register default rules
            this.registerDefaultRules();
            
            this.isInitialized = true;
            console.log('✅ Workflow Engine initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Workflow Engine:', error);
            return false;
        }
    }

    // Register a new workflow rule
    registerRule(rule) {
        if (!this.validateRule(rule)) {
            throw new Error('Invalid rule format');
        }
        
        // Add unique ID if not present
        if (!rule.id) {
            rule.id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Add metadata
        rule.createdAt = new Date().toISOString();
        rule.enabled = rule.enabled !== false; // Default to true
        rule.executionCount = 0;
        rule.lastExecuted = null;
        
        this.rules.push(rule);
        this.saveRules();
        
        this.log('info', `Rule registered: ${rule.name}`, { ruleId: rule.id });
        return rule.id;
    }

    // Remove a workflow rule
    removeRule(ruleId) {
        const index = this.rules.findIndex(rule => rule.id === ruleId);
        if (index !== -1) {
            const removedRule = this.rules.splice(index, 1)[0];
            this.saveRules();
            this.log('info', `Rule removed: ${removedRule.name}`, { ruleId });
            return true;
        }
        return false;
    }

    // Enable/disable a specific rule
    toggleRule(ruleId, enabled) {
        const rule = this.rules.find(rule => rule.id === ruleId);
        if (rule) {
            rule.enabled = enabled;
            this.saveRules();
            this.log('info', `Rule ${enabled ? 'enabled' : 'disabled'}: ${rule.name}`, { ruleId });
            return true;
        }
        return false;
    }

    // Execute workflows based on event and data
    async executeWorkflows(eventType, eventData) {
        if (!this.isInitialized || !this.enabled) {
            return { executed: 0, results: [] };
        }

        const results = [];
        let executedCount = 0;

        // Find matching rules for this event type
        const matchingRules = this.rules.filter(rule => 
            rule.enabled && 
            rule.trigger.event === eventType
        );

        for (const rule of matchingRules) {
            try {
                // Check if conditions are met
                if (this.evaluateConditions(rule.conditions, eventData)) {
                    // Execute actions
                    const actionResults = await this.executeActions(rule.actions, eventData);
                    
                    // Update rule metadata
                    rule.executionCount++;
                    rule.lastExecuted = new Date().toISOString();
                    
                    results.push({
                        ruleId: rule.id,
                        ruleName: rule.name,
                        success: true,
                        actions: actionResults
                    });
                    
                    executedCount++;
                    
                    this.log('info', `Rule executed: ${rule.name}`, { 
                        ruleId: rule.id, 
                        eventType, 
                        results: actionResults 
                    });
                }
            } catch (error) {
                results.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    success: false,
                    error: error.message
                });
                
                this.log('error', `Rule execution failed: ${rule.name}`, { 
                    ruleId: rule.id, 
                    error: error.message 
                });
            }
        }

        // Save updated rule metadata
        if (executedCount > 0) {
            this.saveRules();
        }

        return { executed: executedCount, results };
    }

    // Evaluate rule conditions
    evaluateConditions(conditions, data) {
        if (!conditions || conditions.length === 0) {
            return true; // No conditions means always execute
        }

        return conditions.every(condition => {
            const { field, operator, value } = condition;
            const fieldValue = this.getNestedValue(data, field);

            switch (operator) {
                case 'equals':
                    return fieldValue == value;
                case 'not_equals':
                    return fieldValue != value;
                case 'greater_than':
                    return parseFloat(fieldValue) > parseFloat(value);
                case 'less_than':
                    return parseFloat(fieldValue) < parseFloat(value);
                case 'greater_equal':
                    return parseFloat(fieldValue) >= parseFloat(value);
                case 'less_equal':
                    return parseFloat(fieldValue) <= parseFloat(value);
                case 'contains':
                    return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
                case 'not_contains':
                    return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
                case 'in':
                    return Array.isArray(value) && value.includes(fieldValue);
                case 'not_in':
                    return Array.isArray(value) && !value.includes(fieldValue);
                case 'exists':
                    return fieldValue !== undefined && fieldValue !== null;
                case 'not_exists':
                    return fieldValue === undefined || fieldValue === null;
                default:
                    console.warn(`Unknown operator: ${operator}`);
                    return false;
            }
        });
    }

    // Execute rule actions
    async executeActions(actions, data) {
        const results = [];
        
        for (const action of actions) {
            try {
                const result = await this.executeAction(action, data);
                results.push({
                    type: action.type,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    type: action.type,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // Execute a single action
    async executeAction(action, data) {
        const { type, config } = action;
        
        switch (type) {
            case 'update_field':
                return this.actionUpdateField(config, data);
            case 'send_notification':
                return this.actionSendNotification(config, data);
            case 'create_task':
                return this.actionCreateTask(config, data);
            case 'send_email':
                return this.actionSendEmail(config, data);
            case 'log_event':
                return this.actionLogEvent(config, data);
            case 'call_webhook':
                return this.actionCallWebhook(config, data);
            default:
                throw new Error(`Unknown action type: ${type}`);
        }
    }

    // Action implementations
    actionUpdateField(config, data) {
        const { field, value } = config;
        const oldValue = this.getNestedValue(data, field);
        const newValue = this.interpolateValue(value, data);
        
        // In a real system, this would update the database
        // For now, we'll just return the update information
        return {
            field,
            oldValue,
            newValue,
            message: `Updated ${field} from ${oldValue} to ${newValue}`
        };
    }

    actionSendNotification(config, data) {
        const { title, message, recipients } = config;
        const interpolatedTitle = this.interpolateValue(title, data);
        const interpolatedMessage = this.interpolateValue(message, data);
        
        // In a real system, this would send actual notifications
        return {
            title: interpolatedTitle,
            message: interpolatedMessage,
            recipients: recipients || ['system'],
            sent: true,
            timestamp: new Date().toISOString()
        };
    }

    actionCreateTask(config, data) {
        const { title, description, assignee, priority } = config;
        
        return {
            taskId: `task_${Date.now()}`,
            title: this.interpolateValue(title, data),
            description: this.interpolateValue(description, data),
            assignee: assignee || 'system',
            priority: priority || 'medium',
            status: 'pending',
            created: new Date().toISOString()
        };
    }

    actionSendEmail(config, data) {
        const { to, subject, body } = config;
        
        return {
            to: this.interpolateValue(to, data),
            subject: this.interpolateValue(subject, data),
            body: this.interpolateValue(body, data),
            sent: true,
            timestamp: new Date().toISOString()
        };
    }

    actionLogEvent(config, data) {
        const { level, message } = config;
        const logMessage = this.interpolateValue(message, data);
        
        this.log(level || 'info', logMessage, data);
        
        return {
            level: level || 'info',
            message: logMessage,
            logged: true
        };
    }

    actionCallWebhook(config, data) {
        const { url, method, payload } = config;
        
        // In a real system, this would make an actual HTTP request
        return {
            url,
            method: method || 'POST',
            payload: this.interpolateValue(payload, data),
            status: 'simulated',
            timestamp: new Date().toISOString()
        };
    }

    // Helper methods
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    interpolateValue(value, data) {
        if (typeof value !== 'string') {
            return value;
        }
        
        // Simple template interpolation: {{field.path}}
        return value.replace(/\{\{([^}]+)\}\}/g, (match, fieldPath) => {
            const fieldValue = this.getNestedValue(data, fieldPath.trim());
            return fieldValue !== undefined ? fieldValue : match;
        });
    }

    validateRule(rule) {
        return (
            rule &&
            rule.name &&
            rule.trigger &&
            rule.trigger.event &&
            Array.isArray(rule.actions) &&
            rule.actions.length > 0
        );
    }

    registerDefaultRules() {
        // Register default invoice approval rules
        this.registerInvoiceApprovalRules();
        
        // Register order fulfillment rules
        this.registerOrderFulfillmentRules();
        
        // Log completion
        this.log('info', 'Default rules registered successfully');
    }

    registerInvoiceApprovalRules() {
        // Rule 1: Auto-approve small invoices from trusted customers
        this.registerRule({
            name: 'Auto-approve Small Invoices',
            description: 'Automatically approve invoices under $500 from customers with good payment history',
            trigger: {
                event: 'invoice_created'
            },
            conditions: [
                { field: 'total', operator: 'less_than', value: 500 },
                { field: 'customer.paymentScore', operator: 'greater_equal', value: 85 },
                { field: 'customer.status', operator: 'equals', value: 'Active' }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'approved'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'approvedBy',
                        value: 'system_auto'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'approvedAt',
                        value: '{{currentDateTime}}'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Invoice Auto-Approved',
                        message: 'Invoice #{{id}} for {{customer.name}} (${{total}}) has been automatically approved.',
                        recipients: ['billing', 'management']
                    }
                },
                {
                    type: 'log_event',
                    config: {
                        level: 'info',
                        message: 'Invoice {{id}} auto-approved: Small amount (${{total}}) from trusted customer {{customer.name}}'
                    }
                }
            ]
        });

        // Rule 2: Flag large invoices for manual approval
        this.registerRule({
            name: 'Flag Large Invoices',
            description: 'Flag invoices over $5000 for manual approval and notify management',
            trigger: {
                event: 'invoice_created'
            },
            conditions: [
                { field: 'total', operator: 'greater_than', value: 5000 }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'pending_approval'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'priority',
                        value: 'high'
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'Review Large Invoice - {{customer.name}}',
                        description: 'Invoice #{{id}} for ${{total}} requires manual approval. Customer: {{customer.name}}, Payment Score: {{customer.paymentScore}}',
                        assignee: 'finance_manager',
                        priority: 'high'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Large Invoice Requires Approval',
                        message: 'Invoice #{{id}} for {{customer.name}} (${{total}}) requires manual approval due to large amount.',
                        recipients: ['finance_manager', 'management']
                    }
                }
            ]
        });

        // Rule 3: Hold invoices from customers with poor payment history
        this.registerRule({
            name: 'Hold Invoices from Poor Payers',
            description: 'Hold invoices from customers with poor payment history for review',
            trigger: {
                event: 'invoice_created'
            },
            conditions: [
                { field: 'customer.paymentScore', operator: 'less_than', value: 70 }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'on_hold'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'holdReason',
                        value: 'poor_payment_history'
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'Review Invoice - Poor Payment History',
                        description: 'Invoice #{{id}} for {{customer.name}} (${{total}}) on hold due to poor payment history (Score: {{customer.paymentScore}}). Review customer account before approval.',
                        assignee: 'accounts_receivable',
                        priority: 'medium'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Invoice On Hold - Payment History',
                        message: 'Invoice #{{id}} for {{customer.name}} placed on hold due to payment score of {{customer.paymentScore}}.',
                        recipients: ['accounts_receivable', 'sales']
                    }
                }
            ]
        });

        // Rule 4: Auto-approve medium invoices from regular customers
        this.registerRule({
            name: 'Auto-approve Regular Customer Invoices',
            description: 'Auto-approve invoices $500-$2000 from customers with 3+ years history and good payment record',
            trigger: {
                event: 'invoice_created'
            },
            conditions: [
                { field: 'total', operator: 'greater_equal', value: 500 },
                { field: 'total', operator: 'less_equal', value: 2000 },
                { field: 'customer.paymentScore', operator: 'greater_equal', value: 90 },
                { field: 'customer.yearsActive', operator: 'greater_equal', value: 3 },
                { field: 'customer.totalOrders', operator: 'greater_equal', value: 10 }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'approved'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'approvedBy',
                        value: 'system_trusted_customer'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Invoice Auto-Approved - Trusted Customer',
                        message: 'Invoice #{{id}} for trusted customer {{customer.name}} (${{total}}) has been automatically approved.',
                        recipients: ['billing']
                    }
                }
            ]
        });

        // Rule 5: Expedite invoices for VIP customers
        this.registerRule({
            name: 'Expedite VIP Customer Invoices',
            description: 'Prioritize processing for VIP customers regardless of amount',
            trigger: {
                event: 'invoice_created'
            },
            conditions: [
                { field: 'customer.type', operator: 'equals', value: 'VIP' }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'priority',
                        value: 'high'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'processingNotes',
                        value: 'VIP Customer - Expedited Processing'
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'Process VIP Customer Invoice',
                        description: 'VIP Customer {{customer.name}} - Invoice #{{id}} for ${{total}}. Process with priority.',
                        assignee: 'senior_billing_specialist',
                        priority: 'high'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'VIP Customer Invoice Created',
                        message: 'VIP Customer {{customer.name}} has new invoice #{{id}} (${{total}}). Processing with high priority.',
                        recipients: ['billing_manager', 'customer_success']
                    }
                }
            ]
        });

        // Rule 6: Alert on duplicate invoices
        this.registerRule({
            name: 'Alert on Duplicate Invoices',
            description: 'Flag potential duplicate invoices based on customer, amount, and date proximity',
            trigger: {
                event: 'invoice_created'
            },
            conditions: [
                { field: 'hasPotentialDuplicate', operator: 'equals', value: true }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'pending_review'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'reviewReason',
                        value: 'potential_duplicate'
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'Review Potential Duplicate Invoice',
                        description: 'Invoice #{{id}} for {{customer.name}} (${{total}}) may be a duplicate. Review similar invoices from the past 30 days.',
                        assignee: 'billing_specialist',
                        priority: 'medium'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Potential Duplicate Invoice Detected',
                        message: 'Invoice #{{id}} for {{customer.name}} may be a duplicate. Please review before processing.',
                        recipients: ['billing', 'management']
                    }
                }
            ]
        });

        this.log('info', 'Invoice approval rules registered', {
            rulesAdded: 6,
            types: ['auto_approval', 'manual_review', 'hold', 'priority', 'duplicate_check']
        });
    }

    registerOrderFulfillmentRules() {
        // Rule 1: Auto-process orders with available inventory
        this.registerRule({
            name: 'Auto-process Available Inventory Orders',
            description: 'Automatically move orders to processing when all items are in stock',
            trigger: {
                event: 'order_created'
            },
            conditions: [
                { field: 'allItemsInStock', operator: 'equals', value: true },
                { field: 'paymentStatus', operator: 'equals', value: 'paid' },
                { field: 'total', operator: 'less_than', value: 1000 }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'processing'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'processedAt',
                        value: '{{currentDateTime}}'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Order Auto-Processed',
                        message: 'Order #{{id}} for {{customer.name}} has been automatically moved to processing.',
                        recipients: ['warehouse', 'customer_service']
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'Pick and Pack Order #{{id}}',
                        description: 'Order for {{customer.name}} - ${{total}}. All items in stock, ready for fulfillment.',
                        assignee: 'warehouse_team',
                        priority: 'medium'
                    }
                }
            ]
        });

        // Rule 2: Hold orders with inventory shortages
        this.registerRule({
            name: 'Hold Orders with Stock Issues',
            description: 'Place orders on hold when inventory is insufficient and notify procurement',
            trigger: {
                event: 'order_created'
            },
            conditions: [
                { field: 'allItemsInStock', operator: 'equals', value: false }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'on_hold'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'holdReason',
                        value: 'insufficient_inventory'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Order On Hold - Inventory Shortage',
                        message: 'Order #{{id}} placed on hold due to insufficient inventory. Missing items: {{missingItems}}',
                        recipients: ['procurement', 'customer_service']
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'Resolve Inventory Shortage - Order #{{id}}',
                        description: 'Order #{{id}} for {{customer.name}} requires inventory replenishment. Missing: {{missingItems}}',
                        assignee: 'procurement_team',
                        priority: 'high'
                    }
                }
            ]
        });

        // Rule 3: Expedite large orders
        this.registerRule({
            name: 'Expedite Large Orders',
            description: 'Give priority processing to orders over $5000',
            trigger: {
                event: 'order_created'
            },
            conditions: [
                { field: 'total', operator: 'greater_than', value: 5000 },
                { field: 'paymentStatus', operator: 'equals', value: 'paid' }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'priority',
                        value: 'high'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'processingNotes',
                        value: 'Large Order - Expedited Processing'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Large Order Requires Priority Processing',
                        message: 'Order #{{id}} for {{customer.name}} (${{total}}) should be processed with high priority.',
                        recipients: ['warehouse_manager', 'operations']
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'Priority Order Processing - {{customer.name}}',
                        description: 'Large order #{{id}} (${{total}}) requires expedited handling and quality review.',
                        assignee: 'warehouse_supervisor',
                        priority: 'high'
                    }
                }
            ]
        });

        // Rule 4: Auto-ship when packed
        this.registerRule({
            name: 'Auto-schedule Shipping',
            description: 'Automatically schedule shipment when order is packed and ready',
            trigger: {
                event: 'order_packed'
            },
            conditions: [
                { field: 'status', operator: 'equals', value: 'packed' },
                { field: 'shippingAddress', operator: 'exists' },
                { field: 'shippingMethod', operator: 'exists' }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'ready_to_ship'
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'scheduledShipDate',
                        value: '{{nextBusinessDay}}'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Order Ready for Shipment',
                        message: 'Order #{{id}} is packed and scheduled for shipment on {{scheduledShipDate}}.',
                        recipients: ['shipping', 'customer_service']
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'Ship Order #{{id}}',
                        description: 'Order for {{customer.name}} ready for shipment via {{shippingMethod}}.',
                        assignee: 'shipping_team',
                        priority: 'medium'
                    }
                }
            ]
        });

        // Rule 5: Send tracking notifications
        this.registerRule({
            name: 'Send Tracking Notifications',
            description: 'Notify customer when order is shipped with tracking information',
            trigger: {
                event: 'order_shipped'
            },
            conditions: [
                { field: 'trackingNumber', operator: 'exists' },
                { field: 'customer.email', operator: 'exists' }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'shipped'
                    }
                },
                {
                    type: 'send_email',
                    config: {
                        to: '{{customer.email}}',
                        subject: 'Your Order #{{id}} Has Shipped!',
                        body: 'Hi {{customer.name}},\n\nGreat news! Your order #{{id}} has been shipped and is on its way.\n\nTracking Number: {{trackingNumber}}\nShipping Method: {{shippingMethod}}\nEstimated Delivery: {{estimatedDelivery}}\n\nThank you for your business!'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Tracking Information Sent',
                        message: 'Tracking notification sent to {{customer.name}} for order #{{id}}.',
                        recipients: ['customer_service']
                    }
                },
                {
                    type: 'log_event',
                    config: {
                        level: 'info',
                        message: 'Order {{id}} shipped with tracking {{trackingNumber}} to {{customer.name}}'
                    }
                }
            ]
        });

        // Rule 6: Follow up on delayed orders
        this.registerRule({
            name: 'Follow Up on Delayed Orders',
            description: 'Alert management and customer service about orders delayed beyond expected timeframe',
            trigger: {
                event: 'order_delay_detected'
            },
            conditions: [
                { field: 'daysOverdue', operator: 'greater_than', value: 2 },
                { field: 'status', operator: 'not_in', value: ['shipped', 'delivered', 'cancelled'] }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'isDelayed',
                        value: true
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'priority',
                        value: 'urgent'
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'URGENT: Resolve Delayed Order #{{id}}',
                        description: 'Order #{{id}} for {{customer.name}} is {{daysOverdue}} days overdue. Status: {{status}}. Customer may need immediate attention.',
                        assignee: 'operations_manager',
                        priority: 'urgent'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Order Significantly Delayed',
                        message: 'Order #{{id}} for {{customer.name}} is {{daysOverdue}} days overdue. Immediate action required.',
                        recipients: ['operations_manager', 'customer_service_manager']
                    }
                }
            ]
        });

        // Rule 7: Quality check for construction materials
        this.registerRule({
            name: 'Quality Check Construction Materials',
            description: 'Require quality inspection for construction material orders over $2000',
            trigger: {
                event: 'order_packed'
            },
            conditions: [
                { field: 'total', operator: 'greater_than', value: 2000 },
                { field: 'hasConstructionMaterials', operator: 'equals', value: true }
            ],
            actions: [
                {
                    type: 'update_field',
                    config: {
                        field: 'requiresQualityCheck',
                        value: true
                    }
                },
                {
                    type: 'update_field',
                    config: {
                        field: 'status',
                        value: 'pending_quality_check'
                    }
                },
                {
                    type: 'create_task',
                    config: {
                        title: 'Quality Inspection Required - Order #{{id}}',
                        description: 'Construction materials order for {{customer.name}} (${{total}}) requires quality inspection before shipment.',
                        assignee: 'quality_inspector',
                        priority: 'high'
                    }
                },
                {
                    type: 'send_notification',
                    config: {
                        title: 'Quality Check Required',
                        message: 'Order #{{id}} requires quality inspection before shipment due to construction materials content.',
                        recipients: ['quality_team', 'warehouse_supervisor']
                    }
                }
            ]
        });

        this.log('info', 'Order fulfillment rules registered', {
            rulesAdded: 7,
            types: ['auto_processing', 'inventory_hold', 'priority', 'shipping', 'tracking', 'delay_management', 'quality_check']
        });
    }

    // Configuration and persistence
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('workflowEngineConfig');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
        } catch (error) {
            console.warn('Could not load workflow configuration:', error);
        }
    }

    saveConfiguration() {
        try {
            localStorage.setItem('workflowEngineConfig', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Could not save workflow configuration:', error);
        }
    }

    loadRules() {
        try {
            const savedRules = localStorage.getItem('workflowEngineRules');
            if (savedRules) {
                this.rules = JSON.parse(savedRules);
            }
        } catch (error) {
            console.warn('Could not load workflow rules:', error);
            this.rules = [];
        }
    }

    saveRules() {
        try {
            localStorage.setItem('workflowEngineRules', JSON.stringify(this.rules));
        } catch (error) {
            console.warn('Could not save workflow rules:', error);
        }
    }

    // Logging
    log(level, message, data = null) {
        if (!this.config.enableLogging) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        
        this.executionLog.push(logEntry);
        
        // Trim log if too long
        if (this.executionLog.length > this.config.maxLogEntries) {
            this.executionLog = this.executionLog.slice(-this.config.maxLogEntries);
        }
        
        // Also log to console
        console[level] || console.log(`[${level}] ${message}`, data);
    }

    // Status and management
    getStatus() {
        return {
            initialized: this.isInitialized,
            enabled: this.enabled,
            totalRules: this.rules.length,
            enabledRules: this.rules.filter(r => r.enabled).length,
            totalExecutions: this.rules.reduce((sum, rule) => sum + rule.executionCount, 0),
            logEntries: this.executionLog.length
        };
    }

    getRules() {
        return this.rules.map(rule => ({
            id: rule.id,
            name: rule.name,
            enabled: rule.enabled,
            trigger: rule.trigger,
            executionCount: rule.executionCount,
            lastExecuted: rule.lastExecuted,
            createdAt: rule.createdAt
        }));
    }

    getExecutionLog(limit = 50) {
        return this.executionLog.slice(-limit).reverse();
    }

    enable() {
        this.enabled = true;
        this.saveConfiguration();
        this.log('info', 'Workflow Engine enabled');
    }

    disable() {
        this.enabled = false;
        this.saveConfiguration();
        this.log('info', 'Workflow Engine disabled');
    }
}

// Export the engine
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkflowEngine;
} else if (typeof window !== 'undefined') {
    window.WorkflowEngine = WorkflowEngine;
}

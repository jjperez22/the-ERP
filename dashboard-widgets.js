/**
 * Dashboard Widget System
 * Creates and manages role-based dashboard widgets
 */

class DashboardWidgets {
    constructor(roleManager) {
        this.roleManager = roleManager;
        this.widgetInstances = new Map();
        this.refreshTimers = new Map();
        this.initializeWidgets();
    }

    initializeWidgets() {
        // Widget factory methods for each widget type
        this.widgetFactories = {
            'kpi-summary': this.createKPISummaryWidget.bind(this),
            'revenue-chart': this.createRevenueChartWidget.bind(this),
            'sales-metrics': this.createSalesMetricsWidget.bind(this),
            'inventory-status': this.createInventoryStatusWidget.bind(this),
            'financial-summary': this.createFinancialSummaryWidget.bind(this),
            'user-activity': this.createUserActivityWidget.bind(this),
            'customer-pipeline': this.createCustomerPipelineWidget.bind(this),
            'low-stock-alerts': this.createLowStockAlertsWidget.bind(this),
            'team-performance': this.createTeamPerformanceWidget.bind(this),
            'recent-orders': this.createRecentOrdersWidget.bind(this),
            'warehouse-capacity': this.createWarehouseCapacityWidget.bind(this),
            'personal-tasks': this.createPersonalTasksWidget.bind(this),
            'incoming-shipments': this.createIncomingShipmentsWidget.bind(this)
        };
    }

    // Create widget element
    createWidget(widgetId, containerId) {
        const widgetConfig = this.roleManager.getAvailableWidgets().find(w => w.id === widgetId);
        if (!widgetConfig) {
            console.error('Widget not found or not available for current role:', widgetId);
            return null;
        }

        const container = document.getElementById(containerId) || document.querySelector(containerId);
        if (!container) {
            console.error('Widget container not found:', containerId);
            return null;
        }

        // Create widget element
        const widgetElement = document.createElement('div');
        widgetElement.className = `dashboard-widget widget-${widgetId}`;
        widgetElement.id = `widget-${widgetId}`;
        
        // Add widget header
        const header = this.createWidgetHeader(widgetConfig);
        widgetElement.appendChild(header);

        // Add widget content container
        const content = document.createElement('div');
        content.className = 'widget-content';
        content.id = `widget-content-${widgetId}`;
        widgetElement.appendChild(content);

        // Add to container
        container.appendChild(widgetElement);

        // Create widget content using factory
        const factory = this.widgetFactories[widgetId];
        if (factory) {
            factory(content, widgetConfig);
        } else {
            this.createDefaultWidget(content, widgetConfig);
        }

        // Store widget instance
        this.widgetInstances.set(widgetId, {
            element: widgetElement,
            content: content,
            config: widgetConfig
        });

        // Set up refresh timer if needed
        if (widgetConfig.refreshInterval) {
            this.setupRefreshTimer(widgetId, widgetConfig.refreshInterval);
        }

        return widgetElement;
    }

    // Create widget header with title and controls
    createWidgetHeader(config) {
        const header = document.createElement('div');
        header.className = 'widget-header';
        
        const title = document.createElement('h3');
        title.className = 'widget-title';
        title.textContent = config.title;
        
        const controls = document.createElement('div');
        controls.className = 'widget-controls';
        
        // Refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'widget-control-btn';
        refreshBtn.innerHTML = '🔄';
        refreshBtn.title = 'Refresh';
        refreshBtn.onclick = () => this.refreshWidget(config.id);
        
        // Settings button (if user has permissions)
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'widget-control-btn';
        settingsBtn.innerHTML = '⚙️';
        settingsBtn.title = 'Settings';
        settingsBtn.onclick = () => this.showWidgetSettings(config.id);
        
        controls.appendChild(refreshBtn);
        if (this.roleManager.canAccessFeature('settings')) {
            controls.appendChild(settingsBtn);
        }
        
        header.appendChild(title);
        header.appendChild(controls);
        
        return header;
    }

    // KPI Summary Widget - Shows key performance indicators
    createKPISummaryWidget(container, config) {
        container.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-value" id="kpi-revenue">$0</div>
                    <div class="kpi-label">Monthly Revenue</div>
                    <div class="kpi-change positive" id="kpi-revenue-change">+0%</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value" id="kpi-orders">0</div>
                    <div class="kpi-label">Total Orders</div>
                    <div class="kpi-change positive" id="kpi-orders-change">+0%</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value" id="kpi-customers">0</div>
                    <div class="kpi-label">Active Customers</div>
                    <div class="kpi-change positive" id="kpi-customers-change">+0%</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value" id="kpi-satisfaction">0</div>
                    <div class="kpi-label">Satisfaction</div>
                    <div class="kpi-change neutral" id="kpi-satisfaction-change">⭐</div>
                </div>
            </div>
        `;
        this.updateKPISummary();
    }

    updateKPISummary() {
        // Use global appData if available
        if (typeof appData !== 'undefined') {
            document.getElementById('kpi-revenue').textContent = `$${appData.metrics.monthlyRevenue.toLocaleString()}`;
            document.getElementById('kpi-orders').textContent = appData.metrics.totalOrders;
            document.getElementById('kpi-customers').textContent = appData.metrics.activeCustomers;
            document.getElementById('kpi-satisfaction').textContent = appData.metrics.customerSatisfaction;
            
            document.getElementById('kpi-revenue-change').textContent = `+${appData.metrics.salesGrowth}%`;
            document.getElementById('kpi-orders-change').textContent = `+${Math.round(appData.metrics.salesGrowth * 0.8)}%`;
            document.getElementById('kpi-customers-change').textContent = `+${Math.round(appData.metrics.salesGrowth * 0.5)}%`;
            document.getElementById('kpi-satisfaction-change').textContent = `⭐ ${appData.metrics.customerSatisfaction}/5`;
        }
    }

    // Sales Metrics Widget - For sales role
    createSalesMetricsWidget(container, config) {
        container.innerHTML = `
            <div class="sales-metrics-grid">
                <div class="metric-card">
                    <div class="metric-value" id="sales-quota">$0</div>
                    <div class="metric-label">Monthly Quota</div>
                    <div class="metric-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="quota-progress" style="width: 0%"></div>
                        </div>
                        <span id="quota-percentage">0%</span>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="sales-deals">0</div>
                    <div class="metric-label">Deals Closed</div>
                    <div class="metric-change positive" id="deals-change">+0</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="sales-pipeline">$0</div>
                    <div class="metric-label">Pipeline Value</div>
                    <div class="metric-change positive" id="pipeline-change">+0%</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="sales-conversion">0%</div>
                    <div class="metric-label">Conversion Rate</div>
                    <div class="metric-change neutral" id="conversion-change">~</div>
                </div>
            </div>
        `;
        this.updateSalesMetrics();
    }

    updateSalesMetrics() {
        // Mock sales data
        const quota = 50000;
        const achieved = 34567;
        const percentage = Math.round((achieved / quota) * 100);
        
        document.getElementById('sales-quota').textContent = `$${quota.toLocaleString()}`;
        document.getElementById('quota-progress').style.width = `${percentage}%`;
        document.getElementById('quota-percentage').textContent = `${percentage}%`;
        document.getElementById('sales-deals').textContent = '12';
        document.getElementById('deals-change').textContent = '+3';
        document.getElementById('sales-pipeline').textContent = '$125,400';
        document.getElementById('pipeline-change').textContent = '+15%';
        document.getElementById('sales-conversion').textContent = '24%';
        document.getElementById('conversion-change').textContent = '+2%';
    }

    // Inventory Status Widget - For warehouse role
    createInventoryStatusWidget(container, config) {
        container.innerHTML = `
            <div class="inventory-overview">
                <div class="inventory-summary">
                    <div class="summary-item">
                        <span class="summary-value" id="total-items">0</span>
                        <span class="summary-label">Total Items</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-value warning" id="low-stock">0</span>
                        <span class="summary-label">Low Stock</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-value" id="total-value">$0</span>
                        <span class="summary-label">Total Value</span>
                    </div>
                </div>
                <div class="inventory-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-tbody">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        this.updateInventoryStatus();
    }

    updateInventoryStatus() {
        if (typeof appData !== 'undefined') {
            const totalItems = appData.products.length;
            const lowStockItems = appData.products.filter(p => p.stock <= p.reorderPoint).length;
            const totalValue = appData.products.reduce((sum, p) => sum + (p.price * p.stock), 0);
            
            document.getElementById('total-items').textContent = totalItems;
            document.getElementById('low-stock').textContent = lowStockItems;
            document.getElementById('total-value').textContent = `$${Math.round(totalValue).toLocaleString()}`;
            
            // Update table with top items
            const tbody = document.getElementById('inventory-tbody');
            tbody.innerHTML = '';
            
            appData.products.slice(0, 5).forEach(product => {
                const row = document.createElement('tr');
                const status = product.stock <= product.reorderPoint ? 'low' : 'normal';
                row.innerHTML = `
                    <td>${product.name.substring(0, 20)}...</td>
                    <td>${product.stock}</td>
                    <td><span class="status ${status}">${status === 'low' ? 'Low' : 'OK'}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
    }

    // Financial Summary Widget - For finance role
    createFinancialSummaryWidget(container, config) {
        container.innerHTML = `
            <div class="financial-overview">
                <div class="financial-metrics">
                    <div class="metric-card">
                        <div class="metric-value" id="monthly-revenue">$0</div>
                        <div class="metric-label">Monthly Revenue</div>
                        <div class="metric-trend" id="revenue-trend">📈</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="gross-profit">$0</div>
                        <div class="metric-label">Gross Profit</div>
                        <div class="metric-trend" id="profit-trend">📈</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="expenses">$0</div>
                        <div class="metric-label">Monthly Expenses</div>
                        <div class="metric-trend" id="expenses-trend">📊</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="profit-margin">0%</div>
                        <div class="metric-label">Profit Margin</div>
                        <div class="metric-trend" id="margin-trend">💹</div>
                    </div>
                </div>
                <div class="financial-chart-placeholder">
                    <canvas id="financial-mini-chart" width="300" height="150"></canvas>
                </div>
            </div>
        `;
        this.updateFinancialSummary();
    }

    updateFinancialSummary() {
        if (typeof appData !== 'undefined') {
            const revenue = appData.metrics.monthlyRevenue;
            const expenses = revenue * 0.65; // Assume 65% expense ratio
            const grossProfit = revenue - expenses;
            const profitMargin = ((grossProfit / revenue) * 100).toFixed(1);
            
            document.getElementById('monthly-revenue').textContent = `$${revenue.toLocaleString()}`;
            document.getElementById('gross-profit').textContent = `$${Math.round(grossProfit).toLocaleString()}`;
            document.getElementById('expenses').textContent = `$${Math.round(expenses).toLocaleString()}`;
            document.getElementById('profit-margin').textContent = `${profitMargin}%`;
        }
    }

    // Low Stock Alerts Widget
    createLowStockAlertsWidget(container, config) {
        container.innerHTML = `
            <div class="alerts-container">
                <div class="alerts-header">
                    <span class="alert-count" id="alert-count">0</span>
                    <span class="alert-label">Critical Items</span>
                </div>
                <div class="alerts-list" id="alerts-list">
                    <!-- Alerts will be populated here -->
                </div>
            </div>
        `;
        this.updateLowStockAlerts();
    }

    updateLowStockAlerts() {
        if (typeof appData !== 'undefined') {
            const lowStockProducts = appData.products.filter(p => p.stock <= p.reorderPoint);
            
            document.getElementById('alert-count').textContent = lowStockProducts.length;
            
            const alertsList = document.getElementById('alerts-list');
            alertsList.innerHTML = '';
            
            lowStockProducts.slice(0, 5).forEach(product => {
                const alertItem = document.createElement('div');
                alertItem.className = 'alert-item';
                alertItem.innerHTML = `
                    <div class="alert-icon">⚠️</div>
                    <div class="alert-content">
                        <div class="alert-title">${product.name}</div>
                        <div class="alert-detail">Stock: ${product.stock} (Min: ${product.reorderPoint})</div>
                    </div>
                `;
                alertsList.appendChild(alertItem);
            });
        }
    }

    // Recent Orders Widget
    createRecentOrdersWidget(container, config) {
        container.innerHTML = `
            <div class="recent-orders">
                <div class="orders-list" id="orders-list">
                    <!-- Orders will be populated here -->
                </div>
            </div>
        `;
        this.updateRecentOrders();
    }

    updateRecentOrders() {
        if (typeof appData !== 'undefined') {
            const ordersList = document.getElementById('orders-list');
            ordersList.innerHTML = '';
            
            appData.orders.slice(0, 5).forEach(order => {
                const orderItem = document.createElement('div');
                orderItem.className = 'order-item';
                orderItem.innerHTML = `
                    <div class="order-id">${order.id}</div>
                    <div class="order-customer">${order.customer}</div>
                    <div class="order-amount">$${order.total.toFixed(2)}</div>
                    <div class="order-status status-${order.status.toLowerCase()}">${order.status}</div>
                `;
                ordersList.appendChild(orderItem);
            });
        }
    }

    // Personal Tasks Widget - For employee role
    createPersonalTasksWidget(container, config) {
        container.innerHTML = `
            <div class="personal-tasks">
                <div class="task-summary">
                    <div class="task-count">
                        <span class="count" id="pending-tasks">3</span>
                        <span class="label">Pending Tasks</span>
                    </div>
                </div>
                <div class="task-list" id="task-list">
                    <div class="task-item">
                        <input type="checkbox" class="task-checkbox">
                        <span class="task-text">Review safety protocols</span>
                        <span class="task-due">Due: Today</span>
                    </div>
                    <div class="task-item">
                        <input type="checkbox" class="task-checkbox">
                        <span class="task-text">Submit timesheet</span>
                        <span class="task-due">Due: Friday</span>
                    </div>
                    <div class="task-item">
                        <input type="checkbox" class="task-checkbox">
                        <span class="task-text">Equipment maintenance check</span>
                        <span class="task-due">Due: Next week</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Default fallback widget
    createDefaultWidget(container, config) {
        container.innerHTML = `
            <div class="default-widget">
                <div class="widget-icon">📊</div>
                <div class="widget-message">
                    <p>${config.title} widget is loading...</p>
                    <small>Widget type: ${config.type}</small>
                </div>
            </div>
        `;
    }

    // Refresh specific widget
    refreshWidget(widgetId) {
        const widget = this.widgetInstances.get(widgetId);
        if (!widget) return;

        // Add loading indicator
        widget.element.classList.add('loading');

        // Simulate refresh delay
        setTimeout(() => {
            // Call appropriate update method
            switch (widgetId) {
                case 'kpi-summary':
                    this.updateKPISummary();
                    break;
                case 'sales-metrics':
                    this.updateSalesMetrics();
                    break;
                case 'inventory-status':
                    this.updateInventoryStatus();
                    break;
                case 'financial-summary':
                    this.updateFinancialSummary();
                    break;
                case 'low-stock-alerts':
                    this.updateLowStockAlerts();
                    break;
                case 'recent-orders':
                    this.updateRecentOrders();
                    break;
                default:
                    console.log('Refreshing widget:', widgetId);
            }

            widget.element.classList.remove('loading');
        }, 500);
    }

    // Setup automatic refresh timer
    setupRefreshTimer(widgetId, interval) {
        if (this.refreshTimers.has(widgetId)) {
            clearInterval(this.refreshTimers.get(widgetId));
        }

        const timer = setInterval(() => {
            this.refreshWidget(widgetId);
        }, interval);

        this.refreshTimers.set(widgetId, timer);
    }

    // Show widget settings
    showWidgetSettings(widgetId) {
        const widget = this.widgetInstances.get(widgetId);
        if (!widget) return;

        // For now, just show a simple alert
        alert(`Settings for ${widget.config.title} widget would be shown here.`);
    }

    // Remove widget
    removeWidget(widgetId) {
        const widget = this.widgetInstances.get(widgetId);
        if (!widget) return;

        // Clear refresh timer
        if (this.refreshTimers.has(widgetId)) {
            clearInterval(this.refreshTimers.get(widgetId));
            this.refreshTimers.delete(widgetId);
        }

        // Remove from DOM
        widget.element.remove();

        // Remove from instances
        this.widgetInstances.delete(widgetId);
    }

    // Clean up all widgets
    destroy() {
        // Clear all timers
        this.refreshTimers.forEach(timer => clearInterval(timer));
        this.refreshTimers.clear();

        // Remove all widgets
        this.widgetInstances.forEach((widget, widgetId) => {
            widget.element.remove();
        });
        this.widgetInstances.clear();
    }
}

// Make available globally
window.DashboardWidgets = DashboardWidgets;

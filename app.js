// Sample data
const appData = {
  "products": [
    {"id": "P001", "sku": "LUM-2x4-001", "name": "2x4 Lumber - 8ft", "category": "Lumber", "price": 4.99, "cost": 3.24, "stock": 450, "reorderPoint": 100, "supplier": "Northwest Lumber Co", "location": "Warehouse A"},
    {"id": "P002", "sku": "CON-BAG-002", "name": "Portland Cement - 94lb Bag", "category": "Concrete", "price": 8.49, "cost": 5.99, "stock": 89, "reorderPoint": 150, "supplier": "Cement Supply Inc", "location": "Warehouse B"},
    {"id": "P003", "sku": "ROO-SHI-003", "name": "Asphalt Shingles - Architectural", "category": "Roofing", "price": 129.99, "cost": 89.99, "stock": 234, "reorderPoint": 50, "supplier": "Roofing Materials Direct", "location": "Warehouse A"},
    {"id": "P004", "sku": "ELE-WIR-004", "name": "12 AWG Electrical Wire - 250ft", "category": "Electrical", "price": 89.99, "cost": 62.99, "stock": 67, "reorderPoint": 25, "supplier": "ElectroMax Supply", "location": "Warehouse C"},
    {"id": "P005", "sku": "PLU-PIP-005", "name": "PVC Pipe 4 inch x 10ft", "category": "Plumbing", "price": 24.99, "cost": 16.99, "stock": 156, "reorderPoint": 75, "supplier": "PlumbCorp", "location": "Warehouse B"},
    {"id": "P006", "sku": "INS-BAT-006", "name": "Fiberglass Insulation R-13", "category": "Insulation", "price": 54.99, "cost": 38.49, "stock": 89, "reorderPoint": 40, "supplier": "Insulation Plus", "location": "Warehouse A"},
    {"id": "P007", "sku": "DRY-SHE-007", "name": "Drywall Sheets 1/2 inch 4x8", "category": "Drywall", "price": 12.99, "cost": 8.99, "stock": 123, "reorderPoint": 60, "supplier": "Drywall Depot", "location": "Warehouse C"},
    {"id": "P008", "sku": "FLO-TIL-008", "name": "Ceramic Floor Tiles 12x12", "category": "Flooring", "price": 3.99, "cost": 2.79, "stock": 2340, "reorderPoint": 500, "supplier": "Tile World", "location": "Warehouse B"}
  ],
  "customers": [
    {"id": "C001", "name": "ABC Construction Co", "type": "General Contractor", "revenue": 245000, "orders": 23, "status": "Active", "paymentTerms": "Net 30", "churnRisk": "Low", "lastOrder": "2024-08-10"},
    {"id": "C002", "name": "Johnson Plumbing Services", "type": "Trade Contractor", "revenue": 89000, "orders": 45, "status": "Active", "paymentTerms": "Net 15", "churnRisk": "Medium", "lastOrder": "2024-08-14"},
    {"id": "C003", "name": "Home Depot - Store #4521", "type": "Retailer", "revenue": 156000, "orders": 12, "status": "Active", "paymentTerms": "Net 45", "churnRisk": "Low", "lastOrder": "2024-08-12"},
    {"id": "C004", "name": "Elite Residential Builders", "type": "Residential Contractor", "revenue": 67000, "orders": 18, "status": "Active", "paymentTerms": "Net 30", "churnRisk": "High", "lastOrder": "2024-07-28"},
    {"id": "C005", "name": "Metro Roofing LLC", "type": "Trade Contractor", "revenue": 134000, "orders": 29, "status": "Active", "paymentTerms": "Net 30", "churnRisk": "Low", "lastOrder": "2024-08-15"}
  ],
  "orders": [
    {"id": "ORD001", "customer": "ABC Construction Co", "date": "2024-08-10", "total": 4567.89, "status": "Shipped", "items": 12},
    {"id": "ORD002", "customer": "Johnson Plumbing Services", "date": "2024-08-14", "total": 1234.56, "status": "Processing", "items": 8},
    {"id": "ORD003", "customer": "Home Depot - Store #4521", "date": "2024-08-12", "total": 8901.23, "status": "Delivered", "items": 24},
    {"id": "ORD004", "customer": "Elite Residential Builders", "date": "2024-08-15", "total": 2345.67, "status": "Processing", "items": 6}
  ],
  "insights": [
    {"type": "inventory", "severity": "warning", "title": "Low Stock Alert", "description": "Portland Cement inventory below reorder point", "action": "Reorder 200 bags from Cement Supply Inc"},
    {"type": "pricing", "severity": "info", "title": "Price Optimization", "description": "Consider 8% price increase on lumber products due to market conditions", "action": "Review lumber pricing strategy"},
    {"type": "demand", "severity": "warning", "title": "Seasonal Demand Spike", "description": "Roofing materials demand expected to increase 35% next month", "action": "Increase roofing inventory levels"},
    {"type": "customer", "severity": "critical", "title": "Churn Risk", "description": "Elite Residential Builders shows 78% churn probability", "action": "Schedule customer retention call"}
  ],
  "metrics": {
    "monthlyRevenue": 234567,
    "totalOrders": 156,
    "activeCustomers": 89,
    "lowStockItems": 12,
    "salesGrowth": 12.5,
    "inventoryTurnover": 4.2,
    "avgOrderValue": 1502.35,
    "customerSatisfaction": 4.3
  }
};

// Chart colors
const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];

// Global variables
let currentModule = 'dashboard';
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeMobileNavigation();
    initializeCharts();
    populateTables();
    populateInsights();
    initializeEventListeners();
    initializeSearch();
});

// Navigation functionality
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const module = this.dataset.module;
            showModule(module);
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                closeMobileNav();
            }
        });
    });
}

// Mobile navigation
function initializeMobileNavigation() {
    const mobileToggle = document.getElementById('mobileNavToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }
    
    // Close mobile nav when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const mobileToggle = document.getElementById('mobileNavToggle');
            
            if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
}

function closeMobileNav() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
}

function showModule(moduleName) {
    // Hide all modules
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('active');
    });
    
    // Show selected module
    const targetModule = document.getElementById(moduleName);
    if (targetModule) {
        targetModule.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-module="${moduleName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    currentModule = moduleName;
    
    // Initialize module-specific content
    if (moduleName === 'reports') {
        setTimeout(() => initializeReportCharts(), 100);
    } else if (moduleName === 'insights') {
        setTimeout(() => initializeDemandChart(), 100);
    }
}

// Chart initialization
function initializeCharts() {
    setTimeout(() => initializeSalesChart(), 100);
}

function initializeSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.sales) {
        charts.sales.destroy();
    }
    
    charts.sales = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            datasets: [{
                label: 'Monthly Sales',
                data: [180000, 195000, 220000, 210000, 245000, 230000, 250000, 234567],
                borderColor: chartColors[0],
                backgroundColor: chartColors[0] + '20',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function initializeReportCharts() {
    initializeRevenueChart();
    initializeTurnoverChart();
    initializeCustomerChart();
    initializeProductChart();
}

function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.revenue) {
        charts.revenue.destroy();
    }
    
    charts.revenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: 'Revenue',
                data: [580000, 650000, 720000, 820000],
                backgroundColor: chartColors[0]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function initializeTurnoverChart() {
    const ctx = document.getElementById('turnoverChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.turnover) {
        charts.turnover.destroy();
    }
    
    charts.turnover = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Lumber', 'Concrete', 'Roofing', 'Electrical', 'Other'],
            datasets: [{
                data: [5.2, 3.8, 4.6, 3.1, 2.9],
                backgroundColor: chartColors.slice(0, 5)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function initializeCustomerChart() {
    const ctx = document.getElementById('customerChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.customer) {
        charts.customer.destroy();
    }
    
    charts.customer = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['General Contractors', 'Trade Contractors', 'Retailers', 'Residential'],
            datasets: [{
                data: [35, 42, 15, 8],
                backgroundColor: chartColors.slice(0, 4)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function initializeProductChart() {
    const ctx = document.getElementById('productChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.product) {
        charts.product.destroy();
    }
    
    charts.product = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lumber', 'Concrete', 'Roofing', 'Electrical', 'Plumbing'],
            datasets: [{
                label: 'Sales',
                data: [89000, 67000, 45000, 34000, 28000],
                backgroundColor: chartColors[1]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function initializeDemandChart() {
    const ctx = document.getElementById('demandChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.demand) {
        charts.demand.destroy();
    }
    
    charts.demand = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Forecast W1', 'Forecast W2', 'Forecast W3', 'Forecast W4'],
            datasets: [{
                label: 'Lumber Demand',
                data: [120, 135, 110, 145, 155, 162, 148, 171],
                borderColor: chartColors[0],
                backgroundColor: chartColors[0] + '20',
                fill: false
            }, {
                label: 'Roofing Demand',
                data: [80, 85, 92, 88, 118, 125, 132, 128],
                borderColor: chartColors[2],
                backgroundColor: chartColors[2] + '20',
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Table population
function populateTables() {
    populateProductTable();
    populateCustomerTable();
    populateOrderTable();
}

function populateProductTable() {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    appData.products.forEach(product => {
        const stockStatus = getStockStatus(product.stock, product.reorderPoint);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.sku}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td><span class="status-badge ${stockStatus.class}">${stockStatus.text}</span></td>
            <td>
                <button class="action-btn view" onclick="viewProduct('${product.id}')">View</button>
                <button class="action-btn edit" onclick="editProduct('${product.id}')">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateCustomerTable() {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    appData.customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.type}</td>
            <td>$${customer.revenue.toLocaleString()}</td>
            <td>${customer.orders}</td>
            <td><span class="risk-${customer.churnRisk.toLowerCase()}">${customer.churnRisk}</span></td>
            <td>${formatDate(customer.lastOrder)}</td>
            <td>
                <button class="action-btn view" onclick="viewCustomer('${customer.id}')">View</button>
                <button class="action-btn edit" onclick="editCustomer('${customer.id}')">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateOrderTable() {
    const tbody = document.getElementById('orderTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    appData.orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${formatDate(order.date)}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
            <td>${order.items}</td>
            <td>
                <button class="action-btn view" onclick="viewOrder('${order.id}')">View</button>
                <button class="action-btn edit" onclick="editOrder('${order.id}')">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Insights population
function populateInsights() {
    populateDashboardInsights();
    populateInsightsModule();
}

function populateDashboardInsights() {
    const container = document.getElementById('dashboardInsights');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Show only first 3 insights on dashboard
    appData.insights.slice(0, 3).forEach(insight => {
        const insightEl = createInsightElement(insight);
        container.appendChild(insightEl);
    });
}

function populateInsightsModule() {
    const critical = document.getElementById('criticalInsights');
    const warning = document.getElementById('warningInsights');
    const info = document.getElementById('infoInsights');
    
    if (!critical || !warning || !info) return;
    
    critical.innerHTML = '';
    warning.innerHTML = '';
    info.innerHTML = '';
    
    appData.insights.forEach(insight => {
        const insightEl = createInsightElement(insight);
        
        if (insight.severity === 'critical') {
            critical.appendChild(insightEl);
        } else if (insight.severity === 'warning') {
            warning.appendChild(insightEl);
        } else {
            info.appendChild(insightEl);
        }
    });
}

function createInsightElement(insight) {
    const div = document.createElement('div');
    div.className = `insight-item ${insight.severity}`;
    div.innerHTML = `
        <div class="insight-title">${insight.title}</div>
        <div class="insight-description">${insight.description}</div>
        <div class="insight-action">${insight.action}</div>
    `;
    return div;
}

// Event listeners
function initializeEventListeners() {
    // Quick action buttons
    document.getElementById('quickOrderBtn')?.addEventListener('click', () => {
        showQuickOrderModal();
    });
    
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
        showAddProductModal();
    });
    
    document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
        showAddCustomerModal();
    });
    
    document.getElementById('newOrderBtn')?.addEventListener('click', () => {
        showNewOrderModal();
    });
    
    // Export buttons
    document.getElementById('exportOrdersBtn')?.addEventListener('click', () => {
        showNotification('Orders exported successfully!');
    });
    
    document.getElementById('exportReportBtn')?.addEventListener('click', () => {
        showNotification('Report exported as PDF!');
    });
    
    // Filter listeners
    document.getElementById('categoryFilter')?.addEventListener('change', filterProducts);
    document.getElementById('stockFilter')?.addEventListener('change', filterProducts);
    
    // Refresh insights
    document.getElementById('refreshInsightsBtn')?.addEventListener('click', () => {
        populateInsights();
        showNotification('Insights refreshed successfully');
    });
}

// Search functionality
function initializeSearch() {
    const productSearch = document.getElementById('productSearch');
    const customerSearch = document.getElementById('customerSearch');
    
    productSearch?.addEventListener('input', (e) => {
        filterProductTable(e.target.value);
    });
    
    customerSearch?.addEventListener('input', (e) => {
        filterCustomerTable(e.target.value);
    });
}

function filterProductTable(searchTerm) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const visible = text.includes(searchTerm.toLowerCase());
        row.style.display = visible ? '' : 'none';
    });
}

function filterCustomerTable(searchTerm) {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const visible = text.includes(searchTerm.toLowerCase());
        row.style.display = visible ? '' : 'none';
    });
}

function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter = document.getElementById('stockFilter');
    const tbody = document.getElementById('productTableBody');
    
    if (!categoryFilter || !stockFilter || !tbody) return;
    
    const categoryValue = categoryFilter.value;
    const stockValue = stockFilter.value;
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        let visible = true;
        
        if (categoryValue) {
            const category = row.cells[2].textContent;
            visible = visible && category === categoryValue;
        }
        
        if (stockValue) {
            const stockBadge = row.querySelector('.status-badge');
            if (stockBadge) {
                const stockClass = stockBadge.className;
                
                if (stockValue === 'low' && !stockClass.includes('low')) visible = false;
                if (stockValue === 'normal' && !stockClass.includes('normal')) visible = false;
                if (stockValue === 'high' && !stockClass.includes('high')) visible = false;
            }
        }
        
        row.style.display = visible ? '' : 'none';
    });
}

// Modal functions
function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (modal && modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showQuickOrderModal() {
    const content = `
        <form class="form-group">
            <div class="form-group">
                <label class="form-label">Customer</label>
                <select class="form-control">
                    ${appData.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Product</label>
                <select class="form-control">
                    ${appData.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Quantity</label>
                <input type="number" class="form-control" value="1" min="1">
            </div>
            <div class="flex gap-8">
                <button type="button" class="btn btn--primary" onclick="createQuickOrder()">Create Order</button>
                <button type="button" class="btn btn--outline" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    showModal('Quick Order', content);
}

function showAddProductModal() {
    const content = `
        <form class="form-group">
            <div class="form-group">
                <label class="form-label">Product Name</label>
                <input type="text" class="form-control" placeholder="Enter product name">
            </div>
            <div class="form-group">
                <label class="form-label">SKU</label>
                <input type="text" class="form-control" placeholder="Enter SKU">
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-control">
                    <option>Lumber</option>
                    <option>Concrete</option>
                    <option>Roofing</option>
                    <option>Electrical</option>
                    <option>Plumbing</option>
                    <option>Insulation</option>
                    <option>Drywall</option>
                    <option>Flooring</option>
                </select>
            </div>
            <div class="flex gap-8">
                <button type="button" class="btn btn--primary" onclick="addProduct()">Add Product</button>
                <button type="button" class="btn btn--outline" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    showModal('Add New Product', content);
}

function showAddCustomerModal() {
    const content = `
        <form class="form-group">
            <div class="form-group">
                <label class="form-label">Customer Name</label>
                <input type="text" class="form-control" placeholder="Enter customer name">
            </div>
            <div class="form-group">
                <label class="form-label">Customer Type</label>
                <select class="form-control">
                    <option>General Contractor</option>
                    <option>Trade Contractor</option>
                    <option>Retailer</option>
                    <option>Residential Contractor</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Payment Terms</label>
                <select class="form-control">
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 45</option>
                </select>
            </div>
            <div class="flex gap-8">
                <button type="button" class="btn btn--primary" onclick="addCustomer()">Add Customer</button>
                <button type="button" class="btn btn--outline" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    showModal('Add New Customer', content);
}

function showNewOrderModal() {
    const content = `
        <form class="form-group">
            <div class="form-group">
                <label class="form-label">Customer</label>
                <select class="form-control">
                    ${appData.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Order Date</label>
                <input type="date" class="form-control" value="2024-08-16">
            </div>
            <div class="form-group">
                <label class="form-label">Priority</label>
                <select class="form-control">
                    <option>Standard</option>
                    <option>High</option>
                    <option>Urgent</option>
                </select>
            </div>
            <div class="flex gap-8">
                <button type="button" class="btn btn--primary" onclick="createNewOrder()">Create Order</button>
                <button type="button" class="btn btn--outline" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    showModal('New Order', content);
}

// Action functions
function viewProduct(productId) {
    const product = appData.products.find(p => p.id === productId);
    if (!product) return;
    
    const content = `
        <div class="form-group">
            <strong>SKU:</strong> ${product.sku}<br><br>
            <strong>Name:</strong> ${product.name}<br><br>
            <strong>Category:</strong> ${product.category}<br><br>
            <strong>Price:</strong> $${product.price.toFixed(2)}<br><br>
            <strong>Cost:</strong> $${product.cost.toFixed(2)}<br><br>
            <strong>Stock:</strong> ${product.stock}<br><br>
            <strong>Reorder Point:</strong> ${product.reorderPoint}<br><br>
            <strong>Supplier:</strong> ${product.supplier}<br><br>
            <strong>Location:</strong> ${product.location}
        </div>
    `;
    showModal(`Product Details - ${product.name}`, content);
}

function editProduct(productId) {
    showNotification('Edit functionality would be implemented here');
}

function viewCustomer(customerId) {
    const customer = appData.customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const content = `
        <div class="form-group">
            <strong>Name:</strong> ${customer.name}<br><br>
            <strong>Type:</strong> ${customer.type}<br><br>
            <strong>Revenue:</strong> $${customer.revenue.toLocaleString()}<br><br>
            <strong>Total Orders:</strong> ${customer.orders}<br><br>
            <strong>Payment Terms:</strong> ${customer.paymentTerms}<br><br>
            <strong>Churn Risk:</strong> <span class="risk-${customer.churnRisk.toLowerCase()}">${customer.churnRisk}</span><br><br>
            <strong>Last Order:</strong> ${formatDate(customer.lastOrder)}
        </div>
    `;
    showModal(`Customer Details - ${customer.name}`, content);
}

function editCustomer(customerId) {
    showNotification('Edit functionality would be implemented here');
}

function viewOrder(orderId) {
    const order = appData.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const content = `
        <div class="form-group">
            <strong>Order ID:</strong> ${order.id}<br><br>
            <strong>Customer:</strong> ${order.customer}<br><br>
            <strong>Date:</strong> ${formatDate(order.date)}<br><br>
            <strong>Total:</strong> $${order.total.toFixed(2)}<br><br>
            <strong>Status:</strong> <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span><br><br>
            <strong>Items:</strong> ${order.items}
        </div>
    `;
    showModal(`Order Details - ${order.id}`, content);
}

function editOrder(orderId) {
    showNotification('Edit functionality would be implemented here');
}

function createQuickOrder() {
    showNotification('Quick order created successfully!');
    closeModal();
}

function addProduct() {
    showNotification('Product added successfully!');
    closeModal();
}

function addCustomer() {
    showNotification('Customer added successfully!');
    closeModal();
}

function createNewOrder() {
    showNotification('New order created successfully!');
    closeModal();
}

// Utility functions
function getStockStatus(stock, reorderPoint) {
    if (stock <= reorderPoint) {
        return { class: 'low', text: 'Low Stock' };
    } else if (stock <= reorderPoint * 2) {
        return { class: 'normal', text: 'Normal' };
    } else {
        return { class: 'high', text: 'In Stock' };
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showNotification(message) {
    // Simple notification - could be enhanced with a proper notification system
    alert(message);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeMobileNav();
    }
});

// Window resize handler
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('open');
    }
});
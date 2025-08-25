// Login State Management
let isLoggedIn = false;
let currentUser = null;

// Login functionality
function initializeLogin() {
    const loginForm = document.getElementById('loginForm');
    const demoAccountBtns = document.querySelectorAll('.demo-account-btn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Add demo account login handlers
    demoAccountBtns.forEach(btn => {
        btn.addEventListener('click', handleDemoLogin);
    });
}

function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simple validation (in real app, this would be server-side)
    if (email && password) {
        // Simulate login success
        loginUser({
            email: email,
            name: extractNameFromEmail(email),
            role: 'user'
        });
    } else {
        showLoginError('Please enter both email and password.');
    }
}

function handleDemoLogin(e) {
    const role = e.currentTarget.dataset.role;
    const email = e.currentTarget.dataset.email;
    
    const userProfiles = {
        admin: { name: 'John Admin', role: 'Administrator', permissions: 'full' },
        manager: { name: 'Sarah Manager', role: 'Manager', permissions: 'limited' },
        employee: { name: 'Mike Employee', role: 'Employee', permissions: 'basic' }
    };
    
    const profile = userProfiles[role];
    
    loginUser({
        email: email,
        name: profile.name,
        role: profile.role,
        permissions: profile.permissions
    });
}

function loginUser(userData) {
    isLoggedIn = true;
    currentUser = userData;
    
    // Update user menu with logged in user's name
    const userMenu = document.querySelector('.user-menu span');
    if (userMenu) {
        userMenu.textContent = userData.name;
    }
    
    // Hide login page and show main app
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');
    
    if (loginPage && mainApp) {
        loginPage.style.display = 'none';
        mainApp.style.display = 'block';
    }
    
    // Initialize the main application
    initializeApp();
}

function extractNameFromEmail(email) {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
}

function showLoginError(message) {
    // Create or update error message
    let errorDiv = document.querySelector('.login-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'login-error';
        errorDiv.style.cssText = `
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: rgb(239, 68, 68);
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            text-align: center;
        `;
        
        const loginForm = document.getElementById('loginForm');
        loginForm.insertBefore(errorDiv, loginForm.firstChild);
    }
    
    errorDiv.textContent = message;
    
    // Remove error after 5 seconds
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    
    // Show login page and hide main app
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');
    
    if (loginPage && mainApp) {
        loginPage.style.display = 'block';
        mainApp.style.display = 'none';
    }
    
    // Reset form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
    }
}

// Include jsPDF library dynamically
if (typeof window !== 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
}

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
  },
  "activities": [
    {"id": "ACT001", "type": "order", "icon": "📋", "text": "New order from ABC Construction Co", "time": "2 hours ago", "timestamp": new Date(Date.now() - 2 * 60 * 60 * 1000)},
    {"id": "ACT002", "type": "alert", "icon": "⚠️", "text": "Low stock alert: Portland Cement", "time": "4 hours ago", "timestamp": new Date(Date.now() - 4 * 60 * 60 * 1000)},
    {"id": "ACT003", "type": "delivery", "icon": "✅", "text": "Order ORD003 delivered to Home Depot", "time": "6 hours ago", "timestamp": new Date(Date.now() - 6 * 60 * 60 * 1000)}
  ]
};

// Chart colors
const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];

// Global variables
let currentModule = 'dashboard';
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize login first
    initializeLogin();
    
    // Check if user is already logged in (for development/demo)
    // In production, this would check session/token storage
    const isAlreadyLoggedIn = false; // Set to true for auto-login during development
    
    if (isAlreadyLoggedIn) {
        // Auto-login for development
        loginUser({
            email: 'demo@constructerp.com',
            name: 'Demo User',
            role: 'Administrator'
        });
    } else {
        // Show login page
        const loginPage = document.getElementById('loginPage');
        const mainApp = document.getElementById('mainApp');
        
        if (loginPage && mainApp) {
            loginPage.style.display = 'block';
            mainApp.style.display = 'none';
        }
    }
});

// Main app initialization (called after login)
function initializeApp() {
    initializeNavigation();
    initializeMobileNavigation();
    initializeCharts();
    populateTables();
    populateInsights();
    populateActivityFeed();
    initializeEventListeners();
    initializeSearch();
}

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

// Activity Feed population
function populateActivityFeed() {
    const container = document.querySelector('.activity-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Sort activities by timestamp (most recent first)
    const sortedActivities = [...appData.activities].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedActivities.forEach(activity => {
        const activityEl = createActivityElement(activity);
        container.appendChild(activityEl);
    });
}

function createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-content">
            <div class="activity-text">${activity.text}</div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `;
    return div;
}

function addActivity(type, icon, text) {
    const activityId = `ACT${(appData.activities.length + 1).toString().padStart(3, '0')}`;
    const now = new Date();
    
    const newActivity = {
        id: activityId,
        type: type,
        icon: icon,
        text: text,
        time: 'Just now',
        timestamp: now
    };
    
    // Add to beginning of activities array
    appData.activities.unshift(newActivity);
    
    // Keep only the most recent 10 activities
    if (appData.activities.length > 10) {
        appData.activities = appData.activities.slice(0, 10);
    }
    
    // Update time labels for existing activities
    updateActivityTimes();
    
    // Refresh the activity feed display
    populateActivityFeed();
}

function updateActivityTimes() {
    const now = new Date();
    
    appData.activities.forEach(activity => {
        const diffMs = now - activity.timestamp;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) {
            activity.time = 'Just now';
        } else if (diffMins < 60) {
            activity.time = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        } else if (diffHours < 24) {
            activity.time = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        } else {
            activity.time = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        }
    });
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
    document.getElementById('exportInventoryBtn')?.addEventListener('click', () => {
        exportInventoryPDF();
    });
    
    document.getElementById('exportCustomersBtn')?.addEventListener('click', () => {
        exportCustomersPDF();
    });
    
    document.getElementById('exportOrdersBtn')?.addEventListener('click', () => {
        exportOrdersPDF();
    });
    
    document.getElementById('exportReportBtn')?.addEventListener('click', () => {
        exportReportsPDF();
    });
    
    // CSV Upload buttons
    document.getElementById('uploadCSVBtn')?.addEventListener('click', () => {
        showCSVUploadSection();
    });
    
    document.getElementById('cancelUploadBtn')?.addEventListener('click', () => {
        hideCSVUploadSection();
    });
    
    document.getElementById('browseLink')?.addEventListener('click', () => {
        document.getElementById('csvFileInput').click();
    });
    
    document.getElementById('csvFileInput')?.addEventListener('change', handleFileSelect);
    
    // Customer CSV Upload buttons
    document.getElementById('uploadCustomerCSVBtn')?.addEventListener('click', () => {
        showCustomerCSVUploadSection();
    });
    
    document.getElementById('cancelCustomerUploadBtn')?.addEventListener('click', () => {
        hideCustomerCSVUploadSection();
    });
    
    document.getElementById('customerBrowseLink')?.addEventListener('click', () => {
        document.getElementById('customerCSVFileInput').click();
    });
    
    document.getElementById('customerCSVFileInput')?.addEventListener('change', handleCustomerFileSelect);
    
    // CSV Preview modal buttons
    document.getElementById('cancelPreviewBtn')?.addEventListener('click', () => {
        hideCSVPreview();
    });
    
    document.getElementById('cancelImportBtn')?.addEventListener('click', () => {
        hideCSVPreview();
    });
    
    document.getElementById('confirmImportBtn')?.addEventListener('click', () => {
        confirmCSVImport();
    });
    
    // Customer CSV Preview modal buttons
    document.getElementById('cancelCustomerPreviewBtn')?.addEventListener('click', () => {
        hideCustomerCSVPreview();
    });
    
    document.getElementById('cancelCustomerImportBtn')?.addEventListener('click', () => {
        hideCustomerCSVPreview();
    });
    
    document.getElementById('confirmCustomerImportBtn')?.addEventListener('click', () => {
        confirmCustomerCSVImport();
    });
    
    // Drag and drop functionality - Inventory CSV
    const dropZone = document.getElementById('fileDropZone');
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        dropZone.addEventListener('drop', handleDrop, false);
    }
    
    // Drag and drop functionality - Customer CSV
    const customerDropZone = document.getElementById('customerFileDropZone');
    if (customerDropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            customerDropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            customerDropZone.addEventListener(eventName, highlightCustomer, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            customerDropZone.addEventListener(eventName, unhighlightCustomer, false);
        });
        
        customerDropZone.addEventListener('drop', handleCustomerDrop, false);
    }
    
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
    const product = appData.products.find(p => p.id === productId);
    if (!product) {
        showNotification('Product not found');
        return;
    }
    
    const content = `
        <form class="form-group" id="editProductForm">
            <div class="form-group">
                <label class="form-label">Product Name</label>
                <input type="text" class="form-control" id="editProductName" value="${product.name}" required>
            </div>
            <div class="form-group">
                <label class="form-label">SKU</label>
                <input type="text" class="form-control" id="editProductSku" value="${product.sku}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-control" id="editProductCategory" required>
                    <option value="Lumber" ${product.category === 'Lumber' ? 'selected' : ''}>Lumber</option>
                    <option value="Concrete" ${product.category === 'Concrete' ? 'selected' : ''}>Concrete</option>
                    <option value="Roofing" ${product.category === 'Roofing' ? 'selected' : ''}>Roofing</option>
                    <option value="Electrical" ${product.category === 'Electrical' ? 'selected' : ''}>Electrical</option>
                    <option value="Plumbing" ${product.category === 'Plumbing' ? 'selected' : ''}>Plumbing</option>
                    <option value="Insulation" ${product.category === 'Insulation' ? 'selected' : ''}>Insulation</option>
                    <option value="Drywall" ${product.category === 'Drywall' ? 'selected' : ''}>Drywall</option>
                    <option value="Flooring" ${product.category === 'Flooring' ? 'selected' : ''}>Flooring</option>
                    <option value="General" ${product.category === 'General' ? 'selected' : ''}>General</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Price</label>
                <input type="number" class="form-control" id="editProductPrice" value="${product.price}" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label class="form-label">Cost</label>
                <input type="number" class="form-control" id="editProductCost" value="${product.cost}" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label class="form-label">Stock Quantity</label>
                <input type="number" class="form-control" id="editProductStock" value="${product.stock}" min="0" required>
            </div>
            <div class="form-group">
                <label class="form-label">Reorder Point</label>
                <input type="number" class="form-control" id="editProductReorder" value="${product.reorderPoint}" min="1" required>
            </div>
            <div class="form-group">
                <label class="form-label">Supplier</label>
                <input type="text" class="form-control" id="editProductSupplier" value="${product.supplier}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Location</label>
                <input type="text" class="form-control" id="editProductLocation" value="${product.location}" required>
            </div>
            <div class="flex gap-8">
                <button type="button" class="btn btn--primary" onclick="saveProductEdit('${productId}')">Save Changes</button>
                <button type="button" class="btn btn--outline" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    showModal(`Edit Product - ${product.name}`, content);
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
    const modal = document.getElementById('modal');
    const form = modal.querySelector('form');
    const customerSelect = form.querySelector('select:nth-of-type(1)');
    const productSelect = form.querySelector('select:nth-of-type(2)');
    const quantityInput = form.querySelector('input[type="number"]');
    
    // Get form values
    const customerId = customerSelect.value;
    const productId = productSelect.value;
    const quantity = parseInt(quantityInput.value) || 1;
    
    const customerData = appData.customers.find(c => c.id === customerId);
    const productData = appData.products.find(p => p.id === productId);
    
    // Generate new order ID
    const orderNumbers = appData.orders.map(o => parseInt(o.id.replace('ORD', ''))).filter(n => !isNaN(n));
    const nextOrderNumber = Math.max(...orderNumbers, 0) + 1;
    const newOrderId = `ORD${nextOrderNumber.toString().padStart(3, '0')}`;
    
    // Calculate total
    const total = productData ? (productData.price * quantity) : 0;
    
    // Create new order object
    const newOrder = {
        id: newOrderId,
        customer: customerData ? customerData.name : 'Unknown Customer',
        date: new Date().toISOString().split('T')[0], // Today's date
        total: total,
        status: 'Processing',
        items: 1
    };
    
    // Add to orders array
    appData.orders.unshift(newOrder); // Add to beginning of array
    
    // Add activity entry for new order
    addActivity('order', '📋', `New order ${newOrderId} from ${customerData ? customerData.name : 'Unknown Customer'}`);
    
    // Refresh the order table
    populateOrderTable();
    
    showNotification(`Quick order ${newOrderId} created successfully!`);
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
    const modal = document.getElementById('modal');
    const form = modal.querySelector('form');
    const customerSelect = form.querySelector('select');
    const dateInput = form.querySelector('input[type="date"]');
    const prioritySelect = form.querySelector('select:nth-of-type(2)');
    
    // Get form values
    const customerId = customerSelect.value;
    const customerData = appData.customers.find(c => c.id === customerId);
    const orderDate = dateInput.value;
    const priority = prioritySelect.value;
    
    // Generate new order ID
    const orderNumbers = appData.orders.map(o => parseInt(o.id.replace('ORD', ''))).filter(n => !isNaN(n));
    const nextOrderNumber = Math.max(...orderNumbers, 0) + 1;
    const newOrderId = `ORD${nextOrderNumber.toString().padStart(3, '0')}`;
    
    // Create new order object
    const newOrder = {
        id: newOrderId,
        customer: customerData ? customerData.name : 'Unknown Customer',
        date: orderDate,
        total: 0.00, // Will be updated when items are added
        status: 'Processing',
        items: 0 // Will be updated when items are added
    };
    
    // Add to orders array
    appData.orders.unshift(newOrder); // Add to beginning of array
    
    // Add activity entry for new order
    addActivity('order', '📋', `New order ${newOrderId} from ${customerData ? customerData.name : 'Unknown Customer'}`);
    
    // Refresh the order table
    populateOrderTable();
    
    showNotification(`Order ${newOrderId} created successfully!`);
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

// PDF Export Functions
function exportInventoryPDF() {
    // Check if jsPDF is loaded
    if (typeof window.jsPDF === 'undefined') {
        showNotification('PDF export library is still loading. Please try again in a moment.');
        return;
    }

    try {
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('ConstructERP - Inventory Report', 20, 30);
        
        // Add date
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Generated on: ${today}`, 20, 45);
        
        // Add summary stats
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary:', 20, 65);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const totalProducts = appData.products.length;
        const totalValue = appData.products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        const lowStockCount = appData.products.filter(p => p.stock <= p.reorderPoint).length;
        
        doc.text(`Total Products: ${totalProducts}`, 25, 75);
        doc.text(`Total Inventory Value: $${totalValue.toLocaleString()}`, 25, 85);
        doc.text(`Low Stock Items: ${lowStockCount}`, 25, 95);
        
        // Add table header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Product Details:', 20, 115);
        
        // Table headers
        const startY = 125;
        doc.setFontSize(10);
        doc.text('SKU', 20, startY);
        doc.text('Product Name', 45, startY);
        doc.text('Category', 100, startY);
        doc.text('Stock', 135, startY);
        doc.text('Price', 155, startY);
        doc.text('Status', 175, startY);
        
        // Draw line under headers
        doc.line(20, startY + 2, 200, startY + 2);
        
        // Add product data
        let currentY = startY + 10;
        doc.setFont('helvetica', 'normal');
        
        appData.products.forEach((product, index) => {
            if (currentY > 270) { // Check if we need a new page
                doc.addPage();
                currentY = 30;
            }
            
            const stockStatus = getStockStatus(product.stock, product.reorderPoint);
            
            doc.text(product.sku, 20, currentY);
            doc.text(product.name.substring(0, 30), 45, currentY); // Truncate long names
            doc.text(product.category, 100, currentY);
            doc.text(product.stock.toString(), 135, currentY);
            doc.text(`$${product.price.toFixed(2)}`, 155, currentY);
            doc.text(stockStatus.text, 175, currentY);
            
            currentY += 8;
        });
        
        // Save the PDF
        doc.save('ConstructERP-Inventory-Report.pdf');
        showNotification('Inventory report exported successfully!');
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        showNotification('Error exporting PDF. Please try again.');
    }
}

function exportCustomersPDF() {
    // Check if jsPDF is loaded
    if (typeof window.jsPDF === 'undefined') {
        showNotification('PDF export library is still loading. Please try again in a moment.');
        return;
    }

    try {
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('ConstructERP - Customer Report', 20, 30);
        
        // Add date
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Generated on: ${today}`, 20, 45);
        
        // Add summary stats
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary:', 20, 65);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const totalCustomers = appData.customers.length;
        const totalRevenue = appData.customers.reduce((sum, c) => sum + c.revenue, 0);
        const highRiskCount = appData.customers.filter(c => c.churnRisk === 'High').length;
        
        doc.text(`Total Customers: ${totalCustomers}`, 25, 75);
        doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 25, 85);
        doc.text(`High Risk Customers: ${highRiskCount}`, 25, 95);
        
        // Add table header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Customer Details:', 20, 115);
        
        // Table headers
        const startY = 125;
        doc.setFontSize(10);
        doc.text('Customer Name', 20, startY);
        doc.text('Type', 80, startY);
        doc.text('Revenue', 120, startY);
        doc.text('Orders', 150, startY);
        doc.text('Risk', 170, startY);
        
        // Draw line under headers
        doc.line(20, startY + 2, 200, startY + 2);
        
        // Add customer data
        let currentY = startY + 10;
        doc.setFont('helvetica', 'normal');
        
        appData.customers.forEach((customer, index) => {
            if (currentY > 270) { // Check if we need a new page
                doc.addPage();
                currentY = 30;
            }
            
            doc.text(customer.name.substring(0, 25), 20, currentY); // Truncate long names
            doc.text(customer.type, 80, currentY);
            doc.text(`$${customer.revenue.toLocaleString()}`, 120, currentY);
            doc.text(customer.orders.toString(), 150, currentY);
            doc.text(customer.churnRisk, 170, currentY);
            
            currentY += 8;
        });
        
        // Save the PDF
        doc.save('ConstructERP-Customer-Report.pdf');
        showNotification('Customer report exported successfully!');
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        showNotification('Error exporting PDF. Please try again.');
    }
}

function exportOrdersPDF() {
    // Check if jsPDF is loaded
    if (typeof window.jsPDF === 'undefined') {
        showNotification('PDF export library is still loading. Please try again in a moment.');
        return;
    }

    try {
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('ConstructERP - Orders Report', 20, 30);
        
        // Add date
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Generated on: ${today}`, 20, 45);
        
        // Add summary stats
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary:', 20, 65);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const totalOrders = appData.orders.length;
        const totalValue = appData.orders.reduce((sum, o) => sum + o.total, 0);
        const processingCount = appData.orders.filter(o => o.status === 'Processing').length;
        
        doc.text(`Total Orders: ${totalOrders}`, 25, 75);
        doc.text(`Total Value: $${totalValue.toLocaleString()}`, 25, 85);
        doc.text(`Processing Orders: ${processingCount}`, 25, 95);
        
        // Add table header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Order Details:', 20, 115);
        
        // Table headers
        const startY = 125;
        doc.setFontSize(10);
        doc.text('Order ID', 20, startY);
        doc.text('Customer', 50, startY);
        doc.text('Date', 110, startY);
        doc.text('Total', 140, startY);
        doc.text('Status', 170, startY);
        
        // Draw line under headers
        doc.line(20, startY + 2, 200, startY + 2);
        
        // Add order data
        let currentY = startY + 10;
        doc.setFont('helvetica', 'normal');
        
        appData.orders.forEach((order, index) => {
            if (currentY > 270) { // Check if we need a new page
                doc.addPage();
                currentY = 30;
            }
            
            doc.text(order.id, 20, currentY);
            doc.text(order.customer.substring(0, 25), 50, currentY); // Truncate long names
            doc.text(formatDate(order.date), 110, currentY);
            doc.text(`$${order.total.toFixed(2)}`, 140, currentY);
            doc.text(order.status, 170, currentY);
            
            currentY += 8;
        });
        
        // Save the PDF
        doc.save('ConstructERP-Orders-Report.pdf');
        showNotification('Orders report exported successfully!');
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        showNotification('Error exporting PDF. Please try again.');
    }
}

function exportReportsPDF() {
    // Check if jsPDF is loaded
    if (typeof window.jsPDF === 'undefined') {
        showNotification('PDF export library is still loading. Please try again in a moment.');
        return;
    }

    try {
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('ConstructERP - Analytics Report', 20, 30);
        
        // Add date
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Generated on: ${today}`, 20, 45);
        
        // Add KPI metrics
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Performance Indicators', 20, 65);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        let yPos = 80;
        
        doc.text(`Monthly Revenue: $${appData.metrics.monthlyRevenue.toLocaleString()}`, 25, yPos);
        yPos += 10;
        doc.text(`Total Orders: ${appData.metrics.totalOrders}`, 25, yPos);
        yPos += 10;
        doc.text(`Active Customers: ${appData.metrics.activeCustomers}`, 25, yPos);
        yPos += 10;
        doc.text(`Low Stock Items: ${appData.metrics.lowStockItems}`, 25, yPos);
        yPos += 10;
        doc.text(`Sales Growth: ${appData.metrics.salesGrowth}%`, 25, yPos);
        yPos += 10;
        doc.text(`Inventory Turnover: ${appData.metrics.inventoryTurnover}x`, 25, yPos);
        yPos += 10;
        doc.text(`Average Order Value: $${appData.metrics.avgOrderValue.toFixed(2)}`, 25, yPos);
        yPos += 10;
        doc.text(`Customer Satisfaction: ${appData.metrics.customerSatisfaction}/5.0`, 25, yPos);
        
        // Add insights section
        yPos += 20;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('AI Insights & Recommendations', 20, yPos);
        
        yPos += 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        appData.insights.forEach((insight, index) => {
            if (yPos > 260) { // Check if we need a new page
                doc.addPage();
                yPos = 30;
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text(`${insight.severity.toUpperCase()}: ${insight.title}`, 25, yPos);
            yPos += 8;
            
            doc.setFont('helvetica', 'normal');
            doc.text(insight.description, 25, yPos);
            yPos += 8;
            
            doc.setFont('helvetica', 'italic');
            doc.text(`Action: ${insight.action}`, 25, yPos);
            yPos += 15;
        });
        
        // Add financial summary on new page
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Financial Summary', 20, 30);
        
        // Revenue by category (mock data)
        doc.setFontSize(14);
        doc.text('Revenue by Product Category:', 20, 50);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const categories = ['Lumber', 'Concrete', 'Roofing', 'Electrical', 'Plumbing'];
        const revenues = [89000, 67000, 45000, 34000, 28000];
        
        let summaryY = 65;
        categories.forEach((category, index) => {
            doc.text(`${category}: $${revenues[index].toLocaleString()}`, 25, summaryY);
            summaryY += 10;
        });
        
        // Save the PDF
        doc.save('ConstructERP-Analytics-Report.pdf');
        showNotification('Analytics report exported successfully!');
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        showNotification('Error exporting PDF. Please try again.');
    }
}

// CSV Upload Functions
let parsedCSVData = null;

function showCSVUploadSection() {
    const uploadSection = document.getElementById('csvUploadSection');
    if (uploadSection) {
        uploadSection.style.display = 'block';
    }
}

function hideCSVUploadSection() {
    const uploadSection = document.getElementById('csvUploadSection');
    const progressSection = document.getElementById('uploadProgress');
    const fileInput = document.getElementById('csvFileInput');
    
    if (uploadSection) {
        uploadSection.style.display = 'none';
    }
    if (progressSection) {
        progressSection.style.display = 'none';
    }
    if (fileInput) {
        fileInput.value = '';
    }
    
    resetProgressBar();
}

// Drag and drop handlers
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    const dropZone = document.getElementById('fileDropZone');
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

function unhighlight(e) {
    const dropZone = document.getElementById('fileDropZone');
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showNotification('Please select a CSV file.');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size too large. Please select a file smaller than 5MB.');
        return;
    }
    
    processCSVFile(file);
}

function processCSVFile(file) {
    showProgress('Uploading file...');
    updateProgress(10);
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        updateProgress(30);
        const csvContent = e.target.result;
        
        setTimeout(() => {
            updateProgress(50, 'Parsing CSV data...');
            
            try {
                const parsedData = parseCSVContent(csvContent);
                updateProgress(70, 'Running AI analysis...');
                
                setTimeout(() => {
                    const aiProcessedData = runAIAnalysis(parsedData);
                    updateProgress(100, 'Complete!');
                    
                    setTimeout(() => {
                        hideProgress();
                        showCSVPreview(aiProcessedData);
                    }, 500);
                }, 1000);
                
            } catch (error) {
                console.error('CSV Processing Error:', error);
                hideProgress();
                showNotification('Error processing CSV file. Please check the file format.');
            }
        }, 500);
    };
    
    reader.onerror = function() {
        hideProgress();
        showNotification('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
}

function confirmCustomerCSVImport() {
    if (!parsedCustomerCSVData || !parsedCustomerCSVData.cleanedData) {
        showNotification('No customer data to import.');
        return;
    }
    
    // Add new customers to the existing customer database
    const newCustomers = parsedCustomerCSVData.cleanedData;
    
    // Check for duplicate customer names and handle them
    const existingNames = new Set(appData.customers.map(c => c.name.toLowerCase()));
    const importedCustomers = [];
    let duplicateCount = 0;
    let updatedCount = 0;
    
    newCustomers.forEach(customer => {
        const lowerName = customer.name.toLowerCase();
        
        if (existingNames.has(lowerName)) {
            // Find existing customer and update data
            const existingCustomer = appData.customers.find(c => c.name.toLowerCase() === lowerName);
            if (existingCustomer) {
                // Update existing customer with new data (merge/overwrite logic)
                if (customer.revenue > 0) existingCustomer.revenue = customer.revenue;
                if (customer.orders > 0) existingCustomer.orders = customer.orders;
                if (customer.type !== 'General Contractor') existingCustomer.type = customer.type;
                if (customer.paymentTerms !== 'Net 30') existingCustomer.paymentTerms = customer.paymentTerms;
                if (customer.churnRisk !== 'Low') existingCustomer.churnRisk = customer.churnRisk;
                if (customer.lastOrder) existingCustomer.lastOrder = customer.lastOrder;
                
                updatedCount++;
            }
            duplicateCount++;
        } else {
            // Add new customer
            existingNames.add(lowerName);
            appData.customers.push(customer);
            importedCustomers.push(customer);
        }
    });
    
    // Refresh the customer display
    populateCustomerTable();
    updateCustomerStats();
    
    // Add activity
    if (importedCustomers.length > 0) {
        addActivity('import', '👥', `Imported ${importedCustomers.length} new customers from CSV`);
    }
    if (updatedCount > 0) {
        addActivity('update', '🔄', `Updated ${updatedCount} existing customers from CSV`);
    }
    
    // Hide modal and upload section
    hideCustomerCSVPreview();
    hideCustomerCSVUploadSection();
    
    // Show success message
    let message = '';
    if (importedCustomers.length > 0 && updatedCount > 0) {
        message = `Successfully imported ${importedCustomers.length} new customers and updated ${updatedCount} existing customers!`;
    } else if (importedCustomers.length > 0) {
        message = `Successfully imported ${importedCustomers.length} new customers!`;
    } else if (updatedCount > 0) {
        message = `Successfully updated ${updatedCount} existing customers!`;
    } else {
        message = 'No new customers were imported. All customers already exist in the system.';
    }
    
    if (duplicateCount > 0 && importedCustomers.length === 0) {
        message += ` ${duplicateCount} duplicate customers were found and updated with new information.`;
    }
    
    showNotification(message);
}

function updateCustomerStats() {
    // Update customer-related statistics
    const totalCustomers = appData.customers.length;
    const totalRevenue = appData.customers.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const highRiskCount = appData.customers.filter(c => c.churnRisk === 'High').length;
    
    // Update metrics object
    appData.metrics.activeCustomers = totalCustomers;
    
    // Find and update customer stat displays if they exist
    const customerStatElements = document.querySelectorAll('[data-stat="customers"]');
    customerStatElements.forEach(element => {
        element.textContent = totalCustomers;
    });
    
    const revenueStatElements = document.querySelectorAll('[data-stat="revenue"]');
    revenueStatElements.forEach(element => {
        element.textContent = `$${totalRevenue.toLocaleString()}`;
    });
    
    // Update insights if any critical customer risks are detected
    if (highRiskCount > 0) {
        const existingChurnInsight = appData.insights.find(i => i.type === 'customer' && i.title.includes('Churn'));
        if (existingChurnInsight) {
            existingChurnInsight.description = `${highRiskCount} customers show high churn probability`;
        } else {
            appData.insights.unshift({
                type: 'customer',
                severity: 'critical',
                title: 'Customer Churn Risk',
                description: `${highRiskCount} customers show high churn probability`,
                action: 'Review customer engagement and retention strategies'
            });
        }
        
        // Refresh insights display
        populateInsights();
    }
}

function showCustomerCSVPreview(processedData) {
    const modal = document.getElementById('customerCSVPreviewModal');
    const analysisDiv = document.getElementById('customerAIAnalysis');
    const previewTable = document.getElementById('customerPreviewTable');
    const importSummary = document.getElementById('customerImportSummary');
    
    if (!modal || !analysisDiv || !previewTable || !importSummary) return;
    
    // Populate AI analysis
    let analysisHTML = '<h4>🤖 AI Analysis Results</h4>';
    processedData.insights.forEach(insight => {
        analysisHTML += `
            <div class="analysis-item">
                <span class="analysis-icon">${insight.icon}</span>
                <span class="analysis-text">${insight.text}</span>
            </div>`;
    });
    
    // Add field mapping section
    analysisHTML += `
        <div class="field-mapping">
            <h5>📋 Field Mapping</h5>
            <div class="mapping-list">`;
    
    Object.entries(processedData.fieldMapping).forEach(([original, mapped]) => {
        if (mapped !== 'unmapped') {
            analysisHTML += `
                <div class="mapping-item">
                    <span>${original}</span>
                    <span class="mapping-arrow">→</span>
                    <span>${mapped}</span>
                </div>`;
        }
    });
    
    analysisHTML += '</div></div>';
    analysisDiv.innerHTML = analysisHTML;
    
    // Populate preview table
    let tableHTML = `
        <thead>
            <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Churn Risk</th>
                <th>Payment Terms</th>
            </tr>
        </thead>
        <tbody>`;
    
    processedData.cleanedData.slice(0, 10).forEach(customer => {
        tableHTML += `
            <tr>
                <td>${customer.name || 'N/A'}</td>
                <td>${customer.type || 'N/A'}</td>
                <td>$${(customer.revenue || 0).toLocaleString()}</td>
                <td>${customer.orders || 0}</td>
                <td>${customer.churnRisk || 'Low'}</td>
                <td>${customer.paymentTerms || 'Net 30'}</td>
            </tr>`;
    });
    
    if (processedData.cleanedData.length > 10) {
        tableHTML += `<tr><td colspan="6" style="text-align: center; font-style: italic;">... and ${processedData.cleanedData.length - 10} more customers</td></tr>`;
    }
    
    tableHTML += '</tbody>';
    previewTable.innerHTML = tableHTML;
    
    // Update import summary
    importSummary.innerHTML = `Ready to import ${processedData.cleanedData.length} customers (${processedData.summary.invalidRows} rows skipped due to missing required data)`;
    
    // Show modal
    modal.style.display = 'flex';
}

function hideCustomerCSVPreview() {
    const modal = document.getElementById('customerCSVPreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
    parsedCustomerCSVData = null;
}

// Customer-specific AI analysis functions
function runCustomerAIAnalysis(parsedData) {
    // AI-powered field mapping and data validation for customers
    const { headers, data } = parsedData;
    
    // Field mapping intelligence for customers
    const fieldMapping = intelligentCustomerFieldMapping(headers);
    
    // Data validation and cleaning for customers
    const cleanedData = validateAndCleanCustomerData(data, fieldMapping);
    
    // Generate customer insights
    const insights = generateCustomerDataInsights(cleanedData, fieldMapping);
    
    parsedCustomerCSVData = {
        originalHeaders: headers,
        fieldMapping,
        cleanedData,
        insights,
        summary: {
            totalRows: data.length,
            validRows: cleanedData.length,
            invalidRows: data.length - cleanedData.length
        }
    };
    
    return parsedCustomerCSVData;
}

function intelligentCustomerFieldMapping(headers) {
    const mapping = {};
    const standardFields = {
        name: ['name', 'customer_name', 'company_name', 'business_name', 'client_name', 'company'],
        type: ['type', 'customer_type', 'business_type', 'category', 'classification', 'segment'],
        revenue: ['revenue', 'total_revenue', 'annual_revenue', 'sales', 'income', 'value'],
        orders: ['orders', 'order_count', 'total_orders', 'order_number', 'purchases'],
        paymentTerms: ['payment_terms', 'terms', 'payment', 'net_terms', 'payment_period'],
        churnRisk: ['churn_risk', 'risk', 'churn', 'risk_level', 'retention_risk'],
        lastOrder: ['last_order', 'last_order_date', 'most_recent_order', 'latest_order'],
        contact: ['contact', 'email', 'phone', 'contact_info', 'contact_person'],
        address: ['address', 'location', 'street', 'city', 'state', 'zip'],
        status: ['status', 'account_status', 'customer_status', 'active']
    };
    
    headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;
        
        Object.entries(standardFields).forEach(([standardField, patterns]) => {
            patterns.forEach(pattern => {
                if (lowerHeader.includes(pattern)) {
                    const score = pattern.length / lowerHeader.length;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = standardField;
                    }
                }
            });
        });
        
        if (bestMatch) {
            mapping[header] = bestMatch;
        } else {
            mapping[header] = 'unmapped';
        }
    });
    
    return mapping;
}

function validateAndCleanCustomerData(data, fieldMapping) {
    const cleanedData = [];
    
    data.forEach(row => {
        const cleanedRow = {};
        let isValid = true;
        
        Object.entries(fieldMapping).forEach(([originalField, mappedField]) => {
            const value = row[originalField];
            
            if (mappedField !== 'unmapped') {
                const cleanedValue = cleanCustomerFieldValue(value, mappedField);
                if (cleanedValue !== null) {
                    cleanedRow[mappedField] = cleanedValue;
                } else if (mappedField === 'name') {
                    // Name is required for customers
                    isValid = false;
                }
            }
        });
        
        if (isValid && cleanedRow.name) {
            // Generate missing required fields
            if (!cleanedRow.id) {
                cleanedRow.id = generateCustomerId();
            }
            if (!cleanedRow.type) {
                cleanedRow.type = inferCustomerType(cleanedRow.name);
            }
            if (!cleanedRow.revenue) {
                cleanedRow.revenue = 0;
            }
            if (!cleanedRow.orders) {
                cleanedRow.orders = 0;
            }
            if (!cleanedRow.status) {
                cleanedRow.status = 'Active';
            }
            if (!cleanedRow.paymentTerms) {
                cleanedRow.paymentTerms = 'Net 30';
            }
            if (!cleanedRow.churnRisk) {
                cleanedRow.churnRisk = 'Low';
            }
            if (!cleanedRow.lastOrder) {
                cleanedRow.lastOrder = new Date().toISOString().split('T')[0];
            }
            
            cleanedData.push(cleanedRow);
        }
    });
    
    return cleanedData;
}

function cleanCustomerFieldValue(value, fieldType) {
    if (!value || value.trim() === '') return null;
    
    const trimmedValue = value.trim();
    
    switch (fieldType) {
        case 'revenue':
            const revenueValue = parseFloat(trimmedValue.replace(/[^0-9.-]/g, ''));
            return isNaN(revenueValue) ? 0 : Math.max(0, revenueValue);
            
        case 'orders':
            const ordersValue = parseInt(trimmedValue.replace(/[^0-9]/g, ''));
            return isNaN(ordersValue) ? 0 : Math.max(0, ordersValue);
            
        case 'churnRisk':
            const lowerRisk = trimmedValue.toLowerCase();
            if (lowerRisk.includes('high') || lowerRisk.includes('critical')) return 'High';
            if (lowerRisk.includes('medium') || lowerRisk.includes('moderate')) return 'Medium';
            return 'Low';
            
        case 'type':
            const lowerType = trimmedValue.toLowerCase();
            if (lowerType.includes('general')) return 'General Contractor';
            if (lowerType.includes('trade')) return 'Trade Contractor';
            if (lowerType.includes('retail')) return 'Retailer';
            if (lowerType.includes('residential')) return 'Residential Contractor';
            return trimmedValue;
            
        case 'paymentTerms':
            const terms = trimmedValue.toLowerCase();
            if (terms.includes('15')) return 'Net 15';
            if (terms.includes('45')) return 'Net 45';
            if (terms.includes('30')) return 'Net 30';
            return trimmedValue;
            
        case 'status':
            const statusLower = trimmedValue.toLowerCase();
            if (statusLower.includes('active') || statusLower.includes('current')) return 'Active';
            if (statusLower.includes('inactive') || statusLower.includes('closed')) return 'Inactive';
            return trimmedValue;
            
        case 'lastOrder':
            // Try to parse date
            const date = new Date(trimmedValue);
            return isNaN(date) ? null : date.toISOString().split('T')[0];
            
        case 'name':
        case 'contact':
        case 'address':
        default:
            return trimmedValue;
    }
}

function generateCustomerId() {
    const existingIds = appData.customers.map(c => parseInt(c.id.replace('C', '')));
    const nextId = Math.max(...existingIds, 0) + 1;
    return `C${nextId.toString().padStart(3, '0')}`;
}

function inferCustomerType(customerName) {
    if (!customerName) return 'General Contractor';
    
    const name = customerName.toLowerCase();
    const typeKeywords = {
        'Trade Contractor': ['plumbing', 'electrical', 'roofing', 'hvac', 'flooring', 'painting', 'concrete'],
        'Retailer': ['depot', 'store', 'supply', 'mart', 'warehouse', 'retail'],
        'Residential Contractor': ['residential', 'home', 'house', 'builder', 'custom'],
        'General Contractor': ['construction', 'contracting', 'building', 'development']
    };
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
        if (keywords.some(keyword => name.includes(keyword))) {
            return type;
        }
    }
    
    return 'General Contractor';
}

function generateCustomerDataInsights(cleanedData, fieldMapping) {
    const insights = [];
    
    // Data quality insights
    const totalFields = Object.keys(fieldMapping).length;
    const mappedFields = Object.values(fieldMapping).filter(v => v !== 'unmapped').length;
    const mappingRate = (mappedFields / totalFields * 100).toFixed(1);
    
    insights.push({
        icon: '🎯',
        text: `Successfully mapped ${mappedFields}/${totalFields} fields (${mappingRate}%)`
    });
    
    // Customer type distribution
    const types = {};
    cleanedData.forEach(customer => {
        types[customer.type] = (types[customer.type] || 0) + 1;
    });
    
    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
    if (topType) {
        insights.push({
            icon: '👥',
            text: `Most common type: ${topType[0]} (${topType[1]} customers)`
        });
    }
    
    // Revenue analysis
    const revenues = cleanedData.filter(customer => customer.revenue > 0).map(customer => customer.revenue);
    if (revenues.length > 0) {
        const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue, 0);
        const avgRevenue = (totalRevenue / revenues.length).toFixed(2);
        insights.push({
            icon: '💰',
            text: `Total revenue: $${totalRevenue.toLocaleString()} (avg: $${Number(avgRevenue).toLocaleString()})`
        });
    }
    
    // Churn risk analysis
    const churnRisks = {};
    cleanedData.forEach(customer => {
        churnRisks[customer.churnRisk] = (churnRisks[customer.churnRisk] || 0) + 1;
    });
    
    const highRiskCount = churnRisks['High'] || 0;
    if (highRiskCount > 0) {
        insights.push({
            icon: '⚠️',
            text: `${highRiskCount} customers at high churn risk - needs attention`
        });
    } else {
        insights.push({
            icon: '✅',
            text: `Low churn risk across customer base - healthy retention`
        });
    }
    
    return insights;
}

function parseCSVContent(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
    }
    
    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
    }
    
    return { headers, data };
}

function runAIAnalysis(parsedData) {
    // AI-powered field mapping and data validation
    const { headers, data } = parsedData;
    
    // Field mapping intelligence
    const fieldMapping = intelligentFieldMapping(headers);
    
    // Data validation and cleaning
    const cleanedData = validateAndCleanData(data, fieldMapping);
    
    // Generate insights
    const insights = generateDataInsights(cleanedData, fieldMapping);
    
    parsedCSVData = {
        originalHeaders: headers,
        fieldMapping,
        cleanedData,
        insights,
        summary: {
            totalRows: data.length,
            validRows: cleanedData.length,
            invalidRows: data.length - cleanedData.length
        }
    };
    
    return parsedCSVData;
}

function intelligentFieldMapping(headers) {
    const mapping = {};
    const standardFields = {
        sku: ['sku', 'product_code', 'item_code', 'code', 'part_number', 'item_id'],
        name: ['name', 'product_name', 'item_name', 'description', 'title', 'product'],
        category: ['category', 'type', 'class', 'group', 'department', 'section'],
        price: ['price', 'unit_price', 'cost', 'amount', 'value', 'rate'],
        stock: ['stock', 'quantity', 'qty', 'inventory', 'available', 'on_hand'],
        supplier: ['supplier', 'vendor', 'manufacturer', 'brand', 'company'],
        location: ['location', 'warehouse', 'bin', 'shelf', 'zone', 'area']
    };
    
    headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;
        
        Object.entries(standardFields).forEach(([standardField, patterns]) => {
            patterns.forEach(pattern => {
                if (lowerHeader.includes(pattern)) {
                    const score = pattern.length / lowerHeader.length;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = standardField;
                    }
                }
            });
        });
        
        if (bestMatch) {
            mapping[header] = bestMatch;
        } else {
            mapping[header] = 'unmapped';
        }
    });
    
    return mapping;
}

function validateAndCleanData(data, fieldMapping) {
    const cleanedData = [];
    
    data.forEach(row => {
        const cleanedRow = {};
        let isValid = true;
        
        Object.entries(fieldMapping).forEach(([originalField, mappedField]) => {
            const value = row[originalField];
            
            if (mappedField !== 'unmapped') {
                const cleanedValue = cleanFieldValue(value, mappedField);
                if (cleanedValue !== null) {
                    cleanedRow[mappedField] = cleanedValue;
                } else if (mappedField === 'name' || mappedField === 'sku') {
                    // Required fields
                    isValid = false;
                }
            }
        });
        
        if (isValid && (cleanedRow.name || cleanedRow.sku)) {
            // Generate missing required fields
            if (!cleanedRow.id) {
                cleanedRow.id = generateProductId();
            }
            if (!cleanedRow.sku) {
                cleanedRow.sku = generateSKU(cleanedRow.name, cleanedRow.category);
            }
            if (!cleanedRow.category) {
                cleanedRow.category = inferCategory(cleanedRow.name);
            }
            if (!cleanedRow.price) {
                cleanedRow.price = 0.00;
            }
            if (!cleanedRow.stock) {
                cleanedRow.stock = 0;
            }
            if (!cleanedRow.reorderPoint) {
                cleanedRow.reorderPoint = Math.max(1, Math.floor((cleanedRow.stock || 0) * 0.2));
            }
            if (!cleanedRow.cost) {
                cleanedRow.cost = (cleanedRow.price || 0) * 0.7; // Estimate 70% of price
            }
            if (!cleanedRow.supplier) {
                cleanedRow.supplier = 'Unknown Supplier';
            }
            if (!cleanedRow.location) {
                cleanedRow.location = 'Warehouse A';
            }
            
            cleanedData.push(cleanedRow);
        }
    });
    
    return cleanedData;
}

function cleanFieldValue(value, fieldType) {
    if (!value || value.trim() === '') return null;
    
    const trimmedValue = value.trim();
    
    switch (fieldType) {
        case 'price':
        case 'cost':
            const numericValue = parseFloat(trimmedValue.replace(/[^0-9.-]/g, ''));
            return isNaN(numericValue) ? 0 : Math.max(0, numericValue);
            
        case 'stock':
        case 'reorderPoint':
            const intValue = parseInt(trimmedValue.replace(/[^0-9]/g, ''));
            return isNaN(intValue) ? 0 : Math.max(0, intValue);
            
        case 'name':
        case 'sku':
        case 'category':
        case 'supplier':
        case 'location':
            return trimmedValue;
            
        default:
            return trimmedValue;
    }
}

function generateProductId() {
    const existingIds = appData.products.map(p => parseInt(p.id.replace('P', '')));
    const nextId = Math.max(...existingIds, 0) + 1;
    return `P${nextId.toString().padStart(3, '0')}`;
}

function generateSKU(name, category) {
    const categoryPrefix = category ? category.substring(0, 3).toUpperCase() : 'GEN';
    const namePrefix = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') : 'XXX';
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${categoryPrefix}-${namePrefix}-${randomSuffix}`;
}

function inferCategory(productName) {
    if (!productName) return 'General';
    
    const name = productName.toLowerCase();
    const categoryKeywords = {
        'Lumber': ['wood', 'lumber', 'board', '2x4', '2x6', '2x8', 'plywood', 'timber'],
        'Concrete': ['concrete', 'cement', 'mortar', 'grout', 'aggregate'],
        'Roofing': ['roof', 'shingle', 'tile', 'membrane', 'gutter', 'flashing'],
        'Electrical': ['wire', 'cable', 'outlet', 'switch', 'breaker', 'conduit'],
        'Plumbing': ['pipe', 'fitting', 'valve', 'faucet', 'drain', 'water'],
        'Insulation': ['insulation', 'foam', 'fiberglass', 'barrier'],
        'Drywall': ['drywall', 'sheetrock', 'gypsum', 'wallboard'],
        'Flooring': ['floor', 'tile', 'carpet', 'vinyl', 'hardwood']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => name.includes(keyword))) {
            return category;
        }
    }
    
    return 'General';
}

function generateDataInsights(cleanedData, fieldMapping) {
    const insights = [];
    
    // Data quality insights
    const totalFields = Object.keys(fieldMapping).length;
    const mappedFields = Object.values(fieldMapping).filter(v => v !== 'unmapped').length;
    const mappingRate = (mappedFields / totalFields * 100).toFixed(1);
    
    insights.push({
        icon: '🎯',
        text: `Successfully mapped ${mappedFields}/${totalFields} fields (${mappingRate}%)`
    });
    
    // Category distribution
    const categories = {};
    cleanedData.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + 1;
    });
    
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        insights.push({
            icon: '📊',
            text: `Most common category: ${topCategory[0]} (${topCategory[1]} items)`
        });
    }
    
    // Price analysis
    const prices = cleanedData.filter(item => item.price > 0).map(item => item.price);
    if (prices.length > 0) {
        const avgPrice = (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2);
        insights.push({
            icon: '💰',
            text: `Average price: $${avgPrice} across ${prices.length} priced items`
        });
    }
    
    // Stock analysis
    const stockItems = cleanedData.filter(item => item.stock > 0);
    if (stockItems.length > 0) {
        const totalStock = stockItems.reduce((sum, item) => sum + item.stock, 0);
        insights.push({
            icon: '📦',
            text: `Total inventory: ${totalStock.toLocaleString()} units across ${stockItems.length} items`
        });
    }
    
    return insights;
}

function showCSVPreview(processedData) {
    const modal = document.getElementById('csvPreviewModal');
    const analysisDiv = document.getElementById('aiAnalysis');
    const previewTable = document.getElementById('previewTable');
    const importSummary = document.getElementById('importSummary');
    
    if (!modal || !analysisDiv || !previewTable || !importSummary) return;
    
    // Populate AI analysis
    let analysisHTML = '<h4>🤖 AI Analysis Results</h4>';
    processedData.insights.forEach(insight => {
        analysisHTML += `
            <div class="analysis-item">
                <span class="analysis-icon">${insight.icon}</span>
                <span class="analysis-text">${insight.text}</span>
            </div>`;
    });
    
    // Add field mapping section
    analysisHTML += `
        <div class="field-mapping">
            <h5>📋 Field Mapping</h5>
            <div class="mapping-list">`;
    
    Object.entries(processedData.fieldMapping).forEach(([original, mapped]) => {
        if (mapped !== 'unmapped') {
            analysisHTML += `
                <div class="mapping-item">
                    <span>${original}</span>
                    <span class="mapping-arrow">→</span>
                    <span>${mapped}</span>
                </div>`;
        }
    });
    
    analysisHTML += '</div></div>';
    analysisDiv.innerHTML = analysisHTML;
    
    // Populate preview table
    let tableHTML = `
        <thead>
            <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Supplier</th>
            </tr>
        </thead>
        <tbody>`;
    
    processedData.cleanedData.slice(0, 10).forEach(item => {
        tableHTML += `
            <tr>
                <td>${item.sku || 'N/A'}</td>
                <td>${item.name || 'N/A'}</td>
                <td>${item.category || 'N/A'}</td>
                <td>$${(item.price || 0).toFixed(2)}</td>
                <td>${item.stock || 0}</td>
                <td>${item.supplier || 'N/A'}</td>
            </tr>`;
    });
    
    if (processedData.cleanedData.length > 10) {
        tableHTML += `<tr><td colspan="6" style="text-align: center; font-style: italic;">... and ${processedData.cleanedData.length - 10} more items</td></tr>`;
    }
    
    tableHTML += '</tbody>';
    previewTable.innerHTML = tableHTML;
    
    // Update import summary
    importSummary.innerHTML = `Ready to import ${processedData.cleanedData.length} products (${processedData.summary.invalidRows} rows skipped due to missing required data)`;
    
    // Show modal
    modal.style.display = 'flex';
}

function hideCSVPreview() {
    const modal = document.getElementById('csvPreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
    parsedCSVData = null;
}

function confirmCSVImport() {
    if (!parsedCSVData || !parsedCSVData.cleanedData) {
        showNotification('No data to import.');
        return;
    }
    
    // Add new products to the existing inventory
    const newProducts = parsedCSVData.cleanedData;
    
    // Check for duplicate SKUs and handle them
    const existingSKUs = new Set(appData.products.map(p => p.sku));
    const importedProducts = [];
    let duplicateCount = 0;
    
    newProducts.forEach(product => {
        if (existingSKUs.has(product.sku)) {
            // Generate new SKU for duplicate
            let newSku = product.sku;
            let counter = 1;
            while (existingSKUs.has(newSku)) {
                newSku = `${product.sku}-${counter}`;
                counter++;
            }
            product.sku = newSku;
            duplicateCount++;
        }
        
        existingSKUs.add(product.sku);
        appData.products.push(product);
        importedProducts.push(product);
    });
    
    // Refresh the inventory display
    populateProductTable();
    updateInventoryStats();
    
    // Add activity
    addActivity('import', '📥', `Imported ${importedProducts.length} products from CSV`);
    
    // Hide modal and upload section
    hideCSVPreview();
    hideCSVUploadSection();
    
    // Show success message
    let message = `Successfully imported ${importedProducts.length} products!`;
    if (duplicateCount > 0) {
        message += ` ${duplicateCount} products had duplicate SKUs and were renamed.`;
    }
    showNotification(message);
}

function updateInventoryStats() {
    // Update the inventory stats display
    const totalProducts = appData.products.length;
    const totalValue = appData.products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const avgTurnover = 4.2; // This would be calculated based on actual data
    
    const statElements = document.querySelectorAll('.stat-value');
    if (statElements.length >= 3) {
        statElements[0].textContent = totalProducts;
        statElements[1].textContent = `$${Math.round(totalValue).toLocaleString()}`;
        statElements[2].textContent = avgTurnover;
    }
}

// Progress bar functions
function showProgress(message) {
    const progressSection = document.getElementById('uploadProgress');
    const progressText = document.getElementById('progressText');
    
    if (progressSection && progressText) {
        progressText.textContent = message;
        progressSection.style.display = 'block';
    }
}

function updateProgress(percent, message) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
        progressFill.style.width = percent + '%';
    }
    if (progressText && message) {
        progressText.textContent = message;
    }
}

function hideProgress() {
    const progressSection = document.getElementById('uploadProgress');
    if (progressSection) {
        progressSection.style.display = 'none';
    }
    resetProgressBar();
}

function resetProgressBar() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    if (progressText) {
        progressText.textContent = 'Processing...';
    }
}

// Customer CSV Upload Functions
let parsedCustomerCSVData = null;

function showCustomerCSVUploadSection() {
    const uploadSection = document.getElementById('customerCSVUploadSection');
    if (uploadSection) {
        uploadSection.style.display = 'block';
    }
}

function hideCustomerCSVUploadSection() {
    const uploadSection = document.getElementById('customerCSVUploadSection');
    const progressSection = document.getElementById('customerUploadProgress');
    const fileInput = document.getElementById('customerCSVFileInput');
    
    if (uploadSection) {
        uploadSection.style.display = 'none';
    }
    if (progressSection) {
        progressSection.style.display = 'none';
    }
    if (fileInput) {
        fileInput.value = '';
    }
    
    resetCustomerProgressBar();
}

function showCustomerProgress(message) {
    const progressSection = document.getElementById('customerUploadProgress');
    const progressText = document.getElementById('customerProgressText');
    
    if (progressSection && progressText) {
        progressText.textContent = message;
        progressSection.style.display = 'block';
    }
}

function updateCustomerProgress(percent, message) {
    const progressFill = document.getElementById('customerProgressFill');
    const progressText = document.getElementById('customerProgressText');
    
    if (progressFill) {
        progressFill.style.width = percent + '%';
    }
    if (progressText && message) {
        progressText.textContent = message;
    }
}

function hideCustomerProgress() {
    const progressSection = document.getElementById('customerUploadProgress');
    if (progressSection) {
        progressSection.style.display = 'none';
    }
    resetCustomerProgressBar();
}

function resetCustomerProgressBar() {
    const progressFill = document.getElementById('customerProgressFill');
    const progressText = document.getElementById('customerProgressText');
    
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    if (progressText) {
        progressText.textContent = 'Processing...';
    }
}

// Product edit save function
function saveProductEdit(productId) {
    const product = appData.products.find(p => p.id === productId);
    if (!product) {
        showNotification('Product not found');
        return;
    }
    
    // Get form values
    const name = document.getElementById('editProductName')?.value?.trim();
    const sku = document.getElementById('editProductSku')?.value?.trim();
    const category = document.getElementById('editProductCategory')?.value;
    const price = parseFloat(document.getElementById('editProductPrice')?.value) || 0;
    const cost = parseFloat(document.getElementById('editProductCost')?.value) || 0;
    const stock = parseInt(document.getElementById('editProductStock')?.value) || 0;
    const reorderPoint = parseInt(document.getElementById('editProductReorder')?.value) || 1;
    const supplier = document.getElementById('editProductSupplier')?.value?.trim();
    const location = document.getElementById('editProductLocation')?.value?.trim();
    
    // Validate required fields
    if (!name || !sku || !category || !supplier || !location) {
        showNotification('Please fill in all required fields.');
        return;
    }
    
    // Check if SKU is unique (excluding current product)
    const existingProduct = appData.products.find(p => p.sku === sku && p.id !== productId);
    if (existingProduct) {
        showNotification('SKU already exists. Please choose a different SKU.');
        return;
    }
    
    // Store original values for activity log
    const originalName = product.name;
    const changes = [];
    
    // Update product data
    if (product.name !== name) {
        changes.push(`name: "${product.name}" → "${name}"`);
        product.name = name;
    }
    if (product.sku !== sku) {
        changes.push(`SKU: "${product.sku}" → "${sku}"`);
        product.sku = sku;
    }
    if (product.category !== category) {
        changes.push(`category: "${product.category}" → "${category}"`);
        product.category = category;
    }
    if (product.price !== price) {
        changes.push(`price: $${product.price} → $${price}`);
        product.price = price;
    }
    if (product.cost !== cost) {
        changes.push(`cost: $${product.cost} → $${cost}`);
        product.cost = cost;
    }
    if (product.stock !== stock) {
        changes.push(`stock: ${product.stock} → ${stock}`);
        product.stock = stock;
    }
    if (product.reorderPoint !== reorderPoint) {
        changes.push(`reorder point: ${product.reorderPoint} → ${reorderPoint}`);
        product.reorderPoint = reorderPoint;
    }
    if (product.supplier !== supplier) {
        changes.push(`supplier: "${product.supplier}" → "${supplier}"`);
        product.supplier = supplier;
    }
    if (product.location !== location) {
        changes.push(`location: "${product.location}" → "${location}"`);
        product.location = location;
    }
    
    // Refresh the inventory display
    populateProductTable();
    updateInventoryStats();
    
    // Add activity log entry
    if (changes.length > 0) {
        const changeText = changes.length > 2 
            ? `Updated ${changes.length} fields for "${originalName}"` 
            : `Updated ${originalName}: ${changes.join(', ')}`;
        addActivity('edit', '✏️', changeText);
    }
    
    // Close modal and show success message
    closeModal();
    const message = changes.length > 0 
        ? `Product "${name}" updated successfully!`
        : 'No changes were made.';
    showNotification(message);
}

// Customer drag and drop handlers
function highlightCustomer(e) {
    const dropZone = document.getElementById('customerFileDropZone');
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

function unhighlightCustomer(e) {
    const dropZone = document.getElementById('customerFileDropZone');
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }
}

function handleCustomerDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleCustomerFiles(files);
}

// Customer CSV file handling
function handleCustomerFileSelect(e) {
    const files = e.target.files;
    handleCustomerFiles(files);
}

function handleCustomerFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showNotification('Please select a CSV file.');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size too large. Please select a file smaller than 5MB.');
        return;
    }
    
    processCustomerCSVFile(file);
}

function processCustomerCSVFile(file) {
    showCustomerProgress('Uploading file...');
    updateCustomerProgress(10);
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        updateCustomerProgress(30);
        const csvContent = e.target.result;
        
        setTimeout(() => {
            updateCustomerProgress(50, 'Parsing CSV data...');
            
            try {
                const parsedData = parseCSVContent(csvContent);
                updateCustomerProgress(70, 'Running AI analysis...');
                
                setTimeout(() => {
                    const aiProcessedData = runCustomerAIAnalysis(parsedData);
                    updateCustomerProgress(100, 'Complete!');
                    
                    setTimeout(() => {
                        hideCustomerProgress();
                        showCustomerCSVPreview(aiProcessedData);
                    }, 500);
                }, 1000);
                
            } catch (error) {
                console.error('Customer CSV Processing Error:', error);
                hideCustomerProgress();
                showNotification('Error processing CSV file. Please check the file format.');
            }
        }, 500);
    };
    
    reader.onerror = function() {
        hideCustomerProgress();
        showNotification('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
}

/**
 * Role-Based Access Control (RBAC) System
 * Manages user roles, permissions, and role-specific configurations
 */

class RoleManager {
    constructor() {
        this.currentUser = null;
        this.userPreferences = this.loadUserPreferences();
        this.initializeRoles();
    }

    initializeRoles() {
        this.roles = {
            admin: {
                name: 'Administrator',
                level: 5,
                permissions: ['all'],
                dashboardWidgets: ['kpi-summary', 'revenue-chart', 'user-activity', 'system-status', 'alerts', 'recent-orders', 'top-customers', 'inventory-alerts'],
                navigation: ['dashboard', 'inventory', 'customers', 'orders', 'reports', 'insights', 'supply-chain', 'hr'],
                features: ['export', 'import', 'edit', 'delete', 'approve', 'reports', 'settings', 'user-management'],
                defaultView: 'dashboard',
                helpTour: 'admin-complete'
            },
            manager: {
                name: 'Manager',
                level: 4,
                permissions: ['read', 'write', 'approve'],
                dashboardWidgets: ['kpi-summary', 'revenue-chart', 'team-performance', 'alerts', 'recent-orders', 'project-status', 'budget-overview'],
                navigation: ['dashboard', 'inventory', 'customers', 'orders', 'reports', 'insights', 'supply-chain', 'hr'],
                features: ['export', 'edit', 'approve', 'reports'],
                defaultView: 'dashboard',
                helpTour: 'manager-overview'
            },
            sales: {
                name: 'Sales Representative',
                level: 3,
                permissions: ['read', 'write'],
                dashboardWidgets: ['sales-metrics', 'customer-pipeline', 'recent-orders', 'quote-requests', 'customer-activity', 'sales-targets'],
                navigation: ['dashboard', 'customers', 'orders', 'reports'],
                features: ['export', 'edit'],
                defaultView: 'customers',
                helpTour: 'sales-basics'
            },
            warehouse: {
                name: 'Warehouse Operator',
                level: 2,
                permissions: ['read', 'write'],
                dashboardWidgets: ['inventory-status', 'low-stock-alerts', 'incoming-shipments', 'outgoing-orders', 'warehouse-capacity', 'recent-movements'],
                navigation: ['dashboard', 'inventory', 'supply-chain'],
                features: ['edit', 'inventory-movements'],
                defaultView: 'inventory',
                helpTour: 'warehouse-operations'
            },
            finance: {
                name: 'Finance Analyst',
                level: 3,
                permissions: ['read', 'write', 'financial'],
                dashboardWidgets: ['financial-summary', 'revenue-chart', 'expense-tracking', 'payment-status', 'profit-margins', 'budget-variance'],
                navigation: ['dashboard', 'customers', 'orders', 'reports'],
                features: ['export', 'financial-reports', 'payment-management'],
                defaultView: 'reports',
                helpTour: 'finance-overview'
            },
            employee: {
                name: 'Employee',
                level: 1,
                permissions: ['read'],
                dashboardWidgets: ['personal-tasks', 'announcements', 'schedule', 'time-tracking'],
                navigation: ['dashboard', 'hr'],
                features: ['view-only'],
                defaultView: 'dashboard',
                helpTour: 'employee-basics'
            }
        };

        // Widget definitions for role-based dashboards
        this.widgetDefinitions = {
            'kpi-summary': {
                title: 'Key Performance Indicators',
                type: 'metrics',
                size: 'large',
                refreshInterval: 300000, // 5 minutes
                permissions: ['read']
            },
            'revenue-chart': {
                title: 'Revenue Trends',
                type: 'chart',
                size: 'medium',
                refreshInterval: 600000, // 10 minutes
                permissions: ['read']
            },
            'sales-metrics': {
                title: 'Sales Performance',
                type: 'metrics',
                size: 'large',
                refreshInterval: 300000,
                permissions: ['read']
            },
            'inventory-status': {
                title: 'Inventory Overview',
                type: 'table',
                size: 'large',
                refreshInterval: 180000, // 3 minutes
                permissions: ['read']
            },
            'financial-summary': {
                title: 'Financial Overview',
                type: 'metrics',
                size: 'large',
                refreshInterval: 600000,
                permissions: ['financial']
            },
            'user-activity': {
                title: 'User Activity',
                type: 'feed',
                size: 'medium',
                refreshInterval: 60000, // 1 minute
                permissions: ['admin']
            },
            'customer-pipeline': {
                title: 'Customer Pipeline',
                type: 'chart',
                size: 'medium',
                refreshInterval: 300000,
                permissions: ['read']
            },
            'low-stock-alerts': {
                title: 'Low Stock Alerts',
                type: 'alerts',
                size: 'small',
                refreshInterval: 180000,
                permissions: ['read']
            },
            'team-performance': {
                title: 'Team Performance',
                type: 'chart',
                size: 'medium',
                refreshInterval: 600000,
                permissions: ['read']
            }
        };
    }

    // Set current user and load their role configuration
    setCurrentUser(userData) {
        this.currentUser = {
            ...userData,
            roleConfig: this.roles[userData.role] || this.roles.employee
        };
        
        // Load user preferences
        this.loadUserDashboardLayout();
        
        console.log(`User ${userData.name} logged in with role: ${this.currentUser.roleConfig.name}`);
        return this.currentUser;
    }

    // Check if user has specific permission
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userPermissions = this.currentUser.roleConfig.permissions;
        
        // Admin has all permissions
        if (userPermissions.includes('all')) return true;
        
        return userPermissions.includes(permission);
    }

    // Check if user can access specific feature
    canAccessFeature(feature) {
        if (!this.currentUser) return false;
        
        const userFeatures = this.currentUser.roleConfig.features;
        return userFeatures.includes(feature);
    }

    // Check if user can access navigation item
    canAccessNavigation(navItem) {
        if (!this.currentUser) return false;
        
        const userNavigation = this.currentUser.roleConfig.navigation;
        return userNavigation.includes(navItem);
    }

    // Get widgets available for current user's role
    getAvailableWidgets() {
        if (!this.currentUser) return [];
        
        const roleWidgets = this.currentUser.roleConfig.dashboardWidgets;
        return roleWidgets.filter(widgetId => {
            const widget = this.widgetDefinitions[widgetId];
            if (!widget) return false;
            
            // Check if user has required permissions for this widget
            return widget.permissions.every(permission => this.hasPermission(permission));
        }).map(widgetId => ({
            id: widgetId,
            ...this.widgetDefinitions[widgetId]
        }));
    }

    // Get current user's dashboard layout
    getDashboardLayout() {
        const userId = this.currentUser?.id || 'default';
        const userPrefs = this.userPreferences[userId];
        
        if (userPrefs && userPrefs.dashboardLayout) {
            return userPrefs.dashboardLayout;
        }
        
        // Return default layout based on role
        return this.getDefaultDashboardLayout();
    }

    // Get default dashboard layout for current role
    getDefaultDashboardLayout() {
        const availableWidgets = this.getAvailableWidgets();
        
        return availableWidgets.map((widget, index) => ({
            id: widget.id,
            x: (index % 3) * 4, // 3 columns
            y: Math.floor(index / 3) * 3,
            w: widget.size === 'large' ? 6 : widget.size === 'medium' ? 4 : 2,
            h: widget.size === 'large' ? 4 : widget.size === 'medium' ? 3 : 2,
            minW: 2,
            minH: 2
        }));
    }

    // Save user's dashboard layout
    saveDashboardLayout(layout) {
        const userId = this.currentUser?.id || 'default';
        
        if (!this.userPreferences[userId]) {
            this.userPreferences[userId] = {};
        }
        
        this.userPreferences[userId].dashboardLayout = layout;
        this.saveUserPreferences();
        
        console.log('Dashboard layout saved for user:', userId);
    }

    // Load user preferences from localStorage
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('constructERP_userPreferences');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading user preferences:', error);
            return {};
        }
    }

    // Save user preferences to localStorage
    saveUserPreferences() {
        try {
            localStorage.setItem('constructERP_userPreferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }

    // Load user's dashboard layout
    loadUserDashboardLayout() {
        const userId = this.currentUser?.id || 'default';
        const userPrefs = this.userPreferences[userId];
        
        if (userPrefs && userPrefs.dashboardLayout) {
            console.log('Loaded custom dashboard layout for user:', userId);
        }
    }

    // Get user's default view/module
    getDefaultView() {
        return this.currentUser?.roleConfig.defaultView || 'dashboard';
    }

    // Get help tour type for current role
    getHelpTourType() {
        return this.currentUser?.roleConfig.helpTour || 'basic';
    }

    // Reset dashboard to default layout
    resetDashboardLayout() {
        const userId = this.currentUser?.id || 'default';
        
        if (this.userPreferences[userId]) {
            delete this.userPreferences[userId].dashboardLayout;
            this.saveUserPreferences();
        }
        
        return this.getDefaultDashboardLayout();
    }

    // Get user's role information
    getUserRole() {
        return this.currentUser?.roleConfig || null;
    }

    // Get filtered navigation items based on role
    getNavigationItems() {
        if (!this.currentUser) return [];
        
        const allowedNavigation = this.currentUser.roleConfig.navigation;
        
        // Default navigation structure
        const allNavItems = [
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'inventory', label: 'Inventory', icon: '📦' },
            { id: 'customers', label: 'Customers', icon: '👥' },
            { id: 'orders', label: 'Orders', icon: '🛒' },
            { id: 'reports', label: 'Reports', icon: '📈' },
            { id: 'insights', label: 'AI Insights', icon: '🤖' },
            { id: 'supply-chain', label: 'Supply Chain', icon: '🚚' },
            { id: 'hr', label: 'Human Resources', icon: '👤' }
        ];
        
        return allNavItems.filter(item => allowedNavigation.includes(item.id));
    }

    // Check if user is new (for onboarding)
    isNewUser() {
        const userId = this.currentUser?.id || 'default';
        const userPrefs = this.userPreferences[userId];
        
        return !userPrefs || !userPrefs.hasCompletedOnboarding;
    }

    // Mark onboarding as completed
    completeOnboarding() {
        const userId = this.currentUser?.id || 'default';
        
        if (!this.userPreferences[userId]) {
            this.userPreferences[userId] = {};
        }
        
        this.userPreferences[userId].hasCompletedOnboarding = true;
        this.userPreferences[userId].onboardingCompletedAt = new Date().toISOString();
        this.saveUserPreferences();
        
        console.log('Onboarding completed for user:', userId);
    }

    // Get onboarding checklist for current role
    getOnboardingChecklist() {
        const roleType = this.currentUser?.role || 'employee';
        
        const checklists = {
            admin: [
                { id: 'profile', title: 'Complete your profile', description: 'Add your contact information and preferences' },
                { id: 'users', title: 'Review user accounts', description: 'Check existing users and their roles' },
                { id: 'settings', title: 'Configure system settings', description: 'Set up company preferences and defaults' },
                { id: 'reports', title: 'Review reports', description: 'Familiarize yourself with available reports' },
                { id: 'backup', title: 'Set up data backup', description: 'Configure automatic backups and recovery' }
            ],
            manager: [
                { id: 'profile', title: 'Complete your profile', description: 'Add your contact information and preferences' },
                { id: 'dashboard', title: 'Customize your dashboard', description: 'Arrange widgets to suit your workflow' },
                { id: 'team', title: 'Review your team', description: 'Check team members and their performance' },
                { id: 'projects', title: 'Review current projects', description: 'Get up to speed on active projects' },
                { id: 'reports', title: 'Set up regular reports', description: 'Configure reports for your review cycle' }
            ],
            sales: [
                { id: 'profile', title: 'Complete your profile', description: 'Add your contact information and sales targets' },
                { id: 'customers', title: 'Review customer list', description: 'Familiarize yourself with existing customers' },
                { id: 'pipeline', title: 'Set up sales pipeline', description: 'Configure your sales tracking preferences' },
                { id: 'quotes', title: 'Create your first quote', description: 'Learn how to create and send quotes' },
                { id: 'reports', title: 'View sales reports', description: 'Understand your sales metrics and goals' }
            ],
            warehouse: [
                { id: 'profile', title: 'Complete your profile', description: 'Add your contact information and shift details' },
                { id: 'inventory', title: 'Review inventory levels', description: 'Check current stock levels and locations' },
                { id: 'alerts', title: 'Set up stock alerts', description: 'Configure low stock notifications' },
                { id: 'receiving', title: 'Process first shipment', description: 'Learn the receiving workflow' },
                { id: 'locations', title: 'Review warehouse locations', description: 'Familiarize yourself with storage areas' }
            ],
            finance: [
                { id: 'profile', title: 'Complete your profile', description: 'Add your contact information and preferences' },
                { id: 'accounts', title: 'Review chart of accounts', description: 'Understand the accounting structure' },
                { id: 'reports', title: 'Generate financial reports', description: 'Learn to create and customize reports' },
                { id: 'reconciliation', title: 'Perform account reconciliation', description: 'Complete your first reconciliation' },
                { id: 'budgets', title: 'Review budgets', description: 'Check budget allocations and variances' }
            ],
            employee: [
                { id: 'profile', title: 'Complete your profile', description: 'Add your contact information' },
                { id: 'schedule', title: 'Check your schedule', description: 'Review your work schedule and assignments' },
                { id: 'timesheet', title: 'Submit timesheet', description: 'Learn how to track and submit hours' },
                { id: 'resources', title: 'Access company resources', description: 'Find important documents and policies' }
            ]
        };
        
        return checklists[roleType] || checklists.employee;
    }

    // Get or update onboarding progress
    getOnboardingProgress() {
        const userId = this.currentUser?.id || 'default';
        const userPrefs = this.userPreferences[userId];
        
        return userPrefs?.onboardingProgress || {};
    }

    // Mark onboarding item as completed
    completeOnboardingItem(itemId) {
        const userId = this.currentUser?.id || 'default';
        
        if (!this.userPreferences[userId]) {
            this.userPreferences[userId] = {};
        }
        
        if (!this.userPreferences[userId].onboardingProgress) {
            this.userPreferences[userId].onboardingProgress = {};
        }
        
        this.userPreferences[userId].onboardingProgress[itemId] = {
            completed: true,
            completedAt: new Date().toISOString()
        };
        
        this.saveUserPreferences();
        
        // Check if all onboarding items are completed
        const checklist = this.getOnboardingChecklist();
        const progress = this.getOnboardingProgress();
        const allCompleted = checklist.every(item => progress[item.id]?.completed);
        
        if (allCompleted && !this.userPreferences[userId].hasCompletedOnboarding) {
            this.completeOnboarding();
        }
        
        console.log('Onboarding item completed:', itemId);
    }
}

// Create global role manager instance
window.RoleManager = RoleManager;
window.roleManager = new RoleManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoleManager;
}

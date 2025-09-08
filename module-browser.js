/**
 * Module Browser JavaScript - Search & Filter Components
 * Implements search box, category filters, status filters, and browser interactions
 */

class ModuleBrowser {
    constructor(containerId) {
        this.container = document.getElementById(containerId) || document.body;
        this.modules = [];
        this.filteredModules = [];
        this.currentView = 'grid';
        this.currentSort = 'name';
        this.searchTerm = '';
        this.activeFilters = {
            categories: new Set(['all']),
            statuses: new Set(['all'])
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSampleData();
        this.renderModules();
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }
        
        // Category filters
        const categoryFilters = document.getElementById('categoryFilters');
        if (categoryFilters) {
            categoryFilters.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.handleCategoryFilter(e.target);
                }
            });
        }
        
        // Status filters
        const statusFilters = document.getElementById('statusFilters');
        if (statusFilters) {
            statusFilters.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.handleStatusFilter(e.target);
                }
            });
        }
        
        // View toggle
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        if (gridView && listView) {
            gridView.addEventListener('click', () => this.setView('grid'));
            listView.addEventListener('click', () => this.setView('list'));
        }
        
        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applyFilters();
            });
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }
        
        // Upload button
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUploadDialog());
        }
    }
    
    handleCategoryFilter(checkbox) {
        const category = checkbox.id.replace('cat-', '');
        
        if (category === 'all') {
            if (checkbox.checked) {
                // If "All" is checked, uncheck all others
                this.activeFilters.categories.clear();
                this.activeFilters.categories.add('all');
                document.querySelectorAll('#categoryFilters input[type="checkbox"]').forEach(cb => {
                    cb.checked = cb.id === 'cat-all';
                });
            }
        } else {
            // If a specific category is checked, uncheck "All"
            if (checkbox.checked) {
                this.activeFilters.categories.delete('all');
                document.getElementById('cat-all').checked = false;
                this.activeFilters.categories.add(category);
            } else {
                this.activeFilters.categories.delete(category);
                
                // If no categories are selected, check "All"
                if (this.activeFilters.categories.size === 0) {
                    this.activeFilters.categories.add('all');
                    document.getElementById('cat-all').checked = true;
                }
            }
        }
        
        this.applyFilters();
    }
    
    handleStatusFilter(checkbox) {
        const status = checkbox.id.replace('status-', '');
        
        if (status === 'all') {
            if (checkbox.checked) {
                this.activeFilters.statuses.clear();
                this.activeFilters.statuses.add('all');
                document.querySelectorAll('#statusFilters input[type="checkbox"]').forEach(cb => {
                    cb.checked = cb.id === 'status-all';
                });
            }
        } else {
            if (checkbox.checked) {
                this.activeFilters.statuses.delete('all');
                document.getElementById('status-all').checked = false;
                this.activeFilters.statuses.add(status);
            } else {
                this.activeFilters.statuses.delete(status);
                
                if (this.activeFilters.statuses.size === 0) {
                    this.activeFilters.statuses.add('all');
                    document.getElementById('status-all').checked = true;
                }
            }
        }
        
        this.applyFilters();
    }
    
    applyFilters() {
        let filtered = [...this.modules];
        
        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(module => 
                module.name.toLowerCase().includes(this.searchTerm) ||
                module.description.toLowerCase().includes(this.searchTerm) ||
                module.category.toLowerCase().includes(this.searchTerm) ||
                (module.tags && module.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)))
            );
        }
        
        // Apply category filter
        if (!this.activeFilters.categories.has('all')) {
            filtered = filtered.filter(module => 
                this.activeFilters.categories.has(module.category.toLowerCase())
            );
        }
        
        // Apply status filter
        if (!this.activeFilters.statuses.has('all')) {
            filtered = filtered.filter(module => 
                this.activeFilters.statuses.has(module.status.toLowerCase())
            );
        }
        
        // Apply sorting
        filtered = this.sortModules(filtered);
        
        this.filteredModules = filtered;
        this.updateFilterCounts();
        this.renderModules();
    }
    
    sortModules(modules) {
        return modules.sort((a, b) => {
            switch (this.currentSort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'date':
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                case 'category':
                    return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
                case 'status':
                    return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    }
    
    updateFilterCounts() {
        // Update category counts
        const categoryCounts = this.getCategoryCounts();
        Object.entries(categoryCounts).forEach(([category, count]) => {
            const countElement = document.querySelector(`#cat-${category} + label + .filter-count`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
        
        // Update status counts
        const statusCounts = this.getStatusCounts();
        Object.entries(statusCounts).forEach(([status, count]) => {
            const countElement = document.querySelector(`#status-${status} + label + .filter-count`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
        
        // Update stats bar
        this.updateStatsBar();
    }
    
    getCategoryCounts() {
        const counts = { all: this.modules.length };
        this.modules.forEach(module => {
            const category = module.category.toLowerCase();
            counts[category] = (counts[category] || 0) + 1;
        });
        return counts;
    }
    
    getStatusCounts() {
        const counts = { all: this.modules.length };
        this.modules.forEach(module => {
            const status = module.status.toLowerCase();
            counts[status] = (counts[status] || 0) + 1;
        });
        return counts;
    }
    
    updateStatsBar() {
        const statusCounts = this.getStatusCounts();
        
        // Update stats numbers
        const statsElements = {
            total: document.querySelector('.stats-item:nth-child(1) .stats-number'),
            installed: document.querySelector('.stats-item:nth-child(2) .stats-number'),
            available: document.querySelector('.stats-item:nth-child(3) .stats-number'),
            updates: document.querySelector('.stats-item:nth-child(4) .stats-number')
        };
        
        if (statsElements.total) statsElements.total.textContent = this.modules.length;
        if (statsElements.installed) statsElements.installed.textContent = statusCounts.installed || 0;
        if (statsElements.available) statsElements.available.textContent = statusCounts.available || 0;
        if (statsElements.updates) statsElements.updates.textContent = statusCounts.updating || 0;
    }
    
    setView(viewType) {
        this.currentView = viewType;
        
        // Update button states
        const gridBtn = document.getElementById('gridView');
        const listBtn = document.getElementById('listView');
        
        if (gridBtn && listBtn) {
            gridBtn.classList.toggle('active', viewType === 'grid');
            listBtn.classList.toggle('active', viewType === 'list');
        }
        
        // Update container class
        const container = document.getElementById('modulesContainer');
        if (container) {
            container.classList.toggle('list-view', viewType === 'list');
        }
        
        this.renderModules();
    }
    
    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        const container = document.getElementById('modulesContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (spinner) spinner.style.display = 'flex';
        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }
    
    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'none';
    }
    
    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const container = document.getElementById('modulesContainer');
        
        if (emptyState) emptyState.style.display = 'block';
        if (container) container.style.display = 'none';
    }
    
    renderModules() {
        const container = document.getElementById('modulesContainer');
        if (!container) return;
        
        this.hideLoading();
        
        if (this.filteredModules.length === 0) {
            this.showEmptyState();
            return;
        }
        
        container.style.display = 'grid';
        container.innerHTML = '';
        
        this.filteredModules.forEach(module => {
            const moduleCard = this.createModuleCard(module);
            container.appendChild(moduleCard);
        });
    }
    
    createModuleCard(module) {
        const card = document.createElement('div');
        card.className = `module-card ${this.currentView === 'list' ? 'list-view' : ''}`;
        
        const statusClass = `status-${module.status.toLowerCase()}`;
        const iconLetter = module.name.charAt(0).toUpperCase();
        
        card.innerHTML = `
            <div class="module-icon">${iconLetter}</div>
            <div class="module-info">
                <div class="module-name">${module.name}</div>
                <div class="module-description">${module.description}</div>
                <div class="module-meta">
                    <span class="meta-item">📁 ${module.category}</span>
                    <span class="meta-item">👤 ${module.author}</span>
                    <span class="meta-item">📅 ${this.formatDate(module.updatedAt)}</span>
                </div>
                <span class="module-status ${statusClass}">${module.status}</span>
            </div>
            <div class="module-actions ${this.currentView === 'list' ? 'list-view' : ''}">
                ${this.getActionButtons(module)}
            </div>
        `;
        
        // Add event listeners to action buttons
        this.setupModuleCardEvents(card, module);
        
        return card;
    }
    
    getActionButtons(module) {
        const status = module.status.toLowerCase();
        
        switch (status) {
            case 'installed':
                return `
                    <button class="btn btn-outline btn-sm" data-action="configure">⚙️ Configure</button>
                    <button class="btn btn-warning btn-sm" data-action="uninstall">🗑️ Remove</button>
                `;
            case 'available':
                return `
                    <button class="btn btn-success btn-sm" data-action="install">📥 Install</button>
                    <button class="btn btn-outline btn-sm" data-action="preview">👁️ Preview</button>
                `;
            case 'updating':
                return `
                    <button class="btn btn-secondary btn-sm" disabled>⏳ Updating...</button>
                `;
            default:
                return `
                    <button class="btn btn-outline btn-sm" data-action="details">ℹ️ Details</button>
                `;
        }
    }
    
    setupModuleCardEvents(card, module) {
        const buttons = card.querySelectorAll('[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = button.dataset.action;
                this.handleModuleAction(action, module);
            });
        });
        
        // Card click for details
        card.addEventListener('click', () => {
            this.showModuleDetails(module);
        });
    }
    
    handleModuleAction(action, module) {
        switch (action) {
            case 'install':
                this.installModule(module);
                break;
            case 'uninstall':
                this.uninstallModule(module);
                break;
            case 'configure':
                this.configureModule(module);
                break;
            case 'preview':
                this.previewModule(module);
                break;
            case 'details':
                this.showModuleDetails(module);
                break;
        }
    }
    
    async installModule(module) {
        if (confirm(`Install module "${module.name}"?`)) {
            try {
                // Update status to installing
                module.status = 'updating';
                this.renderModules();
                
                // Simulate installation process
                await this.simulateAsync(2000);
                
                // Update status to installed
                module.status = 'installed';
                this.renderModules();
                
                this.showNotification(`Module "${module.name}" installed successfully!`, 'success');
            } catch (error) {
                module.status = 'available';
                this.renderModules();
                this.showNotification(`Failed to install "${module.name}": ${error.message}`, 'error');
            }
        }
    }
    
    async uninstallModule(module) {
        if (confirm(`Remove module "${module.name}"? This action cannot be undone.`)) {
            try {
                module.status = 'updating';
                this.renderModules();
                
                await this.simulateAsync(1000);
                
                module.status = 'available';
                this.renderModules();
                
                this.showNotification(`Module "${module.name}" removed successfully!`, 'success');
            } catch (error) {
                module.status = 'installed';
                this.renderModules();
                this.showNotification(`Failed to remove "${module.name}": ${error.message}`, 'error');
            }
        }
    }
    
    configureModule(module) {
        this.showNotification(`Opening configuration for "${module.name}"...`, 'info');
        // Would open configuration panel
    }
    
    previewModule(module) {
        this.showNotification(`Opening preview for "${module.name}"...`, 'info');
        // Would show module preview/demo
    }
    
    showModuleDetails(module) {
        this.showNotification(`Showing details for "${module.name}"...`, 'info');
        // Would show detailed module information modal
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#007bff'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    simulateAsync(delay) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    async refresh() {
        this.showLoading();
        await this.simulateAsync(1000);
        this.loadSampleData();
        this.applyFilters();
        this.showNotification('Module list refreshed!', 'success');
    }
    
    showUploadDialog() {
        this.showNotification('Opening module upload dialog...', 'info');
        // Would show file upload dialog
    }
    
    loadSampleData() {
        this.modules = [
            {
                id: 'analytics-dashboard',
                name: 'Analytics Dashboard',
                description: 'Advanced analytics and reporting dashboard with interactive charts and real-time data visualization.',
                category: 'Analytics',
                author: 'ERP Team',
                status: 'installed',
                version: '1.2.0',
                updatedAt: '2025-08-20T10:00:00Z',
                tags: ['charts', 'reports', 'dashboard']
            },
            {
                id: 'workflow-builder',
                name: 'Workflow Builder',
                description: 'Visual workflow designer for creating custom business processes with drag-and-drop functionality.',
                category: 'Workflow',
                author: 'Process Team',
                status: 'installed',
                version: '2.1.0',
                updatedAt: '2025-08-19T14:30:00Z',
                tags: ['workflow', 'automation', 'builder']
            },
            {
                id: 'project-gantt',
                name: 'Project Gantt Chart',
                description: 'Interactive Gantt chart component for project timeline management and resource planning.',
                category: 'UI',
                author: 'UI Team',
                status: 'available',
                version: '1.0.5',
                updatedAt: '2025-08-18T09:15:00Z',
                tags: ['gantt', 'timeline', 'project']
            },
            {
                id: 'email-integration',
                name: 'Email Integration',
                description: 'Connect with popular email services for automated notifications and communications.',
                category: 'Integration',
                author: 'Integration Team',
                status: 'available',
                version: '1.3.2',
                updatedAt: '2025-08-17T16:45:00Z',
                tags: ['email', 'notifications', 'smtp']
            },
            {
                id: 'financial-reports',
                name: 'Financial Reports',
                description: 'Comprehensive financial reporting module with customizable templates and export options.',
                category: 'Analytics',
                author: 'Finance Team',
                status: 'installed',
                version: '2.0.1',
                updatedAt: '2025-08-16T11:20:00Z',
                tags: ['finance', 'reports', 'accounting']
            },
            {
                id: 'task-automation',
                name: 'Task Automation',
                description: 'Automate repetitive tasks and create custom workflows to improve productivity.',
                category: 'Workflow',
                author: 'Automation Team',
                status: 'available',
                version: '1.1.8',
                updatedAt: '2025-08-15T13:10:00Z',
                tags: ['automation', 'tasks', 'productivity']
            },
            {
                id: 'mobile-app',
                name: 'Mobile App Connector',
                description: 'Bridge module for connecting mobile applications with the ERP system.',
                category: 'Integration',
                author: 'Mobile Team',
                status: 'available',
                version: '1.4.0',
                updatedAt: '2025-08-14T08:30:00Z',
                tags: ['mobile', 'api', 'connector']
            },
            {
                id: 'custom-forms',
                name: 'Custom Forms Builder',
                description: 'Create custom forms with validation, conditional logic, and dynamic fields.',
                category: 'UI',
                author: 'UI Team',
                status: 'installed',
                version: '1.7.3',
                updatedAt: '2025-08-13T15:45:00Z',
                tags: ['forms', 'validation', 'builder']
            },
            {
                id: 'inventory-tracker',
                name: 'Inventory Tracker',
                description: 'Real-time inventory tracking with barcode scanning and automated reordering.',
                category: 'Analytics',
                author: 'Inventory Team',
                status: 'installed',
                version: '2.2.1',
                updatedAt: '2025-08-12T12:00:00Z',
                tags: ['inventory', 'tracking', 'barcode']
            },
            {
                id: 'calendar-integration',
                name: 'Calendar Integration',
                description: 'Sync with popular calendar services for scheduling and appointment management.',
                category: 'Workflow',
                author: 'Schedule Team',
                status: 'available',
                version: '1.0.9',
                updatedAt: '2025-08-11T10:30:00Z',
                tags: ['calendar', 'scheduling', 'sync']
            },
            {
                id: 'data-export',
                name: 'Data Export Tool',
                description: 'Export data in multiple formats with custom filters and scheduling options.',
                category: 'UI',
                author: 'Data Team',
                status: 'available',
                version: '1.5.2',
                updatedAt: '2025-08-10T14:15:00Z',
                tags: ['export', 'data', 'formats']
            },
            {
                id: 'backup-manager',
                name: 'Backup Manager',
                description: 'Automated backup and restore functionality with cloud storage support.',
                category: 'Workflow',
                author: 'System Team',
                status: 'available',
                version: '1.8.0',
                updatedAt: '2025-08-09T09:45:00Z',
                tags: ['backup', 'restore', 'cloud']
            }
        ];
    }
}

// Initialize the module browser when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const moduleBrowser = new ModuleBrowser();
    window.moduleBrowser = moduleBrowser; // Make it globally accessible
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModuleBrowser };
}

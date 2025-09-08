/**
 * Dependency Resolution Actions - Basic JavaScript
 * Simple buttons and functionality for resolving dependency issues
 */

class DependencyResolver {
    constructor() {
        this.dependencies = [];
        this.resolutionQueue = [];
        this.isResolving = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSampleDependencies();
        this.renderDependencies();
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('expand-toggle')) {
                this.toggleDetails(e.target);
            }
            
            if (e.target.classList.contains('conflict-btn')) {
                this.handleConflictAction(e.target);
            }
            
            if (e.target.id === 'resolveAllBtn') {
                this.resolveAllConflicts();
            }
            
            if (e.target.id === 'refreshDepsBtn') {
                this.refreshDependencies();
            }
        });
    }
    
    loadSampleDependencies() {
        this.dependencies = [
            {
                id: 'chart-lib',
                name: 'Chart Library',
                required: '^2.1.0',
                installed: '2.3.1',
                status: 'satisfied',
                description: 'Advanced charting components for data visualization',
                conflicts: []
            },
            {
                id: 'data-processor',
                name: 'Data Processor',
                required: '>=1.5.0',
                installed: null,
                status: 'missing',
                description: 'Core data processing utilities',
                conflicts: [],
                solutions: [
                    'Install Data Processor v1.5.2',
                    'Use alternative: Lightweight Processor'
                ]
            },
            {
                id: 'ui-framework',
                name: 'UI Framework',
                required: '~3.2.0',
                installed: '3.1.8',
                status: 'conflict',
                description: 'User interface framework and components',
                conflicts: [
                    {
                        type: 'version_mismatch',
                        message: 'Installed version 3.1.8 is incompatible with required ~3.2.0',
                        severity: 'warning'
                    }
                ],
                solutions: [
                    'Update UI Framework to v3.2.1',
                    'Downgrade module requirements',
                    'Force install (may cause issues)'
                ]
            },
            {
                id: 'auth-module',
                name: 'Authentication Module',
                required: '^1.0.0',
                installed: '1.2.5',
                status: 'satisfied',
                description: 'User authentication and authorization',
                conflicts: []
            },
            {
                id: 'email-service',
                name: 'Email Service',
                required: '>=2.0.0',
                installed: null,
                status: 'missing',
                description: 'Email notification and communication service',
                conflicts: [],
                solutions: [
                    'Install Email Service v2.1.0',
                    'Configure external SMTP service'
                ]
            }
        ];
    }
    
    renderDependencies() {
        const container = document.querySelector('.dependencies-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.dependencies.forEach((dep, index) => {
            const item = this.createDependencyItem(dep, index);
            container.appendChild(item);
        });
        
        this.updateSummary();
        this.addResolveAllButton();
    }
    
    createDependencyItem(dep, index) {
        const item = document.createElement('li');
        item.className = `dependency-item ${this.getItemClasses(dep)}`;
        item.dataset.depId = dep.id;
        
        const statusIcon = this.getStatusIcon(dep.status);
        const statusBadge = this.getStatusBadge(dep.status);
        const versionInfo = this.getVersionInfo(dep);
        
        item.innerHTML = `
            <div class="status-icon status-${dep.status}">${statusIcon}</div>
            <div class="dependency-info">
                <div class="dependency-name">${dep.name}</div>
                <div class="dependency-version">${versionInfo}</div>
                <div class="dependency-description">${dep.description}</div>
                ${this.hasIssues(dep) ? '<div class="expand-toggle" data-target="' + index + '">Show details</div>' : ''}
                ${this.createConflictDetails(dep, index)}
            </div>
            <span class="status-badge badge-${dep.status}">${statusBadge}</span>
        `;
        
        return item;
    }
    
    getItemClasses(dep) {
        const classes = [];
        if (dep.status === 'conflict') classes.push('has-conflict');
        if (dep.status === 'missing') classes.push('has-error');
        if (dep.conflicts && dep.conflicts.length > 0) classes.push('severity-' + dep.conflicts[0].severity);
        return classes.join(' ');
    }
    
    getStatusIcon(status) {
        const icons = {
            satisfied: '✓',
            missing: '✗',
            conflict: '⚠'
        };
        return icons[status] || '?';
    }
    
    getStatusBadge(status) {
        const badges = {
            satisfied: 'Satisfied',
            missing: 'Missing',
            conflict: 'Conflict'
        };
        return badges[status] || 'Unknown';
    }
    
    getVersionInfo(dep) {
        const required = `Required: ${dep.required}`;
        const installed = dep.installed ? `Installed: ${dep.installed}` : 'Not Installed';
        return `${required} | ${installed}`;
    }
    
    hasIssues(dep) {
        return dep.status !== 'satisfied' && (dep.conflicts?.length > 0 || dep.solutions?.length > 0);
    }
    
    createConflictDetails(dep, index) {
        if (!this.hasIssues(dep)) return '';
        
        let details = `<div class="conflict-details" id="details-${index}">`;
        
        if (dep.conflicts && dep.conflicts.length > 0) {
            details += `
                <div class="conflict-title">
                    <span>⚠️</span>
                    Conflict Details
                </div>
                <div class="conflict-explanation">${dep.conflicts[0].message}</div>
            `;
        }
        
        if (dep.solutions && dep.solutions.length > 0) {
            details += `
                <div class="conflict-title">
                    <span>🔧</span>
                    Suggested Solutions
                </div>
                <ul class="conflict-solutions">
            `;
            
            dep.solutions.forEach((solution, sIndex) => {
                details += `
                    <li class="solution-item">
                        <div class="solution-icon">${sIndex + 1}</div>
                        <span>${solution}</span>
                    </li>
                `;
            });
            
            details += '</ul>';
        }
        
        details += `
            <div class="conflict-actions">
                <button class="conflict-btn btn-resolve" data-action="resolve" data-dep-id="${dep.id}">
                    Resolve
                </button>
                <button class="conflict-btn btn-ignore" data-action="ignore" data-dep-id="${dep.id}">
                    Ignore
                </button>
            </div>
        </div>`;
        
        return details;
    }
    
    toggleDetails(toggle) {
        const targetIndex = toggle.dataset.target;
        const details = document.getElementById(`details-${targetIndex}`);
        
        if (details) {
            const isExpanded = details.classList.contains('show');
            
            if (isExpanded) {
                details.classList.remove('show');
                toggle.textContent = 'Show details';
                toggle.classList.remove('expanded');
            } else {
                details.classList.add('show');
                toggle.textContent = 'Hide details';
                toggle.classList.add('expanded');
            }
        }
    }
    
    async handleConflictAction(button) {
        const action = button.dataset.action;
        const depId = button.dataset.depId;
        const dependency = this.dependencies.find(d => d.id === depId);
        
        if (!dependency) return;
        
        button.disabled = true;
        button.textContent = 'Processing...';
        
        try {
            if (action === 'resolve') {
                await this.resolveDependency(dependency);
            } else if (action === 'ignore') {
                await this.ignoreDependency(dependency);
            }
        } catch (error) {
            this.showNotification(`Failed to ${action} dependency: ${error.message}`, 'error');
        }
        
        button.disabled = false;
        this.updateDependencyItem(dependency);
    }
    
    async resolveDependency(dependency) {
        // Simulate resolution process
        await this.delay(1000);
        
        if (dependency.status === 'missing') {
            dependency.installed = this.getLatestVersion(dependency.required);
            dependency.status = 'satisfied';
            dependency.conflicts = [];
            this.showNotification(`Successfully installed ${dependency.name}`, 'success');
        } else if (dependency.status === 'conflict') {
            dependency.installed = this.getCompatibleVersion(dependency.required);
            dependency.status = 'satisfied';
            dependency.conflicts = [];
            this.showNotification(`Successfully updated ${dependency.name}`, 'success');
        }
    }
    
    async ignoreDependency(dependency) {
        // Simulate ignore process
        await this.delay(500);
        
        dependency.status = 'ignored';
        this.showNotification(`Ignored dependency issue for ${dependency.name}`, 'warning');
    }
    
    getLatestVersion(required) {
        // Simple version logic for demo
        if (required.includes('>=')) {
            const version = required.replace('>=', '');
            return this.incrementVersion(version);
        }
        if (required.includes('^')) {
            return required.replace('^', '');
        }
        return required.replace(/[~^>=<]/g, '');
    }
    
    getCompatibleVersion(required) {
        return this.getLatestVersion(required);
    }
    
    incrementVersion(version) {
        const parts = version.split('.');
        parts[2] = (parseInt(parts[2]) + 1).toString();
        return parts.join('.');
    }
    
    updateDependencyItem(dependency) {
        const item = document.querySelector(`[data-dep-id="${dependency.id}"]`);
        if (item) {
            // Find and update the dependency in the list, then re-render
            const index = this.dependencies.findIndex(d => d.id === dependency.id);
            if (index >= 0) {
                this.dependencies[index] = dependency;
                const newItem = this.createDependencyItem(dependency, index);
                item.replaceWith(newItem);
                this.updateSummary();
            }
        }
    }
    
    updateSummary() {
        const summary = document.querySelector('.dependency-summary');
        if (!summary) return;
        
        const stats = this.getDependencyStats();
        
        summary.className = 'dependency-summary';
        if (stats.conflicts > 0 || stats.missing > 0) {
            summary.classList.add(stats.conflicts > 0 ? 'critical-issues' : 'has-issues');
        }
        
        const statsHtml = `
            <div class="summary-title">
                <span>📊</span>
                Dependency Summary
            </div>
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-number stat-satisfied">${stats.satisfied}</span>
                    <span>Satisfied</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number stat-missing">${stats.missing}</span>
                    <span>Missing</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number stat-conflict">${stats.conflicts}</span>
                    <span>Conflicts</span>
                </div>
            </div>
        `;
        
        summary.innerHTML = statsHtml;
    }
    
    getDependencyStats() {
        const stats = { satisfied: 0, missing: 0, conflicts: 0, ignored: 0 };
        
        this.dependencies.forEach(dep => {
            if (stats.hasOwnProperty(dep.status)) {
                stats[dep.status]++;
            } else if (dep.status === 'conflict') {
                stats.conflicts++;
            }
        });
        
        return stats;
    }
    
    addResolveAllButton() {
        const summary = document.querySelector('.dependency-summary');
        if (!summary) return;
        
        const stats = this.getDependencyStats();
        const hasIssues = stats.missing > 0 || stats.conflicts > 0;
        
        if (hasIssues && !document.getElementById('resolveAllBtn')) {
            const buttonsHtml = `
                <div class="resolution-actions" style="margin-top: 12px; display: flex; gap: 8px;">
                    <button id="resolveAllBtn" class="conflict-btn btn-resolve" style="padding: 6px 12px;">
                        🔧 Resolve All Issues
                    </button>
                    <button id="refreshDepsBtn" class="conflict-btn" style="padding: 6px 12px;">
                        🔄 Refresh
                    </button>
                </div>
            `;
            summary.insertAdjacentHTML('beforeend', buttonsHtml);
        }
    }
    
    async resolveAllConflicts() {
        if (this.isResolving) return;
        
        this.isResolving = true;
        const button = document.getElementById('resolveAllBtn');
        const originalText = button.textContent;
        
        button.disabled = true;
        button.textContent = '🔄 Resolving...';
        
        const problematicDeps = this.dependencies.filter(d => 
            d.status === 'missing' || d.status === 'conflict'
        );
        
        for (const dep of problematicDeps) {
            try {
                await this.resolveDependency(dep);
                this.updateDependencyItem(dep);
                await this.delay(500); // Small delay between resolutions
            } catch (error) {
                console.error(`Failed to resolve ${dep.name}:`, error);
            }
        }
        
        button.textContent = originalText;
        button.disabled = false;
        this.isResolving = false;
        
        this.showNotification('All dependency issues resolved!', 'success');
    }
    
    async refreshDependencies() {
        const button = document.getElementById('refreshDepsBtn');
        button.disabled = true;
        button.textContent = '🔄 Refreshing...';
        
        await this.delay(1000);
        
        this.loadSampleDependencies();
        this.renderDependencies();
        
        button.textContent = '🔄 Refresh';
        button.disabled = false;
        
        this.showNotification('Dependencies refreshed!', 'info');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: 'all 0.3s ease'
        });
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#007bff'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the dependency resolver when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.dependencies-list')) {
        const resolver = new DependencyResolver();
        window.dependencyResolver = resolver; // Make globally accessible
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DependencyResolver };
}

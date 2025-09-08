/**
 * Interactive Dashboard System - Part 1A: Basic Dashboard Container and Layout
 * Foundation for creating configurable dashboard layouts
 */

class DashboardFoundation {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = {
            gridSize: options.gridSize || 12,
            rowHeight: options.rowHeight || 100,
            margin: options.margin || 10,
            responsive: options.responsive !== false,
            className: options.className || 'dashboard-container',
            theme: options.theme || 'light',
            ...options
        };
        
        this.widgets = new Map();
        this.layout = [];
        this.eventListeners = new Map();
        this.initialized = false;
        
        this.init();
    }

    init() {
        this.setupContainer();
        this.setupEventHandlers();
        this.initialized = true;
        console.log('📊 Dashboard Foundation initialized');
    }

    setupContainer() {
        this.container.className = `${this.options.className} dashboard-${this.options.theme}`;
        this.container.style.cssText = `
            position: relative;
            width: 100%;
            min-height: 400px;
            background: ${this.options.theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
            overflow: auto;
        `;
        
        // Add CSS for dashboard styling
        this.injectCSS();
    }

    injectCSS() {
        const existingStyle = document.getElementById('dashboard-foundation-styles');
        if (existingStyle) return;
        
        const style = document.createElement('style');
        style.id = 'dashboard-foundation-styles';
        style.textContent = `
            .dashboard-container {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .dashboard-light {
                background: #f8f9fa;
                color: #333;
            }
            
            .dashboard-dark {
                background: #1a1a1a;
                color: #fff;
            }
            
            .dashboard-widget {
                position: absolute;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                overflow: hidden;
            }
            
            .dashboard-dark .dashboard-widget {
                background: #2d2d2d;
                border: 1px solid #404040;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            
            .dashboard-widget:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            
            .dashboard-dark .dashboard-widget:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            }
            
            .dashboard-widget-header {
                padding: 12px 16px;
                border-bottom: 1px solid #e9ecef;
                background: #fafbfc;
                font-weight: 600;
                font-size: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .dashboard-dark .dashboard-widget-header {
                background: #333;
                border-bottom-color: #404040;
                color: #fff;
            }
            
            .dashboard-widget-content {
                padding: 16px;
                height: calc(100% - 49px);
                overflow: auto;
            }
            
            .dashboard-widget-actions {
                display: flex;
                gap: 8px;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .dashboard-widget:hover .dashboard-widget-actions {
                opacity: 1;
            }
            
            .dashboard-widget-action {
                background: none;
                border: none;
                color: #6c757d;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .dashboard-widget-action:hover {
                background: #e9ecef;
                color: #495057;
            }
            
            .dashboard-dark .dashboard-widget-action {
                color: #aaa;
            }
            
            .dashboard-dark .dashboard-widget-action:hover {
                background: #404040;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventHandlers() {
        if (this.options.responsive) {
            window.addEventListener('resize', this.handleResize.bind(this));
        }
    }

    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.updateLayout();
        }, 250);
    }

    // Widget Management
    addWidget(id, config) {
        const widget = {
            id: id,
            title: config.title || 'Widget',
            type: config.type || 'default',
            x: config.x || 0,
            y: config.y || 0,
            width: config.width || 4,
            height: config.height || 2,
            content: config.content || null,
            options: config.options || {},
            element: null,
            ...config
        };
        
        this.widgets.set(id, widget);
        this.createWidgetElement(widget);
        this.updateLayout();
        
        this.emit('widgetAdded', { widget });
        return widget;
    }

    removeWidget(id) {
        const widget = this.widgets.get(id);
        if (!widget) return false;
        
        if (widget.element && widget.element.parentNode) {
            widget.element.parentNode.removeChild(widget.element);
        }
        
        this.widgets.delete(id);
        this.updateLayout();
        
        this.emit('widgetRemoved', { widgetId: id });
        return true;
    }

    createWidgetElement(widget) {
        const element = document.createElement('div');
        element.className = 'dashboard-widget';
        element.setAttribute('data-widget-id', widget.id);
        
        // Create header
        const header = document.createElement('div');
        header.className = 'dashboard-widget-header';
        
        const title = document.createElement('span');
        title.textContent = widget.title;
        header.appendChild(title);
        
        // Create actions
        const actions = document.createElement('div');
        actions.className = 'dashboard-widget-actions';
        
        // Add default actions
        const refreshBtn = this.createActionButton('🔄', 'Refresh', () => {
            this.refreshWidget(widget.id);
        });
        
        const settingsBtn = this.createActionButton('⚙️', 'Settings', () => {
            this.showWidgetSettings(widget.id);
        });
        
        const removeBtn = this.createActionButton('✕', 'Remove', () => {
            this.removeWidget(widget.id);
        });
        
        actions.appendChild(refreshBtn);
        actions.appendChild(settingsBtn);
        actions.appendChild(removeBtn);
        header.appendChild(actions);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'dashboard-widget-content';
        
        if (widget.content) {
            if (typeof widget.content === 'string') {
                content.innerHTML = widget.content;
            } else if (widget.content instanceof HTMLElement) {
                content.appendChild(widget.content);
            } else if (typeof widget.content === 'function') {
                const result = widget.content(widget);
                if (typeof result === 'string') {
                    content.innerHTML = result;
                } else if (result instanceof HTMLElement) {
                    content.appendChild(result);
                }
            }
        } else {
            content.innerHTML = `<div style="text-align: center; color: #999; padding: 20px;">Widget content for ${widget.title}</div>`;
        }
        
        element.appendChild(header);
        element.appendChild(content);
        
        this.container.appendChild(element);
        widget.element = element;
        
        return element;
    }

    createActionButton(icon, title, onClick) {
        const button = document.createElement('button');
        button.className = 'dashboard-widget-action';
        button.textContent = icon;
        button.title = title;
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick(e);
        });
        return button;
    }

    // Layout Management
    updateLayout() {
        if (!this.initialized) return;
        
        const containerWidth = this.container.clientWidth;
        const columnWidth = (containerWidth - (this.options.margin * (this.options.gridSize + 1))) / this.options.gridSize;
        
        this.widgets.forEach((widget) => {
            if (!widget.element) return;
            
            const x = (columnWidth + this.options.margin) * widget.x + this.options.margin;
            const y = (this.options.rowHeight + this.options.margin) * widget.y + this.options.margin;
            const width = columnWidth * widget.width + this.options.margin * (widget.width - 1);
            const height = this.options.rowHeight * widget.height + this.options.margin * (widget.height - 1);
            
            widget.element.style.cssText += `
                left: ${x}px;
                top: ${y}px;
                width: ${width}px;
                height: ${height}px;
            `;
        });
        
        // Update container height
        const maxY = Math.max(...Array.from(this.widgets.values()).map(w => w.y + w.height), 0);
        const containerHeight = (this.options.rowHeight + this.options.margin) * maxY + this.options.margin;
        this.container.style.minHeight = `${containerHeight}px`;
    }

    // Widget Actions
    refreshWidget(id) {
        const widget = this.widgets.get(id);
        if (!widget) return;
        
        this.emit('widgetRefresh', { widget });
        
        // Basic refresh - recreate content
        const contentElement = widget.element.querySelector('.dashboard-widget-content');
        if (contentElement && widget.content && typeof widget.content === 'function') {
            const result = widget.content(widget);
            if (typeof result === 'string') {
                contentElement.innerHTML = result;
            } else if (result instanceof HTMLElement) {
                contentElement.innerHTML = '';
                contentElement.appendChild(result);
            }
        }
    }

    showWidgetSettings(id) {
        const widget = this.widgets.get(id);
        if (!widget) return;
        
        this.emit('widgetSettings', { widget });
        
        // Basic settings modal (this would be enhanced in a real implementation)
        const settings = prompt(`Settings for ${widget.title}:\nEnter new title:`, widget.title);
        if (settings && settings !== widget.title) {
            widget.title = settings;
            const titleElement = widget.element.querySelector('.dashboard-widget-header span');
            if (titleElement) {
                titleElement.textContent = settings;
            }
        }
    }

    // Data and State Management
    getLayout() {
        return Array.from(this.widgets.values()).map(widget => ({
            id: widget.id,
            title: widget.title,
            type: widget.type,
            x: widget.x,
            y: widget.y,
            width: widget.width,
            height: widget.height,
            options: widget.options
        }));
    }

    loadLayout(layout) {
        // Clear existing widgets
        this.widgets.forEach((widget, id) => {
            this.removeWidget(id);
        });
        
        // Add widgets from layout
        layout.forEach(widgetConfig => {
            this.addWidget(widgetConfig.id, widgetConfig);
        });
        
        this.emit('layoutLoaded', { layout });
    }

    // Event System
    on(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }

    off(eventType, callback) {
        if (!this.eventListeners.has(eventType)) return;
        
        const listeners = this.eventListeners.get(eventType);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    emit(eventType, data) {
        if (!this.eventListeners.has(eventType)) return;
        
        this.eventListeners.get(eventType).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${eventType} listener:`, error);
            }
        });
    }

    // Utility Methods
    getWidget(id) {
        return this.widgets.get(id);
    }

    getAllWidgets() {
        return Array.from(this.widgets.values());
    }

    destroy() {
        // Remove event listeners
        if (this.options.responsive) {
            window.removeEventListener('resize', this.handleResize);
        }
        
        // Clear widgets
        this.widgets.forEach((widget, id) => {
            this.removeWidget(id);
        });
        
        // Clear container
        this.container.innerHTML = '';
        this.container.className = '';
        this.container.style.cssText = '';
        
        this.initialized = false;
    }
}

// Dashboard Widget Templates
const WidgetTemplates = {
    kpi: (widget) => {
        const value = widget.options.value || '0';
        const label = widget.options.label || 'KPI';
        const trend = widget.options.trend || 0;
        const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➖';
        const trendColor = trend > 0 ? '#28a745' : trend < 0 ? '#dc3545' : '#6c757d';
        
        return `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 2.5em; font-weight: bold; color: #1FB8CD; margin-bottom: 8px;">
                    ${value}
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                    ${label}
                </div>
                <div style="font-size: 12px; color: ${trendColor};">
                    ${trendIcon} ${Math.abs(trend)}%
                </div>
            </div>
        `;
    },
    
    chart: (widget) => {
        return `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: #999;">
                    📊<br>
                    Chart Widget<br>
                    <small>Connect your data source</small>
                </div>
            </div>
        `;
    },
    
    text: (widget) => {
        const content = widget.options.text || 'Add your text content here...';
        return `
            <div style="padding: 8px; line-height: 1.5;">
                ${content}
            </div>
        `;
    },
    
    list: (widget) => {
        const items = widget.options.items || ['Item 1', 'Item 2', 'Item 3'];
        return `
            <div style="padding: 8px;">
                <ul style="margin: 0; padding-left: 20px;">
                    ${items.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardFoundation, WidgetTemplates };
} else {
    window.DashboardFoundation = DashboardFoundation;
    window.WidgetTemplates = WidgetTemplates;
}

console.log('📊 Dashboard Foundation (Part 1A) loaded - Basic Container and Layout');

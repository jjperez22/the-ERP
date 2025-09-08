/**
 * Advanced Chart Library - Part 1C2: Tooltips System
 * Dynamic tooltips with customizable content and positioning
 */

class ChartTooltip {
    constructor(chart, options = {}) {
        this.chart = chart;
        this.options = {
            enabled: options.enabled !== false,
            className: options.className || 'chart-tooltip',
            backgroundColor: options.backgroundColor || 'rgba(0, 0, 0, 0.8)',
            color: options.color || '#ffffff',
            fontSize: options.fontSize || '12px',
            fontFamily: options.fontFamily || 'Arial, sans-serif',
            padding: options.padding || '8px 12px',
            borderRadius: options.borderRadius || '4px',
            boxShadow: options.boxShadow || '0 2px 8px rgba(0, 0, 0, 0.2)',
            zIndex: options.zIndex || 1000,
            offset: options.offset || { x: 10, y: -10 },
            animation: options.animation !== false,
            template: options.template || null,
            formatter: options.formatter || null,
            ...options
        };
        
        this.element = null;
        this.visible = false;
        this.currentData = null;
        
        this.init();
    }

    init() {
        this.createTooltipElement();
        this.bindEvents();
        console.log('💬 Chart tooltip initialized');
    }

    createTooltipElement() {
        this.element = document.createElement('div');
        this.element.className = this.options.className;
        this.element.style.cssText = `
            position: absolute;
            background: ${this.options.backgroundColor};
            color: ${this.options.color};
            font-size: ${this.options.fontSize};
            font-family: ${this.options.fontFamily};
            padding: ${this.options.padding};
            border-radius: ${this.options.borderRadius};
            box-shadow: ${this.options.boxShadow};
            z-index: ${this.options.zIndex};
            pointer-events: none;
            opacity: 0;
            transition: ${this.options.animation ? 'opacity 0.2s ease, transform 0.2s ease' : 'none'};
            transform: scale(0.9);
            white-space: nowrap;
        `;
        
        document.body.appendChild(this.element);
    }

    bindEvents() {
        if (!this.options.enabled) return;
        
        this.chart.on('hoverin', (event) => {
            this.show(event.element, event.position);
        });
        
        this.chart.on('hoverout', () => {
            this.hide();
        });
        
        this.chart.on('mouseleave', () => {
            this.hide();
        });
    }

    show(element, position) {
        if (!this.options.enabled || !element) return;
        
        this.currentData = element;
        const content = this.generateContent(element);
        
        this.element.innerHTML = content;
        this.element.style.opacity = '1';
        this.element.style.transform = 'scale(1)';
        this.visible = true;
        
        this.updatePosition(position);
    }

    hide() {
        if (!this.visible) return;
        
        this.element.style.opacity = '0';
        this.element.style.transform = 'scale(0.9)';
        this.visible = false;
        this.currentData = null;
    }

    updatePosition(position) {
        if (!this.visible || !position) return;
        
        const chartRect = this.chart.canvas.getBoundingClientRect();
        const tooltipRect = this.element.getBoundingClientRect();
        
        let x = chartRect.left + position.x + this.options.offset.x;
        let y = chartRect.top + position.y + this.options.offset.y;
        
        // Prevent tooltip from going off-screen
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust horizontal position
        if (x + tooltipRect.width > viewportWidth) {
            x = chartRect.left + position.x - tooltipRect.width - Math.abs(this.options.offset.x);
        }
        
        // Adjust vertical position
        if (y + tooltipRect.height > viewportHeight) {
            y = chartRect.top + position.y - tooltipRect.height - Math.abs(this.options.offset.y);
        }
        
        // Ensure tooltip doesn't go above the viewport
        if (y < 0) {
            y = chartRect.top + position.y + 20;
        }
        
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    generateContent(element) {
        // Use custom template if provided
        if (this.options.template) {
            return this.options.template(element);
        }
        
        // Use custom formatter if provided
        if (this.options.formatter) {
            return this.options.formatter(element);
        }
        
        // Default content generation
        return this.getDefaultContent(element);
    }

    getDefaultContent(element) {
        const { data, value, type, index } = element;
        
        let content = '<div class="tooltip-content">';
        
        // Add title if available
        if (data.label || data.name) {
            content += `<div class="tooltip-title" style="font-weight: bold; margin-bottom: 4px;">${data.label || data.name}</div>`;
        }
        
        // Add value
        content += `<div class="tooltip-value">Value: ${this.formatValue(value)}</div>`;
        
        // Add additional data if available
        if (data.category) {
            content += `<div class="tooltip-category">Category: ${data.category}</div>`;
        }
        
        if (data.date) {
            content += `<div class="tooltip-date">Date: ${this.formatDate(data.date)}</div>`;
        }
        
        content += '</div>';
        
        return content;
    }

    formatValue(value) {
        if (typeof value === 'number') {
            // Format numbers with appropriate precision
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
            } else {
                return value.toLocaleString();
            }
        }
        
        return String(value);
    }

    formatDate(date) {
        if (date instanceof Date) {
            return date.toLocaleDateString();
        }
        
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : String(date);
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.visible = false;
        this.currentData = null;
    }
}

// Enhanced Interactive Charts with Tooltips
class InteractiveLineChartWithTooltips extends InteractiveLineChart {
    constructor(container, options = {}) {
        super(container, options);
        
        this.tooltip = new ChartTooltip(this, {
            template: (element) => {
                return `
                    <div style="text-align: center;">
                        <div style="font-weight: bold; color: #1FB8CD; margin-bottom: 4px;">
                            📍 ${element.data.label || `Point ${element.index + 1}`}
                        </div>
                        <div style="font-size: 14px; font-weight: bold;">
                            ${this.formatTooltipValue(element.value)}
                        </div>
                        ${element.data.date ? `<div style="font-size: 11px; color: #ccc; margin-top: 2px;">${new Date(element.data.date).toLocaleDateString()}</div>` : ''}
                    </div>
                `;
            },
            ...options.tooltip
        });
    }

    formatTooltipValue(value) {
        if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }
        return String(value);
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
        super.destroy();
    }
}

class InteractiveBarChartWithTooltips extends InteractiveBarChart {
    constructor(container, options = {}) {
        super(container, options);
        
        this.tooltip = new ChartTooltip(this, {
            template: (element) => {
                const percentage = this.calculatePercentage(element.value);
                return `
                    <div style="min-width: 120px;">
                        <div style="font-weight: bold; color: #1FB8CD; margin-bottom: 6px; display: flex; align-items: center;">
                            📊 ${element.data.label || element.data.name || `Item ${element.index + 1}`}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Value:</span>
                            <span style="font-weight: bold; color: #fff;">${this.formatTooltipValue(element.value)}</span>
                        </div>
                        ${percentage !== null ? `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                                <span>Percentage:</span>
                                <span style="font-weight: bold; color: #4CAF50;">${percentage.toFixed(1)}%</span>
                            </div>
                        ` : ''}
                        ${element.data.category ? `
                            <div style="font-size: 11px; color: #ccc; margin-top: 4px; border-top: 1px solid #333; padding-top: 4px;">
                                Category: ${element.data.category}
                            </div>
                        ` : ''}
                    </div>
                `;
            },
            ...options.tooltip
        });
    }

    calculatePercentage(value) {
        if (!this.data || this.data.length === 0) return null;
        
        const total = this.data.reduce((sum, d) => sum + (d.value || d.y || 0), 0);
        return total > 0 ? (value / total) * 100 : 0;
    }

    formatTooltipValue(value) {
        if (typeof value === 'number') {
            if (Math.abs(value) >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
            } else if (Math.abs(value) >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
            } else {
                return value.toLocaleString();
            }
        }
        return String(value);
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
        super.destroy();
    }
}

// Enhanced chart creation function with tooltips
function createInteractiveChart(type, container, data, options = {}) {
    let chart;
    
    switch (type.toLowerCase()) {
        case 'line':
            chart = new InteractiveLineChartWithTooltips(container, options);
            break;
        case 'bar':
            chart = new InteractiveBarChartWithTooltips(container, options);
            break;
        default:
            throw new Error(`Interactive chart type '${type}' not supported`);
    }
    
    if (data) {
        chart.setData(data).render();
    }
    
    return chart;
}

// Custom tooltip templates
const TooltipTemplates = {
    minimal: (element) => {
        return `<div style="font-weight: bold;">${element.value}</div>`;
    },
    
    detailed: (element) => {
        return `
            <div style="min-width: 150px;">
                <div style="font-weight: bold; color: #1FB8CD; margin-bottom: 8px; font-size: 14px;">
                    ${element.data.label || element.data.name || 'Data Point'}
                </div>
                <table style="width: 100%; font-size: 12px;">
                    <tr><td>Value:</td><td style="text-align: right; font-weight: bold;">${element.value}</td></tr>
                    ${element.data.category ? `<tr><td>Category:</td><td style="text-align: right;">${element.data.category}</td></tr>` : ''}
                    ${element.data.date ? `<tr><td>Date:</td><td style="text-align: right;">${new Date(element.data.date).toLocaleDateString()}</td></tr>` : ''}
                    <tr><td>Index:</td><td style="text-align: right;">${element.index}</td></tr>
                </table>
            </div>
        `;
    },
    
    card: (element) => {
        return `
            <div style="background: linear-gradient(135deg, #1FB8CD, #1A9CB8); color: white; padding: 12px; border-radius: 8px; min-width: 140px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 18px; margin-right: 8px;">📈</span>
                    <span style="font-weight: bold; font-size: 13px;">${element.data.label || 'Data Point'}</span>
                </div>
                <div style="font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 4px;">
                    ${element.value}
                </div>
                ${element.data.change ? `
                    <div style="text-align: center; font-size: 11px; opacity: 0.9;">
                        ${element.data.change > 0 ? '↗' : '↘'} ${Math.abs(element.data.change)}%
                    </div>
                ` : ''}
            </div>
        `;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ChartTooltip, 
        InteractiveLineChartWithTooltips, 
        InteractiveBarChartWithTooltips,
        createInteractiveChart,
        TooltipTemplates
    };
} else {
    window.ChartTooltip = ChartTooltip;
    window.InteractiveLineChartWithTooltips = InteractiveLineChartWithTooltips;
    window.InteractiveBarChartWithTooltips = InteractiveBarChartWithTooltips;
    window.createInteractiveChart = createInteractiveChart;
    window.TooltipTemplates = TooltipTemplates;
}

console.log('📊 Chart Tooltips (Part 1C2) loaded - Dynamic Tooltip System');

/**
 * Advanced Chart Library - Part 1A: Basic Chart Foundation
 * Core chart rendering engine with basic functionality
 */

class ChartFoundation {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = {
            width: options.width || 600,
            height: options.height || 400,
            margin: options.margin || { top: 20, right: 20, bottom: 40, left: 60 },
            responsive: options.responsive !== false,
            theme: options.theme || 'light',
            ...options
        };
        
        this.canvas = null;
        this.ctx = null;
        this.data = null;
        this.scales = {};
        this.initialized = false;
        
        this.init();
    }

    init() {
        this.createCanvas();
        this.setupResizing();
        this.initialized = true;
        console.log('📊 Chart Foundation initialized');
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.style.display = 'block';
        this.canvas.style.maxWidth = '100%';
        
        this.ctx = this.canvas.getContext('2d');
        
        // Handle high DPI displays
        const devicePixelRatio = window.devicePixelRatio || 1;
        const backingStoreRatio = this.ctx.webkitBackingStorePixelRatio ||
                                 this.ctx.mozBackingStorePixelRatio ||
                                 this.ctx.msBackingStorePixelRatio ||
                                 this.ctx.oBackingStorePixelRatio ||
                                 this.ctx.backingStorePixelRatio || 1;
        
        const ratio = devicePixelRatio / backingStoreRatio;
        if (devicePixelRatio !== backingStoreRatio) {
            this.canvas.width = this.options.width * ratio;
            this.canvas.height = this.options.height * ratio;
            this.canvas.style.width = this.options.width + 'px';
            this.canvas.style.height = this.options.height + 'px';
            this.ctx.scale(ratio, ratio);
        }
        
        this.container.appendChild(this.canvas);
    }

    setupResizing() {
        if (!this.options.responsive) return;
        
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        
        resizeObserver.observe(this.container);
    }

    resize() {
        const containerRect = this.container.getBoundingClientRect();
        this.options.width = containerRect.width;
        this.options.height = Math.min(containerRect.height, containerRect.width * 0.6);
        
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.style.width = this.options.width + 'px';
        this.canvas.style.height = this.options.height + 'px';
        
        if (this.data) {
            this.render();
        }
    }

    setData(data) {
        this.data = data;
        this.updateScales();
        return this;
    }

    updateScales() {
        if (!this.data) return;
        
        // Create basic linear scale for demonstration
        const values = this.data.map(d => d.value || d.y || 0);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        this.scales.y = {
            min: minValue,
            max: maxValue,
            range: maxValue - minValue,
            scale: (value) => {
                const plotHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;
                return this.options.margin.top + plotHeight * (1 - (value - minValue) / (maxValue - minValue));
            }
        };
        
        this.scales.x = {
            scale: (index) => {
                const plotWidth = this.options.width - this.options.margin.left - this.options.margin.right;
                return this.options.margin.left + (plotWidth / (this.data.length - 1)) * index;
            }
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    }

    drawBackground() {
        this.ctx.fillStyle = this.options.theme === 'dark' ? '#1a1a1a' : '#ffffff';
        this.ctx.fillRect(0, 0, this.options.width, this.options.height);
    }

    drawGrid() {
        const { margin, width, height } = this.options;
        this.ctx.strokeStyle = this.options.theme === 'dark' ? '#333333' : '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        // Vertical grid lines
        for (let i = 0; i < this.data.length; i++) {
            const x = this.scales.x.scale(i);
            this.ctx.moveTo(x, margin.top);
            this.ctx.lineTo(x, height - margin.bottom);
        }
        
        // Horizontal grid lines
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = margin.top + (height - margin.top - margin.bottom) * (i / gridLines);
            this.ctx.moveTo(margin.left, y);
            this.ctx.lineTo(width - margin.right, y);
        }
        
        this.ctx.stroke();
    }

    drawAxes() {
        const { margin, width, height } = this.options;
        this.ctx.strokeStyle = this.options.theme === 'dark' ? '#666666' : '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Y-axis
        this.ctx.moveTo(margin.left, margin.top);
        this.ctx.lineTo(margin.left, height - margin.bottom);
        
        // X-axis
        this.ctx.moveTo(margin.left, height - margin.bottom);
        this.ctx.lineTo(width - margin.right, height - margin.bottom);
        
        this.ctx.stroke();
    }

    drawLabels() {
        if (!this.data) return;
        
        this.ctx.fillStyle = this.options.theme === 'dark' ? '#ffffff' : '#333333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // X-axis labels
        this.data.forEach((d, i) => {
            const x = this.scales.x.scale(i);
            const label = d.label || d.name || i.toString();
            this.ctx.fillText(label, x, this.options.height - this.options.margin.bottom + 10);
        });
        
        // Y-axis labels
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const value = this.scales.y.min + (this.scales.y.range * (1 - i / gridLines));
            const y = this.options.margin.top + (this.options.height - this.options.margin.top - this.options.margin.bottom) * (i / gridLines);
            this.ctx.fillText(Math.round(value).toString(), this.options.margin.left - 10, y);
        }
    }

    render() {
        if (!this.data || !this.initialized) return;
        
        this.clear();
        this.drawBackground();
        this.drawGrid();
        this.drawAxes();
        this.drawLabels();
        
        return this;
    }

    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
        this.data = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartFoundation;
} else {
    window.ChartFoundation = ChartFoundation;
}

console.log('📊 Chart Foundation (Part 1A) loaded - Basic Chart Foundation');

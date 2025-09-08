/**
 * Advanced Chart Library - Part 1C1: Basic Interactivity
 * Mouse events, hit detection, and basic interactions
 */

class InteractiveChart extends ChartFoundation {
    constructor(container, options = {}) {
        super(container, options);
        
        this.interactivity = {
            enabled: options.interactivity !== false,
            hover: options.hover !== false,
            click: options.click !== false,
            cursor: options.cursor || 'pointer',
            ...options.interactivity || {}
        };
        
        this.eventListeners = new Map();
        this.hoveredElement = null;
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseOver = false;
        
        if (this.interactivity.enabled) {
            this.setupInteractivity();
        }
    }

    setupInteractivity() {
        this.canvas.style.cursor = 'default';
        
        // Mouse event listeners
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        console.log('🖱️ Chart interactivity enabled');
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        if (this.interactivity.hover) {
            this.handleHover();
        }
        
        this.emit('mousemove', {
            position: this.mousePosition,
            event: event
        });
    }

    handleMouseEnter(event) {
        this.isMouseOver = true;
        this.emit('mouseenter', { event: event });
    }

    handleMouseLeave(event) {
        this.isMouseOver = false;
        this.hoveredElement = null;
        this.canvas.style.cursor = 'default';
        this.emit('mouseleave', { event: event });
        
        // Trigger re-render to clear hover effects
        this.render();
    }

    handleClick(event) {
        if (!this.interactivity.click) return;
        
        const clickedElement = this.getElementAtPosition(this.mousePosition);
        
        if (clickedElement) {
            this.emit('click', {
                element: clickedElement,
                position: this.mousePosition,
                event: event
            });
        }
    }

    handleHover() {
        const hoveredElement = this.getElementAtPosition(this.mousePosition);
        
        if (hoveredElement !== this.hoveredElement) {
            // Hover out of previous element
            if (this.hoveredElement) {
                this.emit('hoverout', {
                    element: this.hoveredElement,
                    position: this.mousePosition
                });
            }
            
            // Hover into new element
            if (hoveredElement) {
                this.emit('hoverin', {
                    element: hoveredElement,
                    position: this.mousePosition
                });
                this.canvas.style.cursor = this.interactivity.cursor;
            } else {
                this.canvas.style.cursor = 'default';
            }
            
            this.hoveredElement = hoveredElement;
            this.render(); // Re-render to show hover effects
        }
    }

    getElementAtPosition(position) {
        if (!this.data || !position) return null;
        
        // This will be overridden by specific chart types
        return null;
    }

    // Event system
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

    destroy() {
        // Remove event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mouseenter', this.handleMouseEnter);
            this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
            this.canvas.removeEventListener('click', this.handleClick);
        }
        
        super.destroy();
    }
}

// Interactive Line Chart
class InteractiveLineChart extends InteractiveChart {
    constructor(container, options = {}) {
        super(container, options);
        
        this.lineOptions = {
            strokeColor: options.strokeColor || '#1FB8CD',
            strokeWidth: options.strokeWidth || 2,
            pointRadius: options.pointRadius || 4,
            pointColor: options.pointColor || '#1FB8CD',
            hoverPointRadius: options.hoverPointRadius || 6,
            hoverPointColor: options.hoverPointColor || '#FF6B35',
            fillArea: options.fillArea || false,
            fillColor: options.fillColor || 'rgba(31, 184, 205, 0.2)',
            smooth: options.smooth || false,
            ...options
        };
    }

    getElementAtPosition(position) {
        if (!this.data) return null;
        
        // Check if mouse is over any data point
        for (let i = 0; i < this.data.length; i++) {
            const x = this.scales.x.scale(i);
            const y = this.scales.y.scale(this.data[i].value || this.data[i].y || 0);
            
            const distance = Math.sqrt(
                Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2)
            );
            
            if (distance <= this.lineOptions.pointRadius + 5) {
                return {
                    type: 'point',
                    index: i,
                    data: this.data[i],
                    position: { x, y },
                    value: this.data[i].value || this.data[i].y || 0
                };
            }
        }
        
        return null;
    }

    drawLine() {
        if (!this.data || this.data.length === 0) return;

        const { strokeColor, strokeWidth, smooth } = this.lineOptions;
        
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.beginPath();

        if (smooth) {
            this.drawSmoothLine();
        } else {
            this.drawStraightLine();
        }

        this.ctx.stroke();

        if (this.lineOptions.fillArea) {
            this.drawFillArea();
        }
    }

    drawStraightLine() {
        this.data.forEach((d, i) => {
            const x = this.scales.x.scale(i);
            const y = this.scales.y.scale(d.value || d.y || 0);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
    }

    drawSmoothLine() {
        // Simplified smooth line implementation
        const points = this.data.map((d, i) => ({
            x: this.scales.x.scale(i),
            y: this.scales.y.scale(d.value || d.y || 0)
        }));

        if (points.length < 2) return;

        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            
            const cpx = (prev.x + curr.x) / 2;
            const cpy = (prev.y + curr.y) / 2;
            
            this.ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
    }

    drawFillArea() {
        if (!this.data || this.data.length === 0) return;

        this.ctx.fillStyle = this.lineOptions.fillColor;
        this.ctx.lineTo(this.scales.x.scale(this.data.length - 1), this.options.height - this.options.margin.bottom);
        this.ctx.lineTo(this.scales.x.scale(0), this.options.height - this.options.margin.bottom);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawPoints() {
        if (!this.data) return;

        this.data.forEach((d, i) => {
            const x = this.scales.x.scale(i);
            const y = this.scales.y.scale(d.value || d.y || 0);
            
            // Check if this point is hovered
            const isHovered = this.hoveredElement && 
                             this.hoveredElement.type === 'point' && 
                             this.hoveredElement.index === i;
            
            const radius = isHovered ? this.lineOptions.hoverPointRadius : this.lineOptions.pointRadius;
            const color = isHovered ? this.lineOptions.hoverPointColor : this.lineOptions.pointColor;
            
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Add a white border for hovered points
            if (isHovered) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });
    }

    render() {
        super.render();
        this.drawLine();
        this.drawPoints();
        return this;
    }
}

// Interactive Bar Chart
class InteractiveBarChart extends InteractiveChart {
    constructor(container, options = {}) {
        super(container, options);
        
        this.barOptions = {
            fillColor: options.fillColor || '#1FB8CD',
            hoverFillColor: options.hoverFillColor || '#FF6B35',
            strokeColor: options.strokeColor || '#1A9CB8',
            strokeWidth: options.strokeWidth || 1,
            barSpacing: options.barSpacing || 0.2,
            cornerRadius: options.cornerRadius || 0,
            gradient: options.gradient || false,
            ...options
        };
    }

    updateScales() {
        if (!this.data) return;
        
        const values = this.data.map(d => d.value || d.y || 0);
        const minValue = Math.min(0, Math.min(...values));
        const maxValue = Math.max(...values);
        
        this.scales.y = {
            min: minValue,
            max: maxValue,
            range: maxValue - minValue,
            scale: (value) => {
                const plotHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;
                const ratio = (value - minValue) / (maxValue - minValue);
                return this.options.height - this.options.margin.bottom - (plotHeight * ratio);
            }
        };
        
        const plotWidth = this.options.width - this.options.margin.left - this.options.margin.right;
        const barWidth = plotWidth / this.data.length * (1 - this.barOptions.barSpacing);
        const barSpacing = plotWidth / this.data.length * this.barOptions.barSpacing;
        
        this.scales.x = {
            barWidth: barWidth,
            scale: (index) => {
                return this.options.margin.left + (plotWidth / this.data.length) * index + barSpacing / 2;
            }
        };
    }

    getElementAtPosition(position) {
        if (!this.data) return null;
        
        const baseY = this.scales.y.scale(0);
        
        for (let i = 0; i < this.data.length; i++) {
            const value = this.data[i].value || this.data[i].y || 0;
            const x = this.scales.x.scale(i);
            const y = this.scales.y.scale(value);
            const width = this.scales.x.barWidth;
            const height = Math.abs(baseY - y);
            const rectY = value >= 0 ? y : baseY;
            
            if (position.x >= x && position.x <= x + width &&
                position.y >= rectY && position.y <= rectY + height) {
                return {
                    type: 'bar',
                    index: i,
                    data: this.data[i],
                    position: { x: x + width / 2, y: rectY },
                    value: value,
                    bounds: { x, y: rectY, width, height }
                };
            }
        }
        
        return null;
    }

    drawBars() {
        if (!this.data) return;

        const { fillColor, hoverFillColor, strokeColor, strokeWidth, cornerRadius, gradient } = this.barOptions;
        const baseY = this.scales.y.scale(0);
        
        this.data.forEach((d, i) => {
            const value = d.value || d.y || 0;
            const x = this.scales.x.scale(i);
            const y = this.scales.y.scale(value);
            const width = this.scales.x.barWidth;
            const height = Math.abs(baseY - y);
            const rectY = value >= 0 ? y : baseY;
            
            // Check if this bar is hovered
            const isHovered = this.hoveredElement && 
                             this.hoveredElement.type === 'bar' && 
                             this.hoveredElement.index === i;
            
            const currentFillColor = isHovered ? hoverFillColor : fillColor;
            
            // Create gradient if enabled
            if (gradient) {
                const gradientFill = this.ctx.createLinearGradient(0, rectY, 0, rectY + height);
                gradientFill.addColorStop(0, currentFillColor);
                gradientFill.addColorStop(1, this.adjustColorBrightness(currentFillColor, -20));
                this.ctx.fillStyle = gradientFill;
            } else {
                this.ctx.fillStyle = currentFillColor;
            }

            // Draw bar
            if (cornerRadius > 0) {
                this.drawRoundedRect(x, rectY, width, height, cornerRadius);
            } else {
                this.ctx.fillRect(x, rectY, width, height);
            }

            // Draw stroke
            if (strokeWidth > 0) {
                this.ctx.strokeStyle = strokeColor;
                this.ctx.lineWidth = strokeWidth;
                if (cornerRadius > 0) {
                    this.strokeRoundedRect(x, rectY, width, height, cornerRadius);
                } else {
                    this.ctx.strokeRect(x, rectY, width, height);
                }
            }
        });
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    strokeRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    adjustColorBrightness(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount;
        let g = (num >> 8 & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        b = b > 255 ? 255 : b < 0 ? 0 : b;
        return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
    }

    render() {
        super.render();
        this.drawBars();
        return this;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InteractiveChart, InteractiveLineChart, InteractiveBarChart };
} else {
    window.InteractiveChart = InteractiveChart;
    window.InteractiveLineChart = InteractiveLineChart;
    window.InteractiveBarChart = InteractiveBarChart;
}

console.log('📊 Chart Interactivity (Part 1C1) loaded - Basic Mouse Events');

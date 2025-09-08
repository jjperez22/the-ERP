/**
 * Advanced Chart Library - Part 1B: Basic Chart Types
 * Line and Bar chart implementations
 */

class LineChart extends ChartFoundation {
    constructor(container, options = {}) {
        super(container, {
            ...options,
            type: 'line'
        });
        
        this.lineOptions = {
            strokeColor: options.strokeColor || '#1FB8CD',
            strokeWidth: options.strokeWidth || 2,
            pointRadius: options.pointRadius || 4,
            pointColor: options.pointColor || '#1FB8CD',
            fillArea: options.fillArea || false,
            fillColor: options.fillColor || 'rgba(31, 184, 205, 0.2)',
            smooth: options.smooth || false,
            ...options
        };
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
        const points = this.data.map((d, i) => ({
            x: this.scales.x.scale(i),
            y: this.scales.y.scale(d.value || d.y || 0)
        }));

        if (points.length < 2) return;

        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            if (i === 1) {
                const cp1x = prev.x + (curr.x - prev.x) * 0.3;
                const cp1y = prev.y;
                this.ctx.quadraticCurveTo(cp1x, cp1y, curr.x, curr.y);
            } else if (i === points.length - 1) {
                const cp1x = prev.x + (curr.x - prev.x) * 0.7;
                const cp1y = curr.y;
                this.ctx.quadraticCurveTo(cp1x, cp1y, curr.x, curr.y);
            } else {
                const cp1x = prev.x + (curr.x - prev.x) * 0.5;
                const cp1y = prev.y + (curr.y - prev.y) * 0.5;
                const cp2x = curr.x - (next.x - curr.x) * 0.5;
                const cp2y = curr.y - (next.y - curr.y) * 0.5;
                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y);
            }
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

        const { pointRadius, pointColor } = this.lineOptions;
        
        this.ctx.fillStyle = pointColor;
        
        this.data.forEach((d, i) => {
            const x = this.scales.x.scale(i);
            const y = this.scales.y.scale(d.value || d.y || 0);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    render() {
        super.render();
        this.drawLine();
        this.drawPoints();
        return this;
    }
}

class BarChart extends ChartFoundation {
    constructor(container, options = {}) {
        super(container, {
            ...options,
            type: 'bar'
        });
        
        this.barOptions = {
            fillColor: options.fillColor || '#1FB8CD',
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
        const minValue = Math.min(0, Math.min(...values)); // Include 0 for bar charts
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

    drawBars() {
        if (!this.data) return;

        const { fillColor, strokeColor, strokeWidth, cornerRadius, gradient } = this.barOptions;
        const baseY = this.scales.y.scale(0);
        
        this.data.forEach((d, i) => {
            const value = d.value || d.y || 0;
            const x = this.scales.x.scale(i);
            const y = this.scales.y.scale(value);
            const width = this.scales.x.barWidth;
            const height = Math.abs(baseY - y);
            
            // Determine bar position for negative values
            const rectY = value >= 0 ? y : baseY;
            
            // Create gradient if enabled
            if (gradient) {
                const gradientFill = this.ctx.createLinearGradient(0, rectY, 0, rectY + height);
                gradientFill.addColorStop(0, fillColor);
                gradientFill.addColorStop(1, this.adjustColorBrightness(fillColor, -20));
                this.ctx.fillStyle = gradientFill;
            } else {
                this.ctx.fillStyle = fillColor;
            }

            // Draw bar with optional rounded corners
            if (cornerRadius > 0) {
                this.drawRoundedRect(x, rectY, width, height, cornerRadius);
            } else {
                this.ctx.fillRect(x, rectY, width, height);
            }

            // Draw stroke if specified
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

// Utility function to create charts easily
function createChart(type, container, data, options = {}) {
    let chart;
    
    switch (type.toLowerCase()) {
        case 'line':
            chart = new LineChart(container, options);
            break;
        case 'bar':
            chart = new BarChart(container, options);
            break;
        default:
            throw new Error(`Chart type '${type}' not supported`);
    }
    
    if (data) {
        chart.setData(data).render();
    }
    
    return chart;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LineChart, BarChart, createChart };
} else {
    window.LineChart = LineChart;
    window.BarChart = BarChart;
    window.createChart = createChart;
}

console.log('📊 Chart Basic Types (Part 1B) loaded - Line and Bar charts');

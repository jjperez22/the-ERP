"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeMonitoringDashboard = void 0;
const warp_1 = require("@varld/warp");
const events_1 = require("events");
const openai_1 = require("openai");
let RealTimeMonitoringDashboard = class RealTimeMonitoringDashboard extends events_1.EventEmitter {
    openai;
    metrics = new Map();
    widgets = new Map();
    anomalyAlerts = new Map();
    predictiveAlerts = new Map();
    userBehaviorPatterns = new Map();
    aiVisualizationEngine;
    anomalyDetector;
    realTimeStreams = new Map();
    constructor() {
        super();
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY || ''
        });
        this.aiVisualizationEngine = new AIVisualizationEngine(this.openai);
        this.anomalyDetector = new AnomalyDetector();
        this.initializeMetrics();
        this.setupRealTimeStreams();
        this.startAnomalyDetection();
        this.initializePredictiveAlerts();
    }
    initializeMetrics() {
        console.log('📊 Initializing Real-Time Metrics...');
        this.addMetric({
            id: 'revenue_today',
            name: 'Today\'s Revenue',
            value: 0,
            unit: '$',
            trend: 'stable',
            trendPercentage: 0,
            status: 'healthy',
            threshold: { warning: 50000, critical: 25000, direction: 'below' },
            history: [],
            aiInsights: []
        });
        this.addMetric({
            id: 'active_orders',
            name: 'Active Orders',
            value: 0,
            unit: 'orders',
            trend: 'stable',
            trendPercentage: 0,
            status: 'healthy',
            threshold: { warning: 100, critical: 150, direction: 'above' },
            history: [],
            aiInsights: []
        });
        this.addMetric({
            id: 'inventory_turnover',
            name: 'Inventory Turnover Rate',
            value: 0,
            unit: 'turns/month',
            trend: 'stable',
            trendPercentage: 0,
            status: 'healthy',
            threshold: { warning: 2.0, critical: 1.5, direction: 'below' },
            history: [],
            aiInsights: []
        });
        this.addMetric({
            id: 'cash_flow',
            name: 'Cash Flow',
            value: 0,
            unit: '$',
            trend: 'stable',
            trendPercentage: 0,
            status: 'healthy',
            threshold: { warning: 100000, critical: 50000, direction: 'below' },
            history: [],
            aiInsights: []
        });
        this.addMetric({
            id: 'customer_satisfaction',
            name: 'Customer Satisfaction Score',
            value: 0,
            unit: '/10',
            trend: 'stable',
            trendPercentage: 0,
            status: 'healthy',
            threshold: { warning: 8.0, critical: 7.0, direction: 'below' },
            history: [],
            aiInsights: []
        });
        this.addMetric({
            id: 'supplier_performance',
            name: 'Supplier Performance Score',
            value: 0,
            unit: '/10',
            trend: 'stable',
            trendPercentage: 0,
            status: 'healthy',
            threshold: { warning: 8.0, critical: 7.0, direction: 'below' },
            history: [],
            aiInsights: []
        });
        this.addMetric({
            id: 'project_completion_rate',
            name: 'Project Completion Rate',
            value: 0,
            unit: '%',
            trend: 'stable',
            trendPercentage: 0,
            status: 'healthy',
            threshold: { warning: 80, critical: 70, direction: 'below' },
            history: [],
            aiInsights: []
        });
        this.initializeDefaultWidgets();
        console.log('✅ Real-Time Metrics Initialized');
    }
    initializeDefaultWidgets() {
        this.addWidget({
            id: 'revenue_chart',
            type: 'chart',
            title: 'Revenue Trends',
            position: { x: 0, y: 0, width: 6, height: 4 },
            config: {
                chartType: 'line',
                metricIds: ['revenue_today'],
                timeframe: '24h',
                showPredictions: true
            },
            data: {},
            isVisible: true,
            priority: 10,
            adaptiveSettings: {
                showBasedOnRole: ['admin', 'manager', 'finance'],
                hideWhenNotRelevant: false,
                autoResize: true,
                alertThreshold: 0.8,
                refreshInterval: 30000
            }
        });
        this.addWidget({
            id: 'key_metrics',
            type: 'metric',
            title: 'Key Business Metrics',
            position: { x: 6, y: 0, width: 6, height: 4 },
            config: {
                metricIds: ['active_orders', 'cash_flow', 'customer_satisfaction'],
                layout: 'grid'
            },
            data: {},
            isVisible: true,
            priority: 9,
            adaptiveSettings: {
                showBasedOnRole: ['admin', 'manager'],
                hideWhenNotRelevant: false,
                autoResize: true,
                alertThreshold: 0.8,
                refreshInterval: 10000
            }
        });
        this.addWidget({
            id: 'ai_insights',
            type: 'ai_insight',
            title: 'AI-Powered Insights',
            position: { x: 0, y: 4, width: 12, height: 3 },
            config: {
                maxInsights: 5,
                priorityThreshold: 0.7
            },
            data: {},
            isVisible: true,
            priority: 8,
            adaptiveSettings: {
                showBasedOnRole: ['admin', 'manager', 'analyst'],
                hideWhenNotRelevant: true,
                autoResize: false,
                alertThreshold: 0.6,
                refreshInterval: 60000
            }
        });
        this.addWidget({
            id: 'anomaly_alerts',
            type: 'alert',
            title: 'Anomaly Detection Alerts',
            position: { x: 0, y: 7, width: 6, height: 3 },
            config: {
                maxAlerts: 10,
                severityFilter: ['medium', 'high', 'critical']
            },
            data: {},
            isVisible: true,
            priority: 9,
            adaptiveSettings: {
                showBasedOnRole: ['admin', 'manager', 'operations'],
                hideWhenNotRelevant: false,
                autoResize: true,
                alertThreshold: 1.0,
                refreshInterval: 5000
            }
        });
        this.addWidget({
            id: 'predictive_alerts',
            type: 'prediction',
            title: 'Predictive Alerts',
            position: { x: 6, y: 7, width: 6, height: 3 },
            config: {
                maxPredictions: 8,
                timeHorizon: '7d',
                probabilityThreshold: 0.6
            },
            data: {},
            isVisible: true,
            priority: 8,
            adaptiveSettings: {
                showBasedOnRole: ['admin', 'manager', 'analyst'],
                hideWhenNotRelevant: true,
                autoResize: true,
                alertThreshold: 0.7,
                refreshInterval: 300000
            }
        });
    }
    setupRealTimeStreams() {
        console.log('🔄 Setting up Real-Time Data Streams...');
        const revenueStream = setInterval(async () => {
            await this.updateMetricValue('revenue_today', this.simulateRevenueData());
        }, 30000);
        this.realTimeStreams.set('revenue', revenueStream);
        const ordersStream = setInterval(async () => {
            await this.updateMetricValue('active_orders', this.simulateOrdersData());
        }, 10000);
        this.realTimeStreams.set('orders', ordersStream);
        const inventoryStream = setInterval(async () => {
            await this.updateMetricValue('inventory_turnover', this.simulateInventoryData());
        }, 120000);
        this.realTimeStreams.set('inventory', inventoryStream);
        const cashFlowStream = setInterval(async () => {
            await this.updateMetricValue('cash_flow', this.simulateCashFlowData());
        }, 300000);
        this.realTimeStreams.set('cashflow', cashFlowStream);
        const customerStream = setInterval(async () => {
            await this.updateMetricValue('customer_satisfaction', this.simulateCustomerSatisfactionData());
        }, 3600000);
        this.realTimeStreams.set('customer', customerStream);
        const supplierStream = setInterval(async () => {
            await this.updateMetricValue('supplier_performance', this.simulateSupplierPerformanceData());
        }, 3600000);
        this.realTimeStreams.set('supplier', supplierStream);
        console.log('✅ Real-Time Streams Active');
    }
    startAnomalyDetection() {
        console.log('🔍 Starting AI-Powered Anomaly Detection...');
        setInterval(async () => {
            for (const [metricId, metric] of this.metrics) {
                if (metric.history.length >= 10) {
                    const anomalies = await this.anomalyDetector.detectAnomalies(metric);
                    for (const anomaly of anomalies) {
                        await this.handleAnomalyDetection(metricId, anomaly);
                    }
                }
            }
        }, 60000);
        console.log('✅ Anomaly Detection Active');
    }
    async initializePredictiveAlerts() {
        console.log('🔮 Initializing Predictive Alerts...');
        setInterval(async () => {
            await this.generatePredictiveAlerts();
        }, 900000);
        console.log('✅ Predictive Alerts Initialized');
    }
    async updateMetricValue(metricId, newValue) {
        const metric = this.metrics.get(metricId);
        if (!metric)
            return;
        const previousValue = metric.value;
        const dataPoint = {
            timestamp: new Date(),
            value: newValue
        };
        metric.value = newValue;
        metric.history.push(dataPoint);
        metric.lastUpdated = new Date();
        if (metric.history.length > 1000) {
            metric.history = metric.history.slice(-1000);
        }
        if (metric.history.length >= 2) {
            const trend = this.calculateTrend(metric.history.slice(-10));
            metric.trend = trend.direction;
            metric.trendPercentage = trend.percentage;
        }
        metric.status = this.calculateMetricStatus(metric);
        if (Math.abs(newValue - previousValue) > previousValue * 0.1) {
            const insights = await this.generateAIInsights(metric);
            metric.aiInsights = insights;
        }
        if (metric.history.length >= 20) {
            metric.predictedValue = await this.predictNextValue(metric);
        }
        this.emit('metric_updated', { metricId, metric, previousValue });
        await this.checkThresholdBreach(metric);
    }
    calculateTrend(recentData) {
        if (recentData.length < 2)
            return { direction: 'stable', percentage: 0 };
        const firstValue = recentData[0].value;
        const lastValue = recentData[recentData.length - 1].value;
        const change = ((lastValue - firstValue) / firstValue) * 100;
        let direction;
        if (Math.abs(change) < 2) {
            direction = 'stable';
        }
        else if (change > 0) {
            direction = 'up';
        }
        else {
            direction = 'down';
        }
        return { direction, percentage: Math.abs(change) };
    }
    calculateMetricStatus(metric) {
        const { threshold, value } = metric;
        if (threshold.direction === 'above') {
            if (value >= threshold.critical)
                return 'critical';
            if (value >= threshold.warning)
                return 'warning';
        }
        else {
            if (value <= threshold.critical)
                return 'critical';
            if (value <= threshold.warning)
                return 'warning';
        }
        return 'healthy';
    }
    async generateAIInsights(metric) {
        const prompt = `
      Analyze this business metric and provide actionable insights:
      
      Metric: ${metric.name}
      Current Value: ${metric.value} ${metric.unit}
      Trend: ${metric.trend} (${metric.trendPercentage.toFixed(1)}%)
      Status: ${metric.status}
      
      Recent History:
      ${metric.history.slice(-5).map(h => `${h.timestamp.toLocaleTimeString()}: ${h.value}`).join('\n')}
      
      Provide 2-3 concise, actionable insights about:
      1. What this trend means for the business
      2. Potential causes of changes
      3. Recommended actions
      
      Be specific to the construction materials industry.
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'You are a construction industry business analyst providing actionable insights.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 300
            });
            const content = response.choices[0].message.content || '';
            return content.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
        }
        catch (error) {
            console.error('AI insights generation error:', error);
            return [`${metric.name} showing ${metric.trend} trend of ${metric.trendPercentage.toFixed(1)}%`];
        }
    }
    async predictNextValue(metric) {
        const recentData = metric.history.slice(-20);
        const values = recentData.map(d => d.value);
        const movingAvg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const trend = (values[values.length - 1] - values[0]) / values.length;
        return movingAvg + trend * 5;
    }
    async checkThresholdBreach(metric) {
        if (metric.status !== 'healthy') {
            const alert = {
                id: `threshold_${metric.id}_${Date.now()}`,
                metricId: metric.id,
                severity: metric.status === 'critical' ? 'critical' : 'medium',
                type: 'threshold_breach',
                description: `${metric.name} has breached ${metric.status} threshold`,
                detectedAt: new Date(),
                currentValue: metric.value,
                expectedValue: metric.threshold.direction === 'above' ? metric.threshold.warning : metric.threshold.critical,
                confidence: 1.0,
                suggestedActions: await this.generateThresholdActions(metric),
                isResolved: false
            };
            this.anomalyAlerts.set(alert.id, alert);
            this.emit('anomaly_detected', alert);
        }
    }
    async generateThresholdActions(metric) {
        const actions = [];
        switch (metric.id) {
            case 'revenue_today':
                actions.push('Review pricing strategy', 'Increase sales outreach', 'Check for seasonal factors');
                break;
            case 'cash_flow':
                actions.push('Review accounts receivable', 'Optimize payment terms', 'Consider credit line');
                break;
            case 'inventory_turnover':
                actions.push('Analyze slow-moving inventory', 'Adjust procurement strategy', 'Review demand forecasts');
                break;
            default:
                actions.push('Investigate root cause', 'Monitor closely', 'Consider corrective action');
        }
        return actions;
    }
    async handleAnomalyDetection(metricId, anomaly) {
        const alert = {
            id: `anomaly_${metricId}_${Date.now()}`,
            metricId,
            severity: anomaly.severity,
            type: 'ai_detected',
            description: anomaly.description,
            detectedAt: new Date(),
            currentValue: anomaly.currentValue,
            expectedValue: anomaly.expectedValue,
            confidence: anomaly.confidence,
            suggestedActions: anomaly.suggestedActions,
            isResolved: false
        };
        this.anomalyAlerts.set(alert.id, alert);
        this.emit('anomaly_detected', alert);
    }
    async generatePredictiveAlerts() {
        const predictions = await this.aiVisualizationEngine.generatePredictiveAlerts(Array.from(this.metrics.values()));
        for (const prediction of predictions) {
            this.predictiveAlerts.set(prediction.id, prediction);
            this.emit('predictive_alert_generated', prediction);
        }
    }
    simulateRevenueData() {
        const baseRevenue = 75000;
        const timeOfDay = new Date().getHours();
        const businessHoursMultiplier = timeOfDay >= 8 && timeOfDay <= 18 ? 1.5 : 0.3;
        const randomVariation = (Math.random() - 0.5) * 0.2;
        return Math.round(baseRevenue * businessHoursMultiplier * (1 + randomVariation));
    }
    simulateOrdersData() {
        const baseOrders = 45;
        const randomVariation = (Math.random() - 0.5) * 0.3;
        return Math.round(baseOrders * (1 + randomVariation));
    }
    simulateInventoryData() {
        const baseTurnover = 3.2;
        const randomVariation = (Math.random() - 0.5) * 0.15;
        return Number((baseTurnover * (1 + randomVariation)).toFixed(2));
    }
    simulateCashFlowData() {
        const baseCashFlow = 250000;
        const randomVariation = (Math.random() - 0.5) * 0.1;
        return Math.round(baseCashFlow * (1 + randomVariation));
    }
    simulateCustomerSatisfactionData() {
        const baseSatisfaction = 8.5;
        const randomVariation = (Math.random() - 0.5) * 0.2;
        return Number((baseSatisfaction + randomVariation).toFixed(1));
    }
    simulateSupplierPerformanceData() {
        const basePerformance = 8.2;
        const randomVariation = (Math.random() - 0.5) * 0.3;
        return Number((basePerformance + randomVariation).toFixed(1));
    }
    addMetric(metric) {
        const fullMetric = {
            id: metric.id || `metric_${Date.now()}`,
            name: metric.name || 'Untitled Metric',
            value: metric.value || 0,
            unit: metric.unit || '',
            trend: metric.trend || 'stable',
            trendPercentage: metric.trendPercentage || 0,
            status: metric.status || 'healthy',
            threshold: metric.threshold || { warning: 100, critical: 200, direction: 'above' },
            history: metric.history || [],
            aiInsights: metric.aiInsights || [],
            lastUpdated: new Date()
        };
        this.metrics.set(fullMetric.id, fullMetric);
        this.emit('metric_added', fullMetric);
    }
    addWidget(widget) {
        const fullWidget = {
            id: widget.id || `widget_${Date.now()}`,
            type: widget.type || 'metric',
            title: widget.title || 'Untitled Widget',
            position: widget.position || { x: 0, y: 0, width: 4, height: 3 },
            config: widget.config || {},
            data: widget.data || {},
            isVisible: widget.isVisible ?? true,
            priority: widget.priority || 5,
            adaptiveSettings: widget.adaptiveSettings || {
                showBasedOnRole: ['admin'],
                hideWhenNotRelevant: false,
                autoResize: false,
                alertThreshold: 0.8,
                refreshInterval: 30000
            }
        };
        this.widgets.set(fullWidget.id, fullWidget);
        this.emit('widget_added', fullWidget);
    }
    getMetrics() {
        return Array.from(this.metrics.values());
    }
    getWidgets() {
        return Array.from(this.widgets.values());
    }
    getAnomalyAlerts(limit = 50) {
        return Array.from(this.anomalyAlerts.values())
            .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
            .slice(0, limit);
    }
    getPredictiveAlerts(limit = 20) {
        return Array.from(this.predictiveAlerts.values())
            .sort((a, b) => b.probability - a.probability)
            .slice(0, limit);
    }
    async adaptDashboardForUser(userId, userRole) {
        const behavior = this.userBehaviorPatterns.get(userId);
        const adaptedWidgets = [];
        for (const widget of this.widgets.values()) {
            if (widget.adaptiveSettings.showBasedOnRole.includes(userRole)) {
                const adaptedWidget = await this.adaptWidget(widget, behavior, userRole);
                adaptedWidgets.push(adaptedWidget);
            }
        }
        return adaptedWidgets;
    }
    async adaptWidget(widget, behavior, userRole) {
        const adaptedWidget = { ...widget };
        if (behavior) {
            const interactionCount = behavior.timeSpentOnWidgets[widget.id] || 0;
            if (interactionCount > 100) {
                adaptedWidget.adaptiveSettings.refreshInterval *= 0.5;
            }
            if (behavior.mostViewedMetrics.some(metricId => widget.config.metricIds?.includes(metricId))) {
                adaptedWidget.priority += 2;
            }
        }
        return adaptedWidget;
    }
    getDashboardStats() {
        return {
            totalMetrics: this.metrics.size,
            totalWidgets: this.widgets.size,
            activeAlerts: Array.from(this.anomalyAlerts.values()).filter(a => !a.isResolved).length,
            activePredictions: this.predictiveAlerts.size,
            realTimeStreams: this.realTimeStreams.size,
            healthyMetrics: Array.from(this.metrics.values()).filter(m => m.status === 'healthy').length,
            criticalMetrics: Array.from(this.metrics.values()).filter(m => m.status === 'critical').length
        };
    }
};
exports.RealTimeMonitoringDashboard = RealTimeMonitoringDashboard;
exports.RealTimeMonitoringDashboard = RealTimeMonitoringDashboard = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RealTimeMonitoringDashboard);
class AIVisualizationEngine {
    openai;
    constructor(openai) {
        this.openai = openai;
    }
    async generatePredictiveAlerts(metrics) {
        const alerts = [];
        for (const metric of metrics) {
            if (metric.history.length >= 20) {
                const alert = await this.analyzePredictivePatterns(metric);
                if (alert) {
                    alerts.push(alert);
                }
            }
        }
        return alerts;
    }
    async analyzePredictivePatterns(metric) {
        const recentTrend = metric.history.slice(-10);
        const avgChange = recentTrend.reduce((sum, curr, i, arr) => {
            if (i === 0)
                return 0;
            return sum + (curr.value - arr[i - 1].value);
        }, 0) / (recentTrend.length - 1);
        if (Math.abs(avgChange) > metric.value * 0.05) {
            return {
                id: `pred_${metric.id}_${Date.now()}`,
                title: `Predicted ${metric.name} Change`,
                description: `${metric.name} is trending ${avgChange > 0 ? 'upward' : 'downward'} and may reach concerning levels`,
                predictedTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                probability: 0.7,
                impact: Math.abs(avgChange) > metric.value * 0.1 ? 'high' : 'medium',
                category: 'operations',
                preventionActions: [`Monitor ${metric.name} closely`, 'Investigate trend causes', 'Prepare contingency plans'],
                estimatedCost: Math.abs(avgChange * 100)
            };
        }
        return null;
    }
    async suggestVisualization(metrics) {
        return [];
    }
}
class AnomalyDetector {
    async detectAnomalies(metric) {
        const anomalies = [];
        const recentData = metric.history.slice(-20);
        if (recentData.length < 10)
            return anomalies;
        const values = recentData.map(d => d.value);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
        const currentValue = values[values.length - 1];
        const zScore = Math.abs((currentValue - mean) / stdDev);
        if (zScore > 2) {
            anomalies.push({
                severity: zScore > 3 ? 'critical' : 'medium',
                description: `${metric.name} showing unusual pattern (Z-score: ${zScore.toFixed(2)})`,
                currentValue,
                expectedValue: mean,
                confidence: Math.min(0.95, zScore / 3),
                suggestedActions: ['Investigate data source', 'Check for external factors', 'Verify measurement accuracy']
            });
        }
        return anomalies;
    }
}
//# sourceMappingURL=RealTimeMonitoringDashboard.js.map
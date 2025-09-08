// src/services/RealTimeMonitoringDashboard.ts
import { Service } from '@varld/warp';
import { EventEmitter } from 'events';
import { OpenAI } from 'openai';

export interface DashboardMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'healthy' | 'warning' | 'critical';
  threshold: MetricThreshold;
  history: MetricDataPoint[];
  predictedValue?: number;
  aiInsights: string[];
  lastUpdated: Date;
}

export interface MetricThreshold {
  warning: number;
  critical: number;
  direction: 'above' | 'below';
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  anomalyScore?: number;
}

export interface AnomalyAlert {
  id: string;
  metricId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'pattern_change' | 'threshold_breach' | 'ai_detected';
  description: string;
  detectedAt: Date;
  currentValue: number;
  expectedValue: number;
  confidence: number;
  suggestedActions: string[];
  isResolved: boolean;
  resolvedAt?: Date;
}

export interface PredictiveAlert {
  id: string;
  title: string;
  description: string;
  predictedTime: Date;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: 'inventory' | 'finance' | 'operations' | 'customer' | 'supplier';
  preventionActions: string[];
  estimatedCost: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'ai_insight' | 'prediction';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
  data: any;
  isVisible: boolean;
  priority: number;
  adaptiveSettings: AdaptiveSettings;
}

export interface AdaptiveSettings {
  showBasedOnRole: string[];
  hideWhenNotRelevant: boolean;
  autoResize: boolean;
  alertThreshold: number;
  refreshInterval: number;
}

export interface UserBehaviorPattern {
  userId: string;
  mostViewedMetrics: string[];
  timeSpentOnWidgets: Record<string, number>;
  interactionPatterns: string[];
  preferredTimeframe: string;
  alertPreferences: Record<string, boolean>;
  dashboardPersonalization: Record<string, any>;
}

export interface AIVisualizationSuggestion {
  widgetType: string;
  dataSource: string;
  reason: string;
  confidence: number;
  priority: number;
  suggestedPosition: { x: number; y: number; width: number; height: number };
}

@Service()
export class RealTimeMonitoringDashboard extends EventEmitter {
  private openai: OpenAI;
  private metrics: Map<string, DashboardMetric> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private anomalyAlerts: Map<string, AnomalyAlert> = new Map();
  private predictiveAlerts: Map<string, PredictiveAlert> = new Map();
  private userBehaviorPatterns: Map<string, UserBehaviorPattern> = new Map();
  private aiVisualizationEngine: AIVisualizationEngine;
  private anomalyDetector: AnomalyDetector;
  private realTimeStreams: Map<string, NodeJS.Timer> = new Map();

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.aiVisualizationEngine = new AIVisualizationEngine(this.openai);
    this.anomalyDetector = new AnomalyDetector();
    
    this.initializeMetrics();
    this.setupRealTimeStreams();
    this.startAnomalyDetection();
    this.initializePredictiveAlerts();
  }

  private initializeMetrics() {
    console.log('📊 Initializing Real-Time Metrics...');

    // Key Business Metrics
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

    // Initialize default widgets
    this.initializeDefaultWidgets();

    console.log('✅ Real-Time Metrics Initialized');
  }

  private initializeDefaultWidgets() {
    // Revenue Chart Widget
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

    // Key Metrics Dashboard
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

    // AI Insights Widget
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

    // Anomaly Alerts Widget
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

    // Predictive Alerts Widget
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
        refreshInterval: 300000 // 5 minutes
      }
    });
  }

  private setupRealTimeStreams() {
    console.log('🔄 Setting up Real-Time Data Streams...');

    // Revenue stream (every 30 seconds)
    const revenueStream = setInterval(async () => {
      await this.updateMetricValue('revenue_today', this.simulateRevenueData());
    }, 30000);
    this.realTimeStreams.set('revenue', revenueStream);

    // Orders stream (every 10 seconds)
    const ordersStream = setInterval(async () => {
      await this.updateMetricValue('active_orders', this.simulateOrdersData());
    }, 10000);
    this.realTimeStreams.set('orders', ordersStream);

    // Inventory stream (every 2 minutes)
    const inventoryStream = setInterval(async () => {
      await this.updateMetricValue('inventory_turnover', this.simulateInventoryData());
    }, 120000);
    this.realTimeStreams.set('inventory', inventoryStream);

    // Cash flow stream (every 5 minutes)
    const cashFlowStream = setInterval(async () => {
      await this.updateMetricValue('cash_flow', this.simulateCashFlowData());
    }, 300000);
    this.realTimeStreams.set('cashflow', cashFlowStream);

    // Customer satisfaction stream (every hour)
    const customerStream = setInterval(async () => {
      await this.updateMetricValue('customer_satisfaction', this.simulateCustomerSatisfactionData());
    }, 3600000);
    this.realTimeStreams.set('customer', customerStream);

    // Supplier performance stream (every hour)
    const supplierStream = setInterval(async () => {
      await this.updateMetricValue('supplier_performance', this.simulateSupplierPerformanceData());
    }, 3600000);
    this.realTimeStreams.set('supplier', supplierStream);

    console.log('✅ Real-Time Streams Active');
  }

  private startAnomalyDetection() {
    console.log('🔍 Starting AI-Powered Anomaly Detection...');

    // Run anomaly detection every minute
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

  private async initializePredictiveAlerts() {
    console.log('🔮 Initializing Predictive Alerts...');

    // Run predictive analysis every 15 minutes
    setInterval(async () => {
      await this.generatePredictiveAlerts();
    }, 900000);

    console.log('✅ Predictive Alerts Initialized');
  }

  async updateMetricValue(metricId: string, newValue: number): Promise<void> {
    const metric = this.metrics.get(metricId);
    if (!metric) return;

    const previousValue = metric.value;
    const dataPoint: MetricDataPoint = {
      timestamp: new Date(),
      value: newValue
    };

    // Update metric
    metric.value = newValue;
    metric.history.push(dataPoint);
    metric.lastUpdated = new Date();

    // Keep only last 1000 data points
    if (metric.history.length > 1000) {
      metric.history = metric.history.slice(-1000);
    }

    // Calculate trend
    if (metric.history.length >= 2) {
      const trend = this.calculateTrend(metric.history.slice(-10));
      metric.trend = trend.direction;
      metric.trendPercentage = trend.percentage;
    }

    // Update status based on thresholds
    metric.status = this.calculateMetricStatus(metric);

    // Generate AI insights
    if (Math.abs(newValue - previousValue) > previousValue * 0.1) { // 10% change
      const insights = await this.generateAIInsights(metric);
      metric.aiInsights = insights;
    }

    // Generate predictions
    if (metric.history.length >= 20) {
      metric.predictedValue = await this.predictNextValue(metric);
    }

    // Emit update event
    this.emit('metric_updated', { metricId, metric, previousValue });

    // Check for threshold breaches
    await this.checkThresholdBreach(metric);
  }

  private calculateTrend(recentData: MetricDataPoint[]): { direction: 'up' | 'down' | 'stable', percentage: number } {
    if (recentData.length < 2) return { direction: 'stable', percentage: 0 };

    const firstValue = recentData[0].value;
    const lastValue = recentData[recentData.length - 1].value;
    const change = ((lastValue - firstValue) / firstValue) * 100;

    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(change) < 2) {
      direction = 'stable';
    } else if (change > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }

    return { direction, percentage: Math.abs(change) };
  }

  private calculateMetricStatus(metric: DashboardMetric): 'healthy' | 'warning' | 'critical' {
    const { threshold, value } = metric;
    
    if (threshold.direction === 'above') {
      if (value >= threshold.critical) return 'critical';
      if (value >= threshold.warning) return 'warning';
    } else {
      if (value <= threshold.critical) return 'critical';
      if (value <= threshold.warning) return 'warning';
    }
    
    return 'healthy';
  }

  private async generateAIInsights(metric: DashboardMetric): Promise<string[]> {
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
    } catch (error) {
      console.error('AI insights generation error:', error);
      return [`${metric.name} showing ${metric.trend} trend of ${metric.trendPercentage.toFixed(1)}%`];
    }
  }

  private async predictNextValue(metric: DashboardMetric): Promise<number> {
    // Simple prediction based on recent trends
    const recentData = metric.history.slice(-20);
    const values = recentData.map(d => d.value);
    
    // Calculate moving average and trend
    const movingAvg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const trend = (values[values.length - 1] - values[0]) / values.length;
    
    return movingAvg + trend * 5; // Predict 5 periods ahead
  }

  private async checkThresholdBreach(metric: DashboardMetric): Promise<void> {
    if (metric.status !== 'healthy') {
      const alert: AnomalyAlert = {
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

  private async generateThresholdActions(metric: DashboardMetric): Promise<string[]> {
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

  private async handleAnomalyDetection(metricId: string, anomaly: any): Promise<void> {
    const alert: AnomalyAlert = {
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

  private async generatePredictiveAlerts(): Promise<void> {
    const predictions = await this.aiVisualizationEngine.generatePredictiveAlerts(
      Array.from(this.metrics.values())
    );

    for (const prediction of predictions) {
      this.predictiveAlerts.set(prediction.id, prediction);
      this.emit('predictive_alert_generated', prediction);
    }
  }

  // Data simulation methods
  private simulateRevenueData(): number {
    const baseRevenue = 75000;
    const timeOfDay = new Date().getHours();
    const businessHoursMultiplier = timeOfDay >= 8 && timeOfDay <= 18 ? 1.5 : 0.3;
    const randomVariation = (Math.random() - 0.5) * 0.2;
    
    return Math.round(baseRevenue * businessHoursMultiplier * (1 + randomVariation));
  }

  private simulateOrdersData(): number {
    const baseOrders = 45;
    const randomVariation = (Math.random() - 0.5) * 0.3;
    return Math.round(baseOrders * (1 + randomVariation));
  }

  private simulateInventoryData(): number {
    const baseTurnover = 3.2;
    const randomVariation = (Math.random() - 0.5) * 0.15;
    return Number((baseTurnover * (1 + randomVariation)).toFixed(2));
  }

  private simulateCashFlowData(): number {
    const baseCashFlow = 250000;
    const randomVariation = (Math.random() - 0.5) * 0.1;
    return Math.round(baseCashFlow * (1 + randomVariation));
  }

  private simulateCustomerSatisfactionData(): number {
    const baseSatisfaction = 8.5;
    const randomVariation = (Math.random() - 0.5) * 0.2;
    return Number((baseSatisfaction + randomVariation).toFixed(1));
  }

  private simulateSupplierPerformanceData(): number {
    const basePerformance = 8.2;
    const randomVariation = (Math.random() - 0.5) * 0.3;
    return Number((basePerformance + randomVariation).toFixed(1));
  }

  // Public API methods
  addMetric(metric: Partial<DashboardMetric>): void {
    const fullMetric: DashboardMetric = {
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

  addWidget(widget: Partial<DashboardWidget>): void {
    const fullWidget: DashboardWidget = {
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

  getMetrics(): DashboardMetric[] {
    return Array.from(this.metrics.values());
  }

  getWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }

  getAnomalyAlerts(limit: number = 50): AnomalyAlert[] {
    return Array.from(this.anomalyAlerts.values())
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  getPredictiveAlerts(limit: number = 20): PredictiveAlert[] {
    return Array.from(this.predictiveAlerts.values())
      .sort((a, b) => b.probability - a.probability)
      .slice(0, limit);
  }

  async adaptDashboardForUser(userId: string, userRole: string): Promise<DashboardWidget[]> {
    const behavior = this.userBehaviorPatterns.get(userId);
    const adaptedWidgets = [];

    for (const widget of this.widgets.values()) {
      if (widget.adaptiveSettings.showBasedOnRole.includes(userRole)) {
        // Adapt widget based on user behavior
        const adaptedWidget = await this.adaptWidget(widget, behavior, userRole);
        adaptedWidgets.push(adaptedWidget);
      }
    }

    return adaptedWidgets;
  }

  private async adaptWidget(widget: DashboardWidget, behavior?: UserBehaviorPattern, userRole?: string): Promise<DashboardWidget> {
    const adaptedWidget = { ...widget };

    if (behavior) {
      // Adjust refresh interval based on user interaction
      const interactionCount = behavior.timeSpentOnWidgets[widget.id] || 0;
      if (interactionCount > 100) {
        adaptedWidget.adaptiveSettings.refreshInterval *= 0.5; // Refresh faster for frequently used widgets
      }

      // Adjust priority based on user preferences
      if (behavior.mostViewedMetrics.some(metricId => 
        widget.config.metricIds?.includes(metricId)
      )) {
        adaptedWidget.priority += 2;
      }
    }

    return adaptedWidget;
  }

  getDashboardStats(): any {
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
}

// Supporting Classes
class AIVisualizationEngine {
  constructor(private openai: OpenAI) {}

  async generatePredictiveAlerts(metrics: DashboardMetric[]): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];

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

  private async analyzePredictivePatterns(metric: DashboardMetric): Promise<PredictiveAlert | null> {
    // Simple pattern analysis - in production, this would use more sophisticated ML
    const recentTrend = metric.history.slice(-10);
    const avgChange = recentTrend.reduce((sum, curr, i, arr) => {
      if (i === 0) return 0;
      return sum + (curr.value - arr[i-1].value);
    }, 0) / (recentTrend.length - 1);

    if (Math.abs(avgChange) > metric.value * 0.05) { // 5% change trend
      return {
        id: `pred_${metric.id}_${Date.now()}`,
        title: `Predicted ${metric.name} Change`,
        description: `${metric.name} is trending ${avgChange > 0 ? 'upward' : 'downward'} and may reach concerning levels`,
        predictedTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        probability: 0.7,
        impact: Math.abs(avgChange) > metric.value * 0.1 ? 'high' : 'medium',
        category: 'operations',
        preventionActions: [`Monitor ${metric.name} closely`, 'Investigate trend causes', 'Prepare contingency plans'],
        estimatedCost: Math.abs(avgChange * 100) // Simplified cost calculation
      };
    }

    return null;
  }

  async suggestVisualization(metrics: DashboardMetric[]): Promise<AIVisualizationSuggestion[]> {
    // AI-powered visualization suggestions
    return [];
  }
}

class AnomalyDetector {
  async detectAnomalies(metric: DashboardMetric): Promise<any[]> {
    const anomalies: any[] = [];
    const recentData = metric.history.slice(-20);
    
    if (recentData.length < 10) return anomalies;

    // Simple statistical anomaly detection
    const values = recentData.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    const currentValue = values[values.length - 1];
    const zScore = Math.abs((currentValue - mean) / stdDev);
    
    if (zScore > 2) { // 2 standard deviations
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

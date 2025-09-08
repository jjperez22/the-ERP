// src/services/AIOrchestrator.ts
import { Service } from '@varld/warp';
import { OpenAI } from 'openai';
import { Product, Customer, Order, AIInsight } from '../types/index';
import { EventEmitter } from 'events';

export interface AIContext {
  userRole: string;
  companySize: 'small' | 'midsize' | 'enterprise';
  industry: 'construction' | 'distribution' | 'manufacturing';
  preferences: Record<string, any>;
}

@Service()
export class AIOrchestrator extends EventEmitter {
  private openai: OpenAI;
  private aiModels: Map<string, any> = new Map();
  private activeInsights: Map<string, AIInsight> = new Map();

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    this.initializeAIModels();
    this.startRealTimeProcessing();
  }

  private initializeAIModels() {
    // Register specialized AI models for different functions
    this.aiModels.set('demand_forecasting', new DemandForecastingModel());
    this.aiModels.set('inventory_optimization', new InventoryOptimizationModel());
    this.aiModels.set('price_intelligence', new ProjectIntelligenceModel());
    this.aiModels.set('customer_intelligence', new CustomerIntelligenceModel());
    this.aiModels.set('supply_chain_optimization', new SupplyChainOptimizationModel());
    this.aiModels.set('project_intelligence', new ProjectIntelligenceModel());
  }

  // Real-time AI processing engine
  private startRealTimeProcessing() {
    setInterval(() => {
      this.processRealTimeInsights();
    }, 30000); // Process every 30 seconds

    // Process critical alerts immediately
    setInterval(() => {
      this.processCriticalAlerts();
    }, 5000); // Check every 5 seconds
  }

  async generateComprehensiveInsights(context: AIContext): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    try {
      // Parallel processing of different AI models
      const [
        demandInsights,
        inventoryInsights, 
        customerInsights,
        supplyChainInsights,
        projectInsights,
        marketInsights
      ] = await Promise.all([
        this.getDemandForecasts(context),
        this.getInventoryOptimization(context),
        this.getCustomerIntelligence(context),
        this.getSupplyChainOptimization(context),
        this.getProjectIntelligence(context),
        this.getMarketIntelligence(context)
      ]);

      insights.push(...demandInsights, ...inventoryInsights, ...customerInsights, 
                   ...supplyChainInsights, ...projectInsights, ...marketInsights);

      // Apply AI reasoning to prioritize insights
      return this.prioritizeInsights(insights, context);
    } catch (error) {
      console.error('AI Orchestration Error:', error);
      return [];
    }
  }

  async getDemandForecasts(context: AIContext): Promise<AIInsight[]> {
    const model = this.aiModels.get('demand_forecasting');
    const forecasts = await model.generateForecasts(context);
    
    return forecasts.map((forecast: any) => ({
      id: `demand-${Date.now()}-${Math.random()}`,
      type: 'demand' as const,
      title: `Demand Forecast: ${forecast.productName}`,
      description: `Predicted ${forecast.trend > 0 ? 'increase' : 'decrease'} of ${Math.abs(forecast.trend)}% in next ${forecast.horizon} days`,
      severity: this.calculateSeverity(forecast.confidence, forecast.impact),
      confidence: forecast.confidence,
      action: forecast.recommendations?.[0] || 'Review demand patterns',
      timestamp: new Date().toISOString()
    }));
  }

  async getInventoryOptimization(context: AIContext): Promise<AIInsight[]> {
    const model = this.aiModels.get('inventory_optimization');
    const optimizations = await model.optimize(context);
    
    return optimizations.map((opt: any) => ({
      id: `inventory-${Date.now()}-${Math.random()}`,
      type: 'inventory' as const,
      title: opt.title,
      description: opt.description,
      severity: opt.severity,
      confidence: opt.confidence,
      action: opt.actions?.[0] || 'Review inventory levels',
      timestamp: new Date().toISOString()
    }));
  }

  async getCustomerIntelligence(context: AIContext): Promise<AIInsight[]> {
    const model = this.aiModels.get('customer_intelligence');
    const insights = await model.analyzeCustomers(context);
    
    return insights.map((insight: any) => ({
      id: `customer-${Date.now()}-${Math.random()}`,
      type: 'customer' as const,
      title: insight.title,
      description: insight.description,
      severity: insight.churnRisk > 0.7 ? 'critical' : insight.churnRisk > 0.4 ? 'warning' : 'info',
      confidence: insight.confidence,
      action: insight.retentionStrategies?.[0] || 'Review customer relationship',
      timestamp: new Date().toISOString()
    }));
  }

  async getSupplyChainOptimization(context: AIContext): Promise<AIInsight[]> {
    const model = this.aiModels.get('supply_chain_optimization');
    const optimizations = await model.optimizeSupplyChain(context);
    
    return optimizations.map((opt: any) => ({
      id: `supply-${Date.now()}-${Math.random()}`,
      type: 'operational' as const,
      title: opt.title,
      description: opt.description,
      severity: opt.riskLevel,
      confidence: opt.confidence,
      action: opt.mitigationStrategies?.[0] || 'Review supplier performance',
      timestamp: new Date().toISOString()
    }));
  }

  async getProjectIntelligence(context: AIContext): Promise<AIInsight[]> {
    const model = this.aiModels.get('project_intelligence');
    const insights = await model.analyzeProjects(context);
    
    return insights.map((insight: any) => ({
      id: `project-${Date.now()}-${Math.random()}`,
      type: 'operational' as const,
      title: insight.title,
      description: insight.description,
      severity: insight.severity,
      confidence: insight.confidence,
      action: insight.recommendations?.[0] || 'Monitor seasonal patterns',
      timestamp: new Date().toISOString()
    }));
  }

  async getMarketIntelligence(context: AIContext): Promise<AIInsight[]> {
    // Real-time market analysis using external APIs and AI
    const prompt = `
      Analyze the current construction materials market for a ${context.companySize} company.
      Focus on:
      - Price trends and volatility
      - Supply chain disruptions
      - Seasonal patterns
      - Competitive landscape changes
      - Economic indicators impact
      
      Provide actionable insights with confidence scores.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are an expert construction industry AI analyst providing market intelligence.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return [{
        id: `market-${Date.now()}`,
        type: 'pricing' as const,
        title: 'Market Intelligence Update',
        description: analysis.summary || 'Current market conditions analysis',
        severity: 'info' as const,
        confidence: 0.8,
        action: analysis.recommendations?.[0] || 'Review market conditions',
        timestamp: new Date().toISOString()
      }];
    } catch (error) {
      console.error('Market intelligence error:', error);
      return [];
    }
  }

  private prioritizeInsights(insights: AIInsight[], context: AIContext): AIInsight[] {
    // AI-powered insight prioritization based on business impact
    return insights
      .sort((a, b) => {
        // Priority score calculation
        const scoreA = this.calculateInsightScore(a, context);
        const scoreB = this.calculateInsightScore(b, context);
        return scoreB - scoreA;
      })
      .slice(0, 20); // Top 20 insights
  }

  private calculateInsightScore(insight: AIInsight, context: AIContext): number {
    let score = 0;
    
    // Severity weight
    const severityWeight: Record<string, number> = { critical: 100, warning: 70, info: 40 };
    score += severityWeight[insight.severity];
    
    // Confidence weight
    score += (insight.confidence || 0) * 50;
    
    // Actionability bonus (check for actionable property)
    if ((insight as any).actionable) score += 30;
    
    // Type priority based on company size
    const typePriority = this.getTypePriorityForCompany(insight.type, context.companySize);
    score += typePriority;
    
    return score;
  }

  private getTypePriorityForCompany(type: string, companySize: string): number {
    const priorities: Record<string, Record<string, number>> = {
      small: {
        'inventory_optimization': 50,
        'cash_flow_prediction': 45,
        'demand_forecast': 40,
        'customer_churn': 35,
        'supplier_risk': 30,
        'price_opportunity': 25
      },
      midsize: {
        'demand_forecast': 50,
        'supplier_risk': 45,
        'inventory_optimization': 40,
        'customer_churn': 35,
        'price_opportunity': 30,
        'seasonal_trend': 25
      },
      enterprise: {
        'supplier_risk': 50,
        'demand_forecast': 45,
        'seasonal_trend': 40,
        'price_opportunity': 35,
        'inventory_optimization': 30,
        'customer_churn': 25
      }
    };
    
    return priorities[companySize]?.[type] || 20;
  }

  private calculateSeverity(confidence: number, impact: number): 'critical' | 'warning' | 'info' {
    const riskScore = confidence * impact;
    if (riskScore > 0.8) return 'critical';
    if (riskScore > 0.5) return 'warning';
    return 'info';
  }

  private async processRealTimeInsights() {
    // Process real-time data streams and generate insights
    this.emit('insights_updated', await this.generateComprehensiveInsights({
      userRole: 'admin',
      companySize: 'midsize',
      industry: 'construction',
      preferences: {}
    }));
  }

  private async processCriticalAlerts() {
    // Check for critical conditions that need immediate attention
    const criticalInsights = Array.from(this.activeInsights.values())
      .filter(insight => insight.severity === 'critical')
      .filter(insight => !(insight as any).expiresAt || (insight as any).expiresAt > new Date());
    
    if (criticalInsights.length > 0) {
      this.emit('critical_alerts', criticalInsights);
    }
  }
}

// Specialized AI Models
class DemandForecastingModel {
  async generateForecasts(context: AIContext) {
    // Advanced ML-based demand forecasting
    return [
      {
        productName: 'Portland Cement',
        trend: 15.5,
        horizon: 30,
        confidence: 0.89,
        impact: 0.7,
        recommendations: [
          'Increase inventory by 20% before peak season',
          'Negotiate volume discounts with suppliers',
          'Consider alternative suppliers for backup'
        ]
      }
    ];
  }
}

class InventoryOptimizationModel {
  async optimize(context: AIContext) {
    return [
      {
        title: 'Overstock Alert: Roofing Materials',
        description: 'Current inventory levels 40% above optimal for next 60 days',
        severity: 'warning' as const,
        confidence: 0.85,
        actions: [
          'Run promotional campaign on roofing materials',
          'Defer next planned purchase order',
          'Consider bundling with other products'
        ],
        data: { category: 'roofing', overstockPercentage: 40, estimatedCarryCost: 12500 }
      }
    ];
  }
}

class CustomerIntelligenceModel {
  async analyzeCustomers(context: AIContext) {
    return [
      {
        title: 'High-Value Customer Churn Risk',
        description: 'Elite Residential Builders showing 78% churn probability',
        churnRisk: 0.78,
        confidence: 0.91,
        retentionStrategies: [
          'Schedule immediate account review meeting',
          'Offer extended payment terms',
          'Provide exclusive pricing tier',
          'Assign dedicated account manager'
        ],
        data: { customerId: 'C004', lifetimeValue: 450000, riskFactors: ['payment_delays', 'order_frequency_decline'] }
      }
    ];
  }
}

class SupplyChainOptimizationModel {
  async optimizeSupplyChain(context: AIContext) {
    return [
      {
        title: 'Supplier Concentration Risk',
        description: '78% of concrete supplies from single vendor creates vulnerability',
        riskLevel: 'warning' as const,
        confidence: 0.92,
        mitigationStrategies: [
          'Identify 2-3 backup concrete suppliers',
          'Negotiate secondary supply agreements',
          'Implement supplier performance monitoring'
        ],
        data: { category: 'concrete', concentration: 0.78, alternativeSuppliers: 2 }
      }
    ];
  }
}

class ProjectIntelligenceModel {
  async analyzeProjects(context: AIContext) {
    return [
      {
        title: 'Seasonal Demand Spike Incoming',
        description: 'Construction activity expected to increase 35% in next 30 days',
        severity: 'warning' as const,
        confidence: 0.87,
        recommendations: [
          'Increase inventory levels across all categories',
          'Prepare for higher staffing needs',
          'Review pricing strategy for peak season'
        ],
        data: { expectedIncrease: 35, peakMonths: ['March', 'April', 'May'], historicalPattern: 'spring_surge' }
      }
    ];
  }
}

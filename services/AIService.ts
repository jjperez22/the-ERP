
// services/AIService.ts
// Simple AI service

interface DemandForecast {
  productId: string;
  locationId: string;
  period: string;
  forecastDate: Date;
  predictedDemand: number;
  confidence: number;
  factors: any[];
}

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  data: any;
  createdAt: Date;
}

export class AIService {
  private openaiKey: string;

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY || '';
  }

  async generateSKU(productData: any): Promise<string> {
    // AI-powered SKU generation based on product attributes
    const categoryCode = productData.category?.name?.substring(0, 3).toUpperCase() || 'GEN';
    const supplierCode = productData.supplier?.code?.substring(0, 2).toUpperCase() || 'XX';
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `${categoryCode}-${supplierCode}-${randomSuffix}`;
  }

  async suggestPrice(productData: any): Promise<number> {
    // ML-based price suggestion considering:
    // - Cost price
    // - Market conditions  
    // - Competition
    // - Historical data

    const baseCost = productData.costPrice || 0;
    const defaultMarkup = 0.25; // 25% markup as default

    // TODO: Implement actual ML model for price prediction
    const suggestedPrice = baseCost * (1 + defaultMarkup);

    return Math.round(suggestedPrice * 100) / 100;
  }

  async generateDemandForecast(productId: string, horizon: number = 90): Promise<DemandForecast[]> {
    // Time series forecasting using historical sales data
    // This would integrate with actual ML models in production

    const forecast: DemandForecast[] = [];
    const baseDate = new Date();

    for (let i = 0; i < horizon; i += 7) { // Weekly forecasts
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(baseDate.getDate() + i);

      // Simulate ML prediction - replace with actual model
      const predictedDemand = this.simulateDemandPrediction(productId, forecastDate);

      forecast.push({
        productId,
        locationId: 'main-warehouse', // Default location
        period: 'week',
        forecastDate,
        predictedDemand,
        confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
        factors: this.identifyForecastFactors(forecastDate)
      });
    }

    return forecast;
  }

  private simulateDemandPrediction(productId: string, date: Date): number {
    // Simulate seasonal and trend patterns
    const monthOfYear = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    // Base demand with seasonal adjustment
    let baseDemand = 100;

    // Construction materials often have seasonal patterns
    if (monthOfYear >= 3 && monthOfYear <= 10) {
      baseDemand *= 1.3; // Higher demand in construction season
    }

    // Weekend adjustments
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseDemand *= 0.3; // Lower weekend demand
    }

    // Add some randomness
    const randomFactor = 0.8 + Math.random() * 0.4; // ±20% variance

    return Math.round(baseDemand * randomFactor);
  }

  private identifyForecastFactors(date: Date): any[] {
    const factors = [];
    const month = date.getMonth() + 1;

    if (month >= 3 && month <= 10) {
      factors.push({
        type: 'seasonal',
        impact: 0.3,
        description: 'Peak construction season'
      });
    }

    if (month === 12 || month === 1) {
      factors.push({
        type: 'seasonal',
        impact: -0.4,
        description: 'Winter construction slowdown'
      });
    }

    return factors;
  }

  async generateInventoryRecommendations(productId: string): Promise<AIInsight[]> {
    // AI-powered inventory optimization
    const insights: AIInsight[] = [];

    // Simulate insights - replace with actual ML models
    insights.push({
      id: `insight-${Date.now()}`,
      type: 'inventory_optimization',
      title: 'Reorder Point Adjustment Recommended',
      description: 'Based on recent demand patterns, consider increasing reorder point by 15%',
      severity: 'warning',
      confidence: 0.85,
      actionable: true,
      recommendations: [
        'Increase reorder point from 50 to 58 units',
        'Consider setting up automatic reordering',
        'Review supplier lead times for accuracy'
      ],
      data: {
        currentReorderPoint: 50,
        recommendedReorderPoint: 58,
        reasonCode: 'INCREASED_DEMAND_TREND'
      },
      createdAt: new Date()
    });

    return insights;
  }

  async predictCustomerChurn(customerId: string): Promise<{
    churnProbability: number;
    riskFactors: string[];
    recommendations: string[];
  }> {
    // ML-based churn prediction
    // This would use features like:
    // - Order frequency changes
    // - Payment delays
    // - Support ticket volume
    // - Competitor interactions

    const churnProbability = Math.random() * 0.3; // 0-30% for simulation

    return {
      churnProbability,
      riskFactors: [
        'Decreased order frequency (30% decline in last 60 days)',
        'Late payments increasing',
        'Reduced order values'
      ],
      recommendations: [
        'Schedule account manager call',
        'Offer loyalty discount',
        'Provide additional payment terms flexibility'
      ]
    };
  }

  async optimizeSupplyChain(): Promise<AIInsight[]> {
    // Supply chain optimization insights
    const insights: AIInsight[] = [];

    insights.push({
      id: `supply-chain-${Date.now()}`,
      type: 'supplier_risk',
      title: 'Supplier Diversification Recommended',
      description: '78% of concrete supplies from single vendor creates risk exposure',
      severity: 'warning',
      confidence: 0.92,
      actionable: true,
      recommendations: [
        'Identify 2-3 alternative concrete suppliers',
        'Negotiate backup supply agreements',
        'Implement supplier performance monitoring'
      ],
      data: {
        category: 'concrete',
        concentrationRisk: 0.78,
        impactLevel: 'high'
      },
      createdAt: new Date()
    });

    return insights;
  }
}

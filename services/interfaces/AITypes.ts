// services/interfaces/AITypes.ts
// TypeScript interfaces for advanced AI features

export interface WeatherData {
  location: string;
  temperature: {
    current: number;
    forecast: Array<{
      date: string;
      high: number;
      low: number;
    }>;
  };
  precipitation: {
    current: number;
    forecast: Array<{
      date: string;
      probability: number;
      amount: number;
    }>;
  };
  seasonality: {
    season: 'spring' | 'summer' | 'fall' | 'winter';
    constructionSeasonActive: boolean;
  };
}

export interface EconomicData {
  indicators: {
    constructionIndex: number;
    materialCostIndex: number;
    laborCostIndex: number;
    interestRates: number;
    inflationRate: number;
  };
  marketTrends: {
    housingStarts: number;
    commercialProjects: number;
    infrastructureSpending: number;
  };
  regionalFactors: {
    region: string;
    economicGrowth: number;
    unemploymentRate: number;
    populationGrowth: number;
  };
}

export interface SeasonalForecast {
  productCategory: string;
  timeHorizon: {
    startDate: Date;
    endDate: Date;
    periods: number;
  };
  demandPredictions: Array<{
    period: string;
    date: Date;
    predictedDemand: number;
    confidence: number;
    adjustmentFactors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  }>;
  seasonalPatterns: {
    peakSeason: {
      months: string[];
      demandMultiplier: number;
    };
    lowSeason: {
      months: string[];
      demandMultiplier: number;
    };
  };
  recommendations: Array<{
    type: 'inventory' | 'pricing' | 'procurement' | 'marketing';
    action: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: string;
  }>;
}

export interface MarketConditions {
  competitorAnalysis: {
    averagePricing: number;
    priceRange: {
      min: number;
      max: number;
    };
    marketShare: number;
    competitorCount: number;
  };
  supplyChainStatus: {
    materialAvailability: 'high' | 'medium' | 'low';
    shippingCosts: number;
    leadTimes: number;
    supplierReliability: number;
  };
  demandSignals: {
    currentDemand: number;
    trendDirection: 'increasing' | 'stable' | 'decreasing';
    volatility: number;
  };
}

export interface SupplierRiskAssessment {
  supplierId: string;
  supplierName: string;
  riskScore: number; // 0-100, higher is riskier
  riskFactors: Array<{
    category: 'financial' | 'operational' | 'geographical' | 'quality' | 'compliance';
    factor: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: number;
    description: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'immediate' | 'short-term' | 'long-term';
    cost: number;
    benefit: string;
  }>;
  alternatives: Array<{
    supplierId: string;
    name: string;
    riskScore: number;
    estimatedSwitchingCost: number;
  }>;
}

export interface DynamicPricingAnalysis {
  productId: string;
  currentPrice: number;
  recommendedPrice: number;
  priceElasticity: number;
  competitivePressure: number;
  demandSensitivity: number;
  pricingStrategy: {
    type: 'premium' | 'competitive' | 'penetration' | 'skimming';
    reasoning: string;
    expectedOutcome: string;
  };
  scenarios: Array<{
    pricePoint: number;
    expectedDemand: number;
    projectedRevenue: number;
    marketResponse: string;
  }>;
}

export interface AdvancedAIInsight {
  id: string;
  type: 'seasonal_forecast' | 'pricing_optimization' | 'supplier_risk' | 'market_intelligence' | 'demand_prediction';
  category: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'opportunity';
  confidence: number;
  businessImpact: {
    financial: number;
    operational: string;
    strategic: string;
  };
  recommendations: Array<{
    action: string;
    timeline: string;
    resources: string[];
    expectedROI: number;
  }>;
  data: any;
  metadata: {
    generatedAt: Date;
    validUntil: Date;
    dataSourcesUsed: string[];
    aiModelVersion: string;
  };
}

export interface AIModelConfig {
  openAIModel: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

export interface ForecastingParameters {
  timeHorizon: number; // days
  granularity: 'daily' | 'weekly' | 'monthly';
  includeSeasonality: boolean;
  includeWeatherData: boolean;
  includeEconomicIndicators: boolean;
  confidenceLevel: number; // 0.8, 0.9, 0.95
}

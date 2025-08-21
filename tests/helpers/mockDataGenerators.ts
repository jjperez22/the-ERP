// tests/helpers/mockDataGenerators.ts
// Mock data generators for testing AdvancedAI service

import {
  WeatherData,
  EconomicData,
  MarketConditions,
  ForecastingParameters,
  AIModelConfig
} from '../../services/interfaces/AITypes';

/**
 * Generate mock weather data for testing
 */
export const createMockWeatherData = (overrides: Partial<WeatherData> = {}): WeatherData => {
  const baseDate = new Date('2024-03-01');
  
  return {
    location: 'New York, NY',
    temperature: {
      current: 15, // 59°F
      forecast: [
        { date: '2024-03-01', high: 18, low: 8 },
        { date: '2024-03-02', high: 20, low: 10 },
        { date: '2024-03-03', high: 16, low: 6 },
        { date: '2024-03-04', high: 22, low: 12 },
        { date: '2024-03-05', high: 19, low: 9 }
      ]
    },
    precipitation: {
      current: 2.5,
      forecast: [
        { date: '2024-03-01', probability: 0.3, amount: 1.2 },
        { date: '2024-03-02', probability: 0.1, amount: 0.0 },
        { date: '2024-03-03', probability: 0.6, amount: 3.5 },
        { date: '2024-03-04', probability: 0.2, amount: 0.5 },
        { date: '2024-03-05', probability: 0.0, amount: 0.0 }
      ]
    },
    seasonality: {
      season: 'spring',
      constructionSeasonActive: true
    },
    ...overrides
  };
};

/**
 * Generate mock economic data for testing
 */
export const createMockEconomicData = (overrides: Partial<EconomicData> = {}): EconomicData => {
  return {
    indicators: {
      constructionIndex: 108.5,
      materialCostIndex: 125.2,
      laborCostIndex: 115.8,
      interestRates: 4.25,
      inflationRate: 3.2
    },
    marketTrends: {
      housingStarts: 1450000,
      commercialProjects: 85000,
      infrastructureSpending: 125000000000
    },
    regionalFactors: {
      region: 'Northeast',
      economicGrowth: 2.8,
      unemploymentRate: 4.1,
      populationGrowth: 0.7
    },
    ...overrides
  };
};

/**
 * Generate mock market conditions for testing
 */
export const createMockMarketConditions = (overrides: Partial<MarketConditions> = {}): MarketConditions => {
  return {
    competitorAnalysis: {
      averagePricing: 95.50,
      priceRange: {
        min: 85.00,
        max: 110.00
      },
      marketShare: 0.25,
      competitorCount: 4
    },
    supplyChainStatus: {
      materialAvailability: 'medium',
      shippingCosts: 15.75,
      leadTimes: 14,
      supplierReliability: 0.92
    },
    demandSignals: {
      currentDemand: 850,
      trendDirection: 'increasing',
      volatility: 0.15
    },
    ...overrides
  };
};

/**
 * Generate mock forecasting parameters for testing
 */
export const createMockForecastingParameters = (overrides: Partial<ForecastingParameters> = {}): ForecastingParameters => {
  return {
    timeHorizon: 90, // 3 months
    granularity: 'weekly',
    includeSeasonality: true,
    includeWeatherData: true,
    includeEconomicIndicators: true,
    confidenceLevel: 0.85,
    ...overrides
  };
};

/**
 * Generate mock AI model configuration for testing
 */
export const createMockAIModelConfig = (overrides: Partial<AIModelConfig> = {}): AIModelConfig => {
  return {
    openAIModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    apiKey: 'test-api-key-mock',
    timeout: 30000,
    retryAttempts: 3,
    ...overrides
  };
};

/**
 * Create winter weather data (construction off-season)
 */
export const createWinterWeatherData = (): WeatherData => {
  return createMockWeatherData({
    temperature: {
      current: -5, // 23°F
      forecast: [
        { date: '2024-01-15', high: -2, low: -8 },
        { date: '2024-01-16', high: -1, low: -10 },
        { date: '2024-01-17', high: 1, low: -7 }
      ]
    },
    precipitation: {
      current: 15.2, // Heavy snow
      forecast: [
        { date: '2024-01-15', probability: 0.8, amount: 12.5 },
        { date: '2024-01-16', probability: 0.9, amount: 20.0 },
        { date: '2024-01-17', probability: 0.4, amount: 3.2 }
      ]
    },
    seasonality: {
      season: 'winter',
      constructionSeasonActive: false
    }
  });
};

/**
 * Create high-risk economic data
 */
export const createHighRiskEconomicData = (): EconomicData => {
  return createMockEconomicData({
    indicators: {
      constructionIndex: 82.3, // Below 90 = high risk
      materialCostIndex: 145.8, // High material costs
      laborCostIndex: 135.2, // High labor costs
      interestRates: 7.5, // High interest rates
      inflationRate: 6.8 // High inflation
    },
    marketTrends: {
      housingStarts: 850000, // Low housing starts
      commercialProjects: 45000, // Reduced commercial activity
      infrastructureSpending: 85000000000 // Reduced infrastructure spending
    },
    regionalFactors: {
      region: 'Midwest',
      economicGrowth: -0.5, // Negative growth
      unemploymentRate: 7.2, // High unemployment
      populationGrowth: -0.2 // Population decline
    }
  });
};

/**
 * Create competitive market conditions (high pressure)
 */
export const createCompetitiveMarketConditions = (): MarketConditions => {
  return createMockMarketConditions({
    competitorAnalysis: {
      averagePricing: 78.25,
      priceRange: {
        min: 70.00,
        max: 85.00
      },
      marketShare: 0.08, // Low market share
      competitorCount: 12 // Many competitors
    },
    supplyChainStatus: {
      materialAvailability: 'high',
      shippingCosts: 8.50,
      leadTimes: 7,
      supplierReliability: 0.98
    },
    demandSignals: {
      currentDemand: 1250,
      trendDirection: 'decreasing',
      volatility: 0.25
    }
  });
};

/**
 * Create premium market conditions (low pressure, high demand)
 */
export const createPremiumMarketConditions = (): MarketConditions => {
  return createMockMarketConditions({
    competitorAnalysis: {
      averagePricing: 125.75,
      priceRange: {
        min: 115.00,
        max: 140.00
      },
      marketShare: 0.45, // High market share
      competitorCount: 2 // Few competitors
    },
    supplyChainStatus: {
      materialAvailability: 'low', // Supply scarcity
      shippingCosts: 25.00,
      leadTimes: 21,
      supplierReliability: 0.85
    },
    demandSignals: {
      currentDemand: 2100,
      trendDirection: 'increasing',
      volatility: 0.08
    }
  });
};

/**
 * Generate an array of mock product IDs for testing
 */
export const getMockProductIds = (): string[] => {
  return [
    'steel-rebar',
    'concrete-mix',
    'lumber-2x4',
    'roofing-shingles',
    'insulation-foam',
    'drywall-sheets',
    'electrical-wire',
    'plumbing-pipes'
  ];
};

/**
 * Generate an array of mock supplier IDs for testing
 */
export const getMockSupplierIds = (): string[] => {
  return [
    'supplier-001',
    'supplier-002',
    'supplier-003',
    'supplier-risk-high',
    'supplier-new-business',
    'supplier-financial-issues'
  ];
};

/**
 * Create test date ranges
 */
export const createTestDateRanges = () => {
  const now = new Date('2024-03-15T10:00:00Z');
  return {
    now,
    startOfYear: new Date('2024-01-01T00:00:00Z'),
    endOfYear: new Date('2024-12-31T23:59:59Z'),
    threeMonthsAgo: new Date('2023-12-15T10:00:00Z'),
    threeMonthsFromNow: new Date('2024-06-15T10:00:00Z'),
    oneYearFromNow: new Date('2025-03-15T10:00:00Z')
  };
};

/**
 * Generate random test data within reasonable ranges
 */
export const generateRandomTestData = () => {
  return {
    price: Math.random() * 500 + 50, // $50-$550
    demand: Math.floor(Math.random() * 2000 + 500), // 500-2500 units
    confidence: Math.random() * 0.4 + 0.6, // 60-100%
    riskScore: Math.random() * 100, // 0-100
    temperature: Math.random() * 40 - 10, // -10°C to 30°C
    precipitation: Math.random() * 20 // 0-20mm
  };
};

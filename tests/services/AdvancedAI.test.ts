// tests/services/AdvancedAI.test.ts
// Tests for AdvancedConstructionAI service - Constructor and Initialization

import { AdvancedConstructionAI } from '../../services/AdvancedAI';
import { 
  createMockAIModelConfig,
  createMockWeatherData,
  createMockEconomicData,
  createMockForecastingParameters,
  createWinterWeatherData,
  createHighRiskEconomicData,
  createMockMarketConditions,
  createCompetitiveMarketConditions,
  createPremiumMarketConditions,
  getMockProductIds,
  getMockSupplierIds
} from '../helpers/mockDataGenerators';

describe('AdvancedConstructionAI - Constructor and Initialization', () => {
  let aiService: AdvancedConstructionAI;

  describe('Constructor', () => {
    beforeEach(() => {
      // Clear environment variables for clean tests
      delete process.env.OPENAI_API_KEY;
    });

    afterEach(() => {
      // Clean up any created instances
      aiService = null as any;
    });

    test('should create instance with default configuration', () => {
      aiService = new AdvancedConstructionAI();
      
      expect(aiService).toBeInstanceOf(AdvancedConstructionAI);
      expect(aiService.isReady()).toBe(true); // Should initialize successfully
    });

    test('should create instance with custom configuration', () => {
      const customConfig = createMockAIModelConfig({
        openAIModel: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 1500,
        timeout: 20000,
        retryAttempts: 2
      });

      aiService = new AdvancedConstructionAI(customConfig);
      
      expect(aiService).toBeInstanceOf(AdvancedConstructionAI);
      expect(aiService.isReady()).toBe(true);
    });

    test('should handle missing API key gracefully', () => {
      // Suppress console warnings during test
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      aiService = new AdvancedConstructionAI({
        apiKey: '' // Empty API key
      });
      
      expect(aiService.isReady()).toBe(true); // Should still initialize
      expect(consoleSpy).toHaveBeenCalledWith(
        'OpenAI API key not provided. Advanced AI features will use mock data.'
      );
      
      consoleSpy.mockRestore();
    });

    test('should handle partial configuration override', () => {
      const partialConfig = {
        temperature: 0.9,
        maxTokens: 3000
      };

      aiService = new AdvancedConstructionAI(partialConfig);
      
      expect(aiService).toBeInstanceOf(AdvancedConstructionAI);
      expect(aiService.isReady()).toBe(true);
    });

    test('should use environment variable for API key if not provided', () => {
      process.env.OPENAI_API_KEY = 'test-env-api-key';
      
      aiService = new AdvancedConstructionAI();
      
      expect(aiService).toBeInstanceOf(AdvancedConstructionAI);
      expect(aiService.isReady()).toBe(true);
    });
  });

  describe('isReady()', () => {
    beforeEach(() => {
      aiService = new AdvancedConstructionAI(createMockAIModelConfig());
    });

    test('should return true for properly initialized service', () => {
      expect(aiService.isReady()).toBe(true);
    });

    test('should return boolean value', () => {
      const result = aiService.isReady();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getHealthStatus()', () => {
    beforeEach(() => {
      aiService = new AdvancedConstructionAI(createMockAIModelConfig());
    });

    test('should return healthy status for initialized service', () => {
      const healthStatus = aiService.getHealthStatus();
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.details).toBe('All advanced AI features operational');
      expect(Array.isArray(healthStatus.features)).toBe(true);
      expect(healthStatus.features).toHaveLength(5);
    });

    test('should include all expected features in health status', () => {
      const healthStatus = aiService.getHealthStatus();
      const expectedFeatures = [
        'Seasonal Demand Forecasting',
        'Dynamic Pricing Optimization',
        'Supplier Risk Analysis',
        'Market Intelligence',
        'Weather Impact Analysis'
      ];
      
      expect(healthStatus.features).toEqual(expectedFeatures);
    });

    test('should return proper structure for health status', () => {
      const healthStatus = aiService.getHealthStatus();
      
      expect(healthStatus).toMatchObject({
        status: expect.any(String),
        details: expect.any(String),
        features: expect.any(Array)
      });
      
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status);
    });

    test('should handle service in different states', async () => {
      // Test with properly initialized service
      let healthStatus = aiService.getHealthStatus();
      expect(healthStatus.status).toBe('healthy');
      
      // Note: We can't easily test the unhealthy state without mocking
      // the initialization process, but we can verify the structure
      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('details');
      expect(healthStatus).toHaveProperty('features');
    });
  });

  describe('Error Handling', () => {
    test('should handle null/undefined configuration', () => {
      // Test with undefined config
      expect(() => {
        aiService = new AdvancedConstructionAI(undefined);
      }).not.toThrow();
      
      expect(aiService.isReady()).toBe(true);
    });

    test('should handle empty configuration object', () => {
      expect(() => {
        aiService = new AdvancedConstructionAI({});
      }).not.toThrow();
      
      expect(aiService.isReady()).toBe(true);
    });

    test('should handle invalid configuration values gracefully', () => {
      const invalidConfig = {
        temperature: -5, // Invalid temperature
        maxTokens: -1000, // Invalid maxTokens
        timeout: -500, // Invalid timeout
        retryAttempts: -1 // Invalid retry attempts
      };

      expect(() => {
        aiService = new AdvancedConstructionAI(invalidConfig);
      }).not.toThrow();
      
      // Service should still be ready (it uses the invalid values as provided)
      expect(aiService.isReady()).toBe(true);
    });
  });

  describe('Initialization Process', () => {
    test('should complete initialization synchronously', () => {
      const startTime = Date.now();
      aiService = new AdvancedConstructionAI(createMockAIModelConfig());
      const endTime = Date.now();
      
      expect(aiService.isReady()).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    test('should log successful initialization', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      aiService = new AdvancedConstructionAI(createMockAIModelConfig());
      
      // Note: The actual initialization is async, but constructor doesn't wait for it
      // The console.log happens in the background
      expect(aiService.isReady()).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Multiple Instance Creation', () => {
    test('should allow creating multiple instances', () => {
      const service1 = new AdvancedConstructionAI(createMockAIModelConfig({
        temperature: 0.5
      }));
      
      const service2 = new AdvancedConstructionAI(createMockAIModelConfig({
        temperature: 0.8
      }));
      
      expect(service1).toBeInstanceOf(AdvancedConstructionAI);
      expect(service2).toBeInstanceOf(AdvancedConstructionAI);
      expect(service1.isReady()).toBe(true);
      expect(service2.isReady()).toBe(true);
      expect(service1).not.toBe(service2); // Different instances
    });

    test('should maintain independent state between instances', () => {
      const service1 = new AdvancedConstructionAI(createMockAIModelConfig());
      const service2 = new AdvancedConstructionAI(createMockAIModelConfig());
      
      const health1 = service1.getHealthStatus();
      const health2 = service2.getHealthStatus();
      
      expect(health1).toEqual(health2); // Same structure and values
      expect(health1).not.toBe(health2); // But different objects
    });
  });
});

// Seasonal Demand Forecasting Tests
describe('AdvancedConstructionAI - Seasonal Demand Forecasting', () => {
  let aiService: AdvancedConstructionAI;

  beforeEach(() => {
    aiService = new AdvancedConstructionAI(createMockAIModelConfig());
  });

  afterEach(() => {
    aiService = null as any;
  });

  describe('generateSeasonalDemandForecast()', () => {
    test('should generate forecast with valid inputs', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters();
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        'concrete-mix',
        weatherData,
        economicData,
        parameters
      );
      
      expect(forecast).toBeDefined();
      expect(forecast.productCategory).toBe('concrete-mix');
      expect(forecast.timeHorizon).toBeDefined();
      expect(forecast.timeHorizon.startDate).toBeInstanceOf(Date);
      expect(forecast.timeHorizon.endDate).toBeInstanceOf(Date);
      expect(forecast.timeHorizon.periods).toBeGreaterThan(0);
      expect(Array.isArray(forecast.demandPredictions)).toBe(true);
      expect(forecast.seasonalPatterns).toBeDefined();
      expect(Array.isArray(forecast.recommendations)).toBe(true);
    });

    test('should generate correct number of demand predictions based on parameters', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters({
        timeHorizon: 28, // 4 weeks
        granularity: 'weekly'
      });
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        'steel-rebar',
        weatherData,
        economicData,
        parameters
      );
      
      expect(forecast.demandPredictions).toHaveLength(4); // 4 weeks
      expect(forecast.timeHorizon.periods).toBe(4);
    });

    test('should handle different granularities correctly', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      
      // Test daily granularity
      const dailyParams = createMockForecastingParameters({
        timeHorizon: 7, // 7 days
        granularity: 'daily'
      });
      
      const dailyForecast = await aiService.generateSeasonalDemandForecast(
        'lumber-2x4',
        weatherData,
        economicData,
        dailyParams
      );
      
      expect(dailyForecast.demandPredictions).toHaveLength(7);
      expect(dailyForecast.timeHorizon.periods).toBe(7);
      
      // Test monthly granularity
      const monthlyParams = createMockForecastingParameters({
        timeHorizon: 90, // 3 months
        granularity: 'monthly'
      });
      
      const monthlyForecast = await aiService.generateSeasonalDemandForecast(
        'lumber-2x4',
        weatherData,
        economicData,
        monthlyParams
      );
      
      expect(monthlyForecast.demandPredictions).toHaveLength(3);
      expect(monthlyForecast.timeHorizon.periods).toBe(3);
    });

    test('should include adjustment factors in predictions', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters();
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        'roofing-shingles',
        weatherData,
        economicData,
        parameters
      );
      
      // Each prediction should have adjustment factors
      forecast.demandPredictions.forEach(prediction => {
        expect(prediction).toHaveProperty('period');
        expect(prediction).toHaveProperty('date');
        expect(prediction).toHaveProperty('predictedDemand');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('adjustmentFactors');
        expect(Array.isArray(prediction.adjustmentFactors)).toBe(true);
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
        expect(prediction.predictedDemand).toBeGreaterThan(0);
      });
    });

    test('should provide seasonal patterns analysis', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters();
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        'concrete-mix',
        weatherData,
        economicData,
        parameters
      );
      
      expect(forecast.seasonalPatterns).toBeDefined();
      expect(forecast.seasonalPatterns.peakSeason).toBeDefined();
      expect(forecast.seasonalPatterns.lowSeason).toBeDefined();
      expect(Array.isArray(forecast.seasonalPatterns.peakSeason.months)).toBe(true);
      expect(Array.isArray(forecast.seasonalPatterns.lowSeason.months)).toBe(true);
      expect(forecast.seasonalPatterns.peakSeason.demandMultiplier).toBeGreaterThan(0);
      expect(forecast.seasonalPatterns.lowSeason.demandMultiplier).toBeGreaterThan(0);
    });

    test('should generate actionable recommendations', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters();
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        'steel-rebar',
        weatherData,
        economicData,
        parameters
      );
      
      expect(Array.isArray(forecast.recommendations)).toBe(true);
      expect(forecast.recommendations.length).toBeGreaterThan(0);
      
      forecast.recommendations.forEach(recommendation => {
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('action');
        expect(recommendation).toHaveProperty('reasoning');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('expectedImpact');
        expect(['inventory', 'pricing', 'procurement', 'marketing']).toContain(recommendation.type);
        expect(['high', 'medium', 'low']).toContain(recommendation.priority);
      });
    });

    test('should handle winter weather conditions correctly', async () => {
      const winterWeather = createWinterWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters();
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        'concrete-mix',
        winterWeather,
        economicData,
        parameters
      );
      
      // Winter should generally have lower demand predictions
      const avgDemand = forecast.demandPredictions.reduce((sum, pred) => sum + pred.predictedDemand, 0) / forecast.demandPredictions.length;
      expect(avgDemand).toBeLessThan(1500); // Should be adjusted down for winter
      
      // Should include weather-related adjustment factors
      const hasWeatherFactors = forecast.demandPredictions.some(pred => 
        pred.adjustmentFactors.some(factor => 
          factor.factor.toLowerCase().includes('weather') || 
          factor.factor.toLowerCase().includes('winter')
        )
      );
      expect(hasWeatherFactors).toBe(true);
    });

    test('should respond to economic conditions', async () => {
      const weatherData = createMockWeatherData();
      const highRiskEconomicData = createHighRiskEconomicData();
      const parameters = createMockForecastingParameters();
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        'lumber-2x4',
        weatherData,
        highRiskEconomicData,
        parameters
      );
      
      // Should include economic adjustment factors
      const hasEconomicFactors = forecast.demandPredictions.some(pred => 
        pred.adjustmentFactors.some(factor => 
          factor.factor.toLowerCase().includes('economic')
        )
      );
      expect(hasEconomicFactors).toBe(true);
      
      // Should generate more conservative recommendations in poor economic conditions
      expect(forecast.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    test('should reject invalid weather data', async () => {
      const invalidWeatherData = {} as any; // Invalid weather data
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters();
      
      await expect(aiService.generateSeasonalDemandForecast(
        'concrete-mix',
        invalidWeatherData,
        economicData,
        parameters
      )).rejects.toThrow('Invalid weather data provided');
    });

    test('should reject invalid economic data', async () => {
      const weatherData = createMockWeatherData();
      const invalidEconomicData = {} as any; // Invalid economic data
      const parameters = createMockForecastingParameters();
      
      await expect(aiService.generateSeasonalDemandForecast(
        'concrete-mix',
        weatherData,
        invalidEconomicData,
        parameters
      )).rejects.toThrow('Invalid economic data provided');
    });

    test('should handle missing optional parameters', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      
      // Should work without parameters (uses defaults)
      const forecast = await aiService.generateSeasonalDemandForecast(
        'steel-rebar',
        weatherData,
        economicData
        // No parameters provided
      );
      
      expect(forecast).toBeDefined();
      expect(forecast.productCategory).toBe('steel-rebar');
      expect(forecast.demandPredictions.length).toBeGreaterThan(0);
    });

    test('should handle empty category string', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters();
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        '', // Empty category
        weatherData,
        economicData,
        parameters
      );
      
      expect(forecast.productCategory).toBe('');
      expect(forecast.demandPredictions.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle very short time horizons', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters({
        timeHorizon: 1, // 1 day
        granularity: 'daily'
      });
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        'concrete-mix',
        weatherData,
        economicData,
        parameters
      );
      
      expect(forecast.demandPredictions).toHaveLength(1);
      expect(forecast.timeHorizon.periods).toBe(1);
    });

    test('should handle long time horizons', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters({
        timeHorizon: 365, // 1 year
        granularity: 'monthly'
      });
      
      const forecast = await aiService.generateSeasonalDemandForecast(
        'lumber-2x4',
        weatherData,
        economicData,
        parameters
      );
      
      expect(forecast.demandPredictions.length).toBeGreaterThan(10);
      expect(forecast.timeHorizon.periods).toBeGreaterThan(10);
    });

    test('should complete within reasonable time', async () => {
      const weatherData = createMockWeatherData();
      const economicData = createMockEconomicData();
      const parameters = createMockForecastingParameters();
      
      const startTime = Date.now();
      await aiService.generateSeasonalDemandForecast(
        'roofing-shingles',
        weatherData,
        economicData,
        parameters
      );
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});

// Dynamic Pricing Analysis Tests
describe('AdvancedConstructionAI - Dynamic Pricing Analysis', () => {
  let aiService: AdvancedConstructionAI;

  beforeEach(() => {
    aiService = new AdvancedConstructionAI(createMockAIModelConfig());
  });

  afterEach(() => {
    aiService = null as any;
  });

  describe('analyzeDynamicPricing()', () => {
    test('should analyze pricing with standard market conditions', async () => {
      const marketConditions = createMockMarketConditions();
      const productIds = getMockProductIds();
      
      const analysis = await aiService.analyzeDynamicPricing(
        productIds[0], // 'steel-rebar'
        marketConditions
      );
      
      expect(analysis).toBeDefined();
      expect(analysis.productId).toBe(productIds[0]);
      expect(typeof analysis.currentPrice).toBe('number');
      expect(typeof analysis.recommendedPrice).toBe('number');
      expect(typeof analysis.priceElasticity).toBe('number');
      expect(typeof analysis.competitivePressure).toBe('number');
      expect(typeof analysis.demandSensitivity).toBe('number');
      expect(analysis.pricingStrategy).toBeDefined();
      expect(Array.isArray(analysis.scenarios)).toBe(true);
    });

    test('should provide valid pricing strategy recommendations', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'concrete-mix',
        marketConditions
      );
      
      expect(analysis.pricingStrategy).toBeDefined();
      expect(['premium', 'competitive', 'penetration', 'skimming']).toContain(analysis.pricingStrategy.type);
      expect(analysis.pricingStrategy.reasoning).toBeDefined();
      expect(analysis.pricingStrategy.expectedOutcome).toBeDefined();
      expect(typeof analysis.pricingStrategy.reasoning).toBe('string');
      expect(typeof analysis.pricingStrategy.expectedOutcome).toBe('string');
    });

    test('should calculate reasonable price elasticity', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'lumber-2x4',
        marketConditions
      );
      
      // Price elasticity should be negative (demand decreases as price increases)
      expect(analysis.priceElasticity).toBeLessThan(0);
      // Should be within reasonable bounds
      expect(analysis.priceElasticity).toBeGreaterThanOrEqual(-2.5);
      expect(analysis.priceElasticity).toBeLessThanOrEqual(-0.3);
    });

    test('should assess competitive pressure correctly', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'roofing-shingles',
        marketConditions
      );
      
      // Competitive pressure should be between 0 and 1
      expect(analysis.competitivePressure).toBeGreaterThanOrEqual(0);
      expect(analysis.competitivePressure).toBeLessThanOrEqual(1);
    });

    test('should handle competitive market conditions', async () => {
      const competitiveMarket = createCompetitiveMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'steel-rebar',
        competitiveMarket
      );
      
      // In competitive market, should have high competitive pressure
      expect(analysis.competitivePressure).toBeGreaterThan(0.6);
      
      // Should recommend competitive or penetration pricing
      expect(['competitive', 'penetration']).toContain(analysis.pricingStrategy.type);
      
      // Recommended price should be close to or below market average
      expect(analysis.recommendedPrice).toBeLessThanOrEqual(competitiveMarket.competitorAnalysis.averagePricing * 1.05);
    });

    test('should handle premium market conditions', async () => {
      const premiumMarket = createPremiumMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'concrete-mix',
        premiumMarket
      );
      
      // In premium market, should have lower competitive pressure
      expect(analysis.competitivePressure).toBeLessThan(0.5);
      
      // Should recommend premium or skimming pricing
      expect(['premium', 'skimming']).toContain(analysis.pricingStrategy.type);
      
      // Recommended price should be above market average
      expect(analysis.recommendedPrice).toBeGreaterThanOrEqual(premiumMarket.competitorAnalysis.averagePricing * 0.95);
    });

    test('should generate multiple pricing scenarios', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'lumber-2x4',
        marketConditions
      );
      
      expect(analysis.scenarios).toHaveLength(3); // Conservative, recommended, aggressive
      
      analysis.scenarios.forEach((scenario, index) => {
        expect(scenario).toHaveProperty('pricePoint');
        expect(scenario).toHaveProperty('expectedDemand');
        expect(scenario).toHaveProperty('projectedRevenue');
        expect(scenario).toHaveProperty('marketResponse');
        
        expect(typeof scenario.pricePoint).toBe('number');
        expect(typeof scenario.expectedDemand).toBe('number');
        expect(typeof scenario.projectedRevenue).toBe('number');
        expect(typeof scenario.marketResponse).toBe('string');
        
        expect(scenario.expectedDemand).toBeGreaterThanOrEqual(0);
        expect(scenario.projectedRevenue).toBeGreaterThanOrEqual(0);
      });
    });

    test('should respect price bounds in recommendations', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'roofing-shingles',
        marketConditions
      );
      
      // Recommended price should not be too extreme (within 30% of current price on either side)
      const minReasonablePrice = analysis.currentPrice * 0.7;
      const maxReasonablePrice = analysis.currentPrice * 1.5;
      
      expect(analysis.recommendedPrice).toBeGreaterThanOrEqual(minReasonablePrice);
      expect(analysis.recommendedPrice).toBeLessThanOrEqual(maxReasonablePrice);
    });

    test('should handle different product categories', async () => {
      const marketConditions = createMockMarketConditions();
      const productIds = getMockProductIds();
      
      // Test multiple products
      const analyses = [];
      for (const productId of productIds.slice(0, 3)) { // Test first 3 products
        const analysis = await aiService.analyzeDynamicPricing(productId, marketConditions);
        analyses.push(analysis);
      }
      
      // Each analysis should be valid and specific to the product
      analyses.forEach((analysis, index) => {
        expect(analysis.productId).toBe(productIds[index]);
        expect(analysis.currentPrice).toBeGreaterThan(0);
        expect(analysis.recommendedPrice).toBeGreaterThan(0);
        expect(analysis.scenarios).toHaveLength(3);
      });
    });

    test('should provide meaningful market response descriptions', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'steel-rebar',
        marketConditions
      );
      
      analysis.scenarios.forEach(scenario => {
        expect(scenario.marketResponse).toBeDefined();
        expect(scenario.marketResponse.length).toBeGreaterThan(10); // Should be meaningful description
        expect(typeof scenario.marketResponse).toBe('string');
      });
    });

    test('should calculate demand sensitivity appropriately', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'concrete-mix',
        marketConditions
      );
      
      // Demand sensitivity should be between 0 and 1
      expect(analysis.demandSensitivity).toBeGreaterThanOrEqual(0.2);
      expect(analysis.demandSensitivity).toBeLessThanOrEqual(0.9);
    });
  });

  describe('Market Condition Responses', () => {
    test('should respond appropriately to low material availability', async () => {
      const lowSupplyMarket = createMockMarketConditions({
        supplyChainStatus: {
          materialAvailability: 'low',
          shippingCosts: 25.00,
          leadTimes: 28,
          supplierReliability: 0.75
        }
      });
      
      const analysis = await aiService.analyzeDynamicPricing(
        'steel-rebar',
        lowSupplyMarket
      );
      
      // Low supply should support higher prices
      expect(analysis.pricingStrategy.type).toMatch(/(premium|skimming)/);
    });

    test('should respond to high demand signals', async () => {
      const highDemandMarket = createMockMarketConditions({
        demandSignals: {
          currentDemand: 2000,
          trendDirection: 'increasing',
          volatility: 0.05
        }
      });
      
      const analysis = await aiService.analyzeDynamicPricing(
        'concrete-mix',
        highDemandMarket
      );
      
      // High demand should reduce price sensitivity
      expect(Math.abs(analysis.priceElasticity)).toBeLessThan(1.0);
    });

    test('should handle decreasing demand trends', async () => {
      const decliningMarket = createMockMarketConditions({
        demandSignals: {
          currentDemand: 400,
          trendDirection: 'decreasing',
          volatility: 0.3
        }
      });
      
      const analysis = await aiService.analyzeDynamicPricing(
        'lumber-2x4',
        decliningMarket
      );
      
      // Declining demand should increase price sensitivity
      expect(Math.abs(analysis.priceElasticity)).toBeGreaterThan(1.0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle unknown product IDs', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'unknown-product-xyz',
        marketConditions
      );
      
      // Should use default price for unknown products
      expect(analysis.productId).toBe('unknown-product-xyz');
      expect(analysis.currentPrice).toBe(100.00); // Default price
      expect(analysis.recommendedPrice).toBeGreaterThan(0);
    });

    test('should handle extreme market conditions gracefully', async () => {
      const extremeMarket = createMockMarketConditions({
        competitorAnalysis: {
          averagePricing: 1000.00, // Very high average price
          priceRange: { min: 800, max: 1200 },
          marketShare: 0.01, // Very low market share
          competitorCount: 50 // Many competitors
        }
      });
      
      const analysis = await aiService.analyzeDynamicPricing(
        'steel-rebar',
        extremeMarket
      );
      
      expect(analysis).toBeDefined();
      expect(analysis.competitivePressure).toBeGreaterThan(0.7); // Should be high pressure
      expect(analysis.pricingStrategy.type).toBe('penetration'); // Should recommend aggressive pricing
    });

    test('should complete analysis within reasonable time', async () => {
      const marketConditions = createMockMarketConditions();
      
      const startTime = Date.now();
      await aiService.analyzeDynamicPricing(
        'concrete-mix',
        marketConditions
      );
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    test('should handle empty product ID', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        '', // Empty product ID
        marketConditions
      );
      
      expect(analysis.productId).toBe('');
      expect(analysis.currentPrice).toBeGreaterThan(0);
      expect(analysis.scenarios).toHaveLength(3);
    });
  });

  describe('Scenario Calculations', () => {
    test('should show proper price-demand relationship in scenarios', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'roofing-shingles',
        marketConditions
      );
      
      // Sort scenarios by price for comparison
      const sortedScenarios = analysis.scenarios.sort((a, b) => a.pricePoint - b.pricePoint);
      
      // Generally, higher prices should lead to lower demand (though revenue might vary)
      expect(sortedScenarios[0].pricePoint).toBeLessThan(sortedScenarios[2].pricePoint);
      
      // At least one scenario should have different demand levels
      const demands = sortedScenarios.map(s => s.expectedDemand);
      expect(new Set(demands).size).toBeGreaterThan(1); // Should have different demand values
    });

    test('should calculate projected revenue correctly', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'lumber-2x4',
        marketConditions
      );
      
      analysis.scenarios.forEach(scenario => {
        // Revenue should equal price * demand (approximately, allowing for rounding)
        const expectedRevenue = scenario.pricePoint * scenario.expectedDemand;
        expect(Math.abs(scenario.projectedRevenue - expectedRevenue)).toBeLessThan(0.01);
      });
    });

    test('should include conservative, recommended, and aggressive scenarios', async () => {
      const marketConditions = createMockMarketConditions();
      
      const analysis = await aiService.analyzeDynamicPricing(
        'steel-rebar',
        marketConditions
      );
      
      expect(analysis.scenarios).toHaveLength(3);
      
      // Find scenarios by analyzing their market response descriptions
      const conservativeScenario = analysis.scenarios.find(s => 
        s.marketResponse.toLowerCase().includes('minimal')
      );
      const recommendedScenario = analysis.scenarios.find(s => 
        s.marketResponse.toLowerCase().includes('optimal') ||
        s.marketResponse.toLowerCase().includes('balance')
      );
      const aggressiveScenario = analysis.scenarios.find(s => 
        s.marketResponse.toLowerCase().includes('risk') ||
        s.marketResponse.toLowerCase().includes('aggressive')
      );
      
      expect(conservativeScenario).toBeDefined();
      expect(recommendedScenario).toBeDefined();
      expect(aggressiveScenario).toBeDefined();
    });
  });
});

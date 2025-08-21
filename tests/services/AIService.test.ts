// tests/services/AIService.test.ts
// Tests for AIService class - Basic AI functionality

import { AIService } from '../../services/AIService';

describe('AIService - Basic AI Functionality', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  afterEach(() => {
    aiService = null as any;
  });

  describe('Constructor and Initialization', () => {
    test('should create AIService instance', () => {
      expect(aiService).toBeInstanceOf(AIService);
    });

    test('should handle missing OpenAI key', () => {
      // Clear environment variable
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      const service = new AIService();
      expect(service).toBeInstanceOf(AIService);
      
      // Restore original key
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    });
  });

  describe('generateSKU()', () => {
    test('should generate SKU with product data', async () => {
      const productData = {
        category: { name: 'Steel' },
        supplier: { code: 'AB' }
      };
      
      const sku = await aiService.generateSKU(productData);
      
      expect(sku).toBeDefined();
      expect(typeof sku).toBe('string');
      expect(sku).toMatch(/^STE-AB-\d{4}$/);
    });

    test('should generate SKU with default values for missing data', async () => {
      const productData = {};
      
      const sku = await aiService.generateSKU(productData);
      
      expect(sku).toBeDefined();
      expect(sku).toMatch(/^GEN-XX-\d{4}$/);
    });

    test('should handle partial product data', async () => {
      const productData = {
        category: { name: 'Concrete' }
        // Missing supplier
      };
      
      const sku = await aiService.generateSKU(productData);
      
      expect(sku).toMatch(/^CON-XX-\d{4}$/);
    });
  });

  describe('suggestPrice()', () => {
    test('should suggest price based on cost', async () => {
      const productData = {
        costPrice: 100
      };
      
      const price = await aiService.suggestPrice(productData);
      
      expect(price).toBeDefined();
      expect(typeof price).toBe('number');
      expect(price).toBe(125); // 100 * 1.25 = 125
    });

    test('should handle zero cost price', async () => {
      const productData = {
        costPrice: 0
      };
      
      const price = await aiService.suggestPrice(productData);
      
      expect(price).toBe(0);
    });

    test('should handle missing cost price', async () => {
      const productData = {};
      
      const price = await aiService.suggestPrice(productData);
      
      expect(price).toBe(0);
    });

    test('should round to 2 decimal places', async () => {
      const productData = {
        costPrice: 99.999
      };
      
      const price = await aiService.suggestPrice(productData);
      
      expect(price).toBe(125); // Rounded properly
    });
  });

  describe('generateDemandForecast()', () => {
    test('should generate forecast for default horizon', async () => {
      const productId = 'test-product-001';
      
      const forecast = await aiService.generateDemandForecast(productId);
      
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBeGreaterThan(0);
      
      // Should have weekly forecasts for 90 days (approximately 13 weeks)
      expect(forecast.length).toBe(13);
    });

    test('should generate forecast for custom horizon', async () => {
      const productId = 'test-product-002';
      const horizon = 21; // 3 weeks
      
      const forecast = await aiService.generateDemandForecast(productId, horizon);
      
      expect(forecast.length).toBe(3); // 21 days / 7 = 3 weeks
    });

    test('should include all required forecast properties', async () => {
      const productId = 'test-product-003';
      
      const forecast = await aiService.generateDemandForecast(productId);
      
      forecast.forEach(f => {
        expect(f).toHaveProperty('productId', productId);
        expect(f).toHaveProperty('locationId');
        expect(f).toHaveProperty('period');
        expect(f).toHaveProperty('forecastDate');
        expect(f).toHaveProperty('predictedDemand');
        expect(f).toHaveProperty('confidence');
        expect(f).toHaveProperty('factors');
        
        expect(f.forecastDate).toBeInstanceOf(Date);
        expect(typeof f.predictedDemand).toBe('number');
        expect(f.confidence).toBeGreaterThanOrEqual(0.75);
        expect(f.confidence).toBeLessThanOrEqual(0.95);
        expect(Array.isArray(f.factors)).toBe(true);
      });
    });
  });

  describe('generateInventoryRecommendations()', () => {
    test('should generate inventory insights', async () => {
      const productId = 'test-product-001';
      
      const insights = await aiService.generateInventoryRecommendations(productId);
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    test('should include required insight properties', async () => {
      const productId = 'test-product-002';
      
      const insights = await aiService.generateInventoryRecommendations(productId);
      
      insights.forEach(insight => {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('severity');
        expect(insight).toHaveProperty('confidence');
        expect(insight).toHaveProperty('actionable');
        expect(insight).toHaveProperty('recommendations');
        expect(insight).toHaveProperty('data');
        expect(insight).toHaveProperty('createdAt');
        
        expect(Array.isArray(insight.recommendations)).toBe(true);
        expect(insight.createdAt).toBeInstanceOf(Date);
      });
    });
  });
});

// tests/services/AIService.test.ts
import { AIService } from '../../services/AIService';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('generateSKU', () => {
    it('should generate SKU with proper format', async () => {
      const productData = {
        category: { name: 'Construction Materials' },
        supplier: { code: 'ABC' }
      };

      const sku = await aiService.generateSKU(productData);

      expect(sku).toMatch(/^CON-AB-\d{4}$/);
      expect(typeof sku).toBe('string');
    });

    it('should handle missing category gracefully', async () => {
      const productData = {
        supplier: { code: 'XYZ' }
      };

      const sku = await aiService.generateSKU(productData);

      expect(sku).toMatch(/^GEN-XY-\d{4}$/);
    });

    it('should handle missing supplier gracefully', async () => {
      const productData = {
        category: { name: 'Steel' }
      };

      const sku = await aiService.generateSKU(productData);

      expect(sku).toMatch(/^STE-XX-\d{4}$/);
    });
  });

  describe('suggestPrice', () => {
    it('should return price with appropriate markup', async () => {
      const productData = {
        costPrice: 100
      };

      const suggestedPrice = await aiService.suggestPrice(productData);

      expect(suggestedPrice).toBe(125); // 25% markup on $100
      expect(typeof suggestedPrice).toBe('number');
    });

    it('should handle zero cost price', async () => {
      const productData = {
        costPrice: 0
      };

      const suggestedPrice = await aiService.suggestPrice(productData);

      expect(suggestedPrice).toBe(0);
    });

    it('should handle missing cost price', async () => {
      const productData = {};

      const suggestedPrice = await aiService.suggestPrice(productData);

      expect(suggestedPrice).toBe(0);
    });

    it('should round to 2 decimal places', async () => {
      const productData = {
        costPrice: 33.33
      };

      const suggestedPrice = await aiService.suggestPrice(productData);

      expect(suggestedPrice).toBe(41.66);
    });
  });

  describe('generateDemandForecast', () => {
    it('should return forecast array with correct structure', async () => {
      const productId = 'lumber-001';
      const horizon = 90;

      const forecast = await aiService.generateDemandForecast(productId, horizon);

      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBeGreaterThan(0);
      
      const firstForecast = forecast[0];
      expect(firstForecast).toHaveProperty('productId', productId);
      expect(firstForecast).toHaveProperty('locationId');
      expect(firstForecast).toHaveProperty('period');
      expect(firstForecast).toHaveProperty('forecastDate');
      expect(firstForecast).toHaveProperty('predictedDemand');
      expect(firstForecast).toHaveProperty('confidence');
      expect(firstForecast).toHaveProperty('factors');
    });

    it('should return weekly forecasts by default', async () => {
      const forecast = await aiService.generateDemandForecast('test-product');

      // Default 90-day horizon should produce ~13 weekly forecasts
      expect(forecast.length).toBeGreaterThan(10);
      expect(forecast.length).toBeLessThan(15);

      forecast.forEach(f => {
        expect(f.period).toBe('week');
      });
    });

    it('should have confidence values between 75-95%', async () => {
      const forecast = await aiService.generateDemandForecast('test-product');

      forecast.forEach(f => {
        expect(f.confidence).toBeGreaterThanOrEqual(0.75);
        expect(f.confidence).toBeLessThanOrEqual(0.95);
      });
    });

    it('should have positive predicted demand', async () => {
      const forecast = await aiService.generateDemandForecast('test-product');

      forecast.forEach(f => {
        expect(f.predictedDemand).toBeGreaterThan(0);
        expect(typeof f.predictedDemand).toBe('number');
      });
    });

    it('should include seasonal adjustment factors', async () => {
      const forecast = await aiService.generateDemandForecast('test-product');

      forecast.forEach(f => {
        expect(Array.isArray(f.factors)).toBe(true);
        if (f.factors.length > 0) {
          const factor = f.factors[0];
          expect(factor).toHaveProperty('type');
          expect(factor).toHaveProperty('impact');
          expect(factor).toHaveProperty('description');
        }
      });
    });

    it('should handle custom time horizons', async () => {
      const shortForecast = await aiService.generateDemandForecast('test-product', 14);
      const longForecast = await aiService.generateDemandForecast('test-product', 180);

      expect(shortForecast.length).toBeLessThan(longForecast.length);
      expect(shortForecast.length).toBe(2); // 2 weeks
      expect(longForecast.length).toBeGreaterThan(20); // ~26 weeks
    });
  });

  describe('generateInventoryRecommendations', () => {
    it('should return array of insights', async () => {
      const insights = await aiService.generateInventoryRecommendations('all');

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should have proper insight structure', async () => {
      const insights = await aiService.generateInventoryRecommendations('test-product');

      const insight = insights[0];
      expect(insight).toHaveProperty('id');
      expect(insight).toHaveProperty('type');
      expect(insight).toHaveProperty('title');
      expect(insight).toHaveProperty('description');
      expect(insight).toHaveProperty('severity');
      expect(insight).toHaveProperty('confidence');
      expect(insight).toHaveProperty('actionable');
      expect(insight).toHaveProperty('recommendations');
      expect(insight).toHaveProperty('data');
      expect(insight).toHaveProperty('createdAt');
    });

    it('should have valid confidence scores', async () => {
      const insights = await aiService.generateInventoryRecommendations('test-product');

      insights.forEach(insight => {
        expect(insight.confidence).toBeGreaterThan(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should include actionable recommendations', async () => {
      const insights = await aiService.generateInventoryRecommendations('test-product');

      insights.forEach(insight => {
        expect(typeof insight.actionable).toBe('boolean');
        expect(Array.isArray(insight.recommendations)).toBe(true);
        if (insight.actionable) {
          expect(insight.recommendations.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('predictCustomerChurn', () => {
    it('should return churn prediction with proper structure', async () => {
      const customerId = 'customer-123';

      const prediction = await aiService.predictCustomerChurn(customerId);

      expect(prediction).toHaveProperty('churnProbability');
      expect(prediction).toHaveProperty('riskFactors');
      expect(prediction).toHaveProperty('recommendations');
    });

    it('should have valid churn probability', async () => {
      const prediction = await aiService.predictCustomerChurn('test-customer');

      expect(typeof prediction.churnProbability).toBe('number');
      expect(prediction.churnProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.churnProbability).toBeLessThanOrEqual(1);
    });

    it('should include risk factors and recommendations', async () => {
      const prediction = await aiService.predictCustomerChurn('test-customer');

      expect(Array.isArray(prediction.riskFactors)).toBe(true);
      expect(Array.isArray(prediction.recommendations)).toBe(true);
      expect(prediction.riskFactors.length).toBeGreaterThan(0);
      expect(prediction.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('optimizeSupplyChain', () => {
    it('should return supply chain insights', async () => {
      const insights = await aiService.optimizeSupplyChain();

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should have proper supply chain insight structure', async () => {
      const insights = await aiService.optimizeSupplyChain();

      const insight = insights[0];
      expect(insight).toHaveProperty('id');
      expect(insight).toHaveProperty('type');
      expect(insight).toHaveProperty('title');
      expect(insight).toHaveProperty('description');
      expect(insight).toHaveProperty('severity');
      expect(insight).toHaveProperty('confidence');
      expect(insight).toHaveProperty('actionable');
      expect(insight).toHaveProperty('recommendations');
      expect(insight).toHaveProperty('data');
      expect(insight.type).toBe('supplier_risk');
    });

    it('should provide actionable recommendations', async () => {
      const insights = await aiService.optimizeSupplyChain();

      insights.forEach(insight => {
        expect(insight.actionable).toBe(true);
        expect(insight.recommendations.length).toBeGreaterThan(0);
        expect(insight.confidence).toBeGreaterThan(0.8);
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid product data gracefully', async () => {
      const invalidData = null;

      await expect(aiService.suggestPrice(invalidData)).resolves.toBe(0);
      await expect(aiService.generateSKU(invalidData)).resolves.toMatch(/^GEN-XX-\d{4}$/);
    });

    it('should handle empty strings', async () => {
      await expect(aiService.generateDemandForecast('')).resolves.toHaveLength(expect.any(Number));
      await expect(aiService.generateInventoryRecommendations('')).resolves.toHaveLength(expect.any(Number));
    });

    it('should handle negative time horizons', async () => {
      const forecast = await aiService.generateDemandForecast('test', -30);
      
      // Should default to positive value or handle gracefully
      expect(Array.isArray(forecast)).toBe(true);
    });
  });
});

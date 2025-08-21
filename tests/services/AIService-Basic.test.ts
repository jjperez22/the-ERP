// tests/services/AIService-Basic.test.ts
// Simple tests for AIService class - Basic functionality

import { AIService } from '../../services/AIService';

describe('AIService - Basic Tests', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('Constructor', () => {
    test('should create AIService instance', () => {
      expect(aiService).toBeInstanceOf(AIService);
    });
  });

  describe('generateSKU()', () => {
    test('should generate SKU with valid format', async () => {
      const productData = {
        category: { name: 'Steel' },
        supplier: { code: 'AB' }
      };
      
      const sku = await aiService.generateSKU(productData);
      
      expect(sku).toMatch(/^STE-AB-\d{4}$/);
    });

    test('should handle missing data', async () => {
      const sku = await aiService.generateSKU({});
      
      expect(sku).toMatch(/^GEN-XX-\d{4}$/);
    });
  });

  describe('suggestPrice()', () => {
    test('should suggest price with markup', async () => {
      const productData = { costPrice: 100 };
      
      const price = await aiService.suggestPrice(productData);
      
      expect(price).toBe(125); // 25% markup
    });

    test('should handle zero cost', async () => {
      const price = await aiService.suggestPrice({ costPrice: 0 });
      
      expect(price).toBe(0);
    });
  });

  describe('generateDemandForecast()', () => {
    test('should generate forecast array', async () => {
      const forecast = await aiService.generateDemandForecast('test-product');
      
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBeGreaterThan(0);
    });

    test('should have correct forecast structure', async () => {
      const forecast = await aiService.generateDemandForecast('test-product');
      
      const first = forecast[0];
      expect(first).toHaveProperty('productId');
      expect(first).toHaveProperty('predictedDemand');
      expect(first).toHaveProperty('confidence');
      expect(first).toHaveProperty('factors');
    });
  });

  describe('generateInventoryRecommendations()', () => {
    test('should generate recommendations', async () => {
      const insights = await aiService.generateInventoryRecommendations('test-product');
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  describe('predictCustomerChurn()', () => {
    test('should predict churn', async () => {
      const prediction = await aiService.predictCustomerChurn('test-customer');
      
      expect(prediction).toHaveProperty('churnProbability');
      expect(prediction).toHaveProperty('riskFactors');
      expect(prediction).toHaveProperty('recommendations');
    });
  });

  describe('optimizeSupplyChain()', () => {
    test('should provide optimization insights', async () => {
      const insights = await aiService.optimizeSupplyChain();
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });
  });
});

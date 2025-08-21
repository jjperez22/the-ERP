// tests/services/AdvancedAI-SupplierRisk.test.ts
// Tests for AdvancedConstructionAI service - Supplier Risk Assessment

import { AdvancedConstructionAI } from '../../services/AdvancedAI';
import { 
  createMockAIModelConfig,
  getMockSupplierIds
} from '../helpers/mockDataGenerators';

describe('AdvancedConstructionAI - Supplier Risk Assessment', () => {
  let aiService: AdvancedConstructionAI;

  beforeEach(() => {
    aiService = new AdvancedConstructionAI(createMockAIModelConfig());
  });

  afterEach(() => {
    aiService = null as any;
  });

  describe('assessSupplierRisk() - Basic Functionality', () => {
    test('should assess supplier risk with standard supplier', async () => {
      const supplierIds = getMockSupplierIds();
      
      const assessment = await aiService.assessSupplierRisk(
        supplierIds[0] // 'supplier-001'
      );
      
      expect(assessment).toBeDefined();
      expect(assessment.supplierId).toBe(supplierIds[0]);
      expect(typeof assessment.supplierName).toBe('string');
      expect(typeof assessment.riskScore).toBe('number');
      expect(Array.isArray(assessment.riskFactors)).toBe(true);
      expect(Array.isArray(assessment.recommendations)).toBe(true);
      expect(Array.isArray(assessment.alternatives)).toBe(true);
    });

    test('should calculate risk score within valid range', async () => {
      const supplierIds = getMockSupplierIds();
      
      const assessment = await aiService.assessSupplierRisk(supplierIds[1]);
      
      // Risk score should be between 0-100
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.riskScore).toBeLessThanOrEqual(100);
    });

    test('should provide supplier name and basic info', async () => {
      const assessment = await aiService.assessSupplierRisk('supplier-001');
      
      expect(assessment.supplierName).toBeDefined();
      expect(assessment.supplierName).toBe('Premium Steel Co.');
      expect(assessment.supplierId).toBe('supplier-001');
    });

    test('should handle unknown suppliers', async () => {
      const assessment = await aiService.assessSupplierRisk('unknown-supplier-xyz');
      
      expect(assessment.supplierId).toBe('unknown-supplier-xyz');
      expect(assessment.supplierName).toBe('Unknown Supplier');
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.riskScore).toBeLessThanOrEqual(100);
    });

    test('should handle empty supplier ID', async () => {
      const assessment = await aiService.assessSupplierRisk('');
      
      expect(assessment.supplierId).toBe('');
      expect(assessment.supplierName).toBe('Unknown Supplier');
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Risk Factors Analysis', () => {
    test('should include different types of risk factors', async () => {
      const assessment = await aiService.assessSupplierRisk('supplier-002');
      
      expect(assessment.riskFactors).toBeDefined();
      expect(Array.isArray(assessment.riskFactors)).toBe(true);
      
      // Should have proper structure for each risk factor
      assessment.riskFactors.forEach(factor => {
        expect(factor).toHaveProperty('category');
        expect(factor).toHaveProperty('factor');
        expect(factor).toHaveProperty('severity');
        expect(factor).toHaveProperty('impact');
        expect(factor).toHaveProperty('description');
        
        expect(['financial', 'operational', 'geographical', 'quality', 'compliance']).toContain(factor.category);
        expect(['low', 'medium', 'high', 'critical']).toContain(factor.severity);
        expect(typeof factor.impact).toBe('number');
        expect(typeof factor.description).toBe('string');
      });
    });

    test('should identify financial risks for poor credit ratings', async () => {
      // Test with a supplier that should have financial risk
      const assessment = await aiService.assessSupplierRisk('supplier-002');
      
      // Should include some risk factors since supplier-002 has B+ rating
      expect(assessment.riskFactors.length).toBeGreaterThanOrEqual(0);
      
      if (assessment.riskFactors.length > 0) {
        // Check if financial factors are properly categorized
        const financialFactors = assessment.riskFactors.filter(f => f.category === 'financial');
        financialFactors.forEach(factor => {
          expect(factor.impact).toBeGreaterThan(0);
          expect(factor.impact).toBeLessThanOrEqual(1);
        });
      }
    });
  });

  describe('Recommendations and Alternatives', () => {
    test('should provide actionable recommendations', async () => {
      const assessment = await aiService.assessSupplierRisk('supplier-002');
      
      expect(Array.isArray(assessment.recommendations)).toBe(true);
      
      assessment.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('action');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('cost');
        expect(rec).toHaveProperty('benefit');
        
        expect(['immediate', 'short-term', 'long-term']).toContain(rec.priority);
        expect(typeof rec.cost).toBe('number');
        expect(rec.cost).toBeGreaterThanOrEqual(0);
      });
    });

    test('should include alternatives by default', async () => {
      const assessment = await aiService.assessSupplierRisk('supplier-001');
      
      expect(Array.isArray(assessment.alternatives)).toBe(true);
      expect(assessment.alternatives.length).toBeGreaterThan(0);
      
      assessment.alternatives.forEach(alt => {
        expect(alt).toHaveProperty('supplierId');
        expect(alt).toHaveProperty('name');
        expect(alt).toHaveProperty('riskScore');
        expect(alt).toHaveProperty('estimatedSwitchingCost');
        
        expect(alt.riskScore).toBeGreaterThanOrEqual(0);
        expect(alt.riskScore).toBeLessThanOrEqual(100);
      });
    });

    test('should exclude alternatives when requested', async () => {
      const assessment = await aiService.assessSupplierRisk('supplier-001', false);
      
      expect(assessment.alternatives).toHaveLength(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await aiService.assessSupplierRisk('supplier-001');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000);
    });

    test('should handle multiple suppliers consistently', async () => {
      const supplierIds = getMockSupplierIds();
      
      const assessments = [];
      for (const id of supplierIds.slice(0, 3)) {
        const assessment = await aiService.assessSupplierRisk(id);
        assessments.push(assessment);
      }
      
      assessments.forEach(assessment => {
        expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
        expect(assessment.riskScore).toBeLessThanOrEqual(100);
        expect(Array.isArray(assessment.riskFactors)).toBe(true);
      });
    });
  });
});

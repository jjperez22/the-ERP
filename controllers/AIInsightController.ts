// controllers/AIInsightController.ts
import { Controller, Get, Post, Put, Delete, Injectable, Body, Param, Query } from '@varld/warp';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';

interface AIInsight {
  id: string;
  type: 'demand_forecast' | 'inventory_optimization' | 'price_intelligence' | 'customer_churn' | 'supplier_risk' | 'seasonal_trend';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  data: any;
  createdAt: Date;
  expiresAt?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

interface InsightRequest {
  type: string;
  context: any;
  timeframe?: string;
  filters?: any;
}

@Injectable()
@Controller('/api/ai-insights')
export class AIInsightController {
  constructor(
    private databaseService: DatabaseService,
    private aiService: AIService,
    private notificationService: NotificationService
  ) {}

  @Get('/')
  async getAllInsights(@Query() query: any) {
    try {
      const {
        type,
        severity,
        acknowledged,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      let filters: any = {};
      
      if (type) filters.type = type;
      if (severity) filters.severity = severity;
      if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true';

      const skip = (page - 1) * limit;
      const insights = await this.databaseService.find<AIInsight>('ai_insights', filters, {
        skip,
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
      });

      const total = await this.databaseService.count('ai_insights', filters);

      return {
        success: true,
        data: insights,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/dashboard')
  async getDashboardInsights() {
    try {
      // Get recent critical and warning insights
      const criticalInsights = await this.databaseService.find<AIInsight>('ai_insights', {
        severity: 'critical',
        acknowledged: false
      }, { limit: 5, sort: { createdAt: -1 } });

      const warningInsights = await this.databaseService.find<AIInsight>('ai_insights', {
        severity: 'warning',
        acknowledged: false
      }, { limit: 10, sort: { createdAt: -1 } });

      // Get actionable insights
      const actionableInsights = await this.databaseService.find<AIInsight>('ai_insights', {
        actionable: true,
        acknowledged: false
      }, { limit: 15, sort: { confidence: -1 } });

      return {
        success: true,
        data: {
          critical: criticalInsights,
          warnings: warningInsights,
          actionable: actionableInsights,
          summary: {
            total_unacknowledged: await this.databaseService.count('ai_insights', { acknowledged: false }),
            critical_count: criticalInsights.length,
            warning_count: warningInsights.length,
            actionable_count: actionableInsights.length
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/generate')
  async generateInsights(@Body() request: InsightRequest) {
    try {
      const insights = await this.aiService.generateSpecificInsights(
        request.type,
        request.context,
        request.timeframe,
        request.filters
      );

      // Save generated insights
      const savedInsights = [];
      for (const insight of insights) {
        const saved = await this.databaseService.create('ai_insights', {
          ...insight,
          id: this.generateId(),
          createdAt: new Date(),
          acknowledged: false
        });
        savedInsights.push(saved);
      }

      return { success: true, data: savedInsights };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/:id/acknowledge')
  async acknowledgeInsight(@Param('id') id: string, @Body() acknowledgeData: {
    acknowledgedBy: string;
    notes?: string;
  }) {
    try {
      const insight = await this.databaseService.findById<AIInsight>('ai_insights', id);
      if (!insight) {
        return { success: false, error: 'Insight not found' };
      }

      const updated = await this.databaseService.update('ai_insights', id, {
        acknowledged: true,
        acknowledgedBy: acknowledgeData.acknowledgedBy,
        acknowledgedAt: new Date()
      });

      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/analytics')
  async getInsightAnalytics(@Query() query: any) {
    try {
      const { startDate, endDate } = query;
      
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter = {
          createdAt: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        };
      }

      const insights = await this.databaseService.find<AIInsight>('ai_insights', dateFilter);
      
      const analytics = {
        total_insights: insights.length,
        by_type: this.groupBy(insights, 'type'),
        by_severity: this.groupBy(insights, 'severity'),
        acknowledged_rate: insights.length > 0 ? 
          (insights.filter(i => i.acknowledged).length / insights.length) * 100 : 0,
        average_confidence: insights.length > 0 ?
          insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length : 0,
        actionable_insights: insights.filter(i => i.actionable).length
      };

      return { success: true, data: analytics };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private groupBy(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private generateId(): string {
    return 'insight_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// src/services/AutomationService.ts
import { Injectable } from '@varld/warp';
import { AIOrchestrator } from './AIOrchestrator';
import { RealTimeService } from './RealTimeService';
import { EventEmitter } from 'events';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
  executionCount: number;
  lastExecuted?: Date;
  createdAt: Date;
}

export interface WorkflowTrigger {
  type: 'inventory_low' | 'customer_order' | 'supplier_delay' | 'price_change' | 'ai_insight' | 'scheduled' | 'manual';
  config: any;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_empty';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'create_po' | 'send_email' | 'update_price' | 'create_alert' | 'schedule_task' | 'call_webhook' | 'ai_analysis';
  config: any;
  delay?: number; // milliseconds
}

export interface SmartProcurementRule {
  productId: string;
  supplierId: string;
  minQuantity: number;
  maxQuantity: number;
  targetStockLevel: number;
  seasonalAdjustment: boolean;
  priceThreshold: number;
  qualityRequirements: string[];
  deliveryTimeLimit: number;
}

@Injectable()
export class AutomationService extends EventEmitter {
  private workflows: Map<string, WorkflowRule> = new Map();
  private procurementRules: Map<string, SmartProcurementRule> = new Map();
  private executionQueue: Array<{ workflowId: string, context: any }> = [];
  private isProcessing: boolean = false;

  constructor(
    private aiOrchestrator: AIOrchestrator,
    private realTimeService: RealTimeService
  ) {
    super();
    this.initializeDefaultWorkflows();
    this.startAutomationEngine();
    this.setupEventHandlers();
  }

  private initializeDefaultWorkflows() {
    // Smart Inventory Reordering
    this.createWorkflow({
      id: 'smart-inventory-reorder',
      name: 'Smart Inventory Reordering',
      description: 'Automatically create purchase orders when inventory falls below optimal levels',
      trigger: {
        type: 'inventory_low',
        config: { checkInterval: 300000 } // Check every 5 minutes
      },
      conditions: [
        { field: 'quantityOnHand', operator: 'less_than', value: 'reorderPoint' },
        { field: 'supplier.isActive', operator: 'equals', value: true }
      ],
      actions: [
        {
          type: 'ai_analysis',
          config: { analysisType: 'optimal_order_quantity' }
        },
        {
          type: 'create_po',
          config: { 
            autoApprove: false,
            notifyPurchasing: true,
            includeAIRecommendations: true 
          }
        }
      ],
      isActive: true,
      priority: 8,
      executionCount: 0,
      createdAt: new Date()
    });

    // Dynamic Pricing Optimization
    this.createWorkflow({
      id: 'dynamic-pricing',
      name: 'AI-Powered Dynamic Pricing',
      description: 'Adjust prices based on market conditions, demand, and competition',
      trigger: {
        type: 'scheduled',
        config: { schedule: '0 9 * * *' } // Daily at 9 AM
      },
      conditions: [
        { field: 'category', operator: 'not_empty', value: null },
        { field: 'isActive', operator: 'equals', value: true }
      ],
      actions: [
        {
          type: 'ai_analysis',
          config: { analysisType: 'market_pricing_analysis' }
        },
        {
          type: 'update_price',
          config: { 
            requireApproval: true,
            maxIncrease: 0.1, // Max 10% increase
            maxDecrease: 0.05 // Max 5% decrease
          }
        }
      ],
      isActive: true,
      priority: 6,
      executionCount: 0,
      createdAt: new Date()
    });

    // Customer Churn Prevention
    this.createWorkflow({
      id: 'churn-prevention',
      name: 'Customer Churn Prevention',
      description: 'Proactively engage customers at risk of churning',
      trigger: {
        type: 'ai_insight',
        config: { insightType: 'customer_churn' }
      },
      conditions: [
        { field: 'churnRisk', operator: 'greater_than', value: 0.7 },
        { field: 'lifetimeValue', operator: 'greater_than', value: 10000 }
      ],
      actions: [
        {
          type: 'create_alert',
          config: {
            title: 'High-Value Customer Churn Risk',
            assignTo: 'account_manager',
            priority: 'high'
          }
        },
        {
          type: 'schedule_task',
          config: {
            taskType: 'customer_outreach',
            dueDate: '3_days',
            template: 'retention_call'
          }
        }
      ],
      isActive: true,
      priority: 9,
      executionCount: 0,
      createdAt: new Date()
    });

    // Supplier Performance Monitoring
    this.createWorkflow({
      id: 'supplier-performance',
      name: 'Supplier Performance Monitoring',
      description: 'Monitor and act on supplier performance issues',
      trigger: {
        type: 'supplier_delay',
        config: { delayThreshold: 2 } // 2 days late
      },
      conditions: [
        { field: 'onTimeDeliveryRate', operator: 'less_than', value: 0.85 },
        { field: 'isPreferredSupplier', operator: 'equals', value: true }
      ],
      actions: [
        {
          type: 'ai_analysis',
          config: { analysisType: 'supplier_risk_assessment' }
        },
        {
          type: 'create_alert',
          config: {
            title: 'Preferred Supplier Performance Issue',
            assignTo: 'procurement_team',
            includeRecommendations: true
          }
        },
        {
          type: 'schedule_task',
          config: {
            taskType: 'supplier_review',
            dueDate: '1_week'
          }
        }
      ],
      isActive: true,
      priority: 7,
      executionCount: 0,
      createdAt: new Date()
    });

    // Seasonal Inventory Adjustment
    this.createWorkflow({
      id: 'seasonal-adjustment',
      name: 'Seasonal Inventory Adjustment',
      description: 'Adjust inventory levels based on seasonal construction patterns',
      trigger: {
        type: 'scheduled',
        config: { schedule: '0 0 1 */3 *' } // Quarterly on the 1st
      },
      conditions: [
        { field: 'category', operator: 'contains', value: ['lumber', 'concrete', 'roofing'] }
      ],
      actions: [
        {
          type: 'ai_analysis',
          config: { 
            analysisType: 'seasonal_demand_forecast',
            horizon: 90 // 3 months ahead
          }
        },
        {
          type: 'update_price',
          config: {
            adjustmentType: 'seasonal',
            requireApproval: false,
            maxAdjustment: 0.15
          }
        }
      ],
      isActive: true,
      priority: 5,
      executionCount: 0,
      createdAt: new Date()
    });
  }

  private setupEventHandlers() {
    // Listen for real-time events that could trigger workflows
    this.realTimeService.on('event_broadcasted', (event) => {
      this.processEventTriggers(event);
    });

    // Listen for AI insights that could trigger workflows
    this.aiOrchestrator.on('insights_updated', (insights) => {
      insights.forEach(insight => {
        this.processAIInsightTriggers(insight);
      });
    });

    // Listen for critical alerts
    this.aiOrchestrator.on('critical_alerts', (alerts) => {
      alerts.forEach(alert => {
        this.processCriticalAlert(alert);
      });
    });
  }

  private startAutomationEngine() {
    // Process workflow execution queue
    setInterval(() => {
      this.processExecutionQueue();
    }, 5000); // Every 5 seconds

    // Check scheduled workflows
    setInterval(() => {
      this.checkScheduledWorkflows();
    }, 60000); // Every minute

    // Health check and optimization
    setInterval(() => {
      this.optimizeWorkflows();
    }, 3600000); // Every hour
  }

  public createWorkflow(workflow: Omit<WorkflowRule, 'id'> & { id?: string }): WorkflowRule {
    const id = workflow.id || `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullWorkflow: WorkflowRule = {
      ...workflow,
      id,
      executionCount: 0,
      createdAt: new Date()
    };
    
    this.workflows.set(id, fullWorkflow);
    this.emit('workflow_created', fullWorkflow);
    
    return fullWorkflow;
  }

  public async executeWorkflow(workflowId: string, context: any = {}): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.isActive) {
      return false;
    }

    try {
      // Check conditions
      const conditionsMet = await this.evaluateConditions(workflow.conditions, context);
      if (!conditionsMet) {
        return false;
      }

      // Execute actions in sequence
      for (const action of workflow.actions) {
        await this.executeAction(action, context, workflow);
        
        // Apply delay if specified
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }
      }

      // Update workflow statistics
      workflow.executionCount++;
      workflow.lastExecuted = new Date();

      this.emit('workflow_executed', { workflowId, context, success: true });
      return true;

    } catch (error) {
      console.error(`Workflow execution error for ${workflowId}:`, error);
      this.emit('workflow_error', { workflowId, context, error: error.message });
      return false;
    }
  }

  private async evaluateConditions(conditions: WorkflowCondition[], context: any): Promise<boolean> {
    if (conditions.length === 0) return true;

    let result = true;
    let currentLogicalOp = 'AND';

    for (const condition of conditions) {
      const conditionResult = await this.evaluateCondition(condition, context);
      
      if (currentLogicalOp === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentLogicalOp = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private async evaluateCondition(condition: WorkflowCondition, context: any): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, context);
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'greater_than':
        return fieldValue > expectedValue;
      case 'less_than':
        return fieldValue < expectedValue;
      case 'contains':
        if (Array.isArray(expectedValue)) {
          return expectedValue.some(val => 
            fieldValue?.toString().toLowerCase().includes(val.toLowerCase())
          );
        }
        return fieldValue?.toString().toLowerCase().includes(expectedValue?.toLowerCase());
      case 'not_empty':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      default:
        return false;
    }
  }

  private getFieldValue(field: string, context: any): any {
    const parts = field.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async executeAction(action: WorkflowAction, context: any, workflow: WorkflowRule): Promise<any> {
    switch (action.type) {
      case 'create_po':
        return await this.executeCreatePO(action, context);
      case 'send_email':
        return await this.executeSendEmail(action, context);
      case 'update_price':
        return await this.executeUpdatePrice(action, context);
      case 'create_alert':
        return await this.executeCreateAlert(action, context);
      case 'schedule_task':
        return await this.executeScheduleTask(action, context);
      case 'ai_analysis':
        return await this.executeAIAnalysis(action, context);
      case 'call_webhook':
        return await this.executeWebhook(action, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeCreatePO(action: WorkflowAction, context: any): Promise<any> {
    const config = action.config;
    
    // Get AI recommendation for optimal order quantity if requested
    let orderQuantity = context.suggestedQuantity || context.reorderQuantity;
    
    if (config.includeAIRecommendations && context.productId) {
      try {
        const aiRecommendation = await this.aiOrchestrator.getInventoryOptimization({
          userRole: 'system',
          companySize: 'midsize',
          industry: 'construction',
          preferences: { productId: context.productId }
        });
        
        if (aiRecommendation.length > 0) {
          orderQuantity = aiRecommendation[0].data?.optimalOrderQuantity || orderQuantity;
        }
      } catch (error) {
        console.error('AI recommendation failed, using default quantity');
      }
    }

    const po = {
      id: `PO_AUTO_${Date.now()}`,
      productId: context.productId,
      supplierId: context.supplierId || context.preferredSupplierId,
      quantity: orderQuantity,
      estimatedCost: (orderQuantity || 0) * (context.unitCost || 0),
      status: config.autoApprove ? 'approved' : 'draft',
      autoGenerated: true,
      workflowId: context.workflowId,
      createdAt: new Date()
    };

    // Broadcast the PO creation
    this.realTimeService.broadcastEvent({
      type: 'order_created',
      data: { type: 'purchase_order', ...po },
      timestamp: new Date(),
      priority: 'medium'
    });

    if (config.notifyPurchasing) {
      this.realTimeService.broadcastEvent({
        type: 'alert',
        data: {
          title: 'Automatic Purchase Order Created',
          message: `PO ${po.id} created for ${context.productName || context.productId}`,
          severity: 'info',
          category: 'procurement'
        },
        timestamp: new Date(),
        priority: 'medium'
      });
    }

    return po;
  }

  private async executeSendEmail(action: WorkflowAction, context: any): Promise<any> {
    // Email sending logic would go here
    console.log('Sending email:', action.config, context);
    return { sent: true, timestamp: new Date() };
  }

  private async executeUpdatePrice(action: WorkflowAction, context: any): Promise<any> {
    const config = action.config;
    
    if (config.requireApproval) {
      // Create price change approval request
      this.realTimeService.broadcastEvent({
        type: 'alert',
        data: {
          title: 'Price Change Approval Required',
          message: `AI recommends price change for ${context.productName}: $${context.currentPrice} → $${context.recommendedPrice}`,
          severity: 'info',
          category: 'pricing',
          actionRequired: true
        },
        timestamp: new Date(),
        priority: 'medium'
      });
    }

    return {
      productId: context.productId,
      oldPrice: context.currentPrice,
      newPrice: context.recommendedPrice,
      approved: !config.requireApproval,
      timestamp: new Date()
    };
  }

  private async executeCreateAlert(action: WorkflowAction, context: any): Promise<any> {
    const alert = {
      title: action.config.title,
      message: context.alertMessage || action.config.message,
      severity: action.config.severity || 'info',
      assignTo: action.config.assignTo,
      category: action.config.category || 'general',
      context,
      createdAt: new Date()
    };

    this.realTimeService.broadcastEvent({
      type: 'alert',
      data: alert,
      timestamp: new Date(),
      priority: action.config.priority || 'medium'
    });

    return alert;
  }

  private async executeScheduleTask(action: WorkflowAction, context: any): Promise<any> {
    const task = {
      id: `TASK_${Date.now()}`,
      type: action.config.taskType,
      title: action.config.title || `Automated task: ${action.config.taskType}`,
      assignTo: action.config.assignTo || 'unassigned',
      dueDate: this.calculateDueDate(action.config.dueDate),
      context,
      createdAt: new Date()
    };

    // In a real system, this would be saved to a task management system
    this.emit('task_scheduled', task);
    
    return task;
  }

  private async executeAIAnalysis(action: WorkflowAction, context: any): Promise<any> {
    const analysisType = action.config.analysisType;
    
    try {
      const aiContext = {
        userRole: 'system',
        companySize: 'midsize' as const,
        industry: 'construction' as const,
        preferences: { ...context, analysisType }
      };

      switch (analysisType) {
        case 'optimal_order_quantity':
          return await this.aiOrchestrator.getInventoryOptimization(aiContext);
        case 'market_pricing_analysis':
          return await this.aiOrchestrator.getMarketIntelligence(aiContext);
        case 'supplier_risk_assessment':
          return await this.aiOrchestrator.getSupplyChainOptimization(aiContext);
        case 'seasonal_demand_forecast':
          return await this.aiOrchestrator.getDemandForecasts(aiContext);
        default:
          return await this.aiOrchestrator.generateComprehensiveInsights(aiContext);
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      return { error: error.message };
    }
  }

  private async executeWebhook(action: WorkflowAction, context: any): Promise<any> {
    // Webhook execution logic
    console.log('Calling webhook:', action.config.url, context);
    return { called: true, timestamp: new Date() };
  }

  private calculateDueDate(dueDateConfig: string): Date {
    const now = new Date();
    const parts = dueDateConfig.split('_');
    const amount = parseInt(parts[0]);
    const unit = parts[1];

    switch (unit) {
      case 'hours':
        return new Date(now.getTime() + amount * 60 * 60 * 1000);
      case 'days':
        return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
      case 'weeks':
        return new Date(now.getTime() + amount * 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default 1 day
    }
  }

  private processEventTriggers(event: any) {
    this.workflows.forEach((workflow, id) => {
      if (workflow.isActive && this.matchesTrigger(workflow.trigger, event)) {
        this.executionQueue.push({ workflowId: id, context: event });
      }
    });
  }

  private processAIInsightTriggers(insight: any) {
    this.workflows.forEach((workflow, id) => {
      if (workflow.isActive && 
          workflow.trigger.type === 'ai_insight' &&
          workflow.trigger.config.insightType === insight.type) {
        this.executionQueue.push({ 
          workflowId: id, 
          context: { ...insight.data, insight } 
        });
      }
    });
  }

  private processCriticalAlert(alert: any) {
    // High-priority processing for critical alerts
    this.workflows.forEach((workflow, id) => {
      if (workflow.isActive && 
          workflow.priority >= 8 && 
          this.matchesTrigger(workflow.trigger, { type: 'alert', data: alert })) {
        // Execute immediately for critical workflows
        this.executeWorkflow(id, { ...alert.data, alert });
      }
    });
  }

  private matchesTrigger(trigger: WorkflowTrigger, event: any): boolean {
    switch (trigger.type) {
      case 'inventory_low':
        return event.type === 'inventory_update' && event.data.quantityChange < 0;
      case 'customer_order':
        return event.type === 'order_created' && event.data.type === 'sales_order';
      case 'price_change':
        return event.type === 'market_update';
      case 'ai_insight':
        return event.type === 'ai_insight';
      default:
        return false;
    }
  }

  private async processExecutionQueue() {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process up to 5 workflows at a time
      const batch = this.executionQueue.splice(0, 5);
      
      await Promise.all(
        batch.map(({ workflowId, context }) => 
          this.executeWorkflow(workflowId, context)
        )
      );
    } catch (error) {
      console.error('Execution queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private checkScheduledWorkflows() {
    const now = new Date();
    
    this.workflows.forEach((workflow, id) => {
      if (workflow.isActive && workflow.trigger.type === 'scheduled') {
        // Simple cron-like scheduling check
        const schedule = workflow.trigger.config.schedule;
        if (this.shouldExecuteScheduled(schedule, now, workflow.lastExecuted)) {
          this.executionQueue.push({ workflowId: id, context: { scheduledExecution: true } });
        }
      }
    });
  }

  private shouldExecuteScheduled(schedule: string, now: Date, lastExecuted?: Date): boolean {
    // Simple implementation - in production, use a proper cron library
    if (!lastExecuted) return true;
    
    const hoursSinceLastExecution = (now.getTime() - lastExecuted.getTime()) / (1000 * 60 * 60);
    
    // Daily schedule
    if (schedule.includes('9 * * *') && hoursSinceLastExecution >= 24) {
      return now.getHours() === 9;
    }
    
    // Quarterly schedule
    if (schedule.includes('0 1 */3 *') && hoursSinceLastExecution >= 24 * 90) {
      return now.getDate() === 1;
    }
    
    return false;
  }

  private optimizeWorkflows() {
    // Analyze workflow performance and optimize
    this.workflows.forEach((workflow) => {
      if (workflow.executionCount > 100 && workflow.lastExecuted) {
        const daysSinceCreated = (Date.now() - workflow.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const executionsPerDay = workflow.executionCount / daysSinceCreated;
        
        if (executionsPerDay > 50) {
          // High-frequency workflow - consider batching
          this.emit('workflow_optimization_needed', {
            workflowId: workflow.id,
            reason: 'high_frequency',
            suggestion: 'Consider batching executions'
          });
        }
      }
    });
  }

  public getWorkflowStats(): any {
    const stats = {
      totalWorkflows: this.workflows.size,
      activeWorkflows: Array.from(this.workflows.values()).filter(w => w.isActive).length,
      totalExecutions: Array.from(this.workflows.values()).reduce((sum, w) => sum + w.executionCount, 0),
      queueSize: this.executionQueue.length,
      averageExecutionsPerWorkflow: 0
    };

    if (stats.totalWorkflows > 0) {
      stats.averageExecutionsPerWorkflow = Math.round(stats.totalExecutions / stats.totalWorkflows);
    }

    return stats;
  }

  public getWorkflows(): WorkflowRule[] {
    return Array.from(this.workflows.values());
  }

  public toggleWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.isActive = !workflow.isActive;
      this.emit('workflow_toggled', { workflowId, isActive: workflow.isActive });
      return workflow.isActive;
    }
    return false;
  }
}

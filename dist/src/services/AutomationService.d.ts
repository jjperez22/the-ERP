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
    delay?: number;
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
export declare class AutomationService extends EventEmitter {
    private aiOrchestrator;
    private realTimeService;
    private workflows;
    private procurementRules;
    private executionQueue;
    private isProcessing;
    constructor(aiOrchestrator: AIOrchestrator, realTimeService: RealTimeService);
    private initializeDefaultWorkflows;
    private setupEventHandlers;
    private startAutomationEngine;
    createWorkflow(workflow: Omit<WorkflowRule, 'id'> & {
        id?: string;
    }): WorkflowRule;
    executeWorkflow(workflowId: string, context?: any): Promise<boolean>;
    private evaluateConditions;
    private evaluateCondition;
    private getFieldValue;
    private executeAction;
    private executeCreatePO;
    private executeSendEmail;
    private executeUpdatePrice;
    private executeCreateAlert;
    private executeScheduleTask;
    private executeAIAnalysis;
    private executeWebhook;
    private calculateDueDate;
    private processEventTriggers;
    private processAIInsightTriggers;
    private processCriticalAlert;
    private matchesTrigger;
    private processExecutionQueue;
    private checkScheduledWorkflows;
    private shouldExecuteScheduled;
    private optimizeWorkflows;
    getWorkflowStats(): any;
    getWorkflows(): WorkflowRule[];
    toggleWorkflow(workflowId: string): boolean;
}
//# sourceMappingURL=AutomationService.d.ts.map
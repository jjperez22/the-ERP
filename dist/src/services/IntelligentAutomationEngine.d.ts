import { EventEmitter } from 'events';
export interface WorkflowRule {
    id: string;
    name: string;
    description: string;
    triggers: WorkflowTrigger[];
    conditions: WorkflowCondition[];
    actions: WorkflowAction[];
    isActive: boolean;
    priority: number;
    executionCount: number;
    successRate: number;
    avgExecutionTime: number;
    learningData: WorkflowLearningData;
    createdAt: Date;
    lastModified: Date;
}
export interface WorkflowTrigger {
    type: 'event' | 'schedule' | 'condition' | 'user_behavior' | 'ai_prediction';
    source: string;
    eventType?: string;
    schedule?: string;
    condition?: string;
    confidenceThreshold?: number;
}
export interface WorkflowCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'ai_suggests';
    value: any;
    aiConfidence?: number;
}
export interface WorkflowAction {
    type: 'create' | 'update' | 'send_notification' | 'execute_function' | 'ai_decision' | 'smart_routing';
    target: string;
    parameters: Record<string, any>;
    aiOptimized?: boolean;
    executionDelay?: number;
    rollbackAction?: WorkflowAction;
}
export interface WorkflowLearningData {
    userPatterns: UserPattern[];
    performanceMetrics: PerformanceMetric[];
    optimizationHistory: OptimizationRecord[];
    failureAnalysis: FailureAnalysis[];
    adaptationRules: AdaptationRule[];
}
export interface UserPattern {
    userId: string;
    behavior: string;
    frequency: number;
    context: Record<string, any>;
    predictedNext: string[];
    confidence: number;
}
export interface PerformanceMetric {
    metric: string;
    value: number;
    trend: 'improving' | 'declining' | 'stable';
    timestamp: Date;
}
export interface OptimizationRecord {
    optimization: string;
    impact: number;
    timestamp: Date;
    rollbackPlan: string;
}
export interface FailureAnalysis {
    error: string;
    frequency: number;
    rootCause: string;
    suggestedFix: string;
}
export interface AdaptationRule {
    condition: string;
    adaptation: string;
    confidence: number;
    appliedCount: number;
}
export interface ProcessOptimization {
    processId: string;
    currentEfficiency: number;
    optimizedEfficiency: number;
    recommendations: string[];
    implementationPlan: string[];
    estimatedROI: number;
}
export declare class IntelligentAutomationEngine extends EventEmitter {
    private workflows;
    private executionQueue;
    private learningEngine;
    private aiOptimizer;
    private behaviorTracker;
    private openai;
    constructor();
    private initializeIntelligentWorkflows;
    createWorkflow(workflow: Partial<WorkflowRule>): Promise<string>;
    executeWorkflow(workflowId: string, context: any): Promise<any>;
    optimizeWorkflowPerformance(workflowId?: string): Promise<ProcessOptimization[]>;
    predictWorkflowNeeds(userId: string, context: any): Promise<any[]>;
    private evaluateConditions;
    private evaluateCondition;
    private aiEvaluateCondition;
    private executeAction;
    private executeAIDecision;
    private executeSmartRouting;
    private executeCreate;
    private executeUpdate;
    private executeSendNotification;
    private executeFunction;
    private startContinuousLearning;
    private setupProactiveOptimization;
    private updateWorkflowMetrics;
    private getValueFromContext;
    private applyOptimization;
    private getAvailableResources;
    private selectBestResource;
    getWorkflows(): WorkflowRule[];
    getWorkflowStats(): any;
    toggleWorkflow(workflowId: string): boolean;
}
//# sourceMappingURL=IntelligentAutomationEngine.d.ts.map
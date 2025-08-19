import { EventEmitter } from 'events';
export interface ContractAnalysis {
    contractId: string;
    analysisDate: Date;
    riskScore: number;
    riskFactors: RiskFactor[];
    savingsOpportunities: SavingsOpportunity[];
    complianceIssues: ComplianceIssue[];
    renewalRecommendations: RenewalRecommendation[];
    negotiationPoints: NegotiationPoint[];
    aiSummary: string;
    confidenceScore: number;
}
export interface RiskFactor {
    type: 'financial' | 'legal' | 'operational' | 'performance' | 'market';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    mitigation: string;
    probability: number;
}
export interface SavingsOpportunity {
    type: 'cost_reduction' | 'better_terms' | 'volume_discount' | 'payment_terms' | 'service_level';
    description: string;
    estimatedSavings: number;
    implementationEffort: 'low' | 'medium' | 'high';
    priority: number;
    action: string;
}
export interface ComplianceIssue {
    type: 'regulatory' | 'contractual' | 'industry_standard' | 'internal_policy';
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    description: string;
    requirement: string;
    remediation: string;
    deadline?: Date;
}
export interface RenewalRecommendation {
    action: 'renew' | 'renegotiate' | 'terminate' | 'extend' | 'modify';
    confidence: number;
    reasoning: string;
    suggestedTerms: string[];
    estimatedBenefit: number;
    timeline: string;
}
export interface NegotiationPoint {
    category: 'pricing' | 'terms' | 'service_level' | 'liability' | 'termination' | 'payment';
    currentTerm: string;
    proposedTerm: string;
    justification: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    leverage: number;
    expectedResistance: number;
}
export interface ContractMetrics {
    contractId: string;
    totalValue: number;
    monthlyCost: number;
    performanceScore: number;
    utilizationRate: number;
    costPerUnit: number;
    benchmarkComparison: number;
    trendAnalysis: TrendAnalysis;
}
export interface TrendAnalysis {
    costTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'declining' | 'stable';
    utilizationTrend: 'increasing' | 'decreasing' | 'stable';
    predictedChanges: string[];
}
export interface NegotiationStrategy {
    contractId: string;
    strategy: string;
    objectives: NegotiationObjective[];
    tactics: NegotiationTactic[];
    fallbackPositions: string[];
    walkawayPoint: number;
    estimatedOutcome: string;
    timeline: NegotiationTimeline;
}
export interface NegotiationObjective {
    objective: string;
    priority: number;
    targetValue: string;
    minimumAcceptable: string;
    measurable: boolean;
}
export interface NegotiationTactic {
    tactic: string;
    timing: string;
    expectedImpact: string;
    risks: string[];
    successProbability: number;
}
export interface NegotiationTimeline {
    preparation: Date;
    initialContact: Date;
    negotiationPeriod: {
        start: Date;
        end: Date;
    };
    decisionDeadline: Date;
    implementationDate: Date;
}
export interface AutomatedNegotiation {
    contractId: string;
    status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'escalated';
    automationLevel: 'full' | 'assisted' | 'monitored';
    aiRecommendations: string[];
    humanOverrideRequired: boolean;
    negotiations: NegotiationRound[];
    finalOutcome?: NegotiationOutcome;
}
export interface NegotiationRound {
    roundNumber: number;
    aiProposal: string;
    supplierResponse?: string;
    analysis: string;
    nextAction: string;
    timestamp: Date;
}
export interface NegotiationOutcome {
    success: boolean;
    finalTerms: Record<string, any>;
    savingsAchieved: number;
    improvementsGained: string[];
    lessonsLearned: string[];
    satisfactionScore: number;
}
export declare class SmartContractManager extends EventEmitter {
    private openai;
    private contractAnalyses;
    private contractMetrics;
    private activeNegotiations;
    private aiNegotiationEngine;
    private renewalTracker;
    private complianceMonitor;
    constructor();
    private initializeContractManagement;
    private startAutomatedMonitoring;
    analyzeContract(contractId: string, contractText: string): Promise<ContractAnalysis>;
    generateNegotiationStrategy(contractId: string): Promise<NegotiationStrategy>;
    startAutomatedNegotiation(contractId: string, automationLevel?: 'full' | 'assisted' | 'monitored'): Promise<AutomatedNegotiation>;
    trackContractPerformance(contractId: string): Promise<ContractMetrics>;
    identifyCostSavingOpportunities(): Promise<SavingsOpportunity[]>;
    private analyzeCostSavings;
    private performDailyContractReview;
    private checkRenewalOpportunities;
    private analyzeCostSavingOpportunities;
    private checkUrgentContractIssues;
    private handleRenewalDue;
    private handleComplianceIssue;
    private parseRiskFactors;
    private parseSavingsOpportunities;
    private parseComplianceIssues;
    private parseRenewalRecommendations;
    private parseNegotiationPoints;
    private parseNegotiationObjectives;
    private parseNegotiationTactics;
    private parseNegotiationTimeline;
    getContractAnalyses(): ContractAnalysis[];
    getActiveNegotiations(): AutomatedNegotiation[];
    getContractMetrics(): ContractMetrics[];
    generateContractReport(contractId: string): Promise<any>;
    getSystemStats(): any;
}
//# sourceMappingURL=SmartContractManager.d.ts.map
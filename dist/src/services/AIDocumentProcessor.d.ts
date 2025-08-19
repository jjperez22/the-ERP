import { EventEmitter } from 'events';
export interface DocumentProcessingResult {
    documentId: string;
    documentType: 'invoice' | 'purchase_order' | 'contract' | 'receipt' | 'estimate' | 'unknown';
    confidence: number;
    extractedData: ExtractedData;
    validationResults: ValidationResult[];
    suggestedActions: SuggestedAction[];
    processingTime: number;
    ocrText: string;
    structuredData: any;
}
export interface ExtractedData {
    documentNumber?: string;
    date?: Date;
    dueDate?: Date;
    totalAmount?: number;
    currency?: string;
    vendorName?: string;
    vendorAddress?: string;
    vendorTaxId?: string;
    customerName?: string;
    customerAddress?: string;
    lineItems?: LineItem[];
    paymentTerms?: string;
    projectReference?: string;
    customFields?: Record<string, any>;
}
export interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
    productCode?: string;
}
export interface ValidationResult {
    field: string;
    isValid: boolean;
    confidence: number;
    errorMessage?: string;
    suggestedCorrection?: any;
    requiresHumanReview: boolean;
}
export interface SuggestedAction {
    action: 'approve' | 'reject' | 'route_for_approval' | 'request_clarification' | 'auto_process' | 'create_po' | 'update_inventory';
    priority: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    confidence: number;
    estimatedTimeToComplete: number;
    assignedTo?: string;
}
export interface DocumentTemplate {
    id: string;
    name: string;
    documentType: string;
    fieldMappings: FieldMapping[];
    validationRules: ValidationRule[];
    processingRules: ProcessingRule[];
    isActive: boolean;
}
export interface FieldMapping {
    fieldName: string;
    ocrPattern: string;
    dataType: 'string' | 'number' | 'date' | 'currency' | 'boolean';
    required: boolean;
    defaultValue?: any;
}
export interface ValidationRule {
    field: string;
    rule: string;
    errorMessage: string;
    severity: 'warning' | 'error';
}
export interface ProcessingRule {
    condition: string;
    action: string;
    parameters: Record<string, any>;
}
export interface SmartRouting {
    documentType: string;
    amount?: number;
    vendor?: string;
    assignedTo: string;
    department: string;
    priority: number;
    estimatedProcessingTime: number;
}
export declare class AIDocumentProcessor extends EventEmitter {
    private openai;
    private documentTemplates;
    private processingQueue;
    private routingRules;
    private learningData;
    constructor();
    private initializeDocumentTemplates;
    processDocument(documentPath: string, documentType?: string): Promise<DocumentProcessingResult>;
    private extractTextFromDocument;
    private simulateOCRExtraction;
    private classifyDocument;
    private extractStructuredData;
    private extractUsingTemplate;
    private extractUsingAI;
    private extractLineItems;
    private validateExtractedData;
    private evaluateValidationRule;
    private aiValidateData;
    private generateSuggestedActions;
    private routeDocument;
    private determineSmartRouting;
    private calculateOverallConfidence;
    private calculateDataCompleteness;
    private learnFromProcessing;
    private createDocumentTemplate;
    private setupSmartRouting;
    private startBatchProcessing;
    private processBatch;
    getDocumentTemplates(): DocumentTemplate[];
    getProcessingStats(): any;
    batchProcessDocuments(documentPaths: string[]): Promise<DocumentProcessingResult[]>;
}
//# sourceMappingURL=AIDocumentProcessor.d.ts.map
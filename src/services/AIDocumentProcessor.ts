// src/services/AIDocumentProcessor.ts
import { Service } from '@varld/warp';
import { EventEmitter } from 'events';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';

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
  // Common fields
  documentNumber?: string;
  date?: Date;
  dueDate?: Date;
  totalAmount?: number;
  currency?: string;
  
  // Vendor/Customer information
  vendorName?: string;
  vendorAddress?: string;
  vendorTaxId?: string;
  customerName?: string;
  customerAddress?: string;
  
  // Line items
  lineItems?: LineItem[];
  
  // Additional metadata
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

@Service()
export class AIDocumentProcessor extends EventEmitter {
  private openai: OpenAI;
  private documentTemplates: Map<string, DocumentTemplate> = new Map();
  private processingQueue: DocumentProcessingResult[] = [];
  private routingRules: Map<string, SmartRouting[]> = new Map();
  private learningData: Map<string, any> = new Map();

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.initializeDocumentTemplates();
    this.setupSmartRouting();
    this.startBatchProcessing();
  }

  private initializeDocumentTemplates() {
    console.log('📄 Initializing Document Templates...');

    // Invoice Template
    this.createDocumentTemplate({
      id: 'invoice-template',
      name: 'Standard Invoice',
      documentType: 'invoice',
      fieldMappings: [
        { fieldName: 'invoiceNumber', ocrPattern: 'Invoice\\s*#?:?\\s*(\\S+)', dataType: 'string', required: true },
        { fieldName: 'date', ocrPattern: 'Date:?\\s*([\\d\\/\\-]+)', dataType: 'date', required: true },
        { fieldName: 'dueDate', ocrPattern: 'Due\\s*Date:?\\s*([\\d\\/\\-]+)', dataType: 'date', required: false },
        { fieldName: 'totalAmount', ocrPattern: 'Total:?\\s*\\$?([\\d,\\.]+)', dataType: 'currency', required: true },
        { fieldName: 'vendorName', ocrPattern: 'From:?\\s*(.+)', dataType: 'string', required: true }
      ],
      validationRules: [
        { field: 'totalAmount', rule: 'totalAmount > 0', errorMessage: 'Total amount must be greater than zero', severity: 'error' },
        { field: 'date', rule: 'date <= today', errorMessage: 'Invoice date cannot be in the future', severity: 'warning' }
      ],
      processingRules: [
        { condition: 'totalAmount > 10000', action: 'route_for_approval', parameters: { approver: 'finance_manager' } },
        { condition: 'vendorName in approved_vendors', action: 'auto_process', parameters: {} }
      ]
    });

    // Purchase Order Template
    this.createDocumentTemplate({
      id: 'po-template',
      name: 'Purchase Order',
      documentType: 'purchase_order',
      fieldMappings: [
        { fieldName: 'poNumber', ocrPattern: 'PO\\s*#?:?\\s*(\\S+)', dataType: 'string', required: true },
        { fieldName: 'date', ocrPattern: 'Date:?\\s*([\\d\\/\\-]+)', dataType: 'date', required: true },
        { fieldName: 'vendorName', ocrPattern: 'Vendor:?\\s*(.+)', dataType: 'string', required: true },
        { fieldName: 'totalAmount', ocrPattern: 'Total:?\\s*\\$?([\\d,\\.]+)', dataType: 'currency', required: true }
      ],
      validationRules: [
        { field: 'poNumber', rule: 'poNumber.length > 0', errorMessage: 'PO number is required', severity: 'error' }
      ],
      processingRules: [
        { condition: 'always', action: 'create_po_record', parameters: {} }
      ]
    });

    // Contract Template
    this.createDocumentTemplate({
      id: 'contract-template',
      name: 'Service Contract',
      documentType: 'contract',
      fieldMappings: [
        { fieldName: 'contractNumber', ocrPattern: 'Contract\\s*#?:?\\s*(\\S+)', dataType: 'string', required: true },
        { fieldName: 'startDate', ocrPattern: 'Start\\s*Date:?\\s*([\\d\\/\\-]+)', dataType: 'date', required: true },
        { fieldName: 'endDate', ocrPattern: 'End\\s*Date:?\\s*([\\d\\/\\-]+)', dataType: 'date', required: true },
        { fieldName: 'contractValue', ocrPattern: 'Value:?\\s*\\$?([\\d,\\.]+)', dataType: 'currency', required: true }
      ],
      validationRules: [
        { field: 'endDate', rule: 'endDate > startDate', errorMessage: 'End date must be after start date', severity: 'error' }
      ],
      processingRules: [
        { condition: 'contractValue > 50000', action: 'route_for_approval', parameters: { approver: 'legal_team' } }
      ]
    });

    console.log('✅ Document Templates Initialized');
  }

  async processDocument(documentPath: string, documentType?: string): Promise<DocumentProcessingResult> {
    const startTime = Date.now();
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`📋 Processing document: ${documentId}`);

      // Step 1: OCR Text Extraction
      const ocrText = await this.extractTextFromDocument(documentPath);
      
      // Step 2: Document Classification
      const classifiedType = documentType || await this.classifyDocument(ocrText);
      
      // Step 3: Data Extraction using AI and Templates
      const extractedData = await this.extractStructuredData(ocrText, classifiedType);
      
      // Step 4: Data Validation
      const validationResults = await this.validateExtractedData(extractedData, classifiedType);
      
      // Step 5: Generate Suggested Actions
      const suggestedActions = await this.generateSuggestedActions(extractedData, classifiedType, validationResults);
      
      // Step 6: Smart Routing
      await this.routeDocument(documentId, classifiedType, extractedData, suggestedActions);

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateOverallConfidence(extractedData, validationResults);

      const result: DocumentProcessingResult = {
        documentId,
        documentType: classifiedType as any,
        confidence,
        extractedData,
        validationResults,
        suggestedActions,
        processingTime,
        ocrText,
        structuredData: extractedData
      };

      // Learn from processing
      await this.learnFromProcessing(result);

      this.emit('document_processed', result);
      return result;

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('document_processing_error', { documentId, error: errorMessage });
      throw error;
    }
  }

  private async extractTextFromDocument(documentPath: string): Promise<string> {
    try {
      // Simulate OCR - in production, this would use actual OCR like Tesseract or cloud OCR
      const fileExtension = path.extname(documentPath).toLowerCase();
      
      if (fileExtension === '.txt') {
        // For text files, just read the content
        return fs.readFileSync(documentPath, 'utf8');
      } else {
        // For images/PDFs, simulate OCR extraction
        return this.simulateOCRExtraction(documentPath);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract text from document: ${errorMessage}`);
    }
  }

  private simulateOCRExtraction(documentPath: string): string {
    // Simulate OCR text extraction with realistic construction industry content
    const sampleTexts = [
      `INVOICE
      Invoice #: INV-2024-001
      Date: 03/15/2024
      Due Date: 04/15/2024
      
      From: ABC Construction Supplies
      123 Builder Street
      Construction City, CC 12345
      
      To: XYZ Contractors
      456 Project Avenue
      Build Town, BT 67890
      
      Description                 Qty    Unit Price    Total
      Portland Cement 94lb        100    $8.50        $850.00
      Rebar #4 Grade 60           50     $12.00       $600.00
      Concrete Mix Ready          10     $95.00       $950.00
      
      Subtotal:                                      $2,400.00
      Tax (8.5%):                                    $204.00
      Total:                                         $2,604.00`,
      
      `PURCHASE ORDER
      PO #: PO-2024-0234
      Date: 03/20/2024
      
      Vendor: Steel Fabricators Inc
      789 Industrial Blvd
      Metal City, MC 11111
      
      Item                        Qty    Unit Price    Total
      Steel Beam I-10x49          25     $89.50       $2,237.50
      Steel Plate 1/2"x4'x8'      15     $156.00      $2,340.00
      Welding Rods E7018          100    $3.25        $325.00
      
      Subtotal:                                      $4,902.50
      Shipping:                                      $150.00
      Total:                                         $5,052.50`
    ];
    
    return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  }

  private async classifyDocument(ocrText: string): Promise<string> {
    const prompt = `
      Classify this construction industry document based on its content.
      
      Document text:
      ${ocrText}
      
      Classify as one of: invoice, purchase_order, contract, receipt, estimate, unknown
      
      Consider keywords like:
      - Invoice: "invoice", "bill", "payment due", "remit to"
      - Purchase Order: "PO", "purchase order", "vendor", "deliver to"
      - Contract: "contract", "agreement", "terms and conditions", "signature"
      - Receipt: "receipt", "paid", "received payment"
      - Estimate: "estimate", "quote", "proposal", "bid"
      
      Respond with just the classification.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a document classification expert for the construction industry.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 50
      });

      const classification = response.choices[0].message.content?.toLowerCase().trim() || 'unknown';
      console.log(`📝 Document classified as: ${classification}`);
      return classification;
    } catch (error) {
      console.error('Document classification error:', error);
      return 'unknown';
    }
  }

  private async extractStructuredData(ocrText: string, documentType: string): Promise<ExtractedData> {
    const template = this.documentTemplates.get(`${documentType}-template`);
    let extractedData: ExtractedData = {};

    // Use template-based extraction if available
    if (template) {
      extractedData = this.extractUsingTemplate(ocrText, template);
    }

    // Enhance with AI-powered extraction
    const aiExtractedData = await this.extractUsingAI(ocrText, documentType);
    
    // Merge template and AI results
    extractedData = { ...extractedData, ...aiExtractedData };

    // Extract line items using AI
    const lineItems = await this.extractLineItems(ocrText);
    if (lineItems.length > 0) {
      extractedData.lineItems = lineItems;
    }

    return extractedData;
  }

  private extractUsingTemplate(ocrText: string, template: DocumentTemplate): ExtractedData {
    const data: ExtractedData = {};

    for (const mapping of template.fieldMappings) {
      const regex = new RegExp(mapping.ocrPattern, 'i');
      const match = ocrText.match(regex);
      
      if (match && match[1]) {
        let rawValue = match[1].trim();
        let value: any;
        
        // Convert based on data type
        switch (mapping.dataType) {
          case 'number':
            value = parseFloat(rawValue.replace(/,/g, '')) || 0;
            break;
          case 'currency':
            value = parseFloat(rawValue.replace(/[$,]/g, '')) || 0;
            break;
          case 'date':
            value = new Date(rawValue);
            break;
          case 'boolean':
            value = /^(true|yes|1)$/i.test(rawValue);
            break;
          default:
            value = rawValue;
            break;
        }
        
        (data as any)[mapping.fieldName] = value;
      } else if (mapping.required && mapping.defaultValue !== undefined) {
        (data as any)[mapping.fieldName] = mapping.defaultValue;
      }
    }

    return data;
  }

  private async extractUsingAI(ocrText: string, documentType: string): Promise<ExtractedData> {
    const prompt = `
      Extract structured data from this ${documentType} document:
      
      ${ocrText}
      
      Extract the following information in JSON format:
      {
        "documentNumber": "document number/ID",
        "date": "document date (YYYY-MM-DD)",
        "dueDate": "due date if applicable (YYYY-MM-DD)",
        "totalAmount": "total amount as number",
        "currency": "currency code (USD, etc)",
        "vendorName": "vendor/supplier name",
        "vendorAddress": "vendor address",
        "customerName": "customer name",
        "customerAddress": "customer address",
        "paymentTerms": "payment terms",
        "projectReference": "project or job reference"
      }
      
      Only include fields that are clearly present in the document. Use null for missing fields.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are an expert at extracting structured data from construction industry documents.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const aiData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Convert date strings to Date objects
      if (aiData.date) aiData.date = new Date(aiData.date);
      if (aiData.dueDate) aiData.dueDate = new Date(aiData.dueDate);

      return aiData;
    } catch (error) {
      console.error('AI extraction error:', error);
      return {};
    }
  }

  private async extractLineItems(ocrText: string): Promise<LineItem[]> {
    const prompt = `
      Extract line items from this document:
      
      ${ocrText}
      
      Look for itemized lists with descriptions, quantities, prices, etc.
      Return as JSON array of objects with fields:
      {
        "description": "item description",
        "quantity": number,
        "unitPrice": number,
        "totalPrice": number,
        "category": "material category (lumber, concrete, steel, etc)",
        "productCode": "product/item code if available"
      }
      
      Only extract clear line items. Skip headers, subtotals, taxes, etc.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are an expert at extracting line items from construction documents.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"items":[]}');
      return result.items || [];
    } catch (error) {
      console.error('Line item extraction error:', error);
      return [];
    }
  }

  private async validateExtractedData(data: ExtractedData, documentType: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const template = this.documentTemplates.get(`${documentType}-template`);

    if (template) {
      // Template-based validation
      for (const rule of template.validationRules) {
        const validation = this.evaluateValidationRule(rule, data);
        results.push(validation);
      }
    }

    // AI-powered validation
    const aiValidation = await this.aiValidateData(data, documentType);
    results.push(...aiValidation);

    return results;
  }

  private evaluateValidationRule(rule: ValidationRule, data: ExtractedData): ValidationResult {
    try {
      const value = (data as any)[rule.field];
      const isValid = eval(rule.rule.replace(rule.field, JSON.stringify(value)));
      
      return {
        field: rule.field,
        isValid,
        confidence: 0.9,
        errorMessage: isValid ? undefined : rule.errorMessage,
        requiresHumanReview: rule.severity === 'error' && !isValid
      };
    } catch (error) {
      return {
        field: rule.field,
        isValid: false,
        confidence: 0.5,
        errorMessage: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
        requiresHumanReview: true
      };
    }
  }

  private async aiValidateData(data: ExtractedData, documentType: string): Promise<ValidationResult[]> {
    const prompt = `
      Validate this extracted data for a ${documentType}:
      
      ${JSON.stringify(data, null, 2)}
      
      Check for:
      1. Required fields completeness
      2. Data format correctness
      3. Business logic validation
      4. Reasonable values for construction industry
      
      Return validation results as JSON array:
      [
        {
          "field": "field name",
          "isValid": true/false,
          "confidence": 0.0-1.0,
          "errorMessage": "error description if invalid",
          "requiresHumanReview": true/false
        }
      ]
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a data validation expert for construction industry documents.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"validations":[]}');
      return result.validations || [];
    } catch (error) {
      console.error('AI validation error:', error);
      return [];
    }
  }

  private async generateSuggestedActions(
    data: ExtractedData, 
    documentType: string, 
    validationResults: ValidationResult[]
  ): Promise<SuggestedAction[]> {
    const actions: SuggestedAction[] = [];

    // Generate actions based on document type and validation
    const hasErrors = validationResults.some(v => !v.isValid && v.requiresHumanReview);
    const totalAmount = data.totalAmount || 0;

    if (hasErrors) {
      actions.push({
        action: 'request_clarification',
        priority: 'high',
        reason: 'Document contains validation errors that require review',
        confidence: 0.9,
        estimatedTimeToComplete: 30, // minutes
        assignedTo: 'document_review_team'
      });
    } else if (documentType === 'invoice' && totalAmount > 10000) {
      actions.push({
        action: 'route_for_approval',
        priority: 'medium',
        reason: 'High-value invoice requires manager approval',
        confidence: 0.95,
        estimatedTimeToComplete: 60,
        assignedTo: 'finance_manager'
      });
    } else if (documentType === 'purchase_order') {
      actions.push({
        action: 'create_po',
        priority: 'medium',
        reason: 'Create purchase order record in system',
        confidence: 0.9,
        estimatedTimeToComplete: 15,
        assignedTo: 'procurement_team'
      });
    } else {
      actions.push({
        action: 'auto_process',
        priority: 'low',
        reason: 'Document passed all validations and can be processed automatically',
        confidence: 0.85,
        estimatedTimeToComplete: 5,
        assignedTo: 'system'
      });
    }

    return actions;
  }

  private async routeDocument(
    documentId: string,
    documentType: string,
    data: ExtractedData,
    actions: SuggestedAction[]
  ): Promise<void> {
    const routing = this.determineSmartRouting(documentType, data, actions);
    
    console.log(`🎯 Routing document ${documentId} to: ${routing.assignedTo} (${routing.department})`);
    
    this.emit('document_routed', {
      documentId,
      routing,
      estimatedProcessingTime: routing.estimatedProcessingTime
    });
  }

  private determineSmartRouting(
    documentType: string,
    data: ExtractedData,
    actions: SuggestedAction[]
  ): SmartRouting {
    const totalAmount = data.totalAmount || 0;
    
    // Smart routing based on document type and amount
    if (documentType === 'invoice') {
      if (totalAmount > 50000) {
        return {
          documentType,
          amount: totalAmount,
          assignedTo: 'cfo',
          department: 'finance',
          priority: 9,
          estimatedProcessingTime: 120 // minutes
        };
      } else if (totalAmount > 10000) {
        return {
          documentType,
          amount: totalAmount,
          assignedTo: 'finance_manager',
          department: 'finance',
          priority: 7,
          estimatedProcessingTime: 60
        };
      }
    } else if (documentType === 'contract') {
      return {
        documentType,
        assignedTo: 'legal_team',
        department: 'legal',
        priority: 8,
        estimatedProcessingTime: 240
      };
    }

    // Default routing
    return {
      documentType,
      assignedTo: 'document_processor',
      department: 'operations',
      priority: 5,
      estimatedProcessingTime: 30
    };
  }

  private calculateOverallConfidence(data: ExtractedData, validationResults: ValidationResult[]): number {
    const validationConfidence = validationResults.length > 0 
      ? validationResults.reduce((sum, v) => sum + v.confidence, 0) / validationResults.length
      : 0.5;

    const dataCompleteness = this.calculateDataCompleteness(data);
    
    return (validationConfidence + dataCompleteness) / 2;
  }

  private calculateDataCompleteness(data: ExtractedData): number {
    const totalFields = Object.keys(data).length;
    const populatedFields = Object.values(data).filter(v => v !== null && v !== undefined && v !== '').length;
    
    return totalFields > 0 ? populatedFields / totalFields : 0;
  }

  private async learnFromProcessing(result: DocumentProcessingResult): Promise<void> {
    // Store learning data for continuous improvement
    const learningKey = `${result.documentType}_processing`;
    const existingData = this.learningData.get(learningKey) || { samples: [], patterns: [] };
    
    existingData.samples.push({
      confidence: result.confidence,
      processingTime: result.processingTime,
      validationResults: result.validationResults,
      extractedFields: Object.keys(result.extractedData)
    });

    // Keep only last 100 samples
    if (existingData.samples.length > 100) {
      existingData.samples.shift();
    }

    this.learningData.set(learningKey, existingData);
  }

  private createDocumentTemplate(template: Partial<DocumentTemplate>): void {
    const fullTemplate: DocumentTemplate = {
      id: template.id || `template_${Date.now()}`,
      name: template.name || 'Untitled Template',
      documentType: template.documentType || 'unknown',
      fieldMappings: template.fieldMappings || [],
      validationRules: template.validationRules || [],
      processingRules: template.processingRules || [],
      isActive: template.isActive ?? true
    };

    this.documentTemplates.set(fullTemplate.id, fullTemplate);
  }

  private setupSmartRouting(): void {
    // Initialize smart routing rules
    this.routingRules.set('invoice', [
      { documentType: 'invoice', amount: 50000, assignedTo: 'cfo', department: 'finance', priority: 9, estimatedProcessingTime: 120 },
      { documentType: 'invoice', amount: 10000, assignedTo: 'finance_manager', department: 'finance', priority: 7, estimatedProcessingTime: 60 },
      { documentType: 'invoice', assignedTo: 'ap_clerk', department: 'finance', priority: 5, estimatedProcessingTime: 30 }
    ]);
  }

  private startBatchProcessing(): void {
    // Process queued documents every 30 seconds
    setInterval(() => {
      this.processBatch();
    }, 30000);
  }

  private async processBatch(): Promise<void> {
    if (this.processingQueue.length > 0) {
      console.log(`📦 Processing batch of ${this.processingQueue.length} documents`);
      // Batch processing logic would go here
    }
  }

  // Public API methods
  getDocumentTemplates(): DocumentTemplate[] {
    return Array.from(this.documentTemplates.values());
  }

  getProcessingStats(): any {
    return {
      totalTemplates: this.documentTemplates.size,
      queueLength: this.processingQueue.length,
      learningDataPoints: Array.from(this.learningData.values()).reduce((sum, data) => sum + data.samples.length, 0)
    };
  }

  async batchProcessDocuments(documentPaths: string[]): Promise<DocumentProcessingResult[]> {
    const results: DocumentProcessingResult[] = [];
    
    for (const documentPath of documentPaths) {
      try {
        const result = await this.processDocument(documentPath);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process ${documentPath}:`, error);
      }
    }

    return results;
  }
}

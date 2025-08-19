"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIDocumentProcessor = void 0;
const warp_1 = require("@varld/warp");
const events_1 = require("events");
const openai_1 = require("openai");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let AIDocumentProcessor = class AIDocumentProcessor extends events_1.EventEmitter {
    openai;
    documentTemplates = new Map();
    processingQueue = [];
    routingRules = new Map();
    learningData = new Map();
    constructor() {
        super();
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY || ''
        });
        this.initializeDocumentTemplates();
        this.setupSmartRouting();
        this.startBatchProcessing();
    }
    initializeDocumentTemplates() {
        console.log('📄 Initializing Document Templates...');
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
    async processDocument(documentPath, documentType) {
        const startTime = Date.now();
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            console.log(`📋 Processing document: ${documentId}`);
            const ocrText = await this.extractTextFromDocument(documentPath);
            const classifiedType = documentType || await this.classifyDocument(ocrText);
            const extractedData = await this.extractStructuredData(ocrText, classifiedType);
            const validationResults = await this.validateExtractedData(extractedData, classifiedType);
            const suggestedActions = await this.generateSuggestedActions(extractedData, classifiedType, validationResults);
            await this.routeDocument(documentId, classifiedType, extractedData, suggestedActions);
            const processingTime = Date.now() - startTime;
            const confidence = this.calculateOverallConfidence(extractedData, validationResults);
            const result = {
                documentId,
                documentType: classifiedType,
                confidence,
                extractedData,
                validationResults,
                suggestedActions,
                processingTime,
                ocrText,
                structuredData: extractedData
            };
            await this.learnFromProcessing(result);
            this.emit('document_processed', result);
            return result;
        }
        catch (error) {
            console.error(`Error processing document ${documentId}:`, error);
            this.emit('document_processing_error', { documentId, error: error.message });
            throw error;
        }
    }
    async extractTextFromDocument(documentPath) {
        try {
            const fileExtension = path.extname(documentPath).toLowerCase();
            if (fileExtension === '.txt') {
                return fs.readFileSync(documentPath, 'utf8');
            }
            else {
                return this.simulateOCRExtraction(documentPath);
            }
        }
        catch (error) {
            throw new Error(`Failed to extract text from document: ${error.message}`);
        }
    }
    simulateOCRExtraction(documentPath) {
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
    async classifyDocument(ocrText) {
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
        }
        catch (error) {
            console.error('Document classification error:', error);
            return 'unknown';
        }
    }
    async extractStructuredData(ocrText, documentType) {
        const template = this.documentTemplates.get(`${documentType}-template`);
        let extractedData = {};
        if (template) {
            extractedData = this.extractUsingTemplate(ocrText, template);
        }
        const aiExtractedData = await this.extractUsingAI(ocrText, documentType);
        extractedData = { ...extractedData, ...aiExtractedData };
        const lineItems = await this.extractLineItems(ocrText);
        if (lineItems.length > 0) {
            extractedData.lineItems = lineItems;
        }
        return extractedData;
    }
    extractUsingTemplate(ocrText, template) {
        const data = {};
        for (const mapping of template.fieldMappings) {
            const regex = new RegExp(mapping.ocrPattern, 'i');
            const match = ocrText.match(regex);
            if (match && match[1]) {
                let value = match[1].trim();
                switch (mapping.dataType) {
                    case 'number':
                        value = parseFloat(value.replace(/,/g, '')) || 0;
                        break;
                    case 'currency':
                        value = parseFloat(value.replace(/[$,]/g, '')) || 0;
                        break;
                    case 'date':
                        value = new Date(value);
                        break;
                    case 'boolean':
                        value = /^(true|yes|1)$/i.test(value);
                        break;
                }
                data[mapping.fieldName] = value;
            }
            else if (mapping.required && mapping.defaultValue !== undefined) {
                data[mapping.fieldName] = mapping.defaultValue;
            }
        }
        return data;
    }
    async extractUsingAI(ocrText, documentType) {
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
            if (aiData.date)
                aiData.date = new Date(aiData.date);
            if (aiData.dueDate)
                aiData.dueDate = new Date(aiData.dueDate);
            return aiData;
        }
        catch (error) {
            console.error('AI extraction error:', error);
            return {};
        }
    }
    async extractLineItems(ocrText) {
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
        }
        catch (error) {
            console.error('Line item extraction error:', error);
            return [];
        }
    }
    async validateExtractedData(data, documentType) {
        const results = [];
        const template = this.documentTemplates.get(`${documentType}-template`);
        if (template) {
            for (const rule of template.validationRules) {
                const validation = this.evaluateValidationRule(rule, data);
                results.push(validation);
            }
        }
        const aiValidation = await this.aiValidateData(data, documentType);
        results.push(...aiValidation);
        return results;
    }
    evaluateValidationRule(rule, data) {
        try {
            const value = data[rule.field];
            const isValid = eval(rule.rule.replace(rule.field, JSON.stringify(value)));
            return {
                field: rule.field,
                isValid,
                confidence: 0.9,
                errorMessage: isValid ? undefined : rule.errorMessage,
                requiresHumanReview: rule.severity === 'error' && !isValid
            };
        }
        catch (error) {
            return {
                field: rule.field,
                isValid: false,
                confidence: 0.5,
                errorMessage: `Validation error: ${error.message}`,
                requiresHumanReview: true
            };
        }
    }
    async aiValidateData(data, documentType) {
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
        }
        catch (error) {
            console.error('AI validation error:', error);
            return [];
        }
    }
    async generateSuggestedActions(data, documentType, validationResults) {
        const actions = [];
        const hasErrors = validationResults.some(v => !v.isValid && v.requiresHumanReview);
        const totalAmount = data.totalAmount || 0;
        if (hasErrors) {
            actions.push({
                action: 'request_clarification',
                priority: 'high',
                reason: 'Document contains validation errors that require review',
                confidence: 0.9,
                estimatedTimeToComplete: 30,
                assignedTo: 'document_review_team'
            });
        }
        else if (documentType === 'invoice' && totalAmount > 10000) {
            actions.push({
                action: 'route_for_approval',
                priority: 'medium',
                reason: 'High-value invoice requires manager approval',
                confidence: 0.95,
                estimatedTimeToComplete: 60,
                assignedTo: 'finance_manager'
            });
        }
        else if (documentType === 'purchase_order') {
            actions.push({
                action: 'create_po',
                priority: 'medium',
                reason: 'Create purchase order record in system',
                confidence: 0.9,
                estimatedTimeToComplete: 15,
                assignedTo: 'procurement_team'
            });
        }
        else {
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
    async routeDocument(documentId, documentType, data, actions) {
        const routing = this.determineSmartRouting(documentType, data, actions);
        console.log(`🎯 Routing document ${documentId} to: ${routing.assignedTo} (${routing.department})`);
        this.emit('document_routed', {
            documentId,
            routing,
            estimatedProcessingTime: routing.estimatedProcessingTime
        });
    }
    determineSmartRouting(documentType, data, actions) {
        const totalAmount = data.totalAmount || 0;
        if (documentType === 'invoice') {
            if (totalAmount > 50000) {
                return {
                    documentType,
                    amount: totalAmount,
                    assignedTo: 'cfo',
                    department: 'finance',
                    priority: 9,
                    estimatedProcessingTime: 120
                };
            }
            else if (totalAmount > 10000) {
                return {
                    documentType,
                    amount: totalAmount,
                    assignedTo: 'finance_manager',
                    department: 'finance',
                    priority: 7,
                    estimatedProcessingTime: 60
                };
            }
        }
        else if (documentType === 'contract') {
            return {
                documentType,
                assignedTo: 'legal_team',
                department: 'legal',
                priority: 8,
                estimatedProcessingTime: 240
            };
        }
        return {
            documentType,
            assignedTo: 'document_processor',
            department: 'operations',
            priority: 5,
            estimatedProcessingTime: 30
        };
    }
    calculateOverallConfidence(data, validationResults) {
        const validationConfidence = validationResults.length > 0
            ? validationResults.reduce((sum, v) => sum + v.confidence, 0) / validationResults.length
            : 0.5;
        const dataCompleteness = this.calculateDataCompleteness(data);
        return (validationConfidence + dataCompleteness) / 2;
    }
    calculateDataCompleteness(data) {
        const totalFields = Object.keys(data).length;
        const populatedFields = Object.values(data).filter(v => v !== null && v !== undefined && v !== '').length;
        return totalFields > 0 ? populatedFields / totalFields : 0;
    }
    async learnFromProcessing(result) {
        const learningKey = `${result.documentType}_processing`;
        const existingData = this.learningData.get(learningKey) || { samples: [], patterns: [] };
        existingData.samples.push({
            confidence: result.confidence,
            processingTime: result.processingTime,
            validationResults: result.validationResults,
            extractedFields: Object.keys(result.extractedData)
        });
        if (existingData.samples.length > 100) {
            existingData.samples.shift();
        }
        this.learningData.set(learningKey, existingData);
    }
    createDocumentTemplate(template) {
        const fullTemplate = {
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
    setupSmartRouting() {
        this.routingRules.set('invoice', [
            { documentType: 'invoice', amount: 50000, assignedTo: 'cfo', department: 'finance', priority: 9, estimatedProcessingTime: 120 },
            { documentType: 'invoice', amount: 10000, assignedTo: 'finance_manager', department: 'finance', priority: 7, estimatedProcessingTime: 60 },
            { documentType: 'invoice', assignedTo: 'ap_clerk', department: 'finance', priority: 5, estimatedProcessingTime: 30 }
        ]);
    }
    startBatchProcessing() {
        setInterval(() => {
            this.processBatch();
        }, 30000);
    }
    async processBatch() {
        if (this.processingQueue.length > 0) {
            console.log(`📦 Processing batch of ${this.processingQueue.length} documents`);
        }
    }
    getDocumentTemplates() {
        return Array.from(this.documentTemplates.values());
    }
    getProcessingStats() {
        return {
            totalTemplates: this.documentTemplates.size,
            queueLength: this.processingQueue.length,
            learningDataPoints: Array.from(this.learningData.values()).reduce((sum, data) => sum + data.samples.length, 0)
        };
    }
    async batchProcessDocuments(documentPaths) {
        const results = [];
        for (const documentPath of documentPaths) {
            try {
                const result = await this.processDocument(documentPath);
                results.push(result);
            }
            catch (error) {
                console.error(`Failed to process ${documentPath}:`, error);
            }
        }
        return results;
    }
};
exports.AIDocumentProcessor = AIDocumentProcessor;
exports.AIDocumentProcessor = AIDocumentProcessor = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AIDocumentProcessor);
//# sourceMappingURL=AIDocumentProcessor.js.map
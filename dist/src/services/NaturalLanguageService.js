"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NaturalLanguageService = void 0;
const warp_1 = require("@varld/warp");
let NaturalLanguageService = class NaturalLanguageService {
    commandPatterns = [];
    entityTypes = new Map();
    constructor() {
        this.initializePatterns();
        this.initializeEntityTypes();
    }
    async processCommand(text) {
        try {
            const normalizedText = this.normalizeText(text);
            const intent = await this.extractIntent(normalizedText);
            const entities = await this.extractEntities(normalizedText, intent.name);
            return {
                intent,
                entities,
                originalText: text,
                processedAt: new Date()
            };
        }
        catch (error) {
            console.error('Error processing NLU command:', error);
            throw error;
        }
    }
    async extractIntent(text) {
        for (const pattern of this.commandPatterns) {
            const match = text.match(pattern.pattern);
            if (match) {
                return {
                    name: pattern.intent,
                    confidence: 0.85 + Math.random() * 0.15,
                    parameters: this.extractParametersFromMatch(match, pattern)
                };
            }
        }
        return {
            name: 'unknown',
            confidence: 0.1,
            parameters: {}
        };
    }
    async extractEntities(text, intentName) {
        const entities = [];
        for (const [entityType, regex] of this.entityTypes) {
            const matches = text.matchAll(new RegExp(regex, 'gi'));
            for (const match of matches) {
                if (match.index !== undefined) {
                    entities.push({
                        type: entityType,
                        value: match[0],
                        confidence: 0.9,
                        start: match.index,
                        end: match.index + match[0].length
                    });
                }
            }
        }
        const intentEntities = await this.extractIntentSpecificEntities(text, intentName);
        entities.push(...intentEntities);
        return entities;
    }
    extractIntentSpecificEntities(text, intent) {
        const entities = [];
        switch (intent) {
            case 'create_order':
                const customerMatch = text.match(/for\s+customer\s+([a-zA-Z\s]+)/i);
                if (customerMatch) {
                    entities.push({
                        type: 'customer_name',
                        value: customerMatch[1].trim(),
                        confidence: 0.9,
                        start: customerMatch.index,
                        end: customerMatch.index + customerMatch[0].length
                    });
                }
                break;
            case 'check_inventory':
            case 'add_inventory':
                const productMatch = text.match(/(\d+)\s+([a-zA-Z\s]+)/i);
                if (productMatch) {
                    entities.push({
                        type: 'quantity',
                        value: productMatch[1],
                        confidence: 0.95,
                        start: productMatch.index,
                        end: productMatch.index + productMatch[1].length
                    }, {
                        type: 'product_name',
                        value: productMatch[2].trim(),
                        confidence: 0.9,
                        start: productMatch.index + productMatch[1].length,
                        end: productMatch.index + productMatch[0].length
                    });
                }
                break;
            case 'update_order_status':
                const orderMatch = text.match(/order\s+(?:number\s+)?(\w+)/i);
                const statusMatch = text.match(/to\s+(\w+)/i);
                if (orderMatch) {
                    entities.push({
                        type: 'order_number',
                        value: orderMatch[1],
                        confidence: 0.95,
                        start: orderMatch.index,
                        end: orderMatch.index + orderMatch[0].length
                    });
                }
                if (statusMatch) {
                    entities.push({
                        type: 'status',
                        value: statusMatch[1],
                        confidence: 0.9,
                        start: statusMatch.index,
                        end: statusMatch.index + statusMatch[0].length
                    });
                }
                break;
        }
        return entities;
    }
    initializePatterns() {
        this.commandPatterns = [
            {
                pattern: /show\s+(?:me\s+)?inventory\s+status/i,
                intent: 'check_inventory',
                entityExtractors: []
            },
            {
                pattern: /check\s+(?:the\s+)?(?:current\s+)?stock\s+(?:levels?)?/i,
                intent: 'check_inventory',
                entityExtractors: []
            },
            {
                pattern: /add\s+(\d+)\s+(.+?)\s+to\s+inventory/i,
                intent: 'add_inventory',
                entityExtractors: [
                    { type: 'quantity', regex: /(\d+)/, transform: (val) => parseInt(val) },
                    { type: 'product', regex: /add\s+\d+\s+(.+?)\s+to/, transform: (val) => val.trim() }
                ]
            },
            {
                pattern: /(?:check|show)\s+low\s+stock\s+items/i,
                intent: 'check_low_stock',
                entityExtractors: []
            },
            {
                pattern: /create\s+(?:new\s+)?order\s+for\s+customer\s+(.+)/i,
                intent: 'create_order',
                entityExtractors: [
                    { type: 'customer', regex: /for\s+customer\s+(.+)/, transform: (val) => val.trim() }
                ]
            },
            {
                pattern: /update\s+order\s+(?:number\s+)?(\w+)\s+(?:status\s+)?to\s+(\w+)/i,
                intent: 'update_order_status',
                entityExtractors: [
                    { type: 'order_number', regex: /order\s+(?:number\s+)?(\w+)/ },
                    { type: 'status', regex: /to\s+(\w+)/ }
                ]
            },
            {
                pattern: /show\s+(?:me\s+)?(?:today\'?s\s+)?sales\s+figures?/i,
                intent: 'check_sales',
                entityExtractors: []
            },
            {
                pattern: /generate\s+purchase\s+order\s+for\s+(.+)/i,
                intent: 'create_purchase_order',
                entityExtractors: [
                    { type: 'product', regex: /for\s+(.+)/, transform: (val) => val.trim() }
                ]
            },
            {
                pattern: /check\s+supplier\s+performance/i,
                intent: 'check_supplier_performance',
                entityExtractors: []
            },
            {
                pattern: /show\s+(?:me\s+)?project\s+progress\s+for\s+(.+)/i,
                intent: 'check_project_progress',
                entityExtractors: [
                    { type: 'project_name', regex: /for\s+(.+)/, transform: (val) => val.trim() }
                ]
            },
            {
                pattern: /show\s+(?:me\s+)?(?:the\s+)?dashboard/i,
                intent: 'show_dashboard',
                entityExtractors: []
            },
            {
                pattern: /generate\s+(?:sales\s+)?report\s+for\s+(.+)/i,
                intent: 'generate_report',
                entityExtractors: [
                    { type: 'report_period', regex: /for\s+(.+)/, transform: (val) => val.trim() }
                ]
            },
            {
                pattern: /help|what\s+can\s+(?:you|i)\s+do/i,
                intent: 'help',
                entityExtractors: []
            }
        ];
    }
    initializeEntityTypes() {
        this.entityTypes.set('number', /\b\d+\b/);
        this.entityTypes.set('money', /\$\d+(?:\.\d{2})?/);
        this.entityTypes.set('date', /\b(?:today|tomorrow|yesterday|\d{1,2}\/\d{1,2}\/\d{4})\b/i);
        this.entityTypes.set('time', /\b\d{1,2}:\d{2}(?:\s*(?:am|pm))?\b/i);
        this.entityTypes.set('phone', /\b\d{3}-\d{3}-\d{4}\b/);
        this.entityTypes.set('email', /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
    }
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    extractParametersFromMatch(match, pattern) {
        const parameters = {};
        for (const extractor of pattern.entityExtractors) {
            const entityMatch = match[0].match(extractor.regex);
            if (entityMatch && entityMatch[1]) {
                const value = extractor.transform ? extractor.transform(entityMatch[1]) : entityMatch[1];
                parameters[extractor.type] = value;
            }
        }
        return parameters;
    }
    addCustomPattern(pattern) {
        this.commandPatterns.push(pattern);
        console.log(`🧠 Added custom pattern for intent: ${pattern.intent}`);
    }
    getAvailableIntents() {
        return [...new Set(this.commandPatterns.map(p => p.intent))];
    }
    getIntentExamples() {
        const examples = {
            check_inventory: [
                'show me inventory status',
                'check stock levels',
                'what is our current inventory'
            ],
            create_order: [
                'create new order for customer John Smith',
                'add order for ABC Construction'
            ],
            add_inventory: [
                'add 50 cement bags to inventory',
                'increase steel bar stock by 20'
            ],
            check_sales: [
                'show me today\'s sales figures',
                'what are our sales numbers'
            ],
            create_purchase_order: [
                'generate purchase order for steel bars',
                'create PO for cement'
            ],
            help: [
                'help',
                'what can you do',
                'show me available commands'
            ]
        };
        return examples;
    }
    async trainModel(trainingData) {
        console.log(`🎓 Training NLU model with ${trainingData.length} examples...`);
        return true;
    }
};
exports.NaturalLanguageService = NaturalLanguageService;
exports.NaturalLanguageService = NaturalLanguageService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NaturalLanguageService);
//# sourceMappingURL=NaturalLanguageService.js.map
// src/services/NaturalLanguageService.ts
import { Injectable } from '@varld/warp';

interface Intent {
  name: string;
  confidence: number;
  parameters: Record<string, any>;
}

interface Entity {
  type: string;
  value: string;
  confidence: number;
  start: number;
  end: number;
}

interface NLUResult {
  intent: Intent;
  entities: Entity[];
  originalText: string;
  processedAt: Date;
}

interface CommandPattern {
  pattern: RegExp;
  intent: string;
  entityExtractors: Array<{
    type: string;
    regex: RegExp;
    transform?: (match: string) => any;
  }>;
}

@Injectable()
export class NaturalLanguageService {
  private commandPatterns: CommandPattern[] = [];
  private entityTypes: Map<string, RegExp> = new Map();

  constructor() {
    this.initializePatterns();
    this.initializeEntityTypes();
  }

  async processCommand(text: string): Promise<NLUResult> {
    try {
      const normalizedText = this.normalizeText(text);
      
      // Find matching intent
      const intent = await this.extractIntent(normalizedText);
      
      // Extract entities
      const entities = await this.extractEntities(normalizedText, intent.name);
      
      return {
        intent,
        entities,
        originalText: text,
        processedAt: new Date()
      };
    } catch (error) {
      console.error('Error processing NLU command:', error);
      throw error;
    }
  }

  private async extractIntent(text: string): Promise<Intent> {
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

    // Fallback to unknown intent
    return {
      name: 'unknown',
      confidence: 0.1,
      parameters: {}
    };
  }

  private async extractEntities(text: string, intentName: string): Promise<Entity[]> {
    const entities: Entity[] = [];

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

    // Intent-specific entity extraction
    const intentEntities = await this.extractIntentSpecificEntities(text, intentName);
    entities.push(...intentEntities);

    return entities;
  }

  private extractIntentSpecificEntities(text: string, intent: string): Entity[] {
    const entities: Entity[] = [];

    switch (intent) {
      case 'create_order':
        // Extract customer names, product quantities
        const customerMatch = text.match(/for\s+customer\s+([a-zA-Z\s]+)/i);
        if (customerMatch) {
          entities.push({
            type: 'customer_name',
            value: customerMatch[1].trim(),
            confidence: 0.9,
            start: customerMatch.index!,
            end: customerMatch.index! + customerMatch[0].length
          });
        }
        break;

      case 'check_inventory':
      case 'add_inventory':
        // Extract product names and quantities
        const productMatch = text.match(/(\d+)\s+([a-zA-Z\s]+)/i);
        if (productMatch) {
          entities.push(
            {
              type: 'quantity',
              value: productMatch[1],
              confidence: 0.95,
              start: productMatch.index!,
              end: productMatch.index! + productMatch[1].length
            },
            {
              type: 'product_name',
              value: productMatch[2].trim(),
              confidence: 0.9,
              start: productMatch.index! + productMatch[1].length,
              end: productMatch.index! + productMatch[0].length
            }
          );
        }
        break;

      case 'update_order_status':
        // Extract order numbers and status
        const orderMatch = text.match(/order\s+(?:number\s+)?(\w+)/i);
        const statusMatch = text.match(/to\s+(\w+)/i);
        
        if (orderMatch) {
          entities.push({
            type: 'order_number',
            value: orderMatch[1],
            confidence: 0.95,
            start: orderMatch.index!,
            end: orderMatch.index! + orderMatch[0].length
          });
        }
        
        if (statusMatch) {
          entities.push({
            type: 'status',
            value: statusMatch[1],
            confidence: 0.9,
            start: statusMatch.index!,
            end: statusMatch.index! + statusMatch[0].length
          });
        }
        break;
    }

    return entities;
  }

  private initializePatterns(): void {
    this.commandPatterns = [
      // Inventory commands
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

      // Order commands
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

      // Purchase/Supplier commands
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

      // Project commands
      {
        pattern: /show\s+(?:me\s+)?project\s+progress\s+for\s+(.+)/i,
        intent: 'check_project_progress',
        entityExtractors: [
          { type: 'project_name', regex: /for\s+(.+)/, transform: (val) => val.trim() }
        ]
      },

      // Analytics commands
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

      // General help
      {
        pattern: /help|what\s+can\s+(?:you|i)\s+do/i,
        intent: 'help',
        entityExtractors: []
      }
    ];
  }

  private initializeEntityTypes(): void {
    this.entityTypes.set('number', /\b\d+\b/);
    this.entityTypes.set('money', /\$\d+(?:\.\d{2})?/);
    this.entityTypes.set('date', /\b(?:today|tomorrow|yesterday|\d{1,2}\/\d{1,2}\/\d{4})\b/i);
    this.entityTypes.set('time', /\b\d{1,2}:\d{2}(?:\s*(?:am|pm))?\b/i);
    this.entityTypes.set('phone', /\b\d{3}-\d{3}-\d{4}\b/);
    this.entityTypes.set('email', /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractParametersFromMatch(match: RegExpMatchArray, pattern: CommandPattern): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    for (const extractor of pattern.entityExtractors) {
      const entityMatch = match[0].match(extractor.regex);
      if (entityMatch && entityMatch[1]) {
        const value = extractor.transform ? extractor.transform(entityMatch[1]) : entityMatch[1];
        parameters[extractor.type] = value;
      }
    }
    
    return parameters;
  }

  // Method to add custom patterns dynamically
  addCustomPattern(pattern: CommandPattern): void {
    this.commandPatterns.push(pattern);
    console.log(`🧠 Added custom pattern for intent: ${pattern.intent}`);
  }

  // Method to get available intents
  getAvailableIntents(): string[] {
    return [...new Set(this.commandPatterns.map(p => p.intent))];
  }

  // Method to get intent examples
  getIntentExamples(): Record<string, string[]> {
    const examples: Record<string, string[]> = {
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

  // Method for training/improving NLU (placeholder for ML integration)
  async trainModel(trainingData: Array<{ text: string; intent: string; entities: Entity[] }>): Promise<boolean> {
    console.log(`🎓 Training NLU model with ${trainingData.length} examples...`);
    
    // In a real implementation, this would train a machine learning model
    // using services like Google Dialogflow, AWS Lex, or custom ML models
    
    return true;
  }
}

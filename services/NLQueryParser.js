// services/NLQueryParser.js
// Natural Language Query Parser for AI-powered dashboard interactions
// Understands simple questions and routes them to appropriate AI functions

class NLQueryParser {
    constructor() {
        this.isInitialized = false;
        this.patterns = [];
        this.stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
        ]);
        
        this.aliases = {
            'sales': ['revenue', 'income', 'earnings', 'orders'],
            'customers': ['clients', 'buyers', 'accounts'],
            'inventory': ['stock', 'products', 'items', 'materials'],
            'trends': ['patterns', 'changes', 'movement', 'direction'],
            'forecast': ['predict', 'projection', 'estimate', 'future'],
            'risk': ['danger', 'threat', 'concern', 'problem'],
            'churn': ['leave', 'lost', 'inactive', 'departure'],
            'top': ['best', 'highest', 'leading', 'maximum'],
            'bottom': ['worst', 'lowest', 'minimum'],
            'show': ['display', 'list', 'get', 'find', 'give'],
            'analysis': ['review', 'breakdown', 'summary', 'report']
        };
    }

    // Initialize the query parser
    async initialize() {
        try {
            console.log('🔍 Initializing Natural Language Query Parser...');
            
            // Register query patterns
            this.registerPatterns();
            
            this.isInitialized = true;
            console.log('✅ NL Query Parser initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize NL Query Parser:', error);
            return false;
        }
    }

    // Register query patterns and handlers
    registerPatterns() {
        // Sales and Revenue Queries
        this.addPattern({
            keywords: ['sales', 'revenue', 'trends'],
            intent: 'sales_forecast',
            confidence: 0.9,
            description: 'Sales forecasting and trend analysis'
        });

        this.addPattern({
            keywords: ['sales', 'performance'],
            intent: 'sales_analysis',
            confidence: 0.8,
            description: 'Sales performance analysis'
        });

        // Inventory Queries
        this.addPattern({
            keywords: ['inventory', 'stock', 'reorder'],
            intent: 'inventory_forecast',
            confidence: 0.9,
            description: 'Inventory demand prediction and reorder analysis'
        });

        this.addPattern({
            keywords: ['low', 'stock', 'inventory'],
            intent: 'low_stock_alert',
            confidence: 0.85,
            description: 'Low stock items identification'
        });

        this.addPattern({
            keywords: ['out', 'stock', 'shortage'],
            intent: 'stock_shortage',
            confidence: 0.9,
            description: 'Stock shortage analysis'
        });

        // Customer Queries
        this.addPattern({
            keywords: ['customer', 'churn', 'risk'],
            intent: 'customer_churn',
            confidence: 0.9,
            description: 'Customer churn risk analysis'
        });

        this.addPattern({
            keywords: ['customers', 'at', 'risk'],
            intent: 'customer_risk',
            confidence: 0.85,
            description: 'At-risk customer identification'
        });

        this.addPattern({
            keywords: ['top', 'customers'],
            intent: 'top_customers',
            confidence: 0.8,
            description: 'Top customer analysis'
        });

        // General Analytics
        this.addPattern({
            keywords: ['insights', 'analysis'],
            intent: 'general_insights',
            confidence: 0.7,
            description: 'General business insights'
        });

        this.addPattern({
            keywords: ['dashboard', 'overview'],
            intent: 'dashboard_summary',
            confidence: 0.75,
            description: 'Dashboard overview and summary'
        });

        // Workflow Queries
        this.addPattern({
            keywords: ['workflow', 'automation', 'rules'],
            intent: 'workflow_status',
            confidence: 0.8,
            description: 'Workflow automation status'
        });

        this.addPattern({
            keywords: ['orders', 'delayed', 'overdue'],
            intent: 'delayed_orders',
            confidence: 0.85,
            description: 'Delayed order analysis'
        });

        // Time-based queries
        this.addPattern({
            keywords: ['today', 'performance'],
            intent: 'today_summary',
            confidence: 0.8,
            description: 'Today\'s performance summary'
        });

        this.addPattern({
            keywords: ['this', 'month', 'week'],
            intent: 'period_summary',
            confidence: 0.75,
            description: 'Period performance summary'
        });
    }

    // Add a query pattern
    addPattern(pattern) {
        this.patterns.push({
            id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            ...pattern,
            createdAt: new Date().toISOString()
        });
    }

    // Parse a natural language query
    async parseQuery(queryText) {
        if (!this.isInitialized) {
            return {
                success: false,
                error: 'Parser not initialized',
                query: queryText
            };
        }

        try {
            // Normalize the query
            const normalizedQuery = this.normalizeQuery(queryText);
            
            // Extract keywords
            const keywords = this.extractKeywords(normalizedQuery);
            
            // Match against patterns
            const matches = this.matchPatterns(keywords);
            
            // Classify intent
            const classification = this.classifyIntent(matches, keywords);
            
            // Extract parameters
            const parameters = this.extractParameters(normalizedQuery, keywords);
            
            return {
                success: true,
                query: queryText,
                normalizedQuery,
                keywords,
                intent: classification.intent,
                confidence: classification.confidence,
                description: classification.description,
                parameters,
                matches: matches.slice(0, 3), // Top 3 matches
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error parsing query:', error);
            return {
                success: false,
                error: error.message,
                query: queryText
            };
        }
    }

    // Normalize query text
    normalizeQuery(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    // Extract keywords from normalized query
    extractKeywords(normalizedQuery) {
        const words = normalizedQuery.split(' ');
        const keywords = [];
        
        words.forEach(word => {
            if (word.length > 2 && !this.stopWords.has(word)) {
                // Add the word itself
                keywords.push(word);
                
                // Add aliases
                Object.entries(this.aliases).forEach(([key, aliases]) => {
                    if (aliases.includes(word)) {
                        keywords.push(key);
                    }
                });
            }
        });
        
        return [...new Set(keywords)]; // Remove duplicates
    }

    // Match keywords against patterns
    matchPatterns(keywords) {
        const matches = [];
        
        this.patterns.forEach(pattern => {
            let matchCount = 0;
            const matchedKeywords = [];
            
            pattern.keywords.forEach(patternKeyword => {
                if (keywords.includes(patternKeyword)) {
                    matchCount++;
                    matchedKeywords.push(patternKeyword);
                }
            });
            
            if (matchCount > 0) {
                const matchScore = matchCount / pattern.keywords.length;
                const adjustedConfidence = pattern.confidence * matchScore;
                
                matches.push({
                    pattern,
                    matchCount,
                    matchScore,
                    matchedKeywords,
                    confidence: adjustedConfidence
                });
            }
        });
        
        // Sort by confidence descending
        return matches.sort((a, b) => b.confidence - a.confidence);
    }

    // Classify intent from matches
    classifyIntent(matches, keywords) {
        if (matches.length === 0) {
            return {
                intent: 'unknown',
                confidence: 0,
                description: 'Unable to understand the query'
            };
        }
        
        const topMatch = matches[0];
        
        return {
            intent: topMatch.pattern.intent,
            confidence: topMatch.confidence,
            description: topMatch.pattern.description
        };
    }

    // Extract parameters from query
    extractParameters(normalizedQuery, keywords) {
        const parameters = {};
        
        // Time period detection
        if (normalizedQuery.includes('today')) {
            parameters.timePeriod = 'today';
        } else if (normalizedQuery.includes('yesterday')) {
            parameters.timePeriod = 'yesterday';
        } else if (normalizedQuery.includes('this week')) {
            parameters.timePeriod = 'week';
        } else if (normalizedQuery.includes('this month')) {
            parameters.timePeriod = 'month';
        } else if (normalizedQuery.includes('this year')) {
            parameters.timePeriod = 'year';
        }
        
        // Number detection
        const numbers = normalizedQuery.match(/\b\d+\b/g);
        if (numbers) {
            parameters.numbers = numbers.map(n => parseInt(n));
        }
        
        // Top/bottom detection
        if (normalizedQuery.includes('top') && numbers) {
            parameters.limit = parseInt(numbers[0]);
            parameters.sort = 'desc';
        } else if (normalizedQuery.includes('bottom') && numbers) {
            parameters.limit = parseInt(numbers[0]);
            parameters.sort = 'asc';
        }
        
        // Specific entity detection
        if (keywords.includes('customers') || keywords.includes('customer')) {
            parameters.entity = 'customers';
        } else if (keywords.includes('products') || keywords.includes('inventory')) {
            parameters.entity = 'products';
        } else if (keywords.includes('orders')) {
            parameters.entity = 'orders';
        }
        
        return parameters;
    }

    // Get suggestions for incomplete queries
    getSuggestions(partialQuery) {
        const normalizedPartial = this.normalizeQuery(partialQuery);
        const suggestions = [];
        
        // Common query templates
        const templates = [
            'show me sales trends',
            'what are the sales forecasts',
            'which customers are at risk',
            'show inventory that needs reordering',
            'what items are low in stock',
            'show top 10 customers',
            'analyze customer churn risk',
            'show delayed orders',
            'what is today\'s performance',
            'show workflow automation status'
        ];
        
        templates.forEach(template => {
            if (template.toLowerCase().includes(normalizedPartial) || 
                normalizedPartial === '' || 
                normalizedPartial.length < 3) {
                suggestions.push({
                    query: template,
                    category: this.categorizeTemplate(template)
                });
            }
        });
        
        return suggestions.slice(0, 5); // Top 5 suggestions
    }

    categorizeTemplate(template) {
        if (template.includes('sales') || template.includes('revenue')) return 'Sales';
        if (template.includes('customer') || template.includes('churn')) return 'Customers';
        if (template.includes('inventory') || template.includes('stock')) return 'Inventory';
        if (template.includes('order')) return 'Orders';
        if (template.includes('workflow')) return 'Automation';
        return 'General';
    }

    // Get parser statistics
    getStats() {
        return {
            initialized: this.isInitialized,
            totalPatterns: this.patterns.length,
            patternsByIntent: this.patterns.reduce((acc, pattern) => {
                acc[pattern.intent] = (acc[pattern.intent] || 0) + 1;
                return acc;
            }, {}),
            stopWordsCount: this.stopWords.size,
            aliasesCount: Object.keys(this.aliases).length
        };
    }

    // Test query parsing
    testQuery(query) {
        console.log('Testing query:', query);
        return this.parseQuery(query);
    }

    // Add custom pattern
    addCustomPattern(keywords, intent, confidence = 0.8, description = '') {
        this.addPattern({
            keywords: Array.isArray(keywords) ? keywords : [keywords],
            intent,
            confidence,
            description: description || `Custom pattern for ${intent}`
        });
    }
}

// Export the parser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NLQueryParser;
} else if (typeof window !== 'undefined') {
    window.NLQueryParser = NLQueryParser;
}

// services/QueryRouter.js
// Query Router for routing natural language queries to appropriate AI services
// Formats responses into user-friendly answers

class QueryRouter {
    constructor(aiAnalyticsService, workflowEngine, nlQueryParser) {
        this.aiService = aiAnalyticsService;
        this.workflowEngine = workflowEngine;
        this.nlParser = nlQueryParser;
        this.isInitialized = false;
        this.handlers = new Map();
    }

    // Initialize the query router
    async initialize() {
        try {
            console.log('🚀 Initializing Query Router...');
            
            // Register query handlers
            this.registerHandlers();
            
            this.isInitialized = true;
            console.log('✅ Query Router initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Query Router:', error);
            return false;
        }
    }

    // Register all query handlers
    registerHandlers() {
        // Sales handlers (to be implemented)
        this.handlers.set('sales_forecast', this.handleSalesForecast.bind(this));
        this.handlers.set('sales_analysis', this.handleSalesAnalysis.bind(this));
        
        // Inventory handlers (to be implemented)
        this.handlers.set('inventory_forecast', this.handleInventoryForecast.bind(this));
        this.handlers.set('low_stock_alert', this.handleLowStockAlert.bind(this));
        this.handlers.set('stock_shortage', this.handleStockShortage.bind(this));
        
        // Customer handlers (to be implemented)
        this.handlers.set('customer_churn', this.handleCustomerChurn.bind(this));
        this.handlers.set('customer_risk', this.handleCustomerRisk.bind(this));
        this.handlers.set('top_customers', this.handleTopCustomers.bind(this));
        
        // General handlers
        this.handlers.set('general_insights', this.handleGeneralInsights.bind(this));
        this.handlers.set('dashboard_summary', this.handleDashboardSummary.bind(this));
        this.handlers.set('workflow_status', this.handleWorkflowStatus.bind(this));
        this.handlers.set('unknown', this.handleUnknownQuery.bind(this));
    }

    // Process a natural language query
    async processQuery(queryText, context = {}) {
        if (!this.isInitialized) {
            return this.formatError('Query Router not initialized');
        }

        try {
            // Parse the query
            const parseResult = await this.nlParser.parseQuery(queryText);
            
            if (!parseResult.success) {
                return this.formatError('Could not understand the query', parseResult.error);
            }

            // Get the appropriate handler
            const handler = this.handlers.get(parseResult.intent) || this.handlers.get('unknown');
            
            // Execute the handler
            const result = await handler(parseResult, context);
            
            return {
                success: true,
                query: queryText,
                intent: parseResult.intent,
                confidence: parseResult.confidence,
                response: result,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error processing query:', error);
            return this.formatError('Error processing query', error.message);
        }
    }

    // Sales query handlers
    async handleSalesForecast(parseResult, context) {
        if (!this.aiService || !this.aiService.isInitialized) {
            return this.formatResponse(
                'AI Service Unavailable',
                'AI Analytics service is not available for sales forecasting.',
                'warning',
                { type: 'service_error', service: 'AI Analytics' }
            );
        }

        try {
            // Get historical sales data from context or generate sample data
            const historicalData = context.salesData || this.generateSampleSalesData();
            
            // Determine forecast period from parameters
            const forecastDays = parseResult.parameters?.numbers?.[0] || 30;
            
            // Call AI service for sales forecasting
            const forecast = await this.aiService.forecastSales(historicalData, forecastDays);
            
            if (forecast.forecast.length === 0) {
                return this.formatResponse(
                    'Insufficient Data',
                    forecast.insights[0] || 'Unable to generate sales forecast with available data.',
                    'warning',
                    {
                        type: 'data_insufficient',
                        metadata: forecast.metadata
                    }
                );
            }
            
            // Format the response
            const trendEmoji = this.getTrendEmoji(forecast.trend);
            const confidenceLevel = this.getConfidenceLevel(forecast.confidence);
            
            let message = `${trendEmoji} Sales trend: **${forecast.trend.replace('_', ' ')}** (${confidenceLevel} confidence)\n`;
            message += `📊 ${forecastDays}-day forecast shows ${forecast.forecast.length} data points\n`;
            message += `📈 Average daily sales: $${forecast.metadata.averageDailySales}`;
            
            return this.formatResponse(
                'Sales Forecast',
                message,
                'success',
                {
                    type: 'sales_forecast',
                    forecast: forecast.forecast.slice(0, 10), // First 10 days for display
                    trend: forecast.trend,
                    confidence: forecast.confidence,
                    insights: forecast.insights,
                    metadata: forecast.metadata,
                    chartData: this.formatForecastForChart(forecast.forecast)
                }
            );
            
        } catch (error) {
            console.error('Error in sales forecast handler:', error);
            return this.formatResponse(
                'Forecast Error',
                'Unable to generate sales forecast at this time.',
                'error',
                { type: 'processing_error', error: error.message }
            );
        }
    }

    async handleSalesAnalysis(parseResult, context) {
        if (!this.aiService || !this.aiService.isInitialized) {
            return this.formatResponse(
                'AI Service Unavailable',
                'AI Analytics service is not available for sales analysis.',
                'warning',
                { type: 'service_error', service: 'AI Analytics' }
            );
        }

        try {
            // Get sales data and perform analysis
            const salesData = context.salesData || this.generateSampleSalesData();
            const timePeriod = parseResult.parameters?.timePeriod || 'month';
            
            // Analyze sales performance
            const analysis = this.analyzeSalesPerformance(salesData, timePeriod);
            
            let message = `📊 **Sales Performance Analysis** (${timePeriod})\n`;
            message += `💰 Total Revenue: $${analysis.totalRevenue.toLocaleString()}\n`;
            message += `📦 Total Orders: ${analysis.totalOrders}\n`;
            message += `💳 Average Order Value: $${analysis.avgOrderValue}\n`;
            message += `📈 Growth Rate: ${analysis.growthRate}%`;
            
            return this.formatResponse(
                'Sales Performance',
                message,
                'success',
                {
                    type: 'sales_analysis',
                    analysis,
                    timePeriod,
                    chartData: {
                        revenue: analysis.dailyRevenue,
                        orders: analysis.dailyOrders,
                        trends: analysis.trends
                    }
                }
            );
            
        } catch (error) {
            console.error('Error in sales analysis handler:', error);
            return this.formatResponse(
                'Analysis Error',
                'Unable to analyze sales performance at this time.',
                'error',
                { type: 'processing_error', error: error.message }
            );
        }
    }

    async handleInventoryForecast(parseResult, context) {
        if (!this.aiService || !this.aiService.isInitialized) {
            return this.formatResponse(
                'AI Service Unavailable',
                'AI Analytics service is not available for inventory forecasting.',
                'warning',
                { type: 'service_error', service: 'AI Analytics' }
            );
        }

        try {
            // Get inventory data from context or generate sample data
            const inventoryData = context.inventoryData || this.generateSampleInventoryData();
            const productId = parseResult.parameters?.productId || inventoryData[0]?.id;
            
            if (!productId) {
                return this.formatResponse(
                    'No Product Specified',
                    'Please specify a product for inventory forecasting.',
                    'warning',
                    { type: 'missing_parameter', parameter: 'productId' }
                );
            }

            // Generate historical inventory data for the product
            const historicalData = this.generateInventoryHistory(productId);
            
            // Call AI service for inventory demand prediction
            const prediction = await this.aiService.predictInventoryDemand(productId, historicalData, 30);
            
            if (prediction.predictedDemand === 0) {
                return this.formatResponse(
                    'Insufficient Data',
                    prediction.insights[0] || 'Unable to generate inventory forecast with available data.',
                    'warning',
                    {
                        type: 'data_insufficient',
                        productId,
                        metadata: prediction.metadata
                    }
                );
            }

            // Format the response
            const riskEmoji = this.getStockRiskEmoji(prediction.stockoutRisk);
            const trendEmoji = this.getTrendEmoji(prediction.metadata.trend);
            
            let message = `${riskEmoji} **${productId}** - ${prediction.stockoutRisk} stock risk\n`;
            message += `📦 Current Stock: ${prediction.currentStock} units\n`;
            message += `📈 Predicted Demand (30 days): ${prediction.predictedDemand} units\n`;
            message += `⏰ Days until reorder: ${prediction.daysUntilReorder || 'N/A'}\n`;
            message += `🎯 Recommended reorder point: ${prediction.recommendedReorderPoint} units`;
            
            return this.formatResponse(
                'Inventory Demand Forecast',
                message,
                'success',
                {
                    type: 'inventory_forecast',
                    productId,
                    prediction,
                    chartData: this.formatInventoryForChart(prediction.forecast)
                }
            );
            
        } catch (error) {
            console.error('Error in inventory forecast handler:', error);
            return this.formatResponse(
                'Forecast Error',
                'Unable to generate inventory forecast at this time.',
                'error',
                { type: 'processing_error', error: error.message }
            );
        }
    }

    async handleLowStockAlert(parseResult, context) {
        try {
            // Get inventory data
            const inventoryData = context.inventoryData || this.generateSampleInventoryData();
            
            // Find items with low stock
            const lowStockItems = inventoryData.filter(item => {
                const currentStock = item.stock || item.currentStock || 0;
                const reorderPoint = item.reorderPoint || 10;
                return currentStock <= reorderPoint;
            });
            
            if (lowStockItems.length === 0) {
                return this.formatResponse(
                    'Stock Levels Good',
                    '✅ All inventory items are above their reorder points.',
                    'success',
                    {
                        type: 'low_stock_alert',
                        lowStockCount: 0,
                        totalItems: inventoryData.length
                    }
                );
            }
            
            // Sort by urgency (lowest stock ratio first)
            lowStockItems.sort((a, b) => {
                const ratioA = (a.stock || a.currentStock) / (a.reorderPoint || 10);
                const ratioB = (b.stock || b.currentStock) / (b.reorderPoint || 10);
                return ratioA - ratioB;
            });
            
            const criticalItems = lowStockItems.filter(item => 
                (item.stock || item.currentStock) === 0
            ).length;
            
            let message = `🚨 **${lowStockItems.length} items need attention**\n`;
            if (criticalItems > 0) {
                message += `❌ ${criticalItems} items are out of stock\n`;
            }
            message += `⚠️ ${lowStockItems.length - criticalItems} items below reorder point\n\n`;
            
            // Show top 5 most urgent items
            message += '**Most urgent items:**\n';
            lowStockItems.slice(0, 5).forEach((item, index) => {
                const stock = item.stock || item.currentStock || 0;
                const status = stock === 0 ? '❌ OUT OF STOCK' : `⚠️ ${stock} units left`;
                message += `${index + 1}. ${item.name} - ${status}\n`;
            });
            
            return this.formatResponse(
                'Low Stock Alert',
                message,
                lowStockItems.length > criticalItems ? 'warning' : 'error',
                {
                    type: 'low_stock_alert',
                    lowStockItems: lowStockItems.slice(0, 10),
                    criticalCount: criticalItems,
                    totalLowStock: lowStockItems.length,
                    recommendations: this.generateStockRecommendations(lowStockItems)
                }
            );
            
        } catch (error) {
            console.error('Error in low stock alert handler:', error);
            return this.formatResponse(
                'Alert Error',
                'Unable to check stock levels at this time.',
                'error',
                { type: 'processing_error', error: error.message }
            );
        }
    }

    async handleStockShortage(parseResult, context) {
        try {
            // Get inventory and sales data
            const inventoryData = context.inventoryData || this.generateSampleInventoryData();
            const salesData = context.salesData || this.generateSampleSalesData();
            
            // Analyze stock shortage patterns
            const shortageAnalysis = this.analyzeStockShortages(inventoryData, salesData);
            
            let message = `📊 **Stock Shortage Analysis**\n`;
            message += `🚨 Items at risk: ${shortageAnalysis.itemsAtRisk}\n`;
            message += `📉 Stockout frequency: ${shortageAnalysis.stockoutFrequency}%\n`;
            message += `💰 Potential lost sales: $${shortageAnalysis.potentialLostSales.toLocaleString()}\n`;
            message += `⏱️ Average shortage duration: ${shortageAnalysis.avgShortageDuration} days`;
            
            const riskLevel = shortageAnalysis.itemsAtRisk > 5 ? 'high' : 
                             shortageAnalysis.itemsAtRisk > 2 ? 'medium' : 'low';
            
            return this.formatResponse(
                'Stock Shortage Analysis',
                message,
                riskLevel === 'high' ? 'error' : riskLevel === 'medium' ? 'warning' : 'info',
                {
                    type: 'stock_shortage',
                    analysis: shortageAnalysis,
                    riskLevel,
                    recommendations: this.generateShortageRecommendations(shortageAnalysis)
                }
            );
            
        } catch (error) {
            console.error('Error in stock shortage handler:', error);
            return this.formatResponse(
                'Analysis Error',
                'Unable to analyze stock shortages at this time.',
                'error',
                { type: 'processing_error', error: error.message }
            );
        }
    }

    async handleCustomerChurn(parseResult, context) {
        if (!this.aiService || !this.aiService.isInitialized) {
            return this.formatResponse(
                'AI Service Unavailable',
                'AI Analytics service is not available for customer analysis.',
                'warning',
                { type: 'service_error', service: 'AI Analytics' }
            );
        }

        try {
            // Get customer data from context or generate sample data
            const customerData = context.customerData || this.generateSampleCustomerData();
            const salesData = context.salesData || this.generateSampleSalesData();
            
            // Call AI service for churn analysis
            const churnAnalysis = await this.aiService.analyzeCustomerChurn(customerData, salesData);
            
            if (!churnAnalysis || churnAnalysis.customers.length === 0) {
                return this.formatResponse(
                    'No Churn Analysis Available',
                    'Unable to perform customer churn analysis with available data.',
                    'warning',
                    {
                        type: 'data_insufficient',
                        metadata: churnAnalysis?.metadata || {}
                    }
                );
            }
            
            // Calculate high-risk customers
            const highRiskCustomers = churnAnalysis.customers.filter(c => c.churnRisk === 'high').length;
            const mediumRiskCustomers = churnAnalysis.customers.filter(c => c.churnRisk === 'medium').length;
            
            let message = `🎯 **Customer Churn Risk Analysis**\n`;
            message += `🔴 High risk customers: ${highRiskCustomers}\n`;
            message += `🟡 Medium risk customers: ${mediumRiskCustomers}\n`;
            message += `📊 Overall churn rate: ${Math.round(churnAnalysis.overallChurnRate * 100)}%\n`;
            message += `💰 Potential revenue at risk: $${churnAnalysis.potentialLostRevenue.toLocaleString()}`;
            
            return this.formatResponse(
                'Customer Churn Analysis',
                message,
                highRiskCustomers > 0 ? 'warning' : 'success',
                {
                    type: 'customer_churn',
                    analysis: churnAnalysis,
                    highRiskCount: highRiskCustomers,
                    mediumRiskCount: mediumRiskCustomers,
                    recommendations: this.generateChurnRecommendations(churnAnalysis)
                }
            );
            
        } catch (error) {
            console.error('Error in customer churn handler:', error);
            return this.formatResponse(
                'Churn Analysis Error',
                'Unable to analyze customer churn at this time.',
                'error',
                { type: 'processing_error', error: error.message }
            );
        }
    }

    async handleCustomerRisk(parseResult, context) {
        try {
            // Get customer and sales data
            const customerData = context.customerData || this.generateSampleCustomerData();
            const salesData = context.salesData || this.generateSampleSalesData();
            
            // Analyze customer risk factors
            const riskAnalysis = this.analyzeCustomerRisk(customerData, salesData);
            
            const atRiskCustomers = riskAnalysis.customers.filter(c => 
                c.riskFactors.paymentDelay || c.riskFactors.decreasingOrders || c.riskFactors.priceDisputes
            ).length;
            
            let message = `⚠️ **Customer Risk Assessment**\n`;
            message += `🚨 Customers with risk factors: ${atRiskCustomers}\n`;
            message += `💳 Payment delays detected: ${riskAnalysis.riskSummary.paymentDelays}\n`;
            message += `📉 Decreasing order patterns: ${riskAnalysis.riskSummary.decreasingOrders}\n`;
            message += `💰 Total outstanding: $${riskAnalysis.riskSummary.totalOutstanding.toLocaleString()}`;
            
            return this.formatResponse(
                'Customer Risk Analysis',
                message,
                atRiskCustomers > 5 ? 'warning' : 'success',
                {
                    type: 'customer_risk',
                    analysis: riskAnalysis,
                    atRiskCount: atRiskCustomers,
                    recommendations: this.generateRiskRecommendations(riskAnalysis)
                }
            );
            
        } catch (error) {
            console.error('Error in customer risk handler:', error);
            return this.formatResponse(
                'Risk Analysis Error',
                'Unable to analyze customer risk at this time.',
                'error',
                { type: 'processing_error', error: error.message }
            );
        }
    }

    async handleTopCustomers(parseResult, context) {
        try {
            // Get customer and sales data
            const customerData = context.customerData || this.generateSampleCustomerData();
            const salesData = context.salesData || this.generateSampleSalesData();
            
            // Extract metric type from parameters (revenue, frequency, loyalty)
            const metric = parseResult.parameters?.metric || 'revenue';
            const topCount = parseResult.parameters?.numbers?.[0] || 10;
            
            // Analyze top customers by specified metric
            const topCustomers = this.analyzeTopCustomers(customerData, salesData, metric, topCount);
            
            let message = `🏆 **Top ${topCount} Customers by ${metric}**\n`;
            topCustomers.slice(0, 5).forEach((customer, index) => {
                const metricValue = metric === 'revenue' ? `$${customer.totalRevenue.toLocaleString()}` :
                                  metric === 'frequency' ? `${customer.orderCount} orders` :
                                  `${customer.loyaltyScore}% loyalty`;
                message += `${index + 1}. ${customer.name} - ${metricValue}\n`;
            });
            
            const totalRevenue = topCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);
            message += `\n💰 Combined revenue: $${totalRevenue.toLocaleString()}`;
            
            return this.formatResponse(
                'Top Customers Analysis',
                message,
                'success',
                {
                    type: 'top_customers',
                    customers: topCustomers,
                    metric,
                    totalRevenue,
                    insights: this.generateTopCustomerInsights(topCustomers, metric)
                }
            );
            
        } catch (error) {
            console.error('Error in top customers handler:', error);
            return this.formatResponse(
                'Top Customers Error',
                'Unable to analyze top customers at this time.',
                'error',
                { type: 'processing_error', error: error.message }
            );
        }
    }

    async handleGeneralInsights(parseResult, context) {
        return this.formatResponse(
            'General Business Insights',
            'Here are some general insights about your business performance.',
            'info',
            {
                type: 'general',
                insights: [
                    'AI services are now active and analyzing your data',
                    'Workflow automation is handling routine processes',
                    'Natural language queries are being processed successfully'
                ]
            }
        );
    }

    async handleDashboardSummary(parseResult, context) {
        return this.formatResponse(
            'Dashboard Overview',
            'Here\'s a summary of your current dashboard status.',
            'info',
            {
                type: 'dashboard',
                summary: {
                    aiServicesStatus: 'Active',
                    workflowEngineStatus: 'Running',
                    queryParserStatus: 'Ready'
                }
            }
        );
    }

    async handleWorkflowStatus(parseResult, context) {
        if (this.workflowEngine) {
            const status = this.workflowEngine.getStatus();
            return this.formatResponse(
                'Workflow Automation Status',
                `Workflow engine is ${status.enabled ? 'enabled' : 'disabled'} with ${status.totalRules} rules configured.`,
                'info',
                {
                    type: 'workflow_status',
                    status
                }
            );
        }
        
        return this.formatResponse(
            'Workflow Status',
            'Workflow engine is not available.',
            'warning',
            { type: 'error', message: 'Workflow engine not initialized' }
        );
    }

    async handleUnknownQuery(parseResult, context) {
        const suggestions = this.nlParser.getSuggestions(parseResult.query);
        
        return this.formatResponse(
            'Query Not Understood',
            `I couldn't understand "${parseResult.query}". Here are some suggestions:`,
            'warning',
            {
                type: 'suggestions',
                originalQuery: parseResult.query,
                suggestions: suggestions.map(s => s.query)
            }
        );
    }

    // Response formatting utilities
    formatResponse(title, message, type = 'info', data = {}) {
        return {
            title,
            message,
            type, // info, success, warning, error
            data,
            timestamp: new Date().toISOString()
        };
    }

    formatError(message, details = null) {
        return {
            success: false,
            error: message,
            details,
            timestamp: new Date().toISOString()
        };
    }

    // Get router status
    getStatus() {
        return {
            initialized: this.isInitialized,
            handlersCount: this.handlers.size,
            availableIntents: Array.from(this.handlers.keys()),
            servicesConnected: {
                aiService: !!this.aiService,
                workflowEngine: !!this.workflowEngine,
                nlParser: !!this.nlParser
            }
        };
    }

    // Test query processing
    async testQuery(query) {
        console.log('Testing query:', query);
        const result = await this.processQuery(query);
        console.log('Result:', result);
        return result;
    }

    // Helper methods for sales analysis
    generateSampleSalesData() {
        const salesData = [];
        const now = new Date();
        
        // Generate 60 days of sample sales data
        for (let i = 60; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Skip some days randomly (weekends, holidays)
            if (Math.random() < 0.2) continue;
            
            // Generate 1-5 orders per day
            const ordersCount = Math.floor(Math.random() * 5) + 1;
            
            for (let j = 0; j < ordersCount; j++) {
                const orderValue = Math.floor(Math.random() * 2000) + 200; // $200-$2200
                
                salesData.push({
                    id: `ORD${Date.now()}_${i}_${j}`,
                    date: date.toISOString(),
                    total: orderValue,
                    customerId: `CUST${Math.floor(Math.random() * 10) + 1}`,
                    status: 'completed'
                });
            }
        }
        
        return salesData;
    }

    analyzeSalesPerformance(salesData, timePeriod) {
        const now = new Date();
        let startDate = new Date(now);
        
        // Set start date based on time period
        switch (timePeriod) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1);
        }
        
        // Filter sales data for the period
        const periodSales = salesData.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= now;
        });
        
        // Calculate metrics
        const totalRevenue = periodSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
        const totalOrders = periodSales.length;
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
        
        // Calculate daily metrics for trends
        const dailyMetrics = this.calculateDailyMetrics(periodSales);
        
        // Calculate growth rate (compare with previous period)
        const prevPeriodStart = new Date(startDate);
        const periodLength = now.getTime() - startDate.getTime();
        prevPeriodStart.setTime(startDate.getTime() - periodLength);
        
        const prevPeriodSales = salesData.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= prevPeriodStart && saleDate < startDate;
        });
        
        const prevRevenue = prevPeriodSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
        const growthRate = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;
        
        return {
            totalRevenue: Math.round(totalRevenue),
            totalOrders,
            avgOrderValue,
            growthRate,
            dailyRevenue: dailyMetrics.revenue,
            dailyOrders: dailyMetrics.orders,
            trends: {
                revenue: this.calculateTrend(dailyMetrics.revenue),
                orders: this.calculateTrend(dailyMetrics.orders)
            },
            period: {
                start: startDate.toISOString(),
                end: now.toISOString(),
                type: timePeriod
            }
        };
    }

    calculateDailyMetrics(salesData) {
        const dailyData = {};
        
        salesData.forEach(sale => {
            const dateKey = new Date(sale.date).toDateString();
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { revenue: 0, orders: 0 };
            }
            dailyData[dateKey].revenue += parseFloat(sale.total);
            dailyData[dateKey].orders += 1;
        });
        
        const sortedDays = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
        
        return {
            revenue: sortedDays.map(day => dailyData[day].revenue),
            orders: sortedDays.map(day => dailyData[day].orders),
            dates: sortedDays
        };
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, idx) => sum + (idx * val), 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    getTrendEmoji(trend) {
        const trendEmojis = {
            'strong_growth': '🚀',
            'growth': '📈',
            'stable': '🟡',
            'decline': '📉',
            'strong_decline': '🔴'
        };
        return trendEmojis[trend] || '📄';
    }

    getConfidenceLevel(confidence) {
        if (confidence > 0.8) return 'high';
        if (confidence > 0.6) return 'medium';
        return 'low';
    }

    formatForecastForChart(forecast) {
        return {
            labels: forecast.map(f => new Date(f.date).toLocaleDateString()),
            datasets: [{
                label: 'Predicted Sales',
                data: forecast.map(f => f.predictedAmount),
                confidence: forecast.map(f => f.confidence)
            }]
        };
    }

    // Helper methods for inventory analysis
    generateSampleInventoryData() {
        const categories = ['Lumber', 'Concrete', 'Roofing', 'Electrical', 'Plumbing', 'Insulation', 'Drywall', 'Flooring'];
        const inventoryData = [];
        
        categories.forEach((category, categoryIndex) => {
            // Generate 5-8 items per category
            const itemsInCategory = Math.floor(Math.random() * 4) + 5;
            
            for (let i = 1; i <= itemsInCategory; i++) {
                const id = `${category.slice(0, 3).toUpperCase()}${String(i).padStart(3, '0')}`;
                const baseStock = Math.floor(Math.random() * 200) + 50; // 50-250 base stock
                const currentStock = Math.floor(baseStock * (0.3 + Math.random() * 0.7)); // 30-100% of base
                const reorderPoint = Math.floor(baseStock * 0.2); // 20% of base stock
                
                inventoryData.push({
                    id,
                    name: `${category} Item ${i}`,
                    category,
                    currentStock,
                    stock: currentStock, // Alternative field name
                    reorderPoint,
                    price: Math.floor(Math.random() * 200) + 20,
                    supplier: `Supplier ${String.fromCharCode(65 + (categoryIndex % 5))}`, // A, B, C, D, E
                    location: `Warehouse ${Math.floor(Math.random() * 3) + 1}`
                });
            }
        });
        
        return inventoryData;
    }

    generateInventoryHistory(productId) {
        const historyData = [];
        const now = new Date();
        
        // Generate 12 weeks of inventory history
        for (let weeks = 12; weeks >= 0; weeks--) {
            const date = new Date(now);
            date.setDate(date.getDate() - (weeks * 7));
            
            // Simulate inventory levels with usage and restocking
            const weekInCycle = weeks % 8; // 8-week restock cycle
            let stockLevel;
            
            if (weekInCycle === 0) {
                // Restocking week
                stockLevel = Math.floor(Math.random() * 50) + 150; // 150-200
            } else {
                // Gradual decrease
                const cycleProgress = weekInCycle / 8;
                stockLevel = Math.floor(200 - (cycleProgress * 120) + (Math.random() * 20 - 10));
            }
            
            const usage = Math.floor(Math.random() * 20) + 10; // 10-30 usage per week
            
            historyData.push({
                productId,
                date: date.toISOString(),
                stockLevel: Math.max(0, stockLevel),
                currentStock: Math.max(0, stockLevel),
                usage,
                reorderPoint: 25,
                leadTime: Math.floor(Math.random() * 7) + 7, // 7-14 days
                category: 'General'
            });
        }
        
        return historyData;
    }

    getStockRiskEmoji(risk) {
        const riskEmojis = {
            'high': '🔴',
            'medium': '🟡', 
            'low': '🟢',
            'unknown': '⚪'
        };
        return riskEmojis[risk] || '⚪';
    }

    generateStockRecommendations(lowStockItems) {
        const recommendations = [];
        
        const criticalItems = lowStockItems.filter(item => (item.stock || item.currentStock) === 0);
        const warningItems = lowStockItems.filter(item => (item.stock || item.currentStock) > 0);
        
        if (criticalItems.length > 0) {
            recommendations.push(`Immediate action: Order ${criticalItems.length} out-of-stock items urgently`);
            recommendations.push('Consider expedited shipping for critical items');
        }
        
        if (warningItems.length > 0) {
            recommendations.push(`Schedule orders for ${warningItems.length} items approaching reorder point`);
        }
        
        recommendations.push('Review reorder points for frequently low-stock items');
        recommendations.push('Consider safety stock increases for high-demand products');
        
        return recommendations;
    }

    analyzeStockShortages(inventoryData, salesData) {
        // Simulate shortage analysis
        const totalItems = inventoryData.length;
        const itemsAtRisk = inventoryData.filter(item => {
            const stock = item.stock || item.currentStock || 0;
            const reorder = item.reorderPoint || 10;
            return stock <= reorder * 1.5; // Within 150% of reorder point
        }).length;
        
        // Simulate historical shortage data
        const stockoutFrequency = Math.min(100, Math.round((itemsAtRisk / totalItems) * 100 * 1.5));
        
        // Estimate potential lost sales based on current sales patterns
        const avgDailySales = salesData.length > 0 
            ? salesData.reduce((sum, sale) => sum + parseFloat(sale.total), 0) / salesData.length
            : 1000;
        
        const potentialLostSales = Math.round(avgDailySales * stockoutFrequency * 0.1); // 10% impact factor
        
        const avgShortageDuration = Math.floor(Math.random() * 5) + 3; // 3-8 days
        
        return {
            totalItems,
            itemsAtRisk,
            stockoutFrequency,
            potentialLostSales,
            avgShortageDuration,
            riskCategories: {
                critical: itemsAtRisk > totalItems * 0.3,
                moderate: itemsAtRisk > totalItems * 0.15,
                manageable: itemsAtRisk <= totalItems * 0.15
            }
        };
    }

    generateShortageRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.riskCategories.critical) {
            recommendations.push('🚨 CRITICAL: Immediate inventory review and emergency restocking required');
            recommendations.push('Consider implementing automated reordering system');
        } else if (analysis.riskCategories.moderate) {
            recommendations.push('⚠️ Review inventory policies and supplier lead times');
            recommendations.push('Increase safety stock levels for high-risk items');
        } else {
            recommendations.push('✅ Inventory management is performing well');
            recommendations.push('Continue monitoring trends and seasonal patterns');
        }
        
        recommendations.push('Implement demand forecasting for better planning');
        recommendations.push('Consider diversifying suppliers to reduce risk');
        
        if (analysis.potentialLostSales > 5000) {
            recommendations.push(`💰 Focus on high-impact items (potential $${analysis.potentialLostSales.toLocaleString()} in lost sales)`);
        }
        
        return recommendations;
    }

    formatInventoryForChart(forecast) {
        if (!forecast || forecast.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }
        
        return {
            labels: forecast.map(f => new Date(f.date).toLocaleDateString()),
            datasets: [{
                label: 'Predicted Usage',
                data: forecast.map(f => f.predictedUsage || 0),
                type: 'line'
            }]
        };
    }

    // Helper methods for customer analysis
    generateSampleCustomerData() {
        const companyTypes = ['Construction', 'General Contractor', 'Electrical', 'Plumbing', 'Roofing', 'HVAC'];
        const customerData = [];
        
        for (let i = 1; i <= 25; i++) {
            const companyType = companyTypes[Math.floor(Math.random() * companyTypes.length)];
            const joinDate = new Date();
            joinDate.setDate(joinDate.getDate() - Math.floor(Math.random() * 1825)); // 0-5 years ago
            
            // Simulate customer behavior patterns
            const lastOrderDate = new Date();
            lastOrderDate.setDate(lastOrderDate.getDate() - Math.floor(Math.random() * 90)); // Last order 0-90 days ago
            
            const paymentDays = Math.floor(Math.random() * 60); // 0-60 days payment terms
            const creditLimit = Math.floor(Math.random() * 50000) + 10000; // $10K-$60K
            
            customerData.push({
                id: `CUST${String(i).padStart(3, '0')}`,
                name: `${companyType} Co ${i}`,
                type: companyType,
                email: `contact${i}@${companyType.toLowerCase().replace(' ', '')}co.com`,
                phone: `555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                address: `${Math.floor(Math.random() * 9999)} ${companyType} St, City ${i}`,
                joinDate: joinDate.toISOString(),
                lastOrderDate: lastOrderDate.toISOString(),
                creditLimit,
                paymentTerms: paymentDays,
                status: Math.random() > 0.1 ? 'active' : 'inactive',
                totalOrders: Math.floor(Math.random() * 50) + 1,
                totalRevenue: Math.floor(Math.random() * 100000) + 5000,
                averageOrderValue: Math.floor(Math.random() * 5000) + 500,
                paymentHistory: Math.random() > 0.2 ? 'good' : Math.random() > 0.5 ? 'fair' : 'poor'
            });
        }
        
        return customerData;
    }

    analyzeCustomerRisk(customerData, salesData) {
        const riskAnalysis = {
            customers: [],
            riskSummary: {
                paymentDelays: 0,
                decreasingOrders: 0,
                priceDisputes: 0,
                totalOutstanding: 0
            }
        };
        
        customerData.forEach(customer => {
            // Simulate risk factors
            const hasPaymentDelay = customer.paymentHistory === 'poor' || Math.random() < 0.15;
            const hasDecreasingOrders = Math.random() < 0.2; // 20% chance of decreasing pattern
            const hasPriceDisputes = Math.random() < 0.1; // 10% chance of disputes
            const outstandingAmount = hasPaymentDelay ? Math.floor(Math.random() * 10000) : 0;
            
            // Calculate risk score
            let riskScore = 0;
            if (hasPaymentDelay) riskScore += 40;
            if (hasDecreasingOrders) riskScore += 30;
            if (hasPriceDisputes) riskScore += 20;
            if (customer.status === 'inactive') riskScore += 10;
            
            const riskLevel = riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low';
            
            riskAnalysis.customers.push({
                ...customer,
                riskScore,
                riskLevel,
                outstandingAmount,
                riskFactors: {
                    paymentDelay: hasPaymentDelay,
                    decreasingOrders: hasDecreasingOrders,
                    priceDisputes: hasPriceDisputes,
                    inactive: customer.status === 'inactive'
                }
            });
            
            // Update summary
            if (hasPaymentDelay) riskAnalysis.riskSummary.paymentDelays++;
            if (hasDecreasingOrders) riskAnalysis.riskSummary.decreasingOrders++;
            if (hasPriceDisputes) riskAnalysis.riskSummary.priceDisputes++;
            riskAnalysis.riskSummary.totalOutstanding += outstandingAmount;
        });
        
        return riskAnalysis;
    }

    analyzeTopCustomers(customerData, salesData, metric = 'revenue', topCount = 10) {
        // Calculate customer metrics from sales data
        const customerMetrics = customerData.map(customer => {
            // Get customer's sales
            const customerSales = salesData.filter(sale => sale.customerId === customer.id);
            
            const totalRevenue = customerSales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0) || customer.totalRevenue || 0;
            const orderCount = customerSales.length || customer.totalOrders || 0;
            
            // Calculate loyalty score based on recency, frequency, and monetary value
            const daysSinceLastOrder = customer.lastOrderDate 
                ? Math.floor((new Date() - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24))
                : 999;
            
            const recencyScore = Math.max(0, 100 - (daysSinceLastOrder / 365 * 100)); // 0-100
            const frequencyScore = Math.min(100, (orderCount / 50) * 100); // 0-100
            const monetaryScore = Math.min(100, (totalRevenue / 100000) * 100); // 0-100
            
            const loyaltyScore = Math.round((recencyScore + frequencyScore + monetaryScore) / 3);
            
            return {
                ...customer,
                totalRevenue: Math.round(totalRevenue),
                orderCount,
                loyaltyScore,
                daysSinceLastOrder,
                averageOrderValue: orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0
            };
        });
        
        // Sort by the specified metric
        let sortedCustomers;
        switch (metric) {
            case 'frequency':
                sortedCustomers = customerMetrics.sort((a, b) => b.orderCount - a.orderCount);
                break;
            case 'loyalty':
                sortedCustomers = customerMetrics.sort((a, b) => b.loyaltyScore - a.loyaltyScore);
                break;
            case 'revenue':
            default:
                sortedCustomers = customerMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
        }
        
        return sortedCustomers.slice(0, topCount);
    }

    generateChurnRecommendations(churnAnalysis) {
        const recommendations = [];
        const highRiskCount = churnAnalysis.customers.filter(c => c.churnRisk === 'high').length;
        
        if (highRiskCount > 0) {
            recommendations.push(`🎯 Immediate outreach to ${highRiskCount} high-risk customers`);
            recommendations.push('📞 Schedule personal calls with at-risk accounts');
            recommendations.push('🎁 Consider loyalty incentives or special offers');
        }
        
        if (churnAnalysis.overallChurnRate > 0.15) {
            recommendations.push('📊 Review customer satisfaction surveys');
            recommendations.push('💰 Analyze pricing competitiveness');
        }
        
        recommendations.push('🔄 Implement regular check-in schedule with key accounts');
        recommendations.push('📈 Track customer engagement metrics more closely');
        recommendations.push('🎯 Develop win-back campaigns for inactive customers');
        
        if (churnAnalysis.potentialLostRevenue > 50000) {
            recommendations.push(`💸 High-value focus: $${churnAnalysis.potentialLostRevenue.toLocaleString()} at risk`);
        }
        
        return recommendations;
    }

    generateRiskRecommendations(riskAnalysis) {
        const recommendations = [];
        
        if (riskAnalysis.riskSummary.paymentDelays > 0) {
            recommendations.push(`💳 Review payment terms for ${riskAnalysis.riskSummary.paymentDelays} customers`);
            recommendations.push('📋 Consider requiring deposits for high-risk accounts');
        }
        
        if (riskAnalysis.riskSummary.decreasingOrders > 0) {
            recommendations.push(`📉 Investigate declining order patterns (${riskAnalysis.riskSummary.decreasingOrders} customers)`);
            recommendations.push('🎯 Proactive outreach to understand changing needs');
        }
        
        if (riskAnalysis.riskSummary.totalOutstanding > 0) {
            recommendations.push(`💰 Collections focus: $${riskAnalysis.riskSummary.totalOutstanding.toLocaleString()} outstanding`);
            recommendations.push('📞 Prioritize follow-up on overdue accounts');
        }
        
        recommendations.push('🔍 Implement credit monitoring for high-risk customers');
        recommendations.push('📊 Regular risk assessment reviews (monthly)');
        
        return recommendations;
    }

    generateTopCustomerInsights(topCustomers, metric) {
        const insights = [];
        
        if (topCustomers.length === 0) {
            insights.push('No customer data available for analysis');
            return insights;
        }
        
        const top3Revenue = topCustomers.slice(0, 3).reduce((sum, c) => sum + c.totalRevenue, 0);
        const totalRevenue = topCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);
        const top3Percentage = totalRevenue > 0 ? Math.round((top3Revenue / totalRevenue) * 100) : 0;
        
        insights.push(`Top 3 customers represent ${top3Percentage}% of selected group revenue`);
        
        const avgOrderValue = topCustomers.reduce((sum, c) => sum + c.averageOrderValue, 0) / topCustomers.length;
        insights.push(`Average order value: $${Math.round(avgOrderValue).toLocaleString()}`);
        
        const activeCustomers = topCustomers.filter(c => c.daysSinceLastOrder < 60).length;
        insights.push(`${activeCustomers} customers ordered within last 60 days`);
        
        if (metric === 'loyalty') {
            const avgLoyalty = topCustomers.reduce((sum, c) => sum + c.loyaltyScore, 0) / topCustomers.length;
            insights.push(`Average loyalty score: ${Math.round(avgLoyalty)}%`);
        }
        
        return insights;
    }

// Export the router
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QueryRouter;
} else if (typeof window !== 'undefined') {
    window.QueryRouter = QueryRouter;
}

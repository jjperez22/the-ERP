// services/AIAnalyticsService.js
// Basic AI Analytics Service for Construction ERP
// Provides foundation for predictive analytics and automation

class AIAnalyticsService {
    constructor() {
        this.isInitialized = false;
        this.models = {
            salesForecasting: null,
            inventoryDemand: null,
            customerChurn: null
        };
        this.config = {
            enabled: true,
            forecastPeriod: 90, // days
            confidenceThreshold: 0.7,
            automationEnabled: true
        };
        this.historicalData = {
            sales: [],
            inventory: [],
            customers: [],
            orders: []
        };
    }

    // Initialize the AI service
    async initialize() {
        try {
            console.log('🤖 Initializing AI Analytics Service...');
            
            // Load configuration from localStorage if available
            this.loadConfiguration();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ AI Analytics Service initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize AI Analytics Service:', error);
            return false;
        }
    }

    // Load AI configuration from storage
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('aiAnalyticsConfig');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
        } catch (error) {
            console.warn('Could not load AI configuration:', error);
        }
    }

    // Save AI configuration to storage
    saveConfiguration() {
        try {
            localStorage.setItem('aiAnalyticsConfig', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Could not save AI configuration:', error);
        }
    }

    // Data preprocessing utilities
    preprocessData(data, dataType) {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        switch (dataType) {
            case 'sales':
                return this.preprocessSalesData(data);
            case 'inventory':
                return this.preprocessInventoryData(data);
            case 'customers':
                return this.preprocessCustomerData(data);
            default:
                return data;
        }
    }

    preprocessSalesData(salesData) {
        // Clean and normalize sales data
        return salesData.map(record => ({
            date: new Date(record.date),
            amount: parseFloat(record.total) || 0,
            customerId: record.customerId,
            items: record.items || [],
            category: record.category || 'General'
        })).sort((a, b) => a.date - b.date);
    }

    preprocessInventoryData(inventoryData) {
        // Clean and normalize inventory data
        return inventoryData.map(record => ({
            productId: record.id,
            name: record.name,
            currentStock: parseInt(record.stock) || 0,
            reorderPoint: parseInt(record.reorderPoint) || 0,
            category: record.category,
            supplier: record.supplier,
            lastUpdated: new Date(record.lastUpdated || Date.now())
        }));
    }

    preprocessCustomerData(customerData) {
        // Clean and normalize customer data
        return customerData.map(customer => ({
            id: customer.id,
            name: customer.name,
            type: customer.type || 'Individual',
            totalOrders: parseInt(customer.totalOrders) || 0,
            totalRevenue: parseFloat(customer.totalRevenue) || 0,
            lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : null,
            status: customer.status || 'Active'
        }));
    }

    // Utility functions for statistical analysis
    calculateMovingAverage(data, window = 7) {
        const result = [];
        for (let i = window - 1; i < data.length; i++) {
            const windowData = data.slice(i - window + 1, i + 1);
            const average = windowData.reduce((sum, val) => sum + val, 0) / window;
            result.push(average);
        }
        return result;
    }

    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        const n = data.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = data.reduce((sum, val) => sum + val, 0);
        const sumXY = data.reduce((sum, val, idx) => sum + (idx * val), 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    calculateSeasonality(data, period = 30) {
        // Simple seasonal decomposition
        const seasonal = [];
        for (let i = 0; i < period; i++) {
            const seasonalData = [];
            for (let j = i; j < data.length; j += period) {
                seasonalData.push(data[j]);
            }
            const seasonalAverage = seasonalData.reduce((sum, val) => sum + val, 0) / seasonalData.length;
            seasonal.push(seasonalAverage);
        }
        return seasonal;
    }

    // Generate date range for forecasting
    generateDateRange(startDate, days) {
        const dates = [];
        const current = new Date(startDate);
        for (let i = 0; i < days; i++) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    // Sales forecasting using moving averages and trend analysis
    async forecastSales(historicalData, forecastDays = 30) {
        if (!this.isInitialized || !this.config.enabled) {
            return this.getEmptyForecast('Service not initialized or disabled');
        }

        try {
            // Preprocess the historical data
            const processedData = this.preprocessData(historicalData, 'sales');
            if (processedData.length < 14) {
                return this.getEmptyForecast('Insufficient historical data (need at least 14 days)');
            }

            // Aggregate daily sales totals
            const dailySales = this.aggregateDailySales(processedData);
            const salesAmounts = dailySales.map(day => day.amount);
            
            // Calculate different moving averages
            const shortTermMA = this.calculateMovingAverage(salesAmounts, 7);   // 7-day
            const mediumTermMA = this.calculateMovingAverage(salesAmounts, 14);  // 14-day
            const longTermMA = this.calculateMovingAverage(salesAmounts, 30);   // 30-day
            
            // Calculate trend
            const trendSlope = this.calculateTrend(salesAmounts.slice(-30)); // Last 30 days trend
            const trendDirection = this.interpretTrend(trendSlope);
            
            // Detect seasonality
            const seasonality = this.calculateSeasonality(salesAmounts, 7); // Weekly patterns
            
            // Generate forecast
            const forecast = this.generateSalesForecast({
                dailySales,
                shortTermMA,
                mediumTermMA,
                longTermMA,
                trendSlope,
                seasonality,
                forecastDays
            });
            
            // Calculate confidence based on data consistency
            const confidence = this.calculateForecastConfidence(salesAmounts, forecast);
            
            // Generate insights
            const insights = this.generateSalesInsights({
                trendDirection,
                confidence,
                dailySales,
                forecast,
                seasonality
            });
            
            return {
                forecast,
                confidence: Math.round(confidence * 100) / 100,
                trend: trendDirection,
                insights,
                metadata: {
                    historicalDays: dailySales.length,
                    forecastDays,
                    trendSlope: Math.round(trendSlope * 100) / 100,
                    averageDailySales: Math.round(salesAmounts.reduce((sum, val) => sum + val, 0) / salesAmounts.length)
                }
            };
            
        } catch (error) {
            console.error('Error in sales forecasting:', error);
            return this.getEmptyForecast('Error occurred during forecasting');
        }
    }

    async predictInventoryDemand(productId, inventoryHistoryData = [], forecastDays = 30) {
        if (!this.isInitialized || !this.config.enabled) {
            return this.getEmptyInventoryPrediction('Service not initialized or disabled');
        }

        try {
            // Filter data for specific product
            const productHistory = inventoryHistoryData.filter(record => 
                record.productId === productId || record.id === productId
            );
            
            if (productHistory.length < 7) {
                return this.getEmptyInventoryPrediction('Insufficient historical data (need at least 7 records)');
            }

            // Get current inventory levels
            const latestRecord = productHistory[productHistory.length - 1];
            const currentStock = latestRecord.currentStock || latestRecord.stockLevel || 0;
            const reorderPoint = latestRecord.reorderPoint || 0;
            const leadTime = latestRecord.leadTime || 7; // Default 7 days
            
            // Calculate historical usage patterns
            const usageData = this.calculateHistoricalUsage(productHistory);
            const { avgDailyUsage, seasonalPattern, trend } = usageData;
            
            // Predict future demand
            const demandForecast = this.calculateInventoryDemandForecast({
                avgDailyUsage,
                seasonalPattern,
                trend,
                forecastDays,
                leadTime
            });
            
            // Calculate optimal reorder point and date
            const reorderAnalysis = this.calculateOptimalReorder({
                currentStock,
                reorderPoint,
                avgDailyUsage,
                leadTime,
                demandForecast,
                seasonalPattern
            });
            
            // Calculate confidence based on data consistency
            const confidence = this.calculateInventoryConfidence(productHistory, demandForecast);
            
            // Generate insights
            const insights = this.generateInventoryInsights({
                currentStock,
                reorderPoint,
                avgDailyUsage,
                demandForecast,
                reorderAnalysis,
                confidence,
                trend
            });
            
            return {
                productId,
                currentStock,
                predictedDemand: Math.round(demandForecast.totalDemand),
                avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
                reorderDate: reorderAnalysis.reorderDate,
                recommendedReorderPoint: reorderAnalysis.optimalReorderPoint,
                stockoutRisk: reorderAnalysis.stockoutRisk,
                daysUntilReorder: reorderAnalysis.daysUntilReorder,
                confidence: Math.round(confidence * 100) / 100,
                insights,
                forecast: demandForecast.dailyForecast,
                metadata: {
                    historicalRecords: productHistory.length,
                    forecastDays,
                    leadTime,
                    trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'
                }
            };
            
        } catch (error) {
            console.error('Error in inventory demand prediction:', error);
            return this.getEmptyInventoryPrediction('Error occurred during prediction');
        }
    }

    async analyzeCustomerChurn(customerId = null, customerHistoryData = [], salesHistoryData = []) {
        if (!this.isInitialized || !this.config.enabled) {
            return this.getEmptyChurnAnalysis('Service not initialized or disabled');
        }

        try {
            // If specific customer, analyze just that one; otherwise analyze all
            const customersToAnalyze = customerId 
                ? customerHistoryData.filter(c => c.customerId === customerId || c.id === customerId)
                : customerHistoryData;

            if (customersToAnalyze.length === 0) {
                return this.getEmptyChurnAnalysis('No customer data available for analysis');
            }

            const results = [];

            for (const customerData of customersToAnalyze) {
                const customerAnalysis = await this.analyzeIndividualCustomer(
                    customerData, 
                    salesHistoryData
                );
                results.push(customerAnalysis);
            }

            // If analyzing single customer, return that result
            if (customerId) {
                return results[0] || this.getEmptyChurnAnalysis('Customer not found');
            }

            // For multiple customers, return summary with risk distribution
            return this.summarizeChurnAnalysis(results);

        } catch (error) {
            console.error('Error in customer churn analysis:', error);
            return this.getEmptyChurnAnalysis('Error occurred during churn analysis');
        }
    }

    async analyzeIndividualCustomer(customerData, salesHistoryData) {
        const customerId = customerData.customerId || customerData.id;
        
        // Get customer's order history
        const customerOrders = salesHistoryData.filter(order => 
            order.customerId === customerId
        ).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate key metrics
        const metrics = this.calculateCustomerMetrics(customerData, customerOrders);
        
        // Calculate churn risk score (0-100)
        const churnScore = this.calculateChurnScore(metrics);
        
        // Determine risk level
        const riskLevel = this.determineRiskLevel(churnScore);
        
        // Identify key risk factors
        const riskFactors = this.identifyRiskFactors(metrics);
        
        // Generate actionable insights
        const insights = this.generateChurnInsights(metrics, riskLevel, riskFactors);

        return {
            customerId,
            customerName: customerData.name || 'Unknown',
            churnRisk: riskLevel,
            churnScore: Math.round(churnScore),
            factors: riskFactors,
            insights,
            metrics: {
                totalOrders: metrics.totalOrders,
                totalRevenue: Math.round(metrics.totalRevenue * 100) / 100,
                avgOrderValue: Math.round(metrics.avgOrderValue * 100) / 100,
                daysSinceLastOrder: metrics.daysSinceLastOrder,
                orderFrequency: Math.round(metrics.orderFrequency * 100) / 100,
                paymentScore: metrics.paymentScore,
                engagementTrend: metrics.engagementTrend
            },
            recommendations: this.generateChurnRecommendations(riskLevel, riskFactors, metrics)
        };
    }

    // Get AI service status
    getStatus() {
        return {
            initialized: this.isInitialized,
            enabled: this.config.enabled,
            modelsLoaded: Object.keys(this.models).filter(key => this.models[key] !== null).length,
            lastUpdate: new Date().toISOString()
        };
    }

    // Enable/disable AI features
    setEnabled(enabled) {
        this.config.enabled = enabled;
        this.saveConfiguration();
        console.log(`🤖 AI Analytics ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Supporting methods for sales forecasting
    aggregateDailySales(salesData) {
        const dailyTotals = new Map();
        
        salesData.forEach(sale => {
            const dateKey = sale.date.toDateString();
            const existing = dailyTotals.get(dateKey) || { date: sale.date, amount: 0, count: 0 };
            existing.amount += sale.amount;
            existing.count += 1;
            dailyTotals.set(dateKey, existing);
        });
        
        return Array.from(dailyTotals.values()).sort((a, b) => a.date - b.date);
    }

    interpretTrend(slope) {
        if (slope > 5) return 'strong_growth';
        if (slope > 1) return 'growth';
        if (slope > -1) return 'stable';
        if (slope > -5) return 'decline';
        return 'strong_decline';
    }

    generateSalesForecast({ dailySales, shortTermMA, mediumTermMA, longTermMA, trendSlope, seasonality, forecastDays }) {
        const forecast = [];
        const lastDate = dailySales[dailySales.length - 1].date;
        const lastShortMA = shortTermMA[shortTermMA.length - 1] || 0;
        const lastMediumMA = mediumTermMA[mediumTermMA.length - 1] || 0;
        
        // Base forecast value (weighted average of moving averages)
        const baseValue = (lastShortMA * 0.5) + (lastMediumMA * 0.3) + (trendSlope * 0.2);
        
        for (let i = 1; i <= forecastDays; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setDate(forecastDate.getDate() + i);
            
            // Apply trend
            const trendAdjustment = trendSlope * i;
            
            // Apply seasonality (weekly pattern)
            const dayOfWeek = forecastDate.getDay();
            const seasonalMultiplier = seasonality[dayOfWeek % seasonality.length] || 1;
            const avgSeasonal = seasonality.reduce((sum, val) => sum + val, 0) / seasonality.length;
            const seasonalAdjustment = (seasonalMultiplier / avgSeasonal) - 1;
            
            // Calculate forecast value
            let forecastValue = baseValue + trendAdjustment;
            forecastValue = forecastValue * (1 + (seasonalAdjustment * 0.2)); // Reduce seasonal impact
            
            // Add some randomness but keep it realistic
            const randomFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5%
            forecastValue = Math.max(0, forecastValue * randomFactor);
            
            forecast.push({
                date: forecastDate.toISOString(),
                predictedAmount: Math.round(forecastValue * 100) / 100,
                confidence: Math.max(0.3, 0.9 - (i / forecastDays) * 0.4), // Confidence decreases over time
                dayOfWeek: dayOfWeek
            });
        }
        
        return forecast;
    }

    calculateForecastConfidence(historicalAmounts, forecast) {
        if (historicalAmounts.length < 7 || forecast.length === 0) {
            return 0.3;
        }
        
        // Calculate coefficient of variation for historical data
        const mean = historicalAmounts.reduce((sum, val) => sum + val, 0) / historicalAmounts.length;
        const variance = historicalAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalAmounts.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / mean;
        
        // Lower variation = higher confidence
        const baseConfidence = Math.max(0.3, Math.min(0.95, 1 - coefficientOfVariation));
        
        // Adjust based on data volume
        const volumeBonus = Math.min(0.1, historicalAmounts.length / 1000);
        
        return Math.min(0.95, baseConfidence + volumeBonus);
    }

    generateSalesInsights({ trendDirection, confidence, dailySales, forecast, seasonality }) {
        const insights = [];
        
        // Trend insights
        const trendMessages = {
            'strong_growth': 'Sales are experiencing strong growth. Consider increasing inventory and expanding capacity.',
            'growth': 'Sales are growing steadily. Monitor inventory levels to meet increasing demand.',
            'stable': 'Sales are stable with minimal fluctuation. Focus on maintaining current performance.',
            'decline': 'Sales are declining. Consider promotional activities or market analysis.',
            'strong_decline': 'Sales are declining significantly. Immediate action may be required to address market conditions.'
        };
        
        insights.push(trendMessages[trendDirection] || 'Unable to determine trend direction.');
        
        // Confidence insights
        if (confidence > 0.8) {
            insights.push('High confidence in forecast accuracy based on consistent historical patterns.');
        } else if (confidence > 0.6) {
            insights.push('Moderate confidence in forecast. Monitor actual results and adjust strategies as needed.');
        } else {
            insights.push('Low confidence in forecast due to volatile historical data. Use predictions cautiously.');
        }
        
        // Recent performance
        const recentSales = dailySales.slice(-7);
        const recentAvg = recentSales.reduce((sum, day) => sum + day.amount, 0) / recentSales.length;
        const overallAvg = dailySales.reduce((sum, day) => sum + day.amount, 0) / dailySales.length;
        
        if (recentAvg > overallAvg * 1.1) {
            insights.push('Recent sales performance is above average, indicating positive momentum.');
        } else if (recentAvg < overallAvg * 0.9) {
            insights.push('Recent sales performance is below average. Consider investigating potential causes.');
        }
        
        // Forecast insights
        const forecastTotal = forecast.reduce((sum, day) => sum + day.predictedAmount, 0);
        const historicalAvg = dailySales.slice(-30).reduce((sum, day) => sum + day.amount, 0) / Math.min(30, dailySales.length);
        const forecastAvg = forecastTotal / forecast.length;
        
        if (forecastAvg > historicalAvg * 1.05) {
            insights.push(`Forecast indicates ${Math.round(((forecastAvg / historicalAvg) - 1) * 100)}% increase in average daily sales.`);
        } else if (forecastAvg < historicalAvg * 0.95) {
            insights.push(`Forecast indicates ${Math.round((1 - (forecastAvg / historicalAvg)) * 100)}% decrease in average daily sales.`);
        } else {
            insights.push('Forecast indicates sales will remain relatively stable.');
        }
        
        return insights;
    }

    getEmptyForecast(reason) {
        return {
            forecast: [],
            confidence: 0,
            trend: 'unknown',
            insights: [reason],
            metadata: {
                historicalDays: 0,
                forecastDays: 0,
                trendSlope: 0,
                averageDailySales: 0
            }
        };
    }

    // Supporting methods for inventory demand prediction
    calculateHistoricalUsage(productHistory) {
        // Sort by date
        const sortedHistory = productHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate daily usage from stock level changes
        const usageData = [];
        for (let i = 1; i < sortedHistory.length; i++) {
            const current = sortedHistory[i];
            const previous = sortedHistory[i - 1];
            
            // Calculate usage (stock decrease plus any restocking)
            let usage = (previous.stockLevel || previous.currentStock) - (current.stockLevel || current.currentStock);
            if (current.usage !== undefined) {
                usage = current.usage; // Use recorded usage if available
            }
            
            // Handle restocking (large positive stock changes)
            if (usage < -50) {
                usage = previous.usage || 0; // Use previous usage if restocked
            }
            
            usageData.push({
                date: new Date(current.date),
                usage: Math.max(0, usage),
                stockLevel: current.stockLevel || current.currentStock
            });
        }
        
        // Calculate average daily usage
        const validUsage = usageData.filter(d => d.usage > 0);
        const avgDailyUsage = validUsage.length > 0 
            ? validUsage.reduce((sum, d) => sum + d.usage, 0) / validUsage.length 
            : 1; // Default minimum usage
        
        // Calculate seasonal pattern (weekly)
        const weeklyUsage = new Array(7).fill(0);
        const weeklyCount = new Array(7).fill(0);
        
        validUsage.forEach(record => {
            const dayOfWeek = record.date.getDay();
            weeklyUsage[dayOfWeek] += record.usage;
            weeklyCount[dayOfWeek]++;
        });
        
        const seasonalPattern = weeklyUsage.map((total, i) => {
            return weeklyCount[i] > 0 ? total / weeklyCount[i] : avgDailyUsage;
        });
        
        // Calculate trend
        const usageAmounts = validUsage.map(d => d.usage);
        const trend = this.calculateTrend(usageAmounts.slice(-14)); // Last 2 weeks
        
        return { avgDailyUsage, seasonalPattern, trend };
    }

    calculateInventoryDemandForecast({ avgDailyUsage, seasonalPattern, trend, forecastDays, leadTime }) {
        const dailyForecast = [];
        let totalDemand = 0;
        const today = new Date();
        
        for (let i = 1; i <= forecastDays; i++) {
            const forecastDate = new Date(today);
            forecastDate.setDate(today.getDate() + i);
            
            // Apply trend
            const trendAdjustment = trend * i * 0.1; // Gradual trend application
            
            // Apply seasonality (weekly pattern)
            const dayOfWeek = forecastDate.getDay();
            const seasonalMultiplier = seasonalPattern[dayOfWeek] / avgDailyUsage;
            
            // Calculate forecast demand
            let forecastDemand = avgDailyUsage + trendAdjustment;
            forecastDemand = forecastDemand * seasonalMultiplier;
            
            // Add some realistic variation
            const randomFactor = 1 + (Math.random() - 0.5) * 0.15; // ±7.5%
            forecastDemand = Math.max(0, forecastDemand * randomFactor);
            
            dailyForecast.push({
                date: forecastDate.toISOString(),
                predictedUsage: Math.round(forecastDemand * 100) / 100,
                dayOfWeek: dayOfWeek
            });
            
            totalDemand += forecastDemand;
        }
        
        return { dailyForecast, totalDemand };
    }

    calculateOptimalReorder({ currentStock, reorderPoint, avgDailyUsage, leadTime, demandForecast, seasonalPattern }) {
        // Calculate safety stock (buffer for uncertainty)
        const safetyStock = Math.ceil(avgDailyUsage * 3); // 3 days buffer
        
        // Calculate lead time demand
        const leadTimeDemand = avgDailyUsage * leadTime;
        
        // Optimal reorder point = lead time demand + safety stock
        const optimalReorderPoint = Math.ceil(leadTimeDemand + safetyStock);
        
        // Calculate when to reorder based on current stock and predicted usage
        let runningStock = currentStock;
        let daysUntilReorder = 0;
        let reorderDate = null;
        
        for (const forecast of demandForecast.dailyForecast) {
            daysUntilReorder++;
            runningStock -= forecast.predictedUsage;
            
            if (runningStock <= optimalReorderPoint && !reorderDate) {
                reorderDate = new Date(forecast.date);
                break;
            }
        }
        
        // Calculate stockout risk
        let stockoutRisk = 'low';
        if (currentStock <= reorderPoint) {
            stockoutRisk = 'high';
        } else if (currentStock <= optimalReorderPoint * 1.5) {
            stockoutRisk = 'medium';
        }
        
        // If no reorder date found within forecast period, estimate
        if (!reorderDate && currentStock > 0) {
            const daysUntilEmpty = Math.floor(currentStock / avgDailyUsage);
            daysUntilReorder = Math.max(1, daysUntilEmpty - leadTime);
            reorderDate = new Date();
            reorderDate.setDate(reorderDate.getDate() + daysUntilReorder);
        }
        
        return {
            optimalReorderPoint,
            reorderDate: reorderDate ? reorderDate.toISOString() : null,
            daysUntilReorder: daysUntilReorder || null,
            stockoutRisk,
            safetyStock,
            leadTimeDemand: Math.round(leadTimeDemand)
        };
    }

    calculateInventoryConfidence(productHistory, demandForecast) {
        if (productHistory.length < 7) {
            return 0.3;
        }
        
        // Calculate usage consistency
        const usageVariance = this.calculateUsageVariance(productHistory);
        const baseConfidence = Math.max(0.3, Math.min(0.9, 1 - (usageVariance / 2)));
        
        // Adjust for data quality
        const dataQualityBonus = Math.min(0.1, productHistory.length / 50);
        
        return Math.min(0.9, baseConfidence + dataQualityBonus);
    }

    calculateUsageVariance(productHistory) {
        const usageData = [];
        for (let i = 1; i < productHistory.length; i++) {
            const current = productHistory[i];
            const previous = productHistory[i - 1];
            const usage = current.usage || Math.max(0, 
                (previous.stockLevel || previous.currentStock) - (current.stockLevel || current.currentStock)
            );
            if (usage > 0 && usage < 100) { // Filter out restocking events
                usageData.push(usage);
            }
        }
        
        if (usageData.length < 2) return 1;
        
        const mean = usageData.reduce((sum, val) => sum + val, 0) / usageData.length;
        const variance = usageData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / usageData.length;
        return Math.sqrt(variance) / mean; // Coefficient of variation
    }

    generateInventoryInsights({ currentStock, reorderPoint, avgDailyUsage, demandForecast, reorderAnalysis, confidence, trend }) {
        const insights = [];
        
        // Stock level insights
        if (reorderAnalysis.stockoutRisk === 'high') {
            insights.push('🔴 Critical: Current stock is below reorder point. Order immediately to avoid stockout.');
        } else if (reorderAnalysis.stockoutRisk === 'medium') {
            insights.push('🟡 Warning: Stock levels are getting low. Consider placing order soon.');
        } else {
            insights.push('🟢 Stock levels are adequate for current demand patterns.');
        }
        
        // Reorder timing
        if (reorderAnalysis.reorderDate) {
            const daysUntil = reorderAnalysis.daysUntilReorder;
            if (daysUntil <= 7) {
                insights.push(`Recommended reorder date is in ${daysUntil} day(s). Prepare order documentation.`);
            } else {
                insights.push(`Next reorder recommended in ${daysUntil} days based on current usage patterns.`);
            }
        }
        
        // Demand trend insights
        if (trend > 0.1) {
            insights.push('Demand is increasing. Consider raising reorder points and order quantities.');
        } else if (trend < -0.1) {
            insights.push('Demand is decreasing. Review reorder points to avoid excess inventory.');
        } else {
            insights.push('Demand is stable with predictable patterns.');
        }
        
        // Confidence insights
        if (confidence > 0.8) {
            insights.push('High confidence in predictions based on consistent usage patterns.');
        } else if (confidence > 0.6) {
            insights.push('Moderate confidence. Monitor actual usage and adjust as needed.');
        } else {
            insights.push('Low confidence due to irregular usage patterns. Use manual oversight.');
        }
        
        // Optimal reorder point comparison
        if (reorderAnalysis.optimalReorderPoint > reorderPoint * 1.2) {
            insights.push(`Consider increasing reorder point to ${reorderAnalysis.optimalReorderPoint} units for better safety margins.`);
        } else if (reorderAnalysis.optimalReorderPoint < reorderPoint * 0.8) {
            insights.push(`Current reorder point may be too high. Consider reducing to ${reorderAnalysis.optimalReorderPoint} units.`);
        }
        
        return insights;
    }

    getEmptyInventoryPrediction(reason) {
        return {
            productId: null,
            currentStock: 0,
            predictedDemand: 0,
            avgDailyUsage: 0,
            reorderDate: null,
            recommendedReorderPoint: 0,
            stockoutRisk: 'unknown',
            daysUntilReorder: null,
            confidence: 0,
            insights: [reason],
            forecast: [],
            metadata: {
                historicalRecords: 0,
                forecastDays: 0,
                leadTime: 0,
                trend: 'unknown'
            }
        };
    }

    // Supporting methods for customer churn analysis
    calculateCustomerMetrics(customerData, customerOrders) {
        const now = new Date();
        const totalOrders = customerOrders.length;
        const totalRevenue = customerOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate days since last order
        let daysSinceLastOrder = null;
        if (customerOrders.length > 0) {
            const lastOrderDate = new Date(customerOrders[customerOrders.length - 1].date);
            daysSinceLastOrder = Math.floor((now - lastOrderDate) / (24 * 60 * 60 * 1000));
        }
        
        // Calculate order frequency (orders per month)
        let orderFrequency = 0;
        if (customerOrders.length > 1) {
            const firstOrderDate = new Date(customerOrders[0].date);
            const lastOrderDate = new Date(customerOrders[customerOrders.length - 1].date);
            const monthsActive = Math.max(1, (lastOrderDate - firstOrderDate) / (30 * 24 * 60 * 60 * 1000));
            orderFrequency = totalOrders / monthsActive;
        }
        
        // Extract payment score from customer data
        const paymentScore = customerData.paymentScore || 
                            (customerData.engagementScore > 80 ? 95 : 85); // Default based on engagement
        
        // Calculate engagement trend from recent orders
        const engagementTrend = this.calculateEngagementTrend(customerOrders);
        
        return {
            totalOrders,
            totalRevenue,
            avgOrderValue,
            daysSinceLastOrder,
            orderFrequency,
            paymentScore,
            engagementTrend
        };
    }

    calculateEngagementTrend(customerOrders) {
        if (customerOrders.length < 4) return 'stable';
        
        // Compare recent orders (last 3) with earlier orders
        const recentOrders = customerOrders.slice(-3);
        const earlierOrders = customerOrders.slice(-6, -3);
        
        if (earlierOrders.length === 0) return 'stable';
        
        const recentAvg = recentOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) / recentOrders.length;
        const earlierAvg = earlierOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) / earlierOrders.length;
        
        const change = (recentAvg - earlierAvg) / earlierAvg;
        
        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    calculateChurnScore(metrics) {
        let score = 0;
        
        // Days since last order (0-30 points)
        if (metrics.daysSinceLastOrder === null) {
            score += 30; // No orders = high risk
        } else if (metrics.daysSinceLastOrder > 90) {
            score += 25;
        } else if (metrics.daysSinceLastOrder > 60) {
            score += 15;
        } else if (metrics.daysSinceLastOrder > 30) {
            score += 8;
        }
        
        // Order frequency (0-20 points)
        if (metrics.orderFrequency < 0.5) { // Less than 0.5 orders per month
            score += 20;
        } else if (metrics.orderFrequency < 1) {
            score += 12;
        } else if (metrics.orderFrequency < 2) {
            score += 5;
        }
        
        // Payment score (0-20 points)
        if (metrics.paymentScore < 70) {
            score += 20;
        } else if (metrics.paymentScore < 85) {
            score += 10;
        } else if (metrics.paymentScore < 95) {
            score += 3;
        }
        
        // Engagement trend (0-15 points)
        if (metrics.engagementTrend === 'decreasing') {
            score += 15;
        } else if (metrics.engagementTrend === 'stable' && metrics.totalOrders < 3) {
            score += 8;
        }
        
        // Average order value trend (0-15 points)
        if (metrics.avgOrderValue < 500) { // Low value customers
            score += 10;
        } else if (metrics.avgOrderValue > 2000) {
            score -= 5; // High value customers get bonus
        }
        
        return Math.min(100, Math.max(0, score));
    }

    determineRiskLevel(churnScore) {
        if (churnScore >= 70) return 'high';
        if (churnScore >= 40) return 'medium';
        return 'low';
    }

    identifyRiskFactors(metrics) {
        const factors = [];
        
        if (metrics.daysSinceLastOrder === null) {
            factors.push({ factor: 'no_orders', severity: 'high', description: 'Customer has never placed an order' });
        } else if (metrics.daysSinceLastOrder > 90) {
            factors.push({ factor: 'long_absence', severity: 'high', description: `${metrics.daysSinceLastOrder} days since last order` });
        } else if (metrics.daysSinceLastOrder > 60) {
            factors.push({ factor: 'recent_absence', severity: 'medium', description: `${metrics.daysSinceLastOrder} days since last order` });
        }
        
        if (metrics.orderFrequency < 0.5) {
            factors.push({ factor: 'low_frequency', severity: 'high', description: 'Very low order frequency' });
        } else if (metrics.orderFrequency < 1) {
            factors.push({ factor: 'irregular_orders', severity: 'medium', description: 'Irregular ordering pattern' });
        }
        
        if (metrics.paymentScore < 85) {
            factors.push({ factor: 'payment_issues', severity: 'medium', description: 'Below average payment performance' });
        }
        
        if (metrics.engagementTrend === 'decreasing') {
            factors.push({ factor: 'declining_engagement', severity: 'high', description: 'Recent orders are smaller than historical average' });
        }
        
        if (metrics.totalOrders < 3) {
            factors.push({ factor: 'new_customer', severity: 'low', description: 'Limited order history' });
        }
        
        return factors;
    }

    generateChurnInsights(metrics, riskLevel, riskFactors) {
        const insights = [];
        
        // Risk level insights
        const riskMessages = {
            'high': '🔴 High churn risk detected. Immediate intervention recommended.',
            'medium': '🟡 Medium churn risk. Monitor closely and consider engagement activities.',
            'low': '🟢 Low churn risk. Customer appears stable and engaged.'
        };
        
        insights.push(riskMessages[riskLevel]);
        
        // Specific factor insights
        const highSeverityFactors = riskFactors.filter(f => f.severity === 'high');
        if (highSeverityFactors.length > 0) {
            insights.push(`Primary concerns: ${highSeverityFactors.map(f => f.description).join(', ')}.`);
        }
        
        // Behavioral insights
        if (metrics.daysSinceLastOrder > 60) {
            insights.push('Customer has been inactive for an extended period. Consider re-engagement campaign.');
        }
        
        if (metrics.orderFrequency > 2 && riskLevel === 'low') {
            insights.push('Frequent customer with consistent ordering patterns. Consider loyalty programs.');
        }
        
        if (metrics.avgOrderValue > 1500) {
            insights.push('High-value customer. Prioritize retention efforts if at risk.');
        }
        
        // Trend insights
        if (metrics.engagementTrend === 'increasing') {
            insights.push('Positive trend: Recent orders are larger than historical average.');
        } else if (metrics.engagementTrend === 'decreasing') {
            insights.push('Concerning trend: Recent orders are smaller than historical average.');
        }
        
        return insights;
    }

    generateChurnRecommendations(riskLevel, riskFactors, metrics) {
        const recommendations = [];
        
        switch (riskLevel) {
            case 'high':
                recommendations.push('Contact customer immediately to understand concerns');
                recommendations.push('Offer special discount or incentive to encourage next order');
                recommendations.push('Schedule face-to-face meeting or phone call');
                if (metrics.paymentScore < 85) {
                    recommendations.push('Review and potentially adjust payment terms');
                }
                break;
                
            case 'medium':
                recommendations.push('Send personalized email or newsletter');
                recommendations.push('Offer targeted promotions based on purchase history');
                recommendations.push('Check in with customer service call');
                break;
                
            case 'low':
                recommendations.push('Continue regular communication and service');
                recommendations.push('Consider customer loyalty program enrollment');
                if (metrics.avgOrderValue > 1500) {
                    recommendations.push('Explore upselling opportunities');
                }
                break;
        }
        
        // Specific factor-based recommendations
        riskFactors.forEach(factor => {
            switch (factor.factor) {
                case 'long_absence':
                    recommendations.push('Send "we miss you" campaign with special offer');
                    break;
                case 'low_frequency':
                    recommendations.push('Implement regular follow-up schedule');
                    break;
                case 'payment_issues':
                    recommendations.push('Discuss payment options and terms');
                    break;
                case 'declining_engagement':
                    recommendations.push('Analyze recent order changes and address concerns');
                    break;
            }
        });
        
        return [...new Set(recommendations)]; // Remove duplicates
    }

    summarizeChurnAnalysis(customerAnalyses) {
        const total = customerAnalyses.length;
        const riskCounts = {
            high: customerAnalyses.filter(c => c.churnRisk === 'high').length,
            medium: customerAnalyses.filter(c => c.churnRisk === 'medium').length,
            low: customerAnalyses.filter(c => c.churnRisk === 'low').length
        };
        
        const avgChurnScore = customerAnalyses.reduce((sum, c) => sum + c.churnScore, 0) / total;
        
        // Top risk factors across all customers
        const allFactors = customerAnalyses.flatMap(c => c.factors);
        const factorCounts = {};
        allFactors.forEach(factor => {
            factorCounts[factor.factor] = (factorCounts[factor.factor] || 0) + 1;
        });
        
        const topFactors = Object.entries(factorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([factor, count]) => ({ factor, count, percentage: Math.round((count / total) * 100) }));
        
        const highRiskCustomers = customerAnalyses
            .filter(c => c.churnRisk === 'high')
            .sort((a, b) => b.churnScore - a.churnScore)
            .slice(0, 10);
        
        return {
            summary: {
                totalCustomers: total,
                avgChurnScore: Math.round(avgChurnScore),
                riskDistribution: {
                    high: { count: riskCounts.high, percentage: Math.round((riskCounts.high / total) * 100) },
                    medium: { count: riskCounts.medium, percentage: Math.round((riskCounts.medium / total) * 100) },
                    low: { count: riskCounts.low, percentage: Math.round((riskCounts.low / total) * 100) }
                }
            },
            topRiskFactors: topFactors,
            highRiskCustomers: highRiskCustomers.map(c => ({
                customerId: c.customerId,
                customerName: c.customerName,
                churnScore: c.churnScore,
                primaryFactors: c.factors.filter(f => f.severity === 'high').map(f => f.factor)
            })),
            insights: this.generateOverallChurnInsights(riskCounts, avgChurnScore, topFactors)
        };
    }

    generateOverallChurnInsights(riskCounts, avgChurnScore, topFactors) {
        const insights = [];
        const total = riskCounts.high + riskCounts.medium + riskCounts.low;
        
        // Overall risk assessment
        const highRiskPercentage = (riskCounts.high / total) * 100;
        if (highRiskPercentage > 20) {
            insights.push(`🔴 Alert: ${highRiskPercentage.toFixed(1)}% of customers are at high churn risk.`);
        } else if (highRiskPercentage > 10) {
            insights.push(`🟡 Caution: ${highRiskPercentage.toFixed(1)}% of customers are at high churn risk.`);
        } else {
            insights.push(`🟢 Good: Only ${highRiskPercentage.toFixed(1)}% of customers are at high churn risk.`);
        }
        
        // Average churn score insight
        if (avgChurnScore > 50) {
            insights.push('Overall customer base shows elevated churn risk. Review retention strategies.');
        } else {
            insights.push('Overall customer base appears stable with manageable churn risk.');
        }
        
        // Top factors insight
        if (topFactors.length > 0) {
            const topFactor = topFactors[0];
            insights.push(`Most common risk factor: ${topFactor.factor} (affects ${topFactor.percentage}% of customers).`);
        }
        
        return insights;
    }

    getEmptyChurnAnalysis(reason) {
        return {
            customerId: null,
            customerName: 'Unknown',
            churnRisk: 'unknown',
            churnScore: 0,
            factors: [],
            insights: [reason],
            metrics: {
                totalOrders: 0,
                totalRevenue: 0,
                avgOrderValue: 0,
                daysSinceLastOrder: null,
                orderFrequency: 0,
                paymentScore: 0,
                engagementTrend: 'unknown'
            },
            recommendations: []
        };
    }
}

// Export the service
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnalyticsService;
} else if (typeof window !== 'undefined') {
    window.AIAnalyticsService = AIAnalyticsService;
}

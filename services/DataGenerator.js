// services/DataGenerator.js
// Historical data generator for AI training
// Creates realistic sample datasets spanning 2-3 years

class DataGenerator {
    constructor() {
        this.currentDate = new Date();
        this.historicalPeriodDays = 1095; // 3 years
        this.basePrice = 1000; // Base price for calculations
        
        // Seasonal patterns (0.8 to 1.2 multiplier for each month)
        this.seasonalFactors = [
            0.85, 0.90, 1.05, 1.15, 1.25, 1.20, // Jan-Jun (winter slow, spring pickup)
            1.10, 1.15, 1.25, 1.30, 1.10, 0.95  // Jul-Dec (summer peak, winter decline)
        ];
        
        // Economic trend (simulating market conditions)
        this.economicTrend = {
            2022: 1.0,  // Base year
            2023: 1.08, // Growth
            2024: 1.15, // Continued growth
            2025: 1.22  // Projected growth
        };
    }

    // Generate date going back from current date
    getHistoricalDate(daysAgo) {
        const date = new Date(this.currentDate);
        date.setDate(date.getDate() - daysAgo);
        return date;
    }

    // Get seasonal factor for a given month (0-11)
    getSeasonalFactor(month) {
        return this.seasonalFactors[month] || 1.0;
    }

    // Get economic trend factor for a given year
    getEconomicFactor(year) {
        return this.economicTrend[year] || 1.0;
    }

    // Add random variation to a base value
    addRandomVariation(baseValue, variationPercent = 0.1) {
        const variation = baseValue * variationPercent;
        return baseValue + (Math.random() - 0.5) * 2 * variation;
    }

    // Generate historical sales data
    generateSalesHistory(customersData = []) {
        const salesData = [];
        const customerIds = customersData.length > 0 
            ? customersData.map(c => c.id) 
            : ['CUST001', 'CUST002', 'CUST003', 'CUST004', 'CUST005'];

        // Generate daily sales for the last 3 years
        for (let daysAgo = this.historicalPeriodDays; daysAgo >= 0; daysAgo--) {
            const date = this.getHistoricalDate(daysAgo);
            const month = date.getMonth();
            const year = date.getFullYear();
            
            // Skip some days (not every day has sales)
            if (Math.random() < 0.3) continue; // 30% chance of no sales
            
            // Seasonal and economic factors
            const seasonalFactor = this.getSeasonalFactor(month);
            const economicFactor = this.getEconomicFactor(year);
            
            // Generate 1-5 orders per day when there are sales
            const ordersPerDay = Math.floor(Math.random() * 5) + 1;
            
            for (let i = 0; i < ordersPerDay; i++) {
                const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
                const baseAmount = this.basePrice * seasonalFactor * economicFactor;
                const orderAmount = this.addRandomVariation(baseAmount, 0.3);
                
                // Generate line items
                const itemCount = Math.floor(Math.random() * 8) + 1;
                const items = [];
                let orderTotal = 0;
                
                for (let j = 0; j < itemCount; j++) {
                    const itemPrice = this.addRandomVariation(baseAmount / itemCount, 0.4);
                    const quantity = Math.floor(Math.random() * 10) + 1;
                    const lineTotal = itemPrice * quantity;
                    
                    items.push({
                        productId: `PROD${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
                        quantity: quantity,
                        unitPrice: Math.round(itemPrice * 100) / 100,
                        total: Math.round(lineTotal * 100) / 100
                    });
                    
                    orderTotal += lineTotal;
                }
                
                salesData.push({
                    id: `ORD${Date.now()}${i}${Math.floor(Math.random() * 1000)}`,
                    customerId: customerId,
                    date: date.toISOString(),
                    total: Math.round(orderTotal * 100) / 100,
                    items: items,
                    category: this.getRandomCategory(),
                    status: 'Completed'
                });
            }
        }
        
        return salesData.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Generate historical inventory usage data
    generateInventoryHistory(productsData = []) {
        const inventoryHistory = [];
        const productIds = productsData.length > 0 
            ? productsData.map(p => p.id) 
            : this.generateProductIds();

        productIds.forEach(productId => {
            // Generate weekly stock level records for each product
            for (let weeksAgo = Math.floor(this.historicalPeriodDays / 7); weeksAgo >= 0; weeksAgo--) {
                const date = this.getHistoricalDate(weeksAgo * 7);
                const month = date.getMonth();
                const year = date.getFullYear();
                
                const seasonalFactor = this.getSeasonalFactor(month);
                const economicFactor = this.getEconomicFactor(year);
                
                // Base usage pattern with seasonal variation
                const baseUsage = 10 + (Math.random() * 20); // 10-30 units base
                const adjustedUsage = baseUsage * seasonalFactor * (economicFactor * 0.5 + 0.5);
                const actualUsage = Math.max(0, Math.floor(this.addRandomVariation(adjustedUsage, 0.3)));
                
                // Stock level (starts high, depletes, gets restocked)
                const cyclePosition = (weeksAgo % 8) / 8; // 8-week cycles
                const baseLevelInCycle = Math.sin(cyclePosition * Math.PI * 2) * 50 + 100;
                const stockLevel = Math.max(0, Math.floor(baseLevelInCycle + (Math.random() - 0.5) * 20));
                
                inventoryHistory.push({
                    productId: productId,
                    date: date.toISOString(),
                    stockLevel: stockLevel,
                    usage: actualUsage,
                    reorderPoint: 25 + Math.floor(Math.random() * 25), // 25-50
                    leadTime: 7 + Math.floor(Math.random() * 14), // 7-21 days
                    category: this.getRandomCategory()
                });
            }
        });

        return inventoryHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Generate customer interaction history
    generateCustomerHistory(customersData = []) {
        const customerHistory = [];
        const customerIds = customersData.length > 0 
            ? customersData.map(c => c.id) 
            : ['CUST001', 'CUST002', 'CUST003', 'CUST004', 'CUST005'];

        customerIds.forEach(customerId => {
            let customerEngagement = 0.7; // Base engagement level
            let lastOrderDate = null;
            let consecutiveNoOrders = 0;
            
            // Generate monthly customer activity records
            for (let monthsAgo = 36; monthsAgo >= 0; monthsAgo--) {
                const date = new Date(this.currentDate);
                date.setMonth(date.getMonth() - monthsAgo);
                date.setDate(1); // First of month
                
                const month = date.getMonth();
                const seasonalFactor = this.getSeasonalFactor(month);
                
                // Engagement naturally declines over time without orders
                if (consecutiveNoOrders > 0) {
                    customerEngagement *= 0.95; // 5% decline each month without orders
                }
                
                // Probability of having orders this month
                const orderProbability = customerEngagement * seasonalFactor * 0.8;
                const hasOrders = Math.random() < orderProbability;
                
                if (hasOrders) {
                    consecutiveNoOrders = 0;
                    customerEngagement = Math.min(1.0, customerEngagement + 0.1); // Boost engagement
                    lastOrderDate = date;
                } else {
                    consecutiveNoOrders++;
                }
                
                // Support tickets (some customers are more likely to need help)
                const supportTickets = Math.random() < 0.15 ? Math.floor(Math.random() * 3) + 1 : 0;
                
                // Payment timeliness (some customers pay late occasionally)
                const paymentScore = Math.random() < 0.9 ? 
                    this.addRandomVariation(95, 0.1) : // Usually good
                    this.addRandomVariation(70, 0.2);   // Occasionally poor
                
                customerHistory.push({
                    customerId: customerId,
                    date: date.toISOString(),
                    hasOrders: hasOrders,
                    orderCount: hasOrders ? Math.floor(Math.random() * 4) + 1 : 0,
                    engagementScore: Math.round(customerEngagement * 100),
                    supportTickets: supportTickets,
                    paymentScore: Math.max(0, Math.min(100, Math.round(paymentScore))),
                    daysSinceLastOrder: lastOrderDate ? Math.floor((date - lastOrderDate) / (24 * 60 * 60 * 1000)) : null,
                    consecutiveMonthsWithoutOrders: consecutiveNoOrders
                });
            }
        });

        return customerHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Generate workflow events history
    generateWorkflowHistory() {
        const workflowEvents = [];
        const workflowTypes = ['invoice_approval', 'order_fulfillment', 'payment_processing', 'quality_check'];
        
        for (let daysAgo = this.historicalPeriodDays; daysAgo >= 0; daysAgo--) {
            // Skip some days
            if (Math.random() < 0.4) continue;
            
            const date = this.getHistoricalDate(daysAgo);
            const eventsPerDay = Math.floor(Math.random() * 10) + 1;
            
            for (let i = 0; i < eventsPerDay; i++) {
                const workflowType = workflowTypes[Math.floor(Math.random() * workflowTypes.length)];
                const processingTime = this.getProcessingTime(workflowType);
                const success = Math.random() < 0.92; // 92% success rate
                
                workflowEvents.push({
                    id: `WF${Date.now()}${i}${Math.floor(Math.random() * 1000)}`,
                    type: workflowType,
                    date: date.toISOString(),
                    processingTimeMinutes: processingTime,
                    successful: success,
                    requiresHumanIntervention: Math.random() < 0.15, // 15% need human help
                    automatable: Math.random() < 0.8 // 80% could be automated
                });
            }
        }
        
        return workflowEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Helper methods
    getRandomCategory() {
        const categories = ['Lumber', 'Concrete', 'Roofing', 'Electrical', 'Plumbing', 'Insulation', 'Drywall', 'Flooring'];
        return categories[Math.floor(Math.random() * categories.length)];
    }

    generateProductIds(count = 50) {
        const ids = [];
        for (let i = 1; i <= count; i++) {
            ids.push(`PROD${String(i).padStart(3, '0')}`);
        }
        return ids;
    }

    getProcessingTime(workflowType) {
        const baseTimes = {
            'invoice_approval': 15,
            'order_fulfillment': 45,
            'payment_processing': 5,
            'quality_check': 30
        };
        const baseTime = baseTimes[workflowType] || 20;
        return Math.max(1, Math.floor(this.addRandomVariation(baseTime, 0.5)));
    }

    // Generate complete historical dataset
    generateCompleteHistoricalData(existingData = {}) {
        console.log('🔄 Generating historical data for AI training...');
        
        const data = {
            sales: this.generateSalesHistory(existingData.customers || []),
            inventory: this.generateInventoryHistory(existingData.products || []),
            customers: this.generateCustomerHistory(existingData.customers || []),
            workflows: this.generateWorkflowHistory()
        };
        
        console.log(`✅ Generated historical data:
        - Sales records: ${data.sales.length}
        - Inventory records: ${data.inventory.length} 
        - Customer interactions: ${data.customers.length}
        - Workflow events: ${data.workflows.length}`);
        
        return data;
    }
}

// Export the service
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataGenerator;
} else if (typeof window !== 'undefined') {
    window.DataGenerator = DataGenerator;
}

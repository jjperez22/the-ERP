// AI Insights Data Service
// Handles data fetching, mock data generation, and API simulation

class AIInsightsDataService {
  constructor() {
    this.baseApiUrl = '/api/ai-insights';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.isOnline = navigator.onLine;
    this.setupNetworkListeners();
  }

  // Setup network status listeners
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('AI Insights: Network connection restored');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('AI Insights: Working offline with cached data');
    });
  }

  // Cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  // Mock data generators
  generateMockInsights() {
    return {
      critical: [
        {
          id: 'crit-001',
          title: 'Budget Variance Alert',
          description: 'Project X-42 is 15% over budget with 3 weeks remaining',
          priority: 'high',
          timestamp: new Date().toISOString(),
          actionRequired: true,
          category: 'financial'
        },
        {
          id: 'crit-002',
          title: 'Material Shortage Risk',
          description: 'Steel supplies may be delayed due to supplier capacity issues',
          priority: 'high',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          actionRequired: true,
          category: 'procurement'
        }
      ],
      warnings: [
        {
          id: 'warn-001',
          title: 'Weather Impact Forecast',
          description: 'Heavy rain expected next week may delay outdoor construction',
          priority: 'medium',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          actionRequired: false,
          category: 'scheduling'
        },
        {
          id: 'warn-002',
          title: 'Equipment Maintenance Due',
          description: 'Crane Unit CR-205 requires maintenance within 48 hours',
          priority: 'medium',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          actionRequired: true,
          category: 'equipment'
        },
        {
          id: 'warn-003',
          title: 'Subcontractor Availability',
          description: 'Electrical contractor may have scheduling conflicts',
          priority: 'medium',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          actionRequired: false,
          category: 'resources'
        }
      ],
      recommendations: [
        {
          id: 'rec-001',
          title: 'Optimize Material Ordering',
          description: 'Bundle concrete orders to reduce delivery costs by 12%',
          priority: 'low',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          actionRequired: false,
          category: 'optimization',
          potentialSavings: '$8,400'
        },
        {
          id: 'rec-002',
          title: 'Resource Allocation Improvement',
          description: 'Redistribute crew assignments to reduce project timeline by 3 days',
          priority: 'low',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          actionRequired: false,
          category: 'scheduling',
          potentialSavings: '$12,000'
        }
      ]
    };
  }

  generateMockAnalytics() {
    return {
      forecasts: [
        {
          title: 'Project Completion Forecast',
          data: {
            currentProjects: 12,
            onSchedule: 8,
            delayed: 3,
            atRisk: 1,
            predictedCompletionRate: '85%',
            averageDelayDays: 4.2
          },
          chart: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              label: 'Completion Rate',
              data: [75, 80, 85, 90],
              backgroundColor: 'rgba(33, 128, 141, 0.2)',
              borderColor: 'rgba(33, 128, 141, 1)'
            }]
          }
        },
        {
          title: 'Budget Forecast',
          data: {
            totalBudget: 2500000,
            spent: 1820000,
            remaining: 680000,
            projectedOverrun: 125000,
            riskLevel: 'medium'
          },
          chart: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
              label: 'Budget Utilization',
              data: [600000, 1200000, 1800000, 2500000],
              backgroundColor: 'rgba(168, 75, 47, 0.2)',
              borderColor: 'rgba(168, 75, 47, 1)'
            }]
          }
        }
      ],
      trends: [
        {
          title: 'Material Cost Trends',
          data: {
            trend: 'increasing',
            percentage: '+8.5%',
            period: '30 days',
            impact: 'moderate'
          },
          chart: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
              label: 'Material Costs',
              data: [100000, 105000, 108000, 112000, 115000],
              backgroundColor: 'rgba(230, 129, 97, 0.2)',
              borderColor: 'rgba(230, 129, 97, 1)'
            }]
          }
        },
        {
          title: 'Labor Productivity',
          data: {
            trend: 'stable',
            percentage: '+2.1%',
            period: '30 days',
            impact: 'positive'
          },
          chart: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              label: 'Productivity Index',
              data: [85, 87, 86, 89],
              backgroundColor: 'rgba(50, 184, 198, 0.2)',
              borderColor: 'rgba(50, 184, 198, 1)'
            }]
          }
        }
      ],
      patterns: [
        {
          title: 'Seasonal Patterns',
          patterns: [
            { icon: '🌦️', text: 'Rain delays increase 40% in Q2', severity: 'medium' },
            { icon: '⚡', text: 'Equipment failures peak on Mondays', severity: 'low' },
            { icon: '📈', text: 'Productivity highest on Tue-Thu', severity: 'info' }
          ]
        },
        {
          title: 'Resource Patterns',
          patterns: [
            { icon: '👥', text: 'Crew overtime correlates with delays', severity: 'high' },
            { icon: '🚚', text: 'Material deliveries most efficient 8-10am', severity: 'info' },
            { icon: '🔧', text: 'Equipment utilization drops 15% Fridays', severity: 'medium' }
          ]
        }
      ]
    };
  }

  generateMockMetrics() {
    return {
      totalInsights: 247,
      criticalAlerts: 2,
      activeRecommendations: 12,
      automationRate: '78%',
      accuracyScore: '94.2%',
      responseTime: '1.2s'
    };
  }

  // API simulation methods
  async simulateApiDelay(min = 500, max = 1500) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Fetch insights data
  async fetchInsights() {
    const cacheKey = 'insights';
    const cached = this.getCachedData(cacheKey);
    
    if (cached && this.isOnline) {
      return cached;
    }

    try {
      await this.simulateApiDelay();
      
      // In a real application, this would be an actual API call
      // const response = await fetch(`${this.baseApiUrl}/insights`);
      // const data = await response.json();
      
      const data = this.generateMockInsights();
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      return cached || this.generateMockInsights();
    }
  }

  // Fetch analytics data
  async fetchAnalytics() {
    const cacheKey = 'analytics';
    const cached = this.getCachedData(cacheKey);
    
    if (cached && this.isOnline) {
      return cached;
    }

    try {
      await this.simulateApiDelay();
      
      const data = this.generateMockAnalytics();
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return cached || this.generateMockAnalytics();
    }
  }

  // Fetch metrics data
  async fetchMetrics() {
    const cacheKey = 'metrics';
    const cached = this.getCachedData(cacheKey);
    
    if (cached && this.isOnline) {
      return cached;
    }

    try {
      await this.simulateApiDelay(200, 800);
      
      const data = this.generateMockMetrics();
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return cached || this.generateMockMetrics();
    }
  }

  // Send AI query
  async sendQuery(query) {
    try {
      await this.simulateApiDelay(1000, 3000);
      
      // Simulate AI response based on query keywords
      const response = this.generateQueryResponse(query);
      return response;
    } catch (error) {
      console.error('Failed to send query:', error);
      throw new Error('Unable to process your query at this time. Please try again.');
    }
  }

  generateQueryResponse(query) {
    const lowerQuery = query.toLowerCase();
    
    // Simple keyword-based response generation
    if (lowerQuery.includes('budget') || lowerQuery.includes('cost')) {
      return {
        title: 'Budget Analysis',
        content: `Based on current project data, your total budget utilization is at 73% with $680,000 remaining. The AI analysis suggests implementing cost optimization strategies to prevent the projected $125,000 overrun. Key recommendations include renegotiating supplier contracts and optimizing resource allocation.`,
        suggestions: ['View detailed budget breakdown', 'Generate cost optimization report', 'Set up budget alerts'],
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerQuery.includes('delay') || lowerQuery.includes('schedule')) {
      return {
        title: 'Schedule Analysis',
        content: `Current project schedule analysis shows 3 projects experiencing delays averaging 4.2 days. Weather patterns and material delivery schedules are the primary contributing factors. Implementing weather contingency plans and adjusting delivery windows could reduce future delays by 60%.`,
        suggestions: ['View project timelines', 'Create weather contingency plan', 'Optimize delivery schedules'],
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerQuery.includes('material') || lowerQuery.includes('supply')) {
      return {
        title: 'Supply Chain Analysis',
        content: `Material supply chain analysis reveals potential steel shortages next month due to increased demand. Recommend placing orders 2 weeks earlier than planned and identifying alternative suppliers. Current inventory levels can sustain operations for 18 days.`,
        suggestions: ['Check inventory levels', 'Contact alternative suppliers', 'Adjust procurement schedule'],
        timestamp: new Date().toISOString()
      };
    }
    
    if (lowerQuery.includes('safety') || lowerQuery.includes('risk')) {
      return {
        title: 'Safety & Risk Analysis',
        content: `Safety incident patterns show increased risks during equipment maintenance periods. Implementing enhanced safety protocols during maintenance windows could reduce incident probability by 45%. Current safety score is 92.3%.`,
        suggestions: ['Review safety protocols', 'Schedule safety training', 'Update risk assessments'],
        timestamp: new Date().toISOString()
      };
    }
    
    // Default response
    return {
      title: 'AI Analysis',
      content: `I've analyzed your query about "${query}". Based on current project data and historical patterns, I can provide insights across budget management, scheduling optimization, supply chain efficiency, and risk mitigation. Would you like me to focus on any specific area?`,
      suggestions: ['Ask about budget optimization', 'Inquire about schedule risks', 'Check material availability'],
      timestamp: new Date().toISOString()
    };
  }

  // Get query suggestions
  getQuerySuggestions() {
    return [
      'What projects are at risk of delay?',
      'Show me budget variance by project',
      'Which materials need reordering?',
      'Analyze equipment utilization',
      'Predict completion dates',
      'Identify cost optimization opportunities'
    ];
  }

  // Refresh all data
  async refreshData() {
    this.cache.clear();
    const promises = [
      this.fetchInsights(),
      this.fetchAnalytics(),
      this.fetchMetrics()
    ];
    
    try {
      const results = await Promise.all(promises);
      return {
        insights: results[0],
        analytics: results[1],
        metrics: results[2]
      };
    } catch (error) {
      console.error('Failed to refresh AI insights data:', error);
      throw error;
    }
  }
}

// Export the service
window.AIInsightsDataService = AIInsightsDataService;

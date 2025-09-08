// AI Insights Display Controller
// Handles populating and updating the insights grid with live data

class AIInsightsDisplay {
  constructor(dataService) {
    this.dataService = dataService;
    this.refreshInterval = null;
    this.refreshRate = 5 * 60 * 1000; // 5 minutes
    this.isLoading = false;
    this.init();
  }

  async init() {
    await this.loadInitialData();
    this.setupAutoRefresh();
    this.bindEvents();
  }

  bindEvents() {
    // Refresh button
    document.addEventListener('click', (e) => {
      if (e.target.closest('.refresh-insights-btn')) {
        this.refreshInsights();
      }
    });

    // Insight item interactions
    document.addEventListener('click', (e) => {
      if (e.target.closest('.insight-item')) {
        this.handleInsightClick(e.target.closest('.insight-item'));
      }
    });
  }

  async loadInitialData() {
    try {
      this.showLoadingState();
      const [insights, metrics] = await Promise.all([
        this.dataService.fetchInsights(),
        this.dataService.fetchMetrics()
      ]);
      
      this.populateInsights(insights);
      this.populateMetrics(metrics);
      this.hideLoadingState();
    } catch (error) {
      console.error('Failed to load initial insights data:', error);
      this.showErrorState(error.message);
    }
  }

  populateInsights(insights) {
    this.populateCriticalAlerts(insights.critical || []);
    this.populateWarnings(insights.warnings || []);
    this.populateRecommendations(insights.recommendations || []);
  }

  populateCriticalAlerts(alerts) {
    const container = document.getElementById('critical-alerts-list');
    const countElement = document.getElementById('critical-alerts-count');
    
    if (countElement) {
      countElement.textContent = alerts.length;
    }
    
    if (!container) return;

    if (alerts.length === 0) {
      container.innerHTML = this.getPlaceholderHTML('🎉', 'No critical alerts');
      return;
    }

    container.innerHTML = alerts.map(alert => this.buildInsightItemHTML(alert, 'critical')).join('');
  }

  populateWarnings(warnings) {
    const container = document.getElementById('warnings-list');
    const countElement = document.getElementById('warnings-count');
    
    if (countElement) {
      countElement.textContent = warnings.length;
    }
    
    if (!container) return;

    if (warnings.length === 0) {
      container.innerHTML = this.getPlaceholderHTML('✅', 'No warnings');
      return;
    }

    container.innerHTML = warnings.map(warning => this.buildInsightItemHTML(warning, 'warning')).join('');
  }

  populateRecommendations(recommendations) {
    const container = document.getElementById('recommendations-list');
    const countElement = document.getElementById('recommendations-count');
    
    if (countElement) {
      countElement.textContent = recommendations.length;
    }
    
    if (!container) return;

    if (recommendations.length === 0) {
      container.innerHTML = this.getPlaceholderHTML('💡', 'No new recommendations');
      return;
    }

    container.innerHTML = recommendations.map(rec => this.buildInsightItemHTML(rec, 'info')).join('');
  }

  buildInsightItemHTML(item, type) {
    const timeAgo = this.getTimeAgo(item.timestamp);
    const categoryIcon = this.getCategoryIcon(item.category);
    const savingsHTML = item.potentialSavings ? 
      `<div class="insight-savings">Potential savings: <strong>${item.potentialSavings}</strong></div>` : '';

    return `
      <div class="insight-item ${type}" data-id="${item.id}" data-category="${item.category}">
        <div class="insight-header">
          <div class="insight-icon">${categoryIcon}</div>
          <div class="insight-content">
            <div class="insight-title">${this.escapeHtml(item.title)}</div>
            <div class="insight-description">${this.escapeHtml(item.description)}</div>
            ${savingsHTML}
          </div>
          ${item.actionRequired ? '<div class="action-indicator">⚡</div>' : ''}
        </div>
        <div class="insight-footer">
          <span class="insight-timestamp">${timeAgo}</span>
          <div class="insight-actions">
            <button class="btn btn--sm btn--outline insight-action-btn" data-action="details">
              View Details
            </button>
            ${item.actionRequired ? 
              '<button class="btn btn--sm btn--primary insight-action-btn" data-action="take-action">Take Action</button>' : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  getCategoryIcon(category) {
    const icons = {
      financial: '💰',
      procurement: '📦',
      scheduling: '📅',
      equipment: '🔧',
      resources: '👥',
      optimization: '⚡',
      safety: '🛡️',
      quality: '✅',
      default: '📊'
    };
    return icons[category] || icons.default;
  }

  populateMetrics(metrics) {
    const metricsContainer = document.querySelector('.insight-metrics');
    if (!metricsContainer) return;

    const metricsData = [
      { label: 'Total Insights', value: metrics.totalInsights, format: 'number' },
      { label: 'Critical Alerts', value: metrics.criticalAlerts, format: 'number' },
      { label: 'Active Recommendations', value: metrics.activeRecommendations, format: 'number' },
      { label: 'Automation Rate', value: metrics.automationRate, format: 'text' },
      { label: 'Accuracy Score', value: metrics.accuracyScore, format: 'text' },
      { label: 'Avg Response Time', value: metrics.responseTime, format: 'text' }
    ];

    metricsContainer.innerHTML = metricsData.map(metric => `
      <div class="insight-metric">
        <div class="metric-value">${metric.value}</div>
        <div class="metric-label">${metric.label}</div>
      </div>
    `).join('');
  }

  getPlaceholderHTML(icon, text) {
    return `
      <div class="insight-placeholder">
        <div class="placeholder-icon">${icon}</div>
        <p>${text}</p>
      </div>
    `;
  }

  showLoadingState() {
    this.isLoading = true;
    
    // Show loading in all insight categories
    const categories = ['critical-alerts-list', 'warnings-list', 'recommendations-list'];
    categories.forEach(categoryId => {
      const container = document.getElementById(categoryId);
      if (container) {
        container.innerHTML = `
          <div class="loading-spinner">
            <span>Loading insights...</span>
          </div>
        `;
      }
    });
  }

  hideLoadingState() {
    this.isLoading = false;
  }

  showErrorState(message) {
    const categories = ['critical-alerts-list', 'warnings-list', 'recommendations-list'];
    categories.forEach(categoryId => {
      const container = document.getElementById(categoryId);
      if (container) {
        container.innerHTML = `
          <div class="insight-placeholder">
            <div class="placeholder-icon">⚠️</div>
            <p>Failed to load insights</p>
            <button class="btn btn--sm btn--outline" onclick="window.aiInsightsDisplay?.refreshInsights()">
              Retry
            </button>
          </div>
        `;
      }
    });
  }

  async refreshInsights() {
    if (this.isLoading) return;
    
    try {
      this.showLoadingState();
      const [insights, metrics] = await Promise.all([
        this.dataService.fetchInsights(),
        this.dataService.fetchMetrics()
      ]);
      
      this.populateInsights(insights);
      this.populateMetrics(metrics);
      this.hideLoadingState();
      
      if (window.showNotification) {
        window.showNotification('AI insights updated successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to refresh insights:', error);
      this.showErrorState(error.message);
      
      if (window.showNotification) {
        window.showNotification('Failed to refresh insights', 'error');
      }
    }
  }

  setupAutoRefresh() {
    // Clear existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Set up new interval
    this.refreshInterval = setInterval(() => {
      if (!document.hidden && !this.isLoading) {
        this.refreshInsights();
      }
    }, this.refreshRate);
    
    // Pause auto-refresh when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
        }
      } else {
        this.setupAutoRefresh();
      }
    });
  }

  handleInsightClick(insightEl) {
    const insightId = insightEl.dataset.id;
    const category = insightEl.dataset.category;
    
    // Add visual feedback
    insightEl.style.transform = 'scale(0.98)';
    setTimeout(() => {
      insightEl.style.transform = '';
    }, 150);

    // Log the interaction
    console.log(`Insight clicked: ${insightId} (${category})`);
    
    // Could trigger modal or detailed view here
    this.showInsightDetails(insightId, category);
  }

  showInsightDetails(insightId, category) {
    // This would typically open a modal with detailed information
    console.log(`Showing details for insight ${insightId} in category ${category}`);
    
    if (window.showNotification) {
      window.showNotification(`Viewing details for ${category} insight`, 'info');
    }
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return time.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Cleanup
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// Export the class
window.AIInsightsDisplay = AIInsightsDisplay;

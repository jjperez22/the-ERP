// AI Analytics Tab System
// Handles the tabbed interface for forecasts, trends, and patterns

class AIAnalyticsTabs {
  constructor(dataService) {
    this.dataService = dataService;
    this.activeTab = 'forecasts';
    this.analyticsData = null;
    this.isLoading = false;
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadAnalyticsData();
    this.showTab(this.activeTab);
  }

  bindEvents() {
    // Tab navigation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('analytics-tab')) {
        const tabId = e.target.dataset.tab;
        this.switchTab(tabId);
      }
    });

    // Refresh analytics
    document.addEventListener('click', (e) => {
      if (e.target.closest('.refresh-analytics-btn')) {
        this.refreshAnalytics();
      }
    });
  }

  async loadAnalyticsData() {
    try {
      this.showTabLoading();
      this.analyticsData = await this.dataService.fetchAnalytics();
      this.hideTabLoading();
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      this.showTabError(error.message);
    }
  }

  switchTab(tabId) {
    if (this.isLoading) return;
    
    // Update tab buttons
    document.querySelectorAll('.analytics-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.analytics-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}-content`);
    });

    this.activeTab = tabId;
    this.showTab(tabId);
  }

  showTab(tabId) {
    if (!this.analyticsData) return;

    switch (tabId) {
      case 'forecasts':
        this.populateForecasts(this.analyticsData.forecasts);
        break;
      case 'trends':
        this.populateTrends(this.analyticsData.trends);
        break;
      case 'patterns':
        this.populatePatterns(this.analyticsData.patterns);
        break;
    }
  }

  populateForecasts(forecasts) {
    const container = document.getElementById('forecasts-content');
    if (!container) return;

    if (!forecasts || forecasts.length === 0) {
      container.innerHTML = this.getEmptyStateHTML('📈', 'No forecast data available');
      return;
    }

    const forecastsHTML = forecasts.map(forecast => `
      <div class="forecast-card">
        <h4>${this.escapeHtml(forecast.title)}</h4>
        <div class="forecast-metrics">
          ${this.buildForecastMetrics(forecast.data)}
        </div>
        <div class="forecast-chart-placeholder">
          📊 Chart: ${forecast.title}
        </div>
        <div class="forecast-summary">
          <p>Analysis based on historical data and current trends. 
          Updated every hour with latest project information.</p>
        </div>
      </div>
    `).join('');

    container.innerHTML = `<div class="forecast-grid">${forecastsHTML}</div>`;
  }

  buildForecastMetrics(data) {
    const metrics = Object.entries(data).map(([key, value]) => {
      const label = this.formatMetricLabel(key);
      const formattedValue = this.formatMetricValue(key, value);
      
      return `
        <div class="forecast-metric">
          <span class="metric-label">${label}</span>
          <span class="metric-value">${formattedValue}</span>
        </div>
      `;
    }).join('');

    return `<div class="forecast-metrics-grid">${metrics}</div>`;
  }

  populateTrends(trends) {
    const container = document.getElementById('trends-content');
    if (!container) return;

    if (!trends || trends.length === 0) {
      container.innerHTML = this.getEmptyStateHTML('📊', 'No trend data available');
      return;
    }

    const trendsHTML = trends.map(trend => `
      <div class="trend-card">
        <h4>${this.escapeHtml(trend.title)}</h4>
        <div class="trend-summary">
          <div class="trend-indicator ${trend.data.trend}">
            ${this.getTrendIcon(trend.data.trend)}
            <span class="trend-direction">${trend.data.trend}</span>
            <span class="trend-percentage">${trend.data.percentage}</span>
          </div>
          <div class="trend-period">Over ${trend.data.period}</div>
        </div>
        <div class="trend-chart-placeholder">
          📈 Trend Chart: ${trend.title}
        </div>
        <div class="trend-impact">
          <span class="impact-label">Impact:</span>
          <span class="impact-value ${trend.data.impact}">${trend.data.impact}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = `<div class="trends-grid">${trendsHTML}</div>`;
  }

  populatePatterns(patterns) {
    const container = document.getElementById('patterns-content');
    if (!container) return;

    if (!patterns || patterns.length === 0) {
      container.innerHTML = this.getEmptyStateHTML('🔍', 'No pattern data available');
      return;
    }

    const patternsHTML = patterns.map(patternGroup => `
      <div class="pattern-card">
        <h4>${this.escapeHtml(patternGroup.title)}</h4>
        <div class="pattern-list">
          ${patternGroup.patterns.map(pattern => `
            <div class="pattern-item ${pattern.severity}">
              <span class="pattern-icon">${pattern.icon}</span>
              <span class="pattern-text">${this.escapeHtml(pattern.text)}</span>
              <span class="pattern-severity">${pattern.severity}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.innerHTML = `<div class="patterns-grid">${patternsHTML}</div>`;
  }

  getTrendIcon(trend) {
    const icons = {
      increasing: '📈',
      decreasing: '📉',
      stable: '➡️',
      volatile: '📊'
    };
    return icons[trend] || '📊';
  }

  formatMetricLabel(key) {
    // Convert camelCase to readable labels
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatMetricValue(key, value) {
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('budget')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      return new Intl.NumberFormat().format(value);
    }
    return String(value);
  }

  getEmptyStateHTML(icon, text) {
    return `
      <div class="analytics-empty-state">
        <div class="empty-state-icon">${icon}</div>
        <p>${text}</p>
        <button class="btn btn--sm btn--outline" onclick="window.aiAnalyticsTabs?.refreshAnalytics()">
          Refresh Data
        </button>
      </div>
    `;
  }

  showTabLoading() {
    this.isLoading = true;
    const activeContent = document.querySelector('.analytics-tab-content.active');
    if (activeContent) {
      activeContent.innerHTML = `
        <div class="loading-spinner">
          <span>Loading analytics...</span>
        </div>
      `;
    }
  }

  hideTabLoading() {
    this.isLoading = false;
  }

  showTabError(message) {
    const activeContent = document.querySelector('.analytics-tab-content.active');
    if (activeContent) {
      activeContent.innerHTML = `
        <div class="analytics-error-state">
          <div class="error-icon">⚠️</div>
          <p>Failed to load analytics data</p>
          <button class="btn btn--sm btn--outline" onclick="window.aiAnalyticsTabs?.refreshAnalytics()">
            Retry
          </button>
        </div>
      `;
    }
  }

  async refreshAnalytics() {
    if (this.isLoading) return;
    
    try {
      await this.loadAnalyticsData();
      this.showTab(this.activeTab);
      
      if (window.showNotification) {
        window.showNotification('Analytics data refreshed', 'success');
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
      
      if (window.showNotification) {
        window.showNotification('Failed to refresh analytics', 'error');
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public methods
  getActiveTab() {
    return this.activeTab;
  }

  getAnalyticsData() {
    return this.analyticsData;
  }

  // Cleanup
  destroy() {
    // Clean up any resources if needed
    this.analyticsData = null;
  }
}

// Export the class
window.AIAnalyticsTabs = AIAnalyticsTabs;

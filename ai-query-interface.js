// AI Query Interface Controller
// Handles the AI query input, responses, and user interactions

class AIQueryInterface {
  constructor(dataService) {
    this.dataService = dataService;
    this.currentResponse = null;
    this.isProcessing = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadQuerySuggestions();
    this.updateStatus('ready');
  }

  bindEvents() {
    // Query input and send button
    const queryInput = document.getElementById('ai-query-input');
    const sendBtn = document.getElementById('query-send-btn');
    
    if (queryInput) {
      queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendQuery();
        }
      });
      
      queryInput.addEventListener('input', (e) => {
        this.handleInputChange(e.target.value);
      });
    }
    
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendQuery());
    }

    // Query suggestions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('query-suggestion')) {
        this.selectSuggestion(e.target.textContent);
      }
    });

    // Response actions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('response-action-btn')) {
        this.handleResponseAction(e.target.dataset.action);
      }
    });
  }

  loadQuerySuggestions() {
    const suggestions = this.dataService.getQuerySuggestions();
    const container = document.getElementById('query-suggestions');
    
    if (!container) return;

    // Add suggestion label
    const label = document.createElement('span');
    label.className = 'suggestion-label';
    label.textContent = 'Try asking:';
    container.appendChild(label);

    // Add suggestion buttons
    suggestions.forEach(suggestion => {
      const btn = document.createElement('button');
      btn.className = 'query-suggestion';
      btn.textContent = suggestion;
      btn.type = 'button';
      container.appendChild(btn);
    });
  }

  handleInputChange(value) {
    const sendBtn = document.getElementById('query-send-btn');
    if (sendBtn) {
      sendBtn.disabled = !value.trim() || this.isProcessing;
    }
  }

  selectSuggestion(suggestion) {
    const queryInput = document.getElementById('ai-query-input');
    if (queryInput) {
      queryInput.value = suggestion;
      queryInput.focus();
      this.handleInputChange(suggestion);
    }
  }

  updateStatus(status, message = '') {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.query-status .status-text');
    
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${status}`;
    }
    
    if (statusText) {
      const statusMessages = {
        ready: 'AI Assistant Ready',
        thinking: 'Processing your query...',
        error: 'Connection Error'
      };
      statusText.textContent = message || statusMessages[status] || status;
    }
  }

  async sendQuery() {
    const queryInput = document.getElementById('ai-query-input');
    const query = queryInput?.value?.trim();
    
    if (!query || this.isProcessing) return;

    this.isProcessing = true;
    this.updateStatus('thinking', 'Analyzing your query...');
    
    try {
      // Disable input during processing
      this.setInputState(false);
      
      const response = await this.dataService.sendQuery(query);
      this.displayResponse(response);
      this.updateStatus('ready');
      
      // Clear input after successful query
      if (queryInput) {
        queryInput.value = '';
      }
      
    } catch (error) {
      console.error('Query failed:', error);
      this.updateStatus('error', 'Query failed. Please try again.');
      this.showErrorMessage(error.message);
    } finally {
      this.isProcessing = false;
      this.setInputState(true);
    }
  }

  setInputState(enabled) {
    const queryInput = document.getElementById('ai-query-input');
    const sendBtn = document.getElementById('query-send-btn');
    
    if (queryInput) {
      queryInput.disabled = !enabled;
      if (enabled) {
        queryInput.focus();
      }
    }
    
    if (sendBtn) {
      sendBtn.disabled = !enabled;
    }
  }

  displayResponse(response) {
    this.currentResponse = response;
    
    // Remove existing response
    const existingResponse = document.querySelector('.query-response');
    if (existingResponse) {
      existingResponse.remove();
    }

    // Create new response element
    const responseEl = document.createElement('div');
    responseEl.className = 'query-response';
    responseEl.innerHTML = this.buildResponseHTML(response);

    // Insert after query container
    const queryContainer = document.querySelector('.query-input-container');
    if (queryContainer) {
      queryContainer.insertAdjacentElement('afterend', responseEl);
    }

    // Scroll to response
    responseEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  buildResponseHTML(response) {
    const timestamp = new Date(response.timestamp).toLocaleString();
    
    return `
      <div class="response-header">
        <h4 class="response-title">${this.escapeHtml(response.title)}</h4>
        <span class="response-timestamp">${timestamp}</span>
      </div>
      <div class="response-content">
        <p>${this.escapeHtml(response.content)}</p>
      </div>
      ${this.buildResponseActions(response.suggestions)}
    `;
  }

  buildResponseActions(suggestions) {
    if (!suggestions || suggestions.length === 0) return '';

    const actionsHTML = suggestions.map(suggestion => 
      `<button class="btn btn--sm btn--outline response-action-btn" data-action="suggestion" data-text="${this.escapeHtml(suggestion)}">
        ${this.escapeHtml(suggestion)}
      </button>`
    ).join('');

    return `
      <div class="response-actions">
        ${actionsHTML}
        <button class="btn btn--sm btn--secondary response-action-btn" data-action="export">
          📋 Copy Response
        </button>
        <button class="btn btn--sm btn--secondary response-action-btn" data-action="share">
          📤 Share
        </button>
      </div>
    `;
  }

  handleResponseAction(action) {
    const btn = event.target;
    
    switch (action) {
      case 'suggestion':
        const suggestionText = btn.dataset.text;
        this.selectSuggestion(suggestionText);
        break;
        
      case 'export':
        this.copyResponseToClipboard();
        break;
        
      case 'share':
        this.shareResponse();
        break;
    }
  }

  async copyResponseToClipboard() {
    if (!this.currentResponse) return;
    
    const text = `${this.currentResponse.title}\n\n${this.currentResponse.content}`;
    
    try {
      await navigator.clipboard.writeText(text);
      this.showSuccessMessage('Response copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showErrorMessage('Failed to copy response');
    }
  }

  shareResponse() {
    if (!this.currentResponse) return;
    
    if (navigator.share) {
      navigator.share({
        title: this.currentResponse.title,
        text: this.currentResponse.content
      }).catch(error => {
        console.error('Failed to share:', error);
      });
    } else {
      // Fallback: copy to clipboard
      this.copyResponseToClipboard();
    }
  }

  showSuccessMessage(message) {
    // Use the existing notification system if available
    if (window.showNotification) {
      window.showNotification(message, 'success');
    } else {
      console.log('Success:', message);
    }
  }

  showErrorMessage(message) {
    // Use the existing notification system if available
    if (window.showNotification) {
      window.showNotification(message, 'error');
    } else {
      console.error('Error:', message);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public methods for external control
  clearResponse() {
    const response = document.querySelector('.query-response');
    if (response) {
      response.remove();
    }
    this.currentResponse = null;
  }

  setQuery(query) {
    const queryInput = document.getElementById('ai-query-input');
    if (queryInput) {
      queryInput.value = query;
      this.handleInputChange(query);
    }
  }

  getLastResponse() {
    return this.currentResponse;
  }
}

// Export the class
window.AIQueryInterface = AIQueryInterface;

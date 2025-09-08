// Construction ERP - Client-Only Entry Point (for Netlify static deployment)
import './styles/main.scss';

// Simple client-side initialization without server dependencies
document.addEventListener('DOMContentLoaded', () => {
  console.log('🏗️ Construction ERP - Client-only mode initialized');
  
  // Initialize basic UI functionality
  initializeBasicUI();
  initializeDemoData();
  
  console.log('✅ Construction ERP client loaded successfully');
});

function initializeBasicUI() {
  // Basic UI initialization without server calls
  const app = document.getElementById('app');
  if (app) {
    // The app will be initialized by the existing HTML/JS
    console.log('App container found, UI will be initialized by existing scripts');
  }
}

function initializeDemoData() {
  // Set up some demo data for the static deployment
  (window as any).demoMode = true;
  (window as any).apiUrl = ''; // No API calls in static mode
  
  // Mock some basic functionality
  (window as any).showNotification = (message: string, type: string = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  };
}

// Export for compatibility
export {};

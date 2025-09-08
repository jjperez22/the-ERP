// Construction ERP - Client Application Entry Point
import './styles/main.scss';

// Import core application modules
import { ConstructionERP } from './app/ConstructionERP';
import { AIOrchestrator } from './services/AIOrchestrator';
import { RealTimeService } from './services/RealTimeService';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🏗️ Construction ERP - Initializing client application...');
  
  try {
    // Initialize core ERP application
    const erpApp = new ConstructionERP();
    
    // Initialize AI services
    const aiOrchestrator = new AIOrchestrator();
    
    // Initialize real-time services with aiOrchestrator dependency
    const realTimeService = new RealTimeService(aiOrchestrator);
    
    // Make services globally available
    (window as any).erpApp = erpApp;
    (window as any).aiOrchestrator = aiOrchestrator;
    (window as any).realTimeService = realTimeService;
    
    console.log('✅ Construction ERP client application initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize Construction ERP:', error);
    
    // Fallback initialization with basic functionality
    if (typeof (window as any).initializeApp === 'function') {
      console.log('🔄 Falling back to vanilla JavaScript initialization...');
      (window as any).initializeApp();
    } else {
      console.log('⚠️ No fallback initialization available, displaying basic UI');
      document.body.innerHTML = '<div style="padding: 20px;"><h1>Construction ERP</h1><p>Application failed to load. Please refresh the page.</p></div>';
    }
  }
});

// Export types and interfaces for other modules
export * from './types/index';
export * from './services/index';
export * from './components/index';

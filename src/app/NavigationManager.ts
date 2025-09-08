// Construction ERP - Navigation Manager
import { ModuleName } from '../types/index';

export class NavigationManager {
  private currentModule: ModuleName = 'dashboard';
  private navigationHistory: ModuleName[] = [];

  constructor() {
    this.setupNavigationListeners();
  }

  private setupNavigationListeners(): void {
    // Listen for navigation item clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const navItem = target.closest('.nav-item') as HTMLElement;
      
      if (navItem && !navItem.classList.contains('nav-item--disabled')) {
        const module = navItem.getAttribute('data-module') as ModuleName;
        if (module) {
          this.navigateToModule(module);
        }
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      const state = event.state;
      if (state && state.module) {
        this.navigateToModule(state.module, state.data, false);
      }
    });
  }

  public navigateToModule(moduleName: ModuleName, data?: any, updateHistory: boolean = true): void {
    // Validate module name
    if (!this.isValidModule(moduleName)) {
      console.warn(`⚠️ Invalid module name: ${moduleName}`);
      return;
    }

    // Hide current module
    this.hideCurrentModule();

    // Show target module
    this.showModule(moduleName);

    // Update navigation state
    this.updateNavigationState(moduleName);

    // Update browser history
    if (updateHistory) {
      this.updateBrowserHistory(moduleName, data);
    }

    // Update navigation history
    if (this.currentModule !== moduleName) {
      this.navigationHistory.push(this.currentModule);
      
      // Keep history limited to 10 entries
      if (this.navigationHistory.length > 10) {
        this.navigationHistory.shift();
      }
    }

    this.currentModule = moduleName;

    console.log(`🧭 Navigated to: ${moduleName}`);

    // Dispatch navigation event
    document.dispatchEvent(new CustomEvent('erp-module-changed', {
      detail: { module: moduleName, data }
    }));
  }

  private isValidModule(moduleName: ModuleName): boolean {
    const validModules: ModuleName[] = [
      'dashboard', 'inventory', 'customers', 'orders', 
      'financial', 'supply-chain', 'insights', 'reports'
    ];
    return validModules.includes(moduleName);
  }

  private hideCurrentModule(): void {
    const currentModuleElement = document.getElementById(this.currentModule);
    if (currentModuleElement) {
      currentModuleElement.classList.remove('active');
      currentModuleElement.style.display = 'none';
    }
  }

  private showModule(moduleName: ModuleName): void {
    const moduleElement = document.getElementById(moduleName);
    if (moduleElement) {
      moduleElement.classList.add('active');
      moduleElement.style.display = 'block';
    }
  }

  private updateNavigationState(moduleName: ModuleName): void {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to current nav item
    const currentNavItem = document.querySelector(`[data-module="${moduleName}"]`);
    if (currentNavItem) {
      currentNavItem.classList.add('active');
    }
  }

  private updateBrowserHistory(moduleName: ModuleName, data?: any): void {
    const state = { module: moduleName, data };
    const url = `${window.location.pathname}?module=${moduleName}`;
    
    window.history.pushState(state, '', url);
  }

  public getCurrentModule(): ModuleName {
    return this.currentModule;
  }

  public getNavigationHistory(): ModuleName[] {
    return [...this.navigationHistory];
  }

  public goBack(): boolean {
    if (this.navigationHistory.length > 0) {
      const previousModule = this.navigationHistory.pop()!;
      this.navigateToModule(previousModule, undefined, false);
      return true;
    }
    return false;
  }

  public canGoBack(): boolean {
    return this.navigationHistory.length > 0;
  }

  // Initialize from URL parameters
  public initializeFromURL(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module') as ModuleName;
    
    if (moduleParam && this.isValidModule(moduleParam)) {
      this.navigateToModule(moduleParam, undefined, false);
    }
  }
}

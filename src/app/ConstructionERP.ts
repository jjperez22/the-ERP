// Construction ERP - Main Application Class
import { ModuleManager } from './ModuleManager';
import { NavigationManager } from './NavigationManager';
import { DataManager } from './DataManager';
import { ERPConfig } from '../types';

export interface ERPUser {
  email: string;
  name: string;
  role: string;
  permissions?: string;
}

export class ConstructionERP {
  private moduleManager!: ModuleManager;
  private navigationManager!: NavigationManager;
  private dataManager!: DataManager;
  private currentUser: ERPUser | null = null;
  private config: ERPConfig;

  constructor(config: Partial<ERPConfig> = {}) {
    this.config = {
      apiUrl: config.apiUrl || '/api',
      enableOfflineMode: config.enableOfflineMode !== false,
      modules: config.modules || [],
      theme: config.theme || 'light',
      locale: config.locale || 'en',
      debug: config.debug || false,
      ...config
    } as ERPConfig;

    this.initializeManagers();
    this.setupEventListeners();
  }

  private initializeManagers(): void {
    this.moduleManager = new ModuleManager();
    this.navigationManager = new NavigationManager();
    this.dataManager = new DataManager(this.config);

    console.log('🎛️ ERP managers initialized');
  }

  private setupEventListeners(): void {
    // Listen for navigation events
    document.addEventListener('erp-navigate', this.handleNavigation.bind(this) as EventListener);
    
    // Listen for data update events
    document.addEventListener('erp-data-update', this.handleDataUpdate.bind(this) as EventListener);
    
    // Listen for user authentication events
    document.addEventListener('erp-user-login', this.handleUserLogin.bind(this) as EventListener);
    document.addEventListener('erp-user-logout', this.handleUserLogout.bind(this) as EventListener);
  }

  private handleNavigation(event: CustomEvent): void {
    const { module, data } = event.detail;
    console.log(`🧭 Navigating to module: ${module}`, data);
    
    this.navigationManager.navigateToModule(module, data);
    this.moduleManager.loadModule(module);
  }

  private handleDataUpdate(event: CustomEvent): void {
    const { type, data, action } = event.detail;
    console.log(`📊 Data update: ${type} - ${action}`, data);
    
    this.dataManager.handleDataUpdate(type, data, action);
  }

  private handleUserLogin(event: CustomEvent): void {
    const userData = event.detail;
    this.currentUser = userData;
    
    console.log(`👤 User logged in: ${userData.name} (${userData.role})`);
    
    // Initialize role-based permissions
    this.moduleManager.setupRoleBasedAccess(userData.role);
    
    // Show main application
    this.showMainApplication();
  }

  private handleUserLogout(): void {
    this.currentUser = null;
    console.log('👋 User logged out');
    
    // Reset application state
    this.moduleManager.resetModules();
    this.showLoginPage();
  }

  public getCurrentUser(): ERPUser | null {
    return this.currentUser;
  }

  public getConfig(): ERPConfig {
    return this.config;
  }

  private showMainApplication(): void {
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');
    
    if (loginPage && mainApp) {
      loginPage.style.display = 'none';
      mainApp.style.display = 'block';
      
      // Initialize dashboard
      this.navigationManager.navigateToModule('dashboard');
    }
  }

  private showLoginPage(): void {
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');
    
    if (loginPage && mainApp) {
      loginPage.style.display = 'block';
      mainApp.style.display = 'none';
    }
  }

  // Public API methods
  public navigateToModule(module: string, data?: any): void {
    document.dispatchEvent(new CustomEvent('erp-navigate', {
      detail: { module, data }
    }));
  }

  public updateData(type: string, data: any, action: string = 'update'): void {
    document.dispatchEvent(new CustomEvent('erp-data-update', {
      detail: { type, data, action }
    }));
  }
}

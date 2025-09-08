// Construction ERP - Module Manager
import { ModuleName, ModuleConfig, UserRole } from '../types/index';

export class ModuleManager {
  private modules: Map<ModuleName, ModuleConfig>;
  private loadedModules: Set<ModuleName>;
  private currentRole: string | null = null;

  constructor() {
    this.modules = new Map();
    this.loadedModules = new Set();
    this.initializeModules();
  }

  private initializeModules(): void {
    const moduleConfigs: ModuleConfig[] = [
      {
        name: 'dashboard',
        title: 'Dashboard',
        icon: '📊',
        permissions: ['read']
      },
      {
        name: 'inventory',
        title: 'Inventory',
        icon: '📦',
        permissions: ['read', 'write'],
        dependencies: ['dashboard-foundation.js', 'chart-library-foundation.js']
      },
      {
        name: 'customers',
        title: 'Customers',
        icon: '👥',
        permissions: ['read', 'write'],
        dependencies: ['dashboard-foundation.js']
      },
      {
        name: 'orders',
        title: 'Orders',
        icon: '📋',
        permissions: ['read', 'write'],
        dependencies: ['dashboard-foundation.js']
      },
      {
        name: 'financial',
        title: 'Financial',
        icon: '💰',
        permissions: ['read', 'admin'],
        dependencies: ['chart-library-foundation.js', 'analytics-engine-core.js']
      },
      {
        name: 'supply-chain',
        title: 'Supply Chain',
        icon: '🚚',
        permissions: ['read', 'write'],
        dependencies: ['dashboard-foundation.js']
      },
      {
        name: 'insights',
        title: 'AI Insights',
        icon: '🧠',
        permissions: ['read'],
        dependencies: [
          'ai-insights-data.js',
          'ai-insights-display.js',
          'ai-query-interface.js',
          'ai-analytics-tabs.js'
        ]
      },
      {
        name: 'reports',
        title: 'Reports',
        icon: '📈',
        permissions: ['read'],
        dependencies: ['chart-library-foundation.js', 'analytics-engine-core.js']
      }
    ];

    moduleConfigs.forEach(config => {
      this.modules.set(config.name, config);
    });

    console.log('📦 Module manager initialized with', this.modules.size, 'modules');
  }

  public setupRoleBasedAccess(role: string): void {
    this.currentRole = role;
    
    const rolePermissions: { [key: string]: ModuleName[] } = {
      'Administrator': ['dashboard', 'inventory', 'customers', 'orders', 'financial', 'supply-chain', 'insights', 'reports'],
      'Manager': ['dashboard', 'inventory', 'customers', 'orders', 'supply-chain', 'insights', 'reports'],
      'Employee': ['dashboard', 'inventory', 'orders']
    };

    const allowedModules = rolePermissions[role] || ['dashboard'];
    
    // Hide/show navigation items based on role
    this.updateNavigationAccess(allowedModules);
    
    console.log(`🔐 Role-based access configured for ${role}:`, allowedModules);
  }

  private updateNavigationAccess(allowedModules: ModuleName[]): void {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      const moduleAttr = item.getAttribute('data-module') as ModuleName;
      
      if (moduleAttr) {
        if (allowedModules.includes(moduleAttr)) {
          item.classList.remove('nav-item--disabled');
          (item as HTMLElement).style.display = '';
        } else {
          item.classList.add('nav-item--disabled');
          // Don't hide completely, but disable functionality
          (item as HTMLElement).style.opacity = '0.5';
          (item as HTMLElement).style.pointerEvents = 'none';
        }
      }
    });
  }

  public loadModule(moduleName: ModuleName): boolean {
    const moduleConfig = this.modules.get(moduleName);
    
    if (!moduleConfig) {
      console.warn(`⚠️ Module not found: ${moduleName}`);
      return false;
    }

    // Check if user has permission
    if (!this.hasModuleAccess(moduleName)) {
      console.warn(`🚫 Access denied to module: ${moduleName}`);
      return false;
    }

    // Load dependencies first
    if (moduleConfig.dependencies) {
      this.loadDependencies(moduleConfig.dependencies);
    }

    // Mark as loaded
    this.loadedModules.add(moduleName);
    
    console.log(`✅ Module loaded: ${moduleName}`);
    return true;
  }

  private hasModuleAccess(moduleName: ModuleName): boolean {
    if (!this.currentRole) return false;
    
    const rolePermissions: { [key: string]: ModuleName[] } = {
      'Administrator': ['dashboard', 'inventory', 'customers', 'orders', 'financial', 'supply-chain', 'insights', 'reports'],
      'Manager': ['dashboard', 'inventory', 'customers', 'orders', 'supply-chain', 'insights', 'reports'],
      'Employee': ['dashboard', 'inventory', 'orders']
    };

    const allowedModules = rolePermissions[this.currentRole] || ['dashboard'];
    return allowedModules.includes(moduleName);
  }

  private loadDependencies(dependencies: string[]): void {
    dependencies.forEach(dep => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${dep}"]`);
      
      if (!existingScript) {
        console.warn(`⚠️ Dependency not found: ${dep}`);
        // In a real implementation, you might want to dynamically load it
      }
    });
  }

  public getModuleConfig(moduleName: ModuleName): ModuleConfig | undefined {
    return this.modules.get(moduleName);
  }

  public getLoadedModules(): ModuleName[] {
    return Array.from(this.loadedModules);
  }

  public resetModules(): void {
    this.loadedModules.clear();
    this.currentRole = null;
    console.log('🔄 Modules reset');
  }

  public isModuleLoaded(moduleName: ModuleName): boolean {
    return this.loadedModules.has(moduleName);
  }
}

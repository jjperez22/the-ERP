/**
 * Module Loading & Unloading System - Part 2B
 * Implements dynamic module loading, dependency resolution, and clean unloading functionality
 */

class ModuleLoader {
    constructor(registry, validator) {
        this.registry = registry;
        this.validator = validator;
        this.loadedModules = new Map();
        this.loadingQueue = new Map();
        this.moduleInstances = new Map();
        this.eventEmitter = new EventTarget();
        this.loadTimeout = 30000; // 30 seconds
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen to registry events
        this.registry.on('moduleRegistered', (event) => {
            this.handleModuleRegistered(event.detail.module);
        });
        
        this.registry.on('moduleUnregistered', (event) => {
            this.handleModuleUnregistered(event.detail.moduleId);
        });
    }
    
    async loadModule(moduleId, options = {}) {
        try {
            // Check if already loaded
            if (this.loadedModules.has(moduleId)) {
                const loadedModule = this.loadedModules.get(moduleId);
                if (options.reload) {
                    await this.unloadModule(moduleId);
                } else {
                    return loadedModule;
                }
            }
            
            // Check if currently loading
            if (this.loadingQueue.has(moduleId)) {
                return await this.loadingQueue.get(moduleId);
            }
            
            // Start loading process
            const loadingPromise = this.performModuleLoad(moduleId, options);
            this.loadingQueue.set(moduleId, loadingPromise);
            
            const result = await loadingPromise;
            this.loadingQueue.delete(moduleId);
            
            return result;
            
        } catch (error) {
            this.loadingQueue.delete(moduleId);
            this.emit('moduleLoadFailed', { moduleId, error: error.message });
            throw new Error(`Failed to load module ${moduleId}: ${error.message}`);
        }
    }
    
    async performModuleLoad(moduleId, options) {
        // Get module from registry
        const moduleInfo = this.registry.getModule(moduleId);
        if (!moduleInfo) {
            throw new Error(`Module ${moduleId} not found in registry`);
        }
        
        // Check module status
        if (moduleInfo.status === 'disabled') {
            throw new Error(`Module ${moduleId} is disabled`);
        }
        
        // Load dependencies first
        await this.loadDependencies(moduleId, options);
        
        // Validate module before loading
        if (options.skipValidation !== true) {
            const validationResult = await this.validator.validateModule(moduleInfo);
            if (!validationResult.valid) {
                throw new Error(`Module validation failed: ${validationResult.errors.join(', ')}`);
            }
        }
        
        // Create loading context
        const loadingContext = this.createLoadingContext(moduleInfo, options);
        
        // Load module code
        const moduleCode = await this.loadModuleCode(moduleInfo);
        
        // Create sandbox if required
        let sandbox = null;
        if (options.sandboxed !== false) {
            sandbox = this.validator.createSandbox();
        }
        
        // Execute module in controlled environment
        const moduleInstance = await this.executeModule(moduleInfo, moduleCode, loadingContext, sandbox);
        
        // Store loaded module
        const loadedModule = {
            id: moduleId,
            info: moduleInfo,
            instance: moduleInstance,
            loadedAt: new Date().toISOString(),
            dependencies: this.registry.getDependencies(moduleId),
            sandbox: sandbox,
            context: loadingContext
        };
        
        this.loadedModules.set(moduleId, loadedModule);
        this.moduleInstances.set(moduleId, moduleInstance);
        
        // Update module status
        this.registry.updateModuleStatus(moduleId, 'loaded');
        
        // Emit event
        this.emit('moduleLoaded', { moduleId, module: loadedModule });
        
        return loadedModule;
    }
    
    async loadDependencies(moduleId, options) {
        const dependencies = this.registry.getDependencies(moduleId);
        if (!dependencies || dependencies.length === 0) {
            return;
        }
        
        // Resolve dependency load order
        const loadOrder = this.resolveDependencyLoadOrder(dependencies);
        
        // Load dependencies in correct order
        for (const depId of loadOrder) {
            if (!this.loadedModules.has(depId)) {
                await this.loadModule(depId, { 
                    ...options, 
                    skipValidation: false 
                });
            }
        }
    }
    
    resolveDependencyLoadOrder(dependencies) {
        const visited = new Set();
        const visiting = new Set();
        const order = [];
        
        const visit = (depId) => {
            if (visiting.has(depId)) {
                throw new Error(`Circular dependency detected: ${depId}`);
            }
            
            if (visited.has(depId)) {
                return;
            }
            
            visiting.add(depId);
            
            const depDependencies = this.registry.getDependencies(depId);
            for (const subDep of depDependencies) {
                visit(subDep.id);
            }
            
            visiting.delete(depId);
            visited.add(depId);
            order.push(depId);
        };
        
        for (const dep of dependencies) {
            visit(dep.id);
        }
        
        return order;
    }
    
    createLoadingContext(moduleInfo, options) {
        return {
            moduleId: moduleInfo.id,
            moduleName: moduleInfo.name,
            version: moduleInfo.version,
            permissions: moduleInfo.permissions || [],
            config: { ...moduleInfo.config, ...options.config },
            api: this.createModuleAPI(moduleInfo),
            events: this.createEventAPI(moduleInfo.id)
        };
    }
    
    createModuleAPI(moduleInfo) {
        return {
            getRegistry: () => this.registry,
            getLoader: () => this,
            getDependency: (depId) => this.moduleInstances.get(depId),
            log: (message, level = 'info') => {
                console.log(`[${moduleInfo.id}] ${level.toUpperCase()}: ${message}`);
            }
        };
    }
    
    createEventAPI(moduleId) {
        return {
            emit: (eventName, data) => {
                this.emit(`module:${moduleId}:${eventName}`, { moduleId, ...data });
            },
            on: (eventName, callback) => {
                this.on(`module:${moduleId}:${eventName}`, callback);
            },
            off: (eventName, callback) => {
                this.off(`module:${moduleId}:${eventName}`, callback);
            }
        };
    }
    
    async loadModuleCode(moduleInfo) {
        // For demo purposes, assume code is stored in moduleInfo
        // In a real implementation, this would load from files/URLs
        if (moduleInfo.code) {
            return moduleInfo.code;
        }
        
        if (moduleInfo.entryPoint) {
            // Simulate loading from entry point
            return await this.loadFromEntryPoint(moduleInfo.entryPoint);
        }
        
        throw new Error(`No code or entry point found for module ${moduleInfo.id}`);
    }
    
    async loadFromEntryPoint(entryPoint) {
        // Placeholder for loading code from entry point
        // In a real implementation, this would use fetch, require, or import
        console.log(`Loading module from entry point: ${entryPoint}`);
        return `
            // Module loaded from ${entryPoint}
            class Module {
                constructor(context) {
                    this.context = context;
                    this.initialized = false;
                }
                
                async init() {
                    this.context.api.log('Module initialized');
                    this.initialized = true;
                    return true;
                }
                
                async destroy() {
                    this.context.api.log('Module destroyed');
                    this.initialized = false;
                    return true;
                }
            }
            
            return new Module(context);
        `;
    }
    
    async executeModule(moduleInfo, code, context, sandbox) {
        try {
            let moduleInstance;
            
            if (sandbox) {
                // Execute in sandbox
                const safeContext = sandbox.createSafeContext(moduleInfo.permissions);
                safeContext.context = context;
                
                const wrappedCode = `
                    (function(context) {
                        ${code}
                    })(context);
                `;
                
                moduleInstance = sandbox.executeInSandbox(wrappedCode, safeContext);
            } else {
                // Execute in normal context
                const moduleFunction = new Function('context', `
                    ${code}
                `);
                moduleInstance = moduleFunction(context);
            }
            
            // Initialize module if it has an init method
            if (moduleInstance && typeof moduleInstance.init === 'function') {
                await moduleInstance.init();
            }
            
            return moduleInstance;
            
        } catch (error) {
            throw new Error(`Module execution failed: ${error.message}`);
        }
    }
    
    async unloadModule(moduleId, options = {}) {
        try {
            const loadedModule = this.loadedModules.get(moduleId);
            if (!loadedModule) {
                return false;
            }
            
            // Check for dependent modules
            if (!options.force) {
                const dependents = this.findDependentLoadedModules(moduleId);
                if (dependents.length > 0) {
                    throw new Error(`Cannot unload module ${moduleId}. It is required by: ${dependents.join(', ')}`);
                }
            }
            
            // Call module destroy method if it exists
            if (loadedModule.instance && typeof loadedModule.instance.destroy === 'function') {
                await loadedModule.instance.destroy();
            }
            
            // Clean up resources
            await this.cleanupModuleResources(moduleId, loadedModule);
            
            // Remove from loaded modules
            this.loadedModules.delete(moduleId);
            this.moduleInstances.delete(moduleId);
            
            // Update status
            this.registry.updateModuleStatus(moduleId, 'unloaded');
            
            // Emit event
            this.emit('moduleUnloaded', { moduleId, module: loadedModule });
            
            return true;
            
        } catch (error) {
            this.emit('moduleUnloadFailed', { moduleId, error: error.message });
            throw new Error(`Failed to unload module ${moduleId}: ${error.message}`);
        }
    }
    
    findDependentLoadedModules(moduleId) {
        const dependents = [];
        
        for (const [loadedId, loadedModule] of this.loadedModules) {
            if (loadedModule.dependencies.some(dep => dep.id === moduleId)) {
                dependents.push(loadedId);
            }
        }
        
        return dependents;
    }
    
    async cleanupModuleResources(moduleId, loadedModule) {
        try {
            // Remove event listeners
            // (This would be more complex in a real implementation)
            
            // Clear any timers
            // (Module should handle this in its destroy method)
            
            // Clean up DOM elements if any
            // (Module should handle this in its destroy method)
            
            console.log(`Cleaned up resources for module: ${moduleId}`);
            
        } catch (error) {
            console.warn(`Error cleaning up module ${moduleId}:`, error);
        }
    }
    
    async reloadModule(moduleId, options = {}) {
        try {
            await this.unloadModule(moduleId, { force: true });
            return await this.loadModule(moduleId, { ...options, reload: true });
        } catch (error) {
            throw new Error(`Failed to reload module ${moduleId}: ${error.message}`);
        }
    }
    
    isModuleLoaded(moduleId) {
        return this.loadedModules.has(moduleId);
    }
    
    getLoadedModule(moduleId) {
        return this.loadedModules.get(moduleId);
    }
    
    getLoadedModules() {
        return Array.from(this.loadedModules.values());
    }
    
    getModuleInstance(moduleId) {
        return this.moduleInstances.get(moduleId);
    }
    
    async loadModulesInOrder(moduleIds, options = {}) {
        const results = [];
        
        for (const moduleId of moduleIds) {
            try {
                const result = await this.loadModule(moduleId, options);
                results.push({ moduleId, success: true, result });
            } catch (error) {
                results.push({ moduleId, success: false, error: error.message });
                
                if (options.stopOnError) {
                    break;
                }
            }
        }
        
        return results;
    }
    
    async unloadAllModules(options = {}) {
        const loadedIds = Array.from(this.loadedModules.keys());
        const results = [];
        
        // Unload in reverse dependency order
        const unloadOrder = this.calculateUnloadOrder(loadedIds);
        
        for (const moduleId of unloadOrder) {
            try {
                await this.unloadModule(moduleId, { force: options.force });
                results.push({ moduleId, success: true });
            } catch (error) {
                results.push({ moduleId, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    calculateUnloadOrder(moduleIds) {
        // Calculate reverse dependency order for clean unloading
        const dependencyMap = new Map();
        
        for (const moduleId of moduleIds) {
            const deps = this.findDependentLoadedModules(moduleId);
            dependencyMap.set(moduleId, deps);
        }
        
        const visited = new Set();
        const order = [];
        
        const visit = (moduleId) => {
            if (visited.has(moduleId)) return;
            
            visited.add(moduleId);
            const dependents = dependencyMap.get(moduleId) || [];
            
            for (const dependent of dependents) {
                if (moduleIds.includes(dependent)) {
                    visit(dependent);
                }
            }
            
            order.push(moduleId);
        };
        
        for (const moduleId of moduleIds) {
            visit(moduleId);
        }
        
        return order;
    }
    
    handleModuleRegistered(module) {
        // Handle new module registration
        this.emit('moduleAvailable', { module });
    }
    
    handleModuleUnregistered(moduleId) {
        // Handle module unregistration
        if (this.loadedModules.has(moduleId)) {
            this.unloadModule(moduleId, { force: true })
                .catch(error => {
                    console.error(`Failed to unload removed module ${moduleId}:`, error);
                });
        }
    }
    
    getLoaderStats() {
        const loadedModules = this.getLoadedModules();
        
        return {
            totalLoaded: loadedModules.length,
            loadingQueue: this.loadingQueue.size,
            loadedModuleIds: loadedModules.map(m => m.id),
            memoryUsage: this.estimateMemoryUsage(),
            avgLoadTime: this.calculateAverageLoadTime()
        };
    }
    
    estimateMemoryUsage() {
        // Rough estimate of memory usage
        let size = 0;
        
        for (const module of this.loadedModules.values()) {
            size += JSON.stringify(module.info).length;
            // Add estimated instance size
            size += 1024; // Rough estimate per module instance
        }
        
        return size;
    }
    
    calculateAverageLoadTime() {
        // This would track load times in a real implementation
        return 0; // Placeholder
    }
    
    // Event management
    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        this.eventEmitter.dispatchEvent(event);
    }
    
    on(eventName, callback) {
        this.eventEmitter.addEventListener(eventName, callback);
    }
    
    off(eventName, callback) {
        this.eventEmitter.removeEventListener(eventName, callback);
    }
}

// Utility class for module dependency resolution
class DependencyResolver {
    constructor(registry) {
        this.registry = registry;
    }
    
    resolveDependencies(moduleId) {
        const resolved = [];
        const visited = new Set();
        const visiting = new Set();
        
        this.visitModule(moduleId, resolved, visited, visiting);
        
        return resolved;
    }
    
    visitModule(moduleId, resolved, visited, visiting) {
        if (visiting.has(moduleId)) {
            throw new Error(`Circular dependency detected involving: ${moduleId}`);
        }
        
        if (visited.has(moduleId)) {
            return;
        }
        
        visiting.add(moduleId);
        
        const dependencies = this.registry.getDependencies(moduleId);
        for (const dep of dependencies) {
            this.visitModule(dep.id, resolved, visited, visiting);
        }
        
        visiting.delete(moduleId);
        visited.add(moduleId);
        resolved.push(moduleId);
    }
    
    findCircularDependencies() {
        const issues = [];
        const allModules = this.registry.getAllModules();
        
        for (const module of allModules) {
            try {
                this.resolveDependencies(module.id);
            } catch (error) {
                if (error.message.includes('Circular dependency')) {
                    issues.push({
                        type: 'circular_dependency',
                        moduleId: module.id,
                        message: error.message
                    });
                }
            }
        }
        
        return issues;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModuleLoader, DependencyResolver };
}

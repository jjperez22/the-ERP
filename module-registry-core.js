/**
 * Module Management System - Part 1: Core Module Registry
 * Provides centralized registry for tracking installed modules, versions, dependencies, and status
 */

class ModuleRegistry {
    constructor() {
        this.modules = new Map();
        this.dependencies = new Map();
        this.loadOrder = [];
        this.eventEmitter = new EventTarget();
        this.storage = new ModuleStorage();
        
        this.init();
    }
    
    async init() {
        // Load existing module registry from storage
        await this.loadRegistry();
        this.validateRegistry();
    }
    
    // Module Registration Methods
    registerModule(moduleDefinition) {
        const validation = this.validateModuleDefinition(moduleDefinition);
        if (!validation.valid) {
            throw new Error(`Invalid module definition: ${validation.errors.join(', ')}`);
        }
        
        const module = {
            id: moduleDefinition.id,
            name: moduleDefinition.name,
            version: moduleDefinition.version,
            description: moduleDefinition.description || '',
            author: moduleDefinition.author || 'Unknown',
            category: moduleDefinition.category || 'General',
            dependencies: moduleDefinition.dependencies || [],
            permissions: moduleDefinition.permissions || [],
            entryPoint: moduleDefinition.entryPoint,
            assets: moduleDefinition.assets || [],
            config: moduleDefinition.config || {},
            status: 'registered',
            registeredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                size: moduleDefinition.size || 0,
                checksum: moduleDefinition.checksum || '',
                source: moduleDefinition.source || 'local',
                tags: moduleDefinition.tags || []
            }
        };
        
        // Check for conflicts
        if (this.modules.has(module.id)) {
            const existing = this.modules.get(module.id);
            if (this.compareVersions(existing.version, module.version) >= 0) {
                throw new Error(`Module ${module.id} version ${module.version} is not newer than installed version ${existing.version}`);
            }
        }
        
        // Register dependencies
        this.registerDependencies(module);
        
        // Store module
        this.modules.set(module.id, module);
        
        // Emit event
        this.emit('moduleRegistered', { module });
        
        // Save to storage
        this.saveRegistry();
        
        return module;
    }
    
    unregisterModule(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) {
            throw new Error(`Module ${moduleId} not found`);
        }
        
        // Check for dependent modules
        const dependents = this.findDependentModules(moduleId);
        if (dependents.length > 0) {
            throw new Error(`Cannot unregister module ${moduleId}. It is required by: ${dependents.join(', ')}`);
        }
        
        // Remove from registry
        this.modules.delete(moduleId);
        this.dependencies.delete(moduleId);
        this.loadOrder = this.loadOrder.filter(id => id !== moduleId);
        
        // Emit event
        this.emit('moduleUnregistered', { moduleId, module });
        
        // Save to storage
        this.saveRegistry();
        
        return true;
    }
    
    // Module Query Methods
    getModule(moduleId) {
        return this.modules.get(moduleId);
    }
    
    getAllModules() {
        return Array.from(this.modules.values());
    }
    
    getModulesByCategory(category) {
        return this.getAllModules().filter(module => module.category === category);
    }
    
    getModulesByStatus(status) {
        return this.getAllModules().filter(module => module.status === status);
    }
    
    searchModules(query) {
        const searchTerm = query.toLowerCase();
        return this.getAllModules().filter(module => 
            module.name.toLowerCase().includes(searchTerm) ||
            module.description.toLowerCase().includes(searchTerm) ||
            module.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    // Module Status Management
    updateModuleStatus(moduleId, status, metadata = {}) {
        const module = this.modules.get(moduleId);
        if (!module) {
            throw new Error(`Module ${moduleId} not found`);
        }
        
        const oldStatus = module.status;
        module.status = status;
        module.updatedAt = new Date().toISOString();
        
        // Update metadata if provided
        Object.assign(module.metadata, metadata);
        
        this.emit('moduleStatusChanged', { moduleId, oldStatus, newStatus: status, module });
        
        this.saveRegistry();
        return module;
    }
    
    // Dependency Management
    registerDependencies(module) {
        if (!module.dependencies || module.dependencies.length === 0) {
            return;
        }
        
        const deps = module.dependencies.map(dep => {
            if (typeof dep === 'string') {
                return { id: dep, version: '*' };
            }
            return dep;
        });
        
        this.dependencies.set(module.id, deps);
    }
    
    getDependencies(moduleId) {
        return this.dependencies.get(moduleId) || [];
    }
    
    findDependentModules(moduleId) {
        const dependents = [];
        for (const [id, deps] of this.dependencies) {
            if (deps.some(dep => dep.id === moduleId)) {
                dependents.push(id);
            }
        }
        return dependents;
    }
    
    resolveDependencyOrder() {
        const visited = new Set();
        const visiting = new Set();
        const order = [];
        
        const visit = (moduleId) => {
            if (visiting.has(moduleId)) {
                throw new Error(`Circular dependency detected involving module: ${moduleId}`);
            }
            
            if (visited.has(moduleId)) {
                return;
            }
            
            visiting.add(moduleId);
            
            const dependencies = this.getDependencies(moduleId);
            for (const dep of dependencies) {
                if (this.modules.has(dep.id)) {
                    visit(dep.id);
                } else {
                    throw new Error(`Missing dependency: ${dep.id} required by ${moduleId}`);
                }
            }
            
            visiting.delete(moduleId);
            visited.add(moduleId);
            order.push(moduleId);
        };
        
        // Visit all modules
        for (const moduleId of this.modules.keys()) {
            if (!visited.has(moduleId)) {
                visit(moduleId);
            }
        }
        
        this.loadOrder = order;
        return order;
    }
    
    validateDependencies() {
        const issues = [];
        
        for (const [moduleId, deps] of this.dependencies) {
            for (const dep of deps) {
                const depModule = this.modules.get(dep.id);
                
                if (!depModule) {
                    issues.push({
                        type: 'missing_dependency',
                        moduleId,
                        dependency: dep.id,
                        message: `Module ${moduleId} requires ${dep.id} which is not installed`
                    });
                    continue;
                }
                
                if (dep.version !== '*' && !this.satisfiesVersion(depModule.version, dep.version)) {
                    issues.push({
                        type: 'version_mismatch',
                        moduleId,
                        dependency: dep.id,
                        required: dep.version,
                        installed: depModule.version,
                        message: `Module ${moduleId} requires ${dep.id} version ${dep.version}, but ${depModule.version} is installed`
                    });
                }
            }
        }
        
        return issues;
    }
    
    // Version Management
    compareVersions(version1, version2) {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;
            
            if (v1Part > v2Part) return 1;
            if (v1Part < v2Part) return -1;
        }
        
        return 0;
    }
    
    satisfiesVersion(installedVersion, requiredVersion) {
        if (requiredVersion === '*') return true;
        
        // Simple version matching - can be extended for semver
        if (requiredVersion.startsWith('^')) {
            const baseVersion = requiredVersion.slice(1);
            return this.compareVersions(installedVersion, baseVersion) >= 0;
        }
        
        if (requiredVersion.startsWith('~')) {
            const baseVersion = requiredVersion.slice(1);
            // Compatible within same minor version
            const baseParts = baseVersion.split('.');
            const installedParts = installedVersion.split('.');
            
            return baseParts[0] === installedParts[0] && 
                   baseParts[1] === installedParts[1] &&
                   this.compareVersions(installedVersion, baseVersion) >= 0;
        }
        
        // Exact version match
        return installedVersion === requiredVersion;
    }
    
    // Validation Methods
    validateModuleDefinition(moduleDefinition) {
        const errors = [];
        
        if (!moduleDefinition.id) errors.push('Module ID is required');
        if (!moduleDefinition.name) errors.push('Module name is required');
        if (!moduleDefinition.version) errors.push('Module version is required');
        if (!moduleDefinition.entryPoint) errors.push('Module entry point is required');
        
        // Validate ID format
        if (moduleDefinition.id && !/^[a-zA-Z0-9_-]+$/.test(moduleDefinition.id)) {
            errors.push('Module ID can only contain letters, numbers, underscores, and hyphens');
        }
        
        // Validate version format
        if (moduleDefinition.version && !/^\d+\.\d+\.\d+/.test(moduleDefinition.version)) {
            errors.push('Module version must follow semantic versioning (x.y.z)');
        }
        
        // Validate dependencies
        if (moduleDefinition.dependencies) {
            moduleDefinition.dependencies.forEach((dep, index) => {
                if (typeof dep === 'string') return; // Simple string dependency is OK
                
                if (!dep.id) {
                    errors.push(`Dependency ${index} is missing ID`);
                }
                if (!dep.version) {
                    errors.push(`Dependency ${index} is missing version requirement`);
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    validateRegistry() {
        const issues = [];
        
        // Check for dependency issues
        const depIssues = this.validateDependencies();
        issues.push(...depIssues);
        
        // Check for duplicate modules
        const moduleIds = new Set();
        for (const module of this.modules.values()) {
            if (moduleIds.has(module.id)) {
                issues.push({
                    type: 'duplicate_module',
                    moduleId: module.id,
                    message: `Duplicate module ID: ${module.id}`
                });
            }
            moduleIds.add(module.id);
        }
        
        if (issues.length > 0) {
            this.emit('registryValidationIssues', { issues });
        }
        
        return issues;
    }
    
    // Storage Methods
    async loadRegistry() {
        try {
            const data = await this.storage.load('module-registry');
            if (data) {
                data.modules.forEach(module => {
                    this.modules.set(module.id, module);
                });
                
                data.dependencies.forEach(([moduleId, deps]) => {
                    this.dependencies.set(moduleId, deps);
                });
                
                this.loadOrder = data.loadOrder || [];
            }
        } catch (error) {
            console.warn('Failed to load module registry:', error);
        }
    }
    
    async saveRegistry() {
        try {
            const data = {
                modules: Array.from(this.modules.values()),
                dependencies: Array.from(this.dependencies.entries()),
                loadOrder: this.loadOrder,
                savedAt: new Date().toISOString()
            };
            
            await this.storage.save('module-registry', data);
        } catch (error) {
            console.error('Failed to save module registry:', error);
        }
    }
    
    // Event Management
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
    
    // Utility Methods
    getRegistryStats() {
        const modules = this.getAllModules();
        const categories = new Set(modules.map(m => m.category));
        const statuses = new Set(modules.map(m => m.status));
        
        return {
            totalModules: modules.length,
            categories: Array.from(categories),
            statuses: Array.from(statuses),
            statusCounts: Object.fromEntries(
                Array.from(statuses).map(status => [
                    status, 
                    modules.filter(m => m.status === status).length
                ])
            ),
            categoryCounts: Object.fromEntries(
                Array.from(categories).map(category => [
                    category, 
                    modules.filter(m => m.category === category).length
                ])
            ),
            dependencyIssues: this.validateDependencies().length,
            loadOrderLength: this.loadOrder.length
        };
    }
    
    exportRegistry() {
        return {
            modules: Array.from(this.modules.entries()),
            dependencies: Array.from(this.dependencies.entries()),
            loadOrder: this.loadOrder,
            exportedAt: new Date().toISOString()
        };
    }
    
    importRegistry(registryData) {
        this.modules.clear();
        this.dependencies.clear();
        this.loadOrder = [];
        
        if (registryData.modules) {
            registryData.modules.forEach(([id, module]) => {
                this.modules.set(id, module);
            });
        }
        
        if (registryData.dependencies) {
            registryData.dependencies.forEach(([id, deps]) => {
                this.dependencies.set(id, deps);
            });
        }
        
        if (registryData.loadOrder) {
            this.loadOrder = registryData.loadOrder;
        }
        
        this.validateRegistry();
        this.saveRegistry();
        
        this.emit('registryImported', { registryData });
    }
}

/**
 * Module Storage Handler
 * Handles persistent storage of module registry data
 */
class ModuleStorage {
    constructor() {
        this.storageKey = 'erp-module-registry';
    }
    
    async save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            
            // Try localStorage first
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`${this.storageKey}-${key}`, serialized);
                return;
            }
            
            // Fallback to in-memory storage (for Node.js environments)
            if (!this.memoryStorage) {
                this.memoryStorage = new Map();
            }
            this.memoryStorage.set(key, serialized);
            
        } catch (error) {
            throw new Error(`Failed to save ${key}: ${error.message}`);
        }
    }
    
    async load(key) {
        try {
            let serialized = null;
            
            // Try localStorage first
            if (typeof localStorage !== 'undefined') {
                serialized = localStorage.getItem(`${this.storageKey}-${key}`);
            } else if (this.memoryStorage) {
                serialized = this.memoryStorage.get(key);
            }
            
            if (!serialized) {
                return null;
            }
            
            return JSON.parse(serialized);
            
        } catch (error) {
            throw new Error(`Failed to load ${key}: ${error.message}`);
        }
    }
    
    async remove(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(`${this.storageKey}-${key}`);
            } else if (this.memoryStorage) {
                this.memoryStorage.delete(key);
            }
        } catch (error) {
            throw new Error(`Failed to remove ${key}: ${error.message}`);
        }
    }
}

// Global registry instance
let moduleRegistry;

// Initialize when DOM is loaded or immediately in Node.js
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        moduleRegistry = new ModuleRegistry();
    });
} else {
    moduleRegistry = new ModuleRegistry();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModuleRegistry, ModuleStorage };
}

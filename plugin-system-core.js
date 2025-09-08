/**
 * Plugin Architecture - Part 1: Core Plugin System
 * Registration, lifecycle management, and security sandbox
 */

class PluginSystem {
    constructor(options = {}) {
        this.options = {
            sandboxMode: options.sandboxMode !== false,
            maxPlugins: options.maxPlugins || 50,
            allowedDomains: options.allowedDomains || [],
            apiVersion: options.apiVersion || '1.0.0',
            ...options
        };
        
        this.plugins = new Map();
        this.pluginStates = new Map();
        this.hooks = new Map();
        this.api = new Map();
        this.eventBus = new EventTarget();
        this.securityContext = new Map();
        
        this.init();
    }

    init() {
        this.registerCoreAPI();
        this.setupSecuritySandbox();
        console.log('🔌 Plugin System initialized');
    }

    // ========== PLUGIN REGISTRATION ==========
    
    /**
     * Register a new plugin
     */
    async registerPlugin(pluginConfig) {
        try {
            // Validate plugin configuration
            this.validatePluginConfig(pluginConfig);
            
            // Security check
            if (!this.isPluginSecure(pluginConfig)) {
                throw new Error('Plugin failed security validation');
            }
            
            // Check if plugin already exists
            if (this.plugins.has(pluginConfig.id)) {
                throw new Error(`Plugin '${pluginConfig.id}' is already registered`);
            }
            
            // Create plugin instance
            const plugin = await this.createPluginInstance(pluginConfig);
            
            // Register plugin
            this.plugins.set(pluginConfig.id, plugin);
            this.pluginStates.set(pluginConfig.id, 'registered');
            
            // Set up security context
            this.setupPluginSecurity(pluginConfig.id);
            
            this.emit('pluginRegistered', { pluginId: pluginConfig.id, plugin });
            console.log(`🔌 Plugin '${pluginConfig.id}' registered successfully`);
            
            return plugin;
            
        } catch (error) {
            console.error(`Failed to register plugin '${pluginConfig.id}':`, error);
            throw error;
        }
    }

    /**
     * Validate plugin configuration
     */
    validatePluginConfig(config) {
        const required = ['id', 'name', 'version', 'author'];
        const missing = required.filter(field => !config[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required plugin fields: ${missing.join(', ')}`);
        }
        
        if (!/^[a-zA-Z0-9-_]+$/.test(config.id)) {
            throw new Error('Plugin ID must contain only alphanumeric characters, hyphens, and underscores');
        }
        
        if (!this.isValidVersion(config.version)) {
            throw new Error('Invalid plugin version format');
        }
        
        if (this.plugins.size >= this.options.maxPlugins) {
            throw new Error(`Maximum plugin limit (${this.options.maxPlugins}) reached`);
        }
    }

    /**
     * Check if plugin meets security requirements
     */
    isPluginSecure(config) {
        // Check if plugin source is from allowed domains
        if (config.source && this.options.allowedDomains.length > 0) {
            const sourceUrl = new URL(config.source);
            if (!this.options.allowedDomains.includes(sourceUrl.hostname)) {
                return false;
            }
        }
        
        // Check for dangerous permissions
        const dangerousPerms = ['system', 'filesystem', 'network-unrestricted'];
        if (config.permissions && config.permissions.some(p => dangerousPerms.includes(p))) {
            return false;
        }
        
        return true;
    }

    /**
     * Create plugin instance
     */
    async createPluginInstance(config) {
        const plugin = {
            id: config.id,
            name: config.name,
            version: config.version,
            author: config.author,
            description: config.description || '',
            permissions: config.permissions || [],
            dependencies: config.dependencies || [],
            hooks: config.hooks || [],
            api: config.api || {},
            instance: null,
            config: config,
            registeredAt: new Date(),
            lastUpdated: new Date()
        };
        
        // Load plugin code if provided
        if (config.code || config.source) {
            plugin.instance = await this.loadPluginCode(plugin, config);
        }
        
        return plugin;
    }

    /**
     * Load and execute plugin code
     */
    async loadPluginCode(plugin, config) {
        try {
            let code = config.code;
            
            // Fetch code from source if needed
            if (!code && config.source) {
                const response = await fetch(config.source);
                code = await response.text();
            }
            
            if (!code) {
                throw new Error('No plugin code provided');
            }
            
            // Create sandboxed execution context
            const sandbox = this.createSandbox(plugin);
            
            // Execute plugin code in sandbox
            const pluginFactory = new Function('sandbox', 'api', code);
            const instance = pluginFactory(sandbox, this.getPluginAPI(plugin.id));
            
            return instance;
            
        } catch (error) {
            console.error(`Failed to load plugin code for '${plugin.id}':`, error);
            throw error;
        }
    }

    // ========== PLUGIN LIFECYCLE MANAGEMENT ==========
    
    /**
     * Activate a plugin
     */
    async activatePlugin(pluginId) {
        try {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin '${pluginId}' not found`);
            }
            
            const currentState = this.pluginStates.get(pluginId);
            if (currentState === 'active') {
                console.log(`Plugin '${pluginId}' is already active`);
                return;
            }
            
            // Check dependencies
            await this.resolveDependencies(plugin);
            
            // Set state to activating
            this.pluginStates.set(pluginId, 'activating');
            
            // Register hooks
            this.registerPluginHooks(plugin);
            
            // Call plugin activation
            if (plugin.instance && typeof plugin.instance.activate === 'function') {
                await plugin.instance.activate();
            }
            
            // Set state to active
            this.pluginStates.set(pluginId, 'active');
            plugin.lastUpdated = new Date();
            
            this.emit('pluginActivated', { pluginId, plugin });
            console.log(`🔌 Plugin '${pluginId}' activated successfully`);
            
        } catch (error) {
            this.pluginStates.set(pluginId, 'error');
            console.error(`Failed to activate plugin '${pluginId}':`, error);
            throw error;
        }
    }

    /**
     * Deactivate a plugin
     */
    async deactivatePlugin(pluginId) {
        try {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin '${pluginId}' not found`);
            }
            
            const currentState = this.pluginStates.get(pluginId);
            if (currentState !== 'active') {
                console.log(`Plugin '${pluginId}' is not active`);
                return;
            }
            
            // Set state to deactivating
            this.pluginStates.set(pluginId, 'deactivating');
            
            // Call plugin deactivation
            if (plugin.instance && typeof plugin.instance.deactivate === 'function') {
                await plugin.instance.deactivate();
            }
            
            // Unregister hooks
            this.unregisterPluginHooks(plugin);
            
            // Set state to inactive
            this.pluginStates.set(pluginId, 'inactive');
            plugin.lastUpdated = new Date();
            
            this.emit('pluginDeactivated', { pluginId, plugin });
            console.log(`🔌 Plugin '${pluginId}' deactivated successfully`);
            
        } catch (error) {
            this.pluginStates.set(pluginId, 'error');
            console.error(`Failed to deactivate plugin '${pluginId}':`, error);
            throw error;
        }
    }

    /**
     * Unregister a plugin
     */
    async unregisterPlugin(pluginId) {
        try {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin '${pluginId}' not found`);
            }
            
            // Deactivate if active
            if (this.pluginStates.get(pluginId) === 'active') {
                await this.deactivatePlugin(pluginId);
            }
            
            // Clean up plugin data
            this.plugins.delete(pluginId);
            this.pluginStates.delete(pluginId);
            this.securityContext.delete(pluginId);
            
            // Clean up API registrations
            this.api.forEach((value, key) => {
                if (key.startsWith(`${pluginId}.`)) {
                    this.api.delete(key);
                }
            });
            
            this.emit('pluginUnregistered', { pluginId });
            console.log(`🔌 Plugin '${pluginId}' unregistered successfully`);
            
        } catch (error) {
            console.error(`Failed to unregister plugin '${pluginId}':`, error);
            throw error;
        }
    }

    // ========== DEPENDENCY MANAGEMENT ==========
    
    /**
     * Resolve plugin dependencies
     */
    async resolveDependencies(plugin) {
        if (!plugin.dependencies || plugin.dependencies.length === 0) {
            return;
        }
        
        for (const dependency of plugin.dependencies) {
            const depPlugin = this.plugins.get(dependency);
            if (!depPlugin) {
                throw new Error(`Dependency '${dependency}' not found for plugin '${plugin.id}'`);
            }
            
            if (this.pluginStates.get(dependency) !== 'active') {
                console.log(`Activating dependency '${dependency}' for plugin '${plugin.id}'`);
                await this.activatePlugin(dependency);
            }
        }
    }

    // ========== HOOK SYSTEM ==========
    
    /**
     * Register plugin hooks
     */
    registerPluginHooks(plugin) {
        if (!plugin.hooks || plugin.hooks.length === 0) return;
        
        plugin.hooks.forEach(hookName => {
            if (!this.hooks.has(hookName)) {
                this.hooks.set(hookName, []);
            }
            
            const hookFunction = plugin.instance[hookName];
            if (typeof hookFunction === 'function') {
                this.hooks.get(hookName).push({
                    pluginId: plugin.id,
                    function: hookFunction.bind(plugin.instance)
                });
                
                console.log(`🔌 Registered hook '${hookName}' for plugin '${plugin.id}'`);
            }
        });
    }

    /**
     * Unregister plugin hooks
     */
    unregisterPluginHooks(plugin) {
        if (!plugin.hooks || plugin.hooks.length === 0) return;
        
        plugin.hooks.forEach(hookName => {
            if (this.hooks.has(hookName)) {
                const hooks = this.hooks.get(hookName);
                const filtered = hooks.filter(hook => hook.pluginId !== plugin.id);
                this.hooks.set(hookName, filtered);
                
                console.log(`🔌 Unregistered hook '${hookName}' for plugin '${plugin.id}'`);
            }
        });
    }

    /**
     * Execute hooks
     */
    async executeHook(hookName, ...args) {
        if (!this.hooks.has(hookName)) return [];
        
        const hooks = this.hooks.get(hookName);
        const results = [];
        
        for (const hook of hooks) {
            try {
                const result = await hook.function(...args);
                results.push({ pluginId: hook.pluginId, result });
            } catch (error) {
                console.error(`Hook '${hookName}' failed for plugin '${hook.pluginId}':`, error);
                results.push({ pluginId: hook.pluginId, error });
            }
        }
        
        return results;
    }

    // ========== SECURITY SANDBOX ==========
    
    /**
     * Set up security sandbox
     */
    setupSecuritySandbox() {
        if (!this.options.sandboxMode) return;
        
        // Create base sandbox context
        this.baseSandbox = {
            console: {
                log: (...args) => console.log('[Plugin]', ...args),
                warn: (...args) => console.warn('[Plugin]', ...args),
                error: (...args) => console.error('[Plugin]', ...args)
            },
            setTimeout: (fn, delay) => setTimeout(fn, Math.min(delay, 5000)), // Max 5 second delay
            setInterval: (fn, delay) => setInterval(fn, Math.max(delay, 1000)), // Min 1 second interval
            Date: Date,
            Math: Math,
            JSON: JSON
        };
    }

    /**
     * Create sandbox for plugin
     */
    createSandbox(plugin) {
        if (!this.options.sandboxMode) {
            return window; // No sandbox, full access (dangerous!)
        }
        
        const sandbox = { ...this.baseSandbox };
        
        // Add plugin-specific permissions
        if (plugin.permissions.includes('dom-read')) {
            sandbox.document = {
                getElementById: (id) => document.getElementById(id),
                querySelector: (selector) => document.querySelector(selector),
                querySelectorAll: (selector) => document.querySelectorAll(selector)
            };
        }
        
        if (plugin.permissions.includes('dom-write')) {
            sandbox.document = {
                ...sandbox.document,
                createElement: (tag) => document.createElement(tag),
                createTextNode: (text) => document.createTextNode(text)
            };
        }
        
        if (plugin.permissions.includes('storage')) {
            sandbox.localStorage = {
                getItem: (key) => localStorage.getItem(`plugin_${plugin.id}_${key}`),
                setItem: (key, value) => localStorage.setItem(`plugin_${plugin.id}_${key}`, value),
                removeItem: (key) => localStorage.removeItem(`plugin_${plugin.id}_${key}`)
            };
        }
        
        return sandbox;
    }

    /**
     * Set up plugin security context
     */
    setupPluginSecurity(pluginId) {
        this.securityContext.set(pluginId, {
            permissions: this.plugins.get(pluginId).permissions,
            createdAt: new Date(),
            accessLog: []
        });
    }

    // ========== API MANAGEMENT ==========
    
    /**
     * Register core API endpoints
     */
    registerCoreAPI() {
        // Plugin management API
        this.api.set('plugins.list', () => Array.from(this.plugins.keys()));
        this.api.set('plugins.getInfo', (id) => this.getPluginInfo(id));
        this.api.set('plugins.getState', (id) => this.pluginStates.get(id));
        
        // Event system API
        this.api.set('events.emit', (eventName, data) => this.emit(eventName, data));
        this.api.set('events.on', (eventName, callback) => this.on(eventName, callback));
        
        // Hook system API
        this.api.set('hooks.execute', (hookName, ...args) => this.executeHook(hookName, ...args));
        
        // ERP integration API (basic)
        this.api.set('erp.getDashboard', () => window.appData?.currentModule || null);
        this.api.set('erp.showNotification', (title, message, type) => {
            if (window.showNotification) {
                window.showNotification(title, message, type);
            }
        });
    }

    /**
     * Get API for specific plugin
     */
    getPluginAPI(pluginId) {
        const pluginAPI = {};
        
        this.api.forEach((fn, key) => {
            pluginAPI[key] = (...args) => {
                // Log API access for security
                this.logAPIAccess(pluginId, key);
                return fn(...args);
            };
        });
        
        return pluginAPI;
    }

    /**
     * Log API access for security monitoring
     */
    logAPIAccess(pluginId, apiKey) {
        const context = this.securityContext.get(pluginId);
        if (context) {
            context.accessLog.push({
                api: apiKey,
                timestamp: new Date()
            });
            
            // Keep only last 100 access logs
            if (context.accessLog.length > 100) {
                context.accessLog = context.accessLog.slice(-100);
            }
        }
    }

    // ========== UTILITY METHODS ==========
    
    /**
     * Get plugin information
     */
    getPluginInfo(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return null;
        
        return {
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            author: plugin.author,
            description: plugin.description,
            state: this.pluginStates.get(pluginId),
            permissions: plugin.permissions,
            dependencies: plugin.dependencies,
            registeredAt: plugin.registeredAt,
            lastUpdated: plugin.lastUpdated
        };
    }

    /**
     * Get all plugins
     */
    getAllPlugins() {
        const result = [];
        this.plugins.forEach((plugin, id) => {
            result.push(this.getPluginInfo(id));
        });
        return result;
    }

    /**
     * Check if version is valid
     */
    isValidVersion(version) {
        return /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/.test(version);
    }

    /**
     * Event emitter methods
     */
    on(eventName, callback) {
        this.eventBus.addEventListener(eventName, callback);
    }

    off(eventName, callback) {
        this.eventBus.removeEventListener(eventName, callback);
    }

    emit(eventName, data) {
        this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    /**
     * Destroy plugin system
     */
    async destroy() {
        // Deactivate all plugins
        const activePlugins = Array.from(this.plugins.keys())
            .filter(id => this.pluginStates.get(id) === 'active');
        
        for (const pluginId of activePlugins) {
            try {
                await this.deactivatePlugin(pluginId);
            } catch (error) {
                console.error(`Failed to deactivate plugin '${pluginId}' during cleanup:`, error);
            }
        }
        
        // Clear all data
        this.plugins.clear();
        this.pluginStates.clear();
        this.hooks.clear();
        this.api.clear();
        this.securityContext.clear();
        
        console.log('🔌 Plugin System destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PluginSystem;
} else {
    window.PluginSystem = PluginSystem;
}

console.log('🔌 Plugin System Core loaded - Registration and Lifecycle Management');

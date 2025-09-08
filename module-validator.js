/**
 * Module Validation & Security System - Part 2A
 * Provides validation, security checks, and sandboxing for safe module installation
 */

class ModuleValidator {
    constructor() {
        this.securityRules = new Map();
        this.validationRules = new Map();
        this.blacklistedPatterns = new Set();
        this.allowedPermissions = new Set([
            'read-data', 'write-data', 'create-ui', 'network-access', 'file-access'
        ]);
        
        this.setupDefaultRules();
    }
    
    setupDefaultRules() {
        // Security validation rules
        this.addSecurityRule('no-eval', (code) => {
            return !/(^|\s|[^a-zA-Z])eval\s*\(/.test(code);
        }, 'Module contains eval() which is not allowed');
        
        this.addSecurityRule('no-function-constructor', (code) => {
            return !/new\s+Function\s*\(/.test(code);
        }, 'Module uses Function constructor which is not allowed');
        
        this.addSecurityRule('no-dangerous-globals', (code) => {
            const dangerous = ['window.location', 'document.cookie', 'localStorage', 'sessionStorage'];
            return !dangerous.some(global => code.includes(global));
        }, 'Module accesses dangerous global objects');
        
        // Validation rules
        this.addValidationRule('has-manifest', (moduleData) => {
            return moduleData.manifest && typeof moduleData.manifest === 'object';
        }, 'Module must include a valid manifest');
        
        this.addValidationRule('valid-entry-point', (moduleData) => {
            return moduleData.entryPoint && typeof moduleData.entryPoint === 'string';
        }, 'Module must specify a valid entry point');
        
        this.addValidationRule('reasonable-size', (moduleData) => {
            const maxSize = 5 * 1024 * 1024; // 5MB
            return !moduleData.size || moduleData.size < maxSize;
        }, 'Module size exceeds maximum allowed size');
    }
    
    addSecurityRule(name, validator, message) {
        this.securityRules.set(name, { validator, message });
    }
    
    addValidationRule(name, validator, message) {
        this.validationRules.set(name, { validator, message });
    }
    
    async validateModule(moduleData) {
        const results = {
            valid: true,
            errors: [],
            warnings: [],
            securityIssues: [],
            metadata: {
                validatedAt: new Date().toISOString(),
                validatorVersion: '1.0.0'
            }
        };
        
        try {
            // Run basic validation
            await this.runValidationRules(moduleData, results);
            
            // Run security checks
            await this.runSecurityChecks(moduleData, results);
            
            // Check permissions
            this.validatePermissions(moduleData, results);
            
            // Validate dependencies
            this.validateDependencies(moduleData, results);
            
            // Check code patterns
            if (moduleData.code) {
                this.scanCodePatterns(moduleData.code, results);
            }
            
            results.valid = results.errors.length === 0 && results.securityIssues.length === 0;
            
        } catch (error) {
            results.valid = false;
            results.errors.push(`Validation failed: ${error.message}`);
        }
        
        return results;
    }
    
    async runValidationRules(moduleData, results) {
        for (const [name, rule] of this.validationRules) {
            try {
                const isValid = await rule.validator(moduleData);
                if (!isValid) {
                    results.errors.push(`${name}: ${rule.message}`);
                }
            } catch (error) {
                results.errors.push(`${name}: Validation error - ${error.message}`);
            }
        }
    }
    
    async runSecurityChecks(moduleData, results) {
        if (!moduleData.code) return;
        
        for (const [name, rule] of this.securityRules) {
            try {
                const isSafe = await rule.validator(moduleData.code);
                if (!isSafe) {
                    results.securityIssues.push(`${name}: ${rule.message}`);
                }
            } catch (error) {
                results.securityIssues.push(`${name}: Security check error - ${error.message}`);
            }
        }
    }
    
    validatePermissions(moduleData, results) {
        if (!moduleData.permissions) return;
        
        const requestedPermissions = Array.isArray(moduleData.permissions) 
            ? moduleData.permissions 
            : [moduleData.permissions];
            
        for (const permission of requestedPermissions) {
            if (!this.allowedPermissions.has(permission)) {
                results.errors.push(`Unknown permission requested: ${permission}`);
            }
        }
        
        // Check for dangerous permission combinations
        if (requestedPermissions.includes('network-access') && requestedPermissions.includes('file-access')) {
            results.warnings.push('Module requests both network and file access - review carefully');
        }
    }
    
    validateDependencies(moduleData, results) {
        if (!moduleData.dependencies) return;
        
        const deps = Array.isArray(moduleData.dependencies) 
            ? moduleData.dependencies 
            : [moduleData.dependencies];
            
        for (const dep of deps) {
            if (typeof dep === 'string') {
                if (!this.isValidModuleId(dep)) {
                    results.errors.push(`Invalid dependency ID format: ${dep}`);
                }
            } else if (typeof dep === 'object') {
                if (!dep.id || !this.isValidModuleId(dep.id)) {
                    results.errors.push(`Invalid dependency ID: ${dep.id}`);
                }
                if (dep.version && !this.isValidVersion(dep.version)) {
                    results.errors.push(`Invalid dependency version format: ${dep.version}`);
                }
            }
        }
    }
    
    scanCodePatterns(code, results) {
        // Check for suspicious patterns
        const suspiciousPatterns = [
            { pattern: /fetch\s*\(\s*[^)]*['"](https?:\/\/[^'"]*)['"]/g, message: 'External HTTP requests detected' },
            { pattern: /XMLHttpRequest|\.ajax\(/g, message: 'Network requests detected' },
            { pattern: /document\.write|innerHTML\s*=/g, message: 'DOM manipulation detected' },
            { pattern: /setTimeout|setInterval/g, message: 'Timer functions detected' }
        ];
        
        for (const { pattern, message } of suspiciousPatterns) {
            if (pattern.test(code)) {
                results.warnings.push(message);
            }
        }
        
        // Check for blacklisted patterns
        for (const blacklisted of this.blacklistedPatterns) {
            if (code.includes(blacklisted)) {
                results.securityIssues.push(`Blacklisted pattern found: ${blacklisted}`);
            }
        }
    }
    
    isValidModuleId(id) {
        return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
    }
    
    isValidVersion(version) {
        return typeof version === 'string' && 
               (/^\d+\.\d+\.\d+/.test(version) || version === '*' || version.startsWith('^') || version.startsWith('~'));
    }
    
    createSandbox() {
        return new ModuleSandbox();
    }
}

class ModuleSandbox {
    constructor() {
        this.allowedGlobals = new Set(['console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number']);
        this.blockedGlobals = new Set(['eval', 'Function', 'window', 'document', 'global', 'process']);
    }
    
    createSafeContext(permissions = []) {
        const context = Object.create(null);
        
        // Add allowed globals
        for (const global of this.allowedGlobals) {
            if (typeof window !== 'undefined' && window[global]) {
                context[global] = window[global];
            } else if (typeof global !== 'undefined' && global[global]) {
                context[global] = global[global];
            }
        }
        
        // Add permission-based APIs
        if (permissions.includes('read-data')) {
            context.getData = this.createGetDataAPI();
        }
        
        if (permissions.includes('write-data')) {
            context.setData = this.createSetDataAPI();
        }
        
        if (permissions.includes('create-ui')) {
            context.createUI = this.createUIAPI();
        }
        
        // Add restricted console for debugging
        context.console = {
            log: (...args) => console.log('[Module]', ...args),
            warn: (...args) => console.warn('[Module]', ...args),
            error: (...args) => console.error('[Module]', ...args)
        };
        
        return context;
    }
    
    createGetDataAPI() {
        return (key) => {
            // Safe data access implementation
            console.log(`Module requested data: ${key}`);
            return null; // Placeholder
        };
    }
    
    createSetDataAPI() {
        return (key, value) => {
            // Safe data writing implementation
            console.log(`Module set data: ${key} = ${value}`);
            return true; // Placeholder
        };
    }
    
    createUIAPI() {
        return {
            createElement: (tag, props) => {
                // Safe UI element creation
                console.log(`Module created UI element: ${tag}`, props);
                return {}; // Placeholder
            }
        };
    }
    
    executeInSandbox(code, context) {
        try {
            // Create a function with restricted scope
            const func = new Function(...Object.keys(context), code);
            return func(...Object.values(context));
        } catch (error) {
            throw new Error(`Sandbox execution failed: ${error.message}`);
        }
    }
}

class ModuleSecurityPolicy {
    constructor() {
        this.policies = new Map();
        this.setupDefaultPolicies();
    }
    
    setupDefaultPolicies() {
        this.addPolicy('content-security', {
            allowEval: false,
            allowInlineScripts: false,
            allowExternalResources: false,
            allowDOMAccess: false
        });
        
        this.addPolicy('network-access', {
            allowedDomains: [],
            allowLocalhost: false,
            allowHTTPS: true,
            allowHTTP: false
        });
        
        this.addPolicy('data-access', {
            allowRead: ['public'],
            allowWrite: ['user-data'],
            allowDelete: false
        });
    }
    
    addPolicy(name, policy) {
        this.policies.set(name, policy);
    }
    
    getPolicy(name) {
        return this.policies.get(name);
    }
    
    enforcePolicy(policyName, action, context) {
        const policy = this.policies.get(policyName);
        if (!policy) {
            throw new Error(`Unknown security policy: ${policyName}`);
        }
        
        // Policy enforcement logic would go here
        return this.checkPolicyCompliance(policy, action, context);
    }
    
    checkPolicyCompliance(policy, action, context) {
        // Placeholder for policy compliance checking
        console.log('Checking policy compliance:', policy, action, context);
        return true;
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModuleValidator, ModuleSandbox, ModuleSecurityPolicy };
}

/**
 * Module Asset Management System - Part 2C
 * Handles module assets, resources, and file management during installation and removal
 */

class ModuleAssetManager {
    constructor(basePath = '/modules') {
        this.basePath = basePath;
        this.assetCache = new Map();
        this.activeAssets = new Map();
        this.eventEmitter = new EventTarget();
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB
        this.currentCacheSize = 0;
        
        this.init();
    }
    
    init() {
        // Create base directory structure
        this.ensureDirectoryStructure();
        
        // Load existing asset registry
        this.loadAssetRegistry();
    }
    
    async installModuleAssets(moduleId, assets) {
        try {
            const installPath = this.getModulePath(moduleId);
            const installedAssets = [];
            
            // Create module directory
            await this.createDirectory(installPath);
            
            // Install each asset
            for (const asset of assets) {
                const assetPath = await this.installAsset(moduleId, asset, installPath);
                installedAssets.push({
                    ...asset,
                    installedPath: assetPath,
                    installedAt: new Date().toISOString()
                });
            }
            
            // Register assets
            this.activeAssets.set(moduleId, installedAssets);
            
            // Update registry
            await this.saveAssetRegistry();
            
            this.emit('assetsInstalled', { moduleId, assets: installedAssets });
            
            return installedAssets;
            
        } catch (error) {
            // Clean up on failure
            await this.cleanupModuleAssets(moduleId);
            throw new Error(`Failed to install assets for module ${moduleId}: ${error.message}`);
        }
    }
    
    async installAsset(moduleId, asset, installPath) {
        const assetPath = `${installPath}/${asset.name}`;
        
        switch (asset.type) {
            case 'script':
                return await this.installScriptAsset(asset, assetPath);
            case 'style':
                return await this.installStyleAsset(asset, assetPath);
            case 'template':
                return await this.installTemplateAsset(asset, assetPath);
            case 'data':
                return await this.installDataAsset(asset, assetPath);
            case 'binary':
                return await this.installBinaryAsset(asset, assetPath);
            default:
                return await this.installGenericAsset(asset, assetPath);
        }
    }
    
    async installScriptAsset(asset, assetPath) {
        const content = await this.processScriptContent(asset.content);
        await this.writeFile(assetPath, content);
        
        // Add to DOM if needed
        if (asset.autoLoad) {
            this.loadScriptAsset(assetPath);
        }
        
        return assetPath;
    }
    
    async installStyleAsset(asset, assetPath) {
        const content = await this.processStyleContent(asset.content);
        await this.writeFile(assetPath, content);
        
        // Add to DOM if needed
        if (asset.autoLoad) {
            this.loadStyleAsset(assetPath);
        }
        
        return assetPath;
    }
    
    async installTemplateAsset(asset, assetPath) {
        const content = await this.processTemplateContent(asset.content);
        await this.writeFile(assetPath, content);
        return assetPath;
    }
    
    async installDataAsset(asset, assetPath) {
        const content = JSON.stringify(asset.content, null, 2);
        await this.writeFile(assetPath, content);
        return assetPath;
    }
    
    async installBinaryAsset(asset, assetPath) {
        // Handle binary data (images, files, etc.)
        await this.writeBinaryFile(assetPath, asset.content);
        return assetPath;
    }
    
    async installGenericAsset(asset, assetPath) {
        await this.writeFile(assetPath, asset.content);
        return assetPath;
    }
    
    async processScriptContent(content) {
        // Process and validate script content
        // Add any necessary transformations
        return content;
    }
    
    async processStyleContent(content) {
        // Process CSS content, handle imports, etc.
        return content;
    }
    
    async processTemplateContent(content) {
        // Process template content
        return content;
    }
    
    loadScriptAsset(assetPath) {
        if (typeof document === 'undefined') return;
        
        const script = document.createElement('script');
        script.src = assetPath;
        script.async = true;
        document.head.appendChild(script);
        
        return new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
    }
    
    loadStyleAsset(assetPath) {
        if (typeof document === 'undefined') return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = assetPath;
        document.head.appendChild(link);
        
        return new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
        });
    }
    
    async uninstallModuleAssets(moduleId) {
        try {
            const assets = this.activeAssets.get(moduleId);
            if (!assets) {
                return true;
            }
            
            // Remove from DOM
            this.removeAssetsFromDOM(moduleId, assets);
            
            // Delete files
            await this.deleteModuleFiles(moduleId);
            
            // Remove from registry
            this.activeAssets.delete(moduleId);
            
            // Update registry
            await this.saveAssetRegistry();
            
            this.emit('assetsUninstalled', { moduleId, assets });
            
            return true;
            
        } catch (error) {
            throw new Error(`Failed to uninstall assets for module ${moduleId}: ${error.message}`);
        }
    }
    
    removeAssetsFromDOM(moduleId, assets) {
        if (typeof document === 'undefined') return;
        
        for (const asset of assets) {
            if (asset.type === 'script') {
                const scripts = document.querySelectorAll(`script[src*="${moduleId}"]`);
                scripts.forEach(script => script.remove());
            } else if (asset.type === 'style') {
                const links = document.querySelectorAll(`link[href*="${moduleId}"]`);
                links.forEach(link => link.remove());
            }
        }
    }
    
    async deleteModuleFiles(moduleId) {
        const modulePath = this.getModulePath(moduleId);
        await this.deleteDirectory(modulePath);
    }
    
    async cleanupModuleAssets(moduleId) {
        try {
            await this.deleteModuleFiles(moduleId);
            this.activeAssets.delete(moduleId);
        } catch (error) {
            console.warn(`Error cleaning up assets for module ${moduleId}:`, error);
        }
    }
    
    getAsset(moduleId, assetName) {
        const assets = this.activeAssets.get(moduleId);
        if (!assets) return null;
        
        return assets.find(asset => asset.name === assetName);
    }
    
    getModuleAssets(moduleId) {
        return this.activeAssets.get(moduleId) || [];
    }
    
    getAllAssets() {
        const allAssets = [];
        for (const [moduleId, assets] of this.activeAssets) {
            allAssets.push(...assets.map(asset => ({ moduleId, ...asset })));
        }
        return allAssets;
    }
    
    async cacheAsset(assetPath, content) {
        const size = new Blob([content]).size;
        
        // Check cache size
        if (this.currentCacheSize + size > this.maxCacheSize) {
            await this.cleanupCache();
        }
        
        this.assetCache.set(assetPath, {
            content,
            size,
            cachedAt: Date.now(),
            accessCount: 0
        });
        
        this.currentCacheSize += size;
    }
    
    getCachedAsset(assetPath) {
        const cached = this.assetCache.get(assetPath);
        if (cached) {
            cached.accessCount++;
            return cached.content;
        }
        return null;
    }
    
    async cleanupCache() {
        // Remove least recently used assets
        const entries = Array.from(this.assetCache.entries())
            .sort((a, b) => a[1].cachedAt - b[1].cachedAt);
        
        let freedSpace = 0;
        const targetFree = this.maxCacheSize * 0.3; // Free 30% of cache
        
        for (const [path, data] of entries) {
            if (freedSpace >= targetFree) break;
            
            this.assetCache.delete(path);
            this.currentCacheSize -= data.size;
            freedSpace += data.size;
        }
    }
    
    getModulePath(moduleId) {
        return `${this.basePath}/${moduleId}`;
    }
    
    // File system operations (these would be implemented differently in browser vs Node.js)
    async createDirectory(path) {
        // Placeholder - would use fs.mkdir in Node.js or IndexedDB in browser
        console.log(`Creating directory: ${path}`);
    }
    
    async deleteDirectory(path) {
        // Placeholder - would use fs.rmdir in Node.js or IndexedDB in browser
        console.log(`Deleting directory: ${path}`);
    }
    
    async writeFile(path, content) {
        // Placeholder - would use fs.writeFile in Node.js or IndexedDB in browser
        console.log(`Writing file: ${path}`);
        await this.cacheAsset(path, content);
    }
    
    async writeBinaryFile(path, content) {
        // Placeholder - would handle binary data appropriately
        console.log(`Writing binary file: ${path}`);
        await this.cacheAsset(path, content);
    }
    
    async readFile(path) {
        // Check cache first
        const cached = this.getCachedAsset(path);
        if (cached) {
            return cached;
        }
        
        // Placeholder - would use fs.readFile in Node.js or IndexedDB in browser
        console.log(`Reading file: ${path}`);
        return null;
    }
    
    ensureDirectoryStructure() {
        // Create necessary directories
        this.createDirectory(this.basePath);
    }
    
    async loadAssetRegistry() {
        try {
            // Load from persistent storage
            const data = await this.readFile(`${this.basePath}/registry.json`);
            if (data) {
                const registry = JSON.parse(data);
                this.activeAssets = new Map(registry.activeAssets);
                this.currentCacheSize = registry.cacheSize || 0;
            }
        } catch (error) {
            console.warn('Failed to load asset registry:', error);
        }
    }
    
    async saveAssetRegistry() {
        try {
            const registry = {
                activeAssets: Array.from(this.activeAssets.entries()),
                cacheSize: this.currentCacheSize,
                lastSaved: new Date().toISOString()
            };
            
            await this.writeFile(`${this.basePath}/registry.json`, JSON.stringify(registry, null, 2));
        } catch (error) {
            console.error('Failed to save asset registry:', error);
        }
    }
    
    getAssetStats() {
        const allAssets = this.getAllAssets();
        const assetTypes = {};
        let totalSize = 0;
        
        for (const asset of allAssets) {
            assetTypes[asset.type] = (assetTypes[asset.type] || 0) + 1;
            totalSize += asset.size || 0;
        }
        
        return {
            totalAssets: allAssets.length,
            totalModules: this.activeAssets.size,
            assetTypes,
            totalSize,
            cacheSize: this.currentCacheSize,
            cacheEntries: this.assetCache.size
        };
    }
    
    async validateAssets(moduleId) {
        const assets = this.activeAssets.get(moduleId);
        if (!assets) return { valid: true, issues: [] };
        
        const issues = [];
        
        for (const asset of assets) {
            try {
                // Check if asset file exists
                const content = await this.readFile(asset.installedPath);
                if (!content) {
                    issues.push(`Missing asset file: ${asset.name}`);
                }
                
                // Validate asset integrity if checksum is available
                if (asset.checksum) {
                    // Would implement checksum validation
                }
                
            } catch (error) {
                issues.push(`Error validating asset ${asset.name}: ${error.message}`);
            }
        }
        
        return {
            valid: issues.length === 0,
            issues
        };
    }
    
    async repairAssets(moduleId) {
        // Attempt to repair corrupted or missing assets
        const validation = await this.validateAssets(moduleId);
        if (validation.valid) return true;
        
        // Log repair attempt
        console.log(`Attempting to repair assets for module ${moduleId}`);
        
        // Would implement asset repair logic here
        return false;
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

// Asset utility functions
class AssetUtils {
    static getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'js': 'application/javascript',
            'css': 'text/css',
            'html': 'text/html',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'txt': 'text/plain'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
    
    static calculateChecksum(content) {
        // Simple checksum calculation (would use crypto in real implementation)
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }
    
    static validateAssetName(name) {
        // Validate asset name (no path traversal, etc.)
        return /^[a-zA-Z0-9._-]+$/.test(name) && !name.includes('..');
    }
    
    static sanitizePath(path) {
        // Remove dangerous path components
        return path.replace(/\.\./g, '').replace(/\/+/g, '/');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModuleAssetManager, AssetUtils };
}

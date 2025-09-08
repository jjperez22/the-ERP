/**
 * Construction ERP - Offline Storage Manager
 * Provides localStorage and IndexedDB wrapper for offline data management
 * Supports data synchronization, conflict resolution, and offline queuing
 */

class OfflineStorageManager {
    constructor() {
        this.dbName = 'ConstructionERP';
        this.dbVersion = 1;
        this.db = null;
        this.storeName = {
            PRODUCTS: 'products',
            CUSTOMERS: 'customers', 
            ORDERS: 'orders',
            EMPLOYEES: 'employees',
            SYNC_QUEUE: 'syncQueue',
            APP_STATE: 'appState',
            USER_PREFS: 'userPreferences',
            CACHE_META: 'cacheMeta'
        };
        
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.lastSyncTimestamp = this.getLastSyncTime();
        
        // Initialize storage
        this.initializeStorage();
        this.setupEventListeners();
        
        console.log('🗄️ OfflineStorageManager initialized');
    }

    /**
     * Initialize IndexedDB and localStorage
     */
    async initializeStorage() {
        try {
            await this.openDatabase();
            await this.loadSyncQueue();
            await this.setupDefaultData();
            console.log('✅ Offline storage initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize offline storage:', error);
            // Fallback to localStorage only
            this.setupLocalStorageFallback();
        }
    }

    /**
     * Open IndexedDB database
     */
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                Object.values(this.storeName).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { 
                            keyPath: 'id',
                            autoIncrement: true 
                        });
                        
                        // Add indexes for common queries
                        if (storeName === this.storeName.PRODUCTS) {
                            store.createIndex('sku', 'sku', { unique: true });
                            store.createIndex('category', 'category', { unique: false });
                            store.createIndex('stockLevel', 'stockLevel', { unique: false });
                        }
                        
                        if (storeName === this.storeName.CUSTOMERS) {
                            store.createIndex('name', 'name', { unique: false });
                            store.createIndex('type', 'type', { unique: false });
                            store.createIndex('churnRisk', 'churnRisk', { unique: false });
                        }
                        
                        if (storeName === this.storeName.ORDERS) {
                            store.createIndex('customerId', 'customerId', { unique: false });
                            store.createIndex('status', 'status', { unique: false });
                            store.createIndex('date', 'date', { unique: false });
                        }
                        
                        if (storeName === this.storeName.SYNC_QUEUE) {
                            store.createIndex('action', 'action', { unique: false });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                            store.createIndex('priority', 'priority', { unique: false });
                        }
                        
                        console.log(`📦 Created object store: ${storeName}`);
                    }
                });
            };
        });
    }

    /**
     * Setup event listeners for online/offline status
     */
    setupEventListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored - triggering sync');
            this.isOnline = true;
            this.syncOfflineActions();
        });
        
        window.addEventListener('offline', () => {
            console.log('📱 Going offline - enabling offline mode');
            this.isOnline = false;
        });
        
        // Sync periodically when online
        setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                this.syncOfflineActions();
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Setup default/demo data for offline use
     */
    async setupDefaultData() {
        try {
            // Check if data already exists
            const productCount = await this.count(this.storeName.PRODUCTS);
            
            if (productCount === 0) {
                // Add demo products
                const demoProducts = [
                    {
                        id: 'SKU-001',
                        sku: 'SKU-001',
                        name: 'Portland Cement - Type I',
                        category: 'Concrete',
                        stockLevel: 45,
                        reorderPoint: 50,
                        price: 12.99,
                        status: 'low',
                        lastUpdated: new Date().toISOString(),
                        isOfflineCreated: false
                    },
                    {
                        id: 'SKU-002', 
                        sku: 'SKU-002',
                        name: 'Rebar #4 - 20ft',
                        category: 'Steel',
                        stockLevel: 156,
                        reorderPoint: 100,
                        price: 24.50,
                        status: 'normal',
                        lastUpdated: new Date().toISOString(),
                        isOfflineCreated: false
                    },
                    {
                        id: 'SKU-003',
                        sku: 'SKU-003', 
                        name: '2x4 Lumber - 8ft',
                        category: 'Lumber',
                        stockLevel: 234,
                        reorderPoint: 150,
                        price: 8.75,
                        status: 'normal',
                        lastUpdated: new Date().toISOString(),
                        isOfflineCreated: false
                    }
                ];
                
                for (const product of demoProducts) {
                    await this.saveData(this.storeName.PRODUCTS, product);
                }
                
                console.log('📦 Demo products added to offline storage');
            }
            
            // Add demo customers if none exist
            const customerCount = await this.count(this.storeName.CUSTOMERS);
            if (customerCount === 0) {
                const demoCustomers = [
                    {
                        id: 'CUST-001',
                        name: 'ABC Construction Co.',
                        type: 'General Contractor',
                        revenue: 342000,
                        orders: 45,
                        churnRisk: 'low',
                        lastOrder: '2025-08-20',
                        contact: 'john@abcconstruction.com',
                        lastUpdated: new Date().toISOString(),
                        isOfflineCreated: false
                    },
                    {
                        id: 'CUST-002',
                        name: 'BuildRight LLC',
                        type: 'Trade Contractor', 
                        revenue: 189000,
                        orders: 32,
                        churnRisk: 'medium',
                        lastOrder: '2025-08-18',
                        contact: 'sarah@buildright.com',
                        lastUpdated: new Date().toISOString(),
                        isOfflineCreated: false
                    }
                ];
                
                for (const customer of demoCustomers) {
                    await this.saveData(this.storeName.CUSTOMERS, customer);
                }
                
                console.log('👥 Demo customers added to offline storage');
            }
            
        } catch (error) {
            console.warn('⚠️ Could not setup demo data:', error);
        }
    }

    /**
     * Save data to IndexedDB
     */
    async saveData(storeName, data, skipSync = false) {
        try {
            // Add metadata
            const enhancedData = {
                ...data,
                lastModified: new Date().toISOString(),
                version: data.version ? data.version + 1 : 1,
                isOfflineModified: !this.isOnline
            };
            
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const result = await new Promise((resolve, reject) => {
                const request = store.put(enhancedData);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            // Add to sync queue if offline or explicitly requested
            if (!skipSync && (!this.isOnline || enhancedData.isOfflineModified)) {
                await this.addToSyncQueue('UPDATE', storeName, enhancedData);
            }
            
            console.log(`💾 Saved data to ${storeName}:`, enhancedData.id || 'new item');
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to save data to ${storeName}:`, error);
            // Fallback to localStorage
            return this.saveToLocalStorage(storeName, data);
        }
    }

    /**
     * Get data from IndexedDB
     */
    async getData(storeName, id = null) {
        try {
            if (!this.db) {
                return this.getFromLocalStorage(storeName, id);
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            if (id) {
                // Get single item
                const result = await new Promise((resolve, reject) => {
                    const request = store.get(id);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                
                return result || null;
            } else {
                // Get all items
                const result = await new Promise((resolve, reject) => {
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                
                return result || [];
            }
        } catch (error) {
            console.error(`❌ Failed to get data from ${storeName}:`, error);
            return this.getFromLocalStorage(storeName, id);
        }
    }

    /**
     * Delete data from IndexedDB
     */
    async deleteData(storeName, id) {
        try {
            if (!this.db) {
                return this.deleteFromLocalStorage(storeName, id);
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            await new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            // Add to sync queue
            await this.addToSyncQueue('DELETE', storeName, { id });
            
            console.log(`🗑️ Deleted data from ${storeName}:`, id);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to delete data from ${storeName}:`, error);
            return this.deleteFromLocalStorage(storeName, id);
        }
    }

    /**
     * Search data with filters
     */
    async searchData(storeName, filters = {}) {
        try {
            const allData = await this.getData(storeName);
            
            if (!filters || Object.keys(filters).length === 0) {
                return allData;
            }
            
            return allData.filter(item => {
                return Object.entries(filters).every(([key, value]) => {
                    if (!item.hasOwnProperty(key)) return false;
                    
                    if (typeof value === 'string' && value.includes('*')) {
                        // Wildcard search
                        const regex = new RegExp(value.replace(/\*/g, '.*'), 'i');
                        return regex.test(item[key]);
                    }
                    
                    return item[key] === value;
                });
            });
        } catch (error) {
            console.error(`❌ Failed to search data in ${storeName}:`, error);
            return [];
        }
    }

    /**
     * Count items in store
     */
    async count(storeName) {
        try {
            if (!this.db) {
                const data = this.getFromLocalStorage(storeName);
                return Array.isArray(data) ? data.length : 0;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.count();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`❌ Failed to count items in ${storeName}:`, error);
            return 0;
        }
    }

    /**
     * Add action to sync queue
     */
    async addToSyncQueue(action, storeName, data, priority = 'normal') {
        const queueItem = {
            id: this.generateId(),
            action,
            storeName,
            data,
            priority,
            timestamp: new Date().toISOString(),
            attempts: 0,
            maxAttempts: 3
        };
        
        try {
            await this.saveData(this.storeName.SYNC_QUEUE, queueItem, true);
            this.syncQueue.push(queueItem);
            console.log(`📝 Added to sync queue: ${action} ${storeName}`);
        } catch (error) {
            console.error('❌ Failed to add to sync queue:', error);
        }
    }

    /**
     * Load sync queue from storage
     */
    async loadSyncQueue() {
        try {
            const queueItems = await this.getData(this.storeName.SYNC_QUEUE);
            this.syncQueue = Array.isArray(queueItems) ? queueItems : [];
            console.log(`📋 Loaded ${this.syncQueue.length} items from sync queue`);
        } catch (error) {
            console.error('❌ Failed to load sync queue:', error);
            this.syncQueue = [];
        }
    }

    /**
     * Sync offline actions with server
     */
    async syncOfflineActions() {
        if (!this.isOnline || this.syncQueue.length === 0) {
            return;
        }
        
        console.log(`🔄 Starting sync of ${this.syncQueue.length} queued actions`);
        
        // Sort by priority and timestamp
        const sortedQueue = [...this.syncQueue].sort((a, b) => {
            const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        const syncResults = {
            successful: 0,
            failed: 0,
            skipped: 0
        };
        
        for (const queueItem of sortedQueue) {
            try {
                const success = await this.syncSingleItem(queueItem);
                
                if (success) {
                    // Remove from queue
                    await this.deleteData(this.storeName.SYNC_QUEUE, queueItem.id);
                    this.syncQueue = this.syncQueue.filter(item => item.id !== queueItem.id);
                    syncResults.successful++;
                } else {
                    // Increment attempts
                    queueItem.attempts++;
                    
                    if (queueItem.attempts >= queueItem.maxAttempts) {
                        console.warn(`⚠️ Max sync attempts reached for ${queueItem.id}, removing from queue`);
                        await this.deleteData(this.storeName.SYNC_QUEUE, queueItem.id);
                        this.syncQueue = this.syncQueue.filter(item => item.id !== queueItem.id);
                        syncResults.failed++;
                    } else {
                        await this.saveData(this.storeName.SYNC_QUEUE, queueItem, true);
                        syncResults.skipped++;
                    }
                }
            } catch (error) {
                console.error(`❌ Sync error for item ${queueItem.id}:`, error);
                syncResults.failed++;
            }
        }
        
        // Update last sync timestamp
        this.lastSyncTimestamp = new Date().toISOString();
        this.setLastSyncTime(this.lastSyncTimestamp);
        
        console.log(`✅ Sync completed:`, syncResults);
        
        // Notify UI of sync completion
        this.notifyUI('sync-completed', syncResults);
    }

    /**
     * Sync a single item with the server
     */
    async syncSingleItem(queueItem) {
        try {
            const { action, storeName, data } = queueItem;
            let apiEndpoint = this.getAPIEndpoint(storeName);
            
            if (!apiEndpoint) {
                console.warn(`⚠️ No API endpoint for ${storeName}`);
                return false;
            }
            
            let response;
            
            switch (action) {
                case 'CREATE':
                    response = await fetch(apiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    break;
                    
                case 'UPDATE':
                    response = await fetch(`${apiEndpoint}/${data.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    break;
                    
                case 'DELETE':
                    response = await fetch(`${apiEndpoint}/${data.id}`, {
                        method: 'DELETE'
                    });
                    break;
                    
                default:
                    console.warn(`⚠️ Unknown sync action: ${action}`);
                    return false;
            }
            
            if (response.ok) {
                console.log(`✅ Synced ${action} for ${storeName}:`, data.id);
                return true;
            } else {
                console.warn(`⚠️ Sync failed for ${action} ${storeName}:`, response.status);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Network error during sync:', error);
            return false;
        }
    }

    /**
     * Get API endpoint for store name
     */
    getAPIEndpoint(storeName) {
        const endpoints = {
            [this.storeName.PRODUCTS]: '/api/products',
            [this.storeName.CUSTOMERS]: '/api/customers',
            [this.storeName.ORDERS]: '/api/orders',
            [this.storeName.EMPLOYEES]: '/api/employees'
        };
        
        return endpoints[storeName];
    }

    /**
     * localStorage fallback methods
     */
    saveToLocalStorage(storeName, data) {
        try {
            const key = `erp_${storeName}`;
            let existing = JSON.parse(localStorage.getItem(key) || '[]');
            
            if (!Array.isArray(existing)) {
                existing = [];
            }
            
            const index = existing.findIndex(item => item.id === data.id);
            if (index >= 0) {
                existing[index] = data;
            } else {
                existing.push(data);
            }
            
            localStorage.setItem(key, JSON.stringify(existing));
            return data.id;
        } catch (error) {
            console.error('❌ localStorage save failed:', error);
            return null;
        }
    }

    getFromLocalStorage(storeName, id = null) {
        try {
            const key = `erp_${storeName}`;
            const data = JSON.parse(localStorage.getItem(key) || '[]');
            
            if (id) {
                return data.find(item => item.id === id) || null;
            }
            
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('❌ localStorage get failed:', error);
            return id ? null : [];
        }
    }

    deleteFromLocalStorage(storeName, id) {
        try {
            const key = `erp_${storeName}`;
            let data = JSON.parse(localStorage.getItem(key) || '[]');
            
            if (Array.isArray(data)) {
                data = data.filter(item => item.id !== id);
                localStorage.setItem(key, JSON.stringify(data));
            }
            
            return true;
        } catch (error) {
            console.error('❌ localStorage delete failed:', error);
            return false;
        }
    }

    /**
     * App state management
     */
    async saveAppState(state) {
        const stateData = {
            id: 'app_state',
            ...state,
            timestamp: new Date().toISOString()
        };
        
        return this.saveData(this.storeName.APP_STATE, stateData, true);
    }

    async getAppState() {
        const state = await this.getData(this.storeName.APP_STATE, 'app_state');
        return state || {};
    }

    /**
     * User preferences
     */
    async saveUserPreferences(preferences) {
        const prefData = {
            id: 'user_prefs',
            ...preferences,
            timestamp: new Date().toISOString()
        };
        
        return this.saveData(this.storeName.USER_PREFS, prefData, true);
    }

    async getUserPreferences() {
        const prefs = await this.getData(this.storeName.USER_PREFS, 'user_prefs');
        return prefs || {};
    }

    /**
     * Utility methods
     */
    generateId() {
        return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getLastSyncTime() {
        return localStorage.getItem('erp_last_sync') || null;
    }

    setLastSyncTime(timestamp) {
        localStorage.setItem('erp_last_sync', timestamp);
    }

    notifyUI(event, data) {
        window.dispatchEvent(new CustomEvent(`erp-${event}`, { detail: data }));
    }

    /**
     * Setup localStorage fallback if IndexedDB fails
     */
    setupLocalStorageFallback() {
        console.warn('📱 Using localStorage fallback mode');
        this.db = null;
        
        // Initialize localStorage structure
        const stores = Object.values(this.storeName);
        stores.forEach(storeName => {
            const key = `erp_${storeName}`;
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, '[]');
            }
        });
    }

    /**
     * Clear all offline data (useful for logout/reset)
     */
    async clearAllData() {
        try {
            if (this.db) {
                // Clear IndexedDB
                const transaction = this.db.transaction(Object.values(this.storeName), 'readwrite');
                const clearPromises = Object.values(this.storeName).map(storeName => {
                    return new Promise((resolve, reject) => {
                        const request = transaction.objectStore(storeName).clear();
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                });
                
                await Promise.all(clearPromises);
            }
            
            // Clear localStorage
            Object.values(this.storeName).forEach(storeName => {
                localStorage.removeItem(`erp_${storeName}`);
            });
            
            localStorage.removeItem('erp_last_sync');
            
            this.syncQueue = [];
            console.log('🧹 All offline data cleared');
            
        } catch (error) {
            console.error('❌ Failed to clear offline data:', error);
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        const stats = {};
        
        for (const storeName of Object.values(this.storeName)) {
            stats[storeName] = await this.count(storeName);
        }
        
        stats.syncQueueSize = this.syncQueue.length;
        stats.lastSync = this.lastSyncTimestamp;
        stats.isOnline = this.isOnline;
        
        return stats;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineStorageManager;
} else if (typeof window !== 'undefined') {
    window.OfflineStorageManager = OfflineStorageManager;
}

console.log('📚 OfflineStorageManager class loaded');

// Construction ERP - Data Manager
import { ERPConfig, APIResponse, Product, Customer, Order } from '../types/index';

export class DataManager {
  private config: ERPConfig;
  private cache: Map<string, any> = new Map();
  private isOnline: boolean = navigator.onLine;

  constructor(config: ERPConfig) {
    this.config = config;
    this.setupNetworkListeners();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Network connection restored');
      this.syncOfflineChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📵 Network connection lost - switching to offline mode');
    });
  }

  // API Communication Methods
  public async apiRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.config.apiUrl}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Cache successful responses
      if (options.method === 'GET' || !options.method) {
        this.cache.set(endpoint, data);
      }

      return data;
    } catch (error) {
      console.warn(`⚠️ API request failed: ${endpoint}`, error);
      
      // Try to serve from cache if offline
      if (!this.isOnline && this.cache.has(endpoint)) {
        console.log('📦 Serving from cache:', endpoint);
        return this.cache.get(endpoint);
      }
      
      // Store failed request for retry when online
      if (!this.isOnline) {
        this.storeOfflineRequest(endpoint, options);
      }
      
      throw error;
    }
  }

  // Data CRUD Operations
  public async getProducts(): Promise<Product[]> {
    try {
      const response = await this.apiRequest<Product[]>('/products');
      return response.data || [];
    } catch (error) {
      console.warn('Using fallback product data');
      return this.getFallbackProducts();
    }
  }

  public async getCustomers(): Promise<Customer[]> {
    try {
      const response = await this.apiRequest<Customer[]>('/customers');
      return response.data || [];
    } catch (error) {
      console.warn('Using fallback customer data');
      return this.getFallbackCustomers();
    }
  }

  public async getOrders(): Promise<Order[]> {
    try {
      const response = await this.apiRequest<Order[]>('/orders');
      return response.data || [];
    } catch (error) {
      console.warn('Using fallback order data');
      return this.getFallbackOrders();
    }
  }

  public async saveProduct(product: Product): Promise<boolean> {
    try {
      const method = product.id.startsWith('temp-') ? 'POST' : 'PUT';
      const endpoint = method === 'POST' ? '/products' : `/products/${product.id}`;
      
      await this.apiRequest(endpoint, {
        method,
        body: JSON.stringify(product),
      });
      
      return true;
    } catch (error) {
      if (!this.isOnline) {
        this.storeOfflineData('products', product, 'save');
        return true;
      }
      throw error;
    }
  }

  // Event Handler
  public handleDataUpdate(type: string, data: any, action: string): void {
    const cacheKey = `${type}-list`;
    let cachedList = this.cache.get(cacheKey) || [];
    
    switch (action) {
      case 'create':
        cachedList.push(data);
        break;
      case 'update':
        const updateIndex = cachedList.findIndex((item: any) => item.id === data.id);
        if (updateIndex !== -1) {
          cachedList[updateIndex] = { ...cachedList[updateIndex], ...data };
        }
        break;
      case 'delete':
        cachedList = cachedList.filter((item: any) => item.id !== data.id);
        break;
    }
    
    this.cache.set(cacheKey, cachedList);
    
    if (this.isOnline) {
      this.syncDataChange(type, data, action);
    } else {
      this.storeOfflineData(type, data, action);
    }
  }

  // Offline Management
  private storeOfflineRequest(endpoint: string, options: RequestInit): void {
    const offlineRequests = JSON.parse(localStorage.getItem('offline-requests') || '[]');
    offlineRequests.push({ endpoint, options, timestamp: new Date().toISOString() });
    localStorage.setItem('offline-requests', JSON.stringify(offlineRequests));
    console.log('💾 Stored offline request:', endpoint);
  }

  private storeOfflineData(type: string, data: any, action: string): void {
    const offlineChanges = JSON.parse(localStorage.getItem('offline-changes') || '{}');
    if (!offlineChanges[type]) offlineChanges[type] = [];
    offlineChanges[type].push({ ...data, action, timestamp: new Date().toISOString() });
    localStorage.setItem('offline-changes', JSON.stringify(offlineChanges));
    console.log('💾 Stored offline change:', type, action);
  }

  private async syncOfflineChanges(): Promise<void> {
    try {
      const offlineRequests = JSON.parse(localStorage.getItem('offline-requests') || '[]');
      for (const request of offlineRequests) {
        try {
          await this.apiRequest(request.endpoint, request.options);
          console.log('✅ Synced offline request:', request.endpoint);
        } catch (error) {
          console.warn('⚠️ Failed to sync request:', request.endpoint);
        }
      }
      localStorage.removeItem('offline-requests');
    } catch (error) {
      console.error('❌ Failed to sync offline changes:', error);
    }
  }

  private async syncDataChange(type: string, data: any, action: string): Promise<void> {
    try {
      switch (type) {
        case 'products':
          if (action === 'save' || action === 'update') {
            await this.saveProduct(data);
          }
          break;
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync data change:', error);
      this.storeOfflineData(type, data, action);
    }
  }

  // Fallback Data
  private getFallbackProducts(): Product[] {
    return [
      {"id": "P001", "sku": "LUM-2x4-001", "name": "2x4 Lumber - 8ft", "category": "Lumber", "price": 4.99, "cost": 3.24, "stock": 450, "reorderPoint": 100, "supplier": "Northwest Lumber Co", "location": "Warehouse A"},
      {"id": "P002", "sku": "CON-BAG-002", "name": "Portland Cement - 94lb Bag", "category": "Concrete", "price": 8.49, "cost": 5.99, "stock": 89, "reorderPoint": 150, "supplier": "Cement Supply Inc", "location": "Warehouse B"}
    ];
  }

  private getFallbackCustomers(): Customer[] {
    return [
      {"id": "C001", "name": "ABC Construction Co", "type": "General Contractor", "revenue": 245000, "orders": 23, "status": "Active", "paymentTerms": "Net 30", "churnRisk": "Low", "lastOrder": "2024-08-10"}
    ];
  }

  private getFallbackOrders(): Order[] {
    return [
      {"id": "ORD001", "customer": "ABC Construction Co", "date": "2024-08-10", "total": 4567.89, "status": "Shipped", "items": 12}
    ];
  }

  public getCachedData(key: string): any {
    return this.cache.get(key);
  }

  public setCachedData(key: string, data: any): void {
    this.cache.set(key, data);
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }
}

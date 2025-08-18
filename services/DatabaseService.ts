// services/DatabaseService.ts
import { Injectable } from '@varld/warp';

interface DatabaseOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 1 | 0>;
}

interface DatabaseConnection {
  connected: boolean;
  url: string;
  database: string;
}

@Injectable()
export class DatabaseService {
  private connection: DatabaseConnection;
  private collections: Map<string, any[]> = new Map();
  private isConnected: boolean = false;

  constructor() {
    this.connection = {
      connected: false,
      url: process.env.DATABASE_URL || 'mongodb://localhost:27017',
      database: process.env.DATABASE_NAME || 'construction_erp'
    };
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Initialize in-memory collections for development
      // In production, this would connect to actual MongoDB/PostgreSQL
      this.collections.set('products', []);
      this.collections.set('inventory', []);
      this.collections.set('customers', []);
      this.collections.set('orders', []);
      this.collections.set('purchases', []);
      this.collections.set('projects', []);
      this.collections.set('suppliers', []);
      this.collections.set('stock_movements', []);
      this.collections.set('customer_contacts', []);
      this.collections.set('ai_insights', []);
      this.collections.set('notifications', []);
      this.collections.set('users', []);
      this.collections.set('analytics', []);

      // Seed some initial data
      await this.seedInitialData();

      this.isConnected = true;
      this.connection.connected = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async find<T>(collection: string, query: any = {}, options: DatabaseOptions = {}): Promise<T[]> {
    try {
      let data = this.collections.get(collection) || [];
      
      // Apply filters
      if (Object.keys(query).length > 0) {
        data = data.filter(item => this.matchesQuery(item, query));
      }

      // Apply sorting
      if (options.sort) {
        data = this.applySorting(data, options.sort);
      }

      // Apply pagination
      if (options.skip) {
        data = data.slice(options.skip);
      }
      if (options.limit) {
        data = data.slice(0, options.limit);
      }

      // Apply projection
      if (options.projection) {
        data = data.map(item => this.applyProjection(item, options.projection!));
      }

      return data as T[];
    } catch (error) {
      console.error(`Error finding documents in ${collection}:`, error);
      throw error;
    }
  }

  async findOne<T>(collection: string, query: any = {}): Promise<T | null> {
    try {
      const results = await this.find<T>(collection, query, { limit: 1 });
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error finding document in ${collection}:`, error);
      throw error;
    }
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    try {
      return await this.findOne<T>(collection, { id });
    } catch (error) {
      console.error(`Error finding document by ID in ${collection}:`, error);
      throw error;
    }
  }

  async create<T>(collection: string, data: T): Promise<T> {
    try {
      const collectionData = this.collections.get(collection) || [];
      
      // Ensure data has an ID
      const newItem = {
        ...data,
        id: (data as any).id || this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      collectionData.push(newItem);
      this.collections.set(collection, collectionData);

      console.log(`✅ Created document in ${collection}:`, newItem.id);
      return newItem as T;
    } catch (error) {
      console.error(`Error creating document in ${collection}:`, error);
      throw error;
    }
  }

  async update<T>(collection: string, id: string, updateData: Partial<T>): Promise<T> {
    try {
      const collectionData = this.collections.get(collection) || [];
      const index = collectionData.findIndex(item => item.id === id);

      if (index === -1) {
        throw new Error(`Document with ID ${id} not found in ${collection}`);
      }

      const updatedItem = {
        ...collectionData[index],
        ...updateData,
        updatedAt: new Date()
      };

      collectionData[index] = updatedItem;
      this.collections.set(collection, collectionData);

      console.log(`✅ Updated document in ${collection}:`, id);
      return updatedItem as T;
    } catch (error) {
      console.error(`Error updating document in ${collection}:`, error);
      throw error;
    }
  }

  async delete(collection: string, id: string): Promise<boolean> {
    try {
      const collectionData = this.collections.get(collection) || [];
      const index = collectionData.findIndex(item => item.id === id);

      if (index === -1) {
        throw new Error(`Document with ID ${id} not found in ${collection}`);
      }

      collectionData.splice(index, 1);
      this.collections.set(collection, collectionData);

      console.log(`✅ Deleted document from ${collection}:`, id);
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collection}:`, error);
      throw error;
    }
  }

  async deleteMany(collection: string, query: any): Promise<number> {
    try {
      const collectionData = this.collections.get(collection) || [];
      const initialLength = collectionData.length;

      const filteredData = collectionData.filter(item => !this.matchesQuery(item, query));
      this.collections.set(collection, filteredData);

      const deletedCount = initialLength - filteredData.length;
      console.log(`✅ Deleted ${deletedCount} documents from ${collection}`);
      return deletedCount;
    } catch (error) {
      console.error(`Error deleting documents from ${collection}:`, error);
      throw error;
    }
  }

  async count(collection: string, query: any = {}): Promise<number> {
    try {
      const data = await this.find(collection, query);
      return data.length;
    } catch (error) {
      console.error(`Error counting documents in ${collection}:`, error);
      throw error;
    }
  }

  async aggregate<T>(collection: string, pipeline: any[]): Promise<T[]> {
    try {
      // Simple aggregation implementation
      let data = this.collections.get(collection) || [];

      for (const stage of pipeline) {
        if (stage.$match) {
          data = data.filter(item => this.matchesQuery(item, stage.$match));
        }
        if (stage.$sort) {
          data = this.applySorting(data, stage.$sort);
        }
        if (stage.$limit) {
          data = data.slice(0, stage.$limit);
        }
        if (stage.$skip) {
          data = data.slice(stage.$skip);
        }
        if (stage.$group) {
          data = this.applyGrouping(data, stage.$group);
        }
      }

      return data as T[];
    } catch (error) {
      console.error(`Error aggregating documents in ${collection}:`, error);
      throw error;
    }
  }

  async createIndex(collection: string, keys: Record<string, 1 | -1>): Promise<void> {
    try {
      // In a real implementation, this would create database indexes
      console.log(`✅ Index created for ${collection}:`, keys);
    } catch (error) {
      console.error(`Error creating index for ${collection}:`, error);
      throw error;
    }
  }

  async getConnectionStatus(): Promise<DatabaseConnection> {
    return this.connection;
  }

  async healthCheck(): Promise<{ status: string; latency: number; collections: number }> {
    const start = Date.now();
    
    try {
      // Perform a simple operation to test connectivity
      await this.count('products');
      const latency = Date.now() - start;

      return {
        status: this.isConnected ? 'healthy' : 'unhealthy',
        latency,
        collections: this.collections.size
      };
    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - start,
        collections: 0
      };
    }
  }

  private matchesQuery(item: any, query: any): boolean {
    for (const [key, value] of Object.entries(query)) {
      if (key === '$or') {
        const orConditions = value as any[];
        const matches = orConditions.some(condition => this.matchesQuery(item, condition));
        if (!matches) return false;
      } else if (key === '$and') {
        const andConditions = value as any[];
        const matches = andConditions.every(condition => this.matchesQuery(item, condition));
        if (!matches) return false;
      } else if (typeof value === 'object' && value !== null) {
        if (value.$regex) {
          const regex = new RegExp(value.$regex, value.$options || '');
          if (!regex.test(item[key])) return false;
        } else if (value.$in) {
          if (!value.$in.includes(item[key])) return false;
        } else if (value.$gte !== undefined) {
          if (item[key] < value.$gte) return false;
        } else if (value.$lte !== undefined) {
          if (item[key] > value.$lte) return false;
        } else if (value.$gt !== undefined) {
          if (item[key] <= value.$gt) return false;
        } else if (value.$lt !== undefined) {
          if (item[key] >= value.$lt) return false;
        } else if (value.$ne !== undefined) {
          if (item[key] === value.$ne) return false;
        } else {
          if (!this.deepEqual(item[key], value)) return false;
        }
      } else {
        if (item[key] !== value) return false;
      }
    }
    return true;
  }

  private applySorting(data: any[], sort: Record<string, 1 | -1>): any[] {
    return data.sort((a, b) => {
      for (const [key, direction] of Object.entries(sort)) {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return direction === 1 ? -1 : 1;
        if (aVal > bVal) return direction === 1 ? 1 : -1;
      }
      return 0;
    });
  }

  private applyProjection(item: any, projection: Record<string, 1 | 0>): any {
    const result: any = {};
    const includeFields = Object.entries(projection).filter(([_, include]) => include === 1);
    const excludeFields = Object.entries(projection).filter(([_, include]) => include === 0);

    if (includeFields.length > 0) {
      // Include only specified fields
      for (const [field] of includeFields) {
        if (item[field] !== undefined) {
          result[field] = item[field];
        }
      }
      // Always include ID unless explicitly excluded
      if (!projection.id && !projection._id) {
        result.id = item.id;
      }
    } else {
      // Include all fields except excluded ones
      Object.assign(result, item);
      for (const [field] of excludeFields) {
        delete result[field];
      }
    }

    return result;
  }

  private applyGrouping(data: any[], groupStage: any): any[] {
    const groups: Map<string, any[]> = new Map();
    
    // Group by _id field
    for (const item of data) {
      const key = this.getGroupKey(item, groupStage._id);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    // Apply aggregation operations
    const result = [];
    for (const [key, items] of groups) {
      const groupResult: any = { _id: key };
      
      for (const [field, operation] of Object.entries(groupStage)) {
        if (field === '_id') continue;
        
        if (typeof operation === 'object' && operation !== null) {
          const op = Object.keys(operation)[0];
          const value = (operation as any)[op];
          
          switch (op) {
            case '$sum':
              groupResult[field] = items.reduce((sum, item) => {
                return sum + (value === 1 ? 1 : item[value] || 0);
              }, 0);
              break;
            case '$avg':
              const values = items.map(item => item[value] || 0);
              groupResult[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
              break;
            case '$max':
              groupResult[field] = Math.max(...items.map(item => item[value] || 0));
              break;
            case '$min':
              groupResult[field] = Math.min(...items.map(item => item[value] || 0));
              break;
            case '$count':
              groupResult[field] = items.length;
              break;
          }
        }
      }
      
      result.push(groupResult);
    }

    return result;
  }

  private getGroupKey(item: any, groupId: any): string {
    if (typeof groupId === 'string') {
      return String(item[groupId.replace('$', '')] || 'null');
    }
    if (typeof groupId === 'object') {
      const keys = Object.entries(groupId).map(([key, value]) => {
        const fieldValue = item[(value as string).replace('$', '')] || 'null';
        return `${key}:${fieldValue}`;
      });
      return keys.join('|');
    }
    return 'default';
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      return true;
    }
    
    return false;
  }

  private generateId(): string {
    return 'doc_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private async seedInitialData(): Promise<void> {
    // Seed some sample products
    const sampleProducts = [
      {
        id: 'prod_001',
        name: 'Portland Cement',
        category: 'Cement',
        description: 'High-quality Portland cement for construction projects',
        unit: 'bag',
        price: 12.50,
        supplier: 'CemCorp',
        status: 'active'
      },
      {
        id: 'prod_002',
        name: 'Steel Rebar #4',
        category: 'Steel',
        description: '1/2 inch steel reinforcement bar',
        unit: 'piece',
        price: 8.75,
        supplier: 'SteelMax',
        status: 'active'
      },
      {
        id: 'prod_003',
        name: 'Concrete Blocks',
        category: 'Masonry',
        description: '8x8x16 concrete masonry units',
        unit: 'piece',
        price: 2.25,
        supplier: 'BlockCo',
        status: 'active'
      }
    ];

    this.collections.set('products', sampleProducts);

    // Seed sample inventory
    const sampleInventory = [
      {
        id: 'inv_001',
        productId: 'prod_001',
        productName: 'Portland Cement',
        category: 'Cement',
        quantity: 150,
        minimumStock: 50,
        maximumStock: 500,
        unit: 'bag',
        unitCost: 12.50,
        location: 'Warehouse A',
        supplier: 'CemCorp',
        status: 'in_stock',
        lastUpdated: new Date()
      },
      {
        id: 'inv_002',
        productId: 'prod_002',
        productName: 'Steel Rebar #4',
        category: 'Steel',
        quantity: 25,
        minimumStock: 30,
        maximumStock: 200,
        unit: 'piece',
        unitCost: 8.75,
        location: 'Warehouse B',
        supplier: 'SteelMax',
        status: 'low_stock',
        lastUpdated: new Date()
      }
    ];

    this.collections.set('inventory', sampleInventory);

    console.log('✅ Sample data seeded successfully');
  }
}

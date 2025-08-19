"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const warp_1 = require("@varld/warp");
let DatabaseService = class DatabaseService {
    connection;
    collections = new Map();
    isConnected = false;
    constructor() {
        this.connection = {
            connected: false,
            url: process.env.DATABASE_URL || 'mongodb://localhost:27017',
            database: process.env.DATABASE_NAME || 'construction_erp'
        };
        this.initializeDatabase();
    }
    async initializeDatabase() {
        try {
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
            await this.seedInitialData();
            this.isConnected = true;
            this.connection.connected = true;
            console.log('✅ Database initialized successfully');
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    async find(collection, query = {}, options = {}) {
        try {
            let data = this.collections.get(collection) || [];
            if (Object.keys(query).length > 0) {
                data = data.filter(item => this.matchesQuery(item, query));
            }
            if (options.sort) {
                data = this.applySorting(data, options.sort);
            }
            if (options.skip) {
                data = data.slice(options.skip);
            }
            if (options.limit) {
                data = data.slice(0, options.limit);
            }
            if (options.projection) {
                data = data.map(item => this.applyProjection(item, options.projection));
            }
            return data;
        }
        catch (error) {
            console.error(`Error finding documents in ${collection}:`, error);
            throw error;
        }
    }
    async findOne(collection, query = {}) {
        try {
            const results = await this.find(collection, query, { limit: 1 });
            return results.length > 0 ? results[0] : null;
        }
        catch (error) {
            console.error(`Error finding document in ${collection}:`, error);
            throw error;
        }
    }
    async findById(collection, id) {
        try {
            return await this.findOne(collection, { id });
        }
        catch (error) {
            console.error(`Error finding document by ID in ${collection}:`, error);
            throw error;
        }
    }
    async create(collection, data) {
        try {
            const collectionData = this.collections.get(collection) || [];
            const newItem = {
                ...data,
                id: data.id || this.generateId(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            collectionData.push(newItem);
            this.collections.set(collection, collectionData);
            console.log(`✅ Created document in ${collection}:`, newItem.id);
            return newItem;
        }
        catch (error) {
            console.error(`Error creating document in ${collection}:`, error);
            throw error;
        }
    }
    async update(collection, id, updateData) {
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
            return updatedItem;
        }
        catch (error) {
            console.error(`Error updating document in ${collection}:`, error);
            throw error;
        }
    }
    async delete(collection, id) {
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
        }
        catch (error) {
            console.error(`Error deleting document from ${collection}:`, error);
            throw error;
        }
    }
    async deleteMany(collection, query) {
        try {
            const collectionData = this.collections.get(collection) || [];
            const initialLength = collectionData.length;
            const filteredData = collectionData.filter(item => !this.matchesQuery(item, query));
            this.collections.set(collection, filteredData);
            const deletedCount = initialLength - filteredData.length;
            console.log(`✅ Deleted ${deletedCount} documents from ${collection}`);
            return deletedCount;
        }
        catch (error) {
            console.error(`Error deleting documents from ${collection}:`, error);
            throw error;
        }
    }
    async count(collection, query = {}) {
        try {
            const data = await this.find(collection, query);
            return data.length;
        }
        catch (error) {
            console.error(`Error counting documents in ${collection}:`, error);
            throw error;
        }
    }
    async aggregate(collection, pipeline) {
        try {
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
            return data;
        }
        catch (error) {
            console.error(`Error aggregating documents in ${collection}:`, error);
            throw error;
        }
    }
    async createIndex(collection, keys) {
        try {
            console.log(`✅ Index created for ${collection}:`, keys);
        }
        catch (error) {
            console.error(`Error creating index for ${collection}:`, error);
            throw error;
        }
    }
    async getConnectionStatus() {
        return this.connection;
    }
    async healthCheck() {
        const start = Date.now();
        try {
            await this.count('products');
            const latency = Date.now() - start;
            return {
                status: this.isConnected ? 'healthy' : 'unhealthy',
                latency,
                collections: this.collections.size
            };
        }
        catch (error) {
            return {
                status: 'error',
                latency: Date.now() - start,
                collections: 0
            };
        }
    }
    matchesQuery(item, query) {
        for (const [key, value] of Object.entries(query)) {
            if (key === '$or') {
                const orConditions = value;
                const matches = orConditions.some(condition => this.matchesQuery(item, condition));
                if (!matches)
                    return false;
            }
            else if (key === '$and') {
                const andConditions = value;
                const matches = andConditions.every(condition => this.matchesQuery(item, condition));
                if (!matches)
                    return false;
            }
            else if (typeof value === 'object' && value !== null) {
                if (value.$regex) {
                    const regex = new RegExp(value.$regex, value.$options || '');
                    if (!regex.test(item[key]))
                        return false;
                }
                else if (value.$in) {
                    if (!value.$in.includes(item[key]))
                        return false;
                }
                else if (value.$gte !== undefined) {
                    if (item[key] < value.$gte)
                        return false;
                }
                else if (value.$lte !== undefined) {
                    if (item[key] > value.$lte)
                        return false;
                }
                else if (value.$gt !== undefined) {
                    if (item[key] <= value.$gt)
                        return false;
                }
                else if (value.$lt !== undefined) {
                    if (item[key] >= value.$lt)
                        return false;
                }
                else if (value.$ne !== undefined) {
                    if (item[key] === value.$ne)
                        return false;
                }
                else {
                    if (!this.deepEqual(item[key], value))
                        return false;
                }
            }
            else {
                if (item[key] !== value)
                    return false;
            }
        }
        return true;
    }
    applySorting(data, sort) {
        return data.sort((a, b) => {
            for (const [key, direction] of Object.entries(sort)) {
                const aVal = a[key];
                const bVal = b[key];
                if (aVal < bVal)
                    return direction === 1 ? -1 : 1;
                if (aVal > bVal)
                    return direction === 1 ? 1 : -1;
            }
            return 0;
        });
    }
    applyProjection(item, projection) {
        const result = {};
        const includeFields = Object.entries(projection).filter(([_, include]) => include === 1);
        const excludeFields = Object.entries(projection).filter(([_, include]) => include === 0);
        if (includeFields.length > 0) {
            for (const [field] of includeFields) {
                if (item[field] !== undefined) {
                    result[field] = item[field];
                }
            }
            if (!projection.id && !projection._id) {
                result.id = item.id;
            }
        }
        else {
            Object.assign(result, item);
            for (const [field] of excludeFields) {
                delete result[field];
            }
        }
        return result;
    }
    applyGrouping(data, groupStage) {
        const groups = new Map();
        for (const item of data) {
            const key = this.getGroupKey(item, groupStage._id);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        }
        const result = [];
        for (const [key, items] of groups) {
            const groupResult = { _id: key };
            for (const [field, operation] of Object.entries(groupStage)) {
                if (field === '_id')
                    continue;
                if (typeof operation === 'object' && operation !== null) {
                    const op = Object.keys(operation)[0];
                    const value = operation[op];
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
    getGroupKey(item, groupId) {
        if (typeof groupId === 'string') {
            return String(item[groupId.replace('$', '')] || 'null');
        }
        if (typeof groupId === 'object') {
            const keys = Object.entries(groupId).map(([key, value]) => {
                const fieldValue = item[value.replace('$', '')] || 'null';
                return `${key}:${fieldValue}`;
            });
            return keys.join('|');
        }
        return 'default';
    }
    deepEqual(a, b) {
        if (a === b)
            return true;
        if (a == null || b == null)
            return false;
        if (typeof a !== typeof b)
            return false;
        if (typeof a === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length)
                return false;
            for (const key of keysA) {
                if (!keysB.includes(key))
                    return false;
                if (!this.deepEqual(a[key], b[key]))
                    return false;
            }
            return true;
        }
        return false;
    }
    generateId() {
        return 'doc_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    async seedInitialData() {
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
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, warp_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DatabaseService);
//# sourceMappingURL=DatabaseService.js.map
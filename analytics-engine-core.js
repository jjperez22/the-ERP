/**
 * Analytics Engine Core - Part 1: Data Processing and Filtering Engine
 * Provides data aggregation, filtering, and basic analytics capabilities
 */

class AnalyticsEngineCore {
    constructor() {
        this.dataStore = new Map();
        this.filters = new Map();
        this.aggregators = new Map();
        this.eventListeners = new Map();
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }

    init() {
        console.log('📊 Analytics Engine Core initializing...');
        this.registerDefaultAggregators();
        this.registerDefaultFilters();
    }

    // ========== DATA MANAGEMENT ==========
    
    /**
     * Register a data source with the analytics engine
     */
    registerDataSource(sourceName, data) {
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array');
        }
        
        this.dataStore.set(sourceName, {
            data: data,
            lastUpdated: new Date(),
            schema: this.inferSchema(data),
            indexes: this.buildIndexes(data)
        });
        
        this.clearCache(); // Invalidate cache when new data is added
        this.emit('dataSourceRegistered', { sourceName, recordCount: data.length });
        
        console.log(`📊 Data source '${sourceName}' registered with ${data.length} records`);
    }

    /**
     * Update data source
     */
    updateDataSource(sourceName, data) {
        if (!this.dataStore.has(sourceName)) {
            throw new Error(`Data source '${sourceName}' not found`);
        }
        
        this.registerDataSource(sourceName, data);
        this.emit('dataSourceUpdated', { sourceName, recordCount: data.length });
    }

    /**
     * Get data from a source
     */
    getDataSource(sourceName) {
        const source = this.dataStore.get(sourceName);
        return source ? source.data : null;
    }

    /**
     * Infer schema from data
     */
    inferSchema(data) {
        if (!data || data.length === 0) return {};
        
        const sample = data[0];
        const schema = {};
        
        for (const [key, value] of Object.entries(sample)) {
            schema[key] = {
                type: this.inferDataType(value),
                nullable: data.some(record => record[key] === null || record[key] === undefined),
                unique: this.isUniqueField(data, key),
                samples: this.getSampleValues(data, key, 5)
            };
        }
        
        return schema;
    }

    /**
     * Infer data type from value
     */
    inferDataType(value) {
        if (value === null || value === undefined) return 'unknown';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (value instanceof Date) return 'date';
        if (typeof value === 'string') {
            // Check if it's a date string
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}/) ) {
                return 'date';
            }
            // Check if it's a number string
            if (!isNaN(parseFloat(value)) && isFinite(value)) {
                return 'number';
            }
            return 'string';
        }
        if (typeof value === 'object') return 'object';
        return 'unknown';
    }

    /**
     * Check if field is unique
     */
    isUniqueField(data, fieldName) {
        const values = new Set(data.map(record => record[fieldName]));
        return values.size === data.length;
    }

    /**
     * Get sample values for a field
     */
    getSampleValues(data, fieldName, count = 5) {
        const values = [...new Set(data.map(record => record[fieldName]))];
        return values.slice(0, count);
    }

    /**
     * Build indexes for faster queries
     */
    buildIndexes(data) {
        const indexes = {};
        
        if (data.length === 0) return indexes;
        
        const fields = Object.keys(data[0]);
        
        fields.forEach(field => {
            indexes[field] = {};
            data.forEach((record, index) => {
                const value = record[field];
                if (!indexes[field][value]) {
                    indexes[field][value] = [];
                }
                indexes[field][value].push(index);
            });
        });
        
        return indexes;
    }

    // ========== FILTERING SYSTEM ==========
    
    /**
     * Register default filter functions
     */
    registerDefaultFilters() {
        this.registerFilter('equals', (value, filterValue) => value === filterValue);
        this.registerFilter('notEquals', (value, filterValue) => value !== filterValue);
        this.registerFilter('contains', (value, filterValue) => 
            String(value).toLowerCase().includes(String(filterValue).toLowerCase()));
        this.registerFilter('startsWith', (value, filterValue) => 
            String(value).toLowerCase().startsWith(String(filterValue).toLowerCase()));
        this.registerFilter('endsWith', (value, filterValue) => 
            String(value).toLowerCase().endsWith(String(filterValue).toLowerCase()));
        this.registerFilter('greaterThan', (value, filterValue) => Number(value) > Number(filterValue));
        this.registerFilter('lessThan', (value, filterValue) => Number(value) < Number(filterValue));
        this.registerFilter('greaterThanOrEqual', (value, filterValue) => Number(value) >= Number(filterValue));
        this.registerFilter('lessThanOrEqual', (value, filterValue) => Number(value) <= Number(filterValue));
        this.registerFilter('between', (value, filterValue) => {
            const [min, max] = filterValue;
            const numValue = Number(value);
            return numValue >= min && numValue <= max;
        });
        this.registerFilter('in', (value, filterValue) => filterValue.includes(value));
        this.registerFilter('notIn', (value, filterValue) => !filterValue.includes(value));
        this.registerFilter('dateAfter', (value, filterValue) => new Date(value) > new Date(filterValue));
        this.registerFilter('dateBefore', (value, filterValue) => new Date(value) < new Date(filterValue));
        this.registerFilter('dateRange', (value, filterValue) => {
            const [startDate, endDate] = filterValue;
            const date = new Date(value);
            return date >= new Date(startDate) && date <= new Date(endDate);
        });
    }

    /**
     * Register a custom filter function
     */
    registerFilter(name, filterFunction) {
        this.filters.set(name, filterFunction);
    }

    /**
     * Apply filters to data
     */
    applyFilters(sourceName, filterConfig) {
        const cacheKey = `filtered_${sourceName}_${JSON.stringify(filterConfig)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        const source = this.dataStore.get(sourceName);
        if (!source) {
            throw new Error(`Data source '${sourceName}' not found`);
        }

        let filteredData = source.data;

        // Apply each filter
        filterConfig.forEach(filter => {
            const { field, operator, value } = filter;
            const filterFunction = this.filters.get(operator);
            
            if (!filterFunction) {
                throw new Error(`Filter operator '${operator}' not found`);
            }

            filteredData = filteredData.filter(record => {
                const fieldValue = this.getNestedValue(record, field);
                try {
                    return filterFunction(fieldValue, value);
                } catch (error) {
                    console.warn(`Filter error for field ${field}:`, error);
                    return false;
                }
            });
        });

        // Cache the result
        this.cache.set(cacheKey, {
            data: filteredData,
            timestamp: Date.now()
        });

        return filteredData;
    }

    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    // ========== AGGREGATION SYSTEM ==========
    
    /**
     * Register default aggregation functions
     */
    registerDefaultAggregators() {
        this.registerAggregator('count', (data) => data.length);
        this.registerAggregator('sum', (data, field) => {
            return data.reduce((sum, record) => {
                const value = this.getNestedValue(record, field);
                return sum + (Number(value) || 0);
            }, 0);
        });
        this.registerAggregator('average', (data, field) => {
            const sum = this.aggregators.get('sum')(data, field);
            return data.length > 0 ? sum / data.length : 0;
        });
        this.registerAggregator('min', (data, field) => {
            const values = data.map(record => Number(this.getNestedValue(record, field))).filter(v => !isNaN(v));
            return values.length > 0 ? Math.min(...values) : null;
        });
        this.registerAggregator('max', (data, field) => {
            const values = data.map(record => Number(this.getNestedValue(record, field))).filter(v => !isNaN(v));
            return values.length > 0 ? Math.max(...values) : null;
        });
        this.registerAggregator('median', (data, field) => {
            const values = data.map(record => Number(this.getNestedValue(record, field)))
                .filter(v => !isNaN(v))
                .sort((a, b) => a - b);
            if (values.length === 0) return null;
            const mid = Math.floor(values.length / 2);
            return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
        });
        this.registerAggregator('distinct', (data, field) => {
            const values = data.map(record => this.getNestedValue(record, field));
            return [...new Set(values)];
        });
        this.registerAggregator('distinctCount', (data, field) => {
            return this.aggregators.get('distinct')(data, field).length;
        });
    }

    /**
     * Register a custom aggregator function
     */
    registerAggregator(name, aggregatorFunction) {
        this.aggregators.set(name, aggregatorFunction);
    }

    /**
     * Perform aggregation on data
     */
    aggregate(sourceName, aggregationConfig, filterConfig = []) {
        const cacheKey = `aggregated_${sourceName}_${JSON.stringify(aggregationConfig)}_${JSON.stringify(filterConfig)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        // Get filtered data
        let data = filterConfig.length > 0 
            ? this.applyFilters(sourceName, filterConfig)
            : this.getDataSource(sourceName);

        if (!data) {
            throw new Error(`Data source '${sourceName}' not found`);
        }

        const results = {};

        // Process each aggregation
        aggregationConfig.forEach(config => {
            const { name, type, field, groupBy } = config;
            const aggregatorFunction = this.aggregators.get(type);
            
            if (!aggregatorFunction) {
                throw new Error(`Aggregator '${type}' not found`);
            }

            if (groupBy) {
                // Group data and aggregate each group
                const grouped = this.groupData(data, groupBy);
                results[name] = {};
                
                Object.entries(grouped).forEach(([groupKey, groupData]) => {
                    results[name][groupKey] = aggregatorFunction(groupData, field);
                });
            } else {
                // Simple aggregation on entire dataset
                results[name] = aggregatorFunction(data, field);
            }
        });

        // Cache the result
        this.cache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });

        return results;
    }

    /**
     * Group data by field(s)
     */
    groupData(data, groupByFields) {
        const groups = {};
        const fields = Array.isArray(groupByFields) ? groupByFields : [groupByFields];

        data.forEach(record => {
            const groupKey = fields.map(field => this.getNestedValue(record, field)).join('|');
            
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(record);
        });

        return groups;
    }

    // ========== EVENT SYSTEM ==========
    
    /**
     * Add event listener
     */
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }

    /**
     * Remove event listener
     */
    off(eventName, callback) {
        if (!this.eventListeners.has(eventName)) return;
        const listeners = this.eventListeners.get(eventName);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Emit event
     */
    emit(eventName, data) {
        if (!this.eventListeners.has(eventName)) return;
        this.eventListeners.get(eventName).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for '${eventName}':`, error);
            }
        });
    }

    // ========== UTILITY METHODS ==========
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get analytics metadata
     */
    getAnalyticsMetadata() {
        const metadata = {
            dataSources: {},
            totalRecords: 0,
            availableFilters: Array.from(this.filters.keys()),
            availableAggregators: Array.from(this.aggregators.keys()),
            cacheSize: this.cache.size
        };

        this.dataStore.forEach((source, name) => {
            metadata.dataSources[name] = {
                recordCount: source.data.length,
                lastUpdated: source.lastUpdated,
                schema: source.schema
            };
            metadata.totalRecords += source.data.length;
        });

        return metadata;
    }

    /**
     * Get data source statistics
     */
    getDataSourceStats(sourceName) {
        const source = this.dataStore.get(sourceName);
        if (!source) {
            throw new Error(`Data source '${sourceName}' not found`);
        }

        const stats = {
            recordCount: source.data.length,
            schema: source.schema,
            fieldStats: {}
        };

        // Calculate field statistics
        Object.keys(source.schema).forEach(field => {
            const values = source.data.map(record => this.getNestedValue(record, field))
                .filter(value => value !== null && value !== undefined);
            
            const fieldType = source.schema[field].type;
            
            stats.fieldStats[field] = {
                type: fieldType,
                nullCount: source.data.length - values.length,
                distinctCount: new Set(values).size
            };

            if (fieldType === 'number') {
                const numValues = values.map(v => Number(v)).filter(v => !isNaN(v));
                if (numValues.length > 0) {
                    stats.fieldStats[field].min = Math.min(...numValues);
                    stats.fieldStats[field].max = Math.max(...numValues);
                    stats.fieldStats[field].average = numValues.reduce((a, b) => a + b, 0) / numValues.length;
                }
            }

            if (fieldType === 'string') {
                stats.fieldStats[field].avgLength = values.reduce((sum, val) => sum + String(val).length, 0) / values.length;
                stats.fieldStats[field].maxLength = Math.max(...values.map(val => String(val).length));
            }
        });

        return stats;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsEngineCore;
} else {
    window.AnalyticsEngineCore = AnalyticsEngineCore;
}

console.log('📊 Analytics Engine Core (Part 1) loaded - Data Processing and Filtering');

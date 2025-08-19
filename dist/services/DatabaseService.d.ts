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
export declare class DatabaseService {
    private connection;
    private collections;
    private isConnected;
    constructor();
    private initializeDatabase;
    find<T>(collection: string, query?: any, options?: DatabaseOptions): Promise<T[]>;
    findOne<T>(collection: string, query?: any): Promise<T | null>;
    findById<T>(collection: string, id: string): Promise<T | null>;
    create<T>(collection: string, data: T): Promise<T>;
    update<T>(collection: string, id: string, updateData: Partial<T>): Promise<T>;
    delete(collection: string, id: string): Promise<boolean>;
    deleteMany(collection: string, query: any): Promise<number>;
    count(collection: string, query?: any): Promise<number>;
    aggregate<T>(collection: string, pipeline: any[]): Promise<T[]>;
    createIndex(collection: string, keys: Record<string, 1 | -1>): Promise<void>;
    getConnectionStatus(): Promise<DatabaseConnection>;
    healthCheck(): Promise<{
        status: string;
        latency: number;
        collections: number;
    }>;
    private matchesQuery;
    private applySorting;
    private applyProjection;
    private applyGrouping;
    private getGroupKey;
    private deepEqual;
    private generateId;
    private seedInitialData;
}
export {};
//# sourceMappingURL=DatabaseService.d.ts.map
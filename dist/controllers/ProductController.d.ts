import { Product, ProductCategory } from '../models/DataModels';
import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
export declare class ProductController {
    private database;
    private ai;
    constructor(database: DatabaseService, ai: AIService);
    getAllProducts(filters?: any): Promise<Product[]>;
    getProduct(id: string): Promise<Product>;
    createProduct(productData: Partial<Product>): Promise<Product>;
    updateProduct(id: string, updateData: Partial<Product>): Promise<Product>;
    deleteProduct(id: string): Promise<{
        success: boolean;
    }>;
    getDemandForecast(id: string): Promise<any>;
    getCategories(): Promise<ProductCategory[]>;
    bulkImport(products: Partial<Product>[]): Promise<{
        successful: number;
        failed: number;
        errors: any[];
    }>;
}
//# sourceMappingURL=ProductController.d.ts.map
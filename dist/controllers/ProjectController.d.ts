import { DatabaseService } from '../services/DatabaseService';
import { AIService } from '../services/AIService';
import { NotificationService } from '../services/NotificationService';
interface Project {
    id: string;
    projectNumber: string;
    name: string;
    description: string;
    customerId: string;
    customerName: string;
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    startDate: Date;
    expectedEndDate: Date;
    actualEndDate?: Date;
    budget: number;
    actualCost: number;
    margin: number;
    projectManager: string;
    address: string;
    notes?: string;
    materials: ProjectMaterial[];
    milestones: ProjectMilestone[];
    createdAt: Date;
    updatedAt: Date;
}
interface ProjectMaterial {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    allocatedQuantity: number;
    usedQuantity: number;
}
interface ProjectMilestone {
    id: string;
    name: string;
    description: string;
    targetDate: Date;
    actualDate?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    dependencies: string[];
}
export declare class ProjectController {
    private databaseService;
    private aiService;
    private notificationService;
    constructor(databaseService: DatabaseService, aiService: AIService, notificationService: NotificationService);
    getAllProjects(query: any): Promise<{
        success: boolean;
        data: Project[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        pagination?: undefined;
    }>;
    getProjectById(id: string): Promise<{
        success: boolean;
        data: {
            customer: unknown;
            analytics: any;
            id: string;
            projectNumber: string;
            name: string;
            description: string;
            customerId: string;
            customerName: string;
            status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
            priority: "low" | "medium" | "high" | "critical";
            startDate: Date;
            expectedEndDate: Date;
            actualEndDate?: Date;
            budget: number;
            actualCost: number;
            margin: number;
            projectManager: string;
            address: string;
            notes?: string;
            materials: ProjectMaterial[];
            milestones: ProjectMilestone[];
            createdAt: Date;
            updatedAt: Date;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    createProject(projectData: Partial<Project>): Promise<{
        success: boolean;
        data: Project;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    private generateProjectNumber;
    private calculateProjectAnalytics;
    private generateId;
}
export {};
//# sourceMappingURL=ProjectController.d.ts.map
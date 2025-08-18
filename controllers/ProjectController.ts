// controllers/ProjectController.ts
import { Controller, Get, Post, Put, Delete, Injectable, Body, Param, Query } from '@varld/warp';
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

@Injectable()
@Controller('/api/projects')
export class ProjectController {
  constructor(
    private databaseService: DatabaseService,
    private aiService: AIService,
    private notificationService: NotificationService
  ) {}

  @Get('/')
  async getAllProjects(@Query() query: any) {
    try {
      const {
        status,
        priority,
        customerId,
        projectManager,
        startDate,
        endDate,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      let filters: any = {};
      
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (customerId) filters.customerId = customerId;
      if (projectManager) filters.projectManager = projectManager;
      if (startDate || endDate) {
        filters.startDate = {};
        if (startDate) filters.startDate.$gte = new Date(startDate);
        if (endDate) filters.startDate.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      const projects = await this.databaseService.find<Project>('projects', filters, {
        skip,
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
      });

      const total = await this.databaseService.count('projects', filters);

      return {
        success: true,
        data: projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('/:id')
  async getProjectById(@Param('id') id: string) {
    try {
      const project = await this.databaseService.findById<Project>('projects', id);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Get customer details
      const customer = await this.databaseService.findById('customers', project.customerId);
      
      // Get project analytics
      const analytics = await this.calculateProjectAnalytics(project);

      return {
        success: true,
        data: {
          ...project,
          customer,
          analytics
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('/')
  async createProject(@Body() projectData: Partial<Project>) {
    try {
      const requiredFields = ['name', 'customerId', 'startDate', 'expectedEndDate', 'budget'];
      for (const field of requiredFields) {
        if (!projectData[field]) {
          return { success: false, error: `${field} is required` };
        }
      }

      const customer = await this.databaseService.findById('customers', projectData.customerId!);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      const projectNumber = await this.generateProjectNumber();

      const newProject: Project = {
        id: this.generateId(),
        projectNumber,
        name: projectData.name!,
        description: projectData.description || '',
        customerId: projectData.customerId!,
        customerName: customer.companyName,
        status: 'planning',
        priority: projectData.priority || 'medium',
        startDate: new Date(projectData.startDate!),
        expectedEndDate: new Date(projectData.expectedEndDate!),
        budget: projectData.budget!,
        actualCost: 0,
        margin: 0,
        projectManager: projectData.projectManager || 'system',
        address: projectData.address || '',
        notes: projectData.notes,
        materials: [],
        milestones: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const saved = await this.databaseService.create('projects', newProject);

      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async generateProjectNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const projectsThisYear = await this.databaseService.count('projects', {
      projectNumber: { $regex: `^PROJ-${year}` }
    });
    
    const sequence = String(projectsThisYear + 1).padStart(4, '0');
    return `PROJ-${year}-${sequence}`;
  }

  private async calculateProjectAnalytics(project: Project): Promise<any> {
    const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = project.milestones.length;
    const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    return {
      progress,
      budgetUtilization: project.budget > 0 ? (project.actualCost / project.budget) * 100 : 0,
      daysRemaining: Math.ceil((project.expectedEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      materialsAllocated: project.materials.reduce((sum, m) => sum + m.allocatedQuantity, 0),
      materialsUsed: project.materials.reduce((sum, m) => sum + m.usedQuantity, 0)
    };
  }

  private generateId(): string {
    return 'proj_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

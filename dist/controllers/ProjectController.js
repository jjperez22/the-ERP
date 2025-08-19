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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const warp_1 = require("@varld/warp");
const DatabaseService_1 = require("../services/DatabaseService");
const AIService_1 = require("../services/AIService");
const NotificationService_1 = require("../services/NotificationService");
let ProjectController = class ProjectController {
    databaseService;
    aiService;
    notificationService;
    constructor(databaseService, aiService, notificationService) {
        this.databaseService = databaseService;
        this.aiService = aiService;
        this.notificationService = notificationService;
    }
    async getAllProjects(query) {
        try {
            const { status, priority, customerId, projectManager, startDate, endDate, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = query;
            let filters = {};
            if (status)
                filters.status = status;
            if (priority)
                filters.priority = priority;
            if (customerId)
                filters.customerId = customerId;
            if (projectManager)
                filters.projectManager = projectManager;
            if (startDate || endDate) {
                filters.startDate = {};
                if (startDate)
                    filters.startDate.$gte = new Date(startDate);
                if (endDate)
                    filters.startDate.$lte = new Date(endDate);
            }
            const skip = (page - 1) * limit;
            const projects = await this.databaseService.find('projects', filters, {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getProjectById(id) {
        try {
            const project = await this.databaseService.findById('projects', id);
            if (!project) {
                return { success: false, error: 'Project not found' };
            }
            const customer = await this.databaseService.findById('customers', project.customerId);
            const analytics = await this.calculateProjectAnalytics(project);
            return {
                success: true,
                data: {
                    ...project,
                    customer,
                    analytics
                }
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async createProject(projectData) {
        try {
            const requiredFields = ['name', 'customerId', 'startDate', 'expectedEndDate', 'budget'];
            for (const field of requiredFields) {
                if (!projectData[field]) {
                    return { success: false, error: `${field} is required` };
                }
            }
            const customer = await this.databaseService.findById('customers', projectData.customerId);
            if (!customer) {
                return { success: false, error: 'Customer not found' };
            }
            const projectNumber = await this.generateProjectNumber();
            const newProject = {
                id: this.generateId(),
                projectNumber,
                name: projectData.name,
                description: projectData.description || '',
                customerId: projectData.customerId,
                customerName: customer.companyName,
                status: 'planning',
                priority: projectData.priority || 'medium',
                startDate: new Date(projectData.startDate),
                expectedEndDate: new Date(projectData.expectedEndDate),
                budget: projectData.budget,
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async generateProjectNumber() {
        const year = new Date().getFullYear();
        const projectsThisYear = await this.databaseService.count('projects', {
            projectNumber: { $regex: `^PROJ-${year}` }
        });
        const sequence = String(projectsThisYear + 1).padStart(4, '0');
        return `PROJ-${year}-${sequence}`;
    }
    async calculateProjectAnalytics(project) {
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
    generateId() {
        return 'proj_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
};
exports.ProjectController = ProjectController;
__decorate([
    (0, warp_1.Get)('/'),
    __param(0, (0, warp_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getAllProjects", null);
__decorate([
    (0, warp_1.Get)('/:id'),
    __param(0, (0, warp_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProjectById", null);
__decorate([
    (0, warp_1.Post)('/'),
    __param(0, (0, warp_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "createProject", null);
exports.ProjectController = ProjectController = __decorate([
    (0, warp_1.Injectable)(),
    (0, warp_1.Controller)('/api/projects'),
    __metadata("design:paramtypes", [DatabaseService_1.DatabaseService,
        AIService_1.AIService,
        NotificationService_1.NotificationService])
], ProjectController);
//# sourceMappingURL=ProjectController.js.map
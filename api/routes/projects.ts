import express, { Request, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Project interface
interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  budget: number;
  startDate: Date;
  endDate?: Date;
  managerId: string;
  clientName: string;
  location: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock project data
let projects: Project[] = [
  {
    id: '1',
    name: 'Downtown Office Complex',
    description: 'Construction of a 20-story office building in the downtown area',
    status: 'in-progress',
    budget: 5000000,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-30'),
    managerId: '2',
    clientName: 'Metro Development Corp',
    location: '123 Main St, Downtown',
    isActive: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Residential Housing Project',
    description: 'Construction of 50 residential units in suburban area',
    status: 'planning',
    budget: 3200000,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-10-15'),
    managerId: '2',
    clientName: 'Sunset Homes LLC',
    location: '456 Oak Avenue, Suburbs',
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - status
 *         - budget
 *         - startDate
 *         - managerId
 *         - clientName
 *         - location
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated project ID
 *         name:
 *           type: string
 *           description: Project name
 *         description:
 *           type: string
 *           description: Project description
 *         status:
 *           type: string
 *           enum: [planning, in-progress, completed, on-hold, cancelled]
 *           description: Project status
 *         budget:
 *           type: number
 *           description: Project budget
 *         startDate:
 *           type: string
 *           format: date
 *           description: Project start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Project end date
 *         managerId:
 *           type: string
 *           description: Project manager ID
 *         clientName:
 *           type: string
 *           description: Client name
 *         location:
 *           type: string
 *           description: Project location
 *         isActive:
 *           type: boolean
 *           description: Whether project is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProjectInput:
 *       type: object
 *       required:
 *         - name
 *         - status
 *         - budget
 *         - startDate
 *         - managerId
 *         - clientName
 *         - location
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [planning, in-progress, completed, on-hold, cancelled]
 *         budget:
 *           type: number
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         managerId:
 *           type: string
 *         clientName:
 *           type: string
 *         location:
 *           type: string
 *         isActive:
 *           type: boolean
 *           default: true
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, in-progress, completed, on-hold, cancelled]
 *         description: Filter by project status
 *       - in: query
 *         name: managerId
 *         schema:
 *           type: string
 *         description: Filter by manager ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 */
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, managerId, page = '1', limit = '10' } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    let filteredProjects = projects;
    
    // Apply role-based filtering
    if (userRole === 'manager') {
      // Managers can only see their own projects
      filteredProjects = filteredProjects.filter(p => p.managerId === userId);
    }
    // Admins can see all projects, users can see all active projects
    
    // Apply status filter
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    
    // Apply manager filter
    if (managerId && userRole === 'admin') {
      filteredProjects = filteredProjects.filter(p => p.managerId === managerId);
    }
    
    // Apply pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedProjects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredProjects.length,
        totalPages: Math.ceil(filteredProjects.length / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      code: 'PROJECTS_FETCH_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Project not found
 *       401:
 *         description: Authentication required
 */
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    // Check permissions
    if (userRole === 'manager' && project.managerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - you can only view your own projects',
        code: 'ACCESS_DENIED'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
      code: 'PROJECT_FETCH_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Authentication required
 */
router.post('/', authenticateToken, requireRole(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      status,
      budget,
      startDate,
      endDate,
      managerId,
      clientName,
      location,
      isActive = true
    } = req.body;
    
    // Basic validation
    if (!name || !status || !budget || !startDate || !managerId || !clientName || !location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, status, budget, startDate, managerId, clientName, location',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Validate status
    const validStatuses = ['planning', 'in-progress', 'completed', 'on-hold', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      });
    }
    
    // Validate budget
    if (isNaN(budget) || budget <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Budget must be a positive number',
        code: 'INVALID_BUDGET'
      });
    }
    
    const newProject: Project = {
      id: (projects.length + 1).toString(),
      name,
      description,
      status,
      budget: parseFloat(budget),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      managerId,
      clientName,
      location,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    projects.push(newProject);
    
    res.status(201).json({
      success: true,
      data: newProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      code: 'PROJECT_CREATE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Project not found
 *       401:
 *         description: Authentication required
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    // Check permissions
    if (userRole === 'manager' && projects[projectIndex].managerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - you can only update your own projects',
        code: 'ACCESS_DENIED'
      });
    }
    
    const {
      name,
      description,
      status,
      budget,
      startDate,
      endDate,
      managerId,
      clientName,
      location,
      isActive
    } = req.body;
    
    // Validate status if provided
    if (status) {
      const validStatuses = ['planning', 'in-progress', 'completed', 'on-hold', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        });
      }
    }
    
    // Update project
    const updatedProject: Project = {
      ...projects[projectIndex],
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(budget && { budget: parseFloat(budget) }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : undefined }),
      ...(managerId && { managerId }),
      ...(clientName && { clientName }),
      ...(location && { location }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date()
    };
    
    projects[projectIndex] = updatedProject;
    
    res.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
      code: 'PROJECT_UPDATE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       401:
 *         description: Authentication required
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    const deletedProject = projects.splice(projectIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Project deleted successfully',
      data: { id: deletedProject.id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
      code: 'PROJECT_DELETE_ERROR'
    });
  }
});

export default router;

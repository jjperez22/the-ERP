import express, { Request, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Product interface
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  sku: string;
  stockQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for demonstration
let products: Product[] = [
  {
    id: '1',
    name: 'Premium Steel Beam',
    description: 'High-quality steel beam for construction',
    price: 299.99,
    category: 'Materials',
    sku: 'SB-001',
    stockQuantity: 50,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Concrete Mix Pro',
    description: 'Professional grade concrete mix',
    price: 45.50,
    category: 'Materials',
    sku: 'CM-002',
    stockQuantity: 200,
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *         - sku
 *         - stockQuantity
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated product ID
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         price:
 *           type: number
 *           description: Product price
 *         category:
 *           type: string
 *           description: Product category
 *         sku:
 *           type: string
 *           description: Stock keeping unit
 *         stockQuantity:
 *           type: integer
 *           description: Available stock quantity
 *         isActive:
 *           type: boolean
 *           description: Whether product is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *         - sku
 *         - stockQuantity
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         category:
 *           type: string
 *         sku:
 *           type: string
 *         stockQuantity:
 *           type: integer
 *         isActive:
 *           type: boolean
 *           default: true
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Product'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *         error:
 *           type: string
 *         code:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, active, page = '1', limit = '10' } = req.query;
    
    let filteredProducts = products;
    
    // Apply filters
    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase().includes((category as string).toLowerCase())
      );
    }
    
    if (active !== undefined) {
      const isActive = active === 'true';
      filteredProducts = filteredProducts.filter(p => p.isActive === isActive);
    }
    
    // Apply pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      code: 'PRODUCTS_FETCH_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Product not found
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      code: 'PRODUCT_FETCH_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully
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
    const { name, description, price, category, sku, stockQuantity, isActive = true } = req.body;
    
    // Basic validation
    if (!name || !price || !category || !sku || stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, price, category, sku, stockQuantity',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Check if SKU already exists
    if (products.some(p => p.sku === sku)) {
      return res.status(400).json({
        success: false,
        error: 'Product with this SKU already exists',
        code: 'SKU_DUPLICATE'
      });
    }
    
    const newProduct: Product = {
      id: (products.length + 1).toString(),
      name,
      description,
      price: parseFloat(price),
      category,
      sku,
      stockQuantity: parseInt(stockQuantity, 10),
      isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    products.push(newProduct);
    
    res.status(201).json({
      success: true,
      data: newProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      code: 'PRODUCT_CREATE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Product not found
 *       401:
 *         description: Authentication required
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, sku, stockQuantity, isActive } = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    // Check if SKU is being changed and already exists
    if (sku && sku !== products[productIndex].sku && products.some(p => p.sku === sku)) {
      return res.status(400).json({
        success: false,
        error: 'Product with this SKU already exists',
        code: 'SKU_DUPLICATE'
      });
    }
    
    // Update product
    const updatedProduct: Product = {
      ...products[productIndex],
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(category && { category }),
      ...(sku && { sku }),
      ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity, 10) }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date()
    };
    
    products[productIndex] = updatedProduct;
    
    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      code: 'PRODUCT_UPDATE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Authentication required
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    const deletedProduct = products.splice(productIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: { id: deletedProduct.id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      code: 'PRODUCT_DELETE_ERROR'
    });
  }
});

export default router;

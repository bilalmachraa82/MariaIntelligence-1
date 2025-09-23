/**
 * Properties Routes v1 - MariaIntelligence 2025
 * Modern property management endpoints with OpenAPI documentation
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { asyncHandler } from '../../utils/response.utils.js';
import { sendSuccessResponse, sendNotFoundResponse, sendPaginatedResponse } from '../../utils/response.utils.js';
import { storage } from '../../storage.js';
import { insertPropertySchema } from '@shared/schema';
import type { ValidatedRequest, ListQuery } from '../../types/api.types.js';

const router = Router();

// Validation schemas
const propertyParamsSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

const propertyQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('10'),
  search: z.string().optional(),
  active: z.string().transform(val => val === 'true').optional(),
  ownerId: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
});

/**
 * @swagger
 * /api/v1/properties:
 *   get:
 *     summary: Get all properties
 *     description: Retrieve a paginated list of properties with optional filtering
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for property name
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: integer
 *         description: Filter by owner ID
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: number }
 *                         limit: { type: number }
 *                         total: { type: number }
 *                         totalPages: { type: number }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', 
  validateRequest({ query: propertyQuerySchema }),
  asyncHandler(async (req: ValidatedRequest<any>, res) => {
    const query = req.validatedQuery as {
      page: number;
      limit: number;
      search?: string;
      active?: boolean;
      ownerId?: number;
    };
    
    let properties = await storage.getProperties();
    
    // Apply filters
    if (query.search) {
      properties = properties.filter(p => 
        p.name.toLowerCase().includes(query.search!.toLowerCase())
      );
    }
    
    if (query.active !== undefined) {
      properties = properties.filter(p => p.active === query.active);
    }
    
    if (query.ownerId) {
      properties = properties.filter(p => p.ownerId === query.ownerId);
    }
    
    // Pagination
    const total = properties.length;
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedProperties = properties.slice(startIndex, endIndex);
    
    return sendPaginatedResponse(
      res,
      paginatedProperties,
      {
        page: query.page,
        limit: query.limit,
        total,
      },
      'Properties retrieved successfully'
    );
  })
);

/**
 * @swagger
 * /api/v1/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     description: Retrieve a specific property by its ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id',
  validateRequest({ params: propertyParamsSchema }),
  asyncHandler(async (req: ValidatedRequest<any>, res) => {
    const { id } = req.validatedParams as { id: number };
    
    const property = await storage.getProperty(id);
    
    if (!property) {
      return sendNotFoundResponse(res, 'Property', id);
    }
    
    return sendSuccessResponse(res, property, 'Property retrieved successfully');
  })
);

/**
 * @swagger
 * /api/v1/properties:
 *   post:
 *     summary: Create a new property
 *     description: Create a new property with the provided data
 *     tags: [Properties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ownerId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Apartamento Graça"
 *               ownerId:
 *                 type: integer
 *                 example: 1
 *               cleaningCost:
 *                 type: string
 *                 example: "50.00"
 *               checkInFee:
 *                 type: string
 *                 example: "25.00"
 *               commission:
 *                 type: string
 *                 example: "15.00"
 *               teamPayment:
 *                 type: string
 *                 example: "30.00"
 *               active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/',
  validateRequest({ body: insertPropertySchema }),
  asyncHandler(async (req: ValidatedRequest<any>, res) => {
    const propertyData = req.validatedBody;
    
    const property = await storage.createProperty(propertyData);
    
    return sendSuccessResponse(
      res, 
      property, 
      'Property created successfully', 
      201
    );
  })
);

/**
 * @swagger
 * /api/v1/properties/{id}:
 *   patch:
 *     summary: Update property
 *     description: Update an existing property with partial data
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cleaningCost:
 *                 type: string
 *               checkInFee:
 *                 type: string
 *               commission:
 *                 type: string
 *               teamPayment:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:id',
  validateRequest({ 
    params: propertyParamsSchema,
    body: insertPropertySchema.partial()
  }),
  asyncHandler(async (req: ValidatedRequest<any>, res) => {
    const { id } = req.validatedParams as { id: number };
    const updateData = req.validatedBody;
    
    const existingProperty = await storage.getProperty(id);
    if (!existingProperty) {
      return sendNotFoundResponse(res, 'Property', id);
    }
    
    const updatedProperty = await storage.updateProperty(id, updateData);
    
    return sendSuccessResponse(
      res, 
      updatedProperty, 
      'Property updated successfully'
    );
  })
);

/**
 * @swagger
 * /api/v1/properties/{id}:
 *   delete:
 *     summary: Delete property
 *     description: Delete a property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Property ID
 *     responses:
 *       204:
 *         description: Property deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id',
  validateRequest({ params: propertyParamsSchema }),
  asyncHandler(async (req: ValidatedRequest<any>, res) => {
    const { id } = req.validatedParams as { id: number };
    
    const result = await storage.deleteProperty(id);
    
    if (!result) {
      return sendNotFoundResponse(res, 'Property', id);
    }
    
    res.status(204).end();
  })
);

export { router as propertiesRoutes };
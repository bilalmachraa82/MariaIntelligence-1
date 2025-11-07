/**
 * Owners API Routes - v1
 * Manage property owners
 */

import { Router, Request, Response } from 'express';
import { db } from '../../db/index.js';
import { owners, insertOwnerSchema } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @route GET /api/v1/owners
 * @desc Get all owners
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const allOwners = await db.select().from(owners);
    res.json({ success: true, data: allOwners });
  } catch (error) {
    console.error('Error fetching owners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owners',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route GET /api/v1/owners/:id
 * @desc Get owner by ID with properties
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const ownerId = parseInt(req.params.id);

    const owner = await db.query.owners.findFirst({
      where: eq(owners.id, ownerId),
      with: {
        properties: true
      }
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    res.json({ success: true, data: owner });
  } catch (error) {
    console.error('Error fetching owner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route POST /api/v1/owners
 * @desc Create new owner
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = insertOwnerSchema.parse(req.body);

    const [newOwner] = await db.insert(owners)
      .values(validated)
      .returning();

    res.status(201).json({
      success: true,
      data: newOwner,
      message: 'Owner created successfully'
    });
  } catch (error) {
    console.error('Error creating owner:', error);

    if ((error as any).name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: (error as any).errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create owner',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route PATCH /api/v1/owners/:id
 * @desc Update owner
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const ownerId = parseInt(req.params.id);
    const validated = insertOwnerSchema.partial().parse(req.body);

    const [updatedOwner] = await db.update(owners)
      .set(validated)
      .where(eq(owners.id, ownerId))
      .returning();

    if (!updatedOwner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    res.json({
      success: true,
      data: updatedOwner,
      message: 'Owner updated successfully'
    });
  } catch (error) {
    console.error('Error updating owner:', error);

    if ((error as any).name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: (error as any).errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update owner',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route DELETE /api/v1/owners/:id
 * @desc Delete owner
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ownerId = parseInt(req.params.id);

    // Check if owner has properties
    const ownerWithProps = await db.query.owners.findFirst({
      where: eq(owners.id, ownerId),
      with: { properties: true }
    });

    if (!ownerWithProps) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    if (ownerWithProps.properties && ownerWithProps.properties.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete owner with ${ownerWithProps.properties.length} associated properties`
      });
    }

    await db.delete(owners).where(eq(owners.id, ownerId));

    res.json({
      success: true,
      message: 'Owner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting owner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete owner',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;

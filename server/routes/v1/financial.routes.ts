/**
 * Financial Documents API Routes - v1
 * Manage invoices, receipts, and financial records
 */

import { Router, Request, Response } from 'express';
import { db } from '../../db/index.js';
import { financialDocuments, insertFinancialDocumentSchema } from '../../../shared/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const router = Router();

/**
 * @route GET /api/v1/financial
 * @desc Get all financial documents with optional filters
 * @query {string} type - Filter by document type (invoice, receipt, expense)
 * @query {string} startDate - Filter by start date
 * @query {string} endDate - Filter by end date
 * @query {number} propertyId - Filter by property
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, startDate, endDate, propertyId } = req.query;

    let query = db.select().from(financialDocuments);
    const conditions = [];

    if (type) {
      conditions.push(eq(financialDocuments.type, type as string));
    }

    if (propertyId) {
      conditions.push(eq(financialDocuments.propertyId, parseInt(propertyId as string)));
    }

    if (startDate) {
      conditions.push(gte(financialDocuments.date, new Date(startDate as string)));
    }

    if (endDate) {
      conditions.push(lte(financialDocuments.date, new Date(endDate as string)));
    }

    const documents = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(financialDocuments.date))
      : await query.orderBy(desc(financialDocuments.date));

    // Calculate totals
    const totals = documents.reduce((acc, doc) => {
      const amount = parseFloat(doc.amount || '0');
      if (doc.type === 'invoice') acc.invoices += amount;
      if (doc.type === 'expense') acc.expenses += amount;
      if (doc.type === 'receipt') acc.receipts += amount;
      acc.total += amount;
      return acc;
    }, { invoices: 0, expenses: 0, receipts: 0, total: 0 });

    res.json({
      success: true,
      data: documents,
      meta: {
        count: documents.length,
        totals
      }
    });
  } catch (error) {
    console.error('Error fetching financial documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial documents',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route GET /api/v1/financial/summary
 * @desc Get financial summary by month/year
 * @query {number} year - Year for summary
 * @query {number} month - Month for summary (optional)
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year parameter is required'
      });
    }

    const startDate = month
      ? new Date(parseInt(year as string), parseInt(month as string) - 1, 1)
      : new Date(parseInt(year as string), 0, 1);

    const endDate = month
      ? new Date(parseInt(year as string), parseInt(month as string), 0)
      : new Date(parseInt(year as string), 11, 31);

    const documents = await db.select()
      .from(financialDocuments)
      .where(
        and(
          gte(financialDocuments.date, startDate),
          lte(financialDocuments.date, endDate)
        )
      );

    const summary = {
      period: {
        year: parseInt(year as string),
        month: month ? parseInt(month as string) : null,
        startDate,
        endDate
      },
      totals: {
        invoices: 0,
        expenses: 0,
        receipts: 0,
        netIncome: 0
      },
      byType: {} as Record<string, number>,
      byMonth: {} as Record<string, number>
    };

    documents.forEach(doc => {
      const amount = parseFloat(doc.amount || '0');
      const month = doc.date.getMonth() + 1;

      if (doc.type === 'invoice') summary.totals.invoices += amount;
      if (doc.type === 'expense') summary.totals.expenses += amount;
      if (doc.type === 'receipt') summary.totals.receipts += amount;

      summary.byType[doc.type] = (summary.byType[doc.type] || 0) + amount;
      summary.byMonth[month] = (summary.byMonth[month] || 0) + amount;
    });

    summary.totals.netIncome = summary.totals.invoices + summary.totals.receipts - summary.totals.expenses;

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating financial summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial summary',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route GET /api/v1/financial/:id
 * @desc Get financial document by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id);

    const document = await db.query.financialDocuments.findFirst({
      where: eq(financialDocuments.id, docId),
      with: {
        property: true
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Financial document not found'
      });
    }

    res.json({ success: true, data: document });
  } catch (error) {
    console.error('Error fetching financial document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial document',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route POST /api/v1/financial
 * @desc Create new financial document
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = insertFinancialDocumentSchema.parse(req.body);

    const [newDocument] = await db.insert(financialDocuments)
      .values(validated)
      .returning();

    res.status(201).json({
      success: true,
      data: newDocument,
      message: 'Financial document created successfully'
    });
  } catch (error) {
    console.error('Error creating financial document:', error);

    if ((error as any).name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: (error as any).errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create financial document',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route PATCH /api/v1/financial/:id
 * @desc Update financial document
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id);
    const validated = insertFinancialDocumentSchema.partial().parse(req.body);

    const [updatedDocument] = await db.update(financialDocuments)
      .set(validated)
      .where(eq(financialDocuments.id, docId))
      .returning();

    if (!updatedDocument) {
      return res.status(404).json({
        success: false,
        message: 'Financial document not found'
      });
    }

    res.json({
      success: true,
      data: updatedDocument,
      message: 'Financial document updated successfully'
    });
  } catch (error) {
    console.error('Error updating financial document:', error);

    if ((error as any).name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: (error as any).errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update financial document',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @route DELETE /api/v1/financial/:id
 * @desc Delete financial document
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id);

    const [deleted] = await db.delete(financialDocuments)
      .where(eq(financialDocuments.id, docId))
      .returning();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Financial document not found'
      });
    }

    res.json({
      success: true,
      message: 'Financial document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting financial document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete financial document',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;

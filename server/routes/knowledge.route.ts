import { Router } from 'express';
import { Pool } from 'pg';
import RAGKnowledgeService from '../services/rag-knowledge.service.js';
import DocumentProcessor from '../utils/document-processor.utils.js';
import { body, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for knowledge API
const knowledgeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many knowledge requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize services
let ragService: RAGKnowledgeService;
let documentProcessor: DocumentProcessor;

export const initializeKnowledgeRoutes = (pool: Pool) => {
  ragService = new RAGKnowledgeService(pool);
  documentProcessor = new DocumentProcessor(pool);
  
  // Initialize knowledge domains on startup
  ragService.initializeKnowledgeDomains().catch(console.error);
};

// Apply rate limiting to all routes
router.use(knowledgeRateLimit);

/**
 * @route POST /api/knowledge/query
 * @desc Query the RAG knowledge base
 * @access Private
 */
router.post('/query',
  [
    body('query')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Query must be between 1 and 500 characters'),
    body('domain')
      .optional()
      .isIn(['property', 'cleaning', 'maintenance', 'local_services', 'guest_management', 'general'])
      .withMessage('Invalid domain'),
    body('maxTokens')
      .optional()
      .isInt({ min: 100, max: 4000 })
      .withMessage('Max tokens must be between 100 and 4000')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { query, domain, maxTokens } = req.body;
      
      console.log(`🔍 Knowledge query: "${query}" (domain: ${domain || 'all'})`);
      
      const startTime = Date.now();
      const response = await ragService.queryKnowledge({
        query,
        domain,
        maxTokens
      });
      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        data: response,
        metadata: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          domain: domain || 'all'
        }
      });
    } catch (error) {
      console.error('❌ Knowledge query error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process knowledge query',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @route GET /api/knowledge/search
 * @desc Search for similar questions/content
 * @access Private
 */
router.get('/search',
  [
    query('q')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Search query must be between 1 and 200 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1 and 20')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const searchQuery = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 5;
      
      const results = await ragService.searchSimilarQuestions(searchQuery, limit);
      
      res.json({
        success: true,
        data: {
          query: searchQuery,
          results,
          total: results.length
        }
      });
    } catch (error) {
      console.error('❌ Knowledge search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search knowledge base'
      });
    }
  }
);

/**
 * @route POST /api/knowledge/add
 * @desc Add custom knowledge to the database
 * @access Private
 */
router.post('/add',
  [
    body('content')
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be between 10 and 5000 characters'),
    body('domain')
      .isIn(['property', 'cleaning', 'maintenance', 'local_services', 'guest_management', 'general'])
      .withMessage('Domain is required and must be valid'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { content, domain, metadata = {} } = req.body;
      
      const knowledgeId = await ragService.addCustomKnowledge(
        content,
        domain,
        {
          ...metadata,
          source: 'manual_entry',
          addedAt: new Date().toISOString(),
          addedBy: req.user?.id || 'system' // Assuming user authentication
        }
      );
      
      res.status(201).json({
        success: true,
        data: {
          knowledgeId,
          domain,
          message: 'Knowledge added successfully'
        }
      });
    } catch (error) {
      console.error('❌ Add knowledge error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add knowledge'
      });
    }
  }
);

/**
 * @route POST /api/knowledge/documents/process
 * @desc Process and add document to knowledge base
 * @access Private
 */
router.post('/documents/process',
  [
    body('type')
      .isIn(['text', 'structured'])
      .withMessage('Document type must be text or structured'),
    body('domain')
      .isIn(['property', 'cleaning', 'maintenance', 'local_services', 'guest_management', 'general'])
      .withMessage('Domain is required and must be valid'),
    body('content')
      .optional()
      .isString()
      .withMessage('Content must be a string'),
    body('data')
      .optional()
      .isObject()
      .withMessage('Data must be an object'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { type, domain, content, data, metadata = {} } = req.body;
      
      let result;
      
      if (type === 'text') {
        if (!content) {
          return res.status(400).json({
            success: false,
            error: 'Content is required for text documents'
          });
        }
        
        result = await documentProcessor.processTextDocument(
          content,
          { ...metadata, source: 'api' },
          domain
        );
      } else if (type === 'structured') {
        if (!data) {
          return res.status(400).json({
            success: false,
            error: 'Data is required for structured documents'
          });
        }
        
        result = await documentProcessor.processStructuredData(
          data,
          { ...metadata, source: 'api' },
          domain
        );
      }
      
      if (result?.success) {
        res.status(201).json({
          success: true,
          data: {
            documentId: result.documentId,
            chunks: result.chunks,
            domain,
            message: 'Document processed and added to knowledge base'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result?.error || 'Failed to process document'
        });
      }
    } catch (error) {
      console.error('❌ Document processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process document'
      });
    }
  }
);

/**
 * @route GET /api/knowledge/stats
 * @desc Get knowledge base statistics
 * @access Private
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await ragService.getKnowledgeStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Knowledge stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get knowledge statistics'
    });
  }
});

/**
 * @route POST /api/knowledge/sync
 * @desc Sync database content to knowledge base
 * @access Private (Admin only)
 */
router.post('/sync', async (req, res) => {
  try {
    console.log('🔄 Starting knowledge base sync...');
    const startTime = Date.now();
    
    await ragService.syncDatabaseToKnowledge();
    
    const syncTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        message: 'Knowledge base sync completed successfully',
        syncTime: `${syncTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Knowledge sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync knowledge base'
    });
  }
});

/**
 * @route GET /api/knowledge/domains
 * @desc Get available knowledge domains
 * @access Private
 */
router.get('/domains', (req, res) => {
  const domains = [
    {
      id: 'property',
      name: 'Informações de Propriedades',
      description: 'Informações sobre localização, comodidades, regras e detalhes das propriedades'
    },
    {
      id: 'cleaning',
      name: 'Procedimentos de Limpeza',
      description: 'Protocolos, produtos aprovados e checklists de limpeza'
    },
    {
      id: 'maintenance',
      name: 'Manutenção',
      description: 'Problemas comuns, soluções e contatos de fornecedores'
    },
    {
      id: 'local_services',
      name: 'Serviços Locais',
      description: 'Restaurantes, transporte, atrações e serviços próximos'
    },
    {
      id: 'guest_management',
      name: 'Gestão de Hóspedes',
      description: 'Processos de check-in, orientações e atendimento aos hóspedes'
    },
    {
      id: 'general',
      name: 'Geral',
      description: 'Conhecimento geral e informações diversas'
    }
  ];
  
  res.json({
    success: true,
    data: { domains }
  });
});

/**
 * @route GET /api/knowledge/health
 * @desc Health check for knowledge service
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await ragService.getKnowledgeStats();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        knowledgeBase: {
          totalEntries: stats.totalEntries,
          domainsActive: Object.keys(stats.domainStats).length,
          lastUpdated: stats.lastUpdated
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: 'Knowledge service unavailable'
      }
    });
  }
});

export default router;
/**
 * MCP API Endpoints
 * Express.js routes for MCP integration functionality
 */

import express from 'express';
import { z } from 'zod';
import { mcpClient } from '../lib/mcp-client';
import { mcpSecurity } from '../lib/mcp-security';
import { mcpDatabase } from '../lib/mcp-database';
import { mcpOrchestrator } from '../lib/mcp-orchestrator';
import { MCPTransformers } from '../lib/mcp-transformers';

const router = express.Router();

// Request validation schemas
const ToolCallRequestSchema = z.object({
  server: z.string(),
  tool: z.string(),
  arguments: z.record(z.any()),
  timeout: z.number().optional()
});

const WorkflowExecutionRequestSchema = z.object({
  workflowId: z.string(),
  context: z.record(z.any()).optional()
});

const SwarmCreationRequestSchema = z.object({
  topology: z.enum(['hierarchical', 'mesh', 'ring', 'star']),
  maxAgents: z.number().min(1).max(20).default(8),
  strategy: z.enum(['parallel', 'sequential', 'adaptive', 'balanced']).default('adaptive'),
  autoScale: z.boolean().default(true)
});

const DatabaseQueryRequestSchema = z.object({
  type: z.enum(['query', 'transaction', 'migration', 'backup']),
  sql: z.string().optional(),
  statements: z.array(z.string()).optional(),
  parameters: z.array(z.any()).optional(),
  options: z.record(z.any()).optional()
});

// Middleware for authentication and rate limiting
const authenticateMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const server = req.headers['x-server'] as string || 'unknown';
  
  if (!apiKey) {
    return res.status(401).json(
      MCPTransformers.Response.error('API key required', 'MISSING_API_KEY')
    );
  }

  if (!mcpSecurity.authenticate(apiKey, server, 'read')) {
    return res.status(403).json(
      MCPTransformers.Response.error('Invalid API key or insufficient permissions', 'INVALID_API_KEY')
    );
  }

  // Rate limiting
  const clientId = req.ip || 'unknown';
  if (!mcpSecurity.checkRateLimit(clientId)) {
    return res.status(429).json(
      MCPTransformers.Response.error('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED')
    );
  }

  // Origin validation
  const origin = req.headers.origin as string;
  if (origin && !mcpSecurity.validateOrigin(origin)) {
    return res.status(403).json(
      MCPTransformers.Response.error('Origin not allowed', 'INVALID_ORIGIN')
    );
  }

  next();
};

// Middleware for input validation and sanitization
const validateInputMiddleware = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      // Sanitize input
      req.body = mcpSecurity.validateInput(req.body);
      
      // Validate against schema
      req.body = schema.parse(req.body);
      
      next();
    } catch (error) {
      res.status(400).json(
        MCPTransformers.Response.error(
          'Invalid request data',
          'VALIDATION_ERROR',
          error instanceof Error ? error.message : 'Unknown validation error'
        )
      );
    }
  };
};

// Middleware for audit logging
const auditLogMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    const success = res.statusCode >= 200 && res.statusCode < 300;
    
    mcpSecurity.logAudit({
      action: 'api_call',
      server: req.headers['x-server'] as string || 'api',
      tool: req.path,
      arguments: req.body,
      success,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Apply middleware to all routes
router.use(authenticateMiddleware);
router.use(auditLogMiddleware);

// Health Check Endpoint
router.get('/health', async (req, res) => {
  try {
    const mcpHealth = await mcpClient.healthCheck();
    const orchestratorHealth = await mcpOrchestrator.healthCheck();
    const databaseHealth = await mcpDatabase.healthCheck();
    
    const overallHealth = Object.values(mcpHealth).every(status => status) && 
                         orchestratorHealth.mcp && 
                         databaseHealth;
    
    res.status(overallHealth ? 200 : 503).json(
      MCPTransformers.Response.success({
        status: overallHealth ? 'healthy' : 'unhealthy',
        services: {
          mcp: mcpHealth,
          orchestrator: orchestratorHealth,
          database: databaseHealth
        }
      })
    );
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Health check failed',
        'HEALTH_CHECK_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

// MCP Tool Call Endpoint
router.post('/tool/call', validateInputMiddleware(ToolCallRequestSchema), async (req, res) => {
  try {
    const toolCall = req.body;
    const response = await mcpClient.callTool(toolCall);
    
    if (response.success) {
      res.json(MCPTransformers.Response.success(response.data, response.metadata));
    } else {
      res.status(500).json(
        MCPTransformers.Response.error(
          response.error || 'Tool call failed',
          'TOOL_CALL_ERROR',
          response.metadata
        )
      );
    }
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Tool call failed',
        'TOOL_CALL_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

// Batch Tool Call Endpoint
router.post('/tool/batch', async (req, res) => {
  try {
    const { calls } = req.body;
    
    if (!Array.isArray(calls)) {
      return res.status(400).json(
        MCPTransformers.Response.error('Calls must be an array', 'INVALID_BATCH_REQUEST')
      );
    }

    // Validate each call
    const validatedCalls = calls.map(call => ToolCallRequestSchema.parse(call));
    
    const responses = await mcpClient.batchCall(validatedCalls);
    
    res.json(MCPTransformers.Response.success({
      total: responses.length,
      successful: responses.filter(r => r.success).length,
      failed: responses.filter(r => !r.success).length,
      results: responses
    }));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Batch call failed',
        'BATCH_CALL_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

// Database Endpoints
router.post('/database/query', validateInputMiddleware(DatabaseQueryRequestSchema), async (req, res) => {
  try {
    const operation = req.body;
    const response = await mcpDatabase.executeQuery(operation);
    
    if (response.success) {
      res.json(MCPTransformers.Response.success(response.data, response.metadata));
    } else {
      res.status(500).json(
        MCPTransformers.Response.error(
          response.error || 'Database query failed',
          'DATABASE_ERROR',
          response.metadata
        )
      );
    }
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Database query failed',
        'DATABASE_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.get('/database/connection-string', async (req, res) => {
  try {
    const connectionString = await mcpDatabase.getConnectionString();
    
    // Mask sensitive parts of connection string
    const maskedConnectionString = connectionString.replace(
      /:([^@]+)@/,
      ':***@'
    );
    
    res.json(MCPTransformers.Response.success({
      connectionString: maskedConnectionString,
      masked: true
    }));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to get connection string',
        'CONNECTION_STRING_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

// Workflow Endpoints
router.post('/workflow/execute', validateInputMiddleware(WorkflowExecutionRequestSchema), async (req, res) => {
  try {
    const { workflowId, context } = req.body;
    const executionId = await mcpOrchestrator.executeWorkflow(workflowId, context);
    
    res.json(MCPTransformers.Response.success({
      executionId,
      status: 'started',
      workflowId
    }));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Workflow execution failed',
        'WORKFLOW_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.get('/workflow/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = mcpOrchestrator.getWorkflowExecution(executionId);
    
    if (!execution) {
      return res.status(404).json(
        MCPTransformers.Response.error('Execution not found', 'EXECUTION_NOT_FOUND')
      );
    }
    
    res.json(MCPTransformers.Response.success(execution));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to get execution status',
        'EXECUTION_STATUS_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.get('/workflow/executions', async (req, res) => {
  try {
    const { workflowId } = req.query;
    const executions = mcpOrchestrator.listWorkflowExecutions(workflowId as string);
    
    res.json(MCPTransformers.Response.success(executions));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to list executions',
        'LIST_EXECUTIONS_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.delete('/workflow/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const cancelled = mcpOrchestrator.cancelWorkflowExecution(executionId);
    
    if (!cancelled) {
      return res.status(404).json(
        MCPTransformers.Response.error('Execution not found or cannot be cancelled', 'CANCELLATION_FAILED')
      );
    }
    
    res.json(MCPTransformers.Response.success({ cancelled: true }));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to cancel execution',
        'CANCELLATION_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

// Swarm Endpoints
router.post('/swarm/create', validateInputMiddleware(SwarmCreationRequestSchema), async (req, res) => {
  try {
    const config = req.body;
    const swarmId = await mcpOrchestrator.createSwarm(config);
    
    res.json(MCPTransformers.Response.success({
      swarmId,
      status: 'created',
      config
    }));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Swarm creation failed',
        'SWARM_CREATION_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.get('/swarm/:swarmId/status', async (req, res) => {
  try {
    const { swarmId } = req.params;
    const status = await mcpOrchestrator.getSwarmStatus(swarmId);
    
    if (!status) {
      return res.status(404).json(
        MCPTransformers.Response.error('Swarm not found', 'SWARM_NOT_FOUND')
      );
    }
    
    res.json(MCPTransformers.Response.success(status));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to get swarm status',
        'SWARM_STATUS_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.post('/swarm/:swarmId/task', async (req, res) => {
  try {
    const { swarmId } = req.params;
    const { task, context } = req.body;
    
    if (!task) {
      return res.status(400).json(
        MCPTransformers.Response.error('Task description required', 'MISSING_TASK')
      );
    }
    
    const taskId = await mcpOrchestrator.orchestrateSwarmTask(swarmId, task, context);
    
    res.json(MCPTransformers.Response.success({
      taskId,
      swarmId,
      status: 'started'
    }));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Task orchestration failed',
        'TASK_ORCHESTRATION_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.get('/swarms', async (req, res) => {
  try {
    const swarms = mcpOrchestrator.listActiveSwarms();
    res.json(MCPTransformers.Response.success(swarms));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to list swarms',
        'LIST_SWARMS_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.delete('/swarm/:swarmId', async (req, res) => {
  try {
    const { swarmId } = req.params;
    const destroyed = await mcpOrchestrator.destroySwarm(swarmId);
    
    if (!destroyed) {
      return res.status(404).json(
        MCPTransformers.Response.error('Swarm not found or cannot be destroyed', 'SWARM_DESTRUCTION_FAILED')
      );
    }
    
    res.json(MCPTransformers.Response.success({ destroyed: true }));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to destroy swarm',
        'SWARM_DESTRUCTION_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

// Security and Monitoring Endpoints
router.get('/security/audit-logs', async (req, res) => {
  try {
    const {
      server,
      action,
      success,
      userId,
      limit = 100
    } = req.query;
    
    const filters: any = {};
    if (server) filters.server = server as string;
    if (action) filters.action = action as string;
    if (success !== undefined) filters.success = success === 'true';
    if (userId) filters.userId = userId as string;
    if (limit) filters.limit = parseInt(limit as string);
    
    const logs = mcpSecurity.getAuditLogs(filters);
    
    res.json(MCPTransformers.Response.success(logs));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to get audit logs',
        'AUDIT_LOGS_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.get('/security/config', async (req, res) => {
  try {
    const config = mcpSecurity.getConfig();
    res.json(MCPTransformers.Response.success(config));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to get security config',
        'SECURITY_CONFIG_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

router.get('/stats', async (req, res) => {
  try {
    const orchestratorStats = mcpOrchestrator.getStats();
    const mcpServers = mcpClient.listServers();
    
    const stats = {
      orchestrator: orchestratorStats,
      servers: mcpServers,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    res.json(MCPTransformers.Response.success(stats));
  } catch (error) {
    res.status(500).json(
      MCPTransformers.Response.error(
        'Failed to get stats',
        'STATS_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
  }
});

// Error handling middleware
router.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('MCP API Error:', error);
  
  res.status(500).json(
    MCPTransformers.Response.error(
      'Internal server error',
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    )
  );
});

export default router;
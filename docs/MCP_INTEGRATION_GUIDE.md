# MCP Integration Guide for MariaFaz

## 🌟 Overview

This comprehensive guide covers the Model Context Protocol (MCP) integration for the MariaFaz property management system. The integration provides seamless connectivity between multiple services including Neon Database, Railway deployment platform, and Claude Flow AI orchestration.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Installation & Setup](#installation--setup)
3. [Core Components](#core-components)
4. [API Reference](#api-reference)
5. [Workflows & Orchestration](#workflows--orchestration)
6. [Security & Authentication](#security--authentication)
7. [Data Transformations](#data-transformations)
8. [Error Handling](#error-handling)
9. [Monitoring & Logging](#monitoring--logging)
10. [Examples & Use Cases](#examples--use-cases)
11. [Troubleshooting](#troubleshooting)
12. [Performance Optimization](#performance-optimization)

## 🏗️ Architecture Overview

### System Architecture

```mermaid
graph TB
    A[MariaFaz App] --> B[MCP Client]
    B --> C[MCP Orchestrator]
    C --> D[Neon Database]
    C --> E[Railway Platform]
    C --> F[Claude Flow AI]
    C --> G[Ruv Swarm]
    
    B --> H[Security Layer]
    H --> I[Authentication]
    H --> J[Rate Limiting]
    H --> K[Audit Logging]
    
    B --> L[Data Transformers]
    L --> M[Property Data]
    L --> N[Reservation Data]
    L --> O[OCR Results]
```

### Key Components

- **MCP Client**: Universal interface for all MCP server interactions
- **Security Manager**: Authentication, rate limiting, and audit logging
- **Database Manager**: Specialized Neon PostgreSQL operations
- **Orchestrator**: Advanced workflow and swarm coordination
- **Transformers**: Data format conversion and validation utilities

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+ with TypeScript support
- PostgreSQL database (Neon recommended)
- Environment variables configured
- MCP server credentials

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
NEON_PROJECT_ID=your-neon-project-id
NEON_API_KEY=your-neon-api-key
NEON_BRANCH_ID=your-branch-id

# Railway Configuration
RAILWAY_TOKEN=your-railway-token

# AI Services
CLAUDE_FLOW_KEY=your-claude-flow-key
RUV_SWARM_KEY=your-ruv-swarm-key

# Security
MCP_ENCRYPTION_KEY=your-32-character-encryption-key
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Optional
NODE_ENV=development
```

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up MCP Servers**
   ```bash
   # Claude Flow MCP (if not already configured)
   npm install -g claude-flow@alpha
   
   # Verify MCP tools are available
   npx claude-flow version
   ```

3. **Initialize Database**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Or using the MCP interface
   curl -X POST http://localhost:3000/api/mcp/database/query \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -d '{"type": "migration"}'
   ```

4. **Verify Installation**
   ```bash
   # Test MCP health
   curl http://localhost:3000/api/mcp/health
   ```

## 🧩 Core Components

### MCP Client (`src/lib/mcp-client.ts`)

The universal interface for all MCP server interactions with built-in retry logic, rate limiting, and error handling.

```typescript
import { mcpClient } from '../lib/mcp-client';

// Single tool call
const response = await mcpClient.callTool({
  server: 'neon',
  tool: 'run_sql',
  arguments: {
    projectId: 'your-project-id',
    sql: 'SELECT * FROM properties'
  }
});

// Batch tool calls
const responses = await mcpClient.batchCall([
  { server: 'neon', tool: 'list_projects', arguments: {} },
  { server: 'railway', tool: 'project_list', arguments: {} }
]);

// Health check
const health = await mcpClient.healthCheck();
```

### Security Manager (`src/lib/mcp-security.ts`)

Comprehensive security layer with authentication, encryption, and audit logging.

```typescript
import { mcpSecurity } from '../lib/mcp-security';

// Authenticate API key
const isValid = mcpSecurity.authenticate(apiKey, 'neon', 'read');

// Check rate limit
const allowed = mcpSecurity.checkRateLimit(clientId);

// Encrypt sensitive data
const encrypted = mcpSecurity.encryptSensitiveData('sensitive-info');

// Log audit event
mcpSecurity.logAudit({
  action: 'database_query',
  server: 'neon',
  tool: 'run_sql',
  arguments: queryArgs,
  success: true
});
```

### Database Manager (`src/lib/mcp-database.ts`)

Specialized Neon database operations with query building, migrations, and connection management.

```typescript
import { mcpDatabase } from '../lib/mcp-database';

// Execute query
const result = await mcpDatabase.executeQuery({
  type: 'query',
  sql: 'SELECT * FROM properties WHERE owner_id = $1',
  parameters: [ownerId]
});

// Convenience methods
const properties = await mcpDatabase.select('properties', {
  where: { owner_id: 123 },
  orderBy: 'created_at DESC',
  limit: 10
});

const newProperty = await mcpDatabase.insert('properties', {
  name: 'Beach House',
  address: '123 Ocean Drive',
  owner_id: 123
});

// Migration management
const migrationResult = await mcpDatabase.executeQuery({
  type: 'migration'
});
```

### Orchestrator (`src/lib/mcp-orchestrator.ts`)

Advanced workflow orchestration with swarm coordination and task management.

```typescript
import { mcpOrchestrator } from '../lib/mcp-orchestrator';

// Execute predefined workflow
const executionId = await mcpOrchestrator.executeWorkflow('property_management', {
  projectId: 'neon-project-id',
  ownerId: 123
});

// Create and manage swarms
const swarmId = await mcpOrchestrator.createSwarm({
  topology: 'hierarchical',
  maxAgents: 6,
  strategy: 'adaptive'
});

// Orchestrate swarm task
const taskId = await mcpOrchestrator.orchestrateSwarmTask(swarmId, 
  'Analyze property performance and generate recommendations'
);

// Monitor execution
const execution = mcpOrchestrator.getWorkflowExecution(executionId);
```

## 🔌 API Reference

### Base URL
```
http://localhost:3000/api/mcp
```

### Authentication
All API requests require an API key in the header:
```
X-API-Key: your-api-key
X-Server: server-name (optional)
```

### Core Endpoints

#### Health Check
```http
GET /health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "mcp": {
        "neon": true,
        "railway": true,
        "claude-flow": true
      },
      "orchestrator": {
        "workflows": true,
        "swarms": true,
        "mcp": true
      },
      "database": true
    }
  },
  "timestamp": "2025-07-29T18:00:00.000Z"
}
```

#### Tool Call
```http
POST /tool/call
Content-Type: application/json

{
  "server": "neon",
  "tool": "run_sql",
  "arguments": {
    "projectId": "plain-recipe-77049551",
    "sql": "SELECT * FROM properties LIMIT 10"
  },
  "timeout": 10000
}
```

#### Batch Tool Call
```http
POST /tool/batch
Content-Type: application/json

{
  "calls": [
    {
      "server": "neon",
      "tool": "list_projects",
      "arguments": {}
    },
    {
      "server": "railway",
      "tool": "project_list",
      "arguments": {}
    }
  ]
}
```

#### Database Query
```http
POST /database/query
Content-Type: application/json

{
  "type": "query",
  "sql": "INSERT INTO properties (name, address, owner_id) VALUES ($1, $2, $3) RETURNING *",
  "parameters": ["Beach House", "123 Ocean Drive", 123]
}
```

#### Execute Workflow
```http
POST /workflow/execute
Content-Type: application/json

{
  "workflowId": "property_management",
  "context": {
    "projectId": "plain-recipe-77049551",
    "ownerId": 123,
    "railwayProjectId": "project-id",
    "serviceId": "service-id",
    "environmentId": "env-id"
  }
}
```

#### Create Swarm
```http
POST /swarm/create
Content-Type: application/json

{
  "topology": "hierarchical",
  "maxAgents": 8,
  "strategy": "adaptive",
  "autoScale": true
}
```

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "metadata": { /* optional metadata */ },
  "timestamp": "2025-07-29T18:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { /* optional error details */ }
  },
  "timestamp": "2025-07-29T18:00:00.000Z"
}
```

## ⚡ Workflows & Orchestration

### Predefined Workflows

#### Property Management Workflow

Comprehensive property analysis and reporting:

```typescript
// Execute the workflow
const executionId = await mcpOrchestrator.executeWorkflow('property_management', {
  projectId: 'plain-recipe-77049551',
  ownerId: 123,
  railwayProjectId: 'your-railway-project',
  serviceId: 'your-service-id',
  environmentId: 'production',
  commitSha: 'latest'
});

// Monitor progress
const execution = mcpOrchestrator.getWorkflowExecution(executionId);
console.log(`Status: ${execution.status}`);
console.log(`Completed steps: ${execution.completedSteps.length}`);
```

#### OCR Processing Workflow

Extract and process reservation data from PDF documents:

```typescript
const executionId = await mcpOrchestrator.executeWorkflow('ocr_processing', {
  projectId: 'plain-recipe-77049551',
  pdfFile: '/path/to/reservation.pdf'
});
```

### Custom Workflows

Create custom workflows for specific business needs:

```typescript
mcpOrchestrator.registerWorkflow({
  id: 'custom_revenue_analysis',
  name: 'Custom Revenue Analysis',
  description: 'Analyze revenue trends and generate forecasts',
  steps: [
    {
      id: 'fetch_data',
      name: 'Fetch Revenue Data',
      type: 'task',
      server: 'neon',
      tool: 'run_sql',
      arguments: {
        projectId: '${metadata.projectId}',
        sql: 'SELECT * FROM reservations WHERE created_at >= NOW() - INTERVAL \'90 days\''
      }
    },
    {
      id: 'analyze_trends',
      name: 'Analyze Revenue Trends',
      type: 'task',
      server: 'claude-flow',
      tool: 'task_orchestrate',
      arguments: {
        task: 'Analyze revenue trends and identify patterns',
        data: '${results.fetch_data}'
      },
      dependsOn: ['fetch_data']
    }
  ],
  timeout: 300000,
  maxConcurrency: 2
});
```

### Swarm Coordination

Create specialized AI swarms for complex tasks:

```typescript
// Create swarm with specific topology
const swarmId = await mcpOrchestrator.createSwarm({
  topology: 'mesh',        // hierarchical, mesh, ring, star
  maxAgents: 6,
  strategy: 'parallel',    // parallel, sequential, adaptive, balanced
  autoScale: true
});

// Assign complex task to swarm
const taskId = await mcpOrchestrator.orchestrateSwarmTask(swarmId, 
  `Analyze all properties for owner ${ownerId} and provide:
   1. Performance metrics
   2. Optimization recommendations
   3. Market analysis
   4. Financial projections`
);

// Monitor swarm status
const status = await mcpOrchestrator.getSwarmStatus(swarmId);
```

## 🔒 Security & Authentication

### API Key Management

API keys are managed through the security layer with server-specific permissions:

```typescript
// In production, configure via environment variables
const securityConfig = {
  apiKeys: {
    neon: process.env.NEON_API_KEY,
    railway: process.env.RAILWAY_TOKEN,
    'claude-flow': process.env.CLAUDE_FLOW_KEY
  },
  encryptionKey: process.env.MCP_ENCRYPTION_KEY,
  rateLimit: {
    windowMs: 60000,    // 1 minute
    maxRequests: 100    // 100 requests per minute
  },
  allowedOrigins: ['https://yourdomain.com'],
  requireHttps: true
};
```

### Rate Limiting

Built-in rate limiting prevents abuse:

- **Default Limits**: 100 requests per minute per client IP
- **Server-Specific Limits**: Different limits for different MCP servers
- **Configurable Windows**: Adjustable time windows and request counts

### Encryption

Sensitive data is encrypted using AES-256-GCM:

```typescript
// Encrypt sensitive configuration
const encrypted = mcpSecurity.encryptSensitiveData(JSON.stringify(config));

// Decrypt when needed
const decrypted = mcpSecurity.decryptSensitiveData(encrypted);
```

### Audit Logging

Comprehensive audit trail for all operations:

```typescript
// Automatic logging for all API calls
// Manual logging for custom operations
mcpSecurity.logAudit({
  action: 'custom_operation',
  server: 'custom',
  tool: 'data_export',
  arguments: { type: 'full_backup' },
  success: true,
  userId: 'user123'
});

// Query audit logs
const logs = mcpSecurity.getAuditLogs({
  server: 'neon',
  success: false,
  limit: 50
});
```

## 🔄 Data Transformations

### Property Data

Transform property data between different formats:

```typescript
import { MCPTransformers } from '../lib/mcp-transformers';

// Convert from Neon database format to API format
const apiProperty = MCPTransformers.Property.fromNeonToAPI({
  id: 1,
  name: 'Beach House',
  address: '123 Ocean Drive',
  owner_id: 123,
  created_at: '2025-01-01T00:00:00Z'
});

// Convert API format back to database format
const dbProperty = MCPTransformers.Property.fromAPIToNeon(apiProperty);

// Generate property summary
const summary = MCPTransformers.Property.toSummary(properties);
```

### Reservation Data

Extract reservations from OCR results and transform formats:

```typescript
// Extract reservations from OCR text
const ocrResult = {
  text: 'Nome: João Silva, Check-in: 15/01/2024, Check-out: 20/01/2024',
  confidence: 0.95,
  language: 'pt'
};

const reservations = MCPTransformers.Reservation.fromOCRToAPI(ocrResult, propertyId);

// Convert to calendar format
const calendarEvents = MCPTransformers.Reservation.toCalendarFormat(reservations);

// Calculate occupancy metrics
const occupancy = MCPTransformers.Reservation.calculateOccupancy(reservations, {
  start: '2025-01-01',
  end: '2025-01-31'
});
```

### Batch Transformations

Process large datasets efficiently:

```typescript
// Synchronous batch transformation
const transformedData = MCPTransformers.transformBatch(
  rawData,
  item => MCPTransformers.Property.fromNeonToAPI(item),
  {
    batchSize: 100,
    onProgress: (processed, total) => {
      console.log(`Processed ${processed}/${total} items`);
    }
  }
);

// Asynchronous batch transformation with concurrency control
const transformedDataAsync = await MCPTransformers.transformBatchAsync(
  rawData,
  async item => await processComplexTransformation(item),
  {
    batchSize: 50,
    concurrency: 5,
    onProgress: (processed, total) => {
      console.log(`Processed ${processed}/${total} items`);
    }
  }
);
```

### Data Aggregation

Aggregate data with various metrics:

```typescript
// Aggregate reservations by property
const aggregated = MCPTransformers.aggregateData(
  reservations,
  'property_id',
  {
    count: true,
    sum: ['nights', 'revenue'],
    avg: ['revenue'],
    min: ['check_in'],
    max: ['check_out']
  }
);
```

## ❌ Error Handling

### Built-in Error Handling

The MCP integration includes comprehensive error handling:

```typescript
// Automatic retry with exponential backoff
const response = await mcpClient.callTool({
  server: 'neon',
  tool: 'run_sql',
  arguments: { /* ... */ }
});

if (!response.success) {
  console.error('Operation failed:', response.error);
  console.log('Retry attempts:', response.metadata.retries);
}
```

### Custom Error Handling

Handle specific error scenarios:

```typescript
try {
  const result = await mcpDatabase.executeQuery(operation);
} catch (error) {
  if (error.message.includes('connection timeout')) {
    // Handle timeout specifically
    await handleConnectionTimeout();
  } else if (error.message.includes('rate limit')) {
    // Handle rate limiting
    await waitAndRetry();
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

### Circuit Breaker Pattern

Prevent cascading failures:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async callWithBreaker<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailTime) < this.timeout;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
  }
}
```

## 📊 Monitoring & Logging

### Health Monitoring

Monitor system health across all components:

```bash
# Check overall health
curl http://localhost:3000/api/mcp/health

# Check specific component health
curl http://localhost:3000/api/mcp/stats
```

### Audit Logs

Access comprehensive audit trails:

```bash
# Get recent audit logs
curl -H "X-API-Key: your-key" \
  "http://localhost:3000/api/mcp/security/audit-logs?limit=100"

# Filter by server
curl -H "X-API-Key: your-key" \
  "http://localhost:3000/api/mcp/security/audit-logs?server=neon&success=false"
```

### Performance Metrics

Track performance across all operations:

```typescript
// Built-in performance tracking
const response = await mcpClient.callTool(toolCall);
console.log(`Operation took ${response.metadata.duration}ms`);

// Custom performance tracking
const startTime = Date.now();
await performOperation();
const duration = Date.now() - startTime;
console.log(`Custom operation took ${duration}ms`);
```

### Real-time Monitoring

Set up real-time monitoring with webhooks:

```typescript
// Configure webhook notifications
const webhookConfig = {
  url: 'https://your-webhook-endpoint.com/alerts',
  events: ['error', 'timeout', 'rate_limit_exceeded'],
  threshold: {
    error_rate: 0.05,  // 5% error rate
    avg_response_time: 5000  // 5 seconds
  }
};
```

## 💡 Examples & Use Cases

### Example 1: Property Analysis Pipeline

Complete property analysis with AI insights:

```typescript
async function analyzeProperty(propertyId: number) {
  // 1. Create specialized swarm
  const swarmId = await mcpOrchestrator.createSwarm({
    topology: 'hierarchical',
    maxAgents: 4,
    strategy: 'adaptive'
  });

  // 2. Fetch property data
  const properties = await mcpDatabase.select('properties', {
    where: { id: propertyId },
    columns: ['*']
  });

  // 3. Fetch related reservations
  const reservations = await mcpDatabase.select('reservations', {
    where: { property_id: propertyId },
    orderBy: 'created_at DESC',
    limit: 100
  });

  // 4. Orchestrate analysis task
  const taskId = await mcpOrchestrator.orchestrateSwarmTask(swarmId, 
    `Analyze property ${propertyId} performance using the following data:
     - Property details: ${JSON.stringify(properties[0])}
     - Recent reservations: ${JSON.stringify(reservations)}
     
     Provide:
     1. Occupancy rate analysis
     2. Revenue optimization suggestions
     3. Seasonal trend analysis
     4. Competitive positioning recommendations`
  );

  // 5. Monitor task completion
  let taskComplete = false;
  while (!taskComplete) {
    const status = await mcpOrchestrator.getSwarmStatus(swarmId);
    console.log('Analysis progress:', status);
    
    if (status.task_completed) {
      taskComplete = true;
    } else {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 6. Clean up resources
  await mcpOrchestrator.destroySwarm(swarmId);
  
  return { taskId, analysis: 'completed' };
}
```

### Example 2: OCR Document Processing

Process uploaded PDF documents with OCR:

```typescript
async function processReservationPDF(filePath: string, propertyId: number) {
  try {
    // 1. Execute OCR workflow
    const executionId = await mcpOrchestrator.executeWorkflow('ocr_processing', {
      projectId: process.env.NEON_PROJECT_ID,
      pdfFile: filePath,
      propertyId
    });

    // 2. Monitor execution
    let execution;
    do {
      execution = mcpOrchestrator.getWorkflowExecution(executionId);
      console.log(`OCR Progress: ${execution.status}`);
      
      if (execution.status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } while (execution.status === 'running');

    // 3. Process results
    if (execution.status === 'completed') {
      const extractedData = execution.results.store_data;
      
      // Transform data for API response
      const reservations = MCPTransformers.Reservation.fromOCRToAPI(
        execution.results.extract_text,
        propertyId
      );

      return {
        success: true,
        reservations,
        confidence: execution.results.analyze_content.confidence,
        executionId
      };
    } else {
      throw new Error(`OCR processing failed: ${execution.errors.join(', ')}`);
    }
  } catch (error) {
    console.error('OCR processing error:', error);
    throw error;
  }
}
```

### Example 3: Automated Deployment Pipeline

Deploy updates using Railway integration:

```typescript
async function deployToRailway(commitSha: string) {
  // 1. Get Railway project info
  const projects = await mcpClient.callTool({
    server: 'railway',
    tool: 'project_list',
    arguments: {}
  });

  const project = projects.data.find(p => p.name === 'mariafaz');
  if (!project) {
    throw new Error('MariaFaz project not found in Railway');
  }

  // 2. Get services
  const services = await mcpClient.callTool({
    server: 'railway',
    tool: 'service_list',
    arguments: { projectId: project.id }
  });

  const webService = services.data.find(s => s.name === 'web');
  
  // 3. Trigger deployment
  const deployment = await mcpClient.callTool({
    server: 'railway',
    tool: 'deployment_trigger',
    arguments: {
      projectId: project.id,
      serviceId: webService.id,
      environmentId: webService.environmentId,
      commitSha
    }
  });

  // 4. Monitor deployment
  let deploymentComplete = false;
  while (!deploymentComplete) {
    const status = await mcpClient.callTool({
      server: 'railway',
      tool: 'deployment_status',
      arguments: { deploymentId: deployment.data.id }
    });

    console.log(`Deployment status: ${status.data.status}`);
    
    if (['SUCCESS', 'FAILED'].includes(status.data.status)) {
      deploymentComplete = true;
      
      if (status.data.status === 'SUCCESS') {
        console.log('Deployment successful!');
        return { success: true, deploymentId: deployment.data.id };
      } else {
        throw new Error('Deployment failed');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Connection Timeouts

**Problem**: MCP tool calls timing out
**Solution**:
```typescript
// Increase timeout for specific operations
const response = await mcpClient.callTool({
  server: 'neon',
  tool: 'run_sql',
  arguments: { /* ... */ },
  timeout: 30000  // 30 seconds
});

// Or configure server-wide timeouts
mcpClient.registerServer({
  name: 'neon',
  timeout: 30000,
  retries: 5
});
```

#### 2. Rate Limiting

**Problem**: API calls being rate limited
**Solution**:
```typescript
// Check current rate limit status
const remaining = mcpSecurity.getRemainingRequests(clientId, maxRequests);
const resetTime = mcpSecurity.getResetTime(clientId);

// Implement exponential backoff
async function callWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('rate limit') && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

#### 3. Database Connection Issues

**Problem**: Database queries failing
**Solution**:
```typescript
// Test database connection
const isHealthy = await mcpDatabase.healthCheck();
if (!isHealthy) {
  console.error('Database connection failed');
  
  // Get fresh connection string
  const connectionString = await mcpDatabase.getConnectionString();
  console.log('Using connection:', connectionString.replace(/:([^@]+)@/, ':***@'));
}

// Check database configuration
const config = mcpDatabase.getConfig();
console.log('Database config:', config);
```

#### 4. Workflow Execution Failures

**Problem**: Workflows not completing successfully
**Solution**:
```typescript
// Get detailed execution information
const execution = mcpOrchestrator.getWorkflowExecution(executionId);
console.log('Execution status:', execution.status);
console.log('Completed steps:', execution.completedSteps);
console.log('Failed steps:', execution.failedSteps);
console.log('Errors:', execution.errors);

// Cancel stuck executions
if (execution.status === 'running' && isStuck(execution)) {
  const cancelled = mcpOrchestrator.cancelWorkflowExecution(executionId);
  console.log('Execution cancelled:', cancelled);
}
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
# Set environment variable
export DEBUG=mcp:*

# Or programmatically
process.env.DEBUG = 'mcp:*';
```

### Log Analysis

Analyze logs for patterns:

```bash
# Check error patterns in audit logs
curl -H "X-API-Key: your-key" \
  "http://localhost:3000/api/mcp/security/audit-logs?success=false" | \
  jq '.data[] | .error' | sort | uniq -c

# Check performance patterns
curl -H "X-API-Key: your-key" \
  "http://localhost:3000/api/mcp/stats" | \
  jq '.data.orchestrator'
```

## ⚡ Performance Optimization

### Connection Pooling

Optimize database connections:

```typescript
// Configure connection pool
const dbConfig = {
  projectId: 'plain-recipe-77049551',
  databaseUrl: process.env.DATABASE_URL,
  maxConnections: 20,
  idleTimeout: 30000,
  connectionTimeout: 10000
};

const mcpDatabase = new MCPDatabaseManager(dbConfig);
```

### Batch Operations

Use batch operations for better performance:

```typescript
// Batch multiple tool calls
const batchResults = await mcpClient.batchCall([
  { server: 'neon', tool: 'run_sql', arguments: { sql: 'SELECT 1' } },
  { server: 'neon', tool: 'run_sql', arguments: { sql: 'SELECT 2' } },
  { server: 'neon', tool: 'run_sql', arguments: { sql: 'SELECT 3' } }
]);

// Batch data transformations
const transformedData = MCPTransformers.transformBatch(
  largeDataset,
  item => transformItem(item),
  { batchSize: 1000 }
);
```

### Caching

Implement caching for frequently accessed data:

```typescript
class CacheLayer {
  private cache = new Map<string, { data: any; expires: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const data = await fn();
    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl
    });

    return data;
  }
}

const cache = new CacheLayer();

// Use cache for expensive operations
const properties = await cache.get(
  'properties_list',
  () => mcpDatabase.select('properties')
);
```

### Resource Management

Monitor and optimize resource usage:

```typescript
// Monitor memory usage
const usage = process.memoryUsage();
console.log(`Memory usage: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);

// Clean up resources
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  
  // Close database connections
  await mcpDatabase.closeAllConnections();
  
  // Destroy active swarms
  const swarms = mcpOrchestrator.listActiveSwarms();
  await Promise.all(
    swarms.map(swarm => mcpOrchestrator.destroySwarm(swarm.swarmId))
  );
  
  process.exit(0);
});
```

---

## 📚 Additional Resources

- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Neon Database Documentation](https://neon.tech/docs)
- [Railway Deployment Guide](https://railway.app/docs)
- [Claude Flow AI Documentation](https://github.com/ruvnet/claude-flow)

For support and questions, please check the troubleshooting section or create an issue in the project repository.
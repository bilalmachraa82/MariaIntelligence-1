/**
 * MCP (Model Context Protocol) Client
 * Unified interface for all MCP server interactions
 */

import { z } from 'zod';

// MCP Server Configuration Schema
const MCPServerConfigSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  rateLimit: z.object({
    requests: z.number(),
    window: z.number()
  }).optional()
});

export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;

// MCP Tool Call Schema
const MCPToolCallSchema = z.object({
  server: z.string(),
  tool: z.string(),
  arguments: z.record(z.any()),
  timeout: z.number().optional()
});

export type MCPToolCall = z.infer<typeof MCPToolCallSchema>;

// MCP Response Schema
const MCPResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  error: z.string().optional(),
  metadata: z.object({
    server: z.string(),
    tool: z.string(),
    duration: z.number(),
    timestamp: z.string(),
    retries: z.number().optional()
  })
});

export type MCPResponse = z.infer<typeof MCPResponseSchema>;

// Rate Limiter
class RateLimiter {
  private calls: Map<string, number[]> = new Map();

  canMakeCall(serverId: string, limit: { requests: number; window: number }): boolean {
    const now = Date.now();
    const serverCalls = this.calls.get(serverId) || [];
    
    // Remove old calls outside the window
    const validCalls = serverCalls.filter(time => now - time < limit.window);
    
    if (validCalls.length >= limit.requests) {
      return false;
    }
    
    validCalls.push(now);
    this.calls.set(serverId, validCalls);
    return true;
  }
}

export class MCPClient {
  private servers: Map<string, MCPServerConfig> = new Map();
  private rateLimiter = new RateLimiter();
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff

  constructor() {
    this.initializeDefaultServers();
  }

  private initializeDefaultServers() {
    // Neon Database Server
    this.registerServer({
      name: 'neon',
      timeout: 10000,
      retries: 3,
      rateLimit: { requests: 100, window: 60000 }
    });

    // Railway Deployment Server  
    this.registerServer({
      name: 'railway',
      timeout: 30000,
      retries: 2,
      rateLimit: { requests: 50, window: 60000 }
    });

    // Claude Flow AI Orchestration
    this.registerServer({
      name: 'claude-flow',
      timeout: 60000,
      retries: 3,
      rateLimit: { requests: 200, window: 60000 }
    });

    // Ruv Swarm Coordination
    this.registerServer({
      name: 'ruv-swarm',
      timeout: 45000,
      retries: 2,
      rateLimit: { requests: 150, window: 60000 }
    });
  }

  registerServer(config: MCPServerConfig): void {
    const validatedConfig = MCPServerConfigSchema.parse(config);
    this.servers.set(validatedConfig.name, validatedConfig);
  }

  async callTool(toolCall: MCPToolCall): Promise<MCPResponse> {
    const startTime = Date.now();
    const server = this.servers.get(toolCall.server);
    
    if (!server) {
      throw new Error(`MCP server '${toolCall.server}' not found`);
    }

    // Rate limiting check
    if (server.rateLimit && !this.rateLimiter.canMakeCall(toolCall.server, server.rateLimit)) {
      throw new Error(`Rate limit exceeded for server '${toolCall.server}'`);
    }

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= server.retries; attempt++) {
      try {
        const result = await this.executeToolCall(toolCall, server);
        
        return {
          success: true,
          data: result,
          metadata: {
            server: toolCall.server,
            tool: toolCall.tool,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            retries: attempt
          }
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < server.retries) {
          const delay = this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)];
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      data: null,
      error: lastError?.message || 'Unknown error',
      metadata: {
        server: toolCall.server,
        tool: toolCall.tool,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        retries: server.retries
      }
    };
  }

  private async executeToolCall(toolCall: MCPToolCall, server: MCPServerConfig): Promise<any> {
    // This would integrate with the actual MCP protocol implementation
    // For now, we'll simulate the call based on server type
    
    switch (toolCall.server) {
      case 'neon':
        return this.callNeonTool(toolCall);
      case 'railway':
        return this.callRailwayTool(toolCall);
      case 'claude-flow':
        return this.callClaudeFlowTool(toolCall);
      case 'ruv-swarm':
        return this.callRuvSwarmTool(toolCall);
      default:
        throw new Error(`Unknown server type: ${toolCall.server}`);
    }
  }

  private async callNeonTool(toolCall: MCPToolCall): Promise<any> {
    // Simulate Neon database operations
    const validTools = [
      'list_projects', 'create_project', 'run_sql', 'describe_table_schema',
      'get_database_tables', 'create_branch', 'get_connection_string'
    ];

    if (!validTools.includes(toolCall.tool)) {
      throw new Error(`Invalid Neon tool: ${toolCall.tool}`);
    }

    // In a real implementation, this would use the actual Neon MCP client
    return {
      tool: toolCall.tool,
      arguments: toolCall.arguments,
      result: `Simulated ${toolCall.tool} execution`,
      timestamp: new Date().toISOString()
    };
  }

  private async callRailwayTool(toolCall: MCPToolCall): Promise<any> {
    // Simulate Railway deployment operations
    const validTools = [
      'project_list', 'service_create_from_repo', 'deployment_trigger',
      'variable_set', 'domain_create', 'service_restart'
    ];

    if (!validTools.includes(toolCall.tool)) {
      throw new Error(`Invalid Railway tool: ${toolCall.tool}`);
    }

    return {
      tool: toolCall.tool,
      arguments: toolCall.arguments,
      result: `Simulated ${toolCall.tool} execution`,
      timestamp: new Date().toISOString()
    };
  }

  private async callClaudeFlowTool(toolCall: MCPToolCall): Promise<any> {
    // Simulate Claude Flow AI orchestration
    const validTools = [
      'swarm_init', 'agent_spawn', 'task_orchestrate', 'memory_usage',
      'neural_train', 'performance_report'
    ];

    if (!validTools.includes(toolCall.tool)) {
      throw new Error(`Invalid Claude Flow tool: ${toolCall.tool}`);
    }

    return {
      tool: toolCall.tool,
      arguments: toolCall.arguments,
      result: `Simulated ${toolCall.tool} execution`,
      timestamp: new Date().toISOString()
    };
  }

  private async callRuvSwarmTool(toolCall: MCPToolCall): Promise<any> {
    // Simulate Ruv Swarm coordination
    const validTools = [
      'swarm_init', 'agent_spawn', 'task_orchestrate', 'swarm_status',
      'agent_metrics', 'daa_init'
    ];

    if (!validTools.includes(toolCall.tool)) {
      throw new Error(`Invalid Ruv Swarm tool: ${toolCall.tool}`);
    }

    return {
      tool: toolCall.tool,
      arguments: toolCall.arguments,
      result: `Simulated ${toolCall.tool} execution`,
      timestamp: new Date().toISOString()
    };
  }

  async batchCall(toolCalls: MCPToolCall[]): Promise<MCPResponse[]> {
    // Execute multiple tool calls in parallel with proper error handling
    const promises = toolCalls.map(toolCall => 
      this.callTool(toolCall).catch(error => ({
        success: false,
        data: null,
        error: error.message,
        metadata: {
          server: toolCall.server,
          tool: toolCall.tool,
          duration: 0,
          timestamp: new Date().toISOString(),
          retries: 0
        }
      }) as MCPResponse)
    );

    return Promise.all(promises);
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [serverName] of this.servers) {
      try {
        // Simple health check - attempt a basic operation
        await this.callTool({
          server: serverName,
          tool: 'health_check',
          arguments: {}
        });
        health[serverName] = true;
      } catch (error) {
        health[serverName] = false;
      }
    }
    
    return health;
  }

  getServerConfig(serverName: string): MCPServerConfig | undefined {
    return this.servers.get(serverName);
  }

  listServers(): string[] {
    return Array.from(this.servers.keys());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const mcpClient = new MCPClient();
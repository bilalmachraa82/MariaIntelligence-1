/**
 * MCP Orchestrator
 * Advanced workflow orchestration using Claude Flow and Ruv Swarm coordination
 */

import { z } from 'zod';
import { mcpClient, MCPResponse, MCPToolCall } from './mcp-client';
import { mcpSecurity } from './mcp-security';

// Workflow Configuration Schema
const WorkflowConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['task', 'condition', 'parallel', 'loop']),
    server: z.string(),
    tool: z.string(),
    arguments: z.record(z.any()),
    dependsOn: z.array(z.string()).optional(),
    timeout: z.number().optional(),
    retries: z.number().optional(),
    onError: z.enum(['stop', 'continue', 'retry']).default('stop')
  })),
  timeout: z.number().default(300000), // 5 minutes
  maxConcurrency: z.number().default(5),
  onError: z.enum(['stop', 'continue']).default('stop')
});

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;
export type WorkflowStep = WorkflowConfig['steps'][0];

// Workflow Execution Schema
const WorkflowExecutionSchema = z.object({
  workflowId: z.string(),
  executionId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  startTime: z.string(),
  endTime: z.string().optional(),
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()),
  failedSteps: z.array(z.string()),
  results: z.record(z.any()),
  errors: z.array(z.string()),
  metadata: z.record(z.any()).optional()
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;

// Swarm Configuration Schema
const SwarmConfigSchema = z.object({
  topology: z.enum(['hierarchical', 'mesh', 'ring', 'star']),
  maxAgents: z.number().default(8),
  strategy: z.enum(['parallel', 'sequential', 'adaptive', 'balanced']).default('adaptive'),
  autoScale: z.boolean().default(true),
  coordinationMode: z.enum(['centralized', 'distributed']).default('distributed')
});

export type SwarmConfig = z.infer<typeof SwarmConfigSchema>;

// Agent Types and Capabilities
const AGENT_CAPABILITIES = {
  researcher: ['data_analysis', 'web_search', 'document_processing'],
  coder: ['code_generation', 'debugging', 'testing', 'refactoring'],
  analyst: ['performance_analysis', 'optimization', 'metrics_collection'],
  architect: ['system_design', 'integration_planning', 'scalability_analysis'],
  tester: ['unit_testing', 'integration_testing', 'load_testing', 'security_testing'],
  coordinator: ['task_distribution', 'progress_monitoring', 'resource_allocation'],
  optimizer: ['performance_tuning', 'resource_optimization', 'cost_reduction']
} as const;

// Task Queue Manager
class TaskQueue {
  private queue: Array<{ task: WorkflowStep; priority: number; timestamp: number }> = [];
  private running: Set<string> = new Set();
  private completed: Set<string> = new Set();
  private failed: Set<string> = new Set();
  private maxConcurrency: number;

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  addTask(task: WorkflowStep, priority: number = 0): void {
    this.queue.push({
      task,
      priority,
      timestamp: Date.now()
    });

    // Sort by priority (higher first) then by timestamp (older first)
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
  }

  getNextTask(): WorkflowStep | null {
    if (this.running.size >= this.maxConcurrency) {
      return null;
    }

    // Find a task that has all dependencies completed
    for (let i = 0; i < this.queue.length; i++) {
      const { task } = this.queue[i];
      
      if (this.canRunTask(task)) {
        this.queue.splice(i, 1);
        this.running.add(task.id);
        return task;
      }
    }

    return null;
  }

  private canRunTask(task: WorkflowStep): boolean {
    if (!task.dependsOn || task.dependsOn.length === 0) {
      return true;
    }

    return task.dependsOn.every(depId => this.completed.has(depId));
  }

  completeTask(taskId: string): void {
    this.running.delete(taskId);
    this.completed.add(taskId);
  }

  failTask(taskId: string): void {
    this.running.delete(taskId);
    this.failed.add(taskId);
  }

  getStatus(): {
    queued: number;
    running: number;
    completed: number;
    failed: number;
  } {
    return {
      queued: this.queue.length,
      running: this.running.size,
      completed: this.completed.size,
      failed: this.failed.size
    };
  }

  isEmpty(): boolean {
    return this.queue.length === 0 && this.running.size === 0;
  }

  hasFailures(): boolean {
    return this.failed.size > 0;
  }
}

// Workflow Engine
class WorkflowEngine {
  private executions: Map<string, WorkflowExecution> = new Map();
  private workflows: Map<string, WorkflowConfig> = new Map();

  registerWorkflow(workflow: WorkflowConfig): void {
    const validatedWorkflow = WorkflowConfigSchema.parse(workflow);
    this.workflows.set(validatedWorkflow.id, validatedWorkflow);
  }

  async executeWorkflow(workflowId: string, context: Record<string, any> = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow '${workflowId}' not found`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const execution: WorkflowExecution = {
      workflowId,
      executionId,
      status: 'pending',
      startTime: new Date().toISOString(),
      completedSteps: [],
      failedSteps: [],
      results: {},
      errors: [],
      metadata: context
    };

    this.executions.set(executionId, execution);

    // Start execution asynchronously
    this.runWorkflowExecution(executionId, workflow).catch(error => {
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      execution.errors.push(error.message);
    });

    return executionId;
  }

  private async runWorkflowExecution(executionId: string, workflow: WorkflowConfig): Promise<void> {
    const execution = this.executions.get(executionId)!;
    execution.status = 'running';

    const taskQueue = new TaskQueue(workflow.maxConcurrency);
    
    // Add all tasks to the queue
    workflow.steps.forEach(step => {
      taskQueue.addTask(step, this.calculatePriority(step));
    });

    const runningTasks: Promise<void>[] = [];

    while (!taskQueue.isEmpty() && !taskQueue.hasFailures()) {
      const task = taskQueue.getNextTask();
      if (!task) {
        // Wait for running tasks to complete
        if (runningTasks.length > 0) {
          await Promise.race(runningTasks);
          continue;
        } else {
          break;
        }
      }

      execution.currentStep = task.id;

      const taskPromise = this.executeStep(task, execution)
        .then(result => {
          taskQueue.completeTask(task.id);
          execution.completedSteps.push(task.id);
          execution.results[task.id] = result;
        })
        .catch(error => {
          taskQueue.failTask(task.id);
          execution.failedSteps.push(task.id);
          execution.errors.push(`Step ${task.id}: ${error.message}`);

          if (task.onError === 'stop' || workflow.onError === 'stop') {
            throw error;
          }
        })
        .finally(() => {
          const index = runningTasks.indexOf(taskPromise);
          if (index > -1) {
            runningTasks.splice(index, 1);
          }
        });

      runningTasks.push(taskPromise);
    }

    // Wait for all remaining tasks to complete
    await Promise.allSettled(runningTasks);

    execution.status = taskQueue.hasFailures() ? 'failed' : 'completed';
    execution.endTime = new Date().toISOString();
    execution.currentStep = undefined;
  }

  private calculatePriority(step: WorkflowStep): number {
    // Higher priority for steps with more dependents
    return (step.dependsOn?.length || 0) * 10;
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Log step execution
    mcpSecurity.logAudit({
      action: 'workflow_step',
      server: step.server,
      tool: step.tool,
      arguments: step.arguments,
      success: false,
      userId: execution.metadata?.userId
    });

    try {
      // Replace placeholders in arguments with execution context
      const processedArguments = this.processArguments(step.arguments, execution);

      const response = await mcpClient.callTool({
        server: step.server,
        tool: step.tool,
        arguments: processedArguments,
        timeout: step.timeout
      });

      if (!response.success) {
        throw new Error(response.error || 'Step execution failed');
      }

      // Update audit log with success
      mcpSecurity.logAudit({
        action: 'workflow_step',
        server: step.server,
        tool: step.tool,
        arguments: processedArguments,
        success: true,
        userId: execution.metadata?.userId
      });

      return response.data;
    } catch (error) {
      // Update audit log with error
      mcpSecurity.logAudit({
        action: 'workflow_step',
        server: step.server,
        tool: step.tool,
        arguments: step.arguments,
        success: false,
        error: (error as Error).message,
        userId: execution.metadata?.userId
      });

      throw error;
    }
  }

  private processArguments(args: Record<string, any>, execution: WorkflowExecution): Record<string, any> {
    const processedArgs: Record<string, any> = {};

    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // Extract variable name from ${variableName}
        const varName = value.slice(2, -1);
        
        if (varName.startsWith('results.')) {
          const [, stepId, ...path] = varName.split('.');
          const stepResult = execution.results[stepId];
          processedArgs[key] = path.length > 0 ? this.getNestedValue(stepResult, path) : stepResult;
        } else if (varName.startsWith('metadata.')) {
          const path = varName.split('.').slice(1);
          processedArgs[key] = this.getNestedValue(execution.metadata, path);
        } else {
          processedArgs[key] = value; // Keep original if not found
        }
      } else {
        processedArgs[key] = value;
      }
    }

    return processedArgs;
  }

  private getNestedValue(obj: any, path: string[]): any {
    return path.reduce((current, key) => current?.[key], obj);
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  listExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values());
    return workflowId ? executions.filter(e => e.workflowId === workflowId) : executions;
  }

  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date().toISOString();
      return true;
    }
    return false;
  }
}

// Swarm Manager
class SwarmManager {
  private activeSwarms: Map<string, { config: SwarmConfig; agents: string[]; status: string }> = new Map();

  async initializeSwarm(config: SwarmConfig): Promise<string> {
    const swarmId = `swarm_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Initialize swarm using Claude Flow
    const initResponse = await mcpClient.callTool({
      server: 'claude-flow',
      tool: 'swarm_init',
      arguments: {
        topology: config.topology,
        maxAgents: config.maxAgents,
        strategy: config.strategy
      }
    });

    if (!initResponse.success) {
      throw new Error(`Failed to initialize swarm: ${initResponse.error}`);
    }

    // Spawn agents based on configuration
    const agents: string[] = [];
    const agentTypes = this.selectAgentTypes(config);

    for (const agentType of agentTypes) {
      const spawnResponse = await mcpClient.callTool({
        server: 'claude-flow',
        tool: 'agent_spawn',
        arguments: {
          type: agentType,
          capabilities: AGENT_CAPABILITIES[agentType as keyof typeof AGENT_CAPABILITIES] || []
        }
      });

      if (spawnResponse.success) {
        agents.push(spawnResponse.data.agentId);
      }
    }

    this.activeSwarms.set(swarmId, {
      config,
      agents,
      status: 'active'
    });

    return swarmId;
  }

  private selectAgentTypes(config: SwarmConfig): string[] {
    // Select agent types based on strategy and topology
    const baseAgents = ['coordinator'];
    
    switch (config.strategy) {
      case 'parallel':
        return [...baseAgents, 'coder', 'tester', 'analyst'];
      case 'sequential':
        return [...baseAgents, 'researcher', 'architect', 'coder'];
      case 'adaptive':
        return [...baseAgents, 'researcher', 'coder', 'tester', 'optimizer'];
      default:
        return [...baseAgents, 'coder', 'tester'];
    }
  }

  async orchestrateTask(swarmId: string, task: string, context: Record<string, any> = {}): Promise<string> {
    const swarm = this.activeSwarms.get(swarmId);
    if (!swarm) {
      throw new Error(`Swarm '${swarmId}' not found`);
    }

    const orchestrateResponse = await mcpClient.callTool({
      server: 'claude-flow',
      tool: 'task_orchestrate',
      arguments: {
        task,
        strategy: swarm.config.strategy,
        priority: 'high',
        dependencies: [],
        ...context
      }
    });

    if (!orchestrateResponse.success) {
      throw new Error(`Task orchestration failed: ${orchestrateResponse.error}`);
    }

    return orchestrateResponse.data.taskId;
  }

  async getSwarmStatus(swarmId: string): Promise<any> {
    const statusResponse = await mcpClient.callTool({
      server: 'claude-flow',
      tool: 'swarm_status',
      arguments: {}
    });

    return statusResponse.success ? statusResponse.data : null;
  }

  async destroySwarm(swarmId: string): Promise<boolean> {
    const destroyResponse = await mcpClient.callTool({
      server: 'claude-flow',
      tool: 'swarm_destroy',
      arguments: { swarmId }
    });

    if (destroyResponse.success) {
      this.activeSwarms.delete(swarmId);
      return true;
    }

    return false;
  }

  listActiveSwarms(): Array<{ swarmId: string; config: SwarmConfig; agents: string[]; status: string }> {
    return Array.from(this.activeSwarms.entries()).map(([swarmId, swarm]) => ({
      swarmId,
      ...swarm
    }));
  }
}

// Main Orchestrator
export class MCPOrchestrator {
  private workflowEngine = new WorkflowEngine();
  private swarmManager = new SwarmManager();

  constructor() {
    this.initializeDefaultWorkflows();
  }

  private initializeDefaultWorkflows(): void {
    // MariaFaz Property Management Workflow
    this.workflowEngine.registerWorkflow({
      id: 'property_management',
      name: 'Property Management Workflow',
      description: 'Complete property management including analysis, reports, and optimization',
      steps: [
        {
          id: 'init_swarm',
          name: 'Initialize AI Swarm',
          type: 'task',
          server: 'claude-flow',
          tool: 'swarm_init',
          arguments: {
            topology: 'hierarchical',
            maxAgents: 6,
            strategy: 'adaptive'
          }
        },
        {
          id: 'analyze_properties',
          name: 'Analyze Property Data',
          type: 'task',
          server: 'neon',
          tool: 'run_sql',
          arguments: {
            projectId: '${metadata.projectId}',
            sql: 'SELECT * FROM properties WHERE owner_id = ${metadata.ownerId}'
          },
          dependsOn: ['init_swarm']
        },
        {
          id: 'generate_report',
          name: 'Generate Property Report',
          type: 'task',
          server: 'claude-flow',
          tool: 'task_orchestrate',
          arguments: {
            task: 'Generate comprehensive property report with insights',
            data: '${results.analyze_properties}'
          },
          dependsOn: ['analyze_properties']
        },
        {
          id: 'deploy_updates',
          name: 'Deploy System Updates',
          type: 'task',
          server: 'railway',
          tool: 'deployment_trigger',
          arguments: {
            projectId: '${metadata.railwayProjectId}',
            serviceId: '${metadata.serviceId}',
            environmentId: '${metadata.environmentId}',
            commitSha: '${metadata.commitSha}'
          },
          dependsOn: ['generate_report']
        }
      ],
      timeout: 600000, // 10 minutes
      maxConcurrency: 3
    });

    // OCR Processing Workflow
    this.workflowEngine.registerWorkflow({
      id: 'ocr_processing',
      name: 'OCR Document Processing',
      description: 'Process PDF documents with OCR and extract reservation data',
      steps: [
        {
          id: 'extract_text',
          name: 'Extract Text from PDF',
          type: 'task',
          server: 'claude-flow',
          tool: 'task_orchestrate',
          arguments: {
            task: 'Extract text from PDF using OCR',
            file: '${metadata.pdfFile}'
          }
        },
        {
          id: 'analyze_content',
          name: 'Analyze Document Content',
          type: 'task',
          server: 'claude-flow',
          tool: 'neural_patterns',
          arguments: {
            action: 'analyze',
            pattern: 'reservation_data',
            content: '${results.extract_text}'
          },
          dependsOn: ['extract_text']
        },
        {
          id: 'store_data',
          name: 'Store Extracted Data',
          type: 'task',
          server: 'neon',
          tool: 'run_sql',
          arguments: {
            projectId: '${metadata.projectId}',
            sql: 'INSERT INTO reservations (property_id, guest_name, check_in, check_out) VALUES (${results.analyze_content.property_id}, ${results.analyze_content.guest_name}, ${results.analyze_content.check_in}, ${results.analyze_content.check_out})'
          },
          dependsOn: ['analyze_content']
        }
      ],
      timeout: 300000, // 5 minutes
      maxConcurrency: 2
    });
  }

  // Workflow Management
  registerWorkflow(workflow: WorkflowConfig): void {
    this.workflowEngine.registerWorkflow(workflow);
  }

  async executeWorkflow(workflowId: string, context: Record<string, any> = {}): Promise<string> {
    return this.workflowEngine.executeWorkflow(workflowId, context);
  }

  getWorkflowExecution(executionId: string): WorkflowExecution | undefined {
    return this.workflowEngine.getExecution(executionId);
  }

  listWorkflowExecutions(workflowId?: string): WorkflowExecution[] {
    return this.workflowEngine.listExecutions(workflowId);
  }

  cancelWorkflowExecution(executionId: string): boolean {
    return this.workflowEngine.cancelExecution(executionId);
  }

  // Swarm Management
  async createSwarm(config: SwarmConfig): Promise<string> {
    return this.swarmManager.initializeSwarm(config);
  }

  async orchestrateSwarmTask(swarmId: string, task: string, context: Record<string, any> = {}): Promise<string> {
    return this.swarmManager.orchestrateTask(swarmId, task, context);
  }

  async getSwarmStatus(swarmId: string): Promise<any> {
    return this.swarmManager.getSwarmStatus(swarmId);
  }

  async destroySwarm(swarmId: string): Promise<boolean> {
    return this.swarmManager.destroySwarm(swarmId);
  }

  listActiveSwarms(): Array<{ swarmId: string; config: SwarmConfig; agents: string[]; status: string }> {
    return this.swarmManager.listActiveSwarms();
  }

  // Utility Methods
  async healthCheck(): Promise<{ workflows: boolean; swarms: boolean; mcp: boolean }> {
    const mcpHealth = await mcpClient.healthCheck();
    
    return {
      workflows: true, // Workflow engine is always available
      swarms: this.swarmManager.listActiveSwarms().length >= 0,
      mcp: Object.values(mcpHealth).every(status => status)
    };
  }

  getStats(): {
    workflows: number;
    activeExecutions: number;
    activeSwarms: number;
    totalSteps: number;
  } {
    const executions = this.workflowEngine.listExecutions();
    const activeExecutions = executions.filter(e => e.status === 'running').length;
    const activeSwarms = this.swarmManager.listActiveSwarms().length;
    
    return {
      workflows: executions.length,
      activeExecutions,
      activeSwarms,
      totalSteps: executions.reduce((sum, e) => sum + e.completedSteps.length, 0)
    };
  }
}

// Singleton instance
export const mcpOrchestrator = new MCPOrchestrator();
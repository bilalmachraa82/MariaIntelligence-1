/**
 * Mock Services for MCP Testing
 * Provides mock implementations of external services
 */

import express, { Express } from 'express';
import { Server } from 'http';
import { MockNeonService } from './neon-service.mock';
import { MockRailwayService } from './railway-service.mock';
import { MockOpenRouterService } from './openrouter-service.mock';
import { MockMistralService } from './mistral-service.mock';

export class MockServices {
  private app: Express;
  private server?: Server;
  private port: number;
  
  private neonMock: MockNeonService;
  private railwayMock: MockRailwayService;
  private openRouterMock: MockOpenRouterService;
  private mistralMock: MockMistralService;

  constructor(port: number = 0) {
    this.port = port;
    this.app = express();
    
    // Initialize mock services
    this.neonMock = new MockNeonService();
    this.railwayMock = new MockRailwayService();
    this.openRouterMock = new MockOpenRouterService();
    this.mistralMock = new MockMistralService();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Add CORS for testing
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // Request logging for debugging
    this.app.use((req, res, next) => {
      console.log(`[Mock] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup mock service routes
   */
  private setupRoutes(): void {
    // Neon API mock routes
    this.app.use('/neon', this.neonMock.getRouter());
    
    // Railway API mock routes
    this.app.use('/railway', this.railwayMock.getRouter());
    
    // OpenRouter API mock routes
    this.app.use('/openrouter', this.openRouterMock.getRouter());
    
    // Mistral API mock routes
    this.app.use('/mistral', this.mistralMock.getRouter());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        services: {
          neon: this.neonMock.isHealthy(),
          railway: this.railwayMock.isHealthy(),
          openrouter: this.openRouterMock.isHealthy(),
          mistral: this.mistralMock.isHealthy()
        },
        timestamp: new Date().toISOString()
      });
    });

    // Mock service status endpoint
    this.app.get('/status', (req, res) => {
      res.json({
        neon: this.neonMock.getStatus(),
        railway: this.railwayMock.getStatus(),
        openrouter: this.openRouterMock.getStatus(),
        mistral: this.mistralMock.getStatus()
      });
    });
  }

  /**
   * Start mock services server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        const address = this.server?.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          console.log(`🔧 Mock Services running on port ${this.port}`);
          
          // Update environment variables to point to mock services
          process.env.MOCK_SERVICES_PORT = this.port.toString();
          process.env.NEON_API_BASE_URL = `http://localhost:${this.port}/neon`;
          process.env.RAILWAY_API_BASE_URL = `http://localhost:${this.port}/railway`;
          process.env.OPENROUTER_API_BASE_URL = `http://localhost:${this.port}/openrouter`;
          process.env.MISTRAL_API_BASE_URL = `http://localhost:${this.port}/mistral`;
          
          resolve();
        } else {
          reject(new Error('Failed to start mock services'));
        }
      });
    });
  }

  /**
   * Stop mock services server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🔧 Mock Services stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Reset all mock services to initial state
   */
  async reset(): Promise<void> {
    await this.neonMock.reset();
    await this.railwayMock.reset();
    await this.openRouterMock.reset();
    await this.mistralMock.reset();
  }

  /**
   * Get mock service instances for direct testing
   */
  getMocks() {
    return {
      neon: this.neonMock,
      railway: this.railwayMock,
      openrouter: this.openRouterMock,
      mistral: this.mistralMock
    };
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Get base URL for mock services
   */
  getBaseUrl(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * Configure mock service behaviors for specific tests
   */
  configureMocks(config: {
    neon?: any;
    railway?: any;
    openrouter?: any;
    mistral?: any;
  }): void {
    if (config.neon) this.neonMock.configure(config.neon);
    if (config.railway) this.railwayMock.configure(config.railway);
    if (config.openrouter) this.openRouterMock.configure(config.openrouter);
    if (config.mistral) this.mistralMock.configure(config.mistral);
  }

  /**
   * Get all request logs for debugging
   */
  getRequestLogs() {
    return {
      neon: this.neonMock.getRequestLogs(),
      railway: this.railwayMock.getRequestLogs(),
      openrouter: this.openRouterMock.getRequestLogs(),
      mistral: this.mistralMock.getRequestLogs()
    };
  }

  /**
   * Simulate service failures for error testing
   */
  simulateFailures(config: {
    neon?: boolean;
    railway?: boolean;
    openrouter?: boolean;
    mistral?: boolean;
  }): void {
    if (config.neon) this.neonMock.simulateFailure();
    if (config.railway) this.railwayMock.simulateFailure();
    if (config.openrouter) this.openRouterMock.simulateFailure();
    if (config.mistral) this.mistralMock.simulateFailure();
  }

  /**
   * Set response delays for performance testing
   */
  setResponseDelays(delays: {
    neon?: number;
    railway?: number;
    openrouter?: number;
    mistral?: number;
  }): void {
    if (delays.neon) this.neonMock.setResponseDelay(delays.neon);
    if (delays.railway) this.railwayMock.setResponseDelay(delays.railway);
    if (delays.openrouter) this.openRouterMock.setResponseDelay(delays.openrouter);
    if (delays.mistral) this.mistralMock.setResponseDelay(delays.mistral);
  }
}
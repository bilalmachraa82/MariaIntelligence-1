/**
 * Performance Optimization Configuration for MariaIntelligence
 * Optimized for Hostinger VPS deployment
 */

const performanceConfig = {
  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: true,
    // Connection pooling
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    }
  },

  // Cache Strategy Configuration
  cache: {
    // Session cache (30 minutes)
    sessions: {
      ttl: 30 * 60,
      checkPeriod: 10 * 60
    },
    // API responses (5 minutes)
    apiResponses: {
      ttl: 5 * 60,
      maxSize: 100
    },
    // PDF processing results (1 hour)
    pdfResults: {
      ttl: 60 * 60,
      maxSize: 50
    },
    // Static assets (24 hours)
    staticAssets: {
      ttl: 24 * 60 * 60,
      maxAge: '1d'
    },
    // Database queries (2 minutes)
    dbQueries: {
      ttl: 2 * 60,
      maxSize: 200
    }
  },

  // Database Connection Pooling
  database: {
    // PostgreSQL connection pool
    pool: {
      min: 2,
      max: process.env.NODE_ENV === 'production' ? 20 : 5,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    },
    // Query optimization
    queryTimeout: 30000,
    statementTimeout: 30000,
    connectionTimeoutMillis: 2000,
    idleInTransactionSessionTimeout: 10000
  },

  // PM2 Cluster Configuration
  pm2: {
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    maxMemoryRestart: '500M',
    minUptime: '10s',
    maxRestarts: 10,
    autorestart: true,
    watch: process.env.NODE_ENV !== 'production',
    ignoreWatch: ['node_modules', 'uploads', 'logs'],
    mergeLogs: true,
    logDateFormat: 'YYYY-MM-DD HH:mm:ss Z',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  },

  // HTTP/2 and Compression
  server: {
    // Compression settings
    compression: {
      threshold: 1024,
      level: 6,
      memLevel: 8,
      filter: (req, res) => {
        // Don't compress if explicitly disabled
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Compress everything else
        return true;
      }
    },
    // HTTP/2 push resources
    http2Push: {
      enabled: true,
      resources: [
        { path: '/assets/app.css', as: 'style' },
        { path: '/assets/app.js', as: 'script' },
        { path: '/assets/logo.png', as: 'image' }
      ]
    },
    // Security headers for performance
    headers: {
      'X-DNS-Prefetch-Control': 'on',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  },

  // CDN Configuration
  cdn: {
    enabled: process.env.NODE_ENV === 'production',
    baseUrl: process.env.CDN_BASE_URL || '',
    staticAssets: {
      images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      fonts: ['.woff', '.woff2', '.ttf', '.otf'],
      documents: ['.pdf', '.doc', '.docx']
    },
    // Cache control headers
    cacheControl: {
      immutable: 'public, max-age=31536000, immutable',
      static: 'public, max-age=86400',
      dynamic: 'public, max-age=3600'
    }
  },

  // Performance Monitoring
  monitoring: {
    // Metrics collection interval (seconds)
    metricsInterval: 30,
    // Performance thresholds
    thresholds: {
      pageLoadTime: 3000, // 3 seconds
      apiResponseTime: 500, // 500ms
      pdfProcessingTime: 5000, // 5 seconds
      chatResponseTime: 2000, // 2 seconds
      dbQueryTime: 100 // 100ms average
    },
    // Alert thresholds
    alerts: {
      cpuUsage: 80, // 80%
      memoryUsage: 85, // 85%
      responseTime: 1000, // 1 second
      errorRate: 5 // 5%
    }
  },

  // Load Balancing (OpenLiteSpeed)
  loadBalancing: {
    algorithm: 'leastconn', // least connections
    healthCheck: {
      enabled: true,
      interval: 30, // seconds
      timeout: 5, // seconds
      unhealthyThreshold: 3,
      healthyThreshold: 2
    },
    // Upstream servers
    upstreams: [
      {
        name: 'nodejs-backend',
        servers: [
          { address: 'localhost:3001', weight: 1 },
          { address: 'localhost:3002', weight: 1 },
          { address: 'localhost:3003', weight: 1 }
        ]
      }
    ]
  },

  // Image Optimization
  images: {
    formats: ['webp', 'avif', 'jpg'],
    quality: 85,
    // Lazy loading configuration
    lazyLoading: {
      enabled: true,
      threshold: '50px',
      rootMargin: '50px'
    },
    // Responsive breakpoints
    breakpoints: [640, 768, 1024, 1280, 1536]
  },

  // Bundle Optimization
  bundling: {
    // Code splitting
    codeSplitting: {
      chunks: 'async',
      minSize: 20000,
      maxSize: 244000
    },
    // Tree shaking
    treeShaking: true,
    // Minification
    minification: {
      terser: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: process.env.NODE_ENV === 'production'
        }
      }
    }
  },

  // Memory Management
  memory: {
    // Garbage collection tuning
    gc: {
      // Force GC every 5 minutes in production
      interval: process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : null,
      // Memory threshold for triggering GC (MB)
      threshold: 400
    },
    // Memory leak detection
    leakDetection: {
      enabled: process.env.NODE_ENV !== 'production',
      threshold: 100, // MB growth
      interval: 60000 // 1 minute
    }
  },

  // I/O Optimization
  io: {
    // File system operations
    fileSystem: {
      // Use streaming for large files
      streamThreshold: 1024 * 1024, // 1MB
      // Temporary file cleanup
      tempFileCleanup: 60 * 60 * 1000 // 1 hour
    },
    // Network operations
    network: {
      timeout: 30000, // 30 seconds
      retries: 3,
      keepAlive: true
    }
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  performanceConfig.redis.host = 'localhost';
  performanceConfig.database.pool.max = 5;
  performanceConfig.monitoring.metricsInterval = 60;
}

if (process.env.NODE_ENV === 'test') {
  performanceConfig.redis.host = 'localhost';
  performanceConfig.database.pool.max = 2;
  performanceConfig.monitoring.enabled = false;
}

// Export configuration
module.exports = performanceConfig;

// Type definitions for TypeScript
if (typeof module !== 'undefined' && module.exports) {
  module.exports.default = performanceConfig;
}
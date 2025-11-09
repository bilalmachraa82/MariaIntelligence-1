/**
 * OCR Providers Configuration for MariaIntelligence
 * Defines configuration for multiple OCR providers with failover strategies
 */

const OCRProviderConfig = {
  // Primary provider: Gemini API
  gemini: {
    enabled: !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    priority: 1,
    name: 'Google Gemini',
    description: 'Google\'s advanced AI model with excellent OCR capabilities',
    capabilities: {
      pdf: true,
      images: true,
      multiLanguage: true,
      structuredExtraction: true,
      qualityScore: 95
    },
    limits: {
      maxFileSize: '10MB',
      maxPages: 20,
      requestsPerMinute: 15,
      timeout: 30000
    },
    costs: {
      perPage: 0.001,
      perMB: 0.01
    },
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 1.5,
      initialDelay: 1000
    }
  },

  // Backup provider: Mistral via OpenRouter
  openrouter: {
    enabled: !!process.env.OPENROUTER_API_KEY,
    priority: 2,
    name: 'OpenRouter Mistral',
    description: 'Mistral AI via OpenRouter for OCR processing',
    capabilities: {
      pdf: true,
      images: true,
      multiLanguage: true,
      structuredExtraction: false,
      qualityScore: 85
    },
    limits: {
      maxFileSize: '8MB',
      maxPages: 15,
      requestsPerMinute: 10,
      timeout: 25000
    },
    costs: {
      perPage: 0.005,
      perMB: 0.02
    },
    retryConfig: {
      maxRetries: 2,
      backoffMultiplier: 2.0,
      initialDelay: 1500
    }
  },

  // Local fallback: Native PDF extraction
  native: {
    enabled: true, // Always available
    priority: 3,
    name: 'Native PDF Parser',
    description: 'Local PDF text extraction without AI',
    capabilities: {
      pdf: true,
      images: false,
      multiLanguage: false,
      structuredExtraction: false,
      qualityScore: 70
    },
    limits: {
      maxFileSize: '50MB',
      maxPages: 100,
      requestsPerMinute: 100,
      timeout: 10000
    },
    costs: {
      perPage: 0,
      perMB: 0
    },
    retryConfig: {
      maxRetries: 1,
      backoffMultiplier: 1.0,
      initialDelay: 500
    }
  }
};

/**
 * Failover strategies configuration
 */
const FailoverStrategies = {
  // Fast failover: Quick switch to next provider on failure
  fast: {
    description: 'Quick failover for time-sensitive operations',
    maxWaitTime: 10000,
    skipQualityValidation: true,
    acceptPartialResults: true
  },

  // Quality failover: Ensure high-quality results
  quality: {
    description: 'Prioritize result quality over speed',
    maxWaitTime: 60000,
    skipQualityValidation: false,
    acceptPartialResults: false,
    minQualityScore: 80
  },

  // Balanced failover: Balance between speed and quality
  balanced: {
    description: 'Balance speed and quality',
    maxWaitTime: 30000,
    skipQualityValidation: false,
    acceptPartialResults: true,
    minQualityScore: 60
  }
};

/**
 * Performance thresholds for automatic provider selection
 */
const PerformanceThresholds = {
  // Response time thresholds (milliseconds)
  responseTime: {
    excellent: 5000,
    good: 15000,
    acceptable: 30000,
    poor: 60000
  },

  // Quality score thresholds (0-100)
  qualityScore: {
    excellent: 95,
    good: 85,
    acceptable: 70,
    poor: 50
  },

  // Success rate thresholds (0-1)
  successRate: {
    excellent: 0.98,
    good: 0.90,
    acceptable: 0.80,
    poor: 0.60
  }
};

/**
 * Rate limiting configuration
 */
const RateLimiting = {
  global: {
    maxConcurrentRequests: 5,
    queueMaxSize: 50,
    requestTimeout: 120000
  },
  
  perProvider: {
    gemini: {
      requestsPerMinute: 15,
      burstLimit: 5,
      cooldownPeriod: 60000
    },
    openrouter: {
      requestsPerMinute: 10,
      burstLimit: 3,
      cooldownPeriod: 90000
    },
    native: {
      requestsPerMinute: 100,
      burstLimit: 20,
      cooldownPeriod: 0
    }
  }
};

/**
 * Quality validation rules
 */
const QualityValidation = {
  textLength: {
    minimum: 10,
    warning: 50
  },
  
  artifacts: {
    maxPercentage: 0.05, // 5% of characters can be artifacts
    patterns: [
      /[^\w\s\.,\-\(\)\[\]]/g, // Special characters
      /(.)\1{5,}/g, // Repeated characters
      /\s{5,}/g // Multiple spaces
    ]
  },

  bookingIndicators: {
    required: 2, // Minimum number of booking indicators
    patterns: [
      /check.?in/i,
      /check.?out/i,
      /guest/i,
      /booking/i,
      /reservation/i,
      /property/i,
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/, // Date pattern
      /€\s*\d+|USD\s*\d+|\$\s*\d+/, // Currency pattern
      /airbnb|booking\.com|expedia/i // Platform indicators
    ]
  },

  confidence: {
    minimum: 0.3,
    warning: 0.6,
    good: 0.8
  }
};

/**
 * Document type specific configurations
 */
const DocumentTypeConfig = {
  booking_pdf: {
    preferredProvider: 'gemini',
    qualityThreshold: 85,
    requiredFields: ['guestName', 'checkInDate', 'checkOutDate', 'propertyName'],
    processingTimeout: 45000
  },
  
  handwritten: {
    preferredProvider: 'gemini',
    qualityThreshold: 70,
    preprocessImage: true,
    processingTimeout: 60000
  },
  
  scanned_document: {
    preferredProvider: 'gemini',
    qualityThreshold: 80,
    preprocessImage: true,
    processingTimeout: 50000
  },
  
  simple_pdf: {
    preferredProvider: 'native',
    qualityThreshold: 60,
    processingTimeout: 15000
  }
};

/**
 * Get provider configuration
 */
function getProviderConfig(providerName) {
  return OCRProviderConfig[providerName] || null;
}

/**
 * Get available providers sorted by priority
 */
function getAvailableProviders() {
  return Object.entries(OCRProviderConfig)
    .filter(([_, config]) => config.enabled)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([name, config]) => ({ name, ...config }));
}

/**
 * Get failover strategy configuration
 */
function getFailoverStrategy(strategyName = 'balanced') {
  return FailoverStrategies[strategyName] || FailoverStrategies.balanced;
}

/**
 * Get optimal provider for document type
 */
function getOptimalProvider(documentType = 'booking_pdf', options = {}) {
  const docConfig = DocumentTypeConfig[documentType] || DocumentTypeConfig.booking_pdf;
  const availableProviders = getAvailableProviders();
  
  // Return preferred provider if available
  const preferred = availableProviders.find(p => p.name.toLowerCase().includes(docConfig.preferredProvider));
  if (preferred) {
    return {
      provider: preferred,
      config: docConfig
    };
  }
  
  // Return highest priority available provider
  return {
    provider: availableProviders[0] || null,
    config: docConfig
  };
}

/**
 * Validate provider configuration
 */
function validateConfiguration() {
  const issues = [];
  const availableProviders = getAvailableProviders();
  
  if (availableProviders.length === 0) {
    issues.push('No OCR providers are available');
  }
  
  if (availableProviders.length === 1 && availableProviders[0].name === 'Native PDF Parser') {
    issues.push('Only native PDF parser available - limited OCR capabilities');
  }
  
  // Check API keys
  if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    issues.push('Gemini API key not configured');
  }
  
  if (!process.env.OPENROUTER_API_KEY) {
    issues.push('OpenRouter API key not configured');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    availableProviders: availableProviders.length,
    recommendations: generateRecommendations(availableProviders)
  };
}

/**
 * Generate configuration recommendations
 */
function generateRecommendations(availableProviders) {
  const recommendations = [];
  
  if (availableProviders.length < 2) {
    recommendations.push('Configure at least 2 OCR providers for redundancy');
  }
  
  const hasAI = availableProviders.some(p => p.capabilities.structuredExtraction);
  if (!hasAI) {
    recommendations.push('Configure an AI-based provider (Gemini or OpenRouter) for better data extraction');
  }
  
  if (!availableProviders.find(p => p.name.includes('Gemini'))) {
    recommendations.push('Configure Gemini API for the best OCR quality and structured data extraction');
  }
  
  return recommendations;
}

module.exports = {
  OCRProviderConfig,
  FailoverStrategies,
  PerformanceThresholds,
  RateLimiting,
  QualityValidation,
  DocumentTypeConfig,
  getProviderConfig,
  getAvailableProviders,
  getFailoverStrategy,
  getOptimalProvider,
  validateConfiguration,
  generateRecommendations
};
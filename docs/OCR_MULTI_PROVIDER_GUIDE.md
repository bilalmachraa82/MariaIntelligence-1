# OCR Multi-Provider System - MariaIntelligence

A comprehensive OCR (Optical Character Recognition) system with multiple AI providers, intelligent failover, and advanced quality validation.

## 🌟 Features

- **Multi-Provider Support**: Gemini (primary), OpenRouter-Mistral (backup), Native PDF (fallback)
- **Intelligent Failover**: Automatic provider switching on failure
- **Quality Validation**: >95% accuracy targeting with confidence scoring
- **Performance Optimization**: <5 seconds processing time
- **Batch Processing**: Handle multiple documents concurrently
- **Rate Limiting**: Intelligent queuing and API quota management
- **Image Preprocessing**: Enhanced OCR accuracy through image optimization
- **Structured Data Extraction**: Specialized booking document processing

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  OCR Request    │───▶│ Multi-Provider  │───▶│ Quality         │
│  (PDF/Image)    │    │ Service         │    │ Validation      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    Provider Chain     │
                    │                       │
                    │ 1. Gemini (Primary)   │
                    │ 2. OpenRouter (Backup)│
                    │ 3. Native (Fallback)  │
                    └───────────────────────┘
```

## 🚀 Quick Start

### 1. Setup
```bash
# Run the automated setup script
./scripts/setup-ocr-multi-provider.sh

# Or manual installation
npm install sharp pdf-parse axios multer @types/multer
```

### 2. Configuration
Add to your `.env` file:
```env
# Primary Provider (Recommended)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Backup Provider (Optional but recommended)
OPENROUTER_API_KEY=your_openrouter_api_key

# OCR Configuration
OCR_MAX_CONCURRENT_REQUESTS=5
OCR_DEFAULT_TIMEOUT=60000
OCR_ENABLE_PREPROCESSING=true
```

### 3. API Usage

#### Process Single Document
```typescript
// POST /api/ocr/process
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('/api/ocr/process?provider=gemini', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

#### Process via Base64
```typescript
// POST /api/ocr/process
const response = await fetch('/api/ocr/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileBase64: 'base64_encoded_pdf...',
    mimeType: 'application/pdf',
    fileName: 'booking.pdf',
    preferredProvider: 'gemini'
  })
});
```

#### Batch Processing
```typescript
// POST /api/ocr/batch
const response = await fetch('/api/ocr/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documents: [
      { fileBase64: 'pdf1...', mimeType: 'application/pdf', fileName: 'doc1.pdf' },
      { fileBase64: 'pdf2...', mimeType: 'application/pdf', fileName: 'doc2.pdf' }
    ],
    concurrency: 3,
    preferredProvider: 'gemini'
  })
});
```

## 📚 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ocr/process` | Process single document |
| `POST` | `/api/ocr/batch` | Process multiple documents |
| `GET` | `/api/ocr/providers` | Get provider status |
| `GET` | `/api/ocr/status` | System health check |
| `POST` | `/api/ocr/validate` | Validate OCR results |

### Response Format

```typescript
interface OCRResponse {
  success: boolean;
  requestId: string;
  provider: string;
  confidence: number;
  processingTime: number;
  text: string;
  textLength: number;
  structuredData: {
    guestName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    propertyName?: string;
    propertyId?: string;
    totalAmount?: number;
    guestEmail?: string;
    guestPhone?: string;
    numGuests?: number;
    documentType: string;
  };
  missingFields: string[];
  metadata: {
    fileName?: string;
    fileSize?: string;
    mimeType: string;
    quality: 'high' | 'medium' | 'low';
    pageCount?: number;
    language?: string;
  };
}
```

## 🔧 Provider Configuration

### Primary: Google Gemini
- **Best quality** structured data extraction
- **Highest accuracy** for booking documents  
- **Multi-language** support
- **Cost**: ~$0.001 per page

```typescript
gemini: {
  enabled: true,
  priority: 1,
  capabilities: {
    pdf: true,
    images: true,
    structuredExtraction: true,
    qualityScore: 95
  }
}
```

### Backup: OpenRouter Mistral
- **Good quality** text extraction
- **Cost-effective** backup option
- **Reliable** fallback provider
- **Cost**: ~$0.005 per page

```typescript
openrouter: {
  enabled: true,
  priority: 2,
  capabilities: {
    pdf: true,
    images: true,
    qualityScore: 85
  }
}
```

### Fallback: Native PDF Parser
- **Always available** (no API required)
- **Fast processing** for simple PDFs
- **Limited** to text-based PDFs only
- **Cost**: Free

## 🎯 Quality Validation

The system performs comprehensive quality checks:

### Text Quality Metrics
- **Length validation**: Minimum character requirements
- **Artifact detection**: OCR noise filtering  
- **Language consistency**: Character pattern analysis
- **Structure analysis**: Document formatting score

### Booking Document Validation
- **Required fields**: Guest name, dates, property
- **Date consistency**: Check-in before check-out
- **Contact information**: Email/phone validation
- **Platform detection**: Airbnb, Booking.com, etc.

### Confidence Scoring
```typescript
// Composite confidence calculation
const confidence = 
  (ocrConfidence * 0.4) +
  (qualityScore * 0.3) +
  (validationScore * 0.3);
```

## 🚨 Error Handling & Failover

### Failover Chain
1. **Primary failure** → Switch to backup provider
2. **Backup failure** → Switch to fallback provider
3. **Complete failure** → Return best available result

### Retry Logic
- **Exponential backoff**: 1s, 2s, 4s delays
- **Provider-specific retries**: Gemini (3x), OpenRouter (2x), Native (1x)
- **Timeout handling**: 30s Gemini, 25s OpenRouter, 10s Native

### Error Recovery
```typescript
interface ErrorRecovery {
  maxRetries: number;
  backoffMultiplier: number;
  timeoutHandling: boolean;
  providerFallback: boolean;
}
```

## 📊 Performance Optimization

### Processing Targets
- **Response Time**: <5 seconds average
- **Accuracy**: >95% for booking documents
- **Throughput**: 10+ documents/minute
- **Availability**: 99.9% uptime

### Optimization Features
- **Concurrent processing**: 3-5 parallel requests
- **Image preprocessing**: Sharp-based enhancement
- **Rate limiting**: Intelligent API quota management
- **Caching**: Result caching for identical documents

## 🔍 Monitoring & Analytics

### Key Metrics
- **Provider success rates**
- **Average processing times**
- **Quality scores distribution**
- **Cost per document**

### Health Checks
```typescript
// GET /api/ocr/status
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  providers: {
    gemini: { available: true, health: { connected: true, latency: 1200 } },
    openrouter: { available: true, health: { connected: true, latency: 2100 } },
    native: { available: true, health: { connected: true } }
  },
  statistics: {
    availableProviders: 3,
    queueLength: 0,
    currentProcessing: 2
  }
}
```

## 🛠 Advanced Configuration

### Image Preprocessing
```typescript
const preprocessingConfig = {
  resize: { width: 2048, height: 2048 },
  enhance: {
    normalize: true,
    sharpen: true,
    brightness: 1.1,
    contrast: 1.2
  },
  format: { type: 'png', quality: 95 }
};
```

### Custom Validation Rules
```typescript
const validationRules = {
  textLength: { minimum: 20, warning: 50 },
  artifacts: { maxPercentage: 0.05 },
  bookingIndicators: { required: 2 },
  confidence: { minimum: 0.6, good: 0.8 }
};
```

### Document Type Specific Config
```typescript
const documentTypes = {
  booking_pdf: {
    preferredProvider: 'gemini',
    qualityThreshold: 85,
    requiredFields: ['guestName', 'checkInDate', 'checkOutDate']
  },
  handwritten: {
    preferredProvider: 'gemini',
    qualityThreshold: 70,
    preprocessImage: true
  }
};
```

## 🔐 Security & Privacy

### Data Handling
- **No persistent storage** of uploaded files
- **Temporary file cleanup** after processing
- **API key encryption** in environment variables
- **Request logging** without sensitive data

### Rate Limiting
```typescript
const rateLimits = {
  global: { maxConcurrentRequests: 5, queueMaxSize: 50 },
  perProvider: {
    gemini: { requestsPerMinute: 15, burstLimit: 5 },
    openrouter: { requestsPerMinute: 10, burstLimit: 3 }
  }
};
```

## 🧪 Testing

### Unit Tests
```bash
npm test -- --grep "OCR"
```

### Integration Tests
```bash
npm run test:integration -- ocr
```

### Load Testing
```bash
npm run test:load -- --endpoint /api/ocr/process --concurrent 10
```

## 🚀 Deployment

### Environment Variables
```env
# Required for primary provider
GOOGLE_GEMINI_API_KEY=your_key_here

# Optional for backup provider
OPENROUTER_API_KEY=your_key_here

# OCR Configuration
OCR_MAX_CONCURRENT_REQUESTS=5
OCR_DEFAULT_TIMEOUT=60000
OCR_ENABLE_PREPROCESSING=true
MAX_UPLOAD_MB=20
```

### Docker Configuration
```dockerfile
# Ensure Sharp works in Docker
RUN npm install --platform=linux --arch=x64 sharp
```

### Production Checklist
- [ ] API keys configured
- [ ] Upload directories created
- [ ] Rate limits configured
- [ ] Monitoring enabled
- [ ] Error logging setup
- [ ] Backup provider configured

## 🐛 Troubleshooting

### Common Issues

#### "No OCR providers available"
- Check API keys in `.env` file
- Verify network connectivity
- Review provider status: `GET /api/ocr/providers`

#### "Sharp installation failed"
- Install platform-specific Sharp: `npm install --platform=linux --arch=x64 sharp`
- Try alternative: `npm install jimp`

#### "PDF processing timeout"
- Increase timeout: `OCR_DEFAULT_TIMEOUT=90000`
- Reduce file size or complexity
- Check provider-specific limits

#### Low quality scores
- Enable image preprocessing
- Try different provider
- Check document quality/resolution

### Debug Mode
```env
DEBUG=ocr:*
LOG_LEVEL=debug
```

## 📈 Performance Tuning

### High Volume Processing
```typescript
const highVolumeConfig = {
  concurrency: 10,
  timeout: 30000,
  caching: true,
  preprocessing: false, // Disable for speed
  qualityThreshold: 60  // Lower for speed
};
```

### High Accuracy Processing
```typescript
const highAccuracyConfig = {
  concurrency: 2,
  timeout: 90000,
  preprocessing: true,
  qualityThreshold: 90,
  requireHighQuality: true
};
```

## 🤝 Contributing

### Adding New Providers
1. Extend `OCRMultiProviderService`
2. Add provider configuration
3. Implement provider-specific methods
4. Update failover chain
5. Add tests

### Custom Validation Rules
1. Extend `OCRValidationUtils`
2. Add rule definitions
3. Update validation logic
4. Test with various documents

## 📄 License

This OCR Multi-Provider System is part of MariaIntelligence and follows the project's licensing terms.

---

For support and questions, please refer to the main MariaIntelligence documentation or create an issue in the project repository.
# Especificação Técnica - Sistema Maria Faz

## 1. ARQUITETURA DE PROCESSAMENTO PDF

### Pipeline de Processamento Multi-Formato

```typescript
interface PDFProcessingPipeline {
  // Etapa 1: Detecção de Formato
  formatDetection: {
    detectDocumentType: (buffer: Buffer) => DocumentType;
    analyzeStructure: (buffer: Buffer) => StructureAnalysis;
    identifyLanguage: (text: string) => Language;
  };
  
  // Etapa 2: Extração Adaptada
  extraction: {
    digitalPDF: (buffer: Buffer) => Promise<ExtractedData>;
    scannedPDF: (buffer: Buffer) => Promise<ExtractedData>;
    handwrittenPDF: (buffer: Buffer) => Promise<ExtractedData>;
    mixedPDF: (buffer: Buffer) => Promise<ExtractedData>;
  };
  
  // Etapa 3: Validação e Normalização
  validation: {
    validateData: (data: ExtractedData) => ValidationResult;
    normalizeFields: (data: ExtractedData) => NormalizedData;
    enrichData: (data: NormalizedData) => EnrichedData;
  };
}
```

### Tipos de Documento Suportados

```typescript
enum DocumentType {
  BOOKING_CONFIRMATION = 'booking_confirmation',
  AIRBNB_RESERVATION = 'airbnb_reservation',
  DIRECT_BOOKING = 'direct_booking',
  CHECK_IN_FORM = 'check_in_form',
  CHECK_OUT_FORM = 'check_out_form',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  MAINTENANCE_REPORT = 'maintenance_report'
}

interface DocumentStructure {
  platform: 'booking' | 'airbnb' | 'expedia' | 'vrbo' | 'direct' | 'unknown';
  format: 'digital' | 'scanned' | 'handwritten' | 'mixed';
  language: 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it';
  confidence: number; // 0-100
  extractionMethod: 'text_layer' | 'ocr_standard' | 'ocr_handwriting' | 'hybrid';
}
```

## 2. ESPECIFICAÇÃO DETALHADA DOS ENDPOINTS

### API de Processamento PDF

```typescript
// POST /api/pdf/process-single
interface ProcessSinglePDFRequest {
  file: File; // Multipart upload
  options?: {
    forceOCR?: boolean;
    expectedType?: DocumentType;
    language?: string;
    enhancedExtraction?: boolean;
  };
}

interface ProcessSinglePDFResponse {
  success: boolean;
  documentId: string;
  extractedData: {
    type: DocumentType;
    confidence: number;
    fields: ReservationData | InvoiceData | MaintenanceData;
    rawText: string;
    metadata: DocumentMetadata;
  };
  warnings?: string[];
  processingTime: number;
}

// POST /api/pdf/process-batch
interface ProcessBatchPDFRequest {
  files: File[]; // Max 20 files
  options?: {
    parallel?: boolean;
    failFast?: boolean;
    notifyOnComplete?: boolean;
  };
}

interface ProcessBatchPDFResponse {
  batchId: string;
  status: 'processing' | 'completed' | 'failed';
  results: Array<{
    filename: string;
    status: 'success' | 'error';
    data?: ProcessSinglePDFResponse;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    processingTime: number;
  };
}
```

### API de Consultas IA

```typescript
// POST /api/ai/query
interface AIQueryRequest {
  query: string;
  context?: {
    timeframe?: {
      start: string;
      end: string;
    };
    properties?: number[];
    owners?: number[];
  };
  format?: 'text' | 'table' | 'chart';
}

interface AIQueryResponse {
  answer: string;
  confidence: number;
  sources: Array<{
    type: 'reservation' | 'property' | 'financial';
    id: number;
    relevance: number;
  }>;
  suggestedQuestions?: string[];
  chartData?: ChartConfiguration;
}

// GET /api/ai/insights
interface AIInsightsResponse {
  insights: Array<{
    type: 'anomaly' | 'trend' | 'recommendation' | 'alert';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data: any;
    actionable: boolean;
    suggestedActions?: string[];
  }>;
  generatedAt: string;
}
```

## 3. SCHEMA DA BASE DE DADOS

### Tabelas Principais

```sql
-- Propriedades com suporte completo a aliases
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    aliases TEXT[], -- Array de nomes alternativos
    owner_id INTEGER REFERENCES owners(id),
    address TEXT,
    coordinates POINT, -- Para geolocalização
    capacity INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    cleaning_cost DECIMAL(10,2),
    check_in_fee DECIMAL(10,2),
    commission_percentage DECIMAL(5,2),
    team_payment DECIMAL(10,2),
    cleaning_team_id INTEGER REFERENCES cleaning_teams(id),
    monthly_fixed_cost DECIMAL(10,2),
    active BOOLEAN DEFAULT true,
    metadata JSONB, -- Dados flexíveis específicos da propriedade
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reservas com tracking completo
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    guest_country VARCHAR(2), -- ISO country code
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INTEGER DEFAULT 1,
    num_adults INTEGER DEFAULT 1,
    num_children INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    check_in_fee DECIMAL(10,2),
    cleaning_fee DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    commission_fee DECIMAL(10,2),
    net_amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    platform VARCHAR(50), -- booking, airbnb, direct, etc.
    reference_number VARCHAR(100),
    status reservation_status DEFAULT 'confirmed',
    source_document_id INTEGER REFERENCES documents(id),
    special_requests TEXT,
    cancellation_policy TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documentos processados com metadados completos
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_path TEXT,
    document_type document_type_enum,
    platform VARCHAR(50),
    language VARCHAR(5),
    processing_status VARCHAR(20) DEFAULT 'pending',
    extraction_method VARCHAR(50),
    confidence_score INTEGER, -- 0-100
    raw_text TEXT,
    extracted_data JSONB,
    processing_errors TEXT[],
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Embeddings para IA com vetorização
CREATE TABLE knowledge_embeddings (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    content_type VARCHAR(50),
    source_table VARCHAR(50),
    source_id INTEGER,
    embedding vector(1536), -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Histórico de queries IA para aprendizagem
CREATE TABLE ai_query_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    query TEXT NOT NULL,
    normalized_query TEXT,
    response TEXT,
    confidence DECIMAL(3,2),
    execution_time_ms INTEGER,
    sources_used JSONB,
    feedback INTEGER, -- 1-5 rating
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Índices de Performance

```sql
-- Índices para queries frequentes
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_property ON reservations(property_id, status);
CREATE INDEX idx_reservations_guest ON reservations USING gin(to_tsvector('portuguese', guest_name));

-- Índices para busca textual
CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('portuguese', name || ' ' || array_to_string(aliases, ' ')));

-- Índices para IA
CREATE INDEX idx_embeddings_vector ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_query_history_search ON ai_query_history USING gin(to_tsvector('portuguese', query));
```

## 4. CASOS DE TESTE ESPECÍFICOS POR FORMATO

### Teste 1: PDF Digital Booking.com

```typescript
describe('Booking.com PDF Processing', () => {
  const testCases = [
    {
      file: 'booking_confirmation_standard.pdf',
      expectedData: {
        guestName: 'João Silva',
        checkInDate: '2024-07-15',
        checkOutDate: '2024-07-20',
        totalAmount: 450.00,
        property: 'Casa da Praia',
        platform: 'booking',
        reference: 'BK123456789'
      },
      minConfidence: 95
    },
    {
      file: 'booking_modified_cancellation.pdf',
      expectedData: {
        status: 'cancelled',
        cancellationDate: '2024-07-10'
      },
      minConfidence: 90
    },
    {
      file: 'booking_multilingual_french.pdf',
      expectedData: {
        language: 'fr',
        guestName: 'Marie Dubois'
      },
      minConfidence: 85
    }
  ];

  testCases.forEach(testCase => {
    it(`should extract data from ${testCase.file}`, async () => {
      const result = await pdfProcessor.process(testCase.file);
      
      expect(result.confidence).toBeGreaterThan(testCase.minConfidence);
      expect(result.extractedData).toMatchObject(testCase.expectedData);
      expect(result.processingTime).toBeLessThan(30000); // 30s max
    });
  });
});
```

### Teste 2: PDF Escaneado com OCR

```typescript
describe('Scanned PDF OCR Processing', () => {
  const ocrTestCases = [
    {
      file: 'scanned_airbnb_receipt.pdf',
      ocrMethod: 'standard',
      expectedExtraction: {
        guestName: expect.stringMatching(/^[A-Za-z\s]+$/),
        dates: expect.arrayContaining([
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
        ]),
        amounts: expect.arrayContaining([
          expect.numberMatching(/^\d+\.\d{2}$/)
        ])
      },
      minConfidence: 80
    },
    {
      file: 'handwritten_checkin_form.pdf',
      ocrMethod: 'handwriting',
      expectedExtraction: {
        fields: expect.objectContaining({
          guestName: expect.any(String),
          checkInDate: expect.any(String)
        })
      },
      minConfidence: 70
    }
  ];

  ocrTestCases.forEach(testCase => {
    it(`should process ${testCase.file} with ${testCase.ocrMethod} OCR`, async () => {
      const result = await pdfProcessor.processWithOCR(
        testCase.file, 
        { method: testCase.ocrMethod }
      );
      
      expect(result.confidence).toBeGreaterThan(testCase.minConfidence);
      expect(result.extractedData).toEqual(testCase.expectedExtraction);
    });
  });
});
```

### Teste 3: Processamento Batch

```typescript
describe('Batch PDF Processing', () => {
  it('should process multiple PDFs simultaneously', async () => {
    const files = [
      'booking_1.pdf',
      'airbnb_1.pdf', 
      'direct_booking_1.pdf',
      'scanned_receipt_1.pdf',
      'handwritten_form_1.pdf'
    ];

    const batchResult = await pdfProcessor.processBatch(files, {
      parallel: true,
      maxConcurrency: 3
    });

    expect(batchResult.summary.total).toBe(5);
    expect(batchResult.summary.successful).toBeGreaterThan(4);
    expect(batchResult.summary.processingTime).toBeLessThan(120000); // 2min max
    
    // Verificar que pelo menos 80% foram processados com sucesso
    const successRate = batchResult.summary.successful / batchResult.summary.total;
    expect(successRate).toBeGreaterThan(0.8);
  });

  it('should handle errors gracefully in batch processing', async () => {
    const files = [
      'valid_booking.pdf',
      'corrupted_file.pdf',
      'not_a_pdf.txt',
      'empty_file.pdf'
    ];

    const batchResult = await pdfProcessor.processBatch(files, {
      failFast: false
    });

    expect(batchResult.results).toHaveLength(4);
    expect(batchResult.results[0].status).toBe('success');
    expect(batchResult.results[1].status).toBe('error');
    expect(batchResult.results[2].status).toBe('error');
    expect(batchResult.results[3].status).toBe('error');
  });
});
```

## 5. TESTES DE INTEGRAÇÃO IA

### Teste Consultas Base de Dados

```typescript
describe('AI Database Queries', () => {
  beforeEach(async () => {
    // Setup test data
    await setupTestDatabase();
  });

  const queryTests = [
    {
      query: "Qual foi a receita total de Janeiro?",
      expectedSQL: expect.stringContaining("SUM(total_amount)"),
      expectedResponse: expect.stringMatching(/€\s*\d+[,.]?\d*/),
      maxResponseTime: 5000
    },
    {
      query: "Que propriedades têm check-in amanhã?",
      expectedSQL: expect.stringContaining("check_in_date"),
      expectedResponse: expect.arrayContaining([
        expect.objectContaining({
          propertyName: expect.any(String),
          guestName: expect.any(String)
        })
      ]),
      maxResponseTime: 3000
    },
    {
      query: "Quantas limpezas estão pendentes esta semana?",
      expectedSQL: expect.stringContaining("status = 'pending'"),
      expectedResponse: expect.stringMatching(/\d+\s+limpezas?/),
      maxResponseTime: 2000
    }
  ];

  queryTests.forEach(test => {
    it(`should handle query: "${test.query}"`, async () => {
      const startTime = Date.now();
      const result = await aiService.processQuery(test.query);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(test.maxResponseTime);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.answer).toEqual(test.expectedResponse);
    });
  });
});
```

### Teste Performance e Escalabilidade

```typescript
describe('Performance Tests', () => {
  it('should handle 1000 concurrent AI queries', async () => {
    const queries = Array(1000).fill(0).map((_, i) => 
      `Qual a receita da propriedade ${i % 20}?`
    );

    const startTime = Date.now();
    const results = await Promise.all(
      queries.map(q => aiService.processQuery(q))
    );
    const totalTime = Date.now() - startTime;

    expect(results).toHaveLength(1000);
    expect(totalTime).toBeLessThan(30000); // 30s para 1000 queries
    
    const successfulQueries = results.filter(r => r.confidence > 0.7);
    expect(successfulQueries.length / results.length).toBeGreaterThan(0.95);
  });

  it('should maintain database performance under load', async () => {
    // Simular 10000 reservas
    await createTestReservations(10000);

    const complexQuery = `
      Mostra-me um relatório completo das 5 propriedades 
      com maior receita nos últimos 6 meses, incluindo 
      taxa de ocupação e custos de manutenção
    `;

    const result = await aiService.processQuery(complexQuery);
    
    expect(result.processingTime).toBeLessThan(10000); // 10s max
    expect(result.confidence).toBeGreaterThan(0.85);
  });
});
```

## 6. CONFIGURAÇÃO DE DEPLOYMENT

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-por \
    ghostscript \
    imagemagick

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

EXPOSE 5000

CMD ["npm", "start"]
```

### Docker Compose para Desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@postgres:5432/maria_faz
      - GOOGLE_GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=maria_faz
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Esta especificação técnica garante uma implementação robusta com testes abrangentes, suporte completo a diferentes formatos de PDF e integração profunda com IA. O sistema está preparado para ser replicado em qualquer plataforma mantendo todas as funcionalidades críticas.
# Implementação Completa dos Serviços de IA

## Configuração dos Modelos IA

### Gemini 2.5 Flash (Serviço Principal)
```typescript
export enum GeminiModel {
  TEXT = 'gemini-2.5-flash-preview-05-20',
  VISION = 'gemini-2.5-flash-preview-05-20', 
  FLASH = 'gemini-2.5-flash-preview-05-20',
  AUDIO = 'gemini-2.5-flash-preview-05-20'
}

interface GenerationConfig {
  temperature: 0.1,           // Baixa para respostas factuais
  topK: 40,                   // Diversidade controlada
  topP: 0.95,                 // Núcleo de probabilidade
  maxOutputTokens: 8192,      // Tokens máximos por resposta
  candidateCount: 1           // Uma resposta por vez
}
```

### Sistema de Rate Limiting Implementado
```typescript
// Configuração por serviço
const RATE_LIMITS = {
  gemini: {
    requestsPerMinute: 60,
    requestsPerDay: 1500,
    concurrentRequests: 5
  },
  openrouter: {
    requestsPerMinute: 20,
    requestsPerDay: 500,
    concurrentRequests: 3
  },
  rolm: {
    requestsPerMinute: 10,
    requestsPerDay: 100,
    concurrentRequests: 2
  }
}
```

## Pipeline Completo de Processamento PDF

### 1. Detecção Automática de Formato
```typescript
async function detectDocumentFormat(pdfBuffer: Buffer): Promise<DocumentFormat> {
  const text = await extractTextLayer(pdfBuffer);
  
  // Detecção por padrões textuais
  const patterns = {
    booking: /booking\.com|confirmation number|Buchungsbestätigung/i,
    airbnb: /airbnb|reservation code|trip/i,
    expedia: /expedia|itinerary number/i,
    direct: /reserva direta|direct booking/i,
    handwritten: await detectHandwriting(pdfBuffer)
  };
  
  return {
    platform: detectPlatform(text, patterns),
    structure: detectStructure(pdfBuffer),
    confidence: calculateConfidence(text, patterns),
    extractionMethod: selectExtractionMethod(structure)
  };
}
```

### 2. Extração Multi-Modal
```typescript
class PDFProcessor {
  async processDocument(buffer: Buffer): Promise<ExtractionResult> {
    const format = await this.detectFormat(buffer);
    
    switch (format.extractionMethod) {
      case 'text_layer':
        return await this.extractFromTextLayer(buffer);
      
      case 'ocr_standard':
        return await this.processWithOCR(buffer, 'openrouter');
      
      case 'ocr_handwriting':
        return await this.processWithOCR(buffer, 'rolm');
      
      case 'hybrid':
        return await this.hybridExtraction(buffer);
    }
  }
  
  private async hybridExtraction(buffer: Buffer): Promise<ExtractionResult> {
    // Combina texto nativo + OCR para máxima precisão
    const textLayer = await this.extractFromTextLayer(buffer);
    const ocrResult = await this.processWithOCR(buffer, 'gemini');
    
    return this.mergeResults(textLayer, ocrResult);
  }
}
```

### 3. Validação e Normalização
```typescript
interface DataValidator {
  validateReservation(data: ExtractedData): ValidationResult {
    const errors: string[] = [];
    
    // Validação de datas
    if (!this.isValidDate(data.checkInDate)) {
      errors.push('Data check-in inválida');
    }
    
    if (!this.isValidDate(data.checkOutDate)) {
      errors.push('Data check-out inválida');
    }
    
    // Validação de valores monetários
    if (!this.isValidAmount(data.totalAmount)) {
      errors.push('Valor total inválido');
    }
    
    // Validação de propriedade
    const property = this.findProperty(data.propertyName);
    if (!property) {
      errors.push(`Propriedade não encontrada: ${data.propertyName}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      confidence: this.calculateValidationConfidence(data),
      normalizedData: this.normalizeData(data)
    };
  }
}
```

## Sistema RAG (Retrieval-Augmented Generation)

### Configuração de Embeddings
```typescript
class RAGService {
  private async generateEmbeddings(content: string): Promise<number[]> {
    // Usa Gemini para gerar embeddings
    const response = await fetch(`${GEMINI_API_BASE}/models/text-embedding-004:embedContent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: content }]
        }
      })
    });
    
    const result = await response.json();
    return result.embedding.values;
  }
  
  private async findSimilarContent(query: string, limit: number = 5): Promise<SimilarContent[]> {
    const queryEmbedding = await this.generateEmbeddings(query);
    
    // Busca vetorial no PostgreSQL com pgVector
    const results = await db.execute(sql`
      SELECT content, metadata, 
             1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM knowledge_embeddings
      WHERE 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);
    
    return results.rows;
  }
}
```

### Prompt Engineering para Consultas
```typescript
const SYSTEM_PROMPTS = {
  financial_query: `
    Você é um assistente financeiro especializado em gestão de propriedades.
    Use apenas os dados fornecidos no contexto.
    Seja preciso com valores monetários e datas.
    Se não tiver informação suficiente, diga claramente.
    Responda sempre em português.
  `,
  
  property_query: `
    Você é um especialista em gestão de propriedades.
    Use apenas dados reais da base de dados fornecida.
    Inclua sempre o nome da propriedade nas respostas.
    Forneça informações sobre ocupação, limpeza e manutenção quando relevante.
  `,
  
  operational_query: `
    Você é um assistente operacional para alojamento local.
    Foque em check-ins, check-outs, limpezas e tarefas.
    Use apenas informações verificáveis da base de dados.
    Sugira ações concretas quando apropriado.
  `
};
```

## Lições Aprendidas Críticas

### 1. Processamento PDF - Problemas e Soluções

**Problema:** PDFs Booking.com têm layouts inconsistentes
**Solução:** Sistema de templates flexíveis com múltiplos padrões de extração

```typescript
const BOOKING_PATTERNS = [
  {
    version: 'v1_2024',
    guestNamePattern: /Guest name:\s*([^\n]+)/i,
    datesPattern: /Check-in:\s*(\d{1,2}\/\d{1,2}\/\d{4}).*Check-out:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    amountPattern: /Total price:\s*€\s*([\d,]+\.?\d*)/i
  },
  {
    version: 'v2_2024', 
    guestNamePattern: /Nome do hóspede:\s*([^\n]+)/i,
    datesPattern: /Entrada:\s*(\d{1,2}\/\d{1,2}\/\d{4}).*Saída:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    amountPattern: /Preço total:\s*€\s*([\d,]+\.?\d*)/i
  }
];
```

**Problema:** OCR de manuscritos com baixa precisão
**Solução:** Pipeline em cascata com validação humana

```typescript
async function processHandwrittenPDF(buffer: Buffer): Promise<ExtractionResult> {
  // Tentativa 1: RolmOCR especializado
  let result = await rolmService.processHandwriting(buffer);
  
  if (result.confidence < 70) {
    // Tentativa 2: Gemini Vision
    result = await geminiService.processWithVision(buffer);
  }
  
  if (result.confidence < 60) {
    // Flag para revisão manual
    result.requiresManualReview = true;
    await this.queueForManualReview(buffer, result);
  }
  
  return result;
}
```

### 2. IA e Base de Dados - Desafios Resolvidos

**Problema:** IA gerando dados falsos ("alucinações")
**Solução:** Validação rigorosa contra base de dados real

```typescript
class AIResponseValidator {
  async validateResponse(query: string, response: string, sources: any[]): Promise<ValidationResult> {
    // Extrair claims factuais da resposta
    const claims = await this.extractFactualClaims(response);
    
    // Verificar cada claim contra a base de dados
    const verificationResults = await Promise.all(
      claims.map(claim => this.verifyClaim(claim))
    );
    
    // Calcular confiança baseada na verificação
    const verifiedClaims = verificationResults.filter(r => r.verified).length;
    const confidence = verifiedClaims / claims.length;
    
    if (confidence < 0.8) {
      return {
        approved: false,
        reason: 'Informações não verificáveis na base de dados',
        suggestedResponse: await this.generateConservativeResponse(query, sources)
      };
    }
    
    return { approved: true, confidence };
  }
}
```

**Problema:** Consultas complexas geravam SQL incorreto
**Solução:** Decomposição de queries em sub-consultas validadas

```typescript
class QueryDecomposer {
  async processComplexQuery(naturalLanguageQuery: string): Promise<QueryResult> {
    // Decompor em sub-queries simples
    const subQueries = await this.decomposeQuery(naturalLanguageQuery);
    
    // Executar cada sub-query separadamente
    const subResults = await Promise.all(
      subQueries.map(sq => this.executeSimpleQuery(sq))
    );
    
    // Combinar resultados de forma coerente
    return this.combineResults(subResults, naturalLanguageQuery);
  }
  
  private async decomposeQuery(query: string): Promise<SimpleQuery[]> {
    // Identificar entidades mencionadas
    const entities = await this.extractEntities(query);
    
    // Identificar métricas solicitadas
    const metrics = await this.extractMetrics(query);
    
    // Identificar filtros temporais
    const timeframes = await this.extractTimeframes(query);
    
    // Gerar sub-queries baseadas nos componentes
    return this.generateSubQueries(entities, metrics, timeframes);
  }
}
```

### 3. Sistema de Orçamentos - Implementação Robusta

**Problema:** Cálculo automático de preços inconsistente
**Solução:** Engine de preços baseado em regras com override manual

```typescript
class PricingEngine {
  calculatePrice(params: QuotationParams): PricingResult {
    let basePrice = this.getBasePriceByArea(params.propertyArea);
    
    // Multiplicadores por tipo de propriedade
    const typeMultiplier = this.getTypeMultiplier(params.propertyType);
    basePrice *= typeMultiplier;
    
    // Ajustes por número de divisões
    const roomAdjustment = this.calculateRoomAdjustment(params.bedrooms, params.bathrooms);
    basePrice += roomAdjustment;
    
    // Serviços adicionais
    let additionalServices = 0;
    if (params.includeSupplies) additionalServices += basePrice * 0.15;
    if (params.includeLaundry) additionalServices += 25;
    if (params.includeIroning) additionalServices += 15;
    if (params.includeDisinfection) additionalServices += basePrice * 0.10;
    if (params.includeWindowCleaning) additionalServices += 30;
    
    // Horas extra
    const extraHoursPrice = params.extraHoursQuantity * 15;
    
    const totalPrice = basePrice + additionalServices + extraHoursPrice;
    
    return {
      basePrice,
      additionalServices,
      extraHoursPrice,
      totalPrice,
      breakdown: this.generateBreakdown(params, basePrice, additionalServices, extraHoursPrice)
    };
  }
}
```

**Problema:** Templates PDF inconsistentes
**Solução:** Sistema de templates com componentes reutilizáveis

```typescript
class PDFGenerator {
  async generateQuotationPDF(quotation: Quotation): Promise<Buffer> {
    const doc = new PDFDocument();
    
    // Header com logo e dados empresa
    await this.addHeader(doc);
    
    // Dados do cliente
    this.addClientSection(doc, quotation);
    
    // Detalhes da propriedade
    this.addPropertySection(doc, quotation);
    
    // Breakdown de preços
    this.addPricingTable(doc, quotation);
    
    // Termos e condições
    this.addTermsSection(doc);
    
    // Footer com contactos
    this.addFooter(doc);
    
    return doc.end();
  }
}
```

### 4. Performance e Escalabilidade

**Problema:** Consultas IA lentas com grande volume de dados
**Solução:** Sistema de cache inteligente com invalidação automática

```typescript
class IntelligentCache {
  private cache = new Map<string, CacheEntry>();
  
  async getCachedResponse(query: string): Promise<string | null> {
    const normalizedQuery = this.normalizeQuery(query);
    const entry = this.cache.get(normalizedQuery);
    
    if (entry && !this.isExpired(entry)) {
      // Verificar se dados subjacentes mudaram
      const dataFingerprint = await this.generateDataFingerprint(entry.relatedTables);
      
      if (dataFingerprint === entry.dataFingerprint) {
        return entry.response;
      } else {
        // Dados mudaram, invalidar cache
        this.cache.delete(normalizedQuery);
      }
    }
    
    return null;
  }
  
  async cacheResponse(query: string, response: string, relatedTables: string[]): Promise<void> {
    const normalizedQuery = this.normalizeQuery(query);
    const dataFingerprint = await this.generateDataFingerprint(relatedTables);
    
    this.cache.set(normalizedQuery, {
      response,
      relatedTables,
      dataFingerprint,
      timestamp: Date.now(),
      accessCount: 0
    });
  }
}
```

## Configuração de Deployment Otimizada

### Docker com Multi-Stage Build
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage  
FROM node:20-alpine AS runtime
RUN apk add --no-cache \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-por \
    imagemagick

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Otimizações para IA
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV UV_THREADPOOL_SIZE=128

EXPOSE 5000
CMD ["npm", "start"]
```

### PostgreSQL com Otimizações para IA
```sql
-- Configurações específicas para workload IA
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices otimizados para busca semântica
CREATE INDEX CONCURRENTLY idx_embeddings_cosine 
ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Índices para busca textual
CREATE INDEX CONCURRENTLY idx_reservations_fulltext 
ON reservations USING gin(to_tsvector('portuguese', guest_name));
```

Esta documentação representa o conhecimento técnico completo adquirido durante o desenvolvimento, incluindo todas as soluções implementadas para os desafios encontrados.
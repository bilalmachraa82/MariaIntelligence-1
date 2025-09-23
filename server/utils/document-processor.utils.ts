import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import VectorEmbeddingsService from './vector-embeddings.utils.js';

interface DocumentChunk {
  content: string;
  metadata: Record<string, any>;
  chunkIndex: number;
  totalChunks: number;
}

interface ProcessingResult {
  documentId: string;
  chunks: number;
  success: boolean;
  error?: string;
}

export class DocumentProcessor {
  private vectorService: VectorEmbeddingsService;
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(pool: Pool, chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.vectorService = new VectorEmbeddingsService(pool);
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  /**
   * Semantic chunking strategy that preserves context
   */
  public semanticChunking(text: string, metadata: Record<string, any> = {}): DocumentChunk[] {
    // Remove extra whitespace and normalize
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length <= this.chunkSize) {
      return [{
        content: cleanText,
        metadata: { ...metadata, chunkType: 'complete' },
        chunkIndex: 0,
        totalChunks: 1
      }];
    }

    const chunks: DocumentChunk[] = [];
    const sentences = this.splitIntoSentences(cleanText);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
      
      if (potentialChunk.length > this.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            ...metadata,
            chunkType: 'semantic',
            sentenceStart: Math.max(0, i - this.getSentenceCount(currentChunk)),
            sentenceEnd: i - 1
          },
          chunkIndex: chunkIndex++,
          totalChunks: 0 // Will be updated later
        });
        
        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, this.chunkOverlap);
        currentChunk = overlapText + (overlapText ? ' ' : '') + sentence;
      } else {
        currentChunk = potentialChunk;
      }
    }
    
    // Add final chunk if any content remains
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          ...metadata,
          chunkType: 'semantic',
          sentenceStart: Math.max(0, sentences.length - this.getSentenceCount(currentChunk)),
          sentenceEnd: sentences.length - 1
        },
        chunkIndex: chunkIndex,
        totalChunks: 0
      });
    }
    
    // Update total chunks count
    chunks.forEach(chunk => chunk.totalChunks = chunks.length);
    
    return chunks;
  }

  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting that handles Portuguese and English
    const sentences = text
      .split(/(?<=[.!?])\s+(?=[A-Z\u00C0-\u017F])/) // Split on sentence boundaries
      .filter(sentence => sentence.trim().length > 0)
      .map(sentence => sentence.trim());
    
    return sentences;
  }

  private getSentenceCount(text: string): number {
    return this.splitIntoSentences(text).length;
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text;
    
    const sentences = this.splitIntoSentences(text);
    let overlap = '';
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const potentialOverlap = sentences[i] + (overlap ? ' ' : '') + overlap;
      if (potentialOverlap.length > overlapSize) break;
      overlap = potentialOverlap;
    }
    
    return overlap;
  }

  /**
   * Process text document and add to knowledge base
   */
  public async processTextDocument(
    content: string,
    metadata: Record<string, any>,
    domain: string = 'general'
  ): Promise<ProcessingResult> {
    try {
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`📄 Processing document: ${metadata.filename || documentId}`);
      
      const chunks = this.semanticChunking(content, {
        ...metadata,
        documentId,
        processedAt: new Date().toISOString()
      });
      
      console.log(`🧩 Created ${chunks.length} semantic chunks`);
      
      // Process chunks in batches for better performance
      const batchSize = 10;
      let processedChunks = 0;
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const batchDocs = batch.map(chunk => ({
          content: chunk.content,
          metadata: chunk.metadata,
          domain
        }));
        
        await this.vectorService.batchAddDocuments(batchDocs);
        processedChunks += batch.length;
        
        console.log(`📊 Processed ${processedChunks}/${chunks.length} chunks`);
      }
      
      return {
        documentId,
        chunks: chunks.length,
        success: true
      };
    } catch (error) {
      console.error('❌ Document processing failed:', error);
      return {
        documentId: 'failed',
        chunks: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process PDF document (requires external PDF parser)
   */
  public async processPDFDocument(
    filePath: string,
    metadata: Record<string, any> = {},
    domain: string = 'general'
  ): Promise<ProcessingResult> {
    try {
      // Note: In production, you'd use a PDF parser like pdf-parse
      // For now, we'll simulate PDF processing
      
      console.log(`📜 Processing PDF: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`PDF file not found: ${filePath}`);
      }
      
      const fileStats = fs.statSync(filePath);
      const filename = path.basename(filePath);
      
      // Mock PDF content extraction
      const mockContent = `
        Documento PDF: ${filename}
        Conteúdo extraído do PDF com informações sobre propriedades, 
        procedimentos de limpeza, manutenção e diretrizes para hóspedes.
        Este é um conteúdo de exemplo que seria extraído do PDF real.
      `;
      
      return await this.processTextDocument(mockContent, {
        ...metadata,
        filename,
        fileSize: fileStats.size,
        fileType: 'pdf',
        sourcePath: filePath
      }, domain);
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      return {
        documentId: 'failed',
        chunks: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process structured data (JSON, database records)
   */
  public async processStructuredData(
    data: Record<string, any>,
    metadata: Record<string, any> = {},
    domain: string = 'general'
  ): Promise<ProcessingResult> {
    try {
      console.log(`📋 Processing structured data for domain: ${domain}`);
      
      // Convert structured data to searchable text
      const textContent = this.structuredDataToText(data);
      
      return await this.processTextDocument(textContent, {
        ...metadata,
        dataType: 'structured',
        originalKeys: Object.keys(data)
      }, domain);
    } catch (error) {
      console.error('❌ Structured data processing failed:', error);
      return {
        documentId: 'failed',
        chunks: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private structuredDataToText(data: Record<string, any>, prefix: string = ''): string {
    let text = '';
    
    for (const [key, value] of Object.entries(data)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        text += this.structuredDataToText(value, fullKey);
      } else if (Array.isArray(value)) {
        text += `${fullKey}: ${value.join(', ')}. `;
      } else {
        text += `${fullKey}: ${value}. `;
      }
    }
    
    return text;
  }

  /**
   * Batch process multiple documents
   */
  public async batchProcessDocuments(
    documents: Array<{
      content?: string;
      filePath?: string;
      data?: Record<string, any>;
      metadata: Record<string, any>;
      domain: string;
      type: 'text' | 'pdf' | 'structured';
    }>
  ): Promise<ProcessingResult[]> {
    console.log(`📦 Batch processing ${documents.length} documents...`);
    
    const results: ProcessingResult[] = [];
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      let result: ProcessingResult;
      
      try {
        console.log(`🔍 Processing document ${i + 1}/${documents.length}: ${doc.type}`);
        
        switch (doc.type) {
          case 'text':
            if (!doc.content) throw new Error('Text content is required');
            result = await this.processTextDocument(doc.content, doc.metadata, doc.domain);
            break;
          case 'pdf':
            if (!doc.filePath) throw new Error('File path is required for PDF');
            result = await this.processPDFDocument(doc.filePath, doc.metadata, doc.domain);
            break;
          case 'structured':
            if (!doc.data) throw new Error('Data object is required');
            result = await this.processStructuredData(doc.data, doc.metadata, doc.domain);
            break;
          default:
            throw new Error(`Unsupported document type: ${doc.type}`);
        }
        
        results.push(result);
        
        if ((i + 1) % 5 === 0) {
          console.log(`📊 Batch progress: ${i + 1}/${documents.length} documents processed`);
        }
      } catch (error) {
        console.error(`❌ Failed to process document ${i + 1}:`, error);
        results.push({
          documentId: 'failed',
          chunks: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
    
    console.log(`✅ Batch processing complete: ${successful}/${documents.length} documents, ${totalChunks} total chunks`);
    
    return results;
  }

  /**
   * Optimize chunk sizes based on content analysis
   */
  public analyzeOptimalChunkSize(content: string): number {
    const sentences = this.splitIntoSentences(content);
    const avgSentenceLength = content.length / sentences.length;
    
    // Optimize chunk size based on content characteristics
    if (avgSentenceLength < 50) {
      return 1500; // Short sentences, larger chunks
    } else if (avgSentenceLength > 150) {
      return 800; // Long sentences, smaller chunks
    } else {
      return 1000; // Default size
    }
  }

  /**
   * Extract metadata from content
   */
  public extractContentMetadata(content: string): Record<string, any> {
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = this.splitIntoSentences(content).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    // Detect language (simple heuristic)
    const portugueseWords = ['o', 'a', 'e', 'de', 'da', 'do', 'em', 'na', 'no', 'para', 'com'];
    const words = content.toLowerCase().split(/\s+/);
    const portugueseCount = words.filter(word => portugueseWords.includes(word)).length;
    const language = portugueseCount > words.length * 0.02 ? 'pt' : 'en';
    
    return {
      wordCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      estimatedReadingTime: Math.ceil(wordCount / 200), // minutes
      language,
      contentLength: content.length
    };
  }
}

export default DocumentProcessor;
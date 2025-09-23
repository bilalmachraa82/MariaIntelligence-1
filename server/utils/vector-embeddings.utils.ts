import { Pool } from 'pg';
import { createHash } from 'crypto';

// Sentence transformer model for multilingual embeddings
const MODEL_NAME = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
const EMBEDDING_DIMENSION = 384;
const SIMILARITY_THRESHOLD = 0.7;

interface EmbeddingData {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
  created_at: Date;
}

interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  similarity: number;
  chunk_id: string;
}

export class VectorEmbeddingsService {
  private pool: Pool;
  private modelLoaded = false;
  private transformerModel: any;

  constructor(pool: Pool) {
    this.pool = pool;
    this.initializeVectorExtension();
  }

  private async initializeVectorExtension(): Promise<void> {
    try {
      // Enable pgvector extension
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
      
      // Create embeddings table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS knowledge_embeddings (
          id VARCHAR(255) PRIMARY KEY,
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          embedding VECTOR(${EMBEDDING_DIMENSION}),
          content_hash VARCHAR(64) UNIQUE,
          domain VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Create indexes for faster similarity search
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS knowledge_embeddings_embedding_idx 
        ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS knowledge_embeddings_domain_idx 
        ON knowledge_embeddings (domain);
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS knowledge_embeddings_metadata_idx 
        ON knowledge_embeddings USING gin (metadata);
      `);

      console.log('✅ Vector database initialized with pgvector');
    } catch (error) {
      console.error('❌ Failed to initialize vector extension:', error);
      throw error;
    }
  }

  private async loadModel(): Promise<void> {
    if (this.modelLoaded) return;

    try {
      // In production, you'd use a proper sentence transformer service
      // For now, we'll use a mock implementation or call to external API
      console.log(`🤖 Loading embedding model: ${MODEL_NAME}`);
      this.modelLoaded = true;
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error);
      throw error;
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    await this.loadModel();
    
    try {
      // Mock embedding generation - in production, use actual transformer
      // This would typically call a sentence transformer service
      const mockEmbedding = new Array(EMBEDDING_DIMENSION)
        .fill(0)
        .map(() => Math.random() * 2 - 1); // Random values between -1 and 1
      
      // Normalize the vector
      const norm = Math.sqrt(mockEmbedding.reduce((sum, val) => sum + val * val, 0));
      return mockEmbedding.map(val => val / norm);
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw error;
    }
  }

  public async addToKnowledgeBase(
    content: string,
    metadata: Record<string, any> = {},
    domain: string = 'general'
  ): Promise<string> {
    try {
      const contentHash = createHash('sha256').update(content).digest('hex');
      const id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if content already exists
      const existing = await this.pool.query(
        'SELECT id FROM knowledge_embeddings WHERE content_hash = $1',
        [contentHash]
      );

      if (existing.rows.length > 0) {
        console.log(`📄 Content already exists in knowledge base: ${existing.rows[0].id}`);
        return existing.rows[0].id;
      }

      const embedding = await this.generateEmbedding(content);
      
      await this.pool.query(
        `INSERT INTO knowledge_embeddings 
         (id, content, metadata, embedding, content_hash, domain) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, content, JSON.stringify(metadata), JSON.stringify(embedding), contentHash, domain]
      );

      console.log(`✅ Added to knowledge base: ${id} (${domain})`);
      return id;
    } catch (error) {
      console.error('❌ Failed to add to knowledge base:', error);
      throw error;
    }
  }

  public async semanticSearch(
    query: string,
    limit: number = 5,
    domain?: string,
    threshold: number = SIMILARITY_THRESHOLD
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      let sql = `
        SELECT 
          content,
          metadata,
          (1 - (embedding <=> $1::vector)) as similarity,
          id as chunk_id
        FROM knowledge_embeddings
        WHERE (1 - (embedding <=> $1::vector)) > $2
      `;
      
      const params: any[] = [JSON.stringify(queryEmbedding), threshold];
      
      if (domain) {
        sql += ' AND domain = $3';
        params.push(domain);
        sql += ` ORDER BY similarity DESC LIMIT $4`;
        params.push(limit);
      } else {
        sql += ` ORDER BY similarity DESC LIMIT $3`;
        params.push(limit);
      }

      const result = await this.pool.query(sql, params);
      
      return result.rows.map(row => ({
        content: row.content,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
        similarity: parseFloat(row.similarity),
        chunk_id: row.chunk_id
      }));
    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      throw error;
    }
  }

  public async getRelevantContext(
    query: string,
    maxTokens: number = 2000,
    domain?: string
  ): Promise<string> {
    try {
      const results = await this.semanticSearch(query, 10, domain);
      
      let context = '';
      let tokenCount = 0;
      
      for (const result of results) {
        const contentTokens = result.content.split(' ').length;
        if (tokenCount + contentTokens > maxTokens) break;
        
        context += `\n\n--- Relevante (${Math.round(result.similarity * 100)}%) ---\n${result.content}`;
        tokenCount += contentTokens;
      }
      
      return context.trim();
    } catch (error) {
      console.error('❌ Failed to get relevant context:', error);
      return '';
    }
  }

  public async batchAddDocuments(
    documents: Array<{
      content: string;
      metadata?: Record<string, any>;
      domain?: string;
    }>
  ): Promise<string[]> {
    const results: string[] = [];
    
    console.log(`📦 Processing ${documents.length} documents in batch...`);
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        const id = await this.addToKnowledgeBase(
          doc.content,
          doc.metadata || {},
          doc.domain || 'general'
        );
        results.push(id);
        
        if ((i + 1) % 10 === 0) {
          console.log(`📊 Processed ${i + 1}/${documents.length} documents`);
        }
      } catch (error) {
        console.error(`❌ Failed to process document ${i + 1}:`, error);
      }
    }
    
    console.log(`✅ Batch processing complete: ${results.length} documents added`);
    return results;
  }

  public async updateKnowledgeBase(
    id: string,
    content?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (content) {
        const embedding = await this.generateEmbedding(content);
        const contentHash = createHash('sha256').update(content).digest('hex');
        
        updates.push(`content = $${paramIndex++}`);
        updates.push(`embedding = $${paramIndex++}`);
        updates.push(`content_hash = $${paramIndex++}`);
        params.push(content, JSON.stringify(embedding), contentHash);
      }

      if (metadata) {
        updates.push(`metadata = $${paramIndex++}`);
        params.push(JSON.stringify(metadata));
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        params.push(id);
        
        await this.pool.query(
          `UPDATE knowledge_embeddings SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          params
        );
        
        console.log(`✅ Updated knowledge base entry: ${id}`);
      }
    } catch (error) {
      console.error('❌ Failed to update knowledge base:', error);
      throw error;
    }
  }

  public async deleteFromKnowledgeBase(id: string): Promise<void> {
    try {
      await this.pool.query(
        'DELETE FROM knowledge_embeddings WHERE id = $1',
        [id]
      );
      console.log(`✅ Deleted from knowledge base: ${id}`);
    } catch (error) {
      console.error('❌ Failed to delete from knowledge base:', error);
      throw error;
    }
  }

  public async getKnowledgeStats(): Promise<{
    totalEntries: number;
    domainStats: Record<string, number>;
    lastUpdated: Date;
  }> {
    try {
      const totalResult = await this.pool.query(
        'SELECT COUNT(*) as count FROM knowledge_embeddings'
      );
      
      const domainResult = await this.pool.query(
        'SELECT domain, COUNT(*) as count FROM knowledge_embeddings GROUP BY domain'
      );
      
      const lastUpdatedResult = await this.pool.query(
        'SELECT MAX(updated_at) as last_updated FROM knowledge_embeddings'
      );
      
      const domainStats: Record<string, number> = {};
      domainResult.rows.forEach(row => {
        domainStats[row.domain] = parseInt(row.count);
      });
      
      return {
        totalEntries: parseInt(totalResult.rows[0].count),
        domainStats,
        lastUpdated: lastUpdatedResult.rows[0]?.last_updated || new Date()
      };
    } catch (error) {
      console.error('❌ Failed to get knowledge stats:', error);
      throw error;
    }
  }
}

export default VectorEmbeddingsService;
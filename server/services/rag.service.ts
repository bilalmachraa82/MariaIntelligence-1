
import { storage } from "../storage";
import { GeminiService } from "./gemini.service";

export class RAGService {
  private geminiService: GeminiService;
  private initialized: boolean = false;

  constructor() {
    this.geminiService = new GeminiService();
    // Inicialização assíncrona em segundo plano
    this.initialize();
  }
  
  private async initialize() {
    try {
      // Tentamos conectar à API Gemini
      const connected = await this.geminiService.checkApiConnection();
      this.initialized = connected;
      if (!connected) {
        console.warn('⚠️ Atenção: Não foi possível conectar ao serviço Gemini. Funcionalidades RAG estarão limitadas.');
      } else {
        console.log('✅ Serviço RAG inicializado com Gemini API');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar o serviço RAG:', error);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.initialized) {
        console.warn('⚠️ Serviço RAG não inicializado. Usando embedding simplificado.');
        return this.generateSimpleEmbedding(text);
      }
      const response = await this.geminiService.generateEmbeddings(text);
      return response.data[0].embedding || [];
    } catch (error) {
      console.error('❌ Erro ao gerar embedding. Usando fallback:', error);
      return this.generateSimpleEmbedding(text);
    }
  }
  
  // Método de fallback para gerar um embedding simples caso o serviço Gemini não esteja disponível
  private generateSimpleEmbedding(text: string): number[] {
    const embeddingDimension = 768;
    const embedding: number[] = [];
    
    // Criar um embedding simplificado baseado no texto
    const normalizedText = text.toLowerCase();
    
    // Preencher o vetor de embedding com valores baseados em características do texto
    for (let i = 0; i < embeddingDimension; i++) {
      const charCode = i < normalizedText.length ? normalizedText.charCodeAt(i % normalizedText.length) : 0;
      embedding.push((charCode / 255.0) * 2 - 1); // Normalizar para [-1, 1]
    }
    
    return embedding;
  }

  async addToKnowledgeBase(content: string, contentType: string, metadata: any = {}) {
    const embedding = await this.generateEmbedding(content);
    
    await storage.createKnowledgeEmbedding({
      content,
      contentType,
      embeddingJson: { vector: embedding },
      metadata
    });
  }

  async findSimilarContent(query: string, limit: number = 5): Promise<any[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Por enquanto, vamos usar uma comparação simples
    // Futuramente implementaremos busca por similaridade de coseno
    const allContent = await storage.getKnowledgeEmbeddings();
    
    return allContent
      .map((content: any) => ({
        ...content,
        similarity: this.cosineSimilarity(queryEmbedding, content.embeddingJson.vector)
      }))
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
  }
}


import { storage } from "../storage";
import { Mistral } from "@mistralai/mistralai";

export class RAGService {
  private client: Mistral;

  constructor() {
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY não configurada');
    }
    this.client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: "mistral-embed",
      inputs: [text]
    });
    return response.data[0].embedding || [];
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

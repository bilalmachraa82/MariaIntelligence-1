/**
 * Serviço de RAG (Retrieval-Augmented Generation)
 * Gerencia o armazenamento e recuperação de histórico de conversas e conhecimento contextual
 * para melhorar a experiência do assistente Maria.
 */

import { Mistral } from "@mistralai/mistralai";
import { db } from "../db";
import { 
  conversationHistory, 
  knowledgeEmbeddings, 
  queryEmbeddings,
  InsertConversationHistory,
  InsertKnowledgeEmbedding,
  InsertQueryEmbedding 
} from "@shared/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { migrateRagTables } from "../db/migrate-rag";

// Configurações
const MAX_CONVERSATION_HISTORY = 50; // Número máximo de mensagens por contexto de conversa
const DEFAULT_USER_ID = 1; // ID de usuário padrão (até implementar autenticação)

/**
 * Classe responsável por gerenciar o sistema RAG
 */
export class RagService {
  private mistral: Mistral;
  private tablesInitialized: boolean = false;
  
  constructor() {
    const apiKey = process.env.MISTRAL_API_KEY;
    
    if (!apiKey) {
      console.warn("MISTRAL_API_KEY não encontrada! Algumas funcionalidades de RAG serão limitadas.");
    }
    
    this.mistral = new Mistral({
      apiKey: apiKey || ""
    });
    
    // Inicializar as tabelas necessárias de forma assíncrona
    this.initTables().then(success => {
      this.tablesInitialized = success;
      if (success) {
        console.log("Tabelas RAG inicializadas com sucesso.");
      } else {
        console.warn("Não foi possível inicializar todas as tabelas RAG. Algumas funcionalidades podem estar limitadas.");
      }
    }).catch(err => {
      console.error("Erro ao inicializar tabelas RAG:", err);
      this.tablesInitialized = false;
    });
  }
  
  /**
   * Inicializa as tabelas necessárias para o funcionamento do RAG
   */
  private async initTables(): Promise<boolean> {
    try {
      return await migrateRagTables();
    } catch (error) {
      console.error("Erro ao inicializar tabelas:", error);
      return false;
    }
  }
  
  /**
   * Salva uma mensagem no histórico de conversas
   * @param message Conteúdo da mensagem
   * @param role Papel ("user" ou "assistant")
   * @param metadata Metadados adicionais
   */
  async saveConversationMessage(
    message: string, 
    role: "user" | "assistant" = "user", 
    metadata: Record<string, any> = {}
  ): Promise<number> {
    try {
      const newMessage: InsertConversationHistory = {
        userId: DEFAULT_USER_ID,
        message,
        role,
        metadata
      };
      
      // Tenta inserir na tabela, mas ignora erros de tabela não existente
      try {
        const [result] = await db
          .insert(conversationHistory)
          .values(newMessage)
          .returning({ id: conversationHistory.id });
        
        return result.id;
      } catch (dbError: any) {
        // Se for um erro de tabela não existente (42P01), retorna um ID temporário
        if (dbError.code === '42P01') {
          console.warn("Tabela conversation_history não existe ainda. A funcionalidade RAG estará limitada até que a migração seja executada.");
          return -1; // ID temporário para não quebrar o fluxo
        } else {
          // Para outros erros, repassa
          throw dbError;
        }
      }
    } catch (error) {
      console.error("Erro ao salvar mensagem de conversa:", error);
      return -1; // Para não quebrar o fluxo
    }
  }
  
  /**
   * Recupera o histórico de conversas recentes
   * @param limit Número máximo de mensagens para recuperar
   */
  async getRecentConversationHistory(limit: number = MAX_CONVERSATION_HISTORY): Promise<any[]> {
    try {
      try {
        const history = await db
          .select()
          .from(conversationHistory)
          .orderBy(desc(conversationHistory.timestamp))
          .limit(limit);
        
        // Retorna na ordem cronológica (mais antigas primeiro)
        return history.reverse();
      } catch (dbError: any) {
        // Se for um erro de tabela não existente (42P01), retorna um array vazio
        if (dbError.code === '42P01') {
          console.warn("Tabela conversation_history não existe ainda. A funcionalidade RAG estará limitada até que a migração seja executada.");
          return [];
        } else {
          // Para outros erros, repassa
          throw dbError;
        }
      }
    } catch (error) {
      console.error("Erro ao recuperar histórico de conversas:", error);
      return [];
    }
  }
  
  /**
   * Salva um conhecimento com embedding
   * @param content Conteúdo do conhecimento
   * @param contentType Tipo de conteúdo
   * @param metadata Metadados adicionais
   */
  async saveKnowledge(
    content: string, 
    contentType: string = "faq", 
    metadata: Record<string, any> = {}
  ): Promise<number> {
    try {
      // Gera o embedding usando Mistral (simplificado temporariamente)
      // Quando pgvector estiver habilitado, o embedding será armazenado corretamente
      const embeddingJson = await this.generateEmbedding(content);
      
      const newKnowledge: InsertKnowledgeEmbedding = {
        content,
        contentType,
        embeddingJson,
        metadata
      };
      
      try {
        const [result] = await db
          .insert(knowledgeEmbeddings)
          .values(newKnowledge)
          .returning({ id: knowledgeEmbeddings.id });
        
        return result.id;
      } catch (dbError: any) {
        // Se for um erro de tabela não existente (42P01), retorna um ID temporário
        if (dbError.code === '42P01') {
          console.warn("Tabela knowledge_embeddings não existe ainda. A funcionalidade RAG estará limitada até que a migração seja executada.");
          return -1; // ID temporário para não quebrar o fluxo
        } else {
          // Para outros erros, repassa
          throw dbError;
        }
      }
    } catch (error) {
      console.error("Erro ao salvar conhecimento:", error);
      return -1; // ID temporário para não quebrar o fluxo
    }
  }
  
  /**
   * Salva uma consulta frequente com seu embedding e resposta
   * @param query Consulta realizada
   * @param response Resposta fornecida
   */
  async saveQuery(query: string, response: string): Promise<number> {
    try {
      // Gera o embedding usando Mistral (simplificado temporariamente)
      const embeddingJson = await this.generateEmbedding(query);
      
      // Verifica se já existe uma consulta similar
      const existingQuery = await this.findSimilarQuery(query);
      
      if (existingQuery) {
        try {
          // Atualiza a consulta existente incrementando a frequência
          await db
            .update(queryEmbeddings)
            .set({ 
              frequency: sql`${queryEmbeddings.frequency} + 1`,
              lastUsed: new Date()
            })
            .where(eq(queryEmbeddings.id, existingQuery.id));
          
          return existingQuery.id;
        } catch (dbError: any) {
          // Se for um erro de tabela não existente (42P01), retorna um ID temporário
          if (dbError.code === '42P01') {
            console.warn("Tabela query_embeddings não existe ainda. A funcionalidade RAG estará limitada até que a migração seja executada.");
            return -1; // ID temporário para não quebrar o fluxo
          } else {
            // Para outros erros, repassa
            throw dbError;
          }
        }
      }
      
      // Cria uma nova consulta
      const newQuery: InsertQueryEmbedding = {
        query,
        response,
        embeddingJson,
        frequency: 1
      };
      
      try {
        const [result] = await db
          .insert(queryEmbeddings)
          .values(newQuery)
          .returning({ id: queryEmbeddings.id });
        
        return result.id;
      } catch (dbError: any) {
        // Se for um erro de tabela não existente (42P01), retorna um ID temporário
        if (dbError.code === '42P01') {
          console.warn("Tabela query_embeddings não existe ainda. A funcionalidade RAG estará limitada até que a migração seja executada.");
          return -1; // ID temporário para não quebrar o fluxo
        } else {
          // Para outros erros, repassa
          throw dbError;
        }
      }
    } catch (error) {
      console.error("Erro ao salvar consulta:", error);
      return -1; // Para não quebrar o fluxo
    }
  }
  
  /**
   * Encontra uma consulta similar usando busca por texto
   * Temporário até implementar busca vetorial com pgvector
   */
  private async findSimilarQuery(query: string): Promise<any | null> {
    try {
      // Simplificação temporária: busca por palavras-chave
      // Quando pgvector estiver habilitado, usaremos busca vetorial
      const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      if (words.length === 0) return null;
      
      const conditions = words.map(word => 
        like(queryEmbeddings.query, `%${word}%`)
      );
      
      try {
        const [result] = await db
          .select()
          .from(queryEmbeddings)
          .where(or(...conditions))
          .limit(1);
        
        return result || null;
      } catch (dbError: any) {
        // Se for um erro de tabela não existente (42P01), retorna null
        if (dbError.code === '42P01') {
          console.warn("Tabela query_embeddings não existe ainda. A funcionalidade RAG estará limitada até que a migração seja executada.");
          return null;
        } else {
          // Para outros erros, repassa
          throw dbError;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar consulta similar:", error);
      return null;
    }
  }
  
  /**
   * Gera um embedding para o texto usando Mistral
   * Temporariamente armazena como JSON, até habilitar pgvector
   */
  private async generateEmbedding(text: string): Promise<Record<string, any>> {
    try {
      if (!process.env.MISTRAL_API_KEY) {
        // Fallback para quando não temos a API key
        console.warn("Usando fallback para embeddings (sem Mistral API)");
        return { fallback: true, text: text.slice(0, 50) };
      }
      
      // Gera embedding real usando Mistral API
      const embeddingResponse = await this.mistral.embeddings.create({
        model: "mistral-embed",
        inputs: [text],
      });
      
      if (!embeddingResponse || !embeddingResponse.data || embeddingResponse.data.length === 0) {
        throw new Error("Resposta de embedding inválida da API Mistral");
      }
      
      // Extrai o vetor de embedding
      const embedding = embeddingResponse.data[0]?.embedding;
      
      // Para armazenar como JSON temporariamente (até habilitar pgvector)
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Embedding inválido da API Mistral");
      }
      
      return { 
        vector: embedding.slice(0, 10), // Armazena apenas os primeiros 10 valores como exemplo
        full_length: embedding.length,
        text_sample: text.slice(0, 50)
      };
    } catch (error) {
      console.error("Erro ao gerar embedding:", error);
      // Fallback em caso de erro
      return { error: true, fallback: true, text: text.slice(0, 50) };
    }
  }
  
  /**
   * Constrói o contexto RAG para uso no assistente
   * Combina histórico de conversas e conhecimento relevante
   */
  async buildConversationContext(userQuery: string): Promise<string> {
    try {
      // 1. Recupera o histórico de conversas recentes
      const conversationHistory = await this.getRecentConversationHistory(10);
      
      // 2. Formata o histórico para um formato legível
      let conversationContext = "Histórico de conversa recente:\n";
      
      if (conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
          const role = msg.role === "user" ? "Usuário" : "Assistente";
          conversationContext += `${role}: ${msg.message}\n`;
        });
      } else {
        conversationContext += "Nenhuma conversa anterior.\n";
      }
      
      // 3. Adiciona a consulta atual
      await this.saveConversationMessage(userQuery, "user");
      
      return conversationContext;
    } catch (error) {
      console.error("Erro ao construir contexto de conversa:", error);
      return ""; // Em caso de erro, retorna contexto vazio
    }
  }
}

// Singleton para uso em toda a aplicação
export const ragService = new RagService();
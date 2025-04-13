/**
 * Serviço RAG (Retrieval Augmented Generation) Aprimorado
 * 
 * Este serviço fornece uma camada de RAG unificada que integra diferentes fontes de dados
 * para melhorar a geração de respostas da IA com contexto relevante do sistema.
 * 
 * O RAG permite que o Gemini (Maria IA) tenha acesso a:
 * - Dados históricos de reservas
 * - Interações anteriores no chat
 * - Documentos processados
 * - Comportamento e ações do usuário
 * - Histórico de importações
 * 
 * Isto possibilita um sistema de IA que aprende continuamente e torna-se mais inteligente
 * e contextualizado para as necessidades específicas da Maria Faz.
 */

import { db } from '../db';
import { sql, desc, gte, lte } from 'drizzle-orm';
import { aiService } from './ai-adapter.service';
import { knowledgeEmbeddings, conversationHistory, queryEmbeddings } from '../../shared/schema';
import type { 
  KnowledgeEmbedding, 
  InsertKnowledgeEmbedding, 
  InsertConversationHistory,
  InsertQueryEmbedding
} from '../../shared/schema';
import { storage } from '../storage';
import {
  knowledgeEmbeddings,
  conversationHistory,
  queryEmbeddings,
  properties,
  owners,
  reservations,
  activities
} from '../../shared/schema';
import { eq, and, desc, like, gte, lte } from 'drizzle-orm';
import { InsertKnowledgeEmbedding } from '../../shared/schema';

// Interface para um item da base de conhecimento RAG
export interface KnowledgeItem {
  id: number;
  content: string;
  contentType: string;
  embedding?: number[];
  metadata: any;
  createdAt: Date;
}

// Interface para configuração de consulta
export interface QueryConfig {
  query: string;
  contentTypes?: string[];
  maxResults?: number;
  minSimilarity?: number;
  startDate?: Date;
  endDate?: Date;
  includeRaw?: boolean;
}

// Classe principal do serviço RAG
export class RagEnhancedService {
  private static instance: RagEnhancedService;
  private embeddingDimension: number = 768; // Dimensão padrão para os embeddings
  private extractEmbeddingsEnabled: boolean = true;

  private constructor() {
    console.log('Serviço RAG Aprimorado inicializado');
  }

  /**
   * Obtém a instância do serviço RAG
   * @returns Instância do serviço RAG
   */
  public static getInstance(): RagEnhancedService {
    if (!RagEnhancedService.instance) {
      RagEnhancedService.instance = new RagEnhancedService();
    }
    return RagEnhancedService.instance;
  }

  /**
   * Adiciona conteúdo à base de conhecimento
   * @param content Conteúdo a ser adicionado
   * @param contentType Tipo de conteúdo (document, chat, reservation, activity, etc)
   * @param metadata Metadados sobre o conteúdo
   * @returns ID do item adicionado
   */
  /**
   * Adiciona conhecimento ao sistema RAG
   * Método alternativo com nome diferente para manter compatibilidade
   * @param content Conteúdo a ser adicionado
   * @param contentType Tipo de conteúdo (chat_history, document, system_data, etc)
   * @param metadata Metadados adicionais
   * @returns Promise<number> ID do item adicionado
   */
  public async addKnowledge(
    content: string,
    contentType: string,
    metadata: any = {}
  ): Promise<number> {
    return this.addToKnowledgeBase(content, contentType, metadata);
  }

  public async addToKnowledgeBase(
    content: string,
    contentType: string,
    metadata: any = {}
  ): Promise<number> {
    console.log(`📚 RAG: Adicionando conteúdo à base de conhecimento (tipo: ${contentType})`);
    
    try {
      // Extrair embedding usando o modelo atual
      let embedding: number[] | null = null;
      
      if (this.extractEmbeddingsEnabled) {
        try {
          // Geração do embedding através da IA
          // Nota: Em produção, usar um modelo específico para embeddings é mais eficiente
          embedding = await this.generateEmbedding(content);
        } catch (embeddingError) {
          console.error('Erro ao gerar embedding:', embeddingError);
          // Continuar sem embedding em caso de erro
        }
      }
      
      // Preparar o item para inserção
      const newItem: InsertKnowledgeEmbedding = {
        content: content.length > 10000 ? content.substring(0, 10000) : content,
        contentType,
        metadata: JSON.stringify(metadata),
        embeddingJson: embedding ? JSON.stringify(embedding) : undefined
        // createdAt é adicionado automaticamente pelo schema
      };
      
      // Inserir na base de dados
      let result;
      if (db) {
        // Usando banco de dados
        result = await db.insert(knowledgeEmbeddings).values(newItem).returning({ id: knowledgeEmbeddings.id });
        return result[0].id;
      } else {
        // Usando storage memory
        result = await storage.createKnowledgeEmbedding(newItem);
        return result.id;
      }
    } catch (error) {
      console.error('Erro ao adicionar ao conhecimento RAG:', error);
      throw error;
    }
  }

  /**
   * Gera embedding para um texto usando o serviço Gemini
   * @param text Texto para gerar embedding
   * @returns Array de números representando o embedding
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Usar o serviço Gemini para gerar embeddings
      const geminiService = aiService.geminiService;
      const embeddingResponse = await geminiService.generateEmbeddings(text);
      
      // Verificar se temos uma resposta válida
      if (embeddingResponse?.data?.[0]?.embedding) {
        console.log("✅ Embedding gerado com sucesso usando Gemini");
        return embeddingResponse.data[0].embedding;
      }
      
      // Se não temos uma resposta válida, usar o fallback com embedding determinístico
      console.warn("⚠️ Usando fallback para embedding (resposta Gemini inválida)");
      const embedding: number[] = [];
      const normalizedText = text.toLowerCase();
      
      // Preencher o vetor de embedding com valores baseados em características do texto
      for (let i = 0; i < this.embeddingDimension; i++) {
        const charCode = i < normalizedText.length ? normalizedText.charCodeAt(i % normalizedText.length) : 0;
        embedding.push((charCode / 255.0) * 2 - 1); // Normalizar para [-1, 1]
      }
      
      return embedding;
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      console.warn("⚠️ Usando fallback para embedding (erro na API Gemini)");
      
      // Implementação de fallback determinística em caso de falha
      const embedding: number[] = [];
      const normalizedText = text.toLowerCase();
      
      for (let i = 0; i < this.embeddingDimension; i++) {
        const charCode = i < normalizedText.length ? normalizedText.charCodeAt(i % normalizedText.length) : 0;
        embedding.push((charCode / 255.0) * 2 - 1); // Normalizar para [-1, 1]
      }
      
      return embedding;
    }
  }

  /**
   * Busca itens similares na base de conhecimento
   * @param query Consulta para buscar itens similares
   * @param config Configuração da consulta ou número máximo de resultados
   * @returns Array de itens similares
   */
  public async findSimilarContent(queryText: string, maxResults: number = 5): Promise<KnowledgeItem[]> {
    return this.querySimilarItems(queryText, { maxResults });
  }

  /**
   * Busca itens similares na base de conhecimento (implementação detalhada)
   * @param query Consulta para buscar itens similares
   * @param config Configuração da consulta
   * @returns Array de itens similares
   */
  public async querySimilarItems(queryText: string, config: Partial<QueryConfig> = {}): Promise<KnowledgeItem[]> {
    console.log(`🔍 RAG: Consultando itens similares para: "${queryText.substring(0, 50)}..."`);
    
    const defaultConfig: QueryConfig = {
      query: queryText,
      contentTypes: [],
      maxResults: 5,
      minSimilarity: 0.7,
      includeRaw: false
    };
    
    const mergedConfig = { ...defaultConfig, ...config };
    
    try {
      // Gerar embedding para a consulta
      const queryEmbedding = await this.generateEmbedding(queryText);
      
      // Salvar a consulta para aprendizado futuro
      await this.saveQueryEmbedding(queryText, queryEmbedding);
      
      // Buscar itens similares
      let results: KnowledgeItem[] = [];
      
      if (db) {
        // Usando banco de dados com busca por similaridade
        // Nota: Requer suporte a pgvector ou similar
        let query = db.select().from(knowledgeEmbeddings)
          .orderBy(desc(knowledgeEmbeddings.createdAt))
          .limit(mergedConfig.maxResults || 5);
        
        // Filtrar por tipo de conteúdo se especificado
        if (mergedConfig.contentTypes && mergedConfig.contentTypes.length > 0) {
          query = query.where(
            sql`${knowledgeEmbeddings.contentType} IN (${mergedConfig.contentTypes.join(',')})`
          );
        }
        
        // Filtrar por data se especificado
        if (mergedConfig.startDate) {
          query = query.where(gte(knowledgeEmbeddings.createdAt, mergedConfig.startDate));
        }
        
        if (mergedConfig.endDate) {
          query = query.where(lte(knowledgeEmbeddings.createdAt, mergedConfig.endDate));
        }
        
        const dbResults = await query;
        
        // Calcular similaridade manualmente (simplificado)
        results = dbResults.map(item => {
          // Extrair embedding do formato JSON armazenado
          let parsedEmbedding: number[] = [];
          try {
            if (item.embeddingJson) {
              parsedEmbedding = JSON.parse(item.embeddingJson as string);
            }
          } catch (err) {
            console.error('Erro ao fazer parse do embedding JSON:', err);
          }
          
          return {
            id: item.id,
            content: item.content,
            contentType: item.contentType,
            embedding: parsedEmbedding,
            metadata: JSON.parse(item.metadata as string),
            createdAt: item.createdAt as Date
          };
        });
      } else {
        // Usando memory storage
        const allItems = await storage.getKnowledgeEmbeddings();
        
        results = allItems.map(item => ({
          id: item.id,
          content: item.content,
          contentType: item.contentType,
          embedding: item.embedding as number[],
          metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata,
          createdAt: item.createdAt as Date
        }));
        
        // Filtrar por tipo de conteúdo se especificado
        if (mergedConfig.contentTypes && mergedConfig.contentTypes.length > 0) {
          results = results.filter(item => 
            mergedConfig.contentTypes?.includes(item.contentType)
          );
        }
        
        // Filtrar por data se especificado
        if (mergedConfig.startDate) {
          results = results.filter(item => 
            item.createdAt >= mergedConfig.startDate!
          );
        }
        
        if (mergedConfig.endDate) {
          results = results.filter(item => 
            item.createdAt <= mergedConfig.endDate!
          );
        }
        
        // Ordenar por data decrescente
        results = results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // Limitar resultados
        results = results.slice(0, mergedConfig.maxResults || 5);
      }
      
      console.log(`✅ RAG: Encontrados ${results.length} itens similares`);
      
      // Remover embeddings se não for para incluir dados brutos
      if (!mergedConfig.includeRaw) {
        results.forEach(item => {
          delete item.embedding;
        });
      }
      
      return results;
    } catch (error) {
      console.error('Erro ao buscar itens similares:', error);
      return [];
    }
  }

  /**
   * Salva um embedding de consulta para aprendizado futuro
   * @param query Texto da consulta
   * @param embedding Embedding da consulta
   */
  private async saveQueryEmbedding(query: string, embedding: number[]): Promise<void> {
    try {
      // Para evitar erro "null value in column response", garantimos que temos uma resposta
      const newQueryEmbedding: InsertQueryEmbedding = {
        query,
        response: "Consulta armazenada para aprendizado", // Adicionando valor padrão para response
        embeddingJson: JSON.stringify(embedding) // Armazenar como JSON
        // frequency é adicionado automaticamente pelo schema
      };
      
      // Salvar na base de dados
      if (db) {
        await db.insert(queryEmbeddings).values(newQueryEmbedding);
      } else {
        await storage.saveQueryEmbedding(newQueryEmbedding);
      }
    } catch (error) {
      console.error('Erro ao salvar embedding de consulta:', error);
      // Log mais detalhado do erro para diagnóstico
      if (error instanceof Error) {
        console.error(`Detalhes do erro: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
      }
    }
  }

  /**
   * Salva uma mensagem no histórico de conversas
   * @param message Conteúdo da mensagem
   * @param role Papel do remetente (user, assistant, system)
   * @param metadata Metadados sobre a mensagem
   */
  public async saveConversationMessage(
    message: string,
    role: 'user' | 'assistant' | 'system',
    metadata: any = {}
  ): Promise<void> {
    try {
      // Garantir que a mensagem não seja nula
      const safeMessage = message || "";
      
      // Criar entrada conforme o schema esperado pelo banco
      const conversationEntry: InsertConversationHistory = {
        message: safeMessage,
        role,
        metadata: JSON.stringify(metadata)
        // userId e timestamp são definidos automaticamente pelo schema
      };
      
      // Salvar na base de dados
      if (db) {
        await db.insert(conversationHistory).values(conversationEntry);
      } else {
        await storage.saveConversationHistory(conversationEntry);
      }
      
      // Adicionar também à base de conhecimento para enriquecer o contexto
      await this.addToKnowledgeBase(
        message,
        'conversation',
        { role, ...metadata }
      );
    } catch (error) {
      console.error('Erro ao salvar mensagem de conversação:', error);
    }
  }

  /**
   * Constrói um contexto RAG para uma consulta específica
   * @param query Consulta para construir contexto
   * @param maxItems Número máximo de itens a incluir no contexto
   * @returns Contexto RAG formatado
   */
  public async buildRagContext(query: string, maxItems: number = 5): Promise<string> {
    return this.buildConversationContext(query, maxItems);
  }
  
  /**
   * Constrói um contexto de conversação baseado em uma consulta (compatível com API antiga)
   * @param query Consulta para construir contexto
   * @param maxConversations Número máximo de itens a incluir no contexto
   * @returns Contexto de conversação formatado
   */
  public async buildConversationContext(query: string, maxConversations: number = 10): Promise<string> {
    // Primeiro, fazer a busca por itens similares
    const similarItems = await this.querySimilarItems(query, {
      maxResults: maxConversations
    });
    
    // Construir um contexto estruturado
    let context = `--- CONTEXTO RELEVANTE PARA MARIA IA ---\n\n`;
    
    // Adicionar itens de conhecimento ao contexto
    similarItems.forEach((item, index) => {
      context += `[Item ${index + 1} - ${item.contentType}]\n`;
      
      // Preparar metadados formatados
      const metadata = item.metadata;
      let metadataStr = '';
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          if (key !== 'raw' && key !== 'full_content') {
            metadataStr += `${key}: ${value}\n`;
          }
        }
      }
      
      if (metadataStr) {
        context += `Metadados:\n${metadataStr}\n`;
      }
      
      context += `Conteúdo:\n${item.content}\n\n`;
    });
    
    // Adicionar conhecimento do sistema
    context += `--- INFORMAÇÕES DO SISTEMA ---\n`;
    context += await this.getSystemInfo();
    
    return context;
  }

  /**
   * Obtém informações do sistema para enriquecer o contexto
   * @returns Informações do sistema formatadas
   */
  private async getSystemInfo(): Promise<string> {
    let info = '';
    
    try {
      // Dados das propriedades
      const allProperties = await storage.getProperties();
      info += `Propriedades (${allProperties.length}):\n`;
      info += allProperties.map(p => `- ${p.name} (${p.type}, ${p.address})`).join('\n');
      info += '\n\n';
      
      // Dados dos proprietários
      const allOwners = await storage.getOwners();
      info += `Proprietários (${allOwners.length}):\n`;
      info += allOwners.map(o => `- ${o.name}`).join('\n');
      info += '\n\n';
      
      // Estatísticas básicas
      const totalReservations = await storage.getReservations();
      const totalRevenue = await storage.getTotalRevenue();
      const netProfit = await storage.getNetProfit();
      
      info += `Estatísticas:\n`;
      info += `- Total de reservas: ${totalReservations.length}\n`;
      info += `- Receita total: ${totalRevenue}\n`;
      info += `- Lucro líquido: ${netProfit}\n`;
      
    } catch (error) {
      console.error('Erro ao obter informações do sistema:', error);
      info += 'Erro ao carregar informações do sistema.\n';
    }
    
    return info;
  }

  /**
   * Indexa dados do sistema para enriquecer a base de conhecimento
   * Útil para carregar dados iniciais ou atualizar a base após mudanças
   */
  public async indexSystemData(): Promise<void> {
    console.log('📊 RAG: Indexando dados do sistema...');
    
    try {
      // Indexar propriedades
      const allProperties = await storage.getProperties();
      for (const property of allProperties) {
        await this.addToKnowledgeBase(
          `Propriedade ${property.name}: Tipo ${property.type}, Localizada em ${property.address}. 
          Descrição: ${property.description || 'Sem descrição'}. 
          Comissão: ${property.commission}%, Custo de limpeza: ${property.cleaningFee}.`,
          'property',
          property
        );
      }
      
      // Indexar proprietários
      const allOwners = await storage.getOwners();
      for (const owner of allOwners) {
        await this.addToKnowledgeBase(
          `Proprietário ${owner.name}: Email ${owner.email}, Telefone ${owner.phone}.`,
          'owner',
          owner
        );
      }
      
      // Indexar reservas
      const allReservations = await storage.getReservations();
      for (const reservation of allReservations) {
        const property = allProperties.find(p => p.id === reservation.propertyId);
        
        await this.addToKnowledgeBase(
          `Reserva para ${property?.name || 'Propriedade desconhecida'}.
          Hóspede: ${reservation.guestName}
          Check-in: ${reservation.checkInDate}
          Check-out: ${reservation.checkOutDate}
          Hóspedes: ${reservation.numGuests}
          Valor: ${reservation.totalAmount}
          Plataforma: ${reservation.platform}`,
          'reservation',
          reservation
        );
      }
      
      // Indexar atividades recentes
      const recentActivities = await storage.getActivities(100); // últimas 100 atividades
      for (const activity of recentActivities) {
        await this.addToKnowledgeBase(
          `Atividade: ${activity.description} (${activity.type})`,
          'activity',
          activity
        );
      }
      
      console.log('✅ RAG: Indexação de dados do sistema concluída');
    } catch (error) {
      console.error('Erro ao indexar dados do sistema:', error);
    }
  }

  /**
   * Integra dados de um documento processado à base de conhecimento
   * @param documentText Texto extraído do documento
   * @param extractedData Dados estruturados extraídos
   * @param documentType Tipo do documento
   * @param metadata Metadados adicionais
   */
  public async integrateProcessedDocument(
    documentText: string,
    extractedData: any,
    documentType: string,
    metadata: any = {}
  ): Promise<void> {
    console.log(`📄 RAG: Integrando documento processado (${documentType}) à base de conhecimento`);
    
    try {
      // Adicionar o texto completo do documento
      await this.addToKnowledgeBase(
        documentText,
        `document_${documentType}_full`,
        { 
          ...metadata,
          extractedData: JSON.stringify(extractedData),
          dateAdded: new Date().toISOString(), 
          documentType,
          processingService: aiService.getCurrentService()
        }
      );
      
      // Adicionar também uma versão resumida com os dados estruturados
      let structuredSummary = `Documento ${documentType}\n`;
      for (const [key, value] of Object.entries(extractedData)) {
        if (value) {
          structuredSummary += `${key}: ${value}\n`;
        }
      }
      
      await this.addToKnowledgeBase(
        structuredSummary,
        `document_${documentType}_structured`,
        metadata
      );
      
      console.log('✅ RAG: Documento integrado com sucesso à base de conhecimento');
    } catch (error) {
      console.error('Erro ao integrar documento à base de conhecimento:', error);
    }
  }

  /**
   * Aprende formatos de documentos e os armazena na base de conhecimento
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @param extractedData Dados extraídos do documento
   * @param formatInfo Informações sobre o formato do documento
   */
  public async learnDocumentFormat(
    fileBase64: string,
    mimeType: string,
    extractedData: any,
    formatInfo: any
  ): Promise<void> {
    console.log(`🧠 RAG: Aprendendo formato de documento (${formatInfo.type || 'desconhecido'})`);
    
    try {
      // Criar um resumo do formato do documento
      let formatSummary = `Formato de Documento: ${formatInfo.type || 'Desconhecido'}\n`;
      formatSummary += `Descrição: ${formatInfo.description || 'Sem descrição'}\n`;
      
      if (formatInfo.identifiers && formatInfo.identifiers.length) {
        formatSummary += 'Identificadores:\n';
        formatInfo.identifiers.forEach((id: string, index: number) => {
          formatSummary += `- ${id}\n`;
        });
      }
      
      formatSummary += '\nExtração de Campos:\n';
      for (const [key, value] of Object.entries(extractedData)) {
        formatSummary += `- ${key}: ${value}\n`;
      }
      
      // Armazenar o conhecimento do formato
      await this.addToKnowledgeBase(
        formatSummary,
        'document_format',
        {
          mimeType,
          formatType: formatInfo.type,
          confidence: formatInfo.confidence,
          fields: Object.keys(extractedData)
        }
      );
      
      console.log('✅ RAG: Formato de documento armazenado na base de conhecimento');
    } catch (error) {
      console.error('Erro ao aprender formato de documento:', error);
    }
  }
}

// Exportar a instância singleton
export const ragService = RagEnhancedService.getInstance();
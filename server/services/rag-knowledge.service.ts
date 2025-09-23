import { Pool } from 'pg';
import VectorEmbeddingsService from '../utils/vector-embeddings.utils.js';

interface PropertyKnowledge {
  propertyId: string;
  name: string;
  location: string;
  amenities: string[];
  rules: string[];
  checkInInfo: string;
  localInfo: string;
}

interface RAGQuery {
  query: string;
  context?: string;
  domain?: string;
  maxTokens?: number;
}

interface RAGResponse {
  answer: string;
  relevantContext: string[];
  confidence: number;
  sources: string[];
}

export class RAGKnowledgeService {
  private vectorService: VectorEmbeddingsService;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.vectorService = new VectorEmbeddingsService(pool);
  }

  public async initializeKnowledgeDomains(): Promise<void> {
    console.log('🧠 Initializing RAG knowledge domains...');
    
    try {
      // Initialize knowledge domains
      await this.seedPropertyKnowledge();
      await this.seedCleaningKnowledge();
      await this.seedMaintenanceKnowledge();
      await this.seedLocalServicesKnowledge();
      await this.seedGuestManagementKnowledge();
      
      console.log('✅ RAG knowledge domains initialized');
    } catch (error) {
      console.error('❌ Failed to initialize knowledge domains:', error);
      throw error;
    }
  }

  private async seedPropertyKnowledge(): Promise<void> {
    const propertyKnowledge = [
      {
        content: 'Informações gerais sobre propriedades: Todas as propriedades possuem WiFi gratuito, ar condicionado e cozinha equipada. Check-in após 15:00, check-out até 11:00.',
        metadata: { type: 'general_info', language: 'pt' },
        domain: 'property'
      },
      {
        content: 'Regras da casa: Não é permitido fumar dentro da propriedade. Animais de estimação não são permitidos. Festas e eventos não são autorizados.',
        metadata: { type: 'house_rules', language: 'pt' },
        domain: 'property'
      },
      {
        content: 'Comodidades padrão: Todas as unidades incluem roupa de cama, toalhas, produtos de limpeza básicos, café e chá de cortesia.',
        metadata: { type: 'amenities', language: 'pt' },
        domain: 'property'
      },
      {
        content: 'Property general information: All properties feature free WiFi, air conditioning, and equipped kitchen. Check-in after 3:00 PM, check-out by 11:00 AM.',
        metadata: { type: 'general_info', language: 'en' },
        domain: 'property'
      }
    ];

    await this.vectorService.batchAddDocuments(propertyKnowledge);
    console.log('📍 Property knowledge seeded');
  }

  private async seedCleaningKnowledge(): Promise<void> {
    const cleaningKnowledge = [
      {
        content: 'Protocolo de limpeza padrão: 1) Remover lixo e roupa de cama usada 2) Aspirar todos os cômodos 3) Limpar banheiros completamente 4) Limpar cozinha e eletrodomésticos 5) Trocar roupa de cama e toalhas 6) Verificar amenidades e repor se necessário',
        metadata: { type: 'standard_protocol', duration: '120 minutes' },
        domain: 'cleaning'
      },
      {
        content: 'Produtos de limpeza aprovados: Utilize apenas produtos biodegradáveis. Lista aprovada: detergente neutro, desinfetante multiuso, limpa vidros, removedor de gordura.',
        metadata: { type: 'cleaning_products', safety: 'eco_friendly' },
        domain: 'cleaning'
      },
      {
        content: 'Checklist de verificação final: Todas as luzes funcionando, ar condicionado limpo, geladeira desligada se vazia, portas e janelas fechadas, chaves entregues.',
        metadata: { type: 'final_checklist', priority: 'critical' },
        domain: 'cleaning'
      }
    ];

    await this.vectorService.batchAddDocuments(cleaningKnowledge);
    console.log('🧹 Cleaning knowledge seeded');
  }

  private async seedMaintenanceKnowledge(): Promise<void> {
    const maintenanceKnowledge = [
      {
        content: 'Problemas comuns de manutenção: 1) Ar condicionado não resfria - verificar filtros 2) Torneira gotejando - trocar vedação 3) WiFi instável - reiniciar roteador 4) Porta emperrando - ajustar dobradiças',
        metadata: { type: 'common_issues', urgency: 'medium' },
        domain: 'maintenance'
      },
      {
        content: 'Manutenção preventiva mensal: Limpar filtros de ar condicionado, verificar vazamentos, testar todos os equipamentos elétricos, verificar fechaduras e chaves.',
        metadata: { type: 'preventive', frequency: 'monthly' },
        domain: 'maintenance'
      },
      {
        content: 'Fornecedores de emergência: Eletricista - João (11) 99999-1111, Encanador - Carlos (11) 99999-2222, Fechaduras - Ana (11) 99999-3333',
        metadata: { type: 'emergency_contacts', priority: 'high' },
        domain: 'maintenance'
      }
    ];

    await this.vectorService.batchAddDocuments(maintenanceKnowledge);
    console.log('🔧 Maintenance knowledge seeded');
  }

  private async seedLocalServicesKnowledge(): Promise<void> {
    const localKnowledge = [
      {
        content: 'Restaurantes recomendados próximos: Pizza do João (5 min caminhando), Padaria Central (3 min), Supermercado Extra (10 min), Farmácia São Paulo (2 min).',
        metadata: { type: 'restaurants_services', radius: '10min_walk' },
        domain: 'local_services'
      },
      {
        content: 'Transporte público: Estação de metrô mais próxima - Linha Azul, 8 minutos caminhando. Ponto de ônibus na esquina com linhas 702, 715, 804.',
        metadata: { type: 'transportation', accessibility: 'high' },
        domain: 'local_services'
      },
      {
        content: 'Atrações turísticas: Museu de Arte (15 min), Parque da Cidade (20 min), Shopping Center (25 min metrô), Teatro Municipal (30 min).',
        metadata: { type: 'attractions', category: 'tourism' },
        domain: 'local_services'
      }
    ];

    await this.vectorService.batchAddDocuments(localKnowledge);
    console.log('🗺️ Local services knowledge seeded');
  }

  private async seedGuestManagementKnowledge(): Promise<void> {
    const guestKnowledge = [
      {
        content: 'Processo de check-in: 1) Confirmar reserva no sistema 2) Verificar documento de identidade 3) Entregar chaves e orientações 4) Registrar horário de entrada 5) Enviar mensagem de boas-vindas com informações importantes',
        metadata: { type: 'checkin_process', duration: '15 minutes' },
        domain: 'guest_management'
      },
      {
        content: 'Informações de boas-vindas: WiFi password, números de emergência, regras da casa, recomendações locais, contato para dúvidas 24h.',
        metadata: { type: 'welcome_info', delivery: 'message_whatsapp' },
        domain: 'guest_management'
      },
      {
        content: 'Solução de problemas comuns: Hóspede trancado fora - chave reserva no cofre, WiFi não funciona - reiniciar roteador, barulho dos vizinhos - contatar administração.',
        metadata: { type: 'common_problems', response_time: 'immediate' },
        domain: 'guest_management'
      }
    ];

    await this.vectorService.batchAddDocuments(guestKnowledge);
    console.log('👥 Guest management knowledge seeded');
  }

  public async queryKnowledge(query: RAGQuery): Promise<RAGResponse> {
    try {
      console.log(`🔍 RAG Query: "${query.query}" (domain: ${query.domain || 'all'})`);
      
      // Get relevant context from vector database
      const relevantContext = await this.vectorService.getRelevantContext(
        query.query,
        query.maxTokens || 2000,
        query.domain
      );

      // Search for more specific results
      const searchResults = await this.vectorService.semanticSearch(
        query.query,
        5,
        query.domain
      );

      // Calculate confidence based on similarity scores
      const avgSimilarity = searchResults.length > 0 
        ? searchResults.reduce((sum, result) => sum + result.similarity, 0) / searchResults.length
        : 0;

      const confidence = Math.min(avgSimilarity * 100, 95); // Cap at 95%

      // Extract sources
      const sources = searchResults.map(result => {
        const metadata = result.metadata;
        return `${metadata.type || 'knowledge'} (${Math.round(result.similarity * 100)}%)`;
      });

      // Create contextual response
      const contextParts = relevantContext.split('--- Relevante').filter(part => part.trim());
      const relevantContextArray = contextParts.map(part => 
        part.replace(/\(\d+%\)/, '').replace(/---/, '').trim()
      ).filter(part => part.length > 0);

      return {
        answer: this.generateContextualAnswer(query.query, relevantContext),
        relevantContext: relevantContextArray,
        confidence,
        sources
      };
    } catch (error) {
      console.error('❌ RAG query failed:', error);
      throw error;
    }
  }

  private generateContextualAnswer(query: string, context: string): string {
    if (!context || context.trim().length === 0) {
      return 'Desculpe, não encontrei informações específicas sobre sua pergunta na base de conhecimento.';
    }

    // Basic contextual response generation
    // In production, this would integrate with the Gemini service
    const contextLines = context.split('\n').filter(line => line.trim().length > 0);
    const relevantInfo = contextLines.slice(0, 3).join(' ');

    return `Com base nas informações disponíveis: ${relevantInfo}`;
  }

  public async addPropertyToKnowledge(property: PropertyKnowledge): Promise<void> {
    const propertyContent = `
      Propriedade: ${property.name}
      Localização: ${property.location}
      Comodidades: ${property.amenities.join(', ')}
      Regras: ${property.rules.join(', ')}
      Check-in: ${property.checkInInfo}
      Informações locais: ${property.localInfo}
    `;

    await this.vectorService.addToKnowledgeBase(
      propertyContent,
      {
        propertyId: property.propertyId,
        name: property.name,
        type: 'property_specific'
      },
      'property'
    );

    console.log(`✅ Added property knowledge: ${property.name}`);
  }

  public async syncDatabaseToKnowledge(): Promise<void> {
    try {
      console.log('🔄 Syncing database to knowledge base...');
      
      // Sync properties
      const properties = await this.pool.query(`
        SELECT p.*, l.address, l.city, l.country
        FROM properties p 
        JOIN locations l ON p.location_id = l.id
      `);

      for (const property of properties.rows) {
        const propertyKnowledge: PropertyKnowledge = {
          propertyId: property.id,
          name: property.name || `Propriedade ${property.id}`,
          location: `${property.address}, ${property.city}, ${property.country}`,
          amenities: property.amenities || [],
          rules: property.rules || [],
          checkInInfo: property.check_in_info || 'Check-in padrão: 15:00',
          localInfo: property.local_info || 'Informações locais em atualização'
        };

        await this.addPropertyToKnowledge(propertyKnowledge);
      }

      // Sync reservations for guest patterns
      const reservations = await this.pool.query(`
        SELECT r.*, p.name as property_name
        FROM reservations r
        JOIN properties p ON r.property_id = p.id
        WHERE r.created_at > NOW() - INTERVAL '6 months'
      `);

      // Add reservation patterns to knowledge
      for (const reservation of reservations.rows) {
        const reservationContent = `
          Padrão de reserva para ${reservation.property_name}:
          Período: ${reservation.check_in} a ${reservation.check_out}
          Hóspedes: ${reservation.guests}
          Status: ${reservation.status}
        `;

        await this.vectorService.addToKnowledgeBase(
          reservationContent,
          {
            reservationId: reservation.id,
            propertyId: reservation.property_id,
            type: 'reservation_pattern'
          },
          'guest_management'
        );
      }

      console.log(`✅ Synced ${properties.rows.length} properties and ${reservations.rows.length} reservation patterns`);
    } catch (error) {
      console.error('❌ Failed to sync database to knowledge:', error);
      throw error;
    }
  }

  public async getKnowledgeStats(): Promise<any> {
    return await this.vectorService.getKnowledgeStats();
  }

  public async searchSimilarQuestions(query: string, limit: number = 5): Promise<any[]> {
    return await this.vectorService.semanticSearch(query, limit);
  }

  public async addCustomKnowledge(
    content: string,
    domain: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    return await this.vectorService.addToKnowledgeBase(content, metadata, domain);
  }
}

export default RAGKnowledgeService;
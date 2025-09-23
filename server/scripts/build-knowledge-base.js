#!/usr/bin/env node

/**
 * Knowledge Base Builder Script
 * Builds and populates the RAG knowledge base with comprehensive property management data
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DocumentProcessor from '../utils/document-processor.utils.js';
import RAGKnowledgeService from '../services/rag-knowledge.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'maria_intelligence',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

class KnowledgeBaseBuilder {
  constructor() {
    this.processor = new DocumentProcessor(pool);
    this.ragService = new RAGKnowledgeService(pool);
  }

  async run() {
    console.log('🚀 Starting Knowledge Base Builder...');
    console.log('=====================================\n');

    try {
      // Initialize knowledge domains
      await this.ragService.initializeKnowledgeDomains();
      
      // Sync existing database data
      await this.ragService.syncDatabaseToKnowledge();
      
      // Process knowledge documents
      await this.processKnowledgeDocuments();
      
      // Generate property-specific knowledge
      await this.generatePropertySpecificKnowledge();
      
      // Add cleaning protocols
      await this.addCleaningProtocols();
      
      // Add maintenance procedures
      await this.addMaintenanceProcedures();
      
      // Add guest management workflows
      await this.addGuestManagementWorkflows();
      
      // Add local services and recommendations
      await this.addLocalServicesKnowledge();
      
      // Display final statistics
      await this.displayStatistics();
      
      console.log('\n✅ Knowledge Base build completed successfully!');
    } catch (error) {
      console.error('❌ Knowledge Base build failed:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  }

  async processKnowledgeDocuments() {
    console.log('📄 Processing knowledge documents...');
    
    const documents = [
      {
        type: 'text',
        content: `
          MANUAL DE PROCEDIMENTOS - PROPRIEDADES MARIAINTELLIGENCE
          
          1. INFORMAÇÕES GERAIS
          - Todas as propriedades possuem WiFi gratuito de alta velocidade
          - Ar condicionado em todos os ambientes
          - Cozinha completa com utensílios e eletrodomésticos
          - Roupa de cama e banho de qualidade hoteleira
          - Check-in flexível após 15:00
          - Check-out até 11:00 com possibilidade de extensão
          
          2. COMODIDADES PADRÃO
          - Smart TV com Netflix, Amazon Prime e YouTube
          - Máquina de lavar e secar roupa
          - Ferro de passar e tábua
          - Secador de cabelo profissional
          - Kit de boas-vindas com café, chá e biscoitos
          - Produtos de higiene pessoal premium
          
          3. REGRAS DA CASA
          - Proibido fumar em todas as áreas internas
          - Animais de estimação sob consulta prévia
          - Festas e eventos não autorizados
          - Respeitar o silêncio após 22:00
          - Máximo de ocupantes conforme anunciado
        `,
        metadata: {
          title: 'Manual de Procedimentos Gerais',
          category: 'operational_guidelines',
          language: 'pt',
          priority: 'high'
        },
        domain: 'property'
      },
      {
        type: 'text',
        content: `
          EMERGENCY PROCEDURES AND CONTACTS
          
          IMMEDIATE EMERGENCIES:
          - Police: 190
          - Fire Department: 193
          - Medical Emergency: 192
          - Gas Emergency: 194
          
          PROPERTY EMERGENCIES:
          - Lockout: Check backup key in entrance keybox (code: 2580)
          - Power outage: Check circuit breaker, contact building management
          - Water leak: Turn off main valve under kitchen sink, call maintenance
          - AC malfunction: Check filters first, restart unit, call technical support
          
          24/7 SUPPORT CONTACTS:
          - Property Manager: +55 11 99999-0001
          - Maintenance Team: +55 11 99999-0002
          - Guest Support: +55 11 99999-0003
          
          BUILDING SERVICES:
          - Concierge: Ground floor, 7AM-10PM
          - Security: 24/7 monitoring
          - Parking: Monthly rate R$200, daily R$25
        `,
        metadata: {
          title: 'Emergency Procedures',
          category: 'emergency_response',
          language: 'en',
          priority: 'critical'
        },
        domain: 'guest_management'
      }
    ];

    const results = await this.processor.batchProcessDocuments(documents);
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Processed ${successful}/${documents.length} knowledge documents\n`);
  }

  async generatePropertySpecificKnowledge() {
    console.log('🏠 Generating property-specific knowledge...');
    
    // Simulate property data from database
    const properties = [
      {
        id: 'prop_001',
        name: 'Studio Moderno Centro',
        location: 'Rua Augusta, 1000 - Centro, São Paulo',
        type: 'studio',
        amenities: ['WiFi', 'AC', 'Kitchen', 'TV', 'Workspace'],
        specialFeatures: [
          'Vista panorâmica da cidade',
          'Localização central próxima ao metrô',
          'Ideal para viajantes de negócios',
          'Mercados e restaurantes a 2 minutos'
        ],
        checkInInstructions: 'Chaves disponíveis no cofre da entrada (código enviado 2h antes)',
        neighborhood: 'Centro histórico com fácil acesso a transporte público'
      },
      {
        id: 'prop_002',
        name: 'Apartamento Família Jardins',
        location: 'Alameda Jasmim, 250 - Jardins, São Paulo',
        type: '2_bedroom',
        amenities: ['WiFi', 'AC', 'Full Kitchen', 'Balcony', 'Parking'],
        specialFeatures: [
          'Ideal para famílias',
          'Varanda com vista para o jardim',
          'Próximo ao Parque Ibirapuera',
          'Bairro nobre com segurança 24h'
        ],
        checkInInstructions: 'Recepção do prédio das 8h às 18h, após horário usar interfone',
        neighborhood: 'Jardins, com shopping centers e restaurantes gourmet'
      }
    ];

    for (const property of properties) {
      const propertyContent = `
        PROPRIEDADE: ${property.name}
        ID: ${property.id}
        
        LOCALIZAÇÃO: ${property.location}
        TIPO: ${property.type.replace('_', ' ')}
        
        COMODIDADES DISPONÍVEIS:
        ${property.amenities.map(a => `- ${a}`).join('\n        ')}
        
        CARACTERÍSTICAS ESPECIAIS:
        ${property.specialFeatures.map(f => `- ${f}`).join('\n        ')}
        
        INSTRUÇÕES DE CHECK-IN:
        ${property.checkInInstructions}
        
        SOBRE O BAIRRO:
        ${property.neighborhood}
        
        DICAS IMPORTANTES:
        - Verificar todos os equipamentos no check-in
        - Reportar qualquer problema imediatamente
        - Manter o apartamento organizado
        - Respeitar regras do condomínio
      `;

      await this.ragService.addCustomKnowledge(
        propertyContent,
        'property',
        {
          propertyId: property.id,
          propertyName: property.name,
          type: 'property_guide',
          lastUpdated: new Date().toISOString()
        }
      );
    }
    
    console.log(`✅ Generated knowledge for ${properties.length} properties\n`);
  }

  async addCleaningProtocols() {
    console.log('🧹 Adding cleaning protocols...');
    
    const cleaningProtocols = [
      {
        content: `
          PROTOCOLO DE LIMPEZA PÓS-HOSPEDAGEM
          
          1. PREPARAÇÃO (10 min)
          - Reunir todos os materiais necessários
          - Verificar checklist de limpeza
          - Documentar estado inicial com fotos
          
          2. COLETA E ORGANIZAÇÃO (15 min)
          - Remover todo lixo e itens esquecidos
          - Recolher roupa de cama e toalhas usadas
          - Organizar móveis e objetos
          
          3. BANHEIRO (25 min)
          - Limpar e desinfetar vaso sanitário
          - Limpar box, azulejos e metais
          - Trocar toalhas e produtos de higiene
          - Verificar funcionamento do chuveiro
          
          4. COZINHA (20 min)
          - Limpar geralço, cooktop e forno
          - Limpar geladeira por dentro
          - Lavar louças e utensílios
          - Repor itens de boas-vindas
          
          5. QUARTOS E SALA (30 min)
          - Trocar roupa de cama
          - Aspirar carpetes e limpar pisos
          - Limpar superfícies e móveis
          - Testar equipamentos (TV, AC, WiFi)
          
          6. VERIFICAÇÃO FINAL (10 min)
          - Conferir checklist completo
          - Tirar fotos do estado final
          - Deixar apartamento pronto para próximo hóspede
        `,
        metadata: { protocol_type: 'post_checkout', estimated_time: '110 minutes' },
        domain: 'cleaning'
      },
      {
        content: `
          PRODUTOS APROVADOS PARA LIMPEZA
          
          MULTIUSO:
          - Veja Multiuso (diluir 1:10)
          - Álcool 70% para desinfecção
          - Detergente neutro biodegradvel
          
          BANHEIRO:
          - Viakal para metais e box
          - Pato Purific para vaso sanitário
          - Cif Cremoso para azulejos
          
          COZINHA:
          - Sabão de coco para louças
          - Bicarbonato para geladeira
          - Removedor de gordura ecológico
          
          PISOS:
          - Bona para pisos de madeira
          - Flash para cerâmica
          - Aspirador com filtro HEPA
          
          PRODUTOS PROIBIDOS:
          - Ácidos fortes (muriatico)
          - Alvejante com cloro
          - Produtos abrasivos
          - Aeróis com CFC
        `,
        metadata: { category: 'approved_products', safety_level: 'eco_friendly' },
        domain: 'cleaning'
      }
    ];

    for (const protocol of cleaningProtocols) {
      await this.ragService.addCustomKnowledge(
        protocol.content,
        protocol.domain,
        protocol.metadata
      );
    }
    
    console.log(`✅ Added ${cleaningProtocols.length} cleaning protocols\n`);
  }

  async addMaintenanceProcedures() {
    console.log('🔧 Adding maintenance procedures...');
    
    const maintenanceProcedures = [
      {
        content: `
          MANUAL DE MANUTENÇÃO PREVENTIVA
          
          SEMANAL:
          - Verificar funcionamento de fechaduras
          - Testar chuveiros e pressão da água
          - Conferir limpeza de filtros de AC
          - Verificar lâmpadas queimadas
          
          QUINZENAL:
          - Limpeza profunda de filtros de AC
          - Teste completo de equipamentos eletrônicos
          - Verificação de vazamentos
          - Conferência de kit de boas-vindas
          
          MENSAL:
          - Teste de sistema elétrico
          - Verificação de vedantes em janelas
          - Limpeza de caixas d'água
          - Atualização de senhas WiFi se necessário
          
          TRIMESTRAL:
          - Manutenção completa de eletrodomésticos
          - Pintura de retoques se necessário
          - Verificação estrutural
          - Atualização de equipamentos
        `,
        metadata: { type: 'preventive_maintenance', frequency: 'scheduled' },
        domain: 'maintenance'
      },
      {
        content: `
          SOLUÇÕES PARA PROBLEMAS COMUNS
          
          AR CONDICIONADO NÃO FUNCIONA:
          1. Verificar se está ligado na tomada
          2. Conferir configuração do controle remoto
          3. Limpar filtros se estiverem sujos
          4. Verificar disjuntor
          5. Se persistir, chamar técnico: (11) 9999-1111
          
          PROBLEMAS COM ÁGUA:
          - Falta de água: Verificar registro geral
          - Pressão baixa: Limpar arejadores
          - Vazamento: Fechar registro e chamar encanador
          - Água amarelada: Deixar correr e avisar administração
          
          PROBLEMAS ELÉTRICOS:
          - Falta de energia: Verificar disjuntores
          - Tomadas não funcionam: Testar outras tomadas
          - Luzes piscando: Problema na rede, chamar eletricista
          
          WiFi INSTÁVEL:
          1. Reiniciar roteador (desligar 30s)
          2. Verificar cabos
          3. Testar em diferentes dispositivos
          4. Contatar provedor: (11) 0800-123-4567
        `,
        metadata: { type: 'troubleshooting', urgency: 'immediate_response' },
        domain: 'maintenance'
      }
    ];

    for (const procedure of maintenanceProcedures) {
      await this.ragService.addCustomKnowledge(
        procedure.content,
        procedure.domain,
        procedure.metadata
      );
    }
    
    console.log(`✅ Added ${maintenanceProcedures.length} maintenance procedures\n`);
  }

  async addGuestManagementWorkflows() {
    console.log('👥 Adding guest management workflows...');
    
    const guestWorkflows = [
      {
        content: `
          PROCESSO DE CHECK-IN DIGITAL
          
          2 HORAS ANTES:
          - Enviar mensagem com código do cofre
          - Confirmar horário de chegada
          - Enviar instruções de acesso ao prédio
          
          NA CHEGADA:
          - Hóspede retira chave do cofre
          - Envia foto confirmando entrada
          - Recebe mensagem de boas-vindas automática
          
          PRIMEIRA HORA:
          - Verificar se hóspede conseguiu entrar
          - Enviar guia digital da propriedade
          - Disponibilizar contato para dúvidas
          
          MENSAGEM DE BOAS-VINDAS PADRÃO:
          Olá [NOME]! Bem-vindo(a) ao seu apartamento MariaIntelligence! 
          
          🗺️ WiFi: [REDE] / Senha: [SENHA]
          🏢 Endereço completo: [ENDEREÇO]
          📞 Emergências: (11) 99999-0000
          
          Sua estadia inclui:
          ✅ Café e chá de cortesia
          ✅ Kit de higiene completo
          ✅ Roupa de cama e banho
          ✅ Suporte 24/7
          
          Dúvidas? Estou à disposição!
        `,
        metadata: { workflow_type: 'check_in', automation: 'digital' },
        domain: 'guest_management'
      }
    ];

    for (const workflow of guestWorkflows) {
      await this.ragService.addCustomKnowledge(
        workflow.content,
        workflow.domain,
        workflow.metadata
      );
    }
    
    console.log(`✅ Added ${guestWorkflows.length} guest management workflows\n`);
  }

  async addLocalServicesKnowledge() {
    console.log('🗺️ Adding local services knowledge...');
    
    const localServices = [
      {
        content: `
          GUIA DE SERVIÇOS LOCAIS - CENTRO/JARDINS SÃO PAULO
          
          SUPERMERCADOS (24H):
          - Extra Hipódromo: Av. 9 de Julho, 5566 (1.2km)
          - Pão de Açúcar: Rua Augusta, 2932 (800m)
          - Carrefour Express: Al. Lorena, 1471 (900m)
          
          FARMÁCIAS:
          - Drogasil: Rua Oscar Freire, 909 (24h)
          - Pacheco: Av. Paulista, 1842
          - São Paulo: Rua Augusta, 1508
          
          RESTAURANTES RECOMENDADOS:
          - Café da Manhã: Padaria Bella Paulista
          - Almoço: Aoyama (japonês) - R$45-60
          - Jantar: Varanda Grill - R$80-120
          - Lanche: McDonald's 24h - Shopping Cidade
          
          TRANSPORTE:
          - Metrô mais próximo: Estação Consolacao (Linha Verde)
          - Ponto de ônibus: Linhas 702, 875, 209
          - Uber/99: Média R$12-25 para pontos turísticos
          - Bike Itau: Estações a 200m
        `,
        metadata: { area: 'centro_jardins', category: 'services' },
        domain: 'local_services'
      }
    ];

    for (const service of localServices) {
      await this.ragService.addCustomKnowledge(
        service.content,
        service.domain,
        service.metadata
      );
    }
    
    console.log(`✅ Added ${localServices.length} local services guides\n`);
  }

  async displayStatistics() {
    console.log('📊 Knowledge Base Statistics');
    console.log('===============================');
    
    const stats = await this.ragService.getKnowledgeStats();
    
    console.log(`Total Knowledge Entries: ${stats.totalEntries}`);
    console.log('\nEntries by Domain:');
    
    for (const [domain, count] of Object.entries(stats.domainStats)) {
      console.log(`  ${domain}: ${count} entries`);
    }
    
    console.log(`\nLast Updated: ${stats.lastUpdated}`);
  }
}

// Run the knowledge base builder
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new KnowledgeBaseBuilder();
  builder.run();
}

export default KnowledgeBaseBuilder;
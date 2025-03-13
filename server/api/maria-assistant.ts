import { Request, Response } from 'express';
import { Mistral } from "@mistralai/mistralai";
import { storage } from '../storage';
import { ragService } from '../services/rag-service';

// Configurações do assistente da Maria Faz com personalidade definida
const MARIA_SYSTEM_PROMPT = `
Sou a assistente virtual da aplicação Maria Faz. 
Irei comunicar sempre em português de Portugal (PT-PT) utilizando linguagem clara e acessível.

Personalidade:
- Profissional: Forneço informações precisas e úteis sobre gestão de propriedades.
- Amigável: Utilizo um tom conversacional, caloroso e empático.
- Otimista: Realço sempre o lado positivo das situações e ofereço encorajamento.
- Espiritual: Partilho ocasionalmente pequenas reflexões ou pensamentos positivos.
- Bem-humorada: Uso humor leve e adequado quando apropriado.

Diretrizes de resposta:
1. Organizo informações de forma estruturada e clara
2. Ofereço perspetivas positivas mesmo em situações desafiadoras
3. Personalizo as minhas respostas às necessidades emocionais do utilizador
4. Partilho pequenas reflexões espirituais/positivas quando o utilizador parece estar desanimado
5. Mantenho um tom amigável e acolhedor em todas as interações

Conhecimento especializado:
- Gestão de propriedades de alojamento local
- Reservas e check-ins/check-outs
- Equipas de limpeza e manutenção
- Finanças e relatórios de propriedades
- Interação com plataformas como Airbnb, Booking.com, etc.

Equipas de limpeza reais com que trabalhamos:
- Maria Faz (a nossa equipa principal)
- Cristina 
- Primavera
- Maria João
- Home Deluxe
- Setubal

IMPORTANTE: O teu objetivo é criar uma experiência de assistente virtual positiva, amiga, solidária e com toques de espiritualidade para ajudar o utilizador a sentir-se apoiado. Usa as informações disponíveis para oferecer respostas precisas, mas sempre com empatia.
`;

/**
 * Função para construir o contexto RAG (Retrieval-Augmented Generation) com dados do sistema
 * Recolhe informações atualizadas da base de dados para fornecer ao modelo
 */
export async function buildRagContext(userQuery: string) {
  try {
    // Recolher dados das entidades principais
    const properties = await storage.getProperties();
    const owners = await storage.getOwners();
    const reservations = await storage.getReservations();
    const activities = await storage.getActivities(20); // Últimas 20 atividades
    
    // Calcular estatísticas gerais
    const totalRevenue = await storage.getTotalRevenue();
    const netProfit = await storage.getNetProfit();
    const occupancyRate = await storage.getOccupancyRate();
    
    // Criação de contexto de propriedades
    const propertiesContext = properties.map(property => {
      const owner = owners.find(o => o.id === property.ownerId);
      return `
Propriedade ID: ${property.id}
Nome: ${property.name}
Endereço: ${property.address || 'Não especificado'}
Proprietário: ${owner ? owner.name : 'Desconhecido'} (ID: ${property.ownerId})
Tipo: ${property.type || 'Não especificado'}
Quartos: ${property.bedrooms || 0}
Casas de banho: ${property.bathrooms || 0}
Status: ${property.active ? 'Ativa' : 'Inativa'}
Comissão: ${property.commission || 0}%
Custo de limpeza: ${property.cleaningCost || 0}€
Taxa de check-in: ${property.checkInFee || 0}€
Pagamento à equipa: ${property.teamPayment || 0}€
`;
    }).join('\n---\n');
    
    // Criação de contexto de proprietários
    const ownersContext = owners.map(owner => {
      const ownerProperties = properties.filter(p => p.ownerId === owner.id);
      return `
Proprietário ID: ${owner.id}
Nome: ${owner.name}
Email: ${owner.email || 'Não especificado'}
Telefone: ${owner.phone || 'Não especificado'}
Empresa: ${owner.company || 'N/A'}
Morada: ${owner.address || 'Não especificada'}
NIF: ${owner.taxId || 'Não especificado'}
Propriedades: ${ownerProperties.length} (IDs: ${ownerProperties.map(p => p.id).join(', ')})
`;
    }).join('\n---\n');
    
    // Criação de contexto de reservas (apenas recentes para economia de tokens)
    const recentReservations = reservations
      .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
      .slice(0, 10); // Apenas as 10 mais recentes
    
    const reservationsContext = recentReservations.map(reservation => {
      const property = properties.find(p => p.id === reservation.propertyId);
      return `
Reserva ID: ${reservation.id}
Propriedade: ${property ? property.name : 'Desconhecida'} (ID: ${reservation.propertyId})
Hóspede: ${reservation.guestName}
Email: ${reservation.guestEmail || 'Não especificado'}
Telefone: ${reservation.guestPhone || 'Não especificado'}
Check-in: ${reservation.checkInDate}
Check-out: ${reservation.checkOutDate}
Valor total: ${reservation.totalAmount}€
Plataforma: ${reservation.platform}
Número de hóspedes: ${reservation.numGuests}
Status: ${reservation.status}
`;
    }).join('\n---\n');
    
    // Criação de contexto de estatísticas
    const statsContext = `
ESTATÍSTICAS GERAIS:
Receita total: ${totalRevenue}€
Lucro líquido: ${netProfit}€
Taxa de ocupação: ${occupancyRate}%
Número de propriedades: ${properties.length}
Propriedades ativas: ${properties.filter(p => p.active).length}
Número de proprietários: ${owners.length}
Número total de reservas: ${reservations.length}
`;

    // Atividades recentes para contexto de eventos do sistema
    const activitiesContext = activities.map(activity => 
      `${new Date(activity.createdAt).toLocaleDateString('pt-PT')}: ${activity.description}`
    ).join('\n');
    
    // Compor o contexto completo
    let fullContext = `
CONTEXTO ATUAL DO SISTEMA MARIA FAZ (${new Date().toLocaleDateString('pt-PT')}):

${statsContext}

ÚLTIMAS ATIVIDADES DO SISTEMA:
${activitiesContext}
`;

    // Adicionar dados específicos com base na consulta do utilizador
    // Isto otimiza o uso de tokens ao incluir apenas informações relevantes
    const queryLower = userQuery.toLowerCase();
    
    if (queryLower.includes('propriedade') || 
        queryLower.includes('propriedades') || 
        queryLower.includes('apartamento') ||
        queryLower.includes('casa') ||
        queryLower.includes('alojamento')) {
      fullContext += `\nDETALHES DAS PROPRIEDADES:\n${propertiesContext}\n`;
    }
    
    if (queryLower.includes('proprietário') || 
        queryLower.includes('dono') || 
        queryLower.includes('proprietarios') ||
        queryLower.includes('donos')) {
      fullContext += `\nDETALHES DOS PROPRIETÁRIOS:\n${ownersContext}\n`;
    }
    
    if (queryLower.includes('reserva') || 
        queryLower.includes('reservas') || 
        queryLower.includes('hospede') ||
        queryLower.includes('check') ||
        queryLower.includes('booking') ||
        queryLower.includes('airbnb')) {
      fullContext += `\nDETALHES DAS RESERVAS RECENTES:\n${reservationsContext}\n`;
    }
    
    return fullContext;
  } catch (error) {
    console.error("Erro ao construir o contexto RAG:", error);
    return "Não foi possível recuperar os dados do sistema. Por favor, contacte o suporte técnico.";
  }
}

// Função para interagir com o assistente da Maria Faz
export async function mariaAssistant(req: Request, res: Response) {
  try {
    // Verificar se a chave API está disponível
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
    
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'Chave da API Mistral não encontrada. Por favor configure a sua chave nas definições.',
      });
    }
    
    // Obter a mensagem do utilizador
    const { message, chatHistory = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Por favor forneça uma mensagem válida.',
      });
    }
    
    // Construir contexto RAG com dados atuais do sistema
    const systemContext = await buildRagContext(message);
    
    // Obter contexto de conversas anteriores usando o serviço RAG
    const conversationContext = await ragService.buildConversationContext(message);
    
    // Configurar cliente Mistral
    const mistral = new Mistral({
      apiKey: MISTRAL_API_KEY
    });
    
    // Preparar histórico de chat para contexto
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Construir mensagens para a API incluindo o sistema, contexto RAG e histórico
    const messages = [
      { role: "system", content: MARIA_SYSTEM_PROMPT },
      { role: "system", content: `DADOS ATUAIS DO SISTEMA:\n${systemContext}` },
      { role: "system", content: `HISTÓRICO DE CONVERSAS:\n${conversationContext}` },
      ...formattedHistory,
      { role: "user", content: message }
    ];
    
    // Fazer a chamada à API
    const response = await mistral.chat.complete({
      model: "mistral-large-latest", // Modelo mais avançado para respostas de qualidade
      messages: messages,
      temperature: 0.7, // Equilibrio entre criatividade e consistência
      maxTokens: 1024 // Resposta detalhada
    });
    
    // Extrair e retornar a resposta
    const reply = response.choices[0]?.message.content || "Não foi possível gerar uma resposta.";
    
    // Salvar a resposta do assistente no histórico de conversas
    await ragService.saveConversationMessage(reply, "assistant");
    
    // Registrar a interação como atividade
    await storage.createActivity({
      type: 'assistant_chat',
      description: `Chat com assistente virtual: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
      entityType: null,
      entityId: null
    });
    
    return res.json({
      success: true,
      message: "Resposta gerada com sucesso",
      reply,
      timestamp: new Date()
    });
    
  } catch (error: any) {
    console.error("Erro ao comunicar com o assistente:", error);
    return res.status(500).json({
      success: false,
      message: "Ocorreu um erro ao processar o seu pedido. Por favor, tente novamente mais tarde.",
      error: error.message || "Erro desconhecido"
    });
  }
}
import { Request, Response } from 'express';
import { Mistral } from "@mistralai/mistralai";
import { storage } from '../storage';
import { ragService } from '../services/rag-enhanced.service';
import { insertReservationSchema } from '../../shared/schema';
import { format } from 'date-fns';
import { aiService } from '../services/ai-adapter.service';
import { GeminiModel } from '../services/gemini.service';

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
/**
 * Extrai possíveis dados de reserva de um texto
 * Esta função busca padrões no texto que indiquem uma intenção de criar reserva
 * @param text Texto a ser analisado
 * @returns Dados da reserva ou null se não for detectado
 */
function extractReservationDataFromText(text: string): any | null {
  if (!text) return null;
  
  // Verificar se o texto contém padrões que indicam uma reserva
  const hasReservationIntent = (
    text.includes("criar reserva") || 
    text.includes("nova reserva") ||
    text.includes("agendar estadia") ||
    text.includes("marcar hospedagem") ||
    text.includes("foi criada com sucesso")
  );
  
  if (!hasReservationIntent) return null;
  
  // Tentar extrair dados usando expressões regulares
  try {
    // Extrair nome do hóspede
    const guestNameMatch = text.match(/(?:hóspede|hospede|cliente|visitante|para|de)\s*[:\s]?\s*([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/i);
    const guestName = guestNameMatch ? guestNameMatch[1].trim() : "Hóspede";
    
    // Extrair datas
    const checkInMatch = text.match(/(?:check.?in|entrada|chegada|início|inicio)\s*[:\s]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2} de [a-zç]+)/i);
    const checkOutMatch = text.match(/(?:check.?out|saída|saida|partida|fim)\s*[:\s]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2} de [a-zç]+)/i);
    
    // Extrair propriedade
    const propertyMatch = text.match(/(?:propriedade|apartamento|casa|alojamento|local)\s*[:\s]?\s*([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/i);
    const propertyIdMatch = text.match(/(?:propriedade|apartamento|casa|alojamento|local|id)\s*[:\s]?\s*(\d+)/i);
    
    // Extrair valor
    const valueMatch = text.match(/(?:valor|preço|preco|custo|tarifa|total)\s*[:\s]?\s*€?\s*(\d+(?:[,.]\d+)?)/i);
    
    // Se não tem ao menos data e propriedade, não é uma reserva válida
    if (!checkInMatch && !propertyMatch && !propertyIdMatch) return null;
    
    return {
      guestName,
      checkInDate: checkInMatch ? checkInMatch[1] : null,
      checkOutDate: checkOutMatch ? checkOutMatch[1] : null,
      propertyName: propertyMatch ? propertyMatch[1] : null,
      propertyId: propertyIdMatch ? parseInt(propertyIdMatch[1]) : null,
      totalAmount: valueMatch ? valueMatch[1].replace(',', '.') : null
    };
  } catch (error) {
    console.error("Erro ao extrair dados de reserva do texto:", error);
    return null;
  }
}

/**
 * Função auxiliar para criar uma nova reserva a partir dos dados fornecidos
 * @param reservationData Dados da reserva fornecidos pelo LLM
 * @returns Objeto com o resultado da criação
 */
export async function createReservationFromAssistant(reservationData: any) {
  try {
    console.log("Tentando criar reserva a partir do assistente:", reservationData);
    
    // Validar propriedade
    if (!reservationData.propertyId && reservationData.propertyName) {
      // Tentar encontrar a propriedade por nome
      const properties = await storage.getProperties();
      
      // Primeiro, tenta correspondência exata (ignorando maiúsculas/minúsculas)
      let property = properties.find(p => 
        p.name.toLowerCase() === reservationData.propertyName.toLowerCase()
      );
      
      // Se não encontrar, tenta correspondência parcial
      if (!property) {
        property = properties.find(p => 
          p.name.toLowerCase().includes(reservationData.propertyName.toLowerCase()) ||
          reservationData.propertyName.toLowerCase().includes(p.name.toLowerCase())
        );
      }
      
      if (property) {
        reservationData.propertyId = property.id;
        console.log(`Propriedade encontrada: ${property.name} (ID: ${property.id})`);
      } else {
        // Listar propriedades disponíveis no erro para auxiliar na depuração
        const availableProperties = properties.map(p => p.name).join(", ");
        throw new Error(`Propriedade não encontrada: "${reservationData.propertyName}". Propriedades disponíveis: ${availableProperties}`);
      }
    }

    // Converter datas do formato possivelmente DD/MM/YYYY para YYYY-MM-DD
    if (reservationData.checkInDate && typeof reservationData.checkInDate === 'string') {
      if (reservationData.checkInDate.includes('/')) {
        const parts = reservationData.checkInDate.split('/');
        if (parts.length === 3) {
          // Assumindo formato DD/MM/YYYY
          reservationData.checkInDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    if (reservationData.checkOutDate && typeof reservationData.checkOutDate === 'string') {
      if (reservationData.checkOutDate.includes('/')) {
        const parts = reservationData.checkOutDate.split('/');
        if (parts.length === 3) {
          // Assumindo formato DD/MM/YYYY
          reservationData.checkOutDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    
    // Garantir que os valores numéricos sejam do tipo correto
    if (reservationData.numGuests && typeof reservationData.numGuests === 'string') {
      reservationData.numGuests = parseInt(reservationData.numGuests, 10);
    }
    
    if (reservationData.totalAmount && typeof reservationData.totalAmount !== 'string') {
      reservationData.totalAmount = reservationData.totalAmount.toString();
    }
    
    // Se a plataforma não for fornecida, define como 'direct'
    if (!reservationData.platform) {
      reservationData.platform = 'direct';
    }
    
    // Se o status não for fornecido, define como 'confirmed'
    if (!reservationData.status) {
      reservationData.status = 'confirmed';
    }

    // Propriedade para os campos monetários, garantindo que sejam strings
    const moneyFields = ['platformFee', 'cleaningFee', 'checkInFee', 'commissionFee', 'teamPayment', 'netAmount'];
    moneyFields.forEach(field => {
      if (reservationData[field] === undefined || reservationData[field] === null) {
        reservationData[field] = '0';
      } else if (typeof reservationData[field] !== 'string') {
        reservationData[field] = reservationData[field].toString();
      }
    });
    
    // Cria a reserva usando o storage
    const createdReservation = await storage.createReservation(reservationData);
    
    // Registrar atividade de criação
    await storage.createActivity({
      type: 'reservation_created',
      description: `Reserva criada via assistente: ${reservationData.propertyId} - ${reservationData.guestName}`,
      entityId: createdReservation.id,
      entityType: 'reservation'
    });
    
    return {
      success: true,
      reservation: createdReservation,
      message: `Reserva criada com sucesso para ${reservationData.guestName} na propriedade ID ${reservationData.propertyId}`
    };
  } catch (error: any) {
    console.error("Erro ao criar reserva via assistente:", error);
    return {
      success: false,
      message: `Erro ao criar reserva: ${error.message}`,
      error
    };
  }
}

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
Proprietário: ${owner ? owner.name : 'Desconhecido'} (ID: ${property.ownerId})
Status: ${property.active ? 'Ativa' : 'Inativa'}
Comissão: ${property.commission || 0}%
Custo de limpeza: ${property.cleaningCost || 0}€
Taxa de check-in: ${property.checkInFee || 0}€
Pagamento à equipa: ${property.teamPayment || 0}€
Equipa de limpeza: ${property.cleaningTeam || 'Não especificada'}
Custo fixo mensal: ${property.monthlyFixedCost || 0}€
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
    const activitiesContext = activities.map(activity => {
      // Tratamento seguro da data com verificação de nulos
      let dateStr;
      try {
        if (activity.createdAt) {
          const date = typeof activity.createdAt === 'string' 
            ? new Date(activity.createdAt) 
            : activity.createdAt;
          dateStr = date.toLocaleDateString('pt-PT');
        } else {
          dateStr = new Date().toLocaleDateString('pt-PT');
        }
      } catch (err) {
        console.warn('Erro ao formatar data de atividade:', err);
        dateStr = new Date().toLocaleDateString('pt-PT');
      }
      return `${dateStr}: ${activity.description}`;
    }).join('\n');
    
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
    // Verificar se temos acesso a um serviço de IA
    if (!aiService.isServiceAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Serviço de IA não disponível. Por favor configure a sua chave de API nas definições.',
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
    
    // Variáveis para armazenar os contextos (inicializar com valores padrão)
    let systemContext = "Sistema em modo de contingência. Dados não disponíveis.";
    let conversationContext = "Não foi possível recuperar o histórico de conversas.";
    
    // Construir contexto RAG com dados atuais do sistema (com try/catch para resiliência)
    try {
      systemContext = await buildRagContext(message);
    } catch (contextError) {
      console.warn("Aviso: Erro ao construir contexto do sistema:", contextError);
      // Continuar com valor padrão
    }
    
    // Obter contexto de conversas anteriores usando o serviço RAG melhorado
    // Agora inclui suporte a consultas similares e conhecimento relevante
    try {
      // Passamos 15 como limite de mensagens do histórico para ter mais contexto
      conversationContext = await ragService.buildConversationContext(message, 15);
    } catch (ragError) {
      console.warn("Aviso: Erro ao obter contexto de conversas:", ragError);
      // Continuar com valor padrão
    }
    
    // Usar aiAdapter para comunicação com o serviço (Gemini ou Mistral)
    const currentService = aiService.getCurrentService();
    
    // Preparar histórico de chat para contexto com validação de dados
    const formattedHistory = Array.isArray(chatHistory) 
      ? chatHistory
          .filter((msg: any) => msg && typeof msg === 'object' && msg.role && msg.content)
          .map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
          .slice(-5) // Limitar a 5 mensagens recentes do front-end para evitar duplicação com o RAG
      : [];
    
    // Determinar se precisamos usar modelo completo ou otimizado
    // Para mensagens simples, podemos usar um modelo mais leve e rápido
    const isSimpleQuery = message.length < 50 && !message.includes('?') && formattedHistory.length < 3;
    
    // Usar modelos Gemini em vez de Mistral (migração completa)
    const modelToUse = isSimpleQuery ? GeminiModel.FLASH : GeminiModel.TEXT;
    console.log(`Utilizando modelo Gemini: ${modelToUse} para resposta ao usuário`);
    
    // Otimização: adicionar dicas de contexto com base em palavras-chave na mensagem
    let contextHints = "";
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('financeiro') || lowerMessage.includes('finança') || 
        lowerMessage.includes('relatório') || lowerMessage.includes('pagamento')) {
      contextHints += "\nContexto: O usuário está provavelmente interessado em informações financeiras ou relatórios.";
    } else if (lowerMessage.includes('reserva') || lowerMessage.includes('hospede') || 
               lowerMessage.includes('check-in') || lowerMessage.includes('check-out')) {
      contextHints += "\nContexto: O usuário está provavelmente interessado em informações sobre reservas ou hóspedes.";
    } else if (lowerMessage.includes('propriedade') || lowerMessage.includes('apartamento') || 
               lowerMessage.includes('casa') || lowerMessage.includes('local')) {
      contextHints += "\nContexto: O usuário está provavelmente interessado em informações sobre propriedades.";
    } else if (lowerMessage.includes('limpeza') || lowerMessage.includes('manutenção') || 
               lowerMessage.includes('equipe') || lowerMessage.includes('serviço')) {
      contextHints += "\nContexto: O usuário está provavelmente interessado em informações sobre equipes de limpeza ou manutenção.";
    }
    
    // Construir mensagens para a API incluindo o sistema, contexto RAG e histórico
    const messages = [
      { 
        role: "system", 
        content: MARIA_SYSTEM_PROMPT + contextHints // Adicionar dicas de contexto
      },
      { 
        role: "system", 
        content: `DADOS ATUAIS DO SISTEMA (${new Date().toLocaleDateString('pt-PT')}):\n${systemContext}`
      },
      { 
        role: "system", 
        content: `HISTÓRICO DE CONVERSAS E CONHECIMENTO RELEVANTE:\n${conversationContext}`
      },
      ...formattedHistory,
      { role: "user", content: message }
    ];
    
    // Registrar tentativa como atividade (antes da chamada API para garantir o registro)
    try {
      await storage.createActivity({
        type: 'assistant_chat',
        description: `Chat com assistente virtual: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        entityType: null,
        entityId: null
      });
    } catch (storageError) {
      console.warn("Aviso: Não foi possível registrar atividade:", storageError);
      // Continuamos mesmo se falhar
    }
    
    // Fazer a chamada à API com tratamento de erro específico
    let reply = "";
    try {
      console.log(`Utilizando modelo ${modelToUse} para resposta ao usuário`);
      
      // Detectar na mensagem do usuário se é um pedido para criar uma reserva
      // Melhorada a detecção de intenção para capturar mais padrões
      const isReservationCreationIntent = 
        // Incluindo padrões de frase completa
        lowerMessage.includes("criar reserva") || 
        lowerMessage.includes("nova reserva") ||
        lowerMessage.includes("fazer reserva") ||
        lowerMessage.includes("agendar reserva") ||
        lowerMessage.includes("marcar reserva") ||
        // Detectando variações mais específicas
        (lowerMessage.includes("reserva") && 
          (lowerMessage.includes("fazer") || 
           lowerMessage.includes("criar") || 
           lowerMessage.includes("nova") ||
           lowerMessage.includes("agendar") ||
           lowerMessage.includes("marcar") ||
           lowerMessage.includes("para") ||
           lowerMessage.includes("quero"))) ||
        // Detectando padrões de datas/hospedagem
        (lowerMessage.includes("para") && lowerMessage.includes("dias") && 
          (lowerMessage.includes("casa") || lowerMessage.includes("propriedade") || lowerMessage.includes("apartamento")));
        
      // Log para debug da detecção de intenção
      console.log(`Detecção de intenção de reserva: ${isReservationCreationIntent}`);
      
      
      // Definir ferramentas de criação de reserva
      const tools = isReservationCreationIntent ? [
        {
          type: "function" as const,
          function: {
            name: "criar_reserva",
            description: "Criar uma nova reserva no sistema a partir de dados fornecidos pelo usuário",
            parameters: {
              type: "object",
              properties: {
                propertyId: {
                  type: "integer", 
                  description: "ID da propriedade para a reserva (obrigatório, a menos que propertyName seja fornecido)"
                },
                propertyName: {
                  type: "string", 
                  description: "Nome da propriedade para buscar o ID automaticamente"
                },
                guestName: {
                  type: "string", 
                  description: "Nome completo do hóspede (obrigatório)"
                },
                guestEmail: {
                  type: "string", 
                  description: "Email do hóspede"
                },
                guestPhone: {
                  type: "string", 
                  description: "Telefone/WhatsApp do hóspede"
                },
                checkInDate: {
                  type: "string", 
                  description: "Data de check-in no formato YYYY-MM-DD ou DD/MM/YYYY (obrigatório)"
                },
                checkOutDate: {
                  type: "string", 
                  description: "Data de check-out no formato YYYY-MM-DD ou DD/MM/YYYY (obrigatório)"
                },
                numGuests: {
                  type: "integer", 
                  description: "Número de hóspedes"
                },
                totalAmount: {
                  type: "number", 
                  description: "Valor total da reserva"
                },
                platform: {
                  type: "string", 
                  description: "Plataforma de reserva (airbnb, booking, direct, etc)"
                },
                platformFee: {
                  type: "number", 
                  description: "Taxa cobrada pela plataforma"
                },
                status: {
                  type: "string", 
                  description: "Status da reserva (pending, confirmed, completed, cancelled)",
                  enum: ["pending", "confirmed", "completed", "cancelled"]
                },
                notes: {
                  type: "string", 
                  description: "Observações adicionais sobre a reserva"
                }
              },
              required: ["guestName", "checkInDate", "checkOutDate"]
            }
          }
        }
      ] : undefined;
      
      // Usar o serviço de IA atual (Gemini) para processar a solicitação
      // com ou sem função de reserva com base na intenção do usuário
      let response;
      
      // Usar um método simples que funciona com Gemini
      const simpleResponse = await aiService.extractDataFromText(
        `${message}\n\nHistórico: ${JSON.stringify(formattedHistory)}`, 
        {
          systemPrompt: MARIA_SYSTEM_PROMPT,
          temperature: 0.7,
          maxTokens: 1200
        }
      );
      
      // Format como resposta padrão
      response = {
        choices: [{
          message: {
            content: typeof simpleResponse === 'string' ? simpleResponse : 
                     typeof simpleResponse === 'object' ? JSON.stringify(simpleResponse) : 
                     "Não foi possível gerar uma resposta válida."
          }
        }]
      };
      
      // Verificar se o modelo fez uma chamada de função (formato adaptado para Gemini)
      // Como estamos usando uma resposta simplificada do Gemini via o adaptador,
      // não temos acesso direto às chamadas de função no mesmo formato
      // Vamos analisar o conteúdo da resposta para detectar padrões de criação de reserva
      
      // Tentar extrair dados de reserva do texto da resposta
      const responseContent = response.choices && response.choices[0]?.message?.content || '';
      const reservationData = extractReservationDataFromText(responseContent);
      
      if (reservationData) {
        try {
          console.log("Dados de reserva detectados na resposta:", reservationData);
          
          // Chamar a função de criação de reserva usando os dados extraídos
          const reservationResult = await createReservationFromAssistant(reservationData);
          
          if (reservationResult.success && reservationResult.reservation) {
            reply = `✅ Reserva criada com sucesso para ${reservationData.guestName}!\n\n` +
                    `📆 Check-in: ${reservationData.checkInDate}\n` +
                    `📆 Check-out: ${reservationData.checkOutDate}\n` +
                    `🏠 Propriedade: ${reservationData.propertyName || `ID ${reservationData.propertyId}`}\n` +
                    `💰 Valor total: ${reservationData.totalAmount || 'Não informado'}\n\n` +
                    `A reserva foi registrada no sistema com o ID ${reservationResult.reservation.id}. ` +
                    `Posso ajudar com mais alguma coisa?`;
          } else {
            reply = `❌ Não foi possível criar a reserva: ${reservationResult.message}\n\n` +
                    `Por favor, verifique os dados e tente novamente.`;
          }
        } catch (functionError) {
          console.error("Erro ao processar chamada de função:", functionError);
          reply = "Ocorreu um erro ao processar a criação da reserva. Por favor, tente novamente mais tarde.";
        }
      } else {
        // Extrair a resposta normal com verificação de tipos
        const content = response.choices && response.choices[0]?.message?.content;
        reply = typeof content === 'string' ? content : "Não foi possível gerar uma resposta.";
      }
      
    } catch (aiError: any) {
      console.error("Erro no serviço de IA:", aiError);
      
      // Tentar com modelo alternativo de forma simplificada
      try {
        console.log("Tentando modelo alternativo após falha...");
        
        // Usar um modelo mais simples para casos de erro
        const fallbackResponse = await aiService.generateText({
          prompt: `${MARIA_SYSTEM_PROMPT}\n\nPergunta do usuário: ${message}`,
          temperature: 0.5,
          maxTokens: 600
        });
        
        // Resposta simplificada para o fallback
        reply = fallbackResponse && typeof fallbackResponse === 'string' 
          ? fallbackResponse 
          : "Desculpe, estou com dificuldades técnicas. Por favor, tente novamente em breve.";
          
      } catch (fallbackError) {
        console.error("Erro também no modelo de fallback:", fallbackError);
        // Se o fallback também falhar, usar uma mensagem de erro padrão
        reply = "Desculpe, estou enfrentando problemas técnicos no momento. Por favor, tente novamente mais tarde.";
      }
    }
    
    // Extrair informações-chave para armazenar no conhecimento (quando apropriado)
    // Fazemos isso para conversas informativas que possam ser úteis para outros usuários
    try {
      const isInformative = reply.length > 150 && 
                           (reply.includes("Aqui está") || 
                            reply.includes("A resposta é") || 
                            reply.includes("Posso explicar"));
      
      if (isInformative) {
        // Armazenar como conhecimento para uso futuro no RAG
        await ragService.addKnowledge(
          `Pergunta: ${message}\nResposta: ${reply}`, 
          "chat_history",
          { source: "chat", date: new Date().toISOString() }
        );
      }
    } catch (knowledgeError) {
      console.warn("Aviso: Não foi possível adicionar ao conhecimento:", knowledgeError);
      // Continuar normalmente
    }
    
    // Salvar a resposta do assistente no histórico de conversas
    try {
      // Verificar se a resposta não é nula antes de salvar
      if (reply) {
        await ragService.saveConversationMessage(reply, "assistant");
      } else {
        console.warn("Aviso: Tentativa de salvar resposta nula no histórico");
      }
    } catch (saveError) {
      console.warn("Aviso: Não foi possível salvar resposta no histórico:", saveError);
      // Continuamos mesmo se falhar
    }
    
    return res.json({
      success: true,
      message: "Resposta gerada com sucesso",
      reply,
      timestamp: new Date()
    });
    
  } catch (error: any) {
    console.error("Erro ao comunicar com o assistente:", error);
    
    // Resposta mais detalhada e amigável
    let errorMessage = "Ocorreu um erro ao processar seu pedido.";
    let errorCode = 500;
    
    // Personalizar a mensagem baseado no tipo de erro
    if (error.message?.includes("API key")) {
      errorMessage = "Chave API inválida ou expirada. Por favor, verifique as configurações.";
      errorCode = 401;
    } else if (error.message?.includes("timeout") || error.message?.includes("ECONNREFUSED")) {
      errorMessage = "Não foi possível conectar ao serviço Mistral. Verifique sua conexão.";
      errorCode = 503;
    } else if (error.message?.includes("rate limit")) {
      errorMessage = "Limite de requisições excedido. Por favor, aguarde alguns segundos e tente novamente.";
      errorCode = 429;
    }
    
    return res.status(errorCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
}
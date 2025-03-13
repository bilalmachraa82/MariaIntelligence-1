import { Request, Response } from 'express';
import { Mistral } from "@mistralai/mistralai";

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
`;

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
    
    // Configurar cliente Mistral
    const mistral = new Mistral({
      apiKey: MISTRAL_API_KEY
    });
    
    // Preparar histórico de chat para contexto
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Construir mensagens para a API incluindo o sistema e histórico
    const messages = [
      { role: "system", content: MARIA_SYSTEM_PROMPT },
      ...formattedHistory,
      { role: "user", content: message }
    ];
    
    // Fazer a chamada à API
    const response = await mistral.chat.complete({
      model: "mistral-large-latest", // Modelo mais avançado para respostas de qualidade
      messages: messages,
      temperature: 0.7, // Equilibrio entre criatividade e consistência
      max_tokens: 1024 // Resposta detalhada
    });
    
    // Extrair e retornar a resposta
    const reply = response.choices[0].message.content;
    
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
/**
 * Rotas de API para processamento de voz e áudio
 * Utiliza o serviço Gemini para processar entrada de voz
 */

import { Request, Response } from 'express';
import { speechService } from '../services/speech-service';
import { aiService } from '../services/ai-adapter.service';

/**
 * Registra as rotas relacionadas ao processamento de voz
 * @param app Instância do Express
 */
export function registerSpeechRoutes(app: any) {
  
  /**
   * Endpoint para processar áudio e retornar o texto transcrito
   * Aceita áudio em formato base64
   */
  app.post('/api/speech/transcribe', async (req: Request, res: Response) => {
    try {
      const { audioData, mimeType } = req.body;
      
      if (!audioData) {
        return res.status(400).json({
          success: false,
          message: 'Dados de áudio não fornecidos',
          error: 'MISSING_AUDIO'
        });
      }
      
      // Processar o áudio com o serviço de fala
      const transcription = await speechService.processAudio(
        audioData, 
        mimeType || 'audio/webm'
      );
      
      // Detectar intenções no texto transcrito
      const intent = await speechService.detectIntent(transcription);
      
      return res.json({
        success: true,
        transcription,
        intent,
        timestamp: new Date()
      });
      
    } catch (error: any) {
      console.error('Erro ao processar áudio:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o áudio',
        error: error.message || 'UNKNOWN_ERROR'
      });
    }
  });
  
  /**
   * Endpoint para responder a uma mensagem de voz transcrita
   * Similar ao endpoint do assistente, mas otimizado para voz
   */
  app.post('/api/speech/respond', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Mensagem não fornecida',
          error: 'MISSING_MESSAGE'
        });
      }
      
      // Obter uma resposta através do Gemini usando o aiService
      // A implementação evita acesso direto ao modelo usando o adaptador
      const result = await aiService.getMistralClient().chat({
        model: "mistral-large-latest",
        messages: [
          {
            role: "user",
            content: `Você é o assistente virtual Maria da plataforma Maria Faz de gestão de propriedades.
              Responda à seguinte mensagem do usuário de forma clara e concisa, apropriada para resposta por voz.
              Mantenha a resposta curta, direta e fácil de entender ao ouvir.
              Evite usar tabelas, listas complexas ou estruturas difíceis de compreender em áudio.
              Se precisar listar itens, use frases curtas e pausas naturais.
              
              Mensagem do usuário: ${message}`
          }
        ],
        temperature: 0.3,
        maxTokens: 800
      });
      
      const reply = result.choices[0].message.content;
      
      return res.json({
        success: true,
        message: 'Resposta gerada com sucesso',
        reply,
        timestamp: new Date()
      });
      
    } catch (error: any) {
      console.error('Erro ao gerar resposta de voz:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar resposta',
        error: error.message || 'UNKNOWN_ERROR'
      });
    }
  });
}
/**
 * Este arquivo substituiu as antigas rotas de processamento de voz
 * A funcionalidade de voz foi removida conforme solicitado
 */

import { Request, Response } from 'express';

/**
 * Registra as rotas relacionadas à funcionalidade de voz (agora removida)
 * Mantém apenas respostas informativas que a funcionalidade foi desativada
 * @param app Instância do Express
 */
export function registerSpeechRoutes(app: any) {
  // Resposta padrão informando que a funcionalidade foi removida
  const serviceRemovedResponse = {
    success: false,
    message: 'Funcionalidade removida',
    error: 'FEATURE_REMOVED',
    details: 'A funcionalidade de voz foi removida do sistema.'
  };
  
  // Rota para processamento de áudio (desativada)
  app.post('/api/speech/transcribe', (_req: Request, res: Response) => {
    return res.json(serviceRemovedResponse);
  });
  
  // Rota para resposta de voz (desativada)
  app.post('/api/speech/respond', (_req: Request, res: Response) => {
    return res.json(serviceRemovedResponse);
  });
  
  // Rota para obter introdução (desativada)
  app.get('/api/speech/introduction', (req: Request, res: Response) => {
    const language = req.query.language as string || 'pt-BR';
    
    return res.json({
      success: false,
      message: 'Funcionalidade removida',
      greeting: 'A funcionalidade de voz foi removida do sistema.',
      language,
      timestamp: new Date()
    });
  });
}
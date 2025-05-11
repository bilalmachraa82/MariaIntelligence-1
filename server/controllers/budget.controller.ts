/**
 * Controlador para o endpoint de orçamento
 * Permite estimar preços e valores para reservas
 */

import { Request, Response } from 'express';

/**
 * Estima o custo de uma reserva com base no número de noites e taxa diária
 * @param req Requisição Express com nights e nightlyRate no corpo
 * @param res Resposta Express retornando total e margem
 */
export async function estimate(req: Request, res: Response) {
  try {
    // Extrair parâmetros da requisição
    const { nights, nightlyRate } = req.body;
    
    // Validar parâmetros
    if (!nights || !nightlyRate) {
      return res.status(400).json({
        success: false,
        message: "Parâmetros inválidos. Necessário fornecer 'nights' e 'nightlyRate'."
      });
    }
    
    // Converter para números se forem strings
    const numNights = typeof nights === 'string' ? parseInt(nights, 10) : nights;
    const rate = typeof nightlyRate === 'string' ? parseFloat(nightlyRate) : nightlyRate;
    
    // Validar tipos
    if (isNaN(numNights) || isNaN(rate)) {
      return res.status(400).json({
        success: false,
        message: "Parâmetros devem ser valores numéricos."
      });
    }
    
    // Calcular total e margem
    const total = numNights * rate;
    const margin = total * 0.1; // 10% de margem
    
    // Retornar resultado
    return res.json({
      success: true,
      total,
      margin,
      nights: numNights,
      nightlyRate: rate
    });
  } catch (error) {
    console.error('Erro ao estimar orçamento:', error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao processar a estimativa de orçamento."
    });
  }
}
import { Request, Response } from 'express';

/**
 * Estima o orçamento com base no número de noites e taxa diária
 * Calcula o valor total e a margem (10% do total)
 * 
 * @param req Request com nights e nightlyRate no body
 * @param res Response com total e margin
 */
export async function estimate(req: Request, res: Response) {
  try {
    // Extrair parâmetros do corpo da requisição
    const { nights, nightlyRate } = req.body;
    
    // Validar se os parâmetros foram fornecidos
    if (nights === undefined || nightlyRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros obrigatórios: nights e nightlyRate'
      });
    }
    
    // Validar se os parâmetros são numéricos e positivos
    const nightsNum = Number(nights);
    const rateNum = Number(nightlyRate);
    
    if (isNaN(nightsNum) || nightsNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'O número de noites deve ser um número positivo'
      });
    }
    
    if (isNaN(rateNum) || rateNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A taxa diária deve ser um número positivo'
      });
    }
    
    // Calcular o valor total e a margem
    const total = nightsNum * rateNum;
    const margin = total * 0.1; // 10% de margem
    
    // Retornar a estimativa do orçamento
    return res.json({
      success: true,
      nights: nightsNum,
      nightlyRate: rateNum,
      total,
      margin
    });
  } catch (error) {
    console.error('Erro ao calcular orçamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao calcular orçamento'
    });
  }
}
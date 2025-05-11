import { Request, Response } from 'express';

/**
 * Controlador para cálculos de orçamento
 * 
 * Este controlador gerencia as operações relacionadas a cálculos de orçamento,
 * como estimativa de valores para reservas com base em número de noites e taxa diária.
 */
export class BudgetController {
  /**
   * Calcula uma estimativa de orçamento baseada em noites e taxa diária
   * 
   * @param req Objeto de requisição Express
   * @param res Objeto de resposta Express
   */
  public static async estimateBudget(req: Request, res: Response): Promise<void> {
    try {
      const { nights, nightlyRate } = req.body;
      
      // Validação de entrada
      if (!nights || !nightlyRate || nights <= 0 || nightlyRate <= 0) {
        res.status(400).json({
          success: false,
          message: 'Parâmetros inválidos. Informe o número de noites e taxa diária válidos.'
        });
        return;
      }
      
      // Cálculo do total
      const total = nights * nightlyRate;
      
      // Cálculo da margem (20% do total como exemplo)
      const margin = total * 0.2;
      
      // Retorna o resultado
      res.status(200).json({
        success: true,
        nights,
        nightlyRate,
        total,
        margin
      });
    } catch (error) {
      console.error('Erro ao calcular orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar a requisição de orçamento'
      });
    }
  }
}
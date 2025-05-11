import { apiRequest } from "./queryClient";

/**
 * Interface para estimativa de orçamento
 */
export interface BudgetEstimate {
  nights: number;
  nightlyRate: number;
  total: number;
  margin: number;
}

/**
 * Faz uma solicitação ao endpoint de orçamento para estimar valores
 * @param nights Número de noites
 * @param nightlyRate Taxa por noite
 * @returns Objeto com valores estimados (total, margem, etc.)
 */
export async function estimateBudget(nights: number, nightlyRate: number): Promise<BudgetEstimate> {
  try {
    const response = await apiRequest('/api/budgets/estimate', {
      method: 'POST',
      body: JSON.stringify({ nights, nightlyRate }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Erro ao estimar orçamento');
    }
    
    return {
      nights: response.nights,
      nightlyRate: response.nightlyRate,
      total: response.total,
      margin: response.margin
    };
  } catch (error) {
    console.error('Erro ao estimar orçamento:', error);
    throw error;
  }
}

/**
 * Calcula o número de noites entre duas datas
 * @param checkInDate Data de check-in (string no formato YYYY-MM-DD)
 * @param checkOutDate Data de check-out (string no formato YYYY-MM-DD)
 * @returns Número de noites
 */
export function calculateNights(checkInDate: string, checkOutDate: string): number {
  // Converter strings para objetos Date
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  
  // Calcular a diferença em milissegundos
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  
  // Converter a diferença em dias
  const nights = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return nights;
}
import { differenceInDays } from 'date-fns';
import axios from 'axios';

/**
 * Interface para o resultado da estimativa de orçamento
 */
export interface BudgetEstimate {
  success: boolean;
  nights: number;
  nightlyRate: number;
  total: number;
  margin: number;
}

/**
 * Calcula o número de noites entre duas datas
 * 
 * @param checkInDate Data de check-in no formato YYYY-MM-DD
 * @param checkOutDate Data de check-out no formato YYYY-MM-DD
 * @returns O número de noites
 */
export function calculateNights(checkInDate: string, checkOutDate: string): number {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Datas inválidas');
  }
  
  return Math.max(0, differenceInDays(end, start));
}

/**
 * Calcula uma estimativa de orçamento baseada em noites e taxa diária
 * 
 * @param nights Número de noites
 * @param nightlyRate Taxa diária
 * @returns Promise com a estimativa de orçamento
 */
export async function estimateBudget(nights: number, nightlyRate: number): Promise<BudgetEstimate> {
  if (nights <= 0) {
    throw new Error('O número de noites deve ser maior que zero');
  }
  
  if (nightlyRate <= 0) {
    throw new Error('A taxa diária deve ser maior que zero');
  }
  
  try {
    const response = await axios.post<BudgetEstimate>('/api/budgets/estimate', { 
      nights, 
      nightlyRate 
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao fazer requisição de orçamento:', error);
    throw new Error('Falha ao calcular orçamento. Tente novamente.');
  }
}
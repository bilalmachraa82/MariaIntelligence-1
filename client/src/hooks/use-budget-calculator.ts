import { useCallback, useState } from 'react';
import { calculateNights, estimateBudget, BudgetEstimate } from '@/lib/budget';

/**
 * Hook personalizado para cálculos de orçamento e noites
 */
export function useBudgetCalculator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Calcula o número de noites entre duas datas
   */
  const getNights = useCallback((checkInDate: string, checkOutDate: string): number => {
    try {
      return calculateNights(checkInDate, checkOutDate);
    } catch (err) {
      console.error('Erro ao calcular noites:', err);
      setError('Erro ao calcular noites. Verifique o formato das datas.');
      return 0;
    }
  }, []);
  
  /**
   * Calcula estimativa de orçamento baseado em noites e taxa diária
   */
  const calculateBudget = useCallback(async (
    nights: number, 
    nightlyRate: number
  ): Promise<BudgetEstimate | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await estimateBudget(nights, nightlyRate);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Erro ao calcular orçamento:', err);
      setError('Erro ao calcular orçamento. Tente novamente.');
      setIsLoading(false);
      return null;
    }
  }, []);
  
  /**
   * Calcula estimativa de orçamento baseado nas datas e taxa diária
   */
  const calculateBudgetFromDates = useCallback(async (
    checkInDate: string,
    checkOutDate: string,
    nightlyRate: number
  ): Promise<BudgetEstimate | null> => {
    const nights = getNights(checkInDate, checkOutDate);
    if (nights <= 0) {
      setError('Datas inválidas. A data de check-out deve ser posterior à data de check-in.');
      return null;
    }
    
    return calculateBudget(nights, nightlyRate);
  }, [getNights, calculateBudget]);
  
  return {
    getNights,
    calculateBudget,
    calculateBudgetFromDates,
    isLoading,
    error,
  };
}
/**
 * Serviço para validação de arquivos de controle e reservas
 * Fornece validação detalhada e verificação de duplicatas
 */

import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { properties, reservations } from '../../shared/schema';
import { ControlReservation } from './control-file-processor';

// Definição do tipo de reserva para uso interno
export interface Reservation {
  id?: number;
  propertyId: number;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number | string;
  totalAmount: number | string;
  platform: string;
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationResult {
  reservation: Reservation;
  isValid: boolean;
  isDuplicate: boolean;
  existingReservation?: Reservation | null;
  validationErrors: string[];
}

export interface ValidationSummary {
  valid: number;
  duplicates: number;
  invalid: number;
  total: number;
}

/**
 * Serviço de validação para arquivos de controle
 */
export class ControlFileValidator {
  /**
   * Valida as reservas extraídas de um arquivo de controle
   * 
   * @param reservations Lista de reservas para validar
   * @returns Resultados da validação, incluindo duplicatas e erros
   */
  async validateReservations(reservations: Reservation[]): Promise<ValidationResult[]> {
    console.log(`Validando ${reservations.length} reservas...`);
    const results: ValidationResult[] = [];

    for (const reservation of reservations) {
      const validationResult: ValidationResult = {
        reservation,
        isValid: true,
        isDuplicate: false,
        existingReservation: null,
        validationErrors: []
      };

      // 1. Validar presença e formato dos campos obrigatórios
      if (!reservation.guestName || reservation.guestName.trim().length < 3) {
        validationResult.isValid = false;
        validationResult.validationErrors.push('Nome do hóspede inválido ou muito curto');
      }

      if (!reservation.checkInDate) {
        validationResult.isValid = false;
        validationResult.validationErrors.push('Data de check-in ausente');
      }

      if (!reservation.checkOutDate) {
        validationResult.isValid = false;
        validationResult.validationErrors.push('Data de check-out ausente');
      }

      if (reservation.checkInDate && reservation.checkOutDate) {
        const checkIn = new Date(reservation.checkInDate);
        const checkOut = new Date(reservation.checkOutDate);

        if (isNaN(checkIn.getTime())) {
          validationResult.isValid = false;
          validationResult.validationErrors.push('Data de check-in inválida');
        }

        if (isNaN(checkOut.getTime())) {
          validationResult.isValid = false;
          validationResult.validationErrors.push('Data de check-out inválida');
        }

        if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
          if (checkIn > checkOut) {
            validationResult.isValid = false;
            validationResult.validationErrors.push('Check-in é posterior ao check-out');
          }

          // Verificar se a estadia é muito longa (mais de 30 dias) - apenas aviso
          const dias = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          if (dias > 30) {
            validationResult.validationErrors.push(`Estadia muito longa (${dias} dias)`);
          }
        }
      }

      // Validar número de hóspedes
      if (!reservation.numGuests || isNaN(Number(reservation.numGuests)) || Number(reservation.numGuests) <= 0 || Number(reservation.numGuests) > 20) {
        validationResult.isValid = false;
        validationResult.validationErrors.push('Número de hóspedes inválido');
      }

      // Validar valor total
      if (!reservation.totalAmount || isNaN(parseFloat(String(reservation.totalAmount))) || parseFloat(String(reservation.totalAmount)) <= 0) {
        validationResult.isValid = false;
        validationResult.validationErrors.push('Valor total inválido');
      }

      // Validar propriedade
      if (!reservation.propertyId) {
        validationResult.isValid = false;
        validationResult.validationErrors.push('ID da propriedade ausente');
      } else {
        // Verificar se a propriedade existe
        try {
          const property = await db?.query.properties.findFirst({
            where: eq(properties.id, Number(reservation.propertyId))
          });

          if (!property) {
            validationResult.isValid = false;
            validationResult.validationErrors.push(`Propriedade com ID ${reservation.propertyId} não encontrada`);
          }
        } catch (error) {
          console.error('Erro ao verificar propriedade:', error);
          validationResult.validationErrors.push('Erro ao verificar propriedade');
        }
      }

      // 2. Verificar duplicatas
      try {
        const duplicate = await this.findDuplicateReservation(reservation);
        if (duplicate) {
          validationResult.isDuplicate = true;
          validationResult.existingReservation = duplicate;
        }
      } catch (error) {
        console.error('Erro ao verificar duplicatas:', error);
        validationResult.validationErrors.push('Erro ao verificar duplicatas');
      }

      results.push(validationResult);
    }

    return results;
  }

  /**
   * Verifica se uma reserva já existe no sistema
   * 
   * @param reservation Reserva a verificar
   * @returns Reserva existente ou null
   */
  async findDuplicateReservation(reservation: Reservation): Promise<Reservation | null> {
    if (!reservation.propertyId || !reservation.checkInDate || !reservation.checkOutDate || !db) {
      return null;
    }

    try {
      // Critérios para considerar uma reserva como duplicata:
      // 1. Mesma propriedade
      // 2. Datas sobrepostas (check-in1 <= check-out2 E check-out1 >= check-in2)
      
      const checkInDate = new Date(reservation.checkInDate);
      const checkOutDate = new Date(reservation.checkOutDate);
      
      // Convertemos as datas para strings no formato YYYY-MM-DD para compatibilidade
      const checkInStr = checkInDate.toISOString().split('T')[0];
      const checkOutStr = checkOutDate.toISOString().split('T')[0];
      
      // Usando SQL bruto para a verificação de sobreposição de datas
      const existingReservations = await db.query.reservations.findMany({
        where: and(
          eq(reservations.propertyId, Number(reservation.propertyId)),
          // Verificar sobreposição de datas usando SQL bruto:
          // Um período sobrepõe o outro se: (início1 <= fim2) E (fim1 >= início2)
          sql`${reservations.checkInDate} <= ${checkOutStr} AND ${reservations.checkOutDate} >= ${checkInStr}`
        )
      });
      
      // Verificar se há alguma reserva existente com datas sobrepostas
      if (existingReservations && existingReservations.length > 0) {
        console.log(`Encontrada reserva duplicada: ID ${existingReservations[0].id}`);
        
        // Converter a reserva do banco de dados para o formato da interface Reservation
        const dbReservation = existingReservations[0];
        const convertedReservation: Reservation = {
          id: dbReservation.id,
          propertyId: dbReservation.propertyId,
          guestName: dbReservation.guestName,
          checkInDate: dbReservation.checkInDate,
          checkOutDate: dbReservation.checkOutDate,
          numGuests: dbReservation.numGuests ?? 0,
          totalAmount: dbReservation.totalAmount,
          platform: dbReservation.platform || '',
          notes: dbReservation.notes || '',
          status: dbReservation.status
        };
        
        return convertedReservation;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar reservas existentes:', error);
      throw error;
    }
  }

  /**
   * Gera um resumo da validação
   * 
   * @param results Resultados da validação
   * @returns Resumo da validação
   */
  generateSummary(results: ValidationResult[]): ValidationSummary {
    const valid = results.filter(r => r.isValid && !r.isDuplicate).length;
    const duplicates = results.filter(r => r.isDuplicate).length;
    const invalid = results.filter(r => !r.isValid && !r.isDuplicate).length;
    
    return {
      valid,
      duplicates,
      invalid,
      total: results.length
    };
  }

  /**
   * Formata uma data para exibição no formato DD/MM/YYYY
   * 
   * @param dateStr Data no formato YYYY-MM-DD
   * @returns Data formatada para exibição
   */
  formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
}

// Exportar instância do serviço
export const controlFileValidator = new ControlFileValidator();
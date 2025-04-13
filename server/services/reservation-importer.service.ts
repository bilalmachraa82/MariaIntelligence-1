/**
 * Service for AI-powered reservation import feature
 * Uses Google Gemini API to parse unstructured reservation data, extract key details,
 * handle ambiguities, and generate structured output.
 */

import { GeminiService, GeminiModel } from './gemini.service';
import { InsertReservation } from '../../shared/schema';
import fs from 'fs';
import path from 'path';

// Types for reservation import feature
export interface ReservationImportData {
  property_name: string;
  check_in_date: string;
  check_in_time?: string;
  check_out_date: string;
  check_out_time?: string;
  guest_name: string;
  total_guests: number;
  adults?: number;
  children?: number;
  infants?: number;
  children_ages?: number[];
  guest_country?: string;
  guest_email?: string;
  guest_phone?: string;
  booking_source?: string;
  special_requests?: string;
  booking_reference?: string;
  booking_status?: string;
}

export interface ReservationImportResult {
  reservation_data: ReservationImportData;
  clarification_questions?: string[];
}

export interface ReservationImportOptions {
  originalText: string;
  userAnswers?: Record<string, string>;
  skipValidation?: boolean;
}

export class ReservationImporterService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Initialize the Gemini service using the provided API key
   * @param apiKey Google Gemini API key
   */
  async initialize(apiKey: string): Promise<boolean> {
    return this.geminiService.initialize(apiKey);
  }

  /**
   * Import reservation data from text input
   * @param text Unstructured text containing reservation details
   * @param options Options for the import process
   * @returns Structured reservation data and any clarification questions
   */
  async importFromText(text: string, options: ReservationImportOptions = { originalText: text }): Promise<ReservationImportResult> {
    if (!text || text.trim() === '') {
      throw new Error('Text input is required');
    }

    // Create the context for the Gemini API request
    const context = this.createImportContext(text, options);
    
    try {
      // Call Gemini API to extract reservation data
      const result = await this.callGeminiForImport(context);
      return result;
    } catch (error) {
      console.error('Error importing reservation data:', error);
      throw new Error(`Failed to import reservation data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a context object for the Gemini API request
   * @param text Input text to process
   * @param options Additional options
   * @returns Context object for Gemini API
   */
  private createImportContext(text: string, options: ReservationImportOptions): any {
    const { originalText, userAnswers } = options;
    
    let contextText = text;
    
    // If we have user answers to clarification questions, include them in the context
    if (userAnswers && Object.keys(userAnswers).length > 0) {
      contextText += '\n\n--- Clarificações do usuário ---\n';
      
      for (const [question, answer] of Object.entries(userAnswers)) {
        contextText += `Pergunta: ${question}\nResposta: ${answer}\n\n`;
      }
    }
    
    return {
      text: contextText,
      originalText: originalText || text,
    };
  }

  /**
   * Call the Gemini API to extract reservation data
   * @param context Context for the API request
   * @returns Structured reservation data and any clarification questions
   */
  private async callGeminiForImport(context: any): Promise<ReservationImportResult> {
    // Create the prompt for Gemini
    const prompt = this.createReservationImportPrompt(context.text);
    
    // Call Gemini with function calling capability
    const result = await this.geminiService.generateContentWithFunctionCalling(
      prompt,
      this.getReservationImportFunctions(),
      {
        model: GeminiModel.FLASH,
        temperature: 0.1,
        topK: 1,
        topP: 0.1,
      }
    );
    
    // Parse the result
    if (!result || !result.functionCalls || result.functionCalls.length === 0) {
      throw new Error('No valid response from AI service');
    }
    
    const functionCall = result.functionCalls[0];
    if (functionCall.name !== 'extractReservationData') {
      throw new Error('Unexpected function call response');
    }
    
    try {
      // Parse the arguments as JSON
      const args = functionCall.args;
      
      // Return the structured result
      return {
        reservation_data: args.reservation_data || {},
        clarification_questions: args.clarification_questions || [],
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse AI service response');
    }
  }

  /**
   * Create the prompt for the Gemini API to extract reservation data
   * @param text Input text to process
   * @returns Prompt for Gemini API
   */
  private createReservationImportPrompt(text: string): string {
    return `
Tu és um assistente especializado em extrair informações de reservas para propriedades de alojamento local.

# Tarefa
Analisa o texto fornecido abaixo e extrai informações estruturadas sobre uma reserva. 
O texto pode vir de várias fontes como emails, mensagens, tabelas copiadas, ou notas.
Extrai APENAS os dados presentes no texto. Se informações estiverem faltando ou forem ambíguas, NÃO ADIVINHE.

# Formato de saída
Você deve retornar um objeto JSON com duas propriedades:
- reservation_data: Um objeto com os campos da reserva extraídos do texto
- clarification_questions: Um array de perguntas para o usuário, caso haja informações ambíguas ou faltantes

# Regras para clarificação:
- Se "property_name" for ambíguo ou ausente, pergunte: "A qual propriedade pertence esta reserva?"
- Se as datas de checkin/checkout forem ambíguas ou ausentes, pergunte: "Podes confirmar as datas de check-in e check-out (DD/MM/AAAA)?"
- Se apenas houver total de hóspedes sem detalhe, pergunte: "Podes especificar a distribuição dos [total_guests] hóspedes (quantos Adultos, Crianças, Bebés)?"
- Se "booking_source" for ambíguo ou ausente, pergunte: "Qual foi a plataforma/origem desta reserva (Airbnb, Booking, Directo, etc.)?"
- Acrescente outras perguntas relevantes para campos críticos em falta.

# Texto da reserva:
${text}
`;
  }

  /**
   * Get the function definitions for Gemini function calling
   * @returns Function definitions for Gemini API
   */
  private getReservationImportFunctions(): any[] {
    return [
      {
        name: 'extractReservationData',
        description: 'Extract reservation data from text input',
        parameters: {
          type: 'object',
          properties: {
            reservation_data: {
              type: 'object',
              description: 'Structured reservation data extracted from text',
              properties: {
                property_name: {
                  type: 'string',
                  description: 'Name or identifier of the property (e.g., "EXCITING LISBON 5 DE OUTUBRO", "Aroeira I", "Casa dos Barcos T1 (47)")'
                },
                check_in_date: {
                  type: 'string',
                  description: 'Arrival date in ISO 8601 YYYY-MM-DD format. Infer year (likely 2025 based on examples)'
                },
                check_in_time: {
                  type: 'string',
                  description: 'Arrival time in HH:MM format (e.g., "16:00", "13:00"). Default to "16:00" if unspecified',
                },
                check_out_date: {
                  type: 'string',
                  description: 'Departure date in ISO 8601 YYYY-MM-DD format'
                },
                check_out_time: {
                  type: 'string',
                  description: 'Departure time in HH:MM format (e.g., "11:00", "00:00"). Default to "11:00" if unspecified',
                },
                guest_name: {
                  type: 'string',
                  description: 'Main guest/booker name'
                },
                total_guests: {
                  type: 'integer',
                  description: 'Total number of guests'
                },
                adults: {
                  type: 'integer',
                  description: 'Number of adults'
                },
                children: {
                  type: 'integer',
                  description: 'Number of children'
                },
                infants: {
                  type: 'integer',
                  description: 'Number of infants/babies'
                },
                children_ages: {
                  type: 'array',
                  items: {
                    type: 'integer'
                  },
                  description: 'List of children\'s ages if provided (e.g., [14], [6])'
                },
                guest_country: {
                  type: 'string',
                  description: 'Guest\'s country (e.g., "França", "Portugal", "Espanha")'
                },
                guest_email: {
                  type: 'string',
                  description: 'Guest\'s email, if available'
                },
                guest_phone: {
                  type: 'string',
                  description: 'Guest\'s phone number, if available'
                },
                booking_source: {
                  type: 'string',
                  description: 'Origin of the booking (e.g., "Airbnb", "Booking.com", "Pessoal", "Directo", "Innkeeper")'
                },
                special_requests: {
                  type: 'string',
                  description: 'All relevant notes, requests, and additional info'
                },
                booking_reference: {
                  type: 'string',
                  description: 'Booking ID or reference code from PMS/Platform'
                },
                booking_status: {
                  type: 'string',
                  description: 'Status like "Confirmada", "Pendente", "De proprietário". Default to "Confirmada" if unspecified'
                }
              },
              required: ['property_name', 'check_in_date', 'check_out_date', 'guest_name', 'total_guests']
            },
            clarification_questions: {
              type: 'array',
              description: 'List of questions to ask the user for clarification on ambiguous or missing information',
              items: {
                type: 'string'
              }
            }
          },
          required: ['reservation_data']
        }
      }
    ];
  }

  /**
   * Convert imported reservation data to InsertReservation format
   * @param importData Imported reservation data
   * @param propertyId Property ID from the database
   * @returns Data in InsertReservation format
   */
  async convertToInsertReservation(importData: ReservationImportData, propertyId: number): Promise<InsertReservation> {
    // Map platform names to source format
    const sourceMappings: Record<string, string> = {
      'airbnb': 'airbnb',
      'booking.com': 'booking',
      'booking': 'booking',
      'expedia': 'expedia',
      'directo': 'direct',
      'direct': 'direct',
      'pessoal': 'direct',
      'personal': 'direct',
    };

    // Map status names
    const statusMappings: Record<string, string> = {
      'confirmada': 'confirmed',
      'confirmed': 'confirmed',
      'pendente': 'pending',
      'pending': 'pending',
      'cancelada': 'cancelled',
      'cancelled': 'cancelled',
    };

    // Create notes combining special requests and additional info
    let notes = '';
    if (importData.special_requests) {
      notes += `Pedidos especiais: ${importData.special_requests}\n`;
    }
    
    // Add guest distribution info
    const guestInfo = [];
    if (importData.adults !== undefined) guestInfo.push(`${importData.adults} adultos`);
    if (importData.children !== undefined) guestInfo.push(`${importData.children} crianças`);
    if (importData.infants !== undefined) guestInfo.push(`${importData.infants} bebés`);
    
    if (guestInfo.length > 0) {
      notes += `\nDistribuição de hóspedes: ${guestInfo.join(', ')}`;
    }
    
    if (importData.children_ages && importData.children_ages.length > 0) {
      notes += `\nIdades das crianças: ${importData.children_ages.join(', ')}`;
    }
    
    if (importData.booking_reference) {
      notes += `\nReferência da reserva: ${importData.booking_reference}`;
    }

    // Get platform normalized
    const source = importData.booking_source ? 
      (sourceMappings[importData.booking_source.toLowerCase()] || importData.booking_source.toLowerCase()) : 
      'manual';

    // Get status normalized
    const status = importData.booking_status ?
      (statusMappings[importData.booking_status.toLowerCase()] || 'confirmed') :
      'confirmed';

    return {
      propertyId,
      guestName: importData.guest_name,
      checkInDate: importData.check_in_date,
      checkOutDate: importData.check_out_date,
      totalAmount: '0', // Placeholder - will be updated later
      numGuests: importData.total_guests,
      guestEmail: importData.guest_email || '',
      guestPhone: importData.guest_phone || '',
      status,
      notes: notes.trim(),
      source
    };
  }
}

export default ReservationImporterService;
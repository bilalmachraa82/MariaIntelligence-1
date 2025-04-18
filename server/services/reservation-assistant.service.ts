/**
 * Serviço de Assistente de Reservas
 * Utiliza o Gemini 2.5 Flash para extrair e estruturar dados de reservas de textos e PDFs
 * Implementa o prompt educativo fornecido pelo cliente
 */

import { GeminiService, GeminiModel } from './gemini.service';
import { db } from '../db';
import { reservations, InsertReservation } from '@shared/schema';
import crypto from 'crypto';

export class ReservationAssistantService {
  private geminiService: GeminiService;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
  }

  /**
   * Processa texto da conversa para extrair reservas utilizando o Gemini 2.5 Flash
   * @param text Texto a ser processado (de OCR ou direto)
   * @returns Objeto com dados estruturados das reservas e mensagem de resposta
   */
  public async processReservationText(text: string): Promise<{
    reservations: any[],
    responseMessage: string,
    missingCrucialInfo: boolean,
    missingFields: any[]
  }> {
    try {
      // Usar o mesmo prompt educativo fornecido pelo cliente
      const systemPrompt = this.getEducativePrompt();
      
      // Chamar o Gemini 2.5 Flash com function calling
      const result = await this.extractReservationsWithFunctionCalling(text);
      
      // Verificar se há informações cruciais faltando
      const missingCrucialInfoFields = this.checkMissingCrucialInfo(result.reservations);
      
      // Criar mensagem de resposta formatada
      const responseMessage = this.formatResponseMessage(result.reservations, missingCrucialInfoFields);
      
      return {
        reservations: result.reservations,
        responseMessage: responseMessage,
        missingCrucialInfo: missingCrucialInfoFields.length > 0,
        missingFields: missingCrucialInfoFields
      };
    } catch (error: any) {
      console.error("Erro ao processar texto de reserva:", error);
      throw new Error(`Falha ao processar texto de reserva: ${error.message}`);
    }
  }

  /**
   * Extrai reservas do texto usando function calling com Gemini 2.5 Flash
   * @param text Texto da reserva
   * @returns Array de reservas extraídas
   */
  private async extractReservationsWithFunctionCalling(text: string): Promise<{ 
    reservations: any[]
  }> {
    try {
      // Definição da função para o Gemini
      const functionDefinition = {
        name: "extract_reservations",
        description: "Extrair informações de múltiplas reservas a partir do texto fornecido",
        parameters: {
          type: "object",
          properties: {
            reservations: {
              type: "array",
              description: "Array de reservas extraídas do texto",
              items: {
                type: "object",
                properties: {
                  referencia: {
                    type: "string",
                    description: "ID ou código de referência da reserva, se disponível"
                  },
                  alojamento: {
                    type: "string",
                    description: "Nome da propriedade/unidade. Ex: 'EXCITING LISBON GRAÇA I'"
                  },
                  data_check_in: {
                    type: "string",
                    description: "Data de check-in no formato YYYY-MM-DD"
                  },
                  hora_check_in: {
                    type: "string",
                    description: "Hora de check-in no formato HH:MM, se disponível"
                  },
                  data_check_out: {
                    type: "string",
                    description: "Data de check-out no formato YYYY-MM-DD"
                  },
                  hora_check_out: {
                    type: "string",
                    description: "Hora de check-out no formato HH:MM, se disponível"
                  },
                  num_noites: {
                    type: "integer",
                    description: "Número de noites da estadia, se disponível ou calculável"
                  },
                  nome_hospede: {
                    type: "string",
                    description: "Nome do hóspede principal"
                  },
                  num_adultos: {
                    type: "integer",
                    description: "Número de adultos, se discriminado"
                  },
                  num_criancas: {
                    type: "integer",
                    description: "Número de crianças, se discriminado"
                  },
                  num_bebes: {
                    type: "integer",
                    description: "Número de bebês, se discriminado"
                  },
                  total_hospedes: {
                    type: "integer",
                    description: "Número total de hóspedes (adultos + crianças + bebês)"
                  },
                  pais_hospede: {
                    type: "string",
                    description: "País de origem do hóspede, se disponível"
                  },
                  canal_reserva: {
                    type: "string",
                    description: "Plataforma onde foi feita a reserva. Ex: Airbnb, Booking, Pessoal"
                  },
                  email_hospede: {
                    type: "string",
                    description: "Email do hóspede, se disponível"
                  },
                  telefone_hospede: {
                    type: "string",
                    description: "Telefone do hóspede, se disponível"
                  },
                  notas: {
                    type: "string",
                    description: "Notas ou informações adicionais que não se encaixam nos campos anteriores"
                  }
                },
                required: ["data_check_in", "data_check_out", "nome_hospede", "total_hospedes"]
              }
            }
          },
          required: ["reservations"]
        }
      };

      // Chamar a API do Gemini com function calling
      const result = await this.geminiService.generateStructuredOutput({
        userPrompt: `Analise o seguinte texto que pode conter uma ou mais reservas e extraia todas as informações de reservas encontradas:

${text}`,
        systemPrompt: this.getEducativePrompt(),
        model: GeminiModel.FLASH,  // Usando o modelo Gemini 2.5 Flash
        temperature: 0.1,
        functionDefinitions: [functionDefinition],
        functionCallBehavior: "auto"
      });

      // Extrair as reservas do resultado
      let extractedReservations: any[] = [];
      
      if (result && result.functionCalls) {
        // Extrair dados da chamada de função
        extractedReservations = JSON.parse(result.functionCalls[0].args.reservations || '[]');
      } else if (result && typeof result === 'object') {
        // Fallback para quando o function calling não é utilizado corretamente
        extractedReservations = result.reservations || [];
      }

      // Normalizar os dados
      extractedReservations = extractedReservations.map(this.normalizeReservationData);

      return { reservations: extractedReservations };
    } catch (error: any) {
      console.error("Erro ao extrair reservas com function calling:", error);
      throw new Error(`Falha na extração de reservas: ${error.message}`);
    }
  }

  /**
   * Normaliza os dados da reserva para formato consistente
   * @param reservation Dados da reserva extraídos
   * @returns Dados normalizados
   */
  private normalizeReservationData(reservation: any): any {
    // Criar cópia para não modificar o original
    const normalizedReservation = { ...reservation };

    // Converter datas para formato YYYY-MM-DD, se necessário
    if (normalizedReservation.data_check_in && normalizedReservation.data_check_in.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
      const parts = normalizedReservation.data_check_in.split(/[\/\-]/);
      normalizedReservation.data_check_in = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    if (normalizedReservation.data_check_out && normalizedReservation.data_check_out.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
      const parts = normalizedReservation.data_check_out.split(/[\/\-]/);
      normalizedReservation.data_check_out = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    // Garantir que valores numéricos sejam números
    const numericFields = ['num_noites', 'num_adultos', 'num_criancas', 'num_bebes', 'total_hospedes'];
    numericFields.forEach(field => {
      if (normalizedReservation[field] !== undefined && normalizedReservation[field] !== null) {
        normalizedReservation[field] = parseInt(normalizedReservation[field], 10);
      }
    });

    return normalizedReservation;
  }

  /**
   * Verifica se há informações cruciais faltando nas reservas
   * @param reservationsData Array de dados de reservas
   * @returns Array de campos cruciais faltantes por reserva
   */
  private checkMissingCrucialInfo(reservationsData: any[]): any[] {
    const missingInfo: any[] = [];

    // Campos cruciais que devem estar presentes
    const crucialFields = [
      { key: 'data_check_in', label: 'Data Check-in' },
      { key: 'data_check_out', label: 'Data Check-out' },
      { key: 'nome_hospede', label: 'Nome Hóspede' },
      { key: 'total_hospedes', label: 'Total Hóspedes' }
    ];

    // Verificar cada reserva
    reservationsData.forEach((reservation, index) => {
      const missing = {
        reservationIndex: index,
        propertyName: reservation.alojamento || `Reserva ${index + 1}`,
        fields: []
      };

      // Verificar cada campo crucial
      crucialFields.forEach(field => {
        if (!reservation[field.key]) {
          missing.fields.push(field.label);
        }
      });

      // Adicionar à lista se houver campos faltando
      if (missing.fields.length > 0) {
        missingInfo.push(missing);
      }
    });

    return missingInfo;
  }

  /**
   * Formata mensagem de resposta com tabela Markdown e informações faltantes
   * @param reservationsData Dados das reservas extraídas
   * @param missingInfo Informações cruciais faltantes
   * @returns Mensagem formatada
   */
  private formatResponseMessage(reservationsData: any[], missingInfo: any[]): string {
    // Criar tabela Markdown com as reservas
    let message = '';
    
    if (reservationsData.length === 0) {
      message = "Não consegui identificar nenhuma reserva no texto fornecido. Por favor, verifique se o texto contém informações de reservas válidas.";
      return message;
    }

    // Criar cabeçalho da tabela
    message = "Aqui estão as reservas que identifiquei:\n\n";
    message += "| Alojamento | Check-in | Check-out | Nome Hóspede | Total Hóspedes | Canal | País |\n";
    message += "|------------|----------|-----------|--------------|---------------|-------|------|\n";

    // Adicionar cada reserva à tabela
    reservationsData.forEach(r => {
      message += `| ${r.alojamento || 'N/A'} | ${r.data_check_in || 'N/A'} | ${r.data_check_out || 'N/A'} | ${r.nome_hospede || 'N/A'} | ${r.total_hospedes || 'N/A'} | ${r.canal_reserva || 'N/A'} | ${r.pais_hospede || 'N/A'} |\n`;
    });

    // Adicionar informações sobre dados faltantes cruciais
    if (missingInfo.length > 0) {
      message += "\n\n**Informações cruciais em falta:**\n\n";
      
      missingInfo.forEach(missing => {
        message += `- Para ${missing.propertyName}: ${missing.fields.join(', ')}\n`;
      });
      
      message += "\nPor favor, forneça as informações em falta para que eu possa completar o registro das reservas.";
    } else {
      message += "\n\nTodas as informações cruciais foram extraídas com sucesso! Posso salvar estas reservas no sistema?";
    }

    return message;
  }

  /**
   * Salva as reservas no banco de dados
   * @param reservationsData Dados das reservas a serem salvas
   * @returns Informações sobre as reservas salvas
   */
  public async saveReservations(reservationsData: any[]): Promise<{ 
    success: boolean, 
    savedCount: number,
    failedCount: number,
    errors: any[]
  }> {
    try {
      const result = {
        success: true,
        savedCount: 0,
        failedCount: 0,
        errors: []
      };

      // Processar cada reserva
      for (const reservationData of reservationsData) {
        try {
          // Mapear os dados para o formato da tabela de reservas
          const insertData = this.mapToReservationSchema(reservationData);
          
          // Inserir no banco de dados
          const [inserted] = await db.insert(reservations).values(insertData).returning();
          
          if (inserted) {
            result.savedCount++;
          } else {
            result.failedCount++;
            result.errors.push({
              reservation: reservationData.alojamento || 'Reserva sem nome',
              error: 'Falha ao inserir no banco de dados'
            });
          }
        } catch (error: any) {
          result.failedCount++;
          result.errors.push({
            reservation: reservationData.alojamento || 'Reserva sem nome',
            error: error.message
          });
        }
      }

      // Definir sucesso como falso se houver alguma falha
      if (result.failedCount > 0) {
        result.success = false;
      }

      return result;
    } catch (error: any) {
      console.error("Erro ao salvar reservas:", error);
      throw new Error(`Falha ao salvar reservas: ${error.message}`);
    }
  }

  /**
   * Mapeia dados da reserva extraídos para o formato do schema da reserva
   * @param reservationData Dados extraídos da reserva
   * @returns Dados formatados para inserção no banco de dados
   */
  private mapToReservationSchema(reservationData: any): InsertReservation {
    // Primeiro, precisamos encontrar o ID da propriedade com base no nome
    // Para fins de demonstração, usaremos um ID fixo ou procuraremos dinamicamente
    // (isso deve ser adaptado ao seu caso específico)
    let propertyId = 1;  // ID padrão, deve ser substituído pela busca real

    // Mapear os dados para os campos da tabela de reservas
    return {
      propertyId: propertyId,
      guestName: reservationData.nome_hospede || 'Sem nome',
      checkInDate: reservationData.data_check_in || new Date().toISOString().split('T')[0],
      checkOutDate: reservationData.data_check_out || new Date().toISOString().split('T')[0],
      totalAmount: '0', // Valor padrão, a ser atualizado posteriormente
      numGuests: reservationData.total_hospedes || 1,
      guestEmail: reservationData.email_hospede || '',
      guestPhone: reservationData.telefone_hospede || '',
      status: 'confirmed',
      source: this.mapChannelToSource(reservationData.canal_reserva),
      notes: this.generateNotes(reservationData)
    };
  }

  /**
   * Mapeia o canal de reserva para o valor de source no schema
   * @param channel Canal da reserva
   * @returns Valor para o campo source
   */
  private mapChannelToSource(channel: string | undefined): string {
    if (!channel) return 'manual';

    const lowerChannel = channel.toLowerCase();
    
    if (lowerChannel.includes('airbnb')) return 'airbnb';
    if (lowerChannel.includes('booking')) return 'booking';
    if (lowerChannel.includes('expedia')) return 'expedia';
    if (lowerChannel.includes('direct') || lowerChannel.includes('direto') || lowerChannel.includes('pessoal')) return 'direct';
    
    return 'other';
  }

  /**
   * Gera texto para o campo notes com informações adicionais
   * @param reservationData Dados da reserva
   * @returns Texto formatado para o campo notes
   */
  private generateNotes(reservationData: any): string {
    const noteParts = [];

    if (reservationData.pais_hospede) {
      noteParts.push(`País: ${reservationData.pais_hospede}`);
    }
    
    if (reservationData.num_adultos) {
      noteParts.push(`Adultos: ${reservationData.num_adultos}`);
    }
    
    if (reservationData.num_criancas) {
      noteParts.push(`Crianças: ${reservationData.num_criancas}`);
    }
    
    if (reservationData.num_bebes) {
      noteParts.push(`Bebês: ${reservationData.num_bebes}`);
    }
    
    if (reservationData.hora_check_in) {
      noteParts.push(`Hora check-in: ${reservationData.hora_check_in}`);
    }
    
    if (reservationData.hora_check_out) {
      noteParts.push(`Hora check-out: ${reservationData.hora_check_out}`);
    }
    
    if (reservationData.notas) {
      noteParts.push(`Observações: ${reservationData.notas}`);
    }

    if (reservationData.referencia) {
      noteParts.push(`Ref: ${reservationData.referencia}`);
    }

    return noteParts.join(' | ');
  }

  /**
   * Obtém o prompt educativo para o Gemini 2.5 Flash
   * @returns Texto do prompt educativo
   */
  private getEducativePrompt(): string {
    return `Você é um Assistente de Extração e Estruturação de Dados de Reservas.

Seu trabalho é analisar texto (que pode vir de OCR de documentos como PDFs ou imagens, ou ser texto direto) contendo informações de reservas de alojamento, identificar as reservas individuais e extrair os dados relevantes.

Seu Processo:
1. Receber o Texto: Você lê o texto fornecido.
2. Analisar e Identificar: Você analisa o texto para identificar padrões e separar as informações de reservas individuais. Pode haver uma ou várias reservas no mesmo texto.
3. Extrair Dados: Para cada reserva identificada, você extrai todos os campos disponíveis:
   - Referência (ID da reserva, código, etc., se disponível)
   - Alojamento (Nome da propriedade/unidade, se identificável)
   - Data Check-in (Formato YYYY-MM-DD)
   - Hora Check-in (Formato HH:MM, se especificado)
   - Data Check-out (Formato YYYY-MM-DD)
   - Hora Check-out (Formato HH:MM, se especificado)
   - Nº Noites (Se disponível ou calculável)
   - Nome Hóspede (Nome do contato principal)
   - Nº Adultos (Se discriminado)
   - Nº Crianças (Se discriminado)
   - Nº Bebés (Se discriminado)
   - Total Hóspedes (Número total de pessoas)
   - País Hóspede (País de origem, se disponível)
   - Canal/Site Reserva (Plataforma: Airbnb, Booking, etc.)
   - Email Hóspede (Se disponível)
   - Telefone Hóspede (Se disponível)
   - Notas/Info Adicional (Comentários, pedidos especiais, etc.)

Regras Adicionais:
- Seja o mais preciso possível com as datas e horas. Assume o ano correto (2024/2025) com base no contexto.
- Mapeia termos semelhantes para os campos definidos (ex: "Crian", "crianças", "Crianç" -> Nº Crianças).
- Se não conseguires identificar claramente um campo, deixa-o como null ou string vazia.
- Mantém um tom profissional e útil.

Informação crucial inclui: Data Check-in, Data Check-out, Nome Hóspede, e Total Hóspedes.`;
  }
}
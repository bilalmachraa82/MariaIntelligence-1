/**
 * Serviço de Assistente de Reservas
 * Utiliza o Gemini 2.5 Flash para extrair e estruturar dados de reservas de textos e PDFs
 * Implementa o prompt educativo fornecido pelo cliente
 */

import { GeminiService, GeminiModel } from './gemini.service';
import { InsertReservation, insertReservationSchema } from '@shared/schema';
import { format } from 'date-fns';
import { db } from '../db';
import { reservations } from '@shared/schema';

// Interface para os dados de reserva retornados pelo assistente
interface ReservationData {
  alojamento: string;
  propertyId?: number;
  nome_hospede: string;
  email_hospede?: string;
  telefone_hospede?: string;
  data_check_in: string;
  data_check_out: string;
  total_hospedes?: number;
  valor_total?: string;
  canal_reserva?: string;
  notas?: string;
  [key: string]: any; // Para campos adicionais
}

// Interface para resposta do assistente
interface ReservationAssistantResponse {
  reservations: ReservationData[];
  responseMessage: string;
  missingCrucialInfo?: boolean;
}

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
  public async processReservationText(text: string): Promise<ReservationAssistantResponse> {
    try {
      console.log("Processando texto para extração de reservas...");
      
      // Extrair reservas usando formato JSON padrão (evita problemas de function calling)
      const reservationsData = await this.extractReservationsWithJsonFormat(text);
      
      // Normalizar dados
      const normalizedReservations = reservationsData.map(reservation => 
        this.normalizeReservationData(reservation)
      );
      
      // Verificar informações cruciais faltantes
      const missingInfo = this.checkMissingCrucialInfo(normalizedReservations);
      const hasMissingCrucialInfo = missingInfo.some(info => info.length > 0);
      
      // Formatar mensagem de resposta
      const responseMessage = this.formatResponseMessage(normalizedReservations, missingInfo);
      
      return {
        reservations: normalizedReservations,
        responseMessage,
        missingCrucialInfo: hasMissingCrucialInfo
      };
    } catch (error) {
      console.error("Erro ao processar texto de reserva:", error);
      throw new Error(`Erro ao processar texto de reserva: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Método alternativo para extrair reservas usando formato JSON padrão
   * Este método não usa function calling que estava causando problemas de compatibilidade
   * @param text Texto da reserva
   * @returns Array de reservas extraídas
   */
  private async extractReservationsWithJsonFormat(text: string): Promise<ReservationData[]> {
    try {
      console.log("Usando Gemini 1.5 Flash para extrair reservas com formato JSON padrão...");
      
      // Construir o prompt para extração de reservas
      const prompt = `
      # Instruções para Extração de Dados de Reserva

      Analise cuidadosamente o texto a seguir que contém informações sobre reservas de alojamentos.
      Extraia TODAS as reservas mencionadas e formate-as como um array JSON com a seguinte estrutura:

      \`\`\`json
      {
        "reservations": [
          {
            "alojamento": "Nome do alojamento",
            "nome_hospede": "Nome do hóspede",
            "email_hospede": "Email (se disponível)",
            "telefone_hospede": "Telefone (se disponível)",
            "data_check_in": "YYYY-MM-DD",
            "data_check_out": "YYYY-MM-DD",
            "total_hospedes": 2,
            "valor_total": "100€",
            "canal_reserva": "Airbnb, Booking, etc",
            "notas": "Observações adicionais"
          }
        ]
      }
      \`\`\`

      Importante:
      - Extraia TODAS as reservas encontradas no texto
      - Formate datas no padrão YYYY-MM-DD
      - Se não encontrar alguma informação, use valores vazios (string vazia ou 0)
      - A resposta deve ser APENAS o objeto JSON sem texto adicional

      Texto a analisar:
      ${text}`;
      
      // Chamar o modelo com resposta em formato JSON
      const result = await this.geminiService.generateText({
        userPrompt: prompt,
        model: GeminiModel.FLASH,
        temperature: 0.1,
        maxOutputTokens: 4096
      });
      
      // Processar o resultado
      try {
        // Limpar a resposta para extrair apenas o JSON
        let cleanedResult = result.trim();
        // Remover delimitadores de código json se presentes
        if (cleanedResult.includes('```json')) {
          cleanedResult = cleanedResult.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        
        // Converter resultado em objeto
        const parsedResult = JSON.parse(cleanedResult);
        
        // Verificar se temos um array de reservas
        if (parsedResult && parsedResult.reservations && Array.isArray(parsedResult.reservations)) {
          console.log(`Extraídas ${parsedResult.reservations.length} reservas do texto`);
          return parsedResult.reservations;
        } else {
          console.error("Resposta não contém um array de reservas válido:", parsedResult);
          return [];
        }
      } catch (parseError) {
        console.error("Erro ao processar resposta JSON:", parseError);
        console.log("Resposta bruta:", result);
        throw new Error(`Falha ao processar JSON da resposta: ${parseError.message}`);
      }
    } catch (error) {
      console.error("Erro ao extrair reservas com formato JSON:", error);
      throw new Error(`Erro ao extrair reservas: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extrai reservas do texto usando function calling com Gemini 2.5 Flash
   * @param text Texto da reserva
   * @returns Array de reservas extraídas
   */
  private async extractReservationsWithFunctionCalling(text: string): Promise<ReservationData[]> {
    // Definição da função a ser chamada pelo modelo
    const extractReservationFunction = {
      name: "extract_reservations",
      description: "Extrair detalhes de reservas de hospedagem a partir de texto",
      parameters: {
        type: "object",
        properties: {
          reservations: {
            type: "array",
            description: "Lista de reservas extraídas do texto",
            items: {
              type: "object",
              properties: {
                alojamento: {
                  type: "string",
                  description: "Nome do alojamento ou propriedade reservada"
                },
                nome_hospede: {
                  type: "string",
                  description: "Nome completo do hóspede"
                },
                email_hospede: {
                  type: "string",
                  description: "Email do hóspede, se disponível"
                },
                telefone_hospede: {
                  type: "string",
                  description: "Telefone do hóspede, se disponível"
                },
                data_check_in: {
                  type: "string",
                  description: "Data de check-in no formato YYYY-MM-DD"
                },
                data_check_out: {
                  type: "string",
                  description: "Data de check-out no formato YYYY-MM-DD"
                },
                total_hospedes: {
                  type: "integer",
                  description: "Número total de hóspedes"
                },
                valor_total: {
                  type: "string",
                  description: "Valor total da reserva (com moeda, se disponível)"
                },
                canal_reserva: {
                  type: "string",
                  description: "Canal de reserva (ex: Airbnb, Booking.com, Direto)"
                },
                notas: {
                  type: "string",
                  description: "Observações adicionais sobre a reserva"
                }
              },
              required: ["alojamento", "nome_hospede", "data_check_in", "data_check_out"]
            }
          }
        },
        required: ["reservations"]
      }
    };

    try {
      console.log("Chamando Gemini 2.5 Flash para extrair reservas com function calling...");
      
      // Chamar o modelo com system prompt educativo e definição da função
      const result = await this.geminiService.generateStructuredOutput({
        systemPrompt: this.getEducativePrompt(),
        userPrompt: text,
        model: GeminiModel.FLASH,
        temperature: 0.1,
        maxOutputTokens: 4096,
        functionDefinitions: [extractReservationFunction],
        functionCallBehavior: 'auto'
      });
      
      console.log("Resposta do Gemini:", JSON.stringify(result, null, 2));
      
      // Verificar se há uma chamada de função na resposta
      if (result.functionCalls && result.functionCalls.length > 0 && 
          result.functionCalls[0].name === 'extract_reservations') {
        const arguments_json = result.functionCalls[0].args;
        
        if (arguments_json.reservations && Array.isArray(arguments_json.reservations)) {
          return arguments_json.reservations;
        } else {
          console.log("Nenhuma reserva encontrada na resposta do function calling");
          return [];
        }
      } else {
        // Se não houver chamada de função ou estrutura esperada, tentamos extrair manualmente
        console.log("Função não chamada corretamente, tentando extrair dados da resposta...");
        
        if (typeof result === 'object' && 'reservations' in result && Array.isArray(result.reservations)) {
          return result.reservations;
        }
        
        return [];
      }
    } catch (error) {
      console.error("Erro ao extrair reservas com function calling:", error);
      throw error;
    }
  }

  /**
   * Normaliza os dados da reserva para formato consistente
   * @param reservation Dados da reserva extraídos
   * @returns Dados normalizados
   */
  private normalizeReservationData(reservation: any): ReservationData {
    // Tentativa de padronização de datas
    let checkInDate = reservation.data_check_in || '';
    let checkOutDate = reservation.data_check_out || '';
    
    // Processar datas em formatos variados (DD/MM/YYYY, MM/DD/YYYY, etc.)
    try {
      if (checkInDate.includes('/')) {
        const parts = checkInDate.split('/');
        // Assumir padrão DD/MM/YYYY ou MM/DD/YYYY
        if (parts.length === 3) {
          // Se o primeiro número é maior que 12, assumimos que é dia
          if (parseInt(parts[0]) > 12) {
            checkInDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else {
            // Caso contrário, assumimos padrão MM/DD/YYYY (menos comum em Portugal)
            checkInDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
      }
      
      if (checkOutDate.includes('/')) {
        const parts = checkOutDate.split('/');
        if (parts.length === 3) {
          if (parseInt(parts[0]) > 12) {
            checkOutDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else {
            checkOutDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
      }
    } catch (e) {
      console.warn("Erro ao normalizar datas:", e);
    }

    // Padronizar canal de reserva para categorias conhecidas
    let channel = (reservation.canal_reserva || '').toLowerCase();
    if (channel.includes('airbnb')) {
      channel = 'airbnb';
    } else if (channel.includes('booking')) {
      channel = 'booking';
    } else if (channel.includes('direct') || channel.includes('direto')) {
      channel = 'direct';
    } else if (channel.includes('expedia')) {
      channel = 'expedia';
    } else if (channel) {
      channel = 'other';
    }

    // Extrair valor total sem símbolos de moeda
    let totalAmount = reservation.valor_total || '';
    if (totalAmount) {
      totalAmount = totalAmount.replace(/[^\d,.]/g, '').trim();
    }
    
    return {
      alojamento: reservation.alojamento || '',
      propertyId: typeof reservation.propertyId === 'number' ? reservation.propertyId : undefined,
      nome_hospede: reservation.nome_hospede || '',
      email_hospede: reservation.email_hospede || '',
      telefone_hospede: reservation.telefone_hospede || '',
      data_check_in: checkInDate,
      data_check_out: checkOutDate,
      total_hospedes: reservation.total_hospedes ? parseInt(String(reservation.total_hospedes)) : undefined,
      valor_total: totalAmount,
      canal_reserva: channel || '',
      notas: reservation.notas || ''
    };
  }

  /**
   * Verifica se há informações cruciais faltando nas reservas
   * @param reservationsData Array de dados de reservas
   * @returns Array de campos cruciais faltantes por reserva
   */
  private checkMissingCrucialInfo(reservationsData: ReservationData[]): string[][] {
    return reservationsData.map(reservation => {
      const missingFields: string[] = [];
      
      if (!reservation.alojamento) missingFields.push('Alojamento');
      if (!reservation.nome_hospede) missingFields.push('Nome do hóspede');
      if (!reservation.data_check_in) missingFields.push('Data de check-in');
      if (!reservation.data_check_out) missingFields.push('Data de check-out');
      
      return missingFields;
    });
  }

  /**
   * Formata mensagem de resposta com tabela Markdown e informações faltantes
   * @param reservationsData Dados das reservas extraídas
   * @param missingInfo Informações cruciais faltantes
   * @returns Mensagem formatada
   */
  private formatResponseMessage(reservationsData: ReservationData[], missingInfo: string[][]): string {
    if (reservationsData.length === 0) {
      return "Não foi possível identificar nenhuma reserva a partir do texto fornecido. Por favor, verifique se o texto contém informações de reserva e tente novamente.";
    }
    
    let message = `# ${reservationsData.length} Reserva(s) Encontrada(s)\n\n`;
    
    // Criar tabela de resumo
    message += "| Alojamento | Hóspede | Check-in | Check-out | Pessoas | Canal |\n";
    message += "|------------|---------|----------|-----------|---------|-------|\n";
    
    reservationsData.forEach((reservation, index) => {
      const missing = missingInfo[index];
      
      message += `| ${reservation.alojamento || 'N/A'} `;
      message += `| ${reservation.nome_hospede || 'N/A'} `;
      message += `| ${reservation.data_check_in || 'N/A'} `;
      message += `| ${reservation.data_check_out || 'N/A'} `;
      message += `| ${reservation.total_hospedes || 'N/A'} `;
      message += `| ${reservation.canal_reserva || 'N/A'} |\n`;
    });
    
    message += "\n";
    
    // Adicionar alertas sobre informações faltantes
    const reservationsWithMissing = missingInfo.filter(info => info.length > 0);
    if (reservationsWithMissing.length > 0) {
      message += "## ⚠️ Atenção: Informações Cruciais Faltando\n\n";
      
      reservationsData.forEach((reservation, index) => {
        if (missingInfo[index].length > 0) {
          message += `- **Reserva ${index + 1} (${reservation.nome_hospede || 'Hóspede desconhecido'})**: `;
          message += `Faltando: ${missingInfo[index].join(', ')}\n`;
        }
      });
      
      message += "\nPor favor, revise os dados acima e adicione as informações faltantes antes de salvar.\n";
    } else {
      message += "✅ Todas as informações cruciais foram encontradas nas reservas.\n";
    }
    
    return message;
  }

  /**
   * Salva as reservas no banco de dados
   * @param reservationsData Dados das reservas a serem salvas
   * @returns Informações sobre as reservas salvas
   */
  public async saveReservations(reservationsData: any[]): Promise<{ 
    success: boolean; 
    savedCount: number;
    message: string;
    errors?: any[];
  }> {
    if (!reservationsData || reservationsData.length === 0) {
      return {
        success: false,
        savedCount: 0,
        message: "Nenhuma reserva para salvar"
      };
    }
    
    try {
      console.log(`Iniciando salvamento de ${reservationsData.length} reservas...`);
      
      const savedReservations = [];
      const errors = [];
      
      // Processar cada reserva individualmente
      for (const reservationData of reservationsData) {
        try {
          // Mapear para o formato do schema
          const insertData = this.mapToReservationSchema(reservationData);
          console.log("Dados formatados para inserção:", JSON.stringify(insertData, null, 2));
          
          // Validar dados antes de inserir
          const validatedData = insertReservationSchema.parse(insertData);
          
          // Inserir reserva no banco de dados
          const [savedReservation] = await db!.insert(reservations).values(validatedData).returning();
          
          console.log(`Reserva salva com sucesso. ID: ${savedReservation.id}`);
          savedReservations.push(savedReservation);
        } catch (error) {
          console.error("Erro ao salvar reserva:", error);
          errors.push({
            data: reservationData,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      return {
        success: savedReservations.length > 0,
        savedCount: savedReservations.length,
        message: `${savedReservations.length} de ${reservationsData.length} reservas salvas com sucesso.`,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error("Erro ao salvar reservas:", error);
      throw new Error(`Erro ao salvar reservas: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Mapeia dados da reserva extraídos para o formato do schema da reserva
   * @param reservationData Dados extraídos da reserva
   * @returns Dados formatados para inserção no banco de dados
   */
  private mapToReservationSchema(reservationData: any): InsertReservation {
    // Tentar encontrar propertyId por nome do alojamento se não fornecido
    // Para simplicidade, usaremos o nome diretamente por enquanto
    // Uma implementação mais robusta deveria buscar o ID da propriedade pelo nome
    
    // Converter data de string para objeto Date se necessário
    const checkInDate = reservationData.data_check_in;
    const checkOutDate = reservationData.data_check_out;
    
    // Calcular valores derivados quando possível
    const valorTotal = reservationData.valor_total 
      ? String(reservationData.valor_total).replace(/[^\d,.]/g, '') 
      : "0";
    
    // Mapear canal para o formato esperado pelo schema
    const source = this.mapChannelToSource(reservationData.canal_reserva);
    
    // Gerar notas com informações adicionais
    const notes = this.generateNotes(reservationData);
    
    // Criar objeto para inserção
    return {
      propertyId: reservationData.propertyId || 1, // ID padrão ou buscar dinamicamente
      guestName: reservationData.nome_hospede,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      totalAmount: valorTotal,
      status: 'confirmed',
      numGuests: reservationData.total_hospedes || 1,
      guestEmail: reservationData.email_hospede || null,
      guestPhone: reservationData.telefone_hospede || null,
      source: source,
      notes: notes
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
    if (lowerChannel.includes('direct') || lowerChannel.includes('direto')) return 'direct';
    if (lowerChannel.includes('expedia')) return 'expedia';
    
    return 'other';
  }

  /**
   * Gera texto para o campo notes com informações adicionais
   * @param reservationData Dados da reserva
   * @returns Texto formatado para o campo notes
   */
  private generateNotes(reservationData: any): string {
    const notes = [];
    
    notes.push(`Alojamento: ${reservationData.alojamento || 'Não especificado'}`);
    
    if (reservationData.notas) {
      notes.push(`Observações: ${reservationData.notas}`);
    }
    
    notes.push(`Extraído automaticamente pelo Assistente de Reservas com Gemini 2.5 Flash`);
    notes.push(`Data da extração: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
    
    return notes.join('\n');
  }

  /**
   * Obtém o prompt educativo para o Gemini 2.5 Flash
   * @returns Texto do prompt educativo
   */
  private getEducativePrompt(): string {
    return `
# Assistente de Reservas com Gemini 2.5 Flash

Você é um assistente especializado em extrair informações de reservas de hospedagem a partir de textos e documentos. Sua função é identificar e estruturar dados importantes sobre reservas para o sistema Maria Faz.

## Contexto
O Maria Faz é um sistema de gestão para propriedades de aluguel de curta duração. Você precisa extrair dados estruturados de reservas a partir de textos que podem vir de e-mails, mensagens, PDFs ou outros documentos.

## Diretrizes
- Analise cuidadosamente o texto em busca de informações de reserva
- Identifique os campos essenciais como alojamento, hóspede, datas, etc.
- Organize os dados no formato estruturado solicitado
- Use apenas informações presentes no texto (não invente dados)
- Formate datas no padrão YYYY-MM-DD
- Se houver múltiplas reservas, identifique cada uma separadamente
- Informe campos cruciais que não puderam ser extraídos

## Campos importantes
- Nome do alojamento/propriedade
- Nome do hóspede
- Data de check-in
- Data de check-out
- Número de hóspedes
- Valor total
- Canal de reserva (Airbnb, Booking, Direto, etc.)
- Email e telefone do hóspede (se disponíveis)
- Observações relevantes

## Importante
- Formate todas as datas como YYYY-MM-DD
- Considere diferentes formatos de entrada (DD/MM/YYYY, MM/DD/YYYY, etc.)
- Mantenha os valores monetários com o símbolo da moeda quando disponível
- Nunca crie dados fictícios para preencher lacunas
    `;
  }
}
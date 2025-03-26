/**
 * Serviço para processamento de arquivos de controle de reservas
 * Permite extrair múltiplas reservas de um único PDF de controle (como o Controlo_Aroeira)
 */

import fs from 'fs';
import pdf from 'pdf-parse';
import { storage } from '../storage';
import { InsertReservation } from '../../shared/schema';
import { AIAdapter } from './ai-adapter.service';

// Interface para o resultado do processamento do arquivo de controle
export interface ControlFileResult {
  success: boolean;
  isControlFile: boolean;
  propertyName: string;
  reservations: any[];
  rawText: string;
  error?: string;
}

// Interface para uma reserva extraída do arquivo de controle
export interface ControlReservation {
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalAmount: string;
  platform: string;
  // Outros campos opcionais
  notes?: string;
  phoneNumber?: string;
  email?: string;
}

/**
 * Processa um arquivo PDF para verificar se é um arquivo de controle
 * e extrair as reservas listadas nele
 * 
 * @param filePath Caminho para o arquivo PDF
 * @returns Resultado do processamento com as reservas encontradas
 */
export async function processControlFile(filePath: string): Promise<ControlFileResult> {
  try {
    console.log(`[ControlFileProcessor] Verificando se ${filePath} é um arquivo de controle`);
    
    // Carregar o arquivo PDF
    const dataBuffer = fs.readFileSync(filePath);
    
    // Extrair o texto do PDF usando pdf-parse
    const pdfData = await pdf(dataBuffer);
    const rawText = pdfData.text;
    
    // Verificar se o texto contém padrões que indicam ser um arquivo de controle
    const isControlFile = 
      (rawText.includes('Controlo_Aroeira') || 
       rawText.includes('Controlo Aroeira') ||
       rawText.includes('Controlo_') ||
       rawText.includes('Mapa de Reservas') ||
       (rawText.includes('Check-in') && rawText.includes('Check-out') && 
        rawText.includes('Cliente') && rawText.includes('Noites')));
    
    if (!isControlFile) {
      console.log('[ControlFileProcessor] Arquivo não identificado como controle de reservas');
      return {
        success: true,
        isControlFile: false,
        propertyName: '',
        reservations: [],
        rawText
      };
    }
    
    console.log('[ControlFileProcessor] Arquivo identificado como controle de reservas!');
    
    // Extrair nome da propriedade (geralmente presente no título do documento)
    let propertyName = 'Propriedade Desconhecida';
    
    // Padrões comuns para identificar o nome da propriedade
    const propertyNamePatterns = [
      /Controlo_([A-Za-z\s]+)/i,
      /Controlo\s+([A-Za-z\s]+)/i,
      /Mapa de Reservas\s+-\s+([A-Za-z\s]+)/i
    ];
    
    for (const pattern of propertyNamePatterns) {
      const match = rawText.match(pattern);
      if (match && match[1]) {
        propertyName = match[1].trim();
        break;
      }
    }
    
    console.log(`[ControlFileProcessor] Propriedade identificada: ${propertyName}`);
    
    // Usar o adaptador de IA para extrair as reservas do texto
    const aiAdapter = AIAdapter.getInstance();
    
    // Definir um sistema de prompt para extração de múltiplas reservas
    const systemPrompt = `
      Extraia todas as reservas do seguinte documento de controle.
      Cada reserva deve ter os seguintes campos: 
      - Nome do cliente (guestName)
      - Data de check-in (checkInDate) no formato DD/MM/YYYY
      - Data de check-out (checkOutDate) no formato DD/MM/YYYY
      - Número de hóspedes (numGuests)
      - Valor total (totalAmount)
      - Plataforma de reserva (platform), como Airbnb, Booking, etc.
      - Notas adicionais (notes), se houver

      Retorne apenas as reservas encontradas, sem textos adicionais.
    `;
    
    // Extrair as reservas usando o adaptador de IA
    const extractionResult = await aiAdapter.extractDataFromText(
      rawText,
      {
        systemPrompt,
        responseFormat: { type: 'json' },
        temperature: 0.1,
        maxTokens: 4096
      }
    );
    
    let reservations = [];
    
    try {
      // Tentar processar a resposta JSON
      const parsedResponse = typeof extractionResult === 'string' 
        ? JSON.parse(extractionResult) 
        : extractionResult;
      
      // Verificar se temos um array de reservas ou um objeto com a propriedade reservations
      if (Array.isArray(parsedResponse)) {
        reservations = parsedResponse;
      } else if (parsedResponse && Array.isArray(parsedResponse.reservations)) {
        reservations = parsedResponse.reservations;
      }
      
      console.log(`[ControlFileProcessor] Extraídas ${reservations.length} reservas do documento`);
      
      return {
        success: true,
        isControlFile: true,
        propertyName,
        reservations,
        rawText
      };
    } catch (error) {
      console.error('[ControlFileProcessor] Erro ao processar resultado JSON:', error);
      return {
        success: false,
        isControlFile: true,
        propertyName,
        reservations: [],
        rawText,
        error: 'Erro ao processar resultado JSON da extração'
      };
    }
  } catch (error) {
    console.error('[ControlFileProcessor] Erro ao processar arquivo de controle:', error);
    return {
      success: false,
      isControlFile: false,
      propertyName: '',
      reservations: [],
      rawText: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Cria reservas no sistema a partir dos dados extraídos do arquivo de controle
 * 
 * @param controlResult Resultado do processamento do arquivo de controle
 * @returns Array com as reservas criadas
 */
export async function createReservationsFromControlFile(controlResult: ControlFileResult): Promise<any[]> {
  try {
    console.log(`[ControlFileProcessor] Criando ${controlResult.reservations.length} reservas do arquivo de controle`);
    
    const createdReservations = [];
    
    // Encontrar a propriedade pelo nome
    const properties = await storage.getProperties();
    
    // Tentar encontrar a propriedade usando correspondência de texto
    let propertyId: number | null = null;
    
    for (const property of properties) {
      if (property.name.toLowerCase().includes(controlResult.propertyName.toLowerCase()) ||
          controlResult.propertyName.toLowerCase().includes(property.name.toLowerCase())) {
        propertyId = property.id;
        console.log(`[ControlFileProcessor] Propriedade correspondente encontrada: ${property.name} (ID: ${propertyId})`);
        break;
      }
    }
    
    if (!propertyId) {
      console.warn(`[ControlFileProcessor] Não foi possível encontrar uma propriedade para "${controlResult.propertyName}"`);
      return [];
    }
    
    // Processar cada reserva extraída
    for (const reservation of controlResult.reservations) {
      try {
        // Formatar datas para o formato YYYY-MM-DD
        const formatDate = (dateStr: string): string => {
          if (!dateStr) return '';
          
          // Verificar o formato da data (DD/MM/YYYY ou DD-MM-YYYY)
          const parts = dateStr.includes('/') 
            ? dateStr.split('/') 
            : dateStr.split('-');
          
          if (parts.length !== 3) return '';
          
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        };
        
        // Converter valores para os tipos adequados
        const checkInDate = formatDate(reservation.checkInDate);
        const checkOutDate = formatDate(reservation.checkOutDate);
        
        // Converter valor monetário para número
        const totalAmount = typeof reservation.totalAmount === 'string'
          ? reservation.totalAmount.replace(/[^0-9.,]/g, '').replace(',', '.')
          : String(reservation.totalAmount || 0);
        
        // Calcular a taxa da plataforma (estimativa de 10% para Airbnb/Booking)
        const platform = reservation.platform || 'direct';
        const platformFee = platform.toLowerCase().includes('airbnb') || 
                            platform.toLowerCase().includes('booking')
          ? String(Math.round(parseFloat(totalAmount) * 0.1))
          : '0';
        
        // Estimar a taxa de limpeza com base na propriedade
        const property = properties.find(p => p.id === propertyId);
        const cleaningFee = property?.cleaningCost || '0';
        
        // Criar a reserva
        const newReservation: InsertReservation = {
          propertyId: propertyId,
          guestName: reservation.guestName,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          totalAmount: totalAmount,
          status: 'confirmed',
          notes: reservation.notes || '',
          platform: platform,
          numGuests: Number(reservation.numGuests || 1),
          platformFee: platformFee,
          cleaningFee: cleaningFee,
          checkInFee: property?.checkInFee || '0',
          commissionFee: String(parseFloat(totalAmount) * (parseFloat(property?.commission || '0') / 100)),
          teamPayment: property?.teamPayment || '0',
          contactPhone: reservation.phoneNumber || '',
          contactEmail: reservation.email || '',
          netAmount: String(parseFloat(totalAmount) - parseFloat(platformFee) - parseFloat(cleaningFee))
        };
        
        console.log(`[ControlFileProcessor] Criando reserva para ${newReservation.guestName}`);
        
        // Criar a reserva no banco de dados
        const createdReservation = await storage.createReservation(newReservation);
        
        // Registrar atividade no sistema
        await storage.createActivity({
          type: 'reservation_created',
          description: `Reserva criada a partir de arquivo de controle: ${createdReservation.propertyId} - ${createdReservation.guestName}`,
          entityId: createdReservation.id,
          entityType: 'reservation'
        });
        
        createdReservations.push(createdReservation);
      } catch (error) {
        console.error(`[ControlFileProcessor] Erro ao criar reserva para ${reservation.guestName}:`, error);
      }
    }
    
    console.log(`[ControlFileProcessor] Criadas ${createdReservations.length} reservas com sucesso`);
    return createdReservations;
  } catch (error) {
    console.error('[ControlFileProcessor] Erro ao criar reservas do arquivo de controle:', error);
    return [];
  }
}
/**
 * Processador específico para PDFs de check-in e check-out
 * Reconhece o formato tabular com múltiplas reservas
 */

import fs from 'fs';
import pdf from 'pdf-parse';
import { storage } from '../storage';
import { InsertReservation } from '../../shared/schema';

interface ExtractedReservation {
  referencia: string;
  alojamento: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  adultos: number;
  criancas: number;
  telefone: string;
  email: string;
  pais: string;
  estado: string;
}

/**
 * Processa PDFs de check-in/check-out com múltiplas reservas
 */
export async function processCheckinCheckoutFile(filePath: string): Promise<{
  success: boolean;
  reservations: any[];
  type: 'checkin' | 'checkout' | 'unknown';
  errors?: string[];
}> {
  try {
    console.log('📋 Processando arquivo de check-in/check-out...');
    
    // Ler e extrair texto do PDF
    const pdfBuffer = fs.readFileSync(filePath);
    const data = await pdf(pdfBuffer);
    const text = data.text;
    
    // Determinar tipo do documento
    const type = determineDocumentType(text);
    console.log(`📑 Tipo de documento detectado: ${type}`);
    
    // Extrair reservas do texto
    const extractedReservations = extractReservationsFromTable(text);
    console.log(`📊 Reservas extraídas: ${extractedReservations.length}`);
    
    // Converter para formato do sistema
    const reservations = await convertToSystemFormat(extractedReservations, type);
    
    return {
      success: true,
      reservations,
      type,
    };
    
  } catch (error) {
    console.error('❌ Erro ao processar arquivo:', error);
    return {
      success: false,
      reservations: [],
      type: 'unknown',
      errors: [error instanceof Error ? error.message : 'Erro desconhecido']
    };
  }
}

/**
 * Determina se é documento de check-in ou check-out
 */
function determineDocumentType(text: string): 'checkin' | 'checkout' | 'unknown' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('entradas')) {
    return 'checkin';
  } else if (lowerText.includes('saídas')) {
    return 'checkout';
  }
  
  return 'unknown';
}

/**
 * Extrai reservas do formato tabular
 */
function extractReservationsFromTable(text: string): ExtractedReservation[] {
  const reservations: ExtractedReservation[] = [];
  const lines = text.split('\n');
  
  console.log('🔍 Analisando linhas do documento...');
  
  let currentReservation: Partial<ExtractedReservation> = {};
  let isInReservationSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detectar início de seção de reservas
    if (line.includes('Referência') && line.includes('Alojamento')) {
      isInReservationSection = true;
      continue;
    }
    
    if (!isInReservationSection) continue;
    
    // Pular linhas vazias ou cabeçalhos
    if (!line || line.length < 10) continue;
    
    // Detectar linha de reserva (começa com referência no formato A169-, A203-, etc.)
    const reservationMatch = line.match(/^([A-Z]\d{3}-[A-Z0-9]+)/);
    
    if (reservationMatch) {
      // Se já temos uma reserva, salvá-la
      if (currentReservation.referencia) {
        const completed = completeReservation(currentReservation);
        if (completed) {
          reservations.push(completed);
        }
      }
      
      // Iniciar nova reserva
      currentReservation = parseReservationLine(line);
      
      // Verificar linhas seguintes para dados adicionais
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.match(/^([A-Z]\d{3}-[A-Z0-9]+)/)) {
          mergeAdditionalData(currentReservation, nextLine);
        } else {
          break;
        }
      }
    }
  }
  
  // Adicionar última reserva se existir
  if (currentReservation.referencia) {
    const completed = completeReservation(currentReservation);
    if (completed) {
      reservations.push(completed);
    }
  }
  
  return reservations;
}

/**
 * Faz parse de uma linha de reserva
 */
function parseReservationLine(line: string): Partial<ExtractedReservation> {
  const parts = line.split(/\s+/);
  
  const reservation: Partial<ExtractedReservation> = {
    referencia: parts[0] || '',
  };
  
  // Extrair alojamento (segunda coluna)
  let alojamentoIndex = 1;
  let alojamento = '';
  while (alojamentoIndex < parts.length) {
    const part = parts[alojamentoIndex];
    if (part.match(/^\d{2}-\d{2}-\d{4}$/)) break; // Para quando encontrar data
    alojamento += (alojamento ? ' ' : '') + part;
    alojamentoIndex++;
  }
  reservation.alojamento = alojamento;
  
  // Extrair datas
  for (let i = alojamentoIndex; i < parts.length; i++) {
    const part = parts[i];
    if (part.match(/^\d{2}-\d{2}-\d{4}$/)) {
      if (!reservation.checkInDate) {
        reservation.checkInDate = convertDateFormat(part);
      } else if (!reservation.checkOutDate) {
        reservation.checkOutDate = convertDateFormat(part);
      }
    }
  }
  
  // Extrair números de hóspedes
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (/^\d+$/.test(part)) {
      const num = parseInt(part);
      if (num >= 1 && num <= 20) {
        if (!reservation.adultos) {
          reservation.adultos = num;
        } else if (!reservation.criancas) {
          reservation.criancas = num;
        }
      }
    }
  }
  
  return reservation;
}

/**
 * Adiciona dados adicionais de linhas subsequentes
 */
function mergeAdditionalData(reservation: Partial<ExtractedReservation>, line: string) {
  // Extrair nome do hóspede
  const nameMatch = line.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
  if (nameMatch && !reservation.guestName) {
    reservation.guestName = nameMatch[1];
  }
  
  // Extrair telefone
  const phoneMatch = line.match(/(\+\d{2,3}\s?\d{3,4}\s?\d{3,4}\s?\d{3,4})/);
  if (phoneMatch) {
    reservation.telefone = phoneMatch[1];
  }
  
  // Extrair email
  const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    reservation.email = emailMatch[1];
  }
  
  // Extrair país
  const paisMatch = line.match(/(Portugal|Brasil|Espanha|França|Reino Unido|Bélgica|África do Sul)/);
  if (paisMatch) {
    reservation.pais = paisMatch[1];
  }
}

/**
 * Completa dados da reserva e valida
 */
function completeReservation(reservation: Partial<ExtractedReservation>): ExtractedReservation | null {
  if (!reservation.referencia || !reservation.alojamento) {
    return null;
  }
  
  return {
    referencia: reservation.referencia,
    alojamento: reservation.alojamento,
    guestName: reservation.guestName || 'Hóspede não identificado',
    checkInDate: reservation.checkInDate || '',
    checkOutDate: reservation.checkOutDate || '',
    adultos: reservation.adultos || 1,
    criancas: reservation.criancas || 0,
    telefone: reservation.telefone || '',
    email: reservation.email || '',
    pais: reservation.pais || '',
    estado: 'confirmed'
  };
}

/**
 * Converte para formato do sistema
 */
async function convertToSystemFormat(reservations: ExtractedReservation[], type: string): Promise<any[]> {
  const converted = [];
  
  for (const reservation of reservations) {
    // Encontrar ID da propriedade
    const propertyId = await findPropertyIdByName(reservation.alojamento);
    
    const systemReservation = {
      propertyName: reservation.alojamento,
      propertyId,
      guestName: reservation.guestName,
      guestPhone: reservation.telefone,
      guestEmail: reservation.email,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      numGuests: reservation.adultos + reservation.criancas,
      totalAmount: 0, // Será preenchido depois
      platform: 'manual',
      status: 'confirmed',
      notes: `Extraído via OCR - ${type} (${new Date().toLocaleDateString()})`,
      reference: reservation.referencia,
      country: reservation.pais,
      adults: reservation.adultos,
      children: reservation.criancas
    };
    
    converted.push(systemReservation);
  }
  
  return converted;
}

/**
 * Converte data de DD-MM-YYYY para YYYY-MM-DD
 */
function convertDateFormat(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

/**
 * Encontra ID da propriedade por nome
 */
async function findPropertyIdByName(propertyName: string): Promise<number | undefined> {
  try {
    const properties = await storage.getProperties();
    
    const normalizedName = propertyName.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
    
    for (const property of properties) {
      const normalizedPropertyName = property.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
      
      if (normalizedPropertyName.includes(normalizedName) || 
          normalizedName.includes(normalizedPropertyName)) {
        return property.id;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error('Erro ao buscar propriedade:', error);
    return undefined;
  }
}
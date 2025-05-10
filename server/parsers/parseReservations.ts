/**
 * Parser para extrair e validar dados de reservas a partir do texto OCR
 * Fornece funções de normalização, validação e extração de dados estruturados
 */

import { AIAdapter } from '../services/ai-adapter.service';

// Interface para dados de reserva extraídos
interface ReservationData {
  propertyName?: string;
  propertyId?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate?: string;
  checkOutDate?: string;
  numGuests?: number;
  totalAmount?: number;
  platformFee?: number;
  cleaningFee?: number;
  checkInFee?: number;
  commissionFee?: number;
  teamPayment?: number;
  netAmount?: number;
  platform?: string;
  status?: string;
  notes?: string;
  reservationId?: string;
  [key: string]: any; // Para outros campos
}

// Interface para o resultado do parsing
interface ParseResult {
  reservations: ReservationData[];
  boxes?: Record<string, any>; // Retângulos delimitadores para visualização
  missing: string[]; // Campos obrigatórios não encontrados
}

/**
 * Extrai dados de reservas do texto de OCR
 * @param text Texto extraído por OCR
 * @returns Resultado do parsing com reservas extraídas
 */
export async function parseReservationData(text: string): Promise<ParseResult> {
  console.log('🔍 Iniciando extração de dados de reserva a partir do texto OCR');
  
  // Lista de reservas extraídas
  const reservations: ReservationData[] = [];
  
  // Lista de campos obrigatórios em falta
  const missing: string[] = [];
  
  // Retângulos delimitadores (se disponíveis)
  const boxes: Record<string, any> = {};
  
  try {
    // Parser nativo sem depender do Gemini
    console.log('🔍 Usando parser nativo sem IA');
    
    // Campos obrigatórios
    const requiredFields = [
      'propertyName', 'guestName', 'checkInDate', 'checkOutDate', 
      'numGuests', 'totalAmount'
    ];
    
    // Tentar extrair dados diretamente do texto usando regex
    const reservation: ReservationData = {};
    const missingInThisReservation: string[] = [...requiredFields];
    
    // Extração de propriedade
    const propertyRegex = [
      /propriedade[\s:]+([^\n\.]+)/i,
      /property[\s:]+([^\n\.]+)/i,
      /alojamento[\s:]+([^\n\.]+)/i,
      /imóvel[\s:]+([^\n\.]+)/i,
      /localização[\s:]+([^\n\.]+)/i,
      /localização ([^,\.\n]+)/i,
      /location[\s:]+([^\n\.]+)/i,
      /apartamento[\s:]+([^\n\.]+)/i,
      /apartment[\s:]+([^\n\.]+)/i,
      /morada[\s:]+([^\n\.]+)/i,
      /address[\s:]+([^\n\.]+)/i
    ];
    
    for (const regex of propertyRegex) {
      const match = text.match(regex);
      if (match) {
        reservation.propertyName = match[1].trim();
        const index = missingInThisReservation.indexOf('propertyName');
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    
    // Se não encontrou o nome da propriedade, tentar extrair qualquer linha que pareça endereço
    if (!reservation.propertyName) {
      const addressLines = text.split('\n').filter(line => 
        (line.includes('Rua') || line.includes('Av.') || line.includes('Avenida') || 
         line.includes('R.') || line.includes('Praça') || line.includes('Travessa') ||
         line.includes('Lisboa') || line.includes('Porto')) &&
        !line.toLowerCase().includes('email') && !line.toLowerCase().includes('telefone')
      );
      
      if (addressLines.length > 0) {
        reservation.propertyName = addressLines[0].trim();
        const index = missingInThisReservation.indexOf('propertyName');
        if (index !== -1) missingInThisReservation.splice(index, 1);
      }
    }
    
    // Extração de hóspede
    const guestRegex = [
      /hóspede[\s:]+([^\n\.]+)/i,
      /hospede[\s:]+([^\n\.]+)/i,
      /cliente[\s:]+([^\n\.]+)/i,
      /guest[\s:]+([^\n\.]+)/i,
      /nome do cliente[\s:]+([^\n\.]+)/i,
      /nome[\s:]+([^\n\.]+)/i,
      /name[\s:]+([^\n\.]+)/i,
      /guest name[\s:]+([^\n\.]+)/i,
      /nome:[\s]*([^\n\.]+)/i,
      /name:[\s]*([^\n\.]+)/i
    ];
    
    for (const regex of guestRegex) {
      const match = text.match(regex);
      if (match) {
        reservation.guestName = match[1].trim();
        const index = missingInThisReservation.indexOf('guestName');
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    
    // Extração de email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      reservation.guestEmail = emailMatch[0];
    }
    
    // Extração de telefone
    const phoneRegex = [
      /telefone[\s:]+([+\d\s()-]{7,})/i,
      /phone[\s:]+([+\d\s()-]{7,})/i,
      /tel[\s\.:]+([+\d\s()-]{7,})/i,
      /contacto[\s:]+([+\d\s()-]{7,})/i,
      /contact[\s:]+([+\d\s()-]{7,})/i,
      /telemovel[\s:]+([+\d\s()-]{7,})/i,
      /telemóvel[\s:]+([+\d\s()-]{7,})/i,
      /mobile[\s:]+([+\d\s()-]{7,})/i,
      /\+\d{2,3}[\s\d]{8,}/
    ];
    
    for (const regex of phoneRegex) {
      const match = text.match(regex);
      if (match) {
        reservation.guestPhone = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }
    
    // Extração de datas
    // Primeiro procurar por padrões com etiquetas
    const checkInRegex = [
      /check[ -]?in[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /entrada[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /arrival[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /chegada[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /data de entrada[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /data de check-in[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /begin[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /início[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /from[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /de[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i
    ];
    
    for (const regex of checkInRegex) {
      const match = text.match(regex);
      if (match) {
        reservation.checkInDate = normalizeDateString(match[1]);
        const index = missingInThisReservation.indexOf('checkInDate');
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    
    const checkOutRegex = [
      /check[ -]?out[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /saída[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /saida[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /departure[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /data de saída[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /data de check-out[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /end[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /fim[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /to[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /até[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /a[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i
    ];
    
    for (const regex of checkOutRegex) {
      const match = text.match(regex);
      if (match) {
        reservation.checkOutDate = normalizeDateString(match[1]);
        const index = missingInThisReservation.indexOf('checkOutDate');
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    
    // Se não encontrou datas específicas, procurar por padrões de data em geral
    if (!reservation.checkInDate || !reservation.checkOutDate) {
      // Encontrar todas as datas no documento
      const dateMatches = text.match(/\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}/g) || [];
      
      if (dateMatches.length >= 2) {
        // Assumir que as duas primeiras são check-in e check-out
        if (!reservation.checkInDate) {
          reservation.checkInDate = normalizeDateString(dateMatches[0]);
          const index = missingInThisReservation.indexOf('checkInDate');
          if (index !== -1) missingInThisReservation.splice(index, 1);
        }
        
        if (!reservation.checkOutDate) {
          reservation.checkOutDate = normalizeDateString(dateMatches[1]);
          const index = missingInThisReservation.indexOf('checkOutDate');
          if (index !== -1) missingInThisReservation.splice(index, 1);
        }
      }
    }
    
    // Extração de número de hóspedes
    const guestsRegex = [
      /(\d+)[\s]*(?:hóspedes|hospedes|guests|adultos|adults|pessoas|persons|pax|people)/i,
      /(?:hóspedes|hospedes|guests|adultos|adults|pessoas|persons|pax|people)[\s:]*(\d+)/i,
      /total de (?:hóspedes|hospedes|guests|adultos|adults|pessoas|persons|pax|people)[\s:]*(\d+)/i,
      /number of (?:guests|adults|people|persons)[\s:]*(\d+)/i,
      /número de (?:hóspedes|hospedes|adultos|pessoas|pessoas|pax)[\s:]*(\d+)/i,
      /ocupação[\s:]*(\d+)/i,
      /occupancy[\s:]*(\d+)/i,
      /máximo de pessoas[\s:]*(\d+)/i,
      /max (?:guests|people|persons)[\s:]*(\d+)/i
    ];
    
    for (const regex of guestsRegex) {
      const match = text.match(regex);
      if (match) {
        reservation.numGuests = parseInt(match[1]);
        const index = missingInThisReservation.indexOf('numGuests');
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    
    // Extração de valor total
    const amountRegex = [
      /total[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /valor total[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /total amount[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /valor[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /amount[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /price[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /preço[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /custo[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /cost[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /[€$£][\s]*[\d.,]+/
    ];
    
    for (const regex of amountRegex) {
      const match = text.match(regex);
      if (match) {
        // Limpar e normalizar o valor
        const rawAmount = match[1] || match[0];
        const cleanedAmount = rawAmount.replace(/[^0-9.,]/g, '');
        reservation.totalAmount = normalizeAmount(cleanedAmount);
        const index = missingInThisReservation.indexOf('totalAmount');
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    
    // Plataforma
    if (text.toLowerCase().includes('airbnb')) {
      reservation.platform = 'airbnb';
    } else if (text.toLowerCase().includes('booking.com') || text.toLowerCase().includes('booking')) {
      reservation.platform = 'booking';
    } else if (text.toLowerCase().includes('expedia')) {
      reservation.platform = 'expedia';
    } else if (text.toLowerCase().includes('direct') || text.toLowerCase().includes('direto')) {
      reservation.platform = 'direct';
    } else {
      reservation.platform = 'other';
    }
    
    // Status padrão
    reservation.status = 'confirmed';
    
    // Notas
    reservation.notes = `Extraído via OCR nativo (${new Date().toLocaleDateString()})`;
    
    // Se temos dados suficientes, adicionar a reserva
    if (missingInThisReservation.length <= 3) { // Permitir até 3 campos ausentes para maior flexibilidade
      reservations.push(reservation);
      
      // Adicionar os campos em falta à lista geral
      for (const field of missingInThisReservation) {
        if (!missing.includes(field)) {
          missing.push(field);
        }
      }
    } else {
      console.warn('⚠️ Dados insuficientes para criar uma reserva válida');
      console.warn(`⚠️ Campos em falta: ${missingInThisReservation.join(', ')}`);
      
      // Mesmo que estejam faltando muitos campos, ainda adicionar a reserva parcial
      // para permitir edição manual posterior
      if (reservation.propertyName || reservation.guestName) {
        reservations.push(reservation);
        missing.push(...missingInThisReservation);
      } else {
        missing.push(...requiredFields);
      }
    }
    
    console.log(`✅ Extraídas ${reservations.length} reservas do texto OCR`);
    if (missing.length > 0) {
      console.log(`⚠️ Campos obrigatórios ausentes: ${missing.join(', ')}`);
    }
    
    return {
      reservations,
      boxes,
      missing
    };
  } catch (error) {
    console.error('❌ Erro ao fazer parsing dos dados de reserva:', error);
    
    // Retornar um resultado vazio em caso de erro
    return {
      reservations: [],
      boxes: {},
      missing: ['error']
    };
  }
}

/**
 * Normaliza uma string de data para o formato YYYY-MM-DD
 * @param dateStr String de data em qualquer formato
 * @returns Data normalizada ou a string original se não for possível normalizar
 */
function normalizeDateString(dateStr: any): string {
  // Se não for string, converter para string
  if (typeof dateStr !== 'string') {
    dateStr = String(dateStr);
  }
  
  // Remover qualquer texto adicional, manter apenas a parte da data
  const cleanDateStr = dateStr.replace(/[^\d\/\.-]/g, '');
  
  // Padrões de data comuns
  // 1. DD/MM/YYYY or DD-MM-YYYY
  let match = cleanDateStr.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    let year = match[3];
    
    // Ajustar ano de 2 dígitos
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      year = century + parseInt(year);
    }
    
    return `${year}-${month}-${day}`;
  }
  
  // 2. MM/DD/YYYY (formato americano)
  match = cleanDateStr.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (match && parseInt(match[1]) <= 12) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = match[3];
    
    // Heurística: se o primeiro número for <= 12, assumir formato MM/DD/YYYY
    return `${year}-${month}-${day}`;
  }
  
  // 3. YYYY/MM/DD or YYYY-MM-DD (ISO)
  match = cleanDateStr.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  // Se chegou aqui, não conseguiu normalizar
  // Tentar criar uma data válida com Date
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // Formato ISO YYYY-MM-DD
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignorar erro
  }
  
  // Retornar a string original se não conseguir normalizar
  return dateStr;
}

/**
 * Normaliza um número
 * @param value Valor a ser normalizado
 * @returns Número ou valor original se não for possível normalizar
 */
function normalizeNumber(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remover caracteres não numéricos, exceto ponto e vírgula
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    
    // Converter para número
    try {
      // Substituir vírgula por ponto se for o separador decimal
      if (cleanedValue.includes(',') && !cleanedValue.includes('.')) {
        return parseFloat(cleanedValue.replace(',', '.'));
      }
      
      return parseFloat(cleanedValue);
    } catch (e) {
      // Ignorar erro
    }
  }
  
  // Se for indefinido ou não for possível converter, retornar um valor padrão
  return value !== undefined ? value : 0;
}

/**
 * Normaliza um valor monetário
 * @param value Valor a ser normalizado
 * @returns Valor monetário ou valor original se não for possível normalizar
 */
function normalizeAmount(value: any): number {
  if (value === undefined || value === null) {
    return 0;
  }
  
  // Se for número, retornar
  if (typeof value === 'number') {
    return value;
  }
  
  // Se for string, converter
  if (typeof value === 'string') {
    // Remover símbolos de moeda e outros caracteres não numéricos
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    
    // Converter para número
    try {
      // Substituir vírgula por ponto se for o separador decimal
      if (cleanedValue.includes(',') && !cleanedValue.includes('.')) {
        return parseFloat(cleanedValue.replace(',', '.'));
      }
      
      return parseFloat(cleanedValue);
    } catch (e) {
      // Ignorar erro
    }
  }
  
  // Se não for possível converter, retornar 0
  return 0;
}

export default parseReservationData;
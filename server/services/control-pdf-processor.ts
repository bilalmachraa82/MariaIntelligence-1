/**
 * Processador especializado para arquivos de controle de reservas
 * Processa documentos com formato de tabela específico "Controlo_PropertyName.pdf"
 */

import { parse, format, isValid } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ControlReservation {
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestName: string;
  numGuests: number;
  country: string;
  platform: string;
  info: string;
  propertyName: string;
}

/**
 * Processa texto de um PDF de controle para extrair múltiplas reservas
 * @param text Texto extraído do PDF
 * @param filename Nome do arquivo para determinar a propriedade
 * @returns Array de reservas
 */
export function processControlPdf(text: string, filename: string): ControlReservation[] {
  console.log("⚙️ Processando PDF de controle:", filename);
  
  // Extrair nome da propriedade do nome do arquivo
  const propertyNameMatch = filename.match(/Controlo_(.+?)(?:\s*-\s*Copy)?\.pdf$/i);
  const propertyName = propertyNameMatch ? propertyNameMatch[1].trim() : "Desconhecida";
  
  console.log(`📄 Propriedade identificada: ${propertyName}`);
  
  // Quebrar o texto em linhas e remover linhas vazias
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Encontrar linhas com datas (formato DD/MM/YYYY)
  const dateRegex = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s+(\S+)\s+(\d+)\s+(\S+)\s+(\S+)/;
  
  const reservations: ControlReservation[] = [];
  let currentReservation: Partial<ControlReservation> | null = null;
  
  // Para cada linha com padrão de data, extrair informações
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(dateRegex);
    
    if (match) {
      // Criar nova reserva
      currentReservation = {
        checkInDate: formatDateToISO(match[1]),
        checkOutDate: formatDateToISO(match[2]),
        nights: parseInt(match[3]),
        guestName: match[4].trim(),
        numGuests: parseInt(match[5]),
        country: match[6].trim(),
        platform: match[7].trim(),
        info: "",
        propertyName
      };
      
      // Verificar se a próxima linha contém informações adicionais
      if (i + 1 < lines.length && !lines[i + 1].match(dateRegex)) {
        currentReservation.info = lines[i + 1].trim();
      }
      
      // Adicionar à lista apenas se as datas forem válidas
      if (currentReservation.checkInDate && currentReservation.checkOutDate) {
        reservations.push(currentReservation as ControlReservation);
      }
    }
  }
  
  console.log(`🔍 Encontradas ${reservations.length} reservas no documento`);
  return reservations;
}

/**
 * Converte data no formato DD/MM/YYYY para YYYY-MM-DD
 */
function formatDateToISO(dateStr: string): string {
  try {
    // Parse a data no formato DD/MM/YYYY
    const date = parse(dateStr, 'dd/MM/yyyy', new Date());
    
    // Verificar se é uma data válida
    if (!isValid(date)) {
      console.error(`❌ Data inválida: ${dateStr}`);
      return "";
    }
    
    // Formatar como YYYY-MM-DD
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error(`❌ Erro ao converter data ${dateStr}:`, error);
    return "";
  }
}

/**
 * Detecta se um PDF é um arquivo de controle de reservas pelo seu conteúdo
 * @param text Texto extraído do PDF
 * @returns Booleano indicando se é um arquivo de controle
 */
export function isControlPdf(text: string): boolean {
  // Verificar padrões específicos deste tipo de documento
  const hasExcitingLisbon = text.includes("EXCITING LISBON");
  const hasDateColumnHeaders = text.includes("Data entrada") && text.includes("Data saída");
  const hasGuestColumns = text.includes("N.º hóspedes") && text.includes("País") && text.includes("Site");
  
  return hasExcitingLisbon && hasDateColumnHeaders && hasGuestColumns;
}
/**
 * Script para testar a validação de reservas durante o processamento de arquivos de controle
 * Implementa validação detalhada e verificação de duplicatas
 */

import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Em módulos ESM, precisamos usar import.meta.url em vez de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Definição simplificada de propriedade
class Property {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.cleaningCost = "50";
    this.checkInFee = "20";
    this.commission = "10";
    this.teamPayment = "30";
    this.cleaningTeam = "Cleaning Team";
    this.active = true;
    this.cleaningTeamId = 1;
    this.ownerId = 1;
    this.monthlyFixedCost = "100";
  }
}

// Mock das propriedades para teste
const mockProperties = [
  new Property(1, "Aroeira I"),
  new Property(2, "Aroeira II"),
  new Property(3, "Aroeira III"),
  new Property(4, "Cascais"),
  new Property(5, "Lisbon Center")
];

// Banco de dados simulado de reservas existentes
const existingReservations = [
  {
    id: 1,
    propertyId: 1,
    guestName: "Maria Santos",
    checkInDate: "2025-06-01",
    checkOutDate: "2025-06-07",
    numGuests: 2,
    totalAmount: 420.50,
    platform: "Airbnb",
    notes: "Repeat guest",
    status: "confirmed"
  },
  {
    id: 2,
    propertyId: 2,
    guestName: "João Silva",
    checkInDate: "2025-06-10",
    checkOutDate: "2025-06-15",
    numGuests: 3,
    totalAmount: 550.00,
    platform: "Booking.com",
    notes: "",
    status: "confirmed"
  },
  {
    id: 3,
    propertyId: 1,
    guestName: "Laura Pereira",
    checkInDate: "2025-07-01",
    checkOutDate: "2025-07-10",
    numGuests: 4,
    totalAmount: 910.00,
    platform: "Direct",
    notes: "Bringing a pet (small dog)",
    status: "confirmed"
  }
];

/**
 * Processa um arquivo de controle e valida as reservas encontradas
 * @param {string} filePath - Caminho do arquivo a processar
 * @returns {Promise<Object>} - Resultado do processamento com detalhes de validação
 */
async function processControlFileWithValidation(filePath) {
  try {
    console.log(`\n📄 Analisando arquivo: ${path.basename(filePath)}`);
    
    // Carregar o arquivo PDF
    const dataBuffer = fs.readFileSync(filePath);
    
    // Extrair o texto do PDF usando pdf-parse
    const pdfData = await pdf(dataBuffer);
    const rawText = pdfData.text;
    
    // Verificar se o texto contém padrões que indicam ser um arquivo de controle
    const normalizedText = rawText.toLowerCase();
    console.log(`Texto extraído (primeiros 200 caracteres): ${rawText.substring(0, 200)}`);
    
    const isControlFile = 
      (normalizedText.includes('controlo_aroeira') || 
       normalizedText.includes('controlo aroeira') ||
       normalizedText.includes('exciting lisbon aroeira') ||
       normalizedText.includes('aroeira i') ||
       normalizedText.includes('aroeira ii') ||
       normalizedText.includes('controlo_') ||
       normalizedText.includes('mapa de reservas') ||
       (normalizedText.includes('data entrada') && normalizedText.includes('data saída')) ||
       (normalizedText.includes('check-in') && normalizedText.includes('check-out')) ||
       (normalizedText.includes('hóspedes') && normalizedText.includes('noites')));
    
    if (!isControlFile) {
      console.log('❌ Arquivo não identificado como controle de reservas');
      return {
        success: false,
        isControlFile: false,
        propertyName: '',
        reservations: [],
        validationResults: [],
        rawText
      };
    }
    
    console.log('✅ Arquivo identificado como controle de reservas!');
    
    // Extrair nome da propriedade (geralmente presente no título do documento)
    let propertyName = '';
    
    // Padrões comuns para identificar o nome da propriedade
    const propertyNamePatterns = [
      // Padrões para Aroeira
      /EXCITING LISBON ([A-Za-z\s]+\s*[IVX]*)/i,
      /EXCITING\s+LISBON\s+([A-Za-z\s]+\s*[IVX]*)/i,
      /Controlo_([A-Za-z\s]+\s*[IVX]*)/i,
      /Controlo\s+([A-Za-z\s]+\s*[IVX]*)/i,
      /Aroeira\s+(I|II|III)/i,
      /AROEIRA\s+(I|II|III)/i,
      // Capturar apenas "Aroeira" se não estiver qualificado
      /\b(Aroeira)\b/i,
      /\b(AROEIRA)\b/i,
      // Outros formatos comuns
      /Mapa de Reservas\s+-\s+([A-Za-z\s]+\s*[IVX]*)/i,
      /Mapa de Ocupação\s+-\s+([A-Za-z\s]+\s*[IVX]*)/i,
      // Tentativa de capturar qualquer nome após "Lisbon"
      /Lisbon\s+([A-Za-z\s]+\s*[IVX]*)/i
    ];
    
    // Procurar padrões em ordem de prioridade
    for (const pattern of propertyNamePatterns) {
      const match = rawText.match(pattern);
      if (match && match[1]) {
        propertyName = match[1].trim();
        // Se encontrarmos, interrompemos o loop
        break;
      }
    }
    
    // Tratar caso especial de Aroeira
    if (propertyName.toLowerCase() === 'aroeira') {
      // Procurar por "Aroeira I", "Aroeira II", etc. no texto completo
      const aroeiraSuffixMatch = rawText.match(/Aroeira\s+(I|II|III)/i) || 
                               rawText.match(/AROEIRA\s+(I|II|III)/i);
      
      if (aroeiraSuffixMatch && aroeiraSuffixMatch[1]) {
        propertyName = `Aroeira ${aroeiraSuffixMatch[1]}`;
      }
    }
    
    // Se ainda não encontramos nada, usar método alternativo
    if (!propertyName) {
      // Procurar por qualquer nome que pareça ser um título no início do documento
      const firstLine = rawText.split('\n')[0].trim();
      if (firstLine && firstLine.length > 0 && firstLine.length < 50) {
        propertyName = firstLine;
      } else {
        propertyName = 'Propriedade Desconhecida';
      }
    }
    
    console.log(`🏠 Propriedade identificada: ${propertyName}`);
    
    // Tentar encontrar a propriedade correspondente
    let propertyId = null;
    let bestMatch = { property: null, score: 0 };
    
    // Normalizar o nome da propriedade extraído
    const normalizedPropertyName = propertyName.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9\s]/g, "") // Manter apenas letras, números e espaços
      .trim();
    
    console.log(`   Nome normalizado para busca: "${normalizedPropertyName}"`);
    
    // Processar casos especiais
    const isAroeira = normalizedPropertyName.includes('aroeira');
    const aroeiraSuffix = isAroeira ? 
      normalizedPropertyName.match(/aroeira\s*(i|ii|iii|iv|1|2|3|4)/i)?.[1] : null;
    
    // Loop por todas as propriedades para encontrar a melhor correspondência
    for (const property of mockProperties) {
      // Normalizar o nome da propriedade
      const normalizedName = property.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
      
      let score = 0;
      
      // Casos especiais para Aroeira
      if (isAroeira && normalizedName.includes('aroeira')) {
        // Correspondência perfeita para Aroeira com o número romano correto
        if (aroeiraSuffix && normalizedName.includes(`aroeira ${aroeiraSuffix}`)) {
          score = 100;
        } 
        // Correspondência para Aroeira I quando temos apenas "aroeira" no documento
        else if (!aroeiraSuffix && normalizedName.includes('aroeira i')) {
          score = 80;
        }
        // Correspondência parcial para qualquer Aroeira
        else {
          score = 60;
        }
      }
      // Correspondência exata
      else if (normalizedName === normalizedPropertyName) {
        score = 100;
      }
      // Uma string contém a outra completamente
      else if (normalizedName.includes(normalizedPropertyName) || 
               normalizedPropertyName.includes(normalizedName)) {
        // Calculamos o score baseado no tamanho relativo das strings
        const lengthRatio = Math.min(normalizedName.length, normalizedPropertyName.length) / 
                           Math.max(normalizedName.length, normalizedPropertyName.length);
        score = 70 * lengthRatio;
      }
      // Correspondência parcial (palavras em comum)
      else {
        const nameWords = normalizedName.split(/\s+/);
        const propertyWords = normalizedPropertyName.split(/\s+/);
        
        // Contar palavras em comum
        const commonWords = nameWords.filter(word => 
          propertyWords.some(propWord => propWord === word));
        
        if (commonWords.length > 0) {
          // Pontuação baseada no número de palavras em comum
          score = 40 * (commonWords.length / Math.max(nameWords.length, propertyWords.length));
        }
      }
      
      // Atualizar a melhor correspondência
      if (score > bestMatch.score) {
        bestMatch = { property, score };
      }
    }
    
    // Definir a propriedade se tivermos uma correspondência razoável (score > 40)
    if (bestMatch.score > 40 && bestMatch.property) {
      propertyId = bestMatch.property.id;
      console.log(`🔍 Propriedade correspondente encontrada: ${bestMatch.property.name} (ID: ${propertyId}) com pontuação ${bestMatch.score.toFixed(2)}`);
    } else {
      // Caso especial: se é Aroeira sem correspondência, mas temos propriedades Aroeira no sistema
      if (isAroeira) {
        // Procurar qualquer propriedade Aroeira
        const anyAroeira = mockProperties.find(p => 
          p.name.toLowerCase().includes('aroeira'));
          
        if (anyAroeira) {
          propertyId = anyAroeira.id;
          console.log(`⚠️ Usando propriedade Aroeira genérica: ${anyAroeira.name} (ID: ${propertyId})`);
        }
      }
    }
    
    if (!propertyId) {
      console.warn(`❌ Não foi possível encontrar uma propriedade correspondente para "${propertyName}"`);
      // Para teste, usamos uma propriedade padrão
      propertyId = 1;
    }
    
    // Extrair reservas do texto
    console.log('\n📋 Extraindo reservas do documento...');
    const reservations = extractReservationsFromText(rawText, propertyId);
    console.log(`✅ Encontradas ${reservations.length} possíveis reservas!`);
    
    // Validar cada reserva (verificar dados e duplicatas)
    console.log('\n🔍 Validando reservas encontradas:');
    const validationResults = validateReservations(reservations);
    
    // Resumo das validações
    console.log('\n📊 Resumo da validação:');
    const valid = validationResults.filter(r => r.isValid && !r.isDuplicate);
    const duplicates = validationResults.filter(r => r.isDuplicate);
    const invalid = validationResults.filter(r => !r.isValid && !r.isDuplicate);
    
    console.log(`   Reservas válidas para adicionar: ${valid.length}`);
    console.log(`   Reservas duplicadas (já existem): ${duplicates.length}`);
    console.log(`   Reservas inválidas (dados incorretos): ${invalid.length}`);
    
    if (valid.length > 0) {
      console.log('\n✅ Reservas aprovadas para adição:');
      valid.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.reservation.guestName} - ${formatDateForDisplay(result.reservation.checkInDate)} a ${formatDateForDisplay(result.reservation.checkOutDate)}`);
      });
    }
    
    if (duplicates.length > 0) {
      console.log('\n⚠️ Reservas duplicadas (já existem no sistema):');
      duplicates.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.reservation.guestName} - ${formatDateForDisplay(result.reservation.checkInDate)} a ${formatDateForDisplay(result.reservation.checkOutDate)}`);
        console.log(`      ID da reserva existente: ${result.existingReservation.id}`);
        console.log(`      Valor existente: ${result.existingReservation.totalAmount}€`);
      });
    }
    
    if (invalid.length > 0) {
      console.log('\n❌ Reservas inválidas (com problemas):');
      invalid.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.reservation.guestName || 'Nome não definido'}`);
        console.log(`      Problemas: ${result.validationErrors.join(', ')}`);
      });
    }
    
    return {
      success: true,
      isControlFile: true,
      propertyName,
      propertyId,
      reservations,
      validationResults,
      rawText,
      summary: {
        valid: valid.length,
        duplicates: duplicates.length,
        invalid: invalid.length,
        total: reservations.length
      }
    };
  } catch (error) {
    console.error('Erro ao processar arquivo de controle:', error);
    return {
      success: false,
      isControlFile: false,
      propertyName: '',
      reservations: [],
      validationResults: [],
      rawText: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Extrai reservas do texto de um arquivo de controle
 * @param {string} text - Texto extraído do arquivo
 * @param {number} propertyId - ID da propriedade
 * @returns {Array} - Array de objetos de reserva
 */
function extractReservationsFromText(text, propertyId) {
  // Esta é uma versão simplificada para teste
  // Na implementação real, usaríamos a análise com Gemini ou específica para o formato do documento
  
  // Vamos procurar por padrões comuns em arquivos de controle
  const reservations = [];
  
  // Padrões para check-in/check-out (datas)
  const datePatterns = [
    // Padrão DD/MM/YYYY ou DD-MM-YYYY
    /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/g
  ];
  
  // Padrão para hóspedes
  const guestPatterns = [
    /([A-Za-zÀ-ÖØ-öø-ÿ\s]{2,40})(?:\s+\d|\s+\-)/gi  // Nome seguido de número ou traço
  ];
  
  // Padrão para número de hóspedes
  const numGuestsPatterns = [
    /(\d{1,2})\s+(?:hóspedes|hospedes|guests|pessoas|pax|people)/i
  ];
  
  // Extrair todas as datas
  const dates = [];
  let match;
  for (const pattern of datePatterns) {
    while ((match = pattern.exec(text)) !== null) {
      let [, day, month, year] = match;
      if (year.length === 2) year = `20${year}`;
      dates.push({
        date: `${day}/${month}/${year}`,
        index: match.index
      });
    }
  }
  
  // Extrair nomes de hóspedes
  const guests = [];
  for (const pattern of guestPatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      // Filtrar nomes inválidos (muito curtos ou contendo palavras-chave específicas)
      if (name.length > 3 && 
          !name.toLowerCase().includes('data') && 
          !name.toLowerCase().includes('check') &&
          !name.toLowerCase().includes('entrada') && 
          !name.toLowerCase().includes('saída')) {
        guests.push({
          name,
          index: match.index
        });
      }
    }
  }
  
  // Extrair número de hóspedes (global)
  const numGuestsMatches = [];
  for (const pattern of numGuestsPatterns) {
    while ((match = pattern.exec(text)) !== null) {
      numGuestsMatches.push({
        numGuests: parseInt(match[1]),
        index: match.index
      });
    }
  }
  
  // Agrupar em pares de check-in e check-out
  // Assumindo que as datas vêm sequencialmente (check-in, check-out)
  for (let i = 0; i < dates.length - 1; i += 2) {
    if (i + 1 < dates.length) {
      // Encontrar o hóspede mais próximo antes do check-in
      let guestName = 'Hóspede não identificado';
      let minDistance = 10000;
      
      for (const guest of guests) {
        const distance = Math.abs(guest.index - dates[i].index);
        if (distance < minDistance && guest.index < dates[i].index) {
          minDistance = distance;
          guestName = guest.name;
        }
      }
      
      // Encontrar número de hóspedes mais próximo
      let numGuests = 2;  // Valor padrão
      minDistance = 10000;
      
      for (const numGuestsMatch of numGuestsMatches) {
        const distance = Math.abs(numGuestsMatch.index - dates[i].index);
        if (distance < minDistance) {
          minDistance = distance;
          numGuests = numGuestsMatch.numGuests;
        }
      }
      
      // Gerar um valor total aleatório (para simulação)
      const totalAmount = (Math.floor(Math.random() * 10000) / 100 + 50).toFixed(2);
      
      // Plataformas comuns
      const platforms = ['Airbnb', 'Booking.com', 'VRBO', 'Direct'];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      
      // Formatar as datas
      const checkInDate = formatDate(dates[i].date);
      const checkOutDate = formatDate(dates[i+1].date);
      
      // Adicionar a reserva se as datas parecem válidas
      if (checkInDate && checkOutDate && new Date(checkInDate) <= new Date(checkOutDate)) {
        reservations.push({
          propertyId,
          guestName,
          checkInDate,
          checkOutDate,
          numGuests,
          totalAmount,
          platform,
          notes: ''
        });
      }
    }
  }
  
  return reservations;
}

/**
 * Valida as reservas e verifica duplicatas
 * @param {Array} reservations - Reservas extraídas do documento
 * @returns {Array} - Resultados da validação para cada reserva
 */
function validateReservations(reservations) {
  const results = [];
  
  for (const reservation of reservations) {
    const validationResult = {
      reservation,
      isValid: true,
      isDuplicate: false,
      existingReservation: null,
      validationErrors: []
    };
    
    // 1. Validar presença e formato dos campos obrigatórios
    if (!reservation.guestName || reservation.guestName.length < 3) {
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
        
        // Verificar se a estadia é muito longa (mais de 30 dias)
        const dias = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        if (dias > 30) {
          validationResult.validationErrors.push(`Estadia muito longa (${dias} dias)`);
        }
      }
    }
    
    // Validar número de hóspedes
    if (!reservation.numGuests || isNaN(reservation.numGuests) || reservation.numGuests <= 0 || reservation.numGuests > 20) {
      validationResult.isValid = false;
      validationResult.validationErrors.push('Número de hóspedes inválido');
    }
    
    // Validar valor total
    if (!reservation.totalAmount || isNaN(parseFloat(reservation.totalAmount)) || parseFloat(reservation.totalAmount) <= 0) {
      validationResult.isValid = false;
      validationResult.validationErrors.push('Valor total inválido');
    }
    
    // 2. Verificar duplicatas
    const duplicate = findDuplicateReservation(reservation);
    if (duplicate) {
      validationResult.isDuplicate = true;
      validationResult.existingReservation = duplicate;
    }
    
    results.push(validationResult);
  }
  
  return results;
}

/**
 * Verifica se uma reserva já existe no sistema
 * @param {Object} reservation - Reserva a verificar
 * @returns {Object|null} - Reserva existente ou null
 */
function findDuplicateReservation(reservation) {
  // Critérios para considerar uma reserva como duplicata:
  // 1. Mesma propriedade
  // 2. Datas sobrepostas (pelo menos parcialmente)
  // 3. OPCIONAL: Mesmo nome de hóspede (muitas vezes pode variar na digitação)
  
  for (const existing of existingReservations) {
    // Verificar se é a mesma propriedade
    if (existing.propertyId !== reservation.propertyId) {
      continue;
    }
    
    // Verificar sobreposição de datas
    const existingCheckIn = new Date(existing.checkInDate);
    const existingCheckOut = new Date(existing.checkOutDate);
    const newCheckIn = new Date(reservation.checkInDate);
    const newCheckOut = new Date(reservation.checkOutDate);
    
    // Há sobreposição se:
    // (check-in1 <= check-out2) E (check-out1 >= check-in2)
    const hasOverlap = existingCheckIn <= newCheckOut && existingCheckOut >= newCheckIn;
    
    if (hasOverlap) {
      // Verificar se é o mesmo hóspede (opcional, considere comentar esta parte)
      const normalizedExistingName = existing.guestName.toLowerCase().trim();
      const normalizedNewName = reservation.guestName.toLowerCase().trim();
      
      // Se os nomes são muito parecidos (ou se não estamos validando nomes)
      if (normalizedExistingName.includes(normalizedNewName) || 
          normalizedNewName.includes(normalizedExistingName) ||
          // Ou se queremos considerar apenas sobreposição de datas:
          true) {
        return existing;
      }
    }
  }
  
  return null;
}

/**
 * Formata uma data para o formato YYYY-MM-DD
 * @param {string} dateStr - String de data
 * @returns {string} - Data formatada
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  
  // Limpar a string de data
  const cleanDateStr = dateStr.trim().replace(/\s+/g, '');
  
  // Padrões comuns de data
  const ddmmyyyyPattern = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;
  const yyyymmddPattern = /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/;
  
  let day, month, year;
  
  // Detectar o formato da data
  if (ddmmyyyyPattern.test(cleanDateStr)) {
    // Formato DD/MM/YYYY
    const match = cleanDateStr.match(ddmmyyyyPattern);
    if (!match) return '';
    
    [, day, month, year] = match;
    
    // Adicionar 2000 para anos de dois dígitos
    if (year.length === 2) {
      year = '20' + year;
    }
  } else if (yyyymmddPattern.test(cleanDateStr)) {
    // Formato YYYY/MM/DD
    const match = cleanDateStr.match(yyyymmddPattern);
    if (!match) return '';
    
    [, year, month, day] = match;
  } else {
    // Dividir por separadores comuns
    const parts = cleanDateStr.includes('/') 
      ? cleanDateStr.split('/') 
      : cleanDateStr.includes('-')
        ? cleanDateStr.split('-')
        : cleanDateStr.includes('.')
          ? cleanDateStr.split('.')
          : [];
    
    if (parts.length !== 3) return '';
    
    // Assumir formato DD/MM/YYYY
    [day, month, year] = parts;
    
    // Se o ano é de dois dígitos, adicionar 2000
    if (year.length === 2) {
      year = '20' + year;
    }
  }
  
  // Validar componentes da data
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  // Validações básicas
  if (
    isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) ||
    dayNum < 1 || dayNum > 31 ||
    monthNum < 1 || monthNum > 12 ||
    yearNum < 2000 || yearNum > 2100
  ) {
    console.warn(`Data inválida: ${dateStr}`);
    return '';
  }
  
  // Formatar no padrão YYYY-MM-DD
  return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
}

/**
 * Formata uma data para exibição no formato DD/MM/YYYY
 * @param {string} dateStr - Data no formato YYYY-MM-DD
 * @returns {string} - Data formatada para exibição
 */
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Função principal para testar o processador de arquivos de controle
 */
async function testControlFileProcessor() {
  console.log('🚀 Testando processador de arquivos de controle com validação detalhada...');
  
  // Arquivo de teste
  const filePath = path.join(__dirname, 'attached_assets', 'Controlo_Aroeira I.pdf');
  
  try {
    console.log(`\n📄 Processando arquivo: ${path.basename(filePath)}`);
    const result = await processControlFileWithValidation(filePath);
    
    if (result.success) {
      console.log('\n📊 RESUMO FINAL:');
      console.log(`Arquivo de controle: ${result.isControlFile ? 'Sim' : 'Não'}`);
      console.log(`Propriedade identificada: ${result.propertyName}`);
      console.log(`Propriedade ID: ${result.propertyId}`);
      console.log(`Reservas encontradas: ${result.reservations.length}`);
      console.log(`Reservas válidas para adicionar: ${result.summary.valid}`);
      console.log(`Reservas duplicadas (já existem): ${result.summary.duplicates}`);
      console.log(`Reservas inválidas: ${result.summary.invalid}`);
      
      // Mostrar instruções para o usuário
      console.log('\n👨‍💼 Ações recomendadas:');
      if (result.summary.valid > 0) {
        console.log(`✅ Adicionar ${result.summary.valid} novas reservas`);
      }
      
      if (result.summary.duplicates > 0) {
        console.log(`⚠️ Verificar ${result.summary.duplicates} reservas duplicadas`);
      }
      
      if (result.summary.invalid > 0) {
        console.log(`❌ Resolver problemas em ${result.summary.invalid} reservas inválidas`);
      }
    } else {
      console.error('❌ Erro no processamento:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro ao executar teste:', error);
  }
}

// Executar o teste
testControlFileProcessor();
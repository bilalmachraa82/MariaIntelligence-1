/**
 * Script para testar o processamento de arquivos de controle (versão melhorada)
 * Processa arquivos de controle como "Controlo_Aroeira I.pdf" e extrai múltiplas reservas
 */

// Importações diretas para evitar problemas com tipos de módulos
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { AIAdapter } from './server/services/ai-adapter.service.ts';
import { ragService } from './server/services/rag-enhanced.service.ts';

/**
 * Versão simplificada do processador de arquivos de controle para testes
 * 
 * @param {string} filePath Caminho do arquivo
 * @returns {Promise<object>} Resultado do processamento
 */
async function processControlFile(filePath) {
  try {
    console.log(`Verificando se ${filePath} é um arquivo de controle`);
    
    // Carregar o arquivo PDF
    const dataBuffer = fs.readFileSync(filePath);
    
    // Extrair o texto do PDF usando pdf-parse
    const pdfData = await pdf(dataBuffer);
    const rawText = pdfData.text;
    
    console.log(`[TEST] Texto extraído (primeiros 200 caracteres): ${rawText.substring(0, 200)}`);
    
    // Verificar se o texto contém padrões que indicam ser um arquivo de controle
    const normalizedText = rawText.toLowerCase();
    
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
      console.log('[TEST] Arquivo não identificado como controle de reservas');
      return {
        success: true,
        isControlFile: false,
        propertyName: '',
        reservations: [],
        rawText
      };
    }
    
    console.log('[TEST] Arquivo identificado como controle de reservas!');
    
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
      /\b(Aroeira)\b/i,
      /\b(AROEIRA)\b/i,
      /Mapa de Reservas\s+-\s+([A-Za-z\s]+\s*[IVX]*)/i,
      /Mapa de Ocupação\s+-\s+([A-Za-z\s]+\s*[IVX]*)/i,
      /Lisbon\s+([A-Za-z\s]+\s*[IVX]*)/i
    ];
    
    // Procurar padrões em ordem de prioridade
    for (const pattern of propertyNamePatterns) {
      const match = rawText.match(pattern);
      if (match && match[1]) {
        propertyName = match[1].trim();
        break;
      }
    }
    
    // Tratar caso especial de Aroeira
    if (propertyName.toLowerCase() === 'aroeira') {
      const aroeiraSuffixMatch = rawText.match(/Aroeira\s+(I|II|III)/i) || 
                                 rawText.match(/AROEIRA\s+(I|II|III)/i);
      
      if (aroeiraSuffixMatch && aroeiraSuffixMatch[1]) {
        propertyName = `Aroeira ${aroeiraSuffixMatch[1]}`;
      }
    }
    
    // Se ainda não encontramos nada, usar método alternativo
    if (!propertyName) {
      const firstLine = rawText.split('\n')[0].trim();
      if (firstLine && firstLine.length > 0 && firstLine.length < 50) {
        propertyName = firstLine;
      } else {
        propertyName = 'Propriedade Desconhecida';
      }
    }
    
    console.log(`[TEST] Propriedade identificada: ${propertyName}`);
    
    // Usar o adaptador de IA para extrair as reservas do texto
    const aiAdapter = AIAdapter.getInstance();
    
    // Definir um sistema de prompt para extração de múltiplas reservas
    const systemPrompt = "Extraia todas as reservas do seguinte documento de controle. " +
      "Cada reserva deve ter os seguintes campos: " +
      "- Nome do cliente (guestName) " +
      "- Data de check-in (checkInDate) no formato DD/MM/YYYY " +
      "- Data de check-out (checkOutDate) no formato DD/MM/YYYY " +
      "- Número de hóspedes (numGuests) " +
      "- Valor total (totalAmount) " +
      "- Plataforma de reserva (platform), como Airbnb, Booking, etc. " +
      "- Notas adicionais (notes), se houver " +
      "IMPORTANTE: Retorne APENAS um array JSON com as reservas extraídas. " +
      "NÃO use marcadores de código markdown. " +
      "NÃO inclua explicações ou textos adicionais. " +
      "Retorne APENAS o JSON puro.";
    
    try {
      // Extrair as reservas usando o adaptador de IA
      console.log('[TEST] Enviando solicitação para o modelo de IA para extrair reservas...');
      
      const extractionResult = await aiAdapter.extractDataFromText(
        rawText,
        {
          systemPrompt,
          responseFormat: { type: 'json' },
          temperature: 0.1,
          maxTokens: 4096,
          documentType: 'control_file'
        }
      );
      
      let reservations = [];
      
      try {
        // Tentar processar a resposta JSON
        let jsonText = extractionResult;
        
        // Verificar se o texto está em formato markdown com backticks
        if (typeof extractionResult === 'string') {
          // Remover marcadores de código markdown (```json e ```)
          const markdownRegex = /```(?:json)?\s*([\s\S]*?)```/;
          const jsonMatch = extractionResult.match(markdownRegex);
          if (jsonMatch && jsonMatch[1]) {
            console.log('[TEST] Extraindo JSON de resposta markdown');
            jsonText = jsonMatch[1];
          }
        }
        
        console.log('[TEST] Convertendo resposta JSON');
        const parsedResponse = typeof jsonText === 'string' 
          ? JSON.parse(jsonText) 
          : jsonText;
        
        // Verificar se temos um array de reservas ou um objeto com a propriedade reservations
        if (Array.isArray(parsedResponse)) {
          reservations = parsedResponse;
        } else if (parsedResponse && Array.isArray(parsedResponse.reservations)) {
          reservations = parsedResponse.reservations;
        }
        
        console.log(`[TEST] Extraídas ${reservations.length} reservas do documento`);
        
        return {
          success: true,
          isControlFile: true,
          propertyName,
          reservations,
          rawText
        };
      } catch (error) {
        console.error('[TEST] Erro ao processar resultado JSON:', error);
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
      console.error('[TEST] Erro ao extrair reservas:', error);
      return {
        success: false,
        isControlFile: true,
        propertyName,
        reservations: [],
        rawText,
        error: 'Erro ao extrair reservas do arquivo'
      };
    }
  } catch (error) {
    console.error('[TEST] Erro ao processar arquivo de controle:', error);
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

async function testControlFileProcessor() {
  console.log('Testando processador de arquivos de controle...');
  
  // Arquivo de teste (caminho relativo ao diretório raiz)
  const filePath = './attached_assets/Controlo_Aroeira I.pdf';
  
  try {
    console.log(`Processando arquivo: ${filePath}`);
    const result = await processControlFile(filePath);
    
    if (result.success) {
      console.log('Processamento concluído com sucesso!');
      console.log(`Arquivo de controle: ${result.isControlFile ? 'Sim' : 'Não'}`);
      console.log(`Propriedade identificada: ${result.propertyName}`);
      console.log(`Reservas encontradas: ${result.reservations.length}`);
      
      if (result.reservations.length > 0) {
        console.log('\nPrimeiras reservas encontradas:');
        result.reservations.slice(0, 3).forEach((reservation, index) => {
          console.log(`\nReserva #${index + 1}:`);
          console.log(`- Hóspede: ${reservation.guestName}`);
          console.log(`- Check-in: ${reservation.checkInDate}`);
          console.log(`- Check-out: ${reservation.checkOutDate}`);
          console.log(`- Hóspedes: ${reservation.numGuests}`);
          console.log(`- Valor: ${reservation.totalAmount}`);
          console.log(`- Plataforma: ${reservation.platform}`);
          if (reservation.notes) {
            console.log(`- Notas: ${reservation.notes}`);
          }
        });
        
        // Validar a qualidade das reservas extraídas
        validateReservations(result.reservations);
      }
    } else {
      console.error('Erro no processamento:', result.error);
    }
  } catch (error) {
    console.error('Erro ao executar teste:', error);
  }
}

/**
 * Valida a qualidade das reservas extraídas
 * 
 * @param {Array} reservations Lista de reservas a validar
 */
function validateReservations(reservations) {
  console.log('\nValidando qualidade das reservas extraídas:');
  
  // Estatísticas de qualidade
  let stats = {
    total: reservations.length,
    validGuests: 0,
    validDates: 0,
    validCheckIn: 0,
    validCheckOut: 0,
    validNumGuests: 0,
    validTotalAmount: 0,
    validPlatform: 0
  };
  
  // Verificar cada reserva
  for (const reservation of reservations) {
    // Nome do hóspede (não vazio)
    if (reservation.guestName && reservation.guestName.trim().length > 0) {
      stats.validGuests++;
    }
    
    // Check-in (formato DD/MM/YYYY ou YYYY-MM-DD)
    if (reservation.checkInDate && 
        (reservation.checkInDate.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/) || 
         reservation.checkInDate.match(/^\d{4}-\d{1,2}-\d{1,2}$/))) {
      stats.validCheckIn++;
    }
    
    // Check-out (formato DD/MM/YYYY ou YYYY-MM-DD)
    if (reservation.checkOutDate && 
        (reservation.checkOutDate.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/) || 
         reservation.checkOutDate.match(/^\d{4}-\d{1,2}-\d{1,2}$/))) {
      stats.validCheckOut++;
    }
    
    // Datas em ordem correta
    if (stats.validCheckIn && stats.validCheckOut) {
      const checkIn = new Date(reservation.checkInDate);
      const checkOut = new Date(reservation.checkOutDate);
      if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime()) && checkIn <= checkOut) {
        stats.validDates++;
      }
    }
    
    // Número de hóspedes (número positivo)
    const numGuests = parseInt(reservation.numGuests);
    if (!isNaN(numGuests) && numGuests > 0) {
      stats.validNumGuests++;
    }
    
    // Valor total (convertível em número)
    let amount = typeof reservation.totalAmount === 'string' 
      ? reservation.totalAmount.replace(/[^0-9.,]/g, '').replace(',', '.') 
      : reservation.totalAmount;
    
    if (!isNaN(parseFloat(amount)) && parseFloat(amount) >= 0) {
      stats.validTotalAmount++;
    }
    
    // Plataforma (não vazia)
    if (reservation.platform && reservation.platform.trim().length > 0) {
      stats.validPlatform++;
    }
  }
  
  // Calcular porcentagens de qualidade
  const totalReservations = stats.total;
  const percentValid = (count) => ((count / totalReservations) * 100).toFixed(2) + '%';
  
  console.log(`Total de reservas: ${totalReservations}`);
  console.log(`Nome do hóspede válido: ${stats.validGuests} (${percentValid(stats.validGuests)})`);
  console.log(`Check-in válido: ${stats.validCheckIn} (${percentValid(stats.validCheckIn)})`);
  console.log(`Check-out válido: ${stats.validCheckOut} (${percentValid(stats.validCheckOut)})`);
  console.log(`Datas em ordem correta: ${stats.validDates} (${percentValid(stats.validDates)})`);
  console.log(`Número de hóspedes válido: ${stats.validNumGuests} (${percentValid(stats.validNumGuests)})`);
  console.log(`Valor total válido: ${stats.validTotalAmount} (${percentValid(stats.validTotalAmount)})`);
  console.log(`Plataforma válida: ${stats.validPlatform} (${percentValid(stats.validPlatform)})`);
  
  // Verificar a precisão geral
  const totalChecks = 7; // Número total de verificações por reserva
  const totalPossiblePoints = totalReservations * totalChecks;
  const totalPoints = stats.validGuests + stats.validCheckIn + stats.validCheckOut + 
                      stats.validDates + stats.validNumGuests + stats.validTotalAmount + 
                      stats.validPlatform;
  
  const overallAccuracy = (totalPoints / totalPossiblePoints) * 100;
  
  console.log(`\nPrecisão geral das reservas extraídas: ${overallAccuracy.toFixed(2)}%`);
  
  if (overallAccuracy >= 95) {
    console.log('✅ Excelente! A extração de reservas está funcionando muito bem.');
  } else if (overallAccuracy >= 85) {
    console.log('✅ Boa qualidade. A maioria das reservas foi extraída corretamente.');
  } else if (overallAccuracy >= 70) {
    console.log('⚠️ Qualidade razoável. Algumas reservas podem precisar de revisão manual.');
  } else {
    console.log('❌ Qualidade insuficiente. A extração de reservas precisa ser melhorada.');
  }
}

// Executar o teste
testControlFileProcessor();
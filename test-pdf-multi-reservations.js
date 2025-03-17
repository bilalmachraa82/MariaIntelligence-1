// Teste de processamento para relatórios com múltiplas reservas
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';
import pdfParse from 'pdf-parse';

/**
 * Converte um arquivo para base64
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<string>} - String base64 do arquivo
 */
async function fileToBase64(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  } catch (error) {
    console.error(`Erro ao converter arquivo ${filePath} para base64:`, error);
    throw error;
  }
}

/**
 * Extrai texto de um PDF usando pdf-parse
 * @param {Buffer} pdfBuffer - Buffer do PDF
 * @returns {Promise<string>} - Texto extraído
 */
async function extractTextWithPdfParse(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Erro ao extrair texto com pdf-parse:', error);
    throw error;
  }
}

/**
 * Converte datas do formato DD-MM-YYYY para YYYY-MM-DD
 * @param {string} dateStr - String de data no formato DD-MM-YYYY
 * @returns {string} - Data no formato YYYY-MM-DD
 */
function convertDateFormat(dateStr) {
  if (!dateStr) return '';
  
  // Verifica se a data já está no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Tenta converter DD-MM-YYYY para YYYY-MM-DD
  const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  
  // Tenta extrair data do formato "DD-MM-YYYY HH:MM"
  const matchWithTime = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})\s+\d{2}:\d{2}$/);
  if (matchWithTime) {
    return `${matchWithTime[3]}-${matchWithTime[2]}-${matchWithTime[1]}`;
  }
  
  // Se não conseguir converter, retorna a string original
  return dateStr;
}

/**
 * Extrai múltiplas reservas de um relatório PDF
 * @param {string} text - Texto extraído do PDF
 * @param {string} apiKey - Chave API do Mistral
 * @returns {Promise<Array>} - Array de reservas extraídas
 */
async function extractMultipleReservations(text, apiKey) {
  try {
    const client = new Mistral({ apiKey });
    
    // Usar o modelo tiny para function calling
    const response = await client.chat.complete({
      model: "mistral-tiny",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em extrair informações estruturadas de relatórios de reservas de alojamento.
          O texto fornecido é um relatório que contém múltiplas reservas.
          Para cada reserva no relatório, extraia todos os dados disponíveis.
          Use o formato de data ISO (YYYY-MM-DD) para todas as datas.
          Ignore cabecalhos e filtros como "Todos", "Não mostrar", etc.
          Foque em identificar linhas do relatório que representam reservas individuais.
          Cada reserva típica contém: referência, alojamento, datas de check-in/check-out, 
          informações do hóspede (nome, telefone, email), número de adultos/crianças.
          Extraia no máximo 5 reservas do relatório.`
        },
        {
          role: "user",
          content: `Analise este relatório de reservas e extraia os dados de cada reserva individual:\n\n${text}`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extractReservationsFromReport",
            description: "Extrair dados estruturados de múltiplas reservas a partir de um relatório",
            parameters: {
              type: "object",
              properties: {
                reportType: {
                  type: "string",
                  description: "Tipo de relatório ('entradas' para check-ins, 'saidas' para check-outs)"
                },
                reservations: {
                  type: "array",
                  description: "Lista de reservas extraídas do relatório",
                  items: {
                    type: "object",
                    properties: {
                      reference: {
                        type: "string",
                        description: "Referência ou ID da reserva"
                      },
                      propertyName: {
                        type: "string",
                        description: "Nome da propriedade/alojamento"
                      },
                      status: {
                        type: "string",
                        description: "Estado da reserva (confirmada, etc)"
                      },
                      guestName: {
                        type: "string",
                        description: "Nome completo do hóspede"
                      },
                      guestEmail: {
                        type: "string",
                        description: "Email do hóspede"
                      },
                      guestPhone: {
                        type: "string",
                        description: "Telefone do hóspede"
                      },
                      checkInDate: {
                        type: "string",
                        description: "Data de check-in no formato YYYY-MM-DD"
                      },
                      checkOutDate: {
                        type: "string",
                        description: "Data de check-out no formato YYYY-MM-DD"
                      },
                      numAdults: {
                        type: "integer",
                        description: "Número de adultos"
                      },
                      numChildren: {
                        type: "integer",
                        description: "Número de crianças"
                      },
                      country: {
                        type: "string",
                        description: "País de origem do hóspede"
                      },
                      platform: {
                        type: "string",
                        description: "Plataforma de reserva (se disponível)"
                      }
                    },
                    required: ["propertyName", "guestName"]
                  }
                }
              },
              required: ["reportType", "reservations"]
            }
          }
        }
      ],
      toolChoice: { type: "function", function: { name: "extractReservationsFromReport" } },
      temperature: 0.1,
      maxTokens: 1500
    });
    
    if (response && 
        response.choices && 
        response.choices[0] && 
        response.choices[0].message && 
        response.choices[0].message.toolCalls && 
        response.choices[0].message.toolCalls.length > 0) {
      
      const toolCall = response.choices[0].message.toolCalls[0];
      
      if (toolCall.function && toolCall.function.arguments) {
        const functionArgs = toolCall.function.arguments;
        const extractedData = JSON.parse(typeof functionArgs === 'string' ? functionArgs : JSON.stringify(functionArgs));
        
        // Normalizar datas em todas as reservas
        if (extractedData && extractedData.reservations) {
          extractedData.reservations.forEach(reservation => {
            if (reservation.checkInDate) {
              reservation.checkInDate = convertDateFormat(reservation.checkInDate);
            }
            if (reservation.checkOutDate) {
              reservation.checkOutDate = convertDateFormat(reservation.checkOutDate);
            }
          });
        }
        
        return extractedData;
      } else {
        throw new Error('Resposta não contém argumentos válidos');
      }
    } else {
      throw new Error('Resposta não contém toolCalls');
    }
  } catch (error) {
    console.error('Erro ao extrair reservas múltiplas:', error);
    throw error;
  }
}

async function processPdf(filePath) {
  console.log(`\nProcessando arquivo: ${filePath}`);
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    // Ler o arquivo
    const pdfBuffer = fs.readFileSync(filePath);
    console.log(`PDF carregado (${Math.round(pdfBuffer.length / 1024)} KB)`);
    
    // Extrair texto usando pdf-parse
    console.log('Extraindo texto com pdf-parse...');
    const extractedText = await extractTextWithPdfParse(pdfBuffer);
    console.log(`Texto extraído (${extractedText.length} caracteres)`);
    
    // Extrair dados de múltiplas reservas
    console.log('Extraindo múltiplas reservas com Mistral AI...');
    const data = await extractMultipleReservations(extractedText, process.env.MISTRAL_API_KEY);
    
    console.log('\nDados extraídos:');
    console.log('-'.repeat(50));
    console.log(JSON.stringify(data, null, 2));
    console.log('-'.repeat(50));
    
    return data;
    
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error);
    return null;
  }
}

async function main() {
  console.log('🔄 Iniciando teste de processamento de relatórios com múltiplas reservas...');
  
  // Verificar API key
  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ MISTRAL_API_KEY não configurada. Por favor, configure esta variável de ambiente.');
    return;
  }
  
  // Processar entrada.pdf
  console.log('\n📑 PROCESSANDO RELATÓRIO DE ENTRADAS (CHECK-INS)');
  const entradaData = await processPdf('./entrada.pdf');
  
  // Processar saida.pdf
  console.log('\n📑 PROCESSANDO RELATÓRIO DE SAÍDAS (CHECK-OUTS)');
  const saidaData = await processPdf('./saida.pdf');
  
  // Combinar e exibir as reservas
  if (entradaData && entradaData.reservations && entradaData.reservations.length > 0) {
    console.log(`\n✅ Reservas de check-in encontradas: ${entradaData.reservations.length}`);
    console.log('Detalhes das reservas de check-in:');
    entradaData.reservations.forEach((res, i) => {
      console.log(`\nReserva ${i+1}:`);
      console.log(`- Alojamento: ${res.propertyName || 'Não especificado'}`);
      console.log(`- Hóspede: ${res.guestName || 'Não especificado'}`);
      console.log(`- Check-in: ${res.checkInDate || 'Não especificado'}`);
      console.log(`- Check-out: ${res.checkOutDate || 'Não especificado'}`);
      console.log(`- Contacto: ${res.guestPhone || 'Não disponível'}`);
      console.log(`- Email: ${res.guestEmail || 'Não disponível'}`);
      if (res.numAdults || res.numChildren) {
        console.log(`- Hóspedes: ${res.numAdults || 0} adultos, ${res.numChildren || 0} crianças`);
      }
      if (res.country) {
        console.log(`- País: ${res.country}`);
      }
      console.log(`- Referência: ${res.reference || 'Não disponível'}`);
    });
  } else {
    console.log('\n❌ Nenhuma reserva de check-in encontrada no relatório de entradas.');
  }
  
  if (saidaData && saidaData.reservations && saidaData.reservations.length > 0) {
    console.log(`\n✅ Reservas de check-out encontradas: ${saidaData.reservations.length}`);
    console.log('Detalhes das reservas de check-out:');
    saidaData.reservations.forEach((res, i) => {
      console.log(`\nReserva ${i+1}:`);
      console.log(`- Alojamento: ${res.propertyName || 'Não especificado'}`);
      console.log(`- Hóspede: ${res.guestName || 'Não especificado'}`);
      console.log(`- Check-in: ${res.checkInDate || 'Não especificado'}`);
      console.log(`- Check-out: ${res.checkOutDate || 'Não especificado'}`);
      console.log(`- Contacto: ${res.guestPhone || 'Não disponível'}`);
      console.log(`- Email: ${res.guestEmail || 'Não disponível'}`);
      if (res.numAdults || res.numChildren) {
        console.log(`- Hóspedes: ${res.numAdults || 0} adultos, ${res.numChildren || 0} crianças`);
      }
      if (res.country) {
        console.log(`- País: ${res.country}`);
      }
      console.log(`- Referência: ${res.reference || 'Não disponível'}`);
    });
  } else {
    console.log('\n❌ Nenhuma reserva de check-out encontrada no relatório de saídas.');
  }
  
  console.log('\n🏁 Teste concluído!');
}

// Executar o teste
main().catch(error => {
  console.error('Erro não tratado:', error);
});
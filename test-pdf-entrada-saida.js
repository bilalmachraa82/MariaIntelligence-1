// Teste de processamento dos arquivos "entrada.pdf" e "saida.pdf"
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
 * Extrai dados estruturados usando Mistral API com function calling
 * @param {string} text - Texto extraído do PDF
 * @param {string} apiKey - Chave API do Mistral
 */
async function extractStructuredData(text, apiKey) {
  try {
    const client = new Mistral({ apiKey });
    
    // Usar o modelo tiny para function calling
    const response = await client.chat.complete({
      model: "mistral-tiny",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em extrair informações estruturadas de reservas de alojamento.
          Extraia todos os dados solicitados quando disponíveis no texto.
          Use o formato de data ISO (YYYY-MM-DD) para todas as datas.
          Converta qualquer formato de data (DD-MM-YYYY) para o formato ISO (YYYY-MM-DD).
          Converta valores monetários para números sem símbolos.
          Ignore texto genérico como "Todos" ou "Não mostrar" que são apenas rótulos do relatório.
          Procure atentamente pelos dados reais do hóspede, datas e valores de reserva.`
        },
        {
          role: "user",
          content: `Extraia os detalhes da reserva deste texto:\n\n${text}`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extractReservationData",
            description: "Extrair dados estruturados de uma reserva a partir do texto",
            parameters: {
              type: "object",
              properties: {
                documentType: {
                  type: "string",
                  description: "Tipo de documento (reserva, check-in, check-out, etc.)"
                },
                propertyName: {
                  type: "string",
                  description: "Nome da propriedade, ignore valores genéricos como 'Todos' ou 'dados'"
                },
                guestName: {
                  type: "string",
                  description: "Nome completo do hóspede, ignore valores genéricos como 'Todos'"
                },
                guestEmail: {
                  type: "string",
                  description: "Email do hóspede (se disponível)"
                },
                guestPhone: {
                  type: "string",
                  description: "Telefone do hóspede (se disponível)"
                },
                checkInDate: {
                  type: "string",
                  description: "Data de check-in no formato YYYY-MM-DD"
                },
                checkOutDate: {
                  type: "string",
                  description: "Data de check-out no formato YYYY-MM-DD"
                },
                numGuests: {
                  type: "integer",
                  description: "Número de hóspedes (adultos + crianças)"
                },
                totalAmount: {
                  type: "number",
                  description: "Valor total da reserva"
                },
                platform: {
                  type: "string",
                  description: "Plataforma de reserva (Airbnb, Booking, etc.)"
                }
              },
              required: ["propertyName", "guestName"]
            }
          }
        }
      ],
      toolChoice: { type: "function", function: { name: "extractReservationData" } },
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
        return extractedData;
      } else {
        throw new Error('Resposta não contém argumentos válidos');
      }
    } else {
      throw new Error('Resposta não contém toolCalls');
    }
  } catch (error) {
    console.error('Erro ao extrair dados estruturados:', error);
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
  
  // Se não conseguir converter, retorna a string original
  return dateStr;
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
    
    // Extrair dados estruturados com Mistral AI
    console.log('Extraindo dados estruturados com Mistral AI...');
    const data = await extractStructuredData(extractedText, process.env.MISTRAL_API_KEY);
    
    // Normalizar datas para formato YYYY-MM-DD
    if (data) {
      if (data.checkInDate) {
        data.checkInDate = convertDateFormat(data.checkInDate);
      }
      if (data.checkOutDate) {
        data.checkOutDate = convertDateFormat(data.checkOutDate);
      }
    }
    
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
  console.log('🔄 Iniciando teste dos arquivos "entrada.pdf" e "saida.pdf"...');
  
  // Verificar API key
  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ MISTRAL_API_KEY não configurada. Por favor, configure esta variável de ambiente.');
    return;
  }
  
  // Processar entrada.pdf
  const entradaData = await processPdf('./entrada.pdf');
  
  // Processar saida.pdf
  const saidaData = await processPdf('./saida.pdf');
  
  // Exibir resumo dos dados extraídos
  if (entradaData && saidaData) {
    console.log('\n✅ Resumo da reserva combinada:');
    console.log('-'.repeat(50));
    console.log(`Propriedade: ${entradaData.propertyName || saidaData.propertyName}`);
    console.log(`Hóspede: ${entradaData.guestName || saidaData.guestName}`);
    
    if (entradaData.checkInDate) {
      console.log(`Check-in: ${entradaData.checkInDate}`);
    }
    
    if (saidaData.checkOutDate) {
      console.log(`Check-out: ${saidaData.checkOutDate}`);
    }
    
    if (entradaData.platform || saidaData.platform) {
      console.log(`Plataforma: ${entradaData.platform || saidaData.platform}`);
    }
    
    if (entradaData.numGuests || saidaData.numGuests) {
      console.log(`Número de hóspedes: ${entradaData.numGuests || saidaData.numGuests}`);
    }
    
    if (entradaData.totalAmount || saidaData.totalAmount) {
      console.log(`Valor total: ${entradaData.totalAmount || saidaData.totalAmount}`);
    }
    
    console.log('-'.repeat(50));
  }
  
  console.log('\n🏁 Teste concluído!');
}

// Executar o teste
main().catch(error => {
  console.error('Erro não tratado:', error);
});
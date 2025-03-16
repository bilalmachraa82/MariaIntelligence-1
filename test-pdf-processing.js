// Script de teste para processar PDFs com a API Mistral
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MistralClient } from '@mistralai/mistralai';

// Obter diretório atual com suporte a ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar se a API Key do Mistral está disponível
if (!process.env.MISTRAL_API_KEY) {
  console.error('Erro: API Key do Mistral não encontrada. Por favor, defina a variável de ambiente MISTRAL_API_KEY.');
  process.exit(1);
}

// Inicializar cliente Mistral
const mistral = new MistralClient(process.env.MISTRAL_API_KEY);

/**
 * Converte um arquivo para base64
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<string>} - String base64 do arquivo
 */
async function fileToBase64(filePath) {
  const fileData = fs.readFileSync(filePath);
  return fileData.toString('base64');
}

/**
 * Extrai texto de um PDF usando Mistral AI
 * @param {string} pdfBase64 - PDF em base64
 * @returns {Promise<string>} - Texto extraído do PDF
 */
async function extractTextFromPDF(pdfBase64) {
  try {
    console.log('Extraindo texto do PDF com Mistral AI...');
    
    const extractionResponse = await mistral.chat({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Por favor, extraia todo o texto deste documento PDF. Inclua detalhes sobre check-in, check-out, valores, informações do hóspede e da propriedade.'
            },
            {
              type: 'image',
              image_url: {
                url: `data:application/pdf;base64,${pdfBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1
    });
    
    return extractionResponse.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw error;
  }
}

/**
 * Analisa o texto extraído para obter dados estruturados
 * @param {string} text - Texto extraído do PDF
 * @returns {Promise<Object>} - Dados estruturados da reserva
 */
async function parseReservationData(text) {
  try {
    console.log('Analisando texto para extrair dados estruturados...');
    
    // Definição da função de extração para o Mistral
    const functionDef = {
      name: "extract_reservation_data",
      description: "Extrai informações estruturadas de um texto de reserva",
      parameters: {
        type: "object",
        properties: {
          propertyId: {
            type: "integer",
            description: "ID da propriedade (se não for encontrado, use 1)"
          },
          propertyName: {
            type: "string",
            description: "Nome da propriedade/alojamento reservado"
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
          numGuests: {
            type: "integer",
            description: "Número de hóspedes"
          },
          totalAmount: {
            type: "number",
            description: "Valor total da reserva (valor numérico apenas)"
          },
          platform: {
            type: "string",
            description: "Plataforma de reserva (airbnb, booking, expedia, direct, other)"
          },
          platformFee: {
            type: "number",
            description: "Taxa da plataforma (valor numérico apenas)"
          },
          cleaningFee: {
            type: "number",
            description: "Taxa de limpeza (valor numérico apenas)"
          },
          checkInFee: {
            type: "number",
            description: "Taxa de check-in (valor numérico apenas)"
          },
          commissionFee: {
            type: "number",
            description: "Taxa de comissão (valor numérico apenas)"
          },
          teamPayment: {
            type: "number",
            description: "Pagamento da equipe (valor numérico apenas)"
          }
        },
        required: ["propertyName", "guestName", "checkInDate", "checkOutDate", "totalAmount"]
      }
    };
    
    // Chamar Mistral para extrair dados estruturados
    const extractionResult = await mistral.chat({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'user',
          content: `
          Extraia os dados estruturados da seguinte descrição de reserva:
          
          ${text}
          
          Instruções específicas:
          1. Para valores monetários, extraia apenas os números (sem símbolos de moeda)
          2. Para datas, converta para o formato YYYY-MM-DD
          3. Para campos não encontrados, use null
          4. A plataforma deve ser categorizada como: 'airbnb', 'booking', 'expedia', 'direct' ou 'other'
          5. Seja preciso na extração de todos os valores, especialmente datas e valores financeiros
          6. Se não houver informações suficientes, faça a melhor estimativa possível`
        }
      ],
      temperature: 0.1,
      tools: [
        {
          type: "function",
          function: functionDef
        }
      ],
      toolChoice: {
        type: "function",
        function: { name: "extract_reservation_data" }
      }
    });
    
    // Extrair resultado da função
    if (extractionResult.choices &&
        extractionResult.choices[0] &&
        extractionResult.choices[0].message.toolCalls &&
        extractionResult.choices[0].message.toolCalls.length > 0) {
      
      const functionCall = extractionResult.choices[0].message.toolCalls[0];
      if (functionCall.type === 'function' &&
          functionCall.function.name === 'extract_reservation_data') {
        
        const extractedData = JSON.parse(functionCall.function.arguments);
        console.log('Dados extraídos com sucesso:', JSON.stringify(extractedData, null, 2));
        return extractedData;
      }
    }
    
    throw new Error('Não foi possível extrair dados estruturados da resposta');
    
  } catch (error) {
    console.error('Erro ao analisar dados da reserva:', error);
    throw error;
  }
}

/**
 * Processa um arquivo PDF para extrair informações de reserva
 * @param {string} pdfPath - Caminho do arquivo PDF
 */
async function processPDF(pdfPath) {
  try {
    console.log(`\nProcessando arquivo: ${pdfPath}`);
    
    // Converter PDF para base64
    const pdfBase64 = await fileToBase64(pdfPath);
    console.log(`PDF convertido para base64 (${pdfBase64.length} caracteres)`);
    
    // Extrair texto do PDF
    const extractedText = await extractTextFromPDF(pdfBase64);
    console.log('\nTexto extraído do PDF:');
    console.log('---------------------------------------------------');
    console.log(extractedText);
    console.log('---------------------------------------------------\n');
    
    // Analisar dados estruturados
    const reservationData = await parseReservationData(extractedText);
    
    console.log('\nDados estruturados da reserva:');
    console.log('---------------------------------------------------');
    console.log(JSON.stringify(reservationData, null, 2));
    console.log('---------------------------------------------------\n');
    
    return { extractedText, reservationData };
    
  } catch (error) {
    console.error(`Erro ao processar PDF ${pdfPath}:`, error);
    throw error;
  }
}

/**
 * Função principal para testar o processamento de PDFs
 */
async function main() {
  try {
    console.log('Iniciando teste de processamento de PDFs com Mistral AI...\n');
    
    // Lista de arquivos PDF a processar
    const pdfFiles = [
      path.join(__dirname, 'Check-in Maria faz.pdf'),
      path.join(__dirname, 'Check-outs Maria faz.pdf')
    ];
    
    // Processar cada arquivo
    for (const pdfPath of pdfFiles) {
      if (fs.existsSync(pdfPath)) {
        await processPDF(pdfPath);
      } else {
        console.error(`Arquivo não encontrado: ${pdfPath}`);
      }
    }
    
    console.log('\n✅ Teste de processamento de PDFs concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste de processamento de PDFs:', error);
    process.exit(1);
  }
}

// Executar script
main();
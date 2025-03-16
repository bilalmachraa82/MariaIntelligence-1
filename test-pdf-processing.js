// Teste de processamento de PDF com Mistral AI
import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';

/**
 * Converte um arquivo para base64
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<string>} - String base64 do arquivo
 */
async function fileToBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

/**
 * Extrai texto de um PDF usando Mistral AI
 * @param {string} pdfBase64 - PDF em base64
 * @returns {Promise<string>} - Texto extraído do PDF
 */
async function extractTextFromPDF(pdfBase64) {
  console.log('🔄 Extraindo texto do PDF via Mistral AI...');
  
  try {
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não configurada nas variáveis de ambiente');
    }
    
    // Inicializar cliente Mistral
    const client = new Mistral({ apiKey });
    
    // Enviar para o modelo mistral-vision-preview que possui suporte a visão
    const response = await client.chat.complete({
      model: 'mistral-vision-preview',
      messages: [
        {
          role: 'user',
          content: 'Por favor, extraia todo o texto visível deste documento PDF. Retorne apenas o texto puro, sem comentários adicionais.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${pdfBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ]
    });
    
    // Extrair texto da resposta
    const extractedText = response.choices[0].message.content;
    return extractedText;
  } catch (error) {
    if (error.message.includes('Invalid input')) {
      console.error('❌ Erro de formato de entrada:', error.message.substring(0, 200) + '...');
      
      // Tentar formato alternativo
      console.log('🔄 Tentando formato alternativo...');
      try {
        const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
        const response = await client.chat.complete({
          model: 'mistral-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Por favor, extraia todo o texto visível deste documento PDF. Retorne apenas o texto puro, sem comentários adicionais.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${pdfBase64}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ]
        });
        
        // Extrair texto da resposta
        const extractedText = response.choices[0].message.content;
        return extractedText;
      } catch (alternativeError) {
        console.error('❌ Erro no formato alternativo:', alternativeError.message.substring(0, 200) + '...');
        throw alternativeError;
      }
    } else {
      console.error('❌ Erro ao extrair texto do PDF:', error.message);
      throw error;
    }
  }
}

/**
 * Analisa o texto extraído para obter dados estruturados
 * @param {string} text - Texto extraído do PDF
 * @returns {Promise<Object>} - Dados estruturados da reserva
 */
async function parseReservationData(text) {
  console.log('🔄 Analisando texto para extrair dados estruturados...');
  
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não configurada nas variáveis de ambiente');
    }
    
    const client = new Mistral({ apiKey });
    
    // Definir ferramentas para extração de dados
    const tools = [
      {
        type: "function",
        function: {
          name: "extract_reservation_data",
          description: "Extrair dados estruturados de uma reserva a partir do texto de um documento",
          parameters: {
            type: "object",
            properties: {
              guest_name: {
                type: "string",
                description: "Nome completo do hóspede"
              },
              guest_email: {
                type: "string",
                description: "Email do hóspede"
              },
              guest_phone: {
                type: "string",
                description: "Telefone do hóspede"
              },
              check_in_date: {
                type: "string",
                description: "Data de check-in no formato YYYY-MM-DD"
              },
              check_out_date: {
                type: "string",
                description: "Data de check-out no formato YYYY-MM-DD"
              },
              property_name: {
                type: "string",
                description: "Nome da propriedade"
              },
              num_guests: {
                type: "integer",
                description: "Número de hóspedes"
              },
              total_amount: {
                type: "number",
                description: "Valor total da reserva"
              },
              platform: {
                type: "string",
                description: "Plataforma de reserva (Airbnb, Booking, etc.)"
              }
            },
            required: ["guest_name", "check_in_date", "check_out_date"]
          }
        }
      }
    ];
    
    // Enviar o texto extraído para análise
    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'user',
          content: `Extraia os dados estruturados da seguinte reserva. Use a função disponível para capturar todos os detalhes relevantes:\n\n${text}`
        }
      ],
      tools: tools
    });
    
    // Processar resultado do function calling
    const toolCalls = response.choices[0].message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      throw new Error('Não foi possível extrair dados estruturados');
    }
    
    // Extrair argumentos da ferramenta
    const extractedData = JSON.parse(toolCalls[0].function.arguments);
    return extractedData;
  } catch (error) {
    console.error('❌ Erro ao analisar dados da reserva:', error.message);
    throw error;
  }
}

/**
 * Processa um arquivo PDF para extrair informações de reserva
 * @param {string} pdfPath - Caminho do arquivo PDF
 */
async function processPDF(pdfPath) {
  try {
    console.log(`🔄 Processando PDF: ${pdfPath}`);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Arquivo não encontrado: ${pdfPath}`);
    }
    
    // Converter para base64
    const pdfBase64 = await fileToBase64(pdfPath);
    console.log(`📄 PDF convertido para base64 (${Math.round(pdfBase64.length / 1024)} KB)`);
    
    // Extrair texto do PDF
    const extractedText = await extractTextFromPDF(pdfBase64);
    console.log('\n📋 Amostra do texto extraído:');
    console.log('-'.repeat(50));
    console.log(extractedText.substring(0, 500) + '...');
    console.log('-'.repeat(50));
    
    // Analisar o texto para obter dados estruturados
    const reservationData = await parseReservationData(extractedText);
    console.log('\n📊 Dados estruturados extraídos:');
    console.log('-'.repeat(50));
    console.log(JSON.stringify(reservationData, null, 2));
    console.log('-'.repeat(50));
    
    return {
      rawText: extractedText,
      structuredData: reservationData
    };
  } catch (error) {
    console.error('\n❌ Erro ao processar PDF:', error.message);
    return {
      error: true,
      message: error.message
    };
  }
}

/**
 * Função principal para testar o processamento de PDFs
 */
async function main() {
  try {
    console.log('🧪 Iniciando teste de processamento de PDF com Mistral AI...\n');
    
    // Processar PDF de check-in
    const checkInResult = await processPDF('./Check-in Maria faz.pdf');
    
    // Se houver tempo e o primeiro teste for bem-sucedido, processar PDF de check-out
    if (!checkInResult.error && fs.existsSync('./Check-outs Maria faz.pdf')) {
      console.log('\n🧪 Processando segundo PDF (check-out)...\n');
      await processPDF('./Check-outs Maria faz.pdf');
    }
    
    console.log('\n✅ Teste concluído!');
  } catch (error) {
    console.error('\n❌ Falha no teste:', error);
    process.exit(1);
  }
}

// Executar o teste
main();
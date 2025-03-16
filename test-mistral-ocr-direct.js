// Teste do OCR da Mistral usando chamada direta à API REST
import fs from 'fs';
import fetch from 'node-fetch';

// Função para converter o PDF em base64
function pdfParaBase64(caminhoDoArquivo) {
  const pdfBuffer = fs.readFileSync(caminhoDoArquivo);
  return pdfBuffer.toString('base64');
}

// Função para processar o OCR usando a API da Mistral
async function processarOcr(pdfBase64, apiKey) {
  try {
    console.log('🔄 Enviando requisição direta para a API Mistral OCR...');
    
    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-medium',
        document: {
          data: pdfBase64,
          mime_type: 'application/pdf'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Resposta completa do erro:', errorText);
      throw new Error(`Erro na API: ${response.status} - ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Erro ao processar OCR:', error);
    throw error;
  }
}

// Função para extrair dados estruturados usando a API de chat
async function extrairDadosEstruturados(texto, apiKey) {
  try {
    console.log('🔄 Extraindo dados estruturados do texto...');
    
    const tools = [
      {
        type: "function",
        function: {
          name: "extract_reservation_data",
          description: "Extrair dados estruturados de uma reserva a partir do texto",
          parameters: {
            type: "object",
            properties: {
              propertyName: {
                type: "string",
                description: "Nome da propriedade"
              },
              guestName: {
                type: "string", 
                description: "Nome completo do hóspede"
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
                description: "Número de hóspedes"
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
            required: ["propertyName", "guestName", "checkInDate", "checkOutDate"]
          }
        }
      }
    ];
    
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'user',
            content: `Extraia todas as informações de reserva do seguinte texto. O texto foi extraído de um PDF de reserva/check-in. Use a função disponível para estruturar os dados:\n\n${texto}`
          }
        ],
        tools: tools
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API de chat: ${response.status} - ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    
    // Extrair dados da resposta
    const toolCalls = data.choices[0].message.tool_calls || [];
    if (toolCalls.length === 0) {
      throw new Error('Não foi possível extrair dados estruturados do texto');
    }
    
    const args = toolCalls[0].function.arguments;
    return typeof args === 'string' ? JSON.parse(args) : args;
  } catch (error) {
    console.error('❌ Erro ao extrair dados estruturados:', error);
    throw error;
  }
}

// Função principal para executar o processo
async function main() {
  try {
    console.log('🔄 Iniciando teste de OCR direto da API Mistral...');
    
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    const caminhoDoArquivo = './Check-in Maria faz.pdf';
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(caminhoDoArquivo)) {
      throw new Error(`Arquivo não encontrado: ${caminhoDoArquivo}`);
    }
    
    // Converter o PDF para base64
    const pdfBase64 = pdfParaBase64(caminhoDoArquivo);
    console.log(`📄 PDF convertido para base64 (${Math.round(pdfBase64.length / 1024)} KB)`);

    // Processar o OCR
    const resultado = await processarOcr(pdfBase64, apiKey);
    console.log('✅ OCR processado com sucesso');
    console.log('📋 Amostra do texto extraído:');
    console.log('-'.repeat(50));
    console.log(resultado.text.substring(0, 300) + '...');
    console.log('-'.repeat(50));
    
    // Salvar texto completo para análise
    fs.writeFileSync('extracted-text-api-direct.txt', resultado.text);
    console.log('📝 Texto completo salvo em: extracted-text-api-direct.txt');
    
    // Extrair dados estruturados
    const dadosEstruturados = await extrairDadosEstruturados(resultado.text, apiKey);
    console.log('✅ Dados estruturados extraídos:');
    console.log('-'.repeat(50));
    console.log(JSON.stringify(dadosEstruturados, null, 2));
    console.log('-'.repeat(50));
    
    console.log('✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Falha no teste:', error);
    process.exit(1);
  }
}

// Executar o processo
main();
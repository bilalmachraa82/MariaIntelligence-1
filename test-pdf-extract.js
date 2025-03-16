// Teste do processamento de PDF simplificado usando pdf-parse + Mistral para análise
import fs from 'fs';
import pdfParse from 'pdf-parse';
import fetch from 'node-fetch';

async function testPdfExtraction() {
  try {
    console.log('🔄 Iniciando teste de extração de texto de PDF');
    
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    console.log('✅ Chave API Mistral configurada');
    
    // Ler arquivo PDF
    const pdfPath = './Check-in Maria faz.pdf';
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Arquivo não encontrado: ${pdfPath}`);
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`📄 PDF lido (${Math.round(pdfBuffer.length / 1024)} KB)`);
    
    // ETAPA 1: Extrair texto usando pdf-parse (abordagem mais confiável)
    console.log('🔄 Extraindo texto do PDF com pdf-parse...');
    const data = await pdfParse(pdfBuffer);
    
    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do PDF');
    }
    
    console.log(`✅ Texto extraído com sucesso (${data.text.length} caracteres)`);
    console.log('📋 Amostra do texto extraído:');
    console.log('-'.repeat(50));
    console.log(data.text.substring(0, 300) + '...');
    console.log('-'.repeat(50));
    
    // Salvar texto para referência
    fs.writeFileSync('extracted-text-pdf-parse.txt', data.text);
    console.log('📝 Texto completo salvo em: extracted-text-pdf-parse.txt');
    
    // ETAPA 2: Analisar o texto para extrair dados estruturados
    console.log('\n🔄 Analisando texto para extrair dados estruturados usando API Mistral...');
    
    // Definir ferramentas para extração de dados
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
    
    // Limitar o texto para evitar problemas de tamanho (máximo 4000 caracteres)
    const limitedText = data.text.substring(0, 4000);
    console.log(`🔄 Enviando texto limitado para análise (${limitedText.length} caracteres)...`);
    
    // Enviar texto extraído para análise usando chamada direta da API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-small', // Usar modelo menor para resposta mais rápida
        messages: [
          {
            role: 'user',
            content: `Extraia todas as informações de reserva do seguinte texto. O texto foi extraído de um PDF de reserva/check-in. Use a função disponível para estruturar os dados de forma completa:\n\n${limitedText}`
          }
        ],
        tools: tools
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Mistral: ${response.status} - ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    
    // Verificar se há ferramenta chamada
    const toolCalls = result.choices[0].message.tool_calls || [];
    if (toolCalls.length === 0) {
      throw new Error('Não foi possível extrair dados estruturados do texto');
    }
    
    // Extrair os dados estruturados
    const args = toolCalls[0].function.arguments;
    const extractedData = typeof args === 'string' ? JSON.parse(args) : args;
    
    // Mostrar os dados estruturados
    console.log('✅ Dados estruturados extraídos:');
    console.log('-'.repeat(50));
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('-'.repeat(50));
    
    console.log('\n✅ Teste concluído com sucesso!');
    
    return {
      rawText: data.text,
      extractedData: extractedData
    };
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    throw error;
  }
}

// Executar o teste
testPdfExtraction().then(result => {
  console.log('✅ Processo completo finalizado!');
}).catch(error => {
  console.error('\n❌ Falha no teste:', error);
  process.exit(1);
});
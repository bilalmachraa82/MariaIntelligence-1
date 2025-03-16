// Teste do processamento de PDF simplificado usando pdf-parse + Mistral para análise
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { Mistral } from '@mistralai/mistralai';

async function testPdfExtraction() {
  try {
    console.log('🔄 Iniciando teste de extração de texto de PDF');
    
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    // Inicializar cliente Mistral
    const client = new Mistral({ apiKey });
    console.log('✅ Cliente Mistral inicializado');
    
    // Ler arquivo PDF
    const pdfPath = './Check-in Maria faz.pdf';
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Arquivo não encontrado: ${pdfPath}`);
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`📄 PDF lido (${Math.round(pdfBuffer.length / 1024)} KB)`);
    
    // Extrair texto usando pdf-parse (abordagem mais confiável)
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
    
    // Agora vamos analisar os dados com Mistral
    console.log('\n🔄 Analisando texto para extrair dados estruturados...');
    
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
    
    // Enviar o texto extraído para análise
    const response = await client.chat.complete({
      model: 'mistral-large-latest', // Usar large para melhor precisão
      messages: [
        {
          role: 'user',
          content: `Extraia todas as informações de reserva do seguinte texto. O texto foi extraído de um PDF de reserva/check-in. Use a função disponível para estruturar os dados de forma completa:\n\n${data.text}`
        }
      ],
      tools: tools
    });
    
    // Verificar se há ferramenta chamada
    const toolCalls = response.choices[0].message.tool_calls || [];
    if (toolCalls.length === 0) {
      throw new Error('Não foi possível extrair dados estruturados do texto');
    }
    
    // Extrair os dados estruturados
    const args = toolCalls[0].function.arguments;
    const argsString = typeof args === 'string' ? args : JSON.stringify(args);
    const extractedData = JSON.parse(argsString);
    
    // Mostrar os dados estruturados
    console.log('✅ Dados estruturados extraídos:');
    console.log('-'.repeat(50));
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('-'.repeat(50));
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    throw error;
  }
}

// Executar o teste
testPdfExtraction().catch(error => {
  console.error('\n❌ Falha no teste:', error);
  process.exit(1);
});
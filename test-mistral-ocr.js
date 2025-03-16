// Teste do endpoint OCR da Mistral
import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';

async function testMistralOCR() {
  try {
    console.log('🔄 Testando endpoint OCR da Mistral');
    
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
    
    const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');
    console.log(`📄 PDF convertido para base64 (${Math.round(pdfBase64.length / 1024)} KB)`);
    
    // Usar o método OCR do cliente
    console.log('🔄 Enviando requisição para endpoint OCR...');
    
    // Formato correto da requisição conforme a documentação
    const response = await client.ocr.process({
      model: "mistral-medium",
      document: {
        data: pdfBase64,
        mime_type: "application/pdf"
      }
    });
    
    // Extrair o texto processado
    console.log('✅ Resposta recebida do endpoint OCR');
    console.log('📋 Texto extraído:');
    console.log('-'.repeat(50));
    console.log(response.text.substring(0, 300) + '...');
    console.log('-'.repeat(50));
    
    // Salvar texto completo para análise
    fs.writeFileSync('extracted-text-from-ocr.txt', response.text);
    console.log('📝 Texto completo salvo em: extracted-text-from-ocr.txt');
    
    // Agora vamos usar o texto extraído para análise estruturada
    console.log('\n🔄 Processando o texto extraído para obter dados estruturados...');
    
    // Ferramentas para extração de dados
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
    
    // Enviar texto para análise com o modelo large
    const structuredResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'user',
          content: `Extraia os dados estruturados de reserva do seguinte texto. O texto foi extraído de um PDF de reserva/check-in. Use a função disponível para estruturar os dados:\n\n${response.text}`
        }
      ],
      tools: tools
    });
    
    // Verificar se temos function calling na resposta
    const toolCalls = structuredResponse.choices[0].message.tool_calls || [];
    if (toolCalls.length === 0) {
      throw new Error('Não foi possível extrair dados estruturados');
    }
    
    // Extrair argumentos da ferramenta
    const args = toolCalls[0].function.arguments;
    const argsString = typeof args === 'string' ? args : JSON.stringify(args);
    const extractedData = JSON.parse(argsString);
    
    console.log('✅ Dados estruturados extraídos:');
    console.log('-'.repeat(50));
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('-'.repeat(50));
    
    console.log('\n✅ Teste completo!');
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    throw error;
  }
}

// Executar o teste
testMistralOCR().catch(error => {
  console.error('\n❌ Falha no teste:', error);
  process.exit(1);
});
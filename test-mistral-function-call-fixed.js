// Teste de function calling do Mistral AI
import { Mistral } from '@mistralai/mistralai';

async function testMistralFunctionCall() {
  console.log('🧪 Iniciando teste de function calling com Mistral AI...');
  
  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ Erro: MISTRAL_API_KEY não configurada');
    return;
  }
  
  try {
    const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    
    // Testando modelos disponíveis
    const models = ['mistral-tiny', 'mistral-small'];
    
    for (const model of models) {
      console.log(`\n🔍 Testando function calling com modelo: ${model}`);
      try {
        const response = await mistral.chat.complete({
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Extraia as seguintes informações: nome do hóspede: João Silva, data de check-in: 15/03/2025, data de check-out: 20/03/2025, valor total: 500'
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'extractReservationData',
                description: 'Extrair dados estruturados de uma reserva',
                parameters: {
                  type: 'object',
                  properties: {
                    guestName: {
                      type: 'string',
                      description: 'Nome do hóspede'
                    },
                    checkInDate: {
                      type: 'string',
                      description: 'Data de check-in'
                    },
                    checkOutDate: {
                      type: 'string',
                      description: 'Data de check-out'
                    },
                    totalAmount: {
                      type: 'number',
                      description: 'Valor total da reserva'
                    }
                  },
                  required: ['guestName', 'checkInDate', 'checkOutDate']
                }
              }
            }
          ],
          toolChoice: { type: 'function', function: { name: 'extractReservationData' } },
          temperature: 0.1,
          max_tokens: 500
        });
        
        console.log('✅ Resposta recebida!');
        
        if (response.choices && 
            response.choices.length > 0 && 
            response.choices[0].message && 
            response.choices[0].message.toolCalls &&
            response.choices[0].message.toolCalls.length > 0) {
          
          const toolCall = response.choices[0].message.toolCalls[0];
          
          if (toolCall.function && toolCall.function.arguments) {
            const args = JSON.parse(toolCall.function.arguments);
            console.log('📋 Dados extraídos:');
            console.log('--------------------------------------------------');
            console.log(JSON.stringify(args, null, 2));
            console.log('--------------------------------------------------');
          } else {
            console.log('❌ Resposta não contém arguments');
          }
        } else {
          console.log('❌ Resposta não contém toolCalls');
          console.log('Resposta recebida:');
          console.log(JSON.stringify(response, null, 2));
        }
      } catch (modelError) {
        console.log(`❌ Erro ao testar ${model}: ${modelError.message}`);
        if (modelError.statusCode) {
          console.log(`Status code: ${modelError.statusCode}`);
          console.log(`Error body: ${JSON.stringify(modelError.body || {})}`);
        }
      }
    }
    
    console.log('\n✅ Testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testMistralFunctionCall();
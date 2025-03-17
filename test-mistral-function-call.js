/**
 * Teste simplificado para verificar o function calling do Mistral
 * com o modelo mistral-small
 */

import pkg from '@mistralai/mistralai';
const { MistralClient } = pkg;

async function testMistralFunctionCall() {
  console.log('🧪 Iniciando teste de function calling com Mistral AI...');
  
  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ Erro: MISTRAL_API_KEY não configurada');
    return;
  }
  
  try {
    const mistral = new MistralClient({ apiKey: process.env.MISTRAL_API_KEY });
    
    console.log('🔄 Testando function calling com o modelo mistral-small...');
    
    const response = await mistral.chatCompletions.create({
      model: 'mistral-small',
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
      tool_choice: { type: 'function', function: { name: 'extractReservationData' } },
      temperature: 0.1,
      max_tokens: 500
    });
    
    console.log('✅ Chamada completada!');
    console.log('📋 Resposta:');
    console.log('----------------------------------------');
    
    if (response && 
        response.choices && 
        response.choices.length > 0 && 
        response.choices[0].message && 
        response.choices[0].message.toolCalls &&
        response.choices[0].message.toolCalls.length > 0) {
      
      const toolCall = response.choices[0].message.toolCalls[0];
      
      if (toolCall.function && toolCall.function.arguments) {
        const args = JSON.parse(toolCall.function.arguments);
        console.log('Dados extraídos:');
        console.log(JSON.stringify(args, null, 2));
      } else {
        console.log('❌ Resposta não contém arguments');
      }
    } else {
      console.log('❌ Resposta não contém toolCalls');
      console.log('Resposta recebida:');
      console.log(JSON.stringify(response, null, 2));
    }
    
    console.log('----------------------------------------');
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    if (error.rawResponse) {
      console.log('Detalhes da resposta:');
      console.log('Status:', error.statusCode);
      console.log('Body:', error.body);
    }
  }
}

// Executar o teste
testMistralFunctionCall();
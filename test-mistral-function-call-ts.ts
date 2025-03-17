/**
 * Teste simplificado para verificar o function calling do Mistral
 * com diferentes modelos
 */

import { Mistral } from '@mistralai/mistralai';

async function testMistralWithModel(modelName: string) {
  console.log(`\n🧪 Testando function calling com o modelo ${modelName}...`);
  
  try {
    const mistral = new Mistral();
    
    const response = await mistral.chat.complete({
      model: modelName,
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
    
    console.log('✅ Chamada completada!');
    
    if (response.choices && 
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
    
    return true;
    
  } catch (error: any) {
    console.error(`❌ Erro com o modelo ${modelName}:`, error.message);
    if (error.statusCode) {
      console.log(`Status code: ${error.statusCode}`);
    }
    if (error.response) {
      console.log(`Resposta de erro: ${JSON.stringify(error.response)}`);
    }
    return false;
  }
}

async function testAllModels() {
  console.log('🧪 Iniciando teste de function calling com Mistral AI...');
  
  // Lista de modelos para testar
  const models = [
    'mistral-tiny',
    'mistral-small',
    // 'mistral-medium',  // Comentado porque suspeitamos que este esteja causando o erro 500
    // 'mistral-large-latest'  // Comentado para evitar consumo desnecessário de tokens
  ];
  
  // Resultado dos testes para cada modelo
  const results: Record<string, boolean> = {};
  
  // Testar cada modelo
  for (const model of models) {
    results[model] = await testMistralWithModel(model);
  }
  
  // Resumo dos resultados
  console.log('\n📊 Resumo dos resultados:');
  console.log('---------------------------------');
  for (const [model, success] of Object.entries(results)) {
    console.log(`${model}: ${success ? '✅ Sucesso' : '❌ Falha'}`);
  }
  console.log('---------------------------------');
}

// Executar todos os testes
testAllModels().catch(console.error);
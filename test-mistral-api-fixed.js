// Teste focado na API Mistral com modelo tiny
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';

async function testMistralAPI() {
  try {
    console.log('🧪 Iniciando teste da API Mistral com modelo tiny');
    
    // Verificar API key
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não configurada');
    }
    
    // Inicializar cliente
    const client = new Mistral({ apiKey });
    console.log('✅ Cliente Mistral inicializado com sucesso');
    
    // TESTE 1: Consulta simples de chat
    console.log('\n🔍 Teste 1: Chat básico com modelo tiny');
    const chatResponse = await client.chat.complete({
      model: 'mistral-tiny',
      messages: [
        { role: 'system', content: 'Você é um assistente útil para gerenciamento de propriedades.' },
        { role: 'user', content: 'Liste 3 dicas para gerenciar reservas de aluguéis de temporada.' }
      ],
      temperature: 0.7,
      maxTokens: 500
    });
    
    console.log('📋 Resposta de chat:');
    console.log('-'.repeat(50));
    console.log(chatResponse.choices[0].message.content);
    console.log('-'.repeat(50));
    
    // TESTE 2: Function calling com modelo tiny
    console.log('\n🔍 Teste 2: Function calling com modelo tiny');
    const functionResponse = await client.chat.complete({
      model: 'mistral-tiny',
      messages: [
        { 
          role: 'system', 
          content: 'Você é um assistente especializado em extrair dados de reservas.' 
        },
        { 
          role: 'user', 
          content: 'Extraia dados desta reserva: Nome do hóspede: Maria Silva, Check-in: 15/04/2025, Check-out: 20/04/2025, Propriedade: Apartamento Central, Valor: R$1500' 
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'extractReservationData',
            description: 'Extrair dados da reserva do texto',
            parameters: {
              type: 'object',
              properties: {
                guestName: {
                  type: 'string',
                  description: 'Nome do hóspede'
                },
                propertyName: {
                  type: 'string',
                  description: 'Nome da propriedade'
                },
                checkInDate: {
                  type: 'string',
                  description: 'Data de check-in no formato YYYY-MM-DD'
                },
                checkOutDate: {
                  type: 'string',
                  description: 'Data de check-out no formato YYYY-MM-DD'
                },
                totalAmount: {
                  type: 'number',
                  description: 'Valor total da reserva'
                }
              },
              required: ['guestName', 'propertyName', 'checkInDate', 'checkOutDate']
            }
          }
        }
      ],
      toolChoice: { 
        type: 'function', 
        function: { name: 'extractReservationData' } 
      },
      temperature: 0.1,
      maxTokens: 1000
    });
    
    if (functionResponse.choices && 
        functionResponse.choices[0] && 
        functionResponse.choices[0].message && 
        functionResponse.choices[0].message.toolCalls && 
        functionResponse.choices[0].message.toolCalls.length > 0) {
      
      const toolCall = functionResponse.choices[0].message.toolCalls[0];
      
      if (toolCall.function && toolCall.function.arguments) {
        console.log('📋 Dados extraídos com function calling:');
        console.log('-'.repeat(50));
        console.log(JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2));
        console.log('-'.repeat(50));
      } else {
        console.log('❌ Resposta não contém arguments');
      }
    } else {
      console.log('❌ Resposta não contém toolCalls');
    }
    
    // TESTE 3: Resposta em formato JSON
    console.log('\n🔍 Teste 3: Solicitando resposta em formato JSON');
    const jsonResponse = await client.chat.complete({
      model: 'mistral-tiny',
      messages: [
        { 
          role: 'system', 
          content: 'Você é um assistente que responde em formato JSON.' 
        },
        { 
          role: 'user', 
          content: 'Forneça informações básicas sobre 3 plataformas populares de aluguel de temporada em formato JSON.' 
        }
      ],
      temperature: 0.7,
      maxTokens: 800,
      responseFormat: { type: 'json_object' }
    });
    
    console.log('📋 Resposta JSON:');
    console.log('-'.repeat(50));
    console.log(jsonResponse.choices[0].message.content);
    console.log('-'.repeat(50));
    
    console.log('\n✅ Todos os testes concluídos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar teste
testMistralAPI();
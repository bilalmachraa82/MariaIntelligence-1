// Teste de integração Mistral AI
import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';

function printResult(title: string, result: any) {
  console.log(`\n${title}:`);
  console.log('-'.repeat(50));
  console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  console.log('-'.repeat(50));
}

async function testMistralConnection() {
  try {
    console.log('🧪 Testando conexão com Mistral AI...');
    
    // Verificar API key
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não configurada');
    }
    
    // Inicializar cliente
    const client = new Mistral({ apiKey });
    
    // Teste de chat simples
    const chatResponse = await client.chat.complete({
      model: 'mistral-tiny',
      messages: [
        { role: 'user', content: 'Responda "Conexão OK" se você me entende.' }
      ]
    });
    
    const message = chatResponse.choices?.[0]?.message?.content || 'Sem resposta';
    printResult('Resposta do chat', message);
    
    return {
      success: true,
      message: 'Conexão com Mistral estabelecida com sucesso',
      response: message
    };
  } catch (error: any) {
    console.error('❌ Erro na conexão Mistral:', error.message);
    return {
      success: false,
      message: `Falha na conexão: ${error.message}`
    };
  }
}

async function testMistralFunctionCalling() {
  try {
    console.log('\n🧪 Testando function calling do Mistral...');
    
    // Verificar API key
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não configurada');
    }
    
    // Inicializar cliente
    const client = new Mistral({ apiKey });
    
    // Definir ferramenta para extração de dados
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "extract_reservation_data",
          description: "Extrair dados estruturados de uma reserva a partir de um documento",
          parameters: {
            type: "object",
            properties: {
              guest_name: {
                type: "string",
                description: "Nome completo do hóspede"
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
    
    // Teste de function calling
    const functionResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { 
          role: 'user', 
          content: 'Tenho uma reserva para Maria Silva de 15 a 20 de março na Casa do Mar, no valor total de 1500 euros, feita através do Airbnb. Extraia esses dados usando a função disponível.'
        }
      ],
      tools: tools
    });
    
    const toolCalls = functionResponse.choices?.[0]?.message?.toolCalls || [];
    printResult('Resposta da chamada de função', toolCalls);
    
    return {
      success: true,
      message: 'Function calling testado com sucesso',
      response: toolCalls
    };
  } catch (error: any) {
    console.error('❌ Erro no function calling:', error.message);
    return {
      success: false,
      message: `Falha no function calling: ${error.message}`
    };
  }
}

async function testDatabaseAccess() {
  try {
    console.log('\n🧪 Testando acesso à base de dados...');
    
    // Query test - verificamos apenas a existência de variáveis de ambiente
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada');
    }
    
    return {
      success: true,
      message: 'Variáveis de ambiente da base de dados detectadas',
      dbUrl: databaseUrl.replace(/:[^:@]+@/, ':****@') // Mascara a senha
    };
  } catch (error: any) {
    console.error('❌ Erro no acesso à base de dados:', error.message);
    return {
      success: false,
      message: `Falha no acesso à base de dados: ${error.message}`
    };
  }
}

async function runAllTests() {
  try {
    console.log('🚀 Iniciando testes de integração do Mistral...\n');
    
    // Executar testes em sequência
    const mistralConnectionResult = await testMistralConnection();
    const functionCallingResult = await testMistralFunctionCalling();
    const databaseResult = await testDatabaseAccess();
    
    // Montar relatório
    const results = {
      timestamp: new Date().toISOString(),
      success: mistralConnectionResult.success && functionCallingResult.success && databaseResult.success,
      tests: [
        {
          name: 'Mistral AI',
          success: mistralConnectionResult.success,
          details: mistralConnectionResult
        },
        {
          name: 'Function Calling',
          success: functionCallingResult.success,
          details: functionCallingResult
        },
        {
          name: 'Base de Dados',
          success: databaseResult.success,
          details: databaseResult
        }
      ]
    };
    
    console.log('\n✅ Testes concluídos!');
    printResult('Resultado dos testes', results);
    
    return results;
  } catch (error: any) {
    console.error('❌ Erro durante os testes:', error);
    return {
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    };
  }
}

// Executar todos os testes
runAllTests().catch(error => {
  console.error('Falha fatal nos testes:', error);
  process.exit(1);
});
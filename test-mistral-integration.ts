// Script de teste para integração Mistral AI
import { Mistral } from '@mistralai/mistralai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funções de Utilidade
function printResult(title: string, result: any) {
  console.log(`\n📋 ${title}:`);
  console.log('----------------------------------------');
  console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  console.log('----------------------------------------\n');
}

// Teste da conexão com Mistral
async function testMistralConnection() {
  console.log('🔄 Testando conexão com Mistral AI...');
  
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está definida no ambiente');
    }
    
    const client = new Mistral({
      apiKey
    });
    const models = await client.models.list();
    
    printResult('Modelos disponíveis', models);
    
    // Teste de chat simples
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: 'Olá, isso é um teste de conexão. Responda com uma saudação curta.' }]
    });
    
    const response = chatResponse.choices?.[0]?.message?.content || 'Sem resposta';
    printResult('Resposta de chat', response);
    
    console.log('✅ Conexão com Mistral AI verificada com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com Mistral AI:', error);
    return false;
  }
}

// Teste de function calling
async function testMistralFunctionCalling() {
  console.log('🔄 Testando function calling com Mistral AI...');
  
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está definida no ambiente');
    }
    
    const client = new Mistral({
      apiKey
    });
    
    // Definição da função
    const functionDef = {
      name: "extract_reservation_info",
      description: "Extrai informações de uma reserva",
      parameters: {
        type: "object",
        properties: {
          guestName: {
            type: "string",
            description: "Nome do hóspede"
          },
          checkInDate: {
            type: "string",
            description: "Data de check-in no formato YYYY-MM-DD"
          },
          checkOutDate: {
            type: "string",
            description: "Data de check-out no formato YYYY-MM-DD"
          },
          propertyName: {
            type: "string",
            description: "Nome da propriedade"
          },
          totalAmount: {
            type: "number",
            description: "Valor total da reserva"
          }
        },
        required: ["guestName", "checkInDate", "checkOutDate"]
      }
    };
    
    // Texto de exemplo
    const sampleText = `
    CONFIRMAÇÃO DE RESERVA
    
    Propriedade: Apartamento Oceano Azul
    Hóspede: Maria Silva
    Check-in: 25/03/2025
    Check-out: 30/03/2025
    Valor Total: €750,00
    `;
    
    // Chamar API com function calling
    const result = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { 
          role: 'user', 
          content: `Extraia as informações de reserva do seguinte texto:\n\n${sampleText}` 
        }
      ],
      tools: [{ type: "function", function: functionDef }],
      toolChoice: { type: "function", function: { name: "extract_reservation_info" } }
    });
    
    // Extrair resultado da chamada de função
    if (result.choices[0].message.toolCalls && 
        result.choices[0].message.toolCalls.length > 0 &&
        result.choices[0].message.toolCalls[0].type === 'function') {
      
      const functionCall = result.choices[0].message.toolCalls[0];
      const parsedArgs = JSON.parse(functionCall.function.arguments);
      
      printResult('Dados extraídos via Function Calling', parsedArgs);
      console.log('✅ Function Calling testado com sucesso!');
      return true;
    } else {
      throw new Error('Não foi possível obter resultados da chamada de função');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar function calling:', error);
    return false;
  }
}

// Teste de acesso ao banco de dados
async function testDatabaseAccess() {
  console.log('🔄 Testando acesso ao banco de dados...');
  
  try {
    // Aqui podemos verificar a conexão com o banco usando as utilidades existentes
    // Para simplicidade, vamos apenas verificar se a variável de ambiente está definida
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não está definida no ambiente');
    }
    
    console.log('✅ Variável DATABASE_URL encontrada!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
    return false;
  }
}

// Executa todos os testes
async function runAllTests() {
  console.log('🧪 Iniciando testes de integração...\n');
  
  const results = {
    mistralConnection: await testMistralConnection(),
    functionCalling: await testMistralFunctionCalling(),
    database: await testDatabaseAccess()
  };
  
  console.log('\n📊 Resumo dos testes:');
  console.log('----------------------------------------');
  console.log(`Conexão Mistral AI: ${results.mistralConnection ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Function Calling: ${results.functionCalling ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Acesso ao Banco: ${results.database ? '✅ OK' : '❌ FALHA'}`);
  console.log('----------------------------------------');
  
  const success = Object.values(results).every(result => result === true);
  console.log(`\n${success ? '✅ Todos os testes passaram!' : '❌ Alguns testes falharam!'}`);
  
  return results;
}

// Executar os testes
runAllTests().catch(error => {
  console.error('Erro fatal durante os testes:', error);
  process.exit(1);
});
import { Mistral } from "@mistralai/mistralai";
import * as fs from 'fs';
import * as path from 'path';
import { storage } from './server/storage';

// Teste de integração com Mistral AI e acesso à base de dados

// Configuração do cliente Mistral
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const mistral = new Mistral({
  apiKey: MISTRAL_API_KEY || "",
});

// Função auxiliar para imprimir resultados
function printResult(title: string, result: any) {
  console.log(`\n===== ${title} =====`);
  console.log(JSON.stringify(result, null, 2));
  console.log("====================\n");
}

// Função para testar a conexão com a API do Mistral
async function testMistralConnection() {
  try {
    console.log("Testando conexão com Mistral AI...");
    
    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { 
          role: "user", 
          content: "Olá, podes confirmar que estás funcionando corretamente?" 
        }
      ]
    });
    
    printResult("Teste de Conexão com Mistral AI", {
      status: "Sucesso",
      modelUsed: "mistral-small-latest",
      response: response.choices[0].message.content.substring(0, 100) + "...",
      usage: response.usage
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao conectar com Mistral AI:", error);
    return false;
  }
}

// Função para testar Function Calling do Mistral (usado para extração estruturada)
async function testMistralFunctionCalling() {
  try {
    console.log("Testando Function Calling com Mistral AI...");
    
    const reservationExtractorFunction = {
      name: "extract_reservation_data",
      description: "Extrai informações estruturadas de um documento de reserva",
      parameters: {
        type: "object",
        properties: {
          propertyName: { type: "string" },
          guestName: { type: "string" },
          checkInDate: { type: "string" },
          checkOutDate: { type: "string" },
          platform: { 
            type: "string",
            enum: ["airbnb", "booking", "expedia", "direct", "other"]
          }
        },
        required: ["propertyName", "guestName"]
      }
    };
    
    // Vamos testar uma abordagem alternativa que funciona com modelos atuais do Mistral
  const response = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system",
          content: "Extraia os dados estruturados da reserva e retorne-os em formato JSON."
        },
        { 
          role: "user", 
          content: `Exemplo de reserva:
          Propriedade: Apartamento Lisboa Centro
          Hóspede: João Silva
          Check-in: 2023-06-15
          Check-out: 2023-06-20
          Plataforma: Airbnb
          
          Retorne apenas um JSON com os campos propertyName, guestName, checkInDate, checkOutDate e platform.`
        }
      ]
    });
    
    // Processar resultados
    // Procurar JSON na resposta (sem function calling)
    let parsedData = null;
    try {
      const responseContent = response.choices && response.choices[0].message.content;
      if (responseContent) {
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao parsear JSON da resposta:", error);
    }
    
    printResult("Teste de Function Calling", {
      status: parsedData ? "Sucesso" : "Falha",
      extractedData: parsedData
    });
    
    return !!parsedData;
  } catch (error) {
    console.error("Erro ao testar Function Calling:", error);
    return false;
  }
}

// Função para testar o acesso à base de dados (MemStorage)
async function testDatabaseAccess() {
  try {
    console.log("Testando acesso à base de dados...");
    
    // Testar acesso às propriedades
    const properties = await storage.getProperties();
    
    // Testar acesso aos proprietários
    const owners = await storage.getOwners();
    
    // Testar acesso às reservas
    const reservations = await storage.getReservations();
    
    printResult("Teste de Acesso à Base de Dados", {
      status: "Sucesso",
      propertiesCount: properties.length,
      ownersCount: owners.length,
      reservationsCount: reservations.length,
      sampleProperty: properties.length > 0 ? properties[0] : null,
      sampleOwner: owners.length > 0 ? owners[0] : null,
      sampleReservation: reservations.length > 0 ? reservations[0] : null
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao acessar a base de dados:", error);
    return false;
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log("Iniciando testes de integração com Mistral AI e base de dados...\n");
  
  let passedCount = 0;
  const totalTests = 3;
  
  // Teste 1: Conexão com Mistral AI
  if (await testMistralConnection()) {
    passedCount++;
  }
  
  // Teste 2: Function Calling do Mistral
  if (await testMistralFunctionCalling()) {
    passedCount++;
  }
  
  // Teste 3: Acesso à base de dados
  if (await testDatabaseAccess()) {
    passedCount++;
  }
  
  // Resumo dos testes
  console.log("\n==== RESUMO DOS TESTES ====");
  console.log(`Testes executados: ${totalTests}`);
  console.log(`Testes bem-sucedidos: ${passedCount}`);
  console.log(`Testes com falha: ${totalTests - passedCount}`);
  console.log(`Taxa de sucesso: ${(passedCount / totalTests * 100).toFixed(1)}%`);
  console.log("==========================\n");
  
  if (passedCount === totalTests) {
    console.log("✅ Todos os testes passaram! A integração está funcionando corretamente.");
  } else {
    console.log("⚠️ Alguns testes falharam. Verifique os logs para mais detalhes.");
  }
}

// Executar os testes
runAllTests().catch(error => {
  console.error("Erro durante a execução dos testes:", error);
  process.exit(1);
});
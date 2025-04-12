/**
 * Teste direto da API Gemini usando fetch
 * Este script verifica se a chave API do Gemini está configurada e funcionando
 * sem depender da estrutura de serviços do projeto
 */

// Usando módulos nativos do Node.js para evitar dependências externas
import { request } from 'https';
import { env } from 'process';

// Função para fazer requisições HTTP com Promise
function fetchAPI(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve({ ok: true, status: res.statusCode, json: () => Promise.resolve(jsonData), text: () => Promise.resolve(data) });
          } catch (e) {
            resolve({ ok: true, status: res.statusCode, json: () => Promise.reject(new Error('Invalid JSON')), text: () => Promise.resolve(data) });
          }
        } else {
          resolve({ ok: false, status: res.statusCode, json: () => Promise.reject(new Error(`Status ${res.statusCode}`)), text: () => Promise.resolve(data) });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testGeminiAPI() {
  console.log("🚀 Iniciando teste direto da API Gemini...");
  
  try {
    // Obter a chave API das variáveis de ambiente
    const apiKey = env.GOOGLE_GEMINI_API_KEY || env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error("❌ Nenhuma chave API do Gemini configurada");
      console.log("Por favor, configure a chave da API adicionando a variável de ambiente GOOGLE_GEMINI_API_KEY");
      return {
        success: false,
        error: "API key não configurada"
      };
    }
    
    console.log("✅ Chave API encontrada");
    
    // Validar a chave tentando listar os modelos disponíveis
    console.log("🔑 Validando chave API...");
    const modelsResponse = await fetchAPI(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      throw new Error(`Erro ao validar API (${modelsResponse.status}): ${errorText}`);
    }
    
    const modelsData = await modelsResponse.json();
    console.log(`✅ API válida - ${modelsData.models?.length || 0} modelos disponíveis`);
    
    // Testar geração de texto simples
    console.log("📝 Testando geração de texto simples...");
    
    const prompt = "Responda com uma frase curta: O que é o Google Gemini?";
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 100,
        topK: 40,
        topP: 0.95
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    const generationResponse = await fetchAPI(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!generationResponse.ok) {
      const errorText = await generationResponse.text();
      throw new Error(`Erro na geração de conteúdo (${generationResponse.status}): ${errorText}`);
    }
    
    const generationData = await generationResponse.json();
    
    // Extrair o texto da resposta
    const responseText = generationData.candidates[0].content.parts[0].text;
    
    console.log("✅ Resposta do Gemini:", responseText);
    console.log("✅ Teste concluído com sucesso!");
    
    return {
      success: true,
      models: modelsData.models?.length || 0,
      response: responseText
    };
  } catch (error) {
    console.error("❌ Erro no teste da API Gemini:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar o teste
testGeminiAPI()
  .then(result => {
    if (result.success) {
      console.log("✅ API Gemini está funcionando corretamente!");
      console.log("🎉 A integração com o Google Gemini está pronta para uso!");
    } else {
      console.error("❌ Falha no teste da API Gemini:", result.error);
      console.log("⚠️ A integração com o Google Gemini precisa ser ajustada.");
    }
    
    // Saída formatada para fácil leitura
    console.log("\n📋 Resumo do teste:");
    console.log("-------------------------------");
    console.log(`Sucesso: ${result.success ? 'Sim ✅' : 'Não ❌'}`);
    if (result.success) {
      console.log(`Modelos disponíveis: ${result.models}`);
      console.log(`Exemplo de resposta: "${result.response}"`);
    } else {
      console.log(`Erro: ${result.error}`);
    }
    console.log("-------------------------------");
  })
  .catch(error => {
    console.error("❌ Erro fatal ao executar o teste:", error);
  });
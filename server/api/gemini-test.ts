import { Request, Response } from 'express';

// Função para testar a integração com Google Gemini AI
export async function testGeminiIntegration(req: Request, res: Response) {
  try {
    // Verificar se a chave API está disponível
    const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not found in environment variables',
        tests: []
      });
    }
    
    // Array para armazenar resultados dos testes
    const testResults = [];
    
    // Teste 1: Conexão básica e listagem de modelos
    try {
      console.log("Testing basic connectivity with model list...");
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
      
      if (!modelsResponse.ok) {
        throw new Error(`API returned ${modelsResponse.status}: ${modelsResponse.statusText}`);
      }
      
      const modelsData = await modelsResponse.json();
      
      const basicResult = {
        name: "Conexão Básica",
        success: true,
        response: `Modelos disponíveis: ${modelsData?.models?.length || 0}`,
        models: modelsData?.models?.map((model: any) => model.name) || [],
        error: null
      };
      
      testResults.push(basicResult);
      console.log("Basic connectivity test passed");
    } catch (error: any) {
      testResults.push({
        name: "Conexão Básica",
        success: false,
        response: null,
        error: error.message || "Unknown error"
      });
      console.error("Basic connectivity test failed:", error);
    }
    
    // Teste 2: Geração de texto simples
    try {
      console.log("Testing text generation capability...");
      
      // Configura a solicitação para geração de texto
      const requestBody = {
        contents: [
          {
            parts: [
              { text: "Responda apenas com 'OK' para confirmar que a conexão está funcionando." }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 10
        }
      };
      
      const generationResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      if (!generationResponse.ok) {
        throw new Error(`API returned ${generationResponse.status}: ${generationResponse.statusText}`);
      }
      
      const generationData = await generationResponse.json();
      
      // Extrair o texto gerado
      const generatedText = generationData?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      
      testResults.push({
        name: "Geração de Texto",
        success: true,
        response: generatedText,
        error: null
      });
      
      console.log("Text generation test passed");
    } catch (error: any) {
      testResults.push({
        name: "Geração de Texto",
        success: false,
        response: null,
        error: error.message || "Unknown error"
      });
      console.error("Text generation test failed:", error);
    }
    
    // Enviar resposta após todos os testes
    return res.json({
      success: testResults.every(test => test.success),
      tests: testResults
    });
    
  } catch (error: any) {
    console.error("Error in Gemini integration test:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unknown error occurred",
      tests: []
    });
  }
}
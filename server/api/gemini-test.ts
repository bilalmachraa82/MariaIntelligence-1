import { Request, Response } from 'express';

// Função para testar a integração com Google Gemini API
export async function testGeminiIntegration(req: Request, res: Response) {
  try {
    // Verificar se a chave API está disponível
    const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Google Gemini API key not found in environment variables',
        tests: []
      });
    }
    
    // Array para armazenar resultados dos testes
    const testResults = [];
    
    // Teste 1: Listar modelos disponíveis
    try {
      console.log("Testing Gemini API connectivity...");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const modelsResult = {
        name: "Listar Modelos",
        success: true,
        response: `${data.models?.length || 0} modelos disponíveis`,
        models: data.models?.map((model: any) => model.name) || [],
        error: null
      };
      
      testResults.push(modelsResult);
      console.log("Models listing test passed");
    } catch (error: any) {
      testResults.push({
        name: "Listar Modelos",
        success: false,
        response: null,
        error: error.message || "Unknown error"
      });
      console.error("Models listing test failed:", error);
    }
    
    // Teste 2: Geração de texto simples
    try {
      console.log("Testing text generation...");
      
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
          maxOutputTokens: 100
        }
      };
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extrair o texto da resposta
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text';
      
      const generationResult = {
        name: "Geração de Texto",
        success: true,
        response: responseText,
        error: null
      };
      
      testResults.push(generationResult);
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
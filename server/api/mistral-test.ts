import { Request, Response } from 'express';
import { Mistral } from "@mistralai/mistralai";

// Função para testar a integração com Mistral AI
export async function testMistralIntegration(req: Request, res: Response) {
  try {
    // Verificar se a chave API está disponível
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
    
    if (!MISTRAL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Mistral API key not found in environment variables',
        tests: []
      });
    }
    
    // Configurar cliente Mistral
    const mistral = new Mistral({
      apiKey: MISTRAL_API_KEY
    });
    
    // Array para armazenar resultados dos testes
    const testResults = [];
    
    // Teste 1: Conexão básica
    try {
      console.log("Testing basic connectivity...");
      const basicResponse = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
          { role: "user", content: "Responda apenas com 'OK' para confirmar que a conexão está funcionando." }
        ]
      });
      
      const basicResult = {
        name: "Conexão Básica",
        success: true,
        response: basicResponse.choices[0].message.content,
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
    
    // Enviar resposta após todos os testes
    return res.json({
      success: testResults.every(test => test.success),
      tests: testResults
    });
    
  } catch (error: any) {
    console.error("Error in Mistral integration test:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unknown error occurred",
      tests: []
    });
  }
}
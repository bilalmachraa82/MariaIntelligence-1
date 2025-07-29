/**
 * Verificar de forma síncrona se a chave da API Google Gemini está configurada
 * @returns True se a chave estiver disponível nas variáveis de ambiente
 */
export function hasGeminiApiKey(): boolean {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return apiKey !== undefined && apiKey !== '';
}

/**
 * Verificar se a chave da API Google Gemini está configurada e é válida
 * @returns True se a chave estiver disponível e válida
 */
export async function checkGeminiApiKey(): Promise<boolean> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  // Verificar se a variável de ambiente está definida
  if (!apiKey) {
    console.log("Chave da API Gemini não está configurada nas variáveis de ambiente");
    return false;
  }
  
  try {
    // Fazer uma chamada de teste básica à API Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    if (!response.ok) {
      console.error(`Erro na API Gemini: ${response.status} - ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    
    // Verificar se a resposta contém modelos
    if (data && data.models && data.models.length > 0) {
      console.log(`✅ API Gemini válida - ${data.models.length} modelos disponíveis`);
      return true;
    } else {
      console.error("Resposta da API Gemini não contém modelos");
      return false;
    }
  } catch (error) {
    console.error("Erro ao verificar a chave da API Gemini:", error);
    return false;
  }
}
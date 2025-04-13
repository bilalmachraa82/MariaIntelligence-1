/**
 * Verificar se a chave da API Gemini está configurada e é válida
 * @returns True se a chave estiver disponível e válida
 */
export async function checkGeminiApiKey(): Promise<boolean> {
  // Verificar tanto GOOGLE_GEMINI_API_KEY quanto GOOGLE_API_KEY para compatibilidade
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  // Verificar se a variável de ambiente está definida
  if (!apiKey) {
    console.log("Chave da API Gemini não está configurada nas variáveis de ambiente");
    return false;
  }
  
  try {
    // Fazer uma chamada de teste básica
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    // Verificar se a resposta é válida
    if (response.ok) {
      const data = await response.json();
      if (data && data.models && Array.isArray(data.models)) {
        console.log(`✅ API Gemini válida - ${data.models.length} modelos disponíveis`);
        return true;
      } else {
        console.error("Resposta da API Gemini não contém lista de modelos");
        return false;
      }
    } else {
      const errorText = await response.text();
      console.error(`Erro na verificação da API Gemini: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error("Erro ao verificar a chave da API Gemini:", error);
    return false;
  }
}

/**
 * Verificar se a chave da API Gemini está configurada
 * @returns True se a chave estiver disponível
 */
export function hasGeminiApiKey(): boolean {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return !!apiKey && apiKey.trim() !== '';
}
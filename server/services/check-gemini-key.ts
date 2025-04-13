/**
 * Verificar se a chave da API Gemini está configurada e é válida
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
    // Fazer uma chamada de teste para listar modelos disponíveis
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    // Verificar se a resposta é válida
    if (response.ok) {
      const data = await response.json();
      const modelsCount = data?.models?.length || 0;
      console.log(`✅ API Gemini válida - ${modelsCount} modelos disponíveis`);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({ error: { message: "Erro desconhecido" } }));
      console.error(`Erro na API Gemini: ${response.status} - ${errorData?.error?.message || response.statusText}`);
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
  return !!apiKey;
}
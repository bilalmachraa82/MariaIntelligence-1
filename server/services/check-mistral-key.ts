import { Mistral } from "@mistralai/mistralai";

/**
 * Verificar se a chave da API Mistral está configurada e é válida
 * @returns True se a chave estiver disponível e válida
 */
export async function checkMistralApiKey(): Promise<boolean> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  // Verificar se a variável de ambiente está definida
  if (!apiKey) {
    console.log("Chave da API Mistral não está configurada nas variáveis de ambiente");
    return false;
  }
  
  try {
    // Inicializar cliente
    const mistral = new Mistral({
      apiKey
    });
    
    // Fazer uma chamada de teste básica
    const response = await mistral.chat.complete({
      model: "mistral-tiny",
      messages: [
        { role: "user", content: "Teste de conexão com a API" }
      ],
      maxTokens: 5
    });
    
    // Verificar se a resposta é válida
    if (response && response.choices && response.choices.length > 0) {
      console.log("Conexão com a API Mistral verificada com sucesso");
      return true;
    } else {
      console.error("Resposta da API Mistral não contém choices");
      return false;
    }
  } catch (error) {
    console.error("Erro ao verificar a chave da API Mistral:", error);
    return false;
  }
}
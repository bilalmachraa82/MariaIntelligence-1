// Script de teste simples para a API Mistral
import pkg from '@mistralai/mistralai';
const { MistralClient } = pkg;

// Verificar API key
const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
  console.error('MISTRAL_API_KEY não está definida');
  process.exit(1);
}

async function testMistralAPI() {
  try {
    console.log('Iniciando teste simples da API Mistral...');
    
    // Inicializar cliente
    const client = new MistralClient(apiKey);
    
    // Listar modelos disponíveis
    console.log('Obtendo lista de modelos disponíveis...');
    const models = await client.listModels();
    console.log('Modelos disponíveis:');
    console.log(models);
    
    // Fazer uma simples chamada de chat
    console.log('\nTestando chamada simples de chat...');
    const chatResponse = await client.chat({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: 'Olá, pode me ajudar a testar a API Mistral?' }]
    });
    
    console.log('\nResposta do chat:');
    console.log('---------------------------------------------------');
    console.log(chatResponse.choices[0].message.content);
    console.log('---------------------------------------------------');
    
    console.log('\n✅ Teste básico da API Mistral concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao testar API Mistral:', error);
    process.exit(1);
  }
}

// Executar teste
testMistralAPI();
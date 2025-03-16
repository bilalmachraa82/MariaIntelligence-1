// Teste simplificado da API Mistral com processamento de texto
import { Mistral } from '@mistralai/mistralai';

async function testMistralAPI() {
  try {
    console.log('🔄 Iniciando teste básico da API Mistral');
    
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    // Inicializar cliente Mistral
    const client = new Mistral({ apiKey });
    console.log('✅ Cliente Mistral inicializado');
    
    // Testar modelos em sequência
    const models = [
      'mistral-tiny',
      'mistral-small',
      'mistral-medium',
      'mistral-large-latest',
      'mistral-vision-preview'
    ];
    
    // Testar cada modelo
    for (const model of models) {
      console.log(`\n🔍 Testando modelo: ${model}`);
      try {
        const chatResponse = await client.chat.complete({
          model: model,
          messages: [
            { role: 'user', content: 'Responda com "Olá do modelo" e o nome do modelo que você é.' }
          ]
        });
        
        const response = chatResponse.choices?.[0]?.message?.content || 'Sem resposta';
        console.log(`✅ Resposta do ${model}:`);
        console.log('-'.repeat(50));
        console.log(response);
        console.log('-'.repeat(50));
        
      } catch (modelError) {
        console.error(`❌ Erro ao testar ${model}:`, modelError.message);
        console.log('⚠️ Este modelo pode não estar disponível com sua chave atual.');
      }
    }
    
    console.log('\n✅ Testes de modelos concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante testes:', error);
    throw error;
  }
}

// Executar os testes
testMistralAPI().catch(error => {
  console.error('\n❌ Falha nos testes:', error);
  process.exit(1);
});
// Teste para conectividade básica com Mistral AI
import { Mistral } from '@mistralai/mistralai';

// Lista estática de modelos conhecidos para teste
const KNOWN_MODELS = [
  'mistral-tiny',
  'mistral-small',
  'mistral-medium',
  'mistral-large-latest',
  'open-mistral-7b',
  'open-mixtral-8x7b',
  'mistral-embed',
  'mistral-text-embed',
  'mistral-vision-preview',
  'open-mistral-nemo'
];

// Verifica conectividade básica
async function testConnectivity() {
  try {
    console.log('🔄 Testando conectividade com a API Mistral...');
    
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    // Inicializar cliente Mistral
    const client = new Mistral({ apiKey });
    
    // Listar modelos disponíveis (método manual)
    console.log('\n📋 Modelos conhecidos para teste:');
    console.log('----------------------------------------');
    KNOWN_MODELS.forEach(model => console.log(`- ${model}`));
    console.log('----------------------------------------');
    
    // Testar uma chamada simples com o modelo mistral-tiny
    console.log('\n🔄 Testando chamada básica com mistral-tiny...');
    const response = await client.chat.complete({
      model: 'mistral-tiny',
      messages: [
        { role: 'user', content: 'Olá, como você está?' }
      ]
    });
    
    console.log('✅ Chamada básica bem-sucedida!');
    console.log('📋 Resposta:');
    console.log('----------------------------------------');
    console.log(response.choices[0].message.content);
    console.log('----------------------------------------');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conectividade:', error);
    throw error;
  }
}

// Função principal para testar
async function main() {
  try {
    console.log('🧪 Iniciando teste de conectividade com Mistral AI...\n');
    
    await testConnectivity();
    
    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

// Executar o teste
main();
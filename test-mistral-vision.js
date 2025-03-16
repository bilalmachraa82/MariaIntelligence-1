// Teste de recurso Vision do Mistral AI
import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';

async function testMistralVision() {
  try {
    console.log('🧪 Testando recursos Vision do Mistral AI...');
    
    // Verificar API key
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não configurada');
    }
    
    // Inicializar cliente
    const client = new Mistral({ apiKey });
    
    // Verificar modelos disponíveis
    console.log('\n📋 Modelos conhecidos para teste:');
    console.log('-'.repeat(40));
    const models = [
      'mistral-tiny',
      'mistral-small',
      'mistral-medium',
      'mistral-large-latest',
      'open-mistral-7b',
      'open-mixtral-8x7b',
      'mistral-vision-preview'
    ];
    models.forEach(model => console.log(`- ${model}`));
    console.log('-'.repeat(40));
    
    // 1. Teste com modelo de texto padrão
    console.log('\n🔄 Testando chat básico com modelo padrão...');
    try {
      const textResponse = await client.chat.complete({
        model: 'mistral-tiny',
        messages: [
          { role: 'user', content: 'Diga "Modelo básico funcionando corretamente"' }
        ]
      });
      
      console.log('✅ Resposta do modelo básico:');
      console.log('-'.repeat(40));
      console.log(textResponse.choices[0].message.content);
      console.log('-'.repeat(40));
    } catch (error) {
      console.error('❌ Erro no teste básico:', error.message);
    }
    
    // 2. Teste específico do modelo vision
    console.log('\n🔄 Testando modelo vision-preview...');
    try {
      // Carregar uma imagem de teste (pode ser qualquer imagem)
      const imagePath = './generated-icon.png';
      const imageExists = fs.existsSync(imagePath);
      
      if (!imageExists) {
        console.error(`❌ Imagem de teste não encontrada: ${imagePath}`);
        throw new Error('Imagem de teste não encontrada');
      }
      
      // Converter para base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Testar o modelo vision
      const visionResponse = await client.chat.complete({
        model: 'mistral-vision-preview',
        messages: [
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: 'Descreva esta imagem em detalhes.'
              },
              {
                type: 'image_url',
                imageUrl: {
                  url: `data:image/png;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      });
      
      console.log('✅ Resposta do modelo vision:');
      console.log('-'.repeat(40));
      console.log(visionResponse.choices[0].message.content);
      console.log('-'.repeat(40));
      
      return {
        success: true,
        message: 'Testes completados com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro no teste vision:', error.message);
      return {
        success: false,
        message: `Erro no teste vision: ${error.message}`
      };
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return {
      success: false,
      message: `Erro geral: ${error.message}`
    };
  }
}

// Executar o teste
testMistralVision().then(result => {
  console.log('\n📋 Resultado final:', result.success ? '✅ Sucesso' : '❌ Falha');
  if (!result.success) {
    console.log('Mensagem:', result.message);
  }
}).catch(error => {
  console.error('Erro fatal:', error);
});
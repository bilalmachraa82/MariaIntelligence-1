// Teste simplificado da API Mistral com processamento de documentos
import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';

// Converte um arquivo para base64
async function fileToBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

// Testa a conexão com o Mistral AI
async function testMistralAPI() {
  try {
    console.log('🔄 Iniciando teste simplificado da API Mistral');
    
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    // Inicializar cliente Mistral
    const client = new Mistral({ apiKey });
    console.log('✅ Cliente Mistral inicializado');
    
    // 1. TESTE SIMPLES: Verificar conectividade básica
    console.log('\n📋 TESTE 1: Verificando conectividade básica...');
    const chatResponse = await client.chat.complete({
      model: 'mistral-tiny',
      messages: [
        { role: 'user', content: 'Responda apenas "OK" para confirmar que está funcionando.' }
      ]
    });
    
    console.log(`✅ Resposta recebida: "${chatResponse.choices[0].message.content}"`);
    
    // 2. TESTE COM PDF: Processamento de PDF simples (se disponível)
    console.log('\n📋 TESTE 2: Testando processamento de PDF...');
    try {
      const pdfPath = './Check-in Maria faz.pdf';
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(pdfPath)) {
        console.log(`⚠️ Arquivo PDF não encontrado: ${pdfPath}`);
        return;
      }
      
      // Converter o arquivo para base64
      const pdfBase64 = await fileToBase64(pdfPath);
      console.log(`📄 Arquivo convertido para base64 (${Math.round(pdfBase64.length / 1024)} KB)`);
      
      // Tentar processar o PDF com o modelo mistral-vision-preview (suporte multimodal)
      const pdfResponse = await client.chat.complete({
        model: 'mistral-vision-preview',
        messages: [
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: 'Por favor extraia as informações deste documento de check-in. Quero saber: nome do hóspede, datas de check-in e check-out, nome da propriedade, e valor total. Apenas dados, sem explicações.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ]
      });
      
      console.log('✅ Resposta do processamento de PDF recebida!');
      console.log('📋 Dados extraídos:');
      console.log('----------------------------------------');
      console.log(pdfResponse.choices[0].message.content);
      console.log('----------------------------------------');
    } catch (pdfError) {
      console.error('❌ Erro ao processar PDF:', pdfError.message);
      console.log('⚠️ O processamento de PDF pode não estar disponível ou requer outro formato de requisição');
    }
    
    console.log('\n✅ Testes concluídos com sucesso!');
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
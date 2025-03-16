// Teste simplificado de extração de texto de PDF usando pdf-parse e análise simples com Mistral
import fs from 'fs';
import pdfParse from 'pdf-parse';
import fetch from 'node-fetch';

async function testSimplePdfExtraction() {
  try {
    console.log('🔄 Iniciando teste simplificado de PDF');
    
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    console.log('✅ Chave API Mistral configurada');
    
    // Ler arquivo PDF
    const pdfPath = './Check-in Maria faz.pdf';
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Arquivo não encontrado: ${pdfPath}`);
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`📄 PDF lido (${Math.round(pdfBuffer.length / 1024)} KB)`);
    
    // ETAPA 1: Extrair texto usando pdf-parse
    console.log('🔄 Extraindo texto do PDF com pdf-parse...');
    const data = await pdfParse(pdfBuffer);
    
    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do PDF');
    }
    
    console.log(`✅ Texto extraído com sucesso (${data.text.length} caracteres)`);
    console.log('📋 Amostra do texto extraído:');
    console.log('-'.repeat(50));
    console.log(data.text.substring(0, 300) + '...');
    console.log('-'.repeat(50));
    
    // Limitar o texto para menor tamanho
    const limitedText = data.text.substring(0, 1000);
    
    // ETAPA 2: Fazer uma pergunta simples ao Mistral
    console.log('🔄 Enviando texto para análise simples...');
    
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-tiny', // Modelo mais rápido
        messages: [
          {
            role: 'user',
            content: `Qual parece ser o tipo de documento deste texto e quais informações principais ele contém?\n\n${limitedText}`
          }
        ],
        max_tokens: 100
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Mistral: ${response.status} - ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    const answer = result.choices[0].message.content;
    
    console.log('✅ Resposta do Mistral:');
    console.log('-'.repeat(50));
    console.log(answer);
    console.log('-'.repeat(50));
    
    console.log('\n✅ Teste concluído com sucesso!');
    
    return {
      rawText: data.text,
      analysis: answer
    };
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    throw error;
  }
}

// Executar o teste
testSimplePdfExtraction().then(result => {
  console.log('✅ Processo completo finalizado!');
}).catch(error => {
  console.error('\n❌ Falha no teste:', error);
  process.exit(1);
});
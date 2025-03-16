// Teste simples de extração de texto de PDF com Mistral AI
import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';

// Para imitar a conversão de um arquivo para base64
// Normalmente, isso viria de um upload de arquivo
async function fileToBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

async function extractTextFromPDF(pdfBase64) {
  console.log('🔄 Testando extração de texto de PDF com a API Mistral...');
  
  try {
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    // Inicializar cliente Mistral
    const client = new Mistral({ apiKey });
    
    // Criar prompt para extração de texto
    const prompt = `
    Extraia o texto do PDF fornecido.
    Retorne apenas o texto extraído, sem interpretação adicional.
    `;
    
    // Chamar a API com o arquivo em base64 - modelo para processamento de texto de PDF
    const response = await client.chat.complete({
      model: 'mistral-vision-preview',  // Modelo com suporte a PDF
      messages: [
        { 
          role: 'user', 
          content: prompt + "\n\nProcesse o PDF anexado."
        },
        {
          role: 'user',
          content: [
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
    
    // Extrair o texto da resposta
    const extractedText = response.choices[0].message.content;
    console.log('✅ Texto extraído com sucesso!');
    return extractedText;
  } catch (error) {
    console.error('❌ Erro ao extrair texto do PDF:', error);
    throw error;
  }
}

// Função principal para testar
async function main() {
  try {
    console.log('🧪 Iniciando teste de OCR para PDF...\n');
    
    // Caminho para um arquivo PDF de exemplo
    const pdfPath = './Check-in Maria faz.pdf';
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Arquivo não encontrado: ${pdfPath}`);
    }
    
    // Converter o arquivo para base64
    const pdfBase64 = await fileToBase64(pdfPath);
    console.log(`📄 Arquivo convertido para base64 (${Math.round(pdfBase64.length / 1024)} KB)`);
    
    // Extrair texto do PDF
    const extractedText = await extractTextFromPDF(pdfBase64);
    
    // Mostrar os primeiros 500 caracteres do texto extraído
    console.log('\n📋 Amostra do texto extraído:');
    console.log('----------------------------------------');
    console.log(extractedText.substring(0, 500) + '...');
    console.log('----------------------------------------');
    
    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

// Executar o teste
main();
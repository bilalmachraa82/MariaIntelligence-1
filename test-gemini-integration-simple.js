/**
 * Script simples para testar a integração com o Google Gemini
 * Testa a conexão básica e a capacidade de gerar texto
 */

async function testGeminiIntegration() {
  try {
    console.log('🧪 Iniciando teste do adaptador de IA com Gemini...');
    
    // Importar o adaptador de IA diretamente
    const { aiService, AIServiceType } = await import('./server/services/ai-adapter.service.js');
    
    // Definir o serviço como Gemini para testes
    try {
      aiService.setService(AIServiceType.GEMINI);
      console.log('✅ Adaptador configurado para usar Gemini');
    } catch (error) {
      console.log('⚠️ Não foi possível configurar o Gemini:', error.message);
      console.log('ℹ️ Usando o serviço atual:', aiService.getCurrentService());
    }
    
    // Testar a capacidade de análise de texto simples
    const sampleText = `
      Confirmação de Reserva - Booking.com
      
      Propriedade: Apartamento Graça
      Hóspede: João Silva
      Email: joao.silva@email.com
      Check-in: 15-04-2025
      Check-out: 20-04-2025
      Número de hóspedes: 2
      Valor total: 450,00 €
    `;
    
    console.log('🔍 Analisando texto de amostra...');
    const result = await aiService.parseReservationData(sampleText);
    
    console.log('📊 Resultado da análise:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result && result.propertyName) {
      console.log('✅ Adaptador funcionando corretamente com Gemini!');
    } else {
      console.log('⚠️ Resultado inesperado. Verificar implementação do adaptador.');
    }
    
    // Testar processamento de PDF (usando o adaptador)
    console.log('\n🔍 Testando processamento de PDF...');
    const fs = require('fs');
    const path = require('path');
    
    // Verificar se temos um PDF de exemplo
    const pdfPath = './Check-in Maria faz.pdf';
    if (fs.existsSync(pdfPath)) {
      try {
        // Carregar o PDF em base64
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log(`📄 PDF carregado (${Math.round(pdfBuffer.length / 1024)} KB)`);
        
        // Extrair texto do PDF
        console.log('🔍 Extraindo texto do PDF com Gemini...');
        const extractedText = await aiService.extractTextFromPDF(pdfBase64);
        
        console.log(`📝 Texto extraído (${extractedText.length} caracteres)`);
        console.log(extractedText.substring(0, 200) + '...');
        
        // Analisar o texto extraído
        console.log('🔍 Analisando texto extraído para identificar dados de reserva...');
        const extractedData = await aiService.parseReservationData(extractedText);
        
        console.log('📊 Dados extraídos:');
        console.log(JSON.stringify(extractedData, null, 2));
        
        if (extractedData && extractedData.propertyName) {
          console.log('✅ Processamento de PDF com Gemini funcionando corretamente!');
        } else {
          console.log('⚠️ Falha na extração de dados do PDF.');
        }
      } catch (error) {
        console.error('❌ Erro ao processar PDF:', error);
      }
    } else {
      console.log('⚠️ Arquivo PDF de exemplo não encontrado:', pdfPath);
    }
    
    console.log('\n🏁 Teste de integração com Gemini concluído');
    
  } catch (error) {
    console.error('❌ Erro no teste de integração:', error);
  }
}

// Executar o teste
testGeminiIntegration().catch(console.error);
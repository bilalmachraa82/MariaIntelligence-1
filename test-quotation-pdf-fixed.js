/**
 * Script para testar a nova implementação de geração de PDF para orçamentos
 * Usa o novo serviço de PDF dedicado para gerar um documento
 */

// Importando os módulos necessários
import fs from 'fs';
import path from 'path';

async function testQuotationPdfGeneration() {
  console.log("Iniciando teste de geração de PDF com novo serviço");
  
  try {
    // Usar importação dinâmica para carregar o serviço de PDF
    const { pdfService } = await import('./server/services/pdf.service.js');
    
    // Criar dados de teste para o orçamento
    const testQuotation = {
      id: 999,
      clientName: "Cliente Teste",
      clientEmail: "cliente@teste.com",
      clientPhone: "+351 910 000 000",
      propertyType: "Apartamento",
      propertyArea: 120,
      exteriorArea: 25,
      isDuplex: true,
      hasBBQ: true,
      hasGlassGarden: false,
      basePrice: 250.50,
      duplexSurcharge: 50,
      bbqSurcharge: 30,
      exteriorSurcharge: 20,
      glassGardenSurcharge: 0,
      additionalSurcharges: 15,
      totalPrice: 365.50,
      notes: "Este é um teste automatizado para validar a geração de PDF com a nova arquitetura de serviços. O documento deve ser criado corretamente com todas as seções formatadas.",
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias no futuro
    };
    
    console.log("Dados de teste criados:", JSON.stringify(testQuotation, null, 2));
    
    // Gerar o PDF usando o serviço
    console.log("Chamando serviço para gerar PDF...");
    const pdfPath = await pdfService.generateQuotationPdf(testQuotation, testQuotation.id);
    
    console.log("PDF gerado com sucesso em:", pdfPath);
    
    // Verificar se o arquivo foi criado
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      console.log(`Arquivo verificado: ${pdfPath} (${stats.size} bytes)`);
      return {
        success: true,
        message: `PDF gerado com sucesso: ${pdfPath} (${stats.size} bytes)`,
        path: pdfPath
      };
    } else {
      console.error("Arquivo PDF não encontrado após geração");
      return {
        success: false,
        message: "Arquivo PDF não encontrado após geração"
      };
    }
  } catch (error) {
    console.error("Erro durante teste de geração de PDF:", error);
    return {
      success: false,
      message: `Erro: ${error.message}`,
      error: error
    };
  }
}

// Executar o teste
testQuotationPdfGeneration()
  .then(result => {
    console.log("\n===== RESULTADO DO TESTE =====");
    console.log(`Status: ${result.success ? 'SUCESSO ✅' : 'FALHA ❌'}`);
    console.log(`Mensagem: ${result.message}`);
    
    if (result.success) {
      console.log("\nA nova implementação de PDF está funcionando corretamente!");
      console.log("Agora você pode usar o endpoint /api/quotations/:id/pdf para gerar PDFs.");
    } else {
      console.log("\nA implementação precisa ser revisada. Verifique os erros acima.");
    }
    
    process.exit(result.success ? 0 : 1);
  });
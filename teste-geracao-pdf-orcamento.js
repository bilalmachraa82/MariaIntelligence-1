/**
 * Script para testar a geração de PDF de orçamentos
 * Este script testa diretamente a função generateQuotationPdf do PgStorage
 */

// Importar a classe PgStorage
const { PgStorage } = require('./server/db/pg-storage');

async function testarGeracaoPdf() {
  console.log("Iniciando teste de geração de PDF de orçamento...");
  
  try {
    // Criar uma instância de PgStorage
    const storage = new PgStorage();
    
    // ID de teste - podemos usar qualquer número como o método getQuotation retorna um mock
    const idOrcamento = 123;
    
    // Gerar o PDF
    console.log(`Gerando PDF para orçamento #${idOrcamento}...`);
    const pdfPath = await storage.generateQuotationPdf(idOrcamento);
    
    console.log("PDF gerado com sucesso!");
    console.log(`Caminho do arquivo: ${pdfPath}`);
    
    // Verificar se o arquivo foi criado
    const fs = require('fs');
    if (fs.existsSync(pdfPath)) {
      console.log(`Arquivo encontrado em ${pdfPath}`);
      
      // Obter tamanho do arquivo
      const stats = fs.statSync(pdfPath);
      console.log(`Tamanho do arquivo: ${stats.size} bytes`);
    } else {
      console.error(`Arquivo não encontrado em ${pdfPath}`);
    }
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
  }
}

// Executar o teste
testarGeracaoPdf();
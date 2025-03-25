/**
 * Script para testar o acesso direto aos métodos de orçamento no storage
 * Este script verifica se todos os métodos CRUD para orçamentos estão funcionando corretamente
 */

// Usar CommonJS para compatibilidade
const { storage } = require('./server/storage');

// Não são necessárias funções de fallback com CommonJS

// Função principal
async function testQuotationMethods() {
  console.log("=== TESTE DE MÉTODOS DE ORÇAMENTO ===\n");
  
  try {
    // Teste 1: Listar orçamentos
    console.log("[1] Testando storage.getQuotations()");
    
    // Verificar se o método existe
    if (typeof storage.getQuotations !== 'function') {
      console.error("❌ ERRO: Método storage.getQuotations não existe ou não é uma função!");
      return { success: false, error: "Método não implementado" };
    }
    
    const quotations = await storage.getQuotations();
    console.log(`✅ Método getQuotations retornou ${Array.isArray(quotations) ? quotations.length : 'N/A'} orçamentos`);
    
    // Teste 2: Criar orçamento
    console.log("\n[2] Testando storage.createQuotation()");
    
    // Verificar se o método existe
    if (typeof storage.createQuotation !== 'function') {
      console.error("❌ ERRO: Método storage.createQuotation não existe ou não é uma função!");
      return { success: false, error: "Método não implementado" };
    }
    
    // Dados de teste para orçamento
    const testQuotation = {
      clientName: "Cliente Teste",
      clientEmail: "teste@example.com",
      clientPhone: "912345678",
      propertyType: "apartment_t2",
      propertyAddress: "Rua de Teste, 123",
      propertyArea: 75,
      basePrice: "30",
      totalPrice: "90",
      status: "draft"
    };
    
    // Tentar criar o orçamento
    try {
      console.log("Chamando storage.createQuotation com dados:", JSON.stringify(testQuotation, null, 2));
      const newQuotation = await storage.createQuotation(testQuotation);
      console.log(`✅ Orçamento criado com ID: ${newQuotation.id}`);
      
      // Salvar ID para os próximos testes
      const quotationId = newQuotation.id;
      
      // Teste 3: Buscar orçamento por ID
      console.log("\n[3] Testando storage.getQuotation()");
      
      if (typeof storage.getQuotation !== 'function') {
        console.error("❌ ERRO: Método storage.getQuotation não existe ou não é uma função!");
      } else {
        const quotation = await storage.getQuotation(quotationId);
        console.log(`✅ Orçamento recuperado: ${quotation ? JSON.stringify(quotation, null, 2) : 'não encontrado'}`);
      }
      
      // Teste 4: Atualizar orçamento
      console.log("\n[4] Testando storage.updateQuotation()");
      
      if (typeof storage.updateQuotation !== 'function') {
        console.error("❌ ERRO: Método storage.updateQuotation não existe ou não é uma função!");
      } else {
        const updateData = {
          clientName: "Cliente Atualizado",
          totalPrice: "150"
        };
        
        const updatedQuotation = await storage.updateQuotation(quotationId, updateData);
        console.log(`✅ Orçamento atualizado: ${updatedQuotation ? JSON.stringify(updatedQuotation, null, 2) : 'não encontrado'}`);
      }
      
      // Teste 5: Gerar PDF
      console.log("\n[5] Testando storage.generateQuotationPdf()");
      
      if (typeof storage.generateQuotationPdf !== 'function') {
        console.error("❌ ERRO: Método storage.generateQuotationPdf não existe ou não é uma função!");
      } else {
        try {
          const pdfPath = await storage.generateQuotationPdf(quotationId);
          console.log(`✅ PDF gerado em: ${pdfPath}`);
        } catch (error) {
          console.error(`❌ Erro ao gerar PDF: ${error.message}`);
        }
      }
      
      // Teste 6: Excluir orçamento
      console.log("\n[6] Testando storage.deleteQuotation()");
      
      if (typeof storage.deleteQuotation !== 'function') {
        console.error("❌ ERRO: Método storage.deleteQuotation não existe ou não é uma função!");
      } else {
        const deleted = await storage.deleteQuotation(quotationId);
        console.log(`✅ Orçamento excluído: ${deleted ? 'sim' : 'não'}`);
      }
      
      // Teste 7: Verificar se foi realmente excluído
      console.log("\n[7] Verificando exclusão");
      
      if (typeof storage.getQuotation === 'function') {
        const deletedQuotation = await storage.getQuotation(quotationId);
        console.log(`✅ Orçamento após exclusão: ${deletedQuotation ? 'ainda existe' : 'não encontrado (corretamente excluído)'}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Erro ao criar orçamento: ${error.message}`);
      console.error(error.stack);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error("❌ Erro ao executar teste:", error);
    return { success: false, error: error.message };
  }
}

// Executar teste
testQuotationMethods().then(result => {
  console.log("\n=== RESULTADO DO TESTE ===");
  console.log(result.success ? "✅ SUCESSO!" : `❌ FALHA: ${result.error}`);
  console.log("=========================");
}).catch(error => {
  console.error("ERRO FATAL:", error);
});
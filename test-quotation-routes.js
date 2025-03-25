/**
 * Script para testar as rotas de orçamentos após a correção
 * Este script verifica se as rotas da API estão respondendo corretamente
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function testQuotationRoutes() {
  console.log("=== TESTE DE ROTAS DE ORÇAMENTOS ===");
  
  try {
    // Teste 1: Listar orçamentos
    console.log("\n[1] Testando GET /api/quotations");
    const listResponse = await fetch(`${API_BASE_URL}/quotations`);
    
    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error("Resposta completa do erro:", errorText);
      throw new Error(`Erro ao listar orçamentos: ${listResponse.status} ${listResponse.statusText}`);
    }
    
    const listData = await listResponse.json();
    console.log(`Status: ${listResponse.status}`);
    console.log(`Tipo de resposta: ${listResponse.headers.get('content-type')}`);
    console.log(`Sucesso: ${listData.success}`);
    console.log(`Total de orçamentos: ${listData.data ? listData.data.length : 'N/A'}`);
    
    // Teste 2: Criar um orçamento
    console.log("\n[2] Testando POST /api/quotations");
    const newQuotation = {
      customerName: "Cliente de Teste",
      customerEmail: "teste@example.com",
      customerPhone: "123456789",
      propertyType: "apartment",
      description: "Teste de criação de orçamento via API direta",
      services: ["limpeza", "pintura"],
      totalAmount: "1500.00",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias a partir de hoje
      status: "draft"
    };
    
    const createResponse = await fetch(`${API_BASE_URL}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newQuotation)
    });
    
    if (!createResponse.ok) {
      // Se houver erro, vamos exibir detalhes completos
      const errorBody = await createResponse.text();
      console.error("Erro detalhado:");
      console.error(errorBody);
      throw new Error(`Erro ao criar orçamento: ${createResponse.status} ${createResponse.statusText}`);
    }
    
    const createData = await createResponse.json();
    console.log(`Status: ${createResponse.status}`);
    console.log(`Tipo de resposta: ${createResponse.headers.get('content-type')}`);
    console.log(`Sucesso: ${createData.success}`);
    console.log(`ID do orçamento criado: ${createData.data.id}`);
    
    // Armazenar ID para os próximos testes
    const quotationId = createData.data.id;
    
    // Teste 3: Obter orçamento específico
    console.log(`\n[3] Testando GET /api/quotations/${quotationId}`);
    const getResponse = await fetch(`${API_BASE_URL}/quotations/${quotationId}`);
    
    if (!getResponse.ok) {
      throw new Error(`Erro ao buscar orçamento: ${getResponse.status} ${getResponse.statusText}`);
    }
    
    const getData = await getResponse.json();
    console.log(`Status: ${getResponse.status}`);
    console.log(`Tipo de resposta: ${getResponse.headers.get('content-type')}`);
    console.log(`Sucesso: ${getData.success}`);
    console.log(`Nome do cliente: ${getData.data.customerName}`);
    
    // Teste 4: Atualizar orçamento
    console.log(`\n[4] Testando PATCH /api/quotations/${quotationId}`);
    const updateData = {
      customerName: "Cliente Atualizado",
      totalAmount: "2000.00"
    };
    
    const updateResponse = await fetch(`${API_BASE_URL}/quotations/${quotationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Erro ao atualizar orçamento: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log(`Status: ${updateResponse.status}`);
    console.log(`Tipo de resposta: ${updateResponse.headers.get('content-type')}`);
    console.log(`Sucesso: ${updateResult.success}`);
    console.log(`Nome atualizado: ${updateResult.data.customerName}`);
    
    // Teste 5: Gerar PDF do orçamento
    console.log(`\n[5] Testando GET /api/quotations/${quotationId}/pdf?mode=json`);
    const pdfResponse = await fetch(`${API_BASE_URL}/quotations/${quotationId}/pdf?mode=json`);
    
    if (!pdfResponse.ok) {
      throw new Error(`Erro ao gerar PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    const pdfData = await pdfResponse.json();
    console.log(`Status: ${pdfResponse.status}`);
    console.log(`Tipo de resposta: ${pdfResponse.headers.get('content-type')}`);
    console.log(`Sucesso: ${pdfData.success}`);
    console.log(`Caminho do PDF: ${pdfData.pdfPath}`);
    
    // Teste 6: Excluir orçamento (opcional - descomente se quiser testar)
    /*
    console.log(`\n[6] Testando DELETE /api/quotations/${quotationId}`);
    const deleteResponse = await fetch(`${API_BASE_URL}/quotations/${quotationId}`, {
      method: 'DELETE'
    });
    
    if (!deleteResponse.ok) {
      throw new Error(`Erro ao excluir orçamento: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }
    
    const deleteData = await deleteResponse.json();
    console.log(`Status: ${deleteResponse.status}`);
    console.log(`Tipo de resposta: ${deleteResponse.headers.get('content-type')}`);
    console.log(`Sucesso: ${deleteData.success}`);
    */
    
    console.log("\n✅ TODOS OS TESTES FORAM CONCLUÍDOS COM SUCESSO!");
  } catch (error) {
    console.error("\n❌ ERRO DURANTE OS TESTES:");
    console.error(error);
  }
}

// Executar os testes
testQuotationRoutes();
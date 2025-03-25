/**
 * Teste para diagnosticar o problema de envio de orçamentos
 * Este script simula o envio de um orçamento para verificar onde está ocorrendo o erro
 */

import axios from 'axios';
import fs from 'fs';

async function testQuotationSubmit() {
  try {
    console.log('Iniciando teste de envio de orçamento...');
    
    // Dados de teste com tipos exatos conforme esperado pelo schema
    const quotationData = {
      clientName: "Cliente Teste",
      clientEmail: "teste@example.com",
      clientPhone: "123456789",
      propertyType: "apartment_t0t1",
      propertyAddress: "Rua de Teste, 123",
      propertyArea: 50,
      exteriorArea: 0,
      isDuplex: false,
      hasBBQ: false,
      hasGlassGarden: false,
      basePrice: "20",
      duplexSurcharge: "0",
      bbqSurcharge: "0",
      exteriorSurcharge: "0",
      glassGardenSurcharge: "0",
      additionalSurcharges: "0",
      totalPrice: "20",
      notes: "Nota de teste",
      validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      status: "draft"
    };
    
    console.log('Dados a serem enviados:', JSON.stringify(quotationData, null, 2));
    
    // Salvar logs em arquivo para diagnóstico posterior
    fs.writeFileSync('quotation-test-payload.json', JSON.stringify(quotationData, null, 2));
    
    // Primeiro testar o endpoint básico para verificar conexão
    console.log('Testando conexão com o servidor...');
    try {
      const pingResponse = await axios.get('http://localhost:3000/api/enums');
      console.log('Conexão com o servidor OK. Enums disponíveis.');
    } catch (pingError) {
      console.error('Erro de conexão com o servidor:', pingError.message);
      console.error('Verifique se o servidor está rodando na porta 3000.');
      return { success: false, error: pingError };
    }
    
    // Agora enviar requisição para a API
    console.log('Enviando orçamento para o servidor...');
    const response = await axios.post('http://localhost:3000/api/quotations', quotationData);
    
    console.log('Resposta do servidor:', JSON.stringify(response.data, null, 2));
    console.log('Orçamento enviado com sucesso!');
    
    // Salvar resposta em arquivo para diagnóstico posterior
    fs.writeFileSync('quotation-test-response.json', JSON.stringify(response.data, null, 2));
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erro ao enviar orçamento:');
    
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
      
      // Diagnóstico adicional
      if (error.response.data && error.response.data.errors) {
        console.error('Detalhes do erro de validação:');
        console.error(JSON.stringify(error.response.data.errors, null, 2));
      }
      
      // Salvar erro em arquivo para diagnóstico posterior
      fs.writeFileSync('quotation-test-error.json', JSON.stringify({
        status: error.response.status,
        data: error.response.data
      }, null, 2));
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor');
      console.error('É possível que o servidor tenha travado ou a porta esteja incorreta');
    } else {
      // Erro na configuração da requisição
      console.error('Erro:', error.message);
    }
    
    return { success: false, error };
  }
}

// Testa a validação da estrutura de dados
async function testValidationOnly() {
  try {
    console.log('Obtendo configuração de validação do servidor...');
    const validationData = {
      // Teste mínimo para validação
      clientName: "Test Validation", 
      propertyType: "apartment_t0t1",
      propertyArea: 50,
      isDuplex: false,
      hasBBQ: false,
      hasGlassGarden: false,
      basePrice: "20",
      totalPrice: "20",
      status: "draft"
    };
    
    console.log('Teste de validação mínima:', JSON.stringify(validationData, null, 2));
    
    // Enviar para validação
    const response = await axios.post('http://localhost:3000/api/quotations', validationData);
    console.log('Validação bem-sucedida!');
    return true;
  } catch (error) {
    console.error('Falha na validação:');
    if (error.response && error.response.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return false;
  }
}

// Executar os testes
async function runTests() {
  console.log('=== TESTE DE VALIDAÇÃO ===');
  const validationSuccess = await testValidationOnly();
  
  console.log('\n=== TESTE DE ENVIO COMPLETO ===');
  const result = await testQuotationSubmit();
  
  if (result.success) {
    console.log('✅ Teste completo concluído com sucesso');
  } else {
    console.log('❌ Teste completo falhou');
  }
  
  console.log('\nResumo dos testes:');
  console.log(`- Validação: ${validationSuccess ? '✅ Passou' : '❌ Falhou'}`);
  console.log(`- Envio completo: ${result.success ? '✅ Passou' : '❌ Falhou'}`);
}

// Executar os testes como função principal em módulos ES
runTests();
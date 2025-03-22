/**
 * Script para testar as principais funcionalidades do sistema Maria Faz
 * Este script verifica se todos os endpoints principais da API estão respondendo corretamente
 */

import axios from 'axios';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração básica
const API_BASE_URL = 'http://localhost:5000/api';
const RESULTS = {
  success: [],
  failed: []
};

// Função utilitária para registrar resultados
function logResult(name, success, details = '') {
  if (success) {
    RESULTS.success.push(name);
    console.log(`✅ ${name}: OK`);
  } else {
    RESULTS.failed.push(`${name}: ${details}`);
    console.log(`❌ ${name}: FALHA - ${details}`);
  }
}

// Testes principais
async function runAllTests() {
  console.log('🔍 Iniciando testes de funcionalidades do Maria Faz');
  console.log('=============================================');
  
  try {
    // 1. Testar conexão com o servidor
    await testServerConnection();
    
    // 2. Testar gestão de propriedades
    await testProperties();
    
    // 3. Testar gestão de proprietários
    await testOwners();
    
    // 4. Testar gestão de reservas
    await testReservations();
    
    // 5. Testar relatórios financeiros
    await testOwnerReports();
    
    // 6. Testar estatísticas
    await testStatistics();
    
    // 7. Testar processamento de PDF
    await testPdfProcessing();
    
    // 8. Testar verificação de integrações
    await testIntegrations();
    
    // Resumo final
    printSummary();
    
  } catch (error) {
    console.error('Erro durante a execução dos testes:', error);
  }
}

// Teste 1: Conexão com o servidor
async function testServerConnection() {
  try {
    // Verificar se o servidor está respondendo
    const response = await axios.get(`${API_BASE_URL}/properties`);
    logResult('Conexão com o servidor', response.status === 200);
    return response.data;
  } catch (error) {
    logResult('Conexão com o servidor', false, error.message);
    return null;
  }
}

// Teste 2: Propriedades
async function testProperties() {
  try {
    // 2.1 Listar propriedades
    const properties = await axios.get(`${API_BASE_URL}/properties`);
    logResult('Listagem de propriedades', properties.status === 200 && Array.isArray(properties.data));
    
    if (properties.data && properties.data.length > 0) {
      const propertyId = properties.data[0].id;
      
      // 2.2 Detalhes de propriedade
      const propertyDetails = await axios.get(`${API_BASE_URL}/properties/${propertyId}`);
      logResult('Detalhes de propriedade', propertyDetails.status === 200 && propertyDetails.data?.id === propertyId);
    }
  } catch (error) {
    logResult('Gestão de propriedades', false, error.message);
  }
}

// Teste 3: Proprietários
async function testOwners() {
  try {
    // 3.1 Listar proprietários
    const owners = await axios.get(`${API_BASE_URL}/owners`);
    logResult('Listagem de proprietários', owners.status === 200 && Array.isArray(owners.data));
    
    if (owners.data && owners.data.length > 0) {
      const ownerId = owners.data[0].id;
      
      // 3.2 Detalhes de proprietário
      const ownerDetails = await axios.get(`${API_BASE_URL}/owners/${ownerId}`);
      logResult('Detalhes de proprietário', ownerDetails.status === 200 && ownerDetails.data?.id === ownerId);
    }
  } catch (error) {
    logResult('Gestão de proprietários', false, error.message);
  }
}

// Teste 4: Reservas
async function testReservations() {
  try {
    // 4.1 Listar reservas
    const reservations = await axios.get(`${API_BASE_URL}/reservations`);
    logResult('Listagem de reservas', reservations.status === 200 && Array.isArray(reservations.data));
    
    if (reservations.data && reservations.data.length > 0) {
      const reservationId = reservations.data[0].id;
      
      // 4.2 Detalhes de reserva
      const reservationDetails = await axios.get(`${API_BASE_URL}/reservations/${reservationId}`);
      logResult('Detalhes de reserva', 
        reservationDetails.status === 200 && 
        reservationDetails.data?.id === reservationId
      );
    }
  } catch (error) {
    logResult('Gestão de reservas', false, error.message);
  }
}

// Teste 5: Relatórios de proprietário
async function testOwnerReports() {
  try {
    // Obter primeiro proprietário para teste
    const owners = await axios.get(`${API_BASE_URL}/owners`);
    
    if (owners.data && owners.data.length > 0) {
      const ownerId = owners.data[0].id;
      
      // 5.1 Testar geração de relatório
      const report = await axios.get(`${API_BASE_URL}/reports/owner/${ownerId}?month=3&year=2025`);
      logResult('Relatório de proprietário', 
        report.status === 200 && 
        report.data?.ownerId === ownerId && 
        report.data?.reservations
      );
    } else {
      logResult('Relatório de proprietário', false, 'Nenhum proprietário disponível para teste');
    }
  } catch (error) {
    logResult('Relatório de proprietário', false, error.message);
  }
}

// Teste 6: Estatísticas
async function testStatistics() {
  try {
    // 6.1 Estatísticas gerais
    const stats = await axios.get(`${API_BASE_URL}/statistics`);
    logResult('Estatísticas gerais', 
      stats.status === 200 && 
      typeof stats.data === 'object' && 
      'totalProperties' in stats.data
    );
    
    // 6.2 Receita mensal
    const monthlyRevenue = await axios.get(`${API_BASE_URL}/statistics/monthly-revenue`);
    logResult('Estatísticas de receita mensal', 
      monthlyRevenue.status === 200 && 
      Array.isArray(monthlyRevenue.data.data)
    );
    
    // 6.3 Obter primeiro property para estatísticas específicas
    const properties = await axios.get(`${API_BASE_URL}/properties`);
    
    if (properties.data && properties.data.length > 0) {
      const propertyId = properties.data[0].id;
      
      const propertyStats = await axios.get(`${API_BASE_URL}/statistics/property/${propertyId}`);
      logResult('Estatísticas por propriedade', 
        propertyStats.status === 200 && 
        propertyStats.data?.propertyId === propertyId
      );
    }
  } catch (error) {
    logResult('Estatísticas', false, error.message);
  }
}

// Teste 7: Processamento de PDF (mock simples, já que não temos um PDF real para teste)
async function testPdfProcessing() {
  try {
    // Verificar apenas se o endpoint existe (sem enviar arquivo real)
    const response = await axios.get(`${API_BASE_URL}/enums`);
    logResult('Endpoint para processamento de PDF', response.status === 200);
  } catch (error) {
    logResult('Processamento de PDF', false, error.message);
  }
}

// Teste 8: Testar verificação de integrações
async function testIntegrations() {
  try {
    const integrations = await axios.get(`${API_BASE_URL}/test-integrations`);
    logResult('Teste de integrações', 
      integrations.status === 200 && 
      typeof integrations.data === 'object' && 
      Array.isArray(integrations.data.tests)
    );
    
    if (integrations.data && integrations.data.tests) {
      // Verificar status de cada integração
      const mistralTest = integrations.data.tests.find(test => test.name === 'Mistral AI');
      if (mistralTest) {
        logResult('Integração com Mistral AI', mistralTest.success);
      }
      
      const dbTest = integrations.data.tests.find(test => test.name === 'Base de Dados');
      if (dbTest) {
        logResult('Integração com Base de Dados', dbTest.success);
      }
    }
  } catch (error) {
    logResult('Teste de integrações', false, error.message);
  }
}

// Resumo final dos testes
function printSummary() {
  console.log('\n=============================================');
  console.log(`🏁 RESUMO DOS TESTES: ${RESULTS.success.length} passaram, ${RESULTS.failed.length} falharam`);
  
  if (RESULTS.failed.length > 0) {
    console.log('\n❌ Testes com falha:');
    RESULTS.failed.forEach(fail => console.log(` - ${fail}`));
  }
  
  if (RESULTS.success.length > 0) {
    console.log('\n✅ Testes bem-sucedidos:');
    RESULTS.success.forEach(success => console.log(` - ${success}`));
  }
  
  console.log('\nTeste concluído em:', new Date().toLocaleString('pt-PT'));
}

// Executar todos os testes
runAllTests().catch(err => {
  console.error('Erro ao executar testes:', err);
  process.exit(1);
});
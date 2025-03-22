/**
 * Teste detalhado para diagnóstico de endpoints de estatísticas
 * Este script identifica com precisão o que está causando os erros
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testStatisticsEndpoints() {
  console.log('🔍 Teste detalhado dos endpoints de estatísticas');
  console.log('=============================================');
  
  try {
    // 1. Testar endpoint de estatísticas gerais
    console.log('\n1. Testando estatísticas gerais:');
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/statistics`);
      console.log(`✅ Endpoint de estatísticas gerais: status ${statsResponse.status}`);
      console.log(`  Dados: ${JSON.stringify(statsResponse.data).substring(0, 150)}...`);
    } catch (error) {
      console.log(`❌ Erro em estatísticas gerais: ${error.message}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Dados: ${JSON.stringify(error.response.data)}`);
      }
      
      // Testar métodos individuais que compõem estatísticas gerais
      console.log('\n  Testando métodos individuais:');
      
      // Testar total de receita
      try {
        const totalRevenueResponse = await axios.get(`${API_BASE_URL}/test-integrations`);
        const tests = totalRevenueResponse.data.tests || [];
        const dbTest = tests.find(t => t.name === 'Base de Dados');
        console.log(`  - Base de dados está ${dbTest?.success ? '✅ conectada' : '❌ desconectada'}`);
      } catch (err) {
        console.log(`  - Não foi possível testar conexão com o banco: ${err.message}`);
      }
    }
    
    // 2. Testar estatísticas de receita mensal
    console.log('\n2. Testando estatísticas de receita mensal:');
    try {
      const monthlyRevenueResponse = await axios.get(`${API_BASE_URL}/statistics/monthly-revenue`);
      console.log(`✅ Endpoint de receita mensal: status ${monthlyRevenueResponse.status}`);
      console.log(`  Dados: ${JSON.stringify(monthlyRevenueResponse.data).substring(0, 150)}...`);
    } catch (error) {
      console.log(`❌ Erro em receita mensal: ${error.message}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Dados: ${JSON.stringify(error.response.data)}`);
      }
      
      // Testar com diferentes parâmetros
      await testMonthlyRevenueWithParams({});
      await testMonthlyRevenueWithParams({ startDate: '2025-01-01', endDate: '2025-03-31' });
      await testMonthlyRevenueWithParams({ granularity: 'month' });
      await testMonthlyRevenueWithParams({ granularity: 'week' });
    }
    
    // 3. Testar estatísticas por propriedade
    console.log('\n3. Testando estatísticas por propriedade:');
    
    // Obter lista de propriedades primeiro
    try {
      const propertiesResponse = await axios.get(`${API_BASE_URL}/properties`);
      if (propertiesResponse.data && propertiesResponse.data.length > 0) {
        console.log(`  Encontradas ${propertiesResponse.data.length} propriedades`);
        
        // Testar para a primeira propriedade
        const propertyId = propertiesResponse.data[0].id;
        console.log(`  Testando estatísticas para propriedade ID ${propertyId}:`);
        
        try {
          const propertyStatsResponse = await axios.get(`${API_BASE_URL}/statistics/property/${propertyId}`);
          console.log(`  ✅ Estatísticas da propriedade: status ${propertyStatsResponse.status}`);
          console.log(`    Dados: ${JSON.stringify(propertyStatsResponse.data)}`);
        } catch (error) {
          console.log(`  ❌ Erro em estatísticas da propriedade: ${error.message}`);
          if (error.response) {
            console.log(`    Status: ${error.response.status}`);
            console.log(`    Dados: ${JSON.stringify(error.response.data)}`);
          }
          
          // Testar métodos que compõem estatísticas de propriedade
          console.log('    Verificando componentes individuais:');
          
          // Se possível, testar outros endpoints relacionados
          try {
            const reservationsForPropertyResponse = await axios.get(`${API_BASE_URL}/reservations`);
            const reservationsForProperty = reservationsForPropertyResponse.data.filter(r => r.propertyId === propertyId);
            console.log(`    - Existem ${reservationsForProperty.length} reservas para esta propriedade`);
          } catch (err) {
            console.log(`    - Não foi possível verificar reservas: ${err.message}`);
          }
        }
        
        // Testar diferentes propriedades para verificar se o erro é consistente
        for (const property of propertiesResponse.data.slice(1, 3)) { // Testar mais 2 propriedades
          try {
            console.log(`  Testando propriedade alternativa ${property.name} (ID: ${property.id}):`);
            const altPropertyStatsResponse = await axios.get(`${API_BASE_URL}/statistics/property/${property.id}`);
            console.log(`  ✅ Sucesso: status ${altPropertyStatsResponse.status}`);
          } catch (err) {
            console.log(`  ❌ Falha: ${err.message}`);
          }
        }
      } else {
        console.log('  ❌ Não foram encontradas propriedades para testar estatísticas');
      }
    } catch (error) {
      console.log(`  ❌ Não foi possível obter lista de propriedades: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Erro durante os testes:', error);
  }
}

async function testMonthlyRevenueWithParams(params) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value);
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const url = `${API_BASE_URL}/statistics/monthly-revenue${queryString}`;
  
  const paramDesc = Object.keys(params).length 
    ? `${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ')}` 
    : 'sem parâmetros';
  
  console.log(`  - Testando receita mensal com ${paramDesc}`);
  try {
    const response = await axios.get(url);
    console.log(`    ✅ Sucesso (${response.status}): ${url}`);
    return true;
  } catch (error) {
    console.log(`    ❌ Falha (${error.response?.status || 'desconhecido'}): ${url}`);
    if (error.response?.data) {
      console.log(`      Erro: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Executar o teste
testStatisticsEndpoints().catch(console.error);
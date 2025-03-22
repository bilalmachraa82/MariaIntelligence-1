/**
 * Teste detalhado para diagnóstico do endpoint de relatórios de proprietário
 * Este script identifica com precisão o que está causando o erro 500
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testOwnerReport() {
  console.log('🔍 Teste detalhado de relatório por proprietário');
  console.log('=============================================');
  
  try {
    // 1. Obter lista de proprietários
    console.log('1. Obtendo lista de proprietários...');
    const ownersResponse = await axios.get(`${API_BASE_URL}/owners`);
    
    if (!ownersResponse.data || ownersResponse.data.length === 0) {
      console.log('❌ Nenhum proprietário encontrado para testar');
      return;
    }
    
    console.log(`✅ Encontrados ${ownersResponse.data.length} proprietários`);
    
    // 2. Para cada proprietário, testar o relatório
    console.log('\n2. Testando relatório para cada proprietário:');
    
    for (const owner of ownersResponse.data.slice(0, 3)) { // Limitar aos 3 primeiros para não sobrecarregar
      console.log(`\nTestando proprietário: ${owner.name} (ID: ${owner.id})`);
      
      try {
        // Tentar obter o relatório básico
        console.log(`- Tentando obter relatório básico...`);
        const reportResponse = await axios.get(`${API_BASE_URL}/reports/owner/${owner.id}`);
        console.log(`✅ Relatório básico obtido com sucesso: status ${reportResponse.status}`);
        console.log(`  Dados do relatório: ${JSON.stringify(reportResponse.data).substring(0, 150)}...`);
        
        // Testes com parâmetros de data
        console.log(`- Tentando obter relatório com filtro de data...`);
        const reportWithDateResponse = await axios.get(`${API_BASE_URL}/reports/owner/${owner.id}?month=3&year=2025`);
        console.log(`✅ Relatório com filtro de data obtido: status ${reportWithDateResponse.status}`);
      } catch (error) {
        console.log(`❌ Erro ao obter relatório: ${error.message}`);
        
        if (error.response) {
          console.log(`  Status: ${error.response.status}`);
          console.log(`  Dados: ${JSON.stringify(error.response.data)}`);
          
          // Verificar se há stack trace ou mensagem detalhada
          if (error.response.data && error.response.data.error) {
            console.log(`  Erro detalhado: ${error.response.data.error}`);
            if (error.response.data.stack) {
              console.log(`  Stack: ${error.response.data.stack}`);
            }
          }
        }
      }
    }
    
    // 3. Testar diferentes parâmetros para um proprietário específico
    if (ownersResponse.data.length > 0) {
      const testOwnerId = ownersResponse.data[0].id;
      console.log(`\n3. Testando diferentes parâmetros para proprietário ID ${testOwnerId}:`);
      
      // Teste sem parâmetros 
      await testParameterVariation(testOwnerId, {});
      
      // Teste apenas com mês
      await testParameterVariation(testOwnerId, { month: 3 });
      
      // Teste apenas com ano
      await testParameterVariation(testOwnerId, { year: 2025 });
      
      // Teste com mês e ano
      await testParameterVariation(testOwnerId, { month: 3, year: 2025 });
      
      // Teste com mês anterior
      await testParameterVariation(testOwnerId, { month: 2, year: 2025 });
    }
    
  } catch (error) {
    console.error('Erro durante os testes:', error);
  }
}

async function testParameterVariation(ownerId, params) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value);
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const url = `${API_BASE_URL}/reports/owner/${ownerId}${queryString}`;
  
  const paramDesc = Object.keys(params).length 
    ? `${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ')}` 
    : 'sem parâmetros';
  
  console.log(`- Testando com ${paramDesc}...`);
  try {
    const response = await axios.get(url);
    console.log(`✅ Sucesso (${response.status}): ${url}`);
    return true;
  } catch (error) {
    console.log(`❌ Falha (${error.response?.status || 'desconhecido'}): ${url}`);
    if (error.response?.data) {
      console.log(`  Erro: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Executar o teste
testOwnerReport().catch(console.error);
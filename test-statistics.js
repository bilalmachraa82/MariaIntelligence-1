// Arquivo para testar as estatísticas diretamente

import { default as axios } from 'axios';

async function testStatistics() {
  try {
    console.log('Testando estatísticas...');
    
    // Testar estatísticas gerais
    const statsResponse = await axios.get('http://localhost:5000/api/statistics');
    console.log('Estatísticas gerais:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
    // Testar receita mensal
    const monthlyRevenueResponse = await axios.get('http://localhost:5000/api/statistics/monthly-revenue');
    console.log('\nReceita mensal:');
    console.log(JSON.stringify(monthlyRevenueResponse.data, null, 2));
    
    console.log('\nTestes concluídos com sucesso!');
  } catch (error) {
    console.error('Erro ao testar estatísticas:', error.message);
    if (error.response) {
      console.error('Resposta do servidor:', error.response.data);
    }
  }
}

testStatistics();
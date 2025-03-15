// Script de teste para verificar dados de receita mensal com datas diferentes

import axios from 'axios';

async function testMonthlyRevenue() {
  try {
    console.log('Testando endpoint de receita mensal com diferentes períodos...\n');
    
    // Testar sem parâmetros (ano atual inteiro)
    const defaultResponse = await axios.get('http://localhost:3000/api/statistics/monthly-revenue');
    console.log('Resposta padrão (ano atual inteiro):');
    console.log(JSON.stringify(defaultResponse.data, null, 2));
    
    // Testar com período recente (últimos 30 dias)
    const startDateRecent = new Date();
    startDateRecent.setDate(startDateRecent.getDate() - 30);
    
    const endDateRecent = new Date();
    
    const recentResponse = await axios.get('http://localhost:3000/api/statistics/monthly-revenue', {
      params: {
        startDate: startDateRecent.toISOString().split('T')[0],
        endDate: endDateRecent.toISOString().split('T')[0]
      }
    });
    
    console.log('\nResposta com período recente (últimos 30 dias):');
    console.log(`Intervalo: ${startDateRecent.toISOString().split('T')[0]} até ${endDateRecent.toISOString().split('T')[0]}`);
    console.log(JSON.stringify(recentResponse.data, null, 2));
    
    // Testar com mês atual
    const startDateCurrentMonth = new Date();
    startDateCurrentMonth.setDate(1); // Primeiro dia do mês
    
    const endDateCurrentMonth = new Date();
    
    const currentMonthResponse = await axios.get('http://localhost:3000/api/statistics/monthly-revenue', {
      params: {
        startDate: startDateCurrentMonth.toISOString().split('T')[0],
        endDate: endDateCurrentMonth.toISOString().split('T')[0]
      }
    });
    
    console.log('\nResposta com mês atual:');
    console.log(`Intervalo: ${startDateCurrentMonth.toISOString().split('T')[0]} até ${endDateCurrentMonth.toISOString().split('T')[0]}`);
    console.log(JSON.stringify(currentMonthResponse.data, null, 2));
    
    console.log('\nTestes concluídos com sucesso!');
  } catch (error) {
    console.error('Erro ao testar endpoint de receita mensal:', error.message);
    if (error.response) {
      console.error('Resposta do servidor:', error.response.data);
    }
  }
}

testMonthlyRevenue();
/**
 * Teste simples para o endpoint de orçamento
 */
import fetch from 'node-fetch';

async function testBudgetEndpoint() {
  try {
    console.log('Testando endpoint de orçamento...');
    
    const response = await fetch('http://localhost:5000/api/budgets/estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nights: 5,
        nightlyRate: 100
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro na resposta: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Resposta do endpoint:', data);
    
    // Verificar se os valores estão corretos
    if (data.total !== 500) {
      throw new Error(`Total esperado: 500, recebido: ${data.total}`);
    }
    
    if (data.margin !== 50) {
      throw new Error(`Margem esperada: 50, recebida: ${data.margin}`);
    }
    
    console.log('✅ Teste do endpoint de orçamento bem-sucedido!');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testBudgetEndpoint();
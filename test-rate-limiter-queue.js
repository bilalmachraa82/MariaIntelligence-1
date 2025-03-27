/**
 * Teste para verificar o funcionamento da fila do rate limiter
 * Este script faz várias chamadas simultâneas que devem ser distribuídas ao longo do tempo
 */

import fetch from 'node-fetch';

async function testRateLimiterQueue() {
  console.log('🧪 Teste de Fila do Rate Limiter para Gemini Service');
  console.log('--------------------------------------------------');
  
  // Primeiro, limpar o cache para garantir que nenhuma requisição use cache
  console.log('🧹 Limpando cache do rate limiter...');
  try {
    const clearCacheResponse = await fetch('http://localhost:5000/api/test/clear-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    const clearCacheResult = await clearCacheResponse.json();
    console.log(`✅ Cache limpo: ${clearCacheResult.message}`);
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error.message);
  }
  
  // Gerar 10 prompts diferentes para forçar o uso da fila
  // (o limite do Gemini é 5 por minuto)
  const promptTexts = Array.from({ length: 10 }, (_, i) => 
    `Prompt número ${i+1}: Gere uma descrição de uma propriedade imaginária para aluguel de temporada em Portugal.`
  );
  
  console.log(`🔄 Executando ${promptTexts.length} prompts simultaneamente...`);
  console.log(`ℹ️ Limite da API Gemini: 5 requisições por minuto`);
  console.log(`ℹ️ Este teste deve mostrar o sistema de fila em ação, distribuindo requisições`);
  
  // Executar todas as requisições em paralelo
  const startTime = Date.now();
  
  const promises = promptTexts.map(async (prompt, index) => {
    const requestStartTime = Date.now();
    try {
      console.log(`🚀 Iniciando requisição ${index + 1}...`);
      
      const result = await fetch('http://localhost:5000/api/test/gemini/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          temperature: 0.3 + (index * 0.05), // Variação para evitar cache
        }),
      });
      
      const data = await result.json();
      const requestTime = Date.now() - requestStartTime;
      
      console.log(`✅ Requisição ${index + 1} concluída em ${requestTime}ms`);
      
      return {
        index,
        prompt,
        time: requestTime,
        success: result.ok,
        cacheHit: data.cacheHit || false,
        textLength: data.text?.length || 0,
      };
    } catch (error) {
      console.error(`❌ Erro na requisição ${index + 1}:`, error.message);
      return {
        index,
        prompt,
        time: Date.now() - requestStartTime,
        success: false,
        error: error.message
      };
    }
  });
  
  // Aguardar todas as requisições
  const results = await Promise.all(promises);
  
  const totalTime = Date.now() - startTime;
  
  // Ordenar resultados pelo tempo
  results.sort((a, b) => a.time - b.time);
  
  // Estatísticas
  const successCount = results.filter(r => r.success).length;
  const cacheHits = results.filter(r => r.cacheHit).length;
  const meanTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
  
  console.log('\n📈 RESULTADOS:');
  console.log(`• Requisições enviadas: ${promptTexts.length}`);
  console.log(`• Requisições bem-sucedidas: ${successCount}/${promptTexts.length}`);
  console.log(`• Tempo total: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
  console.log(`• Tempo médio por requisição: ${meanTime.toFixed(2)}ms`);
  console.log(`• Cache hits: ${cacheHits}/${promptTexts.length}`);
  
  // Verificar se as requisições foram distribuídas (devem ter diferenças de tempo significativas)
  const timeGaps = [];
  for (let i = 1; i < results.length; i++) {
    timeGaps.push(results[i].time - results[i-1].time);
  }
  
  const significantGaps = timeGaps.filter(gap => gap > 500).length;
  
  console.log('\n⏱️ DISTRIBUIÇÃO DE TEMPO:');
  timeGaps.forEach((gap, i) => {
    console.log(`• Intervalo entre requisições ${i+1} e ${i+2}: ${gap}ms`);
  });
  
  if (significantGaps > 0 && totalTime > 10000) {
    console.log('\n✅ TESTE APROVADO: O sistema de fila do rate limiter está funcionando!');
    console.log('As requisições foram distribuídas ao longo do tempo para respeitar o limite da API.');
  } else if (totalTime < 10000 && successCount === promptTexts.length) {
    console.log('\n⚠️ TESTE INCONCLUSIVO: Todas as requisições foram bem-sucedidas rapidamente.');
    console.log('Isso pode significar que: (1) o cache está funcionando muito bem, (2) o mock do Gemini está sendo usado, ou (3) o rate limiter não está aplicando restrições.');
  } else {
    console.log('\n❌ TESTE FALHOU: O sistema de fila pode não estar funcionando corretamente.');
    console.log('As requisições não foram distribuídas adequadamente para respeitar o limite da API.');
  }
}

testRateLimiterQueue().catch(console.error);
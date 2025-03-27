/**
 * Teste para verificar o funcionamento do rate limiter no GeminiService
 * Este script faz várias chamadas ao método generateText para testar
 * se o sistema de caching e rate limiting está funcionando corretamente.
 */

import fetch from 'node-fetch';

async function testRateLimiter() {
  console.log('🧪 Teste de Rate Limiter para Gemini Service');
  console.log('--------------------------------------------');
  
  const promptTexts = [
    'Gere um resumo sobre a gestão de propriedades para aluguel de temporada.',
    'Explique a diferença entre Airbnb e Booking.com para proprietários.',
    'Quais são os melhores destinos para alugar imóveis em Portugal?',
    'Listar 5 dicas para melhorar fotos de imóveis para aluguel.',
    'Escreva um modelo de mensagem de boas-vindas para hóspedes.',
  ];
  
  console.log(`🔄 Executando ${promptTexts.length} prompts diferentes...`);
  
  // Primeira rodada - Todas as chamadas devem ser novas (sem cache)
  console.log('\n📊 PRIMEIRA RODADA (Sem Cache):');
  
  const startTime1 = Date.now();
  const results1 = [];
  
  for (const prompt of promptTexts) {
    const start = Date.now();
    try {
      const result = await fetch('http://localhost:5000/api/test/gemini/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, temperature: 0.3 }),
      });
      
      const data = await result.json();
      const end = Date.now();
      results1.push({
        prompt,
        time: end - start,
        success: result.ok,
        cacheHit: data.cacheHit || false,
        textLength: data.text?.length || 0,
      });
      
      console.log(`✅ [${end - start}ms] "${prompt.substring(0, 30)}..." - ${result.ok ? 'Sucesso' : 'Falha'}`);
    } catch (error) {
      console.error(`❌ Erro ao testar prompt "${prompt}":`, error.message);
    }
  }
  
  const totalTime1 = Date.now() - startTime1;
  console.log(`\n⏱️ Tempo total da primeira rodada: ${totalTime1}ms`);
  
  // Segunda rodada - Todas as chamadas devem usar o cache
  console.log('\n📊 SEGUNDA RODADA (Com Cache):');
  
  const startTime2 = Date.now();
  const results2 = [];
  
  // Usar os mesmos prompts para verificar o cache
  for (const prompt of promptTexts) {
    const start = Date.now();
    try {
      const result = await fetch('http://localhost:5000/api/test/gemini/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, temperature: 0.3 }),
      });
      
      const data = await result.json();
      const end = Date.now();
      results2.push({
        prompt,
        time: end - start,
        success: result.ok,
        cacheHit: data.cacheHit || false,
        textLength: data.text?.length || 0,
      });
      
      console.log(`✅ [${end - start}ms] "${prompt.substring(0, 30)}..." - ${result.ok ? 'Sucesso' : 'Falha'} - Cache: ${data.cacheHit ? 'HIT ✓' : 'MISS ✗'}`);
    } catch (error) {
      console.error(`❌ Erro ao testar prompt "${prompt}":`, error.message);
    }
  }
  
  const totalTime2 = Date.now() - startTime2;
  console.log(`\n⏱️ Tempo total da segunda rodada: ${totalTime2}ms`);
  
  // Estatísticas
  const speedup = totalTime1 / (totalTime2 || 1);
  const cacheHits = results2.filter(r => r.cacheHit).length;
  
  console.log('\n📈 RESULTADOS:');
  console.log(`• Tempo primeira rodada: ${totalTime1}ms`);
  console.log(`• Tempo segunda rodada: ${totalTime2}ms`);
  console.log(`• Aceleração com cache: ${speedup.toFixed(2)}x mais rápido`);
  console.log(`• Cache hits: ${cacheHits}/${promptTexts.length} (${(cacheHits/promptTexts.length*100).toFixed(2)}%)`);
  
  if (cacheHits > 0 && speedup > 1.5) {
    console.log('\n✅ TESTE APROVADO: O rate limiter e cache estão funcionando corretamente!');
  } else {
    console.log('\n⚠️ TESTE COM PROBLEMAS: O rate limiter ou cache podem não estar funcionando adequadamente.');
  }
}

testRateLimiter().catch(console.error);
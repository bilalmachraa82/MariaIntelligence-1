/**
 * Script para testar o adaptador do Mistral que usa o Gemini internamente
 */

// Usando sintaxe de módulo ES
import fetch from 'node-fetch';

async function testMistralAdapter() {
  try {
    console.log('Testando rota de extração de texto via adaptador Mistral...');
    
    // Primeiro, vamos fazer um teste simples da rota de extração de texto
    const response = await fetch('http://localhost:5000/api/test-integrations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Resposta da API de testes de integração:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Erro ao testar o adaptador Mistral:', error);
    throw error;
  }
}

// Executar o teste
testMistralAdapter()
  .then(() => console.log('Teste concluído com sucesso'))
  .catch(err => console.error('Teste falhou:', err));
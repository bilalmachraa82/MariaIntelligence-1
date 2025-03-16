// Teste de processamento estruturado de PDF usando pdf-parse + Mistral para análise
import fs from 'fs';
import pdfParse from 'pdf-parse';
import fetch from 'node-fetch';

async function testStructuredPdfExtraction() {
  try {
    console.log('🔄 Iniciando teste de extração estruturada de PDF');
    
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    console.log('✅ Chave API Mistral configurada');
    
    // Ler arquivo PDF
    const pdfPath = './Check-in Maria faz.pdf';
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Arquivo não encontrado: ${pdfPath}`);
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`📄 PDF lido (${Math.round(pdfBuffer.length / 1024)} KB)`);
    
    // ETAPA 1: Extrair texto usando pdf-parse
    console.log('🔄 Extraindo texto do PDF com pdf-parse...');
    const data = await pdfParse(pdfBuffer);
    
    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do PDF');
    }
    
    console.log(`✅ Texto extraído com sucesso (${data.text.length} caracteres)`);
    console.log('📋 Amostra do texto extraído:');
    console.log('-'.repeat(50));
    console.log(data.text.substring(0, 300) + '...');
    console.log('-'.repeat(50));
    
    // Salvar texto para referência
    fs.writeFileSync('extracted-text-structured.txt', data.text);
    console.log('📝 Texto completo salvo em: extracted-text-structured.txt');
    
    // Limitar o texto para garantir resposta rápida
    const limitedText = data.text.substring(0, 2000);
    
    // ETAPA 2: Usar um prompt claro com function calling para obter dados estruturados
    console.log('\n🔄 Extraindo dados estruturados...');
    
    // Definir ferramentas para extração de dados
    const tools = [
      {
        type: "function",
        function: {
          name: "extract_reservation_data",
          description: "Extrair dados estruturados de uma reserva a partir do texto",
          parameters: {
            type: "object",
            properties: {
              propertyName: {
                type: "string",
                description: "Nome da propriedade (se disponível)"
              },
              guestName: {
                type: "string",
                description: "Nome completo do hóspede ou cliente (se disponível)"
              },
              checkInDate: {
                type: "string",
                description: "Data de check-in no formato YYYY-MM-DD (se disponível)"
              },
              checkOutDate: {
                type: "string",
                description: "Data de check-out no formato YYYY-MM-DD (se disponível)"
              },
              documentType: {
                type: "string",
                description: "Tipo de documento (reserva, check-in, check-out, etc.)"
              },
              numGuests: {
                type: "integer",
                description: "Número de hóspedes total (se disponível)"
              },
              observations: {
                type: "string",
                description: "Observações ou informações adicionais relevantes"
              }
            },
            required: ["documentType"]
          }
        }
      }
    ];
    
    // Enviar texto para análise
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest', // Melhor suporte para function calling e mais rápido
        messages: [
          {
            role: 'user',
            content: `Este texto foi extraído de um PDF relacionado a reservas ou check-ins em um sistema de gestão de propriedades. 
            Analise o texto e extraia as informações de reserva estruturadas. Se não for possível determinar algum campo com certeza, omita-o.
            
            Texto extraído:
            ${limitedText}`
          }
        ],
        tools: tools,
        tool_choice: "auto",
        temperature: 0.2 // Baixa temperatura para respostas mais determinísticas
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Mistral: ${response.status} - ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Resposta recebida da API Mistral');
    
    // Verificar se há function calling na resposta
    const toolCalls = result.choices[0].message.tool_calls || [];
    if (toolCalls.length === 0) {
      console.log('⚠️ Sem chamada de função na resposta, usando texto completo');
      console.log('-'.repeat(50));
      console.log(result.choices[0].message.content);
      console.log('-'.repeat(50));
    } else {
      // Extrair os dados estruturados
      const functionCall = toolCalls[0];
      console.log(`✅ Função chamada: ${functionCall.function.name}`);
      
      const args = functionCall.function.arguments;
      const extractedData = typeof args === 'string' ? JSON.parse(args) : args;
      
      console.log('✅ Dados estruturados extraídos:');
      console.log('-'.repeat(50));
      console.log(JSON.stringify(extractedData, null, 2));
      console.log('-'.repeat(50));
      
      return {
        rawText: data.text,
        extractedData: extractedData
      };
    }
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    throw error;
  }
}

// Executar o teste
testStructuredPdfExtraction().then(result => {
  console.log('✅ Processo completo finalizado!');
}).catch(error => {
  console.error('\n❌ Falha no teste:', error);
  process.exit(1);
});
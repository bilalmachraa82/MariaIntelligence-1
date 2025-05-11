/**
 * Script para testar o OCR via OpenRouter
 * Este script testa a detecção e extração de dados de reserva de um PDF
 * usando a API do OpenRouter
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Importar o adaptador
import { openAIAdapterOpenRouter } from './server/services/ai-adapter.service.js';

// Configuração
const PDF_PATH = process.argv[2] || './Controlo_Aroeira I.pdf'; // Caminho do PDF para testar
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Verificar se a chave da API do OpenRouter está definida
if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY não está definida! Por favor, configure a variável de ambiente.');
  process.exit(1);
}

async function testOpenRouterOCR() {
  console.log(`📄 Testando OCR via OpenRouter no arquivo: ${PDF_PATH}`);

  try {
    // Ler o arquivo PDF
    if (!fs.existsSync(PDF_PATH)) {
      console.error(`❌ Arquivo não encontrado: ${PDF_PATH}`);
      process.exit(1);
    }

    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`✅ Arquivo lido com sucesso: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
    // Inicializar o adaptador
    console.log('🤖 Inicializando adaptador OpenRouter...');
    const adapter = openAIAdapterOpenRouter(OPENROUTER_API_KEY);
    
    // Extração de texto inicial usando PDF (pdf-parse como fallback)
    console.log('🔍 Extraindo texto do PDF...');
    let extractedText = '';
    
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
      const pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.entry.js');
      
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      
      const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
      const pdf = await loadingTask.promise;
      
      console.log(`✅ PDF carregado com sucesso, total de páginas: ${pdf.numPages}`);
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += pageText + '\n';
      }
      
      console.log(`✅ Texto extraído com sucesso: ${extractedText.length} caracteres`);
    } catch (error) {
      console.error('❌ Erro ao extrair texto com pdfjs:', error);
      
      // Fallback para pdf-parse
      console.log('🔄 Tentando fallback com pdf-parse...');
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = pdfParseModule.default;
      
      try {
        const data = await pdfParse(pdfBuffer);
        extractedText = data.text;
        console.log(`✅ Texto extraído com pdf-parse: ${extractedText.length} caracteres`);
      } catch (fallbackError) {
        console.error('❌ Erro no fallback pdf-parse:', fallbackError);
        console.log('⚠️ Continuando apenas com o texto que já foi extraído');
      }
    }
    
    // Verificar se temos texto extraído
    if (!extractedText || extractedText.trim().length === 0) {
      console.error('❌ Não foi possível extrair texto do PDF!');
      process.exit(1);
    }
    
    // Analisar o texto extraído com OpenRouter
    console.log('🧠 Analisando texto com OpenRouter...');
    console.log('------ Texto Extraído ------');
    console.log(extractedText.substring(0, 500) + '...');
    console.log('---------------------------');
    
    // Preparar a chamada de função
    const functionDefinition = {
      name: "parse_reservation_data",
      description: "Extrair informações de reserva de um texto",
      parameters: {
        type: "object",
        properties: {
          propertyName: {
            type: "string",
            description: "Nome da propriedade"
          },
          guestName: {
            type: "string",
            description: "Nome do hóspede"
          },
          guestEmail: {
            type: "string",
            description: "Email do hóspede"
          },
          guestPhone: {
            type: "string",
            description: "Número de telefone do hóspede"
          },
          checkInDate: {
            type: "string",
            description: "Data de check-in (formato YYYY-MM-DD)"
          },
          checkOutDate: {
            type: "string",
            description: "Data de check-out (formato YYYY-MM-DD)"
          },
          numGuests: {
            type: "number",
            description: "Número de hóspedes"
          },
          totalAmount: {
            type: "string",
            description: "Valor total da reserva"
          },
          platform: {
            type: "string",
            description: "Plataforma de reserva (airbnb, booking, direct, expedia, outro)"
          },
          status: {
            type: "string",
            description: "Status da reserva (pendente, confirmada, cancelada, concluída, no-show)"
          },
          notes: {
            type: "string",
            description: "Observações adicionais"
          }
        },
        required: ["propertyName", "checkInDate", "checkOutDate"]
      }
    };
    
    try {
      console.log('📞 Chamando OpenRouter API...');
      const startTime = Date.now();
      
      const response = await adapter.openai.chat.completions.create({
        model: 'mistralai/mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em extrair informações de reservas de propriedades.
            Extraia todos os dados de reserva possíveis do texto fornecido.
            Analise o formato e identifique propriedade, hóspedes, datas e detalhes.
            Se houver múltiplas reservas, identifique a primeira/principal.
            Datas devem estar no formato YYYY-MM-DD.
            Se não encontrar um campo, deixe-o vazio ou ausente.`
          },
          {
            role: 'user',
            content: `Extraia os dados da reserva contida neste texto:\n\n${extractedText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        tools: [{ type: "function", function: functionDefinition }],
        tool_choice: { type: "function", function: { name: "parse_reservation_data" } }
      });
      
      const executionTime = Date.now() - startTime;
      console.log(`⏱️ Tempo de execução: ${executionTime}ms`);
      
      // Processar e exibir resultados
      if (response && response.choices && response.choices.length > 0) {
        const firstChoice = response.choices[0];
        
        if (firstChoice.message && 
            firstChoice.message.tool_calls && 
            firstChoice.message.tool_calls.length > 0) {
          
          const toolCall = firstChoice.message.tool_calls[0];
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log('\n✅ Dados extraídos com sucesso:');
          console.log(JSON.stringify(functionArgs, null, 2));
          
          // Verificar campos necessários
          const missingFields = [];
          ['propertyName', 'guestName', 'checkInDate', 'checkOutDate', 'numGuests', 'totalAmount'].forEach(field => {
            if (!functionArgs[field]) {
              missingFields.push(field);
            }
          });
          
          if (missingFields.length > 0) {
            console.log(`\n⚠️ Campos em falta: ${missingFields.join(', ')}`);
          } else {
            console.log('\n✅ Todos os campos essenciais foram extraídos!');
          }
          
          // Verificar a propriedade
          if (functionArgs.propertyName) {
            console.log(`\n🏠 Propriedade detectada: ${functionArgs.propertyName}`);
          }
          
          // Verificar datas
          if (functionArgs.checkInDate && functionArgs.checkOutDate) {
            const checkInDate = new Date(functionArgs.checkInDate);
            const checkOutDate = new Date(functionArgs.checkOutDate);
            
            if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
              const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
              console.log(`📅 Período: ${functionArgs.checkInDate} a ${functionArgs.checkOutDate} (${nights} noites)`);
            } else {
              console.log('⚠️ Formato de data inválido!');
            }
          }
          
          return {
            success: true,
            data: functionArgs,
            missingFields,
            executionTime
          };
        } else {
          console.error('❌ Sem tool_calls na resposta');
        }
      } else {
        console.error('❌ Resposta inválida da API');
      }
    } catch (error) {
      console.error('❌ Erro ao chamar OpenRouter API:', error);
      if (error.response) {
        console.error('Detalhes:', error.response.status, error.response.data);
      }
    }
    
    return { success: false };
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return { success: false, error: error.message };
  }
}

// Executar o teste como função auto-invocada
(async () => {
  try {
    const result = await testOpenRouterOCR();
    if (result && result.success) {
      console.log('\n✅ Teste completado com sucesso!');
    } else {
      console.log('\n❌ Teste falhou!');
    }
  } catch (error) {
    console.error('❌ Erro não tratado:', error);
  }
})();
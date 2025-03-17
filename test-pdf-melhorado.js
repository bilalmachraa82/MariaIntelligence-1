// Teste melhorado para processamento de PDFs de entrada/saída com múltiplas reservas
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';
import pdfParse from 'pdf-parse';

/**
 * Extrai texto de um PDF usando pdf-parse
 * @param {Buffer} pdfBuffer - Buffer do PDF
 * @returns {Promise<string>} - Texto extraído
 */
async function extractTextWithPdfParse(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Erro ao extrair texto com pdf-parse:', error);
    throw error;
  }
}

/**
 * Converte datas do formato DD-MM-YYYY para YYYY-MM-DD
 * @param {string} dateStr - String de data no formato DD-MM-YYYY
 * @returns {string} - Data no formato YYYY-MM-DD
 */
function convertDateFormat(dateStr) {
  if (!dateStr) return '';
  
  // Verifica se a data já está no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Tenta converter DD-MM-YYYY para YYYY-MM-DD
  const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  
  // Tenta extrair data do formato "DD-MM-YYYY HH:MM"
  const matchWithTime = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})\s+\d{2}:\d{2}$/);
  if (matchWithTime) {
    return `${matchWithTime[3]}-${matchWithTime[2]}-${matchWithTime[1]}`;
  }
  
  // Se não conseguir converter, retorna a string original
  return dateStr;
}

/**
 * Limpa nomes de propriedades para remover cabeçalhos de tabela erroneamente extraídos
 * @param {string} propertyName - Nome da propriedade extraído
 * @returns {string} - Nome da propriedade limpo
 */
function cleanPropertyName(propertyName) {
  if (!propertyName) return '';
  
  // Remover cabeçalhos comuns que são erroneamente extraídos como nomes de propriedade
  const headersToRemove = [
    'ReferênciaAlojamentoEdifícioEstadoCheck in',
    'Referência',
    'Estado',
    'Check',
    'Alojamento',
    'Edifício'
  ];
  
  // Verificar se o nome da propriedade contém algum dos cabeçalhos
  let cleanedName = propertyName;
  for (const header of headersToRemove) {
    if (cleanedName === header) {
      return 'Não especificado';
    }
    
    // Remover o cabeçalho se estiver contido no nome
    cleanedName = cleanedName.replace(header, '').trim();
  }
  
  // Se o nome limpo estiver vazio, retornar "Não especificado"
  return cleanedName || 'Não especificado';
}

/**
 * Extrai múltiplas reservas de um relatório PDF
 * @param {string} text - Texto extraído do PDF
 * @param {string} apiKey - Chave API do Mistral
 * @param {string} type - Tipo de relatório ('entradas' ou 'saidas')
 * @returns {Promise<Array>} - Array de reservas extraídas
 */
async function extractMultipleReservations(text, apiKey, type) {
  try {
    const client = new Mistral({ apiKey });
    
    // Usar o modelo tiny para function calling
    const response = await client.chat.complete({
      model: "mistral-tiny",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em extrair informações de reservas de alojamento.
          O texto fornecido é um relatório que contém múltiplas reservas.
          Extraia no máximo 3 reservas do relatório.
          Procure por linhas com dados de reservas reais, ignorando cabeçalhos e filtros.
          Foque nas linhas que contêm nomes de hóspedes, datas, telefones e emails.
          Para os nomes das propriedades, procure por "Almada", "Óbidos", "Bernardo", "Noronha" e outros nomes reais.
          Ignore valores como "Todos", "Não mostrar" ou "Pendente" que são apenas elementos da interface.`
        },
        {
          role: "user",
          content: `Extraia os dados das reservas encontradas neste relatório de ${type === 'entradas' ? 'CHECK-INS' : 'CHECK-OUTS'}:\n\n${text.substring(0, 1500)}`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extractReservationsFromReport",
            description: "Extrair reservas de um relatório",
            parameters: {
              type: "object",
              properties: {
                reportType: {
                  type: "string",
                  description: "Tipo de relatório (entradas, saidas)"
                },
                reservations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      reference: {
                        type: "string",
                        description: "Referência da reserva"
                      },
                      propertyName: {
                        type: "string",
                        description: "Nome real da propriedade (ex: Almada 1, Óbidos T3)"
                      },
                      status: {
                        type: "string",
                        description: "Estado da reserva"
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
                        description: "Telefone do hóspede"
                      },
                      checkInDate: {
                        type: "string",
                        description: "Data de check-in"
                      },
                      checkOutDate: {
                        type: "string",
                        description: "Data de check-out"
                      },
                      numAdults: {
                        type: "integer",
                        description: "Número de adultos"
                      },
                      numChildren: {
                        type: "integer",
                        description: "Número de crianças"
                      },
                      country: {
                        type: "string",
                        description: "País de origem"
                      }
                    }
                  }
                }
              },
              required: ["reportType", "reservations"]
            }
          }
        }
      ],
      toolChoice: { type: "function", function: { name: "extractReservationsFromReport" } },
      temperature: 0.1,
      maxTokens: 1000
    });
    
    if (response && 
        response.choices && 
        response.choices[0] && 
        response.choices[0].message && 
        response.choices[0].message.toolCalls && 
        response.choices[0].message.toolCalls.length > 0) {
      
      const toolCall = response.choices[0].message.toolCalls[0];
      
      if (toolCall.function && toolCall.function.arguments) {
        const functionArgs = toolCall.function.arguments;
        const extractedData = JSON.parse(typeof functionArgs === 'string' ? functionArgs : JSON.stringify(functionArgs));
        
        // Processar e limpar os dados extraídos
        if (extractedData && extractedData.reservations) {
          extractedData.reservations.forEach(reservation => {
            // Normalizar datas
            if (reservation.checkInDate) {
              reservation.checkInDate = convertDateFormat(reservation.checkInDate);
            }
            if (reservation.checkOutDate) {
              reservation.checkOutDate = convertDateFormat(reservation.checkOutDate);
            }
            
            // Limpar nomes de propriedades
            if (reservation.propertyName) {
              reservation.propertyName = cleanPropertyName(reservation.propertyName);
            }
            
            // Garantir que todos os campos obrigatórios existam
            reservation.numAdults = reservation.numAdults || 0;
            reservation.numChildren = reservation.numChildren || 0;
            reservation.country = reservation.country || '';
          });
        }
        
        return extractedData;
      } else {
        throw new Error('Resposta não contém argumentos válidos');
      }
    } else {
      throw new Error('Resposta não contém toolCalls');
    }
  } catch (error) {
    console.error('Erro ao extrair reservas múltiplas:', error);
    throw error;
  }
}

async function processFile(filePath, type) {
  console.log(`\n📄 Processando arquivo: ${filePath} (Tipo: ${type})`);
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    // Ler o arquivo
    const pdfBuffer = fs.readFileSync(filePath);
    console.log(`PDF carregado (${Math.round(pdfBuffer.length / 1024)} KB)`);
    
    // Extrair texto usando pdf-parse
    console.log('Extraindo texto com pdf-parse...');
    const extractedText = await extractTextWithPdfParse(pdfBuffer);
    console.log(`Texto extraído (${extractedText.length} caracteres)`);
    
    // Extrair dados de múltiplas reservas
    console.log('Extraindo múltiplas reservas com Mistral AI...');
    const data = await extractMultipleReservations(extractedText, process.env.MISTRAL_API_KEY, type);
    
    // Exibir resultados
    if (data && data.reservations && data.reservations.length > 0) {
      console.log(`\n✅ Reservas encontradas: ${data.reservations.length}`);
      
      console.log('\nDados extraídos:');
      console.log('-'.repeat(50));
      console.log(JSON.stringify(data, null, 2));
      console.log('-'.repeat(50));
      
      console.log('\nDetalhes das reservas:');
      data.reservations.forEach((res, i) => {
        console.log(`\nReserva ${i+1}:`);
        console.log(`- Alojamento: ${res.propertyName || 'Não especificado'}`);
        console.log(`- Hóspede: ${res.guestName || 'Não especificado'}`);
        console.log(`- Check-in: ${res.checkInDate || 'Não especificado'}`);
        console.log(`- Check-out: ${res.checkOutDate || 'Não especificado'}`);
        console.log(`- Contacto: ${res.guestPhone || 'Não disponível'}`);
        console.log(`- Email: ${res.guestEmail || 'Não disponível'}`);
        if (res.numAdults || res.numChildren) {
          console.log(`- Hóspedes: ${res.numAdults || 0} adultos, ${res.numChildren || 0} crianças`);
        }
        if (res.country) {
          console.log(`- País: ${res.country}`);
        }
        console.log(`- Referência: ${res.reference || 'Não disponível'}`);
      });
      
      return data;
    } else {
      console.log('\n❌ Nenhuma reserva encontrada no documento.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao processar o PDF:', error);
    return null;
  }
}

async function main() {
  console.log('🔄 Iniciando teste melhorado de processamento de PDFs de check-in e check-out...');
  
  // Verificar API key
  if (!process.env.MISTRAL_API_KEY) {
    console.error('❌ MISTRAL_API_KEY não configurada. Por favor, configure esta variável de ambiente.');
    return;
  }
  
  // Processar um PDF por vez para garantir que todo o resultado seja exibido
  
  // Processar arquivo de entradas
  console.log('\n\n======= PROCESSANDO ENTRADA.PDF =======');
  const entradasData = await processFile('./entrada.pdf', 'entradas');
  
  // Pequena pausa para garantir que o output anterior seja exibido
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Processar arquivo de saídas
  console.log('\n\n======= PROCESSANDO SAIDA.PDF =======');
  const saidasData = await processFile('./saida.pdf', 'saidas');
  
  // Pequena pausa para garantir que o output anterior seja exibido
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verificar correspondências entre entradas e saídas
  console.log('\n\n======= ANALISANDO CORRESPONDÊNCIAS =======');
  
  if (entradasData && saidasData && 
      entradasData.reservations && entradasData.reservations.length > 0 &&
      saidasData.reservations && saidasData.reservations.length > 0) {
    
    console.log('\n🔍 Buscando correspondências entre reservas de entrada e saída...');
    
    const entradas = entradasData.reservations;
    const saidas = saidasData.reservations;
    let correspondenciasEncontradas = false;
    
    // Verificar correspondências por referência ou nome
    for (const entrada of entradas) {
      for (const saida of saidas) {
        if (entrada.reference === saida.reference || 
            entrada.guestName === saida.guestName) {
          
          console.log('\n✅ Correspondência encontrada:');
          console.log('-'.repeat(50));
          console.log(`Hóspede: ${entrada.guestName}`);
          console.log(`Propriedade: ${entrada.propertyName}`);
          console.log(`Check-in: ${entrada.checkInDate}`);
          console.log(`Check-out: ${saida.checkOutDate}`);
          console.log(`Email: ${entrada.guestEmail || saida.guestEmail || 'Não disponível'}`);
          console.log(`Telefone: ${entrada.guestPhone || saida.guestPhone || 'Não disponível'}`);
          console.log(`Referência: ${entrada.reference}`);
          console.log('-'.repeat(50));
          
          correspondenciasEncontradas = true;
          break;
        }
      }
    }
    
    if (!correspondenciasEncontradas) {
      console.log('\n❌ Nenhuma correspondência encontrada entre check-ins e check-outs.');
    }
  } else {
    console.log('\n❌ Dados insuficientes para buscar correspondências.');
  }
  
  console.log('\n🏁 Teste concluído!');
}

// Executar o teste
main().catch(error => {
  console.error('Erro não tratado:', error);
});
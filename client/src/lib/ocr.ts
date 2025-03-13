import { apiRequest } from "./queryClient";

interface ExtractedData {
  propertyId: number;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalAmount: number;
  platform: string;
  platformFee: number;
  cleaningFee: number;
  checkInFee: number;
  commissionFee: number;
  teamPayment: number;
}

interface UploadResponse {
  extractedData: ExtractedData;
  file: {
    filename: string;
    path: string;
  };
}

export const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

// Function to upload PDF and process with OCR
export async function uploadAndProcessPDF(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("pdf", file);

  const response = await fetch("/api/upload-pdf", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to process PDF: ${errorText}`);
  }

  return await response.json();
}

// Function to create reservation from extracted data
export async function createReservationFromExtractedData(data: ExtractedData) {
  const reservationData = {
    propertyId: data.propertyId,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    numGuests: data.numGuests,
    totalAmount: data.totalAmount.toString(),
    status: "confirmed",
    platform: data.platform,
    platformFee: data.platformFee.toString(),
    cleaningFee: data.cleaningFee.toString(),
    checkInFee: data.checkInFee.toString(),
    commissionFee: data.commissionFee.toString(),
    teamPayment: data.teamPayment.toString(),
    notes: "Created via PDF OCR extraction",
  };

  const response = await apiRequest("POST", "/api/reservations", reservationData);
  return await response.json();
}

/**
 * Extrai texto de um PDF usando a API Mistral
 * @param pdfBase64 PDF em formato Base64
 * @returns Texto extraído do PDF
 */
export async function extractTextFromPDFWithMistral(pdfBase64: string): Promise<string> {
  const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
  
  // Melhorado o prompt para processamento de documentos, seguindo as diretrizes da documentação Mistral
  const prompt = `
    Você é um especialista em processamento de documentos e OCR (Reconhecimento Óptico de Caracteres).
    Analise este documento de reserva de alojamento local em formato PDF (fornecido em base64).
    
    Por favor:
    1. Extraia todo o texto visível neste documento, incluindo cabeçalhos, tabelas e informações relevantes
    2. Preserve a estrutura original do documento (seções, tabelas, etc.)
    3. Identifique informações importantes como datas, valores, nomes, etc.
    4. Processe tabelas mantendo o alinhamento de colunas quando possível
    
    Retorne o texto extraído com a estrutura preservada.
  `;

  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { 
          role: 'system', 
          content: 'Você é um assistente especializado em processamento de documentos e OCR, com foco em extração de texto precisa e estruturada de arquivos PDF.' 
        },
        { 
          role: 'user', 
          content: `${prompt}\n\nPDF Base64: ${pdfBase64}` 
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Analisa texto extraído e extrai informações estruturadas sobre a reserva
 * @param extractedText Texto extraído do PDF
 * @returns Dados estruturados da reserva
 */
export async function parseReservationDataWithMistral(extractedText: string): Promise<any> {
  const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
  
  // Prompt aprimorado com contexto específico para documentos de reserva de propriedades em Portugal
  const prompt = `
    Você é um especialista em extrair dados estruturados de documentos de reservas para alojamento local em Portugal.
    
    CONTEXTO IMPORTANTE:
    Estes documentos normalmente contêm informações sobre uma reserva de hospedagem em uma propriedade,
    incluindo detalhes do hóspede, datas de check-in/check-out, valores pagos, taxas associadas, etc.
    O formato pode variar dependendo da plataforma (Booking.com, Airbnb, etc.).
    
    Analise cuidadosamente o texto extraído a seguir e extraia as seguintes informações em formato JSON:
    
    {
      "propertyName": "Nome da propriedade - normalmente aparece como cabeçalho ou título",
      "guestName": "Nome completo do hóspede principal",
      "guestEmail": "Email do hóspede (quando disponível)",
      "guestPhone": "Telefone do hóspede (quando disponível)",
      "checkInDate": "Data de entrada no formato YYYY-MM-DD",
      "checkOutDate": "Data de saída no formato YYYY-MM-DD",
      "numGuests": "Número de hóspedes (apenas o número)",
      "totalAmount": "Valor total da reserva (apenas o número)",
      "platform": "Plataforma da reserva: 'airbnb', 'booking', 'expedia', 'direct' ou 'other'",
      "platformFee": "Taxa cobrada pela plataforma (apenas o número)",
      "cleaningFee": "Taxa de limpeza (apenas o número)",
      "checkInFee": "Taxa de check-in (apenas o número)",
      "commissionFee": "Taxa de comissão (apenas o número)",
      "teamPayment": "Pagamento à equipe de limpeza (apenas o número)"
    }
    
    INSTRUÇÕES ESPECÍFICAS:
    1. Encontre o nome da propriedade analisando cabeçalhos, títulos ou seções de identificação do documento
    2. Identifique o nome do hóspede, geralmente identificado explicitamente
    3. Localize datas de check-in e check-out e converta para o formato YYYY-MM-DD
    4. Extraia valores numéricos (totalAmount, taxas, etc.) removendo símbolos de moeda - apenas números
    5. Deduza a plataforma pelo layout, logotipos mencionados ou formato do documento
    6. Para campos não encontrados, use null (não invente valores)
    
    Responda APENAS com o objeto JSON válido, sem explicações ou texto adicional.
  `;

  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { 
          role: 'system', 
          content: 'Você é um assistente especializado em extrair dados estruturados de documentos de reservas de alojamentos. Sua tarefa é analisar o texto e convertê-lo em dados JSON bem estruturados.' 
        },
        { 
          role: 'user', 
          content: `${prompt}\n\nTexto extraído do PDF:\n${extractedText}` 
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API error: ${errorText}`);
  }

  const data = await response.json();
  const jsonContent = data.choices[0].message.content;
  
  try {
    // Parse JSON e aplica pós-processamento para garantir formato correto
    const parsedData = JSON.parse(jsonContent);
    
    // Garantir que valores numéricos sejam números
    if (parsedData.totalAmount && typeof parsedData.totalAmount === 'string') {
      parsedData.totalAmount = parseFloat(parsedData.totalAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    }
    
    if (parsedData.numGuests && typeof parsedData.numGuests === 'string') {
      parsedData.numGuests = parseInt(parsedData.numGuests, 10) || 1;
    }
    
    // Normalizar plataforma
    if (parsedData.platform) {
      const platform = parsedData.platform.toLowerCase();
      if (platform.includes('book') || platform.includes('booking')) {
        parsedData.platform = 'booking';
      } else if (platform.includes('airb') || platform.includes('air b')) {
        parsedData.platform = 'airbnb';
      } else if (platform.includes('expe')) {
        parsedData.platform = 'expedia';
      } else if (platform.includes('dire')) {
        parsedData.platform = 'direct';
      } else {
        parsedData.platform = 'other';
      }
    }
    
    return parsedData;
  } catch (e) {
    console.error("Error parsing JSON from Mistral API:", e);
    throw new Error(`Falha ao processar dados JSON: ${e.message}`);
  }
}

/**
 * Processar PDF com Mistral OCR
 * Este método coordena todo o processo:
 * 1. Converte o PDF para base64
 * 2. Extrai o texto com a API Mistral
 * 3. Analisa os dados da reserva do texto extraído
 * 4. Encontra o ID da propriedade correspondente
 */
export async function processPDFWithMistralOCR(file: File): Promise<any> {
  try {
    // 1. Converter o arquivo para base64
    const fileReader = new FileReader();
    const fileBase64Promise = new Promise<string>((resolve, reject) => {
      fileReader.onload = () => {
        const base64 = fileReader.result?.toString().split(',')[1] || '';
        resolve(base64);
      };
      fileReader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      fileReader.readAsDataURL(file);
    });
    
    const fileBase64 = await fileBase64Promise;
    
    // 2. Extrair texto do PDF usando a API Mistral
    const extractedText = await extractTextFromPDFWithMistral(fileBase64);
    
    // 3. Analisar o texto para extrair dados estruturados
    const parsedData = await parseReservationDataWithMistral(extractedText);
    
    // 4. Encontrar o ID da propriedade pelo nome
    const propertiesResponse = await fetch('/api/properties');
    if (!propertiesResponse.ok) {
      throw new Error('Falha ao obter a lista de propriedades');
    }
    
    const properties = await propertiesResponse.json();
    const matchedProperty = properties.find((p: any) => 
      p.name.toLowerCase() === parsedData.propertyName.toLowerCase()
    );
    
    if (!matchedProperty) {
      throw new Error(`Não foi possível encontrar uma propriedade com o nome "${parsedData.propertyName}"`);
    }
    
    // 5. Retornar os dados no formato esperado
    return {
      extractedData: {
        ...parsedData,
        propertyId: matchedProperty.id
      },
      file: {
        filename: file.name,
        path: '/uploads/' + file.name // Caminho simulado
      }
    };
  } catch (error) {
    console.error("Erro ao processar PDF com Mistral OCR:", error);
    throw error;
  }
}

/**
 * Função para converter um arquivo para base64
 * @param file Arquivo PDF a ser convertido
 * @returns Promise com o conteúdo do arquivo em base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result?.toString().split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}

/**
 * Processa múltiplos PDFs e extrai informações de reserva
 * 
 * Esta função permite processar vários PDFs de uma só vez, extraindo
 * as informações de reserva de cada um e retornando os dados estruturados.
 * 
 * @param files Array de arquivos PDF a serem processados
 * @returns Promise contendo um array de dados extraídos
 */
export async function processMultiplePDFs(files: File[]): Promise<any[]> {
  try {
    if (!files || files.length === 0) {
      throw new Error('Nenhum arquivo PDF fornecido');
    }

    // 1. Verificar se todos os arquivos são PDFs
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        throw new Error(`O arquivo "${file.name}" não é um PDF válido`);
      }
    }

    // 2. Recuperar a lista de propriedades (apenas uma vez)
    const propertiesResponse = await fetch('/api/properties');
    if (!propertiesResponse.ok) {
      throw new Error('Falha ao obter a lista de propriedades');
    }
    const properties = await propertiesResponse.json();

    // 3. Processar cada PDF em paralelo com um limite de concorrência
    const results = [];
    const batchSize = 2; // Número de PDFs a processar simultaneamente
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(async (file) => {
        try {
          // Converter o arquivo para base64
          const fileBase64 = await fileToBase64(file);
          
          // Extrair texto do PDF
          const extractedText = await extractTextFromPDFWithMistral(fileBase64);
          
          // Analisar o texto para dados estruturados
          const parsedData = await parseReservationDataWithMistral(extractedText);
          
          // Encontrar a propriedade correspondente
          const matchedProperty = properties.find((p: any) => 
            p.name.toLowerCase() === (parsedData.propertyName || '').toLowerCase()
          );
          
          if (!matchedProperty) {
            throw new Error(`Não foi possível encontrar uma propriedade com o nome "${parsedData.propertyName}"`);
          }
          
          // Retornar os dados extraídos com o ID da propriedade
          return {
            extractedData: {
              ...parsedData,
              propertyId: matchedProperty.id
            },
            file: {
              filename: file.name,
              path: '/uploads/' + file.name
            }
          };
        } catch (error) {
          // Em caso de erro, retorna o erro associado ao arquivo específico
          return {
            error: true,
            message: `Erro ao processar o arquivo "${file.name}": ${error.message}`,
            file: {
              filename: file.name
            }
          };
        }
      });
      
      // Aguardar o processamento do lote atual
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  } catch (error) {
    console.error("Erro ao processar múltiplos PDFs:", error);
    throw error;
  }
}

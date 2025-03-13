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

// API URLs
const MISTRAL_API_BASE = "https://api.mistral.ai/v1";
const MISTRAL_API_CHAT = `${MISTRAL_API_BASE}/chat/completions`;
const MISTRAL_API_EMBEDDINGS = `${MISTRAL_API_BASE}/embeddings`;
const MISTRAL_API_DOCUMENT = `${MISTRAL_API_BASE}/documents`;

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
 * Processar documento PDF diretamente com a API Chat Completions do Mistral
 * 
 * A Mistral não possui uma API específica de Document, então usamos a API Chat com base64
 * e Function Calling para análise estruturada
 * 
 * @param fileBase64 PDF em formato Base64
 * @returns Texto extraído do documento para análise posterior
 */
export async function processDocumentWithMistral(fileBase64: string): Promise<string> {
  try {
    console.log("Iniciando processamento de PDF com Mistral AI");
    
    // Verificar se o base64 é válido
    if (!fileBase64 || fileBase64.trim() === '') {
      throw new Error("Base64 inválido ou vazio");
    }
    
    // Usamos a API Chat Completions para analisar o conteúdo do PDF
    const response = await fetch(MISTRAL_API_CHAT, {
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
            content: 'Você é um assistente especializado em processamento de documentos e OCR, com foco em extração de texto precisa e estruturada de arquivos PDF relacionados a reservas de alojamento local em Portugal.' 
          },
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: `Extraia todo o texto visível neste documento PDF de reserva, incluindo cabeçalhos, tabelas e informações relevantes. 
                Preserve a estrutura original do documento (seções, tabelas, etc.).
                Identifique e destaque informações importantes como datas, valores, nomes, etc.
                Processe tabelas mantendo o alinhamento de colunas quando possível.
                Retorne o texto extraído com a estrutura preservada.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${fileBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      // Tentar obter a mensagem de erro formatada
      let errorText;
      try {
        const errorJson = await response.json();
        errorText = errorJson.error?.message || JSON.stringify(errorJson);
      } catch (e) {
        errorText = await response.text();
      }
      
      throw new Error(`Erro na API Mistral (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content.trim();
    console.log("Texto extraído com sucesso. Tamanho:", extractedText.length);
    return extractedText;
  } catch (error) {
    console.error("Falha ao processar documento com Mistral:", error);
    throw new Error(`Falha no processamento com Mistral API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Extrai texto e dados estruturados de um PDF usando a Document API do Mistral
 * Implementação RAG (Retrieval-Augmented Generation) nativa
 * 
 * @param documentId ID do documento na API Mistral
 * @returns Texto extraído do PDF
 */
export async function extractTextWithMistralDocument(documentId: string): Promise<string> {
  // Usando o ID do documento para consultar a API de chat com RAG
  const response = await fetch(MISTRAL_API_CHAT, {
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
          content: 'Você é um assistente especializado em processamento de documentos e OCR, com foco em extração de texto precisa e estruturada de arquivos PDF relacionados a reservas de alojamento local em Portugal.' 
        },
        { 
          role: 'user', 
          content: `Extraia todo o texto visível neste documento PDF de reserva, incluindo cabeçalhos, tabelas e informações relevantes. 
          Preserve a estrutura original do documento (seções, tabelas, etc.).
          Identifique e destaque informações importantes como datas, valores, nomes, etc.
          Processe tabelas mantendo o alinhamento de colunas quando possível.
          Retorne o texto extraído com a estrutura preservada.` 
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
      tools: [
        {
          type: "retrieval",
          retrieval: {
            document_id: documentId,
            mode: "document"
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API Mistral RAG: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Analisa texto extraído e extrai informações estruturadas sobre a reserva
 * Usa o sistema RAG com contexto do documento original
 * Implementa Function Calling para extração estruturada mais precisa
 * 
 * @param extractedText Texto extraído do PDF
 * @param documentId ID do documento na API Mistral
 * @returns Dados estruturados da reserva
 */
export async function parseReservationWithMistralRAG(extractedText: string, documentId: string): Promise<any> {
  console.log("Analisando documento com Function Calling e RAG avançado");
  
  // Definição da função para extração estruturada de dados da reserva
  const reservationExtractorFunction = {
    type: "function",
    function: {
      name: "extract_reservation_data",
      description: "Extrai informações estruturadas de um documento de reserva de alojamento local em Portugal",
      parameters: {
        type: "object",
        properties: {
          propertyName: {
            type: "string",
            description: "Nome da propriedade/alojamento conforme aparece no documento"
          },
          guestName: {
            type: "string",
            description: "Nome completo do hóspede principal que fez a reserva"
          },
          guestEmail: {
            type: "string", 
            description: "Email do hóspede para contato",
            format: "email"
          },
          guestPhone: {
            type: "string",
            description: "Número de telefone do hóspede"
          },
          checkInDate: {
            type: "string",
            description: "Data de entrada/check-in no formato YYYY-MM-DD",
            format: "date"
          },
          checkOutDate: {
            type: "string",
            description: "Data de saída/check-out no formato YYYY-MM-DD",
            format: "date"
          },
          numGuests: {
            type: "integer",
            description: "Número total de hóspedes na reserva"
          },
          totalAmount: {
            type: "number",
            description: "Valor total da reserva (somente número, sem símbolo de moeda)"
          },
          platform: {
            type: "string",
            description: "Plataforma onde a reserva foi feita",
            enum: ["airbnb", "booking", "expedia", "direct", "other"]
          },
          platformFee: {
            type: "number",
            description: "Taxa cobrada pela plataforma (somente número)"
          },
          cleaningFee: {
            type: "number",
            description: "Taxa de limpeza (somente número)"
          },
          checkInFee: {
            type: "number",
            description: "Taxa de check-in (somente número)"
          },
          commissionFee: {
            type: "number",
            description: "Taxa de comissão (somente número)"
          },
          teamPayment: {
            type: "number",
            description: "Pagamento à equipe de limpeza (somente número)"
          }
        },
        required: [
          "propertyName", 
          "guestName", 
          "checkInDate", 
          "checkOutDate", 
          "totalAmount"
        ]
      }
    }
  };

  // Determina o template baseado no texto extraído (detecção de plataforma)
  let systemPrompt = 'Você é um assistente especializado em extrair dados estruturados de documentos de reservas de alojamentos em Portugal.';
  
  // Detecção básica de plataforma para usar o prompt específico
  if (extractedText.toLowerCase().includes('airbnb')) {
    systemPrompt += ' Este documento parece ser do Airbnb. As reservas Airbnb geralmente incluem tarifas de serviço, taxa de limpeza e total discriminados.';
  } else if (extractedText.toLowerCase().includes('booking.com') || extractedText.toLowerCase().includes('booking')) {
    systemPrompt += ' Este documento parece ser do Booking.com. As reservas Booking geralmente incluem número de confirmação, taxa de serviço e valores com impostos inclusos.';
  } else if (extractedText.toLowerCase().includes('expedia')) {
    systemPrompt += ' Este documento parece ser da Expedia. As reservas Expedia geralmente incluem número de itinerário e taxas discriminadas.';
  }

  const response = await fetch(MISTRAL_API_CHAT, {
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
          content: systemPrompt
        },
        { 
          role: 'user', 
          content: `Analise este documento de reserva e extraia todas as informações relevantes usando a função fornecida. 
          
          Instruções específicas:
          1. Para valores monetários, extraia apenas os números (sem símbolos de moeda)
          2. Para datas, converta para o formato YYYY-MM-DD
          3. Para campos não encontrados, use null
          4. A plataforma deve ser categorizada como: 'airbnb', 'booking', 'expedia', 'direct' ou 'other'
          5. Seja preciso na extração de todos os valores, especialmente datas e valores financeiros`
        }
      ],
      temperature: 0.1,
      tools: [
        reservationExtractorFunction,
        {
          type: "retrieval",
          retrieval: {
            document_id: documentId,
            mode: "document"
          }
        }
      ],
      tool_choice: {
        type: "function",
        function: { name: "extract_reservation_data" }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API Mistral RAG: ${errorText}`);
  }

  const data = await response.json();
  
  try {
    // Com Function Calling, os dados já vêm estruturados
    const toolCalls = data.choices[0].message.tool_calls;
    
    if (!toolCalls || toolCalls.length === 0) {
      throw new Error("A API não retornou dados estruturados");
    }
    
    // Extrair os argumentos da função
    const functionArgs = JSON.parse(toolCalls[0].function.arguments);
    console.log("Dados extraídos via Function Calling:", functionArgs);
    
    // Garantir que valores numéricos sejam números
    // Mesmo com function calling, podemos ter campos que vieram como strings
    if (functionArgs.totalAmount && typeof functionArgs.totalAmount === 'string') {
      functionArgs.totalAmount = parseFloat(functionArgs.totalAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    }
    
    if (functionArgs.numGuests && typeof functionArgs.numGuests === 'string') {
      functionArgs.numGuests = parseInt(functionArgs.numGuests, 10) || 1;
    }
    
    // Normalizar as taxas para garantir que sejam números
    ['platformFee', 'cleaningFee', 'checkInFee', 'commissionFee', 'teamPayment'].forEach(fee => {
      if (functionArgs[fee] && typeof functionArgs[fee] === 'string') {
        functionArgs[fee] = parseFloat(functionArgs[fee].replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      } else if (functionArgs[fee] === undefined) {
        functionArgs[fee] = 0; // Garantir que todas as taxas tenham um valor padrão
      }
    });
    
    // Normalizar plataforma (já deve vir normalizada, mas por segurança)
    if (functionArgs.platform) {
      const platform = functionArgs.platform.toLowerCase();
      if (platform.includes('book') || platform.includes('booking')) {
        functionArgs.platform = 'booking';
      } else if (platform.includes('airb') || platform.includes('air b')) {
        functionArgs.platform = 'airbnb';
      } else if (platform.includes('expe')) {
        functionArgs.platform = 'expedia';
      } else if (platform.includes('dire')) {
        functionArgs.platform = 'direct';
      } else {
        functionArgs.platform = 'other';
      }
    }
    
    return functionArgs;
  } catch (e) {
    console.error("Erro ao processar dados de Function Calling:", e);
    
    // Fallback: se falhar o function calling, tentar extrair do conteúdo da mensagem
    try {
      const messageContent = data.choices[0].message.content;
      if (messageContent) {
        // Tentar encontrar um JSON no conteúdo
        const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonContent = jsonMatch[0];
          const parsedData = JSON.parse(jsonContent);
          
          // Aplicar as mesmas normalizações
          if (parsedData.totalAmount && typeof parsedData.totalAmount === 'string') {
            parsedData.totalAmount = parseFloat(parsedData.totalAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          }
          
          if (parsedData.numGuests && typeof parsedData.numGuests === 'string') {
            parsedData.numGuests = parseInt(parsedData.numGuests, 10) || 1;
          }
          
          return parsedData;
        }
      }
    } catch (fallbackError) {
      console.error("Fallback também falhou:", fallbackError);
    }
    
    throw new Error(`Falha ao processar dados da reserva: ${e.message}`);
  }
}

/**
 * Realiza análise visual de um documento para identificar logotipos e layout
 * Usa os recursos de visão multimodal do Mistral
 * 
 * @param pdfBase64 PDF em formato Base64
 * @returns Informações sobre a plataforma e layouts identificados
 */
export async function analyzeDocumentVisually(pdfBase64: string): Promise<any> {
  try {
    console.log("Analisando visualmente o documento com recursos multimodais");
    
    // Converter base64 para o formato esperado pela API
    const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
    
    const response = await fetch(MISTRAL_API_CHAT, {
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
            content: 'Você é um assistente especializado em análise visual de documentos de reservas de alojamento.'
          },
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: 'Identifique a plataforma de reserva deste documento (Airbnb, Booking.com, Expedia, etc.) ' + 
                      'analisando os logotipos, cores, layout e formato visual. ' +
                      'Observe também elementos visuais como tabelas, seções de pagamento, detalhes do hóspede. ' +
                      'Responda em formato JSON com os campos: "platform", "confidence" (0-100), e "visualElements" (array).' 
              },
              { 
                type: 'image_url', 
                image_url: { url: dataUrl } 
              }
            ]
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.log("Falha na análise visual, continuando sem ela...");
      return { platform: null, confidence: 0, visualElements: [] };
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.log("Erro na análise visual, ignorando e continuando processo:", error);
    return { platform: null, confidence: 0, visualElements: [] };
  }
}

/**
 * Processar PDF com Mistral Document API, RAG e análise visual
 * Implementação atualizada usando os recursos avançados de Document AI e multimodais
 * 
 * @param file Arquivo PDF a ser processado
 * @returns Dados extraídos e estruturados
 */
export async function processPDFWithMistralOCR(file: File): Promise<any> {
  try {
    console.log(`Processando arquivo: ${file.name} usando Document API, RAG e análise multimodal`);
    
    // 1. Converter o arquivo para base64
    const fileBase64 = await fileToBase64(file);
    
    // 2. Executar simultaneamente:
    //    a) Upload do documento para Mistral
    //    b) Análise visual do documento (se possível)
    const [documentId, visualAnalysis] = await Promise.all([
      uploadDocumentToMistral(fileBase64),
      analyzeDocumentVisually(fileBase64).catch(e => {
        console.warn("Análise visual falhou, continuando sem ela:", e);
        return { platform: null, confidence: 0, visualElements: [] };
      })
    ]);
    
    console.log(`Documento criado com ID: ${documentId}`);
    console.log("Análise visual concluída:", visualAnalysis);
    
    // 3. Extrair texto do PDF usando a API de documentos Mistral
    const extractedText = await extractTextWithMistralDocument(documentId);
    console.log(`Texto extraído com sucesso, tamanho: ${extractedText.length} caracteres`);
    
    // 4. Enriquecer o texto com informações visuais, se disponíveis
    let enhancedText = extractedText;
    if (visualAnalysis && visualAnalysis.platform && visualAnalysis.confidence > 50) {
      enhancedText = `[ANÁLISE VISUAL] Plataforma detectada: ${visualAnalysis.platform} (confiança: ${visualAnalysis.confidence}%)\n\n` + 
                     `[ELEMENTOS VISUAIS DETECTADOS] ${JSON.stringify(visualAnalysis.visualElements)}\n\n` + 
                     extractedText;
    }
    
    // 5. Extrair dados estruturados com RAG, usando as informações visuais como contexto adicional
    const parsedData = await parseReservationWithMistralRAG(enhancedText, documentId);
    
    // 6. Se a plataforma foi detectada visualmente com alta confiança, considerar essa informação
    if (visualAnalysis && visualAnalysis.platform && visualAnalysis.confidence > 70) {
      let normalizedPlatform = visualAnalysis.platform.toLowerCase();
      
      // Normalizar plataforma detectada visualmente
      if (normalizedPlatform.includes('airbnb')) parsedData.platform = 'airbnb';
      else if (normalizedPlatform.includes('booking')) parsedData.platform = 'booking';
      else if (normalizedPlatform.includes('expedia')) parsedData.platform = 'expedia';
      else if (normalizedPlatform.includes('direct')) parsedData.platform = 'direct';
      // Não sobrescrever com 'other' se já temos uma classificação melhor
    }
    
    console.log(`Dados estruturados extraídos com sucesso:`, parsedData);
    
    // 7. Encontrar o ID da propriedade pelo nome
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
    
    // 8. Retornar os dados no formato esperado, incluindo informações de análise visual
    return {
      extractedData: {
        ...parsedData,
        propertyId: matchedProperty.id,
        // Incluir metadados da análise visual
        visualAnalysis: visualAnalysis ? {
          platformConfidence: visualAnalysis.confidence,
          detectedElements: visualAnalysis.visualElements
        } : null
      },
      file: {
        filename: file.name,
        path: '/uploads/' + file.name,
        documentId: documentId // Armazenar o ID do documento para referência futura
      }
    };
  } catch (error) {
    console.error("Erro ao processar PDF com Mistral Document API:", error);
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
 * Processa múltiplos PDFs usando Document API, RAG e análise multimodal
 * Implementa processamento de alta performance com recursos avançados
 * 
 * @param files Array de arquivos PDF a serem processados
 * @returns Array de resultados processados
 */
export async function processMultiplePDFs(files: File[]): Promise<any[]> {
  try {
    console.log(`Iniciando processamento avançado de ${files.length} PDFs com Document API e análise multimodal`);
    
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
    const totalBatches = Math.ceil(files.length / batchSize);
    
    for (let i = 0; i < files.length; i += batchSize) {
      const currentBatch = Math.floor(i / batchSize) + 1;
      console.log(`Processando lote ${currentBatch} de ${totalBatches} (${Math.min(batchSize, files.length - i)} PDFs)...`);
      
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(async (file) => {
        try {
          console.log(`Iniciando processamento do arquivo "${file.name}"`);
          
          // 1. Converter arquivo para base64
          const fileBase64 = await fileToBase64(file);
          
          // 2. Executar simultaneamente:
          //    a) Upload do documento para Mistral
          //    b) Análise visual do documento (se possível)
          const [documentId, visualAnalysis] = await Promise.all([
            uploadDocumentToMistral(fileBase64).catch(e => {
              console.error(`Falha ao fazer upload do documento "${file.name}":`, e);
              throw new Error(`Falha ao fazer upload do documento: ${e.message}`);
            }),
            
            // Tentativa de análise visual (opcional, não impede o processamento principal)
            analyzeDocumentVisually(fileBase64).catch(e => {
              console.warn(`Análise visual falhou para "${file.name}", continuando sem ela:`, e);
              return { platform: null, confidence: 0, visualElements: [] };
            })
          ]);
          
          console.log(`Documento "${file.name}" criado com ID: ${documentId}`);
          if (visualAnalysis.platform) {
            console.log(`Análise visual identificou plataforma "${visualAnalysis.platform}" com confiança ${visualAnalysis.confidence}%`);
          }
          
          // 3. Extrair texto do PDF usando a API de documentos Mistral
          const extractedText = await extractTextWithMistralDocument(documentId);
          console.log(`Texto extraído de "${file.name}" com sucesso: ${extractedText.length} caracteres`);
          
          // 4. Enriquecer o texto com informações visuais, se disponíveis
          let enhancedText = extractedText;
          if (visualAnalysis && visualAnalysis.platform && visualAnalysis.confidence > 50) {
            enhancedText = `[ANÁLISE VISUAL] Plataforma detectada: ${visualAnalysis.platform} (confiança: ${visualAnalysis.confidence}%)\n\n` + 
                          `[ELEMENTOS VISUAIS DETECTADOS] ${JSON.stringify(visualAnalysis.visualElements)}\n\n` + 
                          extractedText;
          }
          
          // 5. Extrair dados estruturados com Function Calling e RAG
          const parsedData = await parseReservationWithMistralRAG(enhancedText, documentId);
          console.log(`Dados extraídos de "${file.name}" com sucesso: ${JSON.stringify(parsedData).substring(0, 100)}...`);
          
          // 6. Se a plataforma foi detectada visualmente com alta confiança, considerar essa informação
          if (visualAnalysis && visualAnalysis.platform && visualAnalysis.confidence > 70) {
            let normalizedPlatform = visualAnalysis.platform.toLowerCase();
            
            // Normalizar plataforma detectada visualmente
            if (normalizedPlatform.includes('airbnb')) parsedData.platform = 'airbnb';
            else if (normalizedPlatform.includes('booking')) parsedData.platform = 'booking';
            else if (normalizedPlatform.includes('expedia')) parsedData.platform = 'expedia';
            else if (normalizedPlatform.includes('direct')) parsedData.platform = 'direct';
            // Não sobrescrever com 'other' se já temos uma classificação melhor
          }
          
          // 7. Encontrar a propriedade correspondente
          const matchedProperty = properties.find((p: any) => 
            p.name.toLowerCase() === (parsedData.propertyName || '').toLowerCase()
          );
          
          if (!matchedProperty) {
            throw new Error(`Não foi possível encontrar uma propriedade com o nome "${parsedData.propertyName}"`);
          }
          
          console.log(`Propriedade correspondente encontrada para "${file.name}": ${matchedProperty.name} (ID: ${matchedProperty.id})`);
          
          // 8. Retornar os dados extraídos completos
          return {
            extractedData: {
              ...parsedData,
              propertyId: matchedProperty.id,
              // Incluir metadados da análise visual 
              visualAnalysis: visualAnalysis ? {
                platformConfidence: visualAnalysis.confidence,
                detectedElements: visualAnalysis.visualElements
              } : null
            },
            file: {
              filename: file.name,
              path: '/uploads/' + file.name,
              documentId: documentId // Armazenar o ID do documento
            },
            processingStats: {
              time: new Date().toISOString(),
              batch: currentBatch,
              success: true
            }
          };
        } catch (error) {
          // Em caso de erro, retorna o erro associado ao arquivo específico
          console.error(`Erro ao processar arquivo "${file.name}":`, error);
          return {
            error: true,
            message: `Erro ao processar o arquivo "${file.name}": ${error.message}`,
            file: {
              filename: file.name
            },
            processingStats: {
              time: new Date().toISOString(),
              batch: currentBatch,
              success: false
            }
          };
        }
      });
      
      // Aguardar o processamento do lote atual
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Log de progresso
      const successCount = results.filter(r => !r.error).length;
      const failureCount = results.filter(r => r.error).length;
      console.log(`Progresso: ${results.length}/${files.length} PDFs processados (${successCount} sucesso, ${failureCount} falhas)`);
    }
    
    console.log(`Processamento concluído: ${results.length} PDFs processados`);
    return results;
  } catch (error) {
    console.error("Erro ao processar múltiplos PDFs:", error);
    throw error;
  }
}

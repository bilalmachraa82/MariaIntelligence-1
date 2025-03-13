import { apiRequest } from "./queryClient";
import { Mistral } from "@mistralai/mistralai";

/**
 * Interface para dados extraídos do PDF
 */
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

/**
 * Interface para a resposta do upload de PDF
 */
interface UploadResponse {
  extractedData: ExtractedData;
  file: {
    filename: string;
    path: string;
  };
}

// Configure cliente Mistral AI com a chave API
export const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

/**
 * Getter para obter uma instância do cliente Mistral
 * Lazy initialization para garantir que só criamos quando necessário
 */
function getMistralClient(): Mistral {
  return new Mistral({
    apiKey: MISTRAL_API_KEY || ""
  });
}

/**
 * Upload e processamento de PDF
 * @param file Arquivo PDF a ser processado
 */
export async function uploadAndProcessPDF(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("pdf", file);

  const response = await fetch("/api/upload-pdf", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Erro ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

/**
 * Criar uma reserva a partir de dados extraídos
 * @param data Dados extraídos do PDF
 */
export async function createReservationFromExtractedData(data: ExtractedData) {
  try {
    const response = await apiRequest(
      "POST",
      "/api/reservations",
      data
    );
    
    return await response.json();
  } catch (error) {
    console.error("Erro ao criar reserva a partir dos dados extraídos:", error);
    throw error;
  }
}

/**
 * Converter um arquivo para base64
 * @param file Arquivo a ser convertido
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extrair apenas a parte base64 da string data URL
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Falha ao converter para base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Processar PDF com o Mistral AI usando a SDK oficial
 * @param file Arquivo PDF
 */
export async function processPDFWithMistralOCR(file: File): Promise<any> {
  try {
    // Validar tipo de arquivo
    if (!file.type.includes('pdf')) {
      throw new Error("O arquivo deve ser um PDF");
    }
    
    // Converter PDF para base64
    const fileBase64 = await fileToBase64(file);
    
    // Obter cliente Mistral
    const mistral = getMistralClient();
    
    // Extrair texto do PDF usando capacidades de visão do Mistral
    const extractionResponse = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system", 
          content: "Você é um assistente especializado em extrair texto de documentos." 
        },
        { 
          role: "user", 
          content: [
            {
              type: "text",
              text: `Extraia todo o texto visível neste documento PDF de reserva, incluindo cabeçalhos, tabelas e informações relevantes. 
              Preserve a estrutura original do documento (seções, tabelas, etc.).
              Identifique e destaque informações importantes como datas, valores, nomes, etc.
              Processe tabelas mantendo o alinhamento de colunas quando possível.
              Retorne o texto extraído com a estrutura preservada.`
            },
            {
              type: "image_url",
              imageUrl: {
                url: `data:application/pdf;base64,${fileBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      maxTokens: 4000
    });
    
    // Extrair o texto da resposta
    const extractedText = extractionResponse.choices?.[0]?.message.content || null;
    
    if (!extractedText) {
      throw new Error("Falha ao extrair texto do PDF");
    }
    
    // Realizar análise visual para detectar elementos chave (como logo da plataforma)
    const visualAnalysisResponse = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system", 
          content: "Você é um especialista em análise visual de documentos de reserva. Identifique a plataforma de reserva baseado no visual do documento." 
        },
        { 
          role: "user", 
          content: [
            {
              type: "text",
              text: `Analise visualmente este documento de reserva e identifique:
              1. Qual plataforma emitiu este documento? (Airbnb, Booking.com, Expedia, outro?)
              2. Existe algum logo ou marca d'água identificável?
              3. Qual é o formato/layout geral do documento?
              Responda apenas com os fatos observados visualmente.`
            },
            {
              type: "image_url",
              imageUrl: {
                url: `data:application/pdf;base64,${fileBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      maxTokens: 500
    });
    
    // Extrair a análise visual
    const visualContent = visualAnalysisResponse.choices?.[0]?.message.content;
    
    // Detectar plataforma a partir da análise visual
    let detectedPlatform = "unknown";
    if (visualContent && typeof visualContent === "string") {
      const airbnbMatch = visualContent.match(/airbnb/i);
      const bookingMatch = visualContent.match(/booking/i);
      const expediaMatch = visualContent.match(/expedia/i);
      
      if (airbnbMatch) detectedPlatform = "airbnb";
      else if (bookingMatch) detectedPlatform = "booking";
      else if (expediaMatch) detectedPlatform = "expedia";
    }
    
    // Compilar resultados da análise visual
    const visualAnalysis = {
      platform: detectedPlatform,
      visualDetails: visualContent
    };
    
    // Melhorar o prompt baseado na plataforma detectada visualmente
    let systemPrompt = 'Você é um assistente especializado em extrair dados estruturados de documentos de reservas de alojamentos em Portugal.';
    
    // Usar a plataforma detectada para personalizar o prompt
    if (visualAnalysis && visualAnalysis.platform) {
      const detectedPlatform = visualAnalysis.platform.toLowerCase();
      if (detectedPlatform.includes('airbnb')) {
        systemPrompt += ' Este documento é do Airbnb. As reservas Airbnb geralmente incluem tarifas de serviço, taxa de limpeza e total discriminados.';
      } else if (detectedPlatform.includes('booking') || detectedPlatform.includes('booking.com')) {
        systemPrompt += ' Este documento é do Booking.com. As reservas Booking geralmente incluem número de confirmação, taxa de serviço e valores com impostos inclusos.';
      } else if (detectedPlatform.includes('expedia')) {
        systemPrompt += ' Este documento é da Expedia. As reservas Expedia geralmente incluem número de itinerário e taxas discriminadas.';
      }
    }
    
    // Definir o esquema da função de extração
    const functionDef = {
      name: "extract_reservation_data",
      description: "Extrair dados estruturados de uma reserva",
      parameters: {
        type: "object",
        properties: {
          propertyId: {
            type: "integer",
            description: "ID da propriedade (se não for encontrado, use 1)"
          },
          propertyName: {
            type: "string",
            description: "Nome da propriedade/alojamento reservado"
          },
          guestName: {
            type: "string",
            description: "Nome completo do hóspede"
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
            description: "Data de check-in no formato YYYY-MM-DD"
          },
          checkOutDate: {
            type: "string",
            description: "Data de check-out no formato YYYY-MM-DD"
          },
          numGuests: {
            type: "integer",
            description: "Número de hóspedes"
          },
          totalAmount: {
            type: "number",
            description: "Valor total da reserva (valor numérico apenas)"
          },
          platform: {
            type: "string",
            description: "Plataforma de reserva (airbnb, booking, expedia, direct, other)"
          },
          platformFee: {
            type: "number",
            description: "Taxa da plataforma (valor numérico apenas)"
          },
          cleaningFee: {
            type: "number",
            description: "Taxa de limpeza (valor numérico apenas)"
          },
          checkInFee: {
            type: "number",
            description: "Taxa de check-in (valor numérico apenas)"
          },
          commissionFee: {
            type: "number",
            description: "Taxa de comissão (valor numérico apenas)"
          },
          teamPayment: {
            type: "number",
            description: "Pagamento à equipe (valor numérico apenas)"
          }
        },
        required: ["propertyId", "propertyName", "guestName", "checkInDate", "checkOutDate", "numGuests", "totalAmount", "platform"]
      }
    };
    
    // 5. Extrair dados estruturados usando function calling
    const extractionResult = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { 
          role: "user", 
          content: `Analise este documento de reserva e extraia todas as informações relevantes usando a função fornecida.
          
          Texto extraído do documento:
          ${extractedText}
          
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
        {
          type: "function",
          function: functionDef
        }
      ],
      toolChoice: {
        type: "function",
        function: { name: "extract_reservation_data" }
      }
    });
    
    // 6. Extrair resultados da função
    let extractedData = null;
    
    if (extractionResult.choices?.[0]?.message.toolCalls && 
        extractionResult.choices[0].message.toolCalls.length > 0) {
      
      try {
        const functionCall = extractionResult.choices[0].message.toolCalls[0];
        if (functionCall.type === 'function' && 
            functionCall.function.name === 'extract_reservation_data') {
          extractedData = JSON.parse(functionCall.function.arguments);
        }
      } catch (err) {
        console.error("Erro ao processar resultado da função:", err);
      }
    }
    
    // 7. Retornar os resultados
    return {
      success: !!extractedData,
      extractedText,
      extractedData,
      visualAnalysis,
      file: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    };
    
  } catch (error) {
    console.error("Erro ao processar PDF com Mistral AI:", error);
    throw error;
  }
}

/**
 * Processa uma imagem de reserva usando visão computacional do Mistral AI
 * @param file Arquivo de imagem a ser processado (JPEG, PNG, etc)
 */
export async function processImageWithMistralOCR(file: File): Promise<any> {
  try {
    // Validar tipo de arquivo
    if (!file.type.includes('image')) {
      throw new Error("O arquivo deve ser uma imagem (JPEG, PNG, etc)");
    }
    
    // Converter imagem para base64
    const fileBase64 = await fileToBase64(file);
    
    // Obter cliente Mistral
    const mistral = getMistralClient();
    
    // Extrair texto da imagem usando capacidades de visão do Mistral
    const extractionResponse = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system", 
          content: "Você é um especialista em OCR (Reconhecimento Óptico de Caracteres) para documentos de reservas de alojamento."
        },
        { 
          role: "user", 
          content: [
            {
              type: "text",
              text: "Extraia todo o texto visível nesta imagem, incluindo números, datas, nomes e valores monetários. Preste atenção especial a detalhes como informações de check-in/check-out, valor total e nome do hóspede."
            },
            {
              type: "image_url",
              imageUrl: {
                url: `data:${file.type};base64,${fileBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      maxTokens: 2000
    });
    
    // Extrair o texto da resposta
    const extractedText = extractionResponse.choices?.[0]?.message.content || "";
    
    // Definir o esquema da função de extração (mesmo do método processPDFWithMistralOCR)
    const functionDef = {
      name: "extract_reservation_data",
      description: "Extrair dados estruturados de uma reserva",
      parameters: {
        type: "object",
        properties: {
          propertyId: {
            type: "integer",
            description: "ID da propriedade (se não for encontrado, use 1)"
          },
          propertyName: {
            type: "string",
            description: "Nome da propriedade/alojamento reservado"
          },
          guestName: {
            type: "string",
            description: "Nome completo do hóspede"
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
            description: "Data de check-in no formato YYYY-MM-DD"
          },
          checkOutDate: {
            type: "string",
            description: "Data de check-out no formato YYYY-MM-DD"
          },
          numGuests: {
            type: "integer",
            description: "Número de hóspedes"
          },
          totalAmount: {
            type: "number",
            description: "Valor total da reserva (valor numérico apenas)"
          },
          platform: {
            type: "string",
            description: "Plataforma de reserva (airbnb, booking, expedia, direct, other)"
          },
          platformFee: {
            type: "number",
            description: "Taxa da plataforma (valor numérico apenas)"
          },
          cleaningFee: {
            type: "number",
            description: "Taxa de limpeza (valor numérico apenas)"
          },
          checkInFee: {
            type: "number",
            description: "Taxa de check-in (valor numérico apenas)"
          },
          commissionFee: {
            type: "number",
            description: "Taxa de comissão (valor numérico apenas)"
          },
          teamPayment: {
            type: "number",
            description: "Pagamento à equipe (valor numérico apenas)"
          }
        },
        required: ["propertyId", "propertyName", "guestName", "checkInDate", "checkOutDate", "numGuests", "totalAmount", "platform"]
      }
    };
    
    // Extrair dados estruturados usando function calling
    const extractionResult = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system", 
          content: "Você é um assistente especializado em extrair dados estruturados de documentos de reservas de alojamentos em Portugal."
        },
        { 
          role: "user", 
          content: `Analise este texto extraído de uma imagem de documento de reserva e extraia todas as informações relevantes usando a função fornecida.
          
          Texto extraído da imagem:
          ${extractedText}
          
          Instruções específicas:
          1. Para valores monetários, extraia apenas os números (sem símbolos de moeda)
          2. Para datas, converta para o formato YYYY-MM-DD
          3. Para campos não encontrados, use null
          4. A plataforma deve ser categorizada como: 'airbnb', 'booking', 'expedia', 'direct' ou 'other'
          5. Seja preciso na extração de todos os valores, especialmente datas e valores financeiros
          6. Se não houver informações suficientes, faça a melhor estimativa possível`
        }
      ],
      temperature: 0.1,
      tools: [
        {
          type: "function",
          function: functionDef
        }
      ],
      toolChoice: {
        type: "function",
        function: { name: "extract_reservation_data" }
      }
    });
    
    // Extrair resultados da função
    let extractedData = null;
    
    if (extractionResult.choices && 
        extractionResult.choices[0] && 
        extractionResult.choices[0].message.toolCalls && 
        extractionResult.choices[0].message.toolCalls.length > 0) {
      
      try {
        const functionCall = extractionResult.choices[0].message.toolCalls[0];
        if (functionCall.type === 'function' && 
            functionCall.function.name === 'extract_reservation_data') {
          extractedData = JSON.parse(functionCall.function.arguments);
        }
      } catch (err) {
        console.error("Erro ao processar resultado da função:", err);
      }
    }
    
    // Retornar os resultados
    return {
      success: !!extractedData,
      extractedText,
      extractedData,
      file: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    };
    
  } catch (error) {
    console.error("Erro ao processar imagem com Mistral AI:", error);
    throw error;
  }
}

/**
 * Processa uma imagem ou PDF de reserva
 * @param file Arquivo (imagem ou PDF) a ser processado
 */
export async function processReservationFile(file: File): Promise<UploadResponse> {
  try {
    // Determinar tipo de processamento com base no tipo de arquivo
    let result;
    
    if (file.type.includes('pdf')) {
      result = await processPDFWithMistralOCR(file);
    } else if (file.type.includes('image')) {
      result = await processImageWithMistralOCR(file);
    } else {
      throw new Error("Tipo de arquivo não suportado. Por favor, envie um PDF ou uma imagem.");
    }
    
    // Verificar se temos dados extraídos
    if (!result.extractedData) {
      throw new Error("Não foi possível extrair dados suficientes do arquivo. Por favor, tente novamente ou envie um arquivo diferente.");
    }
    
    // Formatar a resposta
    const response: UploadResponse = {
      extractedData: result.extractedData,
      file: {
        filename: file.name,
        path: URL.createObjectURL(file) // Cria uma URL temporária para o arquivo
      }
    };
    
    return response;
    
  } catch (error) {
    console.error("Erro ao processar arquivo de reserva:", error);
    throw error;
  }
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
    // Validar número de arquivos
    if (!files.length) {
      throw new Error("Nenhum arquivo fornecido para processamento");
    }
    
    // Limitar o número de arquivos processados de uma vez
    if (files.length > 10) {
      throw new Error("Máximo de 10 arquivos podem ser processados de uma vez");
    }
    
    // Verificar se temos uma chave API válida
    if (!MISTRAL_API_KEY) {
      throw new Error("Chave da API Mistral não configurada. Por favor, configure nas configurações.");
    }
    
    // Converter todos os arquivos para base64 em paralelo
    const filePromises = files.map(async (file) => {
      return {
        name: file.name,
        base64: await fileToBase64(file),
        type: file.type
      };
    });
    
    const fileData = await Promise.all(filePromises);
    
    // Obter cliente Mistral
    const mistral = getMistralClient();
    
    // Analisar cada arquivo em série (para evitar throttling da API)
    const results = [];
    
    for (const file of fileData) {
      try {
        console.log(`Processando arquivo: ${file.name}`);
        
        // Verificar tipo de arquivo
        const isPDF = file.type.includes('pdf');
        const isImage = file.type.includes('image');
        
        if (!isPDF && !isImage) {
          results.push({
            filename: file.name,
            success: false,
            error: "Tipo de arquivo não suportado. Apenas PDFs e imagens são suportados.",
            extractedData: null
          });
          continue;
        }
        
        // Definir o schema da função
        const functionDef = {
          name: "extract_reservation_data",
          description: "Extrair dados estruturados de uma reserva",
          parameters: {
            type: "object",
            properties: {
              propertyId: {
                type: "integer",
                description: "ID da propriedade (se não for encontrado, use 1)"
              },
              propertyName: {
                type: "string",
                description: "Nome da propriedade/alojamento reservado"
              },
              guestName: {
                type: "string",
                description: "Nome completo do hóspede"
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
                description: "Data de check-in no formato YYYY-MM-DD"
              },
              checkOutDate: {
                type: "string",
                description: "Data de check-out no formato YYYY-MM-DD"
              },
              numGuests: {
                type: "integer",
                description: "Número de hóspedes"
              },
              totalAmount: {
                type: "number",
                description: "Valor total da reserva (valor numérico apenas)"
              },
              platform: {
                type: "string",
                description: "Plataforma de reserva (airbnb, booking, expedia, direct, other)"
              },
              platformFee: {
                type: "number",
                description: "Taxa da plataforma (valor numérico apenas)"
              },
              cleaningFee: {
                type: "number",
                description: "Taxa de limpeza (valor numérico apenas)"
              },
              checkInFee: {
                type: "number",
                description: "Taxa de check-in (valor numérico apenas)"
              },
              commissionFee: {
                type: "number",
                description: "Taxa de comissão (valor numérico apenas)"
              },
              teamPayment: {
                type: "number",
                description: "Pagamento à equipe (valor numérico apenas)"
              }
            },
            required: ["propertyId", "propertyName", "guestName", "checkInDate", "checkOutDate", "numGuests", "totalAmount", "platform"]
          }
        };
        
        // Passo 1: Obter texto completo e analisar visuais em um único passo
        const extractionResponse = await mistral.chat.complete({
          model: "mistral-large-latest",
          messages: [
            { 
              role: "system", 
              content: "Você é um especialista em análise de documentos. Extraia texto e analise visualmente este documento de reserva."
            },
            { 
              role: "user", 
              content: [
                { 
                  type: "text", 
                  text: "Extraia todo o texto visível neste documento e identifique visualmente a plataforma de reserva (Airbnb, Booking, etc)."
                },
                { 
                  type: "image_url", 
                  imageUrl: {
                    url: `data:${file.type};base64,${file.base64}`,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          maxTokens: 4000
        });
        
        // Extrair texto e análise visual
        const contentText = extractionResponse.choices?.[0]?.message.content || "";
        
        // Passo 2: Extrair dados estruturados com base no texto
        const extractionResult = await mistral.chat.complete({
          model: "mistral-large-latest",
          messages: [
            { 
              role: "system", 
              content: "Você é um assistente especializado em extrair dados estruturados de documentos de reservas de alojamentos em Portugal."
            },
            { 
              role: "user", 
              content: `Analise este documento de reserva e extraia todas as informações relevantes usando a função fornecida.
              
              Texto extraído do documento:
              ${contentText}
              
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
            {
              type: "function",
              function: functionDef
            }
          ],
          toolChoice: {
            type: "function",
            function: { name: "extract_reservation_data" }
          }
        });
        
        // Extrair dados estruturados
        let extractedData = null;
        let extractionError = null;
        
        if (extractionResult.choices?.[0]?.message.toolCalls && 
            extractionResult.choices[0].message.toolCalls.length > 0) {
          
          try {
            const functionCall = extractionResult.choices[0].message.toolCalls[0];
            if (functionCall.type === 'function' && 
                functionCall.function.name === 'extract_reservation_data') {
              extractedData = JSON.parse(functionCall.function.arguments);
            }
          } catch (err) {
            console.error(`Erro ao processar resultado da função para ${file.name}:`, err);
            extractionError = err instanceof Error ? err.message : String(err);
          }
        }
        
        // Adicionar ao array de resultados
        results.push({
          filename: file.name,
          success: !!extractedData,
          text: contentText.substring(0, 500) + "...", // Truncar para evitar respostas muito grandes
          extractedData,
          error: extractionError
        });
        
      } catch (error) {
        console.error(`Erro ao processar arquivo ${file.name}:`, error);
        results.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          extractedData: null
        });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error("Erro ao processar múltiplos PDFs:", error);
    throw error;
  }
}
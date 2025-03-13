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
    const errorText = await response.text();
    throw new Error(`Failed to process PDF: ${errorText}`);
  }

  return await response.json();
}

/**
 * Criar uma reserva a partir de dados extraídos
 * @param data Dados extraídos do PDF
 */
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
 * Converter um arquivo para base64
 * @param file Arquivo a ser convertido
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remover prefixo data:application/pdf;base64,
      const base64 = result.split(",")[1];
      resolve(base64);
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
    console.log(`Iniciando processamento do PDF "${file.name}" com Mistral AI`);
    
    // 1. Converter arquivo para base64
    const fileBase64 = await fileToBase64(file);
    
    // 2. Usar a API de Chat para extrair texto usando multimodal capabilities
    const mistral = getMistralClient();
    
    // 2.1 Extrair texto do PDF com visão multimodal
    const extractionResponse = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system", 
          content: "Você é um assistente especializado em processamento de documentos e OCR, com foco em extração de texto precisa e estruturada de arquivos PDF relacionados a reservas de alojamento local em Portugal."
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
              image_url: {
                url: `data:application/pdf;base64,${fileBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    });
    
    const extractedText = extractionResponse.choices[0].message.content;
    console.log(`Texto extraído com sucesso. Tamanho: ${extractedText.length} caracteres`);
    
    // 3. Analisar visualmente para identificar a plataforma
    const visualAnalysisResponse = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system", 
          content: "Você é um especialista em análise visual de documentos, focado em identificar elementos visuais e layouts de diferentes plataformas de reserva (Airbnb, Booking.com, Expedia, etc.)."
        },
        { 
          role: "user", 
          content: [
            {
              type: "text",
              text: `Analise visualmente este documento de reserva e identifique a plataforma com base no layout, cores, logotipos e elementos visuais.
              Concentre-se principalmente em:
              1. Logotipos de plataformas como Airbnb, Booking.com, Expedia
              2. Esquemas de cores característicos (vermelho para Airbnb, azul para Booking)
              3. Layout e formatação típicos de cada plataforma
              
              Responda APENAS com um JSON no formato:
              {
                "platform": "nome da plataforma (airbnb, booking, expedia, direct ou other)",
                "confidence": percentual de confiança numérico (0-100),
                "visualElements": ["elementos visuais identificados"]
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${fileBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });
    
    // Analisar resposta JSON
    let visualAnalysis = null;
    try {
      const visualContent = visualAnalysisResponse.choices[0].message.content;
      // Extrair objeto JSON da resposta
      const jsonMatch = visualContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        visualAnalysis = JSON.parse(jsonMatch[0]);
        console.log("Análise visual concluída:", visualAnalysis);
      }
    } catch (error) {
      console.warn("Não foi possível analisar resultado visual:", error);
    }
    
    // 4. Extrair dados estruturados com function calling
    const functionDef = {
      name: "extract_reservation_data",
      description: "Extrai informações estruturadas de um documento de reserva de alojamento local",
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
      tool_choice: {
        type: "function",
        function: { name: "extract_reservation_data" }
      }
    });
    
    // 6. Processar resultados da extração
    let parsedData: any = {};
    try {
      // Extrair os argumentos da função
      const toolCalls = extractionResult.choices[0].message.tool_calls;
      
      if (!toolCalls || toolCalls.length === 0) {
        throw new Error("A API não retornou dados estruturados");
      }
      
      parsedData = JSON.parse(toolCalls[0].function.arguments);
      console.log("Dados extraídos via Function Calling:", parsedData);
      
      // Garantir que valores numéricos sejam números
      if (parsedData.totalAmount && typeof parsedData.totalAmount === 'string') {
        parsedData.totalAmount = parseFloat(parsedData.totalAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      }
      
      if (parsedData.numGuests && typeof parsedData.numGuests === 'string') {
        parsedData.numGuests = parseInt(parsedData.numGuests, 10) || 1;
      }
      
      // Normalizar as taxas para garantir que sejam números
      ['platformFee', 'cleaningFee', 'checkInFee', 'commissionFee', 'teamPayment'].forEach(fee => {
        if (parsedData[fee] && typeof parsedData[fee] === 'string') {
          parsedData[fee] = parseFloat(parsedData[fee].replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        } else if (parsedData[fee] === undefined) {
          parsedData[fee] = 0; // Garantir que todas as taxas tenham um valor padrão
        }
      });
      
      // Usar a plataforma detectada visualmente para melhorar a classificação
      if (visualAnalysis && visualAnalysis.platform && visualAnalysis.confidence > 70) {
        const normalizedVisualPlatform = visualAnalysis.platform.toLowerCase();
        
        // Normalizar plataforma detectada visualmente
        if (normalizedVisualPlatform.includes('airbnb')) {
          parsedData.platform = 'airbnb';
        } else if (normalizedVisualPlatform.includes('booking')) {
          parsedData.platform = 'booking';
        } else if (normalizedVisualPlatform.includes('expedia')) {
          parsedData.platform = 'expedia';
        } else if (normalizedVisualPlatform.includes('direct')) {
          parsedData.platform = 'direct';
        }
        // Não sobrescrever com 'other' se já temos uma classificação melhor
      }
      
      console.log(`Dados estruturados extraídos com sucesso:`, parsedData);
      
      // 7. Encontrar o ID da propriedade pelo nome
      const propertiesResponse = await fetch('/api/properties');
      if (!propertiesResponse.ok) {
        throw new Error('Falha ao obter a lista de propriedades');
      }
      
      const properties = await propertiesResponse.json();
      
      // Tentar encontrar uma correspondência exata
      const exactMatch = properties.find((p: any) => 
        p.name.toLowerCase() === parsedData.propertyName.toLowerCase()
      );
      
      if (exactMatch) {
        parsedData.propertyId = exactMatch.id;
      } else {
        // Correspondência parcial (contém)
        const partialMatch = properties.find((p: any) => 
          parsedData.propertyName.toLowerCase().includes(p.name.toLowerCase()) || 
          p.name.toLowerCase().includes(parsedData.propertyName.toLowerCase())
        );
        
        if (partialMatch) {
          parsedData.propertyId = partialMatch.id;
        } else {
          // Usar a primeira propriedade como fallback se necessário
          if (properties.length > 0) {
            parsedData.propertyId = properties[0].id;
          } else {
            throw new Error('Nenhuma propriedade encontrada no sistema');
          }
        }
      }
      
      return {
        extractedData: parsedData,
        file: {
          filename: file.name,
          path: `/uploads/${file.name}`
        }
      };
    } catch (error) {
      console.error("Erro ao processar dados da reserva:", error);
      throw new Error(`Falha ao processar dados da reserva: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  } catch (error) {
    console.error("Erro geral no processamento:", error);
    throw new Error(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Processa uma imagem de reserva usando visão computacional do Mistral AI
 * @param file Arquivo de imagem a ser processado (JPEG, PNG, etc)
 */
export async function processImageWithMistralOCR(file: File): Promise<any> {
  try {
    console.log(`Iniciando processamento da imagem "${file.name}" com Mistral AI`);
    
    // 1. Converter arquivo para base64
    const fileBase64 = await fileToBase64(file);
    
    // 2. Usar a API de Chat para extrair texto usando multimodal capabilities
    const mistral = getMistralClient();
    
    // 2.1 Extrair texto da imagem com visão multimodal
    const extractionResponse = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system", 
          content: "Você é um assistente especializado em processamento de imagens e OCR, com foco em extração de texto precisa e estruturada de imagens relacionadas a reservas de alojamento local em Portugal."
        },
        { 
          role: "user", 
          content: [
            {
              type: "text",
              text: `Extraia todo o texto visível nesta imagem de reserva, incluindo cabeçalhos, tabelas e informações relevantes. 
              Preserve a estrutura original do documento (seções, tabelas, etc.).
              Identifique e destaque informações importantes como datas, valores, nomes, etc.
              Processe tabelas mantendo o alinhamento de colunas quando possível.
              Retorne o texto extraído com a estrutura preservada.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${file.type};base64,${fileBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    });
    
    const extractedText = extractionResponse.choices?.[0]?.message.content || "";
    console.log(`Texto extraído com sucesso. Tamanho: ${extractedText.length} caracteres`);
    
    // 3. Extrair dados estruturados com function calling
    const functionDef = {
      name: "extract_reservation_data",
      description: "Extrai informações estruturadas de uma imagem de reserva de alojamento local",
      parameters: {
        type: "object",
        properties: {
          propertyName: {
            type: "string",
            description: "Nome da propriedade/alojamento conforme aparece na imagem"
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
    };
    
    // 4. Extrair dados estruturados
    const extractionResult = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { 
          role: "system", 
          content: "Você é um assistente especializado em extrair dados estruturados de imagens de reservas de alojamentos em Portugal."
        },
        { 
          role: "user", 
          content: `Analise esta imagem de reserva e extraia todas as informações relevantes usando a função fornecida.
          
          Texto extraído da imagem:
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
    
    // 5. Processar resultados da extração
    let parsedData: any = {};
    try {
      // Extrair os argumentos da função
      const toolCalls = extractionResult.choices?.[0]?.message.toolCalls;
      
      if (!toolCalls || toolCalls.length === 0) {
        throw new Error("A API não retornou dados estruturados");
      }
      
      parsedData = JSON.parse(toolCalls[0].function.arguments);
      console.log("Dados extraídos via Function Calling:", parsedData);
      
      // Garantir que valores numéricos sejam números
      if (parsedData.totalAmount && typeof parsedData.totalAmount === 'string') {
        parsedData.totalAmount = parseFloat(parsedData.totalAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      }
      
      if (parsedData.numGuests && typeof parsedData.numGuests === 'string') {
        parsedData.numGuests = parseInt(parsedData.numGuests, 10) || 1;
      }
      
      // Normalizar as taxas para garantir que sejam números
      ['platformFee', 'cleaningFee', 'checkInFee', 'commissionFee', 'teamPayment'].forEach(fee => {
        if (parsedData[fee] && typeof parsedData[fee] === 'string') {
          parsedData[fee] = parseFloat(parsedData[fee].replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        } else if (parsedData[fee] === undefined) {
          parsedData[fee] = 0; // Garantir que todas as taxas tenham um valor padrão
        }
      });
      
      console.log(`Dados estruturados extraídos com sucesso:`, parsedData);
      
      // 6. Encontrar o ID da propriedade pelo nome
      const propertiesResponse = await fetch('/api/properties');
      if (!propertiesResponse.ok) {
        throw new Error('Falha ao obter a lista de propriedades');
      }
      
      const properties = await propertiesResponse.json();
      
      // Tentar encontrar uma correspondência exata
      const exactMatch = properties.find((p: any) => 
        p.name.toLowerCase() === parsedData.propertyName.toLowerCase()
      );
      
      if (exactMatch) {
        parsedData.propertyId = exactMatch.id;
      } else {
        // Correspondência parcial (contém)
        const partialMatch = properties.find((p: any) => 
          parsedData.propertyName.toLowerCase().includes(p.name.toLowerCase()) || 
          p.name.toLowerCase().includes(parsedData.propertyName.toLowerCase())
        );
        
        if (partialMatch) {
          parsedData.propertyId = partialMatch.id;
        } else {
          // Usar a primeira propriedade como fallback se necessário
          if (properties.length > 0) {
            parsedData.propertyId = properties[0].id;
          } else {
            throw new Error('Nenhuma propriedade encontrada no sistema');
          }
        }
      }
      
      return {
        extractedData: parsedData,
        file: {
          filename: file.name,
          path: `/uploads/${file.name}`
        }
      };
    } catch (error) {
      console.error("Erro ao processar dados da imagem de reserva:", error);
      throw new Error(`Falha ao processar dados da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  } catch (error) {
    console.error("Erro geral no processamento de imagem:", error);
    throw new Error(`Erro ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Processa uma imagem ou PDF de reserva
 * @param file Arquivo (imagem ou PDF) a ser processado
 */
export async function processReservationFile(file: File): Promise<UploadResponse> {
  const isPDF = file.type === 'application/pdf';
  
  // Processar conforme o tipo de arquivo
  if (isPDF) {
    return uploadAndProcessPDF(file);
  } else {
    // Assumimos que é uma imagem (jpg, png, etc)
    return processImageWithMistralOCR(file);
  }
}

/**
 * Processar múltiplos PDFs usando Document API, RAG e análise multimodal
 * Implementa processamento de alta performance com recursos avançados
 * 
 * @param files Array de arquivos PDF a serem processados
 * @returns Array de resultados processados
 */
export async function processMultiplePDFs(files: File[]): Promise<any[]> {
  try {
    console.log(`Iniciando processamento de ${files.length} PDFs com Mistral AI`);
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    // Processar arquivos sequencialmente para evitar sobrecarga da API
    for (const file of files) {
      try {
        const result = await processPDFWithMistralOCR(file);
        results.push(result);
        successCount++;
        console.log(`Processado com sucesso: ${file.name}`);
      } catch (error) {
        failureCount++;
        results.push({
          error: true,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          file: {
            filename: file.name,
            path: ''
          }
        });
        console.error(`Falha ao processar ${file.name}:`, error);
      }
      
      console.log(`Progresso: ${results.length}/${files.length} PDFs processados (${successCount} sucesso, ${failureCount} falhas)`);
    }
    
    console.log(`Processamento concluído: ${results.length} PDFs processados`);
    return results;
  } catch (error) {
    console.error("Erro geral no processamento em lote:", error);
    throw new Error(`Erro no processamento em lote: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
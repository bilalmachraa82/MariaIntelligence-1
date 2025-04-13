import { apiRequest } from "./queryClient";
// Removido importação do Mistral, substituído por Gemini

/**
 * Enum para status de validação
 */
export enum ValidationStatus {
  VALID = 'valid',               // Todos os campos obrigatórios presentes
  INCOMPLETE = 'incomplete',     // Faltam alguns campos obrigatórios
  NEEDS_REVIEW = 'needs_review', // Tem informações mas precisa de revisão manual
  FAILED = 'failed'              // Falha na extração ou validação
}

/**
 * Interface para erros de validação
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Interface para dados extraídos do PDF
 */
export interface ExtractedData {
  propertyId?: number;
  propertyName: string;          // Obrigatório
  guestName: string;             // Obrigatório
  guestEmail?: string;           // Opcional
  guestPhone?: string;           // Opcional
  checkInDate: string;           // Obrigatório
  checkOutDate: string;          // Obrigatório
  numGuests?: number;            // Opcional
  totalAmount?: number;          // Opcional
  platform?: string;             // Opcional
  platformFee?: number;          // Opcional
  cleaningFee?: number;          // Opcional
  checkInFee?: number;           // Opcional
  commissionFee?: number;        // Opcional
  teamPayment?: number;          // Opcional
  rawText?: string;              // Texto bruto extraído
  documentType?: string;         // Tipo de documento (reserva, fatura, etc.)
  observations?: string;         // Observações adicionais
  validationStatus?: ValidationStatus; // Status de validação
}

/**
 * Interface para a resposta do upload de PDF
 */
export interface UploadResponse {
  success: boolean;
  extractedData: ExtractedData;
  validation: {
    status: ValidationStatus;
    isValid: boolean;
    errors: ValidationError[];
    missingFields: string[];
    warningFields: string[];
  };
  file: {
    filename: string;
    path: string;
  };
  rawText?: string;
  fromCache?: boolean;
  warning?: string;
}

// Configure cliente Mistral AI com a chave API
export const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

/**
 * Função de utilidade para fazer parse seguro de argumentos Function Call
 * @param args Argumentos da chamada de função (string ou objeto)
 * @returns Objeto parseado ou null se falhar
 */
function safeParseArguments(args: any): any {
  if (!args) return null;
  
  try {
    if (typeof args === 'string') {
      return JSON.parse(args);
    } else if (typeof args === 'object') {
      return args;
    }
    return null;
  } catch (err) {
    console.error("Erro ao fazer parse de argumentos:", err);
    return null;
  }
}

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
 * Função auxiliar para processar de forma segura argumentos de uma função call Mistral
 * @param functionCall Objeto de chamada de função retornado pela API Mistral
 * @returns Dados extraídos ou null se houver falha
 */
function processFunctionCallArguments(functionCall: any): any {
  try {
    if (!functionCall || 
        functionCall.type !== 'function' || 
        functionCall.function.name !== 'extract_reservation_data') {
      return null;
    }
    
    // Garantir que o argumento é uma string antes de fazer o parse
    const args = typeof functionCall.function.arguments === 'string' 
      ? functionCall.function.arguments 
      : JSON.stringify(functionCall.function.arguments);
      
    return JSON.parse(args);
  } catch (err) {
    console.error("Erro ao processar argumentos da chamada de função:", err);
    return null;
  }
}

/**
 * Função auxiliar para processar conteúdo de texto, garantindo que seja string
 * @param content Conteúdo textual da resposta da API Mistral
 * @returns Conteúdo como string, vazio se for inválido
 */
function extractTextContent(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(chunk => typeof chunk === 'object' && chunk.type === 'text')
      .map(chunk => chunk.text)
      .join('\n');
  }
  return '';
}

/**
 * Upload e processamento de PDF
 * @param file Arquivo PDF a ser processado
 */
export async function uploadAndProcessPDF(file: File, options: { useCache?: boolean, skipQualityCheck?: boolean } = {}): Promise<UploadResponse> {
  const { useCache = false, skipQualityCheck = false } = options;
  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("useCache", useCache ? "true" : "false");
  formData.append("skipQualityCheck", skipQualityCheck ? "true" : "false");

  console.log(`Enviando PDF para servidor: ${file.name} (${file.size} bytes)`);
  
  try {
    // Fazer a requisição ao servidor
    const response = await fetch("/api/upload-pdf", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    // Resposta obtida - verificar status
    console.log(`Resposta recebida do servidor: ${response.status} ${response.statusText}`);
    
    // Em caso de erro de status, obter texto de erro
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na resposta do servidor: ${response.status}`, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    // Processar resposta JSON
    const result = await response.json();
    console.log("Dados extraídos do PDF:", result);
    
    // Verificação de segurança
    if (!result.success && !result.extractedData) {
      throw new Error(result.message || "Falha no processamento do PDF");
    }
    
    // Se não houver extractedData ou estiver vazio
    if (!result.extractedData) {
      // Criar estrutura para não quebrar o fluxo na interface
      console.warn("Resposta sem dados extraídos, criando estrutura mínima");
      
      // Definir dados extraídos mínimos como objeto, não como string
      result.extractedData = {
        propertyName: "Não identificada",
        guestName: "Não identificado",
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        numGuests: 1,
        totalAmount: 0,
        platform: "other"
      } as any; // Usar 'as any' temporariamente para evitar problemas de tipo
      
      // Adicionar aviso ao componente do resultado
      result.warning = "Não foi possível extrair todos os dados do PDF. Por favor, preencha manualmente os campos em branco.";
    }
    
    return result;
  } catch (error) {
    console.error("Erro ao processar PDF:", error);
    // Relançar o erro para tratamento no componente
    throw error;
  }
}

/**
 * Criar uma reserva a partir de dados extraídos
 * @param data Dados extraídos do PDF
 */
export async function createReservationFromExtractedData(data: ExtractedData) {
  try {
    // Verificar se temos dados válidos
    if (!data || typeof data !== 'object') {
      throw new Error('Dados de reserva inválidos ou incompletos');
    }
    
    // Extrair apenas os dados relevantes para a criação da reserva (excluindo metadados de validação)
    // e convertendo para o formato esperado pela API
    const reservationData: any = {
      propertyId: data.propertyId,
      propertyName: data.propertyName,
      guestName: data.guestName,
      guestEmail: data.guestEmail || '',
      guestPhone: data.guestPhone || '',
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      numGuests: data.numGuests || 2,
      totalAmount: data.totalAmount || 0,
      platform: data.platform || 'other',
      platformFee: data.platformFee || 0,
      cleaningFee: data.cleaningFee || 0,
      checkInFee: data.checkInFee || 0,
      commissionFee: data.commissionFee || 0,
      teamPayment: data.teamPayment || 0
    };
    
    // Usar fetch diretamente para evitar problemas de tipo com apiRequest
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reservationData)
    });
    
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
 * Processar PDF com a API Gemini usando OCR
 * @param file Arquivo PDF
 */
export async function processPDFWithOCR(
  file: File, 
  options: { skipQualityCheck?: boolean, useCache?: boolean } = {}
): Promise<any> {
  try {
    const { skipQualityCheck = false, useCache = false } = options;
    
    // Validar tipo de arquivo
    if (!file.type.includes('pdf')) {
      throw new Error("O arquivo deve ser um PDF");
    }
    
    console.log("Iniciando processamento do PDF no servidor...");
    
    // Em vez de usar o código de processamento direto no cliente, vamos usar o endpoint do servidor
    // que utiliza pdf-parse + análise de texto com o Gemini
    const formData = new FormData();
    formData.append("pdf", file);
    
    // Adicionar opções de processamento ao formulário
    formData.append("skipQualityCheck", skipQualityCheck ? "true" : "false");
    formData.append("useCache", useCache ? "true" : "false");
    
    // Enviar para o endpoint de processamento de PDF no servidor
    const response = await fetch('/api/upload-pdf', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resposta de erro do servidor:", errorText);
      throw new Error(`Erro no processamento do PDF: ${errorText}`);
    }
    
    // Processar resposta JSON do servidor
    const result = await response.json();
    console.log("Resposta do processamento de PDF no servidor:", result);
    
    // Se não há dados extraídos ou há erro, mostrar alerta na UI
    if (!result.extractedData) {
      console.warn("Servidor não retornou dados extraídos");
      throw new Error("Não foi possível extrair dados do PDF. Por favor, tente novamente ou preencha manualmente.");
    }
    
    return {
      success: true,
      extractedData: result.extractedData,
      rawText: result.rawText || "",
      file: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    };
    
  } catch (error) {
    console.error("Erro ao processar PDF com Google Gemini:", error);
    throw error;
  }
}

// Função removida: processImageWithMistralOCR não é necessária
// pois não temos acesso ao modelo Mistral Vision

/**
 * Processa um PDF de reserva com o sistema aprimorado
 * @param file Arquivo PDF a ser processado
 * @param options Opções adicionais para o processamento
 */
export async function processReservationFile(
  file: File, 
  options: { 
    useCache?: boolean, 
    skipQualityCheck?: boolean,
    onProgress?: (progress: number) => void
  } = {}
): Promise<UploadResponse> {
  try {
    const { useCache = false, skipQualityCheck = false, onProgress } = options;
    
    // Verificar se é PDF
    if (!file.type.includes('pdf')) {
      throw new Error(
        "Tipo de arquivo não suportado. Por favor, envie somente arquivos PDF."
      );
    }
    
    // Verificar tamanho do arquivo (limite de 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `O arquivo é muito grande (${(file.size / (1024 * 1024)).toFixed(2)}MB). O tamanho máximo é 10MB.`
      );
    }
    
    // Verificação de cache (usando localStorage como armazenamento temporário)
    if (useCache) {
      try {
        const cacheKey = `ocr_cache_${file.name}_${file.size}_${file.lastModified}`;
        const cachedResult = localStorage.getItem(cacheKey);
        
        if (cachedResult) {
          console.log("Usando resultado em cache para:", file.name);
          const parsedResult = JSON.parse(cachedResult);
          
          // Verificar se o cache tem todos os dados necessários
          if (parsedResult.extractedData && Object.keys(parsedResult.extractedData).length > 5) {
            onProgress && onProgress(100);
            
            return {
              success: true,
              extractedData: parsedResult.extractedData,
              validation: parsedResult.validation || {
                status: ValidationStatus.NEEDS_REVIEW,
                isValid: true,
                errors: [],
                missingFields: [],
                warningFields: []
              },
              file: {
                filename: file.name,
                path: URL.createObjectURL(file)
              },
              rawText: parsedResult.rawText || "",  // Incluir o texto bruto do cache
              fromCache: true
            };
          }
        }
      } catch (cacheError) {
        console.warn("Erro ao verificar cache:", cacheError);
        // Continuar sem cache
      }
    }
    
    // Atualizar progresso
    onProgress && onProgress(10);
    
    // Processar o PDF usando a implementação otimizada
    onProgress && onProgress(30);
    const result = await processPDFWithOCR(file, { skipQualityCheck, useCache });
    onProgress && onProgress(80);
    
    // Verificar se temos dados extraídos válidos
    if (!result.extractedData) {
      throw new Error(
        "Não foi possível extrair dados suficientes do PDF. " +
        "Por favor, tente novamente ou envie um arquivo diferente."
      );
    }
    
    // Validação dos dados extraídos
    const validationErrors = validateExtractedData(result.extractedData);
    if (validationErrors.length > 0) {
      throw new Error(
        `Dados extraídos inválidos ou incompletos: ${validationErrors.join(", ")}`
      );
    }
    
    // Formatar a resposta
    const response: UploadResponse = {
      success: true,
      extractedData: result.extractedData,
      validation: {
        status: ValidationStatus.NEEDS_REVIEW,
        isValid: true,
        errors: [],
        missingFields: [],
        warningFields: []
      },
      file: {
        filename: file.name,
        path: URL.createObjectURL(file)
      },
      rawText: result.rawText || "",
      fromCache: false
    };
    
    // Armazenar no cache se solicitado
    if (useCache) {
      try {
        const cacheKey = `ocr_cache_${file.name}_${file.size}_${file.lastModified}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          extractedData: result.extractedData,
          validation: response.validation,  // Armazenar também os resultados da validação
          rawText: result.rawText || "",    // Armazenar o texto bruto extraído
          timestamp: new Date().toISOString()
        }));
        console.log("Dados salvos em cache com sucesso:", cacheKey);
      } catch (cacheError) {
        console.warn("Erro ao armazenar em cache:", cacheError);
        // Continuar mesmo sem poder armazenar cache
      }
    }
    
    // Atualizar progresso
    onProgress && onProgress(100);
    
    return response;
  } catch (error) {
    console.error("Erro ao processar arquivo de reserva:", error);
    throw error;
  }
}

// Função removida: checkImageQuality não é necessária
// pois não suportamos processamento de imagens

/**
 * Valida os dados extraídos para garantir completude mínima
 * @param data Dados extraídos
 * @returns Array de erros, vazio se não houver erros
 */
function validateExtractedData(data: any): string[] {
  const errors: string[] = [];
  
  // Verificar campos essenciais
  if (!data.checkInDate) errors.push("Data de check-in não encontrada");
  if (!data.checkOutDate) errors.push("Data de check-out não encontrada");
  if (!data.guestName) errors.push("Nome do hóspede não encontrado");
  if (!data.totalAmount || isNaN(data.totalAmount)) errors.push("Valor total não encontrado ou inválido");
  
  // Verificar formatos de data
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (data.checkInDate && !datePattern.test(data.checkInDate)) {
    errors.push("Formato de data de check-in inválido (deve ser YYYY-MM-DD)");
  }
  if (data.checkOutDate && !datePattern.test(data.checkOutDate)) {
    errors.push("Formato de data de check-out inválido (deve ser YYYY-MM-DD)");
  }
  
  // Verificar lógica de datas
  if (data.checkInDate && data.checkOutDate) {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    
    if (checkIn > checkOut) {
      errors.push("Data de check-in é posterior à data de check-out");
    }
    
    const diffDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 60) {
      errors.push(`Duração da estadia é muito longa (${diffDays} dias)`);
    }
  }
  
  return errors;
}

/**
 * Processa múltiplos PDFs usando o endpoint do servidor
 * 
 * @param files Array de arquivos PDF a serem processados
 * @param options Opções adicionais para o processamento
 * @returns Array de resultados processados
 */
export async function processMultiplePDFs(
  files: File[], 
  options: { 
    useCache?: boolean, 
    skipQualityCheck?: boolean 
  } = {}
): Promise<any[]> {
  try {
    const { useCache = false, skipQualityCheck = false } = options;
    
    // Validar número de arquivos
    if (!files.length) {
      throw new Error("Nenhum arquivo fornecido para processamento");
    }
    
    // Limitar o número de arquivos processados de uma vez
    if (files.length > 10) {
      throw new Error("Máximo de 10 arquivos podem ser processados de uma vez");
    }
    
    // Verificar se temos uma chave API válida no ambiente
    const hasApiKey = await fetch('/api/check-gemini-key').then(res => res.json())
      .then(data => data.available)
      .catch(() => false);
      
    if (!hasApiKey) {
      throw new Error("Chave da API Gemini não configurada no servidor. Entre em contato com o administrador.");
    }
    
    // Processar cada PDF em série (para evitar sobrecarga do servidor)
    const results = [];
    
    for (const file of files) {
      try {
        console.log(`Processando arquivo: ${file.name}`);
        
        // Verificar tipo de arquivo
        if (!file.type.includes('pdf')) {
          results.push({
            filename: file.name,
            success: false,
            error: "Tipo de arquivo não suportado. Apenas PDFs são suportados.",
            extractedData: null
          });
          continue;
        }
        
        // Verificar cache para este arquivo antes de processar
        try {
          const cacheKey = `ocr_cache_${file.name}_${file.size}_${file.lastModified}`;
          const cachedResult = localStorage.getItem(cacheKey);
          
          if (cachedResult) {
            console.log(`Usando cache para o arquivo: ${file.name}`);
            const parsedResult = JSON.parse(cachedResult);
            
            // Verificar se o cache tem dados válidos
            if (parsedResult.extractedData && Object.keys(parsedResult.extractedData).length > 5) {
              results.push({
                filename: file.name,
                success: true,
                extractedData: parsedResult.extractedData,
                rawText: parsedResult.rawText || "",
                error: null,
                fromCache: true
              });
              continue; // Continuar para o próximo arquivo
            }
          }
        } catch (cacheError) {
          console.warn(`Erro ao verificar cache para arquivo ${file.name}:`, cacheError);
          // Continuar com processamento normal
        }
        
        // Processar o PDF usando a API do servidor
        // Esta chamada usa o endpoint que executa pdf-parse + processamento Gemini
        const formData = new FormData();
        formData.append("pdf", file);
        formData.append("skipQualityCheck", skipQualityCheck ? "true" : "false");
        formData.append("useCache", useCache ? "true" : "false");
        
        const response = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro no processamento do PDF: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (!result.extractedData) {
          throw new Error("Não foi possível extrair dados do PDF.");
        }
        
        // Validar os dados extraídos
        const validationErrors = validateExtractedData(result.extractedData);
        if (validationErrors.length > 0) {
          throw new Error(`Dados extraídos inválidos ou incompletos: ${validationErrors.join(", ")}`);
        }
        
        // Salvar no cache para uso futuro
        try {
          const cacheKey = `ocr_cache_${file.name}_${file.size}_${file.lastModified}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            extractedData: result.extractedData,
            validation: result.validation || {
              status: ValidationStatus.NEEDS_REVIEW,
              isValid: true,
              errors: [],
              missingFields: [],
              warningFields: []
            },
            rawText: result.rawText || "",
            timestamp: new Date().toISOString()
          }));
          console.log(`Dados do arquivo ${file.name} salvos em cache com sucesso`);
        } catch (cacheError) {
          console.warn(`Erro ao armazenar ${file.name} em cache:`, cacheError);
        }
        
        // Adicionar ao array de resultados
        results.push({
          filename: file.name,
          success: true,
          extractedData: result.extractedData,
          rawText: result.rawText || "",
          error: null
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
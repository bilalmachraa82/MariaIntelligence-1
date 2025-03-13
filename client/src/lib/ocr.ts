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
  
  const prompt = `
    Você é um especialista em OCR (Reconhecimento Óptico de Caracteres). 
    O conteúdo fornecido é um PDF de uma reserva de alojamento local em base64.
    Por favor, extraia todo o texto visível neste documento sem interpretações adicionais.
    Retorne apenas o texto extraído, sem comentários ou formatação adicional.
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
        { role: 'system', content: 'Você é um assistente especializado em OCR (Optical Character Recognition).' },
        { role: 'user', content: `${prompt}\n\nPDF Base64: ${pdfBase64}` }
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
  
  const prompt = `
    Você é um especialista em extrair dados estruturados de textos de reservas para alojamento local.
    Analise o texto extraído de um documento de reserva a seguir e extraia as seguintes informações em formato JSON:
    
    - Nome da propriedade (propertyName)
    - Nome do hóspede (guestName)
    - Email do hóspede (guestEmail)
    - Telefone do hóspede (guestPhone)
    - Data de check-in (formato YYYY-MM-DD)
    - Data de check-out (formato YYYY-MM-DD)
    - Número de hóspedes (numGuests)
    - Valor total da reserva (totalAmount) - apenas o número
    - Plataforma de reserva (platform): "airbnb", "booking", "direct", ou "other"
    - Taxa da plataforma (platformFee) - apenas o número
    - Taxa de limpeza (cleaningFee) - apenas o número
    - Taxa de check-in (checkInFee) - apenas o número
    - Taxa de comissão (commissionFee) - apenas o número
    - Pagamento à equipe (teamPayment) - apenas o número
    
    Se alguma informação não estiver disponível, use valores nulos ou vazios.
    Responda APENAS com o objeto JSON, sem explicações ou texto adicional.
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
        { role: 'system', content: 'Você é um assistente especializado em extrair dados estruturados.' },
        { role: 'user', content: `${prompt}\n\nTexto extraído:\n${extractedText}` }
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
    return JSON.parse(jsonContent);
  } catch (e) {
    console.error("Error parsing JSON from Mistral API:", e);
    return jsonContent; // Retorna o texto bruto se não conseguir analisar como JSON
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

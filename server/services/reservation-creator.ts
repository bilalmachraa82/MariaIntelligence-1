/**
 * Serviço para criar reservas automaticamente a partir de dados extraídos
 * Integra o processamento de PDFs e OCR com a criação de reservas no sistema
 */

import { storage } from '../storage';
import { InsertReservation } from '@shared/schema';
import { 
  ExtractedReservationData, 
  ValidationStatus 
} from './pdf-extract';
import { 
  processPdf, 
  extractTextWithPdfParse, 
  parseReservationFromText, 
  validateReservationData 
} from './pdf-extract';
import { MistralService } from './mistral.service';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Interface para resposta de criação de reserva
interface ReservationCreationResult {
  success: boolean;
  message: string;
  reservation?: any;
  extractedData?: any;
  validationResult?: any;
  errors?: string[];
}

/**
 * Cria uma reserva a partir dos dados extraídos de um PDF ou imagem
 * @param extractedData Dados extraídos do documento
 * @returns Resultado do processo de criação da reserva
 */
export async function createReservationFromExtractedData(
  extractedData: ExtractedReservationData
): Promise<ReservationCreationResult> {
  try {
    console.log('Criando reserva a partir de dados extraídos:', JSON.stringify(extractedData, null, 2));

    // Validação básica de campos obrigatórios
    if (!extractedData.propertyName || !extractedData.guestName || !extractedData.checkInDate || !extractedData.checkOutDate) {
      return {
        success: false,
        message: 'Dados insuficientes para criar reserva',
        errors: ['Campos obrigatórios ausentes nos dados extraídos']
      };
    }

    // Encontrar a propriedade pelo nome
    const properties = await storage.getProperties();
    let matchedProperty = null;

    // Busca exata (case insensitive)
    matchedProperty = properties.find(p => 
      p.name.toLowerCase() === extractedData.propertyName.toLowerCase()
    );

    // Se não encontrar, usa matching mais flexível
    if (!matchedProperty) {
      // Define uma função de similaridade
      const calculateSimilarity = (str1: string, str2: string): number => {
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
      };
      
      // Encontrar a propriedade com maior similaridade
      let bestMatch = null;
      let highestSimilarity = 0;
      
      for (const property of properties) {
        const similarity = calculateSimilarity(
          extractedData.propertyName, 
          property.name
        );
        
        if (similarity > highestSimilarity && similarity > 0.6) {
          highestSimilarity = similarity;
          bestMatch = property;
        }
      }
      
      matchedProperty = bestMatch;
    }

    if (!matchedProperty) {
      return {
        success: false,
        message: 'Propriedade não encontrada',
        errors: [`Não foi possível encontrar uma propriedade correspondente para: ${extractedData.propertyName}`]
      };
    }

    // Calcular valores baseados na propriedade
    const totalAmount = extractedData.totalAmount || 0;
    const platformFee = extractedData.platformFee || (
      (extractedData.platform === "airbnb" || extractedData.platform === "booking") 
        ? Math.round(totalAmount * 0.1) 
        : 0
    );
    const cleaningFee = extractedData.cleaningFee || Number(matchedProperty.cleaningCost || 0);
    const checkInFee = extractedData.checkInFee || Number(matchedProperty.checkInFee || 0);
    const commissionFee = extractedData.commissionFee || (totalAmount * Number(matchedProperty.commission || 0) / 100);
    const teamPayment = extractedData.teamPayment || Number(matchedProperty.teamPayment || 0);
    const netAmount = totalAmount - platformFee - cleaningFee - checkInFee - commissionFee - teamPayment;

    // Criar objeto de reserva para inserção
    const reservationData: InsertReservation = {
      propertyId: matchedProperty.id,
      guestName: extractedData.guestName,
      guestEmail: extractedData.guestEmail || '',
      guestPhone: extractedData.guestPhone || '',
      checkInDate: extractedData.checkInDate,
      checkOutDate: extractedData.checkOutDate,
      numGuests: extractedData.numGuests || 1,
      totalAmount: String(totalAmount),
      status: 'confirmed',
      platform: extractedData.platform || 'direct',
      platformFee: String(platformFee),
      cleaningFee: String(cleaningFee),
      checkInFee: String(checkInFee),
      commissionFee: String(commissionFee),
      teamPayment: String(teamPayment),
      netAmount: String(netAmount),
      notes: `Reserva criada automaticamente por processamento de documento em ${new Date().toISOString()}`
    };

    // Criar a reserva no sistema
    const newReservation = await storage.createReservation(reservationData);

    // Adicionar atividade ao sistema
    await storage.createActivity({
      type: 'reservation_created',
      description: `Reserva criada automaticamente: ${extractedData.propertyName} - ${extractedData.guestName}`,
      entityId: newReservation.id,
      entityType: 'reservation'
    });

    return {
      success: true,
      message: 'Reserva criada com sucesso',
      reservation: newReservation,
      extractedData
    };
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    return {
      success: false,
      message: 'Falha ao criar reserva',
      errors: [error instanceof Error ? error.message : 'Erro desconhecido']
    };
  }
}

/**
 * Processa um PDF e cria uma reserva a partir dos dados extraídos
 * @param pdfPath Caminho do arquivo PDF
 * @param apiKey Chave da API Mistral
 * @returns Resultado do processo de criação da reserva
 */
export async function processPdfAndCreateReservation(
  pdfPath: string, 
  apiKey: string
): Promise<ReservationCreationResult> {
  try {
    console.log(`Processando PDF para criar reserva: ${pdfPath}`);

    // Extrair e validar dados do PDF
    const validationResult = await processPdf(pdfPath, apiKey);
    
    // Se a validação falhou completamente, abortar
    if (validationResult.status === ValidationStatus.FAILED) {
      return {
        success: false,
        message: 'Falha na validação dos dados extraídos',
        validationResult,
        errors: validationResult.errors.map(e => e.message)
      };
    }

    // Obter dados com valores padrão da validação
    const extractedData = validationResult.dataWithDefaults;
    
    // Criar reserva com os dados extraídos
    const result = await createReservationFromExtractedData(extractedData);
    
    // Incluir resultados da validação na resposta
    return {
      ...result,
      validationResult
    };
  } catch (error) {
    console.error('Erro ao processar PDF e criar reserva:', error);
    return {
      success: false,
      message: 'Falha ao processar PDF e criar reserva',
      errors: [error instanceof Error ? error.message : 'Erro desconhecido']
    };
  }
}

/**
 * Processa uma imagem usando OCR e cria uma reserva
 * @param imagePath Caminho da imagem
 * @param apiKey Chave da API Mistral
 * @returns Resultado do processo de criação da reserva
 */
export async function processImageAndCreateReservation(
  imagePath: string,
  apiKey: string
): Promise<ReservationCreationResult> {
  try {
    console.log(`Processando imagem para criar reserva: ${imagePath}`);
    
    // Ler a imagem e converter para base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Determinar o tipo MIME com base na extensão
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' 
      ? 'image/png' 
      : 'image/jpeg';
    
    // Usar o serviço Mistral para OCR
    const mistralService = new MistralService();
    
    // Extrair texto da imagem
    const extractedText = await mistralService.extractTextFromImage(base64Image, mimeType);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return {
        success: false,
        message: 'Não foi possível extrair texto da imagem',
        errors: ['OCR não detectou texto']
      };
    }
    
    // Analisar o texto extraído para obter dados estruturados
    const extractedData = await parseReservationFromText(extractedText, apiKey);
    
    // Validar os dados extraídos
    const validationResult = validateReservationData(extractedData);
    
    // Se a validação falhou completamente, abortar
    if (validationResult.status === ValidationStatus.FAILED) {
      return {
        success: false,
        message: 'Falha na validação dos dados extraídos da imagem',
        validationResult,
        errors: validationResult.errors.map(e => e.message)
      };
    }
    
    // Criar reserva com os dados extraídos
    const result = await createReservationFromExtractedData(validationResult.dataWithDefaults);
    
    // Incluir resultados da validação na resposta
    return {
      ...result,
      validationResult
    };
  } catch (error) {
    console.error('Erro ao processar imagem e criar reserva:', error);
    return {
      success: false,
      message: 'Falha ao processar imagem e criar reserva',
      errors: [error instanceof Error ? error.message : 'Erro desconhecido']
    };
  }
}

/**
 * Processa um arquivo (PDF ou imagem) e cria uma reserva
 * @param filePath Caminho do arquivo
 * @param apiKey Chave da API Mistral
 * @returns Resultado do processo de criação da reserva
 */
export async function processFileAndCreateReservation(
  filePath: string,
  apiKey: string
): Promise<ReservationCreationResult> {
  // Determinar o tipo de arquivo pela extensão
  const fileExtension = path.extname(filePath).toLowerCase();
  
  // Se for PDF, processar como PDF
  if (fileExtension === '.pdf') {
    return processPdfAndCreateReservation(filePath, apiKey);
  }
  
  // Se for imagem (jpg, jpeg, png), processar com OCR
  if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
    return processImageAndCreateReservation(filePath, apiKey);
  }
  
  // Tipo de arquivo não suportado
  return {
    success: false,
    message: 'Tipo de arquivo não suportado',
    errors: [`Extensão de arquivo não suportada: ${fileExtension}. Use PDF, JPG ou PNG.`]
  };
}
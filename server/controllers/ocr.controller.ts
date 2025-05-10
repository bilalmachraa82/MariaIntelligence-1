/**
 * Controlador para OCR de documentos
 * Suporta múltiplos fornecedores: OpenRouter (Mistral OCR), RolmOCR e fallback com extrator nativo (pdf-parse)
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AIAdapter, AIServiceType } from '../services/ai-adapter.service';
import { HandwritingDetector } from '../services/handwriting-detector';
import { parseReservationData } from '../parsers/parseReservations';
import { storage } from '../storage';
import { matchPropertyByAlias } from '../utils/matchPropertyByAlias';

// Serviços necessários
const aiAdapter = AIAdapter.getInstance();
const handwritingDetector = new HandwritingDetector();

// Definição de tipos para serviços OCR
type OCRService = 'mistral' | 'openrouter' | 'rolm' | 'native' | 'auto';

// Mapeamento entre tipos OCRService e AIServiceType
const serviceTypeMap: Record<OCRService, AIServiceType> = {
  mistral: AIServiceType.OPENROUTER, // Mistral é fornecido via OpenRouter
  openrouter: AIServiceType.OPENROUTER,
  rolm: AIServiceType.ROLM,
  native: AIServiceType.AUTO, // Usando AUTO como equivalente para o modo nativo
  auto: AIServiceType.AUTO
};

/**
 * Rota unificada para OCR - processa PDFs enviados e extrai dados de reserva
 * Esta rota é a interface principal para upload e processamento de PDFs
 * @param req Requisição Express (contém arquivo PDF via multer)
 * @param res Resposta Express
 */
export async function postOcr(req: Request, res: Response) {
  console.log('📑 Processando OCR [Rota unificada]...');
  
  try {
    // Validar se recebemos um arquivo
    if (!req.file) {
      return res.status(422).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }
    
    // Validar tipo MIME
    if (!req.file.mimetype || req.file.mimetype !== 'application/pdf') {
      // Remover arquivo inválido
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo inválido:', unlinkError);
      }
      
      return res.status(422).json({
        success: false,
        message: 'Tipo de arquivo inválido. Apenas PDFs são aceitos.'
      });
    }
    
    // Ler o arquivo
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = fs.readFileSync(req.file.path);
    } catch (readError) {
      console.error('Erro ao ler arquivo:', readError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao ler o arquivo PDF'
      });
    }
    
    // Determinar o provedor a ser usado (do query parameter)
    let provider = (req.query.provider as string) || 'auto';
    
    // Se for "auto", verificar se o documento contém manuscritos
    if (provider === 'auto') {
      try {
        const handwritingScore = await handwritingDetector.analyzePdf(pdfBuffer);
        console.log(`📝 Pontuação de manuscrito: ${handwritingScore.toFixed(2)}`);
        
        if (handwritingScore > 0.4 && process.env.HF_TOKEN) {
          provider = 'rolm';
          console.log('🖋️ Detectado manuscrito, usando RolmOCR');
        } else if (process.env.OPENROUTER_API_KEY) {
          provider = 'openrouter';
          console.log('📄 Usando OpenRouter para processamento do PDF');
        } else {
          // Sem serviços de IA disponíveis, usar o extrator nativo
          provider = 'native';
          console.log('📄 Nenhum serviço OCR disponível, usando extrator nativo (pdf-parse)');
        }
      } catch (detectorError) {
        console.error('Erro no detector de manuscritos:', detectorError);
        // Em caso de erro, usar OpenRouter se disponível, ou o extrator nativo como último recurso
        if (process.env.OPENROUTER_API_KEY) {
          provider = 'openrouter';
        } else {
          provider = 'native';
          console.log('📄 Usando extrator nativo como último recurso');
        }
      }
    }
    
    console.log(`🔍 Provedor selecionado: ${provider}`);
    
    // Converter PDF para base64
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Iniciar métricas
    const startTime = Date.now();
    
    // Extrair texto do PDF usando o provedor selecionado
    let extractedText = '';
    try {
      extractedText = await aiAdapter.extractTextFromPDF(pdfBase64, provider as any);
      console.log(`✅ Texto extraído com sucesso (${extractedText.length} caracteres)`);
    } catch (extractError) {
      console.error('Erro ao extrair texto do PDF:', extractError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao extrair texto do PDF',
        details: extractError instanceof Error ? extractError.message : 'Erro desconhecido'
      });
    }
    
    // Extrair dados estruturados
    let reservations = [];
    let boxesData = {};
    let missingFields = [];
    
    try {
      // Fazer parsing da resposta do OCR
      const parsedData = await parseReservationData(extractedText);
      reservations = parsedData.reservations || [];
      boxesData = parsedData.boxes || {};
      missingFields = parsedData.missing || [];
      
      // Finalizar métricas
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      // Registrar métricas
      console.log(`⏱️ OCR processado em ${latencyMs}ms via ${provider}`);
      
      // Processar os dados da propriedade se possível
      if (reservations.length > 0) {
        // Para cada reserva, tentar encontrar a propriedade correspondente
        for (const reservation of reservations) {
          if (reservation.propertyName) {
            try {
              // Buscar todas as propriedades e fazer matching manual pelo nome
              const properties = await storage.getProperties();
              
              // Normalizar o nome para facilitar a comparação
              const normalizedPropertyName = reservation.propertyName.toLowerCase().trim();
              
              // Tentar encontrar uma correspondência exata ou parcial
              const exactMatch = properties.find(p => 
                p.name.toLowerCase() === normalizedPropertyName
              );
              
              // Se encontrou correspondência exata, usar essa
              if (exactMatch) {
                reservation.propertyId = exactMatch.id;
                console.log(`✅ Propriedade encontrada exata: ${exactMatch.name} (ID: ${exactMatch.id})`);
              } else {
                // Tentar correspondência parcial
                const partialMatches = properties.filter(p => 
                  normalizedPropertyName.includes(p.name.toLowerCase()) || 
                  p.name.toLowerCase().includes(normalizedPropertyName)
                );
                
                if (partialMatches.length > 0) {
                  // Usar a primeira correspondência parcial
                  const bestMatch = partialMatches[0];
                  reservation.propertyId = bestMatch.id;
                  console.log(`✅ Propriedade encontrada parcial: ${bestMatch.name} (ID: ${bestMatch.id})`);
                } else {
                  // Se não encontrou correspondência, adicionar aos campos ausentes
                  if (!missingFields.includes('propertyId')) {
                    missingFields.push('propertyId');
                  }
                  console.log(`⚠️ Propriedade não encontrada: ${reservation.propertyName}`);
                }
              }
            } catch (propertyError) {
              console.error('Erro ao buscar propriedade:', propertyError);
            }
          } else if (!missingFields.includes('propertyName')) {
            missingFields.push('propertyName');
          }
        }
      }
      
      // Retornar resultado completo
      return res.json({
        success: true,
        provider,
        reservations,
        boxes: boxesData,
        // Adicionar extractedData para compatibilidade com a interface antiga
        extractedData: reservations.length > 0 ? reservations[0] : undefined,
        missing: missingFields,
        rawText: extractedText,
        metrics: {
          latencyMs,
          provider,
          textLength: extractedText.length
        }
      });
    } catch (parseError) {
      console.error('Erro ao extrair dados estruturados:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao extrair dados estruturados',
        rawText: extractedText,
        details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro no processamento OCR:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no processamento OCR',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Processa um arquivo PDF e extrai texto e dados estruturados usando OCR
 * @param req Requisição Express (contém arquivo PDF via multer)
 * @param res Resposta Express
 */
export async function processOCR(req: Request, res: Response) {
  console.log('📑 Iniciando processamento OCR...');
  
  try {
    // Validar se recebemos um arquivo
    if (!req.file) {
      return res.status(422).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }
    
    // Validar tipo MIME
    if (!req.file.mimetype || req.file.mimetype !== 'application/pdf') {
      // Remover arquivo inválido
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo inválido:', unlinkError);
      }
      
      return res.status(422).json({
        success: false,
        error: 'Tipo de arquivo inválido. Apenas PDFs são aceitos.'
      });
    }
    
    // Ler o arquivo
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = fs.readFileSync(req.file.path);
    } catch (readError) {
      console.error('Erro ao ler arquivo:', readError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao ler o arquivo PDF'
      });
    }
    
    // Verificar tamanho do arquivo
    const maxSizeMB = parseInt(process.env.MAX_UPLOAD_MB || '10');
    const fileSizeMB = pdfBuffer.length / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      // Remover arquivo muito grande
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo muito grande:', unlinkError);
      }
      
      return res.status(413).json({
        success: false,
        error: `Arquivo muito grande. O tamanho máximo permitido é ${maxSizeMB}MB.`
      });
    }
    
    // Determinar o provedor a ser usado
    let provider = (req.query.provider as string) || '';
    
    // Se for "auto", verificar se o documento contém manuscritos
    if (!provider || provider === 'auto') {
      try {
        const handwritingScore = await handwritingDetector.analyzePdf(pdfBuffer);
        console.log(`📝 Pontuação de manuscrito: ${handwritingScore.toFixed(2)}`);
        
        if (handwritingScore > 0.4 && process.env.HF_TOKEN) {
          provider = 'rolm';
          console.log('🖋️ Detectado manuscrito, usando RolmOCR');
        } else if (process.env.OPENROUTER_API_KEY) {
          provider = 'openrouter';
          console.log('📄 Usando OpenRouter para processamento do PDF');
        } else {
          // Sem serviços de IA disponíveis, usar o extrator nativo
          provider = 'native';
          console.log('📄 Nenhum serviço OCR disponível, usando extrator nativo (pdf-parse)');
        }
      } catch (detectorError) {
        console.error('Erro no detector de manuscritos:', detectorError);
        // Em caso de erro, usar OpenRouter se disponível, ou o extrator nativo como último recurso
        if (process.env.OPENROUTER_API_KEY) {
          provider = 'openrouter';
        } else {
          provider = 'native';
          console.log('📄 Usando extrator nativo como último recurso');
        }
      }
    }
    
    console.log(`🔍 Provedor selecionado: ${provider}`);
    
    // Converter PDF para base64
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Iniciar métricas
    const startTime = Date.now();
    
    // Extrair texto do PDF usando o provedor selecionado
    let extractedText = '';
    try {
      extractedText = await aiAdapter.extractTextFromPDF(pdfBase64, provider);
      console.log(`✅ Texto extraído com sucesso (${extractedText.length} caracteres)`);
    } catch (extractError) {
      console.error('Erro ao extrair texto do PDF:', extractError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao extrair texto do PDF',
        details: extractError instanceof Error ? extractError.message : 'Erro desconhecido'
      });
    }
    
    // Extrair dados estruturados
    let reservations = [];
    let boxesData = {};
    let missingFields = [];
    
    try {
      // Fazer parsing da resposta do OCR
      const parsedData = await parseReservationData(extractedText);
      reservations = parsedData.reservations || [];
      boxesData = parsedData.boxes || {};
      missingFields = parsedData.missing || [];
      
      // Finalizar métricas
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      // Registrar métricas
      console.log(`⏱️ OCR processado em ${latencyMs}ms via ${provider}`);
      
      // Processar os dados da propriedade se possível
      if (reservations.length > 0) {
        // Para cada reserva, tentar encontrar a propriedade correspondente
        for (const reservation of reservations) {
          if (reservation.propertyName) {
            try {
              // Buscar todas as propriedades e fazer matching manual pelo nome
              const properties = await storage.getProperties();
              
              // Normalizar o nome para facilitar a comparação
              const normalizedPropertyName = reservation.propertyName.toLowerCase().trim();
              
              // Tentar encontrar uma correspondência exata ou parcial
              const exactMatch = properties.find(p => 
                p.name.toLowerCase() === normalizedPropertyName
              );
              
              // Se encontrou correspondência exata, usar essa
              if (exactMatch) {
                reservation.propertyId = exactMatch.id;
                console.log(`✅ Propriedade encontrada exata: ${exactMatch.name} (ID: ${exactMatch.id})`);
              } else {
                // Tentar correspondência parcial
                const partialMatches = properties.filter(p => 
                  normalizedPropertyName.includes(p.name.toLowerCase()) || 
                  p.name.toLowerCase().includes(normalizedPropertyName)
                );
                
                if (partialMatches.length > 0) {
                  // Usar a primeira correspondência parcial
                  const bestMatch = partialMatches[0];
                  reservation.propertyId = bestMatch.id;
                  console.log(`✅ Propriedade encontrada parcial: ${bestMatch.name} (ID: ${bestMatch.id})`);
                } else {
                  // Se não encontrou correspondência, adicionar aos campos ausentes
                  if (!missingFields.includes('propertyId')) {
                    missingFields.push('propertyId');
                  }
                  console.log(`⚠️ Propriedade não encontrada: ${reservation.propertyName}`);
                }
              }
            } catch (propertyError) {
              console.error('Erro ao buscar propriedade:', propertyError);
            }
          } else if (!missingFields.includes('propertyName')) {
            missingFields.push('propertyName');
          }
        }
      }
      
      // Retornar resultado completo
      return res.json({
        success: true,
        provider,
        reservations,
        boxes: boxesData,
        missing: missingFields,
        rawText: extractedText,
        metrics: {
          latencyMs,
          provider,
          textLength: extractedText.length
        }
      });
    } catch (parseError) {
      console.error('Erro ao extrair dados estruturados:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao extrair dados estruturados',
        rawText: extractedText,
        details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro no processamento OCR:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno no processamento OCR',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Processa um arquivo usando um serviço OCR específico
 * @param req Requisição Express com parâmetro service e arquivo via multer
 * @param res Resposta Express
 */
export async function processWithService(req: Request, res: Response) {
  console.log('📑 Iniciando processamento OCR com serviço específico...');
  
  try {
    // Validar se recebemos um arquivo
    if (!req.file) {
      return res.status(422).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }
    
    // Obter o serviço especificado
    const serviceParam = req.params.service?.toLowerCase() as OCRService;
    
    if (!serviceParam) {
      return res.status(400).json({
        success: false,
        message: 'Serviço não especificado'
      });
    }
    
    // Validar se o serviço é suportado
    const validServices: OCRService[] = ['mistral', 'openrouter', 'rolm', 'native', 'auto'];
    
    if (!validServices.includes(serviceParam)) {
      return res.status(400).json({
        success: false,
        message: `Serviço inválido: ${serviceParam}. Serviços suportados: ${validServices.join(', ')}`
      });
    }
    
    // Obter o service type conforme a enumeração AIServiceType
    let serviceType: AIServiceType;
    
    switch (serviceParam) {
      case 'mistral':
      case 'openrouter':
        serviceType = AIServiceType.OPENROUTER;
        break;
      case 'rolm':
        serviceType = AIServiceType.ROLM;
        break;
      case 'native':
        serviceType = AIServiceType.AUTO; // Usamos AUTO para o modo nativo
        break;
      case 'auto':
      default:
        serviceType = AIServiceType.AUTO;
        break;
    }
    
    // Verificar se o serviço está disponível
    let serviceAvailable = true;
    
    if (serviceParam === 'mistral' || serviceParam === 'openrouter') {
      serviceAvailable = !!process.env.OPENROUTER_API_KEY;
    } else if (serviceParam === 'rolm') {
      serviceAvailable = !!process.env.HF_TOKEN;
    } else if (serviceParam === 'native') {
      serviceAvailable = true; // O modo nativo está sempre disponível
    }
    
    if (!serviceAvailable && serviceParam !== 'auto') {
      return res.status(400).json({
        success: false,
        message: `Serviço ${serviceParam} não está configurado. Verifique se a chave API correspondente foi fornecida.`
      });
    }
    
    // Caminho do arquivo
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    
    // Verificar se o arquivo é uma imagem ou PDF
    let isImage = false;
    
    if (mimeType.startsWith('image/')) {
      isImage = true;
    } else if (mimeType !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: `Tipo de arquivo não suportado: ${mimeType}. Apenas PDFs e imagens são permitidos.`
      });
    }
    
    // Carregar arquivo
    let fileData: Buffer | string;
    let base64Data: string;
    
    try {
      fileData = fs.readFileSync(filePath);
      base64Data = isImage 
        ? fileData.toString('base64')
        : fileData.toString('base64');
    } catch (readError) {
      console.error('Erro ao ler arquivo:', readError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao ler arquivo',
        error: readError instanceof Error ? readError.message : 'Erro desconhecido'
      });
    }
    
    // Extrair o texto do arquivo usando o serviço especificado
    console.log(`Processando arquivo usando serviço: ${serviceParam}`);
    
    const startTime = Date.now();
    let extractedText = '';
    let provider = serviceParam;
    
    try {
      let extractedResult = '';
      
      if (isImage) {
        extractedResult = await aiAdapter.extractTextFromImage(base64Data, serviceType);
      } else {
        extractedResult = await aiAdapter.extractTextFromPDF(base64Data, serviceType);
      }
      
      extractedText = extractedResult;
      provider = serviceParam; // Usamos o serviço solicitado como provider
    } catch (extractError) {
      console.error('Erro na extração de dados:', extractError);
      return res.status(500).json({
        success: false,
        message: 'Erro na extração de dados',
        error: extractError instanceof Error ? extractError.message : 'Erro desconhecido'
      });
    }
    
    const latencyMs = Date.now() - startTime;
    
    // Extrair dados estruturados do texto
    try {
      const { reservations, boxes: boxesData, missing: missingFields } = await parseReservationData(extractedText);
      
      // Para cada reserva, tentar encontrar a propriedade correspondente
      for (const reservation of reservations) {
        if (reservation.propertyName) {
          try {
            // Buscar todas as propriedades e fazer matching manual pelo nome
            const properties = await storage.getProperties();
            
            // Normalizar o nome para facilitar a comparação
            const normalizedPropertyName = reservation.propertyName.toLowerCase().trim();
            
            // Tentar encontrar uma correspondência exata ou parcial
            const exactMatch = properties.find(p => 
              p.name.toLowerCase() === normalizedPropertyName
            );
            
            // Se encontrou correspondência exata, usar essa
            if (exactMatch) {
              reservation.propertyId = exactMatch.id;
              console.log(`✅ Propriedade encontrada exata: ${exactMatch.name} (ID: ${exactMatch.id})`);
            } else {
              // Tentar correspondência parcial
              const partialMatches = properties.filter(p => 
                normalizedPropertyName.includes(p.name.toLowerCase()) || 
                p.name.toLowerCase().includes(normalizedPropertyName)
              );
              
              if (partialMatches.length > 0) {
                // Usar a primeira correspondência parcial
                const bestMatch = partialMatches[0];
                reservation.propertyId = bestMatch.id;
                console.log(`✅ Propriedade encontrada parcial: ${bestMatch.name} (ID: ${bestMatch.id})`);
              } else {
                // Se não encontrou correspondência, adicionar aos campos ausentes
                if (!missingFields.includes('propertyId')) {
                  missingFields.push('propertyId');
                }
                console.log(`⚠️ Propriedade não encontrada: ${reservation.propertyName}`);
              }
            }
          } catch (propertyError) {
            console.error('Erro ao buscar propriedade:', propertyError);
          }
        }
      }
      
      return res.json({
        success: true,
        provider,
        reservations,
        boxes: boxesData,
        missing: missingFields,
        rawText: extractedText,
        metrics: {
          latencyMs,
          provider,
          textLength: extractedText.length,
          service: serviceParam
        }
      });
    } catch (parseError) {
      console.error('Erro ao extrair dados estruturados:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao extrair dados estruturados',
        rawText: extractedText,
        details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro no processamento OCR específico:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno no processamento OCR',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Exportar os métodos do controlador
export default { processOCR, processWithService };
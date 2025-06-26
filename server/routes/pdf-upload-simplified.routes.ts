/**
 * Rotas simplificadas para upload de PDF
 * Substitui a lógica complexa atual por uma versão consolidada e funcional
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { consolidatedProcessor } from '../services/pdf-processor-consolidated';
import { storage } from '../storage';

const router = Router();

// Configuração do multer para upload de arquivos
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    fieldSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    console.log(`📁 Arquivo recebido: ${file.originalname}, tipo: ${file.mimetype}`);
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      console.log(`❌ Tipo de arquivo rejeitado: ${file.mimetype}`);
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  }
});

/**
 * Endpoint principal para upload e processamento de PDF
 * Versão consolidada que substitui /api/upload-and-extract
 */
router.post('/upload-pdf', upload.single('pdf'), async (req: Request, res: Response) => {
  let filePath: string | null = null;
  
  try {
    // Verificar se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo PDF foi enviado'
      });
    }
    
    filePath = req.file.path;
    console.log(`📁 Arquivo recebido: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Processar PDF com o sistema consolidado
    const result = await consolidatedProcessor.processPDF(filePath);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
    
    // Criar atividade no sistema
    await storage.createActivity({
      type: 'pdf_processed',
      description: `PDF processado: ${result.extractedData?.guestName || 'Hóspede desconhecido'} - ${result.extractedData?.propertyName || 'Propriedade desconhecida'}`,
      entityId: result.propertyId || null,
      entityType: 'property'
    });
    
    // Retornar dados processados
    res.json({
      success: true,
      message: result.message,
      extractedData: result.extractedData,
      validation: result.validation,
      propertyFound: !!result.propertyId,
      propertyId: result.propertyId
    });
    
  } catch (error) {
    console.error('Erro no upload de PDF:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    
  } finally {
    // Limpar arquivo temporário
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🧹 Arquivo temporário removido: ${filePath}`);
      } catch (cleanupError) {
        console.warn('Aviso: Falha ao remover arquivo temporário:', cleanupError);
      }
    }
  }
});

/**
 * Endpoint para criar reserva a partir dos dados extraídos
 * Permite validação manual antes da criação
 */
router.post('/create-reservation-from-pdf', async (req: Request, res: Response) => {
  try {
    const { extractedData, validation } = req.body;
    
    if (!extractedData) {
      return res.status(400).json({
        success: false,
        message: 'Dados extraídos não fornecidos'
      });
    }
    
    // Verificar se os dados são válidos o suficiente
    if (!extractedData.guestName || !extractedData.checkInDate || !extractedData.checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Dados insuficientes para criar reserva',
        required: ['guestName', 'checkInDate', 'checkOutDate']
      });
    }
    
    // Verificar se a propriedade foi identificada
    if (!extractedData.propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Propriedade não foi identificada. Por favor, selecione manualmente.'
      });
    }
    
    // Preparar dados para criação da reserva
    const reservationData = {
      propertyId: extractedData.propertyId,
      guestName: extractedData.guestName,
      guestEmail: extractedData.guestEmail || '',
      guestPhone: extractedData.guestPhone || '',
      checkInDate: extractedData.checkInDate,
      checkOutDate: extractedData.checkOutDate,
      numGuests: extractedData.numGuests || 1,
      totalAmount: extractedData.totalAmount?.toString() || '0',
      platform: extractedData.platform || 'direct',
      reference: extractedData.reference || '',
      platformFee: extractedData.platformFee?.toString() || '0',
      cleaningFee: extractedData.cleaningFee?.toString() || '0',
      checkInFee: extractedData.checkInFee?.toString() || '0',
      commission: extractedData.commission?.toString() || '0',
      teamPayment: extractedData.teamPayment?.toString() || '0',
      netAmount: extractedData.netAmount?.toString() || '0',
      notes: extractedData.notes || 'Criada a partir de PDF',
      source: 'pdf_upload'
    };
    
    // Criar reserva
    const createdReservation = await storage.createReservation(reservationData);
    
    // Criar atividade
    await storage.createActivity({
      type: 'reservation_created',
      description: `Reserva criada a partir de PDF: ${createdReservation.guestName}`,
      entityId: createdReservation.id,
      entityType: 'reservation'
    });
    
    res.json({
      success: true,
      message: 'Reserva criada com sucesso',
      reservation: createdReservation,
      validationUsed: validation
    });
    
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao criar reserva',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Endpoint para testar o sistema consolidado
 */
router.get('/test-system', async (req: Request, res: Response) => {
  try {
    const systemStatus = {
      geminiAPI: !!process.env.GOOGLE_API_KEY,
      database: true, // Assumindo que se chegou aqui, a DB está OK
      propertiesCount: 0,
      aroeiras: 0
    };
    
    // Testar base de dados
    try {
      const properties = await storage.getProperties();
      systemStatus.propertiesCount = properties?.length || 0;
      systemStatus.aroeiras = properties?.filter(p => 
        p.name.toLowerCase().includes('aroeira')
      ).length || 0;
    } catch (dbError) {
      systemStatus.database = false;
    }
    
    res.json({
      success: true,
      systemStatus,
      message: 'Sistema consolidado funcionando',
      endpoints: {
        upload: '/api/pdf/upload-pdf',
        createReservation: '/api/pdf/create-reservation-from-pdf',
        test: '/api/pdf/test-system'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no teste do sistema',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
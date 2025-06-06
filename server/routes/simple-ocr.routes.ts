import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SimpleOCRService } from '../services/simple-ocr.service';
import { storage as dbStorage } from '../storage';
import { insertReservationSchema } from '@shared/schema';

const router = Router();

// Endpoint de teste interno
router.post('/test-internal', async (req, res) => {
  try {
    const ocrService = new SimpleOCRService();
    
    // Testar com um PDF existente
    const pdfPath = './attached_assets/Check-outs Maria faz.pdf';
    
    if (fs.existsSync(pdfPath)) {
      const buffer = fs.readFileSync(pdfPath);
      const mockFile = {
        originalname: 'Check-outs Maria faz.pdf',
        mimetype: 'application/pdf',
        buffer: buffer,
        path: pdfPath
      };
      
      console.log('🧪 Teste interno: Processando Check-outs Maria faz.pdf');
      const result = await ocrService.processFile(mockFile);
      
      res.json({
        success: true,
        test: 'internal',
        filename: 'Check-outs Maria faz.pdf',
        result: result
      });
    } else {
      res.json({
        success: false,
        error: 'PDF de teste não encontrado',
        path: pdfPath
      });
    }
  } catch (error) {
    console.error('❌ Erro no teste interno:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Configuração do multer para upload de PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `ocr-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF e imagens (JPG, PNG, WebP) são permitidos'));
    }
  }
});

// Instância do serviço OCR
const ocrService = new SimpleOCRService();

/**
 * Helper function to save extracted reservations to the database
 */
async function saveReservationsToDatabase(reservations: any[]): Promise<{
  success: boolean;
  savedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let savedCount = 0;

  for (const reservation of reservations) {
    try {
      // Find property by name if propertyId is not provided
      let propertyId = reservation.propertyId;
      
      if (!propertyId && reservation.propertyName) {
        const properties = await dbStorage.getProperties();
        
        const normalizePropertyName = (name: string) => 
          name.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[àáâãä]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ç]/g, 'c');
        
        const normalizedReservationProperty = normalizePropertyName(reservation.propertyName);
        
        const matchedProperty = properties.find((p: any) => {
          const normalizedDbProperty = normalizePropertyName(p.name);
          
          // Skip properties with check-in/check-out in name
          if (p.name.toLowerCase().includes('check-in') || 
              p.name.toLowerCase().includes('check-out') ||
              p.name.toLowerCase().includes('checkin') || 
              p.name.toLowerCase().includes('checkout')) {
            return false;
          }
          
          return normalizedDbProperty.includes(normalizedReservationProperty) || 
                 normalizedReservationProperty.includes(normalizedDbProperty);
        });
        
        if (matchedProperty) {
          propertyId = matchedProperty.id;
        }
      }

      if (!propertyId) {
        errors.push(`Reservation for ${reservation.guestName || 'unknown guest'}: Property not found`);
        continue;
      }

      // Get property for cost calculations
      const property = await dbStorage.getProperty(propertyId);
      if (!property) {
        errors.push(`Reservation for ${reservation.guestName || 'unknown guest'}: Invalid property ID`);
        continue;
      }

      // Prepare reservation data
      const reservationData: any = {
        propertyId: propertyId,
        guestName: reservation.guestName || reservation.nome || '',
        guestEmail: reservation.guestEmail || reservation.email || null,
        guestPhone: reservation.guestPhone || reservation.phone || reservation.telefone || null,
        checkInDate: reservation.checkInDate || reservation.data_entrada || '',
        checkOutDate: reservation.checkOutDate || reservation.data_saida || '',
        guestCount: reservation.guestCount || reservation.num_guests || 1,
        totalAmount: (reservation.totalAmount || reservation.valor_total || '0').toString(),
        source: reservation.source || 'ocr',
        status: 'confirmed' as const,
        notes: reservation.notes || reservation.observacoes || null,
        platformFee: (reservation.platformFee || '0').toString(),
        cleaningFee: (property.cleaningCost || '0').toString(),
        checkInFee: (property.checkInFee || '0').toString(),
        commission: (Number(reservation.totalAmount || 0) * Number(property.commission || 0) / 100).toString(),
        teamPayment: (property.teamPayment || '0').toString()
      };

      // Calculate net amount
      const totalCosts = Number(reservationData.cleaningFee) + 
                        Number(reservationData.checkInFee) + 
                        Number(reservationData.commission) + 
                        Number(reservationData.teamPayment) + 
                        Number(reservationData.platformFee);

      reservationData.netAmount = (Number(reservationData.totalAmount) - totalCosts).toString();

      // Validate and create reservation
      const validatedData = insertReservationSchema.parse(reservationData);
      await dbStorage.createReservation(validatedData);
      savedCount++;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Reservation for ${reservation.guestName || 'unknown guest'}: ${errorMsg}`);
    }
  }

  return {
    success: savedCount > 0,
    savedCount,
    errors
  };
}

/**
 * POST /api/simple-ocr/process
 * Processa um PDF e extrai dados de reservas
 */
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo fornecido'
      });
    }

    console.log('📄 Processando arquivo:', req.file.filename, 'Tipo:', req.file.mimetype);

    // Processar o arquivo (PDF ou imagem)
    const result = await ocrService.processFile(req.file);

    // Limpar arquivo temporário
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Aviso: Não foi possível remover arquivo temporário:', cleanupError);
    }

    console.log('✅ Processamento OCR concluído:', {
      success: result.success,
      type: result.type,
      reservationsCount: result.reservations.length
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Erro no processamento OCR:', error);
    
    // Limpar arquivo em caso de erro
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Aviso: Não foi possível remover arquivo temporário após erro:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/simple-ocr/status
 * Verifica o status do serviço OCR
 */
router.get('/status', async (req, res) => {
  try {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    
    res.json({
      success: true,
      status: 'operational',
      geminiConfigured: hasGeminiKey,
      supportedFormats: ['PDF'],
      maxFileSize: '10MB'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status do serviço'
    });
  }
});

/**
 * POST /api/simple-ocr/process-multiple
 * Processa múltiplos arquivos e consolida dados de check-in/check-out
 */
router.post('/process-multiple', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo fornecido'
      });
    }

    console.log(`📄 Processando ${files.length} arquivos para consolidação...`);

    const allReservations: any[] = [];
    const fileResults: any[] = [];

    // Processar cada arquivo individualmente
    for (const file of files) {
      console.log(`🔍 Processando: ${file.originalname}`);
      
      const result = await ocrService.processFile(file);
      
      if (result.success && result.reservations.length > 0) {
        // Adicionar tipo de documento e fonte aos dados
        const reservationsWithMeta = result.reservations.map(r => ({
          ...r,
          documentType: result.type,
          source: file.originalname
        }));
        
        allReservations.push(...reservationsWithMeta);
        fileResults.push({
          filename: file.originalname,
          type: result.type,
          reservations: result.reservations.length,
          success: true
        });
      } else {
        fileResults.push({
          filename: file.originalname,
          type: 'unknown',
          reservations: 0,
          success: false,
          error: result.error
        });
      }

      // Limpar arquivo temporário
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.warn('Aviso: Não foi possível remover arquivo temporário:', cleanupError);
      }
    }

    if (allReservations.length === 0) {
      return res.json({
        success: false,
        error: 'Nenhuma reserva foi extraída dos arquivos fornecidos',
        fileResults
      });
    }

    // Retornar todas as reservas encontradas
    console.log(`✅ Processamento múltiplo concluído: ${allReservations.length} reservas encontradas`);

    res.json({
      success: true,
      type: 'multiple-files',
      reservations: allReservations,
      totalReservations: allReservations.length,
      fileResults,
      message: `${allReservations.length} reserva(s) processada(s) com sucesso`
    });

  } catch (error) {
    console.error('❌ Erro no processamento múltiplo:', error);
    
    // Limpar arquivos em caso de erro
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.warn('Aviso: Não foi possível remover arquivo temporário:', cleanupError);
        }
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

export default router;
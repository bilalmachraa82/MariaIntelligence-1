import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SimpleOCRService } from '../services/simple-ocr.service';

const router = Router();

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
    cb(null, `ocr-${uniqueSuffix}.pdf`);
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

    // Use the working EXTRACTOR v4.2 that extracted 38 reservations
    const { WorkingExtractorService } = await import('../services/working-extractor.service');
    const workingExtractor = new WorkingExtractorService();
    
    let extractedText = '';
    
    // Handle different file types
    if (req.file.mimetype === 'application/pdf') {
      const pdf = await import('pdf-parse');
      const fs = await import('fs');
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdf.default(pdfBuffer);
      extractedText = pdfData.text;
    } else {
      // For images, return error for now since we need to focus on PDF functionality
      return res.json({
        success: false,
        type: 'unknown',
        reservations: [],
        error: 'Por favor, use arquivos PDF para melhor extração de dados'
      });
    }
    
    const reservations = await workingExtractor.extractReservations(extractedText);
    const result = {
      success: reservations.length > 0,
      type: 'check-in' as const,
      reservations
    };

    // Limpar arquivo temporário
    try {
      const fs = await import('fs');
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
      
      const result = await ocrService.processFile(file.path, file.mimetype);
      
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

    // Consolidar reservas de check-in e check-out
    console.log('🔄 Iniciando consolidação de reservas...');
    const consolidatedReservations = await ocrService.consolidateReservations(allReservations, []);

    const consolidatedCount = consolidatedReservations.filter(r => r.source === 'consolidated').length;

    console.log(`✅ Processamento múltiplo concluído: ${consolidatedReservations.length} reservas finais, ${consolidatedCount} consolidadas`);

    res.json({
      success: true,
      type: 'multiple-consolidated',
      reservations: consolidatedReservations,
      consolidatedReservations: consolidatedCount,
      fileResults,
      message: `${consolidatedReservations.length} reserva(s) processada(s), ${consolidatedCount} consolidada(s) de check-in/check-out`
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
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
router.post('/process', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo PDF fornecido'
      });
    }

    console.log('📄 Processando arquivo PDF:', req.file.filename);

    // Processar o PDF
    const result = await ocrService.processPDF(req.file.path);

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

export default router;
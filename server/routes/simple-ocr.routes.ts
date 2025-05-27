import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuração do multer para upload de arquivos
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
    const ext = path.extname(file.originalname);
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
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use PDF, JPG ou PNG.'));
    }
  }
});

/**
 * POST /api/simple-ocr/process
 * Processa um arquivo e extrai dados de reservas usando EXTRACTOR v4.2
 */
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo fornecido'
      });
    }

    console.log('🚀 EXTRACTOR v4.2 processing:', req.file.filename, 'Type:', req.file.mimetype);

    // Import working extractor directly
    const { WorkingExtractorService } = await import('../services/working-extractor.service');
    const workingExtractor = new WorkingExtractorService();
    
    let extractedText = '';
    
    // Handle different file types
    if (req.file.mimetype === 'application/pdf') {
      const pdf = await import('pdf-parse');
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdf.default(pdfBuffer);
      extractedText = pdfData.text;
      console.log(`📝 Extracted ${extractedText.length} characters from PDF`);
    } else if (req.file.mimetype.startsWith('image/')) {
      // For images, use Gemini Vision API
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString('base64');
      
      const result = await model.generateContent([
        "Extract all text from this image, focusing on reservation data:",
        {
          inlineData: {
            data: base64Image,
            mimeType: req.file.mimetype
          }
        }
      ]);
      
      extractedText = result.response.text();
      console.log(`📝 Extracted ${extractedText.length} characters from image`);
    } else {
      return res.json({
        success: false,
        type: 'unknown',
        reservations: [],
        error: 'Tipo de arquivo não suportado. Use PDF ou imagem.'
      });
    }
    
    // Extract reservations using working EXTRACTOR v4.2
    const reservations = await workingExtractor.extractReservations(extractedText);
    
    const result = {
      success: reservations.length > 0,
      type: 'check-in' as const,
      reservations
    };

    // Clean up temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Warning: Could not remove temp file:', cleanupError);
    }

    console.log(`✅ EXTRACTOR v4.2 SUCCESS: Found ${reservations.length} reservations!`);
    if (reservations.length > 0) {
      console.log(`Sample guests: ${reservations.slice(0,3).map(r => r.nome).join(', ')}`);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ EXTRACTOR v4.2 Error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no processamento com EXTRACTOR v4.2'
    });
  }
});

/**
 * GET /api/simple-ocr/status
 * Verifica o status do serviço OCR
 */
router.get('/status', async (req, res) => {
  try {
    const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY;
    
    res.json({
      success: true,
      status: 'operational',
      services: {
        gemini: hasGeminiKey ? 'available' : 'not_configured',
        extractor: 'v4.2_active'
      },
      message: 'EXTRACTOR DE RESERVAS v4.2 está operacional'
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
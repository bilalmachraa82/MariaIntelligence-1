/**
 * Middleware para upload de arquivos
 * Configura limites de tamanho, tipos de arquivo e destino
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Obter limite de upload das variáveis de ambiente
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '20');
const MAX_UPLOAD_SIZE = MAX_UPLOAD_MB * 1024 * 1024; // Converter para bytes

// Configuração básica do multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Determinar o diretório com base no tipo MIME
    let uploadDir;
    
    if (file.mimetype === 'application/pdf') {
      uploadDir = path.join(process.cwd(), 'uploads', 'pdf');
    } else if (file.mimetype.startsWith('image/')) {
      uploadDir = path.join(process.cwd(), 'uploads', 'images');
    } else {
      uploadDir = path.join(process.cwd(), 'uploads', 'other');
    }
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Normalizar o nome do arquivo para evitar problemas com caracteres especiais
    let safeName = file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-zA-Z0-9.-]/g, '_'); // Substituir caracteres não alfanuméricos por underscores
    
    // Adicionar timestamp para evitar sobrescrever arquivos
    const timestamp = Date.now();
    const extension = path.extname(safeName);
    const basename = path.basename(safeName, extension);
    
    cb(null, `${basename}-${timestamp}${extension}`);
  }
});

// Filtro para validar tipos MIME
const fileFilter = function(req: any, file: any, cb: any) {
  // Lista de tipos MIME permitidos
  const allowedMimeTypes = [
    'application/pdf', // PDF
    'image/jpeg',      // JPEG/JPG
    'image/png',       // PNG
    'image/webp',      // WebP
    'image/heic',      // HEIC (iOS)
    'image/heif'       // HEIF (iOS)
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}. Apenas PDFs e imagens comuns são permitidos.`), false);
  }
};

// Configuração do multer para upload de PDFs
export const pdfUpload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
  fileFilter: function(req, file, cb) {
    // Aceitar apenas PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!'), false);
    }
  }
});

// Configuração do multer para upload de imagens
export const imageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE / 2, // Metade do tamanho máximo para imagens
  },
  fileFilter: function(req, file, cb) {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPG, PNG, WebP)!'), false);
    }
  }
});

// Configuração do multer para upload de qualquer tipo permitido
export const anyFileUpload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
  fileFilter
});

// Exportar configurações
export default {
  pdfUpload,
  imageUpload,
  anyFileUpload
};
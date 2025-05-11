import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import bodyParser from "body-parser";
import { ZodError, z } from "zod";
// Suporte para múltiplos serviços de IA: OpenRouter (Mistral OCR), Gemini, RolmOCR
import { aiService, AIServiceType } from "./services/ai-adapter.service";
import { AIAdapter } from "./services/ai-adapter.service";
import { hasGeminiApiKey, checkGeminiApiKey } from "./services/check-gemini-key";
import { RAGService } from "./services/rag.service";
import { RagService } from "./services/rag-service";
import { ragService as enhancedRagService } from "./services/rag-enhanced.service";
import { processControlFile, createReservationsFromControlFile } from "./services/control-file-processor";
import { processPdf } from "./services/pdf-extract";
import { 
  processFileAndCreateReservation,
  processPdfAndCreateReservation 
} from "./services/reservation-creator";
import ReservationImporterService from "./services/reservation-importer.service";
// import { BudgetController } from "./controllers/budget.controller";
import { registerQuotationRoutes } from "./api/quotation-routes";
import { registerSpeechRoutes } from "./api/speech-routes";
import uploadControlFileRouter from "./api/upload-control-file";
import reservationAssistantRouter from "./api/reservation-assistant";
import { generateDemoData, resetDemoDataHandler } from "./api/demo-data";
// Importar o novo controlador OCR e middleware de upload configurável
import * as ocrController from "./controllers/ocr.controller";
import * as budgetController from "./controllers/budget.controller";
import { pdfUpload as configuredPdfUpload, imageUpload as configuredImageUpload, anyFileUpload as configuredAnyFileUpload } from "./middleware/upload";
import { 
  insertPropertySchema, 
  insertOwnerSchema,
  insertReservationSchema,
  insertActivitySchema,
  reservationStatusEnum,
  reservationPlatformEnum,

  // Schemas para documentos financeiros
  insertFinancialDocumentSchema,
  insertFinancialDocumentItemSchema,
  insertPaymentRecordSchema,
  financialDocumentTypeEnum,
  financialDocumentStatusEnum,
  entityTypeEnum,
  paymentMethodEnum,
  
  // Tipos
  Reservation,
  Property
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { format } from "date-fns";

// Set up multer for file uploads
const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      // Use original filename with timestamp to prevent overwrites
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function(req, file, cb) {
    // Accept only PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!') as any, false);
    }
  }
});

// Configuração para upload de imagens (OCR)
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'images');
      // Create uploads/images directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      // Use original filename with timestamp to prevent overwrites
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for images
  },
  fileFilter: function(req, file, cb) {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPG, PNG)!') as any, false);
    }
  }
});

// Configuração para upload de ambos os tipos de arquivo (PDF e imagens)
const anyFileUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      let uploadDir;
      
      if (file.mimetype === 'application/pdf') {
        uploadDir = path.join(process.cwd(), 'uploads');
      } else if (file.mimetype.startsWith('image/')) {
        uploadDir = path.join(process.cwd(), 'uploads', 'images');
      } else {
        uploadDir = path.join(process.cwd(), 'uploads', 'other');
      }
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      // Use original filename with timestamp to prevent overwrites
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function(req, file, cb) {
    // Accept PDFs and images
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas PDFs e imagens (JPG, PNG) são permitidos!') as any, false);
    }
  }
});

// Error handling middleware
const handleError = (err: any, res: Response) => {
  console.error("Error details:", err);

  if (err instanceof ZodError) {
    console.error("Validation error:", JSON.stringify(err.errors, null, 2));
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }

  // Detalhando mais o log para facilitar o debug
  if (err.stack) {
    console.error("Error stack:", err.stack);
  }

  // Garantir que sempre retornamos JSON
  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    errorType: err.name || "UnknownError",
    timestamp: new Date().toISOString()
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar o tamanho máximo dos payloads para suportar áudios maiores
  app.use(bodyParser.json({
    limit: '50mb' // Aumentar para 50MB
  }));
  app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000
  }));
  // Properties routes
  app.get("/api/properties", async (req: Request, res: Response) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const property = await storage.getProperty(Number(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/properties", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingProperty = await storage.getProperty(id);

      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };
      const updatedProperty = await storage.updateProperty(id, validatedData);
      res.json(updatedProperty);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.deleteProperty(id);

      if (!result) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Owners routes
  app.get("/api/owners", async (req: Request, res: Response) => {
    try {
      const owners = await storage.getOwners();
      res.json(owners);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/owners/:id", async (req: Request, res: Response) => {
    try {
      const owner = await storage.getOwner(Number(req.params.id));
      if (!owner) {
        return res.status(404).json({ message: "Owner not found" });
      }
      res.json(owner);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/owners", async (req: Request, res: Response) => {
    try {
      console.log("POST /api/owners - Recebido body:", JSON.stringify(req.body, null, 2));

      // Verificar se o corpo da requisição não está vazio
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("POST /api/owners - Body vazio ou inválido");
        return res.status(400).json({ 
          message: "Corpo da requisição vazio ou inválido",
          timestamp: new Date().toISOString()
        });
      }

      // Validar os dados com o schema
      try {
        const validatedData = insertOwnerSchema.parse(req.body);
        console.log("POST /api/owners - Dados validados:", JSON.stringify(validatedData, null, 2));

        // Criar o proprietário
        const owner = await storage.createOwner(validatedData);
        console.log("POST /api/owners - Proprietário criado com sucesso:", JSON.stringify(owner, null, 2));

        return res.status(201).json(owner);
      } catch (validationError) {
        console.error("POST /api/owners - Erro de validação:", validationError);
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Erro de validação",
            errors: validationError.errors,
            timestamp: new Date().toISOString()
          });
        }
        throw validationError; // Propagar para o próximo catch
      }
    } catch (err) {
      console.error("POST /api/owners - Erro interno:", err);
      handleError(err, res);
    }
  });

  app.patch("/api/owners/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingOwner = await storage.getOwner(id);

      if (!existingOwner) {
        return res.status(404).json({ message: "Owner not found" });
      }

      const validatedData = insertOwnerSchema.partial().parse(req.body);
      const updatedOwner = await storage.updateOwner(id, validatedData);
      res.json(updatedOwner);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/owners/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.deleteOwner(id);

      if (!result) {
        return res.status(404).json({ message: "Owner not found" });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Reservations routes
  app.get("/api/reservations", async (req: Request, res: Response) => {
    try {
      let reservations;

      if (req.query.propertyId) {
        reservations = await storage.getReservationsByProperty(Number(req.query.propertyId));
      } else {
        reservations = await storage.getReservations();
      }

      res.json(reservations);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Rota específica para reservas do dia atual e amanhã (para dashboard)
  app.get("/api/reservations/dashboard", async (req: Request, res: Response) => {
    try {
      const reservations = await storage.getReservationsForDashboard();
      
      // Categorizar reservas para o formato esperado pelo componente
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Arrays para armazenar cada tipo de reserva
      const checkIns: any[] = [];
      const checkOuts: any[] = [];
      const cleaningTasks: any[] = [];
      
      // Categorizar as reservas
      reservations.forEach((reservation: any) => {
        // Check-ins para hoje e amanhã
        const checkInStr = reservation.checkInDate instanceof Date 
          ? reservation.checkInDate.toISOString().split('T')[0] 
          : String(reservation.checkInDate).split('T')[0];
          
        if (checkInStr === today || checkInStr === tomorrowStr) {
          checkIns.push(reservation);
        }
        
        // Check-outs para hoje
        const checkOutStr = reservation.checkOutDate instanceof Date 
          ? reservation.checkOutDate.toISOString().split('T')[0] 
          : String(reservation.checkOutDate).split('T')[0];
          
        if (checkOutStr === today) {
          checkOuts.push(reservation);
          
          // Cada check-out gera uma tarefa de limpeza
          cleaningTasks.push({
            id: `cleaning-${reservation.id}`,
            propertyId: reservation.propertyId,
            propertyName: reservation.propertyName,
            title: `Limpeza após saída`,
            description: `Limpeza necessária após saída do hóspede ${reservation.guestName}`,
            status: 'pending',
            priority: 'medium',
            type: 'cleaning',
            date: reservation.checkOutDate
          });
        }
      });
      
      // Adicionar reservas de demonstração para testes
      // Dados de teste para check-ins hoje
      if (checkIns.length === 0) {
        const demoProperties = await storage.getProperties();
        if (demoProperties && demoProperties.length > 0) {
          // Selecionar 2-3 propriedades aleatórias para adicionar check-ins
          const selectedProperties = demoProperties
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(3, demoProperties.length));
          
          for (let i = 0; i < selectedProperties.length; i++) {
            const property = selectedProperties[i];
            const isToday = i % 2 === 0; // Alternar entre hoje e amanhã
            
            // Criar horário check-in aleatório
            const checkInHour = 13 + Math.floor(Math.random() * 5);
            const checkInDate = new Date(isToday ? today : tomorrowStr);
            checkInDate.setHours(checkInHour, 0, 0, 0);
            
            // Criar check-out 2-7 dias depois
            const stayDays = 2 + Math.floor(Math.random() * 6);
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkOutDate.getDate() + stayDays);
            
            // Gerar nome de hóspede
            const names = ["João Silva", "Maria Santos", "Carlos Oliveira", "Ana Pereira", "Pedro Costa"];
            const randomName = names[Math.floor(Math.random() * names.length)];
            
            // Adicionar check-in
            checkIns.push({
              id: 1000 + i,
              propertyId: property.id,
              propertyName: property.name,
              guestName: randomName,
              checkInDate: checkInDate.toISOString(),
              checkOutDate: checkOutDate.toISOString(),
              status: "confirmed",
              totalCost: 500 + Math.floor(Math.random() * 1000),
              guestsCount: 1 + Math.floor(Math.random() * 4)
            });
          }
        }
      }
      
      // Dados de teste para check-outs hoje (se não houver nenhum)
      if (checkOuts.length === 0) {
        const demoProperties = await storage.getProperties();
        if (demoProperties && demoProperties.length > 0) {
          // Selecionar 1-2 propriedades aleatórias para check-outs
          const selectedProperties = demoProperties
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(2, demoProperties.length));
          
          for (let i = 0; i < selectedProperties.length; i++) {
            const property = selectedProperties[i];
            
            // Criar horário check-out aleatório
            const checkOutHour = 10 + Math.floor(Math.random() * 2);
            const checkOutDate = new Date(today);
            checkOutDate.setHours(checkOutHour, 0, 0, 0);
            
            // Criar check-in alguns dias antes
            const stayDays = 2 + Math.floor(Math.random() * 5);
            const checkInDate = new Date(checkOutDate);
            checkInDate.setDate(checkInDate.getDate() - stayDays);
            
            // Gerar nome de hóspede
            const names = ["Roberto Almeida", "Fernanda Lima", "Luciana Mendes", "Bruno Castro", "Teresa Sousa"];
            const randomName = names[Math.floor(Math.random() * names.length)];
            
            const checkOut = {
              id: 2000 + i,
              propertyId: property.id,
              propertyName: property.name,
              guestName: randomName,
              checkInDate: checkInDate.toISOString(),
              checkOutDate: checkOutDate.toISOString(),
              status: "confirmed",
              totalCost: 500 + Math.floor(Math.random() * 1000),
              guestsCount: 1 + Math.floor(Math.random() * 4)
            };
            
            // Adicionar check-out
            checkOuts.push(checkOut);
            
            // Adicionar tarefa de limpeza correspondente
            cleaningTasks.push({
              id: `cleaning-${2000 + i}`,
              propertyId: property.id,
              propertyName: property.name,
              title: `Limpeza após saída`,
              description: `Limpeza necessária após saída do hóspede ${randomName}`,
              status: 'pending',
              priority: 'medium',
              type: 'cleaning',
              icon: null,
              date: checkOutDate.toISOString()
            });
          }
        }
      }
      
      // Retornar dados estruturados
      res.json({
        checkIns,
        checkOuts,
        cleaningTasks
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/reservations/:id", async (req: Request, res: Response) => {
    try {
      const reservation = await storage.getReservation(Number(req.params.id));
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      res.json(reservation);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/reservations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertReservationSchema.parse(req.body);

      // Calculate costs based on property information
      const property = await storage.getProperty(validatedData.propertyId);
      if (!property) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      // Apply property-specific costs with verificação de nulos
      validatedData.cleaningFee = (property.cleaningCost || '0').toString();
      validatedData.checkInFee = (property.checkInFee || '0').toString();
      validatedData.commission = (Number(validatedData.totalAmount) * Number(property.commission || '0') / 100).toString();
      validatedData.teamPayment = (property.teamPayment || '0').toString();

      // Calculate net amount
      const totalCosts = Number(validatedData.cleaningFee) + 
                        Number(validatedData.checkInFee) + 
                        Number(validatedData.commission) + 
                        Number(validatedData.teamPayment) + 
                        Number(validatedData.platformFee);

      validatedData.netAmount = (Number(validatedData.totalAmount) - totalCosts).toString();

      const reservation = await storage.createReservation(validatedData);
      res.status(201).json(reservation);
    } catch (err) {
      handleError(err, res);
    }
  });

  /**
   * Endpoint para importação de texto de reserva
   * Permite extrair dados de reserva a partir de texto não estruturado usando IA
   */
  app.post("/api/reservations/import-text", async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de importação de texto...');
      
      // Extrair os dados do corpo da requisição
      const { text, propertyId, userAnswers } = req.body;
      
      // Validar os dados de entrada
      if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({
          success: false,
          message: "Texto vazio ou inválido."
        });
      }
      
      // Verificar se temos a API Gemini disponível
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        return res.status(400).json({
          success: false,
          message: "Chave da API Google Gemini não configurada",
          needsApiKey: true
        });
      }
      
      // Registrar atividade
      await storage.createActivity({
        type: "text_import_attempt",
        description: `Tentativa de importação de texto para reserva`
      });
      
      try {
        // Inicializar o serviço de importação
        console.log('Inicializando serviço de importação...');
        const importerService = new ReservationImporterService();
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
        await importerService.initialize(apiKey);
        
        // Importar dados da reserva do texto
        console.log('Enviando texto para processamento:', text.substring(0, 50) + '...');
        const importOptions = {
          originalText: text,
          userAnswers: userAnswers || {}
        };
        
        const result = await importerService.importFromText(text, importOptions);
        console.log('Resultado recebido do serviço de importação');
        
        // Tratar dados do resultado
        if (!result.reservation_data) {
          throw new Error("Não foi possível extrair dados estruturados do texto");
        }
        
        // Criando uma cópia para não modificar o objeto original
        const reservationDataWithProperty: any = { ...result.reservation_data };
        let needsClarification = false;
        let clarificationQuestions: string[] = [];
        
        if (result.clarification_questions && result.clarification_questions.length > 0) {
          needsClarification = true;
          clarificationQuestions = result.clarification_questions;
          console.log('Foram encontradas questões de esclarecimento:', clarificationQuestions.length);
        }
        
        // Padronizar campos para compatibilidade com outras partes do sistema
        // Isso garante consistência entre importação por texto e pelo assistente
        if (reservationDataWithProperty.guest_name && !reservationDataWithProperty.guestName) {
          reservationDataWithProperty.guestName = reservationDataWithProperty.guest_name;
        }
        
        if (reservationDataWithProperty.check_in_date && !reservationDataWithProperty.checkInDate) {
          reservationDataWithProperty.checkInDate = reservationDataWithProperty.check_in_date;
        }
        
        if (reservationDataWithProperty.check_out_date && !reservationDataWithProperty.checkOutDate) {
          reservationDataWithProperty.checkOutDate = reservationDataWithProperty.check_out_date;
        }
        
        if (reservationDataWithProperty.total_guests && !reservationDataWithProperty.numGuests) {
          reservationDataWithProperty.numGuests = reservationDataWithProperty.total_guests;
        }
        
        if (reservationDataWithProperty.guest_email && !reservationDataWithProperty.guestEmail) {
          reservationDataWithProperty.guestEmail = reservationDataWithProperty.guest_email;
        }
        
        if (reservationDataWithProperty.guest_phone && !reservationDataWithProperty.guestPhone) {
          reservationDataWithProperty.guestPhone = reservationDataWithProperty.guest_phone;
        }
        
        if (reservationDataWithProperty.booking_source && !reservationDataWithProperty.platform) {
          reservationDataWithProperty.platform = reservationDataWithProperty.booking_source;
        }
        
        // Se não houver status, definir como 'confirmed' por padrão
        if (!reservationDataWithProperty.status) {
          reservationDataWithProperty.status = 'confirmed';
        }
        
        // Se um propertyId foi enviado, vamos associar à propriedade
        if (propertyId && !isNaN(Number(propertyId))) {
          console.log('Associando à propriedade com ID:', propertyId);
          const property = await storage.getProperty(Number(propertyId));
          if (property) {
            // Adicionando propriedade para uso interno
            reservationDataWithProperty.propertyId = property.id;
            reservationDataWithProperty.property_name = property.name;
          }
        } else if (reservationDataWithProperty.property_name) {
          // Tentar encontrar a propriedade pelo nome
          console.log('Tentando encontrar propriedade pelo nome:', reservationDataWithProperty.property_name);
          const properties = await storage.getProperties();
          const matchingProperty = properties.find(p => 
            p.name && 
            p.name.toLowerCase() === reservationDataWithProperty.property_name.toLowerCase()
          );
          
          if (matchingProperty) {
            // Adicionando propriedade para uso interno
            reservationDataWithProperty.propertyId = matchingProperty.id;
            console.log('Propriedade encontrada com ID:', matchingProperty.id);
          }
        }
        
        // Registrar atividade de sucesso
        await storage.createActivity({
          type: "text_import_success",
          description: `Dados extraídos com sucesso do texto para reserva`
        });
        
        console.log('Respondendo com dados extraídos, needsClarification:', needsClarification);
        return res.json({
          success: true,
          needsClarification,
          clarificationQuestions: needsClarification ? clarificationQuestions : undefined,
          reservationData: reservationDataWithProperty
        });
      } catch (error) {
        console.error("Erro ao processar texto da reserva com IA:", error);
        
        // Registrar atividade de falha
        await storage.createActivity({
          type: "text_import_failed",
          description: `Falha ao extrair dados de texto para reserva: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
        
        return res.status(500).json({
          success: false,
          message: "Não foi possível extrair dados do texto. Tente novamente ou insira manualmente.",
          error: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    } catch (err) {
      console.error("Erro no endpoint de importação de texto:", err);
      handleError(err, res);
    }
  });

  app.patch("/api/reservations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingReservation = await storage.getReservation(id);

      if (!existingReservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };

      // If total amount or property has changed, recalculate costs
      if (validatedData.totalAmount || validatedData.propertyId) {
        const property = await storage.getProperty(
          validatedData.propertyId || existingReservation.propertyId
        );

        if (!property) {
          return res.status(400).json({ message: "Invalid property ID" });
        }

        // Update costs based on property information with verificação de nulos
        validatedData.cleaningFee = (property.cleaningCost || '0').toString();
        validatedData.checkInFee = (property.checkInFee || '0').toString();

        const totalAmount = validatedData.totalAmount || existingReservation.totalAmount;
        validatedData.commission = (Number(totalAmount) * Number(property.commission || '0') / 100).toString();
        validatedData.teamPayment = (property.teamPayment || '0').toString();

        // Recalculate net amount
        const platformFee = validatedData.platformFee || existingReservation.platformFee;
        const totalCosts = Number(validatedData.cleaningFee) + 
                          Number(validatedData.checkInFee) + 
                          Number(validatedData.commission) + 
                          Number(validatedData.teamPayment) + 
                          Number(platformFee);

        validatedData.netAmount = (Number(totalAmount) - totalCosts).toString();
      }

      const updatedReservation = await storage.updateReservation(id, validatedData);
      res.json(updatedReservation);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/reservations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.deleteReservation(id);

      if (!result) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // A implementação do endpoint /api/reservations/import-text foi movida para cima

  // Activities routes
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const activities = await storage.getActivities(limit);
      
      // Verificar se devemos mostrar as tarefas de demonstração
      // Lógica refinada: Verificamos múltiplas fontes para garantir consistência
      
      // PATCH DE EMERGÊNCIA: BLOQUEAR SEMPRE OS DADOS DEMO
      // Definir parâmetros para bloquear permanentemente os dados de demonstração
      
      // 1. Verificar parâmetros vindos do cliente
      const hideFromQueryParam = req.query.hideDemoTasks === 'true';
      const demoDataRemovedFromParam = req.query.demoDataRemoved === 'true';
      const disableDemoData = req.query.disableDemoData === 'true';
      const forceCleanMode = req.query.forceCleanMode === 'true';
      
      // 2. Verificar se algum dos parâmetros de limpeza está ativo
      const cleanModeDetected = hideFromQueryParam || demoDataRemovedFromParam || disableDemoData || forceCleanMode;
      
      // 3. Se modo de limpeza forçada estiver ativo, remover todos os dados demo
      if (forceCleanMode) {
        console.log('⚠️ MODO DE LIMPEZA FORÇADA DETECTADO - Executando limpeza completa dos dados demo');
        try {
          // Executar limpeza
          const cleanupResult = await import('./api/demo-data').then(m => m.resetDemoData());
          if (cleanupResult.success) {
            console.log(`✅ Limpeza forçada concluída! ${cleanupResult.removedItems} itens removidos`);
          }
        } catch (cleanupError) {
          console.error('❌ Erro durante limpeza forçada:', cleanupError);
        }
      }
      
      // 4. Verificar configuração do sistema no storage (se disponível)
      let demoRemovedFromSystem = true; // Forçar true independente do valor real
      
      // Se qualquer uma das flags indicar que os dados demo devem ser removidos, respeitamos
      const hideDemoTasks = true; // Sempre true para bloquear demos
      const showDemoTasks = false; // Sempre false para bloquear demos
      
      console.log(`Status de dados demo: hideDemoTasks=${hideDemoTasks}, showDemoTasks=${showDemoTasks}`);
      
      // Obter tarefas de manutenção reais do banco de dados (pode ser uma lista vazia)
      let realMaintenanceTasks = [];
      try {
        realMaintenanceTasks = await storage.getMaintenanceTasks();
        console.log(`Obtidas ${realMaintenanceTasks.length} tarefas reais de manutenção`);
      } catch (dbError) {
        console.error('Erro ao obter tarefas de manutenção reais:', dbError);
        // Continue mesmo se houver erro, usando array vazio
      }
      
      // Verificar a configuração para inclusão de tarefas demo de manutenção
      // Só mostrar tarefas de demonstração se:
      // 1. A flag de mostrar demos está ativa E
      // 2. Não existem tarefas reais de manutenção
      const shouldShowDemoMaintenance = showDemoTasks && (realMaintenanceTasks.length === 0);
      
      let maintenance = [];
      let tasks = [];
      
      // Se devemos mostrar as tarefas de demonstração ou não há tarefas reais, adicionar as demo
      if (shouldShowDemoMaintenance) {
        // Obter propriedades para definir as tarefas em algumas delas
        const properties = await storage.getProperties();
        const activeProperties = properties.filter(p => p.active).slice(0, 3);
        
        console.log(`Gerando tarefas de demonstração para ${activeProperties.length} propriedades ativas`);
        
        // Criar tarefas de manutenção para o dashboard
        maintenance = activeProperties.map((property, index) => ({
          id: `maintenance-${property.id}`,
          propertyId: property.id,
          propertyName: property.name,
          title: index === 0 ? 'Problema na torneira do banheiro' : 
                 index === 1 ? 'Ar condicionado com problema' :
                 'Manutenção da fechadura',
          description: index === 0 ? 'Cliente reportou vazamento na torneira do banheiro principal' :
                      index === 1 ? 'Unidade interna do ar condicionado fazendo barulho' :
                      'Fechadura da porta principal necessita manutenção',
          status: index === 0 ? 'attention' : 'pending',
          priority: index === 0 ? 'high' : 'medium',
          type: 'maintenance',
          date: new Date().toISOString(),
          isDemo: true
        }));
        
        // Criar outras tarefas gerais para o dashboard
        tasks = [
          {
            id: 'task-1',
            title: 'Contatar fornecedor de produtos',
            description: 'Refazer pedido de amenities para os próximos meses',
            status: 'pending',
            priority: 'medium',
            type: 'task',
            icon: 'Phone',
            date: new Date().toISOString(),
            isDemo: true
          },
          {
            id: 'task-2',
            title: 'Atualizar preços no site',
            description: 'Revisar tarifas para o período de alta temporada',
            status: 'upcoming',
            priority: 'low',
            type: 'task',
            icon: 'Calendar',
            date: new Date().toISOString(),
            isDemo: true
          }
        ];
      } else {
        // Caso contrário, usar as tarefas reais de manutenção do banco
        maintenance = realMaintenanceTasks.map(task => ({
          id: `maintenance-${task.id}`,
          propertyId: task.propertyId,
          propertyName: task.propertyName || `Propriedade #${task.propertyId}`,
          title: task.description.split(' - ')[0] || task.description,
          description: task.description.split(' - ')[1] || task.description,
          status: task.status === 'pending' ? 'pending' : 
                 task.status === 'scheduled' ? 'upcoming' : 'completed',
          priority: task.priority,
          type: 'maintenance',
          date: task.reportedAt
        }));
        
        // Se não houver tarefas de manutenção, deixamos a lista vazia
        console.log(`Usando ${maintenance.length} tarefas reais de manutenção (modo demonstração desativado)`);
      }
      
      // Retornar resposta estruturada para dashboard
      res.json({
        activities,
        maintenance,
        tasks
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Statistics routes
  app.get("/api/statistics", async (req: Request, res: Response) => {
    try {
      console.log("########### INICIANDO /api/statistics ###########");
      
      // Tratamento especial para as datas para evitar erros de formato
      let startDate: Date | undefined = undefined;
      let endDate: Date | undefined = undefined;

      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;

      if (startDateStr && startDateStr !== 'undefined' && startDateStr !== 'null') {
        startDate = new Date(startDateStr);
      }

      if (endDateStr && endDateStr !== 'undefined' && endDateStr !== 'null') {
        endDate = new Date(endDateStr);
      }

      console.log("Usando datas:", { startDate, endDate });

      // Get properties for active property count
      console.log("Obtendo propriedades...");
      const properties = await storage.getProperties();
      console.log(`Obtidas ${properties.length} propriedades`);
      const activeProperties = properties.filter(p => p.active).length;
      console.log(`Propriedades ativas: ${activeProperties}`);

      // Get revenue and profit using storage methods with date parameters
      let totalRevenue = 0;
      let netProfit = 0;
      let occupancyRate = 0;
      
      try {
        // Use the storage layer methods that already have date filtering
        console.log("CHAMANDO storage.getTotalRevenue...");
        // Teste direto com o SQL
        console.log("Consultando receita total diretamente via SQL...");
        try {
          const { db } = await import('./db');
          const { sql } = await import('drizzle-orm');
          if (db) {
            const directQuery = `SELECT SUM(CAST(total_amount AS DECIMAL)) as direct_total FROM reservations WHERE status = 'completed'`;
            const directResult = await db.execute(sql.raw(directQuery));
            console.log("Resultado da consulta SQL direta:", directResult);
            const results = directResult as unknown as any[];
            console.log("Valor total diretamente da tabela:", results[0]?.direct_total);
          } else {
            console.log("Banco de dados não disponível para consulta direta");
          }
        } catch (e) {
          console.error("Erro na consulta direta SQL:", e);
        }
        
        totalRevenue = await storage.getTotalRevenue(startDate, endDate);
        console.log("Receita total:", totalRevenue);
        
        console.log("CHAMANDO storage.getNetProfit...");
        netProfit = await storage.getNetProfit(startDate, endDate);
        console.log("Lucro líquido:", netProfit);
        
        console.log("CHAMANDO storage.getOccupancyRate...");
        occupancyRate = await storage.getOccupancyRate(undefined, startDate, endDate);
        console.log("Taxa de ocupação:", occupancyRate);
      } catch (error) {
        console.error("Erro ao obter estatísticas:", error);
        // Continuamos sem quebrar a API
      }
      
      console.log("Estatísticas calculadas:", { totalRevenue, netProfit, occupancyRate });
      
      // Get reservations for the period (for other calculations)
      let reservations = await storage.getReservations();
      
      // Filter reservations by date if parameters are provided
      if (startDate) {
        reservations = reservations.filter(
          r => new Date(r.checkInDate) >= startDate
        );
      }

      if (endDate) {
        reservations = reservations.filter(
          r => new Date(r.checkInDate) <= endDate
        );
      }
      
      // Calculate reservations count
      const confirmedAndCompletedReservations = reservations.filter(
        r => r.status === "confirmed" || r.status === "completed"
      );

      // Get property occupancy rates for top performing properties
      const propertyStats = await Promise.all(
        properties.filter(p => p.active).map(async (property) => {
          const stats = await storage.getPropertyStatistics(property.id);
          return {
            id: property.id,
            name: property.name,
            occupancyRate: stats.occupancyRate,
            revenue: stats.totalRevenue,
            profit: stats.netProfit
          };
        })
      );

      // Sort by occupancy rate descending
      const topProperties = propertyStats
        .sort((a, b) => b.occupancyRate - a.occupancyRate)
        .slice(0, 5);

      res.json({
        success: true,
        totalRevenue,
        netProfit,
        occupancyRate,
        totalProperties: properties.length,
        activeProperties,
        reservationsCount: reservations.length,
        topProperties
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/statistics/property/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const stats = await storage.getPropertyStatistics(id);

      if (!stats) {
        return res.status(404).json({ 
          success: false,
          message: "Property not found" 
        });
      }

      res.json({
        success: true,
        propertyId: id,
        ...stats
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  /**
   * Endpoint para obter receita mensal ou semanal
   * Retorna dados de receita e lucro agregados por período para visualização em gráficos
   * Adapta a granularidade dos dados com base no intervalo (mês, semana, dia)
   */
  app.get("/api/statistics/monthly-revenue", async (req: Request, res: Response) => {
    try {
      console.log("=========================================================");
      console.log("INICIANDO PROCESSAMENTO DE RECEITA POR PERÍODO");
      console.log("=========================================================");
      
      // Pegar parâmetros de filtro de data do request
      const startDateParam = req.query.startDate as string | undefined;
      const endDateParam = req.query.endDate as string | undefined;
      
      // Log dos parâmetros recebidos
      console.log(`Parâmetros recebidos: startDate=${startDateParam}, endDate=${endDateParam}`);
      
      // Definir datas de início e fim
      const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = endDateParam ? new Date(endDateParam) : new Date(new Date().getFullYear(), 11, 31);
      
      console.log(`Período calculado: ${startDate.toISOString()} até ${endDate.toISOString()}`);
      
      // Calcular a diferença em dias entre as datas
      const dateDiffTime = endDate.getTime() - startDate.getTime();
      const dateDiffDays = Math.ceil(dateDiffTime / (1000 * 3600 * 24));
      
      console.log(`Diferença em dias calculada: ${dateDiffDays}`);
      
      // Sempre usar granularidade mensal conforme solicitado
      let granularity = 'month';
      console.log(`Conforme solicitado, todos os dados serão agrupados por mês, independente do período (${dateDiffDays} dias)`);
      console.log(`Granularidade padronizada para mensal`);
      
      // Buscar todas as reservas confirmadas ou concluídas
      const reservations = await storage.getReservations();
      const confirmedReservations = reservations.filter(r => {
        const checkInDate = new Date(r.checkInDate);
        return (r.status === "confirmed" || r.status === "completed") 
          && checkInDate >= startDate
          && checkInDate <= endDate;
      });
      
      console.log(`Encontradas ${confirmedReservations.length} reservas no período`);
      
      let revenueData = [];
      
      // Agrupar dados por mês (agora sempre usando granularidade mensal)
      // Inicializar array com todos os meses
      const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      
      // Calcular receita e lucro por mês
      revenueData = months.map((month, index) => {
        // Filtrar reservas para este mês, considerando todos os anos no intervalo
        const monthReservations = confirmedReservations.filter(r => {
          const checkInDate = new Date(r.checkInDate);
          return checkInDate.getMonth() === index;
        });
        
        // Calcular receita e lucro total para o mês
        const revenue = monthReservations.reduce(
          (sum, r) => sum + parseFloat(r.totalAmount), 0
        );
        
        const profit = monthReservations.reduce(
          (sum, r) => sum + parseFloat(r.netAmount || '0'), 0
        );
        
        return {
          month,
          revenue,
          profit
        };
      });
      
      // Remover períodos sem dados para melhorar a visualização
      revenueData = revenueData.filter(d => d.revenue > 0 || d.profit > 0);
      
      // Se não houver dados após o filtro, manter pelo menos um registro com zeros
      if (revenueData.length === 0) {
        // Como agora só usamos granularidade mensal, sempre usamos o mês inicial
        revenueData = [{ month: 'Jan', revenue: 0, profit: 0 }];
      }
      
      console.log(`Retornando ${revenueData.length} períodos de dados`);
      console.log(`Granularidade final sendo retornada: ${granularity}`);
      console.log("Resumo da resposta:", {
        granularity,
        totalPeriods: revenueData.length,
        firstPeriod: revenueData[0] || null,
        year: startDate.getFullYear()
      });
      
      const response = {
        success: true,
        data: revenueData,
        year: startDate.getFullYear(),
        granularity
      };
      
      console.log("Resposta completa:", JSON.stringify(response));
      res.json(response);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Usamos apenas o aiService instanciado no início
  const ragService = new RAGService();
  // Use the enhanced RAG service for additional capabilities

  // Upload e processamento de arquivos de controle
  // 🔥 ROTA LEGADA - usar /api/ocr no lugar
  /*
  app.post("/api/upload-control-file", pdfUpload.single('pdf'), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de arquivo de controle...');
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado" 
        });
      }

      // Verificar se temos a chave de API do Google Gemini disponível
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Chave de API do Google não configurada" 
        });
      }

      // Processar o arquivo para extrair reservas
      const controlResult = await processControlFile(req.file.path);
      
      if (!controlResult.success) {
        return res.status(500).json({
          success: false,
          message: "Falha ao processar arquivo de controle",
          error: controlResult.error
        });
      }
      
      if (!controlResult.isControlFile) {
        return res.status(400).json({
          success: false,
          message: "O arquivo enviado não parece ser um arquivo de controle válido"
        });
      }
      
      // Criar reservas a partir dos dados extraídos
      const createdReservations = await createReservationsFromControlFile(controlResult);
      
      return res.status(200).json({
        success: true,
        isControlFile: true,
        propertyName: controlResult.propertyName,
        reservationsExtracted: controlResult.reservations.length,
        reservationsCreated: createdReservations.length,
        reservations: createdReservations
      });
      
    } catch (error) {
      console.error("Erro ao processar arquivo de controle:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao processar arquivo de controle",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  */
  
  // PDF Upload e Processamento
  // Rota removida em favor da rota unificada /api/ocr

  
  /**
   * Endpoint para processamento de imagens usando OCR
   * Extrai dados de reserva a partir de imagens de confirmações e comprovantes
   * 🔥 ROTA LEGADA - usar /api/ocr no lugar
   */
  /*
  app.post("/api/upload-image", imageUpload.single('image'), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de upload de imagem para OCR...');
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhuma imagem enviada" 
        });
      }

      // Verificar se temos a chave de API do Google Gemini disponível
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Nenhuma chave de API do Google Gemini configurada" 
        });
      }

      try {
        console.log(`Processando imagem: ${req.file.path}`);
        
        // Parâmetros de controle
        const autoCreateReservation = req.query.autoCreate !== 'false'; // Por padrão sempre cria
        
        // Sempre usar alta qualidade para processamento
        const skipQualityCheck = false;
        const useCache = false;
        // Usar o novo serviço de processamento que pode criar reservas a partir de imagens
        const result = await processFileAndCreateReservation(
          req.file.path, 
          process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
          { skipQualityCheck, useCache }
        );
        console.log('Processamento OCR e criação de reserva concluídos:', result.success);
        
        // Adicionar atividade ao sistema se a reserva foi criada
        if (result.success && result.reservation) {
          await storage.createActivity({
            activityType: 'reservation_created',
            description: `Reserva criada automaticamente via OCR de imagem: ${result.reservation.propertyId} - ${result.reservation.guestName}`,
            resourceId: result.reservation.id,
            resourceType: 'reservation'
          });
        }
        
        // Adicionar o texto extraído à base de conhecimento RAG
        if (result.extractedData && result.extractedData.rawText) {
          await ragService.addToKnowledgeBase(result.extractedData.rawText, 'reservation_image_ocr', {
            filename: req.file.filename,
            uploadDate: new Date(),
            reservationId: result.reservation?.id,
            status: result.success ? 'created' : 'failed'
          });
        }
        
        // Retornar resultado com a reserva criada e dados extraídos
        return res.json({
          success: result.success,
          message: result.message,
          reservation: result.reservation,
          extractedData: result.extractedData,
          validation: result.validationResult,
          file: {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype
          }
        });
      } catch (processError) {
        console.error('Erro no processamento da imagem:', processError);
        // Retornar erro formatado
        return res.status(500).json({ 
          success: false,
          message: "Falha ao processar imagem com OCR", 
          error: processError instanceof Error ? processError.message : "Erro desconhecido no processamento"
        });
      }
    } catch (err) {
      console.error('Erro ao processar upload de imagem:', err);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor",
        error: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });

  /**
   * Endpoint para processamento de qualquer arquivo (PDF ou imagem)
   * Detecta automaticamente o tipo e executa o processamento apropriado
   */
  /**
   * Rota unificada para OCR
   * Usa prioridade: Mistral OCR (OpenRouter) -> RolmOCR -> Gemini
   * Detecta automaticamente conteúdo manuscrito e otimiza o processamento
   */
  app.post("/api/ocr", pdfUpload.single('pdf'), ocrController.postOcr);
  
  /**
   * Endpoints adicionais para processamento OCR (legado/auxiliar)
   */
  app.post("/api/ocr/process", anyFileUpload.single('file'), ocrController.processOCR);
  app.post("/api/ocr/process/:service", anyFileUpload.single('file'), ocrController.processWithService);
  
  /**
   * Endpoint para estimativa de orçamento
   * Calcula valor total e margem de lucro com base nas noites e taxa diária
   */
  app.post("/api/budgets/estimate", async (req: Request, res: Response) => {
    try {
      // Importar o controlador de orçamento e usar sua função de estimativa
      const { estimate } = await import('./controllers/budget.controller');
      return estimate(req, res);
    } catch (error) {
      console.error('Erro ao estimar orçamento:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao calcular orçamento'
      });
    }
  });
  
  /**
   * Endpoint para upload e processamento geral de arquivos (versão legada)
   * 🔥 ROTA LEGADA - usar /api/ocr no lugar
   */
  /* 
   * A versão anterior desta rota foi removida. 
   * Todo o processamento de OCR foi migrado para o endpoint unificado /api/ocr
   */

  /**
   * Endpoint para upload e processamento de PDFs
   * Processa documentos individuais ou em par (check-in e check-out) para extração de dados
   * 
   * Pode processar:
   * - Um único documento (para processamento básico)
   * - Um par de documentos (para processamento enriquecido com dados de ambos)
   * 
   * Para pares, identifica o primeiro como check-in e o segundo como check-out
   * quando a identificação automática falha.
   */
  app.post("/api/upload-pdf-pair", pdfUpload.array('pdfs', 2), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de par de PDFs...');
      
      // Verificar se foram enviados arquivos
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado" 
        });
      }
      
      // Verifica se temos pelo menos um arquivo
      if (req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "É necessário enviar pelo menos um arquivo PDF",
          filesReceived: 0
        });
      }
      
      // Nota: o sistema funciona melhor com 2 arquivos (check-in e check-out),
      // mas pode processar individualmente quando necessário

      // Verificar se temos a chave de API do Google Gemini disponível
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Nenhuma chave de API do Google Gemini configurada" 
        });
      }

      try {
        // Importar o serviço de processamento de pares de PDFs
        const { processPdfPair } = await import('./services/pdf-pair-processor');
        
        // Obter caminhos dos arquivos enviados
        const pdfPaths = (req.files as Express.Multer.File[]).map(file => file.path);
        const fileInfo = (req.files as Express.Multer.File[]).map(file => ({
          filename: file.filename,
          path: file.path,
          originalname: file.originalname
        }));
        
        console.log(`Processando ${pdfPaths.length} arquivos: ${pdfPaths.join(', ')}`);
        
        // Processar o par de PDFs
        const pairResult = await processPdfPair(pdfPaths, process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "");
        
        // Se não há dados de reserva extraídos, retorna erro
        if (!pairResult.reservationData) {
          console.error('Não foi possível extrair dados da reserva');
          return res.status(422).json({
            success: false,
            message: "Não foi possível extrair dados da reserva dos documentos",
            pairInfo: {
              isPairComplete: pairResult.isPairComplete,
              checkInPresent: !!pairResult.checkIn,
              checkOutPresent: !!pairResult.checkOut
            },
            errors: pairResult.errors
          });
        }
        
        // Adicionar o texto extraído à base de conhecimento RAG
        if (pairResult.checkIn && pairResult.checkIn.text) {
          await ragService.addToKnowledgeBase(pairResult.checkIn.text, 'check_in_pdf', {
            filename: pairResult.checkIn.filename,
            uploadDate: new Date(),
            documentType: 'check-in'
          });
        }
        
        if (pairResult.checkOut && pairResult.checkOut.text) {
          await ragService.addToKnowledgeBase(pairResult.checkOut.text, 'check_out_pdf', {
            filename: pairResult.checkOut.filename,
            uploadDate: new Date(),
            documentType: 'check-out'
          });
        }

        // Extrair os dados validados
        const extractedData = pairResult.reservationData;
        const validationResult = pairResult.validationResult;
        
        if (!validationResult) {
          console.error('Resultado de validação não disponível');
          return res.status(500).json({
            success: false,
            message: "Erro no processamento dos documentos",
            pairInfo: {
              isPairComplete: pairResult.isPairComplete,
              checkInPresent: !!pairResult.checkIn,
              checkOutPresent: !!pairResult.checkOut
            },
            errors: [...pairResult.errors, "Falha na validação dos dados extraídos"]
          });
        }
        
        // Encontrar a propriedade correspondente pelo nome
        const properties = await storage.getProperties();
        console.log(`Buscando correspondência para propriedade: ${extractedData?.propertyName}`);
        
        // Lógica de matching de propriedade
        let matchedProperty = null;
        
        if (extractedData && extractedData.propertyName) {
          // Primeiro tenta match exato (case insensitive)
          matchedProperty = properties.find(p => 
            p.name.toLowerCase() === extractedData.propertyName.toLowerCase()
          );
          
          // Se não encontrar, usa matching mais flexível
          if (!matchedProperty) {
            // Define uma função de similaridade
            const calculateSimilarity = (str1: string, str2: string): number => {
              const words1 = str1.toLowerCase().split(/\s+/);
              const words2 = str2.toLowerCase().split(/\s+/);
              const commonWords = words1.filter((word: string) => words2.includes(word));
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
        }
        
        // Se não encontrar propriedade, define valores padrão
        if (!matchedProperty) {
          matchedProperty = { id: null, cleaningCost: 0, checkInFee: 0, commission: 0, teamPayment: 0 };
          
          // Adicionar erro de validação se não encontrou a propriedade
          if (extractedData && extractedData.propertyName) {
            validationResult.errors.push({
              field: 'propertyName',
              message: 'Propriedade não encontrada no sistema',
              severity: 'warning'
            });
            
            if (!validationResult.warningFields) {
              validationResult.warningFields = [];
            }
            validationResult.warningFields.push('propertyName');
          }
        }

        // Calcular taxas e valores baseados na propriedade encontrada
        const totalAmount = extractedData?.totalAmount || 0;
        const platformFee = extractedData?.platformFee || (
          (extractedData?.platform === "airbnb" || extractedData?.platform === "booking") 
            ? Math.round(totalAmount * 0.1) 
            : 0
        );

        // Adicionar atividade ao sistema com tipo adequado (par ou único)
        const activityType = pairResult.isPairComplete ? 'pdf_pair_processed' : 'pdf_processed';
        const activityDescription = pairResult.isPairComplete ? 
          `Par de PDFs processado: ${extractedData?.propertyName || 'Propriedade desconhecida'} - ${extractedData?.guestName || 'Hóspede desconhecido'} (${validationResult.status})` :
          `PDF processado: ${extractedData?.propertyName || 'Propriedade desconhecida'} - ${extractedData?.guestName || 'Hóspede desconhecido'} (${validationResult.status})`;
        
        await storage.createActivity({
          activityType: activityType,
          description: activityDescription,
          resourceId: matchedProperty.id,
          resourceType: 'property'
        });

        // Criar resultados enriquecidos
        const enrichedData = {
          ...extractedData,
          propertyId: matchedProperty.id,
          platformFee: platformFee,
          cleaningFee: extractedData?.cleaningFee || Number(matchedProperty.cleaningCost || 0),
          checkInFee: extractedData?.checkInFee || Number(matchedProperty.checkInFee || 0),
          commission: extractedData?.commission || (totalAmount * Number(matchedProperty.commission || 0) / 100),
          teamPayment: extractedData?.teamPayment || Number(matchedProperty.teamPayment || 0)
        };

        // Definir uma mensagem adequada com base no tipo de processamento
        let processMessage = "";
        if (pairResult.isPairComplete) {
          processMessage = "Par de documentos processado com sucesso (check-in + check-out)";
        } else if (pairResult.checkIn) {
          processMessage = "Documento de check-in processado com sucesso, sem documento de check-out";
        } else if (pairResult.checkOut) {
          processMessage = "Documento de check-out processado com sucesso, sem documento de check-in";
        }
        
        // Retorna os dados extraídos com as informações da propriedade e status de validação
        res.json({
          success: true,
          message: processMessage,
          extractedData: enrichedData,
          validation: {
            status: validationResult.status,
            isValid: validationResult.isValid,
            errors: validationResult.errors,
            missingFields: validationResult.missingFields,
            warningFields: validationResult.warningFields
          },
          pairInfo: {
            isPairComplete: pairResult.isPairComplete,
            checkInPresent: !!pairResult.checkIn,
            checkOutPresent: !!pairResult.checkOut
          },
          files: fileInfo
        });
      } catch (processError) {
        console.error('Erro no processamento dos PDFs:', processError);
        // Retornar erro formatado
        return res.status(500).json({ 
          success: false,
          message: "Falha ao processar PDFs", 
          error: processError instanceof Error ? processError.message : "Erro desconhecido no processamento"
        });
      }
    } catch (err) {
      console.error('Erro ao processar upload de PDFs:', err);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor",
        error: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });

  // Função auxiliar para extrair texto de um PDF usando a API Gemini
  async function extractTextFromPDFWithGemini(pdfBase64: string): Promise<string> {
    try {
      // Usar o adaptador de serviço AI
      return await aiService.extractTextFromPDF(pdfBase64);
    } catch (error: any) {
      console.error("Erro ao extrair texto do PDF com Gemini:", error);
      throw new Error(`Falha na extração de texto: ${error.message}`);
    }
  }

  // Função auxiliar para analisar texto extraído e extrair informações estruturadas sobre a reserva
  async function parseReservationDataWithGemini(extractedText: string): Promise<any> {
    try {
      // Usar o adaptador de serviço AI
      return await aiService.parseReservationData(extractedText);
    } catch (error: any) {
      console.error("Erro ao analisar dados da reserva com Gemini:", error);
      throw new Error(`Falha na extração de dados estruturados: ${error.message}`);
    }
  }

  // Other utility endpoints
  app.get("/api/enums", (_req: Request, res: Response) => {
    // Return enum values for frontend select components
    res.json({
      reservationStatus: reservationStatusEnum.options,
      reservationPlatform: reservationPlatformEnum.options,
    });
  });

  // Checar se a chave API Gemini está configurada 
  app.get("/api/check-gemini-key", (_req: Request, res: Response) => {
    try {
      const hasGeminiKey = hasGeminiApiKey();
      res.json({ available: hasGeminiKey });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Verificar se a chave API OpenRouter está configurada para o Mistral
  app.get("/api/check-mistral-key", (_req: Request, res: Response) => {
    try {
      // Verificar a presença da variável de ambiente OPENROUTER_API_KEY
      const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
      
      // Verificar também a disponibilidade do Gemini como fallback
      const hasGeminiKey = hasGeminiApiKey();
      
      res.json({ 
        available: hasOpenRouterKey,
        fallbackAvailable: hasGeminiKey,
        primaryService: hasOpenRouterKey ? 'mistral' : (hasGeminiKey ? 'gemini' : null)
      });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  /**
   * Endpoint para configurar a chave da API OpenRouter
   * Salva a chave em uma variável de ambiente e inicializa o serviço
   */
  app.post("/api/configure-openrouter-key", async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: "Chave API não fornecida"
        });
      }
      
      // Definir a chave na variável de ambiente
      process.env.OPENROUTER_API_KEY = apiKey;
      
      // Reinicializar o serviço de IA para usar a nova chave
      await aiService.setApiKey('openrouter', apiKey);
      
      console.log("✅ Chave API OpenRouter configurada com sucesso");
      
      // Testar a chave realizando uma solicitação simples
      const testResult = await aiService.testOpenRouterConnection();
      
      if (testResult.success) {
        return res.json({
          success: true,
          message: "Chave API OpenRouter configurada e testada com sucesso",
          models: testResult.models || []
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Chave API OpenRouter configurada, mas o teste falhou",
          error: testResult.error
        });
      }
    } catch (err) {
      handleError(err, res);
    }
  });
  
  /**
   * Endpoint para verificar a disponibilidade da chave da API Gemini
   * Já implementado acima com a função hasGeminiApiKey()
   */
  
  /**
   * Endpoint para configurar a chave da API Gemini
   * Salva a chave em uma variável de ambiente e inicializa o serviço Gemini
   */
  app.post("/api/configure-gemini-key", async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: "Chave de API inválida"
        });
      }
      
      // Salvar a chave na variável de ambiente
      process.env.GOOGLE_GEMINI_API_KEY = apiKey.trim();
      
      // Testar a chave para garantir que funciona
      try {
        // Configurar o serviço Gemini com a nova chave API
        aiService.geminiService.initializeWithKey(apiKey.trim());
        
        // Verificar se o serviço está disponível após configuração
        const hasGeminiKey = process.env.GOOGLE_GEMINI_API_KEY !== undefined && 
                            process.env.GOOGLE_GEMINI_API_KEY !== '';
                            
        return res.json({ 
          success: true, 
          message: "Chave da API Gemini configurada com sucesso",
          available: hasGeminiKey
        });
      } catch (error) {
        console.error("Erro ao testar a chave da API Gemini:", error);
        return res.status(400).json({ 
          success: false, 
          message: "A chave da API Gemini parece ser inválida"
        });
      }
    } catch (err) {
      handleError(err, res);
    }
  });
  
  /**
   * Endpoint para verificar as chaves de API de IA disponíveis
   * Retorna informações sobre os serviços disponíveis (Google Gemini)
   */
  app.get("/api/check-ai-services", async (_req: Request, res: Response) => {
    try {
      // Importar o adaptador de IA para verificar o serviço atual
      let currentService = "unavailable";
      
      try {
        // Usar import dinâmico para evitar problemas de require
        const { aiService } = await import('./services/ai-adapter.service');
        currentService = aiService.getCurrentService();
      } catch (error) {
        console.error("Erro ao carregar o adaptador de IA:", error);
      }
      
      const hasGeminiKey = process.env.GOOGLE_GEMINI_API_KEY !== undefined && 
                          process.env.GOOGLE_GEMINI_API_KEY !== '' || process.env.GOOGLE_API_KEY !== '';
      
      // Verificar ambas as variáveis de ambiente possíveis para a API do Gemini
      const hasGeminiKeyForUpload = (process.env.GOOGLE_GEMINI_API_KEY !== undefined && 
                           process.env.GOOGLE_GEMINI_API_KEY !== '') || 
                          (process.env.GOOGLE_API_KEY !== undefined && 
                           process.env.GOOGLE_API_KEY !== '');
      
      // Verificar se OpenRouter está disponível (Mistral OCR)
      const hasOpenRouterKey = process.env.OPENROUTER_API_KEY !== undefined && process.env.OPENROUTER_API_KEY !== '';
      
      // Verificar se RolmOCR está disponível
      const hasRolmKey = process.env.HF_TOKEN !== undefined && process.env.HF_TOKEN !== '';
      
      return res.json({
        success: true,
        services: {
          mistral: { 
            available: hasOpenRouterKey,
            keyConfigured: hasOpenRouterKey,
            deprecated: false // Mistral agora é o serviço primário para OCR
          },
          rolm: {
            available: hasRolmKey,
            keyConfigured: hasRolmKey,
            handwriting: true // RolmOCR é especialista em manuscritos
          },
          gemini: {
            available: hasGeminiKey,
            keyConfigured: hasGeminiKey,
            analysisOnly: true // Gemini é apenas para análise de BD
          }
        },
        currentService,
        anyServiceAvailable: hasOpenRouterKey || hasRolmKey || hasGeminiKey
      });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  /**
   * Endpoint para definir qual serviço de IA usar
   * Permite configurar o serviço Gemini
   */
  app.post("/api/set-ai-service", async (req: Request, res: Response) => {
    try {
      const { service } = req.body;
      
      if (!service || !["mistral", "gemini", "auto"].includes(service)) {
        return res.status(400).json({
          success: false,
          message: "Serviço inválido. Opções válidas: mistral, gemini, auto"
        });
      }
      
      try {
        const { aiService, AIServiceType } = await import('./services/ai-adapter.service');
        
        // Mapear string para enum (apenas Gemini é suportado)
        const serviceTypeMap: Record<string, any> = {
          "gemini": AIServiceType.GEMINI
        };
        
        // Se for qualquer outro serviço, usar Gemini
        if (service !== "gemini") {
          console.log(`Serviço ${service} não é suportado, usando Gemini apenas`);
          const newService = "gemini";
          aiService.setService(serviceTypeMap[newService]);
          return res.json({
            success: true,
            message: `Serviço configurado para usar Gemini.`,
            currentService: aiService.getCurrentService()
          });
        }
        
        aiService.setService(serviceTypeMap[service]);
        
        return res.json({
          success: true,
          message: `Serviço alterado para ${service}`,
          currentService: aiService.getCurrentService()
        });
      } catch (error) {
        console.error("Erro ao alterar serviço de IA:", error);
        return res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Erro desconhecido ao alterar serviço"
        });
      }
    } catch (err) {
      handleError(err, res);
    }
  });

  /**
   * Endpoint para analisar um documento em formato desconhecido
   * Usa recursos avançados do Gemini para reconhecer novos layouts
   */
  app.post("/api/learn-document-format", anyFileUpload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando aprendizado de novo formato de documento...');
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado" 
        });
      }
      
      // Verificar se temos a chave API do Gemini
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Esta funcionalidade requer a API Gemini configurada" 
        });
      }
      
      // Extrair campos a serem analisados do corpo da requisição
      const { fields } = req.body;
      
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "É necessário especificar pelo menos um campo para extrair"
        });
      }
      
      try {
        // Importar o adaptador de IA
        const { aiService } = await import('./services/ai-adapter.service');
        
        // Ler o arquivo
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileBase64 = fileBuffer.toString('base64');
        
        // Usar a função de aprendizado de novos formatos
        const result = await aiService.learnNewDocumentFormat(
          fileBase64,
          req.file.mimetype,
          fields
        );
        
        // Adicionar atividade ao sistema
        await storage.createActivity({
          activityType: 'document_format_learned',
          description: `Novo formato de documento analisado: ${req.file.originalname} (${fields.length} campos)`,
          resourceId: null,
          resourceType: 'system'
        });
        
        return res.json({
          success: result.success,
          data: result.extractedData,
          message: result.success ? 
            "Documento analisado com sucesso" : 
            "Falha ao analisar o documento",
          fields: fields,
          file: {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype
          }
        });
      } catch (error: any) {
        console.error('Erro no aprendizado de formato:', error);
        return res.status(500).json({
          success: false,
          message: "Falha ao processar novo formato de documento",
          error: error.message
        });
      }
    } catch (err) {
      handleError(err, res);
    }
  });
  
  /**
   * Endpoint para testar o adaptador de IA
   * Permite avaliar qual serviço está em uso e testar sua funcionalidade básica
   */
  app.get("/api/test-ai-adapter", async (_req: Request, res: Response) => {
    try {
      const { aiService, AIServiceType } = await import('./services/ai-adapter.service');
      
      // Verificar qual serviço está sendo usado atualmente
      const currentService = aiService.getCurrentService();
      
      // Testar a capacidade de análise de texto simples
      const sampleText = `
        Confirmação de Reserva - Booking.com
        
        Propriedade: Apartamento Graça
        Hóspede: João Silva
        Email: joao.silva@email.com
        Check-in: 15-04-2025
        Check-out: 20-04-2025
        Número de hóspedes: 2
        Valor total: 450,00 €
      `;
      
      let parseResult;
      try {
        parseResult = await aiService.parseReservationData(sampleText);
      } catch (error: any) {
        parseResult = { error: error.message || "Erro desconhecido" };
      }
      
      // Verificar disponibilidade de chaves
      const hasGeminiKey = process.env.GOOGLE_GEMINI_API_KEY !== undefined && 
                            process.env.GOOGLE_GEMINI_API_KEY !== '' || process.env.GOOGLE_API_KEY !== '';
      
      const hasGeminiKeyForProcess = (process.env.GOOGLE_GEMINI_API_KEY !== undefined && 
                            process.env.GOOGLE_GEMINI_API_KEY !== '') || 
                           (process.env.GOOGLE_API_KEY !== undefined && 
                            process.env.GOOGLE_API_KEY !== '');
      
      return res.json({
        success: true,
        currentService,
        serviceAvailability: {
          mistral: hasGeminiKey,
          gemini: hasGeminiKey
        },
        parseResult
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Erro ao testar adaptador de IA"
      });
    }
  });

  // Endpoint para testar todas as integrações (RAG, OCR, DB, AI Services)
  app.get("/api/test-integrations", async (req: Request, res: Response) => {
    try {
      const tests = [];

      // Teste 1: Verificar acesso ao banco de dados
      try {
        const properties = await storage.getProperties();
        const owners = await storage.getOwners();
        const reservations = await storage.getReservations();

        tests.push({
          name: "Base de Dados",
          success: true,
          details: {
            properties: properties.length,
            owners: owners.length,
            reservations: reservations.length
          }
        });
      } catch (error: any) {
        tests.push({
          name: "Base de Dados",
          success: false,
          error: error.message || "Erro ao acessar base de dados"
        });
      }
      
      // Teste 2: Verificar adaptador AI e serviços disponíveis
      try {
        // Importar o adaptador de IA
        let currentService = "unavailable";
        let servicesAvailable = [];
        
        try {
          const { aiService } = await import('./services/ai-adapter.service');
          currentService = aiService.getCurrentService();
          
          // Verificar quais serviços estão disponíveis
          const hasGeminiKey = process.env.GOOGLE_GEMINI_API_KEY !== undefined && 
                              process.env.GOOGLE_GEMINI_API_KEY !== '' || process.env.GOOGLE_API_KEY !== '';
                              
          const hasGeminiKeyForExtraction = (process.env.GOOGLE_GEMINI_API_KEY !== undefined && 
                              process.env.GOOGLE_GEMINI_API_KEY !== '') || 
                             (process.env.GOOGLE_API_KEY !== undefined && 
                              process.env.GOOGLE_API_KEY !== '');
          
          if (hasGeminiKey) servicesAvailable.push("mistral");
          if (hasGeminiKey) servicesAvailable.push("gemini");
          
          tests.push({
            name: "Adaptador de IA",
            success: servicesAvailable.length > 0,
            details: {
              currentService,
              servicesAvailable,
              anyServiceAvailable: servicesAvailable.length > 0
            }
          });
        } catch (adapterError: any) {
          tests.push({
            name: "Adaptador de IA",
            success: false,
            error: adapterError.message || "Erro ao inicializar adaptador de IA"
          });
        }
      } catch (error: any) {
        tests.push({
          name: "Adaptador de IA",
          success: false,
          error: error.message || "Erro ao testar adaptador de IA"
        });
      }

      // Teste 3: Verificar API Gemini
      try {
        const hasGeminiKey = (process.env.GOOGLE_GEMINI_API_KEY !== undefined && 
                            process.env.GOOGLE_GEMINI_API_KEY !== '') || 
                            (process.env.GOOGLE_API_KEY !== undefined && 
                            process.env.GOOGLE_API_KEY !== '');

        if (!hasGeminiKey) {
          tests.push({
            name: "Google Gemini API",
            success: false,
            error: "Chave API Gemini não encontrada"
          });
        } else {
          // Tentar importar e testar o serviço Gemini
          try {
            const { GeminiService } = await import('./services/gemini.service');
            const geminiService = new GeminiService();
            // Usar checkApiConnection em vez de isConfigured para testar ativamente a conexão
            const isConnected = await geminiService.checkApiConnection();
            
            if (!isConnected) {
              tests.push({
                name: "Google Gemini API",
                success: false,
                error: "Falha na conexão com a API do Gemini."
              });
            } else {
              // API está conectada
              tests.push({
                name: "Google Gemini API",
                success: true,
                details: {
                  modelType: "Gemini Pro 1.5",
                  connected: true,
                  visionCapable: true,
                  textCapable: true
                }
              });
            }
          } catch (geminiError: any) {
            tests.push({
              name: "Google Gemini API",
              success: false,
              error: geminiError.message || "Erro ao conectar com API Gemini"
            });
          }
        }
      } catch (error: any) {
        tests.push({
          name: "Google Gemini API",
          success: false,
          error: error.message || "Erro ao testar API Gemini"
        });
      }

      // Teste 3: Verificar sistema RAG (Retrieval Augmented Generation)
      try {
        // Importar função para construir contexto RAG
        const { buildRagContext } = await import('./api/maria-assistant');
        const ragContext = await buildRagContext("teste de estatísticas e propriedades");
        
        // Se chegou até aqui, o teste foi bem-sucedido
        tests.push({
          name: "RAG (Retrieval Augmented Generation)",
          success: true,
          details: {
            contextBuilt: true,
            contextLength: ragContext ? ragContext.length : 0
          }
        });
      } catch (error: any) {
        console.error("Error building RAG context:", error);
        tests.push({
          name: "RAG (Retrieval Augmented Generation)",
          success: false,
          error: error.message || "Erro ao testar sistema RAG"
        });
      }


      // Teste 4: Verificar funcionalidade OCR
      try {
        tests.push({
          name: "OCR (Processamento de PDFs)",
          success: true,
          details: {
            initialized: true,
            message: "Sistema OCR pronto para processar documentos"
          }
        });
      } catch (error: any) {
        tests.push({
          name: "OCR (Processamento de PDFs)",
          success: false,
          error: error.message || "Erro ao verificar sistema OCR"
        });
      }

      return res.json({
        success: tests.every(test => test.success),
        timestamp: new Date().toISOString(),
        tests
      });

    } catch (error: any) {
      console.error("Erro ao testar integrações:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Erro desconhecido ao testar integrações"
      });
    }
  });

  // Rota para processar mensagens com o Google Gemini AI
  app.post("/api/assistant", async (req: Request, res: Response) => {
    try {
      // Importação dinâmica para resolver problema de ciclo de dependência
      const { mariaAssistant } = await import('./api/maria-assistant');
      return mariaAssistant(req, res);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * Endpoint para processamento de documentos financeiros
   * Suporta faturas, recibos e outros documentos financeiros
   */
  app.post("/api/process-financial-document", anyFileUpload.single('document'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado" 
        });
      }

      // Verifica se a chave da API Gemini está disponível
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(400).json({ 
          success: false,
          message: "Chave da API Gemini não configurada. Configure a chave nas definições." 
        });
      }

      // Validar tipo de arquivo
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(req.file.mimetype)) {
        if (req.file.path) {
          try {
            await fs.promises.unlink(req.file.path);
          } catch (unlinkError) {
            console.error("Erro ao remover arquivo temporário:", unlinkError);
          }
        }
        
        return res.status(400).json({
          success: false,
          message: "Tipo de arquivo não suportado. Envie um PDF ou imagem (JPEG, PNG)."
        });
      }

      // Dados adicionais do formulário
      const docType = req.body.documentType || 'invoice'; // 'invoice', 'receipt', 'expense'
      const entityType = req.body.entityType || null; // 'owner', 'supplier'
      const entityId = req.body.entityId ? parseInt(req.body.entityId) : null;
      
      try {
        // Registrar atividade
        await storage.createActivity({
          activityType: 'financial_document_upload',
          description: `Upload de documento financeiro: ${req.file.originalname} (${docType})`,
          resourceType: entityType,
          resourceId: entityId
        });

        // Ler conteúdo do arquivo
        const filePath = req.file.path;
        const fileBuffer = await fs.promises.readFile(filePath);
        const fileBase64 = fileBuffer.toString('base64');
        
        // Processar documento usando o adaptador de IA
        console.log(`Processando documento financeiro: ${req.file.originalname} (${req.file.mimetype})`);
        
        // Importar o adaptador de IA
        const { aiService } = await import('./services/ai-adapter.service');
        
        // Extrair texto do documento
        let extractedText = '';
        if (req.file.mimetype.includes('pdf')) {
          extractedText = await aiService.extractTextFromPDF(fileBase64);
        } else if (req.file.mimetype.includes('image')) {
          extractedText = await aiService.extractTextFromImage(fileBase64, req.file.mimetype);
        }
        
        if (!extractedText || extractedText.length < 50) {
          return res.status(400).json({
            success: false,
            message: "Não foi possível extrair texto suficiente do documento."
          });
        }
        
        // Adicionar o texto extraído à base de conhecimento RAG
        await ragService.addToKnowledgeBase(extractedText, 'financial_document', {
          filename: req.file.filename,
          mimeType: req.file.mimetype,
          uploadDate: new Date(),
          documentType: docType
        });
        
        // Analisar o documento para extração de dados estruturados
        // Usamos uma função personalizada para cada tipo de documento financeiro
        const extractionPrompt = `
          Você é um assistente especializado em extrair dados de documentos financeiros do tipo ${docType}.
          Analise o documento a seguir e extraia todos os detalhes relevantes em formato JSON.
          
          Extraia os seguintes campos:
          - issuerName: Nome da empresa/pessoa que emitiu o documento
          - issuerTaxId: Número de identificação fiscal do emissor (NIF, CNPJ, etc.)
          - recipientName: Nome do destinatário
          - recipientTaxId: Número de identificação fiscal do destinatário
          - documentNumber: Número do documento/fatura
          - issueDate: Data de emissão no formato YYYY-MM-DD
          - dueDate: Data de vencimento no formato YYYY-MM-DD (se aplicável)
          - totalAmount: Valor total (apenas o número)
          - currency: Moeda (EUR, USD, etc.)
          - items: Array de itens, cada um com description, quantity, unitPrice, totalPrice
          - taxes: Informações sobre impostos (IVA, taxa, etc.)
          - paymentMethod: Método de pagamento mencionado
          - status: Estado do documento (emitido, pago, vencido, etc.)
          
          Para valores monetários, extraia apenas os números, sem símbolos de moeda.
          Para campos não encontrados no documento, use null.
        `;
        
        // Usar o adaptador de IA para processamento de texto
        const result = await aiService.extractDataFromText(extractedText, {
          systemPrompt: "Você é um assistente especializado em extração de dados de documentos financeiros.",
          responseFormat: { type: "json_object" },
          temperature: 0.1,
          documentType: docType,
          extractFields: [
            'issuerName', 'issuerTaxId', 'recipientName', 'recipientTaxId',
            'documentNumber', 'issueDate', 'dueDate', 'totalAmount',
            'currency', 'items', 'taxes', 'paymentMethod', 'status'
          ]
        });
        
        const content = result.choices?.[0]?.message?.content;
        let extractedData = {};
        
        try {
          if (content && typeof content === 'string') {
            extractedData = JSON.parse(content);
          }
        } catch (parseError) {
          console.error("Erro ao processar JSON da resposta:", parseError);
        }
        
        // Retornar os dados extraídos
        return res.status(200).json({
          success: true,
          message: "Documento financeiro processado com sucesso",
          documentType: docType,
          file: {
            filename: req.file.filename,
            path: req.file.path,
            mimeType: req.file.mimetype
          },
          extractedText: extractedText.substring(0, 500) + '...', // Primeira parte do texto extraído
          extractedData,
          entityInfo: {
            entityType,
            entityId
          }
        });
        
      } catch (processingError: any) {
        console.error("Erro no processamento do documento financeiro:", processingError);
        
        // Limpar arquivo em caso de erro
        if (req.file && req.file.path) {
          try {
            await fs.promises.unlink(req.file.path);
          } catch (unlinkError) {
            console.error("Erro ao remover arquivo temporário:", unlinkError);
          }
        }
        
        return res.status(500).json({ 
          success: false,
          message: processingError.message || "Erro desconhecido no processamento do documento financeiro"
        });
      }
    } catch (err) {
      console.error("Erro geral no endpoint de processamento de documentos financeiros:", err);
      handleError(err, res);
    }
  });
  
  /**
   * Endpoint para validação de documento financeiro
   * Verifica a consistência e corretude dos dados extraídos
   */
  app.post("/api/validate-financial-document", async (req: Request, res: Response) => {
    try {
      const { documentData, documentType, originalText } = req.body;
      
      if (!documentData || !documentType) {
        return res.status(400).json({
          success: false,
          message: "Dados incompletos para validação. Forneça documentData e documentType."
        });
      }
      
      // Verificar se a chave da API Gemini está disponível
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(400).json({ 
          success: false,
          message: "Chave da API Gemini não configurada. Configure a chave nas definições." 
        });
      }
      
      // Construir prompt de validação específico para o tipo de documento
      let validationPrompt = "";
      
      if (documentType === 'invoice') {
        validationPrompt = `
          Você é um auditor financeiro especializado em validação de faturas.
          Verifique os seguintes aspectos da fatura:
          1. Consistência matemática: o total corresponde à soma dos itens + impostos?
          2. Dados essenciais: possui emissor, destinatário, data, número e valor total?
          3. Formatação de datas: estão no formato correto YYYY-MM-DD?
          4. Formatação de valores: são números sem símbolos de moeda?
          5. Existem inconsistências nos dados extraídos?
          
          Dados extraídos:
          ${JSON.stringify(documentData, null, 2)}
          
          ${originalText ? `Texto original do documento (para referência):
          ${originalText.substring(0, 1000)}...` : ''}
        `;
      } else if (documentType === 'receipt') {
        validationPrompt = `
          Você é um auditor financeiro especializado em validação de recibos.
          Verifique os seguintes aspectos do recibo:
          1. Consistência dos valores: o total está correto?
          2. Dados essenciais: possui emissor, data, e valor total?
          3. Formatação de datas: estão no formato correto YYYY-MM-DD?
          4. Formatação de valores: são números sem símbolos de moeda?
          5. Existem inconsistências nos dados extraídos?
          
          Dados extraídos:
          ${JSON.stringify(documentData, null, 2)}
          
          ${originalText ? `Texto original do documento (para referência):
          ${originalText.substring(0, 1000)}...` : ''}
        `;
      } else {
        validationPrompt = `
          Você é um auditor financeiro especializado em validação de documentos financeiros.
          Verifique os seguintes aspectos deste documento do tipo ${documentType}:
          1. Consistência dos valores: o total está correto?
          2. Dados essenciais: possui todas as informações necessárias?
          3. Formatação de datas: estão no formato correto YYYY-MM-DD?
          4. Formatação de valores: são números sem símbolos de moeda?
          5. Existem inconsistências nos dados extraídos?
          
          Dados extraídos:
          ${JSON.stringify(documentData, null, 2)}
          
          ${originalText ? `Texto original do documento (para referência):
          ${originalText.substring(0, 1000)}...` : ''}
        `;
      }
      
      // Importar o adaptador de IA
      const { aiService } = await import('./services/ai-adapter.service');
      
      // Usar o adaptador de IA para extrair dados do texto
      const result = await aiService.extractDataFromText(validationPrompt, {
        systemPrompt: "Você é um auditor financeiro especializado.",
        responseFormat: { type: "json_object" },
        temperature: 0.1,
        documentType: documentType
      });
      
      const content = result.choices?.[0]?.message?.content;
      let validationResult = {
        isValid: false,
        issues: [],
        suggestions: [],
        correctedData: null
      };
      
      try {
        if (content && typeof content === 'string') {
          validationResult = JSON.parse(content);
        }
      } catch (parseError) {
        console.error("Erro ao processar JSON da resposta de validação:", parseError);
        return res.status(500).json({
          success: false,
          message: "Erro ao processar resposta de validação"
        });
      }
      
      return res.status(200).json({
        success: true,
        validation: validationResult
      });
      
    } catch (err) {
      console.error("Erro na validação de documento financeiro:", err);
      handleError(err, res);
    }
  });

  // ===== ENDPOINTS PARA DOCUMENTOS FINANCEIROS =====

  // Listar documentos financeiros com opção de filtros
  app.get("/api/financial-documents", async (req: Request, res: Response) => {
    try {
      const options: any = {};

      if (req.query.type) options.type = req.query.type as string;
      if (req.query.status) options.status = req.query.status as string;
      if (req.query.entityId) options.entityId = Number(req.query.entityId);
      if (req.query.entityType) options.entityType = req.query.entityType as string;
      if (req.query.startDate) options.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) options.endDate = new Date(req.query.endDate as string);

      const documents = await storage.getFinancialDocuments(options);
      res.json(documents);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Obter um documento financeiro específico pelo ID
  app.get("/api/financial-documents/:id", async (req: Request, res: Response) => {
    try {
      const document = await storage.getFinancialDocument(Number(req.params.id));

      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      // Obter itens relacionados ao documento
      const items = await storage.getFinancialDocumentItems(document.id);

      // Obter pagamentos relacionados ao documento
      const payments = await storage.getPaymentRecords(document.id);

      // Combinar tudo em uma resposta completa
      res.json({
        document,
        items,
        payments
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Criar um novo documento financeiro
  app.post("/api/financial-documents", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFinancialDocumentSchema.parse(req.body);
      const document = await storage.createFinancialDocument(validatedData);

      // Se houver itens no corpo da requisição, criar também os itens
      if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
        for (const item of req.body.items) {
          item.documentId = document.id;
          await storage.createFinancialDocumentItem(insertFinancialDocumentItemSchema.parse(item));
        }
      }

      res.status(201).json(document);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Atualizar um documento financeiro existente
  app.patch("/api/financial-documents/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingDocument = await storage.getFinancialDocument(id);

      if (!existingDocument) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };
      const updatedDocument = await storage.updateFinancialDocument(id, validatedData);

      res.json(updatedDocument);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Excluir um documento financeiro
  app.delete("/api/financial-documents/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      // Primeiro verificar se o documento existe
      const document = await storage.getFinancialDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      // Excluir os itens relacionados primeiro (para evitar problemas de chave estrangeira)
      const items = await storage.getFinancialDocumentItems(id);
      for (const item of items) {
        await storage.deleteFinancialDocumentItem(item.id);
      }

      // Excluir os pagamentos relacionados
      const payments = await storage.getPaymentRecords(id);
      for (const payment of payments) {
        await storage.deletePaymentRecord(payment.id);
      }

      // Finalmente, excluir o documento
      const result = await storage.deleteFinancialDocument(id);

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== ENDPOINTS PARA ITENS DE DOCUMENTOS FINANCEIROS =====

  // Listar itens de um documento financeiro
  app.get("/api/financial-document-items/:documentId", async (req: Request, res: Response) => {
    try {
      const documentId = Number(req.params.documentId);

      // Verificar se o documento existe
      const document = await storage.getFinancialDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      const items = await storage.getFinancialDocumentItems(documentId);
      res.json(items);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Obter um item específico pelo ID
  app.get("/api/financial-document-items/item/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getFinancialDocumentItem(id);

      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      res.json(item);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Criar um novo item em um documento financeiro
  app.post("/api/financial-document-items", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFinancialDocumentItemSchema.parse(req.body);

      // Verificar se o documento existe
      const document = await storage.getFinancialDocument(validatedData.documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      const item = await storage.createFinancialDocumentItem(validatedData);

      // Atualizar o valor total do documento somando todos os itens
      const allItems = await storage.getFinancialDocumentItems(document.id);
      const totalAmount = allItems.reduce((sum, item) => sum + parseFloat(item.amount), 0).toString();
      await storage.updateFinancialDocument(document.id, { totalAmount });

      res.status(201).json(item);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Atualizar um item de documento financeiro
  app.patch("/api/financial-document-items/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingItem = await storage.getFinancialDocumentItem(id);

      if (!existingItem) {
        return res.status(404).json({ message: "Item de documento não encontrado" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };
      const updatedItem = await storage.updateFinancialDocumentItem(id, validatedData);

      // Se o valor foi alterado, atualizar o total do documento
      if (validatedData.amount) {
        const document = await storage.getFinancialDocument(existingItem.documentId);
        if (document) {
          const allItems = await storage.getFinancialDocumentItems(document.id);
          const totalAmount = allItems.reduce((sum, item) => sum + parseFloat(item.amount), 0).toString();
          await storage.updateFinancialDocument(document.id, { totalAmount });
        }
      }

      res.json(updatedItem);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Excluir um item de documento financeiro
  app.delete("/api/financial-document-items/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getFinancialDocumentItem(id);

      if (!item) {
        return res.status(404).json({ message: "Item de documento não encontrado" });
      }

      const documentId = item.documentId;
      const result = await storage.deleteFinancialDocumentItem(id);

      // Atualizar o valor total do documento
      const document = await storage.getFinancialDocument(documentId);
      if (document) {
        const allItems = await storage.getFinancialDocumentItems(documentId);
        const totalAmount = allItems.reduce((sum, item) => sum + parseFloat(item.amount), 0).toString();
        await storage.updateFinancialDocument(documentId, { totalAmount });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== ENDPOINTS PARA REGISTROS DE PAGAMENTO =====

  // Listar pagamentos (opcionalmente filtrados por documento)
  app.get("/api/payment-records", async (req: Request, res: Response) => {
    try {
      let documentId: number | undefined = undefined;

      if (req.query.documentId) {
        documentId = Number(req.query.documentId);
      }

      const payments = await storage.getPaymentRecords(documentId);
      res.json(payments);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Obter um pagamento específico pelo ID
  app.get("/api/payment-records/:id", async (req: Request, res: Response) => {
    try {
      const payment = await storage.getPaymentRecord(Number(req.params.id));

      if (!payment) {
        return res.status(404).json({ message: "Registro de pagamento não encontrado" });
      }

      res.json(payment);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Criar um novo registro de pagamento
  app.post("/api/payment-records", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPaymentRecordSchema.parse(req.body);

      // Verificar se o documento existe
      const document = await storage.getFinancialDocument(validatedData.documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      const payment = await storage.createPaymentRecord(validatedData);

      // Atualizar o status e valor pago do documento
      const allPayments = await storage.getPaymentRecords(document.id);
      const paidAmount = allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toString();

      // Verificar se o valor pago cobre o valor total do documento
      let status = document.status;
      if (parseFloat(paidAmount) >= parseFloat(document.totalAmount)) {
        status = "paid"; // Documento totalmente pago
      } else if (parseFloat(paidAmount) > 0) {
        status = "invoiced"; // Parcialmente pago
      }

      await storage.updateFinancialDocument(document.id, { 
        status, 
        paidAmount 
      });

      res.status(201).json(payment);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Atualizar um registro de pagamento
  app.patch("/api/payment-records/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingPayment = await storage.getPaymentRecord(id);

      if (!existingPayment) {
        return res.status(404).json({ message: "Registro de pagamento não encontrado" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };
      const updatedPayment = await storage.updatePaymentRecord(id, validatedData);

      // Se o valor foi alterado, atualizar o status do documento
      if (validatedData.amount) {
        const document = await storage.getFinancialDocument(existingPayment.documentId);
        if (document) {
          const allPayments = await storage.getPaymentRecords(document.id);
          const paidAmount = allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toString();

          // Atualizar status baseado no valor pago
          let status = document.status;
          if (parseFloat(paidAmount) >= parseFloat(document.totalAmount)) {
            status = "paid"; // Documento totalmente pago
          } else if (parseFloat(paidAmount) > 0) {
            status = "invoiced"; // Parcialmente pago
          } else {
            status = "pending"; // Pendente de pagamento
          }

          await storage.updateFinancialDocument(document.id, { 
            status, 
            paidAmount 
          });
        }
      }

      res.json(updatedPayment);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Excluir um registro de pagamento
  app.delete("/api/payment-records/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const payment = await storage.getPaymentRecord(id);

      if (!payment) {
        return res.status(404).json({ message: "Registro de pagamento não encontrado" });
      }

      const documentId = payment.documentId;
      const result = await storage.deletePaymentRecord(id);

      // Atualizar o status e valor pago do documento
      const document = await storage.getFinancialDocument(documentId);
      if (document) {
        const allPayments = await storage.getPaymentRecords(documentId);
        const paidAmount = allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toString();

        // Atualizar status baseado no valor pago
        let status = document.status;
        if (parseFloat(paidAmount) >= parseFloat(document.totalAmount)) {
          status = "paid"; // Documento totalmente pago
        } else if (parseFloat(paidAmount) > 0) {
          status = "invoiced"; // Parcialmente pago
        } else {
          status = "pending"; // Pendente de pagamento
        }

        await storage.updateFinancialDocument(document.id, { 
          status, 
          paidAmount 
        });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== ENDPOINTS PARA RELATÓRIOS FINANCEIROS =====

  // Obter relatório financeiro de proprietário
  /**
   * Endpoint para geração de relatório financeiro por proprietário
   * Suporta diferentes formatos de data e filtragem por período
   */
  /**
   * Endpoint para enviar relatório mensal por email
   * Envia o relatório do proprietário em formato PDF para o email registrado
   */
  app.post("/api/reports/owner/send-email", async (req: Request, res: Response) => {
    try {
      const { ownerId, month, year, email } = req.body;
      
      if (!ownerId || !month || !year) {
        return res.status(400).json({
          success: false,
          message: "Dados incompletos. Informe proprietário, mês e ano"
        });
      }
      
      // Verificar se o proprietário existe
      const owner = await storage.getOwner(Number(ownerId));
      if (!owner) {
        return res.status(404).json({ 
          success: false, 
          message: "Proprietário não encontrado" 
        });
      }
      
      // Usar o email do proprietário se não for fornecido um email específico
      const targetEmail = email || owner.email;
      
      if (!targetEmail) {
        return res.status(400).json({
          success: false,
          message: "Email não disponível. Forneça um email ou atualize o email do proprietário"
        });
      }
      
      // Gerar o relatório
      const report = await storage.generateOwnerFinancialReport(Number(ownerId), month, year);
      
      // Formatação da data para exibição adequada em pt-BR
      const reportDate = new Date(parseInt(year), parseInt(month) - 1);
      const monthName = format(reportDate, 'MMMM yyyy', { locale: require('date-fns/locale/pt-BR') });
      
      // Importar o serviço de email
      const { emailService } = await import('./services/email.service');
      
      // Verificar se o serviço de email está configurado
      const emailConfigured = await emailService.isEmailServiceAvailable();
      
      let emailSent = false;
      
      if (emailConfigured) {
        try {
          // Gerar PDF do relatório para anexar ao email
          const { jsPDF } = await import('jspdf');
          const { autoTable } = await import('jspdf-autotable');
          
          const doc = new jsPDF();
          
          // Adicionar cabeçalho
          doc.setFontSize(20);
          doc.text('Maria Faz - Gestão de Propriedades', 105, 15, { align: 'center' });
          doc.setFontSize(16);
          doc.text(`Relatório Financeiro - ${monthName}`, 105, 25, { align: 'center' });
          doc.setFontSize(12);
          doc.text(`Proprietário: ${owner.name}`, 105, 35, { align: 'center' });
          
          // Adicionar resumo
          doc.setFontSize(14);
          doc.text('Resumo Financeiro', 14, 45);
          
          // Dados do relatório
          const propertyData = report.properties.map((property: any) => [
            property.name,
            `${property.occupancyRate}%`,
            `€${property.revenue.toFixed(2)}`,
            `€${property.expenses.toFixed(2)}`,
            `€${property.profit.toFixed(2)}`
          ]);
          
          // Tabela de propriedades
          autoTable(doc, {
            startY: 50,
            head: [['Propriedade', 'Ocupação', 'Receita', 'Despesas', 'Lucro']],
            body: propertyData,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }
          });
          
          // Adicionar totais
          const finalY = (doc as any).lastAutoTable.finalY || 120;
          doc.setFontSize(14);
          doc.text('Total do Período', 14, finalY + 10);
          
          autoTable(doc, {
            startY: finalY + 15,
            head: [['Receita Total', 'Despesas Totais', 'Lucro Líquido']],
            body: [[
              `€${report.totalRevenue.toFixed(2)}`,
              `€${report.totalExpenses.toFixed(2)}`,
              `€${report.netProfit.toFixed(2)}`
            ]],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
          });
          
          // Rodapé
          const pageCount = doc.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(
              `Maria Faz - Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}`,
              105, 
              doc.internal.pageSize.height - 10, 
              { align: 'center' }
            );
          }
          
          // Obter o PDF como buffer
          const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
          
          // Enviar o email com o relatório em anexo
          emailSent = await emailService.sendMonthlyReport(
            targetEmail,
            owner.name,
            monthName,
            pdfBuffer
          );
        } catch (emailError) {
          console.error('Erro ao gerar PDF ou enviar email:', emailError);
          // Fallback para modo de teste se ocorrer erro
          emailSent = await emailService.sendReportTest(targetEmail, owner.name, monthName);
        }
      } else {
        // Se o serviço não estiver configurado, use o modo de teste
        emailSent = await emailService.sendReportTest(targetEmail, owner.name, monthName);
      }
      
      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Falha ao enviar email. Verifique as configurações de email."
        });
      }
      
      // Registrar atividade
      await storage.createActivity({
        type: "email_sent",
        description: `Relatório mensal de ${monthName} enviado para ${owner.name} (${targetEmail})`,
        entityId: Number(ownerId),
        entityType: "owner"
      });
      
      return res.status(200).json({
        success: true,
        message: `Relatório enviado com sucesso para ${targetEmail}`,
        reportData: {
          ownerId: Number(ownerId),
          ownerName: owner.name,
          month,
          year,
          email: targetEmail,
          sentAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Erro ao enviar relatório por email:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao enviar relatório. Por favor tente novamente."
      });
    }
  });

  app.get("/api/reports/owner/:ownerId", async (req: Request, res: Response) => {
    try {
      const ownerId = Number(req.params.ownerId);
      
      // Verificar se o proprietário existe
      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        return res.status(404).json({ 
          success: false, 
          message: "Proprietário não encontrado" 
        });
      }
      
      // Opções para geração do relatório
      let month: string;
      let year: string;
      
      // Verificar se foi passado um intervalo de datas ou mês/ano
      if (req.query.startDate && req.query.endDate) {
        // Se temos um intervalo específico, calcular o mês a partir da data de início
        const startDate = new Date(req.query.startDate as string);
        month = String(startDate.getMonth() + 1).padStart(2, '0');
        year = String(startDate.getFullYear());
        
        // Registrar atividade
        // Registrar atividade e armazenar no RAG para aprendizado contínuo
        const activity = await storage.createActivity({
          activityType: 'report_generation',
          description: `Relatório financeiro para proprietário ${owner.name} (ID: ${ownerId}) para o período de ${req.query.startDate} a ${req.query.endDate}`,
          resourceType: 'owner',
          resourceId: ownerId
        });
      } else {
        // Caso contrário, usar mês e ano específicos
        month = req.query.month as string;
        year = req.query.year as string;
        
        if (!month || !year) {
          return res.status(400).json({ 
            success: false, 
            message: "É necessário informar mês e ano para o relatório, ou um intervalo de datas (startDate e endDate)" 
          });
        }
        
        // Garantir formato de dois dígitos para o mês
        month = month.padStart(2, '0');
        
        // Registrar atividade
        await storage.createActivity({
          activityType: 'report_generation',
          description: `Relatório financeiro para proprietário ${owner.name} (ID: ${ownerId}) para ${month}/${year}`,
          resourceType: 'owner',
          resourceId: ownerId
        });
      }
      
      // Gerar o relatório
      const report = await storage.generateOwnerFinancialReport(ownerId, month, year);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Não foi possível gerar o relatório para o proprietário informado."
        });
      }
      
      // Retornar o relatório em formato JSON
      return res.status(200).json({
        success: true,
        ownerId: report.owner.id,
        ownerName: report.owner.name,
        month: month,
        year: year,
        startDate: report.period.startDate,
        endDate: report.period.endDate,
        properties: report.properties,
        totals: report.summary,
        reservations: report.properties.flatMap((p: any) => p.reservations || [])
      });
    } catch (err) {
      console.error("Erro ao gerar relatório financeiro de proprietário:", err);
      handleError(err, res);
    }
  });

  /**
   * Endpoint para obter resumo financeiro geral do sistema
   * Suporta filtros por data de início e fim
   */
  app.get("/api/reports/financial-summary", async (req: Request, res: Response) => {
    try {
      let startDate: Date | undefined = undefined;
      let endDate: Date | undefined = undefined;
      
      // Parse das datas do parâmetro de consulta
      if (req.query.startDate) {
        try {
          startDate = new Date(req.query.startDate as string);
          if (isNaN(startDate.getTime())) {
            return res.status(400).json({ 
              success: false, 
              message: "Data de início inválida. Use o formato YYYY-MM-DD." 
            });
          }
        } catch (error) {
          return res.status(400).json({ 
            success: false, 
            message: "Data de início inválida. Use o formato YYYY-MM-DD." 
          });
        }
      }

      if (req.query.endDate) {
        try {
          endDate = new Date(req.query.endDate as string);
          if (isNaN(endDate.getTime())) {
            return res.status(400).json({ 
              success: false, 
              message: "Data de fim inválida. Use o formato YYYY-MM-DD." 
            });
          }
        } catch (error) {
          return res.status(400).json({ 
            success: false, 
            message: "Data de fim inválida. Use o formato YYYY-MM-DD." 
          });
        }
      }
      
      // Se não foram fornecidas datas, usar o mês atual
      if (!startDate && !endDate) {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Primeiro dia do mês atual
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia do mês atual
      }
      
      // Registrar atividade de geração de relatório
      await storage.createActivity({
        activityType: 'report_generation',
        description: `Relatório de resumo financeiro gerado para o período de ${startDate?.toISOString().split('T')[0] || 'início'} a ${endDate?.toISOString().split('T')[0] || 'fim'}`,
        resourceType: 'system',
        resourceId: 0
      });
      
      // Gerar o resumo financeiro
      const summary = await storage.generateFinancialSummary(startDate, endDate);
      
      // Retornar o resumo em formato JSON padronizado
      return res.status(200).json({
        success: true,
        summary: {
          ...summary,
          period: {
            startDate: startDate?.toISOString() || null,
            endDate: endDate?.toISOString() || null
          }
        }
      });
    } catch (err) {
      console.error("Erro ao gerar resumo financeiro:", err);
      handleError(err, res);
    }
  });

  /**
   * Endpoint para validação contextual de reservas
   * Utiliza RAG e regras de negócio para validar dados de reserva
   */
  app.post("/api/validate-reservation", async (req: Request, res: Response) => {
    try {
      const reservationData = req.body;
      
      // Validar dados básicos da requisição
      if (!reservationData || !reservationData.propertyId) {
        return res.status(400).json({
          success: false,
          message: "Dados de reserva incompletos. É necessário informar pelo menos propertyId."
        });
      }
      
      // Verificar se a chave da API Gemini está disponível
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(400).json({ 
          success: false,
          message: "Chave da API Gemini não configurada. Configure a chave nas definições." 
        });
      }
      
      // Buscar detalhes da propriedade
      const property = await storage.getProperty(reservationData.propertyId);
      if (!property) {
        return res.status(400).json({ 
          success: false,
          message: "Propriedade não encontrada" 
        });
      }
      
      // Verificar se existem reservas conflitantes
      let conflictingReservations: Reservation[] = [];
      if (reservationData.checkInDate && reservationData.checkOutDate) {
        const allReservations = await storage.getReservationsByProperty(property.id);
        
        // Filtrar reservas que se sobrepõem ao período solicitado
        conflictingReservations = allReservations.filter(r => {
          // Ignorar a própria reserva se estiver atualizando (tem ID)
          if (reservationData.id && r.id === reservationData.id) {
            return false;
          }
          
          const checkIn = new Date(r.checkInDate);
          const checkOut = new Date(r.checkOutDate);
          const newCheckIn = new Date(reservationData.checkInDate);
          const newCheckOut = new Date(reservationData.checkOutDate);
          
          // Verificar sobreposição de datas
          return (
            (newCheckIn <= checkOut && newCheckIn >= checkIn) || // Check-in durante outra reserva
            (newCheckOut <= checkOut && newCheckOut >= checkIn) || // Check-out durante outra reserva
            (newCheckIn <= checkIn && newCheckOut >= checkOut) // Engloba completamente outra reserva
          );
        });
      }
      
      // Registrar tentativa de validação (para fins de analytics)
      await storage.createActivity({
        activityType: 'reservation_validation',
        description: `Validação de reserva para propriedade ${property.name} (ID: ${property.id})`,
        resourceType: 'property',
        resourceId: property.id
      });
      
      // Buscar conhecimento similar do RAG para contextualizar a validação
      const similarContentPromise = enhancedRagService.findSimilarContent(
        JSON.stringify({
          propertyName: property.name,
          ...reservationData
        }),
        3
      );
      
      // Obter reservas recentes da mesma propriedade para análise de padrões
      const recentReservationsPromise = storage.getReservationsByProperty(property.id)
        .then(reservations => 
          reservations
            .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
            .slice(0, 5) // Últimas 5 reservas
        );
      
      // Executar promessas em paralelo para melhor performance
      const [similarContent, recentReservations] = await Promise.all([
        similarContentPromise,
        recentReservationsPromise
      ]);
      
      // Validar dados com contexto usando o adaptador de IA (e armazenar no RAG)
      const validationResult = await aiService.validateReservationData(
        reservationData,
        {
          property,
          similarReservations: similarContent,
          recentReservations,
          conflictingReservations,
          currentDate: new Date().toISOString()
        }
      );
      
      // Adicionar informações adicionais ao resultado
      return res.status(200).json({
        success: true,
        validation: {
          ...validationResult,
          hasConflicts: conflictingReservations.length > 0,
          conflictCount: conflictingReservations.length,
          property: {
            id: property.id,
            name: property.name,
            // Usando valores padrão seguros para campos que podem não existir
            maxGuests: 10, // Valor padrão seguro
            minimumStay: 1 // Valor padrão seguro
          }
        }
      });
    } catch (err) {
      console.error("Erro na validação de reserva:", err);
      handleError(err, res);
    }
  });

  /**
   * Endpoint para atualizar o arquivo theme.json
   * Permite alterar as configurações de tema da aplicação
   */
  app.post("/theme.json", async (req: Request, res: Response) => {
    try {
      // Esquema para validar o objeto de tema
      const themeSchema = z.object({
        appearance: z.enum(["light", "dark", "system"]),
        primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        variant: z.enum(["professional", "tint", "vibrant"]),
        radius: z.number().min(0).max(2)
      });
      
      // Validar o corpo da requisição
      const validatedTheme = themeSchema.parse(req.body);
      
      // Caminho para o arquivo theme.json
      const themePath = path.join(process.cwd(), 'theme.json');
      
      // Salvar no arquivo theme.json
      fs.writeFileSync(themePath, JSON.stringify(validatedTheme, null, 2));
      
      // Retornar sucesso
      res.json({
        success: true,
        message: "Tema atualizado com sucesso"
      });
    } catch (error) {
      // Se for um erro de validação, retornar mensagem amigável
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados de tema inválidos",
          errors: error.errors
        });
      }
      
      // Caso contrário, tratar como erro interno
      console.error("Erro ao atualizar theme.json:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao atualizar configurações de tema"
      });
    }
  });

  // Endpoint para obter as configurações de usuário (timezone, etc)
  app.get("/api/user-settings", (_req: Request, res: Response) => {
    try {
      // Caminho para o arquivo de configurações
      const settingsPath = path.join(process.cwd(), 'user-settings.json');
      
      // Verificar se o arquivo existe
      if (fs.existsSync(settingsPath)) {
        // Ler e retornar as configurações
        const settingsJson = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsJson);
        res.json({
          success: true,
          settings
        });
      } else {
        // Retornar configurações padrão
        const defaultSettings = {
          timezone: "Europe/Lisbon",
          language: "pt-PT",
          notifications: {
            email: true,
            browser: false
          }
        };
        res.json({
          success: true,
          settings: defaultSettings
        });
      }
    } catch (error) {
      console.error("Erro ao obter configurações de usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao obter configurações de usuário"
      });
    }
  });
  
  // Endpoint para salvar configurações de usuário
  app.post("/api/user-settings", (req: Request, res: Response) => {
    try {
      // Validar o corpo da requisição
      const settingsSchema = z.object({
        timezone: z.string(),
        language: z.string(),
        notifications: z.object({
          email: z.boolean(),
          browser: z.boolean()
        })
      });
      
      const validatedSettings = settingsSchema.parse(req.body);
      
      // Caminho para o arquivo de configurações
      const settingsPath = path.join(process.cwd(), 'user-settings.json');
      
      // Salvar no arquivo de configurações
      fs.writeFileSync(settingsPath, JSON.stringify(validatedSettings, null, 2));
      
      // Retornar sucesso
      res.json({
        success: true,
        message: "Configurações salvas com sucesso"
      });
    } catch (error) {
      // Se for um erro de validação, retornar mensagem amigável
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados de configuração inválidos",
          errors: error.errors
        });
      }
      
      // Caso contrário, tratar como erro interno
      console.error("Erro ao salvar configurações de usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao salvar configurações de usuário"
      });
    }
  });

  // Rotas para tarefas de manutenção
  app.get("/api/maintenance-tasks", async (req: Request, res: Response) => {
    try {
      let tasks;
      
      if (req.query.propertyId) {
        tasks = await storage.getMaintenanceTasksByProperty(Number(req.query.propertyId));
      } else if (req.query.status) {
        tasks = await storage.getMaintenanceTasksByStatus(req.query.status as string);
      } else {
        tasks = await storage.getMaintenanceTasks();
      }
      
      // Adicionar nomes de propriedades às tarefas
      const properties = await storage.getProperties();
      const tasksWithPropertyNames = tasks.map(task => {
        const property = properties.find(p => p.id === task.propertyId);
        return {
          ...task,
          propertyName: property ? property.name : `Propriedade #${task.propertyId}`,
        };
      });
      
      res.json(tasksWithPropertyNames);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/maintenance-tasks/:id", async (req: Request, res: Response) => {
    try {
      const task = await storage.getMaintenanceTask(Number(req.params.id));
      
      if (!task) {
        return res.status(404).json({ message: "Tarefa de manutenção não encontrada" });
      }
      
      // Adicionar nome da propriedade
      const property = await storage.getProperty(task.propertyId);
      const taskWithPropertyName = {
        ...task,
        propertyName: property ? property.name : `Propriedade #${task.propertyId}`,
      };
      
      res.json(taskWithPropertyName);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/maintenance-tasks", async (req: Request, res: Response) => {
    try {
      // Validação do corpo da requisição
      const taskData = {
        ...req.body,
        reportedAt: req.body.reportedAt || format(new Date(), 'yyyy-MM-dd'),
      };
      
      // Verificar se a propriedade existe
      const property = await storage.getProperty(taskData.propertyId);
      if (!property) {
        return res.status(400).json({ message: "Propriedade não encontrada" });
      }
      
      const task = await storage.createMaintenanceTask(taskData);
      
      // Criar atividade relacionada
      await storage.createActivity({
        activityType: "maintenance",
        resourceId: task.id,
        resourceType: "maintenance_task",
        description: `Nova tarefa de manutenção criada para ${property.name}: ${taskData.description.substring(0, 50)}${taskData.description.length > 50 ? '...' : ''}`,
      });
      
      // Adicionar nome da propriedade na resposta
      const taskWithPropertyName = {
        ...task,
        propertyName: property.name,
      };
      
      res.status(201).json(taskWithPropertyName);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/maintenance-tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingTask = await storage.getMaintenanceTask(id);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Tarefa de manutenção não encontrada" });
      }
      
      // Atualizar os campos
      const updatedTask = await storage.updateMaintenanceTask(id, req.body);
      
      // Criar atividade para manutenção concluída, se for o caso
      if (req.body.status === "completed" && existingTask.status !== "completed") {
        const property = await storage.getProperty(updatedTask.propertyId);
        await storage.createActivity({
          activityType: "maintenance",
          resourceId: updatedTask.id,
          resourceType: "maintenance_task",
          description: `Tarefa de manutenção concluída para ${property ? property.name : `Propriedade #${updatedTask.propertyId}`}: ${updatedTask.description.substring(0, 50)}${updatedTask.description.length > 50 ? '...' : ''}`,
        });
      }
      
      // Adicionar nome da propriedade na resposta
      const property = await storage.getProperty(updatedTask.propertyId);
      const taskWithPropertyName = {
        ...updatedTask,
        propertyName: property ? property.name : `Propriedade #${updatedTask.propertyId}`,
      };
      
      res.json(taskWithPropertyName);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/maintenance-tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.deleteMaintenanceTask(id);
      
      if (!result) {
        return res.status(404).json({ message: "Tarefa de manutenção não encontrada" });
      }
      
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Registrar as rotas de orçamentos
  registerQuotationRoutes(app);
  
  // Registrar as rotas de processamento de voz e áudio
  registerSpeechRoutes(app);
  
  // Registrar a rota de upload de arquivos de controle
  app.use('/api', uploadControlFileRouter);
  
  // Registrar rotas do assistente de reservas com Gemini 2.5 Flash
  app.use('/api/reservation-assistant', reservationAssistantRouter);

  // Rotas de teste para desenvolvimento
  
  // Endpoint para teste do rate limiter com função limitada
  app.post("/api/test/rate-limited-function", async (req: Request, res: Response) => {
    const { id, forceDelay = 500, skipCache = false } = req.body;
    
    try {
      // Importar o serviço de rate limiter
      const { rateLimiter } = await import('./services/rate-limiter.service');
      
      // Horário de início da requisição
      const requestStart = Date.now();
      console.log(`🔄 Processando requisição rate-limited ${id}...`);
      
      // Função a ser limitada por taxa
      const limitedFunction = async (args: any): Promise<any> => {
        // Simular processamento
        console.log(`⏳ Função limitada ${id} iniciando processamento...`);
        
        // Simular atraso da API
        await new Promise(resolve => setTimeout(resolve, forceDelay));
        
        console.log(`✅ Função limitada ${id} concluída após ${forceDelay}ms`);
        
        // Retornar resultado simulado
        return {
          result: `Resultado da requisição ${id}`,
          processingTime: forceDelay,
          timestamp: new Date().toISOString(),
          args
        };
      };
      
      // Aplicar rate limiting à função
      const rateLimitedFunc = rateLimiter.rateLimitedFunction(
        limitedFunction,
        `testRateLimited-${skipCache ? 'noCache' : 'withCache'}`, 
        60000 // 1 minuto de TTL para o cache
      );
      
      // Invocar a função com rate limiting
      const cacheKey = `test-key-${id}`;
      const result = await rateLimitedFunc({ id, cacheKey });
      
      // Calcular tempo total
      const totalTime = Date.now() - requestStart;
      
      // Determinar se foi cache hit baseado no tempo
      const isCacheHit = totalTime < forceDelay * 0.5;
      
      console.log(`✅ Requisição ${id} completada em ${totalTime}ms (${isCacheHit ? 'cache hit' : 'sem cache'})`);
      
      return res.json({
        success: true,
        id,
        processingTime: totalTime,
        actualDelay: forceDelay,
        result,
        cacheHit: isCacheHit
      });
    } catch (error: any) {
      console.error(`❌ Erro na requisição rate-limited ${id}:`, error);
      return res.status(500).json({
        success: false,
        id,
        error: error.message
      });
    }
  });
  
  // Endpoint para teste do rate limiter com atraso explícito
  app.post("/api/test/delayed-request", async (req: Request, res: Response) => {
    const { id, delayMs = 500 } = req.body;
    
    try {
      console.log(`📝 Requisição ${id} recebida. Aguardando ${delayMs}ms...`);
      
      // Simular uma chamada de API que leva tempo para responder
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const timestamp = new Date().toISOString();
      console.log(`✅ Requisição ${id} concluída após ${delayMs}ms`);
      
      return res.json({
        success: true,
        id,
        message: `Requisição ${id} processada com sucesso`,
        timestamp,
        delayMs
      });
    } catch (error: any) {
      console.error(`❌ Erro na requisição ${id}:`, error);
      return res.status(500).json({
        success: false,
        id,
        error: error.message
      });
    }
  });
  
  // Endpoint para limpar o cache do rate limiter
  app.post("/api/test/clear-cache", async (req: Request, res: Response) => {
    const { methodPattern } = req.body;
    
    try {
      // Importar o serviço de rate limiter
      const { rateLimiter } = await import('./services/rate-limiter.service');
      
      if (methodPattern) {
        rateLimiter.clearCacheByMethod(methodPattern);
        return res.json({
          success: true,
          message: `Cache limpo para método: ${methodPattern}`
        });
      } else {
        rateLimiter.clearCache();
        return res.json({
          success: true,
          message: 'Cache limpo completamente'
        });
      }
    } catch (error: any) {
      console.error('Erro ao limpar cache:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // Rota de teste para verificar os serviços OCR disponíveis
  app.get("/api/test/ocr-services", async (_req: Request, res: Response) => {
    try {
      const { AIAdapter } = await import('./services/ai-adapter.service');
      const aiAdapter = AIAdapter.getInstance();
      const availableServices = {
        openrouter: !!process.env.OPENROUTER_API_KEY,
        rolm: !!process.env.HF_TOKEN,
        native: true,
        primary: process.env.PRIMARY_AI || "openrouter"
      };
      
      res.json({
        success: true,
        services: availableServices,
        currentService: aiAdapter.getCurrentService()
      });
    } catch (error: any) {
      console.error("Erro ao verificar serviços OCR:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao verificar serviços OCR",
        error: error.message || "Erro desconhecido"
      });
    }
  });
  
  app.post("/api/test/gemini/generate-text", async (req: Request, res: Response) => {
    const { prompt, temperature = 0.3, maxTokens } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt é obrigatório' });
    }
    
    try {
      // Registrar timestamp inicial
      const startTime = Date.now();
      
      // Usar o aiService diretamente
      // O aiService já encapsula o GeminiService internamente
      const text = await aiService.generateText({
        prompt,
        temperature,
        maxTokens
      });
      
      // Calcular tempo de execução
      const executionTime = Date.now() - startTime;
      
      // Determinar se foi um cache hit baseado no tempo de execução
      const cacheHit = executionTime < 100;
      
      return res.json({
        success: true,
        text,
        executionTime,
        cacheHit
      });
    } catch (error: any) {
      console.error('Erro ao gerar texto:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Endpoint para testar processamento de PDF
  app.post("/api/test/process-pdf", pdfUpload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Arquivo PDF é obrigatório' });
      }
      
      console.log(`Processando arquivo: ${req.file.path}`);
      
      // Ler arquivo do disco
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      // Usar o aiService diretamente para extrair texto
      const text = await aiService.extractTextFromPDF(pdfBase64);
      
      return res.json({
        success: true,
        text,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });
    } catch (error: any) {
      console.error('Erro ao processar PDF:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Rota para verificar o status de todos os serviços de IA
  app.get("/api/check-ai-services", async (req: Request, res: Response) => {
    try {
      // Verificar o serviço Gemini
      const geminiService = aiService.geminiService;
      const geminiAvailable = geminiService.isConfigured();
      const geminiKeyConfigured = !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
      
      // Verificar conexão assíncrona com o Gemini
      let geminiConnected = false;
      if (geminiKeyConfigured) {
        try {
          geminiConnected = await geminiService.checkApiConnection();
        } catch (error) {
          console.error("Erro ao verificar a conexão com o Gemini:", error);
        }
      }
      
      // Verificar configuração do Gemini
      // Obtém informações do adaptador de IA
      const currentService = aiService.getCurrentService();
      const anyServiceAvailable = geminiConnected;
      
      // Retorna o status completo
      res.json({
        success: true,
        services: {
          // Mantemos esta estrutura por compatibilidade com o frontend
          mistral: {
            available: false, 
            keyConfigured: false,
            deprecated: true // Serviço descontinuado
          },
          gemini: {
            available: geminiConnected,
            keyConfigured: geminiKeyConfigured
          }
        },
        currentService,
        anyServiceAvailable
      });
    } catch (error: any) {
      console.error("Erro ao verificar serviços de IA:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao verificar serviços de IA",
        error: error.message
      });
    }
  });

  // Demo Data Routes
  // Rota para gerar dados de demonstração
  app.post("/api/demo/generate", generateDemoData);
  
  // Rota para resetar/limpar dados de demonstração
  app.post("/api/demo/reset", resetDemoDataHandler);

  const httpServer = createServer(app);
  return httpServer;
}
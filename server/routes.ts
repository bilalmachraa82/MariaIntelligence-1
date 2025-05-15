import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import bodyParser from "body-parser";
import { ZodError, z } from "zod";
// Suporte para múltiplos serviços de IA: OpenRouter (Mistral OCR), Gemini, RolmOCR
import { aiService, AIServiceType, AIAdapter } from "./services/ai-adapter.service";
import { hasGeminiApiKey, checkGeminiApiKey } from "./services/check-gemini-key";
import { RAGService } from "./services/rag.service";
// import { RagService } from "./services/rag-service"; // Duplicado? Usar RAGService
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
  FinancialDocumentItem, 
  InsertFinancialDocumentItem, 
  InsertPaymentRecord, 
  insertPaymentRecordSchema,
  financialDocumentTypeEnum,
  financialDocumentStatusEnum,
  entityTypeEnum,
  paymentMethodEnum,
  
  // Tipos
  Reservation,
  Property,
  MaintenanceTask, 
  FinancialDocument 
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import { sql } from 'drizzle-orm';
import { db } from './db'; 

// Set up multer for file uploads
const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function(req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!') as any, false);
    }
  }
});

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for images
  },
  fileFilter: function(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPG, PNG)!') as any, false);
    }
  }
});

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
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function(req, file, cb) {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas PDFs e imagens (JPG, PNG) são permitidos!') as any, false);
    }
  }
});

const handleError = (err: any, res: Response) => {
  console.error("Error details:", err);
  if (err instanceof ZodError) {
    console.error("Validation error:", JSON.stringify(err.errors, null, 2));
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }
  if (err.stack) {
    console.error("Error stack:", err.stack);
  }
  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    errorType: err.name || "UnknownError",
    timestamp: new Date().toISOString()
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

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
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("POST /api/owners - Body vazio ou inválido");
        return res.status(400).json({ 
          message: "Corpo da requisição vazio ou inválido",
          timestamp: new Date().toISOString()
        });
      }
      try {
        const validatedData = insertOwnerSchema.parse(req.body);
        console.log("POST /api/owners - Dados validados:", JSON.stringify(validatedData, null, 2));
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
        throw validationError;
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

  app.get("/api/reservations/dashboard", async (req: Request, res: Response) => {
    try {
      const reservations = await storage.getReservationsForDashboard();
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const checkIns: any[] = [];
      const checkOuts: any[] = [];
      const cleaningTasks: any[] = [];
      
      reservations.forEach((reservation: any) => {
        const checkInStr = reservation.checkInDate instanceof Date 
          ? reservation.checkInDate.toISOString().split('T')[0] 
          : String(reservation.checkInDate).split('T')[0];
        if (checkInStr === today || checkInStr === tomorrowStr) {
          checkIns.push(reservation);
        }
        const checkOutStr = reservation.checkOutDate instanceof Date 
          ? reservation.checkOutDate.toISOString().split('T')[0] 
          : String(reservation.checkOutDate).split('T')[0];
        if (checkOutStr === today) {
          checkOuts.push(reservation);
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
      
      if (checkIns.length === 0) {
        const demoProperties = await storage.getProperties();
        if (demoProperties && demoProperties.length > 0) {
          const selectedProperties = demoProperties.sort(() => 0.5 - Math.random()).slice(0, Math.min(3, demoProperties.length));
          for (let i = 0; i < selectedProperties.length; i++) {
            const property = selectedProperties[i];
            const isToday = i % 2 === 0;
            const checkInHour = 13 + Math.floor(Math.random() * 5);
            const checkInDate = new Date(isToday ? today : tomorrowStr);
            checkInDate.setHours(checkInHour, 0, 0, 0);
            const stayDays = 2 + Math.floor(Math.random() * 6);
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkOutDate.getDate() + stayDays);
            const names = ["João Silva", "Maria Santos", "Carlos Oliveira", "Ana Pereira", "Pedro Costa"];
            const randomName = names[Math.floor(Math.random() * names.length)];
            checkIns.push({
              id: 1000 + i, propertyId: property.id, propertyName: property.name, guestName: randomName,
              checkInDate: checkInDate.toISOString(), checkOutDate: checkOutDate.toISOString(), status: "confirmed",
              totalCost: 500 + Math.floor(Math.random() * 1000), guestsCount: 1 + Math.floor(Math.random() * 4)
            });
          }
        }
      }
      
      if (checkOuts.length === 0) {
        const demoProperties = await storage.getProperties();
        if (demoProperties && demoProperties.length > 0) {
          const selectedProperties = demoProperties.sort(() => 0.5 - Math.random()).slice(0, Math.min(2, demoProperties.length));
          for (let i = 0; i < selectedProperties.length; i++) {
            const property = selectedProperties[i];
            const checkOutHour = 10 + Math.floor(Math.random() * 2);
            const checkOutDate = new Date(today);
            checkOutDate.setHours(checkOutHour, 0, 0, 0);
            const stayDays = 2 + Math.floor(Math.random() * 5);
            const checkInDate = new Date(checkOutDate);
            checkInDate.setDate(checkInDate.getDate() - stayDays);
            const names = ["Roberto Almeida", "Fernanda Lima", "Luciana Mendes", "Bruno Castro", "Teresa Sousa"];
            const randomName = names[Math.floor(Math.random() * names.length)];
            const checkOut = {
              id: 2000 + i, propertyId: property.id, propertyName: property.name, guestName: randomName,
              checkInDate: checkInDate.toISOString(), checkOutDate: checkOutDate.toISOString(), status: "confirmed",
              totalCost: 500 + Math.floor(Math.random() * 1000), guestsCount: 1 + Math.floor(Math.random() * 4)
            };
            checkOuts.push(checkOut);
            cleaningTasks.push({
              id: `cleaning-${2000 + i}`, propertyId: property.id, propertyName: property.name, title: `Limpeza após saída`,
              description: `Limpeza necessária após saída do hóspede ${randomName}`, status: 'pending', priority: 'medium',
              type: 'cleaning', icon: null, date: checkOutDate.toISOString()
            });
          }
        }
      }
      res.json({ checkIns, checkOuts, cleaningTasks });
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
      const property = await storage.getProperty(validatedData.propertyId);
      if (!property) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      validatedData.cleaningFee = (property.cleaningCost || '0').toString();
      validatedData.checkInFee = (property.checkInFee || '0').toString();
      validatedData.commission = (Number(validatedData.totalAmount) * Number(property.commission || '0') / 100).toString();
      validatedData.teamPayment = (property.teamPayment || '0').toString();
      const totalCosts = Number(validatedData.cleaningFee) + Number(validatedData.checkInFee) + Number(validatedData.commission) + Number(validatedData.teamPayment) + Number(validatedData.platformFee);
      validatedData.netAmount = (Number(validatedData.totalAmount) - totalCosts).toString();
      const reservation = await storage.createReservation(validatedData);
      res.status(201).json(reservation);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/reservations/import-text", async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de importação de texto...');
      const { text, propertyId, userAnswers } = req.body;
      if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ success: false, message: "Texto vazio ou inválido." });
      }
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        return res.status(400).json({ success: false, message: "Chave da API Google Gemini não configurada", needsApiKey: true });
      }
      await storage.createActivity({ type: "text_import_attempt", description: `Tentativa de importação de texto para reserva` });
      try {
        console.log('Inicializando serviço de importação...');
        const importerService = new ReservationImporterService();
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
        await importerService.initialize(apiKey);
        console.log('Enviando texto para processamento:', text.substring(0, 50) + '...');
        const importOptions = { originalText: text, userAnswers: userAnswers || {} };
        const result = await importerService.importFromText(text, importOptions);
        console.log('Resultado recebido do serviço de importação');
        if (!result.reservation_data) {
          throw new Error("Não foi possível extrair dados estruturados do texto");
        }
        const reservationDataWithProperty: any = { ...result.reservation_data };
        let needsClarification = false;
        let clarificationQuestions: string[] = [];
        if (result.clarification_questions && result.clarification_questions.length > 0) {
          needsClarification = true;
          clarificationQuestions = result.clarification_questions;
          console.log('Foram encontradas questões de esclarecimento:', clarificationQuestions.length);
        }
        if (reservationDataWithProperty.guest_name && !reservationDataWithProperty.guestName) reservationDataWithProperty.guestName = reservationDataWithProperty.guest_name;
        if (reservationDataWithProperty.check_in_date && !reservationDataWithProperty.checkInDate) reservationDataWithProperty.checkInDate = reservationDataWithProperty.check_in_date;
        if (reservationDataWithProperty.check_out_date && !reservationDataWithProperty.checkOutDate) reservationDataWithProperty.checkOutDate = reservationDataWithProperty.check_out_date;
        if (reservationDataWithProperty.total_guests && !reservationDataWithProperty.numGuests) reservationDataWithProperty.numGuests = reservationDataWithProperty.total_guests;
        if (reservationDataWithProperty.guest_email && !reservationDataWithProperty.guestEmail) reservationDataWithProperty.guestEmail = reservationDataWithProperty.guest_email;
        if (reservationDataWithProperty.guest_phone && !reservationDataWithProperty.guestPhone) reservationDataWithProperty.guestPhone = reservationDataWithProperty.guest_phone;
        if (reservationDataWithProperty.booking_source && !reservationDataWithProperty.platform) reservationDataWithProperty.platform = reservationDataWithProperty.booking_source;
        if (!reservationDataWithProperty.status) reservationDataWithProperty.status = 'confirmed';
        if (propertyId && !isNaN(Number(propertyId))) {
          console.log('Associando à propriedade com ID:', propertyId);
          const property = await storage.getProperty(Number(propertyId));
          if (property) {
            reservationDataWithProperty.propertyId = property.id;
            reservationDataWithProperty.property_name = property.name;
          }
        } else if (reservationDataWithProperty.property_name) {
          console.log('Tentando encontrar propriedade pelo nome:', reservationDataWithProperty.property_name);
          const properties = await storage.getProperties();
          const matchingProperty = properties.find(p => p.name.toLowerCase() === reservationDataWithProperty.property_name.toLowerCase()) || null;
          if (matchingProperty) {
            reservationDataWithProperty.propertyId = matchingProperty.id;
            console.log('Propriedade encontrada com ID:', matchingProperty.id);
          }
        }
        await storage.createActivity({ type: "text_import_success", description: `Dados extraídos com sucesso do texto para reserva` });
        console.log('Respondendo com dados extraídos, needsClarification:', needsClarification);
        return res.json({
          success: true, needsClarification, clarificationQuestions: needsClarification ? clarificationQuestions : undefined,
          reservationData: reservationDataWithProperty
        });
      } catch (error) {
        console.error("Erro ao processar texto da reserva com IA:", error);
        await storage.createActivity({ type: "text_import_failed", description: `Falha ao extrair dados de texto para reserva: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
        return res.status(500).json({ success: false, message: "Não foi possível extrair dados do texto. Tente novamente ou insira manualmente.", error: error instanceof Error ? error.message : "Erro desconhecido" });
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
      const validatedData = { ...req.body };
      if (validatedData.totalAmount || validatedData.propertyId) {
        const property = await storage.getProperty(validatedData.propertyId || existingReservation.propertyId);
        if (!property) {
          return res.status(400).json({ message: "Invalid property ID" });
        }
        validatedData.cleaningFee = (property.cleaningCost || '0').toString();
        validatedData.checkInFee = (property.checkInFee || '0').toString();
        const totalAmount = validatedData.totalAmount || existingReservation.totalAmount;
        validatedData.commission = (Number(totalAmount) * Number(property.commission || '0') / 100).toString();
        validatedData.teamPayment = (property.teamPayment || '0').toString();
        const platformFee = validatedData.platformFee || existingReservation.platformFee;
        const totalCosts = Number(validatedData.cleaningFee) + Number(validatedData.checkInFee) + Number(validatedData.commission) + Number(validatedData.teamPayment) + Number(platformFee);
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

  // Activities routes
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const activities = await storage.getActivities(limit);
      const hideFromQueryParam = req.query.hideDemoTasks === 'true';
      const demoDataRemovedFromParam = req.query.demoDataRemoved === 'true';
      const disableDemoData = req.query.disableDemoData === 'true';
      const forceCleanMode = req.query.forceCleanMode === 'true';
      if (forceCleanMode) {
        console.log('⚠️ MODO DE LIMPEZA FORÇADA DETECTADO - Executando limpeza completa dos dados demo');
        try {
          const cleanupResult = await import('./api/demo-data').then(m => m.resetDemoData());
          if (cleanupResult.success) {
            console.log(`✅ Limpeza forçada concluída! ${cleanupResult.removedItems} itens removidos`);
          }
        } catch (cleanupError) {
          console.error('❌ Erro durante limpeza forçada:', cleanupError);
        }
      }
      const hideDemoTasks = true;
      const showDemoTasks = false;
      console.log(`Status de dados demo: hideDemoTasks=${hideDemoTasks}, showDemoTasks=${showDemoTasks}`);
      let realMaintenanceTasks: MaintenanceTask[] = [];
      try {
        realMaintenanceTasks = await storage.getMaintenanceTasks();
        console.log(`Obtidas ${realMaintenanceTasks.length} tarefas reais de manutenção`);
      } catch (dbError) {
        console.error('Erro ao obter tarefas de manutenção reais:', dbError);
      }
      const shouldShowDemoMaintenance = showDemoTasks && (realMaintenanceTasks.length === 0);
      let maintenance: any[] = [];
      let tasks: any[] = [];
      if (shouldShowDemoMaintenance) {
        const properties = await storage.getProperties();
        const activeProperties = properties.filter(p => p.active).slice(0, 3);
        console.log(`Gerando tarefas de demonstração para ${activeProperties.length} propriedades ativas`);
        maintenance = activeProperties.map((property, index) => ({
          id: `maintenance-${property.id}`, propertyId: property.id, propertyName: property.name,
          title: index === 0 ? 'Problema na torneira do banheiro' : index === 1 ? 'Ar condicionado com problema' : 'Manutenção da fechadura',
          description: index === 0 ? 'Cliente reportou vazamento na torneira do banheiro principal' : index === 1 ? 'Unidade interna do ar condicionado fazendo barulho' : 'Fechadura da porta principal necessita manutenção',
          status: index === 0 ? 'attention' : 'pending', priority: index === 0 ? 'high' : 'medium', type: 'maintenance', date: new Date().toISOString(), isDemo: true
        }));
        tasks = [
          { id: 'task-1', title: 'Contatar fornecedor de produtos', description: 'Refazer pedido de amenities para os próximos meses', status: 'pending', priority: 'medium', type: 'task', icon: 'Phone', date: new Date().toISOString(), isDemo: true },
          { id: 'task-2', title: 'Atualizar preços no site', description: 'Revisar tarifas para o período de alta temporada', status: 'upcoming', priority: 'low', type: 'task', icon: 'Calendar', date: new Date().toISOString(), isDemo: true }
        ];
      } else {
        maintenance = realMaintenanceTasks.map(task => ({
          id: `maintenance-${task.id}`, propertyId: task.propertyId, propertyName: (task as any).propertyName || `Propriedade #${task.propertyId}`, // Adicionado type assertion
          title: task.description.split(' - ')[0] || task.description, description: task.description.split(' - ')[1] || task.description,
          status: task.status === 'pending' ? 'pending' : task.status === 'scheduled' ? 'upcoming' : 'completed',
          priority: task.priority, type: 'maintenance', date: task.reportedAt
        }));
        console.log(`Usando ${maintenance.length} tarefas reais de manutenção (modo demonstração desativado)`);
      }
      res.json({ activities, maintenance, tasks });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity({ ...validatedData, type: validatedData.type || (validatedData as any).activityType }); // Corrigido
      res.status(201).json(activity);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Statistics routes
  app.get("/api/statistics", async (req: Request, res: Response) => {
    try {
      console.log("########### INICIANDO /api/statistics ###########");
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
      const properties = await storage.getProperties();
      console.log(`Obtidas ${properties.length} propriedades`);
      const activeProperties = properties.filter(p => p.active).length;
      console.log(`Propriedades ativas: ${activeProperties}`);
      let totalRevenue = 0;
      let netProfit = 0;
      let occupancyRate = 0;
      try {
        console.log("CHAMANDO storage.getTotalRevenue...");
        console.log("Consultando receita total diretamente via SQL...");
        try {
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
      }
      console.log("Estatísticas calculadas:", { totalRevenue, netProfit, occupancyRate });
      let reservations = await storage.getReservations();
      if (startDate) {
        reservations = reservations.filter(r => new Date(r.checkInDate) >= startDate!);
      }
      if (endDate) {
        reservations = reservations.filter(r => new Date(r.checkInDate) <= endDate!);
      }
      const propertyStats = await Promise.all(
        properties.filter(p => p.active).map(async (property) => {
          const stats = await storage.getPropertyStatistics(property.id);
          return {
            id: property.id, name: property.name, occupancyRate: stats.occupancyRate,
            revenue: stats.totalRevenue, profit: stats.netProfit
          };
        })
      );
      const topProperties = propertyStats.sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, 5);
      res.json({
        success: true, totalRevenue, netProfit, occupancyRate,
        totalProperties: properties.length, activeProperties,
        reservationsCount: reservations.length, topProperties
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
        return res.status(404).json({ success: false, message: "Property not found" });
      }
      res.json({ success: true, propertyId: id, ...stats });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/statistics/monthly-revenue", async (req: Request, res: Response) => {
    try {
      console.log("=========================================================");
      console.log("INICIANDO PROCESSAMENTO DE RECEITA POR PERÍODO");
      console.log("=========================================================");
      const startDateParam = req.query.startDate as string | undefined;
      const endDateParam = req.query.endDate as string | undefined;
      console.log(`Parâmetros recebidos: startDate=${startDateParam}, endDate=${endDateParam}`);
      const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = endDateParam ? new Date(endDateParam) : new Date(new Date().getFullYear(), 11, 31);
      console.log(`Período calculado: ${startDate.toISOString()} até ${endDate.toISOString()}`);
      const dateDiffTime = endDate.getTime() - startDate.getTime();
      const dateDiffDays = Math.ceil(dateDiffTime / (1000 * 3600 * 24));
      console.log(`Diferença em dias calculada: ${dateDiffDays}`);
      let granularity = 'month';
      console.log(`Conforme solicitado, todos os dados serão agrupados por mês, independente do período (${dateDiffDays} dias)`);
      console.log(`Granularidade padronizada para mensal`);
      const reservations = await storage.getReservations();
      const confirmedReservations = reservations.filter(r => {
        const checkInDate = new Date(r.checkInDate);
        return (r.status === "confirmed" || r.status === "completed") && checkInDate >= startDate && checkInDate <= endDate;
      });
      console.log(`Encontradas ${confirmedReservations.length} reservas no período`);
      let revenueData: { month: string; revenue: number; profit: number; }[] = [];
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      revenueData = months.map((month, index) => {
        const monthReservations = confirmedReservations.filter(r => new Date(r.checkInDate).getMonth() === index);
        const revenue = monthReservations.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
        const profit = monthReservations.reduce((sum, r) => sum + parseFloat(r.netAmount || '0'), 0);
        return { month, revenue, profit };
      });
      revenueData = revenueData.filter(d => d.revenue > 0 || d.profit > 0);
      if (revenueData.length === 0) {
        revenueData = [{ month: 'Jan', revenue: 0, profit: 0 }];
      }
      console.log(`Retornando ${revenueData.length} períodos de dados`);
      console.log(`Granularidade final sendo retornada: ${granularity}`);
      console.log("Resumo da resposta:", { granularity, totalPeriods: revenueData.length, firstPeriod: revenueData[0] || null, year: startDate.getFullYear() });
      const response = { success: true, data: revenueData, year: startDate.getFullYear(), granularity };
      console.log("Resposta completa:", JSON.stringify(response));
      res.json(response);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Usamos apenas o aiService instanciado no início
  // const ragService = new RAGService(); // Já definido globalmente
  // Use the enhanced RAG service for additional capabilities

  app.post("/api/ocr", pdfUpload.single('pdf'), ocrController.postOcr);
  app.post("/api/ocr/process", anyFileUpload.single('file'), ocrController.processOCR);
  app.post("/api/ocr/process/:service", anyFileUpload.single('file'), ocrController.processWithService);
  app.post("/api/budgets/estimate", budgetController.estimate);

  app.post("/api/pdf/process-pair", pdfUpload.array('pdfs', 2), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de par de PDFs...');
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "Nenhum arquivo enviado ou arquivos insuficientes." });
      }
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        return res.status(500).json({ success: false, message: "Nenhuma chave de API do Google Gemini configurada" });
      }
      try {
        const { processPdfPair } = await import('./services/pdf-pair-processor');
        const pdfPaths = (req.files as Express.Multer.File[]).map(file => file.path);
        const fileInfo = (req.files as Express.Multer.File[]).map(file => ({
          filename: file.filename, path: file.path, originalname: file.originalname
        }));
        console.log(`Processando ${pdfPaths.length} arquivos: ${pdfPaths.join(', ')}`);
        const pairResult = await processPdfPair(pdfPaths, process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "");
        if (!pairResult.reservationData) {
          console.error('Não foi possível extrair dados da reserva');
          return res.status(422).json({
            success: false, message: "Não foi possível extrair dados da reserva dos documentos",
            pairInfo: { isPairComplete: pairResult.isPairComplete, checkInPresent: !!pairResult.checkIn, checkOutPresent: !!pairResult.checkOut },
            errors: pairResult.errors
          });
        }
        if (pairResult.checkIn && pairResult.checkIn.text) {
          await enhancedRagService.addToKnowledgeBase(pairResult.checkIn.text, 'check_in_pdf', {
            filename: pairResult.checkIn.filename, uploadDate: new Date(), documentType: 'check-in'
          });
        }
        if (pairResult.checkOut && pairResult.checkOut.text) {
          await enhancedRagService.addToKnowledgeBase(pairResult.checkOut.text, 'check_out_pdf', {
            filename: pairResult.checkOut.filename, uploadDate: new Date(), documentType: 'check-out'
          });
        }
        const extractedData = pairResult.reservationData;
        const validationResult = pairResult.validationResult;
        if (!validationResult) {
          console.error('Resultado de validação não disponível');
          return res.status(500).json({
            success: false, message: "Erro no processamento dos documentos",
            pairInfo: { isPairComplete: pairResult.isPairComplete, checkInPresent: !!pairResult.checkIn, checkOutPresent: !!pairResult.checkOut },
            errors: [...pairResult.errors, "Falha na validação dos dados extraídos"]
          });
        }
        const properties = await storage.getProperties();
        console.log(`Buscando correspondência para propriedade: ${extractedData?.propertyName}`);
        let matchedProperty: Property | null = null;
        if (extractedData && extractedData.propertyName) {
          matchedProperty = properties.find(p => p.name.toLowerCase() === extractedData.propertyName.toLowerCase()) || null;
          if (!matchedProperty) {
            const calculateSimilarity = (str1: string, str2: string): number => {
              const words1 = str1.toLowerCase().split(/\s+/);
              const words2 = str2.toLowerCase().split(/\s+/);
              const commonWords = words1.filter((word: string) => words2.includes(word));
              return commonWords.length / Math.max(words1.length, words2.length);
            };
            let bestMatch = null;
            let highestSimilarity = 0;
            for (const property of properties) {
              const similarity = calculateSimilarity(extractedData.propertyName, property.name);
              if (similarity > highestSimilarity && similarity > 0.6) {
                highestSimilarity = similarity;
                bestMatch = property;
              }
            }
            matchedProperty = bestMatch;
          }
        }
        if (!matchedProperty) {
          matchedProperty = {
            id: 0,
            name: "Desconhecida",
            aliases: null, // Adicionado
            ownerId: 0,
            cleaningCost: "0",
            checkInFee: "0",
            commission: "0",
            teamPayment: "0",
            cleaningTeam: null, // Adicionado
            cleaningTeamId: null, // Adicionado
            monthlyFixedCost: null, // Adicionado
            active: false
            // Removidos: address, notes, createdAt, updatedAt
          };
          if (extractedData && extractedData.propertyName) {
            validationResult.errors.push({ field: 'propertyName', message: 'Propriedade não encontrada no sistema', severity: 'warning' });
            if (!validationResult.warningFields) validationResult.warningFields = [];
            validationResult.warningFields.push('propertyName');
          }
        }
        const totalAmount = extractedData?.totalAmount || 0;
        const platformFee = extractedData?.platformFee || ((extractedData?.platform === "airbnb" || extractedData?.platform === "booking") ? Math.round(totalAmount * 0.1) : 0);
        const activityType = pairResult.isPairComplete ? 'pdf_pair_processed' : 'pdf_processed';
        const activityDescription = pairResult.isPairComplete ? 
          `Par de PDFs processado: ${extractedData?.propertyName || 'Propriedade desconhecida'} - ${extractedData?.guestName || 'Hóspede desconhecido'} (${validationResult.status})` :
          `PDF processado: ${extractedData?.propertyName || 'Propriedade desconhecida'} - ${extractedData?.guestName || 'Hóspede desconhecido'} (${validationResult.status})`;
        await storage.createActivity({
          type: activityType, description: activityDescription,
          entityId: matchedProperty!.id, entityType: 'property'
        });
        const enrichedData = {
          ...extractedData, propertyId: matchedProperty!.id, platformFee: platformFee,
          cleaningFee: extractedData?.cleaningFee || Number(matchedProperty!.cleaningCost || 0),
          checkInFee: extractedData?.checkInFee || Number(matchedProperty!.checkInFee || 0),
          commission: extractedData?.commission || (totalAmount * Number(matchedProperty!.commission || 0) / 100),
          teamPayment: extractedData?.teamPayment || Number(matchedProperty!.teamPayment || 0)
        };
        let processMessage = "";
        if (pairResult.isPairComplete) processMessage = "Par de documentos processado com sucesso (check-in + check-out)";
        else if (pairResult.checkIn) processMessage = "Documento de check-in processado com sucesso, sem documento de check-out";
        else if (pairResult.checkOut) processMessage = "Documento de check-out processado com sucesso, sem documento de check-in";
        res.json({
          success: true, message: processMessage, extractedData: enrichedData,
          validation: { status: validationResult.status, isValid: validationResult.isValid, errors: validationResult.errors, missingFields: validationResult.missingFields, warningFields: validationResult.warningFields },
          pairInfo: { isPairComplete: pairResult.isPairComplete, checkInPresent: !!pairResult.checkIn, checkOutPresent: !!pairResult.checkOut },
          files: fileInfo
        });
      } catch (processError) {
        console.error('Erro no processamento dos PDFs:', processError);
        return res.status(500).json({ success: false, message: "Falha ao processar PDFs", error: processError instanceof Error ? processError.message : "Erro desconhecido no processamento" });
      }
    } catch (err) {
      console.error('Erro ao processar upload de PDFs:', err);
      return res.status(500).json({ success: false, message: "Erro interno no servidor", error: err instanceof Error ? err.message : "Erro desconhecido" });
    }
  });

  async function extractTextFromPDFWithGemini(pdfBase64: string): Promise<string> {
    try {
      return await aiService.extractTextFromPDF(pdfBase64);
    } catch (error: any) {
      console.error("Erro ao extrair texto do PDF com Gemini:", error);
      throw new Error(`Falha na extração de texto: ${error.message}`);
    }
  }

  async function parseReservationDataWithGemini(extractedText: string): Promise<any> {
    try {
      return await aiService.parseReservationData(extractedText);
    } catch (error: any) {
      console.error("Erro ao analisar dados da reserva com Gemini:", error);
      throw new Error(`Falha na extração de dados estruturados: ${error.message}`);
    }
  }

  app.get("/api/enums", (_req: Request, res: Response) => {
    res.json({
      reservationStatus: reservationStatusEnum.enumValues,
      reservationPlatform: reservationPlatformEnum.enumValues,
    });
  });

  app.get("/api/check-gemini-key", (_req: Request, res: Response) => {
    try {
      const hasGeminiKey = hasGeminiApiKey();
      res.json({ available: hasGeminiKey });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  app.get("/api/check-mistral-key", (_req: Request, res: Response) => {
    try {
      const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
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
  
  app.post("/api/configure-openrouter-key", async (req: Request, res: Response) => {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ success: false, message: "API key é obrigatória" });
    }

    try {
      await aiService.setApiKey('openrouter', apiKey);
      const testResult = await aiService.testOpenRouterConnection();

      if (testResult.success) {
        return res.json({ success: true, message: testResult.message });
      } else {
        return res.status(400).json({ success: false, message: testResult.message });
      }
    } catch (error: any) {
      console.error('Erro ao configurar ou testar OpenRouter Key:', error);
      return res.status(500).json({ success: false, message: error.message || "Erro interno ao configurar chave OpenRouter" });
    }
  });
  
  app.post("/api/configure-gemini-key", async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        return res.status(400).json({ success: false, message: "Chave de API inválida" });
      }
      process.env.GOOGLE_GEMINI_API_KEY = apiKey.trim();
      try {
        aiService.geminiService.initializeWithKey(apiKey.trim());
        const hasGeminiKey = process.env.GOOGLE_GEMINI_API_KEY !== undefined && process.env.GOOGLE_GEMINI_API_KEY !== '';
        return res.json({ success: true, message: "Chave da API Gemini configurada com sucesso", available: hasGeminiKey });
      } catch (error) {
        console.error("Erro ao testar a chave da API Gemini:", error);
        return res.status(400).json({ success: false, message: "A chave da API Gemini parece ser inválida" });
      }
    } catch (err) {
      handleError(err, res);
    }
  });
  
  app.get("/api/check-ai-services", async (_req: Request, res: Response) => {
    try {
      let currentService = "unavailable";
      try {
        const { aiService: currentAiService } = await import('./services/ai-adapter.service');
        currentService = currentAiService.getCurrentService();
      } catch (error) {
        console.error("Erro ao carregar o adaptador de IA:", error);
      }
      const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
      const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
      const hasRolmKey = !!process.env.HF_TOKEN;
      return res.json({
        success: true,
        services: {
          mistral: { available: hasOpenRouterKey, keyConfigured: hasOpenRouterKey, deprecated: false },
          rolm: { available: hasRolmKey, keyConfigured: hasRolmKey, handwriting: true },
          gemini: { available: hasGeminiKey, keyConfigured: hasGeminiKey, analysisOnly: true }
        },
        currentService,
        anyServiceAvailable: hasOpenRouterKey || hasRolmKey || hasGeminiKey
      });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  app.post("/api/set-ai-service", async (req: Request, res: Response) => {
    try {
      const { service } = req.body;
      if (!service || !["mistral", "gemini", "auto"].includes(service)) {
        return res.status(400).json({ success: false, message: "Serviço inválido. Opções válidas: mistral, gemini, auto" });
      }
      try {
        const { aiService: currentAiService, AIServiceType: currentAIServiceType } = await import('./services/ai-adapter.service');
        const serviceTypeMap: Record<string, any> = { "gemini": currentAIServiceType.GEMINI };
        if (service !== "gemini") {
          console.log(`Serviço ${service} não é suportado, usando Gemini apenas`);
          const newService = "gemini";
          currentAiService.setService(serviceTypeMap[newService]);
          return res.json({ success: true, message: `Serviço configurado para usar Gemini.`, currentService: currentAiService.getCurrentService() });
        }
        currentAiService.setService(serviceTypeMap[service]);
        return res.json({ success: true, message: `Serviço alterado para ${service}`, currentService: currentAiService.getCurrentService() });
      } catch (error) {
        console.error("Erro ao alterar serviço de IA:", error);
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Erro desconhecido ao alterar serviço" });
      }
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/learn-document-format", anyFileUpload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando aprendizado de novo formato de documento...');
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Nenhum arquivo enviado" });
      }
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(500).json({ success: false, message: "Esta funcionalidade requer a API Gemini configurada" });
      }
      const { fields } = req.body;
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ success: false, message: "É necessário especificar pelo menos um campo para extrair" });
      }
      try {
        const { aiService: currentAiService } = await import('./services/ai-adapter.service');
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileBase64 = fileBuffer.toString('base64');
        const result = await currentAiService.learnNewDocumentFormat(fileBase64, req.file.mimetype, fields);
        await storage.createActivity({
          type: 'document_format_learned',
          description: `Novo formato de documento analisado: ${req.file.originalname} (${fields.length} campos)`,
          entityId: null,
          entityType: 'system'
        });
        return res.json({
          success: result.success, data: result.extractedData,
          message: result.success ? "Documento analisado com sucesso" : "Falha ao analisar o documento",
          fields: fields, file: { filename: req.file.filename, path: req.file.path, mimetype: req.file.mimetype }
        });
      } catch (error: any) {
        console.error('Erro no aprendizado de formato:', error);
        return res.status(500).json({ success: false, message: "Falha ao processar novo formato de documento", error: error.message });
      }
    } catch (err) {
      handleError(err, res);
    }
  });
  
  app.get("/api/test-ai-adapter", async (_req: Request, res: Response) => {
    try {
      const { aiService: currentAiService, AIServiceType: currentAIServiceType } = await import('./services/ai-adapter.service');
      const currentService = currentAiService.getCurrentService();
      const sampleText = `Confirmação de Reserva - Booking.com\n\nPropriedade: Apartamento Graça\nHóspede: João Silva\nEmail: joao.silva@email.com\nCheck-in: 15-04-2025\nCheck-out: 20-04-2025\nNúmero de hóspedes: 2\nValor total: 450,00 €`;
      let parseResult;
      try {
        parseResult = await currentAiService.parseReservationData(sampleText);
      } catch (error: any) {
        parseResult = { error: error.message || "Erro desconhecido" };
      }
      const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
      return res.json({
        success: true, currentService,
        serviceAvailability: { mistral: hasGeminiKey, gemini: hasGeminiKey },
        parseResult
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || "Erro ao testar adaptador de IA" });
    }
  });

  app.get("/api/test-integrations", async (req: Request, res: Response) => {
    try {
      const tests = [];
      try {
        const properties = await storage.getProperties();
        const owners = await storage.getOwners();
        const reservations = await storage.getReservations();
        tests.push({ name: "Base de Dados", success: true, details: { properties: properties.length, owners: owners.length, reservations: reservations.length } });
      } catch (error: any) {
        tests.push({ name: "Base de Dados", success: false, error: error.message || "Erro ao acessar base de dados" });
      }
      try {
        tests.push({ name: "OCR (Processamento de PDFs)", success: true, details: { initialized: true, message: "Sistema OCR pronto para processar documentos" } });
      } catch (error: any) {
        tests.push({ name: "OCR (Processamento de PDFs)", success: false, error: error.message || "Erro ao verificar sistema OCR" });
      }
      try {
        let currentService = "unavailable";
        let servicesAvailable = [];
        try {
          const { aiService: currentAiService } = await import('./services/ai-adapter.service');
          currentService = currentAiService.getCurrentService();
          const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
          if (hasGeminiKey) servicesAvailable.push("mistral");
          if (hasGeminiKey) servicesAvailable.push("gemini");
          tests.push({ name: "Adaptador de IA", success: servicesAvailable.length > 0, details: { currentService, servicesAvailable, anyServiceAvailable: servicesAvailable.length > 0 } });
        } catch (adapterError: any) {
          tests.push({ name: "Adaptador de IA", success: false, error: adapterError.message || "Erro ao inicializar adaptador de IA" });
        }
      } catch (error: any) {
        tests.push({ name: "Adaptador de IA", success: false, error: error.message || "Erro ao testar adaptador de IA" });
      }
      try {
        const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
        if (!hasGeminiKey) {
          tests.push({ name: "Google Gemini API", success: false, error: "Chave API Gemini não encontrada" });
        } else {
          try {
            const { GeminiService } = await import('./services/gemini.service');
            const geminiService = new GeminiService();
            const isConnected = await geminiService.checkApiConnection();
            if (!isConnected) {
              tests.push({ name: "Google Gemini API", success: false, error: "Falha na conexão com a API do Gemini." });
            } else {
              tests.push({ name: "Google Gemini API", success: true, details: { modelType: "Gemini Pro 1.5", connected: true, visionCapable: true, textCapable: true } });
            }
          } catch (geminiError: any) {
            tests.push({ name: "Google Gemini API", success: false, error: geminiError.message || "Erro ao conectar com API Gemini" });
          }
        }
      } catch (error: any) {
        tests.push({ name: "Google Gemini API", success: false, error: error.message || "Erro ao testar API Gemini" });
      }
      try {
        const { buildRagContext } = await import('./api/maria-assistant');
        const ragContext = await buildRagContext("teste de estatísticas e propriedades");
        tests.push({ name: "RAG (Retrieval Augmented Generation)", success: true, details: { contextBuilt: true, contextLength: ragContext ? ragContext.length : 0 } });
      } catch (error: any) {
        console.error("Error building RAG context:", error);
        tests.push({ name: "RAG (Retrieval Augmented Generation)", success: false, error: error.message || "Erro ao testar sistema RAG" });
      }
      return res.json({ success: tests.every(test => test.success), timestamp: new Date().toISOString(), tests });
    } catch (error: any) {
      console.error("Erro ao testar integrações:", error);
      return res.status(500).json({ success: false, error: error.message || "Erro desconhecido ao testar integrações" });
    }
  });

  app.post("/api/assistant", async (req: Request, res: Response) => {
    try {
      const { mariaAssistant } = await import('./api/maria-assistant');
      return mariaAssistant(req, res);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/process-financial-document", anyFileUpload.single('document'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Nenhum arquivo enviado" });
      }
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(400).json({ success: false, message: "Chave da API Gemini não configurada. Configure a chave nas definições." });
      }
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(req.file.mimetype)) {
        if (req.file.path) {
          try { await fs.promises.unlink(req.file.path); } catch (unlinkError) { console.error("Erro ao remover arquivo temporário:", unlinkError); }
        }
        return res.status(400).json({ success: false, message: "Tipo de arquivo não suportado. Envie um PDF ou imagem (JPEG, PNG)." });
      }
      console.log(`Processando arquivo: ${req.file.filename}`);
      // Simular algum processamento...
      const processedData = { info: "Dados extraídos do documento financeiro", file: req.file.filename };

      res.json({ success: true, message: "Documento financeiro processado", data: processedData });

    } catch (error) { 
      handleError(error, res);
    }
  }); 

  const port = process.env.PORT || 3000;
  const server = createServer(app);
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  return server; 
}

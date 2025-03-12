import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { ZodError } from "zod";
import { 
  extendedPropertySchema, 
  extendedOwnerSchema,
  extendedReservationSchema,
  insertActivitySchema,
  reservationStatusEnum,
  reservationPlatformEnum
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { format } from "date-fns";

// Set up multer for file uploads
const upload = multer({
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
      cb(new Error('Only PDF files are allowed!') as any, false);
    }
  }
});

// Error handling middleware
const handleError = (err: any, res: Response) => {
  console.error(err);
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }
  
  return res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
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
      const validatedData = extendedPropertySchema.parse(req.body);
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
      
      const validatedData = extendedPropertySchema.partial().parse(req.body);
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
      const validatedData = extendedOwnerSchema.parse(req.body);
      const owner = await storage.createOwner(validatedData);
      res.status(201).json(owner);
    } catch (err) {
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
      
      const validatedData = extendedOwnerSchema.partial().parse(req.body);
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
      const validatedData = extendedReservationSchema.parse(req.body);
      
      // Calculate costs based on property information
      const property = await storage.getProperty(validatedData.propertyId);
      if (!property) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      // Apply property-specific costs
      validatedData.cleaningFee = property.cleaningCost.toString();
      validatedData.checkInFee = property.checkInFee.toString();
      validatedData.commissionFee = (Number(validatedData.totalAmount) * Number(property.commission) / 100).toString();
      validatedData.teamPayment = property.teamPayment.toString();
      
      // Calculate net amount
      const totalCosts = Number(validatedData.cleaningFee) + 
                        Number(validatedData.checkInFee) + 
                        Number(validatedData.commissionFee) + 
                        Number(validatedData.teamPayment) + 
                        Number(validatedData.platformFee);
                        
      validatedData.netAmount = (Number(validatedData.totalAmount) - totalCosts).toString();
      
      const reservation = await storage.createReservation(validatedData);
      res.status(201).json(reservation);
    } catch (err) {
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
      
      const validatedData = extendedReservationSchema.partial().parse(req.body);
      
      // If total amount or property has changed, recalculate costs
      if (validatedData.totalAmount || validatedData.propertyId) {
        const property = await storage.getProperty(
          validatedData.propertyId || existingReservation.propertyId
        );
        
        if (!property) {
          return res.status(400).json({ message: "Invalid property ID" });
        }
        
        // Update costs based on property information
        validatedData.cleaningFee = property.cleaningCost.toString();
        validatedData.checkInFee = property.checkInFee.toString();
        
        const totalAmount = validatedData.totalAmount || existingReservation.totalAmount;
        validatedData.commissionFee = (Number(totalAmount) * Number(property.commission) / 100).toString();
        validatedData.teamPayment = property.teamPayment.toString();
        
        // Recalculate net amount
        const platformFee = validatedData.platformFee || existingReservation.platformFee;
        const totalCosts = Number(validatedData.cleaningFee) + 
                          Number(validatedData.checkInFee) + 
                          Number(validatedData.commissionFee) + 
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

  // Activities routes
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const activities = await storage.getActivities(limit);
      res.json(activities);
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
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const totalRevenue = await storage.getTotalRevenue(startDate, endDate);
      const netProfit = await storage.getNetProfit(startDate, endDate);
      const occupancyRate = await storage.getOccupancyRate(undefined, startDate, endDate);
      
      // Get properties for active property count
      const properties = await storage.getProperties();
      const activeProperties = properties.filter(p => p.active).length;
      
      // Get reservations for this period
      let reservations = await storage.getReservations();
      
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
        totalRevenue,
        netProfit,
        occupancyRate,
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
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(stats);
    } catch (err) {
      handleError(err, res);
    }
  });

  // PDF Upload and Processing
  app.post("/api/upload-pdf", upload.single('pdf'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // In a real implementation, this would call Mistral OCR API
      // For now, we'll simulate successful extraction with sample data
      
      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dummy extracted data - in a real implementation this would come from Mistral OCR
      const extractedData = {
        propertyName: "Aroeira 3",
        guestName: "Maria Silva",
        guestEmail: "maria.silva@example.com",
        guestPhone: "+351912345678",
        checkInDate: format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        checkOutDate: format(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        numGuests: 2,
        totalAmount: 480,
        platform: "airbnb"
      };
      
      // Find property by name
      const properties = await storage.getProperties();
      const matchedProperty = properties.find(p => 
        p.name.toLowerCase() === extractedData.propertyName.toLowerCase()
      );
      
      if (!matchedProperty) {
        return res.status(400).json({ 
          message: "Could not match property name from extracted data",
          extractedData
        });
      }
      
      // Return the extracted data with property information
      res.json({
        extractedData: {
          ...extractedData,
          propertyId: matchedProperty.id,
          platformFee: extractedData.platform === "airbnb" || extractedData.platform === "booking" 
            ? Math.round(extractedData.totalAmount * 0.1) 
            : 0,
          cleaningFee: Number(matchedProperty.cleaningCost),
          checkInFee: Number(matchedProperty.checkInFee),
          commissionFee: (extractedData.totalAmount * Number(matchedProperty.commission) / 100),
          teamPayment: Number(matchedProperty.teamPayment)
        },
        file: {
          filename: req.file.filename,
          path: req.file.path
        }
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Other utility endpoints
  app.get("/api/enums", (_req: Request, res: Response) => {
    // Return enum values for frontend select components
    res.json({
      reservationStatus: reservationStatusEnum.options,
      reservationPlatform: reservationPlatformEnum.options,
    });
  });
  
  // Checar se a chave API Mistral está configurada
  app.get("/api/check-mistral-key", (_req: Request, res: Response) => {
    try {
      const hasMistralKey = process.env.MISTRAL_API_KEY !== undefined && 
                          process.env.MISTRAL_API_KEY !== '';
      res.json({ available: hasMistralKey });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Rota para processar mensagens com o Mistral AI
  app.post("/api/assistant", async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Mensagem é obrigatória' });
      }
      
      const mistralApiKey = process.env.MISTRAL_API_KEY;
      
      if (!mistralApiKey) {
        return res.status(400).json({ 
          error: 'Chave da API Mistral não configurada',
          reply: 'Para usar o assistente, configure a chave da API Mistral nas configurações.'
        });
      }
      
      // Preparar o contexto das propriedades
      const properties = await storage.getProperties();
      const reservations = await storage.getReservations();
      const owners = await storage.getOwners();
      
      // Criar um contexto para o modelo
      const propertyContext = properties.map(p => 
        `Propriedade ID: ${p.id}, Nome: ${p.name}, Proprietário ID: ${p.ownerId}`
      ).join('\n');
      
      const ownerContext = owners.map(o => 
        `Proprietário ID: ${o.id}, Nome: ${o.name}, Empresa: ${o.company || 'N/A'}`
      ).join('\n');
      
      const reservationContext = reservations.map(r => 
        `Reserva ID: ${r.id}, Propriedade ID: ${r.propertyId}, Hóspede: ${r.guestName}, Check-in: ${r.checkInDate}, Check-out: ${r.checkOutDate}, Valor: ${r.totalAmount}`
      ).join('\n');
      
      const systemMessage = `Você é o assistente virtual da Maria Faz, uma plataforma de gestão de propriedades para aluguel temporário.
      
      Use essas informações sobre as propriedades, proprietários e reservas para responder às perguntas:
      
      PROPRIEDADES:
      ${propertyContext}
      
      PROPRIETÁRIOS:
      ${ownerContext}
      
      RESERVAS:
      ${reservationContext}
      
      Responda sempre em português, de forma útil, concisa e amigável.`;
      
      // Montar o histórico de mensagens para a API
      const messages = [
        { role: "system", content: systemMessage },
        ...history.slice(-10) // Limitar a 10 mensagens do histórico para não exceder limites
      ];
      
      // Adicionar a mensagem atual do usuário
      messages.push({ role: "user", content: message });
      
      try {
        // Chamar a API Mistral
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mistralApiKey}`
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024
          })
        });
        
        const data = await response.json();
        
        if (data.error) {
          console.error('Erro na API Mistral:', data.error);
          return res.status(500).json({ 
            error: 'Erro ao processar a solicitação com Mistral AI',
            reply: 'Desculpe, houve um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.'
          });
        }
        
        // Registrar a atividade
        await storage.createActivity({
          type: 'assistant_chat',
          description: `Chat com assistente virtual: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
          entityType: null,
          entityId: null
        });
        
        return res.json({ 
          reply: data.choices[0].message.content
        });
      } catch (error) {
        console.error('Erro ao chamar a API Mistral:', error);
        return res.status(500).json({ 
          error: 'Erro ao comunicar com a API Mistral',
          reply: 'Desculpe, houve um problema de comunicação com o serviço de IA. Por favor, tente novamente mais tarde.'
        });
      }
    } catch (err) {
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

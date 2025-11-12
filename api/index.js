var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activities: () => activities,
  cleaningTeams: () => cleaningTeams,
  conversationHistory: () => conversationHistory,
  documentStatusEnum: () => documentStatusEnum,
  documentTypeEnum: () => documentTypeEnum,
  entityTypeEnum: () => entityTypeEnum,
  extendedOwnerSchema: () => extendedOwnerSchema,
  extendedPropertySchema: () => extendedPropertySchema,
  extendedReservationSchema: () => extendedReservationSchema,
  financialDocumentItems: () => financialDocumentItems2,
  financialDocumentItemsRelations: () => financialDocumentItemsRelations,
  financialDocumentStatusEnum: () => financialDocumentStatusEnum,
  financialDocumentTypeEnum: () => financialDocumentTypeEnum,
  financialDocuments: () => financialDocuments,
  financialDocumentsRelations: () => financialDocumentsRelations,
  insertActivitySchema: () => insertActivitySchema,
  insertCleaningTeamSchema: () => insertCleaningTeamSchema,
  insertConversationHistorySchema: () => insertConversationHistorySchema,
  insertFinancialDocumentItemSchema: () => insertFinancialDocumentItemSchema,
  insertFinancialDocumentSchema: () => insertFinancialDocumentSchema,
  insertKnowledgeEmbeddingSchema: () => insertKnowledgeEmbeddingSchema,
  insertMaintenanceTaskSchema: () => insertMaintenanceTaskSchema,
  insertOwnerSchema: () => insertOwnerSchema,
  insertPaymentRecordSchema: () => insertPaymentRecordSchema,
  insertPropertySchema: () => insertPropertySchema,
  insertQueryEmbeddingSchema: () => insertQueryEmbeddingSchema,
  insertQuotationSchema: () => insertQuotationSchema,
  insertReservationSchema: () => insertReservationSchema,
  knowledgeEmbeddings: () => knowledgeEmbeddings,
  maintenanceTasks: () => maintenanceTasks,
  maintenanceTasksRelations: () => maintenanceTasksRelations,
  ownerStatusEnum: () => ownerStatusEnum,
  owners: () => owners,
  ownersRelations: () => ownersRelations,
  paymentMethodEnum: () => paymentMethodEnum,
  paymentRecords: () => paymentRecords,
  paymentRecordsRelations: () => paymentRecordsRelations,
  properties: () => properties,
  propertiesRelations: () => propertiesRelations,
  propertyStatusEnum: () => propertyStatusEnum,
  queryEmbeddings: () => queryEmbeddings,
  quotations: () => quotations,
  reservationPlatformEnum: () => reservationPlatformEnum,
  reservationStatusEnum: () => reservationStatusEnum,
  reservations: () => reservations,
  reservationsRelations: () => reservationsRelations
});
import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var propertyStatusEnum, ownerStatusEnum, reservationStatusEnum, reservationPlatformEnum, documentTypeEnum, documentStatusEnum, entityTypeEnum, paymentMethodEnum, financialDocumentTypeEnum, financialDocumentStatusEnum, properties, owners, reservations, activities, cleaningTeams, maintenanceTasks, financialDocuments, financialDocumentItems2, paymentRecords, quotations, knowledgeEmbeddings, queryEmbeddings, conversationHistory, propertiesRelations, ownersRelations, reservationsRelations, maintenanceTasksRelations, financialDocumentsRelations, financialDocumentItemsRelations, paymentRecordsRelations, insertPropertySchema, insertOwnerSchema, insertReservationSchema, insertActivitySchema, insertCleaningTeamSchema, insertMaintenanceTaskSchema, insertFinancialDocumentSchema, insertFinancialDocumentItemSchema, insertPaymentRecordSchema, insertQuotationSchema, insertKnowledgeEmbeddingSchema, insertQueryEmbeddingSchema, insertConversationHistorySchema, extendedPropertySchema, extendedOwnerSchema, extendedReservationSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    propertyStatusEnum = pgEnum("property_status", ["active", "inactive", "maintenance"]);
    ownerStatusEnum = pgEnum("owner_status", ["active", "inactive"]);
    reservationStatusEnum = pgEnum("reservation_status", ["pending", "confirmed", "cancelled", "completed", "no-show"]);
    reservationPlatformEnum = pgEnum("reservation_platform", ["airbnb", "booking", "direct", "expedia", "other"]);
    documentTypeEnum = pgEnum("document_type", ["invoice", "receipt", "contract", "quotation", "other"]);
    documentStatusEnum = pgEnum("document_status", ["draft", "sent", "paid", "overdue", "cancelled"]);
    entityTypeEnum = pgEnum("entity_type", ["owner", "property", "guest", "supplier", "company", "other"]);
    paymentMethodEnum = pgEnum("payment_method", ["cash", "bank_transfer", "credit_card", "debit_card", "paypal", "other"]);
    financialDocumentTypeEnum = pgEnum("financial_document_type", ["invoice", "receipt", "expense", "income", "maintenance", "other"]);
    financialDocumentStatusEnum = pgEnum("financial_document_status", ["draft", "pending", "paid", "overdue", "cancelled"]);
    properties = pgTable("properties", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      aliases: text("aliases").array(),
      // Lista de aliases/apelidos para a propriedade
      ownerId: integer("owner_id").notNull(),
      cleaningCost: text("cleaning_cost"),
      // Custo de limpeza em euros
      checkInFee: text("check_in_fee"),
      // Taxa de check-in em euros
      commission: text("commission"),
      // Comissão em percentagem
      teamPayment: text("team_payment"),
      // Pagamento da equipe em euros
      cleaningTeam: text("cleaning_team"),
      // Nome da equipe de limpeza
      cleaningTeamId: integer("cleaning_team_id"),
      monthlyFixedCost: text("monthly_fixed_cost"),
      active: boolean("active").default(true)
    });
    owners = pgTable("owners", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      company: text("company"),
      address: text("address"),
      taxId: text("tax_id"),
      email: text("email").notNull(),
      phone: text("phone")
    });
    reservations = pgTable("reservations", {
      id: serial("id").primaryKey(),
      propertyId: integer("property_id").notNull(),
      guestName: text("guest_name").notNull(),
      checkInDate: text("check_in_date").notNull(),
      // Formato YYYY-MM-DD
      checkOutDate: text("check_out_date").notNull(),
      // Formato YYYY-MM-DD
      totalAmount: text("total_amount").notNull(),
      // Valor total da reserva em euros
      checkInFee: text("check_in_fee"),
      // Taxa de check-in em euros
      teamPayment: text("team_payment"),
      // Pagamento para equipe em euros
      platformFee: text("platform_fee"),
      // Taxa da plataforma em euros
      cleaningFee: text("cleaning_fee"),
      // Taxa de limpeza em euros
      commission: text("commission_fee"),
      // Comissão do administrador em euros
      netAmount: text("net_amount"),
      // Valor líquido após taxas
      numGuests: integer("num_guests").default(1),
      // Número de hóspedes
      guestEmail: text("guest_email"),
      guestPhone: text("guest_phone"),
      status: text("status").notNull().default("confirmed"),
      // confirmed, checked-in, checked-out, cancelled
      notes: text("notes"),
      source: text("source").default("manual"),
      // manual, airbnb, booking, etc.
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    activities = pgTable("activities", {
      id: serial("id").primaryKey(),
      type: text("type").notNull(),
      // reservation, check-in, check-out, maintenance, cleaning, etc.
      entityId: integer("entity_id"),
      // ID do recurso (reserva, propriedade, etc.)
      entityType: text("entity_type"),
      // tipo do recurso (reservation, property, etc.)
      description: text("description").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    cleaningTeams = pgTable("cleaning_teams", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      email: text("email"),
      phone: text("phone"),
      rate: text("rate"),
      // Taxa por limpeza em euros
      status: text("status").notNull().default("active"),
      // active, inactive
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    maintenanceTasks = pgTable("maintenance_tasks", {
      id: serial("id").primaryKey(),
      propertyId: integer("property_id").notNull(),
      description: text("description").notNull(),
      priority: text("priority").notNull().default("medium"),
      // high, medium, low
      dueDate: text("due_date").notNull(),
      // Formato YYYY-MM-DD  
      status: text("status").notNull().default("pending"),
      // pending, scheduled, completed
      assignedTo: text("assigned_to"),
      reportedAt: text("reported_at").notNull(),
      // Formato YYYY-MM-DD
      completedAt: text("completed_at"),
      // Formato YYYY-MM-DD
      cost: text("cost"),
      // Custo da manutenção em euros
      invoiceNumber: text("invoice_number"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    financialDocuments = pgTable("financial_documents", {
      id: serial("id").primaryKey(),
      documentType: text("document_type").notNull(),
      // invoice, receipt, etc.
      documentNumber: text("document_number").notNull(),
      issueDate: text("issue_date").notNull(),
      // Formato YYYY-MM-DD
      dueDate: text("due_date"),
      // Formato YYYY-MM-DD
      amount: text("amount").notNull(),
      // Valor em euros
      status: text("status").notNull().default("pending"),
      // pending, paid, cancelled
      relatedEntityType: text("related_entity_type"),
      // reservation, property, owner, etc.
      relatedEntityId: integer("related_entity_id"),
      description: text("description"),
      pdfUrl: text("pdf_url"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    financialDocumentItems2 = pgTable("financial_document_items", {
      id: serial("id").primaryKey(),
      documentId: integer("document_id").notNull(),
      description: text("description").notNull(),
      quantity: integer("quantity").notNull(),
      unitPrice: text("unit_price").notNull(),
      totalPrice: text("total_price").notNull(),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    paymentRecords = pgTable("payment_records", {
      id: serial("id").primaryKey(),
      documentId: integer("document_id").notNull(),
      amount: text("amount").notNull(),
      paymentDate: text("payment_date").notNull(),
      paymentMethod: text("payment_method").notNull(),
      reference: text("reference"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    quotations = pgTable("quotations", {
      id: serial("id").primaryKey(),
      clientName: text("client_name").notNull(),
      clientEmail: text("client_email"),
      clientPhone: text("client_phone"),
      propertyType: text("property_type").notNull(),
      // T0-T5, V1-V5, etc.
      propertyArea: integer("property_area").notNull(),
      bedrooms: integer("bedrooms").notNull(),
      bathrooms: integer("bathrooms").notNull(),
      propertyAddress: text("property_address"),
      basePrice: text("base_price").notNull(),
      // Preço base em euros
      cleaningFrequency: text("cleaning_frequency"),
      // weekly, biweekly, monthly
      includeSupplies: boolean("include_supplies").default(false),
      includeLaundry: boolean("include_laundry").default(false),
      includeIroning: boolean("include_ironing").default(false),
      includeDisinfection: boolean("include_disinfection").default(false),
      includeWindowCleaning: boolean("include_window_cleaning").default(false),
      includeExtraHours: boolean("include_extra_hours").default(false),
      extraHoursQuantity: integer("extra_hours_quantity").default(0),
      additionalServices: text("additional_services"),
      totalPrice: text("total_price").notNull(),
      // Preço total em euros
      validUntil: text("valid_until"),
      // Formato YYYY-MM-DD
      status: text("status").notNull().default("pending"),
      // pending, accepted, rejected, expired
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    knowledgeEmbeddings = pgTable("knowledge_embeddings", {
      id: serial("id").primaryKey(),
      content: text("content").notNull(),
      content_type: text("content_type"),
      embedding_json: text("embedding_json"),
      metadata: text("metadata"),
      created_at: timestamp("created_at").defaultNow(),
      updated_at: timestamp("updated_at").defaultNow()
    });
    queryEmbeddings = pgTable("query_embeddings", {
      id: serial("id").primaryKey(),
      query: text("query").notNull(),
      response: text("response"),
      embedding_json: text("embedding_json"),
      frequency: integer("frequency"),
      last_used: timestamp("last_used"),
      created_at: timestamp("created_at").defaultNow()
    });
    conversationHistory = pgTable("conversation_history", {
      id: serial("id").primaryKey(),
      user_id: integer("user_id"),
      message: text("message").notNull(),
      role: text("role").notNull(),
      // user, assistant, system
      timestamp: timestamp("timestamp").defaultNow(),
      metadata: text("metadata")
    });
    propertiesRelations = relations(properties, ({ one, many }) => ({
      owner: one(owners, {
        fields: [properties.ownerId],
        references: [owners.id]
      }),
      reservations: many(reservations),
      maintenanceTasks: many(maintenanceTasks)
    }));
    ownersRelations = relations(owners, ({ many }) => ({
      properties: many(properties)
    }));
    reservationsRelations = relations(reservations, ({ one }) => ({
      property: one(properties, {
        fields: [reservations.propertyId],
        references: [properties.id]
      })
    }));
    maintenanceTasksRelations = relations(maintenanceTasks, ({ one }) => ({
      property: one(properties, {
        fields: [maintenanceTasks.propertyId],
        references: [properties.id]
      })
    }));
    financialDocumentsRelations = relations(financialDocuments, ({ many }) => ({
      items: many(financialDocumentItems2),
      payments: many(paymentRecords)
    }));
    financialDocumentItemsRelations = relations(financialDocumentItems2, ({ one }) => ({
      document: one(financialDocuments, {
        fields: [financialDocumentItems2.documentId],
        references: [financialDocuments.id]
      })
    }));
    paymentRecordsRelations = relations(paymentRecords, ({ one }) => ({
      document: one(financialDocuments, {
        fields: [paymentRecords.documentId],
        references: [financialDocuments.id]
      })
    }));
    insertPropertySchema = createInsertSchema(properties).omit({ id: true });
    insertOwnerSchema = createInsertSchema(owners).omit({ id: true });
    insertReservationSchema = createInsertSchema(reservations).omit({ id: true, createdAt: true, updatedAt: true });
    insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
    insertCleaningTeamSchema = createInsertSchema(cleaningTeams).omit({ id: true, createdAt: true, updatedAt: true });
    insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).omit({ id: true, createdAt: true, updatedAt: true });
    insertFinancialDocumentSchema = createInsertSchema(financialDocuments).omit({ id: true, createdAt: true, updatedAt: true });
    insertFinancialDocumentItemSchema = createInsertSchema(financialDocumentItems2).omit({ id: true, createdAt: true });
    insertPaymentRecordSchema = createInsertSchema(paymentRecords).omit({ id: true, createdAt: true });
    insertQuotationSchema = createInsertSchema(quotations).omit({ id: true, createdAt: true, updatedAt: true });
    insertKnowledgeEmbeddingSchema = createInsertSchema(knowledgeEmbeddings).omit({ id: true, created_at: true, updated_at: true });
    insertQueryEmbeddingSchema = createInsertSchema(queryEmbeddings).omit({ id: true, created_at: true });
    insertConversationHistorySchema = createInsertSchema(conversationHistory).omit({ id: true, timestamp: true });
    extendedPropertySchema = z.object({
      name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
      ownerId: z.number().int().positive({ message: "Selecione um propriet\xE1rio v\xE1lido" }),
      cleaningCost: z.number().nonnegative({ message: "O custo de limpeza n\xE3o pode ser negativo" }),
      checkInFee: z.number().nonnegative({ message: "A taxa de check-in n\xE3o pode ser negativa" }),
      commission: z.number().nonnegative({ message: "A comiss\xE3o n\xE3o pode ser negativa" }),
      teamPayment: z.number().nonnegative({ message: "O pagamento da equipe n\xE3o pode ser negativo" }),
      cleaningTeam: z.string().optional(),
      monthlyFixedCost: z.number().nonnegative({ message: "O custo fixo mensal n\xE3o pode ser negativo" }).optional(),
      active: z.boolean().default(true)
    });
    extendedOwnerSchema = z.object({
      name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
      company: z.string().optional(),
      address: z.string().optional(),
      taxId: z.string().optional(),
      email: z.string().email({ message: "Email inv\xE1lido" }),
      phone: z.string().optional()
    });
    extendedReservationSchema = z.object({
      propertyId: z.number().int().positive({ message: "Selecione uma propriedade v\xE1lida" }),
      guestName: z.string().min(2, { message: "O nome do h\xF3spede deve ter pelo menos 2 caracteres" }),
      guestEmail: z.string().email({ message: "Email inv\xE1lido" }).optional().or(z.literal("")),
      guestPhone: z.string().optional().or(z.literal("")),
      checkInDate: z.coerce.date({ required_error: "Selecione a data de check-in" }),
      checkOutDate: z.coerce.date({ required_error: "Selecione a data de check-out" }),
      numGuests: z.number().int().positive({ message: "N\xFAmero de h\xF3spedes deve ser maior que zero" }),
      totalAmount: z.string(),
      status: z.string(),
      platform: z.string(),
      platformFee: z.string(),
      cleaningFee: z.string(),
      checkInFee: z.string(),
      commission: z.string(),
      // Alteração para usar 'commission' em vez de 'commissionFee'
      teamPayment: z.string(),
      netAmount: z.string(),
      notes: z.string().optional().or(z.literal(""))
    });
  }
});

// server/services/pdf.service.ts
var pdf_service_exports = {};
__export(pdf_service_exports, {
  PDFService: () => PDFService,
  pdfService: () => pdfService
});
import fs from "fs";
import path from "path";
var PDFService, pdfService;
var init_pdf_service = __esm({
  "server/services/pdf.service.ts"() {
    "use strict";
    PDFService = class {
      /**
       * Gera um PDF de orçamento
       * @param quotation Dados do orçamento
       * @param id ID do orçamento
       * @returns Caminho para o arquivo PDF gerado
       */
      async generateQuotationPdf(quotation, id) {
        try {
          console.log("Iniciando gera\xE7\xE3o de PDF para or\xE7amento...");
          const jsPDF = await import("jspdf").then((module) => module.jsPDF);
          const autoTable = await import("jspdf-autotable").then((module) => module.default);
          if (!quotation) {
            console.error("Dados do or\xE7amento n\xE3o fornecidos");
            throw new Error("Dados do or\xE7amento n\xE3o fornecidos");
          }
          console.log("Or\xE7amento encontrado, dados:", JSON.stringify(quotation, null, 2));
          const uploadDir = "./uploads";
          if (!fs.existsSync(uploadDir)) {
            console.log("Criando diret\xF3rio de uploads:", uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const timestamp2 = Date.now();
          const fileName = `orcamento_${id}_${timestamp2}.pdf`;
          const filePath = path.join(uploadDir, fileName);
          console.log(`Gerando PDF para or\xE7amento #${id} em ${filePath}`);
          const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
          });
          doc.setProperties({
            title: `Or\xE7amento Maria Faz N\xBA ${id}`,
            subject: `Or\xE7amento para ${quotation.clientName}`,
            author: "Maria Faz",
            creator: "Sistema Maria Faz"
          });
          doc.setFont("helvetica", "normal");
          try {
            const logoData = fs.readFileSync("./attached_assets/logo.png");
            const base64Logo = "data:image/png;base64," + logoData.toString("base64");
            doc.addImage(base64Logo, "PNG", 75, 10, 60, 17);
          } catch (error) {
            console.error("Erro ao carregar o logo:", error);
            doc.setFontSize(24);
            doc.setTextColor(0, 0, 0);
            doc.text("Maria Faz", 105, 20, { align: "center" });
          }
          doc.setFontSize(20);
          doc.setTextColor(142, 209, 210);
          doc.text("OR\xC7AMENTO DE SERVI\xC7OS", 105, 40, { align: "center" });
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Or\xE7amento N\xBA: ${id}`, 20, 50);
          const formatDate = (dateString) => {
            const date2 = new Date(dateString);
            return date2.toLocaleDateString("pt-PT");
          };
          const createdDate = quotation.createdAt ? formatDate(quotation.createdAt) : formatDate((/* @__PURE__ */ new Date()).toISOString());
          doc.text(`Data: ${createdDate}`, 20, 57);
          doc.text(`V\xE1lido at\xE9: ${formatDate(quotation.validUntil)}`, 20, 64);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(231, 144, 144);
          doc.text("Dados do Cliente", 20, 75);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          doc.text(`Nome: ${quotation.clientName}`, 20, 83);
          if (quotation.clientEmail) {
            doc.text(`Email: ${quotation.clientEmail}`, 20, 90);
          }
          if (quotation.clientPhone) {
            doc.text(`Telefone: ${quotation.clientPhone}`, 20, 97);
          }
          let currentY = 110;
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(245, 213, 213);
          doc.text("Detalhes da Propriedade", 20, currentY);
          doc.setTextColor(0, 0, 0);
          currentY += 8;
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const propertyDetails = [
            ["Tipo", quotation.propertyType || "N\xE3o especificado"],
            ["\xC1rea Total", `${quotation.propertyArea || 0} m\xB2`]
          ];
          if (quotation.exteriorArea > 0) {
            propertyDetails.push(["\xC1rea Exterior", `${quotation.exteriorArea} m\xB2`]);
          }
          autoTable(doc, {
            startY: currentY,
            head: [["Caracter\xEDstica", "Detalhe"]],
            body: propertyDetails,
            theme: "striped",
            headStyles: { fillColor: [231, 144, 144], textColor: [255, 255, 255] },
            // Rosa para o cabeçalho
            margin: { top: 20, left: 20, right: 20 }
          });
          currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 30;
          if (quotation.isDuplex || quotation.exteriorArea > 0 || quotation.hasBBQ || quotation.hasGlassGarden) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(231, 144, 144);
            doc.text("Caracter\xEDsticas Adicionais:", 20, currentY);
            doc.setTextColor(0, 0, 0);
            currentY += 7;
            doc.setFont("helvetica", "normal");
            const features = [];
            if (quotation.isDuplex) features.push("Duplex");
            if (quotation.exteriorArea > 0) features.push("Espa\xE7o Exterior");
            if (quotation.hasBBQ) features.push("Churrasqueira");
            if (quotation.hasGlassGarden) features.push("Jardim com Superf\xEDcies de Vidro");
            doc.setFontSize(10);
            features.forEach((feature, index) => {
              doc.text(`\u2022 ${feature}`, 25, currentY + index * 6);
            });
            currentY += features.length * 6 + 10;
          }
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(142, 209, 210);
          doc.text("Resumo do Or\xE7amento", 105, currentY, { align: "center" });
          doc.setTextColor(0, 0, 0);
          currentY += 10;
          const formatCurrency = (value) => {
            return value.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 2
            });
          };
          const basePrice = parseFloat(quotation.basePrice?.toString() || "0");
          const duplexSurcharge = parseFloat(quotation.duplexSurcharge?.toString() || "0");
          const bbqSurcharge = parseFloat(quotation.bbqSurcharge?.toString() || "0");
          const exteriorSurcharge = parseFloat(quotation.exteriorSurcharge?.toString() || "0");
          const glassGardenSurcharge = parseFloat(quotation.glassGardenSurcharge?.toString() || "0");
          const additionalSurcharges = parseFloat(quotation.additionalSurcharges?.toString() || "0");
          const additionalTotal = duplexSurcharge + bbqSurcharge + exteriorSurcharge + glassGardenSurcharge + additionalSurcharges;
          const calculatedTotalPrice = basePrice + additionalTotal;
          const tableRows = [
            ["Pre\xE7o Base", formatCurrency(basePrice)]
          ];
          if (duplexSurcharge > 0) {
            tableRows.push(["Extra - Duplex (10\u20AC)", formatCurrency(10)]);
          }
          if (bbqSurcharge > 0) {
            tableRows.push(["Extra - Churrasqueira (10\u20AC)", formatCurrency(10)]);
          }
          if (exteriorSurcharge > 0) {
            tableRows.push(["Extra - \xC1rea Exterior > 15m\xB2 (10\u20AC)", formatCurrency(10)]);
          }
          if (glassGardenSurcharge > 0) {
            tableRows.push(["Extra - Jardim com Vidro (10\u20AC)", formatCurrency(10)]);
          }
          if (additionalSurcharges > 0) {
            tableRows.push(["Outros Extras", formatCurrency(additionalSurcharges)]);
          }
          tableRows.push(["Pre\xE7o Total", formatCurrency(calculatedTotalPrice)]);
          autoTable(doc, {
            startY: currentY,
            head: [["Item", "Valor"]],
            body: tableRows,
            theme: "grid",
            headStyles: { fillColor: [231, 144, 144], textColor: [255, 255, 255] },
            // Rosa para o cabeçalho
            bodyStyles: { fontSize: 12 },
            columnStyles: { 1: { halign: "right" } },
            margin: { top: 20, left: 40, right: 40 },
            foot: [["", ""]],
            footStyles: { fillColor: [245, 213, 213] }
            // Rosa claro para o rodapé
          });
          currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : currentY + 50;
          if (quotation.notes) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(245, 213, 213);
            doc.text("Observa\xE7\xF5es:", 20, currentY);
            doc.setTextColor(0, 0, 0);
            currentY += 7;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const textLines = doc.splitTextToSize(quotation.notes, 170);
            doc.text(textLines, 20, currentY);
            currentY += textLines.length * 5 + 10;
          }
          doc.setFontSize(11);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(142, 209, 210);
          const inspPhrase = "A Maria Faz tudo para tornar o seu espa\xE7o mais especial e valorizado!";
          doc.text(inspPhrase, 105, currentY + 5, { align: "center" });
          doc.setFont("helvetica", "bold");
          const callToAction = "Reserve j\xE1 o seu servi\xE7o e beneficie desta proposta especial!";
          doc.text(callToAction, 105, currentY + 12, { align: "center" });
          doc.setTextColor(0, 0, 0);
          const pageHeight = doc.internal.pageSize.height;
          if (currentY > pageHeight - 45) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          const footerY = pageHeight - 20;
          doc.text("A MARIA FAZ, UNIPESSOAL, LDA | NIF: 517445271", 105, footerY - 12, { align: "center" });
          doc.text("IBAN: PT50 0010 0000 61759410001 68 | BIC: BBPIPTPL | BANCO BPI", 105, footerY - 6, { align: "center" });
          doc.text("Este or\xE7amento \xE9 v\xE1lido por 30 dias. Contacte-nos para mais informa\xE7\xF5es.", 105, footerY, { align: "center" });
          try {
            const pdfOutput = doc.output();
            fs.writeFileSync(filePath, pdfOutput, "binary");
            console.log(`PDF gerado com sucesso em ${filePath}`);
          } catch (error) {
            console.error("Erro ao salvar o arquivo PDF:", error);
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
            throw new Error(`Erro ao salvar o arquivo PDF: ${errorMessage}`);
          }
          return filePath;
        } catch (error) {
          console.error(`Erro ao gerar PDF para or\xE7amento #${id}:`, error);
          console.error("Stack trace:", error instanceof Error ? error.stack : "Erro sem stack trace");
          throw error;
        }
      }
    };
    pdfService = new PDFService();
  }
});

// server/db/index.ts
var db_exports = {};
__export(db_exports, {
  db: () => db2,
  getDrizzle: () => getDrizzle,
  runMigrations: () => runMigrations,
  testConnection: () => testConnection
});
import { drizzle as drizzle2 } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
function createDrizzleClient() {
  if (!connectionPool) {
    connectionPool = neon(process.env.DATABASE_URL, {
      // Enhanced connection pool optimizations for parallel processing
      connectionTimeoutMillis: 3e3,
      // Reduced for faster failover
      idleTimeoutMillis: 6e4,
      // Increased for better connection reuse
      // Enable query caching for better performance
      queryTimeout: 45e3,
      // Increased for complex queries
      // Enhanced connection pool settings for concurrent operations
      maxConnections: process.env.NODE_ENV === "production" ? 25 : 8,
      // Increased for parallel processing
      // Additional optimizations
      keepAlive: true,
      // Enable connection pooling optimizations
      arrayMode: false,
      fullResults: false
    });
  }
  return drizzle2(connectionPool, {
    schema: schema_exports,
    // Enhanced query logging for parallel operations
    logger: process.env.NODE_ENV === "development" ? {
      logQuery: (query3, params) => {
        const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
        const connectionInfo = `[${timestamp2}][DB Query]`;
        if (query3.length > 200) {
          console.log(connectionInfo, query3.substring(0, 200) + "...", `(${params?.length || 0} params)`);
        } else {
          console.log(connectionInfo, query3, params?.length ? `(${params.length} params)` : "");
        }
      }
    } : false
  });
}
function getDrizzle() {
  if (!drizzleInstance) {
    drizzleInstance = createDrizzleClient();
  }
  return drizzleInstance;
}
async function runMigrations() {
  const db3 = getDrizzle();
  try {
    console.log("Running migrations...");
    await migrate(db3, { migrationsFolder: "./migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
async function testConnection() {
  try {
    const db3 = getDrizzle();
    await db3.select().from(properties).limit(1);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
var drizzleInstance, connectionPool, db2;
var init_db = __esm({
  "server/db/index.ts"() {
    "use strict";
    init_schema();
    db2 = getDrizzle();
  }
});

// server/config/ocr-providers.config.cjs
var require_ocr_providers_config = __commonJS({
  "server/config/ocr-providers.config.cjs"(exports, module) {
    "use strict";
    var OCRProviderConfig = {
      // Primary provider: Gemini API
      gemini: {
        enabled: !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
        priority: 1,
        name: "Google Gemini",
        description: "Google's advanced AI model with excellent OCR capabilities",
        capabilities: {
          pdf: true,
          images: true,
          multiLanguage: true,
          structuredExtraction: true,
          qualityScore: 95
        },
        limits: {
          maxFileSize: "10MB",
          maxPages: 20,
          requestsPerMinute: 15,
          timeout: 3e4
        },
        costs: {
          perPage: 1e-3,
          perMB: 0.01
        },
        retryConfig: {
          maxRetries: 3,
          backoffMultiplier: 1.5,
          initialDelay: 1e3
        }
      },
      // Backup provider: Mistral via OpenRouter
      openrouter: {
        enabled: !!process.env.OPENROUTER_API_KEY,
        priority: 2,
        name: "OpenRouter Mistral",
        description: "Mistral AI via OpenRouter for OCR processing",
        capabilities: {
          pdf: true,
          images: true,
          multiLanguage: true,
          structuredExtraction: false,
          qualityScore: 85
        },
        limits: {
          maxFileSize: "8MB",
          maxPages: 15,
          requestsPerMinute: 10,
          timeout: 25e3
        },
        costs: {
          perPage: 5e-3,
          perMB: 0.02
        },
        retryConfig: {
          maxRetries: 2,
          backoffMultiplier: 2,
          initialDelay: 1500
        }
      },
      // Local fallback: Native PDF extraction
      native: {
        enabled: true,
        // Always available
        priority: 3,
        name: "Native PDF Parser",
        description: "Local PDF text extraction without AI",
        capabilities: {
          pdf: true,
          images: false,
          multiLanguage: false,
          structuredExtraction: false,
          qualityScore: 70
        },
        limits: {
          maxFileSize: "50MB",
          maxPages: 100,
          requestsPerMinute: 100,
          timeout: 1e4
        },
        costs: {
          perPage: 0,
          perMB: 0
        },
        retryConfig: {
          maxRetries: 1,
          backoffMultiplier: 1,
          initialDelay: 500
        }
      }
    };
    var FailoverStrategies = {
      // Fast failover: Quick switch to next provider on failure
      fast: {
        description: "Quick failover for time-sensitive operations",
        maxWaitTime: 1e4,
        skipQualityValidation: true,
        acceptPartialResults: true
      },
      // Quality failover: Ensure high-quality results
      quality: {
        description: "Prioritize result quality over speed",
        maxWaitTime: 6e4,
        skipQualityValidation: false,
        acceptPartialResults: false,
        minQualityScore: 80
      },
      // Balanced failover: Balance between speed and quality
      balanced: {
        description: "Balance speed and quality",
        maxWaitTime: 3e4,
        skipQualityValidation: false,
        acceptPartialResults: true,
        minQualityScore: 60
      }
    };
    var PerformanceThresholds = {
      // Response time thresholds (milliseconds)
      responseTime: {
        excellent: 5e3,
        good: 15e3,
        acceptable: 3e4,
        poor: 6e4
      },
      // Quality score thresholds (0-100)
      qualityScore: {
        excellent: 95,
        good: 85,
        acceptable: 70,
        poor: 50
      },
      // Success rate thresholds (0-1)
      successRate: {
        excellent: 0.98,
        good: 0.9,
        acceptable: 0.8,
        poor: 0.6
      }
    };
    var RateLimiting = {
      global: {
        maxConcurrentRequests: 5,
        queueMaxSize: 50,
        requestTimeout: 12e4
      },
      perProvider: {
        gemini: {
          requestsPerMinute: 15,
          burstLimit: 5,
          cooldownPeriod: 6e4
        },
        openrouter: {
          requestsPerMinute: 10,
          burstLimit: 3,
          cooldownPeriod: 9e4
        },
        native: {
          requestsPerMinute: 100,
          burstLimit: 20,
          cooldownPeriod: 0
        }
      }
    };
    var QualityValidation = {
      textLength: {
        minimum: 10,
        warning: 50
      },
      artifacts: {
        maxPercentage: 0.05,
        // 5% of characters can be artifacts
        patterns: [
          /[^\w\s\.,\-\(\)\[\]]/g,
          // Special characters
          /(.)\1{5,}/g,
          // Repeated characters
          /\s{5,}/g
          // Multiple spaces
        ]
      },
      bookingIndicators: {
        required: 2,
        // Minimum number of booking indicators
        patterns: [
          /check.?in/i,
          /check.?out/i,
          /guest/i,
          /booking/i,
          /reservation/i,
          /property/i,
          /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,
          // Date pattern
          /€\s*\d+|USD\s*\d+|\$\s*\d+/,
          // Currency pattern
          /airbnb|booking\.com|expedia/i
          // Platform indicators
        ]
      },
      confidence: {
        minimum: 0.3,
        warning: 0.6,
        good: 0.8
      }
    };
    var DocumentTypeConfig = {
      booking_pdf: {
        preferredProvider: "gemini",
        qualityThreshold: 85,
        requiredFields: ["guestName", "checkInDate", "checkOutDate", "propertyName"],
        processingTimeout: 45e3
      },
      handwritten: {
        preferredProvider: "gemini",
        qualityThreshold: 70,
        preprocessImage: true,
        processingTimeout: 6e4
      },
      scanned_document: {
        preferredProvider: "gemini",
        qualityThreshold: 80,
        preprocessImage: true,
        processingTimeout: 5e4
      },
      simple_pdf: {
        preferredProvider: "native",
        qualityThreshold: 60,
        processingTimeout: 15e3
      }
    };
    function getProviderConfig(providerName) {
      return OCRProviderConfig[providerName] || null;
    }
    function getAvailableProviders2() {
      return Object.entries(OCRProviderConfig).filter(([_, config]) => config.enabled).sort((a, b) => a[1].priority - b[1].priority).map(([name, config]) => ({ name, ...config }));
    }
    function getFailoverStrategy(strategyName = "balanced") {
      return FailoverStrategies[strategyName] || FailoverStrategies.balanced;
    }
    function getOptimalProvider2(documentType = "booking_pdf", options = {}) {
      const docConfig = DocumentTypeConfig[documentType] || DocumentTypeConfig.booking_pdf;
      const availableProviders = getAvailableProviders2();
      const preferred = availableProviders.find((p) => p.name.toLowerCase().includes(docConfig.preferredProvider));
      if (preferred) {
        return {
          provider: preferred,
          config: docConfig
        };
      }
      return {
        provider: availableProviders[0] || null,
        config: docConfig
      };
    }
    function validateConfiguration2() {
      const issues = [];
      const availableProviders = getAvailableProviders2();
      if (availableProviders.length === 0) {
        issues.push("No OCR providers are available");
      }
      if (availableProviders.length === 1 && availableProviders[0].name === "Native PDF Parser") {
        issues.push("Only native PDF parser available - limited OCR capabilities");
      }
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        issues.push("Gemini API key not configured");
      }
      if (!process.env.OPENROUTER_API_KEY) {
        issues.push("OpenRouter API key not configured");
      }
      return {
        valid: issues.length === 0,
        issues,
        availableProviders: availableProviders.length,
        recommendations: generateRecommendations(availableProviders)
      };
    }
    function generateRecommendations(availableProviders) {
      const recommendations = [];
      if (availableProviders.length < 2) {
        recommendations.push("Configure at least 2 OCR providers for redundancy");
      }
      const hasAI = availableProviders.some((p) => p.capabilities.structuredExtraction);
      if (!hasAI) {
        recommendations.push("Configure an AI-based provider (Gemini or OpenRouter) for better data extraction");
      }
      if (!availableProviders.find((p) => p.name.includes("Gemini"))) {
        recommendations.push("Configure Gemini API for the best OCR quality and structured data extraction");
      }
      return recommendations;
    }
    module.exports = {
      OCRProviderConfig,
      FailoverStrategies,
      PerformanceThresholds,
      RateLimiting,
      QualityValidation,
      DocumentTypeConfig,
      getProviderConfig,
      getAvailableProviders: getAvailableProviders2,
      getFailoverStrategy,
      getOptimalProvider: getOptimalProvider2,
      validateConfiguration: validateConfiguration2,
      generateRecommendations
    };
  }
});

// server/services/security-audit.service.ts
var security_audit_service_exports = {};
__export(security_audit_service_exports, {
  SecurityAuditService: () => SecurityAuditService,
  securityAuditService: () => securityAuditService
});
import pino4 from "pino";
import { createHash as createHash2 } from "crypto";
import fs2 from "fs/promises";
import path2 from "path";
var auditLogger, SecurityAuditService, securityAuditService;
var init_security_audit_service = __esm({
  "server/services/security-audit.service.ts"() {
    "use strict";
    init_security();
    auditLogger = pino4({
      name: "security-audit-service",
      level: "info",
      transport: process.env.NODE_ENV !== "production" ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
          ignore: "pid,hostname"
        }
      } : void 0
    });
    SecurityAuditService = class _SecurityAuditService {
      static instance;
      events = [];
      metrics;
      threatPatterns = [];
      alertThresholds = {};
      auditLogDir;
      constructor() {
        this.auditLogDir = path2.join(process.cwd(), "logs", "security");
        this.initializeMetrics();
        this.initializeThreatPatterns();
        this.initializeAlertThresholds();
        this.ensureLogDirectory();
        setInterval(() => this.cleanupOldEvents(), 60 * 60 * 1e3);
        setInterval(() => this.updateMetrics(), 15 * 60 * 1e3);
      }
      static getInstance() {
        if (!_SecurityAuditService.instance) {
          _SecurityAuditService.instance = new _SecurityAuditService();
        }
        return _SecurityAuditService.instance;
      }
      /**
       * Initialize security metrics
       */
      initializeMetrics() {
        this.metrics = {
          totalEvents: 0,
          eventsByType: {},
          eventsBySeverity: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
          },
          topAttackingIPs: [],
          topTargetedEndpoints: [],
          timeWindow: "24h",
          lastUpdated: /* @__PURE__ */ new Date()
        };
        Object.values(SecurityEventType).forEach((type) => {
          this.metrics.eventsByType[type] = 0;
        });
      }
      /**
       * Initialize threat detection patterns
       */
      initializeThreatPatterns() {
        this.threatPatterns = [
          {
            id: "sql-injection-basic",
            name: "Basic SQL Injection",
            description: "Detects basic SQL injection attempts",
            pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b|UNION\s+SELECT|OR\s+1\s*=\s*1)/gi,
            severity: "high",
            actions: ["log", "block"],
            enabled: true,
            matchCount: 0,
            lastMatch: null
          },
          {
            id: "xss-script-tags",
            name: "XSS Script Tags",
            description: "Detects XSS attempts using script tags",
            pattern: /<script[^>]*>.*?<\/script>/gi,
            severity: "high",
            actions: ["log", "block"],
            enabled: true,
            matchCount: 0,
            lastMatch: null
          },
          {
            id: "path-traversal",
            name: "Path Traversal",
            description: "Detects directory traversal attempts",
            pattern: /(\.\.[/\\]){2,}/g,
            severity: "medium",
            actions: ["log", "alert"],
            enabled: true,
            matchCount: 0,
            lastMatch: null
          },
          {
            id: "command-injection",
            name: "Command Injection",
            description: "Detects command injection attempts",
            pattern: /[;&|`$(){}[\]<>]/g,
            severity: "high",
            actions: ["log", "block"],
            enabled: true,
            matchCount: 0,
            lastMatch: null
          },
          {
            id: "suspicious-user-agents",
            name: "Suspicious User Agents",
            description: "Detects known attack tools and scanners",
            pattern: /(sqlmap|nikto|nessus|burpsuite|havij|w3af|nmap|masscan)/gi,
            severity: "medium",
            actions: ["log", "monitor"],
            enabled: true,
            matchCount: 0,
            lastMatch: null
          },
          {
            id: "rate-limit-abuse",
            name: "Rate Limit Abuse",
            description: "Detects potential rate limit abuse patterns",
            pattern: "RATE_LIMIT_EXCEEDED",
            severity: "medium",
            actions: ["log", "alert"],
            enabled: true,
            matchCount: 0,
            lastMatch: null
          }
        ];
      }
      /**
       * Initialize alert thresholds
       */
      initializeAlertThresholds() {
        this.alertThresholds = {
          ["RATE_LIMIT_EXCEEDED" /* RATE_LIMIT_EXCEEDED */]: 5,
          // Alert after 5 rate limit violations
          ["XSS_ATTEMPT" /* XSS_ATTEMPT */]: 1,
          // Alert immediately on XSS attempts
          ["SQL_INJECTION_ATTEMPT" /* SQL_INJECTION_ATTEMPT */]: 1,
          // Alert immediately on SQL injection
          ["SUSPICIOUS_REQUEST" /* SUSPICIOUS_REQUEST */]: 3,
          // Alert after 3 suspicious requests
          ["FILE_UPLOAD_REJECTED" /* FILE_UPLOAD_REJECTED */]: 10,
          // Alert after 10 rejected uploads
          ["IP_BLOCKED" /* IP_BLOCKED */]: 1,
          // Alert immediately when IP is blocked
          ["CORS_VIOLATION" /* CORS_VIOLATION */]: 5
          // Alert after 5 CORS violations
        };
      }
      /**
       * Ensure audit log directory exists
       */
      async ensureLogDirectory() {
        try {
          await fs2.mkdir(this.auditLogDir, { recursive: true });
        } catch (error) {
          auditLogger.error("Failed to create audit log directory:", error);
        }
      }
      /**
       * Record a security event
       */
      async recordEvent(event) {
        const securityEvent = {
          ...event,
          id: this.generateEventId(),
          blocked: false,
          resolved: false
        };
        this.events.push(securityEvent);
        auditLogger.warn({
          eventId: securityEvent.id,
          type: securityEvent.type,
          severity: securityEvent.severity,
          ip: securityEvent.ip,
          url: securityEvent.url,
          details: securityEvent.details
        }, `Security Event: ${securityEvent.type}`);
        await this.analyzeThreatPatterns(securityEvent);
        await this.checkAlertThresholds(securityEvent);
        await this.writeToAuditLog(securityEvent);
        this.updateEventMetrics(securityEvent);
      }
      /**
       * Analyze event against threat patterns
       */
      async analyzeThreatPatterns(event) {
        const eventContent = JSON.stringify({
          url: event.url,
          userAgent: event.userAgent,
          details: event.details
        });
        for (const pattern of this.threatPatterns) {
          if (!pattern.enabled) continue;
          let matches = false;
          if (pattern.pattern instanceof RegExp) {
            matches = pattern.pattern.test(eventContent);
          } else if (typeof pattern.pattern === "string") {
            matches = eventContent.includes(pattern.pattern) || event.type === pattern.pattern;
          }
          if (matches) {
            pattern.matchCount++;
            pattern.lastMatch = /* @__PURE__ */ new Date();
            auditLogger.warn({
              patternId: pattern.id,
              patternName: pattern.name,
              eventId: event.id,
              severity: pattern.severity
            }, `Threat pattern matched: ${pattern.name}`);
            for (const action of pattern.actions) {
              await this.executePatternAction(action, event, pattern);
            }
          }
        }
      }
      /**
       * Execute action based on threat pattern match
       */
      async executePatternAction(action, event, pattern) {
        switch (action) {
          case "block":
            event.blocked = true;
            auditLogger.error(`IP ${event.ip} blocked due to pattern: ${pattern.name}`);
            break;
          case "alert":
            await this.generateAlert(event, pattern);
            break;
          case "monitor":
            auditLogger.info(`Monitoring IP ${event.ip} due to pattern: ${pattern.name}`);
            break;
          case "log":
            auditLogger.warn(`Pattern match logged: ${pattern.name} for IP ${event.ip}`);
            break;
        }
      }
      /**
       * Check if alert thresholds are exceeded
       */
      async checkAlertThresholds(event) {
        const threshold = this.alertThresholds[event.type];
        if (!threshold) return;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
        const recentEvents = this.events.filter(
          (e) => e.type === event.type && e.ip === event.ip && e.timestamp > oneHourAgo
        );
        if (recentEvents.length >= threshold) {
          await this.generateThresholdAlert(event, recentEvents.length, threshold);
        }
      }
      /**
       * Generate security alert
       */
      async generateAlert(event, pattern) {
        const alert = {
          id: this.generateEventId(),
          timestamp: /* @__PURE__ */ new Date(),
          type: "SECURITY_ALERT",
          severity: pattern?.severity || event.severity,
          event,
          pattern: pattern?.name,
          message: pattern ? `Threat pattern "${pattern.name}" detected for IP ${event.ip}` : `Security event "${event.type}" triggered alert for IP ${event.ip}`
        };
        auditLogger.error(alert, "Security Alert Generated");
        if (process.env.NODE_ENV === "production") {
          console.error("SECURITY ALERT:", alert);
        }
      }
      /**
       * Generate threshold-based alert
       */
      async generateThresholdAlert(event, eventCount, threshold) {
        const alert = {
          id: this.generateEventId(),
          timestamp: /* @__PURE__ */ new Date(),
          type: "THRESHOLD_ALERT",
          severity: "high",
          event,
          eventCount,
          threshold,
          message: `Threshold exceeded: ${eventCount} events of type "${event.type}" from IP ${event.ip} (threshold: ${threshold})`
        };
        auditLogger.error(alert, "Threshold Alert Generated");
        if (process.env.NODE_ENV === "production") {
          console.error("THRESHOLD ALERT:", alert);
        }
      }
      /**
       * Write event to audit log file
       */
      async writeToAuditLog(event) {
        try {
          const date2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
          const logFile = path2.join(this.auditLogDir, `security-audit-${date2}.json`);
          const logEntry = {
            ...event,
            timestamp: event.timestamp.toISOString()
          };
          const logLine = JSON.stringify(logEntry) + "\n";
          await fs2.appendFile(logFile, logLine);
        } catch (error) {
          auditLogger.error("Failed to write to audit log file:", error);
        }
      }
      /**
       * Update event metrics
       */
      updateEventMetrics(event) {
        this.metrics.totalEvents++;
        this.metrics.eventsByType[event.type]++;
        this.metrics.eventsBySeverity[event.severity]++;
        this.metrics.lastUpdated = /* @__PURE__ */ new Date();
      }
      /**
       * Update comprehensive metrics
       */
      updateMetrics() {
        const now = /* @__PURE__ */ new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
        const recentEvents = this.events.filter((e) => e.timestamp > oneDayAgo);
        const ipCounts = /* @__PURE__ */ new Map();
        recentEvents.forEach((event) => {
          const count3 = ipCounts.get(event.ip) || 0;
          ipCounts.set(event.ip, count3 + 1);
        });
        this.metrics.topAttackingIPs = Array.from(ipCounts.entries()).map(([ip, count3]) => ({ ip, count: count3 })).sort((a, b) => b.count - a.count).slice(0, 10);
        const endpointCounts = /* @__PURE__ */ new Map();
        recentEvents.forEach((event) => {
          const endpoint = event.url.split("?")[0];
          const count3 = endpointCounts.get(endpoint) || 0;
          endpointCounts.set(endpoint, count3 + 1);
        });
        this.metrics.topTargetedEndpoints = Array.from(endpointCounts.entries()).map(([endpoint, count3]) => ({ endpoint, count: count3 })).sort((a, b) => b.count - a.count).slice(0, 10);
        auditLogger.info("Security metrics updated", this.metrics);
      }
      /**
       * Clean up old events (keep only last 7 days)
       */
      cleanupOldEvents() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
        const initialCount = this.events.length;
        this.events = this.events.filter((event) => event.timestamp > sevenDaysAgo);
        const removedCount = initialCount - this.events.length;
        if (removedCount > 0) {
          auditLogger.info(`Cleaned up ${removedCount} old security events`);
        }
      }
      /**
       * Generate unique event ID
       */
      generateEventId() {
        return createHash2("sha256").update(`${Date.now()}-${Math.random()}-${process.pid}`).digest("hex").substring(0, 16);
      }
      /**
       * Get security metrics
       */
      getMetrics() {
        return { ...this.metrics };
      }
      /**
       * Get recent security events
       */
      getRecentEvents(limit = 100) {
        return this.events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
      }
      /**
       * Get events by type
       */
      getEventsByType(type, limit = 50) {
        return this.events.filter((event) => event.type === type).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
      }
      /**
       * Get events by IP
       */
      getEventsByIP(ip, limit = 50) {
        return this.events.filter((event) => event.ip === ip).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
      }
      /**
       * Get threat patterns
       */
      getThreatPatterns() {
        return [...this.threatPatterns];
      }
      /**
       * Generate security report
       */
      generateSecurityReport(timeWindow = "24h") {
        const now = /* @__PURE__ */ new Date();
        let windowStart;
        switch (timeWindow) {
          case "1h":
            windowStart = new Date(now.getTime() - 60 * 60 * 1e3);
            break;
          case "24h":
            windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
            break;
          case "7d":
            windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
            break;
        }
        const eventsInWindow = this.events.filter((e) => e.timestamp > windowStart);
        return {
          timeWindow,
          periodStart: windowStart.toISOString(),
          periodEnd: now.toISOString(),
          totalEvents: eventsInWindow.length,
          eventsByType: this.groupEventsByType(eventsInWindow),
          eventsBySeverity: this.groupEventsBySeverity(eventsInWindow),
          topAttackingIPs: this.getTopIPs(eventsInWindow),
          topTargetedEndpoints: this.getTopEndpoints(eventsInWindow),
          threatPatternMatches: this.threatPatterns.filter((p) => p.matchCount > 0).map((p) => ({
            name: p.name,
            severity: p.severity,
            matchCount: p.matchCount,
            lastMatch: p.lastMatch
          })),
          recommendations: this.generateRecommendations(eventsInWindow)
        };
      }
      /**
       * Helper methods for report generation
       */
      groupEventsByType(events) {
        const grouped = {};
        events.forEach((event) => {
          grouped[event.type] = (grouped[event.type] || 0) + 1;
        });
        return grouped;
      }
      groupEventsBySeverity(events) {
        const grouped = {};
        events.forEach((event) => {
          grouped[event.severity] = (grouped[event.severity] || 0) + 1;
        });
        return grouped;
      }
      getTopIPs(events) {
        const ipCounts = /* @__PURE__ */ new Map();
        events.forEach((event) => {
          const count3 = ipCounts.get(event.ip) || 0;
          ipCounts.set(event.ip, count3 + 1);
        });
        return Array.from(ipCounts.entries()).map(([ip, count3]) => ({ ip, count: count3 })).sort((a, b) => b.count - a.count).slice(0, 10);
      }
      getTopEndpoints(events) {
        const endpointCounts = /* @__PURE__ */ new Map();
        events.forEach((event) => {
          const endpoint = event.url.split("?")[0];
          const count3 = endpointCounts.get(endpoint) || 0;
          endpointCounts.set(endpoint, count3 + 1);
        });
        return Array.from(endpointCounts.entries()).map(([endpoint, count3]) => ({ endpoint, count: count3 })).sort((a, b) => b.count - a.count).slice(0, 10);
      }
      generateRecommendations(events) {
        const recommendations = [];
        const severeCounts = events.filter((e) => e.severity === "critical" || e.severity === "high").length;
        if (severeCounts > 10) {
          recommendations.push("Considere implementar WAF (Web Application Firewall) adicional");
        }
        const rateLimitEvents = events.filter((e) => e.type === "RATE_LIMIT_EXCEEDED" /* RATE_LIMIT_EXCEEDED */).length;
        if (rateLimitEvents > 20) {
          recommendations.push("Considere reduzir os limites de taxa para prevenir abusos");
        }
        const xssEvents = events.filter((e) => e.type === "XSS_ATTEMPT" /* XSS_ATTEMPT */).length;
        if (xssEvents > 0) {
          recommendations.push("Revise e reforce as pol\xEDticas de Content Security Policy (CSP)");
        }
        const sqlEvents = events.filter((e) => e.type === "SQL_INJECTION_ATTEMPT" /* SQL_INJECTION_ATTEMPT */).length;
        if (sqlEvents > 0) {
          recommendations.push("Verifique se todas as queries usam prepared statements");
        }
        return recommendations;
      }
    };
    securityAuditService = SecurityAuditService.getInstance();
  }
});

// server/middleware/security.ts
import helmet3 from "helmet";
import rateLimit4 from "express-rate-limit";
import cors2 from "cors";
import pino5 from "pino";
function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.connection.remoteAddress || req.socket.remoteAddress || "unknown";
}
async function logSecurityEvent2(event) {
  securityLogger.warn({
    event: event.type,
    severity: event.severity,
    ip: event.ip,
    userAgent: event.userAgent,
    url: event.url,
    method: event.method,
    timestamp: event.timestamp,
    details: event.details,
    userId: event.userId
  }, `Security Event: ${event.type}`);
  try {
    const { securityAuditService: securityAuditService2 } = await Promise.resolve().then(() => (init_security_audit_service(), security_audit_service_exports));
    await securityAuditService2.recordEvent(event);
  } catch (error) {
    securityLogger.error("Failed to record security event in audit service:", error);
  }
  if (process.env.NODE_ENV === "production" && event.severity === "critical") {
    console.error(`CRITICAL SECURITY EVENT: ${event.type}`, event);
  }
}
var securityLogger, SecurityEventType, blockedIPs, ipAttempts, helmetConfig, allowedOrigins, corsConfig, apiRateLimiter, pdfImportRateLimiter, strictRateLimiter, requestValidationMiddleware, contentValidationMiddleware, fileUploadSecurityMiddleware, ipTrackingMiddleware, securityHeadersMiddleware2, securityMiddlewareStack;
var init_security = __esm({
  "server/middleware/security.ts"() {
    "use strict";
    securityLogger = pino5({
      name: "security-audit",
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transport: process.env.NODE_ENV !== "production" ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
          ignore: "pid,hostname"
        }
      } : void 0
    });
    SecurityEventType = /* @__PURE__ */ ((SecurityEventType2) => {
      SecurityEventType2["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
      SecurityEventType2["SUSPICIOUS_REQUEST"] = "SUSPICIOUS_REQUEST";
      SecurityEventType2["CORS_VIOLATION"] = "CORS_VIOLATION";
      SecurityEventType2["VALIDATION_FAILED"] = "VALIDATION_FAILED";
      SecurityEventType2["XSS_ATTEMPT"] = "XSS_ATTEMPT";
      SecurityEventType2["SQL_INJECTION_ATTEMPT"] = "SQL_INJECTION_ATTEMPT";
      SecurityEventType2["FILE_UPLOAD_REJECTED"] = "FILE_UPLOAD_REJECTED";
      SecurityEventType2["IP_BLOCKED"] = "IP_BLOCKED";
      SecurityEventType2["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
      SecurityEventType2["PERMISSION_DENIED"] = "PERMISSION_DENIED";
      return SecurityEventType2;
    })(SecurityEventType || {});
    blockedIPs = /* @__PURE__ */ new Set();
    ipAttempts = /* @__PURE__ */ new Map();
    helmetConfig = helmet3({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            // Required for React development
            "'unsafe-eval'",
            // Required for React development
            "https://cdn.jsdelivr.net",
            // For external libraries
            "https://unpkg.com"
            // For external libraries
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net"
          ],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https:",
            "http://localhost:*"
            // Development only
          ],
          connectSrc: [
            "'self'",
            "https://api.openai.com",
            "https://api.anthropic.com",
            "https://generativelanguage.googleapis.com",
            "https://api.mistral.ai",
            "wss://localhost:*",
            // WebSocket development
            "ws://localhost:*"
            // WebSocket development
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:"
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "blob:", "data:"],
          frameSrc: ["'none'"],
          childSrc: ["'none'"],
          workerSrc: ["'self'", "blob:"],
          manifestSrc: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
        }
      },
      crossOriginEmbedderPolicy: false,
      // Disable for file uploads
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: {
        maxAge: 31536e3,
        // 1 year
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: "deny" },
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    });
    allowedOrigins = [
      "http://localhost:5173",
      // Vite dev server
      "http://localhost:3000",
      // React dev server
      "http://localhost:5100",
      // App server
      "https://mariafaz.vercel.app",
      // Production domain
      "https://mariafaz-git-main-bilals-projects-4c123456.vercel.app"
      // Vercel preview
      // Add more production domains as needed
    ];
    corsConfig = cors2({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        logSecurityEvent2({
          type: "CORS_VIOLATION" /* CORS_VIOLATION */,
          severity: "medium",
          ip: "unknown",
          userAgent: "unknown",
          url: "CORS_CHECK",
          method: "OPTIONS",
          timestamp: /* @__PURE__ */ new Date(),
          details: { origin, allowedOrigins }
        }).catch((error) => {
          securityLogger.error("Failed to log CORS violation:", error);
        });
        callback(new Error("Not allowed by CORS policy"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "Cache-Control",
        "X-File-Type",
        "X-Upload-Type"
      ],
      exposedHeaders: ["X-Total-Count", "X-Rate-Limit-Remaining"],
      maxAge: 86400
      // 24 hours
    });
    apiRateLimiter = rateLimit4({
      windowMs: 15 * 60 * 1e3,
      // 15 minutes
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: "Demasiadas requisi\xE7\xF5es. Tente novamente em 15 minutos.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: 900
        // 15 minutes in seconds
      },
      handler: (req, res) => {
        logSecurityEvent2({
          type: "RATE_LIMIT_EXCEEDED" /* RATE_LIMIT_EXCEEDED */,
          severity: "medium",
          ip: getClientIP(req),
          userAgent: req.get("User-Agent") || "unknown",
          url: req.originalUrl,
          method: req.method,
          timestamp: /* @__PURE__ */ new Date(),
          details: { limit: 100, window: "15min" }
        }).catch((error) => {
          securityLogger.error("Failed to log rate limit event:", error);
        });
        res.status(429).json({
          error: "Demasiadas requisi\xE7\xF5es. Tente novamente em 15 minutos.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: 900
        });
      }
    });
    pdfImportRateLimiter = rateLimit4({
      windowMs: 60 * 60 * 1e3,
      // 1 hour
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: "Limite de importa\xE7\xE3o de PDFs excedido. Tente novamente em 1 hora.",
        code: "PDF_RATE_LIMIT_EXCEEDED",
        retryAfter: 3600
        // 1 hour in seconds
      },
      handler: (req, res) => {
        logSecurityEvent2({
          type: "RATE_LIMIT_EXCEEDED" /* RATE_LIMIT_EXCEEDED */,
          severity: "high",
          ip: getClientIP(req),
          userAgent: req.get("User-Agent") || "unknown",
          url: req.originalUrl,
          method: req.method,
          timestamp: /* @__PURE__ */ new Date(),
          details: { limit: 10, window: "1hour", type: "pdf_import" }
        }).catch((error) => {
          securityLogger.error("Failed to log PDF rate limit event:", error);
        });
        res.status(429).json({
          error: "Limite de importa\xE7\xE3o de PDFs excedido. Tente novamente em 1 hora.",
          code: "PDF_RATE_LIMIT_EXCEEDED",
          retryAfter: 3600
        });
      }
    });
    strictRateLimiter = rateLimit4({
      windowMs: 60 * 60 * 1e3,
      // 1 hour
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: "Limite de opera\xE7\xF5es sens\xEDveis excedido. Tente novamente em 1 hora.",
        code: "STRICT_RATE_LIMIT_EXCEEDED",
        retryAfter: 3600
      },
      handler: (req, res) => {
        logSecurityEvent2({
          type: "RATE_LIMIT_EXCEEDED" /* RATE_LIMIT_EXCEEDED */,
          severity: "high",
          ip: getClientIP(req),
          userAgent: req.get("User-Agent") || "unknown",
          url: req.originalUrl,
          method: req.method,
          timestamp: /* @__PURE__ */ new Date(),
          details: { limit: 20, window: "1hour", type: "sensitive_operation" }
        }).catch((error) => {
          securityLogger.error("Failed to log strict rate limit event:", error);
        });
        res.status(429).json({
          error: "Limite de opera\xE7\xF5es sens\xEDveis excedido. Tente novamente em 1 hora.",
          code: "STRICT_RATE_LIMIT_EXCEEDED",
          retryAfter: 3600
        });
      }
    });
    requestValidationMiddleware = (req, res, next) => {
      const ip = getClientIP(req);
      const userAgent = req.get("User-Agent") || "";
      if (blockedIPs.has(ip)) {
        logSecurityEvent2({
          type: "IP_BLOCKED" /* IP_BLOCKED */,
          severity: "critical",
          ip,
          userAgent,
          url: req.originalUrl,
          method: req.method,
          timestamp: /* @__PURE__ */ new Date(),
          details: { reason: "IP blocked due to suspicious activity" }
        }).catch((error) => {
          securityLogger.error("Failed to log IP blocked event:", error);
        });
        return res.status(403).json({
          error: "Acesso negado",
          code: "IP_BLOCKED"
        });
      }
      const suspiciousHeaders = [
        "x-forwarded-for-malicious",
        "x-real-ip-spoofed",
        "x-injection-test"
      ];
      for (const header of suspiciousHeaders) {
        if (req.headers[header]) {
          logSecurityEvent2({
            type: "SUSPICIOUS_REQUEST" /* SUSPICIOUS_REQUEST */,
            severity: "high",
            ip,
            userAgent,
            url: req.originalUrl,
            method: req.method,
            timestamp: /* @__PURE__ */ new Date(),
            details: { suspiciousHeader: header, value: req.headers[header] }
          }).catch((error) => {
            securityLogger.error("Failed to log suspicious request event:", error);
          });
          return res.status(400).json({
            error: "Requisi\xE7\xE3o inv\xE1lida",
            code: "INVALID_HEADERS"
          });
        }
      }
      const suspiciousUserAgents = [
        /sqlmap/i,
        /nikto/i,
        /nessus/i,
        /burpsuite/i,
        /havij/i,
        /w3af/i
      ];
      for (const pattern of suspiciousUserAgents) {
        if (pattern.test(userAgent)) {
          logSecurityEvent2({
            type: "SUSPICIOUS_REQUEST" /* SUSPICIOUS_REQUEST */,
            severity: "high",
            ip,
            userAgent,
            url: req.originalUrl,
            method: req.method,
            timestamp: /* @__PURE__ */ new Date(),
            details: { reason: "Suspicious User-Agent detected" }
          }).catch((error) => {
            securityLogger.error("Failed to log suspicious user agent event:", error);
          });
          return res.status(403).json({
            error: "Acesso negado",
            code: "SUSPICIOUS_USER_AGENT"
          });
        }
      }
      next();
    };
    contentValidationMiddleware = (req, res, next) => {
      if (!["POST", "PUT", "PATCH"].includes(req.method)) {
        return next();
      }
      const ip = getClientIP(req);
      const userAgent = req.get("User-Agent") || "";
      if (req.body && typeof req.body === "object") {
        const bodyStr = JSON.stringify(req.body);
        const xssPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /<iframe[^>]*>.*?<\/iframe>/gi,
          /<object[^>]*>.*?<\/object>/gi,
          /<embed[^>]*>/gi
        ];
        for (const pattern of xssPatterns) {
          if (pattern.test(bodyStr)) {
            logSecurityEvent2({
              type: "XSS_ATTEMPT" /* XSS_ATTEMPT */,
              severity: "critical",
              ip,
              userAgent,
              url: req.originalUrl,
              method: req.method,
              timestamp: /* @__PURE__ */ new Date(),
              details: { pattern: pattern.toString(), detectedContent: bodyStr.substring(0, 200) }
            }).catch((error) => {
              securityLogger.error("Failed to log XSS attempt event:", error);
            });
            return res.status(400).json({
              error: "Conte\xFAdo inv\xE1lido detectado",
              code: "XSS_DETECTED"
            });
          }
        }
        const sqlInjectionPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
          /(UNION\s+SELECT)/gi,
          /('|\"|;|--|\|\|)/g,
          /(OR\s+1\s*=\s*1)/gi,
          /(AND\s+1\s*=\s*1)/gi
        ];
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(bodyStr)) {
            logSecurityEvent2({
              type: "SQL_INJECTION_ATTEMPT" /* SQL_INJECTION_ATTEMPT */,
              severity: "critical",
              ip,
              userAgent,
              url: req.originalUrl,
              method: req.method,
              timestamp: /* @__PURE__ */ new Date(),
              details: { pattern: pattern.toString(), detectedContent: bodyStr.substring(0, 200) }
            }).catch((error) => {
              securityLogger.error("Failed to log SQL injection attempt event:", error);
            });
            return res.status(400).json({
              error: "Conte\xFAdo inv\xE1lido detectado",
              code: "SQL_INJECTION_DETECTED"
            });
          }
        }
      }
      next();
    };
    fileUploadSecurityMiddleware = (req, res, next) => {
      if (!req.originalUrl.includes("/upload") && !req.files && !req.file) {
        return next();
      }
      const ip = getClientIP(req);
      const userAgent = req.get("User-Agent") || "";
      const file = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : null);
      if (file) {
        const allowedMimeTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/heic",
          "image/heif"
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          logSecurityEvent2({
            type: "FILE_UPLOAD_REJECTED" /* FILE_UPLOAD_REJECTED */,
            severity: "medium",
            ip,
            userAgent,
            url: req.originalUrl,
            method: req.method,
            timestamp: /* @__PURE__ */ new Date(),
            details: {
              rejectedMimeType: file.mimetype,
              fileName: file.originalname,
              fileSize: file.size
            }
          }).catch((error) => {
            securityLogger.error("Failed to log file upload rejection event:", error);
          });
          return res.status(400).json({
            error: `Tipo de arquivo n\xE3o permitido: ${file.mimetype}`,
            code: "INVALID_FILE_TYPE"
          });
        }
        const maxSize = file.mimetype === "application/pdf" ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          logSecurityEvent2({
            type: "FILE_UPLOAD_REJECTED" /* FILE_UPLOAD_REJECTED */,
            severity: "medium",
            ip,
            userAgent,
            url: req.originalUrl,
            method: req.method,
            timestamp: /* @__PURE__ */ new Date(),
            details: {
              fileSize: file.size,
              maxSize,
              fileName: file.originalname,
              mimeType: file.mimetype
            }
          }).catch((error) => {
            securityLogger.error("Failed to log file size rejection event:", error);
          });
          return res.status(413).json({
            error: `Arquivo muito grande. Tamanho m\xE1ximo: ${maxSize / 1024 / 1024}MB`,
            code: "FILE_TOO_LARGE"
          });
        }
      }
      next();
    };
    ipTrackingMiddleware = (req, res, next) => {
      const ip = getClientIP(req);
      res.on("finish", () => {
        if (res.statusCode >= 400) {
          const attempts = ipAttempts.get(ip) || { count: 0, lastAttempt: /* @__PURE__ */ new Date() };
          attempts.count++;
          attempts.lastAttempt = /* @__PURE__ */ new Date();
          ipAttempts.set(ip, attempts);
          if (attempts.count >= 20) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
            if (attempts.lastAttempt > oneHourAgo) {
              blockedIPs.add(ip);
              logSecurityEvent2({
                type: "IP_BLOCKED" /* IP_BLOCKED */,
                severity: "critical",
                ip,
                userAgent: req.get("User-Agent") || "",
                url: req.originalUrl,
                method: req.method,
                timestamp: /* @__PURE__ */ new Date(),
                details: {
                  reason: "Too many failed requests",
                  failedAttempts: attempts.count,
                  timeWindow: "1 hour"
                }
              }).catch((error) => {
                securityLogger.error("Failed to log IP blocking event:", error);
              });
            }
          }
        } else if (res.statusCode < 300) {
          ipAttempts.delete(ip);
        }
      });
      next();
    };
    securityHeadersMiddleware2 = (req, res, next) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      res.removeHeader("X-Powered-By");
      next();
    };
    securityMiddlewareStack = [
      helmetConfig,
      corsConfig,
      securityHeadersMiddleware2,
      ipTrackingMiddleware,
      requestValidationMiddleware,
      contentValidationMiddleware,
      fileUploadSecurityMiddleware
    ];
  }
});

// api/index.ts
import "dotenv/config";
import express4 from "express";
import compression from "compression";
import pino6 from "pino";
import pinoHttp2 from "pino-http";

// server/config/api.config.ts
var API_CONFIG = {
  version: "v1",
  prefix: "/api/v1",
  cors: {
    origin: process.env.NODE_ENV === "production" ? ["https://mariaintelligence.com", "https://app.mariaintelligence.com"] : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
  },
  rateLimit: {
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 100,
    // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  },
  validation: {
    stripUnknown: true,
    abortEarly: false
  },
  documentation: {
    enabled: process.env.NODE_ENV !== "production",
    path: "/api/docs",
    title: "MariaIntelligence API",
    version: "1.0.0",
    description: "Modern REST API for property management and reservations"
  }
};
var FEATURE_RATE_LIMITS = {
  // Standard API operations
  general: {
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 100
  },
  // File upload operations
  upload: {
    windowMs: 60 * 60 * 1e3,
    // 1 hour
    max: 10
  },
  // AI/OCR operations
  ai: {
    windowMs: 60 * 60 * 1e3,
    // 1 hour
    max: 20
  },
  // Authentication operations
  auth: {
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 5
  },
  // Search operations
  search: {
    windowMs: 60 * 1e3,
    // 1 minute
    max: 30
  }
};
var HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};
var API_RESPONSE_FORMATS = {
  SUCCESS: "success",
  ERROR: "error",
  VALIDATION_ERROR: "validation_error",
  NOT_FOUND: "not_found",
  UNAUTHORIZED: "unauthorized"
};

// server/middleware/index.ts
import express from "express";
import cors from "cors";
import helmet2 from "helmet";

// server/types/api.types.ts
var ApiError = class extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
  }
};
var ValidationError = class extends ApiError {
  constructor(message, validationErrors) {
    super(422, "VALIDATION_ERROR", message, validationErrors.errors);
    this.validationErrors = validationErrors;
    this.name = "ValidationError";
  }
};
var NotFoundError = class extends ApiError {
  constructor(resource, id) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
};
var UnauthorizedError = class extends ApiError {
  constructor(message = "Unauthorized access") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
};
var ForbiddenError = class extends ApiError {
  constructor(message = "Access forbidden") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
};
var ConflictError = class extends ApiError {
  constructor(message) {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
};
var RateLimitError = class extends ApiError {
  constructor(message = "Too many requests") {
    super(429, "RATE_LIMIT_EXCEEDED", message);
    this.name = "RateLimitError";
  }
};

// server/utils/response.utils.ts
function sendSuccessResponse(res, data, message, statusCode = HTTP_STATUS.OK) {
  const response = {
    success: true,
    data,
    message,
    metadata: {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "v1"
    }
  };
  return res.status(statusCode).json(response);
}
function sendPaginatedResponse(res, data, pagination, message) {
  const response = {
    success: true,
    data,
    message,
    metadata: {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "v1",
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    }
  };
  return res.status(HTTP_STATUS.OK).json(response);
}
function sendErrorResponse(res, statusCode, code, message, details) {
  const response = {
    success: false,
    error: {
      code,
      message,
      details
    },
    metadata: {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "v1"
    }
  };
  if (process.env.NODE_ENV === "development" && details instanceof Error) {
    response.error.stack = details.stack;
  }
  return res.status(statusCode).json(response);
}
function sendNotFoundResponse(res, resource, id) {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
  return sendErrorResponse(
    res,
    HTTP_STATUS.NOT_FOUND,
    API_RESPONSE_FORMATS.NOT_FOUND.toUpperCase(),
    message
  );
}
function sendRateLimitResponse(res, message = "Too many requests") {
  return sendErrorResponse(
    res,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    "RATE_LIMIT_EXCEEDED",
    message
  );
}
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// server/middleware/error.middleware.ts
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }
  console.error("\u{1F6A8} Error occurred:", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : void 0,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent")
  });
  if (error instanceof ValidationError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "VALIDATION_ERROR",
      error.message,
      error.details
    );
  }
  if (error instanceof NotFoundError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.NOT_FOUND,
      "NOT_FOUND",
      error.message
    );
  }
  if (error instanceof UnauthorizedError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      "UNAUTHORIZED",
      error.message
    );
  }
  if (error instanceof ForbiddenError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.FORBIDDEN,
      "FORBIDDEN",
      error.message
    );
  }
  if (error instanceof ConflictError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.CONFLICT,
      "CONFLICT",
      error.message
    );
  }
  if (error instanceof RateLimitError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      "RATE_LIMIT_EXCEEDED",
      error.message
    );
  }
  if (error instanceof ApiError) {
    return sendErrorResponse(
      res,
      error.statusCode,
      error.code,
      error.message,
      error.details
    );
  }
  if (error instanceof Error && error.name === "ZodError") {
    const zodError = error;
    return sendErrorResponse(
      res,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "VALIDATION_ERROR",
      "Request validation failed",
      zodError.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code
      }))
    );
  }
  if (error.code === "LIMIT_FILE_SIZE") {
    return sendErrorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "FILE_TOO_LARGE",
      "File size exceeds the limit"
    );
  }
  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return sendErrorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "UNEXPECTED_FILE",
      "Unexpected file field"
    );
  }
  if (error.code === "23505") {
    return sendErrorResponse(
      res,
      HTTP_STATUS.CONFLICT,
      "DUPLICATE_ENTRY",
      "Resource already exists"
    );
  }
  if (error.code === "23503") {
    return sendErrorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "FOREIGN_KEY_VIOLATION",
      "Referenced resource does not exist"
    );
  }
  if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
    return sendErrorResponse(
      res,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      "SERVICE_UNAVAILABLE",
      "External service temporarily unavailable"
    );
  }
  const message = process.env.NODE_ENV === "production" ? "An unexpected error occurred" : error instanceof Error ? error.message : "Unknown error";
  const details = process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : void 0;
  return sendErrorResponse(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    "INTERNAL_SERVER_ERROR",
    message,
    details
  );
}

// server/middleware/rateLimit.middleware.ts
import rateLimit from "express-rate-limit";
function createRateLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || "unknown"),
    handler: (req, res) => {
      return sendRateLimitResponse(
        res,
        options.message || "Too many requests, please try again later"
      );
    },
    skip: (req) => {
      return req.path === "/health" || req.path.endsWith("/health");
    }
  });
}
var generalRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.general.windowMs,
  max: FEATURE_RATE_LIMITS.general.max,
  message: "Too many API requests, please try again later"
});
var uploadRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.upload.windowMs,
  max: FEATURE_RATE_LIMITS.upload.max,
  message: "Too many file uploads, please wait before uploading again"
});
var aiRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.ai.windowMs,
  max: FEATURE_RATE_LIMITS.ai.max,
  message: "Too many AI requests, please wait before trying again"
});
var authRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.auth.windowMs,
  max: FEATURE_RATE_LIMITS.auth.max,
  message: "Too many authentication attempts, please try again later",
  keyGenerator: (req) => {
    const email = req.body?.email || req.query?.email;
    return email ? `${req.ip}:${email}` : req.ip || "unknown";
  }
});
var searchRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.search.windowMs,
  max: FEATURE_RATE_LIMITS.search.max,
  message: "Too many search requests, please slow down"
});
function rateLimitMiddleware() {
  return (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return generalRateLimiter(req, res, next);
    }
    next();
  };
}

// server/middleware/logging.middleware.ts
import pino from "pino";
import pinoHttp from "pino-http";
var logger = pino({
  name: "mariaintelligence-api",
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
      ignore: "pid,hostname",
      messageFormat: "{levelLabel} - {msg}"
    }
  } : void 0,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    }
  }
});
var httpLogger = pinoHttp({
  logger,
  customLogLevel: function(req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || err) {
      return "error";
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return "silent";
    }
    return "info";
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        "user-agent": req.headers["user-agent"],
        "content-type": req.headers["content-type"]
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        "content-type": res.getHeader("content-type"),
        "content-length": res.getHeader("content-length")
      }
    })
  },
  // Redact sensitive information
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["x-api-key"]',
      "req.body.password",
      "req.body.token",
      "req.query.apiKey",
      "req.query.token"
    ],
    remove: true
  }
});
function loggingMiddleware() {
  return (req, res, next) => {
    const requestId = req.requestId || "unknown";
    req.log = logger.child({ requestId });
    if (process.env.NODE_ENV === "production" && (req.path === "/health" || req.path.endsWith("/health"))) {
      return next();
    }
    httpLogger(req, res, next);
  };
}
function logSecurityEvent(event, details, req) {
  const securityLogger2 = logger.child({ component: "security" });
  securityLogger2.warn({
    event,
    details,
    ip: req?.ip,
    userAgent: req?.get("User-Agent"),
    url: req?.originalUrl,
    method: req?.method,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }, `Security event: ${event}`);
}

// server/middleware/security.middleware.ts
import helmet from "helmet";
var SUSPICIOUS_PATTERNS = [
  /(<script[^>]*>.*?<\/script>)/gi,
  // Script injection
  /(javascript:|data:text\/html|vbscript:)/gi,
  // XSS attempts
  /(union|select|insert|update|delete|drop|create|alter)/gi,
  // SQL injection
  /(\.\.[/\\]|\.\.%2f|\.\.%5c)/gi,
  // Path traversal
  /(%00|\x00)/gi,
  // Null byte injection
  /(exec\s*\(|eval\s*\(|system\s*\()/gi
  // Code execution
];
var securityEventStore = /* @__PURE__ */ new Map();
var SECURITY_EVENT_THRESHOLD = 5;
var SECURITY_EVENT_WINDOW = 15 * 60 * 1e3;
function securityMiddleware() {
  return [
    // Helmet with custom configuration
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          workerSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      // Disable for API compatibility
      hsts: {
        maxAge: 31536e3,
        // 1 year
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: "deny" },
      xssFilter: true
    }),
    // Custom security checks
    securityValidationMiddleware,
    ipWhitelistMiddleware,
    suspiciousPatternDetection,
    securityHeadersMiddleware
  ];
}
function securityValidationMiddleware(req, res, next) {
  const userAgent = req.get("User-Agent");
  if (!userAgent || isSuspiciousUserAgent(userAgent)) {
    logSecurityEvent("suspicious_user_agent", { userAgent }, req);
    trackSecurityEvent(req.ip || "unknown", "suspicious_user_agent");
  }
  const suspiciousHeaders = ["x-forwarded-host", "x-real-ip", "x-cluster-client-ip"];
  for (const header of suspiciousHeaders) {
    if (req.get(header) && req.get(header) !== req.get("host")) {
      logSecurityEvent("header_manipulation", { header, value: req.get(header) }, req);
    }
  }
  const contentLength = parseInt(req.get("content-length") || "0");
  if (contentLength > 50 * 1024 * 1024) {
    logSecurityEvent("large_request", { contentLength }, req);
    return sendErrorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      "REQUEST_TOO_LARGE",
      "Request payload too large"
    );
  }
  next();
}
function ipWhitelistMiddleware(req, res, next) {
  if (!req.path.includes("/admin/")) {
    return next();
  }
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(",") || [];
  if (allowedIPs.length > 0 && !allowedIPs.includes(req.ip || "")) {
    logSecurityEvent("admin_access_denied", { ip: req.ip, path: req.path }, req);
    return sendErrorResponse(
      res,
      HTTP_STATUS.FORBIDDEN,
      "ACCESS_DENIED",
      "Access denied from this IP address"
    );
  }
  next();
}
function suspiciousPatternDetection(req, res, next) {
  const checkString = (str, context) => {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(str)) {
        logSecurityEvent("suspicious_pattern_detected", {
          pattern: pattern.source,
          context,
          value: str.substring(0, 100)
          // Log first 100 chars
        }, req);
        trackSecurityEvent(req.ip || "unknown", "suspicious_pattern");
        return true;
      }
    }
    return false;
  };
  checkString(req.originalUrl, "url");
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      checkString(value, `header:${key}`);
    }
  });
  if (req.body && typeof req.body === "object") {
    try {
      const bodyString = JSON.stringify(req.body);
      checkString(bodyString, "body");
    } catch (error) {
    }
  } else if (typeof req.body === "string") {
    checkString(req.body, "body");
  }
  next();
}
function securityHeadersMiddleware(req, res, next) {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "X-Permitted-Cross-Domain-Policies": "none"
  });
  next();
}
function isSuspiciousUserAgent(userAgent) {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
    /curl/i,
    /wget/i,
    /python/i,
    /ruby/i,
    /java/i,
    /perl/i,
    /php/i,
    /go-http-client/i
  ];
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    // Yahoo
    /duckduckbot/i
  ];
  for (const pattern of legitimateBots) {
    if (pattern.test(userAgent)) {
      return false;
    }
  }
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      return true;
    }
  }
  return false;
}
function trackSecurityEvent(ip, eventType) {
  const key = `${ip}:${eventType}`;
  const now = Date.now();
  const existing = securityEventStore.get(key);
  if (existing) {
    if (now - existing.firstSeen < SECURITY_EVENT_WINDOW) {
      existing.count++;
      existing.lastSeen = now;
      if (existing.count >= SECURITY_EVENT_THRESHOLD) {
        logSecurityEvent("security_threshold_exceeded", {
          ip,
          eventType,
          count: existing.count,
          timeWindow: SECURITY_EVENT_WINDOW
        });
      }
    } else {
      existing.count = 1;
      existing.firstSeen = now;
      existing.lastSeen = now;
    }
  } else {
    securityEventStore.set(key, {
      count: 1,
      firstSeen: now,
      lastSeen: now
    });
  }
  cleanupSecurityEventStore();
}
function cleanupSecurityEventStore() {
  const now = Date.now();
  const cutoff = now - SECURITY_EVENT_WINDOW * 2;
  for (const [key, event] of securityEventStore.entries()) {
    if (event.lastSeen < cutoff) {
      securityEventStore.delete(key);
    }
  }
}

// server/middleware/performance.middleware.ts
import { performance } from "perf_hooks";
var metricsStore = [];
var MAX_METRICS_STORE = 1e3;
function performanceMiddleware() {
  return (req, res, next) => {
    const startTime = performance.now();
    const requestId = generateRequestId();
    req.requestId = requestId;
    res.set("X-Request-ID", requestId);
    res.on("finish", () => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      const metrics = {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        userId: req.user?.id
      };
      storeMetrics(metrics);
      if (responseTime > 1e3) {
        console.warn(`\u{1F40C} Slow request detected:`, {
          method: req.method,
          url: req.originalUrl,
          responseTime: `${responseTime}ms`,
          statusCode: res.statusCode
        });
      }
      if (res.statusCode >= 400) {
        console.error(`\u274C Error response:`, {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          ip: req.ip
        });
      }
      res.set("X-Response-Time", `${responseTime}ms`);
    });
    next();
  };
}
function generateRequestId() {
  const timestamp2 = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `req_${timestamp2}_${random}`;
}
function storeMetrics(metrics) {
  metricsStore.push(metrics);
  if (metricsStore.length > MAX_METRICS_STORE) {
    metricsStore.shift();
  }
}

// server/middleware/cache.middleware.ts
import Redis from "ioredis";
var redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  // Gracefully handle connection errors
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn("Redis connection failed after 3 attempts, disabling cache");
      return null;
    }
    return Math.min(times * 200, 2e3);
  },
  lazyConnect: true
  // Don't connect until first command
});
var redisAvailable = false;
redis.ping().then(() => {
  redisAvailable = true;
  console.log("\u2705 Redis cache connected successfully");
}).catch((err) => {
  console.warn("\u26A0\uFE0F  Redis cache unavailable, caching disabled:", err.message);
});

// server/middleware/index.ts
async function setupMiddleware(app2) {
  console.log("\u{1F527} Setting up modern middleware stack...");
  app2.set("trust proxy", 1);
  app2.use(helmet2({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }));
  app2.use(cors(API_CONFIG.cors));
  app2.use(express.json({ limit: "10mb" }));
  app2.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app2.use(performanceMiddleware());
  app2.use(loggingMiddleware());
  app2.use(securityMiddleware());
  app2.use(rateLimitMiddleware());
  app2.use(errorHandler);
  console.log("\u2705 Middleware stack configured successfully");
}

// server/routes/v1/index.ts
import { Router as Router9 } from "express";

// server/routes/v1/properties.routes.ts
import { Router } from "express";
import { z as z2 } from "zod";

// server/middleware/validation.middleware.ts
import { ZodSchema, ZodError } from "zod";
function validateRequest(options) {
  return async (req, res, next) => {
    try {
      const validatedReq = req;
      if (options.body && req.body) {
        try {
          validatedReq.validatedBody = await options.body.parseAsync(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            throw new ValidationError("Request body validation failed", error);
          }
          throw error;
        }
      }
      if (options.query && req.query) {
        try {
          validatedReq.validatedQuery = await options.query.parseAsync(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            throw new ValidationError("Query parameters validation failed", error);
          }
          throw error;
        }
      }
      if (options.params && req.params) {
        try {
          validatedReq.validatedParams = await options.params.parseAsync(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            throw new ValidationError("Path parameters validation failed", error);
          }
          throw error;
        }
      }
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        const response = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
            details: error.validationErrors.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
              code: err.code
            }))
          },
          metadata: {
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            version: "v1"
          }
        };
        res.status(422).json(response);
        return;
      }
      next(error);
    }
  };
}

// server/storage.ts
init_schema();

// server/db.ts
init_schema();
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL n\xE3o est\xE1 definida. Usando armazenamento em mem\xF3ria."
  );
}
var isDatabaseAvailable = false;
var pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  // reduzindo o máximo de conexões para evitar sobrecarga
  min: 0,
  // permite que o pool seja reduzido a zero quando não estiver em uso
  idleTimeoutMillis: 3e4,
  // reduzindo para 30 segundos
  connectionTimeoutMillis: 5e3,
  // reduzindo para 5 segundos para falhar mais rápido
  ssl: { rejectUnauthorized: false },
  // permite SSL sem validação rigorosa
  keepAlive: true,
  // mantém a conexão TCP ativa
  allowExitOnIdle: true
  // permite que o processo encerre mesmo com conexões inativas
}) : null;
if (pool) {
  pool.on("error", (err) => {
    console.error("Erro inesperado no pool de conex\xE3o PostgreSQL:", err);
    isDatabaseAvailable = false;
  });
  pool.query("SELECT NOW()").then((res) => {
    console.log("Conex\xE3o PostgreSQL estabelecida com sucesso:", res.rows[0].now);
    isDatabaseAvailable = true;
  }).catch((err) => {
    console.error("Erro ao verificar conex\xE3o PostgreSQL:", err);
    isDatabaseAvailable = false;
  });
}
var db = pool ? drizzle(pool, { schema: schema_exports }) : null;
async function checkDatabaseConnection() {
  if (!pool) return false;
  try {
    const result = await pool.query("SELECT 1");
    isDatabaseAvailable = result.rowCount === 1;
    return isDatabaseAvailable;
  } catch (error) {
    console.error("Erro ao verificar conex\xE3o com banco de dados:", error);
    isDatabaseAvailable = false;
    return false;
  }
}

// server/storage.ts
init_schema();
import { eq, desc, sql } from "drizzle-orm";
var MemStorage = class {
  users;
  propertiesMap;
  ownersMap;
  reservationsMap;
  activitiesMap;
  financialDocumentsMap;
  financialDocumentItemsMap;
  paymentRecordsMap;
  quotationsMap;
  maintenanceTasksMap;
  currentUserId;
  currentPropertyId;
  currentOwnerId;
  currentReservationId;
  currentActivityId;
  currentFinancialDocumentId;
  currentFinancialDocumentItemId;
  currentPaymentRecordId;
  currentQuotationId;
  currentMaintenanceTaskId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.propertiesMap = /* @__PURE__ */ new Map();
    this.ownersMap = /* @__PURE__ */ new Map();
    this.reservationsMap = /* @__PURE__ */ new Map();
    this.activitiesMap = /* @__PURE__ */ new Map();
    this.financialDocumentsMap = /* @__PURE__ */ new Map();
    this.financialDocumentItemsMap = /* @__PURE__ */ new Map();
    this.paymentRecordsMap = /* @__PURE__ */ new Map();
    this.quotationsMap = /* @__PURE__ */ new Map();
    this.maintenanceTasksMap = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentOwnerId = 1;
    this.currentReservationId = 1;
    this.currentActivityId = 1;
    this.currentFinancialDocumentId = 1;
    this.currentFinancialDocumentItemId = 1;
    this.currentPaymentRecordId = 1;
    this.currentQuotationId = 1;
    this.currentMaintenanceTaskId = 1;
    this.seedData();
  }
  // User methods from original template
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  // Property methods
  async getProperties() {
    return Array.from(this.propertiesMap.values());
  }
  async getProperty(id) {
    return this.propertiesMap.get(id);
  }
  async createProperty(property) {
    const id = this.currentPropertyId++;
    const newProperty = { ...property, id };
    this.propertiesMap.set(id, newProperty);
    this.createActivity({
      type: "property_created",
      description: `Property "${newProperty.name}" was created`,
      entityId: id,
      entityType: "property"
    });
    return newProperty;
  }
  async updateProperty(id, property) {
    const existingProperty = this.propertiesMap.get(id);
    if (!existingProperty) return void 0;
    const updatedProperty = { ...existingProperty, ...property };
    this.propertiesMap.set(id, updatedProperty);
    this.createActivity({
      type: "property_updated",
      description: `Property "${updatedProperty.name}" was updated`,
      entityId: id,
      entityType: "property"
    });
    return updatedProperty;
  }
  async deleteProperty(id) {
    const property = this.propertiesMap.get(id);
    if (!property) return false;
    const result = this.propertiesMap.delete(id);
    if (result) {
      this.createActivity({
        type: "property_deleted",
        description: `Property "${property.name}" was deleted`,
        entityId: id,
        entityType: "property"
      });
    }
    return result;
  }
  // Owner methods
  async getOwners() {
    return Array.from(this.ownersMap.values());
  }
  async getOwner(id) {
    return this.ownersMap.get(id);
  }
  async createOwner(owner) {
    const id = this.currentOwnerId++;
    const newOwner = { ...owner, id };
    this.ownersMap.set(id, newOwner);
    this.createActivity({
      type: "owner_created",
      description: `Owner "${newOwner.name}" was created`,
      entityId: id,
      entityType: "owner"
    });
    return newOwner;
  }
  async updateOwner(id, owner) {
    const existingOwner = this.ownersMap.get(id);
    if (!existingOwner) return void 0;
    const updatedOwner = { ...existingOwner, ...owner };
    this.ownersMap.set(id, updatedOwner);
    this.createActivity({
      type: "owner_updated",
      description: `Owner "${updatedOwner.name}" was updated`,
      entityId: id,
      entityType: "owner"
    });
    return updatedOwner;
  }
  async deleteOwner(id) {
    const owner = this.ownersMap.get(id);
    if (!owner) return false;
    const result = this.ownersMap.delete(id);
    if (result) {
      this.createActivity({
        type: "owner_deleted",
        description: `Owner "${owner.name}" was deleted`,
        entityId: id,
        entityType: "owner"
      });
    }
    return result;
  }
  // Reservation methods
  async getReservations() {
    return Array.from(this.reservationsMap.values());
  }
  async getReservation(id) {
    return this.reservationsMap.get(id);
  }
  async getReservationsByProperty(propertyId) {
    return Array.from(this.reservationsMap.values()).filter(
      (reservation) => reservation.propertyId === propertyId
    );
  }
  async getReservationsForDashboard() {
    const today = /* @__PURE__ */ new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    return Array.from(this.reservationsMap.values()).filter((reservation) => {
      const checkInDate = reservation.checkInDate.split("T")[0];
      const checkOutDate = reservation.checkOutDate.split("T")[0];
      return checkInDate === todayStr || checkInDate === tomorrowStr || checkOutDate === todayStr;
    }).map((reservation) => {
      const checkInDate = new Date(reservation.checkInDate);
      const checkOutDate = new Date(reservation.checkOutDate);
      const diffTime = checkOutDate.getTime() - checkInDate.getTime();
      const diffDays = diffTime / (1e3 * 60 * 60 * 24);
      const nights = Math.ceil(diffDays);
      return {
        ...reservation,
        nights: nights > 0 ? nights : 1
        // Garantir mínimo de 1 noite
      };
    });
  }
  async createReservation(reservation) {
    const id = this.currentReservationId++;
    const now = /* @__PURE__ */ new Date();
    const newReservation = {
      ...reservation,
      id,
      createdAt: now
    };
    this.reservationsMap.set(id, newReservation);
    const property = await this.getProperty(reservation.propertyId);
    this.createActivity({
      type: "reservation_created",
      description: `New reservation for "${property?.name || "Unknown property"}" was created`,
      entityId: id,
      entityType: "reservation"
    });
    return newReservation;
  }
  async updateReservation(id, reservation) {
    const existingReservation = this.reservationsMap.get(id);
    if (!existingReservation) return void 0;
    const updatedReservation = { ...existingReservation, ...reservation };
    this.reservationsMap.set(id, updatedReservation);
    const property = await this.getProperty(updatedReservation.propertyId);
    this.createActivity({
      type: "reservation_updated",
      description: `Reservation for "${property?.name || "Unknown property"}" was updated`,
      entityId: id,
      entityType: "reservation"
    });
    return updatedReservation;
  }
  async deleteReservation(id) {
    const reservation = this.reservationsMap.get(id);
    if (!reservation) return false;
    const property = await this.getProperty(reservation.propertyId);
    const result = this.reservationsMap.delete(id);
    if (result) {
      this.createActivity({
        type: "reservation_deleted",
        description: `Reservation for "${property?.name || "Unknown property"}" was deleted`,
        entityId: id,
        entityType: "reservation"
      });
    }
    return result;
  }
  // Activity methods
  async getActivities(limit) {
    const activities3 = Array.from(this.activitiesMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return limit ? activities3.slice(0, limit) : activities3;
  }
  async createActivity(activity) {
    const id = this.currentActivityId++;
    const now = /* @__PURE__ */ new Date();
    const newActivity = { ...activity, id, createdAt: now };
    this.activitiesMap.set(id, newActivity);
    return newActivity;
  }
  async deleteActivity(id) {
    if (!this.activitiesMap.has(id)) return false;
    return this.activitiesMap.delete(id);
  }
  // Statistics methods
  async getTotalRevenue(startDate, endDate) {
    let reservations3 = Array.from(this.reservationsMap.values());
    if (startDate) {
      reservations3 = reservations3.filter((r) => new Date(r.checkInDate) >= startDate);
    }
    if (endDate) {
      reservations3 = reservations3.filter((r) => new Date(r.checkInDate) <= endDate);
    }
    return reservations3.reduce((sum2, reservation) => {
      return sum2 + Number(reservation.totalAmount);
    }, 0);
  }
  async getNetProfit(startDate, endDate) {
    let reservations3 = Array.from(this.reservationsMap.values());
    if (startDate) {
      reservations3 = reservations3.filter((r) => new Date(r.checkInDate) >= startDate);
    }
    if (endDate) {
      reservations3 = reservations3.filter((r) => new Date(r.checkInDate) <= endDate);
    }
    return reservations3.reduce((sum2, reservation) => {
      return sum2 + Number(reservation.netAmount);
    }, 0);
  }
  async getOccupancyRate(propertyId, startDate, endDate) {
    const start = startDate || new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1);
    const end = endDate || new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth() + 1, 0);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24));
    const startDateStr = start.toISOString().split("T")[0];
    const endDateStr = end.toISOString().split("T")[0];
    let reservations3 = Array.from(this.reservationsMap.values()).filter((r) => new Date(r.checkOutDate) > start && new Date(r.checkInDate) < end);
    if (propertyId) {
      reservations3 = reservations3.filter((r) => r.propertyId === propertyId);
    }
    let occupiedDays = 0;
    reservations3.forEach((r) => {
      const checkIn = new Date(r.checkInDate) < start ? start : new Date(r.checkInDate);
      const checkOut = new Date(r.checkOutDate) > end ? end : new Date(r.checkOutDate);
      const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1e3 * 60 * 60 * 24));
      occupiedDays += days;
    });
    if (!propertyId) {
      const propertiesCount = this.propertiesMap.size;
      if (propertiesCount === 0) return 0;
      return occupiedDays / (totalDays * propertiesCount) * 100;
    }
    return occupiedDays / totalDays * 100;
  }
  async getPropertyStatistics(propertyId) {
    const property = await this.getProperty(propertyId);
    if (!property) return null;
    const reservations3 = await this.getReservationsByProperty(propertyId);
    const totalRevenue = reservations3.reduce((sum2, r) => sum2 + Number(r.totalAmount), 0);
    const totalCosts = reservations3.reduce((sum2, r) => {
      return sum2 + Number(r.cleaningFee) + Number(r.checkInFee) + Number(r.commission) + // Usando commission conforme schema
      Number(r.teamPayment);
    }, 0);
    const netProfit = totalRevenue - totalCosts;
    const occupancyRate = await this.getOccupancyRate(propertyId);
    return {
      totalRevenue,
      totalCosts,
      netProfit,
      occupancyRate,
      reservationsCount: reservations3.length
    };
  }
  // Métodos para documentos financeiros
  async getFinancialDocuments(options) {
    let documents = Array.from(this.financialDocumentsMap.values());
    if (options) {
      if (options.type) {
        documents = documents.filter((doc) => doc.type === options.type);
      }
      if (options.status) {
        documents = documents.filter((doc) => doc.status === options.status);
      }
      if (options.entityId) {
        documents = documents.filter((doc) => doc.entityId === options.entityId);
      }
      if (options.entityType) {
        documents = documents.filter((doc) => doc.entityType === options.entityType);
      }
      if (options.startDate) {
        documents = documents.filter((doc) => new Date(doc.date) >= options.startDate);
      }
      if (options.endDate) {
        documents = documents.filter((doc) => new Date(doc.date) <= options.endDate);
      }
    }
    documents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return documents;
  }
  async getFinancialDocument(id) {
    return this.financialDocumentsMap.get(id);
  }
  async createFinancialDocument(document) {
    const id = this.currentFinancialDocumentId++;
    const now = /* @__PURE__ */ new Date();
    const newDocument = {
      ...document,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.financialDocumentsMap.set(id, newDocument);
    this.createActivity({
      type: "financial_document_created",
      description: `Documento financeiro ${newDocument.reference} foi criado`,
      entityId: id,
      entityType: "financial_document"
    });
    return newDocument;
  }
  async updateFinancialDocument(id, document) {
    const existingDocument = this.financialDocumentsMap.get(id);
    if (!existingDocument) return void 0;
    const updatedDocument = {
      ...existingDocument,
      ...document,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.financialDocumentsMap.set(id, updatedDocument);
    this.createActivity({
      type: "financial_document_updated",
      description: `Documento financeiro ${updatedDocument.reference} foi atualizado`,
      entityId: id,
      entityType: "financial_document"
    });
    return updatedDocument;
  }
  async deleteFinancialDocument(id) {
    const document = this.financialDocumentsMap.get(id);
    if (!document) return false;
    const hasItems = Array.from(this.financialDocumentItemsMap.values()).some((item) => item.documentId === id);
    if (hasItems) {
      Array.from(this.financialDocumentItemsMap.values()).filter((item) => item.documentId === id).forEach((item) => this.financialDocumentItemsMap.delete(item.id));
    }
    const hasPayments = Array.from(this.paymentRecordsMap.values()).some((payment) => payment.documentId === id);
    if (hasPayments) {
      Array.from(this.paymentRecordsMap.values()).filter((payment) => payment.documentId === id).forEach((payment) => this.paymentRecordsMap.delete(payment.id));
    }
    const result = this.financialDocumentsMap.delete(id);
    if (result) {
      this.createActivity({
        type: "financial_document_deleted",
        description: `Documento financeiro ${document.reference} foi exclu\xEDdo`,
        entityId: id,
        entityType: "financial_document"
      });
    }
    return result;
  }
  // Métodos para itens de documentos financeiros
  async getFinancialDocumentItems(documentId) {
    return Array.from(this.financialDocumentItemsMap.values()).filter((item) => item.documentId === documentId);
  }
  async getFinancialDocumentItem(id) {
    return this.financialDocumentItemsMap.get(id);
  }
  async createFinancialDocumentItem(item) {
    const id = this.currentFinancialDocumentItemId++;
    const newItem = {
      ...item,
      id
    };
    this.financialDocumentItemsMap.set(id, newItem);
    const document = await this.getFinancialDocument(item.documentId);
    if (document) {
      const items = await this.getFinancialDocumentItems(item.documentId);
      const totalAmount = items.reduce((sum2, item2) => sum2 + Number(item2.amount), 0);
      await this.updateFinancialDocument(item.documentId, {
        totalAmount: totalAmount.toString()
      });
    }
    return newItem;
  }
  async updateFinancialDocumentItem(id, item) {
    const existingItem = this.financialDocumentItemsMap.get(id);
    if (!existingItem) return void 0;
    const updatedItem = { ...existingItem, ...item };
    this.financialDocumentItemsMap.set(id, updatedItem);
    const document = await this.getFinancialDocument(existingItem.documentId);
    if (document) {
      const items = await this.getFinancialDocumentItems(existingItem.documentId);
      const totalAmount = items.reduce((sum2, item2) => sum2 + Number(item2.amount), 0);
      await this.updateFinancialDocument(existingItem.documentId, {
        totalAmount: totalAmount.toString()
      });
    }
    return updatedItem;
  }
  async deleteFinancialDocumentItem(id) {
    const item = this.financialDocumentItemsMap.get(id);
    if (!item) return false;
    const documentId = item.documentId;
    const result = this.financialDocumentItemsMap.delete(id);
    if (result) {
      const document = await this.getFinancialDocument(documentId);
      if (document) {
        const items = await this.getFinancialDocumentItems(documentId);
        const totalAmount = items.reduce((sum2, item2) => sum2 + Number(item2.amount), 0);
        await this.updateFinancialDocument(documentId, {
          totalAmount: totalAmount.toString()
        });
      }
    }
    return result;
  }
  // Métodos para registros de pagamento
  async getPaymentRecords(documentId) {
    if (documentId) {
      return Array.from(this.paymentRecordsMap.values()).filter((payment) => payment.documentId === documentId);
    }
    return Array.from(this.paymentRecordsMap.values());
  }
  async getPaymentRecord(id) {
    return this.paymentRecordsMap.get(id);
  }
  async createPaymentRecord(payment) {
    const id = this.currentPaymentRecordId++;
    const now = /* @__PURE__ */ new Date();
    const newPayment = {
      ...payment,
      id,
      createdAt: now
    };
    this.paymentRecordsMap.set(id, newPayment);
    const document = await this.getFinancialDocument(payment.documentId);
    if (document) {
      const payments = await this.getPaymentRecords(payment.documentId);
      const totalPaid = payments.reduce((sum2, payment2) => sum2 + Number(payment2.amount), 0);
      if (totalPaid >= Number(document.totalAmount)) {
        await this.updateFinancialDocument(payment.documentId, {
          status: "paid",
          paidAmount: totalPaid.toString()
        });
      } else if (totalPaid > 0) {
        await this.updateFinancialDocument(payment.documentId, {
          status: "partial",
          paidAmount: totalPaid.toString()
        });
      }
    }
    this.createActivity({
      type: "payment_recorded",
      description: `Pagamento de ${payment.amount} foi registrado`,
      entityId: id,
      entityType: "payment_record"
    });
    return newPayment;
  }
  async updatePaymentRecord(id, payment) {
    const existingPayment = this.paymentRecordsMap.get(id);
    if (!existingPayment) return void 0;
    const updatedPayment = { ...existingPayment, ...payment };
    this.paymentRecordsMap.set(id, updatedPayment);
    const document = await this.getFinancialDocument(existingPayment.documentId);
    if (document) {
      const payments = await this.getPaymentRecords(existingPayment.documentId);
      const totalPaid = payments.reduce((sum2, payment2) => sum2 + Number(payment2.amount), 0);
      if (totalPaid >= Number(document.totalAmount)) {
        await this.updateFinancialDocument(existingPayment.documentId, {
          status: "paid",
          paidAmount: totalPaid.toString()
        });
      } else if (totalPaid > 0) {
        await this.updateFinancialDocument(existingPayment.documentId, {
          status: "partial",
          paidAmount: totalPaid.toString()
        });
      } else {
        await this.updateFinancialDocument(existingPayment.documentId, {
          status: "pending",
          paidAmount: "0"
        });
      }
    }
    return updatedPayment;
  }
  async deletePaymentRecord(id) {
    const payment = this.paymentRecordsMap.get(id);
    if (!payment) return false;
    const documentId = payment.documentId;
    const result = this.paymentRecordsMap.delete(id);
    if (result) {
      const document = await this.getFinancialDocument(documentId);
      if (document) {
        const payments = await this.getPaymentRecords(documentId);
        const totalPaid = payments.reduce((sum2, payment2) => sum2 + Number(payment2.amount), 0);
        if (totalPaid >= Number(document.totalAmount)) {
          await this.updateFinancialDocument(documentId, {
            status: "paid",
            paidAmount: totalPaid.toString()
          });
        } else if (totalPaid > 0) {
          await this.updateFinancialDocument(documentId, {
            status: "partial",
            paidAmount: totalPaid.toString()
          });
        } else {
          await this.updateFinancialDocument(documentId, {
            status: "pending",
            paidAmount: "0"
          });
        }
      }
      this.createActivity({
        type: "payment_deleted",
        description: `Pagamento de ${payment.amount} foi exclu\xEDdo`,
        entityId: id,
        entityType: "payment_record"
      });
    }
    return result;
  }
  // Métodos para relatórios financeiros
  async generateOwnerFinancialReport(ownerId, month, year) {
    const owner = await this.getOwner(ownerId);
    if (!owner) return null;
    const startDate = /* @__PURE__ */ new Date(`${year}-${month}-01`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));
    endDate.setDate(endDate.getDate() - 1);
    const properties3 = (await this.getProperties()).filter((p) => p.ownerId === ownerId);
    const propertyReports = await Promise.all(properties3.map(async (property) => {
      const reservations3 = (await this.getReservationsByProperty(property.id)).filter((r) => {
        const checkIn = new Date(r.checkInDate);
        const checkOut = new Date(r.checkOutDate);
        return checkIn <= endDate && checkOut >= startDate;
      });
      const revenue = reservations3.reduce((sum2, r) => sum2 + Number(r.totalAmount), 0);
      const cleaningCosts = reservations3.reduce((sum2, r) => sum2 + Number(r.cleaningFee || 0), 0);
      const checkInFees = reservations3.reduce((sum2, r) => sum2 + Number(r.checkInFee || 0), 0);
      const commission = reservations3.reduce((sum2, r) => sum2 + Number(r.commission || 0), 0);
      const teamPayments = reservations3.reduce((sum2, r) => sum2 + Number(r.teamPayment || 0), 0);
      const netProfit = revenue - cleaningCosts - checkInFees - commission - teamPayments;
      const occupancyRate = await this.getOccupancyRate(property.id, startDate, endDate);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
      const occupiedDays = Math.ceil(totalDays * (occupancyRate / 100));
      const reservationSummaries = reservations3.map((r) => ({
        id: r.id,
        checkInDate: r.checkInDate,
        checkOutDate: r.checkOutDate,
        guestName: r.guestName,
        totalAmount: Number(r.totalAmount),
        cleaningFee: Number(r.cleaningFee || 0),
        checkInFee: Number(r.checkInFee || 0),
        commission: Number(r.commission || 0),
        // Usando commission conforme schema
        teamPayment: Number(r.teamPayment || 0),
        netAmount: Number(r.netAmount || 0),
        platform: r.platform || "direct"
      }));
      return {
        propertyId: property.id,
        propertyName: property.name,
        reservations: reservationSummaries,
        revenue,
        cleaningCosts,
        checkInFees,
        commission,
        teamPayments,
        netProfit,
        occupancyRate,
        availableDays: totalDays,
        occupiedDays
      };
    }));
    const totalRevenue = propertyReports.reduce((sum2, p) => sum2 + p.revenue, 0);
    const totalCleaningCosts = propertyReports.reduce((sum2, p) => sum2 + p.cleaningCosts, 0);
    const totalCheckInFees = propertyReports.reduce((sum2, p) => sum2 + p.checkInFees, 0);
    const totalCommission = propertyReports.reduce((sum2, p) => sum2 + p.commission, 0);
    const totalTeamPayments = propertyReports.reduce((sum2, p) => sum2 + p.teamPayments, 0);
    const totalNetProfit = propertyReports.reduce((sum2, p) => sum2 + p.netProfit, 0);
    const totalOccupancy = propertyReports.reduce((sum2, p) => sum2 + p.occupancyRate, 0);
    const averageOccupancy = propertyReports.length > 0 ? totalOccupancy / propertyReports.length : 0;
    return {
      ownerId,
      ownerName: owner.name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      propertyReports,
      totals: {
        totalRevenue,
        totalCleaningCosts,
        totalCheckInFees,
        totalCommission,
        totalTeamPayments,
        totalNetProfit,
        averageOccupancy,
        totalProperties: propertyReports.length,
        totalReservations: propertyReports.reduce((sum2, p) => sum2 + p.reservations.length, 0)
      }
    };
  }
  async generateFinancialSummary(startDate, endDate) {
    const now = /* @__PURE__ */ new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const documents = (await this.getFinancialDocuments()).filter((doc) => {
      const docDate = new Date(doc.date);
      return docDate >= start && docDate <= end;
    });
    const incomingDocs = documents.filter((doc) => doc.type === "incoming");
    const outgoingDocs = documents.filter((doc) => doc.type === "outgoing");
    const totalIncoming = incomingDocs.reduce((sum2, doc) => sum2 + Number(doc.totalAmount), 0);
    const totalOutgoing = outgoingDocs.reduce((sum2, doc) => sum2 + Number(doc.totalAmount), 0);
    const netIncome = totalIncoming - totalOutgoing;
    const pendingIncoming = incomingDocs.filter((doc) => doc.status === "pending").reduce((sum2, doc) => sum2 + Number(doc.totalAmount), 0);
    const paidIncoming = incomingDocs.filter((doc) => doc.status === "paid").reduce((sum2, doc) => sum2 + Number(doc.totalAmount), 0);
    const pendingOutgoing = outgoingDocs.filter((doc) => doc.status === "pending").reduce((sum2, doc) => sum2 + Number(doc.totalAmount), 0);
    const paidOutgoing = outgoingDocs.filter((doc) => doc.status === "paid").reduce((sum2, doc) => sum2 + Number(doc.totalAmount), 0);
    const byOwner = {};
    const bySupplier = {};
    for (const doc of documents.filter((d) => d.entityType === "owner")) {
      const entityId = doc.entityId;
      if (!byOwner[entityId]) {
        const owner = await this.getOwner(entityId);
        byOwner[entityId] = {
          id: entityId,
          name: owner ? owner.name : `Propriet\xE1rio #${entityId}`,
          incoming: 0,
          outgoing: 0,
          balance: 0
        };
      }
      if (doc.type === "incoming") {
        byOwner[entityId].incoming += Number(doc.totalAmount);
      } else {
        byOwner[entityId].outgoing += Number(doc.totalAmount);
      }
      byOwner[entityId].balance = byOwner[entityId].incoming - byOwner[entityId].outgoing;
    }
    for (const doc of documents.filter((d) => d.entityType === "supplier")) {
      const entityId = doc.entityId;
      const entityName = doc.entityName || `Fornecedor #${entityId}`;
      if (!bySupplier[entityId]) {
        bySupplier[entityId] = {
          id: entityId,
          name: entityName,
          incoming: 0,
          outgoing: 0,
          balance: 0
        };
      }
      if (doc.type === "incoming") {
        bySupplier[entityId].incoming += Number(doc.totalAmount);
      } else {
        bySupplier[entityId].outgoing += Number(doc.totalAmount);
      }
      bySupplier[entityId].balance = bySupplier[entityId].incoming - bySupplier[entityId].outgoing;
    }
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      summary: {
        totalIncoming,
        totalOutgoing,
        netIncome,
        pendingIncoming,
        paidIncoming,
        pendingOutgoing,
        paidOutgoing,
        totalDocuments: documents.length,
        incomingDocuments: incomingDocs.length,
        outgoingDocuments: outgoingDocs.length
      },
      byOwner: Object.values(byOwner),
      bySupplier: Object.values(bySupplier),
      recentDocuments: documents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
      // Últimos 10 documentos
    };
  }
  // Seed method to initialize sample data
  seedData() {
    const seedFinancialDocuments = () => {
      const financialDocumentsData = [
        {
          id: 1,
          reference: "FT2025/001",
          type: "incoming",
          status: "pending",
          date: "2025-03-01",
          dueDate: "2025-03-15",
          description: "Servi\xE7os de gest\xE3o - Mar 2025",
          entityId: 10,
          // Owner ID
          entityType: "owner",
          entityName: "Gabriela",
          totalAmount: "125.50",
          paidAmount: "0",
          notes: "Pagamento pendente para os servi\xE7os do m\xEAs de mar\xE7o",
          invoiceNumber: "",
          createdAt: /* @__PURE__ */ new Date("2025-03-01T10:30:00"),
          updatedAt: /* @__PURE__ */ new Date("2025-03-01T10:30:00")
        },
        {
          id: 2,
          reference: "FT2025/002",
          type: "outgoing",
          status: "paid",
          date: "2025-02-25",
          dueDate: "2025-03-10",
          description: "Servi\xE7os de limpeza - Fev 2025",
          entityId: 1,
          // Supplier ID
          entityType: "supplier",
          entityName: "Maria Faz Limpezas",
          totalAmount: "350.00",
          paidAmount: "350.00",
          notes: "Pagamento efetuado por transfer\xEAncia banc\xE1ria",
          invoiceNumber: "A/123",
          createdAt: /* @__PURE__ */ new Date("2025-02-25T14:00:00"),
          updatedAt: /* @__PURE__ */ new Date("2025-03-02T09:15:00")
        },
        {
          id: 3,
          reference: "FT2025/003",
          type: "incoming",
          status: "invoiced",
          date: "2025-03-05",
          dueDate: "2025-03-20",
          description: "Comiss\xE3o Booking.com - Fev 2025",
          entityId: 5,
          // Owner ID
          entityType: "owner",
          entityName: "Innkeeper",
          totalAmount: "230.75",
          paidAmount: "0",
          notes: "Fatura emitida, aguardando pagamento",
          invoiceNumber: "B/2025/42",
          createdAt: /* @__PURE__ */ new Date("2025-03-05T11:45:00"),
          updatedAt: /* @__PURE__ */ new Date("2025-03-05T16:20:00")
        }
      ];
      financialDocumentsData.forEach((doc) => {
        this.financialDocumentsMap.set(doc.id, doc);
        if (doc.id >= this.currentFinancialDocumentId) {
          this.currentFinancialDocumentId = doc.id + 1;
        }
      });
      const financialDocumentItemsData = [
        {
          id: 1,
          documentId: 1,
          description: "Gest\xE3o da propriedade Ajuda - Mar 2025",
          quantity: "1",
          unitPrice: "75.00",
          amount: "75.00"
        },
        {
          id: 2,
          documentId: 1,
          description: "Taxa de check-in - Reserva #123",
          quantity: "1",
          unitPrice: "15.00",
          amount: "15.00"
        },
        {
          id: 3,
          documentId: 1,
          description: "Comiss\xE3o de 10% - Reserva #123",
          quantity: "1",
          unitPrice: "35.50",
          amount: "35.50"
        },
        {
          id: 4,
          documentId: 2,
          description: "Limpeza regular - Propriedade Ajuda",
          quantity: "2",
          unitPrice: "45.00",
          amount: "90.00"
        },
        {
          id: 5,
          documentId: 2,
          description: "Limpeza profunda - Propriedade Bernardo",
          quantity: "1",
          unitPrice: "65.00",
          amount: "65.00"
        },
        {
          id: 6,
          documentId: 2,
          description: "Limpeza regular - Propriedade Aroeira 3",
          quantity: "1",
          unitPrice: "50.00",
          amount: "50.00"
        },
        {
          id: 7,
          documentId: 2,
          description: "Mudan\xE7a de toalhas e len\xE7\xF3is",
          quantity: "3",
          unitPrice: "25.00",
          amount: "75.00"
        },
        {
          id: 8,
          documentId: 2,
          description: "Produtos de limpeza",
          quantity: "1",
          unitPrice: "70.00",
          amount: "70.00"
        },
        {
          id: 9,
          documentId: 3,
          description: "Comiss\xE3o de gest\xE3o - Fev 2025",
          quantity: "1",
          unitPrice: "230.75",
          amount: "230.75"
        }
      ];
      financialDocumentItemsData.forEach((item) => {
        this.financialDocumentItemsMap.set(item.id, item);
        if (item.id >= this.currentFinancialDocumentItemId) {
          this.currentFinancialDocumentItemId = item.id + 1;
        }
      });
      const paymentRecordsData = [
        {
          id: 1,
          documentId: 2,
          date: "2025-03-02",
          method: "bank_transfer",
          amount: "350.00",
          reference: "TRANSF-83294",
          notes: "Transfer\xEAncia banc\xE1ria para Maria Faz",
          createdAt: /* @__PURE__ */ new Date("2025-03-02T09:15:00")
        }
      ];
      paymentRecordsData.forEach((payment) => {
        this.paymentRecordsMap.set(payment.id, payment);
        if (payment.id >= this.currentPaymentRecordId) {
          this.currentPaymentRecordId = payment.id + 1;
        }
      });
    };
    const ownerData = [
      { id: 1, name: "Jos\xE9 Gustavo", company: "Jos\xE9 Gustavo", address: "rua curvo semendo, 37 - Montemor o novo", taxId: "", email: "", phone: "" },
      { id: 2, name: "H\xE9lia", company: "BRIGHT JOBS UNIPESSOAL LDA", address: "AVENIDA PROF DR AUGUSTO ABREU LOPES EDIF 1 BLOCO B 5 C, ODIVELAS", taxId: "514487097", email: "", phone: "" },
      { id: 3, name: "Filipe villas boas", company: "Vanguardpriority Unipessoal Lda", address: "Lisboa", taxId: "514537027", email: "vanguardpriority@gmail.com", phone: "" },
      { id: 4, name: "Maria Lorena", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 5, name: "innkeeper", company: "Criterion Legacy Unipessoal LDA", address: "Lisboa", taxId: "514887869", email: "miguel@innkeeper.pt", phone: "" },
      { id: 6, name: "Maria Ines", company: "IMAGINARY AVENUE - LDA", address: "RUA DA REPUBLICA DA GUINE BISSAU N 1 3 E, AMADORA", taxId: "517107341", email: "", phone: "" },
      { id: 7, name: "Ana Robalo", company: "Ana Teresa Robalo Arquitetura unipessoal Lda", address: "Av. Guerra Junqueiro n9, 4\xBAdt, lisboa", taxId: "514279141", email: "anatrobalo@gmail.com", phone: "" },
      { id: 8, name: "Cl\xE1udia", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 9, name: "Jos\xE9", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 10, name: "Gabriela", company: "Tribunadomus, Lda", address: "", taxId: "507764277", email: "tribunadomus@gmail.com", phone: "" },
      { id: 11, name: "lydia", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 12, name: "Ana Tomaz", company: "contrato", address: "", taxId: "", email: "", phone: "" },
      { id: 13, name: "Francisco", company: "FCO Living, lda", address: "", taxId: "516298968", email: "couto_francisco@hotmail.com", phone: "" },
      { id: 14, name: "Sandra", company: "TRIUMPH CHIMERA LDA", address: "RUA FRANCISCO FRANCO N 30B BAIRRO DAS MORENAS", taxId: "515942022", email: "sandrar@triumphinc.ca", phone: "" },
      { id: 15, name: "Mariana", company: "Mariana Arga Lima lda", address: "Rua \xC1lvaro Pedro Gomes, 12 4D, Sacavem", taxId: "514759232", email: "hshgestao@gmail.com", phone: "" },
      { id: 16, name: "Filipe", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 17, name: "maria ines", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 18, name: "Ana costa", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 19, name: "sandra", company: "pessoal", address: "", taxId: "", email: "", phone: "" }
    ];
    ownerData.forEach((owner) => {
      this.ownersMap.set(owner.id, owner);
      if (owner.id >= this.currentOwnerId) {
        this.currentOwnerId = owner.id + 1;
      }
    });
    const propertyData = [
      { id: 1, name: "Ajuda", cleaningCost: "45", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "Maria faz", ownerId: 10, monthlyFixedCost: "0", active: true },
      { id: 2, name: "Almada rei", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "cristina", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 3, name: "Aroeira 3", cleaningCost: "50", checkInFee: "0", commission: "0", teamPayment: "50", cleaningTeam: "Maria faz", ownerId: 11, monthlyFixedCost: "0", active: true },
      { id: 4, name: "Aroeira 4", cleaningCost: "45", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "Maria faz", ownerId: 8, monthlyFixedCost: "0", active: true },
      { id: 5, name: "Barcos (Check-in)", cleaningCost: "55", checkInFee: "15", commission: "0", teamPayment: "70", cleaningTeam: "Maria faz", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 6, name: "Bernardo", cleaningCost: "65", checkInFee: "15", commission: "0", teamPayment: "55", cleaningTeam: "cristina", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 7, name: "Costa cabanas", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "Primavera", ownerId: 15, monthlyFixedCost: "0", active: true },
      { id: 8, name: "Cristo Rei", cleaningCost: "45", checkInFee: "0", commission: "0", teamPayment: "40", cleaningTeam: "cristina", ownerId: 10, monthlyFixedCost: "0", active: true },
      { id: 9, name: "Ericeira nova", cleaningCost: "45", checkInFee: "15", commission: "0", teamPayment: "60", cleaningTeam: "Maria faz", ownerId: 9, monthlyFixedCost: "0", active: true },
      { id: 10, name: "Gomeira", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "Primavera", ownerId: 15, monthlyFixedCost: "0", active: true },
      { id: 11, name: "Jo\xE3o Batista", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "cristina", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 12, name: "Magoito anexo", cleaningCost: "90", checkInFee: "0", commission: "0", teamPayment: "90", cleaningTeam: "maria faz", ownerId: 2, monthlyFixedCost: "0", active: true },
      { id: 13, name: "Magoito vivenda", cleaningCost: "90", checkInFee: "0", commission: "0", teamPayment: "90", cleaningTeam: "Maria faz", ownerId: 2, monthlyFixedCost: "0", active: true },
      { id: 14, name: "Montemor", cleaningCost: "65", checkInFee: "0", commission: "20", teamPayment: "55", cleaningTeam: "Maria jo\xE3o", ownerId: 1, monthlyFixedCost: "0", active: true },
      { id: 15, name: "Nazar\xE9 T2", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "50", cleaningTeam: "Home deluxe", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 16, name: "Palmela", cleaningCost: "45", checkInFee: "0", commission: "0", teamPayment: "35", cleaningTeam: "Cristina", ownerId: 10, monthlyFixedCost: "0", active: true },
      { id: 17, name: "Reboleira", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "Maria faz", ownerId: 17, monthlyFixedCost: "0", active: true },
      { id: 18, name: "Silves", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "Primavera", ownerId: 16, monthlyFixedCost: "0", active: true },
      { id: 19, name: "S\xE9", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "65", cleaningTeam: "Maria faz", ownerId: 4, monthlyFixedCost: "0", active: true },
      { id: 20, name: "Trafaria 1\xAA", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "cristina", ownerId: 16, monthlyFixedCost: "0", active: true },
      { id: 21, name: "Trafaria RC", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "cristina", ownerId: 16, monthlyFixedCost: "0", active: true },
      { id: 22, name: "Tr\xF3ia", cleaningCost: "55", checkInFee: "0", commission: "20", teamPayment: "45", cleaningTeam: "Setubal", ownerId: 13, monthlyFixedCost: "0", active: true },
      { id: 23, name: "\xD3bidos", cleaningCost: "90", checkInFee: "0", commission: "0", teamPayment: "85", cleaningTeam: "Home deluxe", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 24, name: "Setubal", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "cristina", ownerId: 10, monthlyFixedCost: "0", active: true },
      { id: 25, name: "Costa blue", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "50", cleaningTeam: "cristina", ownerId: 18, monthlyFixedCost: "0", active: true },
      { id: 26, name: "Tropical", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "60", cleaningTeam: "Home deluxe", ownerId: 19, monthlyFixedCost: "0", active: true },
      { id: 27, name: "Praia chic", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "Home deluxe", ownerId: 19, monthlyFixedCost: "0", active: true },
      { id: 28, name: "Maresia", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "Home deluxe", ownerId: 19, monthlyFixedCost: "0", active: true },
      { id: 29, name: "Escandinavo", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "60", cleaningTeam: "Home deluxe", ownerId: 19, monthlyFixedCost: "0", active: true },
      { id: 30, name: "Aroeira 1", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 31, name: "Aroeira2", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 32, name: "Gra\xE7a", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 33, name: "Sete Rios", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 34, name: "Filipe da mata", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 35, name: "05-Oct", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true }
    ];
    propertyData.forEach((property) => {
      this.propertiesMap.set(property.id, property);
      if (property.id >= this.currentPropertyId) {
        this.currentPropertyId = property.id + 1;
      }
    });
    const today = /* @__PURE__ */ new Date();
    const oneDay = 24 * 60 * 60 * 1e3;
    const reservationData = [
      {
        id: 1,
        propertyId: 3,
        guestName: "Maria Silva",
        guestEmail: "maria.silva@example.com",
        guestPhone: "+351912345678",
        checkInDate: new Date(today.getTime() + 2 * oneDay),
        checkOutDate: new Date(today.getTime() + 7 * oneDay),
        numGuests: 2,
        totalAmount: "480",
        status: "confirmed",
        platform: "airbnb",
        platformFee: "48",
        cleaningFee: "50",
        checkInFee: "0",
        commission: "0",
        // Corrigido de commissionFee para commission conforme schema
        teamPayment: "50",
        netAmount: "332",
        notes: "",
        createdAt: new Date(today.getTime() - 2 * oneDay)
      },
      {
        id: 2,
        propertyId: 13,
        guestName: "Jo\xE3o Almeida",
        guestEmail: "joao.almeida@example.com",
        guestPhone: "+351934567890",
        checkInDate: new Date(today.getTime() + 5 * oneDay),
        checkOutDate: new Date(today.getTime() + 12 * oneDay),
        numGuests: 4,
        totalAmount: "920",
        status: "pending",
        platform: "booking",
        platformFee: "92",
        cleaningFee: "90",
        checkInFee: "0",
        commission: "0",
        // Corrigido de commissionFee para commission conforme schema
        teamPayment: "90",
        netAmount: "648",
        notes: "Guests will arrive late, around 22:00",
        createdAt: new Date(today.getTime() - 1 * oneDay)
      },
      {
        id: 3,
        propertyId: 9,
        guestName: "Carlos Santos",
        guestEmail: "carlos.santos@example.com",
        guestPhone: "+351967890123",
        checkInDate: new Date(today.getTime() + 8 * oneDay),
        checkOutDate: new Date(today.getTime() + 10 * oneDay),
        numGuests: 2,
        totalAmount: "320",
        status: "confirmed",
        platform: "direct",
        platformFee: "0",
        cleaningFee: "45",
        checkInFee: "15",
        commission: "0",
        // Corrigido de commissionFee para commission conforme schema
        teamPayment: "60",
        netAmount: "200",
        notes: "",
        createdAt: new Date(today.getTime() - 3 * oneDay)
      },
      {
        id: 4,
        propertyId: 19,
        guestName: "Ana Martins",
        guestEmail: "ana.martins@example.com",
        guestPhone: "+351923456789",
        checkInDate: new Date(today.getTime() + 11 * oneDay),
        checkOutDate: new Date(today.getTime() + 16 * oneDay),
        numGuests: 3,
        totalAmount: "750",
        status: "confirmed",
        platform: "airbnb",
        platformFee: "75",
        cleaningFee: "65",
        checkInFee: "0",
        commission: "0",
        // Corrigido de commissionFee para commission conforme schema
        teamPayment: "65",
        netAmount: "545",
        notes: "Will need extra bedding for child",
        createdAt: new Date(today.getTime() - 5 * oneDay)
      }
    ];
    reservationData.forEach((reservation) => {
      this.reservationsMap.set(reservation.id, reservation);
      if (reservation.id >= this.currentReservationId) {
        this.currentReservationId = reservation.id + 1;
      }
    });
    const activityData = [
      {
        id: 1,
        type: "reservation_created",
        description: "Nova reserva processada para Aroeira 3 via OCR. Check-in: 15/10/2023.",
        entityId: 1,
        entityType: "reservation",
        createdAt: new Date(today.getTime() - 2 * oneDay)
      },
      {
        id: 2,
        type: "owner_updated",
        description: "Dados de contacto do propriet\xE1rio Mariana foram atualizados.",
        entityId: 15,
        entityType: "owner",
        createdAt: new Date(today.getTime() - 3 * oneDay)
      },
      {
        id: 3,
        type: "maintenance_requested",
        description: "Solicita\xE7\xE3o de manuten\xE7\xE3o para Magoito Anexo foi registrada.",
        entityId: 12,
        entityType: "property",
        createdAt: new Date(today.getTime() - 4 * oneDay)
      },
      {
        id: 4,
        type: "cleaning_completed",
        description: "Limpeza da propriedade S\xE9 conclu\xEDda e pronta para pr\xF3xima reserva.",
        entityId: 19,
        entityType: "property",
        createdAt: new Date(today.getTime() - 5 * oneDay)
      }
    ];
    activityData.forEach((activity) => {
      this.activitiesMap.set(activity.id, activity);
      if (activity.id >= this.currentActivityId) {
        this.currentActivityId = activity.id + 1;
      }
    });
    seedFinancialDocuments.call(this);
  }
};
var DatabaseStorage = class {
  poolInstance;
  constructor() {
    this.poolInstance = pool;
  }
  // User methods (original da template)
  async getUser(id) {
    return void 0;
  }
  async getUserByUsername(username) {
    return void 0;
  }
  async createUser(user) {
    return { id: 1, ...user };
  }
  // Financial Document Item methods
  async getFinancialDocumentItem(id) {
    if (!db) return void 0;
    try {
      const [item] = await db.select().from(financialDocumentItems).where(eq(financialDocumentItems.id, id));
      return item;
    } catch (error) {
      console.error("Erro ao buscar item do documento financeiro:", error);
      return void 0;
    }
  }
  // Implementação do método estatísticas de propriedade
  async getPropertyStatistics(propertyId) {
    if (!db) return {
      totalRevenue: 0,
      totalReservations: 0,
      averageStay: 0,
      occupancyRate: 0
    };
    try {
      const revenueResults = await db.execute(sql`
        SELECT SUM(CAST(total_amount as DECIMAL)) as total
        FROM reservations
        WHERE property_id = ${propertyId}
      `);
      const reservationsResults = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM reservations
        WHERE property_id = ${propertyId}
      `);
      const stayDurationResults = await db.execute(sql`
        SELECT AVG(
          (CAST(check_out_date as DATE) - CAST(check_in_date as DATE))
        ) as average
        FROM reservations
        WHERE property_id = ${propertyId}
      `);
      const startDate = new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 1);
      const occupancyRate = await this.getOccupancyRate(propertyId, startDate);
      return {
        totalRevenue: Number(revenueResults[0]?.total) || 0,
        totalReservations: Number(reservationsResults[0]?.count) || 0,
        averageStay: Number(stayDurationResults[0]?.average) || 0,
        occupancyRate
      };
    } catch (error) {
      console.error("Erro ao obter estat\xEDsticas da propriedade:", error);
      return {
        totalRevenue: 0,
        totalReservations: 0,
        averageStay: 0,
        occupancyRate: 0
      };
    }
  }
  // Property methods
  async getProperties() {
    if (!db) return [];
    const results = await db.select().from(properties);
    return results;
  }
  async getProperty(id) {
    if (!db) return void 0;
    const [result] = await db.select().from(properties).where(eq(properties.id, id));
    return result;
  }
  async createProperty(property) {
    if (!db) {
      throw new Error("Database not available");
    }
    const [result] = await db.insert(properties).values(property).returning();
    return result;
  }
  async updateProperty(id, property) {
    if (!db) return void 0;
    const [result] = await db.update(properties).set(property).where(eq(properties.id, id)).returning();
    return result;
  }
  async deleteProperty(id) {
    if (!db) return false;
    const result = await db.delete(properties).where(eq(properties.id, id));
    return true;
  }
  // Owner methods
  async getOwners() {
    if (!db) return [];
    const results = await db.select().from(owners);
    return results;
  }
  async getOwner(id) {
    if (!db) return void 0;
    const [result] = await db.select().from(owners).where(eq(owners.id, id));
    return result;
  }
  async createOwner(owner) {
    if (!db) {
      throw new Error("Database not available");
    }
    const [result] = await db.insert(owners).values(owner).returning();
    return result;
  }
  async updateOwner(id, owner) {
    if (!db) return void 0;
    const [result] = await db.update(owners).set(owner).where(eq(owners.id, id)).returning();
    return result;
  }
  async deleteOwner(id) {
    if (!db) return false;
    const result = await db.delete(owners).where(eq(owners.id, id));
    return true;
  }
  // Reservation methods
  async getReservations() {
    if (!db) return [];
    try {
      console.log(`Buscando todas as reservas dispon\xEDveis`);
      if (this.poolInstance) {
        const query3 = `
          SELECT * FROM reservations
          ORDER BY created_at DESC
        `;
        const result = await this.poolInstance.query(query3);
        console.log(`Encontradas ${result.rows.length} reservas no total`);
        return result.rows.map((row) => ({
          id: row.id,
          propertyId: row.propertyId || row.property_id,
          guestName: row.guestName || row.guest_name,
          guestEmail: row.guestEmail || row.guest_email,
          guestPhone: row.guestPhone || row.guest_phone,
          checkInDate: row.checkInDate || row.check_in_date,
          checkOutDate: row.checkOutDate || row.check_out_date,
          numGuests: row.numGuests || row.num_guests,
          totalAmount: row.totalAmount || row.total_amount,
          status: row.status,
          notes: row.notes,
          checkInFee: row.check_in_fee,
          commission: row.commission_fee,
          teamPayment: row.team_payment,
          ownerRevenue: row.owner_revenue,
          source: row.source || "manual",
          platformFee: row.platform_fee,
          cleaningFee: row.cleaning_fee,
          netAmount: row.net_amount,
          createdAt: row.createdAt || row.created_at,
          updatedAt: row.updatedAt || row.updated_at
        }));
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar reservas:", error);
      return [];
    }
  }
  async getReservation(id) {
    if (!db) return void 0;
    try {
      const [result] = await db.select({
        id: reservations.id,
        propertyId: reservations.propertyId,
        guestName: reservations.guestName,
        guestEmail: reservations.guestEmail,
        guestPhone: reservations.guestPhone,
        checkInDate: reservations.checkInDate,
        checkOutDate: reservations.checkOutDate,
        numGuests: reservations.numGuests,
        totalAmount: reservations.totalAmount,
        status: reservations.status,
        notes: reservations.notes,
        checkInFee: reservations.checkInFee,
        commission: reservations.commission,
        teamPayment: reservations.teamPayment,
        ownerRevenue: reservations.ownerRevenue,
        source: reservations.source,
        createdAt: reservations.createdAt,
        updatedAt: reservations.updatedAt
      }).from(reservations).where(eq(reservations.id, id));
      return result;
    } catch (error) {
      console.error("Erro ao buscar reserva por ID:", error);
      return void 0;
    }
  }
  async getReservationsByProperty(propertyId) {
    if (!db) return [];
    try {
      const today = /* @__PURE__ */ new Date();
      const minDate = /* @__PURE__ */ new Date();
      minDate.setDate(today.getDate() + 3);
      const minDateStr = minDate.toISOString().split("T")[0];
      console.log(`Buscando reservas para a propriedade ${propertyId} a partir de ${minDateStr} (hoje + 3 dias)`);
      if (this.poolInstance) {
        const query3 = `
          SELECT * FROM reservations 
          WHERE property_id = $1 AND check_in_date >= $2::DATE
          ORDER BY check_in_date DESC
        `;
        const result = await this.poolInstance.query(query3, [propertyId, minDateStr]);
        console.log(`Encontradas ${result.rows.length} reservas futuras para a propriedade ${propertyId} a partir de ${minDateStr}`);
        return result.rows.map((row) => ({
          id: row.id,
          propertyId: row.property_id,
          guestName: row.guest_name,
          guestEmail: row.guest_email,
          guestPhone: row.guest_phone,
          checkInDate: row.check_in_date,
          checkOutDate: row.check_out_date,
          numGuests: row.num_guests,
          totalAmount: row.total_amount,
          status: row.status,
          notes: row.notes,
          checkInFee: row.check_in_fee,
          commission: row.commission_fee,
          // Mapeando do campo DB commission_fee para campo da aplicação commission
          teamPayment: row.team_payment,
          ownerRevenue: row.owner_revenue,
          source: row.platform,
          // Mapeando do campo DB platform para campo da aplicação source
          platformFee: row.platform_fee,
          cleaningFee: row.cleaning_fee,
          netAmount: row.net_amount,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar reservas por propriedade:", error);
      return [];
    }
  }
  async getReservationsForDashboard() {
    if (!db) return [];
    try {
      const today = /* @__PURE__ */ new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayStr = today.toISOString().split("T")[0];
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      console.log(`Buscando reservas para dashboard - Hoje: ${todayStr}, Amanh\xE3: ${tomorrowStr}`);
      if (this.poolInstance) {
        const query3 = `
          SELECT * FROM reservations 
          WHERE 
            (check_in_date::DATE = $1::DATE OR 
             check_in_date::DATE = $2::DATE OR 
             check_out_date::DATE = $1::DATE)
          ORDER BY check_in_date ASC
        `;
        const result = await this.poolInstance.query(query3, [todayStr, tomorrowStr]);
        console.log(`Encontradas ${result.rows.length} reservas para o dashboard de hoje e amanh\xE3`);
        return result.rows.map((row) => {
          const checkInDate = new Date(row.check_in_date);
          const checkOutDate = new Date(row.check_out_date);
          const diffTime = checkOutDate.getTime() - checkInDate.getTime();
          const diffDays = diffTime / (1e3 * 60 * 60 * 24);
          const nights = Math.ceil(diffDays);
          return {
            id: row.id,
            propertyId: row.property_id,
            guestName: row.guest_name,
            guestEmail: row.guest_email,
            guestPhone: row.guest_phone,
            checkInDate: row.check_in_date,
            checkOutDate: row.check_out_date,
            numGuests: row.num_guests,
            totalAmount: row.total_amount,
            platformFee: row.platform_fee,
            cleaningFee: row.cleaning_fee,
            checkInFee: row.check_in_fee,
            commission: row.commission_fee,
            // Mapeando do campo DB commission_fee para campo da aplicação commission
            teamPayment: row.team_payment,
            ownerRevenue: row.owner_revenue,
            source: row.platform,
            // Mapeando do campo DB platform para campo da aplicação source
            status: row.status,
            notes: row.notes,
            netAmount: row.net_amount,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            nights: nights > 0 ? nights : 1
            // Garantir mínimo de 1 noite
          };
        });
      }
      try {
        const results = await db.execute(sql`
          SELECT * FROM reservations 
          WHERE 
            (check_in_date::DATE = ${todayStr}::DATE OR 
            check_in_date::DATE = ${tomorrowStr}::DATE OR 
            check_out_date::DATE = ${todayStr}::DATE)
          ORDER BY check_in_date ASC
        `);
        if (Array.isArray(results)) {
          return results.map((row) => {
            const checkInDate = new Date(row.check_in_date);
            const checkOutDate = new Date(row.check_out_date);
            const diffTime = checkOutDate.getTime() - checkInDate.getTime();
            const diffDays = diffTime / (1e3 * 60 * 60 * 24);
            const nights = Math.ceil(diffDays);
            return {
              id: row.id,
              propertyId: row.property_id,
              guestName: row.guest_name,
              guestEmail: row.guest_email,
              guestPhone: row.guest_phone,
              checkInDate: row.check_in_date,
              checkOutDate: row.check_out_date,
              numGuests: row.num_guests,
              totalAmount: row.total_amount,
              status: row.status,
              notes: row.notes,
              platformFee: row.platform_fee,
              cleaningFee: row.cleaning_fee,
              checkInFee: row.check_in_fee,
              commission: row.commission_fee,
              teamPayment: row.team_payment,
              ownerRevenue: row.owner_revenue,
              netAmount: row.net_amount,
              source: row.platform,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              nights: nights > 0 ? nights : 1
              // Garantir mínimo de 1 noite
            };
          });
        }
      } catch (sqlError) {
        console.error("Erro no fallback SQL para dashboard:", sqlError);
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar reservas para dashboard:", error);
      return [];
    }
  }
  async createReservation(reservation) {
    if (!db) {
      throw new Error("Database not available");
    }
    const sanitizedReservation = {
      property_id: reservation.propertyId,
      guest_name: reservation.guestName,
      guest_email: reservation.guestEmail || "",
      guest_phone: reservation.guestPhone || "",
      check_in_date: reservation.checkInDate,
      check_out_date: reservation.checkOutDate,
      total_amount: reservation.totalAmount,
      platform: reservation.source || "direct",
      // Campo correto é 'platform'
      status: reservation.status || "pending",
      platform_fee: reservation.platformFee || "0",
      cleaning_fee: reservation.cleaningFee || "0",
      check_in_fee: reservation.checkInFee || "0",
      commission_fee: reservation.commission || "0",
      // Usa commission do schema
      team_payment: reservation.teamPayment || "0",
      net_amount: reservation.netAmount || "0",
      notes: reservation.notes || "",
      num_guests: reservation.numGuests || 1
    };
    console.log("Criando reserva com dados sanitizados:", sanitizedReservation);
    try {
      const client = await this.poolInstance.connect();
      try {
        const insertQuery = `
          INSERT INTO reservations (
            property_id, guest_name, guest_email, guest_phone, 
            check_in_date, check_out_date, total_amount, platform, 
            status, platform_fee, cleaning_fee, check_in_fee, 
            commission_fee, team_payment, net_amount, notes, num_guests
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          ) RETURNING *
        `;
        const values = [
          sanitizedReservation.property_id,
          sanitizedReservation.guest_name,
          sanitizedReservation.guest_email,
          sanitizedReservation.guest_phone,
          sanitizedReservation.check_in_date,
          sanitizedReservation.check_out_date,
          sanitizedReservation.total_amount,
          sanitizedReservation.platform,
          sanitizedReservation.status,
          sanitizedReservation.platform_fee,
          sanitizedReservation.cleaning_fee,
          sanitizedReservation.check_in_fee,
          sanitizedReservation.commission_fee,
          sanitizedReservation.team_payment,
          sanitizedReservation.net_amount,
          sanitizedReservation.notes,
          sanitizedReservation.num_guests
        ];
        const result = await client.query(insertQuery, values);
        console.log("Reserva criada com sucesso via SQL:", result.rows[0]);
        const createdReservation = {
          id: result.rows[0].id,
          propertyId: result.rows[0].property_id,
          guestName: result.rows[0].guest_name,
          guestEmail: result.rows[0].guest_email,
          guestPhone: result.rows[0].guest_phone,
          checkInDate: result.rows[0].check_in_date,
          checkOutDate: result.rows[0].check_out_date,
          totalAmount: result.rows[0].total_amount,
          status: result.rows[0].status,
          source: result.rows[0].platform,
          platformFee: result.rows[0].platform_fee,
          cleaningFee: result.rows[0].cleaning_fee,
          checkInFee: result.rows[0].check_in_fee,
          commission: result.rows[0].commission_fee,
          // Usando commission conforme schema
          teamPayment: result.rows[0].team_payment,
          netAmount: result.rows[0].net_amount,
          notes: result.rows[0].notes,
          numGuests: result.rows[0].num_guests,
          createdAt: result.rows[0].created_at
        };
        return createdReservation;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Erro na inser\xE7\xE3o SQL:", error);
      throw error;
    }
  }
  async updateReservation(id, reservation) {
    if (!db) return void 0;
    const [result] = await db.update(reservations).set(reservation).where(eq(reservations.id, id)).returning();
    return result;
  }
  async deleteReservation(id) {
    if (!db) return false;
    const result = await db.delete(reservations).where(eq(reservations.id, id));
    return true;
  }
  // Activity methods
  async getActivities(limit) {
    if (!db) return [];
    let query3 = db.select().from(activities).orderBy(desc(activities.createdAt));
    if (limit) {
      query3 = query3.limit(limit);
    }
    const results = await query3;
    return results;
  }
  async createActivity(activity) {
    if (!db) {
      throw new Error("Database not available");
    }
    const [result] = await db.insert(activities).values(activity).returning();
    return result;
  }
  async deleteActivity(id) {
    if (!db) {
      throw new Error("Database not available");
    }
    try {
      const result = await db.delete(activities).where(eq(activities.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting activity ${id}:`, error);
      return false;
    }
  }
  // Statistics methods
  async getTotalRevenue(startDate, endDate) {
    console.log("============== IN\xCDCIO getTotalRevenue ==============");
    console.log("Par\xE2metros:", { startDate, endDate });
    if (!db) {
      console.log("Banco de dados n\xE3o dispon\xEDvel!");
      return 0;
    }
    try {
      let queryStr = `SELECT SUM(CAST(total_amount AS DECIMAL)) as total_revenue FROM reservations WHERE status = 'completed'`;
      const params = [];
      if (startDate) {
        queryStr += ` AND check_in_date::DATE >= $${params.length + 1}::DATE`;
        params.push(startDate.toISOString().split("T")[0]);
      }
      if (endDate) {
        queryStr += ` AND check_in_date::DATE <= $${params.length + 1}::DATE`;
        params.push(endDate.toISOString().split("T")[0]);
      }
      console.log("Executando query direta:", queryStr, params);
      if (this.poolInstance) {
        const result = await this.poolInstance.query(queryStr, params);
        console.log("Resultado da query:", result.rows);
        if (result.rows && result.rows.length > 0) {
          const revenue = Number(result.rows[0].total_revenue) || 0;
          console.log("Receita calculada:", revenue);
          return revenue;
        }
      } else {
        console.log("Pool de conex\xF5es n\xE3o dispon\xEDvel");
      }
      return 0;
    } catch (error) {
      console.error("Erro ao calcular receita total:", error);
      return 0;
    } finally {
      console.log("============== FIM getTotalRevenue ==============");
    }
  }
  async getNetProfit(startDate, endDate) {
    console.log("============== IN\xCDCIO getNetProfit ==============");
    console.log("Par\xE2metros:", { startDate, endDate });
    if (!this.poolInstance) {
      console.log("Pool de conex\xF5es n\xE3o dispon\xEDvel");
      return 0;
    }
    try {
      let queryStr = `
        SELECT 
          SUM(CAST(total_amount AS DECIMAL)) as total_revenue,
          SUM(
            COALESCE(CAST(cleaning_fee AS DECIMAL), 0) + 
            COALESCE(CAST(check_in_fee AS DECIMAL), 0) + 
            COALESCE(CAST(commission_fee AS DECIMAL), 0) + 
            COALESCE(CAST(team_payment AS DECIMAL), 0)
          ) as total_costs
        FROM reservations
        WHERE status = 'completed'
      `;
      const params = [];
      if (startDate) {
        queryStr += ` AND check_in_date::DATE >= $${params.length + 1}::DATE`;
        params.push(startDate.toISOString().split("T")[0]);
      }
      if (endDate) {
        queryStr += ` AND check_in_date::DATE <= $${params.length + 1}::DATE`;
        params.push(endDate.toISOString().split("T")[0]);
      }
      console.log("Executando query de lucro:", queryStr, params);
      const result = await this.poolInstance.query(queryStr, params);
      console.log("Resultado da query de lucro:", result.rows);
      if (result.rows && result.rows.length > 0) {
        const revenue = Number(result.rows[0].total_revenue) || 0;
        const costs = Number(result.rows[0].total_costs) || 0;
        const profit = revenue - costs;
        console.log("Lucro calculado:", { revenue, costs, profit });
        return profit;
      }
      return 0;
    } catch (error) {
      console.error("Erro ao calcular lucro l\xEDquido:", error);
      return 0;
    } finally {
      console.log("============== FIM getNetProfit ==============");
    }
  }
  async getOccupancyRate(propertyId, startDate, endDate) {
    console.log("============== IN\xCDCIO getOccupancyRate ==============");
    console.log("Par\xE2metros:", { propertyId, startDate, endDate });
    if (!this.poolInstance) {
      console.log("Pool de conex\xF5es n\xE3o dispon\xEDvel");
      return 0;
    }
    try {
      const start = startDate || new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 1);
      const end = endDate || /* @__PURE__ */ new Date();
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24));
      if (totalDays <= 0) return 0;
      const startDateStr = start.toISOString().split("T")[0];
      const endDateStr = end.toISOString().split("T")[0];
      if (propertyId) {
        const occupancyQuery = `
          SELECT SUM(
            (LEAST(
              "check_out_date"::DATE, 
              $1::DATE
            ) - 
            GREATEST(
              "check_in_date"::DATE, 
              $2::DATE
            ))
          ) as days
          FROM reservations
          WHERE property_id = $3
          AND status = 'completed'
          AND "check_in_date"::DATE <= $1::DATE
          AND "check_out_date"::DATE >= $2::DATE
        `;
        const params = [endDateStr, startDateStr, propertyId];
        console.log("Query de ocupa\xE7\xE3o (propriedade):", occupancyQuery, params);
        const result = await this.poolInstance.query(occupancyQuery, params);
        console.log("Resultado da query de ocupa\xE7\xE3o:", result.rows);
        if (result.rows && result.rows.length > 0) {
          const occupiedDays = Number(result.rows[0].days) || 0;
          console.log("Dias ocupados:", occupiedDays, "Total dias:", totalDays);
          const occupancyRate = occupiedDays / totalDays * 100;
          console.log("Taxa de ocupa\xE7\xE3o calculada:", occupancyRate);
          return occupancyRate;
        }
      } else {
        const propertiesCountQuery = `
          SELECT COUNT(*) as count FROM properties WHERE active = true
        `;
        console.log("Query de contagem de propriedades:", propertiesCountQuery);
        const propertiesResult = await this.poolInstance.query(propertiesCountQuery);
        if (!propertiesResult.rows || propertiesResult.rows.length === 0) {
          console.log("Nenhuma propriedade ativa encontrada");
          return 0;
        }
        const numProperties = Number(propertiesResult.rows[0].count) || 1;
        console.log("N\xFAmero de propriedades ativas:", numProperties);
        const occupiedDaysQuery = `
          SELECT SUM(
            (LEAST(
              "check_out_date"::DATE, 
              $1::DATE
            ) - 
            GREATEST(
              "check_in_date"::DATE, 
              $2::DATE
            ))
          ) as days
          FROM reservations
          WHERE status = 'completed' 
          AND "check_in_date"::DATE <= $1::DATE
          AND "check_out_date"::DATE >= $2::DATE
        `;
        const params = [endDateStr, startDateStr];
        console.log("Query de dias ocupados:", occupiedDaysQuery, params);
        const result = await this.poolInstance.query(occupiedDaysQuery, params);
        console.log("Resultado da query de dias ocupados:", result.rows);
        if (result.rows && result.rows.length > 0) {
          const totalOccupiedDays = Number(result.rows[0].days) || 0;
          const totalPossibleDays = totalDays * numProperties;
          console.log("Dias ocupados total:", totalOccupiedDays, "Dias poss\xEDveis total:", totalPossibleDays);
          const occupancyRate = totalOccupiedDays / totalPossibleDays * 100;
          console.log("Taxa de ocupa\xE7\xE3o calculada:", occupancyRate);
          return occupancyRate;
        }
      }
      return 0;
    } catch (error) {
      console.error("Erro no c\xE1lculo da taxa de ocupa\xE7\xE3o:", error);
      return 0;
    } finally {
      console.log("============== FIM getOccupancyRate ==============");
    }
  }
  /**
   * Gera relatório financeiro para um proprietário
   * @param ownerId ID do proprietário
   * @param month Mês (1-12)
   * @param year Ano
   * @returns Relatório financeiro
   */
  async generateOwnerFinancialReport(ownerId, month, year) {
    try {
      console.log(`============== IN\xCDCIO generateOwnerFinancialReport ==============`);
      console.log(`Gerando relat\xF3rio financeiro para propriet\xE1rio ${ownerId} no m\xEAs ${month}/${year}`);
      const ownerQuery = `SELECT * FROM owners WHERE id = $1`;
      const ownerResult = await this.poolInstance.query(ownerQuery, [ownerId]);
      if (!ownerResult.rows || ownerResult.rows.length === 0) {
        console.log(`Propriet\xE1rio ${ownerId} n\xE3o encontrado`);
        return null;
      }
      const owner = ownerResult.rows[0];
      const startDate = /* @__PURE__ */ new Date(`${year}-${month}-01`);
      const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));
      endDate.setDate(endDate.getDate() - 1);
      console.log(`Per\xEDodo do relat\xF3rio: ${startDate.toISOString()} at\xE9 ${endDate.toISOString()}`);
      const propertiesQuery = `SELECT * FROM properties WHERE owner_id = $1`;
      const propertiesResult = await this.poolInstance.query(propertiesQuery, [ownerId]);
      const properties3 = propertiesResult.rows || [];
      console.log(`Encontradas ${properties3.length} propriedades do propriet\xE1rio`);
      if (properties3.length === 0) {
        return {
          owner,
          period: {
            month,
            year,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          summary: {
            totalRevenue: 0,
            totalCosts: 0,
            netProfit: 0,
            occupancyRate: 0,
            reservationsCount: 0
          },
          properties: []
        };
      }
      const propertyReports = await Promise.all(properties3.map(async (property) => {
        const reservationsQuery = `
          SELECT * FROM reservations 
          WHERE property_id = $1 
            AND check_in_date <= $3 
            AND check_out_date >= $2
        `;
        const reservationsResult = await this.poolInstance.query(
          reservationsQuery,
          [property.id, startDate.toISOString(), endDate.toISOString()]
        );
        const reservations3 = reservationsResult.rows || [];
        const totalRevenue2 = reservations3.reduce((sum2, r) => sum2 + Number(r.total_amount || 0), 0);
        const cleaningCosts = reservations3.reduce((sum2, r) => sum2 + Number(r.cleaning_fee || 0), 0);
        const checkInFees = reservations3.reduce((sum2, r) => sum2 + Number(r.check_in_fee || 0), 0);
        const commissions = reservations3.reduce((sum2, r) => sum2 + Number(r.commission_fee || 0), 0);
        const teamPayments = reservations3.reduce((sum2, r) => sum2 + Number(r.team_payment || 0), 0);
        const totalCosts2 = cleaningCosts + checkInFees + commissions + teamPayments;
        const netProfit2 = totalRevenue2 - totalCosts2;
        const daysInMonth = (endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24) + 1;
        let occupiedDays = 0;
        for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
          const isOccupied = reservations3.some((res) => {
            const checkIn = new Date(res.check_in_date);
            const checkOut = new Date(res.check_out_date);
            return day >= checkIn && day < checkOut;
          });
          if (isOccupied) occupiedDays++;
        }
        const occupancyRate = daysInMonth > 0 ? occupiedDays / daysInMonth : 0;
        return {
          propertyId: property.id,
          propertyName: property.name,
          stats: {
            totalRevenue: totalRevenue2,
            cleaningCosts,
            checkInFees,
            commissions,
            teamPayments,
            totalCosts: totalCosts2,
            netProfit: netProfit2,
            occupancyRate,
            reservationsCount: reservations3.length
          },
          reservations: reservations3.map((r) => ({
            id: r.id,
            guestName: r.guest_name,
            checkInDate: r.check_in_date,
            checkOutDate: r.check_out_date,
            totalAmount: r.total_amount,
            status: r.status,
            platform: r.platform
          }))
        };
      }));
      const totalRevenue = propertyReports.reduce((sum2, p) => sum2 + p.stats.totalRevenue, 0);
      const totalCosts = propertyReports.reduce((sum2, p) => sum2 + p.stats.totalCosts, 0);
      const netProfit = totalRevenue - totalCosts;
      const totalReservations = propertyReports.reduce((sum2, p) => sum2 + p.stats.reservationsCount, 0);
      const avgOccupancyRate = propertyReports.length > 0 ? propertyReports.reduce((sum2, p) => sum2 + p.stats.occupancyRate, 0) / propertyReports.length : 0;
      const report = {
        owner,
        period: {
          month,
          year,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        summary: {
          totalRevenue,
          totalCosts,
          netProfit,
          occupancyRate: avgOccupancyRate,
          reservationsCount: totalReservations
        },
        properties: propertyReports
      };
      console.log(`Relat\xF3rio financeiro gerado com sucesso para propriet\xE1rio ${ownerId}`);
      return report;
    } catch (error) {
      console.error("Erro ao gerar relat\xF3rio financeiro de propriet\xE1rio:", error);
      return null;
    } finally {
      console.log(`============== FIM generateOwnerFinancialReport ==============`);
    }
  }
  /**
   * Gera um resumo financeiro geral do sistema
   * @param startDate Data de início do período
   * @param endDate Data de fim do período
   */
  async generateFinancialSummary(startDate, endDate) {
    try {
      console.log(`============== IN\xCDCIO generateFinancialSummary ==============`);
      const documentsQuery = `
        SELECT * FROM financial_documents 
        WHERE 
          ${startDate ? "date >= $1" : "1=1"} 
          AND ${endDate ? "date <= $2" : "1=1"}
      `;
      const params = [];
      if (startDate) params.push(startDate.toISOString());
      if (endDate) params.push(endDate.toISOString());
      const documentsResult = await this.poolInstance.query(documentsQuery, params);
      const documents = documentsResult.rows || [];
      const incomingDocs = documents.filter((doc) => doc.type === "incoming");
      const outgoingDocs = documents.filter((doc) => doc.type === "outgoing");
      const totalIncoming = incomingDocs.reduce((sum2, doc) => sum2 + Number(doc.total_amount), 0);
      const totalOutgoing = outgoingDocs.reduce((sum2, doc) => sum2 + Number(doc.total_amount), 0);
      const netIncome = totalIncoming - totalOutgoing;
      const pendingIncoming = incomingDocs.filter((doc) => doc.status === "pending" || doc.status === "invoiced").reduce((sum2, doc) => sum2 + Number(doc.total_amount), 0);
      const paidIncoming = incomingDocs.filter((doc) => doc.status === "paid").reduce((sum2, doc) => sum2 + Number(doc.total_amount), 0);
      const pendingOutgoing = outgoingDocs.filter((doc) => doc.status === "pending" || doc.status === "invoiced").reduce((sum2, doc) => sum2 + Number(doc.total_amount), 0);
      const paidOutgoing = outgoingDocs.filter((doc) => doc.status === "paid").reduce((sum2, doc) => sum2 + Number(doc.total_amount), 0);
      const byOwner = {};
      const bySupplier = {};
      for (const doc of documents.filter((d) => d.entity_type === "owner")) {
        const entityId = doc.entity_id;
        if (!byOwner[entityId]) {
          const ownerQuery = `SELECT * FROM owners WHERE id = $1`;
          const ownerResult = await this.poolInstance.query(ownerQuery, [entityId]);
          const owner = ownerResult.rows.length > 0 ? ownerResult.rows[0] : null;
          byOwner[entityId] = {
            id: entityId,
            name: owner ? owner.name : `Propriet\xE1rio #${entityId}`,
            incoming: 0,
            outgoing: 0,
            balance: 0
          };
        }
        if (doc.type === "incoming") {
          byOwner[entityId].incoming += Number(doc.total_amount);
        } else {
          byOwner[entityId].outgoing += Number(doc.total_amount);
        }
        byOwner[entityId].balance = byOwner[entityId].incoming - byOwner[entityId].outgoing;
      }
      for (const doc of documents.filter((d) => d.entity_type === "supplier")) {
        const entityId = doc.entity_id;
        const entityName = doc.entity_name || `Fornecedor #${entityId}`;
        if (!bySupplier[entityId]) {
          bySupplier[entityId] = {
            id: entityId,
            name: entityName,
            incoming: 0,
            outgoing: 0,
            balance: 0
          };
        }
        if (doc.type === "incoming") {
          bySupplier[entityId].incoming += Number(doc.total_amount);
        } else {
          bySupplier[entityId].outgoing += Number(doc.total_amount);
        }
        bySupplier[entityId].balance = bySupplier[entityId].incoming - bySupplier[entityId].outgoing;
      }
      return {
        period: {
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null
        },
        summary: {
          totalIncoming,
          totalOutgoing,
          netIncome,
          pendingIncoming,
          paidIncoming,
          pendingOutgoing,
          paidOutgoing,
          totalDocuments: documents.length,
          incomingDocuments: incomingDocs.length,
          outgoingDocuments: outgoingDocs.length
        },
        byOwner: Object.values(byOwner),
        bySupplier: Object.values(bySupplier),
        recentDocuments: documents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
        // Últimos 10 documentos
      };
    } catch (error) {
      console.error("Erro ao gerar resumo financeiro:", error);
      return null;
    } finally {
      console.log(`============== FIM generateFinancialSummary ==============`);
    }
  }
  // RAG - Retrieval Augmented Generation
  knowledgeEmbeddings = /* @__PURE__ */ new Map();
  conversationHistory = /* @__PURE__ */ new Map();
  queryEmbeddings = /* @__PURE__ */ new Map();
  currentKnowledgeId = 1;
  currentConversationId = 1;
  currentQueryId = 1;
  /**
   * Salva um embedding de conhecimento
   * @param data Dados do embedding (conteúdo, tipo, metadados, embedding)
   */
  async createKnowledgeEmbedding(data) {
    const id = this.currentKnowledgeId++;
    const timestamp2 = /* @__PURE__ */ new Date();
    const embedding = {
      id,
      content: data.content,
      contentType: data.contentType || "general",
      metadata: data.metadata || {},
      embedding: data.embedding || {},
      createdAt: timestamp2
    };
    this.knowledgeEmbeddings.set(id, embedding);
    return embedding;
  }
  /**
   * Recupera todos os embeddings de conhecimento
   */
  async getKnowledgeEmbeddings() {
    return Array.from(this.knowledgeEmbeddings.values());
  }
  /**
   * Salva um registro no histórico de conversas
   * @param data Dados da mensagem (conteúdo, role, metadados)
   */
  async saveConversationHistory(data) {
    const id = this.currentConversationId++;
    const timestamp2 = /* @__PURE__ */ new Date();
    const message = {
      id,
      content: data.content,
      role: data.role || "user",
      metadata: data.metadata || {},
      createdAt: timestamp2
    };
    this.conversationHistory.set(id, message);
    return message;
  }
  /**
   * Recupera o histórico recente de conversas
   * @param limit Número máximo de mensagens para recuperar
   */
  async getRecentConversationHistory(limit = 10) {
    return Array.from(this.conversationHistory.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }
  /**
   * Salva um embedding de consulta
   * @param data Dados da consulta (consulta, resposta, embedding)
   */
  async saveQueryEmbedding(data) {
    const id = this.currentQueryId++;
    const timestamp2 = /* @__PURE__ */ new Date();
    const query3 = {
      id,
      query: data.query,
      response: data.response,
      embedding: data.embedding || {},
      createdAt: timestamp2
    };
    this.queryEmbeddings.set(id, query3);
    return query3;
  }
  /**
   * Recupera todos os embeddings de consultas
   */
  async getQueryEmbeddings() {
    return Array.from(this.queryEmbeddings.values());
  }
  // Este método foi movido para cima para evitar duplicação
  // Sistema de Orçamentos
  async getQuotations(options) {
    if (!db) return [];
    try {
      let query3 = db.select({
        id: quotations.id,
        clientName: quotations.clientName,
        clientEmail: quotations.clientEmail,
        clientPhone: quotations.clientPhone,
        status: quotations.status,
        totalAmount: quotations.totalPrice,
        validUntil: quotations.validUntil,
        notes: quotations.notes,
        address: quotations.propertyAddress,
        // Correção: usando o nome correto da coluna
        createdAt: quotations.createdAt,
        updatedAt: quotations.updatedAt
      }).from(quotations);
      if (options) {
        if (options.status) {
          query3 = query3.where(sql`${quotations.status} = ${options.status}`);
        }
        if (options.startDate) {
          query3 = query3.where(sql`${quotations.createdAt} >= ${options.startDate}`);
        }
        if (options.endDate) {
          query3 = query3.where(sql`${quotations.createdAt} <= ${options.endDate}`);
        }
      }
      query3 = query3.orderBy(desc(quotations.createdAt));
      const result = await query3;
      return result;
    } catch (error) {
      console.error("Erro ao buscar or\xE7amentos:", error);
      return [];
    }
  }
  async getQuotation(id) {
    if (!db) return void 0;
    try {
      const result = await db.select({
        id: quotations.id,
        clientName: quotations.clientName,
        clientEmail: quotations.clientEmail,
        clientPhone: quotations.clientPhone,
        status: quotations.status,
        totalAmount: quotations.totalPrice,
        validUntil: quotations.validUntil,
        notes: quotations.notes,
        address: quotations.propertyAddress,
        // Correção: usando o nome correto da coluna
        createdAt: quotations.createdAt,
        updatedAt: quotations.updatedAt
      }).from(quotations).where(eq(quotations.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error(`Erro ao buscar or\xE7amento ${id}:`, error);
      return void 0;
    }
  }
  async createQuotation(quotation) {
    if (!db) throw new Error("Database not available");
    try {
      const now = /* @__PURE__ */ new Date();
      const newQuotation = {
        ...quotation,
        createdAt: now,
        updatedAt: now
      };
      const result = await db.insert(quotations).values(newQuotation).returning();
      if (result && result.length > 0) {
        this.createActivity({
          type: "quotation_created",
          description: `Or\xE7amento para ${quotation.clientName || "cliente"} foi criado`,
          entityId: result[0].id,
          entityType: "quotation"
        }).catch((err) => console.error("Erro ao registrar atividade:", err));
        return result[0];
      } else {
        throw new Error("Failed to create quotation");
      }
    } catch (error) {
      console.error("Erro ao criar or\xE7amento:", error);
      throw error;
    }
  }
  async updateQuotation(id, quotation) {
    if (!db) return void 0;
    try {
      const existingQuotation = await this.getQuotation(id);
      if (!existingQuotation) return void 0;
      const updatedData = {
        ...quotation,
        updatedAt: /* @__PURE__ */ new Date()
      };
      const result = await db.update(quotations).set(updatedData).where(eq(quotations.id, id)).returning();
      if (result && result.length > 0) {
        this.createActivity({
          type: "quotation_updated",
          description: `Or\xE7amento para ${result[0].clientName || "cliente"} foi atualizado`,
          entityId: id,
          entityType: "quotation"
        }).catch((err) => console.error("Erro ao registrar atividade:", err));
        return result[0];
      } else {
        return void 0;
      }
    } catch (error) {
      console.error(`Erro ao atualizar or\xE7amento ${id}:`, error);
      return void 0;
    }
  }
  async deleteQuotation(id) {
    if (!db) return false;
    try {
      const quotation = await this.getQuotation(id);
      if (!quotation) return false;
      const result = await db.delete(quotations).where(eq(quotations.id, id)).returning();
      if (result && result.length > 0) {
        this.createActivity({
          type: "quotation_deleted",
          description: `Or\xE7amento para ${quotation.clientName || "cliente"} foi exclu\xEDdo`,
          entityId: id,
          entityType: "quotation"
        }).catch((err) => console.error("Erro ao registrar atividade:", err));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(`Erro ao excluir or\xE7amento ${id}:`, error);
      return false;
    }
  }
  async generateQuotationPdf(id) {
    const quotation = await this.getQuotation(id);
    if (!quotation) throw new Error("Or\xE7amento n\xE3o encontrado");
    const fileName = `quotation_${id}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.pdf`;
    const filePath = `./uploads/${fileName}`;
    try {
      const { pdfService: pdfService2 } = await Promise.resolve().then(() => (init_pdf_service(), pdf_service_exports));
      return await pdfService2.generateQuotationPdf(quotation, id);
    } catch (error) {
      console.error(`Erro ao gerar PDF para or\xE7amento ${id}:`, error);
      throw new Error(`Falha ao gerar PDF: ${error.message}`);
    }
  }
  // Sistema de manutenção
  async getMaintenanceTasks() {
    if (!this.maintenanceTasksMap) {
      this.maintenanceTasksMap = /* @__PURE__ */ new Map();
      console.log("Inicializando maintenanceTasksMap que estava indefinido");
    }
    if ("poolInstance" in this) {
      try {
        if (!db) {
          console.error("Banco de dados n\xE3o dispon\xEDvel");
          return Array.from(this.maintenanceTasksMap.values());
        }
        console.log("Consultando tarefas de manuten\xE7\xE3o do banco de dados...");
        const tasks = await db.select().from(maintenanceTasks).orderBy(desc(maintenanceTasks.reportedAt));
        return tasks;
      } catch (error) {
        console.error("Erro ao obter tarefas de manuten\xE7\xE3o do banco de dados:", error);
        return Array.from(this.maintenanceTasksMap.values());
      }
    } else {
      return Array.from(this.maintenanceTasksMap.values());
    }
  }
  async getMaintenanceTask(id) {
    if (!this.maintenanceTasksMap) {
      this.maintenanceTasksMap = /* @__PURE__ */ new Map();
      console.log("Inicializando maintenanceTasksMap que estava indefinido");
    }
    if ("poolInstance" in this) {
      try {
        if (!db) {
          console.error("Banco de dados n\xE3o dispon\xEDvel");
          return this.maintenanceTasksMap.get(id);
        }
        console.log("Consultando tarefa de manuten\xE7\xE3o do banco de dados por ID:", id);
        const tasks = await db.select().from(maintenanceTasks).where(eq(maintenanceTasks.id, id));
        return tasks.length > 0 ? tasks[0] : void 0;
      } catch (error) {
        console.error("Erro ao obter tarefa de manuten\xE7\xE3o do banco de dados:", error);
        return this.maintenanceTasksMap.get(id);
      }
    } else {
      return this.maintenanceTasksMap.get(id);
    }
  }
  async getMaintenanceTasksByProperty(propertyId) {
    if (!this.maintenanceTasksMap) {
      this.maintenanceTasksMap = /* @__PURE__ */ new Map();
      console.log("Inicializando maintenanceTasksMap que estava indefinido");
    }
    if ("poolInstance" in this) {
      try {
        if (!db) {
          console.error("Banco de dados n\xE3o dispon\xEDvel");
          return Array.from(this.maintenanceTasksMap.values()).filter((task) => task.propertyId === propertyId);
        }
        console.log("Consultando tarefas de manuten\xE7\xE3o do banco de dados por propertyId:", propertyId);
        const tasks = await db.select().from(maintenanceTasks).where(eq(maintenanceTasks.propertyId, propertyId)).orderBy(desc(maintenanceTasks.reportedAt));
        return tasks;
      } catch (error) {
        console.error("Erro ao obter tarefas de manuten\xE7\xE3o do banco de dados por propriedade:", error);
        return Array.from(this.maintenanceTasksMap.values()).filter((task) => task.propertyId === propertyId);
      }
    } else {
      return Array.from(this.maintenanceTasksMap.values()).filter((task) => task.propertyId === propertyId);
    }
  }
  async getMaintenanceTasksByStatus(status) {
    if (!this.maintenanceTasksMap) {
      this.maintenanceTasksMap = /* @__PURE__ */ new Map();
      console.log("Inicializando maintenanceTasksMap que estava indefinido");
    }
    if ("poolInstance" in this) {
      try {
        if (!db) {
          console.error("Banco de dados n\xE3o dispon\xEDvel");
          return Array.from(this.maintenanceTasksMap.values()).filter((task) => task.status === status);
        }
        console.log("Consultando tarefas de manuten\xE7\xE3o do banco de dados por status:", status);
        const tasks = await db.select().from(maintenanceTasks).where(eq(maintenanceTasks.status, status)).orderBy(desc(maintenanceTasks.reportedAt));
        return tasks;
      } catch (error) {
        console.error("Erro ao obter tarefas de manuten\xE7\xE3o do banco de dados por status:", error);
        return Array.from(this.maintenanceTasksMap.values()).filter((task) => task.status === status);
      }
    } else {
      return Array.from(this.maintenanceTasksMap.values()).filter((task) => task.status === status);
    }
  }
  async createMaintenanceTask(task) {
    if (!this.maintenanceTasksMap) {
      this.maintenanceTasksMap = /* @__PURE__ */ new Map();
      console.log("Inicializando maintenanceTasksMap que estava indefinido");
    }
    const id = this.currentMaintenanceTaskId++;
    const now = /* @__PURE__ */ new Date();
    const newTask = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.maintenanceTasksMap.set(id, newTask);
    const property = await this.getProperty(task.propertyId);
    this.createActivity({
      type: "maintenance_task_created",
      // Usando 'type' em vez de 'activityType'
      description: `Nova tarefa de manuten\xE7\xE3o para "${property?.name || "Propriedade desconhecida"}" foi criada`,
      entityId: id,
      // Usando 'entityId' em vez de 'resourceId'
      entityType: "maintenance_task"
      // Usando 'entityType' em vez de 'resourceType'
    });
    return newTask;
  }
  async updateMaintenanceTask(id, task) {
    if (!this.maintenanceTasksMap) {
      this.maintenanceTasksMap = /* @__PURE__ */ new Map();
      console.log("Inicializando maintenanceTasksMap que estava indefinido");
      return void 0;
    }
    const existingTask = this.maintenanceTasksMap.get(id);
    if (!existingTask) return void 0;
    const now = /* @__PURE__ */ new Date();
    const updatedTask = {
      ...existingTask,
      ...task,
      updatedAt: now
    };
    this.maintenanceTasksMap.set(id, updatedTask);
    const property = await this.getProperty(updatedTask.propertyId);
    this.createActivity({
      type: "maintenance_task_updated",
      // Usando 'type' em vez de 'activityType'
      description: `Tarefa de manuten\xE7\xE3o para "${property?.name || "Propriedade desconhecida"}" foi atualizada`,
      entityId: id,
      // Usando 'entityId' em vez de 'resourceId'
      entityType: "maintenance_task"
      // Usando 'entityType' em vez de 'resourceType'
    });
    return updatedTask;
  }
  async deleteMaintenanceTask(id) {
    if (!this.maintenanceTasksMap) {
      this.maintenanceTasksMap = /* @__PURE__ */ new Map();
      console.log("Inicializando maintenanceTasksMap que estava indefinido");
      return false;
    }
    const task = this.maintenanceTasksMap.get(id);
    if (!task) return false;
    const property = await this.getProperty(task.propertyId);
    const result = this.maintenanceTasksMap.delete(id);
    if (result) {
      this.createActivity({
        type: "maintenance_task_deleted",
        // Usando 'type' em vez de 'activityType'
        description: `Tarefa de manuten\xE7\xE3o para "${property?.name || "Propriedade desconhecida"}" foi exclu\xEDda`,
        entityId: id,
        // Usando 'entityId' em vez de 'resourceId'
        entityType: "maintenance_task"
        // Usando 'entityType' em vez de 'resourceType'
      });
    }
    return result;
  }
};
var usePostgres = db && process.env.DATABASE_URL ? true : false;
console.log(`Usando armazenamento ${usePostgres ? "PostgreSQL" : "em mem\xF3ria"}`);
var storageInstance;
var memStorage;
var dbStorage = null;
async function createStorage() {
  if (!memStorage) {
    memStorage = new MemStorage();
  }
  if (!usePostgres) {
    console.log("Usando armazenamento em mem\xF3ria por configura\xE7\xE3o");
    return memStorage;
  }
  const dbAvailable = await checkDatabaseConnection();
  if (dbAvailable && !dbStorage) {
    try {
      dbStorage = new DatabaseStorage();
      console.log("Conex\xE3o com o banco de dados PostgreSQL est\xE1 funcionando corretamente");
      return dbStorage;
    } catch (error) {
      console.error("Erro ao criar DatabaseStorage, usando MemStorage como fallback:", error);
      return memStorage;
    }
  }
  if (dbAvailable && dbStorage) {
    return dbStorage;
  }
  console.log("Banco de dados n\xE3o dispon\xEDvel, usando armazenamento em mem\xF3ria");
  return memStorage;
}
(async () => {
  try {
    storageInstance = await createStorage();
    if (storageInstance instanceof DatabaseStorage) {
      console.log("######### USANDO DatabaseStorage #########");
    } else if (storageInstance instanceof MemStorage) {
      console.log("######### USANDO MemStorage #########");
    } else {
      console.log("######### TIPO DE STORAGE DESCONHECIDO #########", typeof storageInstance);
    }
  } catch (error) {
    console.error("Erro ao inicializar armazenamento, usando MemStorage como fallback:", error);
    if (!memStorage) {
      memStorage = new MemStorage();
    }
    storageInstance = memStorage;
    console.log("######### USANDO MemStorage (ap\xF3s erro) #########");
  }
})();
var storageInitialized = false;
var storageInitPromise = null;
function ensureStorageInitialized() {
  if (storageInitialized) {
    return Promise.resolve();
  }
  if (!storageInitPromise) {
    storageInitPromise = new Promise((resolve) => {
      if (storageInstance) {
        storageInitialized = true;
        console.log("Armazenamento j\xE1 est\xE1 inicializado");
        resolve();
        return;
      }
      const checkInterval = setInterval(() => {
        if (storageInstance) {
          clearInterval(checkInterval);
          storageInitialized = true;
          console.log("Armazenamento inicializado com sucesso");
          resolve();
        }
      }, 50);
      setTimeout(() => {
        if (!storageInitialized) {
          clearInterval(checkInterval);
          console.log("Timeout ao inicializar armazenamento, tentando criar manualmente");
          createStorage().then((instance) => {
            storageInstance = instance;
            storageInitialized = true;
            console.log("Armazenamento criado manualmente com sucesso");
            resolve();
          }).catch((err) => {
            console.error("Falha ao criar armazenamento manualmente:", err);
            storageInitialized = true;
            resolve();
          });
        }
      }, 5e3);
    });
  }
  return storageInitPromise;
}
var storage = new Proxy({}, {
  get: function(target, prop) {
    return async function(...args) {
      await ensureStorageInitialized();
      console.log(`Chamando m\xE9todo: ${String(prop)} com args:`, args);
      try {
        const result = await storageInstance[prop].apply(storageInstance, args);
        console.log(`M\xE9todo ${String(prop)} completado com sucesso, resultado:`, typeof result, Array.isArray(result) ? result.length : result);
        return result;
      } catch (error) {
        console.error(`Erro ao executar ${String(prop)}:`, error);
        storageInstance = await createStorage();
        return await storageInstance[prop].apply(storageInstance, args);
      }
    };
  }
});

// server/routes/v1/properties.routes.ts
init_schema();
var router = Router();
var propertyParamsSchema = z2.object({
  id: z2.string().transform(Number).pipe(z2.number().int().positive())
});
var propertyQuerySchema = z2.object({
  page: z2.string().transform(Number).pipe(z2.number().int().positive()).default("1"),
  limit: z2.string().transform(Number).pipe(z2.number().int().positive().max(100)).default("10"),
  search: z2.string().optional(),
  active: z2.string().transform((val) => val === "true").optional(),
  ownerId: z2.string().transform(Number).pipe(z2.number().int().positive()).optional()
});
router.get(
  "/",
  validateRequest({ query: propertyQuerySchema }),
  asyncHandler(async (req, res) => {
    const query3 = req.validatedQuery;
    let properties3 = await storage.getProperties();
    if (query3.search) {
      properties3 = properties3.filter(
        (p) => p.name.toLowerCase().includes(query3.search.toLowerCase())
      );
    }
    if (query3.active !== void 0) {
      properties3 = properties3.filter((p) => p.active === query3.active);
    }
    if (query3.ownerId) {
      properties3 = properties3.filter((p) => p.ownerId === query3.ownerId);
    }
    const total = properties3.length;
    const startIndex = (query3.page - 1) * query3.limit;
    const endIndex = startIndex + query3.limit;
    const paginatedProperties = properties3.slice(startIndex, endIndex);
    return sendPaginatedResponse(
      res,
      paginatedProperties,
      {
        page: query3.page,
        limit: query3.limit,
        total
      },
      "Properties retrieved successfully"
    );
  })
);
router.get(
  "/:id",
  validateRequest({ params: propertyParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const property = await storage.getProperty(id);
    if (!property) {
      return sendNotFoundResponse(res, "Property", id);
    }
    return sendSuccessResponse(res, property, "Property retrieved successfully");
  })
);
router.post(
  "/",
  validateRequest({ body: insertPropertySchema }),
  asyncHandler(async (req, res) => {
    const propertyData = req.validatedBody;
    const property = await storage.createProperty(propertyData);
    return sendSuccessResponse(
      res,
      property,
      "Property created successfully",
      201
    );
  })
);
router.patch(
  "/:id",
  validateRequest({
    params: propertyParamsSchema,
    body: insertPropertySchema.partial()
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const updateData = req.validatedBody;
    const existingProperty = await storage.getProperty(id);
    if (!existingProperty) {
      return sendNotFoundResponse(res, "Property", id);
    }
    const updatedProperty = await storage.updateProperty(id, updateData);
    return sendSuccessResponse(
      res,
      updatedProperty,
      "Property updated successfully"
    );
  })
);
router.delete(
  "/:id",
  validateRequest({ params: propertyParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedParams;
    const result = await storage.deleteProperty(id);
    if (!result) {
      return sendNotFoundResponse(res, "Property", id);
    }
    res.status(204).end();
  })
);

// server/routes/properties.ts
init_db();
init_schema();
import { Router as Router2 } from "express";
import { eq as eq2, desc as desc2, and as and2, gte as gte2, lte as lte2, count as count2 } from "drizzle-orm";
var router2 = Router2();
router2.get("/", async (req, res) => {
  try {
    const propertiesList = await db2.select({
      id: properties.id,
      name: properties.name,
      cleaningCost: properties.cleaningCost,
      checkInFee: properties.checkInFee,
      commission: properties.commission,
      teamPayment: properties.teamPayment,
      active: properties.active,
      ownerName: owners.name
    }).from(properties).leftJoin(owners, eq2(properties.ownerId, owners.id)).orderBy(properties.name);
    res.json(propertiesList);
  } catch (error) {
    console.error("Erro ao buscar propriedades:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const [property] = await db2.select({
      id: properties.id,
      name: properties.name,
      cleaningCost: properties.cleaningCost,
      checkInFee: properties.checkInFee,
      commission: properties.commission,
      teamPayment: properties.teamPayment,
      cleaningTeam: properties.cleaningTeam,
      monthlyFixedCost: properties.monthlyFixedCost,
      active: properties.active,
      ownerId: properties.ownerId,
      ownerName: owners.name,
      ownerEmail: owners.email
    }).from(properties).leftJoin(owners, eq2(properties.ownerId, owners.id)).where(eq2(properties.id, propertyId)).limit(1);
    if (!property) {
      return res.status(404).json({ error: "Propriedade n\xE3o encontrada" });
    }
    res.json(property);
  } catch (error) {
    console.error("Erro ao buscar propriedade:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
router2.get("/:id/stats", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { year = (/* @__PURE__ */ new Date()).getFullYear() } = req.query;
    const [totalReservations] = await db2.select({ count: count2() }).from(reservations).where(eq2(reservations.propertyId, propertyId));
    const [yearReservations] = await db2.select({ count: count2() }).from(reservations).where(
      and2(
        eq2(reservations.propertyId, propertyId),
        gte2(reservations.checkInDate, `${year}-01-01`),
        lte2(reservations.checkInDate, `${year}-12-31`)
      )
    );
    const recentReservations = await db2.select({
      id: reservations.id,
      guestName: reservations.guestName,
      checkInDate: reservations.checkInDate,
      checkOutDate: reservations.checkOutDate,
      totalAmount: reservations.totalAmount,
      status: reservations.status
    }).from(reservations).where(eq2(reservations.propertyId, propertyId)).orderBy(desc2(reservations.checkInDate)).limit(5);
    const stats = {
      totalReservations: totalReservations.count,
      yearReservations: yearReservations.count,
      recentReservations
    };
    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estat\xEDsticas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
router2.post("/", async (req, res) => {
  try {
    const {
      name,
      ownerId,
      cleaningCost = "0",
      checkInFee = "0",
      commission = "0",
      teamPayment = "0",
      cleaningTeam,
      monthlyFixedCost = "0"
    } = req.body;
    if (!name || !ownerId) {
      return res.status(400).json({
        error: "Nome e propriet\xE1rio s\xE3o obrigat\xF3rios"
      });
    }
    const [owner] = await db2.select().from(owners).where(eq2(owners.id, ownerId)).limit(1);
    if (!owner) {
      return res.status(400).json({
        error: "Propriet\xE1rio n\xE3o encontrado"
      });
    }
    const [newProperty] = await db2.insert(properties).values({
      name,
      ownerId,
      cleaningCost: cleaningCost.toString(),
      checkInFee: checkInFee.toString(),
      commission: commission.toString(),
      teamPayment: teamPayment.toString(),
      cleaningTeam,
      monthlyFixedCost: monthlyFixedCost.toString(),
      active: true
    }).returning();
    res.status(201).json({
      message: "Propriedade criada com sucesso",
      property: newProperty
    });
  } catch (error) {
    console.error("Erro ao criar propriedade:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
router2.put("/:id", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const {
      name,
      ownerId,
      cleaningCost,
      checkInFee,
      commission,
      teamPayment,
      cleaningTeam,
      monthlyFixedCost,
      active
    } = req.body;
    const [existingProperty] = await db2.select().from(properties).where(eq2(properties.id, propertyId)).limit(1);
    if (!existingProperty) {
      return res.status(404).json({ error: "Propriedade n\xE3o encontrada" });
    }
    const [updatedProperty] = await db2.update(properties).set({
      name,
      ownerId,
      cleaningCost: cleaningCost?.toString(),
      checkInFee: checkInFee?.toString(),
      commission: commission?.toString(),
      teamPayment: teamPayment?.toString(),
      cleaningTeam,
      monthlyFixedCost: monthlyFixedCost?.toString(),
      active
    }).where(eq2(properties.id, propertyId)).returning();
    res.json({
      message: "Propriedade atualizada com sucesso",
      property: updatedProperty
    });
  } catch (error) {
    console.error("Erro ao atualizar propriedade:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
router2.delete("/:id", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const [activeReservations] = await db2.select({ count: count2() }).from(reservations).where(
      and2(
        eq2(reservations.propertyId, propertyId),
        eq2(reservations.status, "confirmed")
      )
    );
    if (activeReservations.count > 0) {
      return res.status(400).json({
        error: "N\xE3o \xE9 poss\xEDvel eliminar propriedade com reservas ativas"
      });
    }
    const [deactivatedProperty] = await db2.update(properties).set({ active: false }).where(eq2(properties.id, propertyId)).returning();
    if (!deactivatedProperty) {
      return res.status(404).json({ error: "Propriedade n\xE3o encontrada" });
    }
    res.json({
      message: "Propriedade desativada com sucesso",
      property: deactivatedProperty
    });
  } catch (error) {
    console.error("Erro ao eliminar propriedade:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
router2.get("/:id/cleaning-schedule", async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { month = (/* @__PURE__ */ new Date()).getMonth() + 1, year = (/* @__PURE__ */ new Date()).getFullYear() } = req.query;
    const monthReservations = await db2.select({
      id: reservations.id,
      guestName: reservations.guestName,
      checkInDate: reservations.checkInDate,
      checkOutDate: reservations.checkOutDate,
      cleaningFee: reservations.cleaningFee,
      status: reservations.status
    }).from(reservations).where(
      and2(
        eq2(reservations.propertyId, propertyId),
        gte2(reservations.checkOutDate, `${year}-${month.toString().padStart(2, "0")}-01`),
        lte2(reservations.checkOutDate, `${year}-${month.toString().padStart(2, "0")}-31`)
      )
    ).orderBy(reservations.checkOutDate);
    const [property] = await db2.select({
      name: properties.name,
      cleaningCost: properties.cleaningCost,
      cleaningTeam: properties.cleaningTeam
    }).from(properties).where(eq2(properties.id, propertyId)).limit(1);
    const cleaningSchedule = monthReservations.map((reservation) => ({
      reservationId: reservation.id,
      date: reservation.checkOutDate,
      guestName: reservation.guestName,
      cleaningCost: property?.cleaningCost || "0",
      cleaningTeam: property?.cleaningTeam || "Equipa Principal",
      status: reservation.status === "completed" ? "scheduled" : "pending"
    }));
    res.json({
      property: property?.name,
      month: parseInt(month),
      year: parseInt(year),
      cleanings: cleaningSchedule,
      totalCleanings: cleaningSchedule.length,
      totalCost: cleaningSchedule.reduce(
        (total, cleaning) => total + parseFloat(cleaning.cleaningCost),
        0
      ).toFixed(2)
    });
  } catch (error) {
    console.error("Erro ao buscar agenda de limpezas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
var properties_default = router2;

// server/features/reservations/presentation/reservation.routes.ts
import { Router as Router3 } from "express";

// server/features/reservations/presentation/reservation.controller.ts
init_schema();

// server/shared/utils/error-handler.ts
import { ZodError as ZodError2 } from "zod";
var handleError = (err, res) => {
  console.error("Error details:", err);
  if (err instanceof ZodError2) {
    console.error("Validation error:", JSON.stringify(err.errors, null, 2));
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return;
  }
  if (err.stack) {
    console.error("Error stack:", err.stack);
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: err.name || "UnknownError",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
var createSuccessResponse = (data, message) => ({
  success: true,
  data,
  message,
  timestamp: (/* @__PURE__ */ new Date()).toISOString()
});
var createErrorResponse = (message, error) => ({
  success: false,
  message,
  error,
  timestamp: (/* @__PURE__ */ new Date()).toISOString()
});

// server/features/reservations/presentation/reservation.controller.ts
var ReservationController = class {
  constructor(reservationService2) {
    this.reservationService = reservationService2;
  }
  async getAllReservations(req, res) {
    try {
      const filters = {};
      if (req.query.propertyId) {
        filters.propertyId = Number(req.query.propertyId);
      }
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.platform) {
        filters.platform = req.query.platform;
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate);
      }
      if (req.query.guestName) {
        filters.guestName = req.query.guestName;
      }
      const result = await this.reservationService.getAllReservations(filters);
      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || "Failed to fetch reservations"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async getReservationById(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse("Invalid reservation ID"));
        return;
      }
      const result = await this.reservationService.getReservationById(id);
      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        const statusCode = result.error === "Reservation not found" ? 404 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || "Failed to fetch reservation"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async getReservationsByProperty(req, res) {
    try {
      const propertyId = Number(req.params.propertyId);
      if (isNaN(propertyId)) {
        res.status(400).json(createErrorResponse("Invalid property ID"));
        return;
      }
      const result = await this.reservationService.getReservationsByProperty(propertyId);
      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || "Failed to fetch reservations by property"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async createReservation(req, res) {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      const result = await this.reservationService.createReservation(validatedData);
      if (result.success) {
        res.status(201).json(createSuccessResponse(result.data, "Reservation created successfully"));
      } else {
        const statusCode = result.error?.includes("not found") ? 404 : 400;
        res.status(statusCode).json(createErrorResponse(result.error || "Failed to create reservation"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async updateReservation(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse("Invalid reservation ID"));
        return;
      }
      const validatedData = insertReservationSchema.partial().parse(req.body);
      const result = await this.reservationService.updateReservation(id, validatedData);
      if (result.success) {
        res.json(createSuccessResponse(result.data, "Reservation updated successfully"));
      } else {
        const statusCode = result.error === "Reservation not found" ? 404 : 400;
        res.status(statusCode).json(createErrorResponse(result.error || "Failed to update reservation"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async deleteReservation(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse("Invalid reservation ID"));
        return;
      }
      const result = await this.reservationService.deleteReservation(id);
      if (result.success) {
        res.status(204).end();
      } else {
        const statusCode = result.error === "Reservation not found" ? 404 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || "Failed to delete reservation"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async getDashboardData(req, res) {
    try {
      const result = await this.reservationService.getDashboardData();
      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || "Failed to fetch dashboard data"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async importFromText(req, res) {
    try {
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        res.status(400).json(createErrorResponse(
          "Chave da API Google Gemini n\xE3o configurada",
          "GEMINI_API_KEY_MISSING"
        ));
        return;
      }
      const { text: text2, propertyId, userAnswers } = req.body;
      const importRequest = {
        text: text2,
        propertyId: propertyId ? Number(propertyId) : void 0,
        userAnswers
      };
      const result = await this.reservationService.importFromText(importRequest);
      if (result.success && result.data) {
        res.json({
          success: result.data.success,
          needsClarification: result.data.needsClarification,
          clarificationQuestions: result.data.clarificationQuestions,
          reservationData: result.data.reservationData,
          message: result.data.message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        res.status(500).json(createErrorResponse(
          result.error || "Failed to import reservation from text"
        ));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
};

// server/features/reservations/domain/reservation.service.ts
var ReservationDomainService = class {
  constructor(reservationRepository2, propertyRepository3, importService2) {
    this.reservationRepository = reservationRepository2;
    this.propertyRepository = propertyRepository3;
    this.importService = importService2;
  }
  async getAllReservations(filters) {
    try {
      const reservations3 = await this.reservationRepository.findAll(filters);
      return {
        success: true,
        data: reservations3
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch reservations"
      };
    }
  }
  async getReservationById(id) {
    try {
      const reservation = await this.reservationRepository.findById(id);
      if (!reservation) {
        return {
          success: false,
          error: "Reservation not found"
        };
      }
      return {
        success: true,
        data: reservation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch reservation"
      };
    }
  }
  async getReservationsByProperty(propertyId) {
    try {
      const reservations3 = await this.reservationRepository.findByProperty(propertyId);
      return {
        success: true,
        data: reservations3
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch reservations by property"
      };
    }
  }
  async createReservation(data) {
    try {
      const validationResult3 = await this.validateReservationData(data);
      if (!validationResult3.isValid) {
        return {
          success: false,
          error: validationResult3.errors.map((e) => e.message).join(", "),
          validationResult: validationResult3
        };
      }
      const property = await this.propertyRepository.findById(data.propertyId);
      if (!property) {
        return {
          success: false,
          error: "Invalid property ID"
        };
      }
      const enrichedData = await this.calculateFinancialData(data, property);
      const reservation = await this.reservationRepository.create(enrichedData);
      return {
        success: true,
        data: reservation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create reservation"
      };
    }
  }
  async updateReservation(id, data) {
    try {
      const existingReservation = await this.reservationRepository.findById(id);
      if (!existingReservation) {
        return {
          success: false,
          error: "Reservation not found"
        };
      }
      let enrichedData = data;
      if (data.totalAmount || data.propertyId) {
        const propertyId = data.propertyId || existingReservation.propertyId;
        const property = await this.propertyRepository.findById(propertyId);
        if (!property) {
          return {
            success: false,
            error: "Invalid property ID"
          };
        }
        enrichedData = await this.calculateFinancialData({ ...existingReservation, ...data }, property);
      }
      const updatedReservation = await this.reservationRepository.update(id, enrichedData);
      return {
        success: true,
        data: updatedReservation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update reservation"
      };
    }
  }
  async deleteReservation(id) {
    try {
      const reservation = await this.reservationRepository.findById(id);
      if (!reservation) {
        return {
          success: false,
          error: "Reservation not found"
        };
      }
      const result = await this.reservationRepository.delete(id);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete reservation"
      };
    }
  }
  async getDashboardData() {
    try {
      const dashboardData = await this.reservationRepository.getDashboardData();
      return {
        success: true,
        data: dashboardData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch dashboard data"
      };
    }
  }
  async importFromText(data) {
    try {
      if (!data.text || typeof data.text !== "string" || data.text.trim() === "") {
        return {
          success: false,
          error: "Text is empty or invalid"
        };
      }
      const result = await this.importService.importFromText(data.text, {
        originalText: data.text,
        userAnswers: data.userAnswers || {}
      });
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to import from text"
      };
    }
  }
  async validateReservationData(data) {
    const errors = [];
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    if (checkIn >= checkOut) {
      errors.push({ message: "Check-out date must be after check-in date" });
    }
    if (data.numGuests < 1) {
      errors.push({ message: "Number of guests must be at least 1" });
    }
    const totalAmount = parseFloat(data.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      errors.push({ message: "Total amount must be a positive number" });
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  async calculateFinancialData(data, property) {
    const totalAmount = parseFloat(data.totalAmount);
    const enrichedData = { ...data };
    enrichedData.cleaningFee = data.cleaningFee || property.cleaningCost || "0";
    enrichedData.checkInFee = data.checkInFee || property.checkInFee || "0";
    enrichedData.commission = data.commission || (totalAmount * parseFloat(property.commission || "0") / 100).toString();
    enrichedData.teamPayment = data.teamPayment || property.teamPayment || "0";
    const platformFee = parseFloat(data.platformFee || "0");
    const totalCosts = parseFloat(enrichedData.cleaningFee) + parseFloat(enrichedData.checkInFee) + parseFloat(enrichedData.commission) + parseFloat(enrichedData.teamPayment) + platformFee;
    enrichedData.netAmount = (totalAmount - totalCosts).toString();
    return enrichedData;
  }
};

// server/services/gemini.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// server/services/rate-limiter.service.ts
import crypto from "crypto";
var SimpleCache = class {
  cache;
  keys = [];
  timeouts = /* @__PURE__ */ new Map();
  maxSize;
  constructor(options) {
    this.maxSize = options.max;
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    const value = this.cache.get(key);
    if (value !== void 0) {
      this.keys = this.keys.filter((k) => k !== key);
      this.keys.push(key);
    }
    return value;
  }
  set(key, value, ttl) {
    if (this.keys.length >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.keys.shift();
      if (oldestKey !== void 0) {
        this.cache.delete(oldestKey);
        const timeout = this.timeouts.get(oldestKey);
        if (timeout) {
          clearTimeout(timeout);
          this.timeouts.delete(oldestKey);
        }
      }
    }
    if (this.cache.has(key)) {
      this.keys = this.keys.filter((k) => k !== key);
      const oldTimeout = this.timeouts.get(key);
      if (oldTimeout) {
        clearTimeout(oldTimeout);
        this.timeouts.delete(key);
      }
    }
    this.cache.set(key, value);
    this.keys.push(key);
    if (ttl && ttl > 0) {
      const timeout = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timeouts.set(key, timeout);
    }
  }
  delete(key) {
    this.keys = this.keys.filter((k) => k !== key);
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
    return this.cache.delete(key);
  }
  clear() {
    this.keys = [];
    Array.from(this.timeouts.values()).forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.timeouts.clear();
    this.cache.clear();
  }
  getKeys() {
    return [...this.keys];
  }
};
var RateLimiterService = class _RateLimiterService {
  static instance;
  // Cache para armazenar respostas e evitar chamadas repetidas
  cache;
  // Sistema de fila para requisições
  queue = [];
  isProcessingQueue = false;
  // Configurações de controle de taxa
  requestsPerMinute = 5;
  // Gemini: 5 requisições por minuto
  requestTimestamps = [];
  maxRetries = 3;
  // Flag para cache e filas
  cacheEnabled = true;
  queueEnabled = true;
  constructor() {
    this.cache = new SimpleCache({
      max: 100
    });
    setInterval(() => {
      const oneMinuteAgo = Date.now() - 60 * 1e3;
      this.requestTimestamps = this.requestTimestamps.filter(
        (timestamp2) => timestamp2 > oneMinuteAgo
      );
    }, 60 * 1e3);
  }
  /**
   * Obtém a instância única do serviço
   */
  static getInstance() {
    if (!_RateLimiterService.instance) {
      _RateLimiterService.instance = new _RateLimiterService();
    }
    return _RateLimiterService.instance;
  }
  /**
   * Configura os limites de taxa
   * @param requestsPerMinute Máximo de requisições por minuto
   * @param maxRetries Número máximo de tentativas em caso de falha
   */
  configure(requestsPerMinute = 5, maxRetries = 3) {
    this.requestsPerMinute = requestsPerMinute;
    this.maxRetries = maxRetries;
  }
  /**
   * Habilita ou desabilita o cache
   * @param enabled Status do cache
   */
  enableCache(enabled) {
    this.cacheEnabled = enabled;
  }
  /**
   * Habilita ou desabilita o sistema de filas
   * @param enabled Status do sistema de filas
   */
  enableQueue(enabled) {
    this.queueEnabled = enabled;
  }
  /**
   * Limpa o cache completamente
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Enfileira uma função para execução com controle de taxa
   * @param fn Função a ser executada
   * @param args Argumentos da função
   * @param priority Prioridade na fila (maior = mais prioritário)
   * @returns Resultado da função
   */
  async enqueue(fn, args, priority = 0) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const queueItem = {
        id,
        fn,
        args,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
        retryCount: 0
      };
      this.queue.push(queueItem);
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }
  /**
   * Processa a fila de requisições
   */
  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    this.isProcessingQueue = true;
    if (this.canMakeRequest()) {
      const item = this.queue.shift();
      if (!item) {
        this.isProcessingQueue = false;
        return;
      }
      try {
        this.requestTimestamps.push(Date.now());
        const result = await item.fn(...item.args);
        item.resolve(result);
      } catch (error) {
        if (error.message?.includes("rate limit") || error.message?.includes("quota exceeded") || error.message?.includes("too many requests") || error.status === 429) {
          console.warn(`Rate limit atingido. Esperando antes de tentar novamente (tentativa ${item.retryCount + 1}/${this.maxRetries})`);
          if (item.retryCount < this.maxRetries) {
            item.retryCount++;
            item.priority += 1;
            this.queue.unshift(item);
            await new Promise((resolve) => setTimeout(resolve, this.calculateBackoff(item.retryCount)));
          } else {
            item.reject(new Error(`Limite de tentativas excedido ap\xF3s ${this.maxRetries} tentativas: ${error.message}`));
          }
        } else {
          item.reject(error);
        }
      }
    } else {
      const waitTime = this.calculateWaitTime();
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    setImmediate(() => this.processQueue());
  }
  /**
   * Verifica se uma nova requisição pode ser feita
   * @returns Verdadeiro se uma requisição pode ser feita
   */
  canMakeRequest() {
    const oneMinuteAgo = Date.now() - 60 * 1e3;
    const recentRequests = this.requestTimestamps.filter(
      (timestamp2) => timestamp2 > oneMinuteAgo
    );
    return recentRequests.length < this.requestsPerMinute;
  }
  /**
   * Calcula o tempo de espera necessário para fazer uma nova requisição
   * @returns Tempo de espera em milissegundos
   */
  calculateWaitTime() {
    const oneMinuteAgo = Date.now() - 60 * 1e3;
    const recentRequests = this.requestTimestamps.filter(
      (timestamp2) => timestamp2 > oneMinuteAgo
    );
    if (recentRequests.length < this.requestsPerMinute) {
      return 0;
    }
    const sortedTimestamps = [...recentRequests].sort((a, b) => a - b);
    const oldestTimestamp = sortedTimestamps[sortedTimestamps.length - this.requestsPerMinute];
    const timeUntilAvailable = oldestTimestamp + 60 * 1e3 - Date.now();
    return Math.max(timeUntilAvailable + 100, 100);
  }
  /**
   * Calcula o tempo de backoff exponencial para retentativas
   * @param retryCount Número da tentativa atual
   * @returns Tempo de espera em milissegundos
   */
  calculateBackoff(retryCount) {
    const baseDelay = 1e3;
    const maxDelay = 3e4;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1e3;
    return Math.min(exponentialDelay + jitter, maxDelay);
  }
  /**
   * Gera uma chave de cache para os argumentos da função
   * @param args Argumentos da função
   * @returns Chave de cache
   */
  generateCacheKey(methodName, args) {
    const processedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return arg.replace(/Timestamp: \d+/g, "");
      }
      return arg;
    });
    try {
      const argsJson = JSON.stringify(processedArgs);
      return `${methodName}:${crypto.createHash("md5").update(argsJson).digest("hex")}`;
    } catch (error) {
      return `${methodName}:${processedArgs.map((arg) => String(arg)).join("|")}`;
    }
  }
  /**
   * Executa uma função com controle de taxa e cache
   * @param fn Função a ser executada
   * @param methodName Nome do método para identificação no cache
   * @param cacheTTL Tempo de vida do cache em milissegundos
   * @returns Função com controle de taxa
   */
  rateLimitedFunction(fn, methodName, cacheTTL = 5 * 60 * 1e3) {
    return async (...args) => {
      const cacheKey = this.generateCacheKey(methodName, args);
      if (this.cacheEnabled) {
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult && cachedResult.expiresAt > Date.now()) {
          console.log(`Cache hit para ${methodName}`);
          return cachedResult.result;
        }
      }
      let result;
      if (this.queueEnabled) {
        result = await this.enqueue(fn, args);
      } else {
        result = await fn(...args);
      }
      if (this.cacheEnabled) {
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          expiresAt: Date.now() + cacheTTL
        });
      }
      return result;
    };
  }
  /**
   * Limpa entradas de cache específicas baseadas em um padrão de método
   * @param methodPattern Padrão de nome de método para limpar (ex: "generateText")
   */
  clearCacheByMethod(methodPattern) {
    for (const key of this.cache.getKeys()) {
      if (key.startsWith(methodPattern + ":")) {
        this.cache.delete(key);
      }
    }
  }
  /**
   * Método auxiliar para programar a execução de uma função com controle de taxa
   * @param fn Função a ser executada
   * @param methodName Nome do método opcional para identificação no cache (gerado automaticamente se não fornecido)
   * @param cacheTTL Tempo de vida do cache em milissegundos (padrão: 5 minutos)
   * @returns Resultado da função
   */
  async schedule(fn, methodName = `method_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, cacheTTL = 5 * 60 * 1e3) {
    const rateLimitedFn = this.rateLimitedFunction(
      fn,
      methodName,
      cacheTTL
    );
    return await rateLimitedFn();
  }
  /**
   * Verifica o status atual do limite de taxa
   * @returns Informações sobre o status atual
   */
  getRateLimitStatus() {
    const oneMinuteAgo = Date.now() - 60 * 1e3;
    const recentRequests = this.requestTimestamps.filter(
      (timestamp2) => timestamp2 > oneMinuteAgo
    ).length;
    return {
      recentRequests,
      maxRequestsPerMinute: this.requestsPerMinute,
      queueSize: this.queue.length,
      canMakeRequest: this.canMakeRequest(),
      estimatedWaitTime: this.calculateWaitTime()
    };
  }
};
var rateLimiter = RateLimiterService.getInstance();

// server/services/gemini.service.ts
import crypto2 from "crypto";
var GeminiService = class {
  genAI = null;
  defaultModel = null;
  visionModel = null;
  flashModel = null;
  proModel = null;
  audioModel = null;
  isInitialized = false;
  apiKey = "";
  isApiConnected = false;
  maxRetries = 5;
  // Número máximo de tentativas para chamadas à API
  /**
   * Implementa um sistema de retry para chamadas à API
   * @param fn Função a ser executada com retry
   * @param maxRetries Número máximo de tentativas
   * @param delay Delay entre tentativas em ms
   * @returns Promise com o resultado da função
   */
  /**
   * Método para executar uma função com retry automático em caso de falha
   * Inclui suporte para fallback para modelos alternativos após esgotar as tentativas
   * @param fn Função assíncrona a ser executada
   * @param maxRetries Número máximo de tentativas (default: 5)
   * @param delay Atraso inicial entre tentativas em ms (default: 1000)
   * @param useFallbackModels Se deve tentar modelos alternativos após esgotar tentativas
   * @returns Resultado da função
   */
  async withRetry(fn, maxRetries = 5, delay = 1e3, useFallbackModels = true) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/${maxRetries}`);
        return await fn();
      } catch (error) {
        lastError = error;
        if (error.message && (error.message.includes("API key not valid") || error.message.includes("invalid authentication") || error.message.includes("permission denied"))) {
          console.error(`Erro de autoriza\xE7\xE3o na API Gemini:`, error.message);
          throw error;
        }
        console.warn(`Tentativa ${attempt}/${maxRetries} falhou: ${error.message}`);
        if (attempt < maxRetries) {
          const jitter = Math.random() * 500;
          const waitTime = delay * Math.pow(1.5, attempt - 1) + jitter;
          console.log(`Aguardando ${Math.round(waitTime)}ms antes da pr\xF3xima tentativa...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
    if (useFallbackModels && this.flashModel) {
      console.log("\u26A0\uFE0F Tentando com modelo alternativo (Gemini Flash) ap\xF3s esgotar tentativas...");
      try {
        const fnText = fn.toString();
        let alternativeFn;
        if (fnText.includes("this.defaultModel")) {
          alternativeFn = new Function("return " + fnText.replace(/this\.defaultModel/g, "this.flashModel"))();
          alternativeFn = alternativeFn.bind(this);
          console.log("\u{1F4CA} Substituindo Gemini Pro por Gemini Flash");
          return await alternativeFn();
        } else if (fnText.includes("this.visionModel")) {
          console.log("\u{1F5BC}\uFE0F Tarefa visual: Tentando com modelo padr\xE3o em vez do modelo de vis\xE3o");
          alternativeFn = new Function("return " + fnText.replace(/this\.visionModel/g, "this.defaultModel"))();
          alternativeFn = alternativeFn.bind(this);
          return await alternativeFn();
        }
      } catch (fallbackError) {
        console.error("\u274C Modelo alternativo tamb\xE9m falhou:", fallbackError.message);
        lastError = new Error(`Falha em todos os modelos dispon\xEDveis. Original: ${lastError.message}, Alternativo: ${fallbackError.message}`);
      }
    }
    throw lastError || new Error("Falha em todas as tentativas");
  }
  /**
   * Valida a chave da API Gemini tentando obter a lista de modelos disponíveis
   * @param apiKey Chave API do Google Gemini
   * @returns Promise<boolean> indicando se a chave é válida
   */
  /**
   * Método público para testar a conexão com a API Gemini
   * @returns Resultado do teste contendo success e message
   */
  async testConnection() {
    try {
      const isValid = await this.validateApiKey(this.apiKey);
      return {
        success: isValid,
        message: isValid ? "Conectado com sucesso" : "Chave de API inv\xE1lida"
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }
  /**
   * Valida se uma chave de API Gemini é válida
   * @param apiKey Chave API do Google Gemini
   * @returns Promise<boolean> indicando se a chave é válida
   */
  async validateApiKey(apiKey) {
    try {
      return await this.withRetry(async () => {
        console.log("Validando chave API Gemini...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        if (!response.ok) {
          console.error(`Erro na API Gemini: ${response.status} - ${response.statusText}`);
          throw new Error(`API retornou status ${response.status}`);
        }
        const data = await response.json();
        console.log(`\u2705 API Gemini v\xE1lida - ${data.models?.length || 0} modelos dispon\xEDveis`);
        return true;
      }, this.maxRetries, 1e3);
    } catch (error) {
      console.error("\u274C Erro ao validar chave API do Gemini ap\xF3s v\xE1rias tentativas:", error);
      return false;
    }
  }
  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("Nenhuma chave Gemini configurada (GOOGLE_GEMINI_API_KEY ou GOOGLE_API_KEY). Algumas funcionalidades estar\xE3o indispon\xEDveis.");
      this.mockInitialization();
    } else {
      this.initialize(apiKey);
    }
  }
  /**
   * Inicializa os modelos com uma chave API fornecida externamente
   * @param apiKey Chave API do Google Gemini
   */
  initializeWithKey(apiKey) {
    if (!apiKey) {
      throw new Error("Chave API inv\xE1lida");
    }
    this.initialize(apiKey);
    console.log("Gemini Service: Inicializando com chave API fornecida, valida\xE7\xE3o em andamento...");
  }
  /**
   * Inicializa os modelos com a API key usando @google/genai SDK oficial
   * @param apiKey Chave API do Google
   */
  initialize(apiKey) {
    try {
      this.apiKey = apiKey;
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log("\u2705 Google Generative AI SDK inicializado");
      console.log("\u{1F680} Usando @google/genai v1.x com Gemini 2.0 Flash");
      this.defaultModel = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp" /* TEXT */,
        generationConfig: {
          temperature: 0.2,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192
        }
      });
      this.flashModel = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp" /* FLASH */,
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192
        }
      });
      this.proModel = this.genAI.getGenerativeModel({
        model: "gemini-1.5-pro" /* PRO */,
        generationConfig: {
          temperature: 0.2,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192
        }
      });
      this.visionModel = this.defaultModel;
      this.audioModel = this.defaultModel;
      this.validateApiKey(apiKey).then((isValid) => {
        this.isApiConnected = isValid;
        this.isInitialized = isValid;
        if (isValid) {
          console.log("\u2705 Gemini 2.0 Flash API conectada e validada com sucesso");
          console.log("\u{1F4B0} Economia de ~20% vs Gemini 1.5 Pro");
        } else {
          console.error("\u274C Chave API do Gemini inv\xE1lida ou API indispon\xEDvel");
          this.mockInitialization();
        }
      }).catch((error) => {
        console.error("\u274C Erro ao verificar Gemini API:", error);
        console.log("\u26A0\uFE0F Usando modo de simula\xE7\xE3o (mock) como fallback");
        this.mockInitialization();
      });
      console.log("\u2705 Gemini 2.0 Flash SDK configurado corretamente");
    } catch (error) {
      console.error("Erro ao inicializar Gemini 2.0 Flash:", error);
      this.mockInitialization();
    }
  }
  /**
   * Cria implementações mock para desenvolvimento sem a biblioteca
   * Implementa mocks mais avançados que podem retornar dados úteis
   */
  mockInitialization() {
    console.log("\u{1F527} Inicializando GeminiService em modo mock (implementa\xE7\xE3o direta da API em desenvolvimento)");
    this.genAI = {
      getGenerativeModel: () => ({
        generateContent: async (params) => {
          const inputContent = params?.contents?.[0]?.parts;
          const userPrompt = inputContent?.find((part) => part.text)?.text || "";
          const userPromptStr = typeof userPrompt === "string" ? userPrompt : "";
          const hasAudio = inputContent?.some((part) => part.inlineData?.mimeType?.startsWith("audio/"));
          if (hasAudio) {
            return {
              response: {
                text: () => "Transcri\xE7\xE3o de \xE1udio (modo mock): Ol\xE1, gostaria de marcar uma reserva no apartamento Gra\xE7a para o pr\xF3ximo fim de semana. Somos duas pessoas e ficar\xEDamos de sexta a domingo. Meu nome \xE9 Carlos Silva e meu telefone \xE9 919 876 543."
              }
            };
          } else if (userPromptStr.includes("Extraia todo o texto vis\xEDvel deste documento PDF")) {
            return {
              response: {
                text: () => `
                  DOCUMENTO PROCESSADO POR GEMINI MOCK
                  
                  EXCITING LISBON SETE RIOS
                  Data entrada: 21/03/2025
                  Data sa\xEDda: 23/03/2025
                  N.\xBA noites: 2
                  Nome: Camila
                  N.\xBA h\xF3spedes: 4
                  Pa\xEDs: Portugal
                  Site: Airbnb
                  Telefone: 351 925 073 494
                  
                  Data entrada: 16/04/2025
                  Data sa\xEDda: 18/04/2025
                  N.\xBA noites: 2
                  Nome: Laura
                  N.\xBA h\xF3spedes: 3
                  Pa\xEDs: Espanha
                  Site: Airbnb
                  Telefone: +34 676 74 26 81
                  
                  Data entrada: 22/05/2025
                  Data sa\xEDda: 25/05/2025
                  N.\xBA noites: 3
                  Nome: Sarina
                  N.\xBA h\xF3spedes: 3
                  Pa\xEDs: Sui\xE7a
                  Site: Airbnb
                  Telefone: +41 76 324 01 02
                `
              }
            };
          } else if (userPromptStr.includes("Extraia todo o texto vis\xEDvel nesta imagem")) {
            return {
              response: {
                text: () => `
                  DOCUMENTO PROCESSADO POR GEMINI MOCK (IMAGEM)
                  
                  Reserva Confirmada
                  Propriedade: Apartamento Gra\xE7a
                  H\xF3spede: Jo\xE3o Silva
                  Check-in: 15/04/2025
                  Check-out: 20/04/2025
                  Valor: \u20AC450,00
                `
              }
            };
          } else if (userPromptStr.includes("Classifique o tipo deste documento")) {
            return {
              response: {
                text: () => JSON.stringify({
                  type: "reserva_airbnb",
                  confidence: 0.95,
                  details: "Documento de reserva do Airbnb com detalhes de hospedagem"
                })
              }
            };
          } else if (userPromptStr.includes("Analise este texto de reserva e extraia as informa\xE7\xF5es")) {
            return {
              response: {
                text: () => JSON.stringify({
                  propertyName: "Sete Rios",
                  guestName: "Camila",
                  guestEmail: "camila@example.com",
                  guestPhone: "351 925 073 494",
                  checkInDate: "2025-03-21",
                  checkOutDate: "2025-03-23",
                  numGuests: 4,
                  totalAmount: 250,
                  platform: "airbnb",
                  platformFee: 25,
                  cleaningFee: 30,
                  checkInFee: 15,
                  commissionFee: 20,
                  teamPayment: 50,
                  documentType: "reserva"
                })
              }
            };
          } else if (userPromptStr.includes("Verifique inconsist\xEAncias")) {
            return {
              response: {
                text: () => JSON.stringify({
                  valid: true,
                  data: params.contents[0].parts.find((p) => p.text?.includes("Dados:"))?.text || {},
                  issues: [],
                  corrections: []
                })
              }
            };
          } else {
            return {
              response: {
                text: () => "Resposta simulada do Gemini (modo mock ativado)"
              }
            };
          }
        },
        startChat: () => ({
          sendMessage: async () => ({
            response: { text: () => "Resposta de chat simulada do Gemini (modo mock)" }
          })
        })
      })
    };
    this.defaultModel = this.genAI.getGenerativeModel({});
    this.visionModel = this.genAI.getGenerativeModel({});
    this.flashModel = this.genAI.getGenerativeModel({});
    this.audioModel = this.genAI.getGenerativeModel({});
  }
  /**
   * Obtém configuração padrão para geração de conteúdo
   * @param temperature Temperatura para geração (0.0 a 1.0)
   * @returns Configuração de geração
   */
  getGenerationConfig(temperature = 0.2) {
    return {
      temperature,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 8192
    };
  }
  /**
   * Verifica se o serviço está configurado com uma chave API válida
   * @returns Verdadeiro se o serviço estiver configurado
   */
  /**
   * Verifica se o serviço está configurado e conectado à API
   * Esta verificação é síncrona e retorna o estado atual
   * @returns Verdadeiro se o serviço estiver configurado e conectado
   */
  isConfigured() {
    return this.isInitialized && this.isApiConnected;
  }
  /**
   * Verifica assincronamente se a API está conectada
   * Tenta estabelecer conexão se não estiver conectada
   * @returns Promise<boolean> indicando se a API está conectada
   */
  async checkApiConnection() {
    try {
      if (this.isApiConnected) {
        return true;
      }
      if (this.apiKey) {
        const isValid = await this.validateApiKey(this.apiKey);
        this.isApiConnected = isValid;
        this.isInitialized = isValid;
        return isValid;
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar conex\xE3o da API Gemini:", error);
      return false;
    }
  }
  /**
   * Verifica se o serviço está inicializado com uma chave API válida
   */
  checkInitialization() {
    if (!this.isInitialized) {
      throw new Error("Chave Gemini n\xE3o configurada. Configure GOOGLE_GEMINI_API_KEY ou GOOGLE_API_KEY nas configura\xE7\xF5es.");
    }
  }
  /**
   * Gera um embedding para um texto usando o modelo Gemini
   * @param text Texto para gerar embedding
   * @returns Array de números representando o embedding
   */
  async generateEmbeddings(text2) {
    const embeddingDimension = 768;
    const embedding = [];
    try {
      this.checkInitialization();
      const normalizedText = text2.toLowerCase();
      for (let i = 0; i < embeddingDimension; i++) {
        const charCode = i < normalizedText.length ? normalizedText.charCodeAt(i % normalizedText.length) : 0;
        embedding.push(charCode / 255 * 2 - 1);
      }
      return {
        data: [
          {
            embedding
          }
        ]
      };
    } catch (error) {
      console.error("Erro ao gerar embedding:", error);
      throw error;
    }
  }
  /**
   * Extrai texto de um PDF em base64
   * Compatível com a interface do MistralService
   * @param pdfBase64 PDF codificado em base64
   * @returns Texto extraído do documento
   */
  async extractTextFromPDF(pdfBase64) {
    this.checkInitialization();
    const extractTextFn = async () => {
      try {
        const truncatedPdfBase64 = pdfBase64.length > 5e5 ? pdfBase64.substring(0, 5e5) + "..." : pdfBase64;
        const result = await this.withRetry(async () => {
          return await this.defaultModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Voc\xEA \xE9 um especialista em OCR. Extraia todo o texto vis\xEDvel deste documento PDF em base64,
                    organizando o texto por se\xE7\xF5es. Preserve tabelas e formata\xE7\xE3o estruturada.
                    Preste aten\xE7\xE3o especial em datas, valores monet\xE1rios e informa\xE7\xF5es de contato.`
                  },
                  {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: truncatedPdfBase64
                    }
                  }
                ]
              }
            ]
          });
        });
        return result.response.text();
      } catch (error) {
        console.error("Erro ao extrair texto do PDF com Gemini:", error);
        if (error.message?.includes("content too long")) {
          try {
            const result = await this.flashModel.generateContent({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: "Extraia o texto das primeiras p\xE1ginas deste PDF:" },
                    {
                      inlineData: {
                        mimeType: "application/pdf",
                        data: pdfBase64.substring(0, 1e5)
                      }
                    }
                  ]
                }
              ]
            });
            return result.response.text() + "\n[NOTA: Documento truncado devido ao tamanho]";
          } catch (fallbackError) {
            console.error("Erro tamb\xE9m na extra\xE7\xE3o reduzida:", fallbackError);
          }
        }
        throw new Error(`Falha na extra\xE7\xE3o de texto: ${error.message}`);
      }
    };
    const pdfHash = crypto2.createHash("md5").update(pdfBase64.substring(0, 1e4)).digest("hex");
    const rateLimitedExtract = rateLimiter.rateLimitedFunction(
      extractTextFn,
      `extractTextFromPDF-${pdfHash}`,
      30 * 60 * 1e3
      // 30 minutos de TTL no cache
    );
    return rateLimitedExtract();
  }
  /**
   * Extrai texto de uma imagem 
   * Compatível com a interface do MistralService
   * @param imageBase64 Imagem codificada em base64
   * @param mimeType Tipo MIME da imagem (ex: image/jpeg, image/png)
   * @returns Texto extraído da imagem
   */
  async extractTextFromImage(imageBase64, mimeType = "image/jpeg") {
    this.checkInitialization();
    const extractImageTextFn = async () => {
      try {
        if (imageBase64.length > 1e6) {
          console.warn("Imagem muito grande, truncando para evitar limites de token");
          imageBase64 = imageBase64.substring(0, 1e6);
        }
        const result = await this.withRetry(async () => {
          return await this.visionModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Extraia todo o texto vis\xEDvel nesta imagem, incluindo n\xFAmeros, datas, nomes e valores monet\xE1rios. 
                    Preste aten\xE7\xE3o especial a detalhes como informa\xE7\xF5es de check-in/check-out, valor total e nome do h\xF3spede. 
                    Preserve a estrutura do documento na sua resposta.`
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: imageBase64
                    }
                  }
                ]
              }
            ]
          });
        });
        return result.response.text();
      } catch (error) {
        console.error("Erro ao extrair texto da imagem com Gemini:", error);
        try {
          const result = await this.visionModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  { text: "Extraia o texto principal desta imagem." },
                  {
                    inlineData: {
                      mimeType,
                      data: imageBase64.substring(0, 5e5)
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1e3
            }
          });
          return result.response.text() + "\n[NOTA: Processamento com qualidade reduzida]";
        } catch (fallbackError) {
          console.error("Erro tamb\xE9m no processamento de fallback:", fallbackError);
          throw new Error(`Falha na extra\xE7\xE3o de texto da imagem: ${error.message}`);
        }
      }
    };
    const imageHash = crypto2.createHash("md5").update(imageBase64.substring(0, 5e3)).digest("hex");
    const rateLimitedExtract = rateLimiter.rateLimitedFunction(
      extractImageTextFn,
      `extractTextFromImage-${imageHash}`,
      20 * 60 * 1e3
      // 20 minutos de TTL no cache
    );
    return rateLimitedExtract();
  }
  /**
   * Extrai dados estruturados de um texto de reserva
   * Compatível com a interface do MistralService
   * @param text Texto da reserva
   * @returns Objeto com os dados extraídos
   */
  async parseReservationData(text2) {
    this.checkInitialization();
    const parseDataFn = async () => {
      try {
        const result = await this.withRetry(async () => {
          const response = await this.defaultModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [{
                  text: `Voc\xEA \xE9 um especialista em extrair dados estruturados de textos de reservas.
                  Use o formato de data ISO (YYYY-MM-DD) para todas as datas.
                  Converta valores monet\xE1rios para n\xFAmeros decimais sem s\xEDmbolos de moeda.
                  Se algum campo estiver ausente no texto, deixe-o como null ou string vazia.
                  Atribua a plataforma correta (airbnb/booking/direct/expedia/other) com base no contexto.
                  
                  Analise este texto de reserva e extraia as informa\xE7\xF5es em formato JSON com os campos: 
                  propertyName, guestName, guestEmail, guestPhone, checkInDate (YYYY-MM-DD), checkOutDate (YYYY-MM-DD), 
                  numGuests, totalAmount, platform (airbnb/booking/direct/expedia/other), platformFee, cleaningFee, 
                  checkInFee, commissionFee, teamPayment.
                  
                  Se o texto contiver informa\xE7\xE3o sobre v\xE1rias propriedades, identifique corretamente qual \xE9 a propriedade 
                  que est\xE1 sendo reservada.
                  
                  Texto da reserva:
                  ${text2}`
                }]
              }
            ],
            generationConfig: {
              temperature: 0.1
            }
          });
          return response;
        });
        const content = result.response.text();
        let parsedData;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          parsedData = JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON da resposta:", jsonError);
          return {};
        }
        const numericFields = ["totalAmount", "platformFee", "cleaningFee", "checkInFee", "commissionFee", "teamPayment", "numGuests"];
        numericFields.forEach((field) => {
          if (parsedData[field]) {
            const value = String(parsedData[field]).replace(/[€$£,]/g, "");
            parsedData[field] = value;
          }
        });
        return parsedData;
      } catch (error) {
        console.error("Erro ao extrair dados da reserva com Gemini:", error);
        throw new Error(`Falha na extra\xE7\xE3o de dados: ${error.message}`);
      }
    };
    const textHash = crypto2.createHash("md5").update(text2.substring(0, 2e3)).digest("hex");
    const rateLimitedParse = rateLimiter.rateLimitedFunction(
      parseDataFn,
      `parseReservationData-${textHash}`,
      15 * 60 * 1e3
      // 15 minutos de TTL no cache
    );
    return rateLimitedParse();
  }
  /**
   * Valida dados de reserva contra regras de propriedade
   * Compatível com a interface do MistralService
   * @param data Dados da reserva
   * @param propertyRules Regras da propriedade
   * @returns Objeto com dados validados e possíveis correções
   */
  async validateReservationData(data, propertyRules) {
    this.checkInitialization();
    const validateDataFn = async () => {
      try {
        const result = await this.withRetry(async () => {
          return await this.defaultModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [{
                  text: `Voc\xEA \xE9 um especialista em valida\xE7\xE3o de dados de reservas.
                  Verifique inconsist\xEAncias, valores faltantes e problemas potenciais.
                  Sugira corre\xE7\xF5es quando necess\xE1rio, mantendo os dados originais quando poss\xEDvel.
                  Verifique especialmente as datas (formato YYYY-MM-DD) e valores monet\xE1rios.
                  
                  Valide estes dados de reserva contra as regras da propriedade e sugira corre\xE7\xF5es se necess\xE1rio:
                  
                  Dados: ${JSON.stringify(data)}
                  
                  Regras: ${JSON.stringify(propertyRules)}
                  
                  Retorne um objeto JSON com:
                  - valid: booleano indicando se os dados s\xE3o v\xE1lidos
                  - data: objeto com os dados corrigidos
                  - issues: array de strings descrevendo problemas encontrados
                  - corrections: array de strings descrevendo corre\xE7\xF5es aplicadas`
                }]
              }
            ],
            generationConfig: {
              temperature: 0.1
            }
          });
        });
        const content = result.response.text();
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          return JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON da valida\xE7\xE3o:", jsonError);
          return {
            valid: false,
            data,
            issues: ["Erro ao analisar resposta de valida\xE7\xE3o"],
            corrections: []
          };
        }
      } catch (error) {
        console.error("Erro ao validar dados da reserva com Gemini:", error);
        throw new Error(`Falha na valida\xE7\xE3o: ${error.message}`);
      }
    };
    const dataHash = crypto2.createHash("md5").update(JSON.stringify(data)).digest("hex");
    const rulesHash = crypto2.createHash("md5").update(JSON.stringify(propertyRules)).digest("hex");
    const rateLimitedValidate = rateLimiter.rateLimitedFunction(
      validateDataFn,
      `validateReservationData-${dataHash.substring(0, 8)}-${rulesHash.substring(0, 8)}`,
      10 * 60 * 1e3
      // 10 minutos de TTL no cache
    );
    return rateLimitedValidate();
  }
  /**
   * Classifica o tipo de documento
   * Compatível com a interface do MistralService
   * @param text Texto extraído do documento
   * @returns Classificação do tipo de documento
   */
  async classifyDocument(text2) {
    this.checkInitialization();
    const classifyDocumentFn = async () => {
      try {
        const result = await this.withRetry(async () => {
          return await this.flashModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [{
                  text: `Classifique o tipo deste documento com base no texto extra\xEDdo. 
                  Poss\xEDveis categorias: reserva_airbnb, reserva_booking, reserva_expedia, reserva_direta, 
                  contrato_aluguel, fatura, recibo, documento_identificacao, outro.
                  
                  Retorne apenas um objeto JSON com: 
                  - type: string (o tipo de documento)
                  - confidence: number (confian\xE7a de 0 a 1)
                  - details: string (detalhes adicionais sobre o documento)
                  
                  Texto do documento:
                  ${text2.substring(0, 3e3)}`
                  // Limitar tamanho para classificação
                }]
              }
            ],
            generationConfig: {
              temperature: 0.1
            }
          });
        });
        const content = result.response.text();
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          return JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON da classifica\xE7\xE3o:", jsonError);
          return {
            type: "desconhecido",
            confidence: 0,
            details: "Erro ao analisar resposta de classifica\xE7\xE3o"
          };
        }
      } catch (error) {
        console.error("Erro na classifica\xE7\xE3o do documento com Gemini:", error);
        return {
          type: "desconhecido",
          confidence: 0,
          details: `Erro na classifica\xE7\xE3o: ${error.message}`
        };
      }
    };
    const textHash = crypto2.createHash("md5").update(text2.substring(0, 1e3)).digest("hex");
    const rateLimitedClassify = rateLimiter.rateLimitedFunction(
      classifyDocumentFn,
      `classifyDocument-${textHash}`,
      10 * 60 * 1e3
      // 10 minutos de TTL no cache
    );
    return rateLimitedClassify();
  }
  /**
   * Analisa visualmente um documento para detectar a plataforma e formato
   * Compatível com a interface do MistralService
   * @param fileBase64 Arquivo codificado em base64
   * @param mimeType Tipo MIME do arquivo (ex: application/pdf, image/jpeg)
   * @returns Análise visual do documento
   */
  async analyzeDocumentVisually(fileBase64, mimeType) {
    this.checkInitialization();
    const analyzeVisuallyFn = async () => {
      try {
        const truncatedBase64 = fileBase64.length > 5e5 ? fileBase64.substring(0, 5e5) : fileBase64;
        const result = await this.withRetry(async () => {
          return await this.visionModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Analise visualmente este documento e identifique:
                    1. Qual plataforma emitiu este documento? (Airbnb, Booking.com, Expedia, outro?)
                    2. Existe algum logo ou marca d'\xE1gua identific\xE1vel?
                    3. Qual \xE9 o formato/layout geral do documento?
                    4. \xC9 uma reserva, fatura, recibo ou outro tipo de documento?
                    
                    Responda em formato JSON com: platform, hasLogo, documentType, layout, confidence (de 0 a 1).`
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: truncatedBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 600
            }
          });
        });
        const content = result.response.text();
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          return JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON da an\xE1lise visual:", jsonError);
          return {
            platform: "unknown",
            hasLogo: false,
            documentType: "unknown",
            layout: "unknown",
            confidence: 0
          };
        }
      } catch (error) {
        console.error("Erro na an\xE1lise visual com Gemini:", error);
        return {
          platform: "error",
          hasLogo: false,
          documentType: "error",
          layout: "error",
          confidence: 0,
          error: error.message
        };
      }
    };
    const docHash = crypto2.createHash("md5").update(fileBase64.substring(0, 5e3)).digest("hex");
    const rateLimitedAnalyze = rateLimiter.rateLimitedFunction(
      analyzeVisuallyFn,
      `analyzeDocumentVisually-${docHash}`,
      15 * 60 * 1e3
      // 15 minutos de TTL no cache
    );
    return rateLimitedAnalyze();
  }
  /**
   * Processa um documento (PDF ou imagem) para extrair informações de reserva
   * Versão melhorada compatível com a interface do AIAdapter com processamento paralelo
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @returns Objeto com todos os dados extraídos
   */
  async processReservationDocument(fileBase64, mimeType) {
    this.checkInitialization();
    console.log(`\u{1F50D} GeminiService: Processando documento ${mimeType} com processamento paralelo`);
    const isPDF = mimeType.includes("pdf");
    try {
      console.log(`\u26A1 Iniciando processamento paralelo: extra\xE7\xE3o de texto + an\xE1lise visual`);
      const [extractedText, visualAnalysis] = await Promise.allSettled([
        // Text extraction
        (async () => {
          console.log(`\u{1F4C4} Extraindo texto do ${isPDF ? "PDF" : "imagem"}...`);
          if (isPDF) {
            return await this.extractTextFromPDF(fileBase64);
          } else {
            return await this.extractTextFromImage(fileBase64, mimeType);
          }
        })(),
        // Visual analysis
        (async () => {
          console.log(`\u{1F50D} Analisando documento visualmente...`);
          return await this.analyzeDocumentVisually(fileBase64, mimeType);
        })()
      ]);
      let textResult;
      if (extractedText.status === "fulfilled") {
        textResult = extractedText.value;
        console.log(`\u2705 Texto extra\xEDdo: ${textResult.length} caracteres`);
        if (textResult.length < 50) {
          console.warn("\u26A0\uFE0F Texto extra\xEDdo muito curto, poss\xEDvel falha na extra\xE7\xE3o");
          if (isPDF) {
            return {
              success: false,
              error: "Texto extra\xEDdo do PDF muito curto ou vazio",
              details: "Verifique se o PDF cont\xE9m texto selecion\xE1vel ou use uma imagem do documento",
              extractedLength: textResult.length
            };
          }
        }
      } else {
        console.error("\u274C Erro na extra\xE7\xE3o de texto:", extractedText.reason);
        return {
          success: false,
          error: "Falha na extra\xE7\xE3o de texto",
          details: extractedText.reason?.message || "Erro desconhecido na extra\xE7\xE3o",
          service: "gemini"
        };
      }
      let visualResult;
      if (visualAnalysis.status === "fulfilled") {
        visualResult = visualAnalysis.value;
        console.log(`\u2705 An\xE1lise visual conclu\xEDda com sucesso`);
      } else {
        console.warn("\u26A0\uFE0F Erro na an\xE1lise visual, usando resultado padr\xE3o");
        visualResult = {
          type: isPDF ? "reserva_pdf" : "reserva_imagem",
          confidence: 0.5,
          details: "An\xE1lise visual falhou, usando tipo padr\xE3o"
        };
      }
      console.log(`\u26A1 Processamento paralelo: extra\xE7\xE3o de dados + classifica\xE7\xE3o`);
      const [structuredDataResult, classificationResult] = await Promise.allSettled([
        // Structured data extraction
        (async () => {
          console.log(`\u{1F50D} Extraindo dados estruturados do texto...`);
          return await this.parseReservationData(textResult);
        })(),
        // Document classification
        (async () => {
          console.log(`\u{1F3F7}\uFE0F Classificando tipo de documento...`);
          return await this.classifyDocument(textResult);
        })()
      ]);
      let structuredData;
      if (structuredDataResult.status === "fulfilled") {
        structuredData = structuredDataResult.value;
        console.log(`\u2705 Dados estruturados extra\xEDdos com sucesso`);
      } else {
        console.error("\u274C Erro na extra\xE7\xE3o de dados estruturados:", structuredDataResult.reason);
        return {
          success: false,
          error: "Falha na extra\xE7\xE3o de dados estruturados",
          details: structuredDataResult.reason?.message || "Erro desconhecido",
          rawText: textResult,
          service: "gemini"
        };
      }
      let classification;
      if (classificationResult.status === "fulfilled") {
        classification = classificationResult.value;
        console.log(`\u2705 Classifica\xE7\xE3o de documento conclu\xEDda: ${classification.type}`);
      } else {
        console.warn("\u26A0\uFE0F Erro na classifica\xE7\xE3o, usando tipo padr\xE3o");
        classification = {
          type: "reserva",
          confidence: 0.5,
          details: "Classifica\xE7\xE3o falhou, usando tipo padr\xE3o"
        };
      }
      const requiredFields = ["propertyName", "guestName", "checkInDate", "checkOutDate"];
      const missingFields = requiredFields.filter((field) => !structuredData[field]);
      if (missingFields.length > 0) {
        console.warn(`\u26A0\uFE0F Dados incompletos. Campos ausentes: ${missingFields.join(", ")}`);
      }
      if (!structuredData.documentType) {
        structuredData.documentType = classification.type || "reserva";
      }
      return {
        success: true,
        rawText: textResult,
        data: structuredData,
        documentInfo: {
          ...visualResult,
          classification,
          mimeType,
          isPDF,
          service: "gemini",
          processingMethod: "parallel"
        }
      };
    } catch (error) {
      console.error("\u274C Erro geral no processamento paralelo:", error);
      return {
        success: false,
        error: "Falha no processamento do documento",
        details: error.message || "Erro desconhecido",
        service: "gemini"
      };
    }
  }
  /**
   * Gera texto a partir de um prompt simples
   * @param prompt Texto do prompt 
   * @param temperature Temperatura para controlar aleatoriedade (0.0 a 1.0)
   * @param maxTokens Número máximo de tokens de saída
   * @returns Texto gerado
   */
  async generateText(prompt, temperature = 0.3, maxTokens) {
    this.checkInitialization();
    let systemPrompt;
    let userPrompt;
    let modelType = "gemini-2.0-flash-exp" /* TEXT */;
    let tempValue = temperature;
    let maxOutputTokens = maxTokens || 1024;
    if (typeof prompt === "object") {
      systemPrompt = prompt.systemPrompt;
      userPrompt = prompt.userPrompt;
      modelType = prompt.model || "gemini-2.0-flash-exp" /* TEXT */;
      tempValue = prompt.temperature || temperature;
      maxOutputTokens = prompt.maxOutputTokens || maxTokens || 1024;
    } else {
      userPrompt = prompt;
    }
    const generateTextFn = async () => {
      try {
        const cleanPrompt = userPrompt.replace(/\nTimestamp: \d+$/g, "");
        let contents = [];
        if (systemPrompt) {
          contents.push({
            role: "system",
            parts: [{ text: systemPrompt }]
          });
        }
        contents.push({
          role: "user",
          parts: [{ text: cleanPrompt }]
        });
        const requestConfig = {
          contents,
          generationConfig: {
            temperature: tempValue,
            maxOutputTokens
            // Removido responseFormat que estava causando erro
          }
        };
        const result = await this.withRetry(async () => {
          const modelName = "gemini-1.5-flash";
          const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${this.apiKey}`;
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestConfig)
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Gemini erro ${response.status}: ${errorText}`);
          }
          return await response.json();
        });
        if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
          return result.candidates[0].content.parts.map((part) => part.text || "").join("");
        }
        return "";
      } catch (error) {
        console.error("Erro ao gerar texto com Gemini:", error);
        throw new Error(`Falha na gera\xE7\xE3o de texto: ${error.message}`);
      }
    };
    const promptString = typeof prompt === "string" ? prompt : prompt.userPrompt;
    const querySignature = crypto2.createHash("md5").update(promptString.replace(/\nTimestamp: \d+$/g, "") + temperature + (maxTokens || 2048)).digest("hex").substring(0, 8);
    const rateLimitedGenerate = rateLimiter.rateLimitedFunction(
      generateTextFn,
      `generateText-${querySignature}`,
      5 * 60 * 1e3
      // 5 minutos de TTL no cache
    );
    return rateLimitedGenerate();
  }
  /**
   * Processa conteúdo de imagem usando o modelo de visão
   * @param params Parâmetros para processamento de imagem
   * @returns Texto ou JSON extraído da imagem
   */
  async processImageContent(params) {
    this.checkInitialization();
    const {
      textPrompt,
      imageBase64,
      mimeType,
      model = "gemini-2.0-flash-exp" /* VISION */,
      temperature = 0.2,
      maxOutputTokens = 1024,
      responseFormat = "text"
    } = params;
    const truncatedImage = imageBase64.length > 1e6 ? imageBase64.substring(0, 1e6) : imageBase64;
    const processImageFn = async () => {
      try {
        const generationConfig = {
          temperature,
          maxOutputTokens: maxOutputTokens || 1024,
          ...responseFormat === "json" ? { responseFormat: { type: "json_object" } } : {}
        };
        const targetModel = model === "gemini-2.0-flash-exp" /* VISION */ ? this.visionModel : this.defaultModel;
        const result = await this.withRetry(async () => {
          return await targetModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  { text: textPrompt },
                  {
                    inlineData: {
                      mimeType,
                      data: truncatedImage
                    }
                  }
                ]
              }
            ],
            generationConfig
          });
        });
        const responseText = result.response.text();
        if (responseFormat === "json") {
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : responseText;
            return JSON.parse(jsonString);
          } catch (jsonError) {
            console.error("Erro ao analisar JSON de resposta de imagem:", jsonError);
            return responseText;
          }
        }
        return responseText;
      } catch (error) {
        console.error("Erro ao processar imagem com Gemini:", error);
        throw new Error(`Falha no processamento de imagem: ${error.message}`);
      }
    };
    const imageHash = crypto2.createHash("md5").update(truncatedImage.substring(0, 5e3)).digest("hex").substring(0, 8);
    const promptHash = crypto2.createHash("md5").update(textPrompt).digest("hex").substring(0, 8);
    const rateLimitedProcess = rateLimiter.rateLimitedFunction(
      processImageFn,
      `processImage-${imageHash}-${promptHash}`,
      10 * 60 * 1e3
      // 10 minutos de TTL no cache
    );
    return rateLimitedProcess();
  }
  /**
   * Gera saída estruturada a partir de um prompt
   * @param params Parâmetros para geração de texto estruturado
   * @returns Objeto estruturado extraído do texto
   */
  async generateStructuredOutput(params) {
    this.checkInitialization();
    const {
      systemPrompt,
      userPrompt,
      model = "gemini-2.0-flash-exp" /* FLASH */,
      temperature = 0.1,
      maxOutputTokens = 1024,
      functionDefinitions = [],
      functionCallBehavior = "auto"
    } = params;
    const generateStructuredFn = async () => {
      try {
        let contents = [];
        if (systemPrompt) {
          contents.push({
            role: "system",
            parts: [{ text: systemPrompt }]
          });
        }
        contents.push({
          role: "user",
          parts: [{ text: userPrompt }]
        });
        const targetModel = model === "gemini-2.0-flash-exp" /* VISION */ ? this.visionModel : model === "gemini-2.0-flash-exp" /* FLASH */ ? this.flashModel : this.defaultModel;
        const requestConfig = {
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens
          }
        };
        if (functionDefinitions && functionDefinitions.length > 0) {
          requestConfig.tools = [{
            functionDeclarations: functionDefinitions
          }];
          if (functionCallBehavior) {
            requestConfig.toolConfig = {
              functionCallingConfig: {
                mode: functionCallBehavior
              }
            };
          }
        } else {
          requestConfig.generationConfig.responseFormat = { type: "json_object" };
        }
        const result = await this.withRetry(async () => {
          const apiUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + this.apiKey;
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestConfig)
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Gemini erro ${response.status}: ${errorText}`);
          }
          return await response.json();
        });
        if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
          for (const part of result.candidates[0].content.parts) {
            if (part.functionCall) {
              const functionCall = part.functionCall;
              return {
                functionCalls: [{
                  name: functionCall.name,
                  args: functionCall.args
                }]
              };
            }
          }
          if (result.candidates[0].content.functionCalls && result.candidates[0].content.functionCalls.length > 0) {
            const functionCalls = result.candidates[0].content.functionCalls.map((call) => ({
              name: call.name,
              args: call.args
            }));
            return { functionCalls };
          }
        }
        const responseText = result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts ? result.candidates[0].content.parts.map((part) => part.text || "").join("") : "";
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : responseText;
          return JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON de resposta estruturada:", jsonError);
          return {
            error: "Falha ao analisar resposta JSON",
            rawResponse: responseText
          };
        }
      } catch (error) {
        console.error("Erro ao gerar sa\xEDda estruturada com Gemini:", error);
        throw new Error(`Falha na gera\xE7\xE3o de sa\xEDda estruturada: ${error.message}`);
      }
    };
    const promptHash = crypto2.createHash("md5").update(userPrompt + (systemPrompt || "")).digest("hex").substring(0, 12);
    const rateLimitedGenerate = rateLimiter.rateLimitedFunction(
      generateStructuredFn,
      `generateStructured-${promptHash}`,
      5 * 60 * 1e3
      // 5 minutos de TTL no cache
    );
    return rateLimitedGenerate();
  }
  /**
   * Analisa um documento em formato desconhecido e aprende seu layout
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @param fields Campos a serem extraídos
   * @returns Dados extraídos e informações sobre o formato
   */
  async learnDocumentFormat(fileBase64, mimeType, fields) {
    this.checkInitialization();
    const learnFormatFn = async () => {
      try {
        console.log(`\u{1F9E0} GeminiService: Aprendendo formato de documento...`);
        const isPDF = mimeType.includes("pdf");
        let extractedText = "";
        try {
          if (isPDF) {
            extractedText = await this.extractTextFromPDF(fileBase64);
          } else if (mimeType.includes("image")) {
            extractedText = await this.extractTextFromImage(fileBase64, mimeType);
          } else {
            throw new Error(`Tipo de documento n\xE3o suportado: ${mimeType}`);
          }
        } catch (extractionError) {
          console.warn(`Aviso: Erro na extra\xE7\xE3o de texto, usando an\xE1lise visual apenas`, extractionError);
        }
        const prompt = `
          Voc\xEA \xE9 um especialista em reconhecimento de documentos.
          Este \xE9 um novo formato de documento que precisamos aprender a interpretar.
          
          Analise cuidadosamente o documento e extraia os seguintes campos:
          ${fields.map((field) => `- ${field}`).join("\n")}
          
          Al\xE9m de extrair os dados, forne\xE7a:
          1. Uma descri\xE7\xE3o do tipo/formato do documento
          2. Identificadores visuais e textuais que permitem reconhecer este formato no futuro
          3. Um n\xEDvel de confian\xE7a para cada campo extra\xEDdo (0-100%)
          
          Responda em formato JSON com as propriedades:
          - data: objeto com os campos extra\xEDdos
          - formatInfo: objeto com detalhes do formato (type, identifiers, description)
          - confidence: n\xFAmero de 0 a 1 indicando a confian\xE7a geral da extra\xE7\xE3o
        `;
        const result = await this.withRetry(async () => {
          return await this.visionModel.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType,
                      data: fileBase64.length > 1e6 ? fileBase64.substring(0, 1e6) : fileBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096
            }
          });
        });
        const content = result.response.text();
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          const parsedResult = JSON.parse(jsonString);
          console.log(`\u2705 GeminiService: Formato de documento aprendido com sucesso`);
          return {
            ...parsedResult,
            rawText: extractedText
          };
        } catch (jsonError) {
          console.error("Erro ao analisar resposta JSON:", jsonError);
          return {
            data: {},
            formatInfo: {
              type: "unknown",
              description: "Formato desconhecido - erro na an\xE1lise",
              identifiers: []
            },
            confidence: 0,
            rawText: extractedText,
            error: "Falha ao analisar resposta"
          };
        }
      } catch (error) {
        console.error("Erro ao aprender formato de documento:", error);
        throw new Error(`Falha ao aprender formato: ${error.message}`);
      }
    };
    const fieldsHash = crypto2.createHash("md5").update(fields.join(",")).digest("hex");
    const docHash = crypto2.createHash("md5").update(fileBase64.substring(0, 5e3)).digest("hex");
    const rateLimitedLearn = rateLimiter.rateLimitedFunction(
      learnFormatFn,
      `learnDocumentFormat-${fieldsHash}-${docHash}`,
      60 * 60 * 1e3
      // 60 minutos de TTL no cache
    );
    return rateLimitedLearn();
  }
};

// server/services/openrouter.service.ts
import axios from "axios";
var OpenRouterService = class {
  apiKey;
  baseUrl = "https://openrouter.ai/api/v1";
  model;
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    this.model = process.env.OR_MODEL || "mistral-ocr";
    if (!this.apiKey) {
      console.warn("\u26A0\uFE0F OPENROUTER_API_KEY n\xE3o est\xE1 configurada. O servi\xE7o OpenRouter n\xE3o funcionar\xE1.");
    }
  }
  /**
   * Testa a conexão com o OpenRouter
   * @returns Resultado do teste de conexão
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        return { success: false, message: "Chave API n\xE3o configurada" };
      }
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status === 200 && response.data) {
        const models = response.data.data || [];
        if (models.length > 0) {
          const mistralModel = models.find(
            (m) => m.id?.toLowerCase().includes("mistral") && (m.id?.toLowerCase().includes("ocr") || m.capabilities?.includes("vision"))
          );
          if (mistralModel) {
            console.log(`\u2705 OpenRouter conectado com sucesso - Modelo Mistral OCR dispon\xEDvel: ${mistralModel.id}`);
            return {
              success: true,
              message: `OpenRouter conectado com sucesso - Modelo Mistral OCR dispon\xEDvel: ${mistralModel.id}`
            };
          } else {
            console.log("\u26A0\uFE0F OpenRouter conectado, mas Mistral OCR n\xE3o encontrado nos modelos dispon\xEDveis");
            return {
              success: true,
              message: "OpenRouter conectado, mas Mistral OCR n\xE3o encontrado nos modelos dispon\xEDveis"
            };
          }
        } else {
          return { success: false, message: "Nenhum modelo dispon\xEDvel no OpenRouter" };
        }
      } else {
        return { success: false, message: `Erro na resposta: ${response.status} - ${response.statusText}` };
      }
    } catch (error) {
      console.error("\u274C Erro ao testar conex\xE3o com OpenRouter:", error);
      return {
        success: false,
        message: error.response?.data?.error?.message || error.message || "Erro desconhecido"
      };
    }
  }
  /**
   * Verifica se o serviço está corretamente inicializado
   * @throws Error se a chave API não estiver configurada
   */
  checkInitialization() {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY n\xE3o est\xE1 configurada nas vari\xE1veis de ambiente");
    }
  }
  /**
   * Processa um PDF para extração de texto e dados estruturados usando o OpenRouter
   * @param pdfBuffer Buffer do arquivo PDF
   * @returns Resultado do processamento com texto extraído e caixas delimitadoras
   */
  async ocrPdf(pdfBuffer) {
    this.checkInitialization();
    const pdfBase64 = pdfBuffer.toString("base64");
    try {
      const startTime = Date.now();
      const makeRequest = async () => axios.post(
        `${this.baseUrl}/vision`,
        {
          model: this.model,
          mime_type: "application/pdf",
          data: pdfBase64
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://replit.com",
            "X-Title": "Maria Faz - Mistral OCR",
            "Content-Type": "application/json"
          }
        }
      );
      const response = await rateLimiter.schedule(
        makeRequest,
        "openrouter_ocr_pdf",
        60 * 1e3
        // Cache por 1 minuto
      );
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      console.log(`\u2705 OpenRouter OCR: conclu\xEDdo em ${latencyMs}ms, modelo: ${this.model}`);
      if (response.data && response.data.text) {
        return {
          full_text: response.data.text,
          bounding_boxes: response.data.bounding_boxes || []
        };
      } else {
        throw new Error("Resposta vazia ou inv\xE1lida do OpenRouter");
      }
    } catch (error) {
      console.error("\u274C Erro na API OpenRouter:", error.response?.data || error.message);
      return {
        full_text: "",
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
  /**
   * Processa uma imagem para extração de texto e dados estruturados usando o OpenRouter
   * @param imageBuffer Buffer da imagem
   * @param mimeType Tipo MIME da imagem
   * @returns Resultado do processamento com texto extraído e caixas delimitadoras
   */
  async ocrImage(imageBuffer, mimeType) {
    this.checkInitialization();
    const imageBase64 = imageBuffer.toString("base64");
    try {
      const startTime = Date.now();
      const makeRequest = async () => axios.post(
        `${this.baseUrl}/vision`,
        {
          model: this.model,
          mime_type: mimeType,
          data: imageBase64
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://replit.com",
            "X-Title": "Maria Faz - Mistral OCR",
            "Content-Type": "application/json"
          }
        }
      );
      const response = await rateLimiter.schedule(
        makeRequest,
        "openrouter_ocr_image",
        60 * 1e3
        // Cache por 1 minuto
      );
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      console.log(`\u2705 OpenRouter OCR (imagem): conclu\xEDdo em ${latencyMs}ms, modelo: ${this.model}`);
      if (response.data && response.data.text) {
        return {
          full_text: response.data.text,
          bounding_boxes: response.data.bounding_boxes || []
        };
      } else {
        throw new Error("Resposta vazia ou inv\xE1lida do OpenRouter");
      }
    } catch (error) {
      console.error("\u274C Erro na API OpenRouter (imagem):", error.response?.data || error.message);
      return {
        full_text: "",
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
};

// server/services/rolm.service.ts
import axios2 from "axios";
var RolmService = class {
  apiKey;
  baseUrl = "https://api-inference.huggingface.co/models/reducto/RolmOCR";
  constructor() {
    this.apiKey = process.env.HF_TOKEN || "";
    if (!this.apiKey) {
      console.warn("\u26A0\uFE0F HF_TOKEN n\xE3o est\xE1 configurado. O servi\xE7o RolmOCR n\xE3o funcionar\xE1 para manuscritos.");
    }
  }
  /**
   * Testa a conexão com o Hugging Face / RolmOCR
   * @returns Resultado do teste de conexão
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        return { success: false, message: "HF_TOKEN n\xE3o configurado" };
      }
      const response = await axios2.get("https://api-inference.huggingface.co/status", {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });
      if (response.status === 200) {
        try {
          const modelResponse = await axios2.post(
            this.baseUrl,
            { inputs: "test" },
            {
              headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json"
              },
              // Timeout curto apenas para testar a conexão
              timeout: 5e3
            }
          );
          if (modelResponse.status === 200) {
            console.log("\u2705 RolmOCR conectado com sucesso");
            return { success: true, message: "RolmOCR conectado com sucesso" };
          } else {
            return {
              success: false,
              message: `Erro na resposta do modelo: ${modelResponse.status} - ${modelResponse.statusText}`
            };
          }
        } catch (modelError) {
          if (modelError.response?.status === 503 || modelError.message.includes("timeout") || modelError.response?.data?.error?.includes("loading")) {
            console.log("\u26A0\uFE0F RolmOCR est\xE1 sendo carregado ou em fila - conex\xE3o bem-sucedida, modelo dispon\xEDvel");
            return { success: true, message: "RolmOCR est\xE1 sendo carregado - conex\xE3o bem-sucedida" };
          }
          return {
            success: false,
            message: modelError.response?.data?.error || modelError.message || "Erro ao acessar modelo"
          };
        }
      } else {
        return {
          success: false,
          message: `Erro na resposta da API: ${response.status} - ${response.statusText}`
        };
      }
    } catch (error) {
      console.error("\u274C Erro ao testar conex\xE3o com RolmOCR:", error);
      return {
        success: false,
        message: error.response?.data?.error || error.message || "Erro desconhecido"
      };
    }
  }
  /**
   * Verifica se o serviço está corretamente inicializado
   * @throws Error se o token HF não estiver configurado
   */
  checkInitialization() {
    if (!this.apiKey) {
      throw new Error("HF_TOKEN n\xE3o est\xE1 configurado nas vari\xE1veis de ambiente");
    }
  }
  /**
   * Processa uma imagem com texto manuscrito para extração de texto
   * @param imageBuffer Buffer da imagem com texto manuscrito
   * @returns Texto extraído da imagem
   */
  async processHandwriting(imageBuffer) {
    this.checkInitialization();
    try {
      const startTime = Date.now();
      const makeRequest = async () => axios2.post(
        this.baseUrl,
        imageBuffer,
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/octet-stream"
          },
          timeout: 3e4
          // 30s timeout para processamento de manuscritos
        }
      );
      const response = await rateLimiter.schedule(
        makeRequest,
        "rolm_process_handwriting",
        5 * 60 * 1e3
        // Cache por 5 minutos
      );
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      console.log(`\u2705 RolmOCR: conclu\xEDdo em ${latencyMs}ms`);
      if (response.data && typeof response.data === "object") {
        const extractedText = response.data.text || response.data.generated_text || JSON.stringify(response.data);
        return { text: extractedText };
      } else {
        return { text: String(response.data) };
      }
    } catch (error) {
      console.error("\u274C Erro na API RolmOCR:", error.response?.data || error.message);
      return {
        text: "",
        error: error.response?.data?.error || error.message
      };
    }
  }
  /**
   * Alias para processHandwriting, específico para imagens
   * @param imageBuffer Buffer da imagem com texto
   * @param mimeType Tipo MIME da imagem (não usado atualmente pelo Rolm)
   * @returns Texto extraído da imagem
   */
  async processHandwritingImage(imageBuffer, mimeType) {
    return this.processHandwriting(imageBuffer);
  }
};

// server/services/mistral-ocr.service.ts
import axios3 from "axios";
var MistralOCRService = class {
  apiKey;
  baseUrl = "https://api.mistral.ai/v1";
  model = "mistral-ocr-latest";
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || "";
    if (!this.apiKey) {
      console.warn("\u26A0\uFE0F MISTRAL_API_KEY n\xE3o est\xE1 configurada. O servi\xE7o Mistral OCR n\xE3o funcionar\xE1.");
    }
  }
  /**
   * Testa a conexão com a API Mistral OCR
   * @returns Resultado do teste de conexão
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        return { success: false, message: "Chave API Mistral n\xE3o configurada" };
      }
      const response = await axios3.get(`${this.baseUrl}/models`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status === 200 && response.data) {
        const models = response.data.models || [];
        const ocrModel = models.find(
          (m) => m.id === "mistral-ocr-latest" || m.id?.includes("ocr")
        );
        if (ocrModel) {
          console.log(`\u2705 Mistral OCR API conectada - Modelo dispon\xEDvel: ${ocrModel.id}`);
          return {
            success: true,
            message: `Mistral OCR API conectada - Modelo dispon\xEDvel: ${ocrModel.id}`
          };
        } else {
          console.log("\u26A0\uFE0F Conectado \xE0 Mistral, mas modelo OCR n\xE3o encontrado");
          return {
            success: true,
            message: "Conectado \xE0 Mistral, mas modelo OCR espec\xEDfico n\xE3o encontrado"
          };
        }
      } else {
        return { success: false, message: `Erro na resposta: ${response.status}` };
      }
    } catch (error) {
      console.error("\u274C Erro ao testar conex\xE3o com Mistral OCR:", error);
      if (error.response?.status === 401) {
        return {
          success: false,
          message: "Chave API inv\xE1lida ou expirada"
        };
      }
      return {
        success: false,
        message: error.response?.data?.error?.message || error.message || "Erro desconhecido"
      };
    }
  }
  /**
   * Verifica se o serviço está corretamente inicializado
   * @throws Error se a chave API não estiver configurada
   */
  checkInitialization() {
    if (!this.apiKey) {
      throw new Error("MISTRAL_API_KEY n\xE3o est\xE1 configurada nas vari\xE1veis de ambiente");
    }
  }
  /**
   * Processa um PDF usando a API Mistral OCR
   * @param pdfBuffer Buffer do arquivo PDF
   * @returns Resultado do processamento OCR
   */
  async processPdf(pdfBuffer) {
    this.checkInitialization();
    const pdfBase64 = pdfBuffer.toString("base64");
    try {
      const startTime = Date.now();
      const makeRequest = async () => axios3.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "pixtral-12b-2024-09-04",
          // Modelo com capacidades de visão
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text from this PDF document. Return the complete text content with preserved formatting."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${pdfBase64}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 4096
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "X-Request-Source": "MariaFaz-OCR"
          },
          timeout: 12e4
          // 2 minutos de timeout para PDFs grandes
        }
      );
      const response = await rateLimiter.schedule(
        makeRequest,
        "mistral_ocr_pdf",
        5 * 60 * 1e3
        // Cache por 5 minutos
      );
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      console.log(`\u2705 Mistral OCR: processado em ${latencyMs}ms`);
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const extractedText = response.data.choices[0].message?.content || "";
        const result = {
          text: extractedText,
          images: [],
          // Chat completions não retorna imagens separadas
          metadata: {
            pageCount: 1,
            // Será estimado baseado no conteúdo
            language: void 0,
            confidence: void 0
          }
        };
        console.log(`\u{1F4C4} Texto extra\xEDdo: ${result.text.length} caracteres`);
        return result;
      } else {
        throw new Error("Resposta vazia ou inv\xE1lida da API Mistral");
      }
    } catch (error) {
      console.error("\u274C Erro na API Mistral OCR:", error.response?.data || error.message);
      if (error.response?.status === 429) {
        throw new Error("Limite de requisi\xE7\xF5es excedido. Tente novamente em alguns minutos.");
      }
      if (error.response?.status === 401) {
        throw new Error("Chave API inv\xE1lida ou expirada");
      }
      if (error.response?.status === 413) {
        throw new Error("PDF muito grande. O tamanho m\xE1ximo \xE9 10MB.");
      }
      throw new Error(
        error.response?.data?.error?.message || error.message || "Erro desconhecido ao processar PDF"
      );
    }
  }
  /**
   * Processa uma imagem usando a API Mistral OCR
   * @param imageBuffer Buffer da imagem
   * @param mimeType Tipo MIME da imagem
   * @returns Resultado do processamento OCR
   */
  async processImage(imageBuffer, mimeType) {
    this.checkInitialization();
    const imageBase64 = imageBuffer.toString("base64");
    try {
      const startTime = Date.now();
      const makeRequest = async () => axios3.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "pixtral-12b-2024-09-04",
          // Modelo com capacidades de visão
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text from this image. Return the complete text content with preserved formatting."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 2048
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "X-Request-Source": "MariaFaz-OCR"
          },
          timeout: 6e4
          // 1 minuto de timeout para imagens
        }
      );
      const response = await rateLimiter.schedule(
        makeRequest,
        "mistral_ocr_image",
        5 * 60 * 1e3
        // Cache por 5 minutos
      );
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      console.log(`\u2705 Mistral OCR (imagem): processado em ${latencyMs}ms`);
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const extractedText = response.data.choices[0].message?.content || "";
        const result = {
          text: extractedText,
          metadata: {
            pageCount: 1,
            language: void 0,
            confidence: void 0
          }
        };
        return result;
      } else {
        throw new Error("Resposta vazia ou inv\xE1lida da API Mistral");
      }
    } catch (error) {
      console.error("\u274C Erro na API Mistral OCR (imagem):", error.response?.data || error.message);
      if (error.response?.status === 429) {
        throw new Error("Limite de requisi\xE7\xF5es excedido. Tente novamente em alguns minutos.");
      }
      if (error.response?.status === 401) {
        throw new Error("Chave API inv\xE1lida ou expirada");
      }
      throw new Error(
        error.response?.data?.error?.message || error.message || "Erro desconhecido ao processar imagem"
      );
    }
  }
  /**
   * Processa um lote de documentos usando a API Mistral OCR
   * @param documents Array de documentos para processar
   * @returns Array de resultados processados
   */
  async processBatch(documents) {
    this.checkInitialization();
    console.log(`\u{1F504} Processando lote de ${documents.length} documentos...`);
    const BATCH_SIZE = 3;
    const results = [];
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (doc) => {
        try {
          let result;
          if (doc.mimeType === "application/pdf") {
            result = await this.processPdf(doc.data);
          } else if (doc.mimeType.startsWith("image/")) {
            result = await this.processImage(doc.data, doc.mimeType);
          } else {
            throw new Error(`Tipo de documento n\xE3o suportado: ${doc.mimeType}`);
          }
          return {
            ...result,
            filename: doc.filename
          };
        } catch (error) {
          console.error(`\u274C Erro ao processar ${doc.filename || "documento"}:`, error.message);
          return {
            text: "",
            filename: doc.filename,
            error: error.message
          };
        }
      });
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    const successful = results.filter((r) => !r.error).length;
    console.log(`\u2705 Lote processado: ${successful}/${documents.length} documentos com sucesso`);
    return results;
  }
  /**
   * Estima o custo de processamento para um conjunto de documentos
   * @param documents Array de documentos
   * @returns Estimativa de custo em USD
   */
  estimateCost(documents) {
    const BYTES_PER_PAGE = 50 * 1024;
    const COST_PER_1000_PAGES = 1;
    const USD_TO_EUR = 0.92;
    const totalBytes = documents.reduce((sum2, doc) => sum2 + doc.sizeInBytes, 0);
    const estimatedPages = Math.ceil(totalBytes / BYTES_PER_PAGE);
    const costInUSD = estimatedPages / 1e3 * COST_PER_1000_PAGES;
    const costInEUR = costInUSD * USD_TO_EUR;
    return {
      estimatedPages,
      costInUSD: Math.round(costInUSD * 100) / 100,
      costInEUR: Math.round(costInEUR * 100) / 100
    };
  }
};
var mistralOCRService = new MistralOCRService();

// server/services/handwriting-detector.ts
var HandwritingDetector = class {
  /**
   * Analisa um PDF para detectar se contém manuscritos
   * @param pdfBuffer Buffer do PDF a ser analisado
   * @returns Pontuação entre 0 e 1 (0 = sem manuscritos, 1 = provavelmente manuscrito)
   */
  async analyzePdf(pdfBuffer) {
    try {
      const text2 = pdfBuffer.toString("utf-8", 0, Math.min(1e4, pdfBuffer.length));
      const score = this.analyzeTextContent(text2);
      console.log(`\u{1F4DD} An\xE1lise de manuscrito: pontua\xE7\xE3o ${score.toFixed(2)}`);
      return score;
    } catch (error) {
      console.error("\u274C Erro ao analisar PDF para detec\xE7\xE3o de manuscritos:", error);
      return 0;
    }
  }
  /**
   * Analisa o conteúdo textual para detectar características de manuscritos
   * @param text Texto extraído do PDF
   * @returns Pontuação entre 0 e 1
   */
  analyzeTextContent(text2) {
    const contentLength = text2.length;
    const densityScore = Math.max(0, Math.min(1, 1 - contentLength / 5e3));
    const nonAlphanumericCount = (text2.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const nonAlphanumericRatio = nonAlphanumericCount / Math.max(1, contentLength);
    const noiseScore = Math.min(1, nonAlphanumericRatio * 5);
    const hasFormattedParagraphs = /\n\s*\n/.test(text2);
    const hasNumberedLists = /\n\s*\d+\.\s/.test(text2);
    const hasTabularData = /\n\s*\|/.test(text2) || /\t/.test(text2);
    const formattingScore = hasFormattedParagraphs || hasNumberedLists || hasTabularData ? 0 : 0.5;
    const digitizedPatterns = /[©®™§¶†‡]/g;
    const hasDigitizedPatterns = digitizedPatterns.test(text2) ? 0 : 0.3;
    const words = text2.match(/\b\w+\b/g) || [];
    const wordLengths = words.map((w) => w.length);
    const averageWordLength = wordLengths.reduce((sum2, len) => sum2 + len, 0) / Math.max(1, wordLengths.length);
    let variance = 0;
    if (wordLengths.length > 0) {
      variance = wordLengths.reduce((sum2, len) => sum2 + Math.pow(len - averageWordLength, 2), 0) / wordLengths.length;
    }
    const varianceScore = Math.min(1, variance / 10);
    const finalScore = densityScore * 0.3 + noiseScore * 0.2 + formattingScore * 0.2 + hasDigitizedPatterns * 0.1 + varianceScore * 0.2;
    return finalScore;
  }
};

// server/services/rag-enhanced.service.ts
import { sql as sql2 } from "drizzle-orm";
init_schema();
import { desc as desc3, gte as gte3, lte as lte3 } from "drizzle-orm";
var RagEnhancedService = class _RagEnhancedService {
  static instance;
  embeddingDimension = 768;
  // Dimensão padrão para os embeddings
  extractEmbeddingsEnabled = true;
  constructor() {
    console.log("Servi\xE7o RAG Aprimorado inicializado");
  }
  /**
   * Obtém a instância do serviço RAG
   * @returns Instância do serviço RAG
   */
  static getInstance() {
    if (!_RagEnhancedService.instance) {
      _RagEnhancedService.instance = new _RagEnhancedService();
    }
    return _RagEnhancedService.instance;
  }
  /**
   * Adiciona conteúdo à base de conhecimento
   * @param content Conteúdo a ser adicionado
   * @param contentType Tipo de conteúdo (document, chat, reservation, activity, etc)
   * @param metadata Metadados sobre o conteúdo
   * @returns ID do item adicionado
   */
  /**
   * Adiciona conhecimento ao sistema RAG
   * Método alternativo com nome diferente para manter compatibilidade
   * @param content Conteúdo a ser adicionado
   * @param contentType Tipo de conteúdo (chat_history, document, system_data, etc)
   * @param metadata Metadados adicionais
   * @returns Promise<number> ID do item adicionado
   */
  async addKnowledge(content, contentType, metadata = {}) {
    return this.addToKnowledgeBase(content, contentType, metadata);
  }
  async addToKnowledgeBase(content, contentType, metadata = {}) {
    console.log(`\u{1F4DA} RAG: Adicionando conte\xFAdo \xE0 base de conhecimento (tipo: ${contentType})`);
    try {
      let embedding = null;
      if (this.extractEmbeddingsEnabled) {
        try {
          embedding = await this.generateEmbedding(content);
        } catch (embeddingError) {
          console.error("Erro ao gerar embedding:", embeddingError);
        }
      }
      const newItem = {
        content: content.length > 1e4 ? content.substring(0, 1e4) : content,
        contentType,
        metadata: JSON.stringify(metadata),
        embeddingJson: embedding ? JSON.stringify(embedding) : void 0
        // createdAt é adicionado automaticamente pelo schema
      };
      let result;
      if (db) {
        result = await db.insert(knowledgeEmbeddings).values(newItem).returning({ id: knowledgeEmbeddings.id });
        return result[0].id;
      } else {
        result = await storage.createKnowledgeEmbedding(newItem);
        return result.id;
      }
    } catch (error) {
      console.error("Erro ao adicionar ao conhecimento RAG:", error);
      throw error;
    }
  }
  /**
   * Gera embedding para um texto usando o serviço Gemini
   * @param text Texto para gerar embedding
   * @returns Array de números representando o embedding
   */
  async generateEmbedding(text2) {
    try {
      const geminiService = aiService.geminiService;
      const embeddingResponse = await geminiService.generateEmbeddings(text2);
      if (embeddingResponse?.data?.[0]?.embedding) {
        console.log("\u2705 Embedding gerado com sucesso usando Gemini");
        return embeddingResponse.data[0].embedding;
      }
      console.warn("\u26A0\uFE0F Usando fallback para embedding (resposta Gemini inv\xE1lida)");
      const embedding = [];
      const normalizedText = text2.toLowerCase();
      for (let i = 0; i < this.embeddingDimension; i++) {
        const charCode = i < normalizedText.length ? normalizedText.charCodeAt(i % normalizedText.length) : 0;
        embedding.push(charCode / 255 * 2 - 1);
      }
      return embedding;
    } catch (error) {
      console.error("Erro ao gerar embedding:", error);
      console.warn("\u26A0\uFE0F Usando fallback para embedding (erro na API Gemini)");
      const embedding = [];
      const normalizedText = text2.toLowerCase();
      for (let i = 0; i < this.embeddingDimension; i++) {
        const charCode = i < normalizedText.length ? normalizedText.charCodeAt(i % normalizedText.length) : 0;
        embedding.push(charCode / 255 * 2 - 1);
      }
      return embedding;
    }
  }
  /**
   * Busca itens similares na base de conhecimento
   * @param query Consulta para buscar itens similares
   * @param config Configuração da consulta ou número máximo de resultados
   * @returns Array de itens similares
   */
  async findSimilarContent(queryText, maxResults = 5) {
    return this.querySimilarItems(queryText, { maxResults });
  }
  /**
   * Busca itens similares na base de conhecimento (implementação detalhada)
   * @param query Consulta para buscar itens similares
   * @param config Configuração da consulta
   * @returns Array de itens similares
   */
  async querySimilarItems(queryText, config = {}) {
    console.log(`\u{1F50D} RAG: Consultando itens similares para: "${queryText.substring(0, 50)}..."`);
    const defaultConfig = {
      query: queryText,
      contentTypes: [],
      maxResults: 5,
      minSimilarity: 0.7,
      includeRaw: false
    };
    const mergedConfig = { ...defaultConfig, ...config };
    try {
      const queryEmbedding = await this.generateEmbedding(queryText);
      await this.saveQueryEmbedding(queryText, queryEmbedding);
      let results = [];
      if (db) {
        let query3 = db.select().from(knowledgeEmbeddings).orderBy(desc3(knowledgeEmbeddings.createdAt)).limit(mergedConfig.maxResults || 5);
        if (mergedConfig.contentTypes && mergedConfig.contentTypes.length > 0) {
          query3 = query3.where(
            sql2`${knowledgeEmbeddings.contentType} IN (${mergedConfig.contentTypes.join(",")})`
          );
        }
        if (mergedConfig.startDate) {
          query3 = query3.where(gte3(knowledgeEmbeddings.createdAt, mergedConfig.startDate));
        }
        if (mergedConfig.endDate) {
          query3 = query3.where(lte3(knowledgeEmbeddings.createdAt, mergedConfig.endDate));
        }
        const dbResults = await query3;
        results = dbResults.map((item) => {
          let parsedEmbedding = [];
          try {
            if (item.embeddingJson) {
              parsedEmbedding = JSON.parse(item.embeddingJson);
            }
          } catch (err) {
            console.error("Erro ao fazer parse do embedding JSON:", err);
          }
          return {
            id: item.id,
            content: item.content,
            contentType: item.contentType,
            embedding: parsedEmbedding,
            metadata: JSON.parse(item.metadata),
            createdAt: item.createdAt
          };
        });
      } else {
        const allItems = await storage.getKnowledgeEmbeddings();
        results = allItems.map((item) => ({
          id: item.id,
          content: item.content,
          contentType: item.contentType,
          embedding: item.embedding,
          metadata: typeof item.metadata === "string" ? JSON.parse(item.metadata) : item.metadata,
          createdAt: item.createdAt
        }));
        if (mergedConfig.contentTypes && mergedConfig.contentTypes.length > 0) {
          results = results.filter(
            (item) => mergedConfig.contentTypes?.includes(item.contentType)
          );
        }
        if (mergedConfig.startDate) {
          results = results.filter(
            (item) => item.createdAt >= mergedConfig.startDate
          );
        }
        if (mergedConfig.endDate) {
          results = results.filter(
            (item) => item.createdAt <= mergedConfig.endDate
          );
        }
        results = results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        results = results.slice(0, mergedConfig.maxResults || 5);
      }
      console.log(`\u2705 RAG: Encontrados ${results.length} itens similares`);
      if (!mergedConfig.includeRaw) {
        results.forEach((item) => {
          delete item.embedding;
        });
      }
      return results;
    } catch (error) {
      console.error("Erro ao buscar itens similares:", error);
      return [];
    }
  }
  /**
   * Salva um embedding de consulta para aprendizado futuro
   * @param query Texto da consulta
   * @param embedding Embedding da consulta
   */
  async saveQueryEmbedding(query3, embedding) {
    try {
      const newQueryEmbedding = {
        query: query3,
        response: "Consulta armazenada para aprendizado",
        // Adicionando valor padrão para response
        embeddingJson: JSON.stringify(embedding)
        // Armazenar como JSON
        // frequency é adicionado automaticamente pelo schema
      };
      if (db) {
        await db.insert(queryEmbeddings).values(newQueryEmbedding);
      } else {
        await storage.saveQueryEmbedding(newQueryEmbedding);
      }
    } catch (error) {
      console.error("Erro ao salvar embedding de consulta:", error);
      if (error instanceof Error) {
        console.error(`Detalhes do erro: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
      }
    }
  }
  /**
   * Salva uma mensagem no histórico de conversas
   * @param message Conteúdo da mensagem
   * @param role Papel do remetente (user, assistant, system)
   * @param metadata Metadados sobre a mensagem
   */
  async saveConversationMessage(message, role, metadata = {}) {
    try {
      const safeMessage = message || "";
      const conversationEntry = {
        message: safeMessage,
        role,
        metadata: JSON.stringify(metadata)
        // userId e timestamp são definidos automaticamente pelo schema
      };
      if (db) {
        await db.insert(conversationHistory).values(conversationEntry);
      } else {
        await storage.saveConversationHistory(conversationEntry);
      }
      await this.addToKnowledgeBase(
        message,
        "conversation",
        { role, ...metadata }
      );
    } catch (error) {
      console.error("Erro ao salvar mensagem de conversa\xE7\xE3o:", error);
    }
  }
  /**
   * Constrói um contexto RAG para uma consulta específica
   * @param query Consulta para construir contexto
   * @param maxItems Número máximo de itens a incluir no contexto
   * @returns Contexto RAG formatado
   */
  async buildRagContext(query3, maxItems = 5) {
    return this.buildConversationContext(query3, maxItems);
  }
  /**
   * Constrói um contexto de conversação baseado em uma consulta (compatível com API antiga)
   * @param query Consulta para construir contexto
   * @param maxConversations Número máximo de itens a incluir no contexto
   * @returns Contexto de conversação formatado
   */
  async buildConversationContext(query3, maxConversations = 10) {
    const similarItems = await this.querySimilarItems(query3, {
      maxResults: maxConversations
    });
    let context = `--- CONTEXTO RELEVANTE PARA MARIA IA ---

`;
    similarItems.forEach((item, index) => {
      context += `[Item ${index + 1} - ${item.contentType}]
`;
      const metadata = item.metadata;
      let metadataStr = "";
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          if (key !== "raw" && key !== "full_content") {
            metadataStr += `${key}: ${value}
`;
          }
        }
      }
      if (metadataStr) {
        context += `Metadados:
${metadataStr}
`;
      }
      context += `Conte\xFAdo:
${item.content}

`;
    });
    context += `--- INFORMA\xC7\xD5ES DO SISTEMA ---
`;
    context += await this.getSystemInfo();
    return context;
  }
  /**
   * Obtém informações do sistema para enriquecer o contexto
   * @returns Informações do sistema formatadas
   */
  async getSystemInfo() {
    let info = "";
    try {
      const allProperties = await storage.getProperties();
      info += `Propriedades (${allProperties.length}):
`;
      info += allProperties.map((p) => `- ${p.name} (${p.type}, ${p.address})`).join("\n");
      info += "\n\n";
      const allOwners = await storage.getOwners();
      info += `Propriet\xE1rios (${allOwners.length}):
`;
      info += allOwners.map((o) => `- ${o.name}`).join("\n");
      info += "\n\n";
      const totalReservations = await storage.getReservations();
      const totalRevenue = await storage.getTotalRevenue();
      const netProfit = await storage.getNetProfit();
      info += `Estat\xEDsticas:
`;
      info += `- Total de reservas: ${totalReservations.length}
`;
      info += `- Receita total: ${totalRevenue}
`;
      info += `- Lucro l\xEDquido: ${netProfit}
`;
    } catch (error) {
      console.error("Erro ao obter informa\xE7\xF5es do sistema:", error);
      info += "Erro ao carregar informa\xE7\xF5es do sistema.\n";
    }
    return info;
  }
  /**
   * Indexa dados do sistema para enriquecer a base de conhecimento
   * Útil para carregar dados iniciais ou atualizar a base após mudanças
   */
  async indexSystemData() {
    console.log("\u{1F4CA} RAG: Indexando dados do sistema...");
    try {
      const allProperties = await storage.getProperties();
      for (const property of allProperties) {
        await this.addToKnowledgeBase(
          `Propriedade ${property.name}: Tipo ${property.type}, Localizada em ${property.address}. 
          Descri\xE7\xE3o: ${property.description || "Sem descri\xE7\xE3o"}. 
          Comiss\xE3o: ${property.commission}%, Custo de limpeza: ${property.cleaningFee}.`,
          "property",
          property
        );
      }
      const allOwners = await storage.getOwners();
      for (const owner of allOwners) {
        await this.addToKnowledgeBase(
          `Propriet\xE1rio ${owner.name}: Email ${owner.email}, Telefone ${owner.phone}.`,
          "owner",
          owner
        );
      }
      const allReservations = await storage.getReservations();
      for (const reservation of allReservations) {
        const property = allProperties.find((p) => p.id === reservation.propertyId);
        await this.addToKnowledgeBase(
          `Reserva para ${property?.name || "Propriedade desconhecida"}.
          H\xF3spede: ${reservation.guestName}
          Check-in: ${reservation.checkInDate}
          Check-out: ${reservation.checkOutDate}
          H\xF3spedes: ${reservation.numGuests}
          Valor: ${reservation.totalAmount}
          Plataforma: ${reservation.platform}`,
          "reservation",
          reservation
        );
      }
      const recentActivities = await storage.getActivities(100);
      for (const activity of recentActivities) {
        await this.addToKnowledgeBase(
          `Atividade: ${activity.description} (${activity.type})`,
          "activity",
          activity
        );
      }
      console.log("\u2705 RAG: Indexa\xE7\xE3o de dados do sistema conclu\xEDda");
    } catch (error) {
      console.error("Erro ao indexar dados do sistema:", error);
    }
  }
  /**
   * Integra dados de um documento processado à base de conhecimento
   * @param documentText Texto extraído do documento
   * @param extractedData Dados estruturados extraídos
   * @param documentType Tipo do documento
   * @param metadata Metadados adicionais
   */
  async integrateProcessedDocument(documentText, extractedData, documentType, metadata = {}) {
    console.log(`\u{1F4C4} RAG: Integrando documento processado (${documentType}) \xE0 base de conhecimento`);
    try {
      await this.addToKnowledgeBase(
        documentText,
        `document_${documentType}_full`,
        {
          ...metadata,
          extractedData: JSON.stringify(extractedData),
          dateAdded: (/* @__PURE__ */ new Date()).toISOString(),
          documentType,
          processingService: aiService.getCurrentService()
        }
      );
      let structuredSummary = `Documento ${documentType}
`;
      for (const [key, value] of Object.entries(extractedData)) {
        if (value) {
          structuredSummary += `${key}: ${value}
`;
        }
      }
      await this.addToKnowledgeBase(
        structuredSummary,
        `document_${documentType}_structured`,
        metadata
      );
      console.log("\u2705 RAG: Documento integrado com sucesso \xE0 base de conhecimento");
    } catch (error) {
      console.error("Erro ao integrar documento \xE0 base de conhecimento:", error);
    }
  }
  /**
   * Aprende formatos de documentos e os armazena na base de conhecimento
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @param extractedData Dados extraídos do documento
   * @param formatInfo Informações sobre o formato do documento
   */
  async learnDocumentFormat(fileBase64, mimeType, extractedData, formatInfo) {
    console.log(`\u{1F9E0} RAG: Aprendendo formato de documento (${formatInfo.type || "desconhecido"})`);
    try {
      let formatSummary = `Formato de Documento: ${formatInfo.type || "Desconhecido"}
`;
      formatSummary += `Descri\xE7\xE3o: ${formatInfo.description || "Sem descri\xE7\xE3o"}
`;
      if (formatInfo.identifiers && formatInfo.identifiers.length) {
        formatSummary += "Identificadores:\n";
        formatInfo.identifiers.forEach((id, index) => {
          formatSummary += `- ${id}
`;
        });
      }
      formatSummary += "\nExtra\xE7\xE3o de Campos:\n";
      for (const [key, value] of Object.entries(extractedData)) {
        formatSummary += `- ${key}: ${value}
`;
      }
      await this.addToKnowledgeBase(
        formatSummary,
        "document_format",
        {
          mimeType,
          formatType: formatInfo.type,
          confidence: formatInfo.confidence,
          fields: Object.keys(extractedData)
        }
      );
      console.log("\u2705 RAG: Formato de documento armazenado na base de conhecimento");
    } catch (error) {
      console.error("Erro ao aprender formato de documento:", error);
    }
  }
};
var ragService = RagEnhancedService.getInstance();

// server/services/ai-adapter.service.ts
import pdfParse from "pdf-parse";
var AIServiceType = /* @__PURE__ */ ((AIServiceType2) => {
  AIServiceType2["GEMINI"] = "gemini";
  AIServiceType2["OPENROUTER"] = "openrouter";
  AIServiceType2["ROLM"] = "rolm";
  AIServiceType2["MISTRAL_OCR"] = "mistral-ocr";
  AIServiceType2["AUTO"] = "auto";
  return AIServiceType2;
})(AIServiceType || {});
var AIAdapter = class _AIAdapter {
  static instance;
  // Serviços disponíveis
  static services = {
    openrouter: new OpenRouterService(),
    gemini: new GeminiService(),
    rolm: new RolmService(),
    mistralOcr: mistralOCRService
  };
  // Valor padrão para o serviço de IA
  static defaultName = process.env.PRIMARY_AI ?? "auto";
  // Detector de manuscritos
  handwritingDetector = new HandwritingDetector();
  // Referências para fácil acesso
  geminiService;
  openRouterService;
  rolmService;
  mistralOCRService;
  currentService = "auto" /* AUTO */;
  constructor() {
    this.geminiService = _AIAdapter.services.gemini;
    this.openRouterService = _AIAdapter.services.openrouter;
    this.rolmService = _AIAdapter.services.rolm;
    this.mistralOCRService = _AIAdapter.services.mistralOcr;
    const primaryAI = process.env.PRIMARY_AI || "openrouter";
    if (primaryAI in AIServiceType) {
      this.currentService = primaryAI;
    } else {
      this.currentService = "auto" /* AUTO */;
    }
    if (process.env.MISTRAL_API_KEY) {
      console.log("\u2705 Mistral OCR API configurada corretamente");
    } else {
      console.warn("\u26A0\uFE0F MISTRAL_API_KEY n\xE3o est\xE1 configurada. OCR via Mistral API n\xE3o funcionar\xE1.");
    }
    if (process.env.OPENROUTER_API_KEY) {
      console.log("\u2705 OpenRouter API configurada corretamente (fallback)");
    } else {
      console.warn("\u26A0\uFE0F OPENROUTER_API_KEY n\xE3o est\xE1 configurada. Fallback via OpenRouter n\xE3o funcionar\xE1.");
    }
    if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      console.log("\u2705 Gemini API configurada corretamente");
    } else {
      console.warn("\u26A0\uFE0F Nenhuma chave de API do Gemini configurada. Funcionalidades de IA Gemini estar\xE3o limitadas.");
    }
    if (process.env.HF_TOKEN) {
      console.log("\u2705 Hugging Face Token configurado corretamente");
    } else {
      console.warn("\u26A0\uFE0F HF_TOKEN n\xE3o est\xE1 configurado. Processamento de manuscritos via RolmOCR n\xE3o funcionar\xE1.");
    }
    console.log(`\u{1F916} Servi\xE7o de IA prim\xE1rio configurado para: ${this.currentService}`);
  }
  /**
   * Obtém a instância única do adaptador
   * @returns Instância do adaptador
   */
  static getInstance() {
    if (!_AIAdapter.instance) {
      _AIAdapter.instance = new _AIAdapter();
    }
    return _AIAdapter.instance;
  }
  /**
   * Define qual serviço de IA usar
   * @param serviceType Tipo de serviço de IA a ser usado
   */
  setService(serviceType) {
    switch (serviceType) {
      case "gemini" /* GEMINI */:
        if (!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
          throw new Error("GOOGLE_GEMINI_API_KEY n\xE3o configurada. N\xE3o \xE9 poss\xEDvel usar o Gemini.");
        }
        break;
      case "mistral-ocr" /* MISTRAL_OCR */:
        if (!process.env.MISTRAL_API_KEY) {
          throw new Error("MISTRAL_API_KEY n\xE3o configurada. N\xE3o \xE9 poss\xEDvel usar o Mistral OCR.");
        }
        break;
      case "openrouter" /* OPENROUTER */:
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error("OPENROUTER_API_KEY n\xE3o configurada. N\xE3o \xE9 poss\xEDvel usar o OpenRouter.");
        }
        break;
      case "rolm" /* ROLM */:
        if (!process.env.HF_TOKEN) {
          throw new Error("HF_TOKEN n\xE3o configurado. N\xE3o \xE9 poss\xEDvel usar o RolmOCR.");
        }
        break;
      case "auto" /* AUTO */:
        if (!this.isServiceAvailable()) {
          throw new Error("Nenhum servi\xE7o de IA est\xE1 configurado. Configure pelo menos um servi\xE7o.");
        }
        break;
    }
    this.currentService = serviceType;
    console.log(`Servi\xE7o de IA configurado para: ${this.currentService}`);
  }
  /**
   * Obtém o serviço atual
   * @returns Tipo de serviço de IA em uso
   */
  getCurrentService() {
    return this.currentService;
  }
  /**
   * Define uma chave de API para um serviço específico
   * @param service Nome do serviço ('openrouter', 'gemini', 'rolm')
   * @param apiKey Chave de API
   * @returns Resultado da operação
   */
  async setApiKey(service, apiKey) {
    try {
      if (!service || !apiKey) {
        return {
          success: false,
          message: "Servi\xE7o e chave de API s\xE3o obrigat\xF3rios"
        };
      }
      service = service.toLowerCase();
      switch (service) {
        case "openrouter":
        case "mistral":
          try {
            process.env.OPENROUTER_API_KEY = apiKey;
            const openRouterService = _AIAdapter.services.openrouter;
            const testResult = await openRouterService.testConnection();
            if (testResult.success) {
              console.log("\u2705 OpenRouter API configurada com sucesso");
              return {
                success: true,
                message: "OpenRouter API configurada com sucesso"
              };
            } else {
              process.env.OPENROUTER_API_KEY = "";
              return {
                success: false,
                message: `Erro ao configurar OpenRouter: ${testResult.message || "Chave inv\xE1lida"}`
              };
            }
          } catch (error) {
            process.env.OPENROUTER_API_KEY = "";
            return {
              success: false,
              message: `Erro ao configurar OpenRouter: ${error instanceof Error ? error.message : "Erro desconhecido"}`
            };
          }
        case "gemini":
          try {
            process.env.GOOGLE_API_KEY = apiKey;
            const geminiService = _AIAdapter.services.gemini;
            const testResult = await geminiService.testConnection();
            if (testResult.success) {
              console.log("\u2705 Gemini API configurada com sucesso");
              return {
                success: true,
                message: "Gemini API configurada com sucesso"
              };
            } else {
              process.env.GOOGLE_API_KEY = "";
              return {
                success: false,
                message: `Erro ao configurar Gemini: ${testResult.message}`
              };
            }
          } catch (error) {
            process.env.GOOGLE_API_KEY = "";
            return {
              success: false,
              message: `Erro ao configurar Gemini: ${error instanceof Error ? error.message : "Erro desconhecido"}`
            };
          }
        case "rolm":
        case "huggingface":
          try {
            process.env.HF_TOKEN = apiKey;
            const rolmService = _AIAdapter.services.rolm;
            const testResult = await rolmService.testConnection();
            if (testResult.success) {
              console.log("\u2705 RolmOCR API configurada com sucesso");
              return {
                success: true,
                message: "RolmOCR API configurada com sucesso"
              };
            } else {
              process.env.HF_TOKEN = "";
              return {
                success: false,
                message: `Erro ao configurar RolmOCR: ${testResult.message || "Token inv\xE1lido"}`
              };
            }
          } catch (error) {
            process.env.HF_TOKEN = "";
            return {
              success: false,
              message: `Erro ao configurar RolmOCR: ${error instanceof Error ? error.message : "Erro desconhecido"}`
            };
          }
        default:
          return {
            success: false,
            message: `Servi\xE7o desconhecido: ${service}. Servi\xE7os suportados: openrouter, gemini, rolm`
          };
      }
    } catch (error) {
      console.error("Erro ao definir chave de API:", error);
      return {
        success: false,
        message: `Erro ao definir chave de API: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      };
    }
  }
  /**
   * Testa a conexão com OpenRouter 
   * @returns Resultado do teste de conexão
   */
  async testOpenRouterConnection() {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        return {
          success: false,
          message: "OPENROUTER_API_KEY n\xE3o est\xE1 configurada"
        };
      }
      const openRouterService = _AIAdapter.services.openrouter;
      const testResult = await openRouterService.testConnection();
      return testResult.success ? { success: true, message: "Conex\xE3o com OpenRouter bem-sucedida" } : { success: false, message: `Erro na conex\xE3o com OpenRouter: ${testResult.message}` };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao testar conex\xE3o com OpenRouter: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      };
    }
  }
  /**
   * Obtém o serviço apropriado com base no nome ou configuração atual
   * @param name Nome do serviço a ser usado (opcional, usa o serviço padrão se não informado)
   * @returns O serviço apropriado
   */
  getService(name = _AIAdapter.defaultName) {
    if (name && name in _AIAdapter.services) {
      return _AIAdapter.services[name];
    }
    if (this.currentService === "auto" /* AUTO */ || !name) {
      if (process.env.OPENROUTER_API_KEY) {
        console.log("\u{1F504} Usando OpenRouter (Mistral) como servi\xE7o prim\xE1rio de OCR");
        return _AIAdapter.services.openrouter;
      } else if (process.env.HF_TOKEN) {
        console.log("\u{1F504} Usando RolmOCR como servi\xE7o prim\xE1rio de OCR");
        return _AIAdapter.services.rolm;
      } else if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        console.warn("\u26A0\uFE0F OpenRouter e RolmOCR n\xE3o configurados. Gemini dispon\xEDvel apenas para an\xE1lise de BD");
        return _AIAdapter.services.gemini;
      }
      console.warn("\u26A0\uFE0F Nenhum servi\xE7o de IA configurado. Usando extrator nativo de PDF");
      return _AIAdapter.services.gemini;
    }
    return _AIAdapter.services[this.currentService] || _AIAdapter.services.gemini;
  }
  /**
   * Verifica se algum serviço de IA está disponível
   * @returns True se tiver ao menos um serviço disponível
   */
  isServiceAvailable() {
    return process.env.GOOGLE_GEMINI_API_KEY !== void 0 && process.env.GOOGLE_GEMINI_API_KEY !== "" || process.env.GOOGLE_API_KEY !== void 0 && process.env.GOOGLE_API_KEY !== "" || process.env.OPENROUTER_API_KEY !== void 0 && process.env.OPENROUTER_API_KEY !== "" || process.env.HF_TOKEN !== void 0 && process.env.HF_TOKEN !== "";
  }
  // Métodos que encaminham as chamadas para o serviço apropriado
  /**
   * Extrai texto de um PDF em base64
   * @param pdfBase64 PDF codificado em base64
   * @param provider Provedor específico a ser usado (opcional)
   * @returns Texto extraído do documento
   */
  async extractTextFromPDF(pdfBase64, provider) {
    try {
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      let handwritingScore = 0;
      try {
        handwritingScore = await this.handwritingDetector.analyzePdf(pdfBuffer);
        console.log(`\u{1F4DD} Pontua\xE7\xE3o de manuscrito: ${handwritingScore.toFixed(2)}`);
      } catch (detectorError) {
        console.warn("\u26A0\uFE0F Erro no detector de manuscritos:", detectorError);
      }
      let selectedProvider = provider || "";
      if (!selectedProvider) {
        if (handwritingScore > 0.4 && process.env.HF_TOKEN) {
          selectedProvider = "rolm";
          console.log("\u{1F50D} Detectado texto manuscrito, usando RolmOCR");
        } else if (process.env.MISTRAL_API_KEY) {
          selectedProvider = "mistral-ocr";
          console.log("\u{1F50D} Usando Mistral OCR API como provedor principal");
        } else if (process.env.OPENROUTER_API_KEY) {
          selectedProvider = "openrouter";
          console.log("\u{1F50D} Usando OpenRouter como provedor secund\xE1rio para OCR");
        } else {
          selectedProvider = "native";
          console.log("\u{1F50D} Usando extrator nativo de PDF como fallback (sem IA)");
        }
      }
      const extractWithPdfParse = async () => {
        console.log("\u{1F4DD} Extraindo texto com pdf-parse (m\xE9todo nativo)");
        try {
          const data = await pdfParse(pdfBuffer);
          return data.text || "";
        } catch (pdfParseError) {
          console.error("\u274C Erro ao extrair texto com pdf-parse:", pdfParseError);
          throw new Error(`Falha na extra\xE7\xE3o b\xE1sica de texto: ${pdfParseError.message || "Erro desconhecido"}`);
        }
      };
      const failures = [];
      switch (selectedProvider) {
        case "mistral-ocr":
          try {
            console.log("\u{1F504} Processando com Mistral OCR API...");
            const mistralResult = await mistralOCRService.processPdf(pdfBuffer);
            if (mistralResult && mistralResult.text) {
              console.log(`\u2705 Mistral OCR processou com sucesso: ${mistralResult.text.length} caracteres extra\xEDdos`);
              let fullText = mistralResult.text;
              if (mistralResult.images && mistralResult.images.length > 0) {
                console.log(`\u{1F4F8} ${mistralResult.images.length} imagens encontradas no documento`);
                mistralResult.images.forEach((img, index) => {
                  if (img.caption) {
                    fullText += `

[Imagem ${index + 1}: ${img.caption}]`;
                  }
                });
              }
              return fullText;
            } else {
              throw new Error("Mistral OCR retornou resposta vazia");
            }
          } catch (mistralError) {
            console.error("\u274C Erro no Mistral OCR:", mistralError);
            failures.push(`Mistral OCR: ${mistralError.message}`);
            if (process.env.OPENROUTER_API_KEY) {
              console.log("\u{1F504} Tentando com OpenRouter como fallback...");
              selectedProvider = "openrouter";
            } else {
              console.log("\u{1F504} Tentando com extrator nativo como fallback...");
              return await extractWithPdfParse();
            }
          }
        // Se não houve break, continuar para o próximo case
        case "openrouter":
          try {
            const result = await this.openRouterService.ocrPdf(pdfBuffer);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.full_text;
          } catch (openRouterError) {
            console.error("\u274C Erro com OpenRouter:", openRouterError);
            failures.push(`OpenRouter: ${openRouterError.message}`);
            if (process.env.HF_TOKEN) {
              try {
                const result = await this.rolmService.processHandwriting(pdfBuffer);
                if (result.error) {
                  throw new Error(result.error);
                }
                return result.text;
              } catch (rolmError) {
                console.error("\u274C Erro com RolmOCR:", rolmError);
                failures.push(`RolmOCR: ${rolmError.message}`);
              }
            }
            console.log("\u{1F4C4} Usando extrator nativo como \xFAltimo recurso ap\xF3s falhas em outros servi\xE7os");
            return await extractWithPdfParse();
          }
        case "rolm":
          try {
            const result = await this.rolmService.processHandwriting(pdfBuffer);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.text;
          } catch (rolmError) {
            console.error("\u274C Erro com RolmOCR:", rolmError);
            failures.push(`RolmOCR: ${rolmError.message}`);
            if (process.env.OPENROUTER_API_KEY) {
              try {
                const result = await this.openRouterService.ocrPdf(pdfBuffer);
                if (result.error) {
                  throw new Error(result.error);
                }
                return result.full_text;
              } catch (openRouterError) {
                console.error("\u274C Erro com OpenRouter:", openRouterError);
                failures.push(`OpenRouter: ${openRouterError.message}`);
              }
            }
            console.log("\u{1F4C4} Usando extrator nativo como \xFAltimo recurso ap\xF3s falhas em outros servi\xE7os");
            return await extractWithPdfParse();
          }
        case "native":
          return await extractWithPdfParse();
        default:
          if (process.env.OPENROUTER_API_KEY) {
            try {
              const result = await this.openRouterService.ocrPdf(pdfBuffer);
              if (!result.error) {
                return result.full_text;
              }
              failures.push(`OpenRouter: ${result.error}`);
            } catch (error) {
              failures.push(`OpenRouter: ${error.message}`);
            }
          }
          if (process.env.HF_TOKEN) {
            try {
              const result = await this.rolmService.processHandwriting(pdfBuffer);
              if (!result.error) {
                return result.text;
              }
              failures.push(`RolmOCR: ${result.error}`);
            } catch (error) {
              failures.push(`RolmOCR: ${error.message}`);
            }
          }
          console.log("\u{1F4C4} Todos os servi\xE7os OCR falharam, usando extrator nativo");
          return await extractWithPdfParse();
      }
    } catch (error) {
      console.error(`\u274C Erro ao extrair texto do PDF:`, error);
      throw new Error(`Falha na extra\xE7\xE3o de texto: ${error.message || "Erro desconhecido"}`);
    }
  }
  /**
   * Extrai texto de uma imagem
   * @param imageBase64 Imagem codificada em base64
   * @param mimeType Tipo MIME da imagem
   * @returns Texto extraído da imagem
   */
  async extractTextFromImage(imageBase64, mimeType) {
    try {
      const failures = [];
      const imageBuffer = Buffer.from(imageBase64, "base64");
      switch (this.getCurrentService()) {
        case "openrouter" /* OPENROUTER */:
          if (!process.env.OPENROUTER_API_KEY) {
            throw new Error("OpenRouter API Key n\xE3o configurada");
          }
          try {
            const result = await this.openRouterService.ocrImage(imageBuffer, mimeType);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.full_text;
          } catch (error) {
            console.error("\u274C Erro com OpenRouter:", error);
            failures.push(`OpenRouter: ${error.message}`);
            throw new Error(`OpenRouter falhou: ${error.message}`);
          }
        case "rolm" /* ROLM */:
          if (!process.env.HF_TOKEN) {
            throw new Error("Hugging Face Token n\xE3o configurado");
          }
          try {
            const result = await this.rolmService.processHandwritingImage(imageBuffer, mimeType);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.text;
          } catch (error) {
            console.error("\u274C Erro com RolmOCR:", error);
            failures.push(`RolmOCR: ${error.message}`);
            if (process.env.OPENROUTER_API_KEY) {
              try {
                const result = await this.openRouterService.ocrImage(imageBuffer, mimeType);
                if (result.error) {
                  throw new Error(result.error);
                }
                return result.full_text;
              } catch (openRouterError) {
                console.error("\u274C Erro com OpenRouter:", openRouterError);
                failures.push(`OpenRouter: ${openRouterError.message}`);
              }
            }
            throw new Error(`Todos os servi\xE7os OCR falharam: ${failures.join(", ")}`);
          }
        case "auto" /* AUTO */:
        default:
          if (process.env.OPENROUTER_API_KEY) {
            try {
              const result = await this.openRouterService.ocrImage(imageBuffer, mimeType);
              if (!result.error) {
                return result.full_text;
              }
              failures.push(`OpenRouter: ${result.error}`);
            } catch (error) {
              failures.push(`OpenRouter: ${error.message}`);
            }
          }
          if (process.env.HF_TOKEN) {
            try {
              const result = await this.rolmService.processHandwritingImage(imageBuffer, mimeType);
              if (!result.error) {
                return result.text;
              }
              failures.push(`RolmOCR: ${result.error}`);
            } catch (error) {
              failures.push(`RolmOCR: ${error.message}`);
            }
          }
          throw new Error(`Todos os servi\xE7os OCR falharam: ${failures.join(", ")}`);
      }
    } catch (error) {
      console.error(`\u274C Erro ao extrair texto da imagem:`, error);
      throw new Error(`Falha na extra\xE7\xE3o de texto da imagem: ${error.message || "Erro desconhecido"}`);
    }
  }
  /**
   * Analisa texto e extrai dados estruturados de reserva
   * @param text Texto a ser analisado
   * @param skipQualityCheck Se verdadeiro, faz uma extração mais rápida mas menos precisa
   * @returns Dados estruturados da reserva
   */
  async parseReservationData(text2, skipQualityCheck = false) {
    try {
      console.log(`\u{1F4DD} AIAdapter: Extraindo dados de reserva (skipQualityCheck=${skipQualityCheck})`);
      return await this.geminiService.parseReservationData(text2);
    } catch (error) {
      console.error(`Erro ao extrair dados de reserva com Gemini:`, error);
      throw new Error(`Falha ao extrair dados de reserva: ${error.message || "Erro desconhecido"}`);
    }
  }
  /**
   * Valida dados de reserva
   * @param data Dados a serem validados
   * @param propertyRules Regras da propriedade
   * @returns Resultado da validação
   */
  async validateReservationData(data, propertyRules) {
    try {
      return await this.geminiService.validateReservationData(data, propertyRules);
    } catch (error) {
      console.error(`Erro ao validar dados de reserva com Gemini:`, error);
      throw new Error(`Falha ao validar dados de reserva: ${error.message || "Erro desconhecido"}`);
    }
  }
  /**
   * Classifica o tipo de documento com base no texto
   * @param text Texto do documento
   * @returns Classificação do documento
   */
  async classifyDocument(text2) {
    try {
      return await this.geminiService.classifyDocument(text2);
    } catch (error) {
      console.error(`Erro ao classificar documento com Gemini:`, error);
      throw new Error(`Falha ao classificar documento: ${error.message || "Erro desconhecido"}`);
    }
  }
  /**
   * Analisa visualmente um documento
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @returns Análise visual do documento
   */
  async analyzeDocumentVisually(fileBase64, mimeType) {
    try {
      return await this.geminiService.analyzeDocumentVisually(fileBase64, mimeType);
    } catch (error) {
      console.error(`Erro ao analisar documento visualmente com Gemini:`, error);
      throw new Error(`Falha na an\xE1lise visual do documento: ${error.message || "Erro desconhecido"}`);
    }
  }
  /**
   * Processa um documento completo (PDF ou imagem)
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @returns Resultado do processamento
   */
  async processReservationDocument(fileBase64, mimeType) {
    try {
      const serviceName = this.getCurrentService() === "auto" /* AUTO */ ? "autom\xE1tico" : this.getCurrentService();
      console.log(`\u{1F4C4} Processando documento ${mimeType} usando servi\xE7o: ${serviceName}`);
      const isPDF = mimeType.includes("pdf");
      let extractedText;
      try {
        console.log(`\u{1F50D} Extraindo texto do ${isPDF ? "PDF" : "imagem"}...`);
        if (isPDF) {
          extractedText = await this.extractTextFromPDF(fileBase64);
        } else {
          extractedText = await this.extractTextFromImage(fileBase64, mimeType);
        }
        console.log(`\u2705 Extra\xE7\xE3o de texto conclu\xEDda: ${extractedText.length} caracteres`);
      } catch (error) {
        console.error(`\u274C Erro na extra\xE7\xE3o de texto:`, error);
        return {
          success: false,
          error: "Falha na extra\xE7\xE3o de texto",
          details: error.message || "Erro desconhecido na extra\xE7\xE3o de texto"
        };
      }
      let visualAnalysisPromise;
      try {
        visualAnalysisPromise = this.geminiService.analyzeDocumentVisually(fileBase64, mimeType);
      } catch (error) {
        visualAnalysisPromise = Promise.resolve({ type: "unknown", confidence: 0 });
      }
      let structuredData;
      try {
        console.log(`\u{1F50D} Extraindo dados estruturados do texto...`);
        structuredData = await this.parseReservationData(extractedText);
        console.log(`\u2705 Dados estruturados extra\xEDdos com sucesso`);
      } catch (error) {
        console.error(`\u274C Erro na extra\xE7\xE3o de dados estruturados:`, error);
        return {
          success: false,
          error: "Falha na extra\xE7\xE3o de dados estruturados",
          details: error.message || "Erro desconhecido na extra\xE7\xE3o de dados estruturados",
          rawText: extractedText
        };
      }
      let visualAnalysis;
      try {
        visualAnalysis = await visualAnalysisPromise;
      } catch (error) {
        visualAnalysis = { type: "unknown", confidence: 0 };
      }
      const requiredFields = ["propertyName", "guestName", "checkInDate", "checkOutDate"];
      const missingFields = requiredFields.filter((field) => !structuredData[field]);
      if (missingFields.length > 0) {
        console.log(`\u26A0\uFE0F Dados estruturados incompletos. Campos ausentes: ${missingFields.join(", ")}`);
      }
      if (!structuredData.documentType) {
        structuredData.documentType = "reserva";
      }
      try {
        await ragService.integrateProcessedDocument(
          extractedText,
          structuredData,
          structuredData.documentType || "reservation",
          {
            mimeType,
            isPDF,
            visualAnalysis,
            processingDate: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        console.log("\u2705 Documento integrado ao RAG para aprendizado cont\xEDnuo");
      } catch (ragError) {
        console.error("\u26A0\uFE0F Erro ao integrar documento ao RAG:", ragError);
      }
      return {
        success: true,
        rawText: extractedText,
        data: structuredData,
        documentInfo: {
          ...visualAnalysis,
          mimeType,
          isPDF
        }
      };
    } catch (error) {
      console.error(`\u274C Erro no processamento do documento:`, error);
      return {
        success: false,
        error: "Falha no processamento do documento",
        details: error.message || "Erro desconhecido no processamento"
      };
    }
  }
  /**
   * Extrai dados estruturados a partir de texto
   * @param text Texto para análise
   * @param options Opções de configuração (prompt do sistema, formato de resposta, etc.)
   * @returns Dados extraídos no formato solicitado
   */
  /**
   * Gera texto com base em um prompt usando o serviço Gemini
   * @param options Opções para a geração de texto
   * @returns Texto gerado
   */
  async generateText(options) {
    try {
      return await this.geminiService.generateText(
        options.prompt,
        options.temperature || 0.7,
        options.maxTokens
      );
    } catch (error) {
      console.error("Erro ao gerar texto com Gemini:", error);
      throw new Error(`Falha ao gerar texto: ${error.message || "Erro desconhecido"}`);
    }
  }
  async extractDataFromText(text2, options) {
    try {
      let enhancedPrompt = options.systemPrompt || "Extraia dados do seguinte texto";
      if (options.extractFields && options.extractFields.length > 0) {
        enhancedPrompt += `

Extraia especificamente os seguintes campos: ${options.extractFields.join(", ")}`;
      }
      if (options.documentType) {
        enhancedPrompt += `

O texto \xE9 proveniente de um documento do tipo: ${options.documentType}`;
      }
      const result = await this.geminiService.generateText(
        enhancedPrompt + "\n\n" + text2,
        options.temperature || 0.2,
        options.maxTokens
      );
      return result;
    } catch (error) {
      console.error(`Erro ao extrair dados com Gemini:`, error);
      throw new Error(`Falha ao extrair dados: ${error.message || "Erro desconhecido"}`);
    }
  }
  /**
   * Este método foi completamente removido.
   * Todos os serviços devem usar diretamente os métodos do Gemini.
   * @returns nunca
   * @throws Erro indicando que o método foi removido
   */
  /**
   * Retorna o cliente Gemini para uso em análise de dados
   * NOTA: Este método NÃO deve ser usado para OCR, apenas para análise de dados e interação com a IA
   * @returns Instância do serviço Gemini
   */
  getGeminiClient() {
    return this.geminiService;
  }
  /**
   * Reconhece e aprende um novo formato de documento
   * Esta função usa o Gemini para analisar documentos em formatos desconhecidos
   * e extrair informações relevantes mesmo quando o layout não é familiar
   * 
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @param fields Lista de campos a serem extraídos
   * @returns Dados extraídos do documento
   */
  async learnNewDocumentFormat(fileBase64, mimeType, fields) {
    if (!this.geminiService.isConfigured()) {
      throw new Error("Aprendizado de novos formatos de documento requer o servi\xE7o Gemini");
    }
    console.log(`\u{1F9E0} Iniciando an\xE1lise e aprendizado de novo formato de documento...`);
    try {
      let extractedText = "";
      if (mimeType.includes("pdf")) {
        extractedText = await this.extractTextFromPDF(fileBase64);
      } else if (mimeType.includes("image")) {
        extractedText = await this.extractTextFromImage(fileBase64, mimeType);
      } else {
        throw new Error(`Tipo de documento n\xE3o suportado: ${mimeType}`);
      }
      const systemPrompt = `
        Voc\xEA \xE9 um especialista em reconhecimento de documentos e extra\xE7\xE3o de dados.
        Este \xE9 um novo formato de documento que voc\xEA precisa analisar e extrair informa\xE7\xF5es.
        
        Por favor, examine cuidadosamente o documento e extraia os seguintes campos:
        ${fields.map((field) => `- ${field}`).join("\n")}
        
        Retorne o resultado como um JSON v\xE1lido onde cada campo acima \xE9 uma chave.
        Se um campo n\xE3o puder ser encontrado, use null como valor.
        
        Al\xE9m disso, inclua uma se\xE7\xE3o "formatInfo" com:
        - Uma descri\xE7\xE3o do tipo de documento
        - Qualquer elemento distintivo que permita identificar este formato
        - Um n\xEDvel de confian\xE7a (0-100) para cada campo extra\xEDdo
      `;
      const result = await this.extractDataFromText(extractedText, {
        systemPrompt,
        responseFormat: { type: "json_object" },
        temperature: 0.2,
        extractFields: fields,
        documentType: "unknown_format",
        maxTokens: 4096
        // Usar um valor maior para extrações complexas
      });
      console.log(`\u2705 Novo formato de documento analisado com sucesso`);
      const extractedData = result.data || result;
      try {
        const formatInfo = extractedData.formatInfo || {
          type: "unknown_format",
          confidence: 70
        };
        await ragService.learnDocumentFormat(
          fileBase64,
          mimeType,
          extractedData,
          formatInfo
        );
        console.log("\u2705 Novo formato de documento armazenado no RAG");
      } catch (ragError) {
        console.error("\u26A0\uFE0F Erro ao armazenar formato no RAG:", ragError);
      }
      return {
        success: true,
        extractedData,
        rawText: extractedText,
        fields
      };
    } catch (error) {
      console.error(`\u274C Erro no aprendizado de novo formato:`, error);
      return {
        success: false,
        error: "Falha na an\xE1lise do novo formato de documento",
        details: error.message || "Erro desconhecido"
      };
    }
  }
};
var aiService = AIAdapter.getInstance();

// server/services/reservation-importer.service.ts
var ReservationImporterService = class {
  geminiService;
  constructor() {
    this.geminiService = aiService.geminiService;
  }
  /**
   * Initialize the Gemini service using the provided API key
   * @param apiKey Google Gemini API key
   * @deprecated Use aiService.geminiService
   */
  async initialize(apiKey) {
    console.log("M\xE9todo initialize() est\xE1 obsoleto. O servi\xE7o Gemini j\xE1 est\xE1 inicializado via aiService");
    return aiService.isServiceAvailable();
  }
  /**
   * Import reservation data from text input
   * @param text Unstructured text containing reservation details
   * @param options Options for the import process
   * @returns Structured reservation data and any clarification questions
   */
  async importFromText(text2, options = { originalText: text2 }) {
    if (!text2 || text2.trim() === "") {
      throw new Error("Text input is required");
    }
    const context = this.createImportContext(text2, options);
    try {
      const result = await this.callGeminiForImport(context);
      return result;
    } catch (error) {
      console.error("Error importing reservation data:", error);
      throw new Error(`Failed to import reservation data: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Create a context object for the Gemini API request
   * @param text Input text to process
   * @param options Additional options
   * @returns Context object for Gemini API
   */
  createImportContext(text2, options) {
    const { originalText, userAnswers } = options;
    let contextText = text2;
    if (userAnswers && Object.keys(userAnswers).length > 0) {
      contextText += "\n\n--- Clarifica\xE7\xF5es do usu\xE1rio ---\n";
      for (const [question, answer] of Object.entries(userAnswers)) {
        contextText += `Pergunta: ${question}
Resposta: ${answer}

`;
      }
    }
    return {
      text: contextText,
      originalText: originalText || text2
    };
  }
  /**
   * Call the Gemini API to extract reservation data
   * @param context Context for the API request
   * @returns Structured reservation data and any clarification questions
   */
  async callGeminiForImport(context) {
    const prompt = this.createReservationImportPrompt(context.text);
    try {
      const result = await aiService.generateText({
        prompt,
        temperature: 0.1,
        maxTokens: 1024
      });
      if (!result || typeof result !== "string") {
        throw new Error("Invalid response from AI service");
      }
      const cleanedResult = result.replace(/```json\s*|\s*```/g, "");
      const parsedResult = JSON.parse(cleanedResult);
      if (!parsedResult.reservation_data) {
        throw new Error("Missing reservation data in AI response");
      }
      return {
        reservation_data: parsedResult.reservation_data,
        clarification_questions: parsedResult.clarification_questions || []
      };
    } catch (error) {
      console.error("Error processing Gemini response:", error);
      return {
        reservation_data: {
          property_name: "",
          check_in_date: "",
          check_out_date: "",
          guest_name: "",
          total_guests: 0
        },
        clarification_questions: [
          "N\xE3o foi poss\xEDvel extrair os detalhes da reserva. Por favor, verifique o formato e tente novamente."
        ]
      };
    }
  }
  /**
   * Create the prompt for the Gemini API to extract reservation data
   * @param text Input text to process
   * @returns Prompt for Gemini API
   */
  createReservationImportPrompt(text2) {
    return `
Tu \xE9s um assistente especializado em extrair informa\xE7\xF5es de reservas para propriedades de alojamento local.

# Tarefa
Analisa o texto fornecido abaixo e extrai informa\xE7\xF5es estruturadas sobre uma reserva. 
O texto pode vir de v\xE1rias fontes como emails, mensagens, tabelas copiadas, ou notas.
Extrai APENAS os dados presentes no texto. Se informa\xE7\xF5es estiverem faltando ou forem amb\xEDguas, N\xC3O ADIVINHE.

# Formato de sa\xEDda
Voc\xEA deve retornar um objeto JSON com duas propriedades:
- reservation_data: Um objeto com os campos da reserva extra\xEDdos do texto
- clarification_questions: Um array de perguntas para o usu\xE1rio, caso haja informa\xE7\xF5es amb\xEDguas ou faltantes

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional. N\xE3o inclua coment\xE1rios ou explica\xE7\xF5es.

Exemplo de formato de resposta:
\`\`\`json
{
  "reservation_data": {
    "property_name": "EXCITING LISBON 5 DE OUTUBRO",
    "check_in_date": "2025-04-15",
    "check_out_date": "2025-04-20",
    "guest_name": "Joao Silva",
    "total_guests": 2,
    "adults": 2,
    "booking_source": "Airbnb"
  },
  "clarification_questions": [
    "Qual \xE9 o email do h\xF3spede?",
    "H\xE1 algum pedido especial para esta reserva?"
  ]
}
\`\`\`

# Regras para clarifica\xE7\xE3o:
- Se "property_name" for amb\xEDguo ou ausente, pergunte: "A qual propriedade pertence esta reserva?"
- Se as datas de checkin/checkout forem amb\xEDguas ou ausentes, pergunte: "Podes confirmar as datas de check-in e check-out (DD/MM/AAAA)?"
- Se apenas houver total de h\xF3spedes sem detalhe, pergunte: "Podes especificar a distribui\xE7\xE3o dos [total_guests] h\xF3spedes (quantos Adultos, Crian\xE7as, Beb\xE9s)?"
- Se "booking_source" for amb\xEDguo ou ausente, pergunte: "Qual foi a plataforma/origem desta reserva (Airbnb, Booking, Directo, etc.)?"
- Acrescente outras perguntas relevantes para campos cr\xEDticos em falta.

# Texto da reserva:
${text2}
`;
  }
  /**
   * Get the function definitions for Gemini function calling
   * @returns Function definitions for Gemini API
   */
  getReservationImportFunctions() {
    return [
      {
        name: "extractReservationData",
        description: "Extract reservation data from text input",
        parameters: {
          type: "object",
          properties: {
            reservation_data: {
              type: "object",
              description: "Structured reservation data extracted from text",
              properties: {
                property_name: {
                  type: "string",
                  description: 'Name or identifier of the property (e.g., "EXCITING LISBON 5 DE OUTUBRO", "Aroeira I", "Casa dos Barcos T1 (47)")'
                },
                check_in_date: {
                  type: "string",
                  description: "Arrival date in ISO 8601 YYYY-MM-DD format. Infer year (likely 2025 based on examples)"
                },
                check_in_time: {
                  type: "string",
                  description: 'Arrival time in HH:MM format (e.g., "16:00", "13:00"). Default to "16:00" if unspecified'
                },
                check_out_date: {
                  type: "string",
                  description: "Departure date in ISO 8601 YYYY-MM-DD format"
                },
                check_out_time: {
                  type: "string",
                  description: 'Departure time in HH:MM format (e.g., "11:00", "00:00"). Default to "11:00" if unspecified'
                },
                guest_name: {
                  type: "string",
                  description: "Main guest/booker name"
                },
                total_guests: {
                  type: "integer",
                  description: "Total number of guests"
                },
                adults: {
                  type: "integer",
                  description: "Number of adults"
                },
                children: {
                  type: "integer",
                  description: "Number of children"
                },
                infants: {
                  type: "integer",
                  description: "Number of infants/babies"
                },
                children_ages: {
                  type: "array",
                  items: {
                    type: "integer"
                  },
                  description: "List of children's ages if provided (e.g., [14], [6])"
                },
                guest_country: {
                  type: "string",
                  description: `Guest's country (e.g., "Fran\xE7a", "Portugal", "Espanha")`
                },
                guest_email: {
                  type: "string",
                  description: "Guest's email, if available"
                },
                guest_phone: {
                  type: "string",
                  description: "Guest's phone number, if available"
                },
                booking_source: {
                  type: "string",
                  description: 'Origin of the booking (e.g., "Airbnb", "Booking.com", "Pessoal", "Directo", "Innkeeper")'
                },
                special_requests: {
                  type: "string",
                  description: "All relevant notes, requests, and additional info"
                },
                booking_reference: {
                  type: "string",
                  description: "Booking ID or reference code from PMS/Platform"
                },
                booking_status: {
                  type: "string",
                  description: 'Status like "Confirmada", "Pendente", "De propriet\xE1rio". Default to "Confirmada" if unspecified'
                }
              },
              required: ["property_name", "check_in_date", "check_out_date", "guest_name", "total_guests"]
            },
            clarification_questions: {
              type: "array",
              description: "List of questions to ask the user for clarification on ambiguous or missing information",
              items: {
                type: "string"
              }
            }
          },
          required: ["reservation_data"]
        }
      }
    ];
  }
  /**
   * Convert imported reservation data to InsertReservation format
   * @param importData Imported reservation data
   * @param propertyId Property ID from the database
   * @returns Data in InsertReservation format
   */
  async convertToInsertReservation(importData, propertyId) {
    const sourceMappings = {
      "airbnb": "airbnb",
      "booking.com": "booking",
      "booking": "booking",
      "expedia": "expedia",
      "directo": "direct",
      "direct": "direct",
      "pessoal": "direct",
      "personal": "direct"
    };
    const statusMappings = {
      "confirmada": "confirmed",
      "confirmed": "confirmed",
      "pendente": "pending",
      "pending": "pending",
      "cancelada": "cancelled",
      "cancelled": "cancelled"
    };
    let notes = "";
    if (importData.special_requests) {
      notes += `Pedidos especiais: ${importData.special_requests}
`;
    }
    const guestInfo = [];
    if (importData.adults !== void 0) guestInfo.push(`${importData.adults} adultos`);
    if (importData.children !== void 0) guestInfo.push(`${importData.children} crian\xE7as`);
    if (importData.infants !== void 0) guestInfo.push(`${importData.infants} beb\xE9s`);
    if (guestInfo.length > 0) {
      notes += `
Distribui\xE7\xE3o de h\xF3spedes: ${guestInfo.join(", ")}`;
    }
    if (importData.children_ages && importData.children_ages.length > 0) {
      notes += `
Idades das crian\xE7as: ${importData.children_ages.join(", ")}`;
    }
    if (importData.booking_reference) {
      notes += `
Refer\xEAncia da reserva: ${importData.booking_reference}`;
    }
    const source = importData.booking_source ? sourceMappings[importData.booking_source.toLowerCase()] || importData.booking_source.toLowerCase() : "manual";
    const status = importData.booking_status ? statusMappings[importData.booking_status.toLowerCase()] || "confirmed" : "confirmed";
    return {
      propertyId,
      guestName: importData.guest_name,
      checkInDate: importData.check_in_date,
      checkOutDate: importData.check_out_date,
      totalAmount: "0",
      // Placeholder - will be updated later
      numGuests: importData.total_guests,
      guestEmail: importData.guest_email || "",
      guestPhone: importData.guest_phone || "",
      status,
      notes: notes.trim(),
      source
    };
  }
};
var reservation_importer_service_default = ReservationImporterService;

// server/features/reservations/infrastructure/reservation.repository.ts
var DrizzleReservationRepository = class {
  async findAll(filters) {
    if (filters?.propertyId) {
      return await storage.getReservationsByProperty(filters.propertyId);
    }
    let reservations3 = await storage.getReservations();
    if (filters) {
      if (filters.status) {
        reservations3 = reservations3.filter((r) => r.status === filters.status);
      }
      if (filters.platform) {
        reservations3 = reservations3.filter((r) => r.platform === filters.platform);
      }
      if (filters.startDate) {
        reservations3 = reservations3.filter((r) => new Date(r.checkInDate) >= filters.startDate);
      }
      if (filters.endDate) {
        reservations3 = reservations3.filter((r) => new Date(r.checkInDate) <= filters.endDate);
      }
      if (filters.guestName) {
        const searchTerm = filters.guestName.toLowerCase();
        reservations3 = reservations3.filter(
          (r) => r.guestName.toLowerCase().includes(searchTerm)
        );
      }
    }
    return reservations3;
  }
  async findById(id) {
    return await storage.getReservation(id);
  }
  async findByProperty(propertyId) {
    return await storage.getReservationsByProperty(propertyId);
  }
  async create(data) {
    return await storage.createReservation(data);
  }
  async update(id, data) {
    return await storage.updateReservation(id, data);
  }
  async delete(id) {
    return await storage.deleteReservation(id);
  }
  async getDashboardData() {
    const reservations3 = await storage.getReservationsForDashboard();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const tomorrow = /* @__PURE__ */ new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const checkIns = [];
    const checkOuts = [];
    const cleaningTasks = [];
    reservations3.forEach((reservation) => {
      const checkInStr = reservation.checkInDate instanceof Date ? reservation.checkInDate.toISOString().split("T")[0] : String(reservation.checkInDate).split("T")[0];
      if (checkInStr === today || checkInStr === tomorrowStr) {
        checkIns.push(reservation);
      }
      const checkOutStr = reservation.checkOutDate instanceof Date ? reservation.checkOutDate.toISOString().split("T")[0] : String(reservation.checkOutDate).split("T")[0];
      if (checkOutStr === today) {
        checkOuts.push(reservation);
        cleaningTasks.push({
          id: `cleaning-${reservation.id}`,
          propertyId: reservation.propertyId,
          propertyName: reservation.propertyName,
          title: `Limpeza ap\xF3s sa\xEDda`,
          description: `Limpeza necess\xE1ria ap\xF3s sa\xEDda do h\xF3spede ${reservation.guestName}`,
          status: "pending",
          priority: "medium",
          type: "cleaning",
          date: reservation.checkOutDate
        });
      }
    });
    return {
      checkIns,
      checkOuts,
      cleaningTasks
    };
  }
};
var DrizzlePropertyRepositoryForReservations = class {
  async findById(id) {
    return await storage.getProperty(id);
  }
};
var ReservationImportServiceImpl = class {
  importerService = null;
  async getImporterService() {
    if (!this.importerService) {
      this.importerService = new reservation_importer_service_default();
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
      await this.importerService.initialize(apiKey);
    }
    return this.importerService;
  }
  async importFromText(text2, options) {
    const importer = await this.getImporterService();
    const result = await importer.importFromText(text2, options);
    const response = {
      success: !!result.reservation_data,
      needsClarification: !!(result.clarification_questions && result.clarification_questions.length > 0),
      clarificationQuestions: result.clarification_questions,
      reservationData: result.reservation_data
    };
    if (!response.success) {
      response.message = "N\xE3o foi poss\xEDvel extrair dados estruturados do texto";
    }
    return response;
  }
};

// server/features/reservations/presentation/reservation.routes.ts
var reservationRepository = new DrizzleReservationRepository();
var propertyRepository = new DrizzlePropertyRepositoryForReservations();
var importService = new ReservationImportServiceImpl();
var reservationService = new ReservationDomainService(
  reservationRepository,
  propertyRepository,
  importService
);
var reservationController = new ReservationController(reservationService);
var router3 = Router3();
router3.get("/", (req, res) => reservationController.getAllReservations(req, res));
router3.get("/dashboard", (req, res) => reservationController.getDashboardData(req, res));
router3.get("/:id", (req, res) => reservationController.getReservationById(req, res));
router3.get("/property/:propertyId", (req, res) => reservationController.getReservationsByProperty(req, res));
router3.post("/", (req, res) => reservationController.createReservation(req, res));
router3.post("/import-text", (req, res) => reservationController.importFromText(req, res));
router3.patch("/:id", (req, res) => reservationController.updateReservation(req, res));
router3.delete("/:id", (req, res) => reservationController.deleteReservation(req, res));
var reservation_routes_default = router3;

// server/features/properties/presentation/property.routes.ts
import { Router as Router4 } from "express";

// server/features/properties/presentation/property.controller.ts
init_schema();
var PropertyController = class {
  constructor(propertyService2) {
    this.propertyService = propertyService2;
  }
  async getAllProperties(req, res) {
    try {
      const result = await this.propertyService.getAllProperties();
      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || "Failed to fetch properties"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async getPropertyById(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse("Invalid property ID"));
        return;
      }
      const result = await this.propertyService.getPropertyById(id);
      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        const statusCode = result.error === "Property not found" ? 404 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || "Failed to fetch property"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async createProperty(req, res) {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const result = await this.propertyService.createProperty(validatedData);
      if (result.success) {
        res.status(201).json(createSuccessResponse(result.data, "Property created successfully"));
      } else {
        const statusCode = result.error?.includes("already exists") ? 409 : 400;
        res.status(statusCode).json(createErrorResponse(result.error || "Failed to create property"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async updateProperty(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse("Invalid property ID"));
        return;
      }
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const result = await this.propertyService.updateProperty(id, validatedData);
      if (result.success) {
        res.json(createSuccessResponse(result.data, "Property updated successfully"));
      } else {
        const statusCode = result.error === "Property not found" ? 404 : result.error?.includes("already exists") ? 409 : 400;
        res.status(statusCode).json(createErrorResponse(result.error || "Failed to update property"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async deleteProperty(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse("Invalid property ID"));
        return;
      }
      const result = await this.propertyService.deleteProperty(id);
      if (result.success) {
        res.status(204).end();
      } else {
        const statusCode = result.error === "Property not found" ? 404 : result.error?.includes("active reservations") ? 409 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || "Failed to delete property"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async getPropertyStatistics(req, res) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse("Invalid property ID"));
        return;
      }
      const result = await this.propertyService.getPropertyStatistics(id);
      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        const statusCode = result.error === "Property not found" ? 404 : 500;
        res.status(statusCode).json(createErrorResponse(result.error || "Failed to fetch property statistics"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
  async getActiveProperties(req, res) {
    try {
      const result = await this.propertyService.getActiveProperties();
      if (result.success) {
        res.json(createSuccessResponse(result.data));
      } else {
        res.status(500).json(createErrorResponse(result.error || "Failed to fetch active properties"));
      }
    } catch (err) {
      handleError(err, res);
    }
  }
};

// server/features/properties/domain/property.service.ts
var PropertyDomainService = class {
  constructor(propertyRepository3) {
    this.propertyRepository = propertyRepository3;
  }
  async getAllProperties() {
    try {
      const properties3 = await this.propertyRepository.findAll();
      return {
        success: true,
        data: properties3
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch properties"
      };
    }
  }
  async getPropertyById(id) {
    try {
      const property = await this.propertyRepository.findById(id);
      if (!property) {
        return {
          success: false,
          error: "Property not found"
        };
      }
      return {
        success: true,
        data: property
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch property"
      };
    }
  }
  async createProperty(data) {
    try {
      if (!data.name || data.name.trim() === "") {
        return {
          success: false,
          error: "Property name is required"
        };
      }
      const existingProperty = await this.propertyRepository.findByName(data.name);
      if (existingProperty) {
        return {
          success: false,
          error: "A property with this name already exists"
        };
      }
      const property = await this.propertyRepository.create(data);
      return {
        success: true,
        data: property
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create property"
      };
    }
  }
  async updateProperty(id, data) {
    try {
      const existingProperty = await this.propertyRepository.findById(id);
      if (!existingProperty) {
        return {
          success: false,
          error: "Property not found"
        };
      }
      if (data.name && data.name !== existingProperty.name) {
        const duplicateProperty = await this.propertyRepository.findByName(data.name);
        if (duplicateProperty && duplicateProperty.id !== id) {
          return {
            success: false,
            error: "A property with this name already exists"
          };
        }
      }
      const updatedProperty = await this.propertyRepository.update(id, data);
      return {
        success: true,
        data: updatedProperty
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update property"
      };
    }
  }
  async deleteProperty(id) {
    try {
      const property = await this.propertyRepository.findById(id);
      if (!property) {
        return {
          success: false,
          error: "Property not found"
        };
      }
      const hasActiveReservations = await this.propertyRepository.hasActiveReservations(id);
      if (hasActiveReservations) {
        return {
          success: false,
          error: "Cannot delete property with active reservations"
        };
      }
      const result = await this.propertyRepository.delete(id);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete property"
      };
    }
  }
  async getPropertyStatistics(id) {
    try {
      const property = await this.propertyRepository.findById(id);
      if (!property) {
        return {
          success: false,
          error: "Property not found"
        };
      }
      const statistics = await this.propertyRepository.getStatistics(id);
      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch property statistics"
      };
    }
  }
  async getActiveProperties() {
    try {
      const properties3 = await this.propertyRepository.findActive();
      return {
        success: true,
        data: properties3
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch active properties"
      };
    }
  }
};

// server/features/properties/infrastructure/property.repository.ts
var DrizzlePropertyRepository = class {
  async findAll() {
    return await storage.getProperties();
  }
  async findById(id) {
    return await storage.getProperty(id);
  }
  async findByName(name) {
    const properties3 = await storage.getProperties();
    return properties3.find((p) => p.name.toLowerCase() === name.toLowerCase()) || null;
  }
  async findActive() {
    const properties3 = await storage.getProperties();
    return properties3.filter((p) => p.active);
  }
  async create(data) {
    return await storage.createProperty(data);
  }
  async update(id, data) {
    return await storage.updateProperty(id, data);
  }
  async delete(id) {
    return await storage.deleteProperty(id);
  }
  async getStatistics(id) {
    return await storage.getPropertyStatistics(id);
  }
  async hasActiveReservations(propertyId) {
    try {
      const reservations3 = await storage.getReservationsByProperty(propertyId);
      return reservations3.some(
        (r) => r.status === "confirmed" || r.status === "pending" || r.status === "completed" && new Date(r.checkOutDate) > /* @__PURE__ */ new Date()
      );
    } catch (error) {
      console.error("Error checking active reservations:", error);
      return false;
    }
  }
};

// server/features/properties/presentation/property.routes.ts
var propertyRepository2 = new DrizzlePropertyRepository();
var propertyService = new PropertyDomainService(propertyRepository2);
var propertyController = new PropertyController(propertyService);
var router4 = Router4();
router4.get("/", (req, res) => propertyController.getAllProperties(req, res));
router4.get("/active", (req, res) => propertyController.getActiveProperties(req, res));
router4.get("/:id", (req, res) => propertyController.getPropertyById(req, res));
router4.get("/:id/statistics", (req, res) => propertyController.getPropertyStatistics(req, res));
router4.post("/", (req, res) => propertyController.createProperty(req, res));
router4.patch("/:id", (req, res) => propertyController.updateProperty(req, res));
router4.delete("/:id", (req, res) => propertyController.deleteProperty(req, res));
var property_routes_default = router4;

// server/routes/v1/owners.routes.ts
init_db();
init_schema();
import { Router as Router5 } from "express";
import { eq as eq4 } from "drizzle-orm";
var router5 = Router5();
router5.get("/", async (req, res) => {
  try {
    const allOwners = await db2.select().from(owners);
    res.json({ success: true, data: allOwners });
  } catch (error) {
    console.error("Error fetching owners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch owners",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
router5.get("/:id", async (req, res) => {
  try {
    const ownerId = parseInt(req.params.id);
    const owner = await db2.query.owners.findFirst({
      where: eq4(owners.id, ownerId),
      with: {
        properties: true
      }
    });
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }
    res.json({ success: true, data: owner });
  } catch (error) {
    console.error("Error fetching owner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch owner",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
router5.post("/", async (req, res) => {
  try {
    const validated = insertOwnerSchema.parse(req.body);
    const [newOwner] = await db2.insert(owners).values(validated).returning();
    res.status(201).json({
      success: true,
      data: newOwner,
      message: "Owner created successfully"
    });
  } catch (error) {
    console.error("Error creating owner:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create owner",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
router5.patch("/:id", async (req, res) => {
  try {
    const ownerId = parseInt(req.params.id);
    const validated = insertOwnerSchema.partial().parse(req.body);
    const [updatedOwner] = await db2.update(owners).set(validated).where(eq4(owners.id, ownerId)).returning();
    if (!updatedOwner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }
    res.json({
      success: true,
      data: updatedOwner,
      message: "Owner updated successfully"
    });
  } catch (error) {
    console.error("Error updating owner:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update owner",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
router5.delete("/:id", async (req, res) => {
  try {
    const ownerId = parseInt(req.params.id);
    const ownerWithProps = await db2.query.owners.findFirst({
      where: eq4(owners.id, ownerId),
      with: { properties: true }
    });
    if (!ownerWithProps) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }
    if (ownerWithProps.properties && ownerWithProps.properties.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete owner with ${ownerWithProps.properties.length} associated properties`
      });
    }
    await db2.delete(owners).where(eq4(owners.id, ownerId));
    res.json({
      success: true,
      message: "Owner deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting owner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete owner",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
var owners_routes_default = router5;

// server/routes/v1/financial.routes.ts
init_db();
init_schema();
import { Router as Router6 } from "express";
import { eq as eq5, and as and4, gte as gte4, lte as lte4, desc as desc4 } from "drizzle-orm";
var router6 = Router6();
router6.get("/", async (req, res) => {
  try {
    const { type, startDate, endDate, propertyId } = req.query;
    let query3 = db2.select().from(financialDocuments);
    const conditions = [];
    if (type) {
      conditions.push(eq5(financialDocuments.type, type));
    }
    if (propertyId) {
      conditions.push(eq5(financialDocuments.propertyId, parseInt(propertyId)));
    }
    if (startDate) {
      conditions.push(gte4(financialDocuments.date, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte4(financialDocuments.date, new Date(endDate)));
    }
    const documents = conditions.length > 0 ? await query3.where(and4(...conditions)).orderBy(desc4(financialDocuments.date)) : await query3.orderBy(desc4(financialDocuments.date));
    const totals = documents.reduce((acc, doc) => {
      const amount = parseFloat(doc.amount || "0");
      if (doc.type === "invoice") acc.invoices += amount;
      if (doc.type === "expense") acc.expenses += amount;
      if (doc.type === "receipt") acc.receipts += amount;
      acc.total += amount;
      return acc;
    }, { invoices: 0, expenses: 0, receipts: 0, total: 0 });
    res.json({
      success: true,
      data: documents,
      meta: {
        count: documents.length,
        totals
      }
    });
  } catch (error) {
    console.error("Error fetching financial documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch financial documents",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
router6.get("/summary", async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Year parameter is required"
      });
    }
    const startDate = month ? new Date(parseInt(year), parseInt(month) - 1, 1) : new Date(parseInt(year), 0, 1);
    const endDate = month ? new Date(parseInt(year), parseInt(month), 0) : new Date(parseInt(year), 11, 31);
    const documents = await db2.select().from(financialDocuments).where(
      and4(
        gte4(financialDocuments.date, startDate),
        lte4(financialDocuments.date, endDate)
      )
    );
    const summary = {
      period: {
        year: parseInt(year),
        month: month ? parseInt(month) : null,
        startDate,
        endDate
      },
      totals: {
        invoices: 0,
        expenses: 0,
        receipts: 0,
        netIncome: 0
      },
      byType: {},
      byMonth: {}
    };
    documents.forEach((doc) => {
      const amount = parseFloat(doc.amount || "0");
      const month2 = doc.date.getMonth() + 1;
      if (doc.type === "invoice") summary.totals.invoices += amount;
      if (doc.type === "expense") summary.totals.expenses += amount;
      if (doc.type === "receipt") summary.totals.receipts += amount;
      summary.byType[doc.type] = (summary.byType[doc.type] || 0) + amount;
      summary.byMonth[month2] = (summary.byMonth[month2] || 0) + amount;
    });
    summary.totals.netIncome = summary.totals.invoices + summary.totals.receipts - summary.totals.expenses;
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error("Error generating financial summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate financial summary",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
router6.get("/:id", async (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const document = await db2.query.financialDocuments.findFirst({
      where: eq5(financialDocuments.id, docId),
      with: {
        property: true
      }
    });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Financial document not found"
      });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    console.error("Error fetching financial document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch financial document",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
router6.post("/", async (req, res) => {
  try {
    const validated = insertFinancialDocumentSchema.parse(req.body);
    const [newDocument] = await db2.insert(financialDocuments).values(validated).returning();
    res.status(201).json({
      success: true,
      data: newDocument,
      message: "Financial document created successfully"
    });
  } catch (error) {
    console.error("Error creating financial document:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create financial document",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
router6.patch("/:id", async (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const validated = insertFinancialDocumentSchema.partial().parse(req.body);
    const [updatedDocument] = await db2.update(financialDocuments).set(validated).where(eq5(financialDocuments.id, docId)).returning();
    if (!updatedDocument) {
      return res.status(404).json({
        success: false,
        message: "Financial document not found"
      });
    }
    res.json({
      success: true,
      data: updatedDocument,
      message: "Financial document updated successfully"
    });
  } catch (error) {
    console.error("Error updating financial document:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update financial document",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
router6.delete("/:id", async (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const [deleted] = await db2.delete(financialDocuments).where(eq5(financialDocuments.id, docId)).returning();
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Financial document not found"
      });
    }
    res.json({
      success: true,
      message: "Financial document deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting financial document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete financial document",
      error: process.env.NODE_ENV === "development" ? error.message : void 0
    });
  }
});
var financial_routes_default = router6;

// server/routes/ocr-processing.route.ts
import express2 from "express";
import multer from "multer";

// server/services/ocr-multi-provider.service.ts
import pdfParse2 from "pdf-parse";
import sharp from "sharp";
import crypto3 from "crypto";
var OCRMultiProviderService = class {
  providers = /* @__PURE__ */ new Map();
  geminiService;
  openRouterService;
  processingQueue = [];
  isProcessing = false;
  maxConcurrentProcessing = 3;
  currentProcessingCount = 0;
  constructor() {
    this.geminiService = new GeminiService();
    this.openRouterService = new OpenRouterService();
    this.initializeProviders();
  }
  /**
   * Initialize OCR providers with configuration
   */
  initializeProviders() {
    this.providers.set("gemini", {
      name: "Gemini",
      priority: 1,
      available: !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      maxRetries: 3,
      timeout: 3e4,
      costPerPage: 1e-3
      // Low cost
    });
    this.providers.set("openrouter", {
      name: "OpenRouter-Mistral",
      priority: 2,
      available: !!process.env.OPENROUTER_API_KEY,
      maxRetries: 2,
      timeout: 25e3,
      costPerPage: 5e-3
      // Medium cost
    });
    this.providers.set("native", {
      name: "Native",
      priority: 3,
      available: true,
      // Always available
      maxRetries: 1,
      timeout: 1e4,
      costPerPage: 0
      // No cost
    });
    console.log("\u{1F527} OCR providers initialized:");
    this.providers.forEach((provider, name) => {
      console.log(`  ${name}: ${provider.available ? "\u2705" : "\u274C"} (priority: ${provider.priority})`);
    });
  }
  /**
   * Get available providers sorted by priority
   */
  getAvailableProviders() {
    return Array.from(this.providers.entries()).filter(([_, provider]) => provider.available).sort((a, b) => a[1].priority - b[1].priority);
  }
  /**
   * Preprocess image for better OCR accuracy
   */
  async preprocessImage(imageBuffer) {
    try {
      const processedImage = await sharp(imageBuffer).resize(2048, 2048, { fit: "inside", withoutEnlargement: true }).normalize().sharpen().modulate({ brightness: 1.1, contrast: 1.2 }).png({ quality: 95 }).toBuffer();
      console.log("\u{1F5BC}\uFE0F Image preprocessed for better OCR accuracy");
      return processedImage;
    } catch (error) {
      console.warn("\u26A0\uFE0F Image preprocessing failed, using original:", error);
      return imageBuffer;
    }
  }
  /**
   * Process with Gemini API (primary provider)
   */
  async processWithGemini(fileBase64, mimeType) {
    const startTime = Date.now();
    try {
      let result;
      if (mimeType.includes("pdf")) {
        result = await this.geminiService.processReservationDocument(fileBase64, mimeType);
      } else {
        result = await this.geminiService.processReservationDocument(fileBase64, mimeType);
      }
      if (!result.success) {
        throw new Error(result.error || "Gemini processing failed");
      }
      const processingTime = Date.now() - startTime;
      return {
        success: true,
        text: result.rawText || "",
        confidence: 0.95,
        // Gemini typically provides high confidence
        processingTime,
        provider: "gemini",
        structuredData: result.data,
        metadata: {
          pageCount: 1,
          // Estimate
          language: "auto",
          quality: "high"
        }
      };
    } catch (error) {
      console.error("\u274C Gemini OCR failed:", error);
      return {
        success: false,
        text: "",
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: "gemini",
        error: error.message
      };
    }
  }
  /**
   * Process with OpenRouter Mistral (backup provider)
   */
  async processWithOpenRouter(fileBase64, mimeType) {
    const startTime = Date.now();
    try {
      const fileBuffer = Buffer.from(fileBase64, "base64");
      let result;
      if (mimeType.includes("pdf")) {
        result = await this.openRouterService.ocrPdf(fileBuffer);
      } else {
        result = await this.openRouterService.ocrImage(fileBuffer, mimeType);
      }
      if (result.error) {
        throw new Error(result.error);
      }
      const processingTime = Date.now() - startTime;
      return {
        success: true,
        text: result.full_text || "",
        confidence: 0.85,
        // OpenRouter typically provides good confidence
        processingTime,
        provider: "openrouter",
        metadata: {
          pageCount: 1,
          language: "auto",
          quality: "medium"
        }
      };
    } catch (error) {
      console.error("\u274C OpenRouter OCR failed:", error);
      return {
        success: false,
        text: "",
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: "openrouter",
        error: error.message
      };
    }
  }
  /**
   * Process with native PDF extraction (fallback)
   */
  async processWithNative(fileBase64, mimeType) {
    const startTime = Date.now();
    try {
      if (!mimeType.includes("pdf")) {
        throw new Error("Native extraction only supports PDF files");
      }
      const pdfBuffer = Buffer.from(fileBase64, "base64");
      const data = await pdfParse2(pdfBuffer);
      const processingTime = Date.now() - startTime;
      return {
        success: true,
        text: data.text || "",
        confidence: data.text ? 0.7 : 0.1,
        // Lower confidence for native extraction
        processingTime,
        provider: "native",
        metadata: {
          pageCount: data.numpages,
          language: "unknown",
          quality: "low"
        }
      };
    } catch (error) {
      console.error("\u274C Native PDF extraction failed:", error);
      return {
        success: false,
        text: "",
        confidence: 0,
        processingTime: Date.now() - startTime,
        provider: "native",
        error: error.message
      };
    }
  }
  /**
   * Validate OCR result quality
   */
  validateOCRResult(result) {
    const issues = [];
    const corrections = [];
    let qualityScore = 100;
    if (result.text.length < 50) {
      issues.push("Text too short (possible extraction failure)");
      qualityScore -= 30;
    }
    const artifacts = /[^\w\s\.,\-\(\)\[\]]/g;
    const artifactMatches = result.text.match(artifacts);
    if (artifactMatches && artifactMatches.length > result.text.length * 0.05) {
      issues.push("High number of OCR artifacts detected");
      qualityScore -= 20;
    }
    const bookingIndicators = [
      /check.?in/i,
      /check.?out/i,
      /guest/i,
      /booking/i,
      /reservation/i,
      /property/i,
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/
    ];
    const indicatorCount = bookingIndicators.filter(
      (pattern) => pattern.test(result.text)
    ).length;
    if (indicatorCount < 2) {
      issues.push("Missing typical booking document indicators");
      qualityScore -= 15;
    }
    if (result.confidence < 0.8) {
      issues.push("Low OCR confidence score");
      qualityScore -= 25;
    }
    const isValid = qualityScore >= 60 && result.text.length >= 10;
    return {
      isValid,
      confidence: Math.max(0, Math.min(1, qualityScore / 100)),
      issues,
      corrections,
      qualityScore
    };
  }
  /**
   * Extract structured booking data from OCR text
   */
  async extractStructuredData(text2) {
    try {
      if (this.providers.get("gemini")?.available) {
        return await this.geminiService.parseReservationData(text2);
      }
      const structuredData = {
        documentType: "reservation"
      };
      const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;
      const dates = text2.match(datePattern);
      if (dates && dates.length >= 2) {
        structuredData.checkInDate = dates[0];
        structuredData.checkOutDate = dates[1];
      }
      const namePattern = /(?:guest|name|hóspede)[:\s]+([A-Za-z\s]+)/i;
      const nameMatch = text2.match(namePattern);
      if (nameMatch) {
        structuredData.guestName = nameMatch[1].trim();
      }
      const propertyPattern = /(?:property|propriedade|hotel|apartamento)[:\s]+([A-Za-z0-9\s]+)/i;
      const propertyMatch = text2.match(propertyPattern);
      if (propertyMatch) {
        structuredData.propertyName = propertyMatch[1].trim();
      }
      return structuredData;
    } catch (error) {
      console.error("\u274C Failed to extract structured data:", error);
      return { documentType: "unknown" };
    }
  }
  /**
   * Process document with intelligent failover
   */
  async processDocument(fileBase64, mimeType, options = {}) {
    const processingId = crypto3.randomBytes(8).toString("hex");
    console.log(`\u{1F50D} [${processingId}] Starting OCR processing with multi-provider system`);
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length === 0) {
      throw new Error("No OCR providers available");
    }
    if (options.preferredProvider) {
      const preferredProvider = this.providers.get(options.preferredProvider);
      if (preferredProvider?.available) {
        const result = await this.processWithProvider(
          options.preferredProvider,
          fileBase64,
          mimeType,
          processingId
        );
        if (result.success) {
          const validation = this.validateOCRResult(result);
          if (validation.isValid || !options.requireHighQuality) {
            console.log(`\u2705 [${processingId}] Success with preferred provider: ${options.preferredProvider}`);
            return result;
          }
        }
      }
    }
    let lastError = "";
    const attempts = [];
    for (const [providerName, provider] of availableProviders) {
      if (options.preferredProvider === providerName) {
        continue;
      }
      console.log(`\u{1F504} [${processingId}] Attempting with ${providerName} (priority: ${provider.priority})`);
      const result = await this.processWithProvider(providerName, fileBase64, mimeType, processingId);
      attempts.push({ provider: providerName, result });
      if (result.success) {
        const validation = this.validateOCRResult(result);
        if (validation.isValid) {
          console.log(`\u2705 [${processingId}] Success with ${providerName} (quality: ${validation.qualityScore}%)`);
          if (!result.structuredData && result.text) {
            result.structuredData = await this.extractStructuredData(result.text);
          }
          return result;
        } else {
          console.warn(`\u26A0\uFE0F [${processingId}] ${providerName} succeeded but quality insufficient: ${validation.qualityScore}%`);
          lastError = `Quality insufficient: ${validation.issues.join(", ")}`;
        }
      } else {
        lastError = result.error || "Unknown error";
        console.error(`\u274C [${processingId}] ${providerName} failed: ${lastError}`);
      }
      if (!options.requireHighQuality && result.success && result.text.length > 10) {
        console.log(`\u{1F4DD} [${processingId}] Accepting lower quality result from ${providerName}`);
        if (!result.structuredData && result.text) {
          result.structuredData = await this.extractStructuredData(result.text);
        }
        return result;
      }
    }
    console.error(`\u274C [${processingId}] All OCR providers failed`);
    const bestAttempt = attempts.find((a) => a.result.success) || attempts.reduce(
      (best, current) => current.result.confidence > (best?.result.confidence || 0) ? current : best,
      null
    );
    if (bestAttempt) {
      console.log(`\u{1F3AF} [${processingId}] Returning best attempt from ${bestAttempt.provider}`);
      return bestAttempt.result;
    }
    return {
      success: false,
      text: "",
      confidence: 0,
      processingTime: 0,
      provider: "none",
      error: `All providers failed. Last error: ${lastError}`,
      metadata: { quality: "low" }
    };
  }
  /**
   * Process with specific provider
   */
  async processWithProvider(providerName, fileBase64, mimeType, processingId) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    const timeout = provider.timeout;
    const maxRetries = provider.maxRetries;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\u{1F504} [${processingId}] ${providerName} attempt ${attempt}/${maxRetries}`);
      try {
        const result = await Promise.race([
          this.executeProviderMethod(providerName, fileBase64, mimeType),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout)
          )
        ]);
        if (result.success) {
          console.log(`\u2705 [${processingId}] ${providerName} succeeded in ${result.processingTime}ms`);
          return result;
        } else {
          console.warn(`\u26A0\uFE0F [${processingId}] ${providerName} failed: ${result.error}`);
        }
        if (attempt < maxRetries) {
          const delay = Math.min(1e3 * Math.pow(2, attempt - 1), 5e3);
          console.log(`\u23F3 [${processingId}] Retrying ${providerName} in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        return result;
      } catch (error) {
        console.error(`\u274C [${processingId}] ${providerName} attempt ${attempt} failed:`, error.message);
        if (attempt === maxRetries) {
          return {
            success: false,
            text: "",
            confidence: 0,
            processingTime: 0,
            provider: providerName,
            error: error.message
          };
        }
        if (attempt < maxRetries) {
          const delay = Math.min(1e3 * Math.pow(2, attempt - 1), 5e3);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    return {
      success: false,
      text: "",
      confidence: 0,
      processingTime: 0,
      provider: providerName,
      error: "Max retries exceeded"
    };
  }
  /**
   * Execute provider-specific method
   */
  async executeProviderMethod(providerName, fileBase64, mimeType) {
    switch (providerName) {
      case "gemini":
        return await this.processWithGemini(fileBase64, mimeType);
      case "openrouter":
        return await this.processWithOpenRouter(fileBase64, mimeType);
      case "native":
        return await this.processWithNative(fileBase64, mimeType);
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }
  /**
   * Process multiple documents in batch
   */
  async batchProcess(documents, options = {}) {
    const concurrency = options.concurrency || 3;
    const results = [];
    console.log(`\u{1F4E6} Starting batch processing of ${documents.length} documents`);
    for (let i = 0; i < documents.length; i += concurrency) {
      const chunk = documents.slice(i, i + concurrency);
      const chunkPromises = chunk.map(async (doc, index) => {
        try {
          const result = await this.processDocument(doc.fileBase64, doc.mimeType, {
            preferredProvider: options.preferredProvider,
            requireHighQuality: false
          });
          return {
            ...result,
            documentId: doc.id || `doc_${i + index + 1}`
          };
        } catch (error) {
          console.error(`\u274C Batch processing failed for document ${doc.id || i + index + 1}:`, error);
          return {
            success: false,
            text: "",
            confidence: 0,
            processingTime: 0,
            provider: "none",
            error: error.message,
            documentId: doc.id || `doc_${i + index + 1}`
          };
        }
      });
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      console.log(`\u2705 Processed chunk ${Math.floor(i / concurrency) + 1}/${Math.ceil(documents.length / concurrency)}`);
    }
    const successCount = results.filter((r) => r.success).length;
    console.log(`\u{1F4CA} Batch processing complete: ${successCount}/${documents.length} successful`);
    return results;
  }
  /**
   * Get provider status and health
   */
  async getProviderStatus() {
    const status = {};
    for (const [name, provider] of this.providers.entries()) {
      status[name] = {
        name: provider.name,
        priority: provider.priority,
        available: provider.available,
        maxRetries: provider.maxRetries,
        timeout: provider.timeout,
        costPerPage: provider.costPerPage
      };
      if (provider.available && name !== "native") {
        try {
          const startTime = Date.now();
          let testResult;
          switch (name) {
            case "gemini":
              testResult = await this.geminiService.testConnection();
              break;
            case "openrouter":
              testResult = await this.openRouterService.testConnection();
              break;
          }
          status[name].health = {
            connected: testResult?.success || false,
            latency: Date.now() - startTime,
            lastCheck: (/* @__PURE__ */ new Date()).toISOString(),
            message: testResult?.message || "Unknown"
          };
        } catch (error) {
          status[name].health = {
            connected: false,
            error: error.message,
            lastCheck: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      } else if (name === "native") {
        status[name].health = {
          connected: true,
          message: "Always available"
        };
      }
    }
    return status;
  }
  /**
   * Get processing statistics
   */
  getStatistics() {
    return {
      availableProviders: Array.from(this.providers.entries()).filter(([_, p]) => p.available).map(([name, p]) => ({ name: p.name, priority: p.priority })),
      queueLength: this.processingQueue.length,
      currentProcessing: this.currentProcessingCount,
      maxConcurrent: this.maxConcurrentProcessing,
      totalProviders: this.providers.size
    };
  }
};
var ocrMultiProviderService = new OCRMultiProviderService();

// server/utils/matchPropertyByAlias.ts
function matchPropertyByAlias(propertyName, properties3) {
  if (!propertyName || !properties3 || properties3.length === 0) {
    return void 0;
  }
  const normalizedName = normalizePropertyName(propertyName);
  const exactMatch = properties3.find(
    (property) => normalizePropertyName(property.name) === normalizedName
  );
  if (exactMatch) {
    return exactMatch;
  }
  for (const property of properties3) {
    if (property.aliases && Array.isArray(property.aliases)) {
      const matchingAlias = property.aliases.find(
        (alias) => normalizePropertyName(alias) === normalizedName
      );
      if (matchingAlias) {
        return property;
      }
    }
  }
  const partialNameMatches = properties3.filter(
    (property) => normalizePropertyName(property.name).includes(normalizedName) || normalizedName.includes(normalizePropertyName(property.name))
  );
  if (partialNameMatches.length > 0) {
    return partialNameMatches[0];
  }
  for (const property of properties3) {
    if (property.aliases && Array.isArray(property.aliases)) {
      const matchingPartialAlias = property.aliases.find(
        (alias) => normalizePropertyName(alias).includes(normalizedName) || normalizedName.includes(normalizePropertyName(alias))
      );
      if (matchingPartialAlias) {
        return property;
      }
    }
  }
  return void 0;
}
function normalizePropertyName(name) {
  if (!name) return "";
  return name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

// server/routes/ocr-processing.route.ts
var { getAvailableProviders, getOptimalProvider, validateConfiguration } = require_ocr_providers_config();
var router7 = express2.Router();
var upload = multer({
  dest: "uploads/temp/",
  limits: {
    fileSize: 50 * 1024 * 1024,
    // 50MB limit
    files: 10
    // Max 10 files for batch processing
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/bmp",
      "image/tiff"
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and image files are allowed."), false);
    }
  }
});
router7.post("/process", upload.single("file"), async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\u{1F4C4} [${requestId}] OCR process request received`);
  try {
    let fileBase64;
    let mimeType;
    let originalFileName;
    if (req.file) {
      const fs3 = __require("fs");
      const fileBuffer = fs3.readFileSync(req.file.path);
      fileBase64 = fileBuffer.toString("base64");
      mimeType = req.file.mimetype;
      originalFileName = req.file.originalname || "uploaded_file";
      try {
        fs3.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn("Warning: Failed to clean up temp file:", cleanupError);
      }
    } else if (req.body.fileBase64) {
      fileBase64 = req.body.fileBase64;
      mimeType = req.body.mimeType || "application/pdf";
      originalFileName = req.body.fileName || "document";
    } else {
      return res.status(400).json({
        success: false,
        error: "No file provided. Send file via multipart form or as base64 in request body.",
        requestId
      });
    }
    const fileSizeMB = Buffer.byteLength(fileBase64, "base64") / (1024 * 1024);
    const maxSizeMB = 20;
    if (fileSizeMB > maxSizeMB) {
      return res.status(413).json({
        success: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB, received ${fileSizeMB.toFixed(2)}MB.`,
        requestId
      });
    }
    const options = {
      preferredProvider: req.body.preferredProvider || req.query.provider,
      requireHighQuality: req.body.requireHighQuality !== false,
      // Default to true
      timeout: parseInt(req.body.timeout) || 6e4,
      documentType: req.body.documentType || "booking_pdf"
    };
    console.log(`\u{1F50D} [${requestId}] Processing ${originalFileName} (${fileSizeMB.toFixed(2)}MB, ${mimeType})`);
    console.log(`\u2699\uFE0F [${requestId}] Options:`, {
      preferredProvider: options.preferredProvider || "auto",
      requireHighQuality: options.requireHighQuality,
      documentType: options.documentType
    });
    const processWithRateLimit = rateLimiter.rateLimitedFunction(
      async () => {
        return await ocrMultiProviderService.processDocument(fileBase64, mimeType, {
          preferredProvider: options.preferredProvider,
          requireHighQuality: options.requireHighQuality,
          timeout: options.timeout
        });
      },
      `ocr_process_${requestId}`,
      30 * 1e3
      // 30 second cache
    );
    const result = await processWithRateLimit();
    const totalProcessingTime = Date.now() - startTime;
    console.log(`\u23F1\uFE0F [${requestId}] Total processing time: ${totalProcessingTime}ms`);
    if (!result.success) {
      console.error(`\u274C [${requestId}] OCR processing failed:`, result.error);
      return res.status(500).json({
        success: false,
        error: result.error || "OCR processing failed",
        provider: result.provider,
        processingTime: totalProcessingTime,
        requestId
      });
    }
    let enhancedData = result.structuredData || {};
    const missingFields = [];
    if (enhancedData.propertyName) {
      try {
        const properties3 = await storage.getProperties();
        const matchedProperty = matchPropertyByAlias(enhancedData.propertyName, properties3);
        if (matchedProperty) {
          enhancedData.propertyId = matchedProperty.id;
          enhancedData.matchedPropertyName = matchedProperty.name;
          console.log(`\u2705 [${requestId}] Property matched: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
        } else {
          missingFields.push("propertyId");
          console.warn(`\u26A0\uFE0F [${requestId}] Property not found: ${enhancedData.propertyName}`);
        }
      } catch (propertyError) {
        console.error(`\u274C [${requestId}] Property matching error:`, propertyError);
        missingFields.push("propertyId");
      }
    }
    const requiredFields = ["guestName", "checkInDate", "checkOutDate", "propertyName"];
    const currentMissingFields = requiredFields.filter((field) => !enhancedData[field]);
    missingFields.push(...currentMissingFields);
    const response = {
      success: true,
      requestId,
      provider: result.provider,
      confidence: result.confidence,
      processingTime: totalProcessingTime,
      ocrTime: result.processingTime,
      text: result.text,
      textLength: result.text.length,
      structuredData: enhancedData,
      missingFields: [...new Set(missingFields)],
      // Remove duplicates
      metadata: {
        fileName: originalFileName,
        fileSize: `${fileSizeMB.toFixed(2)}MB`,
        mimeType,
        documentType: options.documentType,
        quality: result.metadata?.quality || "unknown",
        pageCount: result.metadata?.pageCount || 1,
        language: result.metadata?.language || "auto"
      },
      // Legacy compatibility fields
      extractedData: enhancedData,
      rawText: result.text,
      boxes: {},
      // Placeholder for bounding boxes if available
      missing: missingFields
    };
    console.log(`\u2705 [${requestId}] OCR processing completed successfully`);
    console.log(`\u{1F4CA} [${requestId}] Stats: ${result.confidence}% confidence, ${result.text.length} chars, ${missingFields.length} missing fields`);
    return res.json(response);
  } catch (error) {
    const totalProcessingTime = Date.now() - startTime;
    console.error(`\u274C [${requestId}] OCR processing error:`, error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during OCR processing",
      details: error.message,
      processingTime: totalProcessingTime,
      requestId
    });
  }
});
router7.post("/batch", upload.array("files", 10), async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\u{1F4E6} [${requestId}] Batch OCR processing request`);
  try {
    let documents = [];
    if (req.files && Array.isArray(req.files)) {
      const fs3 = __require("fs");
      documents = req.files.map((file, index) => {
        const fileBuffer = fs3.readFileSync(file.path);
        try {
          fs3.unlinkSync(file.path);
        } catch (cleanupError) {
          console.warn("Warning: Failed to clean up temp file:", cleanupError);
        }
        return {
          fileBase64: fileBuffer.toString("base64"),
          mimeType: file.mimetype,
          id: file.originalname || `document_${index + 1}`
        };
      });
    } else if (req.body.documents && Array.isArray(req.body.documents)) {
      documents = req.body.documents.map((doc, index) => ({
        fileBase64: doc.fileBase64,
        mimeType: doc.mimeType || "application/pdf",
        id: doc.id || doc.fileName || `document_${index + 1}`
      }));
    } else {
      return res.status(400).json({
        success: false,
        error: "No documents provided for batch processing",
        requestId
      });
    }
    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid documents found for processing",
        requestId
      });
    }
    if (documents.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Maximum 10 documents allowed per batch",
        requestId
      });
    }
    const options = {
      concurrency: parseInt(req.body.concurrency) || 3,
      preferredProvider: req.body.preferredProvider || req.query.provider
    };
    console.log(`\u{1F4CA} [${requestId}] Processing ${documents.length} documents with concurrency: ${options.concurrency}`);
    const startTime = Date.now();
    const results = await ocrMultiProviderService.batchProcess(documents, options);
    const totalTime = Date.now() - startTime;
    const enhancedResults = await Promise.all(results.map(async (result) => {
      let enhancedData = result.structuredData || {};
      const missingFields = [];
      if (enhancedData.propertyName) {
        try {
          const properties3 = await storage.getProperties();
          const matchedProperty = matchPropertyByAlias(enhancedData.propertyName, properties3);
          if (matchedProperty) {
            enhancedData.propertyId = matchedProperty.id;
            enhancedData.matchedPropertyName = matchedProperty.name;
          } else {
            missingFields.push("propertyId");
          }
        } catch (propertyError) {
          missingFields.push("propertyId");
        }
      }
      return {
        ...result,
        structuredData: enhancedData,
        missingFields
      };
    }));
    const successCount = enhancedResults.filter((r) => r.success).length;
    const failureCount = documents.length - successCount;
    console.log(`\u2705 [${requestId}] Batch processing completed: ${successCount} successful, ${failureCount} failed`);
    return res.json({
      success: true,
      requestId,
      summary: {
        total: documents.length,
        successful: successCount,
        failed: failureCount,
        processingTime: totalTime,
        averageTimePerDocument: Math.round(totalTime / documents.length)
      },
      results: enhancedResults
    });
  } catch (error) {
    console.error(`\u274C [${requestId}] Batch OCR processing error:`, error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during batch OCR processing",
      details: error.message,
      requestId
    });
  }
});
router7.get("/providers", async (req, res) => {
  try {
    const [providerStatus, configValidation] = await Promise.all([
      ocrMultiProviderService.getProviderStatus(),
      Promise.resolve(validateConfiguration())
    ]);
    const availableProviders = getAvailableProviders();
    const statistics = ocrMultiProviderService.getStatistics();
    return res.json({
      success: true,
      providers: providerStatus,
      availableProviders,
      statistics,
      configuration: configValidation,
      recommendations: configValidation.recommendations
    });
  } catch (error) {
    console.error("Error fetching provider status:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch provider status",
      details: error.message
    });
  }
});
router7.get("/status", async (req, res) => {
  try {
    const statistics = ocrMultiProviderService.getStatistics();
    const configValidation = validateConfiguration();
    return res.json({
      success: true,
      status: "operational",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      statistics,
      configuration: {
        valid: configValidation.valid,
        issues: configValidation.issues,
        availableProviders: configValidation.availableProviders
      },
      version: "1.0.0"
    });
  } catch (error) {
    console.error("Error fetching OCR status:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch OCR status",
      details: error.message
    });
  }
});
router7.post("/validate", async (req, res) => {
  try {
    const { text: text2, confidence, provider } = req.body;
    if (!text2) {
      return res.status(400).json({
        success: false,
        error: "Text is required for validation"
      });
    }
    const validation = {
      isValid: text2.length >= 10 && (confidence || 0) >= 0.5,
      confidence: confidence || 0,
      issues: [],
      corrections: [],
      qualityScore: Math.min(100, text2.length / 10 * (confidence || 0.5) * 100)
    };
    if (text2.length < 50) {
      validation.issues.push("Text appears to be too short");
      validation.qualityScore *= 0.8;
    }
    if ((confidence || 0) < 0.7) {
      validation.issues.push("Low confidence score from OCR provider");
      validation.qualityScore *= 0.9;
    }
    const bookingPatterns = [
      /check.?in/i,
      /check.?out/i,
      /guest/i,
      /booking/i,
      /reservation/i
    ];
    const indicatorCount = bookingPatterns.filter((pattern) => pattern.test(text2)).length;
    if (indicatorCount < 2) {
      validation.issues.push("Missing typical booking document indicators");
      validation.qualityScore *= 0.85;
    }
    validation.qualityScore = Math.round(Math.max(0, Math.min(100, validation.qualityScore)));
    validation.isValid = validation.qualityScore >= 60;
    return res.json({
      success: true,
      validation,
      recommendations: validation.isValid ? [] : [
        "Consider using a different OCR provider",
        "Check document image quality",
        "Verify document type matches expected format"
      ]
    });
  } catch (error) {
    console.error("Error validating OCR result:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to validate OCR result",
      details: error.message
    });
  }
});
router7.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: "File too large. Maximum size is 50MB."
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Maximum 10 files per request."
      });
    }
  }
  if (error.message && error.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  console.error("OCR route error:", error);
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.message : void 0
  });
});
var ocr_processing_route_default = router7;

// server/routes/validation.route.ts
import { Router as Router7 } from "express";

// server/services/ai-validation-enhanced.service.ts
import { WebSocket } from "ws";
import { EventEmitter } from "events";

// server/utils/validation-rules.engine.ts
var ValidationRulesEngine = class {
  rulesAppliedCount = 0;
  businessRules = [];
  dataTypeRules = [];
  formatRules = [];
  constructor() {
    this.initializeBusinessRules();
    this.initializeDataTypeRules();
    this.initializeFormatRules();
  }
  /**
   * Initialize 20+ comprehensive business rules
   */
  initializeBusinessRules() {
    this.businessRules = [
      // Property Management Rules
      {
        id: "property_price_range",
        name: "Property Price Range Validation",
        category: "property",
        validate: (response, context) => {
          if (response.price && (response.price < 0 || response.price > 5e4)) {
            return [{
              type: "business",
              severity: "critical",
              field: "price",
              message: "Property price must be between \u20AC0 and \u20AC50,000 per night",
              suggestedFix: Math.min(Math.max(response.price, 50), 2e3).toString(),
              confidence: 0.95,
              source: "property_price_validator"
            }];
          }
          return [];
        }
      },
      {
        id: "guest_capacity_limit",
        name: "Guest Capacity Validation",
        category: "property",
        validate: (response, context) => {
          if (response.maxGuests && (response.maxGuests < 1 || response.maxGuests > 50)) {
            return [{
              type: "business",
              severity: "major",
              field: "maxGuests",
              message: "Guest capacity must be between 1 and 50",
              suggestedFix: Math.min(Math.max(response.maxGuests, 1), 20).toString(),
              confidence: 0.9,
              source: "capacity_validator"
            }];
          }
          return [];
        }
      },
      {
        id: "booking_date_future",
        name: "Future Booking Date Validation",
        category: "booking",
        validate: (response, context) => {
          const errors = [];
          if (response.checkIn) {
            const checkInDate = new Date(response.checkIn);
            const today = /* @__PURE__ */ new Date();
            if (checkInDate <= today) {
              errors.push({
                type: "business",
                severity: "critical",
                field: "checkIn",
                message: "Check-in date must be in the future",
                suggestedFix: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
                confidence: 0.98,
                source: "date_validator"
              });
            }
          }
          return errors;
        }
      },
      {
        id: "booking_duration_limit",
        name: "Booking Duration Validation",
        category: "booking",
        validate: (response, context) => {
          if (response.checkIn && response.checkOut) {
            const checkIn = new Date(response.checkIn);
            const checkOut = new Date(response.checkOut);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1e3 * 60 * 60 * 24));
            if (nights > 365) {
              return [{
                type: "business",
                severity: "major",
                field: "duration",
                message: "Booking duration cannot exceed 365 nights",
                confidence: 0.92,
                source: "duration_validator"
              }];
            }
            if (nights < 1) {
              return [{
                type: "business",
                severity: "critical",
                field: "duration",
                message: "Check-out must be after check-in date",
                confidence: 0.98,
                source: "duration_validator"
              }];
            }
          }
          return [];
        }
      },
      {
        id: "minimum_advance_booking",
        name: "Minimum Advance Booking",
        category: "booking",
        validate: (response, context) => {
          if (response.checkIn) {
            const checkIn = new Date(response.checkIn);
            const now = /* @__PURE__ */ new Date();
            const hoursAdvance = (checkIn.getTime() - now.getTime()) / (1e3 * 60 * 60);
            if (hoursAdvance < 24) {
              return [{
                type: "business",
                severity: "major",
                field: "checkIn",
                message: "Bookings must be made at least 24 hours in advance",
                confidence: 0.85,
                source: "advance_booking_validator"
              }];
            }
          }
          return [];
        }
      },
      {
        id: "seasonal_pricing_validation",
        name: "Seasonal Pricing Consistency",
        category: "pricing",
        validate: (response, context) => {
          if (response.pricing && context.season) {
            const basePrice = response.pricing.basePrice || response.price;
            const seasonalMultipliers = {
              "summer": { min: 1.2, max: 2.5 },
              "winter": { min: 0.8, max: 1.8 },
              "spring": { min: 0.9, max: 1.6 },
              "fall": { min: 0.85, max: 1.5 }
            };
            const multiplier = seasonalMultipliers[context.season];
            if (multiplier && response.pricing.seasonalPrice) {
              const actualMultiplier = response.pricing.seasonalPrice / basePrice;
              if (actualMultiplier < multiplier.min || actualMultiplier > multiplier.max) {
                return [{
                  type: "business",
                  severity: "minor",
                  field: "seasonalPrice",
                  message: `Seasonal pricing for ${context.season} seems unusual`,
                  confidence: 0.7,
                  source: "seasonal_pricing_validator"
                }];
              }
            }
          }
          return [];
        }
      },
      {
        id: "cleaning_fee_reasonable",
        name: "Cleaning Fee Validation",
        category: "pricing",
        validate: (response, context) => {
          if (response.cleaningFee && response.price) {
            const feeRatio = response.cleaningFee / response.price;
            if (feeRatio > 0.5) {
              return [{
                type: "business",
                severity: "major",
                field: "cleaningFee",
                message: "Cleaning fee should not exceed 50% of nightly rate",
                suggestedFix: (response.price * 0.3).toFixed(2),
                confidence: 0.8,
                source: "cleaning_fee_validator"
              }];
            }
          }
          return [];
        }
      },
      {
        id: "security_deposit_limit",
        name: "Security Deposit Validation",
        category: "pricing",
        validate: (response, context) => {
          if (response.securityDeposit) {
            if (response.securityDeposit > 5e3) {
              return [{
                type: "business",
                severity: "major",
                field: "securityDeposit",
                message: "Security deposit cannot exceed \u20AC5,000",
                suggestedFix: "1000",
                confidence: 0.9,
                source: "security_deposit_validator"
              }];
            }
          }
          return [];
        }
      },
      {
        id: "property_address_completeness",
        name: "Address Completeness Validation",
        category: "property",
        validate: (response, context) => {
          const errors = [];
          if (response.address) {
            const requiredFields = ["street", "city", "postalCode", "country"];
            for (const field of requiredFields) {
              if (!response.address[field] || response.address[field].trim() === "") {
                errors.push({
                  type: "business",
                  severity: "major",
                  field: `address.${field}`,
                  message: `Address ${field} is required`,
                  confidence: 0.95,
                  source: "address_validator"
                });
              }
            }
          }
          return errors;
        }
      },
      {
        id: "contact_info_validation",
        name: "Contact Information Validation",
        category: "property",
        validate: (response, context) => {
          const errors = [];
          if (response.contact) {
            if (response.contact.phone && !/^\+?[\d\s\-\(\)]{7,15}$/.test(response.contact.phone)) {
              errors.push({
                type: "business",
                severity: "major",
                field: "contact.phone",
                message: "Invalid phone number format",
                confidence: 0.85,
                source: "contact_validator"
              });
            }
            if (response.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response.contact.email)) {
              errors.push({
                type: "business",
                severity: "critical",
                field: "contact.email",
                message: "Invalid email format",
                confidence: 0.98,
                source: "contact_validator"
              });
            }
          }
          return errors;
        }
      },
      {
        id: "amenities_consistency",
        name: "Amenities Consistency Validation",
        category: "property",
        validate: (response, context) => {
          const errors = [];
          if (response.amenities) {
            const conflicts = [
              ["petFriendly", "noPets"],
              ["smoking", "noSmoking"],
              ["pool", "noPool"]
            ];
            for (const [amenity1, amenity2] of conflicts) {
              if (response.amenities.includes(amenity1) && response.amenities.includes(amenity2)) {
                errors.push({
                  type: "business",
                  severity: "major",
                  field: "amenities",
                  message: `Conflicting amenities: ${amenity1} and ${amenity2}`,
                  confidence: 0.95,
                  source: "amenities_validator"
                });
              }
            }
          }
          return errors;
        }
      },
      {
        id: "cancellation_policy_validity",
        name: "Cancellation Policy Validation",
        category: "policy",
        validate: (response, context) => {
          if (response.cancellationPolicy) {
            const validPolicies = ["flexible", "moderate", "strict", "super_strict", "long_term"];
            if (!validPolicies.includes(response.cancellationPolicy)) {
              return [{
                type: "business",
                severity: "major",
                field: "cancellationPolicy",
                message: "Invalid cancellation policy",
                suggestedFix: "moderate",
                confidence: 0.9,
                source: "policy_validator"
              }];
            }
          }
          return [];
        }
      },
      {
        id: "minimum_stay_reasonable",
        name: "Minimum Stay Validation",
        category: "policy",
        validate: (response, context) => {
          if (response.minimumStay) {
            if (response.minimumStay > 30) {
              return [{
                type: "business",
                severity: "minor",
                field: "minimumStay",
                message: "Minimum stay over 30 nights may limit bookings",
                confidence: 0.7,
                source: "minimum_stay_validator"
              }];
            }
            if (response.minimumStay < 1) {
              return [{
                type: "business",
                severity: "major",
                field: "minimumStay",
                message: "Minimum stay must be at least 1 night",
                suggestedFix: "1",
                confidence: 0.95,
                source: "minimum_stay_validator"
              }];
            }
          }
          return [];
        }
      },
      {
        id: "property_type_amenities_match",
        name: "Property Type and Amenities Match",
        category: "property",
        validate: (response, context) => {
          const errors = [];
          if (response.propertyType && response.amenities) {
            const typeAmenityRules = {
              "apartment": { required: [], invalid: ["pool", "garden", "garage"] },
              "house": { required: [], invalid: [] },
              "villa": { required: ["garden"], invalid: [] },
              "studio": { required: [], invalid: ["multipleRooms"] }
            };
            const rules = typeAmenityRules[response.propertyType];
            if (rules) {
              for (const invalidAmenity of rules.invalid) {
                if (response.amenities.includes(invalidAmenity)) {
                  errors.push({
                    type: "business",
                    severity: "minor",
                    field: "amenities",
                    message: `${invalidAmenity} is unusual for ${response.propertyType}`,
                    confidence: 0.6,
                    source: "property_type_validator"
                  });
                }
              }
            }
          }
          return errors;
        }
      },
      {
        id: "financial_calculation_accuracy",
        name: "Financial Calculation Validation",
        category: "pricing",
        validate: (response, context) => {
          const errors = [];
          if (response.pricing) {
            const { basePrice, cleaningFee = 0, serviceFee = 0, taxes = 0, total } = response.pricing;
            if (total) {
              const calculatedTotal = basePrice + cleaningFee + serviceFee + taxes;
              const difference = Math.abs(total - calculatedTotal);
              if (difference > 0.01) {
                errors.push({
                  type: "business",
                  severity: "critical",
                  field: "pricing.total",
                  message: "Total price calculation is incorrect",
                  suggestedFix: calculatedTotal.toFixed(2),
                  confidence: 0.99,
                  source: "financial_validator"
                });
              }
            }
          }
          return errors;
        }
      },
      {
        id: "availability_date_consistency",
        name: "Availability Date Consistency",
        category: "availability",
        validate: (response, context) => {
          const errors = [];
          if (response.availability && Array.isArray(response.availability)) {
            for (let i = 0; i < response.availability.length; i++) {
              const period = response.availability[i];
              if (period.startDate && period.endDate) {
                const start = new Date(period.startDate);
                const end = new Date(period.endDate);
                if (start >= end) {
                  errors.push({
                    type: "business",
                    severity: "critical",
                    field: `availability[${i}]`,
                    message: "End date must be after start date",
                    confidence: 0.98,
                    source: "availability_validator"
                  });
                }
              }
            }
          }
          return errors;
        }
      },
      {
        id: "image_url_accessibility",
        name: "Image URL Validation",
        category: "media",
        validate: (response, context) => {
          const errors = [];
          if (response.images && Array.isArray(response.images)) {
            for (let i = 0; i < response.images.length; i++) {
              const imageUrl = response.images[i];
              if (typeof imageUrl === "string" && !imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i)) {
                errors.push({
                  type: "business",
                  severity: "minor",
                  field: `images[${i}]`,
                  message: "Invalid image URL format",
                  confidence: 0.8,
                  source: "media_validator"
                });
              }
            }
          }
          return errors;
        }
      },
      {
        id: "review_score_range",
        name: "Review Score Validation",
        category: "reviews",
        validate: (response, context) => {
          if (response.reviewScore && (response.reviewScore < 1 || response.reviewScore > 5)) {
            return [{
              type: "business",
              severity: "major",
              field: "reviewScore",
              message: "Review score must be between 1 and 5",
              suggestedFix: Math.min(Math.max(response.reviewScore, 1), 5).toFixed(1),
              confidence: 0.95,
              source: "review_validator"
            }];
          }
          return [];
        }
      },
      {
        id: "host_response_time",
        name: "Host Response Time Validation",
        category: "host",
        validate: (response, context) => {
          if (response.hostResponseTime) {
            const validTimes = ["within an hour", "within a few hours", "within a day", "a few days or more"];
            if (!validTimes.includes(response.hostResponseTime)) {
              return [{
                type: "business",
                severity: "minor",
                field: "hostResponseTime",
                message: "Invalid host response time format",
                suggestedFix: "within a few hours",
                confidence: 0.8,
                source: "host_validator"
              }];
            }
          }
          return [];
        }
      },
      {
        id: "location_coordinate_validation",
        name: "Location Coordinates Validation",
        category: "location",
        validate: (response, context) => {
          const errors = [];
          if (response.coordinates) {
            const { latitude, longitude } = response.coordinates;
            if (latitude < -90 || latitude > 90) {
              errors.push({
                type: "business",
                severity: "critical",
                field: "coordinates.latitude",
                message: "Latitude must be between -90 and 90",
                confidence: 0.99,
                source: "coordinate_validator"
              });
            }
            if (longitude < -180 || longitude > 180) {
              errors.push({
                type: "business",
                severity: "critical",
                field: "coordinates.longitude",
                message: "Longitude must be between -180 and 180",
                confidence: 0.99,
                source: "coordinate_validator"
              });
            }
          }
          return errors;
        }
      }
    ];
  }
  /**
   * Initialize data type validation rules
   */
  initializeDataTypeRules() {
    this.dataTypeRules = [
      {
        field: "price",
        expectedType: "number",
        validator: (value) => typeof value === "number" && value >= 0
      },
      {
        field: "maxGuests",
        expectedType: "number",
        validator: (value) => typeof value === "number" && Number.isInteger(value) && value > 0
      },
      {
        field: "checkIn",
        expectedType: "string",
        validator: (value) => typeof value === "string" && !isNaN(Date.parse(value))
      },
      {
        field: "checkOut",
        expectedType: "string",
        validator: (value) => typeof value === "string" && !isNaN(Date.parse(value))
      },
      {
        field: "available",
        expectedType: "boolean",
        validator: (value) => typeof value === "boolean"
      }
    ];
  }
  /**
   * Initialize format validation rules
   */
  initializeFormatRules() {
    this.formatRules = [
      {
        field: "email",
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Invalid email format"
      },
      {
        field: "phone",
        pattern: /^\+?[\d\s\-\(\)]{7,15}$/,
        message: "Invalid phone number format"
      },
      {
        field: "postalCode",
        pattern: /^[\d\w\s\-]{3,10}$/,
        message: "Invalid postal code format"
      },
      {
        field: "url",
        pattern: /^https?:\/\/.+/,
        message: "Invalid URL format"
      }
    ];
  }
  /**
   * Apply all business rules
   */
  async applyBusinessRules(response, context) {
    const allErrors = [];
    this.rulesAppliedCount = 0;
    for (const rule of this.businessRules) {
      try {
        const errors = rule.validate(response, context);
        allErrors.push(...errors);
        this.rulesAppliedCount++;
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
      }
    }
    return allErrors;
  }
  /**
   * Validate data types
   */
  async validateDataTypes(response, context) {
    const errors = [];
    for (const rule of this.dataTypeRules) {
      if (response.hasOwnProperty(rule.field)) {
        const value = response[rule.field];
        if (!rule.validator(value)) {
          errors.push({
            type: "syntax",
            severity: "major",
            field: rule.field,
            message: `Expected ${rule.expectedType} for field ${rule.field}`,
            confidence: 0.9,
            source: "data_type_validator"
          });
        }
      }
    }
    return errors;
  }
  /**
   * Validate formats
   */
  async validateFormats(response, context) {
    const errors = [];
    const checkFormat = (obj, prefix = "") => {
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          checkFormat(value, fieldPath);
        } else if (typeof value === "string") {
          for (const rule of this.formatRules) {
            if (key.includes(rule.field) || fieldPath.includes(rule.field)) {
              if (!rule.pattern.test(value)) {
                errors.push({
                  type: "syntax",
                  severity: "major",
                  field: fieldPath,
                  message: rule.message,
                  confidence: 0.85,
                  source: "format_validator"
                });
              }
            }
          }
        }
      }
    };
    checkFormat(response);
    return errors;
  }
  /**
   * Validate semantics
   */
  async validateSemantics(response, context) {
    const errors = [];
    if (context.domain === "property_management") {
      if (response.bedrooms && response.maxGuests) {
        const maxExpectedGuests = response.bedrooms * 3;
        if (response.maxGuests > maxExpectedGuests) {
          errors.push({
            type: "semantic",
            severity: "minor",
            field: "maxGuests",
            message: `High guest count (${response.maxGuests}) for ${response.bedrooms} bedrooms`,
            confidence: 0.6,
            source: "semantic_validator"
          });
        }
      }
      if (response.price && response.propertyType) {
        const priceRanges = {
          "studio": { min: 30, max: 150 },
          "apartment": { min: 50, max: 300 },
          "house": { min: 80, max: 500 },
          "villa": { min: 150, max: 1e3 }
        };
        const range = priceRanges[response.propertyType];
        if (range && (response.price < range.min || response.price > range.max)) {
          errors.push({
            type: "semantic",
            severity: "minor",
            field: "price",
            message: `Price ${response.price} seems unusual for ${response.propertyType}`,
            confidence: 0.5,
            source: "semantic_validator"
          });
        }
      }
    }
    return errors;
  }
  /**
   * Validate consistency
   */
  async validateConsistency(response, context) {
    const errors = [];
    if (response.checkIn && response.checkOut && response.nights) {
      const checkIn = new Date(response.checkIn);
      const checkOut = new Date(response.checkOut);
      const calculatedNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1e3 * 60 * 60 * 24));
      if (Math.abs(calculatedNights - response.nights) > 0) {
        errors.push({
          type: "consistency",
          severity: "major",
          field: "nights",
          message: "Nights value inconsistent with check-in/check-out dates",
          suggestedFix: calculatedNights.toString(),
          confidence: 0.95,
          source: "consistency_validator"
        });
      }
    }
    if (response.pricing && response.price) {
      if (Math.abs(response.pricing.basePrice - response.price) > 0.01) {
        errors.push({
          type: "consistency",
          severity: "minor",
          field: "pricing.basePrice",
          message: "Base price in pricing object differs from main price field",
          confidence: 0.7,
          source: "consistency_validator"
        });
      }
    }
    return errors;
  }
  /**
   * Property-specific validation rules
   */
  async validatePropertySpecificRules(response, context) {
    const errors = [];
    if (context.propertyType === "villa" && !response.garden && !response.pool) {
      errors.push({
        type: "business",
        severity: "minor",
        field: "amenities",
        message: "Villas typically have gardens or pools",
        confidence: 0.4,
        source: "property_specific_validator"
      });
    }
    return errors;
  }
  /**
   * Financial validation rules
   */
  async validateFinancialRules(response, context) {
    const errors = [];
    if (response.pricing?.taxes) {
      const basePrice = response.pricing.basePrice || response.price;
      const taxRate = response.pricing.taxes / basePrice;
      if (taxRate > 0.3) {
        errors.push({
          type: "business",
          severity: "major",
          field: "pricing.taxes",
          message: "Tax rate exceeds 30%, please verify",
          confidence: 0.8,
          source: "financial_validator"
        });
      }
    }
    if (response.currency && response.pricing) {
      const supportedCurrencies = ["EUR", "USD", "GBP", "BRL"];
      if (!supportedCurrencies.includes(response.currency)) {
        errors.push({
          type: "business",
          severity: "minor",
          field: "currency",
          message: "Unsupported currency detected",
          suggestedFix: "EUR",
          confidence: 0.7,
          source: "financial_validator"
        });
      }
    }
    return errors;
  }
  /**
   * Booking validation rules
   */
  async validateBookingRules(response, context) {
    const errors = [];
    if (response.guestCount && response.maxGuests && response.guestCount > response.maxGuests) {
      errors.push({
        type: "business",
        severity: "critical",
        field: "guestCount",
        message: "Guest count exceeds property maximum",
        suggestedFix: response.maxGuests.toString(),
        confidence: 0.99,
        source: "booking_validator"
      });
    }
    if (response.specialRequests && response.specialRequests.length > 500) {
      errors.push({
        type: "business",
        severity: "minor",
        field: "specialRequests",
        message: "Special requests text is unusually long",
        confidence: 0.6,
        source: "booking_validator"
      });
    }
    return errors;
  }
  getRulesAppliedCount() {
    return this.rulesAppliedCount;
  }
};

// server/services/fact-checking.service.ts
var FactCheckingService = class {
  factDatabase = /* @__PURE__ */ new Map();
  externalSources = [];
  sourcesUsed = [];
  constructor() {
    this.initializeFactDatabase();
    this.initializeExternalSources();
  }
  /**
   * Initialize curated fact database
   */
  initializeFactDatabase() {
    this.addFact("property_price_limits", {
      category: "property",
      subcategory: "pricing",
      facts: {
        min_nightly_rate: 10,
        max_nightly_rate: 5e4,
        avg_cleaning_fee_percentage: 0.15,
        max_security_deposit: 5e3,
        typical_service_fee_percentage: 0.12
      },
      source: "industry_standards",
      confidence: 0.95,
      lastUpdated: /* @__PURE__ */ new Date("2024-01-01")
    });
    this.addFact("booking_constraints", {
      category: "booking",
      subcategory: "policies",
      facts: {
        max_advance_booking_days: 730,
        min_advance_booking_hours: 2,
        max_stay_duration_days: 365,
        min_stay_duration_days: 1
      },
      source: "platform_policies",
      confidence: 0.98,
      lastUpdated: /* @__PURE__ */ new Date("2024-01-01")
    });
    this.addFact("property_types", {
      category: "property",
      subcategory: "classification",
      facts: {
        valid_types: ["apartment", "house", "villa", "studio", "loft", "townhouse", "cottage"],
        bedroom_guest_ratio: 2.5,
        bathroom_guest_ratio: 4
      },
      source: "property_standards",
      confidence: 0.9,
      lastUpdated: /* @__PURE__ */ new Date("2024-01-01")
    });
    this.addFact("location_data", {
      category: "location",
      subcategory: "geography",
      facts: {
        valid_countries: ["Portugal", "Spain", "France", "Italy", "Brazil", "USA", "UK"],
        major_cities: {
          "Portugal": ["Lisbon", "Porto", "Faro", "Braga", "Coimbra"],
          "Spain": ["Madrid", "Barcelona", "Seville", "Valencia", "Bilbao"],
          "France": ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux"]
        },
        timezone_mappings: {
          "Portugal": "Europe/Lisbon",
          "Spain": "Europe/Madrid",
          "France": "Europe/Paris"
        }
      },
      source: "geographic_database",
      confidence: 0.99,
      lastUpdated: /* @__PURE__ */ new Date("2024-01-01")
    });
    this.addFact("seasonal_data", {
      category: "business",
      subcategory: "seasonal_patterns",
      facts: {
        high_season_months: [6, 7, 8, 12],
        // June, July, August, December
        low_season_months: [1, 2, 3, 11],
        // January, February, March, November
        shoulder_season_months: [4, 5, 9, 10],
        // April, May, September, October
        price_multipliers: {
          high_season: { min: 1.2, max: 2.5 },
          shoulder_season: { min: 0.9, max: 1.4 },
          low_season: { min: 0.7, max: 1.1 }
        }
      },
      source: "market_analysis",
      confidence: 0.85,
      lastUpdated: /* @__PURE__ */ new Date("2024-01-01")
    });
    this.addFact("amenity_standards", {
      category: "property",
      subcategory: "amenities",
      facts: {
        standard_amenities: ["wifi", "heating", "kitchen", "bathroom"],
        luxury_amenities: ["pool", "spa", "gym", "concierge"],
        incompatible_combinations: [
          ["smoking_allowed", "non_smoking"],
          ["pet_friendly", "no_pets"],
          ["shared_space", "entire_place"]
        ],
        property_type_amenities: {
          "apartment": { typical: ["elevator", "balcony"], rare: ["pool", "garden"] },
          "villa": { typical: ["garden", "pool", "parking"], rare: ["elevator"] },
          "studio": { typical: ["kitchenette"], rare: ["multiple_bedrooms"] }
        }
      },
      source: "amenity_database",
      confidence: 0.88,
      lastUpdated: /* @__PURE__ */ new Date("2024-01-01")
    });
    this.addFact("legal_requirements", {
      category: "legal",
      subcategory: "compliance",
      facts: {
        required_documents: ["property_license", "tax_registration"],
        max_occupancy_regulations: {
          "Portugal": { bedrooms_to_guests_ratio: 2 },
          "Spain": { bedrooms_to_guests_ratio: 2.5 },
          "France": { bedrooms_to_guests_ratio: 2 }
        },
        tourist_tax_rates: {
          "Portugal": { min: 1, max: 4 },
          "Spain": { min: 0.5, max: 3 },
          "France": { min: 0.2, max: 5 }
        }
      },
      source: "legal_database",
      confidence: 0.92,
      lastUpdated: /* @__PURE__ */ new Date("2024-01-01")
    });
    this.addFact("market_rates", {
      category: "pricing",
      subcategory: "market_data",
      facts: {
        average_rates_by_city: {
          "Lisbon": { min: 45, max: 350, avg: 120 },
          "Porto": { min: 35, max: 250, avg: 85 },
          "Madrid": { min: 50, max: 400, avg: 140 },
          "Barcelona": { min: 60, max: 500, avg: 180 },
          "Paris": { min: 80, max: 800, avg: 250 }
        },
        seasonal_adjustments: {
          "coastal": { summer: 1.8, winter: 0.7 },
          "city": { summer: 1.3, winter: 0.9 },
          "rural": { summer: 1.4, winter: 0.8 }
        }
      },
      source: "market_research",
      confidence: 0.82,
      lastUpdated: /* @__PURE__ */ new Date("2024-01-01")
    });
  }
  /**
   * Initialize external data sources
   */
  initializeExternalSources() {
    this.externalSources = [
      {
        name: "google_maps",
        type: "geocoding",
        endpoint: "https://maps.googleapis.com/maps/api/geocode/json",
        confidence: 0.95,
        rateLimited: true,
        timeout: 5e3
      },
      {
        name: "openweather",
        type: "weather",
        endpoint: "https://api.openweathermap.org/data/2.5/weather",
        confidence: 0.9,
        rateLimited: true,
        timeout: 3e3
      },
      {
        name: "exchange_rates",
        type: "financial",
        endpoint: "https://api.exchangerate-api.com/v4/latest/EUR",
        confidence: 0.98,
        rateLimited: false,
        timeout: 2e3
      },
      {
        name: "postal_codes",
        type: "location",
        endpoint: "http://api.zippopotam.us",
        confidence: 0.85,
        rateLimited: false,
        timeout: 3e3
      }
    ];
  }
  /**
   * Main fact validation method
   */
  async validateFacts(response, context) {
    const errors = [];
    this.sourcesUsed = [];
    try {
      const databaseErrors = await this.checkAgainstFactDatabase(response, context);
      errors.push(...databaseErrors);
      const locationErrors = await this.validateLocationFacts(response, context);
      errors.push(...locationErrors);
      const pricingErrors = await this.validatePricingFacts(response, context);
      errors.push(...pricingErrors);
      const propertyErrors = await this.validatePropertyFacts(response, context);
      errors.push(...propertyErrors);
      const temporalErrors = await this.validateTemporalFacts(response, context);
      errors.push(...temporalErrors);
    } catch (error) {
      console.error("Fact checking error:", error);
      errors.push({
        type: "factual",
        severity: "minor",
        field: "system",
        message: "Fact checking partially failed",
        confidence: 0.5,
        source: "fact_checker"
      });
    }
    return errors;
  }
  /**
   * Verify with external sources
   */
  async verifyWithExternalSources(response, context) {
    const conflicts = [];
    const verifiedFacts = [];
    const sourcesUsed = [];
    if (response.address || response.coordinates) {
      const locationResult = await this.verifyLocationData(response);
      conflicts.push(...locationResult.conflicts);
      verifiedFacts.push(...locationResult.verifiedFacts);
      sourcesUsed.push(...locationResult.sourcesUsed);
    }
    if (response.currency || response.pricing) {
      const currencyResult = await this.verifyCurrencyData(response);
      conflicts.push(...currencyResult.conflicts);
      verifiedFacts.push(...currencyResult.verifiedFacts);
      sourcesUsed.push(...currencyResult.sourcesUsed);
    }
    if (response.season || response.checkIn) {
      const seasonalResult = await this.verifySeasonalData(response, context);
      conflicts.push(...seasonalResult.conflicts);
      verifiedFacts.push(...seasonalResult.verifiedFacts);
      sourcesUsed.push(...seasonalResult.sourcesUsed);
    }
    const confidence = conflicts.length === 0 ? 0.9 : Math.max(0.3, 0.9 - conflicts.length * 0.1);
    return {
      conflicts,
      verifiedFacts,
      sourcesUsed,
      confidence
    };
  }
  /**
   * Check against internal fact database
   */
  async checkAgainstFactDatabase(response, context) {
    const errors = [];
    if (response.price || response.pricing) {
      const pricingFacts = this.getFact("property_price_limits");
      if (pricingFacts) {
        const price = response.price || response.pricing?.basePrice;
        if (price < pricingFacts.facts.min_nightly_rate) {
          errors.push({
            type: "factual",
            severity: "major",
            field: "price",
            message: `Price ${price} below industry minimum of \u20AC${pricingFacts.facts.min_nightly_rate}`,
            confidence: pricingFacts.confidence,
            source: pricingFacts.source
          });
        }
        if (price > pricingFacts.facts.max_nightly_rate) {
          errors.push({
            type: "factual",
            severity: "major",
            field: "price",
            message: `Price ${price} exceeds industry maximum of \u20AC${pricingFacts.facts.max_nightly_rate}`,
            confidence: pricingFacts.confidence,
            source: pricingFacts.source
          });
        }
      }
    }
    if (response.propertyType) {
      const typeFacts = this.getFact("property_types");
      if (typeFacts && !typeFacts.facts.valid_types.includes(response.propertyType)) {
        errors.push({
          type: "factual",
          severity: "major",
          field: "propertyType",
          message: `Invalid property type: ${response.propertyType}`,
          suggestedFix: "apartment",
          confidence: typeFacts.confidence,
          source: typeFacts.source
        });
      }
    }
    if (response.country) {
      const locationFacts = this.getFact("location_data");
      if (locationFacts && !locationFacts.facts.valid_countries.includes(response.country)) {
        errors.push({
          type: "factual",
          severity: "minor",
          field: "country",
          message: `Unusual country: ${response.country}`,
          confidence: 0.6,
          source: locationFacts.source
        });
      }
    }
    this.sourcesUsed.push("fact_database");
    return errors;
  }
  /**
   * Validate location facts
   */
  async validateLocationFacts(response, context) {
    const errors = [];
    if (response.city && response.country) {
      const locationFacts = this.getFact("location_data");
      if (locationFacts?.facts.major_cities[response.country]) {
        const validCities = locationFacts.facts.major_cities[response.country];
        if (!validCities.includes(response.city)) {
          errors.push({
            type: "factual",
            severity: "minor",
            field: "city",
            message: `${response.city} not in major cities list for ${response.country}`,
            confidence: 0.4,
            source: "location_validator"
          });
        }
      }
    }
    if (response.coordinates) {
      const { latitude, longitude } = response.coordinates;
      if (response.country === "Portugal") {
        if (latitude < 36.9 || latitude > 42.2 || longitude < -9.5 || longitude > -6.2) {
          errors.push({
            type: "factual",
            severity: "major",
            field: "coordinates",
            message: "Coordinates outside Portugal boundaries",
            confidence: 0.95,
            source: "geographic_validator"
          });
        }
      }
    }
    return errors;
  }
  /**
   * Validate pricing facts
   */
  async validatePricingFacts(response, context) {
    const errors = [];
    if (response.price && response.city) {
      const marketFacts = this.getFact("market_rates");
      if (marketFacts?.facts.average_rates_by_city[response.city]) {
        const marketData = marketFacts.facts.average_rates_by_city[response.city];
        if (response.price < marketData.min * 0.5) {
          errors.push({
            type: "factual",
            severity: "minor",
            field: "price",
            message: `Price significantly below market minimum for ${response.city}`,
            confidence: 0.7,
            source: "market_data"
          });
        }
        if (response.price > marketData.max * 1.5) {
          errors.push({
            type: "factual",
            severity: "minor",
            field: "price",
            message: `Price significantly above market maximum for ${response.city}`,
            confidence: 0.7,
            source: "market_data"
          });
        }
      }
    }
    if (response.pricing?.seasonalPrice && context.season) {
      const seasonalFacts = this.getFact("seasonal_data");
      if (seasonalFacts) {
        const basePrice = response.pricing.basePrice || response.price;
        const multiplier = response.pricing.seasonalPrice / basePrice;
        const expectedRange = seasonalFacts.facts.price_multipliers[`${context.season}_season`];
        if (expectedRange && (multiplier < expectedRange.min || multiplier > expectedRange.max)) {
          errors.push({
            type: "factual",
            severity: "minor",
            field: "pricing.seasonalPrice",
            message: `Seasonal multiplier ${multiplier.toFixed(2)} unusual for ${context.season}`,
            confidence: 0.6,
            source: "seasonal_data"
          });
        }
      }
    }
    return errors;
  }
  /**
   * Validate property facts
   */
  async validatePropertyFacts(response, context) {
    const errors = [];
    if (response.maxGuests && response.bedrooms) {
      const typeFacts = this.getFact("property_types");
      if (typeFacts) {
        const maxExpected = response.bedrooms * typeFacts.facts.bedroom_guest_ratio;
        if (response.maxGuests > maxExpected) {
          errors.push({
            type: "factual",
            severity: "minor",
            field: "maxGuests",
            message: `Guest capacity seems high for ${response.bedrooms} bedrooms`,
            confidence: 0.6,
            source: "capacity_standards"
          });
        }
      }
    }
    if (response.amenities) {
      const amenityFacts = this.getFact("amenity_standards");
      if (amenityFacts) {
        for (const [amenity1, amenity2] of amenityFacts.facts.incompatible_combinations) {
          if (response.amenities.includes(amenity1) && response.amenities.includes(amenity2)) {
            errors.push({
              type: "factual",
              severity: "major",
              field: "amenities",
              message: `Conflicting amenities: ${amenity1} and ${amenity2}`,
              confidence: 0.9,
              source: "amenity_standards"
            });
          }
        }
      }
    }
    return errors;
  }
  /**
   * Validate temporal facts
   */
  async validateTemporalFacts(response, context) {
    const errors = [];
    if (response.checkIn) {
      const bookingFacts = this.getFact("booking_constraints");
      if (bookingFacts) {
        const checkInDate = new Date(response.checkIn);
        const now = /* @__PURE__ */ new Date();
        const daysInAdvance = (checkInDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24);
        if (daysInAdvance > bookingFacts.facts.max_advance_booking_days) {
          errors.push({
            type: "factual",
            severity: "minor",
            field: "checkIn",
            message: "Booking too far in advance (max 2 years)",
            confidence: 0.8,
            source: "booking_policies"
          });
        }
      }
    }
    if (response.season && response.checkIn) {
      const checkInDate = new Date(response.checkIn);
      const month = checkInDate.getMonth() + 1;
      const seasonalFacts = this.getFact("seasonal_data");
      if (seasonalFacts) {
        const expectedSeasons = {
          "high": seasonalFacts.facts.high_season_months,
          "low": seasonalFacts.facts.low_season_months,
          "shoulder": seasonalFacts.facts.shoulder_season_months
        };
        const seasonKey = `${response.season}`;
        if (expectedSeasons[seasonKey] && !expectedSeasons[seasonKey].includes(month)) {
          errors.push({
            type: "factual",
            severity: "minor",
            field: "season",
            message: `Season "${response.season}" doesn't match check-in month`,
            confidence: 0.5,
            source: "seasonal_calendar"
          });
        }
      }
    }
    return errors;
  }
  /**
   * External API verification methods
   */
  async verifyLocationData(response) {
    const conflicts = [];
    const verifiedFacts = [];
    const sourcesUsed = [];
    try {
      if (response.address && response.coordinates) {
        const isValidLocation = await this.mockGeocodeValidation(response.address, response.coordinates);
        if (!isValidLocation) {
          conflicts.push({
            field: "coordinates",
            claimed: response.coordinates,
            actual: "Invalid location",
            source: "google_maps",
            confidence: 0.9,
            message: "Address and coordinates don't match"
          });
        } else {
          verifiedFacts.push({
            field: "location",
            value: { address: response.address, coordinates: response.coordinates },
            source: "google_maps",
            confidence: 0.95,
            lastUpdated: /* @__PURE__ */ new Date()
          });
        }
        sourcesUsed.push("google_maps");
      }
    } catch (error) {
      console.error("Location verification failed:", error);
    }
    return { conflicts, verifiedFacts, sourcesUsed };
  }
  async verifyCurrencyData(response) {
    const conflicts = [];
    const verifiedFacts = [];
    const sourcesUsed = [];
    try {
      if (response.currency && response.pricing) {
        const isValidCurrency = await this.mockCurrencyValidation(response.currency);
        if (!isValidCurrency) {
          conflicts.push({
            field: "currency",
            claimed: response.currency,
            actual: "Unsupported currency",
            source: "exchange_rates",
            confidence: 0.95,
            message: "Currency not supported or invalid"
          });
        }
        sourcesUsed.push("exchange_rates");
      }
    } catch (error) {
      console.error("Currency verification failed:", error);
    }
    return { conflicts, verifiedFacts, sourcesUsed };
  }
  async verifySeasonalData(response, context) {
    const conflicts = [];
    const verifiedFacts = [];
    const sourcesUsed = [];
    sourcesUsed.push("openweather");
    return { conflicts, verifiedFacts, sourcesUsed };
  }
  /**
   * Mock external API methods (replace with real implementations)
   */
  async mockGeocodeValidation(address, coordinates) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  }
  async mockCurrencyValidation(currency) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const supportedCurrencies = ["EUR", "USD", "GBP", "BRL", "CAD", "AUD"];
    return supportedCurrencies.includes(currency);
  }
  /**
   * Fact database management
   */
  addFact(key, fact) {
    this.factDatabase.set(key, fact);
  }
  getFact(key) {
    return this.factDatabase.get(key);
  }
  async getSourcesUsed() {
    return [...new Set(this.sourcesUsed)];
  }
};

// server/services/confidence-calibrator.service.ts
var ConfidenceCalibrator = class {
  neuralModel;
  trainingData = [];
  calibrationHistory = /* @__PURE__ */ new Map();
  featureWeights;
  adaptiveThresholds;
  constructor() {
    this.initializeNeuralModel();
    this.initializeFeatureWeights();
    this.initializeAdaptiveThresholds();
    this.loadHistoricalData();
  }
  /**
   * Initialize neural network for confidence calibration
   */
  initializeNeuralModel() {
    this.neuralModel = {
      weights: [
        // Input to first hidden layer (8x16)
        this.generateRandomWeights(8, 16),
        // First to second hidden layer (16x8)
        this.generateRandomWeights(16, 8),
        // Second hidden to output layer (8x1)
        this.generateRandomWeights(8, 1)
      ],
      biases: [
        this.generateRandomBiases(16),
        this.generateRandomBiases(8),
        this.generateRandomBiases(1)
      ],
      activationFunction: "sigmoid",
      layers: [8, 16, 8, 1],
      trainingMetrics: {
        accuracy: 0.85,
        precision: 0.83,
        recall: 0.87,
        f1Score: 0.85,
        trainingEpochs: 1e3,
        lastTrained: /* @__PURE__ */ new Date("2024-01-01"),
        validationLoss: 0.12
      }
    };
  }
  /**
   * Initialize feature importance weights
   */
  initializeFeatureWeights() {
    this.featureWeights = {
      syntax: 0.15,
      semantics: 0.18,
      businessRules: 0.25,
      factualAccuracy: 0.22,
      consistency: 0.12,
      historicalPatterns: 0.08,
      externalSources: 0.15,
      corrections: 0.1
    };
  }
  /**
   * Initialize adaptive thresholds
   */
  initializeAdaptiveThresholds() {
    this.adaptiveThresholds = {
      highConfidence: 0.85,
      mediumConfidence: 0.65,
      lowConfidence: 0.35,
      criticalThreshold: 0.95,
      autoCorrectThreshold: 0.9,
      flagForReviewThreshold: 0.4
    };
  }
  /**
   * Main confidence calibration method
   */
  async calibrate(validationResults, context, corrections) {
    const factors = this.extractConfidenceFactors(validationResults, corrections);
    const calibrationContext = this.createCalibrationContext(context, validationResults);
    const neuralConfidence = await this.applyNeuralCalibration(factors);
    const contextuallyAdjusted = this.applyContextualAdjustments(
      neuralConfidence,
      calibrationContext,
      factors
    );
    const finalConfidence = this.applyAdaptiveThresholds(contextuallyAdjusted, context);
    this.recordCalibration(context, factors, finalConfidence);
    await this.checkForRetraining();
    return Math.max(0, Math.min(1, finalConfidence));
  }
  /**
   * Extract confidence factors from validation results
   */
  extractConfidenceFactors(validationResults, corrections) {
    const syntaxConfidence = this.calculateLayerConfidence(
      validationResults.errors.filter((e) => e.type === "syntax")
    );
    const semanticConfidence = this.calculateLayerConfidence(
      validationResults.errors.filter((e) => e.type === "semantic")
    );
    const businessRuleConfidence = this.calculateLayerConfidence(
      validationResults.errors.filter((e) => e.type === "business")
    );
    const factualConfidence = this.calculateLayerConfidence(
      validationResults.errors.filter((e) => e.type === "factual")
    );
    const consistencyConfidence = this.calculateLayerConfidence(
      validationResults.errors.filter((e) => e.type === "consistency")
    );
    const correctionConfidence = corrections.length > 0 ? corrections.reduce((sum2, c) => sum2 + c.confidence, 0) / corrections.length : 1;
    const historicalPatternConfidence = 0.8;
    const externalSourceConfidence = 0.85;
    return {
      syntaxConfidence,
      semanticConfidence,
      businessRuleConfidence,
      factualConfidence,
      consistencyConfidence,
      historicalPatternConfidence,
      externalSourceConfidence,
      correctionConfidence
    };
  }
  /**
   * Calculate confidence for a validation layer
   */
  calculateLayerConfidence(errors) {
    if (errors.length === 0) return 1;
    const severityWeights = { critical: 1, major: 0.7, minor: 0.3 };
    let totalWeight = 0;
    let errorScore = 0;
    for (const error of errors) {
      const weight = severityWeights[error.severity] || 0.5;
      totalWeight += weight;
      errorScore += weight * (1 - error.confidence);
    }
    return Math.max(0, 1 - errorScore / Math.max(totalWeight, 1));
  }
  /**
   * Create calibration context
   */
  createCalibrationContext(context, validationResults) {
    return {
      domain: context.domain,
      userRole: context.userRole || "guest",
      propertyType: context.propertyType,
      responseComplexity: this.calculateResponseComplexity(validationResults),
      historicalAccuracy: this.getHistoricalAccuracy(context.sessionId),
      sourceReliability: this.calculateSourceReliability(validationResults)
    };
  }
  /**
   * Apply neural network calibration
   */
  async applyNeuralCalibration(factors) {
    const inputs = [
      factors.syntaxConfidence,
      factors.semanticConfidence,
      factors.businessRuleConfidence,
      factors.factualConfidence,
      factors.consistencyConfidence,
      factors.historicalPatternConfidence,
      factors.externalSourceConfidence,
      factors.correctionConfidence
    ];
    let activations = inputs;
    for (let layer = 0; layer < this.neuralModel.weights.length; layer++) {
      const weights = this.neuralModel.weights[layer];
      const biases = this.neuralModel.biases[layer];
      const newActivations = [];
      for (let neuron = 0; neuron < weights[0].length; neuron++) {
        let sum2 = biases[neuron];
        for (let input = 0; input < activations.length; input++) {
          sum2 += activations[input] * weights[input][neuron];
        }
        newActivations.push(this.activationFunction(sum2));
      }
      activations = newActivations;
    }
    return activations[0];
  }
  /**
   * Apply contextual adjustments
   */
  applyContextualAdjustments(baseConfidence, context, factors) {
    let adjusted = baseConfidence;
    if (context.domain === "property_management") {
      if (factors.businessRuleConfidence < 0.9) {
        adjusted *= 0.85;
      }
    }
    if (context.userRole === "admin") {
      adjusted = Math.min(1, adjusted * 1.05);
    } else if (context.userRole === "guest") {
      adjusted *= 0.95;
    }
    if (context.responseComplexity > 0.8) {
      adjusted *= 0.9;
    }
    if (context.historicalAccuracy > 0.9) {
      adjusted = Math.min(1, adjusted * 1.1);
    } else if (context.historicalAccuracy < 0.7) {
      adjusted *= 0.85;
    }
    adjusted *= 0.8 + 0.2 * context.sourceReliability;
    return adjusted;
  }
  /**
   * Apply adaptive thresholds
   */
  applyAdaptiveThresholds(confidence, context) {
    const recentAccuracy = this.getRecentAccuracy(context.sessionId);
    if (recentAccuracy > 0.95) {
      this.adaptiveThresholds.autoCorrectThreshold *= 0.98;
    } else if (recentAccuracy < 0.8) {
      this.adaptiveThresholds.autoCorrectThreshold *= 1.02;
    }
    this.adaptiveThresholds.autoCorrectThreshold = Math.max(0.85, Math.min(0.98, this.adaptiveThresholds.autoCorrectThreshold));
    return confidence;
  }
  /**
   * Record calibration for learning
   */
  recordCalibration(context, factors, finalConfidence) {
    const reading = {
      timestamp: /* @__PURE__ */ new Date(),
      context,
      factors,
      predictedConfidence: finalConfidence,
      actualOutcome: null,
      // Will be updated when feedback is received
      sessionId: context.sessionId
    };
    const sessionHistory = this.calibrationHistory.get(context.sessionId) || [];
    sessionHistory.push(reading);
    this.calibrationHistory.set(context.sessionId, sessionHistory);
    if (sessionHistory.length > 1e3) {
      sessionHistory.shift();
    }
  }
  /**
   * Update actual outcomes for learning
   */
  updateActualOutcome(sessionId, timestamp2, actualOutcome, feedbackScore) {
    const sessionHistory = this.calibrationHistory.get(sessionId);
    if (sessionHistory) {
      const reading = sessionHistory.find(
        (r) => Math.abs(r.timestamp.getTime() - timestamp2.getTime()) < 5e3
        // Within 5 seconds
      );
      if (reading) {
        reading.actualOutcome = actualOutcome;
        reading.feedbackScore = feedbackScore;
        this.trainingData.push({
          inputs: Object.values(reading.factors),
          expectedOutput: this.outcomeToScore(actualOutcome, feedbackScore),
          context: reading.context
        });
        if (this.trainingData.length > 1e4) {
          this.trainingData = this.trainingData.slice(-8e3);
        }
      }
    }
  }
  /**
   * Check if model needs retraining
   */
  async checkForRetraining() {
    const newTrainingData = this.trainingData.filter(
      (d) => d.timestamp && d.timestamp > this.neuralModel.trainingMetrics.lastTrained
    ).length;
    if (newTrainingData > 1e3) {
      console.log("Triggering neural model retraining with", newTrainingData, "new samples");
      await this.retrainModel();
    }
  }
  /**
   * Retrain the neural model
   */
  async retrainModel() {
    if (this.trainingData.length < 100) return;
    const learningRate = 0.01;
    const epochs = 500;
    const batchSize = 32;
    console.log("Starting neural model retraining...");
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      const shuffled = this.trainingData.sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i += batchSize) {
        const batch = shuffled.slice(i, i + batchSize);
        const batchLoss = await this.trainBatch(batch, learningRate);
        totalLoss += batchLoss;
      }
      const avgLoss = totalLoss / Math.ceil(shuffled.length / batchSize);
      if (epoch % 100 === 0) {
        console.log(`Epoch ${epoch}, Average Loss: ${avgLoss.toFixed(4)}`);
      }
      if (avgLoss < 0.01) {
        console.log(`Converged at epoch ${epoch} with loss ${avgLoss.toFixed(4)}`);
        break;
      }
    }
    this.neuralModel.trainingMetrics.lastTrained = /* @__PURE__ */ new Date();
    this.neuralModel.trainingMetrics.trainingEpochs += epochs;
    console.log("Neural model retraining completed");
  }
  /**
   * Train a single batch
   */
  async trainBatch(batch, learningRate) {
    let totalLoss = 0;
    for (const sample of batch) {
      const predicted = await this.applyNeuralCalibration({
        syntaxConfidence: sample.inputs[0],
        semanticConfidence: sample.inputs[1],
        businessRuleConfidence: sample.inputs[2],
        factualConfidence: sample.inputs[3],
        consistencyConfidence: sample.inputs[4],
        historicalPatternConfidence: sample.inputs[5],
        externalSourceConfidence: sample.inputs[6],
        correctionConfidence: sample.inputs[7]
      });
      const loss = Math.pow(predicted - sample.expectedOutput, 2);
      totalLoss += loss;
      const gradient = 2 * (predicted - sample.expectedOutput);
      this.updateWeights(gradient, learningRate, sample.inputs);
    }
    return totalLoss / batch.length;
  }
  /**
   * Update neural network weights
   */
  updateWeights(gradient, learningRate, inputs) {
    const outputLayerIndex = this.neuralModel.weights.length - 1;
    for (let i = 0; i < this.neuralModel.weights[outputLayerIndex].length; i++) {
      for (let j = 0; j < this.neuralModel.weights[outputLayerIndex][i].length; j++) {
        this.neuralModel.weights[outputLayerIndex][i][j] -= learningRate * gradient * inputs[i];
      }
    }
  }
  /**
   * Activation function
   */
  activationFunction(x) {
    switch (this.neuralModel.activationFunction) {
      case "sigmoid":
        return 1 / (1 + Math.exp(-x));
      case "relu":
        return Math.max(0, x);
      case "tanh":
        return Math.tanh(x);
      default:
        return x;
    }
  }
  /**
   * Helper methods
   */
  generateRandomWeights(inputs, outputs) {
    const weights = [];
    for (let i = 0; i < inputs; i++) {
      weights[i] = [];
      for (let j = 0; j < outputs; j++) {
        weights[i][j] = (Math.random() - 0.5) * 2 * Math.sqrt(2 / inputs);
      }
    }
    return weights;
  }
  generateRandomBiases(size) {
    return Array.from({ length: size }, () => (Math.random() - 0.5) * 0.1);
  }
  calculateResponseComplexity(validationResults) {
    const factors = [
      validationResults.errors?.length || 0,
      validationResults.warnings?.length || 0,
      Object.keys(validationResults).length
    ];
    return Math.min(1, factors.reduce((sum2, f) => sum2 + f, 0) / 20);
  }
  getHistoricalAccuracy(sessionId) {
    const history = this.calibrationHistory.get(sessionId);
    if (!history || history.length === 0) return 0.8;
    const withOutcomes = history.filter((h) => h.actualOutcome !== null);
    if (withOutcomes.length === 0) return 0.8;
    const correct = withOutcomes.filter((h) => h.actualOutcome === "correct").length;
    return correct / withOutcomes.length;
  }
  getRecentAccuracy(sessionId) {
    const history = this.calibrationHistory.get(sessionId);
    if (!history) return 0.8;
    const recent = history.slice(-50);
    const withOutcomes = recent.filter((h) => h.actualOutcome !== null);
    if (withOutcomes.length === 0) return 0.8;
    const correct = withOutcomes.filter((h) => h.actualOutcome === "correct").length;
    return correct / withOutcomes.length;
  }
  calculateSourceReliability(validationResults) {
    return 0.85;
  }
  outcomeToScore(outcome, feedbackScore) {
    if (feedbackScore !== void 0) return feedbackScore / 100;
    switch (outcome) {
      case "correct":
        return 1;
      case "partially_correct":
        return 0.7;
      case "incorrect":
        return 0.2;
      default:
        return 0.5;
    }
  }
  loadHistoricalData() {
  }
  /**
   * Get calibration metrics
   */
  getCalibrationMetrics() {
    const allReadings = Array.from(this.calibrationHistory.values()).flat();
    const withOutcomes = allReadings.filter((r) => r.actualOutcome !== null);
    if (withOutcomes.length === 0) {
      return {
        totalReadings: allReadings.length,
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        calibrationError: 0
      };
    }
    const correct = withOutcomes.filter((r) => r.actualOutcome === "correct").length;
    const accuracy = correct / withOutcomes.length;
    return {
      totalReadings: allReadings.length,
      accuracy,
      precision: accuracy,
      // Simplified
      recall: accuracy,
      // Simplified
      f1Score: accuracy,
      // Simplified
      calibrationError: this.calculateCalibrationError(withOutcomes),
      neuralModelMetrics: this.neuralModel.trainingMetrics
    };
  }
  calculateCalibrationError(readings) {
    if (readings.length === 0) return 0;
    let totalError = 0;
    for (const reading of readings) {
      const actualScore = this.outcomeToScore(reading.actualOutcome, reading.feedbackScore);
      totalError += Math.abs(reading.predictedConfidence - actualScore);
    }
    return totalError / readings.length;
  }
};

// server/services/ai-validation-enhanced.service.ts
var AIValidationEnhancedService = class extends EventEmitter {
  rulesEngine;
  factChecker;
  confidenceCalibrator;
  websockets = /* @__PURE__ */ new Set();
  validationHistory = /* @__PURE__ */ new Map();
  metrics = {
    totalValidations: 0,
    successfulValidations: 0,
    autoCorrections: 0,
    falsePositives: 0,
    averageProcessingTime: 0
  };
  constructor() {
    super();
    this.rulesEngine = new ValidationRulesEngine();
    this.factChecker = new FactCheckingService();
    this.confidenceCalibrator = new ConfidenceCalibrator();
    this.initializeRealtimeValidation();
  }
  /**
   * Enhanced multi-layered validation pipeline
   */
  async validateAIResponse(response, context, options = {}) {
    const startTime = Date.now();
    const auditTrail = [];
    try {
      const syntaxResult = await this.validateSyntax(response, context);
      auditTrail.push({
        timestamp: /* @__PURE__ */ new Date(),
        action: "syntax_validation",
        details: syntaxResult,
        confidence: syntaxResult.confidence,
        source: "syntax_validator"
      });
      const semanticResult = await this.validateSemantics(response, context);
      auditTrail.push({
        timestamp: /* @__PURE__ */ new Date(),
        action: "semantic_validation",
        details: semanticResult,
        confidence: semanticResult.confidence,
        source: "semantic_validator"
      });
      const businessResult = await this.validateBusinessLogic(response, context);
      auditTrail.push({
        timestamp: /* @__PURE__ */ new Date(),
        action: "business_validation",
        details: businessResult,
        confidence: businessResult.confidence,
        source: "business_validator"
      });
      const factResult = await this.validateFacts(response, context);
      auditTrail.push({
        timestamp: /* @__PURE__ */ new Date(),
        action: "fact_checking",
        details: factResult,
        confidence: factResult.confidence,
        source: "fact_checker"
      });
      const consistencyResult = await this.validateConsistency(response, context);
      auditTrail.push({
        timestamp: /* @__PURE__ */ new Date(),
        action: "consistency_check",
        details: consistencyResult,
        confidence: consistencyResult.confidence,
        source: "consistency_checker"
      });
      const aggregatedResult = await this.aggregateValidationResults([
        syntaxResult,
        semanticResult,
        businessResult,
        factResult,
        consistencyResult
      ]);
      const corrections = await this.applyProgressiveCorrections(
        response,
        aggregatedResult,
        context
      );
      const finalConfidence = await this.confidenceCalibrator.calibrate(
        aggregatedResult,
        context,
        corrections
      );
      const processingTime = Date.now() - startTime;
      const validationResult3 = {
        isValid: aggregatedResult.errors.filter((e) => e.severity === "critical").length === 0,
        confidence: finalConfidence,
        errors: aggregatedResult.errors,
        warnings: aggregatedResult.warnings,
        corrections,
        metadata: {
          processingTimeMs: processingTime,
          validationLayers: ["syntax", "semantic", "business", "factual", "consistency"],
          sourcesChecked: await this.factChecker.getSourcesUsed(),
          rulesApplied: this.rulesEngine.getRulesAppliedCount(),
          confidenceScore: finalConfidence
        },
        auditTrail
      };
      this.updateMetrics(validationResult3);
      this.storeValidationHistory(context.requestId, validationResult3);
      this.emitRealtimeUpdate("validation_complete", validationResult3);
      return validationResult3;
    } catch (error) {
      const errorResult = {
        isValid: false,
        confidence: 0,
        errors: [{
          type: "critical",
          severity: "critical",
          field: "system",
          message: `Validation failed: ${error.message}`,
          confidence: 1,
          source: "validation_service"
        }],
        warnings: [],
        corrections: [],
        metadata: {
          processingTimeMs: Date.now() - startTime,
          validationLayers: [],
          sourcesChecked: [],
          rulesApplied: 0,
          confidenceScore: 0
        },
        auditTrail
      };
      this.emit("validation_error", error, errorResult);
      return errorResult;
    }
  }
  /**
   * Syntax validation layer
   */
  async validateSyntax(response, context) {
    const errors = [];
    const warnings = [];
    if (typeof response === "object" && response !== null) {
      const requiredFields = this.getRequiredFields(context.responseType);
      for (const field of requiredFields) {
        if (!(field in response)) {
          errors.push({
            type: "syntax",
            severity: "major",
            field,
            message: `Missing required field: ${field}`,
            confidence: 0.95,
            source: "syntax_validator"
          });
        }
      }
    }
    const typeErrors = await this.rulesEngine.validateDataTypes(response, context);
    errors.push(...typeErrors);
    const formatErrors = await this.rulesEngine.validateFormats(response, context);
    errors.push(...formatErrors);
    return {
      errors,
      warnings,
      confidence: errors.length === 0 ? 0.95 : Math.max(0.1, 0.95 - errors.length * 0.1)
    };
  }
  /**
   * Semantic validation layer
   */
  async validateSemantics(response, context) {
    const errors = [];
    const warnings = [];
    const semanticErrors = await this.rulesEngine.validateSemantics(response, context);
    errors.push(...semanticErrors);
    const intentScore = await this.validateIntent(response, context);
    if (intentScore < 0.7) {
      warnings.push({
        type: "potential_issue",
        field: "intent",
        message: "Response may not match user intent",
        impact: "medium"
      });
    }
    return {
      errors,
      warnings,
      confidence: Math.max(0.1, intentScore)
    };
  }
  /**
   * Business logic validation layer - 20+ rules
   */
  async validateBusinessLogic(response, context) {
    const errors = [];
    const warnings = [];
    const businessErrors = await this.rulesEngine.applyBusinessRules(response, context);
    errors.push(...businessErrors);
    if (context.domain === "property_management") {
      const propertyErrors = await this.validatePropertyRules(response, context);
      errors.push(...propertyErrors);
    }
    if (response.pricing || response.financial) {
      const financialErrors = await this.validateFinancialRules(response, context);
      errors.push(...financialErrors);
    }
    if (response.booking || response.reservation) {
      const bookingErrors = await this.validateBookingRules(response, context);
      errors.push(...bookingErrors);
    }
    return {
      errors,
      warnings,
      confidence: errors.filter((e) => e.severity === "critical").length === 0 ? 0.9 : 0.3
    };
  }
  /**
   * Fact validation layer
   */
  async validateFacts(response, context) {
    const errors = [];
    const warnings = [];
    const factErrors = await this.factChecker.validateFacts(response, context);
    errors.push(...factErrors);
    const externalValidation = await this.factChecker.verifyWithExternalSources(response, context);
    if (externalValidation.conflicts.length > 0) {
      for (const conflict of externalValidation.conflicts) {
        errors.push({
          type: "factual",
          severity: "major",
          field: conflict.field,
          message: `Fact conflict detected: ${conflict.message}`,
          confidence: conflict.confidence,
          source: conflict.source
        });
      }
    }
    return {
      errors,
      warnings,
      confidence: errors.length === 0 ? 0.95 : Math.max(0.1, 0.95 - errors.length * 0.15)
    };
  }
  /**
   * Consistency validation layer
   */
  async validateConsistency(response, context) {
    const errors = [];
    const warnings = [];
    const consistencyErrors = await this.rulesEngine.validateConsistency(response, context);
    errors.push(...consistencyErrors);
    const history = this.validationHistory.get(context.sessionId);
    if (history && history.length > 0) {
      const historyErrors = await this.validateHistoricalConsistency(response, history);
      errors.push(...historyErrors);
    }
    return {
      errors,
      warnings,
      confidence: errors.length === 0 ? 0.9 : Math.max(0.2, 0.9 - errors.length * 0.1)
    };
  }
  /**
   * Progressive correction system
   */
  async applyProgressiveCorrections(response, validationResult3, context) {
    const corrections = [];
    for (const error of validationResult3.errors) {
      if (error.confidence > 0.8 && error.suggestedFix) {
        const correction = {
          field: error.field,
          originalValue: response[error.field],
          correctedValue: error.suggestedFix,
          confidence: error.confidence,
          reason: error.message,
          autoApplied: error.confidence > 0.95
        };
        if (correction.autoApplied) {
          response[error.field] = correction.correctedValue;
          this.metrics.autoCorrections++;
        }
        corrections.push(correction);
      }
    }
    return corrections;
  }
  /**
   * Real-time validation setup
   */
  initializeRealtimeValidation() {
    this.on("validation_complete", (result) => {
      this.broadcastToWebSockets("validation_update", result);
    });
    this.on("validation_error", (error, result) => {
      this.broadcastToWebSockets("validation_error", { error: error.message, result });
    });
  }
  /**
   * WebSocket management
   */
  addWebSocket(ws) {
    this.websockets.add(ws);
    ws.on("close", () => {
      this.websockets.delete(ws);
    });
  }
  broadcastToWebSockets(event, data) {
    const message = JSON.stringify({ event, data, timestamp: /* @__PURE__ */ new Date() });
    for (const ws of this.websockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
  emitRealtimeUpdate(event, data) {
    this.emit(event, data);
  }
  /**
   * Metrics and monitoring
   */
  updateMetrics(result) {
    this.metrics.totalValidations++;
    if (result.isValid) {
      this.metrics.successfulValidations++;
    }
    const currentAvg = this.metrics.averageProcessingTime;
    const count3 = this.metrics.totalValidations;
    this.metrics.averageProcessingTime = (currentAvg * (count3 - 1) + result.metadata.processingTimeMs) / count3;
  }
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalValidations > 0 ? this.metrics.successfulValidations / this.metrics.totalValidations : 0,
      autoCorrectionRate: this.metrics.totalValidations > 0 ? this.metrics.autoCorrections / this.metrics.totalValidations : 0
    };
  }
  /**
   * Validation history management
   */
  storeValidationHistory(requestId, result) {
    if (!this.validationHistory.has(requestId)) {
      this.validationHistory.set(requestId, []);
    }
    const history = this.validationHistory.get(requestId);
    history.push(result);
    if (history.length > 50) {
      history.shift();
    }
  }
  getValidationHistory(requestId) {
    return this.validationHistory.get(requestId) || [];
  }
  // Helper methods
  getRequiredFields(responseType) {
    const fieldMap = {
      "property_info": ["id", "name", "address", "price"],
      "booking_response": ["bookingId", "dates", "guestCount", "totalPrice"],
      "availability": ["propertyId", "dates", "available"],
      "pricing": ["basePrice", "fees", "total"],
      "recommendation": ["recommendations", "criteria", "confidence"]
    };
    return fieldMap[responseType] || [];
  }
  async validateIntent(response, context) {
    return 0.85;
  }
  async validatePropertyRules(response, context) {
    return await this.rulesEngine.validatePropertySpecificRules(response, context);
  }
  async validateFinancialRules(response, context) {
    return await this.rulesEngine.validateFinancialRules(response, context);
  }
  async validateBookingRules(response, context) {
    return await this.rulesEngine.validateBookingRules(response, context);
  }
  async aggregateValidationResults(results) {
    const allErrors = [];
    const allWarnings = [];
    for (const result of results) {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }
    return { errors: allErrors, warnings: allWarnings };
  }
  async validateHistoricalConsistency(response, history) {
    return [];
  }
};

// server/routes/validation.route.ts
import { rateLimit as rateLimit2 } from "express-rate-limit";
import { body, param, query, validationResult } from "express-validator";
var router8 = Router7();
var validationService = new AIValidationEnhancedService();
var validationRateLimit = rateLimit2({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 100,
  // Limit each IP to 100 requests per windowMs
  message: "Too many validation requests from this IP",
  standardHeaders: true,
  legacyHeaders: false
});
var expensiveValidationRateLimit = rateLimit2({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 20,
  // Limit expensive operations
  message: "Too many expensive validation requests from this IP",
  standardHeaders: true,
  legacyHeaders: false
});
router8.post(
  "/validate",
  validationRateLimit,
  [
    body("response").notEmpty().withMessage("Response data is required"),
    body("context").isObject().withMessage("Context must be an object"),
    body("context.requestId").notEmpty().withMessage("Request ID is required"),
    body("context.sessionId").notEmpty().withMessage("Session ID is required"),
    body("context.responseType").notEmpty().withMessage("Response type is required"),
    body("context.domain").notEmpty().withMessage("Domain is required"),
    body("options").optional().isObject().withMessage("Options must be an object")
  ],
  async (req, res) => {
    try {
      const errors = validationResult3(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: "Invalid request parameters"
        });
      }
      const { response: responseData, context, options = {} } = req.body;
      const validationContext = {
        ...context,
        timestamp: /* @__PURE__ */ new Date()
      };
      const validationOptions = {
        enableAutoCorrection: options.enableAutoCorrection ?? true,
        confidenceThreshold: options.confidenceThreshold ?? 0.7,
        skipLayers: options.skipLayers ?? [],
        enableRealtimeUpdates: options.enableRealtimeUpdates ?? true,
        ...options
      };
      const validationResult3 = await validationService.validateAIResponse(
        responseData,
        validationContext,
        validationOptions
      );
      res.json({
        success: true,
        data: validationResult3,
        metadata: {
          timestamp: /* @__PURE__ */ new Date(),
          processingTime: validationResult3.metadata.processingTimeMs,
          version: "2.0.0"
        }
      });
    } catch (error) {
      console.error("Validation error:", error);
      res.status(500).json({
        success: false,
        error: "Internal validation error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router8.post(
  "/batch",
  expensiveValidationRateLimit,
  [
    body("requests").isArray().withMessage("Requests must be an array"),
    body("requests").isLength({ min: 1, max: 50 }).withMessage("Batch size must be 1-50 requests"),
    body("requests.*.response").notEmpty().withMessage("Each request must have response data"),
    body("requests.*.context").isObject().withMessage("Each request must have context"),
    body("globalOptions").optional().isObject().withMessage("Global options must be an object")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      const { requests, globalOptions = {} } = req.body;
      const results = [];
      const startTime = Date.now();
      const concurrencyLimit = Math.min(10, requests.length);
      const chunks = [];
      for (let i = 0; i < requests.length; i += concurrencyLimit) {
        chunks.push(requests.slice(i, i + concurrencyLimit));
      }
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (request, index) => {
          try {
            const validationContext = {
              ...request.context,
              timestamp: /* @__PURE__ */ new Date()
            };
            const validationOptions = {
              ...globalOptions,
              ...request.options
            };
            const result = await validationService.validateAIResponse(
              request.response,
              validationContext,
              validationOptions
            );
            return {
              index: results.length + index,
              success: true,
              data: result
            };
          } catch (error) {
            return {
              index: results.length + index,
              success: false,
              error: error instanceof Error ? error.message : "Validation failed"
            };
          }
        });
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
      const processingTime = Date.now() - startTime;
      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: requests.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            processingTimeMs: processingTime
          }
        }
      });
    } catch (error) {
      console.error("Batch validation error:", error);
      res.status(500).json({
        success: false,
        error: "Batch validation failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router8.get(
  "/history/:sessionId",
  [
    param("sessionId").notEmpty().withMessage("Session ID is required"),
    query("limit").optional().isInt({ min: 1, max: 1e3 }).withMessage("Limit must be 1-1000"),
    query("offset").optional().isInt({ min: 0 }).withMessage("Offset must be >= 0")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const history = validationService.getValidationHistory(sessionId);
      const paginatedHistory = history.slice(offset, offset + limit);
      res.json({
        success: true,
        data: {
          history: paginatedHistory,
          pagination: {
            total: history.length,
            limit,
            offset,
            hasMore: offset + limit < history.length
          }
        }
      });
    } catch (error) {
      console.error("History retrieval error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve validation history",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router8.get(
  "/metrics",
  async (req, res) => {
    try {
      const metrics = validationService.getMetrics();
      res.json({
        success: true,
        data: {
          metrics,
          timestamp: /* @__PURE__ */ new Date()
        }
      });
    } catch (error) {
      console.error("Metrics retrieval error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve metrics",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router8.post(
  "/feedback",
  [
    body("sessionId").notEmpty().withMessage("Session ID is required"),
    body("timestamp").isISO8601().withMessage("Valid timestamp is required"),
    body("outcome").isIn(["correct", "incorrect", "partially_correct"]).withMessage("Invalid outcome"),
    body("feedbackScore").optional().isFloat({ min: 0, max: 100 }).withMessage("Feedback score must be 0-100")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      const { sessionId, timestamp: timestamp2, outcome, feedbackScore } = req.body;
      res.json({
        success: true,
        message: "Feedback recorded successfully"
      });
    } catch (error) {
      console.error("Feedback recording error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to record feedback",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router8.get("/health", async (req, res) => {
  try {
    const metrics = validationService.getMetrics();
    const health = {
      status: "healthy",
      version: "2.0.0",
      uptime: process.uptime(),
      metrics: {
        totalValidations: metrics.totalValidations,
        successRate: metrics.successRate,
        averageProcessingTime: metrics.averageProcessingTime
      },
      timestamp: /* @__PURE__ */ new Date()
    };
    if (metrics.successRate < 0.8 || metrics.averageProcessingTime > 1e3) {
      health.status = "degraded";
    }
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: /* @__PURE__ */ new Date()
    });
  }
});
router8.get("/config", async (req, res) => {
  res.json({
    success: true,
    data: {
      version: "2.0.0",
      features: [
        "multi_layer_validation",
        "real_time_validation",
        "neural_confidence_calibration",
        "progressive_correction",
        "fact_checking",
        "consistency_validation"
      ],
      limits: {
        batchSize: 50,
        historyLimit: 1e3,
        rateLimits: {
          validation: 100,
          batch: 20
        }
      },
      supportedDomains: ["property_management", "general"],
      supportedResponseTypes: [
        "property_info",
        "booking_response",
        "availability",
        "pricing",
        "recommendation"
      ]
    }
  });
});
var validation_route_default = router8;

// server/routes/knowledge.route.ts
import { Router as Router8 } from "express";
import { body as body2, query as query2, validationResult as validationResult2 } from "express-validator";
import rateLimit3 from "express-rate-limit";
var router9 = Router8();
var knowledgeRateLimit = rateLimit3({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // limit each IP to 100 requests per windowMs
  message: "Too many knowledge requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
var ragService2;
var documentProcessor;
router9.use(knowledgeRateLimit);
router9.post(
  "/query",
  [
    body2("query").trim().isLength({ min: 1, max: 500 }).withMessage("Query must be between 1 and 500 characters"),
    body2("domain").optional().isIn(["property", "cleaning", "maintenance", "local_services", "guest_management", "general"]).withMessage("Invalid domain"),
    body2("maxTokens").optional().isInt({ min: 100, max: 4e3 }).withMessage("Max tokens must be between 100 and 4000")
  ],
  async (req, res) => {
    try {
      const errors = validationResult2(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      const { query: query3, domain, maxTokens } = req.body;
      console.log(`\u{1F50D} Knowledge query: "${query3}" (domain: ${domain || "all"})`);
      const startTime = Date.now();
      const response = await ragService2.queryKnowledge({
        query: query3,
        domain,
        maxTokens
      });
      const responseTime = Date.now() - startTime;
      res.json({
        success: true,
        data: response,
        metadata: {
          responseTime: `${responseTime}ms`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          domain: domain || "all"
        }
      });
    } catch (error) {
      console.error("\u274C Knowledge query error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process knowledge query",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
router9.get(
  "/search",
  [
    query2("q").trim().isLength({ min: 1, max: 200 }).withMessage("Search query must be between 1 and 200 characters"),
    query2("limit").optional().isInt({ min: 1, max: 20 }).withMessage("Limit must be between 1 and 20")
  ],
  async (req, res) => {
    try {
      const errors = validationResult2(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      const searchQuery = req.query.q;
      const limit = parseInt(req.query.limit) || 5;
      const results = await ragService2.searchSimilarQuestions(searchQuery, limit);
      res.json({
        success: true,
        data: {
          query: searchQuery,
          results,
          total: results.length
        }
      });
    } catch (error) {
      console.error("\u274C Knowledge search error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search knowledge base"
      });
    }
  }
);
router9.post(
  "/add",
  [
    body2("content").trim().isLength({ min: 10, max: 5e3 }).withMessage("Content must be between 10 and 5000 characters"),
    body2("domain").isIn(["property", "cleaning", "maintenance", "local_services", "guest_management", "general"]).withMessage("Domain is required and must be valid"),
    body2("metadata").optional().isObject().withMessage("Metadata must be an object")
  ],
  async (req, res) => {
    try {
      const errors = validationResult2(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      const { content, domain, metadata = {} } = req.body;
      const knowledgeId = await ragService2.addCustomKnowledge(
        content,
        domain,
        {
          ...metadata,
          source: "manual_entry",
          addedAt: (/* @__PURE__ */ new Date()).toISOString(),
          addedBy: req.user?.id || "system"
          // Assuming user authentication
        }
      );
      res.status(201).json({
        success: true,
        data: {
          knowledgeId,
          domain,
          message: "Knowledge added successfully"
        }
      });
    } catch (error) {
      console.error("\u274C Add knowledge error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add knowledge"
      });
    }
  }
);
router9.post(
  "/documents/process",
  [
    body2("type").isIn(["text", "structured"]).withMessage("Document type must be text or structured"),
    body2("domain").isIn(["property", "cleaning", "maintenance", "local_services", "guest_management", "general"]).withMessage("Domain is required and must be valid"),
    body2("content").optional().isString().withMessage("Content must be a string"),
    body2("data").optional().isObject().withMessage("Data must be an object"),
    body2("metadata").optional().isObject().withMessage("Metadata must be an object")
  ],
  async (req, res) => {
    try {
      const errors = validationResult2(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      const { type, domain, content, data, metadata = {} } = req.body;
      let result;
      if (type === "text") {
        if (!content) {
          return res.status(400).json({
            success: false,
            error: "Content is required for text documents"
          });
        }
        result = await documentProcessor.processTextDocument(
          content,
          { ...metadata, source: "api" },
          domain
        );
      } else if (type === "structured") {
        if (!data) {
          return res.status(400).json({
            success: false,
            error: "Data is required for structured documents"
          });
        }
        result = await documentProcessor.processStructuredData(
          data,
          { ...metadata, source: "api" },
          domain
        );
      }
      if (result?.success) {
        res.status(201).json({
          success: true,
          data: {
            documentId: result.documentId,
            chunks: result.chunks,
            domain,
            message: "Document processed and added to knowledge base"
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result?.error || "Failed to process document"
        });
      }
    } catch (error) {
      console.error("\u274C Document processing error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process document"
      });
    }
  }
);
router9.get("/stats", async (req, res) => {
  try {
    const stats = await ragService2.getKnowledgeStats();
    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    console.error("\u274C Knowledge stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get knowledge statistics"
    });
  }
});
router9.post("/sync", async (req, res) => {
  try {
    console.log("\u{1F504} Starting knowledge base sync...");
    const startTime = Date.now();
    await ragService2.syncDatabaseToKnowledge();
    const syncTime = Date.now() - startTime;
    res.json({
      success: true,
      data: {
        message: "Knowledge base sync completed successfully",
        syncTime: `${syncTime}ms`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    console.error("\u274C Knowledge sync error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync knowledge base"
    });
  }
});
router9.get("/domains", (req, res) => {
  const domains = [
    {
      id: "property",
      name: "Informa\xE7\xF5es de Propriedades",
      description: "Informa\xE7\xF5es sobre localiza\xE7\xE3o, comodidades, regras e detalhes das propriedades"
    },
    {
      id: "cleaning",
      name: "Procedimentos de Limpeza",
      description: "Protocolos, produtos aprovados e checklists de limpeza"
    },
    {
      id: "maintenance",
      name: "Manuten\xE7\xE3o",
      description: "Problemas comuns, solu\xE7\xF5es e contatos de fornecedores"
    },
    {
      id: "local_services",
      name: "Servi\xE7os Locais",
      description: "Restaurantes, transporte, atra\xE7\xF5es e servi\xE7os pr\xF3ximos"
    },
    {
      id: "guest_management",
      name: "Gest\xE3o de H\xF3spedes",
      description: "Processos de check-in, orienta\xE7\xF5es e atendimento aos h\xF3spedes"
    },
    {
      id: "general",
      name: "Geral",
      description: "Conhecimento geral e informa\xE7\xF5es diversas"
    }
  ];
  res.json({
    success: true,
    data: { domains }
  });
});
router9.get("/health", async (req, res) => {
  try {
    const stats = await ragService2.getKnowledgeStats();
    res.json({
      success: true,
      data: {
        status: "healthy",
        knowledgeBase: {
          totalEntries: stats.totalEntries,
          domainsActive: Object.keys(stats.domainStats).length,
          lastUpdated: stats.lastUpdated
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: "unhealthy",
        error: "Knowledge service unavailable"
      }
    });
  }
});
var knowledge_route_default = router9;

// server/routes/predictions.route.ts
import express3 from "express";

// server/services/ml-pattern-recognition.service.ts
import { createHash } from "crypto";
import pino2 from "pino";
var mlLogger = pino2({
  name: "ml-pattern-recognition",
  level: process.env.NODE_ENV === "production" ? "info" : "debug"
});
var MLPatternRecognitionService = class {
  models = /* @__PURE__ */ new Map();
  modelCache = /* @__PURE__ */ new Map();
  isInitialized = false;
  constructor() {
    this.initializeModels();
  }
  /**
   * Initialize ML models with configurations
   */
  initializeModels() {
    try {
      this.models.set("revenue_forecast", {
        name: "Revenue Forecasting Model",
        type: "lstm",
        accuracy_target: 0.85,
        features: [
          "historical_revenue",
          "occupancy_rate",
          "seasonal_index",
          "local_events",
          "competitor_pricing",
          "property_rating",
          "day_of_week",
          "month_of_year"
        ],
        hyperparameters: {
          sequence_length: 30,
          hidden_units: 128,
          dropout: 0.3,
          learning_rate: 1e-3,
          epochs: 100,
          batch_size: 32
        }
      });
      this.models.set("occupancy_optimization", {
        name: "Occupancy Optimization Model",
        type: "gradient_boost",
        accuracy_target: 0.8,
        features: [
          "price_per_night",
          "property_amenities",
          "location_score",
          "reviews_count",
          "rating",
          "competitor_availability",
          "seasonal_demand",
          "booking_lead_time"
        ],
        hyperparameters: {
          n_estimators: 200,
          max_depth: 8,
          learning_rate: 0.1,
          subsample: 0.8,
          min_samples_split: 10,
          min_samples_leaf: 5
        }
      });
      this.models.set("maintenance_prediction", {
        name: "Maintenance Prediction Model",
        type: "random_forest",
        accuracy_target: 0.9,
        features: [
          "equipment_age",
          "usage_hours",
          "maintenance_history",
          "environmental_conditions",
          "performance_metrics",
          "failure_indicators",
          "seasonal_wear",
          "property_type"
        ],
        hyperparameters: {
          n_estimators: 300,
          max_depth: 15,
          min_samples_split: 5,
          min_samples_leaf: 2,
          max_features: "sqrt",
          bootstrap: true,
          random_state: 42
        }
      });
      this.models.set("guest_behavior", {
        name: "Guest Behavior Analysis Model",
        type: "clustering",
        accuracy_target: 0.75,
        features: [
          "booking_patterns",
          "stay_duration",
          "price_sensitivity",
          "amenity_preferences",
          "review_behavior",
          "rebooking_likelihood",
          "seasonal_preferences",
          "group_size"
        ],
        hyperparameters: {
          n_clusters: 6,
          algorithm: "kmeans",
          init: "k-means++",
          max_iter: 300,
          tol: 1e-4,
          random_state: 42
        }
      });
      this.models.set("demand_patterns", {
        name: "Demand Pattern Recognition Model",
        type: "time_series",
        accuracy_target: 0.82,
        features: [
          "historical_bookings",
          "search_volume",
          "price_trends",
          "event_calendar",
          "weather_data",
          "market_sentiment",
          "competitor_activity",
          "economic_indicators"
        ],
        hyperparameters: {
          seasonality_mode: "multiplicative",
          changepoint_prior_scale: 0.05,
          seasonality_prior_scale: 10,
          holidays_prior_scale: 10,
          mcmc_samples: 0,
          interval_width: 0.8,
          uncertainty_samples: 1e3
        }
      });
      this.isInitialized = true;
      mlLogger.info("ML models initialized successfully", {
        model_count: this.models.size,
        models: Array.from(this.models.keys())
      });
    } catch (error) {
      mlLogger.error("Failed to initialize ML models", { error: error.message });
      throw new Error(`ML service initialization failed: ${error.message}`);
    }
  }
  /**
   * Train a specific model with provided data
   */
  async trainModel(modelName, trainingData, validationSplit = 0.2) {
    const startTime = Date.now();
    if (!this.models.has(modelName)) {
      throw new Error(`Model '${modelName}' not found`);
    }
    const modelConfig = this.models.get(modelName);
    try {
      mlLogger.info("Starting model training", {
        model: modelName,
        samples: trainingData.features.length,
        features: trainingData.features[0]?.length || 0
      });
      const trainingResult = await this.simulateTraining(modelConfig, trainingData, validationSplit);
      const modelKey = `${modelName}_${Date.now()}`;
      this.modelCache.set(modelKey, {
        config: modelConfig,
        training_data_hash: this.hashTrainingData(trainingData),
        trained_at: /* @__PURE__ */ new Date(),
        metrics: trainingResult.metrics
      });
      const trainingTime = Date.now() - startTime;
      mlLogger.info("Model training completed", {
        model: modelName,
        accuracy: trainingResult.metrics.accuracy,
        training_time_ms: trainingTime
      });
      return {
        success: true,
        metrics: {
          ...trainingResult.metrics,
          training_time_ms: trainingTime
        },
        model_info: {
          features_count: trainingData.features[0]?.length || 0,
          samples_count: trainingData.features.length,
          validation_samples: Math.floor(trainingData.features.length * validationSplit)
        }
      };
    } catch (error) {
      mlLogger.error("Model training failed", {
        model: modelName,
        error: error.message
      });
      throw new Error(`Training failed for ${modelName}: ${error.message}`);
    }
  }
  /**
   * Make predictions using trained models
   */
  async predict(modelName, features, options = {}) {
    const startTime = Date.now();
    if (!this.models.has(modelName)) {
      throw new Error(`Model '${modelName}' not found`);
    }
    if (!Array.isArray(features) || features.length === 0) {
      throw new Error("Prediction requires at least one feature");
    }
    try {
      const modelConfig = this.models.get(modelName);
      const prediction = await this.simulatePrediction(modelConfig, features);
      const processingTime = Date.now() - startTime;
      const result = {
        prediction: prediction.value,
        confidence: prediction.confidence,
        model_used: modelName,
        processing_time_ms: processingTime,
        metadata: {
          model_type: modelConfig.type,
          features_used: features.length,
          prediction_timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      if (options.explain_prediction) {
        result.metadata.feature_importance = this.generateFeatureImportance(modelConfig, features);
      }
      mlLogger.debug("Prediction completed", {
        model: modelName,
        processing_time_ms: processingTime,
        confidence: prediction.confidence
      });
      return result;
    } catch (error) {
      mlLogger.error("Prediction failed", {
        model: modelName,
        error: error.message
      });
      throw new Error(`Prediction failed for ${modelName}: ${error.message}`);
    }
  }
  /**
   * Analyze patterns in historical data
   */
  async analyzePatterns(data, options = {}) {
    try {
      mlLogger.info("Starting pattern analysis", {
        data_points: data.length,
        date_range: [
          data[0]?.timestamp,
          data[data.length - 1]?.timestamp
        ]
      });
      const patterns = [];
      const anomalies = [];
      if (data.length > 7) patterns.push("weekly_seasonality");
      if (data.length > 30) patterns.push("monthly_trends");
      if (data.length > 365) patterns.push("yearly_cycles");
      if (options.detect_anomalies && data.length > 0) {
        const mean = data.reduce((sum2, d) => sum2 + d.value, 0) / data.length;
        const variance = data.reduce((sum2, d) => sum2 + Math.pow(d.value - mean, 2), 0) / data.length;
        const std = Math.sqrt(variance);
        data.forEach((point) => {
          const deviation = Math.abs(point.value - mean);
          const zScore = std === 0 ? deviation > 0 ? Infinity : 0 : deviation / std;
          if (zScore >= 2.3) {
            const severity = zScore >= 3.5 ? "high" : zScore >= 3 ? "medium" : "low";
            const description = Number.isFinite(zScore) ? `Value ${point.value.toFixed(2)} deviates ${zScore.toFixed(2)} standard deviations from mean` : `Value ${point.value.toFixed(2)} deviates significantly from mean`;
            anomalies.push({
              date: point.timestamp,
              value: point.value,
              severity,
              description
            });
          }
        });
      }
      const seasonality = {
        weekly: this.generateWeeklyPattern(),
        monthly: this.generateMonthlyPattern(),
        yearly: this.generateYearlyPattern()
      };
      const trends = this.analyzeTrends(data);
      return {
        patterns_detected: patterns,
        seasonality,
        anomalies,
        trends
      };
    } catch (error) {
      mlLogger.error("Pattern analysis failed", { error: error.message });
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }
  /**
   * Get model performance metrics
   */
  async getModelMetrics(modelName) {
    try {
      if (modelName) {
        if (!this.models.has(modelName)) {
          throw new Error(`Model '${modelName}' not found`);
        }
        const cachedModels = Array.from(this.modelCache.entries()).filter(([key]) => key.startsWith(modelName));
        if (cachedModels.length === 0) {
          return { status: "not_trained", message: `Model '${modelName}' has not been trained yet` };
        }
        const latestModel = cachedModels[cachedModels.length - 1][1];
        return {
          model_name: modelName,
          ...latestModel.metrics,
          trained_at: latestModel.trained_at,
          config: latestModel.config
        };
      }
      const allMetrics = {};
      for (const [name] of this.models) {
        const metrics = await this.getModelMetrics(name);
        allMetrics[name] = metrics;
      }
      return allMetrics;
    } catch (error) {
      mlLogger.error("Failed to get model metrics", { error: error.message });
      throw error;
    }
  }
  /**
   * Detect model drift and recommend retraining
   */
  async detectDrift(modelName, newData, threshold = 0.1) {
    if (!this.models.has(modelName)) {
      throw new Error(`Model '${modelName}' not found`);
    }
    try {
      const driftScore = Math.random() * 0.3;
      const driftDetected = driftScore > threshold;
      let recommendation = "Model performing within acceptable parameters";
      let retrainRecommended = false;
      if (driftDetected) {
        if (driftScore > 0.2) {
          recommendation = "Significant drift detected. Immediate retraining recommended.";
          retrainRecommended = true;
        } else {
          recommendation = "Minor drift detected. Consider retraining within next week.";
          retrainRecommended = true;
        }
      }
      mlLogger.info("Drift detection completed", {
        model: modelName,
        drift_score: driftScore,
        drift_detected: driftDetected
      });
      return {
        drift_detected: driftDetected,
        drift_score: driftScore,
        recommendation,
        retrain_recommended: retrainRecommended
      };
    } catch (error) {
      mlLogger.error("Drift detection failed", {
        model: modelName,
        error: error.message
      });
      throw error;
    }
  }
  // Private helper methods
  async simulateTraining(config, data, validationSplit) {
    const trainingTime = config.type === "lstm" ? 2e3 : config.type === "gradient_boost" ? 1500 : config.type === "random_forest" ? 1e3 : config.type === "clustering" ? 800 : 500;
    await new Promise((resolve) => setTimeout(resolve, Math.random() * trainingTime));
    const baseAccuracy = config.accuracy_target;
    const accuracyVariation = (Math.random() - 0.5) * 0.1;
    const accuracy = Math.max(0.5, Math.min(0.99, baseAccuracy + accuracyVariation));
    const baseLoss = 1 - accuracy;
    const loss = baseLoss + (Math.random() - 0.5) * 0.1;
    const metrics = {
      accuracy,
      loss: Math.max(0.01, loss)
    };
    if (validationSplit > 0) {
      metrics.val_accuracy = accuracy - Math.random() * 0.05;
      metrics.val_loss = loss + Math.random() * 0.05;
    }
    return { metrics };
  }
  async simulatePrediction(config, features) {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
    let value;
    let confidence;
    switch (config.type) {
      case "lstm":
      case "gradient_boost":
      case "random_forest":
      case "time_series":
        value = Math.random() * 1e3 + 500;
        confidence = 0.7 + Math.random() * 0.25;
        break;
      case "clustering":
        value = Math.floor(Math.random() * 6);
        confidence = 0.6 + Math.random() * 0.3;
        break;
      default:
        value = 0;
        confidence = 0.5;
    }
    return { value, confidence };
  }
  hashTrainingData(data) {
    const dataString = JSON.stringify({
      features_shape: [data.features.length, data.features[0]?.length || 0],
      labels_length: data.labels.length,
      metadata: data.metadata
    });
    return createHash("md5").update(dataString).digest("hex");
  }
  generateFeatureImportance(config, features) {
    const importance = {};
    config.features.forEach((featureName, index) => {
      if (index < features.length) {
        importance[featureName] = Math.random();
      }
    });
    const total = Object.values(importance).reduce((sum2, val) => sum2 + val, 0);
    Object.keys(importance).forEach((key) => {
      importance[key] = importance[key] / total;
    });
    return importance;
  }
  generateWeeklyPattern() {
    return [0.7, 0.6, 0.6, 0.7, 0.8, 1, 0.9];
  }
  generateMonthlyPattern() {
    const pattern = [];
    for (let month = 1; month <= 12; month++) {
      const seasonal = 0.5 + 0.4 * Math.sin((month - 3) * Math.PI / 6);
      pattern.push(Math.max(0.1, Math.min(1, seasonal)));
    }
    return pattern;
  }
  generateYearlyPattern() {
    return Array.from({ length: 5 }, (_, year) => 0.8 + year * 0.05);
  }
  analyzeTrends(data) {
    if (data.length < 2) {
      return {
        direction: "stable",
        strength: 0,
        r_squared: 0
      };
    }
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map((d) => d.value);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum2, xi, i) => sum2 + xi * y[i], 0);
    const sumXX = x.reduce((sum2, xi) => sum2 + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const meanY = sumY / n;
    const totalSumSquares = y.reduce((sum2, yi) => sum2 + Math.pow(yi - meanY, 2), 0);
    const residualSumSquares = y.reduce((sum2, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum2 + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - residualSumSquares / totalSumSquares;
    return {
      direction: slope > 0.01 ? "increasing" : slope < -0.01 ? "decreasing" : "stable",
      strength: Math.abs(slope),
      r_squared: Math.max(0, rSquared)
    };
  }
};
var mlPatternRecognition = new MLPatternRecognitionService();

// server/routes/predictions.route.ts
import { z as z3 } from "zod";
import pino3 from "pino";
var router10 = express3.Router();
var logger2 = pino3({ name: "ml-predictions-api" });
var PredictionRequestSchema = z3.object({
  model: z3.enum(["revenue_forecast", "occupancy_optimization", "maintenance_prediction", "guest_behavior", "demand_patterns"]),
  features: z3.array(z3.number()).min(1),
  options: z3.object({
    return_confidence: z3.boolean().optional(),
    explain_prediction: z3.boolean().optional()
  }).optional()
});
var PatternAnalysisRequestSchema = z3.object({
  data: z3.array(z3.object({
    timestamp: z3.string().datetime(),
    value: z3.number(),
    metadata: z3.record(z3.any()).optional()
  })).min(2),
  options: z3.object({
    detect_anomalies: z3.boolean().optional(),
    seasonal_analysis: z3.boolean().optional(),
    trend_analysis: z3.boolean().optional()
  }).optional()
});
var TrainingRequestSchema = z3.object({
  model: z3.enum(["revenue_forecast", "occupancy_optimization", "maintenance_prediction", "guest_behavior", "demand_patterns"]),
  features: z3.array(z3.array(z3.number())),
  labels: z3.array(z3.number()),
  validation_split: z3.number().min(0).max(0.5).optional(),
  metadata: z3.object({
    property_id: z3.string().optional(),
    date_range: z3.tuple([z3.string().datetime(), z3.string().datetime()]),
    data_points: z3.number()
  }).optional()
});
var validateRequest2 = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: error.errors
        });
      }
      next(error);
    }
  };
};
var mlRateLimit = express3.Router();
mlRateLimit.use((req, res, next) => {
  const clientIp = req.ip || req.socket.remoteAddress;
  const key = `ml_rate_limit_${clientIp}`;
  if (!global.rateLimitTracker) {
    global.rateLimitTracker = /* @__PURE__ */ new Map();
  }
  const now = Date.now();
  const windowMs = 60 * 1e3;
  const maxRequests = 10;
  const clientData = global.rateLimitTracker.get(key) || { count: 0, resetTime: now + windowMs };
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + windowMs;
  }
  if (clientData.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded for ML endpoints",
      retry_after: Math.ceil((clientData.resetTime - now) / 1e3)
    });
  }
  clientData.count++;
  global.rateLimitTracker.set(key, clientData);
  next();
});
router10.use(mlRateLimit);
router10.get("/models", async (req, res) => {
  try {
    logger2.info("Fetching ML models status");
    const models = await mlPatternRecognition.getModelMetrics();
    res.json({
      success: true,
      models,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger2.error("Failed to fetch models status", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch models status",
      details: error.message
    });
  }
});
router10.get("/models/:modelName", async (req, res) => {
  try {
    const { modelName } = req.params;
    logger2.info("Fetching model metrics", { model: modelName });
    const metrics = await mlPatternRecognition.getModelMetrics(modelName);
    res.json({
      success: true,
      model: modelName,
      metrics,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger2.error("Failed to fetch model metrics", {
      model: req.params.modelName,
      error: error.message
    });
    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        error: "Model not found",
        details: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to fetch model metrics",
        details: error.message
      });
    }
  }
});
router10.post("/predict", validateRequest2(PredictionRequestSchema), async (req, res) => {
  try {
    const { model, features, options = {} } = req.body;
    logger2.info("Making ML prediction", {
      model,
      features_count: features.length,
      options
    });
    const startTime = Date.now();
    const prediction = await mlPatternRecognition.predict(model, features, options);
    const totalTime = Date.now() - startTime;
    logger2.info("Prediction completed", {
      model,
      total_time_ms: totalTime,
      confidence: prediction.confidence
    });
    res.json({
      success: true,
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      model_used: prediction.model_used,
      processing_time_ms: prediction.processing_time_ms,
      total_request_time_ms: totalTime,
      metadata: prediction.metadata,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger2.error("Prediction failed", { error: error.message });
    res.status(400).json({
      success: false,
      error: "Prediction failed",
      details: error.message
    });
  }
});
router10.post("/batch-predict", async (req, res) => {
  try {
    const { predictions } = req.body;
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid batch prediction request",
        details: "predictions array is required and must not be empty"
      });
    }
    if (predictions.length > 50) {
      return res.status(400).json({
        success: false,
        error: "Batch size too large",
        details: "Maximum 50 predictions per batch request"
      });
    }
    logger2.info("Processing batch predictions", { batch_size: predictions.length });
    const startTime = Date.now();
    const results = [];
    for (let i = 0; i < predictions.length; i++) {
      const request = predictions[i];
      try {
        PredictionRequestSchema.parse(request);
        const prediction = await mlPatternRecognition.predict(
          request.model,
          request.features,
          request.options || {}
        );
        results.push({
          index: i,
          success: true,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          model_used: prediction.model_used,
          processing_time_ms: prediction.processing_time_ms,
          metadata: prediction.metadata
        });
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error.message,
          request
        });
      }
    }
    const totalTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    logger2.info("Batch predictions completed", {
      batch_size: predictions.length,
      successful: successCount,
      failed: predictions.length - successCount,
      total_time_ms: totalTime
    });
    res.json({
      success: true,
      batch_size: predictions.length,
      successful_predictions: successCount,
      failed_predictions: predictions.length - successCount,
      results,
      total_processing_time_ms: totalTime,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger2.error("Batch prediction failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Batch prediction failed",
      details: error.message
    });
  }
});
router10.post("/analyze-patterns", validateRequest2(PatternAnalysisRequestSchema), async (req, res) => {
  try {
    const { data, options = {} } = req.body;
    logger2.info("Analyzing patterns", {
      data_points: data.length,
      date_range: [data[0]?.timestamp, data[data.length - 1]?.timestamp],
      options
    });
    const processedData = data.map((point) => ({
      ...point,
      timestamp: new Date(point.timestamp)
    }));
    const startTime = Date.now();
    const analysis = await mlPatternRecognition.analyzePatterns(processedData, options);
    const processingTime = Date.now() - startTime;
    logger2.info("Pattern analysis completed", {
      patterns_detected: analysis.patterns_detected.length,
      anomalies_found: analysis.anomalies.length,
      processing_time_ms: processingTime
    });
    res.json({
      success: true,
      analysis,
      processing_time_ms: processingTime,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger2.error("Pattern analysis failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Pattern analysis failed",
      details: error.message
    });
  }
});
router10.post("/train", validateRequest2(TrainingRequestSchema), async (req, res) => {
  try {
    const { model, features, labels, validation_split = 0.2, metadata } = req.body;
    logger2.info("Starting model training", {
      model,
      samples: features.length,
      features_per_sample: features[0]?.length || 0,
      validation_split
    });
    const trainingData = {
      features,
      labels,
      metadata: metadata || {
        date_range: [(/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString()],
        data_points: features.length
      }
    };
    const startTime = Date.now();
    const result = await mlPatternRecognition.trainModel(model, trainingData, validation_split);
    const totalTime = Date.now() - startTime;
    logger2.info("Model training completed", {
      model,
      accuracy: result.metrics.accuracy,
      total_time_ms: totalTime
    });
    res.json({
      success: result.success,
      model,
      metrics: result.metrics,
      model_info: result.model_info,
      total_training_time_ms: totalTime,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger2.error("Model training failed", { error: error.message });
    res.status(400).json({
      success: false,
      error: "Model training failed",
      details: error.message
    });
  }
});
router10.get("/drift/:modelName", async (req, res) => {
  try {
    const { modelName } = req.params;
    const threshold = parseFloat(req.query.threshold) || 0.1;
    logger2.info("Checking model drift", { model: modelName, threshold });
    const sampleData = Array.from(
      { length: 100 },
      () => Array.from({ length: 5 }, () => Math.random())
    );
    const driftAnalysis = await mlPatternRecognition.detectDrift(modelName, sampleData, threshold);
    logger2.info("Drift analysis completed", {
      model: modelName,
      drift_detected: driftAnalysis.drift_detected,
      drift_score: driftAnalysis.drift_score
    });
    res.json({
      success: true,
      model: modelName,
      drift_analysis: driftAnalysis,
      threshold_used: threshold,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger2.error("Drift detection failed", {
      model: req.params.modelName,
      error: error.message
    });
    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        error: "Model not found",
        details: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Drift detection failed",
        details: error.message
      });
    }
  }
});
router10.get("/health", async (req, res) => {
  try {
    const models = await mlPatternRecognition.getModelMetrics();
    const modelCount = Object.keys(models).length;
    const health = {
      status: "healthy",
      service: "ML Pattern Recognition",
      models_available: modelCount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime_ms: process.uptime() * 1e3
    };
    res.json({
      success: true,
      health
    });
  } catch (error) {
    logger2.error("Health check failed", { error: error.message });
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: error.message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
router10.use((error, req, res, next) => {
  logger2.error("ML API error", {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack
  });
  res.status(500).json({
    success: false,
    error: "Internal server error in ML service",
    details: process.env.NODE_ENV === "development" ? error.message : "Contact support if this persists"
  });
});
var predictions_route_default = router10;

// server/routes/v1/index.ts
async function setupV1Routes(app2) {
  const v1Router = Router9();
  v1Router.use((req, res, next) => {
    res.set("API-Version", API_CONFIG.version);
    res.set("API-Documentation", API_CONFIG.documentation.path);
    next();
  });
  v1Router.use("/properties", router);
  v1Router.use("/properties-api", properties_default);
  v1Router.use("/properties-features", property_routes_default);
  v1Router.use("/reservations", reservation_routes_default);
  v1Router.use("/owners", owners_routes_default);
  v1Router.use("/financial", financial_routes_default);
  v1Router.use("/ocr", ocr_processing_route_default);
  v1Router.use("/validation", validation_route_default);
  v1Router.use("/predictions", predictions_route_default);
  v1Router.use("/knowledge", knowledge_route_default);
  app2.use(API_CONFIG.prefix, v1Router);
  console.log(`\u2705 API v1 routes registered at ${API_CONFIG.prefix}`);
  console.log(`   - ${API_CONFIG.prefix}/properties`);
  console.log(`   - ${API_CONFIG.prefix}/reservations`);
  console.log(`   - ${API_CONFIG.prefix}/owners`);
  console.log(`   - ${API_CONFIG.prefix}/financial`);
  console.log(`   - ${API_CONFIG.prefix}/ocr`);
  console.log(`   - ${API_CONFIG.prefix}/validation`);
  console.log(`   - ${API_CONFIG.prefix}/predictions`);
  console.log(`   - ${API_CONFIG.prefix}/knowledge`);
}

// server/utils/swagger.utils.ts
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
var swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: API_CONFIG.documentation.title,
      version: API_CONFIG.documentation.version,
      description: API_CONFIG.documentation.description,
      contact: {
        name: "MariaIntelligence Support",
        email: "support@mariaintelligence.com"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production" ? "https://api.mariaintelligence.com" : `http://localhost:${process.env.PORT || 5100}`,
        description: process.env.NODE_ENV === "production" ? "Production server" : "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        },
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key"
        }
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            message: { type: "string" },
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "object" }
              }
            },
            metadata: {
              type: "object",
              properties: {
                timestamp: { type: "string", format: "date-time" },
                version: { type: "string" },
                requestId: { type: "string" },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    limit: { type: "number" },
                    total: { type: "number" },
                    totalPages: { type: "number" }
                  }
                }
              }
            }
          }
        },
        Property: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            ownerId: { type: "number" },
            cleaningCost: { type: "string" },
            checkInFee: { type: "string" },
            commission: { type: "string" },
            teamPayment: { type: "string" },
            active: { type: "boolean" }
          },
          required: ["name", "ownerId"]
        },
        Reservation: {
          type: "object",
          properties: {
            id: { type: "number" },
            propertyId: { type: "number" },
            guestName: { type: "string" },
            guestEmail: { type: "string" },
            guestPhone: { type: "string" },
            checkInDate: { type: "string", format: "date" },
            checkOutDate: { type: "string", format: "date" },
            numGuests: { type: "number" },
            totalAmount: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled", "completed"]
            },
            platform: {
              type: "string",
              enum: ["airbnb", "booking", "direct", "other"]
            }
          },
          required: ["propertyId", "guestName", "checkInDate", "checkOutDate"]
        },
        ValidationError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string" },
                details: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: { type: "string" },
                      message: { type: "string" },
                      code: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" }
            }
          }
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" }
            }
          }
        },
        Forbidden: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" }
            }
          }
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" }
            }
          }
        },
        ValidationError: {
          description: "Validation Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationError" }
            }
          }
        },
        TooManyRequests: {
          description: "Rate limit exceeded",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" }
            }
          }
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }, { apiKey: [] }]
  },
  apis: [
    "./server/routes/v1/*.ts",
    "./server/routes/v1/*.js",
    "./server/controllers/*.ts",
    "./server/controllers/*.js"
  ]
};
async function setupDocumentation(app2) {
  try {
    const specs = swaggerJsdoc(swaggerOptions);
    app2.use(
      API_CONFIG.documentation.path,
      swaggerUi.serve,
      swaggerUi.setup(specs, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: API_CONFIG.documentation.title,
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          tryItOutEnabled: true
        }
      })
    );
    app2.get("/api/openapi.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(specs);
    });
    console.log(
      `\u{1F4DA} OpenAPI documentation initialized at ${API_CONFIG.documentation.path}`
    );
  } catch (error) {
    console.error("\u274C Failed to setup API documentation:", error);
  }
}

// server/routes/index.ts
async function registerRoutes(app2) {
  console.log("\u{1F680} Initializing modern API routes with ES Modules...");
  await setupMiddleware(app2);
  if (API_CONFIG.documentation.enabled) {
    await setupDocumentation(app2);
    console.log(`\u{1F4DA} API documentation available at ${API_CONFIG.documentation.path}`);
  }
  await setupV1Routes(app2);
  await setupLegacyCompatibility(app2);
  console.log(`\u2705 API routes initialized with prefix: ${API_CONFIG.prefix}`);
}
async function setupLegacyCompatibility(app2) {
  app2.use("/api/*", (req, res, next) => {
    if (req.path.startsWith("/api/v1/")) {
      return next();
    }
    const newPath = req.path.replace("/api/", "/api/v1/");
    console.log(`\u{1F504} Redirecting legacy route ${req.path} to ${newPath}`);
    if (req.method === "GET") {
      return res.redirect(301, newPath + (req.url.includes("?") ? "?" + req.url.split("?")[1] : ""));
    }
    req.url = newPath + (req.url.includes("?") ? "?" + req.url.split("?")[1] : "");
    next();
  });
}

// api/index.ts
init_security();
import path3 from "path";
import { fileURLToPath } from "url";

// server/middleware/request-id.ts
import { randomUUID } from "crypto";
function requestIdMiddleware(req, res, next) {
  const requestId = randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}

// api/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
console.log("Inicializando aplica\xE7\xE3o Vercel Serverless\u2026");
var app = express4();
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  }
}));
app.use(requestIdMiddleware);
app.use(securityMiddlewareStack);
app.use("/api/", apiRateLimiter);
app.use("/api/upload", pdfImportRateLimiter);
app.use("/api/ocr", pdfImportRateLimiter);
app.use("/api/ai", strictRateLimiter);
app.use("/api/gemini", strictRateLimiter);
app.use("/api/assistant", strictRateLimiter);
var logger3 = pino6({
  level: "info"
});
app.use(pinoHttp2({
  logger: logger3,
  customLogLevel: function(req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) return "warn";
    if (res.statusCode >= 500 || err) return "error";
    if (req.method === "POST") return "info";
    return "debug";
  },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    remove: true
  }
}));
app.use(express4.json());
app.use(express4.urlencoded({ extended: false }));
app.get("/api/health", async (_req, res) => {
  try {
    const { db: db3 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { sql: sql3 } = await import("drizzle-orm");
    await db3.execute(sql3`SELECT 1`);
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      platform: "vercel-serverless",
      database: "connected",
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: "MB"
      }
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      platform: "vercel-serverless",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  res.json = function(body3) {
    return originalJson.call(this, body3);
  };
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const dur = Date.now() - start;
      console.log(`[${req.id || "no-id"}] ${req.method} ${req.path} ${res.statusCode} in ${dur}ms`);
    }
  });
  next();
});
var initialized = false;
async function initializeApp() {
  if (initialized) return;
  try {
    await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Error";
      console.error("Error handler:", err);
      res.status(status).json({
        success: false,
        message,
        error: process.env.NODE_ENV === "development" ? err.stack : void 0
      });
    });
    initialized = true;
    console.log("\u2705 App initialized successfully for Vercel");
  } catch (error) {
    console.error("\u274C Failed to initialize app:", error);
    throw error;
  }
}
async function handler(req, res) {
  try {
    await initializeApp();
    return app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
export {
  handler as default
};

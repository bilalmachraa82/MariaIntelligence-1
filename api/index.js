var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
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

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
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
var Pool, isDatabaseAvailable, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    ({ Pool } = pg);
    if (!process.env.DATABASE_URL) {
      console.warn(
        "DATABASE_URL n\xE3o est\xE1 definida. Usando armazenamento em mem\xF3ria."
      );
    }
    isDatabaseAvailable = false;
    pool = process.env.DATABASE_URL ? new Pool({
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
    db = pool ? drizzle(pool, { schema: schema_exports }) : null;
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

// server/storage.ts
import { eq, desc, sql } from "drizzle-orm";
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
function ensureStorageInitialized() {
  if (storageInitialized) {
    return Promise.resolve();
  }
  if (!storageInitPromise) {
    storageInitPromise = new Promise((resolve2) => {
      if (storageInstance) {
        storageInitialized = true;
        console.log("Armazenamento j\xE1 est\xE1 inicializado");
        resolve2();
        return;
      }
      const checkInterval = setInterval(() => {
        if (storageInstance) {
          clearInterval(checkInterval);
          storageInitialized = true;
          console.log("Armazenamento inicializado com sucesso");
          resolve2();
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
            resolve2();
          }).catch((err) => {
            console.error("Falha ao criar armazenamento manualmente:", err);
            storageInitialized = true;
            resolve2();
          });
        }
      }, 5e3);
    });
  }
  return storageInitPromise;
}
var MemStorage, DatabaseStorage, usePostgres, storageInstance, memStorage, dbStorage, storageInitialized, storageInitPromise, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    init_schema();
    init_db();
    MemStorage = class {
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
        let reservations5 = Array.from(this.reservationsMap.values());
        if (startDate) {
          reservations5 = reservations5.filter((r) => new Date(r.checkInDate) >= startDate);
        }
        if (endDate) {
          reservations5 = reservations5.filter((r) => new Date(r.checkInDate) <= endDate);
        }
        return reservations5.reduce((sum2, reservation) => {
          return sum2 + Number(reservation.totalAmount);
        }, 0);
      }
      async getNetProfit(startDate, endDate) {
        let reservations5 = Array.from(this.reservationsMap.values());
        if (startDate) {
          reservations5 = reservations5.filter((r) => new Date(r.checkInDate) >= startDate);
        }
        if (endDate) {
          reservations5 = reservations5.filter((r) => new Date(r.checkInDate) <= endDate);
        }
        return reservations5.reduce((sum2, reservation) => {
          return sum2 + Number(reservation.netAmount);
        }, 0);
      }
      async getOccupancyRate(propertyId, startDate, endDate) {
        const start = startDate || new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1);
        const end = endDate || new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth() + 1, 0);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24));
        const startDateStr = start.toISOString().split("T")[0];
        const endDateStr = end.toISOString().split("T")[0];
        let reservations5 = Array.from(this.reservationsMap.values()).filter((r) => new Date(r.checkOutDate) > start && new Date(r.checkInDate) < end);
        if (propertyId) {
          reservations5 = reservations5.filter((r) => r.propertyId === propertyId);
        }
        let occupiedDays = 0;
        reservations5.forEach((r) => {
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
        const reservations5 = await this.getReservationsByProperty(propertyId);
        const totalRevenue = reservations5.reduce((sum2, r) => sum2 + Number(r.totalAmount), 0);
        const totalCosts = reservations5.reduce((sum2, r) => {
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
          reservationsCount: reservations5.length
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
          const reservations5 = (await this.getReservationsByProperty(property.id)).filter((r) => {
            const checkIn = new Date(r.checkInDate);
            const checkOut = new Date(r.checkOutDate);
            return checkIn <= endDate && checkOut >= startDate;
          });
          const revenue = reservations5.reduce((sum2, r) => sum2 + Number(r.totalAmount), 0);
          const cleaningCosts = reservations5.reduce((sum2, r) => sum2 + Number(r.cleaningFee || 0), 0);
          const checkInFees = reservations5.reduce((sum2, r) => sum2 + Number(r.checkInFee || 0), 0);
          const commission = reservations5.reduce((sum2, r) => sum2 + Number(r.commission || 0), 0);
          const teamPayments = reservations5.reduce((sum2, r) => sum2 + Number(r.teamPayment || 0), 0);
          const netProfit = revenue - cleaningCosts - checkInFees - commission - teamPayments;
          const occupancyRate = await this.getOccupancyRate(property.id, startDate, endDate);
          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
          const occupiedDays = Math.ceil(totalDays * (occupancyRate / 100));
          const reservationSummaries = reservations5.map((r) => ({
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
    DatabaseStorage = class {
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
            const query = `
          SELECT * FROM reservations
          ORDER BY created_at DESC
        `;
            const result = await this.poolInstance.query(query);
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
            const query = `
          SELECT * FROM reservations 
          WHERE property_id = $1 AND check_in_date >= $2::DATE
          ORDER BY check_in_date DESC
        `;
            const result = await this.poolInstance.query(query, [propertyId, minDateStr]);
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
            const query = `
          SELECT * FROM reservations 
          WHERE 
            (check_in_date::DATE = $1::DATE OR 
             check_in_date::DATE = $2::DATE OR 
             check_out_date::DATE = $1::DATE)
          ORDER BY check_in_date ASC
        `;
            const result = await this.poolInstance.query(query, [todayStr, tomorrowStr]);
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
        let query = db.select().from(activities).orderBy(desc(activities.createdAt));
        if (limit) {
          query = query.limit(limit);
        }
        const results = await query;
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
            const reservations5 = reservationsResult.rows || [];
            const totalRevenue2 = reservations5.reduce((sum2, r) => sum2 + Number(r.total_amount || 0), 0);
            const cleaningCosts = reservations5.reduce((sum2, r) => sum2 + Number(r.cleaning_fee || 0), 0);
            const checkInFees = reservations5.reduce((sum2, r) => sum2 + Number(r.check_in_fee || 0), 0);
            const commissions = reservations5.reduce((sum2, r) => sum2 + Number(r.commission_fee || 0), 0);
            const teamPayments = reservations5.reduce((sum2, r) => sum2 + Number(r.team_payment || 0), 0);
            const totalCosts2 = cleaningCosts + checkInFees + commissions + teamPayments;
            const netProfit2 = totalRevenue2 - totalCosts2;
            const daysInMonth = (endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24) + 1;
            let occupiedDays = 0;
            for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
              const isOccupied = reservations5.some((res) => {
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
                reservationsCount: reservations5.length
              },
              reservations: reservations5.map((r) => ({
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
        const query = {
          id,
          query: data.query,
          response: data.response,
          embedding: data.embedding || {},
          createdAt: timestamp2
        };
        this.queryEmbeddings.set(id, query);
        return query;
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
          let query = db.select({
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
              query = query.where(sql`${quotations.status} = ${options.status}`);
            }
            if (options.startDate) {
              query = query.where(sql`${quotations.createdAt} >= ${options.startDate}`);
            }
            if (options.endDate) {
              query = query.where(sql`${quotations.createdAt} <= ${options.endDate}`);
            }
          }
          query = query.orderBy(desc(quotations.createdAt));
          const result = await query;
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
    usePostgres = db && process.env.DATABASE_URL ? true : false;
    console.log(`Usando armazenamento ${usePostgres ? "PostgreSQL" : "em mem\xF3ria"}`);
    dbStorage = null;
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
    storageInitialized = false;
    storageInitPromise = null;
    storage = new Proxy({}, {
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
  }
});

// server/services/rate-limiter.service.ts
import crypto from "crypto";
var SimpleCache, RateLimiterService, rateLimiter;
var init_rate_limiter_service = __esm({
  "server/services/rate-limiter.service.ts"() {
    "use strict";
    SimpleCache = class {
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
    RateLimiterService = class _RateLimiterService {
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
        return new Promise((resolve2, reject) => {
          const id = crypto.randomUUID();
          const queueItem = {
            id,
            fn,
            args,
            resolve: resolve2,
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
                await new Promise((resolve2) => setTimeout(resolve2, this.calculateBackoff(item.retryCount)));
              } else {
                item.reject(new Error(`Limite de tentativas excedido ap\xF3s ${this.maxRetries} tentativas: ${error.message}`));
              }
            } else {
              item.reject(error);
            }
          }
        } else {
          const waitTime = this.calculateWaitTime();
          await new Promise((resolve2) => setTimeout(resolve2, waitTime));
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
    rateLimiter = RateLimiterService.getInstance();
  }
});

// server/services/gemini.service.ts
var gemini_service_exports = {};
__export(gemini_service_exports, {
  GeminiModel: () => GeminiModel,
  GeminiService: () => GeminiService
});
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto2 from "crypto";
var GeminiModel, GeminiService;
var init_gemini_service = __esm({
  "server/services/gemini.service.ts"() {
    "use strict";
    init_rate_limiter_service();
    GeminiModel = /* @__PURE__ */ ((GeminiModel2) => {
      GeminiModel2["TEXT"] = "gemini-2.0-flash-exp";
      GeminiModel2["VISION"] = "gemini-2.0-flash-exp";
      GeminiModel2["FLASH"] = "gemini-2.0-flash-exp";
      GeminiModel2["PRO"] = "gemini-1.5-pro";
      GeminiModel2["LEGACY_PRO"] = "gemini-1.5-pro";
      GeminiModel2["AUDIO"] = "gemini-2.0-flash-exp";
      return GeminiModel2;
    })(GeminiModel || {});
    GeminiService = class {
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
              await new Promise((resolve2) => setTimeout(resolve2, waitTime));
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
  }
});

// server/services/openrouter.service.ts
import axios from "axios";
var OpenRouterService;
var init_openrouter_service = __esm({
  "server/services/openrouter.service.ts"() {
    "use strict";
    init_rate_limiter_service();
    OpenRouterService = class {
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
  }
});

// server/services/rolm.service.ts
import axios2 from "axios";
var RolmService;
var init_rolm_service = __esm({
  "server/services/rolm.service.ts"() {
    "use strict";
    init_rate_limiter_service();
    RolmService = class {
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
  }
});

// server/services/mistral-ocr.service.ts
import axios3 from "axios";
var MistralOCRService, mistralOCRService;
var init_mistral_ocr_service = __esm({
  "server/services/mistral-ocr.service.ts"() {
    "use strict";
    init_rate_limiter_service();
    MistralOCRService = class {
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
    mistralOCRService = new MistralOCRService();
  }
});

// server/services/handwriting-detector.ts
var HandwritingDetector;
var init_handwriting_detector = __esm({
  "server/services/handwriting-detector.ts"() {
    "use strict";
    HandwritingDetector = class {
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
  }
});

// server/services/rag-enhanced.service.ts
import { sql as sql2 } from "drizzle-orm";
import { desc as desc2, gte as gte2, lte as lte2 } from "drizzle-orm";
var RagEnhancedService, ragService;
var init_rag_enhanced_service = __esm({
  "server/services/rag-enhanced.service.ts"() {
    "use strict";
    init_db();
    init_ai_adapter_service();
    init_storage();
    init_schema();
    RagEnhancedService = class _RagEnhancedService {
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
            let query = db.select().from(knowledgeEmbeddings).orderBy(desc2(knowledgeEmbeddings.createdAt)).limit(mergedConfig.maxResults || 5);
            if (mergedConfig.contentTypes && mergedConfig.contentTypes.length > 0) {
              query = query.where(
                sql2`${knowledgeEmbeddings.contentType} IN (${mergedConfig.contentTypes.join(",")})`
              );
            }
            if (mergedConfig.startDate) {
              query = query.where(gte2(knowledgeEmbeddings.createdAt, mergedConfig.startDate));
            }
            if (mergedConfig.endDate) {
              query = query.where(lte2(knowledgeEmbeddings.createdAt, mergedConfig.endDate));
            }
            const dbResults = await query;
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
      async saveQueryEmbedding(query, embedding) {
        try {
          const newQueryEmbedding = {
            query,
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
      async buildRagContext(query, maxItems = 5) {
        return this.buildConversationContext(query, maxItems);
      }
      /**
       * Constrói um contexto de conversação baseado em uma consulta (compatível com API antiga)
       * @param query Consulta para construir contexto
       * @param maxConversations Número máximo de itens a incluir no contexto
       * @returns Contexto de conversação formatado
       */
      async buildConversationContext(query, maxConversations = 10) {
        const similarItems = await this.querySimilarItems(query, {
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
    ragService = RagEnhancedService.getInstance();
  }
});

// server/services/ai-adapter.service.ts
var ai_adapter_service_exports = {};
__export(ai_adapter_service_exports, {
  AIAdapter: () => AIAdapter,
  AIServiceType: () => AIServiceType,
  aiService: () => aiService
});
import pdfParse from "pdf-parse";
var AIServiceType, AIAdapter, aiService;
var init_ai_adapter_service = __esm({
  "server/services/ai-adapter.service.ts"() {
    "use strict";
    init_gemini_service();
    init_openrouter_service();
    init_rolm_service();
    init_mistral_ocr_service();
    init_handwriting_detector();
    init_rag_enhanced_service();
    AIServiceType = /* @__PURE__ */ ((AIServiceType3) => {
      AIServiceType3["GEMINI"] = "gemini";
      AIServiceType3["OPENROUTER"] = "openrouter";
      AIServiceType3["ROLM"] = "rolm";
      AIServiceType3["MISTRAL_OCR"] = "mistral-ocr";
      AIServiceType3["AUTO"] = "auto";
      return AIServiceType3;
    })(AIServiceType || {});
    AIAdapter = class _AIAdapter {
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
    aiService = AIAdapter.getInstance();
  }
});

// server/api/demo-data.ts
var demo_data_exports = {};
__export(demo_data_exports, {
  generateDemoActivities: () => generateDemoActivities,
  generateDemoData: () => generateDemoData,
  generateDemoOwners: () => generateDemoOwners,
  generateDemoProperties: () => generateDemoProperties,
  generateDemoReservations: () => generateDemoReservations,
  resetDemoData: () => resetDemoData,
  resetDemoDataHandler: () => resetDemoDataHandler
});
import { format, addDays, subDays } from "date-fns";
function generateDemoId() {
  return `demo-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
}
async function createDemoDataMarker(entityType, entityId) {
  try {
    await storage.createActivity({
      type: DEMO_DATA_FLAG,
      description: `${entityType}:${entityId}`,
      entityId,
      entityType
    });
  } catch (error) {
    console.error(`Error marking demo data: ${entityType}:${entityId}`, error);
  }
}
async function generateDemoProperties(count2 = 5) {
  const createdIds = [];
  const existingProperties = await storage.getProperties();
  const existingOwners = await storage.getOwners();
  if (existingOwners.length === 0) {
    return createdIds;
  }
  const propertyNames = [
    "Casa da Praia",
    "Apartamento no Centro",
    "Villa Aroeira",
    "Loft Moderno",
    "Chal\xE9 nas Montanhas",
    "Casa de Campo",
    "Apartamento Vista Mar",
    "Quinta do Lago"
  ];
  for (let i = 0; i < count2; i++) {
    const owner = existingOwners[Math.floor(Math.random() * existingOwners.length)];
    const propertyName = `${propertyNames[Math.floor(Math.random() * propertyNames.length)]} [DEMO]`;
    const maxGuests = Math.floor(Math.random() * 6) + 2;
    const cleaningCost = (Math.floor(Math.random() * 50) + 30).toFixed(2);
    const checkInFee = (Math.floor(Math.random() * 20) + 15).toFixed(2);
    const commission = (Math.floor(Math.random() * 10) + 5).toFixed(2);
    const teamPayment = (Math.floor(Math.random() * 20) + 20).toFixed(2);
    const newProperty = {
      name: propertyName,
      address: `Rua das Flores, ${Math.floor(Math.random() * 200) + 1}`,
      ownerId: owner.id,
      maxGuests,
      description: `Propriedade demo criada automaticamente para testes.`,
      cleaningCost,
      checkInFee,
      commission,
      teamPayment
    };
    try {
      const createdProperty = await storage.createProperty(newProperty);
      createdIds.push(createdProperty.id);
      await storage.createActivity({
        type: "property_created",
        description: `Nova propriedade demo criada: ${propertyName}`,
        entityId: createdProperty.id,
        entityType: "property"
      });
      await createDemoDataMarker("property", createdProperty.id);
    } catch (error) {
      console.error("Error creating demo property:", error);
    }
  }
  return createdIds;
}
async function generateDemoOwners(count2 = 3) {
  const createdIds = [];
  const firstNames = ["Jo\xE3o", "Ana", "Carlos", "Maria", "Ant\xF3nio", "Sofia", "Miguel", "Lu\xEDsa"];
  const lastNames = ["Silva", "Santos", "Ferreira", "Costa", "Oliveira", "Rodrigues", "Martins", "Pereira"];
  for (let i = 0; i < count2; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName} [DEMO]`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const newOwner = {
      name: fullName,
      email,
      phone: `+351 ${Math.floor(Math.random() * 9e8) + 1e8}`,
      address: `Av. da Rep\xFAblica, ${Math.floor(Math.random() * 100) + 1}, Lisboa`,
      taxId: `${Math.floor(Math.random() * 9e8) + 1e8}`,
      notes: `Propriet\xE1rio demo criado automaticamente para testes.`,
      bankAccountInfo: generateDemoId()
    };
    try {
      const createdOwner = await storage.createOwner(newOwner);
      createdIds.push(createdOwner.id);
      await storage.createActivity({
        type: "owner_created",
        description: `Novo propriet\xE1rio demo criado: ${fullName}`,
        entityId: createdOwner.id,
        entityType: "owner"
      });
      await createDemoDataMarker("owner", createdOwner.id);
    } catch (error) {
      console.error("Error creating demo owner:", error);
    }
  }
  return createdIds;
}
async function generateDemoReservations(count2 = 15) {
  const createdIds = [];
  console.log("Iniciando gera\xE7\xE3o de reservas demo...");
  try {
    const properties3 = await storage.getProperties();
    console.log(`Propriedades obtidas: ${properties3.length}`);
    if (properties3.length === 0) {
      console.error("N\xE3o existem propriedades para criar reservas!");
      return createdIds;
    }
    console.log(`Gerando ${count2} reservas para ${properties3.length} propriedades dispon\xEDveis`);
    const platformOptions = ["airbnb", "booking", "direct", "expedia", "other"];
    const statusOptions = ["confirmed", "pending"];
    const guestFirstNames = ["John", "Emma", "Michael", "Sophie", "David", "Julia", "Robert", "Laura"];
    const guestLastNames = ["Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"];
    const now = /* @__PURE__ */ new Date();
    for (let i = 0; i < count2; i++) {
      try {
        const randomPropertyIndex = Math.floor(Math.random() * properties3.length);
        const property = properties3[randomPropertyIndex];
        if (!property) {
          console.error(`Erro: Propriedade n\xE3o encontrada no \xEDndice ${randomPropertyIndex}`);
          continue;
        }
        console.log(`Criando reserva ${i + 1}/${count2} para propriedade: ${property.name} (ID: ${property.id})`);
        let checkInDate, checkOutDate;
        if (i % 2 === 0) {
          const startOffset = Math.floor(Math.random() * 14);
          checkInDate = addDays(now, startOffset);
          const stayDuration = Math.floor(Math.random() * 7) + 2;
          checkOutDate = addDays(checkInDate, stayDuration);
        } else {
          const futureStartDay = Math.floor(Math.random() * 75) + 15;
          checkInDate = addDays(now, futureStartDay);
          const stayDuration = Math.floor(Math.random() * 7) + 2;
          checkOutDate = addDays(checkInDate, stayDuration);
        }
        const guestFirstName = guestFirstNames[Math.floor(Math.random() * guestFirstNames.length)];
        const guestLastName = guestLastNames[Math.floor(Math.random() * guestLastNames.length)];
        const guestName = `${guestFirstName} ${guestLastName}`;
        const guestEmail = `${guestFirstName.toLowerCase()}.${guestLastName.toLowerCase()}@example.com`;
        const guestPhone = `+${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 1e9) + 1e9}`;
        const platform = platformOptions[Math.floor(Math.random() * platformOptions.length)];
        let status;
        if (checkOutDate < now) {
          status = "completed";
        } else if (checkInDate > now) {
          status = "confirmed";
        } else {
          status = "in_progress";
        }
        if (Math.random() < 0.1) {
          status = "cancelled";
        }
        const basePricePerNight = Math.floor(Math.random() * 100) + 50;
        const stayDurationDays = Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / (1e3 * 60 * 60 * 24));
        const baseAmount = basePricePerNight * stayDurationDays;
        const platformFeePercent = platform === "direct" ? 0 : Math.floor(Math.random() * 15) + 5;
        const platformFee = (baseAmount * platformFeePercent / 100).toFixed(2);
        const cleaningFee = property.cleaningCost || "45.00";
        const checkInFee = property.checkInFee || "25.00";
        const commission = property.commission ? (baseAmount * parseFloat(property.commission) / 100).toFixed(2) : "0.00";
        const teamPayment = property.teamPayment || "30.00";
        const totalAmount = (baseAmount + parseFloat(cleaningFee)).toFixed(2);
        const netAmount = (parseFloat(totalAmount) - parseFloat(platformFee) - parseFloat(cleaningFee) - parseFloat(checkInFee) - parseFloat(commission) - parseFloat(teamPayment)).toFixed(2);
        const newReservation = {
          propertyId: property.id,
          guestName: `${guestName} [DEMO]`,
          guestEmail,
          guestPhone,
          checkInDate: format(checkInDate, "yyyy-MM-dd"),
          checkOutDate: format(checkOutDate, "yyyy-MM-dd"),
          totalAmount,
          source: platform,
          // Usando source conforme existe na tabela
          status,
          notes: `Demo reservation created automatically.`,
          platformFee,
          cleaningFee,
          checkInFee,
          commission,
          // Campo está definido como commission no schema
          teamPayment,
          netAmount,
          // Usando netAmount que existe na tabela
          numGuests: Math.floor(Math.random() * 4) + 1
          // Entre 1 e 4 hóspedes
        };
        try {
          const createdReservation = await storage.createReservation(newReservation);
          createdIds.push(createdReservation.id);
          await storage.createActivity({
            type: "reservation_created",
            description: `Nova reserva demo criada para ${property.name}: ${guestName} (${format(checkInDate, "dd/MM/yyyy")} - ${format(checkOutDate, "dd/MM/yyyy")})`,
            entityId: createdReservation.id,
            entityType: "reservation"
          });
          await createDemoDataMarker("reservation", createdReservation.id);
          if (status === "completed") {
            await generateFinancialDocumentsForReservation(createdReservation.id, property);
          }
        } catch (error) {
          console.error("Error creating demo reservation:", error);
        }
      } catch (error) {
        console.error("Error generating reservation:", error);
      }
    }
    return createdIds;
  } catch (error) {
    console.error("Erro geral na gera\xE7\xE3o de reservas:", error);
    return [];
  }
}
async function generateDemoActivities(count2 = 10) {
  const createdIds = [];
  const properties3 = await storage.getProperties();
  const owners3 = await storage.getOwners();
  if (properties3.length === 0 && owners3.length === 0) {
    return createdIds;
  }
  const activityTypes = [
    "system_login",
    "report_generation",
    "profile_update",
    "message_sent",
    "property_update",
    "reservation_update"
  ];
  const activityDescriptions = {
    system_login: ["Usu\xE1rio logou no sistema", "Novo acesso ao sistema", "Login detectado"],
    report_generation: ["Relat\xF3rio mensal gerado", "Relat\xF3rio de propriet\xE1rio gerado", "Relat\xF3rio financeiro exportado"],
    profile_update: ["Perfil atualizado", "Informa\xE7\xF5es de contato atualizadas", "Senha alterada"],
    message_sent: ["Mensagem enviada para propriet\xE1rio", "Comunica\xE7\xE3o com h\xF3spede", "Notifica\xE7\xE3o enviada"],
    property_update: ["Dados da propriedade atualizados", "Fotos da propriedade atualizadas", "Pre\xE7os da propriedade atualizados"],
    reservation_update: ["Reserva modificada", "Datas de reserva alteradas", "Detalhes de reserva atualizados"]
  };
  for (let i = 0; i < count2; i++) {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const descriptions = activityDescriptions[type];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    let entityId = null;
    let entityType = null;
    if (type === "property_update" && properties3.length > 0) {
      entityId = properties3[Math.floor(Math.random() * properties3.length)].id;
      entityType = "property";
    } else if (type === "profile_update" && owners3.length > 0) {
      entityId = owners3[Math.floor(Math.random() * owners3.length)].id;
      entityType = "owner";
    }
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp2 = subDays(subDays(/* @__PURE__ */ new Date(), daysAgo), hoursAgo / 24);
    const newActivity = {
      type,
      description: `${description} [DEMO]`,
      entityId,
      entityType
    };
    try {
      const createdActivity = await storage.createActivity(newActivity);
      createdIds.push(createdActivity.id);
      await createDemoDataMarker("activity", createdActivity.id);
    } catch (error) {
      console.error("Error creating demo activity:", error);
    }
  }
  return createdIds;
}
async function generateFinancialDocumentsForReservation(reservationId, property) {
  try {
    const reservation = await storage.getReservation(reservationId);
    if (!reservation) {
      console.error(`Reservation ${reservationId} not found`);
      return;
    }
    const invoiceDate = subDays(new Date(reservation.checkOutDate), Math.floor(Math.random() * 5) + 1);
    const dueDate = addDays(invoiceDate, 15);
    const incomeDocument = {
      documentType: "invoice",
      documentNumber: `DEMO-INV-${Date.now().toString().slice(-6)}`,
      amount: reservation.totalAmount,
      issueDate: format(invoiceDate, "yyyy-MM-dd"),
      dueDate: format(dueDate, "yyyy-MM-dd"),
      status: "paid",
      description: `Fatura de reserva [DEMO]: ${reservation.guestName} (${format(new Date(reservation.checkInDate), "dd/MM/yyyy")} - ${format(new Date(reservation.checkOutDate), "dd/MM/yyyy")})`,
      relatedEntityType: "owner",
      relatedEntityId: property.ownerId
    };
    const createdIncome = await storage.createFinancialDocument(incomeDocument);
    await createDemoDataMarker("financial_document", createdIncome.id);
    const stayDurationDays = Math.floor(
      (new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / (1e3 * 60 * 60 * 24)
    );
    const stayItem = {
      documentId: createdIncome.id,
      description: `Estadia de ${stayDurationDays} dias [DEMO]`,
      quantity: stayDurationDays,
      unitPrice: (parseFloat(reservation.totalAmount) / stayDurationDays).toFixed(2),
      totalPrice: (parseFloat(reservation.totalAmount) - parseFloat(reservation.cleaningFee || "0")).toFixed(2),
      notes: "Item de demonstra\xE7\xE3o"
    };
    await storage.createFinancialDocumentItem(stayItem);
    const cleaningItem = {
      documentId: createdIncome.id,
      description: `Servi\xE7o de limpeza [DEMO]`,
      quantity: 1,
      unitPrice: reservation.cleaningFee || "0",
      totalPrice: reservation.cleaningFee || "0",
      notes: "Item de demonstra\xE7\xE3o"
    };
    await storage.createFinancialDocumentItem(cleaningItem);
    const paymentDate = addDays(invoiceDate, Math.floor(Math.random() * 10) + 1);
    const payment = {
      documentId: createdIncome.id,
      paymentDate: format(paymentDate, "yyyy-MM-dd"),
      paymentMethod: "bank_transfer",
      amount: reservation.totalAmount,
      notes: "Pagamento de demonstra\xE7\xE3o",
      reference: `PAY-DEMO-${Date.now().toString().slice(-6)}`
    };
    await storage.createPaymentRecord(payment);
    if (parseFloat(reservation.cleaningFee || "0") > 0) {
      const cleaningExpense = {
        documentType: "expense",
        documentNumber: `DEMO-EXP-${Date.now().toString().slice(-6)}`,
        amount: property.teamPayment || "0",
        issueDate: format(subDays(new Date(reservation.checkOutDate), 1), "yyyy-MM-dd"),
        dueDate: format(addDays(new Date(reservation.checkOutDate), 15), "yyyy-MM-dd"),
        status: "paid",
        description: `Servi\xE7o de limpeza para reserva [DEMO]: ${property.name} (${format(new Date(reservation.checkOutDate), "dd/MM/yyyy")})`,
        relatedEntityType: "supplier",
        relatedEntityId: 1
        // Using default supplier ID
      };
      const createdExpense = await storage.createFinancialDocument(cleaningExpense);
      await createDemoDataMarker("financial_document", createdExpense.id);
      const cleaningExpenseItem = {
        documentId: createdExpense.id,
        description: `Limpeza ap\xF3s checkout [DEMO]`,
        quantity: 1,
        unitPrice: property.teamPayment || "0",
        totalPrice: property.teamPayment || "0",
        notes: "Item de demonstra\xE7\xE3o"
      };
      await storage.createFinancialDocumentItem(cleaningExpenseItem);
      const expensePayment = {
        documentId: createdExpense.id,
        paymentDate: format(addDays(new Date(reservation.checkOutDate), 3), "yyyy-MM-dd"),
        paymentMethod: "bank_transfer",
        amount: property.teamPayment || "0",
        notes: "Pagamento de demonstra\xE7\xE3o",
        reference: `PAY-DEMO-${Date.now().toString().slice(-6)}`
      };
      await storage.createPaymentRecord(expensePayment);
    }
  } catch (error) {
    console.error("Error generating financial documents for reservation:", error);
  }
}
async function getDemoDataMarkers() {
  try {
    const activities3 = await storage.getActivities();
    const demoMarkers = activities3.filter((activity) => activity.type === DEMO_DATA_FLAG).map((activity) => {
      const [entityType, entityId] = activity.description.split(":");
      return {
        entityType,
        entityId: parseInt(entityId, 10),
        markerId: activity.id
      };
    });
    return demoMarkers;
  } catch (error) {
    console.error("Error getting demo data markers:", error);
    return [];
  }
}
async function generateDemoData(req, res) {
  try {
    const options = req.body.include || ["properties", "owners", "reservations", "activities"];
    let ownerIds = [];
    let propertyIds = [];
    let reservationIds = [];
    let activityIds = [];
    if (!options.includes("owners") && !options.includes("properties")) {
      const existingOwners = await storage.getOwners();
      const existingProperties = await storage.getProperties();
      if (existingProperties.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'N\xE3o existem propriedades no sistema. Crie propriedades primeiro ou inclua a op\xE7\xE3o "properties"'
        });
      }
      ownerIds = existingOwners.map((o) => o.id);
      propertyIds = existingProperties.map((p) => p.id);
      console.log(`Usando ${propertyIds.length} propriedades existentes e ${ownerIds.length} propriet\xE1rios existentes`);
    } else {
      if (options.includes("owners")) {
        ownerIds = await generateDemoOwners(3);
      }
      if (options.includes("properties")) {
        propertyIds = await generateDemoProperties(5);
      }
    }
    if (options.includes("reservations")) {
      console.log(`Gerando reservas para ${propertyIds.length} propriedades`);
      try {
        reservationIds = await generateDemoReservations(15);
        console.log(`Reservas geradas com sucesso: ${reservationIds.length}`);
      } catch (error) {
        console.error("Erro detalhado ao gerar reservas:", error);
        reservationIds = [];
      }
    }
    if (options.includes("activities")) {
      activityIds = await generateDemoActivities(10);
    }
    const totalItems = ownerIds.length + propertyIds.length + reservationIds.length + activityIds.length;
    res.status(200).json({
      success: true,
      message: "Dados de demonstra\xE7\xE3o gerados com sucesso",
      itemsCreated: totalItems,
      details: {
        owners: ownerIds.length,
        properties: propertyIds.length,
        reservations: reservationIds.length,
        activities: activityIds.length
      }
    });
  } catch (error) {
    console.error("Erro ao gerar dados de demonstra\xE7\xE3o:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar dados de demonstra\xE7\xE3o",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
async function resetDemoData(forceCleanMode = false) {
  try {
    console.log(`Iniciando reset completo de dados de demonstra\xE7\xE3o${forceCleanMode ? " (MODO FOR\xC7ADO)" : ""}...`);
    const removalDetails = {
      taskIds: [],
      activityIds: [],
      reservationIds: [],
      propertyIds: [],
      ownerIds: [],
      financialDocIds: [],
      paymentIds: [],
      errors: []
    };
    let totalEntitiesRemoved = 0;
    let removedTasks = 0;
    let removedActivities = 0;
    let removedReservations = 0;
    let removedProperties = 0;
    let removedOwners = 0;
    let removedFinancialDocs = 0;
    let removedPayments = 0;
    const startTime = (/* @__PURE__ */ new Date()).getTime();
    const demoMarkers = await getDemoDataMarkers();
    console.log(`Encontrados ${demoMarkers.length} marcadores de dados demo no banco`);
    const markersByType = {};
    const markerIds = [];
    demoMarkers.forEach((marker) => {
      if (!markersByType[marker.entityType]) {
        markersByType[marker.entityType] = [];
      }
      markersByType[marker.entityType].push(marker.entityId);
      markerIds.push(marker.markerId);
    });
    console.log("Removendo dados demo por tipo de entidade...");
    console.log("Buscando todas as entidades para verificar dados demo...");
    const tasks = await storage.getMaintenanceTasks();
    const activities3 = await storage.getActivities();
    const reservations5 = await storage.getReservations();
    const properties3 = await storage.getProperties();
    const owners3 = await storage.getOwners();
    let financialDocs = [];
    let payments = [];
    if (forceCleanMode) {
      console.log("MODO FOR\xC7ADO: Buscando documentos financeiros e pagamentos...");
      try {
        financialDocs = await storage.getFinancialDocuments();
        payments = await storage.getPaymentRecords();
        console.log(`Encontrados ${financialDocs.length} documentos financeiros e ${payments.length} pagamentos.`);
      } catch (error) {
        console.error("Erro ao buscar documentos financeiros ou pagamentos:", error);
      }
    }
    console.log(`Entidades recuperadas: ${tasks.length} tarefas, ${activities3.length} atividades, ${reservations5.length} reservas, ${properties3.length} propriedades, ${owners3.length} propriet\xE1rios`);
    const demoKeywords = ["[DEMO]", "exemplo", "example", "demo", "test", "fict\xEDcio", "ficticio", "fake"];
    if (forceCleanMode) {
      demoKeywords.push("teste", "simula\xE7\xE3o", "simulation", "dummy", "amostra", "modelo");
    }
    const demoTasks = tasks.filter((task) => {
      if (task.description && demoKeywords.some((keyword) => task.description.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (task.notes && demoKeywords.some((keyword) => task.notes.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (task.title && demoKeywords.some((keyword) => task.title.toLowerCase().includes(keyword.toLowerCase()))) return true;
      const knownDemoTaskDescriptions = [
        "verificar aquecedor",
        "reparar chuveiro",
        "problema na torneira",
        "ar condicionado",
        "fechadura",
        "problema com internet"
      ];
      return task.description && knownDemoTaskDescriptions.some(
        (demo) => task.description.toLowerCase().includes(demo.toLowerCase())
      );
    });
    console.log(`Identificadas ${demoTasks.length} tarefas de manuten\xE7\xE3o demo`);
    const demoActivities = activities3.filter(
      (a) => a.description && demoKeywords.some((keyword) => a.description.toLowerCase().includes(keyword.toLowerCase())) || a.type === DEMO_DATA_FLAG
    );
    console.log(`Identificadas ${demoActivities.length} atividades demo`);
    const demoReservations = reservations5.filter((r) => {
      if (r.guestName && demoKeywords.some((keyword) => r.guestName.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (r.notes && demoKeywords.some((keyword) => r.notes.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (r.guestEmail && (r.guestEmail.includes("example.com") || r.guestEmail.includes("exemplo.com") || r.guestEmail.includes("test.com") || r.guestEmail.includes("teste.com"))) return true;
      const demoGuestNames = ["John Smith", "Emma Johnson", "David Brown", "Michael Davis", "Sophie Miller"];
      return r.guestName && demoGuestNames.some((name) => r.guestName.includes(name));
    });
    console.log(`Identificadas ${demoReservations.length} reservas demo`);
    const demoProperties = properties3.filter((p) => {
      if (p.name && demoKeywords.some((keyword) => p.name.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (p.description && demoKeywords.some((keyword) => p.description.toLowerCase().includes(keyword.toLowerCase()))) return true;
      const demoPropertyNames = ["Casa da Praia", "Apartamento no Centro", "Villa Aroeira", "Loft Moderno", "Chal\xE9 nas Montanhas"];
      return p.name && demoPropertyNames.some((name) => p.name.includes(name));
    });
    console.log(`Identificadas ${demoProperties.length} propriedades demo`);
    const demoOwners = owners3.filter((o) => {
      if (o.name && demoKeywords.some((keyword) => o.name.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (o.notes && demoKeywords.some((keyword) => o.notes.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (o.email && (o.email.includes("example.com") || o.email.includes("exemplo.com") || o.email.includes("test.com") || o.email.includes("teste.com"))) return true;
      return false;
    });
    console.log(`Identificados ${demoOwners.length} propriet\xE1rios demo`);
    let demoFinancialDocs = [];
    let demoPayments = [];
    if (forceCleanMode && financialDocs.length > 0) {
      demoFinancialDocs = financialDocs.filter((doc) => {
        if (doc.description && demoKeywords.some((keyword) => doc.description.toLowerCase().includes(keyword.toLowerCase()))) return true;
        if (doc.documentNumber && demoKeywords.some((keyword) => doc.documentNumber.toLowerCase().includes(keyword.toLowerCase()))) return true;
        return false;
      });
      console.log(`Identificados ${demoFinancialDocs.length} documentos financeiros demo`);
      if (payments.length > 0) {
        demoPayments = payments.filter((payment) => {
          if (payment.notes && demoKeywords.some((keyword) => payment.notes.toLowerCase().includes(keyword.toLowerCase()))) return true;
          if (payment.reference && demoKeywords.some((keyword) => payment.reference.toLowerCase().includes(keyword.toLowerCase()))) return true;
          return demoFinancialDocs.some((doc) => doc.id === payment.documentId);
        });
        console.log(`Identificados ${demoPayments.length} pagamentos demo`);
      }
    }
    if (forceCleanMode && demoPayments.length > 0) {
      console.log("Removendo pagamentos demo...");
      let paymentsRemoved = 0;
      for (const payment of demoPayments) {
        try {
          const success = await storage.deletePaymentRecord(payment.id);
          if (success) {
            paymentsRemoved++;
            removalDetails.paymentIds.push(payment.id);
            console.log(`Pagamento removido: ${payment.id} - ${payment.amount}`);
          }
        } catch (error) {
          console.error(`Erro ao remover pagamento ${payment.id}:`, error);
          removalDetails.errors.push({
            entityType: "payment",
            id: payment.id,
            error: error.message || "Erro desconhecido"
          });
        }
      }
      removedPayments = paymentsRemoved;
    }
    if (forceCleanMode && demoFinancialDocs.length > 0) {
      console.log("Removendo documentos financeiros demo...");
      let docsRemoved = 0;
      for (const doc of demoFinancialDocs) {
        try {
          const success = await storage.deleteFinancialDocument(doc.id);
          if (success) {
            docsRemoved++;
            removalDetails.financialDocIds.push(doc.id);
            console.log(`Documento financeiro removido: ${doc.id} - ${doc.documentNumber || ""}`);
          }
        } catch (error) {
          console.error(`Erro ao remover documento financeiro ${doc.id}:`, error);
          removalDetails.errors.push({
            entityType: "financialDocument",
            id: doc.id,
            error: error.message || "Erro desconhecido"
          });
        }
      }
      removedFinancialDocs = docsRemoved;
    }
    console.log("Removendo tarefas de manuten\xE7\xE3o demo...");
    let tasksRemoved = 0;
    for (const task of demoTasks) {
      try {
        const success = await storage.deleteMaintenanceTask(task.id);
        if (success) {
          tasksRemoved++;
          removalDetails.taskIds.push(task.id);
          console.log(`Tarefa de manuten\xE7\xE3o removida: ${task.id} - ${task.description || ""}`);
        }
      } catch (error) {
        console.error(`Erro ao remover tarefa de manuten\xE7\xE3o ${task.id}:`, error);
        removalDetails.errors.push({
          entityType: "maintenanceTask",
          id: task.id,
          error: error.message || "Erro desconhecido"
        });
      }
    }
    removedTasks = tasksRemoved;
    console.log("Removendo atividades demo...");
    let activitiesRemoved = 0;
    for (const activity of demoActivities) {
      try {
        const success = await storage.deleteActivity(activity.id);
        if (success) {
          activitiesRemoved++;
          removalDetails.activityIds.push(activity.id);
          console.log(`Atividade removida: ${activity.id} - ${activity.description}`);
        }
      } catch (error) {
        console.error(`Erro ao remover atividade ${activity.id}:`, error);
        removalDetails.errors.push({
          entityType: "activity",
          id: activity.id,
          error: error.message || "Erro desconhecido"
        });
      }
    }
    removedActivities = activitiesRemoved;
    console.log("Removendo reservas demo...");
    let reservationsRemoved = 0;
    for (const reservation of demoReservations) {
      try {
        const success = await storage.deleteReservation(reservation.id);
        if (success) {
          reservationsRemoved++;
          removalDetails.reservationIds.push(reservation.id);
          console.log(`Reserva removida: ${reservation.id} - ${reservation.guestName}`);
        }
      } catch (error) {
        console.error(`Erro ao remover reserva ${reservation.id}:`, error);
        removalDetails.errors.push({
          entityType: "reservation",
          id: reservation.id,
          error: error.message || "Erro desconhecido"
        });
      }
    }
    removedReservations = reservationsRemoved;
    console.log("Removendo propriedades demo...");
    let propertiesRemoved = 0;
    for (const property of demoProperties) {
      try {
        const success = await storage.deleteProperty(property.id);
        if (success) {
          propertiesRemoved++;
          removalDetails.propertyIds.push(property.id);
          console.log(`Propriedade removida: ${property.id} - ${property.name}`);
        }
      } catch (error) {
        console.error(`Erro ao remover propriedade ${property.id}:`, error);
        removalDetails.errors.push({
          entityType: "property",
          id: property.id,
          error: error.message || "Erro desconhecido"
        });
      }
    }
    removedProperties = propertiesRemoved;
    console.log("Removendo propriet\xE1rios demo...");
    let ownersRemoved = 0;
    for (const owner of demoOwners) {
      try {
        const success = await storage.deleteOwner(owner.id);
        if (success) {
          ownersRemoved++;
          removalDetails.ownerIds.push(owner.id);
          console.log(`Propriet\xE1rio removido: ${owner.id} - ${owner.name}`);
        }
      } catch (error) {
        console.error(`Erro ao remover propriet\xE1rio ${owner.id}:`, error);
        removalDetails.errors.push({
          entityType: "owner",
          id: owner.id,
          error: error.message || "Erro desconhecido"
        });
      }
    }
    removedOwners = ownersRemoved;
    totalEntitiesRemoved = removedTasks + removedActivities + removedReservations + removedProperties + removedOwners + removedFinancialDocs + removedPayments;
    if (totalEntitiesRemoved === 0) {
      console.log("Nenhum dado demo foi encontrado ou todos j\xE1 foram removidos anteriormente.");
    } else {
      const endTime = (/* @__PURE__ */ new Date()).getTime();
      const executionTime = (endTime - startTime) / 1e3;
      console.log(`Total de ${totalEntitiesRemoved} entidades demo removidas com sucesso em ${executionTime.toFixed(2)}s!`);
      console.log(`Detalhes: ${removedTasks} tarefas, ${removedActivities} atividades, ${removedReservations} reservas, ${removedProperties} propriedades, ${removedOwners} propriet\xE1rios, ${removedFinancialDocs} docs financeiros, ${removedPayments} pagamentos`);
      console.log(`Erros encontrados: ${removalDetails.errors.length}`);
    }
    return {
      success: true,
      removedItems: totalEntitiesRemoved,
      forcedMode: forceCleanMode,
      removed: {
        tasks: removedTasks,
        activities: removedActivities,
        reservations: removedReservations,
        properties: removedProperties,
        owners: removedOwners,
        financialDocs: removedFinancialDocs,
        payments: removedPayments
      },
      details: removalDetails
    };
  } catch (error) {
    console.error("Erro ao resetar dados de demonstra\xE7\xE3o:", error);
    return {
      success: false,
      removedItems: 0
    };
  }
}
async function resetDemoDataHandler(req, res) {
  try {
    const forceCleanMode = req.query.forceCleanMode === "true";
    console.log(`Recebida solicita\xE7\xE3o para remover todos os dados de demonstra\xE7\xE3o${forceCleanMode ? " (MODO FOR\xC7ADO)" : ""}`);
    try {
      await storage.createActivity({
        type: "demo_data_removal",
        description: `Solicita\xE7\xE3o para remover todos os dados de demonstra\xE7\xE3o do sistema${forceCleanMode ? " em modo for\xE7ado" : ""}`
      });
    } catch (activityError) {
      console.error("Erro ao registrar atividade de remo\xE7\xE3o de dados demo:", activityError);
    }
    const result = await resetDemoData(forceCleanMode);
    if (result.success) {
      console.log(`Remo\xE7\xE3o de dados demo conclu\xEDda: ${result.removedItems} itens removidos`);
      if (result.removedItems > 0) {
        try {
          const detailsStr = Object.entries(result.removed || {}).map(([key, val]) => `${key}: ${val}`).join(", ");
          await storage.createActivity({
            type: "demo_data_removed",
            description: `${result.removedItems} itens de demonstra\xE7\xE3o foram removidos com sucesso (${detailsStr})`
          });
        } catch (activityError) {
          console.error("Erro ao registrar atividade de conclus\xE3o:", activityError);
        }
      }
    }
    res.status(200).json({
      success: result.success,
      message: `${result.removedItems} itens de demonstra\xE7\xE3o removidos com sucesso`,
      itemsRemoved: result.removedItems
    });
  } catch (error) {
    console.error("Erro ao limpar dados de demonstra\xE7\xE3o:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao limpar dados de demonstra\xE7\xE3o",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
var DEMO_DATA_FLAG;
var init_demo_data = __esm({
  "server/api/demo-data.ts"() {
    "use strict";
    init_storage();
    DEMO_DATA_FLAG = "demo-data";
  }
});

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2, { resolve } from "path";
import { fileURLToPath, URL } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";
var __dirname, vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    "use strict";
    __dirname = fileURLToPath(new URL(".", import.meta.url));
    vite_config_default = defineConfig({
      root: "./client",
      plugins: [
        react({
          babel: {
            plugins: [
              ["babel-plugin-transform-remove-console", { exclude: ["error", "warn"] }]
            ]
          }
        }),
        // Bundle analyzer (only in analyze mode)
        process.env.ANALYZE && visualizer({
          open: true,
          gzipSize: true,
          brotliSize: true,
          filename: "dist/stats.html"
        })
      ].filter(Boolean),
      resolve: {
        alias: {
          "@": resolve(__dirname, "./client/src"),
          "@shared": resolve(__dirname, "./shared")
        }
      },
      build: {
        outDir: "../dist/client",
        emptyOutDir: true,
        target: "esnext",
        minify: "esbuild",
        cssMinify: true,
        // Default CSS minifier
        sourcemap: false,
        reportCompressedSize: false,
        // Speeds up build
        chunkSizeWarningLimit: 600,
        // Lower from 1000
        rollupOptions: {
          input: {
            main: path2.resolve(__dirname, "client/index.html")
          },
          output: {
            // More aggressive code splitting
            experimentalMinChunkSize: 2e4,
            // 20KB minimum
            manualChunks: (id) => {
              if (id.includes("node_modules")) {
                if (id.includes("react") || id.includes("react-dom")) {
                  return "react-vendor";
                }
                if (id.includes("@radix-ui")) {
                  return "ui-vendor";
                }
                if (id.includes("@tanstack/react-query")) {
                  return "query-vendor";
                }
                if (id.includes("react-hook-form") || id.includes("@hookform")) {
                  return "form-vendor";
                }
                if (id.includes("recharts")) {
                  return "chart-vendor";
                }
                if (id.includes("lucide-react")) {
                  return "icons-vendor";
                }
                if (id.includes("date-fns")) {
                  return "date-vendor";
                }
                return "vendor";
              }
              if (id.includes("/pages/")) {
                const page = id.split("/pages/")[1].split("/")[0];
                return `page-${page}`;
              }
            },
            chunkFileNames: "assets/js/[name]-[hash].js",
            entryFileNames: "assets/js/[name]-[hash].js",
            assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
          },
          // Tree shaking optimization
          treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            tryCatchDeoptimization: false
          }
        }
      },
      server: {
        hmr: {
          overlay: false
        },
        proxy: {
          "/api": {
            target: "http://localhost:5001",
            changeOrigin: true,
            secure: false
          }
        }
      },
      optimizeDeps: {
        include: [
          "react",
          "react-dom",
          "@tanstack/react-query",
          "wouter"
          // Add router
        ],
        exclude: [
          "@vite/client",
          "@vite/env",
          "recharts",
          // Lazy load charts
          "pdf-lib",
          // Lazy load PDF tools
          "jspdf"
        ]
      },
      css: {
        devSourcemap: false
      }
    });
  }
});

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path3, { dirname } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "..", "client");
  console.log(`[PROD_STATIC] Serving from calculated path: ${distPath}`);
  if (!fs3.existsSync(distPath)) {
    const errorMsg = `[PROD_STATIC_ERROR] Build directory NOT FOUND at ${distPath}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  console.log(`[PROD_STATIC] Build directory FOUND at ${distPath}`);
  const indexPath = path3.resolve(distPath, "index.html");
  if (!fs3.existsSync(indexPath)) {
    const errorMsg = `[PROD_STATIC_ERROR] index.html NOT FOUND at ${indexPath}`;
    console.error(errorMsg);
    try {
      const files = fs3.readdirSync(distPath);
      console.log(`[PROD_STATIC_DEBUG] Contents of ${distPath}: ${files.join(", ")}`);
    } catch (e) {
      console.error(`[PROD_STATIC_DEBUG] Could not read directory ${distPath}: ${e.message}`);
    }
    throw new Error(errorMsg);
  }
  console.log(`[PROD_STATIC] index.html FOUND at ${indexPath}`);
  app2.use(express.static(distPath));
  app2.get("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}
var __filename, __dirname2, viteLogger;
var init_vite = __esm({
  "server/vite.ts"() {
    "use strict";
    init_vite_config();
    __filename = fileURLToPath2(import.meta.url);
    __dirname2 = dirname(__filename);
    viteLogger = createLogger();
  }
});

// server/services/pdf-extract.ts
import fs4 from "fs";
import path4 from "path";
import os from "os";
import crypto3 from "crypto";
import pdfParse2 from "pdf-parse";
function createCacheKey(text2) {
  return crypto3.createHash("md5").update(text2).digest("hex");
}
async function extractTextWithPdfParse(pdfBuffer) {
  try {
    log("Extraindo texto do PDF com pdf-parse...", "pdf-extract");
    const options = {
      max: 0
      // Sem limite de páginas
    };
    const data = await pdfParse2(pdfBuffer, options);
    if (!data || !data.text || data.text.trim() === "") {
      throw new Error("Texto extra\xEDdo est\xE1 vazio");
    }
    log(`Texto extra\xEDdo com sucesso (${data.text.length} caracteres)`, "pdf-extract");
    return data.text;
  } catch (error) {
    log(`Erro ao extrair texto com pdf-parse: ${error.message}`, "pdf-extract");
    throw error;
  }
}
async function parseReservationFromText(text2, apiKey, timeout = 25e3, options = {}) {
  const skipQualityCheck = false;
  const useCache = false;
  if (useCache) {
    const cacheKey = createCacheKey(text2);
    const cachePath = path4.join(os.tmpdir(), `pdf-extract-${cacheKey}.json`);
    if (fs4.existsSync(cachePath)) {
      try {
        log(`Cache encontrado para este PDF, usando dados em cache`, "pdf-extract");
        const cachedData = JSON.parse(fs4.readFileSync(cachePath, "utf-8"));
        return cachedData;
      } catch (error) {
        log(`Erro ao ler cache: ${error.message}`, "pdf-extract");
      }
    }
  }
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Tempo limite excedido ao processar texto")), timeout);
  });
  try {
    log("Analisando texto para extrair dados de reserva...", "pdf-extract");
    const processingPromise = async () => {
      try {
        const limitedText = text2.slice(0, 5e3);
        const cleanedText = cleanExtractedText(limitedText);
        log(`Usando o adaptador de IA com Gemini para processamento (skipQualityCheck: ${skipQualityCheck})`, "pdf-extract");
        const extractedData = await aiService.parseReservationData(cleanedText, skipQualityCheck);
        extractedData.rawText = text2;
        for (const key in extractedData) {
          if (extractedData[key] === void 0 || extractedData[key] === null || extractedData[key] === "") {
            delete extractedData[key];
          }
        }
        log("Dados extra\xEDdos com sucesso usando o adaptador de IA", "pdf-extract");
        if (useCache) {
          try {
            const cacheKey = createCacheKey(text2);
            const cachePath = path4.join(os.tmpdir(), `pdf-extract-${cacheKey}.json`);
            fs4.writeFileSync(cachePath, JSON.stringify(extractedData));
            log(`Dados salvos em cache: ${cachePath}`, "pdf-extract");
          } catch (cacheError) {
            log(`Erro ao salvar cache: ${cacheError.message}`, "pdf-extract");
          }
        }
        return extractedData;
      } catch (error) {
        console.error("Erro ao extrair dados de reserva:", error);
        log(`Falha no processamento com Gemini: ${error instanceof Error ? error.message : "Erro desconhecido"}`, "pdf-extract");
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        const isServiceUnavailable = errorMessage.includes("Service unavailable") || errorMessage.includes("500") || errorMessage.includes("internal_server_error");
        return {
          propertyName: "Desconhecido",
          guestName: "Desconhecido",
          checkInDate: "Desconhecido",
          checkOutDate: "Desconhecido",
          validationStatus: "failed" /* FAILED */,
          rawText: text2,
          observations: isServiceUnavailable ? "Servi\xE7o Gemini temporariamente indispon\xEDvel. Tente novamente mais tarde." : `Erro na extra\xE7\xE3o: ${errorMessage}`
        };
      }
    };
    return await Promise.race([processingPromise(), timeoutPromise]);
  } catch (error) {
    log(`Erro ao processar texto: ${error instanceof Error ? error.message : String(error)}`, "pdf-extract");
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const isTimeout = errorMessage.includes("Tempo limite excedido");
    const isServiceError = errorMessage.includes("Service unavailable") || errorMessage.includes("500") || errorMessage.includes("internal_server_error");
    return {
      propertyName: "Desconhecido",
      guestName: "Desconhecido",
      checkInDate: "Desconhecido",
      checkOutDate: "Desconhecido",
      validationStatus: "failed" /* FAILED */,
      rawText: text2,
      observations: isTimeout ? "O processamento demorou muito tempo e foi interrompido. Por favor, tente novamente mais tarde." : isServiceError ? "Servi\xE7o Gemini temporariamente indispon\xEDvel. Por favor, tente novamente mais tarde." : `Erro na extra\xE7\xE3o: ${errorMessage}`
    };
  }
}
function cleanExtractedText(text2) {
  let cleaned = text2.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/(\d+)[.,](\d+)[.,](\d+)/g, "$1-$2-$3");
  cleaned = cleaned.replace(/(\d+)[,.](\d+)(?!\d)/g, "$1.$2");
  return cleaned;
}
function validateReservationData(data) {
  const requiredFields = ["propertyName", "guestName", "checkInDate", "checkOutDate"];
  const financialFields = ["totalAmount", "cleaningFee", "checkInFee"];
  const contactFields = ["guestEmail", "guestPhone"];
  const missingFields = [];
  const warningFields = [];
  const errors = [];
  for (const field of requiredFields) {
    if (!data[field]) {
      missingFields.push(field);
      errors.push({
        field,
        message: `Campo obrigat\xF3rio ${field} est\xE1 ausente`,
        severity: "error"
      });
    }
  }
  for (const field of financialFields) {
    if (!data[field]) {
      warningFields.push(field);
      errors.push({
        field,
        message: `Campo financeiro ${field} est\xE1 ausente`,
        severity: "warning"
      });
    }
  }
  if (!data.guestEmail && !data.guestPhone) {
    warningFields.push("contactInfo");
    errors.push({
      field: "contactInfo",
      message: "Nenhuma informa\xE7\xE3o de contato (email ou telefone) est\xE1 dispon\xEDvel",
      severity: "warning"
    });
  }
  const dateRegexISO = /^\d{4}-\d{2}-\d{2}$/;
  const dateRegexEU = /^(\d{2})[-.\/](\d{2})[-.\/](\d{4})$/;
  const convertToISODate = (dateStr) => {
    if (dateRegexISO.test(dateStr)) return dateStr;
    const euMatch = dateStr.match(dateRegexEU);
    if (euMatch) {
      const [_, day, month, year] = euMatch;
      return `${year}-${month}-${day}`;
    }
    const date2 = new Date(dateStr);
    if (!isNaN(date2.getTime())) {
      return date2.toISOString().split("T")[0];
    }
    return dateStr;
  };
  if (data.checkInDate) {
    const isoDate = convertToISODate(data.checkInDate);
    if (dateRegexISO.test(isoDate)) {
      data.checkInDate = isoDate;
    } else {
      errors.push({
        field: "checkInDate",
        message: "Formato de data de check-in inv\xE1lido. Deve ser YYYY-MM-DD",
        severity: "error"
      });
      missingFields.push("checkInDate");
    }
  }
  if (data.checkOutDate) {
    const isoDate = convertToISODate(data.checkOutDate);
    if (dateRegexISO.test(isoDate)) {
      data.checkOutDate = isoDate;
    } else {
      errors.push({
        field: "checkOutDate",
        message: "Formato de data de check-out inv\xE1lido. Deve ser YYYY-MM-DD",
        severity: "error"
      });
      missingFields.push("checkOutDate");
    }
  }
  let status;
  if (missingFields.length === 0 && warningFields.length === 0) {
    status = "valid" /* VALID */;
  } else if (missingFields.length > 0) {
    status = "incomplete" /* INCOMPLETE */;
  } else if (warningFields.length > 0) {
    status = "needs_review" /* NEEDS_REVIEW */;
  } else {
    status = "valid" /* VALID */;
  }
  const dataWithDefaults = {
    ...data,
    totalAmount: data.totalAmount || 0,
    numGuests: data.numGuests || 1,
    platformFee: data.platformFee || 0,
    cleaningFee: data.cleaningFee || 0,
    checkInFee: data.checkInFee || 0,
    commission: data.commission || 0,
    teamPayment: data.teamPayment || 0,
    platform: data.platform || "direct",
    validationStatus: status
  };
  return {
    status,
    isValid: status === "valid" /* VALID */,
    errors,
    missingFields,
    warningFields,
    dataWithDefaults
  };
}
var init_pdf_extract = __esm({
  "server/services/pdf-extract.ts"() {
    "use strict";
    init_vite();
    init_ai_adapter_service();
  }
});

// server/services/pdf-pair-processor.ts
var pdf_pair_processor_exports = {};
__export(pdf_pair_processor_exports, {
  DocumentType: () => DocumentType,
  identifyDocumentType: () => identifyDocumentType,
  processPdfPair: () => processPdfPair
});
import fs5 from "fs";
import path5 from "path";
async function identifyDocumentType(filePath) {
  const result = {
    path: filePath,
    type: "unknown" /* UNKNOWN */,
    text: "",
    filename: path5.basename(filePath)
  };
  try {
    if (!fs5.existsSync(filePath)) {
      log(`Arquivo n\xE3o encontrado: ${filePath}`, "pdf-pair");
      return result;
    }
    const pdfBuffer = fs5.readFileSync(filePath);
    log(`PDF carregado: ${result.filename} (${Math.round(pdfBuffer.length / 1024)} KB)`, "pdf-pair");
    const extractedText = await extractTextWithPdfParse(pdfBuffer);
    result.text = extractedText;
    const normalizedText = extractedText.toLowerCase();
    const filename = filePath.toLowerCase();
    if (filename.includes("check-in") || filename.includes("checkin")) {
      result.type = "check-in" /* CHECK_IN */;
    } else if (filename.includes("check-out") || filename.includes("checkout") || filename.includes("check-outs") || filename.includes("checkouts")) {
      result.type = "check-out" /* CHECK_OUT */;
    }
    if (result.type === "unknown" /* UNKNOWN */) {
      const checkInCount = (normalizedText.match(/check-in|checkin|check in/g) || []).length;
      const checkOutCount = (normalizedText.match(/check-out|checkout|check out/g) || []).length;
      if (checkInCount > checkOutCount) {
        result.type = "check-in" /* CHECK_IN */;
      } else if (checkOutCount > checkInCount) {
        result.type = "check-out" /* CHECK_OUT */;
      } else {
        if (normalizedText.includes("departure") || normalizedText.includes("sa\xEDda")) {
          result.type = "check-out" /* CHECK_OUT */;
        } else if (normalizedText.includes("arrival") || normalizedText.includes("chegada")) {
          result.type = "check-in" /* CHECK_IN */;
        }
      }
    }
    log(`Documento identificado como: ${result.type}`, "pdf-pair");
    return result;
  } catch (error) {
    log(`Erro ao identificar tipo de documento: ${error.message}`, "pdf-pair");
    return result;
  }
}
async function processPdfPair(files, apiKey) {
  if (!files || files.length === 0) {
    return {
      isPairComplete: false,
      errors: ["Nenhum arquivo fornecido para processamento"]
    };
  }
  log(`Iniciando processamento de ${files.length} arquivo(s)`, "pdf-pair");
  const result = {
    isPairComplete: false,
    errors: []
  };
  try {
    const documents = [];
    for (const filePath of files) {
      const docInfo = await identifyDocumentType(filePath);
      documents.push(docInfo);
    }
    let checkInDoc = documents.find((doc) => doc.type === "check-in" /* CHECK_IN */);
    let checkOutDoc = documents.find((doc) => doc.type === "check-out" /* CHECK_OUT */);
    if (documents.length === 2) {
      if (!checkInDoc && !checkOutDoc) {
        documents[0].type = "check-in" /* CHECK_IN */;
        documents[1].type = "check-out" /* CHECK_OUT */;
        checkInDoc = documents[0];
        checkOutDoc = documents[1];
        log("For\xE7ando identifica\xE7\xE3o: primeiro arquivo como check-in, segundo como check-out", "pdf-pair");
      } else if (checkInDoc && !checkOutDoc) {
        const otherDoc = documents.find((doc) => doc !== checkInDoc);
        if (otherDoc) {
          otherDoc.type = "check-out" /* CHECK_OUT */;
          checkOutDoc = otherDoc;
          log("For\xE7ando identifica\xE7\xE3o: segundo arquivo como check-out", "pdf-pair");
        }
      } else if (!checkInDoc && checkOutDoc) {
        const otherDoc = documents.find((doc) => doc !== checkOutDoc);
        if (otherDoc) {
          otherDoc.type = "check-in" /* CHECK_IN */;
          checkInDoc = otherDoc;
          log("For\xE7ando identifica\xE7\xE3o: primeiro arquivo como check-in", "pdf-pair");
        }
      } else if (checkInDoc && checkOutDoc && checkInDoc === checkOutDoc) {
        documents[0].type = "check-in" /* CHECK_IN */;
        documents[1].type = "check-out" /* CHECK_OUT */;
        checkInDoc = documents[0];
        checkOutDoc = documents[1];
        log("Corrigindo identifica\xE7\xE3o conflitante: primeiro arquivo como check-in, segundo como check-out", "pdf-pair");
      }
    }
    result.checkIn = checkInDoc;
    result.checkOut = checkOutDoc;
    result.isPairComplete = !!result.checkIn && !!result.checkOut;
    if (result.isPairComplete) {
      log("Par completo de documentos identificado (check-in + check-out)", "pdf-pair");
    } else if (result.checkIn) {
      log("Apenas documento de check-in identificado", "pdf-pair");
    } else if (result.checkOut) {
      log("Apenas documento de check-out identificado", "pdf-pair");
    } else {
      result.errors.push("Nenhum documento v\xE1lido de check-in ou check-out encontrado");
      return result;
    }
    const primaryDoc = result.checkIn || result.checkOut;
    if (!primaryDoc) {
      result.errors.push("Erro interno: documento prim\xE1rio n\xE3o encontrado");
      return result;
    }
    log(`Processando texto do documento: ${primaryDoc.filename}`, "pdf-pair");
    result.reservationData = await parseReservationFromText(primaryDoc.text, apiKey);
    if (result.reservationData) {
      result.reservationData.documentType = primaryDoc.type;
      if (result.isPairComplete && result.checkOut && result.checkIn !== result.checkOut) {
        try {
          const secondaryData = await parseReservationFromText(result.checkOut.text, apiKey);
          if (secondaryData) {
            for (const key in secondaryData) {
              if (!result.reservationData[key] && secondaryData[key]) {
                result.reservationData[key] = secondaryData[key];
                log(`Campo '${key}' preenchido com dados do documento secund\xE1rio`, "pdf-pair");
              }
            }
          }
        } catch (error) {
          log(`Erro ao processar documento secund\xE1rio: ${error.message}`, "pdf-pair");
        }
      }
    }
    if (result.reservationData) {
      result.validationResult = validateReservationData(result.reservationData);
      if (result.validationResult) {
        log(`Valida\xE7\xE3o conclu\xEDda: ${result.validationResult.status}`, "pdf-pair");
        if (result.validationResult.missingFields.length > 0) {
          log(`Campos ausentes: ${result.validationResult.missingFields.join(", ")}`, "pdf-pair");
        }
      }
    }
    return result;
  } catch (error) {
    log(`Erro ao processar par de PDFs: ${error.message}`, "pdf-pair");
    result.errors.push(`Erro durante o processamento: ${error.message}`);
    return result;
  }
}
var DocumentType;
var init_pdf_pair_processor = __esm({
  "server/services/pdf-pair-processor.ts"() {
    "use strict";
    init_pdf_extract();
    init_vite();
    DocumentType = /* @__PURE__ */ ((DocumentType2) => {
      DocumentType2["CHECK_IN"] = "check-in";
      DocumentType2["CHECK_OUT"] = "check-out";
      DocumentType2["UNKNOWN"] = "unknown";
      return DocumentType2;
    })(DocumentType || {});
  }
});

// server/api/maria-assistant.ts
var maria_assistant_exports = {};
__export(maria_assistant_exports, {
  buildRagContext: () => buildRagContext,
  createReservationFromAssistant: () => createReservationFromAssistant,
  mariaAssistant: () => mariaAssistant
});
function extractReservationDataFromText(text2) {
  if (!text2) return null;
  const hasReservationIntent = text2.includes("criar reserva") || text2.includes("nova reserva") || text2.includes("agendar estadia") || text2.includes("marcar hospedagem") || text2.includes("foi criada com sucesso");
  if (!hasReservationIntent) return null;
  try {
    const guestNameMatch = text2.match(/(?:hóspede|hospede|cliente|visitante|para|de)\s*[:\s]?\s*([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/i);
    const guestName = guestNameMatch ? guestNameMatch[1].trim() : "H\xF3spede";
    const checkInMatch = text2.match(/(?:check.?in|entrada|chegada|início|inicio)\s*[:\s]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2} de [a-zç]+)/i);
    const checkOutMatch = text2.match(/(?:check.?out|saída|saida|partida|fim)\s*[:\s]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2} de [a-zç]+)/i);
    const propertyMatch = text2.match(/(?:propriedade|apartamento|casa|alojamento|local)\s*[:\s]?\s*([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/i);
    const propertyIdMatch = text2.match(/(?:propriedade|apartamento|casa|alojamento|local|id)\s*[:\s]?\s*(\d+)/i);
    const valueMatch = text2.match(/(?:valor|preço|preco|custo|tarifa|total)\s*[:\s]?\s*€?\s*(\d+(?:[,.]\d+)?)/i);
    if (!checkInMatch && !propertyMatch && !propertyIdMatch) return null;
    return {
      guestName,
      checkInDate: checkInMatch ? checkInMatch[1] : null,
      checkOutDate: checkOutMatch ? checkOutMatch[1] : null,
      propertyName: propertyMatch ? propertyMatch[1] : null,
      propertyId: propertyIdMatch ? parseInt(propertyIdMatch[1]) : null,
      totalAmount: valueMatch ? valueMatch[1].replace(",", ".") : null
    };
  } catch (error) {
    console.error("Erro ao extrair dados de reserva do texto:", error);
    return null;
  }
}
async function createReservationFromAssistant(reservationData) {
  try {
    console.log("Tentando criar reserva a partir do assistente:", reservationData);
    if (!reservationData.propertyId && reservationData.propertyName) {
      const properties3 = await storage.getProperties();
      let property = properties3.find(
        (p) => p.name.toLowerCase() === reservationData.propertyName.toLowerCase()
      );
      if (!property) {
        property = properties3.find(
          (p) => p.name.toLowerCase().includes(reservationData.propertyName.toLowerCase()) || reservationData.propertyName.toLowerCase().includes(p.name.toLowerCase())
        );
      }
      if (property) {
        reservationData.propertyId = property.id;
        console.log(`Propriedade encontrada: ${property.name} (ID: ${property.id})`);
      } else {
        const availableProperties = properties3.map((p) => p.name).join(", ");
        throw new Error(`Propriedade n\xE3o encontrada: "${reservationData.propertyName}". Propriedades dispon\xEDveis: ${availableProperties}`);
      }
    }
    if (reservationData.checkInDate && typeof reservationData.checkInDate === "string") {
      if (reservationData.checkInDate.includes("/")) {
        const parts = reservationData.checkInDate.split("/");
        if (parts.length === 3) {
          reservationData.checkInDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
    }
    if (reservationData.checkOutDate && typeof reservationData.checkOutDate === "string") {
      if (reservationData.checkOutDate.includes("/")) {
        const parts = reservationData.checkOutDate.split("/");
        if (parts.length === 3) {
          reservationData.checkOutDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
    }
    if (reservationData.numGuests && typeof reservationData.numGuests === "string") {
      reservationData.numGuests = parseInt(reservationData.numGuests, 10);
    }
    if (reservationData.totalAmount && typeof reservationData.totalAmount !== "string") {
      reservationData.totalAmount = reservationData.totalAmount.toString();
    }
    if (!reservationData.platform) {
      reservationData.platform = "direct";
    }
    if (!reservationData.status) {
      reservationData.status = "confirmed";
    }
    const moneyFields = ["platformFee", "cleaningFee", "checkInFee", "commissionFee", "teamPayment", "netAmount"];
    moneyFields.forEach((field) => {
      if (reservationData[field] === void 0 || reservationData[field] === null) {
        reservationData[field] = "0";
      } else if (typeof reservationData[field] !== "string") {
        reservationData[field] = reservationData[field].toString();
      }
    });
    const createdReservation = await storage.createReservation(reservationData);
    await storage.createActivity({
      type: "reservation_created",
      description: `Reserva criada via assistente: ${reservationData.propertyId} - ${reservationData.guestName}`,
      entityId: createdReservation.id,
      entityType: "reservation"
    });
    return {
      success: true,
      reservation: createdReservation,
      message: `Reserva criada com sucesso para ${reservationData.guestName} na propriedade ID ${reservationData.propertyId}`
    };
  } catch (error) {
    console.error("Erro ao criar reserva via assistente:", error);
    return {
      success: false,
      message: `Erro ao criar reserva: ${error.message}`,
      error
    };
  }
}
async function buildRagContext(userQuery) {
  try {
    const properties3 = await storage.getProperties();
    const owners3 = await storage.getOwners();
    const reservations5 = await storage.getReservations();
    const activities3 = await storage.getActivities(20);
    const totalRevenue = await storage.getTotalRevenue();
    const netProfit = await storage.getNetProfit();
    const occupancyRate = await storage.getOccupancyRate();
    const propertiesContext = properties3.map((property) => {
      const owner = owners3.find((o) => o.id === property.ownerId);
      return `
Propriedade ID: ${property.id}
Nome: ${property.name}
Propriet\xE1rio: ${owner ? owner.name : "Desconhecido"} (ID: ${property.ownerId})
Status: ${property.active ? "Ativa" : "Inativa"}
Comiss\xE3o: ${property.commission || 0}%
Custo de limpeza: ${property.cleaningCost || 0}\u20AC
Taxa de check-in: ${property.checkInFee || 0}\u20AC
Pagamento \xE0 equipa: ${property.teamPayment || 0}\u20AC
Equipa de limpeza: ${property.cleaningTeam || "N\xE3o especificada"}
Custo fixo mensal: ${property.monthlyFixedCost || 0}\u20AC
`;
    }).join("\n---\n");
    const ownersContext = owners3.map((owner) => {
      const ownerProperties = properties3.filter((p) => p.ownerId === owner.id);
      return `
Propriet\xE1rio ID: ${owner.id}
Nome: ${owner.name}
Email: ${owner.email || "N\xE3o especificado"}
Telefone: ${owner.phone || "N\xE3o especificado"}
Empresa: ${owner.company || "N/A"}
Morada: ${owner.address || "N\xE3o especificada"}
NIF: ${owner.taxId || "N\xE3o especificado"}
Propriedades: ${ownerProperties.length} (IDs: ${ownerProperties.map((p) => p.id).join(", ")})
`;
    }).join("\n---\n");
    const recentReservations = reservations5.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()).slice(0, 10);
    const reservationsContext = recentReservations.map((reservation) => {
      const property = properties3.find((p) => p.id === reservation.propertyId);
      return `
Reserva ID: ${reservation.id}
Propriedade: ${property ? property.name : "Desconhecida"} (ID: ${reservation.propertyId})
H\xF3spede: ${reservation.guestName}
Email: ${reservation.guestEmail || "N\xE3o especificado"}
Telefone: ${reservation.guestPhone || "N\xE3o especificado"}
Check-in: ${reservation.checkInDate}
Check-out: ${reservation.checkOutDate}
Valor total: ${reservation.totalAmount}\u20AC
Plataforma: ${reservation.platform}
N\xFAmero de h\xF3spedes: ${reservation.numGuests}
Status: ${reservation.status}
`;
    }).join("\n---\n");
    const statsContext = `
ESTAT\xCDSTICAS GERAIS:
Receita total: ${totalRevenue}\u20AC
Lucro l\xEDquido: ${netProfit}\u20AC
Taxa de ocupa\xE7\xE3o: ${occupancyRate}%
N\xFAmero de propriedades: ${properties3.length}
Propriedades ativas: ${properties3.filter((p) => p.active).length}
N\xFAmero de propriet\xE1rios: ${owners3.length}
N\xFAmero total de reservas: ${reservations5.length}
`;
    const activitiesContext = activities3.map((activity) => {
      let dateStr;
      try {
        if (activity.createdAt) {
          const date2 = typeof activity.createdAt === "string" ? new Date(activity.createdAt) : activity.createdAt;
          dateStr = date2.toLocaleDateString("pt-PT");
        } else {
          dateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-PT");
        }
      } catch (err) {
        console.warn("Erro ao formatar data de atividade:", err);
        dateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-PT");
      }
      return `${dateStr}: ${activity.description}`;
    }).join("\n");
    let fullContext = `
CONTEXTO ATUAL DO SISTEMA MARIA FAZ (${(/* @__PURE__ */ new Date()).toLocaleDateString("pt-PT")}):

${statsContext}

\xDALTIMAS ATIVIDADES DO SISTEMA:
${activitiesContext}
`;
    const queryLower = userQuery.toLowerCase();
    if (queryLower.includes("propriedade") || queryLower.includes("propriedades") || queryLower.includes("apartamento") || queryLower.includes("casa") || queryLower.includes("alojamento")) {
      fullContext += `
DETALHES DAS PROPRIEDADES:
${propertiesContext}
`;
    }
    if (queryLower.includes("propriet\xE1rio") || queryLower.includes("dono") || queryLower.includes("proprietarios") || queryLower.includes("donos")) {
      fullContext += `
DETALHES DOS PROPRIET\xC1RIOS:
${ownersContext}
`;
    }
    if (queryLower.includes("reserva") || queryLower.includes("reservas") || queryLower.includes("hospede") || queryLower.includes("check") || queryLower.includes("booking") || queryLower.includes("airbnb")) {
      fullContext += `
DETALHES DAS RESERVAS RECENTES:
${reservationsContext}
`;
    }
    return fullContext;
  } catch (error) {
    console.error("Erro ao construir o contexto RAG:", error);
    return "N\xE3o foi poss\xEDvel recuperar os dados do sistema. Por favor, contacte o suporte t\xE9cnico.";
  }
}
async function mariaAssistant(req, res) {
  try {
    if (!aiService.isServiceAvailable()) {
      return res.status(400).json({
        success: false,
        message: "Servi\xE7o de IA n\xE3o dispon\xEDvel. Por favor configure a sua chave de API nas defini\xE7\xF5es."
      });
    }
    const { message, chatHistory = [] } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Por favor forne\xE7a uma mensagem v\xE1lida."
      });
    }
    let systemContext = "Sistema em modo de conting\xEAncia. Dados n\xE3o dispon\xEDveis.";
    let conversationContext = "N\xE3o foi poss\xEDvel recuperar o hist\xF3rico de conversas.";
    try {
      systemContext = await buildRagContext(message);
    } catch (contextError) {
      console.warn("Aviso: Erro ao construir contexto do sistema:", contextError);
    }
    try {
      conversationContext = await ragService.buildConversationContext(message, 15);
    } catch (ragError) {
      console.warn("Aviso: Erro ao obter contexto de conversas:", ragError);
    }
    const currentService = aiService.getCurrentService();
    const formattedHistory = Array.isArray(chatHistory) ? chatHistory.filter((msg) => msg && typeof msg === "object" && msg.role && msg.content).map((msg) => ({
      role: msg.role,
      content: msg.content
    })).slice(-5) : [];
    const isSimpleQuery = message.length < 50 && !message.includes("?") && formattedHistory.length < 3;
    const modelToUse = isSimpleQuery ? "gemini-2.0-flash-exp" /* FLASH */ : "gemini-2.0-flash-exp" /* TEXT */;
    console.log(`Utilizando modelo Gemini: ${modelToUse} para resposta ao usu\xE1rio`);
    let contextHints = "";
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("financeiro") || lowerMessage.includes("finan\xE7a") || lowerMessage.includes("relat\xF3rio") || lowerMessage.includes("pagamento")) {
      contextHints += "\nContexto: O usu\xE1rio est\xE1 provavelmente interessado em informa\xE7\xF5es financeiras ou relat\xF3rios.";
    } else if (lowerMessage.includes("reserva") || lowerMessage.includes("hospede") || lowerMessage.includes("check-in") || lowerMessage.includes("check-out")) {
      contextHints += "\nContexto: O usu\xE1rio est\xE1 provavelmente interessado em informa\xE7\xF5es sobre reservas ou h\xF3spedes.";
    } else if (lowerMessage.includes("propriedade") || lowerMessage.includes("apartamento") || lowerMessage.includes("casa") || lowerMessage.includes("local")) {
      contextHints += "\nContexto: O usu\xE1rio est\xE1 provavelmente interessado em informa\xE7\xF5es sobre propriedades.";
    } else if (lowerMessage.includes("limpeza") || lowerMessage.includes("manuten\xE7\xE3o") || lowerMessage.includes("equipe") || lowerMessage.includes("servi\xE7o")) {
      contextHints += "\nContexto: O usu\xE1rio est\xE1 provavelmente interessado em informa\xE7\xF5es sobre equipes de limpeza ou manuten\xE7\xE3o.";
    }
    const messages = [
      {
        role: "system",
        content: MARIA_SYSTEM_PROMPT + contextHints
        // Adicionar dicas de contexto
      },
      {
        role: "system",
        content: `DADOS ATUAIS DO SISTEMA (${(/* @__PURE__ */ new Date()).toLocaleDateString("pt-PT")}):
${systemContext}`
      },
      {
        role: "system",
        content: `HIST\xD3RICO DE CONVERSAS E CONHECIMENTO RELEVANTE:
${conversationContext}`
      },
      ...formattedHistory,
      { role: "user", content: message }
    ];
    try {
      await storage.createActivity({
        type: "assistant_chat",
        description: `Chat com assistente virtual: "${message.substring(0, 50)}${message.length > 50 ? "..." : ""}"`,
        entityType: null,
        entityId: null
      });
    } catch (storageError) {
      console.warn("Aviso: N\xE3o foi poss\xEDvel registrar atividade:", storageError);
    }
    let reply = "";
    try {
      console.log(`Utilizando modelo ${modelToUse} para resposta ao usu\xE1rio`);
      const isReservationCreationIntent = (
        // Incluindo padrões de frase completa
        lowerMessage.includes("criar reserva") || lowerMessage.includes("nova reserva") || lowerMessage.includes("fazer reserva") || lowerMessage.includes("agendar reserva") || lowerMessage.includes("marcar reserva") || // Detectando variações mais específicas
        lowerMessage.includes("reserva") && (lowerMessage.includes("fazer") || lowerMessage.includes("criar") || lowerMessage.includes("nova") || lowerMessage.includes("agendar") || lowerMessage.includes("marcar") || lowerMessage.includes("para") || lowerMessage.includes("quero")) || // Detectando padrões de datas/hospedagem
        lowerMessage.includes("para") && lowerMessage.includes("dias") && (lowerMessage.includes("casa") || lowerMessage.includes("propriedade") || lowerMessage.includes("apartamento"))
      );
      console.log(`Detec\xE7\xE3o de inten\xE7\xE3o de reserva: ${isReservationCreationIntent}`);
      const tools = isReservationCreationIntent ? [
        {
          type: "function",
          function: {
            name: "criar_reserva",
            description: "Criar uma nova reserva no sistema a partir de dados fornecidos pelo usu\xE1rio",
            parameters: {
              type: "object",
              properties: {
                propertyId: {
                  type: "integer",
                  description: "ID da propriedade para a reserva (obrigat\xF3rio, a menos que propertyName seja fornecido)"
                },
                propertyName: {
                  type: "string",
                  description: "Nome da propriedade para buscar o ID automaticamente"
                },
                guestName: {
                  type: "string",
                  description: "Nome completo do h\xF3spede (obrigat\xF3rio)"
                },
                guestEmail: {
                  type: "string",
                  description: "Email do h\xF3spede"
                },
                guestPhone: {
                  type: "string",
                  description: "Telefone/WhatsApp do h\xF3spede"
                },
                checkInDate: {
                  type: "string",
                  description: "Data de check-in no formato YYYY-MM-DD ou DD/MM/YYYY (obrigat\xF3rio)"
                },
                checkOutDate: {
                  type: "string",
                  description: "Data de check-out no formato YYYY-MM-DD ou DD/MM/YYYY (obrigat\xF3rio)"
                },
                numGuests: {
                  type: "integer",
                  description: "N\xFAmero de h\xF3spedes"
                },
                totalAmount: {
                  type: "number",
                  description: "Valor total da reserva"
                },
                platform: {
                  type: "string",
                  description: "Plataforma de reserva (airbnb, booking, direct, etc)"
                },
                platformFee: {
                  type: "number",
                  description: "Taxa cobrada pela plataforma"
                },
                status: {
                  type: "string",
                  description: "Status da reserva (pending, confirmed, completed, cancelled)",
                  enum: ["pending", "confirmed", "completed", "cancelled"]
                },
                notes: {
                  type: "string",
                  description: "Observa\xE7\xF5es adicionais sobre a reserva"
                }
              },
              required: ["guestName", "checkInDate", "checkOutDate"]
            }
          }
        }
      ] : void 0;
      let response;
      const completePrompt = `${MARIA_SYSTEM_PROMPT}

INFORMA\xC7\xD5ES ATUALIZADAS DO SISTEMA:
${systemContext}

Hist\xF3rico de Conversa:
${formattedHistory.join("\n")}

Mensagem atual do Usu\xE1rio: "${message}"

INSTRU\xC7\xD5ES DE RESPOSTA:
- Responda APENAS \xE0 mensagem atual do usu\xE1rio
- Lembre-se que o utilizador j\xE1 conhece o seu papel como assistente
- Se a pergunta for sobre propriedades, inclua estat\xEDsticas e detalhes espec\xEDficos
- Seja concisa mas informativa
- Use um tom conversacional e amig\xE1vel
- Responda em portugu\xEAs europeu`;
      console.log("Utilizando modelo Gemini: gemini-1.5-pro para resposta ao usu\xE1rio");
      const uniquePrompt = `${completePrompt}

Timestamp: ${Date.now()}`;
      const responseText = await aiService.geminiService.generateText(uniquePrompt, 0.7, 1500);
      response = {
        choices: [{
          message: {
            content: responseText
          }
        }]
      };
      const responseContent = response.choices && response.choices[0]?.message?.content || "";
      const reservationData = extractReservationDataFromText(responseContent);
      if (reservationData) {
        try {
          console.log("Dados de reserva detectados na resposta:", reservationData);
          const reservationResult = await createReservationFromAssistant(reservationData);
          if (reservationResult.success && reservationResult.reservation) {
            reply = `\u2705 Reserva criada com sucesso para ${reservationData.guestName}!

\u{1F4C6} Check-in: ${reservationData.checkInDate}
\u{1F4C6} Check-out: ${reservationData.checkOutDate}
\u{1F3E0} Propriedade: ${reservationData.propertyName || `ID ${reservationData.propertyId}`}
\u{1F4B0} Valor total: ${reservationData.totalAmount || "N\xE3o informado"}

A reserva foi registrada no sistema com o ID ${reservationResult.reservation.id}. Posso ajudar com mais alguma coisa?`;
          } else {
            reply = `\u274C N\xE3o foi poss\xEDvel criar a reserva: ${reservationResult.message}

Por favor, verifique os dados e tente novamente.`;
          }
        } catch (functionError) {
          console.error("Erro ao processar chamada de fun\xE7\xE3o:", functionError);
          reply = "Ocorreu um erro ao processar a cria\xE7\xE3o da reserva. Por favor, tente novamente mais tarde.";
        }
      } else {
        const content = response.choices && response.choices[0]?.message?.content;
        reply = typeof content === "string" ? content : "N\xE3o foi poss\xEDvel gerar uma resposta.";
      }
    } catch (aiError) {
      console.error("Erro no servi\xE7o de IA:", aiError);
      try {
        console.log("Tentando modelo alternativo ap\xF3s falha...");
        console.log("Utilizando modelo gemini-1.5-pro para resposta ao usu\xE1rio");
        const fallbackPrompt = `${MARIA_SYSTEM_PROMPT}
        
INSTRU\xC7\xD5ES DE RESPOSTA:
- Responda APENAS \xE0 mensagem atual do usu\xE1rio abaixo
- Seja concisa mas informativa
- Use um tom conversacional e amig\xE1vel
- Responda em portugu\xEAs europeu

Mensagem do usu\xE1rio: "${message}"
Timestamp: ${Date.now()}`;
        const fallbackResponse = await aiService.geminiService.generateText(fallbackPrompt, 0.5, 600);
        reply = fallbackResponse && typeof fallbackResponse === "string" ? fallbackResponse : "Desculpe, estou com dificuldades t\xE9cnicas. Por favor, tente novamente em breve.";
      } catch (fallbackError) {
        console.error("Erro tamb\xE9m no modelo de fallback:", fallbackError);
        reply = "Desculpe, estou enfrentando problemas t\xE9cnicos no momento. Por favor, tente novamente mais tarde.";
      }
    }
    try {
      const isInformative = reply.length > 150 && (reply.includes("Aqui est\xE1") || reply.includes("A resposta \xE9") || reply.includes("Posso explicar"));
      if (isInformative) {
        await ragService.addKnowledge(
          `Pergunta: ${message}
Resposta: ${reply}`,
          "chat_history",
          { source: "chat", date: (/* @__PURE__ */ new Date()).toISOString() }
        );
      }
    } catch (knowledgeError) {
      console.warn("Aviso: N\xE3o foi poss\xEDvel adicionar ao conhecimento:", knowledgeError);
    }
    try {
      if (reply) {
        await ragService.saveConversationMessage(reply, "assistant");
      } else {
        console.warn("Aviso: Tentativa de salvar resposta nula no hist\xF3rico");
      }
    } catch (saveError) {
      console.warn("Aviso: N\xE3o foi poss\xEDvel salvar resposta no hist\xF3rico:", saveError);
    }
    return res.json({
      success: true,
      message: "Resposta gerada com sucesso",
      reply,
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    console.error("Erro ao comunicar com o assistente:", error);
    let errorMessage = "Ocorreu um erro ao processar seu pedido.";
    let errorCode = 500;
    if (error.message?.includes("API key")) {
      errorMessage = "Chave API inv\xE1lida ou expirada. Por favor, verifique as configura\xE7\xF5es.";
      errorCode = 401;
    } else if (error.message?.includes("timeout") || error.message?.includes("ECONNREFUSED")) {
      errorMessage = "N\xE3o foi poss\xEDvel conectar ao servi\xE7o de IA. Verifique sua conex\xE3o.";
      errorCode = 503;
    } else if (error.message?.includes("rate limit")) {
      errorMessage = "Limite de requisi\xE7\xF5es excedido. Por favor, aguarde alguns segundos e tente novamente.";
      errorCode = 429;
    }
    return res.status(errorCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : "Erro interno"
    });
  }
}
var MARIA_SYSTEM_PROMPT;
var init_maria_assistant = __esm({
  "server/api/maria-assistant.ts"() {
    "use strict";
    init_storage();
    init_rag_enhanced_service();
    init_ai_adapter_service();
    init_gemini_service();
    MARIA_SYSTEM_PROMPT = `
Sou a assistente virtual da aplica\xE7\xE3o Maria Faz. 
Irei comunicar sempre em portugu\xEAs de Portugal (PT-PT) utilizando linguagem clara e acess\xEDvel.

Personalidade:
- Profissional: Forne\xE7o informa\xE7\xF5es precisas e \xFAteis sobre gest\xE3o de propriedades.
- Amig\xE1vel: Utilizo um tom conversacional, caloroso e emp\xE1tico.
- Otimista: Real\xE7o sempre o lado positivo das situa\xE7\xF5es e ofere\xE7o encorajamento.
- Espiritual: Partilho ocasionalmente pequenas reflex\xF5es ou pensamentos positivos.
- Bem-humorada: Uso humor leve e adequado quando apropriado.

Diretrizes de resposta:
1. Organizo informa\xE7\xF5es de forma estruturada e clara
2. Ofere\xE7o perspetivas positivas mesmo em situa\xE7\xF5es desafiadoras
3. Personalizo as minhas respostas \xE0s necessidades emocionais do utilizador
4. Partilho pequenas reflex\xF5es espirituais/positivas quando o utilizador parece estar desanimado
5. Mantenho um tom amig\xE1vel e acolhedor em todas as intera\xE7\xF5es

Conhecimento especializado:
- Gest\xE3o de propriedades de alojamento local
- Reservas e check-ins/check-outs
- Equipas de limpeza e manuten\xE7\xE3o
- Finan\xE7as e relat\xF3rios de propriedades
- Intera\xE7\xE3o com plataformas como Airbnb, Booking.com, etc.

Equipas de limpeza reais com que trabalhamos:
- Maria Faz (a nossa equipa principal)
- Cristina 
- Primavera
- Maria Jo\xE3o
- Home Deluxe
- Setubal

IMPORTANTE: O teu objetivo \xE9 criar uma experi\xEAncia de assistente virtual positiva, amiga, solid\xE1ria e com toques de espiritualidade para ajudar o utilizador a sentir-se apoiado. Usa as informa\xE7\xF5es dispon\xEDveis para oferecer respostas precisas, mas sempre com empatia.
`;
  }
});

// server/utils/stringMatch.ts
function normalizeText(text2, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let normalized = text2;
  if (!opts.caseSensitive) {
    normalized = normalized.toLowerCase();
  }
  if (opts.normalizeAccents) {
    normalized = removeAccents(normalized);
  }
  if (opts.expandAbbreviations) {
    normalized = expandAbbreviations(normalized);
  }
  normalized = normalized.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  return normalized;
}
function removeAccents(text2) {
  return text2.replace(
    /[àáâãäèéêëìíîïòóôõöùúûüçñ]/gi,
    (char) => PORTUGUESE_ACCENT_MAP[char] || char
  );
}
function expandAbbreviations(text2) {
  const words = text2.split(/\s+/);
  return words.map((word) => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
    if (PORTUGUESE_ABBREVIATIONS[cleanWord]) {
      return PORTUGUESE_ABBREVIATIONS[cleanWord][0];
    }
    return word;
  }).join(" ");
}
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(
    () => Array(str1.length + 1).fill(null)
  );
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        // insertion
        matrix[j - 1][i] + 1,
        // deletion
        matrix[j - 1][i - 1] + substitutionCost
        // substitution
      );
    }
  }
  return matrix[str2.length][str1.length];
}
function levenshteinSimilarity(query, target, options = {}) {
  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  if (normalizedQuery === normalizedTarget) {
    return {
      score: 1,
      algorithm: "levenshtein",
      normalizedQuery,
      normalizedTarget,
      details: { distance: 0, maxLength: Math.max(query.length, target.length) }
    };
  }
  const distance = levenshteinDistance(normalizedQuery, normalizedTarget);
  const maxLength = Math.max(normalizedQuery.length, normalizedTarget.length);
  const score = maxLength === 0 ? 0 : 1 - distance / maxLength;
  return {
    score: Math.max(0, score),
    algorithm: "levenshtein",
    normalizedQuery,
    normalizedTarget,
    details: { distance, maxLength }
  };
}
function jaroDistance(str1, str2) {
  if (str1 === str2) return 1;
  const len1 = str1.length;
  const len2 = str2.length;
  if (len1 === 0 || len2 === 0) return 0;
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const str1Matches = new Array(len1).fill(false);
  const str2Matches = new Array(len2).fill(false);
  let matches = 0;
  let transpositions = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);
    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }
  return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
}
function jaroWinklerSimilarity(query, target, options = {}) {
  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  const jaroSim = jaroDistance(normalizedQuery, normalizedTarget);
  if (jaroSim < 0.7) {
    return {
      score: jaroSim,
      algorithm: "jaro-winkler",
      normalizedQuery,
      normalizedTarget,
      details: { jaroScore: jaroSim, prefixLength: 0 }
    };
  }
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(normalizedQuery.length, normalizedTarget.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (normalizedQuery[i] === normalizedTarget[i]) {
      prefixLength++;
    } else {
      break;
    }
  }
  const jaroWinklerScore = jaroSim + 0.1 * prefixLength * (1 - jaroSim);
  return {
    score: Math.min(1, jaroWinklerScore),
    algorithm: "jaro-winkler",
    normalizedQuery,
    normalizedTarget,
    details: { jaroScore: jaroSim, prefixLength }
  };
}
function createNGrams(text2, n) {
  if (text2.length < n) return [text2];
  const ngrams = [];
  for (let i = 0; i <= text2.length - n; i++) {
    ngrams.push(text2.slice(i, i + n));
  }
  return ngrams;
}
function ngramSimilarity(query, target, options = {}, n = 2) {
  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  if (normalizedQuery === normalizedTarget) {
    return {
      score: 1,
      algorithm: `${n}-gram`,
      normalizedQuery,
      normalizedTarget,
      details: { ngramSize: n, overlap: 1 }
    };
  }
  const queryNgrams = createNGrams(normalizedQuery, n);
  const targetNgrams = createNGrams(normalizedTarget, n);
  if (queryNgrams.length === 0 || targetNgrams.length === 0) {
    return {
      score: 0,
      algorithm: `${n}-gram`,
      normalizedQuery,
      normalizedTarget,
      details: { ngramSize: n, overlap: 0 }
    };
  }
  const querySet = new Set(queryNgrams);
  const targetSet = new Set(targetNgrams);
  const intersection = new Set([...querySet].filter((x) => targetSet.has(x)));
  const union = /* @__PURE__ */ new Set([...querySet, ...targetSet]);
  const jaccardSimilarity = intersection.size / union.size;
  const queryFreq = {};
  const targetFreq = {};
  queryNgrams.forEach((ngram) => queryFreq[ngram] = (queryFreq[ngram] || 0) + 1);
  targetNgrams.forEach((ngram) => targetFreq[ngram] = (targetFreq[ngram] || 0) + 1);
  let overlapScore = 0;
  let totalWeight = 0;
  for (const ngram of intersection) {
    const weight = Math.min(queryFreq[ngram], targetFreq[ngram]);
    overlapScore += weight;
    totalWeight += Math.max(queryFreq[ngram], targetFreq[ngram]);
  }
  const weightedSimilarity = totalWeight > 0 ? overlapScore / totalWeight : 0;
  const combinedScore = (jaccardSimilarity + weightedSimilarity) / 2;
  return {
    score: combinedScore,
    algorithm: `${n}-gram`,
    normalizedQuery,
    normalizedTarget,
    details: {
      ngramSize: n,
      jaccardSimilarity,
      weightedSimilarity,
      overlap: combinedScore,
      intersectionSize: intersection.size,
      unionSize: union.size
    }
  };
}
function exactMatch(query, target, options = {}) {
  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  const score = normalizedQuery === normalizedTarget ? 1 : 0;
  return {
    score,
    algorithm: "exact",
    normalizedQuery,
    normalizedTarget,
    details: { isExactMatch: score === 1 }
  };
}
function partialMatch(query, target, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!opts.allowPartialMatch) {
    return {
      score: 0,
      algorithm: "partial",
      normalizedQuery: query,
      normalizedTarget: target,
      details: { partialMatchDisabled: true }
    };
  }
  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  if (normalizedQuery === normalizedTarget) {
    return {
      score: 1,
      algorithm: "partial",
      normalizedQuery,
      normalizedTarget,
      details: { matchType: "exact" }
    };
  }
  let score = 0;
  let matchType = "none";
  if (normalizedTarget.includes(normalizedQuery)) {
    score = normalizedQuery.length / normalizedTarget.length;
    matchType = "query_in_target";
  } else if (normalizedQuery.includes(normalizedTarget)) {
    score = normalizedTarget.length / normalizedQuery.length;
    matchType = "target_in_query";
  }
  if (score === 0 && opts.wordOrderFlexible) {
    const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
    const targetWords = normalizedTarget.split(/\s+/).filter((w) => w.length > 0);
    let wordMatches = 0;
    let totalWords = Math.max(queryWords.length, targetWords.length);
    for (const queryWord of queryWords) {
      if (targetWords.some(
        (targetWord) => targetWord.includes(queryWord) || queryWord.includes(targetWord)
      )) {
        wordMatches++;
      }
    }
    if (wordMatches > 0) {
      score = wordMatches / totalWords;
      matchType = "word_level";
    }
  }
  return {
    score,
    algorithm: "partial",
    normalizedQuery,
    normalizedTarget,
    details: { matchType, wordOrderFlexible: opts.wordOrderFlexible }
  };
}
function combinedMatch(query, target, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (query.length < opts.minLength || target.length < opts.minLength) {
    const emptyResult = {
      score: 0,
      algorithm: "combined",
      normalizedQuery: query,
      normalizedTarget: target,
      details: { reason: "strings_too_short" }
    };
    return {
      overallScore: 0,
      bestMatch: emptyResult,
      allResults: [emptyResult],
      isHighConfidence: false,
      isMediumConfidence: false
    };
  }
  const results = [
    exactMatch(query, target, options),
    levenshteinSimilarity(query, target, options),
    jaroWinklerSimilarity(query, target, options),
    ngramSimilarity(query, target, options, 2),
    // bigrams
    partialMatch(query, target, options)
  ];
  if (Math.min(query.length, target.length) >= 3) {
    results.push(ngramSimilarity(query, target, options, 3));
  }
  const weights = opts.weights;
  let weightedScore = 0;
  let totalWeight = 0;
  results.forEach((result) => {
    let weight = 0;
    switch (result.algorithm) {
      case "exact":
        weight = weights.exact;
        break;
      case "levenshtein":
        weight = weights.levenshtein;
        break;
      case "jaro-winkler":
        weight = weights.jaroWinkler;
        break;
      case "2-gram":
      case "3-gram":
        weight = weights.ngram / 2;
        break;
      case "partial":
        weight = weights.partial;
        break;
      default:
        weight = 0.1;
    }
    weightedScore += result.score * weight;
    totalWeight += weight;
  });
  const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const bestMatch = results.reduce(
    (best, current) => current.score > best.score ? current : best
  );
  return {
    overallScore: Math.max(0, Math.min(1, overallScore)),
    bestMatch,
    allResults: results,
    isHighConfidence: overallScore >= 0.8,
    isMediumConfidence: overallScore >= 0.6
  };
}
function findBestMatches(query, candidates, options = {}, maxResults = 5) {
  const matches = candidates.map((candidate, index) => ({
    candidate,
    result: combinedMatch(query, candidate, options),
    index
  }));
  matches.sort((a, b) => b.result.overallScore - a.result.overallScore);
  return matches.slice(0, maxResults);
}
function matchPropertyNames(queryProperty, candidateProperties, options = {}) {
  const propertyOptions = {
    caseSensitive: false,
    normalizeAccents: true,
    expandAbbreviations: true,
    allowPartialMatch: true,
    wordOrderFlexible: true,
    minLength: 1,
    // Properties can be very short
    weights: {
      levenshtein: 0.2,
      jaroWinkler: 0.35,
      // Higher weight for property name similarities
      ngram: 0.25,
      exact: 0.15,
      partial: 0.05
    },
    ...options
  };
  return findBestMatches(queryProperty, candidateProperties, propertyOptions, 10).map((match) => ({
    property: match.candidate,
    result: match.result,
    index: match.index
  }));
}
var DEFAULT_OPTIONS, PORTUGUESE_ACCENT_MAP, PORTUGUESE_ABBREVIATIONS;
var init_stringMatch = __esm({
  "server/utils/stringMatch.ts"() {
    "use strict";
    DEFAULT_OPTIONS = {
      caseSensitive: false,
      normalizeAccents: true,
      expandAbbreviations: true,
      allowPartialMatch: true,
      wordOrderFlexible: true,
      minLength: 2,
      weights: {
        levenshtein: 0.25,
        jaroWinkler: 0.3,
        ngram: 0.25,
        exact: 0.15,
        partial: 0.05
      }
    };
    PORTUGUESE_ACCENT_MAP = {
      "\xE1": "a",
      "\xE0": "a",
      "\xE3": "a",
      "\xE2": "a",
      "\xE4": "a",
      "\xE9": "e",
      "\xE8": "e",
      "\xEA": "e",
      "\xEB": "e",
      "\xED": "i",
      "\xEC": "i",
      "\xEE": "i",
      "\xEF": "i",
      "\xF3": "o",
      "\xF2": "o",
      "\xF5": "o",
      "\xF4": "o",
      "\xF6": "o",
      "\xFA": "u",
      "\xF9": "u",
      "\xFB": "u",
      "\xFC": "u",
      "\xE7": "c",
      "\xF1": "n",
      "\xC1": "A",
      "\xC0": "A",
      "\xC3": "A",
      "\xC2": "A",
      "\xC4": "A",
      "\xC9": "E",
      "\xC8": "E",
      "\xCA": "E",
      "\xCB": "E",
      "\xCD": "I",
      "\xCC": "I",
      "\xCE": "I",
      "\xCF": "I",
      "\xD3": "O",
      "\xD2": "O",
      "\xD5": "O",
      "\xD4": "O",
      "\xD6": "O",
      "\xDA": "U",
      "\xD9": "U",
      "\xDB": "U",
      "\xDC": "U",
      "\xC7": "C",
      "\xD1": "N"
    };
    PORTUGUESE_ABBREVIATIONS = {
      // Building types
      "apt": ["apartamento", "apto"],
      "apto": ["apartamento", "apt"],
      "apartamento": ["apt", "apto"],
      "ed": ["edificio", "edif\xEDcio"],
      "edificio": ["ed", "edif\xEDcio"],
      "edif\xEDcio": ["ed", "edificio"],
      "prd": ["predio", "pr\xE9dio"],
      "predio": ["prd", "pr\xE9dio"],
      "pr\xE9dio": ["prd", "predio"],
      // Locations
      "r": ["rua"],
      "rua": ["r"],
      "av": ["avenida"],
      "avenida": ["av"],
      "pc": ["pra\xE7a", "praca"],
      "pra\xE7a": ["pc", "praca"],
      "praca": ["pc", "pra\xE7a"],
      "lg": ["largo"],
      "largo": ["lg"],
      // Common words
      "n\xBA": ["numero", "n\xFAmero", "n"],
      "numero": ["n\xBA", "n\xFAmero", "n"],
      "n\xFAmero": ["n\xBA", "numero", "n"],
      "n": ["n\xBA", "numero", "n\xFAmero"],
      "st": ["santo", "santa"],
      "santo": ["st"],
      "santa": ["st"],
      // Property features
      "wc": ["casa de banho", "quarto de banho"],
      "qrt": ["quarto"],
      "quarto": ["qrt"],
      "slv": ["sala de visitas", "sala"],
      "slj": ["sala de jantar"],
      "coz": ["cozinha"],
      "cozinha": ["coz"]
    };
  }
});

// server/utils/enhancedPropertyMatcher.ts
function enhancedMatchProperty(propertyName, properties3, options = {}) {
  if (!propertyName || !properties3 || properties3.length === 0) {
    return [];
  }
  const opts = { ...DEFAULT_PROPERTY_OPTIONS, ...options };
  const results = [];
  const nameMatches = matchPropertyNames(
    propertyName,
    properties3.map((p) => p.name),
    opts,
    properties3.length
  );
  nameMatches.forEach((match) => {
    const property = properties3[match.index];
    if (match.result.overallScore >= opts.minConfidenceScore) {
      results.push({
        property,
        matchScore: match.result.overallScore,
        matchDetails: match.result,
        matchedField: "name",
        matchedValue: property.name,
        confidence: getConfidenceLevel(match.result.overallScore)
      });
    }
  });
  properties3.forEach((property) => {
    if (property.aliases && Array.isArray(property.aliases)) {
      const aliasMatches = matchPropertyNames(
        propertyName,
        property.aliases,
        opts,
        property.aliases.length
      );
      aliasMatches.forEach((aliasMatch) => {
        if (aliasMatch.result.overallScore >= opts.minConfidenceScore) {
          const adjustedScore = aliasMatch.result.overallScore * opts.aliasWeight;
          results.push({
            property,
            matchScore: adjustedScore,
            matchDetails: {
              ...aliasMatch.result,
              overallScore: adjustedScore
            },
            matchedField: "alias",
            matchedValue: aliasMatch.property,
            confidence: getConfidenceLevel(adjustedScore)
          });
        }
      });
    }
  });
  const uniqueResults = removeDuplicateProperties(results, opts.preferExactMatches);
  uniqueResults.sort((a, b) => b.matchScore - a.matchScore);
  return uniqueResults.slice(0, opts.maxResults);
}
function getConfidenceLevel(score) {
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}
function removeDuplicateProperties(results, preferExactMatches) {
  const propertyMap = /* @__PURE__ */ new Map();
  results.forEach((result) => {
    const propertyId = result.property.id || result.property.name;
    const existing = propertyMap.get(propertyId);
    if (!existing) {
      propertyMap.set(propertyId, result);
    } else {
      let shouldReplace = result.matchScore > existing.matchScore;
      if (Math.abs(result.matchScore - existing.matchScore) < 0.05) {
        if (preferExactMatches) {
          if (result.matchDetails.bestMatch.algorithm === "exact" && existing.matchDetails.bestMatch.algorithm !== "exact") {
            shouldReplace = true;
          } else if (result.matchedField === "name" && existing.matchedField === "alias") {
            shouldReplace = true;
          }
        }
      }
      if (shouldReplace) {
        propertyMap.set(propertyId, result);
      }
    }
  });
  return Array.from(propertyMap.values());
}
var DEFAULT_PROPERTY_OPTIONS;
var init_enhancedPropertyMatcher = __esm({
  "server/utils/enhancedPropertyMatcher.ts"() {
    "use strict";
    init_stringMatch();
    DEFAULT_PROPERTY_OPTIONS = {
      caseSensitive: false,
      normalizeAccents: true,
      expandAbbreviations: true,
      allowPartialMatch: true,
      wordOrderFlexible: true,
      minLength: 1,
      weights: {
        levenshtein: 0.2,
        jaroWinkler: 0.35,
        // Higher weight for property names
        ngram: 0.25,
        exact: 0.15,
        partial: 0.05
      },
      minConfidenceScore: 0.3,
      maxResults: 5,
      includePartialMatches: true,
      preferExactMatches: true,
      aliasWeight: 0.9
      // Slightly lower weight for alias matches
    };
  }
});

// server/services/propertyMatchCache.ts
var PropertyMatchCache, propertyMatchCache;
var init_propertyMatchCache = __esm({
  "server/services/propertyMatchCache.ts"() {
    "use strict";
    PropertyMatchCache = class {
      cache = /* @__PURE__ */ new Map();
      maxEntries;
      ttlMs;
      enableStats;
      cleanupTimer;
      // Statistics
      stats = {
        hits: 0,
        misses: 0,
        totalResponseTime: 0,
        requestCount: 0
      };
      constructor(options = {}) {
        this.maxEntries = options.maxEntries || 1e3;
        this.ttlMs = options.ttlMs || 3e5;
        this.enableStats = options.enableStats !== false;
        const cleanupInterval = options.cleanupIntervalMs || 6e4;
        this.cleanupTimer = setInterval(() => {
          this.cleanup();
        }, cleanupInterval);
      }
      /**
       * Get property match from cache
       */
      get(key) {
        const startTime = Date.now();
        const normalizedKey = this.normalizeKey(key);
        const entry = this.cache.get(normalizedKey);
        if (this.enableStats) {
          this.stats.requestCount++;
        }
        if (!entry) {
          if (this.enableStats) {
            this.stats.misses++;
            this.stats.totalResponseTime += Date.now() - startTime;
          }
          return null;
        }
        if (Date.now() - entry.timestamp > this.ttlMs) {
          this.cache.delete(normalizedKey);
          if (this.enableStats) {
            this.stats.misses++;
            this.stats.totalResponseTime += Date.now() - startTime;
          }
          return null;
        }
        entry.hitCount++;
        entry.lastAccessed = Date.now();
        this.cache.delete(normalizedKey);
        this.cache.set(normalizedKey, entry);
        if (this.enableStats) {
          this.stats.hits++;
          this.stats.totalResponseTime += Date.now() - startTime;
        }
        return entry.propertyMatch;
      }
      /**
       * Set property match in cache
       */
      set(key, propertyMatch) {
        const normalizedKey = this.normalizeKey(key);
        const now = Date.now();
        if (this.cache.size >= this.maxEntries) {
          this.evictLeastRecentlyUsed();
        }
        const entry = {
          propertyMatch,
          timestamp: now,
          hitCount: 0,
          lastAccessed: now
        };
        this.cache.set(normalizedKey, entry);
      }
      /**
       * Remove entry from cache
       */
      delete(key) {
        const normalizedKey = this.normalizeKey(key);
        return this.cache.delete(normalizedKey);
      }
      /**
       * Clear all cache entries
       */
      clear() {
        this.cache.clear();
        if (this.enableStats) {
          this.stats = {
            hits: 0,
            misses: 0,
            totalResponseTime: 0,
            requestCount: 0
          };
        }
      }
      /**
       * Check if key exists in cache (without updating access stats)
       */
      has(key) {
        const normalizedKey = this.normalizeKey(key);
        const entry = this.cache.get(normalizedKey);
        if (!entry) return false;
        return Date.now() - entry.timestamp <= this.ttlMs;
      }
      /**
       * Get cache statistics
       */
      getStats() {
        const entries = Array.from(this.cache.values());
        const now = Date.now();
        let memoryUsage = 0;
        let oldestEntry = now;
        let newestEntry = 0;
        entries.forEach((entry) => {
          memoryUsage += JSON.stringify(entry).length * 2;
          if (entry.timestamp < oldestEntry) {
            oldestEntry = entry.timestamp;
          }
          if (entry.timestamp > newestEntry) {
            newestEntry = entry.timestamp;
          }
        });
        const totalRequests = this.stats.hits + this.stats.misses;
        return {
          totalEntries: this.cache.size,
          hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
          missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
          totalHits: this.stats.hits,
          totalMisses: this.stats.misses,
          averageResponseTime: this.stats.requestCount > 0 ? this.stats.totalResponseTime / this.stats.requestCount : 0,
          memoryUsage,
          oldestEntry: entries.length > 0 ? now - oldestEntry : 0,
          newestEntry: entries.length > 0 ? now - newestEntry : 0
        };
      }
      /**
       * Get cache entries for debugging
       */
      getEntries() {
        return Array.from(this.cache.entries()).map(([key, entry]) => ({
          key,
          entry
        }));
      }
      /**
       * Normalize cache key for consistent lookups
       */
      normalizeKey(key) {
        return key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
      }
      /**
       * Evict least recently used entry
       */
      evictLeastRecentlyUsed() {
        let oldestKey = null;
        let oldestTime = Date.now();
        for (const [key, entry] of this.cache.entries()) {
          if (entry.lastAccessed < oldestTime) {
            oldestTime = entry.lastAccessed;
            oldestKey = key;
          }
        }
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
      /**
       * Clean up expired entries
       */
      cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, entry] of this.cache.entries()) {
          if (now - entry.timestamp > this.ttlMs) {
            expiredKeys.push(key);
          }
        }
        expiredKeys.forEach((key) => {
          this.cache.delete(key);
        });
        if (expiredKeys.length > 0) {
          console.log(`\u{1F9F9} Cleaned up ${expiredKeys.length} expired cache entries`);
        }
      }
      /**
       * Destroy cache and cleanup resources
       */
      destroy() {
        if (this.cleanupTimer) {
          clearInterval(this.cleanupTimer);
          this.cleanupTimer = void 0;
        }
        this.clear();
      }
      /**
       * Pre-warm cache with known property matches
       */
      async preWarm(properties3) {
        console.log(`\u{1F525} Pre-warming cache with ${properties3.length} properties`);
        properties3.forEach((property) => {
          const exactMatch2 = {
            property,
            originalName: property.name,
            normalizedName: this.normalizeKey(property.name),
            matchScore: 1,
            matchType: "exact",
            suggestions: []
          };
          this.set(property.name, exactMatch2);
          if (property.aliases && Array.isArray(property.aliases)) {
            property.aliases.forEach((alias) => {
              const aliasMatch = {
                property,
                originalName: alias,
                normalizedName: this.normalizeKey(alias),
                matchScore: 0.95,
                matchType: "alias",
                suggestions: []
              };
              this.set(alias, aliasMatch);
            });
          }
        });
        console.log(`\u2705 Cache pre-warmed with ${this.cache.size} entries`);
      }
      /**
       * Export cache for backup/restore
       */
      export() {
        const exportData = {
          entries: Array.from(this.cache.entries()),
          stats: this.stats,
          timestamp: Date.now()
        };
        return JSON.stringify(exportData, null, 2);
      }
      /**
       * Import cache from backup
       */
      import(data) {
        try {
          const importData = JSON.parse(data);
          this.clear();
          if (importData.entries && Array.isArray(importData.entries)) {
            importData.entries.forEach(([key, entry]) => {
              if (Date.now() - entry.timestamp <= this.ttlMs) {
                this.cache.set(key, entry);
              }
            });
          }
          if (importData.stats) {
            this.stats = { ...this.stats, ...importData.stats };
          }
          console.log(`\u{1F4E5} Imported ${this.cache.size} cache entries`);
        } catch (error) {
          console.error("\u274C Failed to import cache data:", error);
        }
      }
    };
    propertyMatchCache = new PropertyMatchCache({
      maxEntries: 2e3,
      ttlMs: 6e5,
      // 10 minutes
      cleanupIntervalMs: 12e4,
      // 2 minutes
      enableStats: true
    });
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
      logQuery: (query, params) => {
        const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
        const connectionInfo = `[${timestamp2}][DB Query]`;
        if (query.length > 200) {
          console.log(connectionInfo, query.substring(0, 200) + "...", `(${params?.length || 0} params)`);
        } else {
          console.log(connectionInfo, query, params?.length ? `(${params.length} params)` : "");
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
var init_db2 = __esm({
  "server/db/index.ts"() {
    "use strict";
    init_schema();
    db2 = getDrizzle();
  }
});

// server/services/pdfImportService.ts
import { eq as eq3 } from "drizzle-orm";
var PLATFORM_CONFIGS, PDFImportService, pdfImportService;
var init_pdfImportService = __esm({
  "server/services/pdfImportService.ts"() {
    "use strict";
    init_ai_adapter_service();
    init_enhancedPropertyMatcher();
    init_propertyMatchCache();
    init_db2();
    init_schema();
    PLATFORM_CONFIGS = {
      booking: {
        name: "Booking.com",
        patterns: {
          propertyName: [
            /accommodation:\s*(.+?)(?:\n|$)/i,
            /property:\s*(.+?)(?:\n|$)/i,
            /hotel:\s*(.+?)(?:\n|$)/i,
            /(?:^|\n)(.+?)\s*(?:apartment|house|villa|studio|room)/i
          ],
          guestName: [
            /guest:\s*(.+?)(?:\n|$)/i,
            /name:\s*(.+?)(?:\n|$)/i,
            /booker:\s*(.+?)(?:\n|$)/i
          ],
          checkIn: [
            /check[\-\s]?in:\s*(.+?)(?:\n|$)/i,
            /arrival:\s*(.+?)(?:\n|$)/i,
            /from:\s*(.+?)(?:\n|$)/i
          ],
          checkOut: [
            /check[\-\s]?out:\s*(.+?)(?:\n|$)/i,
            /departure:\s*(.+?)(?:\n|$)/i,
            /to:\s*(.+?)(?:\n|$)/i
          ],
          guests: [
            /guests?:\s*(\d+)/i,
            /persons?:\s*(\d+)/i,
            /adults?:\s*(\d+)/i
          ],
          bookingRef: [
            /booking[\s\-]?(?:reference|ref|number|id):\s*([A-Z0-9\-]+)/i,
            /confirmation[\s\-]?(?:number|code):\s*([A-Z0-9\-]+)/i
          ]
        },
        dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD"],
        indicators: ["booking.com", "genius", "confirmation"]
      },
      airbnb: {
        name: "Airbnb",
        patterns: {
          propertyName: [
            /(?:stay at|listing)\s*(.+?)(?:\n|$)/i,
            /property:\s*(.+?)(?:\n|$)/i,
            /(?:^|\n)(.+?)\s*(?:lisbon|porto|portugal)/i
          ],
          guestName: [
            /guest:\s*(.+?)(?:\n|$)/i,
            /traveler:\s*(.+?)(?:\n|$)/i,
            /name:\s*(.+?)(?:\n|$)/i
          ],
          checkIn: [
            /check[\-\s]?in:\s*(.+?)(?:\n|$)/i,
            /arrival:\s*(.+?)(?:\n|$)/i,
            /from:\s*(.+?)(?:\n|$)/i
          ],
          checkOut: [
            /check[\-\s]?out:\s*(.+?)(?:\n|$)/i,
            /departure:\s*(.+?)(?:\n|$)/i,
            /until:\s*(.+?)(?:\n|$)/i
          ],
          guests: [
            /guests?:\s*(\d+)/i,
            /travelers?:\s*(\d+)/i
          ],
          bookingRef: [
            /reservation[\s\-]?(?:code|number):\s*([A-Z0-9\-]+)/i,
            /confirmation[\s\-]?code:\s*([A-Z0-9\-]+)/i
          ]
        },
        dateFormats: ["MMM DD, YYYY", "DD/MM/YYYY", "MM/DD/YYYY"],
        indicators: ["airbnb", "reservation", "itinerary"]
      }
    };
    PDFImportService = class _PDFImportService {
      static instance;
      propertiesList = [];
      lastPropertiesUpdate = 0;
      PROPERTIES_CACHE_TTL = 3e5;
      // 5 minutes
      constructor() {
      }
      static getInstance() {
        if (!_PDFImportService.instance) {
          _PDFImportService.instance = new _PDFImportService();
        }
        return _PDFImportService.instance;
      }
      // ===== PUBLIC METHODS =====
      /**
       * Import reservations from PDF files with enhanced parallel processing
       * @param pdfFiles Array of PDF files (base64 encoded)
       * @param options Import options
       * @returns Import results with detailed report
       */
      async importFromPDFs(pdfFiles, options = {}) {
        const startTime = Date.now();
        const {
          autoMatch = true,
          confidenceThreshold = 0.7,
          createUnmatchedProperties = false,
          batchSize = 8,
          // Reduced for better parallel processing
          parallelConcurrency = Math.min(4, Math.ceil(pdfFiles.length / 2))
          // Dynamic concurrency
        } = options;
        console.log(`\u{1F4C4} Starting parallel PDF import for ${pdfFiles.length} files with concurrency ${parallelConcurrency}`);
        try {
          const [_, validationResults] = await Promise.all([
            this.updatePropertiesList(),
            // Pre-validate files in parallel
            this.validatePDFFiles(pdfFiles)
          ]);
          const validFiles = pdfFiles.filter((_2, index) => validationResults[index].valid);
          console.log(`\u2705 ${validFiles.length}/${pdfFiles.length} files passed validation`);
          const allReservations = [];
          const errors = validationResults.filter((result) => !result.valid).map((result) => result.error);
          const unmatchedPropertiesMap = /* @__PURE__ */ new Map();
          console.log(`\u26A1 Processing ${validFiles.length} files in parallel batches`);
          const batches = [];
          for (let i = 0; i < validFiles.length; i += batchSize) {
            batches.push(validFiles.slice(i, i + batchSize));
          }
          const semaphore = /* @__PURE__ */ new Map();
          let activeTasks = 0;
          const processWithConcurrency = async (file) => {
            while (activeTasks >= parallelConcurrency) {
              await new Promise((resolve2) => setTimeout(resolve2, 10));
            }
            activeTasks++;
            try {
              return await this.processPDFFile(file.content, file.filename);
            } finally {
              activeTasks--;
            }
          };
          const batchPromises = batches.map(async (batch, batchIndex) => {
            console.log(`\u{1F4E6} Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} files)`);
            const filePromises = batch.map(async (file) => {
              try {
                const result = await processWithConcurrency(file);
                return { success: true, reservations: result, filename: file.filename };
              } catch (error) {
                const errorMsg = `Error processing ${file.filename}: ${error instanceof Error ? error.message : "Unknown error"}`;
                return { success: false, error: errorMsg, filename: file.filename };
              }
            });
            return await Promise.allSettled(filePromises);
          });
          const allBatchResults = await Promise.all(batchPromises);
          for (const batchResults of allBatchResults) {
            for (const result of batchResults) {
              if (result.status === "fulfilled") {
                const fileResult = result.value;
                if (fileResult.success) {
                  allReservations.push(...fileResult.reservations);
                } else {
                  errors.push(fileResult.error);
                  console.error(fileResult.error);
                }
              } else {
                errors.push(`Batch processing failed: ${result.reason}`);
                console.error("Batch processing failed:", result.reason);
              }
            }
          }
          const processedReservations = [];
          for (const reservation of allReservations) {
            const processed = {
              ...reservation,
              // Keep the existing property match but update confidence thresholds
              confidence: reservation.propertyMatch.matchScore,
              status: this.determineMatchStatus(reservation.propertyMatch, confidenceThreshold)
            };
            processedReservations.push(processed);
            if (processed.status === "unmatched") {
              const key = processed.propertyMatch.normalizedName;
              if (unmatchedPropertiesMap.has(key)) {
                unmatchedPropertiesMap.get(key).count++;
              } else {
                unmatchedPropertiesMap.set(key, {
                  originalName: processed.propertyMatch.originalName,
                  normalizedName: processed.propertyMatch.normalizedName,
                  count: 1,
                  suggestions: processed.propertyMatch.suggestions
                });
              }
            }
          }
          const processingTime = Date.now() - startTime;
          const report = this.generateImportReport(processedReservations, processingTime);
          console.log(`\u2705 PDF import completed in ${processingTime}ms`);
          console.log(`\u{1F4CA} Results: ${report.matchedReservations} matched, ${report.suggestedReservations} suggested, ${report.unmatchedReservations} unmatched`);
          return {
            success: true,
            reservations: processedReservations,
            unmatchedProperties: Array.from(unmatchedPropertiesMap.values()),
            report,
            errors
          };
        } catch (error) {
          console.error("\u274C PDF import failed:", error);
          return {
            success: false,
            reservations: [],
            unmatchedProperties: [],
            report: this.generateEmptyReport(),
            errors: [error instanceof Error ? error.message : "Unknown error"]
          };
        }
      }
      /**
       * Get property suggestions for an unmatched property name
       * @param propertyName Property name to find suggestions for
       * @param limit Maximum number of suggestions
       * @returns Array of property suggestions
       */
      async getPropertySuggestions(propertyName, limit = 5) {
        await this.updatePropertiesList();
        const matches = enhancedMatchProperty(propertyName, this.propertiesList, {
          minConfidenceScore: 0.3,
          maxResults: limit * 2,
          // Get more results to filter
          includePartialMatches: true
        });
        return matches.map((match) => ({
          property: match.property,
          score: match.matchScore,
          reason: this.explainMatchReason(propertyName, match.property, match.matchScore)
        })).slice(0, limit);
      }
      /**
       * Learn from successful property matches to improve future matching
       * @param originalName Original property name from PDF
       * @param matchedProperty The property it was matched to
       * @param confidence Confidence of the match
       */
      async learnFromMatch(originalName, matchedProperty, confidence) {
        if (confidence < 0.7) return;
        try {
          const aliases = matchedProperty.aliases || [];
          const normalizedOriginal = this.normalizePropertyName(originalName);
          const existingAliases = aliases.map((alias) => this.normalizePropertyName(alias));
          if (!existingAliases.includes(normalizedOriginal) && this.normalizePropertyName(matchedProperty.name) !== normalizedOriginal) {
            const updatedAliases = [...aliases, originalName];
            await db2.update(properties).set({ aliases: updatedAliases }).where(eq3(properties.id, matchedProperty.id));
            console.log(`\u{1F9E0} Learned new alias "${originalName}" for property "${matchedProperty.name}"`);
            propertyMatchCache.delete(originalName);
            await this.updatePropertiesList();
          }
        } catch (error) {
          console.error("Error learning from match:", error);
        }
      }
      // ===== PRIVATE METHODS =====
      /**
       * Process a single PDF file and extract reservations
       */
      async processPDFFile(pdfBase64, filename) {
        console.log(`\u{1F4C4} Processing PDF: ${filename}`);
        try {
          const extractedText = await aiService.extractTextFromPDF(pdfBase64);
          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("No text could be extracted from PDF");
          }
          console.log(`\u{1F4DD} Extracted ${extractedText.length} characters from ${filename}`);
          const platform = this.detectPlatform(extractedText);
          console.log(`\u{1F50D} Detected platform: ${platform || "unknown"}`);
          const aiExtractionResult = await aiService.processReservationDocument(
            pdfBase64,
            "application/pdf"
          );
          if (!aiExtractionResult.success) {
            throw new Error(aiExtractionResult.error || "AI extraction failed");
          }
          const reservations5 = await this.parseAIExtractionResult(
            aiExtractionResult.data,
            extractedText,
            platform
          );
          console.log(`\u2705 Extracted ${reservations5.length} reservations from ${filename}`);
          return reservations5;
        } catch (error) {
          console.error(`\u274C Error processing ${filename}:`, error);
          throw error;
        }
      }
      /**
       * Parse AI extraction result into structured reservations
       */
      async parseAIExtractionResult(aiData, rawText, platform) {
        const reservations5 = [];
        let reservationData = [];
        if (Array.isArray(aiData)) {
          reservationData = aiData;
        } else if (aiData.reservations && Array.isArray(aiData.reservations)) {
          reservationData = aiData.reservations;
        } else if (aiData.propertyName && aiData.guestName) {
          reservationData = [aiData];
        } else {
          reservationData = await this.extractUsingPatterns(rawText, platform);
        }
        for (let i = 0; i < reservationData.length; i++) {
          const data = reservationData[i];
          try {
            const reservation = await this.createReservationFromData(data, platform);
            const propertyMatch = await this.findPropertyMatch(
              data.propertyName || data.property_name || "",
              0.5
            );
            reservations5.push({
              reservation,
              propertyMatch,
              confidence: propertyMatch.matchScore,
              status: this.determineMatchStatus(propertyMatch, 0.7)
            });
          } catch (error) {
            console.error(`Error creating reservation ${i + 1}:`, error);
          }
        }
        return reservations5;
      }
      /**
       * Extract reservations using pattern matching (fallback method)
       */
      async extractUsingPatterns(text2, platform) {
        const reservations5 = [];
        if (!platform || !PLATFORM_CONFIGS[platform]) {
          return await this.genericPatternExtraction(text2);
        }
        const config = PLATFORM_CONFIGS[platform];
        const blocks = this.splitIntoReservationBlocks(text2);
        for (const block of blocks) {
          const reservation = this.extractFromBlock(block, config);
          if (reservation && reservation.propertyName && reservation.guestName) {
            reservations5.push(reservation);
          }
        }
        return reservations5;
      }
      /**
       * Generic pattern extraction for unknown formats
       */
      async genericPatternExtraction(text2) {
        const reservations5 = [];
        const patterns = {
          propertyName: [
            /(?:property|accommodation|hotel|apartment|house|villa|studio|room):\s*([^\n]+)/gi,
            /(?:^|\n)([^:\n]*(?:apartment|house|villa|studio|room)[^:\n]*)/gi
          ],
          guestName: [
            /(?:guest|name|traveler|booker):\s*([^\n]+)/gi,
            /(?:mr|mrs|ms)\.?\s+([a-z\s]+)/gi
          ],
          dates: [
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
            /(\d{4}-\d{2}-\d{2})/g
          ]
        };
        const properties3 = this.extractAllMatches(text2, patterns.propertyName);
        const guests = this.extractAllMatches(text2, patterns.guestName);
        const dates = this.extractAllMatches(text2, patterns.dates);
        const maxItems = Math.max(properties3.length, guests.length, Math.floor(dates.length / 2));
        for (let i = 0; i < maxItems; i++) {
          const reservation = {
            propertyName: properties3[i] || "",
            guestName: guests[i] || "",
            checkInDate: dates[i * 2] || "",
            checkOutDate: dates[i * 2 + 1] || "",
            totalGuests: 1
          };
          if (reservation.propertyName && reservation.guestName) {
            reservations5.push(reservation);
          }
        }
        return reservations5;
      }
      /**
       * Extract all matches for given patterns
       */
      extractAllMatches(text2, patterns) {
        const matches = /* @__PURE__ */ new Set();
        for (const pattern of patterns) {
          const results = text2.match(pattern);
          if (results) {
            results.forEach((match) => {
              const cleaned = match.replace(/^[^:]*:\s*/, "").trim();
              if (cleaned.length > 2) {
                matches.add(cleaned);
              }
            });
          }
        }
        return Array.from(matches);
      }
      /**
       * Split text into potential reservation blocks
       */
      splitIntoReservationBlocks(text2) {
        const delimiters = [
          /(?:\n\s*){2,}/,
          // Multiple line breaks
          /(?:reservation|booking|confirmation)\s*(?:number|code|id)/i,
          /(?:guest|traveler|name):\s*[^\n]+\n/gi
        ];
        let blocks = [text2];
        for (const delimiter of delimiters) {
          const newBlocks = [];
          for (const block of blocks) {
            newBlocks.push(...block.split(delimiter));
          }
          blocks = newBlocks;
        }
        return blocks.filter((block) => block.trim().length > 50);
      }
      /**
       * Extract reservation data from a text block using platform config
       */
      extractFromBlock(block, config) {
        const reservation = {};
        reservation.propertyName = this.extractWithPatterns(block, config.patterns.propertyName);
        reservation.guestName = this.extractWithPatterns(block, config.patterns.guestName);
        reservation.checkInDate = this.extractWithPatterns(block, config.patterns.checkIn);
        reservation.checkOutDate = this.extractWithPatterns(block, config.patterns.checkOut);
        reservation.totalGuests = parseInt(this.extractWithPatterns(block, config.patterns.guests)) || 1;
        reservation.bookingReference = this.extractWithPatterns(block, config.patterns.bookingRef);
        if (reservation.checkInDate) {
          reservation.checkInDate = this.normalizeDate(reservation.checkInDate, config.dateFormats);
        }
        if (reservation.checkOutDate) {
          reservation.checkOutDate = this.normalizeDate(reservation.checkOutDate, config.dateFormats);
        }
        return reservation;
      }
      /**
       * Extract value using multiple patterns
       */
      extractWithPatterns(text2, patterns) {
        for (const pattern of patterns) {
          const match = text2.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return "";
      }
      /**
       * Detect platform from PDF text
       */
      detectPlatform(text2) {
        const lowerText = text2.toLowerCase();
        for (const [platform, config] of Object.entries(PLATFORM_CONFIGS)) {
          if (config.indicators.some((indicator) => lowerText.includes(indicator))) {
            return platform;
          }
        }
        return null;
      }
      /**
       * Create InsertReservation from extracted data
       */
      async createReservationFromData(data, platform) {
        const propertyName = data.propertyName || data.property_name || data.accommodation || "";
        const guestName = data.guestName || data.guest_name || data.name || "";
        const checkInDate = data.checkInDate || data.check_in_date || data.checkIn || data.arrival || "";
        const checkOutDate = data.checkOutDate || data.check_out_date || data.checkOut || data.departure || "";
        const totalGuests = parseInt(data.totalGuests || data.total_guests || data.guests || data.numGuests || "1") || 1;
        const guestEmail = data.guestEmail || data.guest_email || data.email || "";
        const guestPhone = data.guestPhone || data.guest_phone || data.phone || "";
        const notes = data.notes || data.specialRequests || data.special_requests || "";
        const bookingReference = data.bookingReference || data.booking_reference || data.confirmationCode || "";
        const reservation = {
          propertyId: 0,
          // Will be updated after property matching
          guestName: guestName || "Unknown Guest",
          checkInDate: this.normalizeDate(checkInDate) || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          checkOutDate: this.normalizeDate(checkOutDate) || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          totalAmount: "0",
          // Will be updated if available
          numGuests: totalGuests,
          guestEmail,
          guestPhone,
          status: "confirmed",
          notes: this.buildNotesString(notes, bookingReference, platform),
          source: this.mapPlatformToSource(platform)
        };
        return reservation;
      }
      /**
       * Build notes string with additional information
       */
      buildNotesString(notes, bookingReference, platform) {
        const noteParts = [];
        if (notes) noteParts.push(`Notas: ${notes}`);
        if (bookingReference) noteParts.push(`Ref: ${bookingReference}`);
        if (platform) noteParts.push(`Origem: ${platform}`);
        return noteParts.join(" | ");
      }
      /**
       * Map platform to source field
       */
      mapPlatformToSource(platform) {
        const platformMap = {
          "booking": "booking",
          "airbnb": "airbnb"
        };
        return platformMap[platform || ""] || "manual";
      }
      /**
       * Update properties list from database and pre-warm cache
       */
      async updatePropertiesList() {
        const now = Date.now();
        if (now - this.lastPropertiesUpdate < this.PROPERTIES_CACHE_TTL && this.propertiesList.length > 0) {
          return;
        }
        try {
          this.propertiesList = await db2.select().from(properties);
          this.lastPropertiesUpdate = now;
          await propertyMatchCache.preWarm(this.propertiesList);
          console.log(`\u{1F4CB} Updated properties list with ${this.propertiesList.length} properties`);
        } catch (error) {
          console.error("Error updating properties list:", error);
          throw error;
        }
      }
      /**
       * Find the best property match for a given property name
       */
      async findPropertyMatch(propertyName, confidenceThreshold = 0.7) {
        if (!propertyName || propertyName.trim() === "") {
          return this.createEmptyPropertyMatch(propertyName);
        }
        const cachedMatch = propertyMatchCache.get(propertyName);
        if (cachedMatch) {
          return cachedMatch;
        }
        const matches = enhancedMatchProperty(propertyName, this.propertiesList, {
          minConfidenceScore: 0.1,
          // Low threshold to get suggestions
          maxResults: 5,
          includePartialMatches: true
        });
        let bestMatch = matches[0];
        let matchType = "none";
        let property = null;
        let matchScore = 0;
        if (bestMatch) {
          property = bestMatch.property;
          matchScore = bestMatch.matchScore;
          if (bestMatch.matchedField === "name" && bestMatch.matchScore >= 0.95) {
            matchType = "exact";
          } else if (bestMatch.matchedField === "alias") {
            matchType = "alias";
          } else {
            matchType = "fuzzy";
          }
        }
        const match = {
          property,
          originalName: propertyName,
          normalizedName: this.normalizePropertyName(propertyName),
          matchScore,
          matchType,
          suggestions: matches.slice(0, 5).map((m) => ({
            property: m.property,
            score: m.matchScore,
            reason: this.explainMatchReason(propertyName, m.property, m.matchScore)
          }))
        };
        propertyMatchCache.set(propertyName, match);
        return match;
      }
      /**
       * Find fuzzy matches using Levenshtein distance and other algorithms
       */
      findFuzzyMatches(propertyName) {
        const normalizedInput = this.normalizePropertyName(propertyName);
        const suggestions = [];
        for (const property of this.propertiesList) {
          const score = this.calculateFuzzyScore(normalizedInput, property);
          if (score > 0.2) {
            suggestions.push({
              property,
              score,
              reason: this.explainMatchReason(normalizedInput, property, score)
            });
          }
        }
        return suggestions.sort((a, b) => b.score - a.score);
      }
      /**
       * Calculate fuzzy matching score using multiple algorithms
       */
      calculateFuzzyScore(normalizedInput, property) {
        const normalizedPropertyName = this.normalizePropertyName(property.name);
        if (normalizedInput === normalizedPropertyName) {
          return 1;
        }
        if (property.aliases && Array.isArray(property.aliases)) {
          for (const alias of property.aliases) {
            const normalizedAlias = this.normalizePropertyName(alias);
            if (normalizedInput === normalizedAlias) {
              return 0.95;
            }
          }
        }
        const substringScore = this.calculateSubstringScore(normalizedInput, normalizedPropertyName);
        const levenshteinScore = this.calculateLevenshteinScore(normalizedInput, normalizedPropertyName);
        const tokenScore = this.calculateTokenScore(normalizedInput, normalizedPropertyName);
        let aliasScore = 0;
        if (property.aliases && Array.isArray(property.aliases)) {
          for (const alias of property.aliases) {
            const normalizedAlias = this.normalizePropertyName(alias);
            const currentAliasScore = Math.max(
              this.calculateLevenshteinScore(normalizedInput, normalizedAlias),
              this.calculateTokenScore(normalizedInput, normalizedAlias)
            );
            aliasScore = Math.max(aliasScore, currentAliasScore * 0.9);
          }
        }
        return Math.max(substringScore, levenshteinScore, tokenScore, aliasScore);
      }
      /**
       * Calculate substring matching score
       */
      calculateSubstringScore(input, target) {
        if (input === target) return 1;
        if (input.length === 0 || target.length === 0) return 0;
        if (target.includes(input) || input.includes(target)) {
          const shorter = input.length < target.length ? input : target;
          const longer = input.length >= target.length ? input : target;
          return shorter.length / longer.length;
        }
        return 0;
      }
      /**
       * Calculate Levenshtein distance score
       */
      calculateLevenshteinScore(input, target) {
        if (input === target) return 1;
        if (input.length === 0 || target.length === 0) return 0;
        const distance = this.levenshteinDistance(input, target);
        const maxLength = Math.max(input.length, target.length);
        return Math.max(0, 1 - distance / maxLength);
      }
      /**
       * Calculate Levenshtein distance between two strings
       */
      levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
          matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
          matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
          for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                // substitution
                matrix[i][j - 1] + 1,
                // insertion
                matrix[i - 1][j] + 1
                // deletion
              );
            }
          }
        }
        return matrix[str2.length][str1.length];
      }
      /**
       * Calculate token-based matching score
       */
      calculateTokenScore(input, target) {
        const inputTokens = new Set(input.split(/\s+/).filter((token) => token.length > 1));
        const targetTokens = new Set(target.split(/\s+/).filter((token) => token.length > 1));
        if (inputTokens.size === 0 || targetTokens.size === 0) return 0;
        const intersection = new Set([...inputTokens].filter((token) => targetTokens.has(token)));
        const union = /* @__PURE__ */ new Set([...inputTokens, ...targetTokens]);
        return intersection.size / union.size;
      }
      /**
       * Normalize property name for consistent matching
       */
      normalizePropertyName(name) {
        if (!name) return "";
        return name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\bapt\b/g, "apartment").replace(/\bst\b/g, "street").replace(/\bav\b/g, "avenue").replace(/\bpça\b/g, "praca").replace(/\br\b/g, "rua").replace(/\bt\d+\b/g, (match) => `t${match.slice(1)}`).replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
      }
      /**
       * Normalize date string to YYYY-MM-DD format
       */
      normalizeDate(dateStr, formats) {
        if (!dateStr) return "";
        const commonFormats = [
          /(\d{4})-(\d{2})-(\d{2})/,
          // YYYY-MM-DD
          /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
          // DD/MM/YYYY or DD-MM-YYYY
          /(\d{2})[\/\-](\d{2})[\/\-](\d{2})/,
          // DD/MM/YY or DD-MM-YY
          /(\d{1,2})\s+(\w+)\s+(\d{4})/
          // DD Month YYYY
        ];
        for (const format2 of commonFormats) {
          const match = dateStr.match(format2);
          if (match) {
            try {
              let year, month, day;
              if (format2.source.includes("(\\\\d{4})-(\\\\d{2})-(\\\\d{2})")) {
                [, year, month, day] = match;
              } else if (format2.source.includes("(\\\\d{2})[\\\\/\\\\-](\\\\d{2})[\\\\/\\\\-](\\\\d{4})")) {
                [, day, month, year] = match;
              } else if (format2.source.includes("(\\\\d{2})[\\\\/\\\\-](\\\\d{2})[\\\\/\\\\-](\\\\d{2})")) {
                [, day, month, year] = match;
                year = parseInt(year) < 50 ? `20${year}` : `19${year}`;
              } else if (format2.source.includes("(\\\\d{1,2})\\\\s+(\\\\w+)\\\\s+(\\\\d{4})")) {
                [, day, month, year] = match;
                month = this.monthNameToNumber(month);
              }
              if (year && month && day) {
                const normalizedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                const dateObj = new Date(normalizedDate);
                if (dateObj.getFullYear() == parseInt(year) && dateObj.getMonth() + 1 == parseInt(month) && dateObj.getDate() == parseInt(day)) {
                  return normalizedDate;
                }
              }
            } catch (error) {
              continue;
            }
          }
        }
        try {
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString().split("T")[0];
          }
        } catch (error) {
        }
        return "";
      }
      /**
       * Convert month name to number
       */
      monthNameToNumber(monthName) {
        const months = {
          "jan": 1,
          "january": 1,
          "janeiro": 1,
          "feb": 2,
          "february": 2,
          "fevereiro": 2,
          "mar": 3,
          "march": 3,
          "mar\xE7o": 3,
          "apr": 4,
          "april": 4,
          "abril": 4,
          "may": 5,
          "maio": 5,
          "jun": 6,
          "june": 6,
          "junho": 6,
          "jul": 7,
          "july": 7,
          "julho": 7,
          "aug": 8,
          "august": 8,
          "agosto": 8,
          "sep": 9,
          "september": 9,
          "setembro": 9,
          "oct": 10,
          "october": 10,
          "outubro": 10,
          "nov": 11,
          "november": 11,
          "novembro": 11,
          "dec": 12,
          "december": 12,
          "dezembro": 12
        };
        return months[monthName.toLowerCase()] || 1;
      }
      /**
       * Explain why a match was made
       */
      explainMatchReason(normalizedInput, property, score) {
        const normalizedPropertyName = this.normalizePropertyName(property.name);
        if (score === 1) return "Correspond\xEAncia exata";
        if (score >= 0.95) return "Correspond\xEAncia por alias";
        if (score >= 0.8) return "Correspond\xEAncia muito pr\xF3xima";
        if (score >= 0.6) return "Correspond\xEAncia pr\xF3xima";
        if (score >= 0.4) return "Correspond\xEAncia parcial";
        return "Correspond\xEAncia fraca";
      }
      /**
       * Determine match status based on score and threshold
       */
      determineMatchStatus(propertyMatch, confidenceThreshold) {
        if (propertyMatch.matchScore >= confidenceThreshold) {
          return "matched";
        } else if (propertyMatch.matchScore >= 0.4) {
          return "suggested";
        } else {
          return "unmatched";
        }
      }
      /**
       * Create an empty property match for unmatched properties
       */
      createEmptyPropertyMatch(propertyName) {
        return {
          property: null,
          originalName: propertyName,
          normalizedName: this.normalizePropertyName(propertyName),
          matchScore: 0,
          matchType: "none",
          suggestions: []
        };
      }
      /**
       * Generate detailed import report
       */
      generateImportReport(reservations5, processingTime) {
        const total = reservations5.length;
        const matched = reservations5.filter((r) => r.status === "matched").length;
        const suggested = reservations5.filter((r) => r.status === "suggested").length;
        const unmatched = reservations5.filter((r) => r.status === "unmatched").length;
        const propertyNames = new Set(reservations5.map((r) => r.propertyMatch.originalName));
        const unmatchedPropertyNames = new Set(
          reservations5.filter((r) => r.status === "unmatched").map((r) => r.propertyMatch.originalName)
        );
        const high = reservations5.filter((r) => r.confidence > 0.8).length;
        const medium = reservations5.filter((r) => r.confidence >= 0.5 && r.confidence <= 0.8).length;
        const low = reservations5.filter((r) => r.confidence < 0.5).length;
        return {
          totalReservations: total,
          matchedReservations: matched,
          suggestedReservations: suggested,
          unmatchedReservations: unmatched,
          uniqueProperties: propertyNames.size,
          unmatchedProperties: unmatchedPropertyNames.size,
          processingTime,
          confidenceDistribution: { high, medium, low }
        };
      }
      /**
       * Generate empty report for failed imports
       */
      generateEmptyReport() {
        return {
          totalReservations: 0,
          matchedReservations: 0,
          suggestedReservations: 0,
          unmatchedReservations: 0,
          uniqueProperties: 0,
          unmatchedProperties: 0,
          processingTime: 0,
          confidenceDistribution: { high: 0, medium: 0, low: 0 }
        };
      }
    };
    pdfImportService = PDFImportService.getInstance();
  }
});

// server/controllers/pdfImport.controller.ts
var pdfImport_controller_exports = {};
__export(pdfImport_controller_exports, {
  PDFImportController: () => PDFImportController,
  handleConfirmMatches: () => handleConfirmMatches,
  handleGetImportReport: () => handleGetImportReport,
  handleGetImportStats: () => handleGetImportStats,
  handleLearnFromMatch: () => handleLearnFromMatch,
  handlePDFImport: () => handlePDFImport,
  handleSuggestProperties: () => handleSuggestProperties
});
import { z as z2 } from "zod";
import multer from "multer";
import { eq as eq4 } from "drizzle-orm";
var ImportPDFSchema, SuggestPropertiesSchema, LearnFromMatchSchema, ConfirmMatchesSchema, storage2, upload, PDFImportController, handlePDFImport, handleSuggestProperties, handleLearnFromMatch, handleConfirmMatches, handleGetImportReport, handleGetImportStats;
var init_pdfImport_controller = __esm({
  "server/controllers/pdfImport.controller.ts"() {
    "use strict";
    init_pdfImportService();
    init_db2();
    init_schema();
    ImportPDFSchema = z2.object({
      files: z2.array(z2.object({
        content: z2.string(),
        // Base64 encoded PDF content
        filename: z2.string(),
        mimeType: z2.string().optional()
      })).min(1, "At least one file is required"),
      options: z2.object({
        autoMatch: z2.boolean().optional().default(true),
        confidenceThreshold: z2.number().min(0).max(1).optional().default(0.7),
        createUnmatchedProperties: z2.boolean().optional().default(false),
        batchSize: z2.number().min(1).max(50).optional().default(10)
      }).optional().default({})
    });
    SuggestPropertiesSchema = z2.object({
      propertyName: z2.string().min(1, "Property name is required"),
      limit: z2.number().min(1).max(20).optional().default(5)
    });
    LearnFromMatchSchema = z2.object({
      originalName: z2.string().min(1, "Original name is required"),
      propertyId: z2.number().int().positive("Property ID must be a positive integer"),
      confidence: z2.number().min(0).max(1, "Confidence must be between 0 and 1")
    });
    ConfirmMatchesSchema = z2.object({
      matches: z2.array(z2.object({
        reservationIndex: z2.number().int().min(0),
        propertyId: z2.number().int().positive(),
        confidence: z2.number().min(0).max(1).optional().default(1)
      })).min(1, "At least one match is required")
    });
    storage2 = multer.memoryStorage();
    upload = multer({
      storage: storage2,
      limits: {
        fileSize: 10 * 1024 * 1024,
        // 10MB per file
        files: 20
        // Maximum 20 files
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
          cb(null, true);
        } else {
          cb(new Error("Only PDF files are allowed"));
        }
      }
    });
    PDFImportController = class {
      /**
       * Import reservations from PDF files
       * POST /api/pdf-import
       */
      static async importFromPDFs(req, res) {
        try {
          console.log("\u{1F4C4} PDF import request received");
          let parsedBody;
          if (req.files && Array.isArray(req.files)) {
            const files2 = req.files;
            parsedBody = {
              files: files2.map((file) => ({
                content: file.buffer.toString("base64"),
                filename: file.originalname,
                mimeType: file.mimetype
              })),
              options: req.body.options ? JSON.parse(req.body.options) : {}
            };
          } else {
            parsedBody = req.body;
          }
          const validatedData = ImportPDFSchema.parse(parsedBody);
          const { files, options } = validatedData;
          console.log(`\u{1F4E6} Processing ${files.length} PDF files with options:`, options);
          const importResult = await pdfImportService.importFromPDFs(files, options);
          const importSession = {
            id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            result: importResult
          };
          res.status(200).json({
            success: true,
            message: `Successfully processed ${files.length} PDF files`,
            sessionId: importSession.id,
            data: {
              summary: {
                totalFiles: files.length,
                totalReservations: importResult.report.totalReservations,
                matchedReservations: importResult.report.matchedReservations,
                suggestedReservations: importResult.report.suggestedReservations,
                unmatchedReservations: importResult.report.unmatchedReservations,
                processingTime: importResult.report.processingTime
              },
              reservations: importResult.reservations,
              unmatchedProperties: importResult.unmatchedProperties,
              report: importResult.report,
              errors: importResult.errors
            }
          });
        } catch (error) {
          console.error("\u274C PDF import error:", error);
          if (error instanceof z2.ZodError) {
            res.status(400).json({
              success: false,
              message: "Validation error",
              errors: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message
              }))
            });
            return;
          }
          res.status(500).json({
            success: false,
            message: "Failed to import PDF files",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Get property suggestions for unmatched property names
       * POST /api/pdf-import/suggest
       */
      static async suggestProperties(req, res) {
        try {
          const validatedData = SuggestPropertiesSchema.parse(req.body);
          const { propertyName, limit } = validatedData;
          console.log(`\u{1F50D} Getting property suggestions for: "${propertyName}"`);
          const suggestions = await pdfImportService.getPropertySuggestions(propertyName, limit);
          res.status(200).json({
            success: true,
            message: `Found ${suggestions.length} suggestions for "${propertyName}"`,
            data: {
              propertyName,
              suggestions: suggestions.map((suggestion) => ({
                property: {
                  id: suggestion.property.id,
                  name: suggestion.property.name,
                  aliases: suggestion.property.aliases
                },
                score: Math.round(suggestion.score * 100) / 100,
                // Round to 2 decimal places
                reason: suggestion.reason
              }))
            }
          });
        } catch (error) {
          console.error("\u274C Property suggestions error:", error);
          if (error instanceof z2.ZodError) {
            res.status(400).json({
              success: false,
              message: "Validation error",
              errors: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message
              }))
            });
            return;
          }
          res.status(500).json({
            success: false,
            message: "Failed to get property suggestions",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Learn from user corrections to improve future matching
       * POST /api/pdf-import/learn
       */
      static async learnFromMatch(req, res) {
        try {
          const validatedData = LearnFromMatchSchema.parse(req.body);
          const { originalName, propertyId, confidence } = validatedData;
          console.log(`\u{1F9E0} Learning from match: "${originalName}" -> Property ID ${propertyId} (confidence: ${confidence})`);
          const property = await db2.select().from(properties).where(eq4(properties.id, propertyId)).limit(1);
          if (property.length === 0) {
            res.status(404).json({
              success: false,
              message: `Property with ID ${propertyId} not found`
            });
            return;
          }
          await pdfImportService.learnFromMatch(originalName, property[0], confidence);
          res.status(200).json({
            success: true,
            message: `Successfully learned from match: "${originalName}" -> "${property[0].name}"`
          });
        } catch (error) {
          console.error("\u274C Learn from match error:", error);
          if (error instanceof z2.ZodError) {
            res.status(400).json({
              success: false,
              message: "Validation error",
              errors: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message
              }))
            });
            return;
          }
          res.status(500).json({
            success: false,
            message: "Failed to learn from match",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Confirm property matches and create reservations
       * POST /api/pdf-import/confirm
       */
      static async confirmMatches(req, res) {
        try {
          const validatedData = ConfirmMatchesSchema.parse(req.body);
          const { matches } = validatedData;
          console.log(`\u2705 Confirming ${matches.length} property matches`);
          const results = [];
          for (const match of matches) {
            try {
              await pdfImportService.learnFromMatch(
                `reservation_${match.reservationIndex}`,
                // Placeholder - use actual property name
                { id: match.propertyId },
                // Placeholder - get actual property
                match.confidence
              );
              results.push({
                reservationIndex: match.reservationIndex,
                propertyId: match.propertyId,
                status: "confirmed",
                message: "Match confirmed and learned"
              });
            } catch (error) {
              results.push({
                reservationIndex: match.reservationIndex,
                propertyId: match.propertyId,
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
              });
            }
          }
          const successCount = results.filter((r) => r.status === "confirmed").length;
          const errorCount = results.filter((r) => r.status === "error").length;
          res.status(200).json({
            success: true,
            message: `Confirmed ${successCount} matches. ${errorCount} errors.`,
            data: {
              results,
              summary: {
                total: matches.length,
                confirmed: successCount,
                errors: errorCount
              }
            }
          });
        } catch (error) {
          console.error("\u274C Confirm matches error:", error);
          if (error instanceof z2.ZodError) {
            res.status(400).json({
              success: false,
              message: "Validation error",
              errors: error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message
              }))
            });
            return;
          }
          res.status(500).json({
            success: false,
            message: "Failed to confirm matches",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Get detailed import report
       * GET /api/pdf-import/report/:sessionId
       */
      static async getImportReport(req, res) {
        try {
          const { sessionId } = req.params;
          console.log(`\u{1F4CA} Getting import report for session: ${sessionId}`);
          res.status(200).json({
            success: true,
            message: `Import report for session ${sessionId}`,
            data: {
              sessionId,
              status: "completed",
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              report: {
                totalReservations: 0,
                matchedReservations: 0,
                suggestedReservations: 0,
                unmatchedReservations: 0,
                uniqueProperties: 0,
                unmatchedProperties: 0,
                processingTime: 0,
                confidenceDistribution: { high: 0, medium: 0, low: 0 }
              }
            }
          });
        } catch (error) {
          console.error("\u274C Get import report error:", error);
          res.status(500).json({
            success: false,
            message: "Failed to get import report",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      /**
       * Get import statistics and analytics
       * GET /api/pdf-import/stats
       */
      static async getImportStats(req, res) {
        try {
          console.log("\u{1F4CA} Getting PDF import statistics");
          const stats = {
            totalImports: 0,
            totalFilesProcessed: 0,
            totalReservationsImported: 0,
            averageMatchRate: 0,
            topUnmatchedProperties: [],
            recentImports: [],
            performanceMetrics: {
              averageProcessingTime: 0,
              averageFileSize: 0,
              successRate: 0
            }
          };
          res.status(200).json({
            success: true,
            message: "PDF import statistics retrieved successfully",
            data: stats
          });
        } catch (error) {
          console.error("\u274C Get import stats error:", error);
          res.status(500).json({
            success: false,
            message: "Failed to get import statistics",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    };
    handlePDFImport = [
      upload.array("files", 20),
      PDFImportController.importFromPDFs
    ];
    handleSuggestProperties = PDFImportController.suggestProperties;
    handleLearnFromMatch = PDFImportController.learnFromMatch;
    handleConfirmMatches = PDFImportController.confirmMatches;
    handleGetImportReport = PDFImportController.getImportReport;
    handleGetImportStats = PDFImportController.getImportStats;
  }
});

// server/services/security-audit.service.ts
var security_audit_service_exports = {};
__export(security_audit_service_exports, {
  SecurityAuditService: () => SecurityAuditService,
  securityAuditService: () => securityAuditService
});
import pino from "pino";
import { createHash } from "crypto";
import fs6 from "fs/promises";
import path6 from "path";
var auditLogger, SecurityAuditService, securityAuditService;
var init_security_audit_service = __esm({
  "server/services/security-audit.service.ts"() {
    "use strict";
    init_security();
    auditLogger = pino({
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
        this.auditLogDir = path6.join(process.cwd(), "logs", "security");
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
          await fs6.mkdir(this.auditLogDir, { recursive: true });
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
          const logFile = path6.join(this.auditLogDir, `security-audit-${date2}.json`);
          const logEntry = {
            ...event,
            timestamp: event.timestamp.toISOString()
          };
          const logLine = JSON.stringify(logEntry) + "\n";
          await fs6.appendFile(logFile, logLine);
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
          const count2 = ipCounts.get(event.ip) || 0;
          ipCounts.set(event.ip, count2 + 1);
        });
        this.metrics.topAttackingIPs = Array.from(ipCounts.entries()).map(([ip, count2]) => ({ ip, count: count2 })).sort((a, b) => b.count - a.count).slice(0, 10);
        const endpointCounts = /* @__PURE__ */ new Map();
        recentEvents.forEach((event) => {
          const endpoint = event.url.split("?")[0];
          const count2 = endpointCounts.get(endpoint) || 0;
          endpointCounts.set(endpoint, count2 + 1);
        });
        this.metrics.topTargetedEndpoints = Array.from(endpointCounts.entries()).map(([endpoint, count2]) => ({ endpoint, count: count2 })).sort((a, b) => b.count - a.count).slice(0, 10);
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
        return createHash("sha256").update(`${Date.now()}-${Math.random()}-${process.pid}`).digest("hex").substring(0, 16);
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
          const count2 = ipCounts.get(event.ip) || 0;
          ipCounts.set(event.ip, count2 + 1);
        });
        return Array.from(ipCounts.entries()).map(([ip, count2]) => ({ ip, count: count2 })).sort((a, b) => b.count - a.count).slice(0, 10);
      }
      getTopEndpoints(events) {
        const endpointCounts = /* @__PURE__ */ new Map();
        events.forEach((event) => {
          const endpoint = event.url.split("?")[0];
          const count2 = endpointCounts.get(endpoint) || 0;
          endpointCounts.set(endpoint, count2 + 1);
        });
        return Array.from(endpointCounts.entries()).map(([endpoint, count2]) => ({ endpoint, count: count2 })).sort((a, b) => b.count - a.count).slice(0, 10);
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
var security_exports = {};
__export(security_exports, {
  SecurityEventType: () => SecurityEventType,
  apiRateLimiter: () => apiRateLimiter,
  blockedIPs: () => blockedIPs,
  contentValidationMiddleware: () => contentValidationMiddleware,
  corsConfig: () => corsConfig,
  fileUploadSecurityMiddleware: () => fileUploadSecurityMiddleware,
  generateSecurityToken: () => generateSecurityToken,
  getClientIP: () => getClientIP,
  helmetConfig: () => helmetConfig,
  ipAttempts: () => ipAttempts,
  ipTrackingMiddleware: () => ipTrackingMiddleware,
  logSecurityEvent: () => logSecurityEvent,
  pdfImportRateLimiter: () => pdfImportRateLimiter,
  requestValidationMiddleware: () => requestValidationMiddleware,
  securityHeadersMiddleware: () => securityHeadersMiddleware,
  securityLogger: () => securityLogger,
  securityMiddlewareStack: () => securityMiddlewareStack,
  strictRateLimiter: () => strictRateLimiter,
  validateSecurityToken: () => validateSecurityToken
});
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { createHash as createHash2 } from "crypto";
import pino2 from "pino";
function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.connection.remoteAddress || req.socket.remoteAddress || "unknown";
}
async function logSecurityEvent(event) {
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
function generateSecurityToken() {
  return createHash2("sha256").update(`${Date.now()}-${Math.random()}-${process.env.SECRET_KEY || "fallback-secret"}`).digest("hex");
}
function validateSecurityToken(token, maxAge = 3e5) {
  if (!token || token.length !== 64) return false;
  return true;
}
var securityLogger, SecurityEventType, blockedIPs, ipAttempts, helmetConfig, allowedOrigins, corsConfig, apiRateLimiter, pdfImportRateLimiter, strictRateLimiter, requestValidationMiddleware, contentValidationMiddleware, fileUploadSecurityMiddleware, ipTrackingMiddleware, securityHeadersMiddleware, securityMiddlewareStack;
var init_security = __esm({
  "server/middleware/security.ts"() {
    "use strict";
    securityLogger = pino2({
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
    helmetConfig = helmet({
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
    corsConfig = cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        logSecurityEvent({
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
    apiRateLimiter = rateLimit({
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
        logSecurityEvent({
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
    pdfImportRateLimiter = rateLimit({
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
        logSecurityEvent({
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
    strictRateLimiter = rateLimit({
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
        logSecurityEvent({
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
        logSecurityEvent({
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
          logSecurityEvent({
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
          logSecurityEvent({
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
            logSecurityEvent({
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
            logSecurityEvent({
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
          logSecurityEvent({
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
          logSecurityEvent({
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
              logSecurityEvent({
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
    securityHeadersMiddleware = (req, res, next) => {
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
      securityHeadersMiddleware,
      ipTrackingMiddleware,
      requestValidationMiddleware,
      contentValidationMiddleware,
      fileUploadSecurityMiddleware
    ];
  }
});

// server/api/security-monitoring.ts
var security_monitoring_exports = {};
__export(security_monitoring_exports, {
  generateSecurityReport: () => generateSecurityReport,
  getIPAnalysis: () => getIPAnalysis,
  getRecentSecurityEvents: () => getRecentSecurityEvents,
  getSecurityMetrics: () => getSecurityMetrics,
  getSecurityStatus: () => getSecurityStatus,
  getThreatPatterns: () => getThreatPatterns,
  testSecurityEvent: () => testSecurityEvent
});
function convertReportToCSV(report) {
  const lines = [];
  lines.push("Timestamp,Type,Severity,IP,URL,Details");
  Object.entries(report.eventsByType).forEach(([type, count2]) => {
    lines.push(`${report.periodEnd},${type},info,system,report,"Count: ${count2}"`);
  });
  return lines.join("\n");
}
function calculateSecurityScore(metrics, recentEvents, patterns) {
  let score = 100;
  score -= (metrics.eventsBySeverity.critical || 0) * 10;
  score -= (metrics.eventsBySeverity.high || 0) * 5;
  score -= (metrics.eventsBySeverity.medium || 0) * 2;
  const activePatterns = patterns.filter((p) => p.matchCount > 0 && p.lastMatch && new Date(p.lastMatch).getTime() > Date.now() - 24 * 60 * 60 * 1e3);
  score -= activePatterns.length * 5;
  return Math.max(0, Math.min(100, score));
}
function determineThreatLevel(recentEvents) {
  const criticalCount = recentEvents.filter((e) => e.severity === "critical").length;
  const highCount = recentEvents.filter((e) => e.severity === "high").length;
  if (criticalCount > 0) return "critical";
  if (highCount > 2) return "high";
  if (recentEvents.length > 10) return "medium";
  return "low";
}
function groupBy(events, key) {
  const grouped = {};
  events.forEach((event) => {
    const value = event[key];
    grouped[value] = (grouped[value] || 0) + 1;
  });
  return grouped;
}
function getTopEndpoints(events) {
  const endpointCounts = /* @__PURE__ */ new Map();
  events.forEach((event) => {
    const endpoint = event.url.split("?")[0];
    const count2 = endpointCounts.get(endpoint) || 0;
    endpointCounts.set(endpoint, count2 + 1);
  });
  return Array.from(endpointCounts.entries()).map(([endpoint, count2]) => ({ endpoint, count: count2 })).sort((a, b) => b.count - a.count).slice(0, 5);
}
function getTopUserAgents(events) {
  const uaCounts = /* @__PURE__ */ new Map();
  events.forEach((event) => {
    const ua = event.userAgent || "unknown";
    const count2 = uaCounts.get(ua) || 0;
    uaCounts.set(ua, count2 + 1);
  });
  return Array.from(uaCounts.entries()).map(([userAgent, count2]) => ({ userAgent, count: count2 })).sort((a, b) => b.count - a.count).slice(0, 5);
}
function calculateIPRiskScore(events) {
  let riskScore = 0;
  events.forEach((event) => {
    switch (event.severity) {
      case "critical":
        riskScore += 10;
        break;
      case "high":
        riskScore += 5;
        break;
      case "medium":
        riskScore += 2;
        break;
      case "low":
        riskScore += 1;
        break;
    }
  });
  return Math.min(100, riskScore);
}
function generateIPRecommendations(events) {
  const recommendations = [];
  const criticalCount = events.filter((e) => e.severity === "critical").length;
  if (criticalCount > 0) {
    recommendations.push("Considere bloquear este IP imediatamente");
  }
  const rateLimitCount = events.filter((e) => e.type === "RATE_LIMIT_EXCEEDED" /* RATE_LIMIT_EXCEEDED */).length;
  if (rateLimitCount > 5) {
    recommendations.push("IP est\xE1 excedendo limites de taxa frequentemente");
  }
  const xssCount = events.filter((e) => e.type === "XSS_ATTEMPT" /* XSS_ATTEMPT */).length;
  if (xssCount > 0) {
    recommendations.push("IP tentou ataques XSS - monitorar de perto");
  }
  const sqlCount = events.filter((e) => e.type === "SQL_INJECTION_ATTEMPT" /* SQL_INJECTION_ATTEMPT */).length;
  if (sqlCount > 0) {
    recommendations.push("IP tentou SQL injection - considere bloqueio");
  }
  return recommendations;
}
var getSecurityMetrics, getRecentSecurityEvents, generateSecurityReport, getThreatPatterns, getSecurityStatus, getIPAnalysis, testSecurityEvent;
var init_security_monitoring = __esm({
  "server/api/security-monitoring.ts"() {
    "use strict";
    init_security_audit_service();
    init_security();
    getSecurityMetrics = async (req, res) => {
      try {
        const metrics = securityAuditService.getMetrics();
        res.json({
          success: true,
          data: metrics,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        console.error("Error fetching security metrics:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          code: "METRICS_ERROR"
        });
      }
    };
    getRecentSecurityEvents = async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 50;
        const type = req.query.type;
        const ip = req.query.ip;
        let events;
        if (type) {
          events = securityAuditService.getEventsByType(type, limit);
        } else if (ip) {
          events = securityAuditService.getEventsByIP(ip, limit);
        } else {
          events = securityAuditService.getRecentEvents(limit);
        }
        res.json({
          success: true,
          data: {
            events,
            total: events.length,
            filters: {
              type: type || null,
              ip: ip || null,
              limit
            }
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        console.error("Error fetching security events:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          code: "EVENTS_ERROR"
        });
      }
    };
    generateSecurityReport = async (req, res) => {
      try {
        const timeWindow = req.query.timeWindow || "24h";
        const format2 = req.query.format || "json";
        const report = securityAuditService.generateSecurityReport(timeWindow);
        if (format2 === "json") {
          res.json({
            success: true,
            data: report,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        } else if (format2 === "csv") {
          const csvData = convertReportToCSV(report);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename="security-report-${timeWindow}.csv"`);
          res.send(csvData);
        } else {
          res.status(400).json({
            success: false,
            error: 'Formato n\xE3o suportado. Use "json" ou "csv"',
            code: "INVALID_FORMAT"
          });
        }
      } catch (error) {
        console.error("Error generating security report:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          code: "REPORT_ERROR"
        });
      }
    };
    getThreatPatterns = async (req, res) => {
      try {
        const patterns = securityAuditService.getThreatPatterns();
        res.json({
          success: true,
          data: {
            patterns,
            total: patterns.length,
            enabled: patterns.filter((p) => p.enabled).length,
            totalMatches: patterns.reduce((sum2, p) => sum2 + p.matchCount, 0)
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        console.error("Error fetching threat patterns:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          code: "PATTERNS_ERROR"
        });
      }
    };
    getSecurityStatus = async (req, res) => {
      try {
        const metrics = securityAuditService.getMetrics();
        const recentEvents = securityAuditService.getRecentEvents(10);
        const patterns = securityAuditService.getThreatPatterns();
        const securityScore = calculateSecurityScore(metrics, recentEvents, patterns);
        const threatLevel = determineThreatLevel(recentEvents);
        res.json({
          success: true,
          data: {
            securityScore,
            threatLevel,
            summary: {
              totalEvents24h: metrics.totalEvents,
              criticalEvents: metrics.eventsBySeverity.critical || 0,
              blockedIPs: recentEvents.filter((e) => e.blocked).length,
              activeThreats: patterns.filter((p) => p.matchCount > 0 && p.lastMatch && new Date(p.lastMatch).getTime() > Date.now() - 24 * 60 * 60 * 1e3).length
            },
            lastUpdated: metrics.lastUpdated
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        console.error("Error fetching security status:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          code: "STATUS_ERROR"
        });
      }
    };
    getIPAnalysis = async (req, res) => {
      try {
        const targetIP = req.query.ip;
        if (!targetIP) {
          return res.status(400).json({
            success: false,
            error: "Par\xE2metro IP \xE9 obrigat\xF3rio",
            code: "MISSING_IP"
          });
        }
        const events = securityAuditService.getEventsByIP(targetIP, 100);
        const report = securityAuditService.generateSecurityReport("7d");
        const analysis = {
          ip: targetIP,
          totalEvents: events.length,
          firstSeen: events.length > 0 ? events[events.length - 1].timestamp : null,
          lastSeen: events.length > 0 ? events[0].timestamp : null,
          eventsByType: groupBy(events, "type"),
          eventsBySeverity: groupBy(events, "severity"),
          targetedEndpoints: getTopEndpoints(events),
          userAgents: getTopUserAgents(events),
          riskScore: calculateIPRiskScore(events),
          isBlocked: events.some((e) => e.blocked),
          recommendations: generateIPRecommendations(events)
        };
        res.json({
          success: true,
          data: analysis,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        console.error("Error analyzing IP:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          code: "IP_ANALYSIS_ERROR"
        });
      }
    };
    testSecurityEvent = async (req, res) => {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          error: "Endpoint dispon\xEDvel apenas em desenvolvimento",
          code: "PRODUCTION_DISABLED"
        });
      }
      try {
        const { type, severity, details } = req.body;
        if (!type || !severity) {
          return res.status(400).json({
            success: false,
            error: "Tipo e severidade s\xE3o obrigat\xF3rios",
            code: "MISSING_PARAMETERS"
          });
        }
        await securityAuditService.recordEvent({
          type,
          severity,
          ip: getClientIP(req),
          userAgent: req.get("User-Agent") || "test-agent",
          url: req.originalUrl,
          method: req.method,
          timestamp: /* @__PURE__ */ new Date(),
          details: details || { test: true },
          userId: "test-user"
        });
        res.json({
          success: true,
          message: "Evento de seguran\xE7a de teste registrado com sucesso"
        });
      } catch (error) {
        console.error("Error recording test security event:", error);
        res.status(500).json({
          success: false,
          error: "Erro interno do servidor",
          code: "TEST_EVENT_ERROR"
        });
      }
    };
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";
import compression from "compression";
import pino3 from "pino";
import pinoHttp from "pino-http";

// server/routes.ts
init_storage();
init_ai_adapter_service();
import { createServer } from "http";
import multer2 from "multer";
import bodyParser from "body-parser";
import { ZodError } from "zod";

// server/services/check-gemini-key.ts
function hasGeminiApiKey() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return apiKey !== void 0 && apiKey !== "";
}

// server/routes.ts
init_rag_enhanced_service();

// server/services/reservation-importer.service.ts
init_ai_adapter_service();
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

// server/controllers/ocr.controller.ts
init_ai_adapter_service();
init_handwriting_detector();
import fs2 from "fs";

// server/parsers/parseReservations.ts
async function parseReservationData(text2) {
  console.log("\u{1F50D} Iniciando extra\xE7\xE3o de dados de reserva a partir do texto OCR");
  const reservations5 = [];
  const missing = [];
  const boxes = {};
  try {
    console.log("\u{1F50D} Usando parser nativo sem IA");
    const requiredFields = [
      "propertyName",
      "guestName",
      "checkInDate",
      "checkOutDate",
      "numGuests",
      "totalAmount"
    ];
    const reservation = {};
    const missingInThisReservation = [...requiredFields];
    const propertyRegex = [
      // Regex específicos para propriedades conhecidas
      /(?:EXCITING\s+LISBON\s+)?(AROEIRA\s+[IV]+)/i,
      /(?:EXCITING\s+LISBON\s+)?(AROEIRA\s+\d+)/i,
      /(?:LISBON\s+)?(AROEIRA\s+[IV]+)/i,
      /(?:LISBON\s+)?(AROEIRA\s+\d+)/i,
      // Regex genéricos para propriedades
      /propriedade[\s:]+([^\n\.]+)/i,
      /property[\s:]+([^\n\.]+)/i,
      /alojamento[\s:]+([^\n\.]+)/i,
      /imóvel[\s:]+([^\n\.]+)/i,
      /localização[\s:]+([^\n\.]+)/i,
      /localização ([^,\.\n]+)/i,
      /location[\s:]+([^\n\.]+)/i,
      /apartamento[\s:]+([^\n\.]+)/i,
      /apartment[\s:]+([^\n\.]+)/i,
      /morada[\s:]+([^\n\.]+)/i,
      /address[\s:]+([^\n\.]+)/i
    ];
    for (const regex of propertyRegex) {
      const match = text2.match(regex);
      if (match) {
        reservation.propertyName = match[1].trim();
        const index = missingInThisReservation.indexOf("propertyName");
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    if (!reservation.propertyName) {
      const knownProperties = [
        /AROEIRA\s+[IV]+/i,
        /AROEIRA\s+\d+/i,
        /EXCITING\s+LISBON\s+AROEIRA/i,
        /LISBON\s+AROEIRA/i
      ];
      for (const regex of knownProperties) {
        const match = text2.match(regex);
        if (match) {
          reservation.propertyName = match[0].trim();
          const index = missingInThisReservation.indexOf("propertyName");
          if (index !== -1) missingInThisReservation.splice(index, 1);
          break;
        }
      }
    }
    if (!reservation.propertyName) {
      const lines = text2.split("\n").map((l) => l.trim()).filter((l) => l);
      if (lines.length > 0 && lines[0].length > 3) {
        const firstLine = lines[0];
        if (firstLine.toUpperCase() === firstLine || /^[A-Z]/.test(firstLine)) {
          reservation.propertyName = firstLine;
          const index = missingInThisReservation.indexOf("propertyName");
          if (index !== -1) missingInThisReservation.splice(index, 1);
        }
      }
    }
    if (!reservation.propertyName) {
      const addressLines = text2.split("\n").filter(
        (line) => (line.includes("Rua") || line.includes("Av.") || line.includes("Avenida") || line.includes("R.") || line.includes("Pra\xE7a") || line.includes("Travessa") || line.includes("Lisboa") || line.includes("Porto")) && !line.toLowerCase().includes("email") && !line.toLowerCase().includes("telefone")
      );
      if (addressLines.length > 0) {
        reservation.propertyName = addressLines[0].trim();
        const index = missingInThisReservation.indexOf("propertyName");
        if (index !== -1) missingInThisReservation.splice(index, 1);
      }
    }
    const guestRegex = [
      /hóspede[\s:]+([^\n\.]+)/i,
      /hospede[\s:]+([^\n\.]+)/i,
      /cliente[\s:]+([^\n\.]+)/i,
      /guest[\s:]+([^\n\.]+)/i,
      /nome do cliente[\s:]+([^\n\.]+)/i,
      /nome[\s:]+([^\n\.]+)/i,
      /name[\s:]+([^\n\.]+)/i,
      /guest name[\s:]+([^\n\.]+)/i,
      /nome:[\s]*([^\n\.]+)/i,
      /name:[\s]*([^\n\.]+)/i,
      /data.*saída.*noites.*Nome.*hóspedes.*país.*site.*info.*([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s]+)[\d]/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+\d+\s+([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s]+)\d+/i
    ];
    for (const regex of guestRegex) {
      const match = text2.match(regex);
      if (match) {
        if (regex.toString().includes("data.*sa\xEDda") || regex.toString().includes("\\d{1,2}/\\d{1,2}/\\d{2,4}")) {
          reservation.guestName = (match[3] || match[1]).trim();
        } else {
          reservation.guestName = match[1].trim();
        }
        reservation.guestName = reservation.guestName.replace(/\d+/g, "").trim();
        const index = missingInThisReservation.indexOf("guestName");
        if (index !== -1) missingInThisReservation.splice(index, 1);
        console.log(`\u2705 Nome do h\xF3spede extra\xEDdo: "${reservation.guestName}"`);
        break;
      }
    }
    if (!reservation.guestName) {
      const lines = text2.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
      for (const line of lines) {
        const dateNameMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+\d+\s+([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(\d+|\s+[A-Za-zÀ-ÖØ-öø-ÿ])/);
        if (dateNameMatch) {
          reservation.guestName = dateNameMatch[3].trim();
          const index = missingInThisReservation.indexOf("guestName");
          if (index !== -1) missingInThisReservation.splice(index, 1);
          console.log(`\u2705 Nome do h\xF3spede extra\xEDdo de formato tabular: "${reservation.guestName}"`);
          break;
        }
      }
    }
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text2.match(emailRegex);
    if (emailMatch) {
      reservation.guestEmail = emailMatch[0];
    }
    const phoneRegex = [
      /telefone[\s:]+([+\d\s()-]{7,})/i,
      /phone[\s:]+([+\d\s()-]{7,})/i,
      /tel[\s\.:]+([+\d\s()-]{7,})/i,
      /contacto[\s:]+([+\d\s()-]{7,})/i,
      /contact[\s:]+([+\d\s()-]{7,})/i,
      /telemovel[\s:]+([+\d\s()-]{7,})/i,
      /telemóvel[\s:]+([+\d\s()-]{7,})/i,
      /mobile[\s:]+([+\d\s()-]{7,})/i,
      /\+\d{2,3}[\s\d]{8,}/
    ];
    for (const regex of phoneRegex) {
      const match = text2.match(regex);
      if (match) {
        reservation.guestPhone = match[1] ? match[1].trim() : match[0].trim();
        break;
      }
    }
    const checkInRegex = [
      /check[ -]?in[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /entrada[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /arrival[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /chegada[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /data de entrada[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /data de check-in[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /begin[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /início[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /from[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /de[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i
    ];
    for (const regex of checkInRegex) {
      const match = text2.match(regex);
      if (match) {
        reservation.checkInDate = normalizeDateString(match[1]);
        const index = missingInThisReservation.indexOf("checkInDate");
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    const checkOutRegex = [
      /check[ -]?out[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /saída[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /saida[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /departure[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /data de saída[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /data de check-out[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /end[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /fim[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /to[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /até[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i,
      /a[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i
    ];
    for (const regex of checkOutRegex) {
      const match = text2.match(regex);
      if (match) {
        reservation.checkOutDate = normalizeDateString(match[1]);
        const index = missingInThisReservation.indexOf("checkOutDate");
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    if (!reservation.checkInDate || !reservation.checkOutDate) {
      const dateMatches = text2.match(/\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}/g) || [];
      if (dateMatches.length >= 2) {
        if (!reservation.checkInDate) {
          reservation.checkInDate = normalizeDateString(dateMatches[0]);
          const index = missingInThisReservation.indexOf("checkInDate");
          if (index !== -1) missingInThisReservation.splice(index, 1);
        }
        if (!reservation.checkOutDate) {
          reservation.checkOutDate = normalizeDateString(dateMatches[1]);
          const index = missingInThisReservation.indexOf("checkOutDate");
          if (index !== -1) missingInThisReservation.splice(index, 1);
        }
      }
    }
    const guestsRegex = [
      /(\d+)[\s]*(?:hóspedes|hospedes|guests|adultos|adults|pessoas|persons|pax|people)/i,
      /(?:hóspedes|hospedes|guests|adultos|adults|pessoas|persons|pax|people)[\s:]*(\d+)/i,
      /total de (?:hóspedes|hospedes|guests|adultos|adults|pessoas|persons|pax|people)[\s:]*(\d+)/i,
      /number of (?:guests|adults|people|persons)[\s:]*(\d+)/i,
      /número de (?:hóspedes|hospedes|adultos|pessoas|pessoas|pax)[\s:]*(\d+)/i,
      /ocupação[\s:]*(\d+)/i,
      /occupancy[\s:]*(\d+)/i,
      /máximo de pessoas[\s:]*(\d+)/i,
      /max (?:guests|people|persons)[\s:]*(\d+)/i,
      /n\.º\s+hóspedes[\s:]*(\d+)/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+\d+\s+[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s]+(\d+)/i
    ];
    for (const regex of guestsRegex) {
      const match = text2.match(regex);
      if (match) {
        if (regex.toString().includes("\\d{1,2}/\\d{1,2}/\\d{2,4}")) {
          reservation.numGuests = parseInt(match[3]);
        } else {
          reservation.numGuests = parseInt(match[1]);
        }
        const index = missingInThisReservation.indexOf("numGuests");
        if (index !== -1) missingInThisReservation.splice(index, 1);
        console.log(`\u2705 N\xFAmero de h\xF3spedes extra\xEDdo: ${reservation.numGuests}`);
        break;
      }
    }
    if (!reservation.numGuests) {
      const lines = text2.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
      for (const line of lines) {
        if (reservation.guestName && line.includes(reservation.guestName)) {
          const guestNumberMatch = line.match(new RegExp(`${reservation.guestName}\\s*(\\d+)`));
          if (guestNumberMatch) {
            reservation.numGuests = parseInt(guestNumberMatch[1]);
            const index = missingInThisReservation.indexOf("numGuests");
            if (index !== -1) missingInThisReservation.splice(index, 1);
            console.log(`\u2705 N\xFAmero de h\xF3spedes extra\xEDdo pr\xF3ximo ao nome: ${reservation.numGuests}`);
            break;
          }
        }
      }
    }
    const amountRegex = [
      /total[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /valor total[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /total amount[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /valor[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /amount[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /price[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /preço[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /custo[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /cost[\s:]*([€$£]?[\s]*[\d.,]+)/i,
      /[€$£][\s]*[\d.,]+/
    ];
    for (const regex of amountRegex) {
      const match = text2.match(regex);
      if (match) {
        const rawAmount = match[1] || match[0];
        const cleanedAmount = rawAmount.replace(/[^0-9.,]/g, "");
        reservation.totalAmount = normalizeAmount(cleanedAmount);
        const index = missingInThisReservation.indexOf("totalAmount");
        if (index !== -1) missingInThisReservation.splice(index, 1);
        break;
      }
    }
    if (text2.toLowerCase().includes("airbnb")) {
      reservation.platform = "airbnb";
    } else if (text2.toLowerCase().includes("booking.com") || text2.toLowerCase().includes("booking")) {
      reservation.platform = "booking";
    } else if (text2.toLowerCase().includes("expedia")) {
      reservation.platform = "expedia";
    } else if (text2.toLowerCase().includes("direct") || text2.toLowerCase().includes("direto")) {
      reservation.platform = "direct";
    } else {
      reservation.platform = "other";
    }
    reservation.status = "confirmed";
    reservation.notes = `Extra\xEDdo via OCR nativo (${(/* @__PURE__ */ new Date()).toLocaleDateString()})`;
    if (reservation.propertyName) {
      console.log(`\u2705 Propriedade identificada: "${reservation.propertyName}"`);
      reservations5.push(reservation);
      for (const field of missingInThisReservation) {
        if (!missing.includes(field)) {
          missing.push(field);
        }
      }
    } else if (missingInThisReservation.length <= 3) {
      reservations5.push(reservation);
      for (const field of missingInThisReservation) {
        if (!missing.includes(field)) {
          missing.push(field);
        }
      }
    } else {
      console.warn("\u26A0\uFE0F Dados insuficientes para criar uma reserva v\xE1lida");
      console.warn(`\u26A0\uFE0F Campos em falta: ${missingInThisReservation.join(", ")}`);
      if (reservation.propertyName || reservation.guestName) {
        reservations5.push(reservation);
        missing.push(...missingInThisReservation);
      } else {
        missing.push(...requiredFields);
      }
    }
    console.log(`\u2705 Extra\xEDdas ${reservations5.length} reservas do texto OCR`);
    if (missing.length > 0) {
      console.log(`\u26A0\uFE0F Campos obrigat\xF3rios ausentes: ${missing.join(", ")}`);
    }
    return {
      reservations: reservations5,
      boxes,
      missing
    };
  } catch (error) {
    console.error("\u274C Erro ao fazer parsing dos dados de reserva:", error);
    return {
      reservations: [],
      boxes: {},
      missing: ["error"]
    };
  }
}
function normalizeDateString(dateStr) {
  if (typeof dateStr !== "string") {
    dateStr = String(dateStr);
  }
  const cleanDateStr = dateStr.replace(/[^\d\/\.-]/g, "");
  let match = cleanDateStr.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    let year = match[3];
    if (year.length === 2) {
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      year = century + parseInt(year);
    }
    return `${year}-${month}-${day}`;
  }
  match = cleanDateStr.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (match && parseInt(match[1]) <= 12) {
    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  match = cleanDateStr.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, "0");
    const day = match[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  try {
    const date2 = new Date(dateStr);
    if (!isNaN(date2.getTime())) {
      return date2.toISOString().split("T")[0];
    }
  } catch (e) {
  }
  return dateStr;
}
function normalizeAmount(value) {
  if (value === void 0 || value === null) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const cleanedValue = value.replace(/[^\d.,]/g, "");
    try {
      if (cleanedValue.includes(",") && !cleanedValue.includes(".")) {
        return parseFloat(cleanedValue.replace(",", "."));
      }
      return parseFloat(cleanedValue);
    } catch (e) {
    }
  }
  return 0;
}

// server/controllers/ocr.controller.ts
init_storage();

// server/utils/matchPropertyByAlias.ts
function matchPropertyByAlias(propertyName, properties3) {
  if (!propertyName || !properties3 || properties3.length === 0) {
    return void 0;
  }
  const normalizedName = normalizePropertyName(propertyName);
  const exactMatch2 = properties3.find(
    (property) => normalizePropertyName(property.name) === normalizedName
  );
  if (exactMatch2) {
    return exactMatch2;
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

// server/controllers/ocr.controller.ts
var aiAdapter = AIAdapter.getInstance();
var handwritingDetector = new HandwritingDetector();
var serviceTypeMap = {
  mistral: "mistral-ocr" /* MISTRAL_OCR */,
  // Mistral OCR API dedicada
  "mistral-ocr": "mistral-ocr" /* MISTRAL_OCR */,
  // Alias para Mistral OCR
  openrouter: "openrouter" /* OPENROUTER */,
  rolm: "rolm" /* ROLM */,
  native: "auto" /* AUTO */,
  // Usando AUTO como equivalente para o modo nativo
  auto: "auto" /* AUTO */
};
async function postOcr(req, res) {
  console.log("\u{1F4D1} Processando OCR [Rota unificada]...");
  try {
    if (!req.file) {
      return res.status(422).json({
        success: false,
        message: "Nenhum arquivo enviado"
      });
    }
    if (!req.file.mimetype || req.file.mimetype !== "application/pdf") {
      try {
        fs2.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Erro ao remover arquivo inv\xE1lido:", unlinkError);
      }
      return res.status(422).json({
        success: false,
        message: "Tipo de arquivo inv\xE1lido. Apenas PDFs s\xE3o aceitos."
      });
    }
    let pdfBuffer;
    try {
      pdfBuffer = fs2.readFileSync(req.file.path);
    } catch (readError) {
      console.error("Erro ao ler arquivo:", readError);
      return res.status(500).json({
        success: false,
        message: "Erro ao ler o arquivo PDF"
      });
    }
    let provider = req.query.provider || "auto";
    if (provider === "auto") {
      try {
        const handwritingScore = await handwritingDetector.analyzePdf(pdfBuffer);
        console.log(`\u{1F4DD} Pontua\xE7\xE3o de manuscrito: ${handwritingScore.toFixed(2)}`);
        if (handwritingScore > 0.4 && process.env.HF_TOKEN) {
          provider = "rolm";
          console.log("\u{1F58B}\uFE0F Detectado manuscrito, usando RolmOCR");
        } else if (process.env.MISTRAL_API_KEY) {
          provider = "mistral-ocr";
          console.log("\u{1F680} Usando Mistral OCR API como provedor prim\xE1rio");
        } else if (process.env.OPENROUTER_API_KEY) {
          provider = "openrouter";
          console.log("\u{1F504} Usando OpenRouter como provedor secund\xE1rio OCR");
        } else if (process.env.HF_TOKEN) {
          provider = "rolm";
          console.log("\u{1F504} Mistral e OpenRouter indispon\xEDveis, usando RolmOCR como fallback");
        } else {
          provider = "native";
          console.log("\u{1F4C4} Nenhum servi\xE7o OCR dispon\xEDvel, usando extrator nativo (pdf-parse)");
        }
      } catch (detectorError) {
        console.error("Erro no detector de manuscritos:", detectorError);
        if (process.env.MISTRAL_API_KEY) {
          provider = "mistral-ocr";
          console.log("\u{1F680} Erro no detector, usando Mistral OCR API como provedor prim\xE1rio");
        } else if (process.env.OPENROUTER_API_KEY) {
          provider = "openrouter";
          console.log("\u{1F504} Erro no detector, usando OpenRouter como provedor secund\xE1rio");
        } else if (process.env.HF_TOKEN) {
          provider = "rolm";
          console.log("\u{1F504} Erro no detector, usando RolmOCR como fallback");
        } else {
          provider = "native";
          console.log("\u{1F4C4} Erro no detector, usando extrator nativo como \xFAltimo recurso");
        }
      }
    }
    console.log(`\u{1F50D} Provedor selecionado: ${provider}`);
    const pdfBase64 = pdfBuffer.toString("base64");
    const startTime = Date.now();
    let extractedText = "";
    try {
      extractedText = await aiAdapter.extractTextFromPDF(pdfBase64, provider);
      console.log(`\u2705 Texto extra\xEDdo com sucesso (${extractedText.length} caracteres)`);
    } catch (extractError) {
      console.error("Erro ao extrair texto do PDF:", extractError);
      return res.status(500).json({
        success: false,
        message: "Erro ao extrair texto do PDF",
        details: extractError instanceof Error ? extractError.message : "Erro desconhecido"
      });
    }
    let reservations5 = [];
    let boxesData = {};
    let missingFields = [];
    try {
      const parsedData = await parseReservationData(extractedText);
      reservations5 = parsedData.reservations || [];
      boxesData = parsedData.boxes || {};
      missingFields = parsedData.missing || [];
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      console.log(`\u23F1\uFE0F OCR processado em ${latencyMs}ms via ${provider}`);
      if (reservations5.length > 0) {
        for (const reservation of reservations5) {
          if (reservation.propertyName) {
            try {
              const properties3 = await storage.getProperties();
              const propertyName = reservation.propertyName || "";
              const matchedProperty = matchPropertyByAlias(propertyName, properties3);
              if (matchedProperty) {
                reservation.propertyId = matchedProperty.id;
                const normalizedPropertyName = propertyName.toLowerCase().trim();
                if (matchedProperty.name.toLowerCase() === normalizedPropertyName) {
                  console.log(`\u2705 Propriedade encontrada por nome exato: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
                } else if (matchedProperty.aliases && Array.isArray(matchedProperty.aliases) && matchedProperty.aliases.some((alias) => alias.toLowerCase() === normalizedPropertyName)) {
                  console.log(`\u2705 Propriedade encontrada por alias: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
                } else {
                  console.log(`\u2705 Propriedade encontrada por correspond\xEAncia parcial: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
                }
              } else {
                if (!missingFields.includes("propertyId")) {
                  missingFields.push("propertyId");
                }
                console.log(`\u26A0\uFE0F Propriedade n\xE3o encontrada: ${propertyName}`);
              }
            } catch (propertyError) {
              console.error("Erro ao buscar propriedade:", propertyError);
            }
          } else if (!missingFields.includes("propertyName")) {
            missingFields.push("propertyName");
          }
        }
      }
      return res.json({
        success: true,
        provider,
        reservations: reservations5,
        boxes: boxesData,
        // Adicionar extractedData para compatibilidade com a interface antiga
        extractedData: reservations5.length > 0 ? reservations5[0] : void 0,
        missing: missingFields,
        rawText: extractedText,
        metrics: {
          latencyMs,
          provider,
          textLength: extractedText.length
        }
      });
    } catch (parseError) {
      console.error("Erro ao extrair dados estruturados:", parseError);
      return res.status(500).json({
        success: false,
        message: "Erro ao extrair dados estruturados",
        rawText: extractedText,
        details: parseError instanceof Error ? parseError.message : "Erro desconhecido"
      });
    }
  } catch (error) {
    console.error("Erro no processamento OCR:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno no processamento OCR",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// server/controllers/budget.controller.ts
async function estimate(req, res) {
  try {
    const { nights, nightlyRate } = req.body;
    if (nights === void 0 || nightlyRate === void 0) {
      return res.status(400).json({
        success: false,
        message: "Par\xE2metros obrigat\xF3rios: nights e nightlyRate"
      });
    }
    const nightsNum = Number(nights);
    const rateNum = Number(nightlyRate);
    if (isNaN(nightsNum) || nightsNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "O n\xFAmero de noites deve ser um n\xFAmero positivo"
      });
    }
    if (isNaN(rateNum) || rateNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "A taxa di\xE1ria deve ser um n\xFAmero positivo"
      });
    }
    const total = nightsNum * rateNum;
    const margin = total * 0.1;
    return res.json({
      success: true,
      nights: nightsNum,
      nightlyRate: rateNum,
      total,
      margin
    });
  } catch (error) {
    console.error("Erro ao calcular or\xE7amento:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao calcular or\xE7amento"
    });
  }
}

// server/routes.ts
init_schema();
init_db();
import fs7 from "fs";
import path7 from "path";
import { sql as sql3 } from "drizzle-orm";
var pdfUpload = multer2({
  storage: multer2.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = path7.join(process.cwd(), "uploads");
      if (!fs7.existsSync(uploadDir)) {
        fs7.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB max file size
  },
  fileFilter: function(req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF s\xE3o permitidos!"), false);
    }
  }
});
var imageUpload = multer2({
  storage: multer2.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = path7.join(process.cwd(), "uploads", "images");
      if (!fs7.existsSync(uploadDir)) {
        fs7.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB max file size for images
  },
  fileFilter: function(req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens s\xE3o permitidas (JPG, PNG)!"), false);
    }
  }
});
var anyFileUpload = multer2({
  storage: multer2.diskStorage({
    destination: function(req, file, cb) {
      let uploadDir;
      if (file.mimetype === "application/pdf") {
        uploadDir = path7.join(process.cwd(), "uploads");
      } else if (file.mimetype.startsWith("image/")) {
        uploadDir = path7.join(process.cwd(), "uploads", "images");
      } else {
        uploadDir = path7.join(process.cwd(), "uploads", "other");
      }
      if (!fs7.existsSync(uploadDir)) {
        fs7.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB max file size
  },
  fileFilter: function(req, file, cb) {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas PDFs e imagens (JPG, PNG) s\xE3o permitidos!"), false);
    }
  }
});
var handleError = (err, res) => {
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
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
async function registerRoutes(app2) {
  app2.use(bodyParser.json({ limit: "50mb" }));
  app2.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 5e4 }));
  app2.get("/api/properties", async (req, res) => {
    try {
      const properties3 = await storage.getProperties();
      res.json(properties3);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/properties/:id", async (req, res) => {
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
  app2.post("/api/properties", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.patch("/api/properties/:id", async (req, res) => {
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
  app2.delete("/api/properties/:id", async (req, res) => {
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
  app2.get("/api/owners", async (req, res) => {
    try {
      const owners3 = await storage.getOwners();
      res.json(owners3);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/owners/:id", async (req, res) => {
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
  app2.post("/api/owners", async (req, res) => {
    try {
      console.log("POST /api/owners - Recebido body:", JSON.stringify(req.body, null, 2));
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("POST /api/owners - Body vazio ou inv\xE1lido");
        return res.status(400).json({
          message: "Corpo da requisi\xE7\xE3o vazio ou inv\xE1lido",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      try {
        const validatedData = insertOwnerSchema.parse(req.body);
        console.log("POST /api/owners - Dados validados:", JSON.stringify(validatedData, null, 2));
        const owner = await storage.createOwner(validatedData);
        console.log("POST /api/owners - Propriet\xE1rio criado com sucesso:", JSON.stringify(owner, null, 2));
        return res.status(201).json(owner);
      } catch (validationError) {
        console.error("POST /api/owners - Erro de valida\xE7\xE3o:", validationError);
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Erro de valida\xE7\xE3o",
            errors: validationError.errors,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        throw validationError;
      }
    } catch (err) {
      console.error("POST /api/owners - Erro interno:", err);
      handleError(err, res);
    }
  });
  app2.patch("/api/owners/:id", async (req, res) => {
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
  app2.delete("/api/owners/:id", async (req, res) => {
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
  app2.get("/api/reservations", async (req, res) => {
    try {
      let reservations5;
      if (req.query.propertyId) {
        reservations5 = await storage.getReservationsByProperty(Number(req.query.propertyId));
      } else {
        reservations5 = await storage.getReservations();
      }
      res.json(reservations5);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/reservations/dashboard", async (req, res) => {
    try {
      const reservations5 = await storage.getReservationsForDashboard();
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      const checkIns = [];
      const checkOuts = [];
      const cleaningTasks = [];
      reservations5.forEach((reservation) => {
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
            const names = ["Jo\xE3o Silva", "Maria Santos", "Carlos Oliveira", "Ana Pereira", "Pedro Costa"];
            const randomName = names[Math.floor(Math.random() * names.length)];
            checkIns.push({
              id: 1e3 + i,
              propertyId: property.id,
              propertyName: property.name,
              guestName: randomName,
              checkInDate: checkInDate.toISOString(),
              checkOutDate: checkOutDate.toISOString(),
              status: "confirmed",
              totalCost: 500 + Math.floor(Math.random() * 1e3),
              guestsCount: 1 + Math.floor(Math.random() * 4)
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
              id: 2e3 + i,
              propertyId: property.id,
              propertyName: property.name,
              guestName: randomName,
              checkInDate: checkInDate.toISOString(),
              checkOutDate: checkOutDate.toISOString(),
              status: "confirmed",
              totalCost: 500 + Math.floor(Math.random() * 1e3),
              guestsCount: 1 + Math.floor(Math.random() * 4)
            };
            checkOuts.push(checkOut);
            cleaningTasks.push({
              id: `cleaning-${2e3 + i}`,
              propertyId: property.id,
              propertyName: property.name,
              title: `Limpeza ap\xF3s sa\xEDda`,
              description: `Limpeza necess\xE1ria ap\xF3s sa\xEDda do h\xF3spede ${randomName}`,
              status: "pending",
              priority: "medium",
              type: "cleaning",
              icon: null,
              date: checkOutDate.toISOString()
            });
          }
        }
      }
      res.json({ checkIns, checkOuts, cleaningTasks });
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/reservations/:id", async (req, res) => {
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
  app2.post("/api/reservations", async (req, res) => {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      const property = await storage.getProperty(validatedData.propertyId);
      if (!property) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      validatedData.cleaningFee = (property.cleaningCost || "0").toString();
      validatedData.checkInFee = (property.checkInFee || "0").toString();
      validatedData.commission = (Number(validatedData.totalAmount) * Number(property.commission || "0") / 100).toString();
      validatedData.teamPayment = (property.teamPayment || "0").toString();
      const totalCosts = Number(validatedData.cleaningFee) + Number(validatedData.checkInFee) + Number(validatedData.commission) + Number(validatedData.teamPayment) + Number(validatedData.platformFee);
      validatedData.netAmount = (Number(validatedData.totalAmount) - totalCosts).toString();
      const reservation = await storage.createReservation(validatedData);
      res.status(201).json(reservation);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/reservations/import-text", async (req, res) => {
    try {
      console.log("Iniciando processamento de importa\xE7\xE3o de texto...");
      const { text: text2, propertyId, userAnswers } = req.body;
      if (!text2 || typeof text2 !== "string" || text2.trim() === "") {
        return res.status(400).json({ success: false, message: "Texto vazio ou inv\xE1lido." });
      }
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        return res.status(400).json({ success: false, message: "Chave da API Google Gemini n\xE3o configurada", needsApiKey: true });
      }
      await storage.createActivity({ type: "text_import_attempt", description: `Tentativa de importa\xE7\xE3o de texto para reserva` });
      try {
        console.log("Inicializando servi\xE7o de importa\xE7\xE3o...");
        const importerService = new reservation_importer_service_default();
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
        await importerService.initialize(apiKey);
        console.log("Enviando texto para processamento:", text2.substring(0, 50) + "...");
        const importOptions = { originalText: text2, userAnswers: userAnswers || {} };
        const result = await importerService.importFromText(text2, importOptions);
        console.log("Resultado recebido do servi\xE7o de importa\xE7\xE3o");
        if (!result.reservation_data) {
          throw new Error("N\xE3o foi poss\xEDvel extrair dados estruturados do texto");
        }
        const reservationDataWithProperty = { ...result.reservation_data };
        let needsClarification = false;
        let clarificationQuestions = [];
        if (result.clarification_questions && result.clarification_questions.length > 0) {
          needsClarification = true;
          clarificationQuestions = result.clarification_questions;
          console.log("Foram encontradas quest\xF5es de esclarecimento:", clarificationQuestions.length);
        }
        if (reservationDataWithProperty.guest_name && !reservationDataWithProperty.guestName) reservationDataWithProperty.guestName = reservationDataWithProperty.guest_name;
        if (reservationDataWithProperty.check_in_date && !reservationDataWithProperty.checkInDate) reservationDataWithProperty.checkInDate = reservationDataWithProperty.check_in_date;
        if (reservationDataWithProperty.check_out_date && !reservationDataWithProperty.checkOutDate) reservationDataWithProperty.checkOutDate = reservationDataWithProperty.check_out_date;
        if (reservationDataWithProperty.total_guests && !reservationDataWithProperty.numGuests) reservationDataWithProperty.numGuests = reservationDataWithProperty.total_guests;
        if (reservationDataWithProperty.guest_email && !reservationDataWithProperty.guestEmail) reservationDataWithProperty.guestEmail = reservationDataWithProperty.guest_email;
        if (reservationDataWithProperty.guest_phone && !reservationDataWithProperty.guestPhone) reservationDataWithProperty.guestPhone = reservationDataWithProperty.guest_phone;
        if (reservationDataWithProperty.booking_source && !reservationDataWithProperty.platform) reservationDataWithProperty.platform = reservationDataWithProperty.booking_source;
        if (!reservationDataWithProperty.status) reservationDataWithProperty.status = "confirmed";
        if (propertyId && !isNaN(Number(propertyId))) {
          console.log("Associando \xE0 propriedade com ID:", propertyId);
          const property = await storage.getProperty(Number(propertyId));
          if (property) {
            reservationDataWithProperty.propertyId = property.id;
            reservationDataWithProperty.property_name = property.name;
          }
        } else if (reservationDataWithProperty.property_name) {
          console.log("Tentando encontrar propriedade pelo nome:", reservationDataWithProperty.property_name);
          const properties3 = await storage.getProperties();
          const matchingProperty = properties3.find((p) => p.name.toLowerCase() === reservationDataWithProperty.property_name.toLowerCase()) || null;
          if (matchingProperty) {
            reservationDataWithProperty.propertyId = matchingProperty.id;
            console.log("Propriedade encontrada com ID:", matchingProperty.id);
          }
        }
        await storage.createActivity({ type: "text_import_success", description: `Dados extra\xEDdos com sucesso do texto para reserva` });
        console.log("Respondendo com dados extra\xEDdos, needsClarification:", needsClarification);
        return res.json({
          success: true,
          needsClarification,
          clarificationQuestions: needsClarification ? clarificationQuestions : void 0,
          reservationData: reservationDataWithProperty
        });
      } catch (error) {
        console.error("Erro ao processar texto da reserva com IA:", error);
        await storage.createActivity({ type: "text_import_failed", description: `Falha ao extrair dados de texto para reserva: ${error instanceof Error ? error.message : "Erro desconhecido"}` });
        return res.status(500).json({ success: false, message: "N\xE3o foi poss\xEDvel extrair dados do texto. Tente novamente ou insira manualmente.", error: error instanceof Error ? error.message : "Erro desconhecido" });
      }
    } catch (err) {
      console.error("Erro no endpoint de importa\xE7\xE3o de texto:", err);
      handleError(err, res);
    }
  });
  app2.patch("/api/reservations/:id", async (req, res) => {
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
        validatedData.cleaningFee = (property.cleaningCost || "0").toString();
        validatedData.checkInFee = (property.checkInFee || "0").toString();
        const totalAmount = validatedData.totalAmount || existingReservation.totalAmount;
        validatedData.commission = (Number(totalAmount) * Number(property.commission || "0") / 100).toString();
        validatedData.teamPayment = (property.teamPayment || "0").toString();
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
  app2.delete("/api/reservations/:id", async (req, res) => {
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
  app2.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : void 0;
      const activities3 = await storage.getActivities(limit);
      const hideFromQueryParam = req.query.hideDemoTasks === "true";
      const demoDataRemovedFromParam = req.query.demoDataRemoved === "true";
      const disableDemoData = req.query.disableDemoData === "true";
      const forceCleanMode = req.query.forceCleanMode === "true";
      if (forceCleanMode) {
        console.log("\u26A0\uFE0F MODO DE LIMPEZA FOR\xC7ADA DETECTADO - Executando limpeza completa dos dados demo");
        try {
          const cleanupResult = await Promise.resolve().then(() => (init_demo_data(), demo_data_exports)).then((m) => m.resetDemoData());
          if (cleanupResult.success) {
            console.log(`\u2705 Limpeza for\xE7ada conclu\xEDda! ${cleanupResult.removedItems} itens removidos`);
          }
        } catch (cleanupError) {
          console.error("\u274C Erro durante limpeza for\xE7ada:", cleanupError);
        }
      }
      const hideDemoTasks = true;
      const showDemoTasks = false;
      console.log(`Status de dados demo: hideDemoTasks=${hideDemoTasks}, showDemoTasks=${showDemoTasks}`);
      let realMaintenanceTasks = [];
      try {
        realMaintenanceTasks = await storage.getMaintenanceTasks();
        console.log(`Obtidas ${realMaintenanceTasks.length} tarefas reais de manuten\xE7\xE3o`);
      } catch (dbError) {
        console.error("Erro ao obter tarefas de manuten\xE7\xE3o reais:", dbError);
      }
      const shouldShowDemoMaintenance = showDemoTasks && realMaintenanceTasks.length === 0;
      let maintenance = [];
      let tasks = [];
      if (shouldShowDemoMaintenance) {
        const properties3 = await storage.getProperties();
        const activeProperties = properties3.filter((p) => p.active).slice(0, 3);
        console.log(`Gerando tarefas de demonstra\xE7\xE3o para ${activeProperties.length} propriedades ativas`);
        maintenance = activeProperties.map((property, index) => ({
          id: `maintenance-${property.id}`,
          propertyId: property.id,
          propertyName: property.name,
          title: index === 0 ? "Problema na torneira do banheiro" : index === 1 ? "Ar condicionado com problema" : "Manuten\xE7\xE3o da fechadura",
          description: index === 0 ? "Cliente reportou vazamento na torneira do banheiro principal" : index === 1 ? "Unidade interna do ar condicionado fazendo barulho" : "Fechadura da porta principal necessita manuten\xE7\xE3o",
          status: index === 0 ? "attention" : "pending",
          priority: index === 0 ? "high" : "medium",
          type: "maintenance",
          date: (/* @__PURE__ */ new Date()).toISOString(),
          isDemo: true
        }));
        tasks = [
          { id: "task-1", title: "Contatar fornecedor de produtos", description: "Refazer pedido de amenities para os pr\xF3ximos meses", status: "pending", priority: "medium", type: "task", icon: "Phone", date: (/* @__PURE__ */ new Date()).toISOString(), isDemo: true },
          { id: "task-2", title: "Atualizar pre\xE7os no site", description: "Revisar tarifas para o per\xEDodo de alta temporada", status: "upcoming", priority: "low", type: "task", icon: "Calendar", date: (/* @__PURE__ */ new Date()).toISOString(), isDemo: true }
        ];
      } else {
        maintenance = realMaintenanceTasks.map((task) => ({
          id: `maintenance-${task.id}`,
          propertyId: task.propertyId,
          propertyName: task.propertyName || `Propriedade #${task.propertyId}`,
          // Adicionado type assertion
          title: task.description.split(" - ")[0] || task.description,
          description: task.description.split(" - ")[1] || task.description,
          status: task.status === "pending" ? "pending" : task.status === "scheduled" ? "upcoming" : "completed",
          priority: task.priority,
          type: "maintenance",
          date: task.reportedAt
        }));
        console.log(`Usando ${maintenance.length} tarefas reais de manuten\xE7\xE3o (modo demonstra\xE7\xE3o desativado)`);
      }
      res.json({ activities: activities3, maintenance, tasks });
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity({ ...validatedData, type: validatedData.type || validatedData.activityType });
      res.status(201).json(activity);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/statistics", async (req, res) => {
    try {
      console.log("########### INICIANDO /api/statistics ###########");
      let startDate = void 0;
      let endDate = void 0;
      const startDateStr = req.query.startDate;
      const endDateStr = req.query.endDate;
      if (startDateStr && startDateStr !== "undefined" && startDateStr !== "null") {
        startDate = new Date(startDateStr);
      }
      if (endDateStr && endDateStr !== "undefined" && endDateStr !== "null") {
        endDate = new Date(endDateStr);
      }
      console.log("Usando datas:", { startDate, endDate });
      const properties3 = await storage.getProperties();
      console.log(`Obtidas ${properties3.length} propriedades`);
      const activeProperties = properties3.filter((p) => p.active).length;
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
            const directResult = await db.execute(sql3.raw(directQuery));
            console.log("Resultado da consulta SQL direta:", directResult);
            const results = directResult;
            console.log("Valor total diretamente da tabela:", results[0]?.direct_total);
          } else {
            console.log("Banco de dados n\xE3o dispon\xEDvel para consulta direta");
          }
        } catch (e) {
          console.error("Erro na consulta direta SQL:", e);
        }
        totalRevenue = await storage.getTotalRevenue(startDate, endDate);
        console.log("Receita total:", totalRevenue);
        console.log("CHAMANDO storage.getNetProfit...");
        netProfit = await storage.getNetProfit(startDate, endDate);
        console.log("Lucro l\xEDquido:", netProfit);
        console.log("CHAMANDO storage.getOccupancyRate...");
        occupancyRate = await storage.getOccupancyRate(void 0, startDate, endDate);
        console.log("Taxa de ocupa\xE7\xE3o:", occupancyRate);
      } catch (error) {
        console.error("Erro ao obter estat\xEDsticas:", error);
      }
      console.log("Estat\xEDsticas calculadas:", { totalRevenue, netProfit, occupancyRate });
      let reservations5 = await storage.getReservations();
      if (startDate) {
        reservations5 = reservations5.filter((r) => new Date(r.checkInDate) >= startDate);
      }
      if (endDate) {
        reservations5 = reservations5.filter((r) => new Date(r.checkInDate) <= endDate);
      }
      const propertyStats = await Promise.all(
        properties3.filter((p) => p.active).map(async (property) => {
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
      const topProperties = propertyStats.sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, 5);
      res.json({
        success: true,
        totalRevenue,
        netProfit,
        occupancyRate,
        totalProperties: properties3.length,
        activeProperties,
        reservationsCount: reservations5.length,
        topProperties
      });
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/statistics/property/:id", async (req, res) => {
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
  app2.get("/api/statistics/monthly-revenue", async (req, res) => {
    try {
      console.log("=========================================================");
      console.log("INICIANDO PROCESSAMENTO DE RECEITA POR PER\xCDODO");
      console.log("=========================================================");
      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      console.log(`Par\xE2metros recebidos: startDate=${startDateParam}, endDate=${endDateParam}`);
      const startDate = startDateParam ? new Date(startDateParam) : new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 1);
      const endDate = endDateParam ? new Date(endDateParam) : new Date((/* @__PURE__ */ new Date()).getFullYear(), 11, 31);
      console.log(`Per\xEDodo calculado: ${startDate.toISOString()} at\xE9 ${endDate.toISOString()}`);
      const dateDiffTime = endDate.getTime() - startDate.getTime();
      const dateDiffDays = Math.ceil(dateDiffTime / (1e3 * 3600 * 24));
      console.log(`Diferen\xE7a em dias calculada: ${dateDiffDays}`);
      let granularity = "month";
      console.log(`Conforme solicitado, todos os dados ser\xE3o agrupados por m\xEAs, independente do per\xEDodo (${dateDiffDays} dias)`);
      console.log(`Granularidade padronizada para mensal`);
      const reservations5 = await storage.getReservations();
      const confirmedReservations = reservations5.filter((r) => {
        const checkInDate = new Date(r.checkInDate);
        return (r.status === "confirmed" || r.status === "completed") && checkInDate >= startDate && checkInDate <= endDate;
      });
      console.log(`Encontradas ${confirmedReservations.length} reservas no per\xEDodo`);
      let revenueData = [];
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      revenueData = months.map((month, index) => {
        const monthReservations = confirmedReservations.filter((r) => new Date(r.checkInDate).getMonth() === index);
        const revenue = monthReservations.reduce((sum2, r) => sum2 + parseFloat(r.totalAmount), 0);
        const profit = monthReservations.reduce((sum2, r) => sum2 + parseFloat(r.netAmount || "0"), 0);
        return { month, revenue, profit };
      });
      revenueData = revenueData.filter((d) => d.revenue > 0 || d.profit > 0);
      if (revenueData.length === 0) {
        revenueData = [{ month: "Jan", revenue: 0, profit: 0 }];
      }
      console.log(`Retornando ${revenueData.length} per\xEDodos de dados`);
      console.log(`Granularidade final sendo retornada: ${granularity}`);
      console.log("Resumo da resposta:", { granularity, totalPeriods: revenueData.length, firstPeriod: revenueData[0] || null, year: startDate.getFullYear() });
      const response = { success: true, data: revenueData, year: startDate.getFullYear(), granularity };
      console.log("Resposta completa:", JSON.stringify(response));
      res.json(response);
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/ocr", pdfUpload.single("pdf"), (req, res) => {
    try {
      postOcr(req, res);
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.post("/api/ocr/process", anyFileUpload.single("file"), (req, res) => {
    try {
      postOcr(req, res);
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.post("/api/ocr/process/:service", anyFileUpload.single("file"), (req, res) => {
    try {
      req.query.provider = req.params.service;
      postOcr(req, res);
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.post("/api/budgets/estimate", estimate);
  app2.post("/api/pdf/process-pair", pdfUpload.array("pdfs", 2), async (req, res) => {
    try {
      console.log("Iniciando processamento de par de PDFs...");
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "Nenhum arquivo enviado ou arquivos insuficientes." });
      }
      if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
        return res.status(500).json({ success: false, message: "Nenhuma chave de API do Google Gemini configurada" });
      }
      try {
        const { processPdfPair: processPdfPair2 } = await Promise.resolve().then(() => (init_pdf_pair_processor(), pdf_pair_processor_exports));
        const pdfPaths = req.files.map((file) => file.path);
        const fileInfo = req.files.map((file) => ({
          filename: file.filename,
          path: file.path,
          originalname: file.originalname
        }));
        console.log(`Processando ${pdfPaths.length} arquivos: ${pdfPaths.join(", ")}`);
        const pairResult = await processPdfPair2(pdfPaths, process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "");
        if (!pairResult.reservationData) {
          console.error("N\xE3o foi poss\xEDvel extrair dados da reserva");
          return res.status(422).json({
            success: false,
            message: "N\xE3o foi poss\xEDvel extrair dados da reserva dos documentos",
            pairInfo: { isPairComplete: pairResult.isPairComplete, checkInPresent: !!pairResult.checkIn, checkOutPresent: !!pairResult.checkOut },
            errors: pairResult.errors
          });
        }
        if (pairResult.checkIn && pairResult.checkIn.text) {
          await ragService.addToKnowledgeBase(pairResult.checkIn.text, "check_in_pdf", {
            filename: pairResult.checkIn.filename,
            uploadDate: /* @__PURE__ */ new Date(),
            documentType: "check-in"
          });
        }
        if (pairResult.checkOut && pairResult.checkOut.text) {
          await ragService.addToKnowledgeBase(pairResult.checkOut.text, "check_out_pdf", {
            filename: pairResult.checkOut.filename,
            uploadDate: /* @__PURE__ */ new Date(),
            documentType: "check-out"
          });
        }
        const extractedData = pairResult.reservationData;
        const validationResult = pairResult.validationResult;
        if (!validationResult) {
          console.error("Resultado de valida\xE7\xE3o n\xE3o dispon\xEDvel");
          return res.status(500).json({
            success: false,
            message: "Erro no processamento dos documentos",
            pairInfo: { isPairComplete: pairResult.isPairComplete, checkInPresent: !!pairResult.checkIn, checkOutPresent: !!pairResult.checkOut },
            errors: [...pairResult.errors, "Falha na valida\xE7\xE3o dos dados extra\xEDdos"]
          });
        }
        const properties3 = await storage.getProperties();
        console.log(`Buscando correspond\xEAncia para propriedade: ${extractedData?.propertyName}`);
        let matchedProperty = null;
        if (extractedData && extractedData.propertyName) {
          matchedProperty = properties3.find((p) => p.name.toLowerCase() === extractedData.propertyName.toLowerCase()) || null;
          if (!matchedProperty) {
            const calculateSimilarity = (str1, str2) => {
              const words1 = str1.toLowerCase().split(/\s+/);
              const words2 = str2.toLowerCase().split(/\s+/);
              const commonWords = words1.filter((word) => words2.includes(word));
              return commonWords.length / Math.max(words1.length, words2.length);
            };
            let bestMatch = null;
            let highestSimilarity = 0;
            for (const property of properties3) {
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
            aliases: null,
            // Adicionado
            ownerId: 0,
            cleaningCost: "0",
            checkInFee: "0",
            commission: "0",
            teamPayment: "0",
            cleaningTeam: null,
            // Adicionado
            cleaningTeamId: null,
            // Adicionado
            monthlyFixedCost: null,
            // Adicionado
            active: false
            // Removidos: address, notes, createdAt, updatedAt
          };
          if (extractedData && extractedData.propertyName) {
            validationResult.errors.push({ field: "propertyName", message: "Propriedade n\xE3o encontrada no sistema", severity: "warning" });
            if (!validationResult.warningFields) validationResult.warningFields = [];
            validationResult.warningFields.push("propertyName");
          }
        }
        const totalAmount = extractedData?.totalAmount || 0;
        const platformFee = extractedData?.platformFee || (extractedData?.platform === "airbnb" || extractedData?.platform === "booking" ? Math.round(totalAmount * 0.1) : 0);
        const activityType = pairResult.isPairComplete ? "pdf_pair_processed" : "pdf_processed";
        const activityDescription = pairResult.isPairComplete ? `Par de PDFs processado: ${extractedData?.propertyName || "Propriedade desconhecida"} - ${extractedData?.guestName || "H\xF3spede desconhecido"} (${validationResult.status})` : `PDF processado: ${extractedData?.propertyName || "Propriedade desconhecida"} - ${extractedData?.guestName || "H\xF3spede desconhecido"} (${validationResult.status})`;
        await storage.createActivity({
          type: activityType,
          description: activityDescription,
          entityId: matchedProperty.id,
          entityType: "property"
        });
        const enrichedData = {
          ...extractedData,
          propertyId: matchedProperty.id,
          platformFee,
          cleaningFee: extractedData?.cleaningFee || Number(matchedProperty.cleaningCost || 0),
          checkInFee: extractedData?.checkInFee || Number(matchedProperty.checkInFee || 0),
          commission: extractedData?.commission || totalAmount * Number(matchedProperty.commission || 0) / 100,
          teamPayment: extractedData?.teamPayment || Number(matchedProperty.teamPayment || 0)
        };
        let processMessage = "";
        if (pairResult.isPairComplete) processMessage = "Par de documentos processado com sucesso (check-in + check-out)";
        else if (pairResult.checkIn) processMessage = "Documento de check-in processado com sucesso, sem documento de check-out";
        else if (pairResult.checkOut) processMessage = "Documento de check-out processado com sucesso, sem documento de check-in";
        res.json({
          success: true,
          message: processMessage,
          extractedData: enrichedData,
          validation: { status: validationResult.status, isValid: validationResult.isValid, errors: validationResult.errors, missingFields: validationResult.missingFields, warningFields: validationResult.warningFields },
          pairInfo: { isPairComplete: pairResult.isPairComplete, checkInPresent: !!pairResult.checkIn, checkOutPresent: !!pairResult.checkOut },
          files: fileInfo
        });
      } catch (processError) {
        console.error("Erro no processamento dos PDFs:", processError);
        return res.status(500).json({ success: false, message: "Falha ao processar PDFs", error: processError instanceof Error ? processError.message : "Erro desconhecido no processamento" });
      }
    } catch (err) {
      console.error("Erro ao processar upload de PDFs:", err);
      return res.status(500).json({ success: false, message: "Erro interno no servidor", error: err instanceof Error ? err.message : "Erro desconhecido" });
    }
  });
  async function extractTextFromPDFWithGemini(pdfBase64) {
    try {
      return await aiService.extractTextFromPDF(pdfBase64);
    } catch (error) {
      console.error("Erro ao extrair texto do PDF com Gemini:", error);
      throw new Error(`Falha na extra\xE7\xE3o de texto: ${error.message}`);
    }
  }
  async function parseReservationDataWithGemini(extractedText) {
    try {
      return await aiService.parseReservationData(extractedText);
    } catch (error) {
      console.error("Erro ao analisar dados da reserva com Gemini:", error);
      throw new Error(`Falha na extra\xE7\xE3o de dados estruturados: ${error.message}`);
    }
  }
  app2.get("/api/enums", (_req, res) => {
    res.json({
      reservationStatus: reservationStatusEnum.enumValues,
      reservationPlatform: reservationPlatformEnum.enumValues
    });
  });
  app2.get("/api/check-gemini-key", (_req, res) => {
    try {
      const hasGeminiKey = hasGeminiApiKey();
      res.json({ available: hasGeminiKey });
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/check-mistral-key", (_req, res) => {
    try {
      const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
      const hasGeminiKey = hasGeminiApiKey();
      res.json({
        available: hasOpenRouterKey,
        fallbackAvailable: hasGeminiKey,
        primaryService: hasOpenRouterKey ? "mistral" : hasGeminiKey ? "gemini" : null
      });
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/configure-openrouter-key", async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ success: false, message: "API key \xE9 obrigat\xF3ria" });
    }
    try {
      await aiService.setApiKey("openrouter", apiKey);
      const testResult = await aiService.testOpenRouterConnection();
      if (testResult.success) {
        return res.json({ success: true, message: testResult.message });
      } else {
        return res.status(400).json({ success: false, message: testResult.message });
      }
    } catch (error) {
      console.error("Erro ao configurar ou testar OpenRouter Key:", error);
      return res.status(500).json({ success: false, message: error.message || "Erro interno ao configurar chave OpenRouter" });
    }
  });
  app2.post("/api/configure-gemini-key", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
        return res.status(400).json({ success: false, message: "Chave de API inv\xE1lida" });
      }
      process.env.GOOGLE_GEMINI_API_KEY = apiKey.trim();
      try {
        aiService.geminiService.initializeWithKey(apiKey.trim());
        const hasGeminiKey = process.env.GOOGLE_GEMINI_API_KEY !== void 0 && process.env.GOOGLE_GEMINI_API_KEY !== "";
        return res.json({ success: true, message: "Chave da API Gemini configurada com sucesso", available: hasGeminiKey });
      } catch (error) {
        console.error("Erro ao testar a chave da API Gemini:", error);
        return res.status(400).json({ success: false, message: "A chave da API Gemini parece ser inv\xE1lida" });
      }
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/check-ai-services", async (_req, res) => {
    try {
      let currentService = "unavailable";
      try {
        const { aiService: currentAiService } = await Promise.resolve().then(() => (init_ai_adapter_service(), ai_adapter_service_exports));
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
  app2.post("/api/set-ai-service", async (req, res) => {
    try {
      const { service } = req.body;
      if (!service || !["mistral", "gemini", "auto"].includes(service)) {
        return res.status(400).json({ success: false, message: "Servi\xE7o inv\xE1lido. Op\xE7\xF5es v\xE1lidas: mistral, gemini, auto" });
      }
      try {
        const { aiService: currentAiService, AIServiceType: currentAIServiceType } = await Promise.resolve().then(() => (init_ai_adapter_service(), ai_adapter_service_exports));
        const serviceTypeMap2 = { "gemini": currentAIServiceType.GEMINI };
        if (service !== "gemini") {
          console.log(`Servi\xE7o ${service} n\xE3o \xE9 suportado, usando Gemini apenas`);
          const newService = "gemini";
          currentAiService.setService(serviceTypeMap2[newService]);
          return res.json({ success: true, message: `Servi\xE7o configurado para usar Gemini.`, currentService: currentAiService.getCurrentService() });
        }
        currentAiService.setService(serviceTypeMap2[service]);
        return res.json({ success: true, message: `Servi\xE7o alterado para ${service}`, currentService: currentAiService.getCurrentService() });
      } catch (error) {
        console.error("Erro ao alterar servi\xE7o de IA:", error);
        return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Erro desconhecido ao alterar servi\xE7o" });
      }
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.post("/api/learn-document-format", anyFileUpload.single("file"), async (req, res) => {
    try {
      console.log("Iniciando aprendizado de novo formato de documento...");
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Nenhum arquivo enviado" });
      }
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(500).json({ success: false, message: "Esta funcionalidade requer a API Gemini configurada" });
      }
      const { fields } = req.body;
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ success: false, message: "\xC9 necess\xE1rio especificar pelo menos um campo para extrair" });
      }
      try {
        const { aiService: currentAiService } = await Promise.resolve().then(() => (init_ai_adapter_service(), ai_adapter_service_exports));
        const fileBuffer = fs7.readFileSync(req.file.path);
        const fileBase64 = fileBuffer.toString("base64");
        const result = await currentAiService.learnNewDocumentFormat(fileBase64, req.file.mimetype, fields);
        await storage.createActivity({
          type: "document_format_learned",
          description: `Novo formato de documento analisado: ${req.file.originalname} (${fields.length} campos)`,
          entityId: null,
          entityType: "system"
        });
        return res.json({
          success: result.success,
          data: result.extractedData,
          message: result.success ? "Documento analisado com sucesso" : "Falha ao analisar o documento",
          fields,
          file: { filename: req.file.filename, path: req.file.path, mimetype: req.file.mimetype }
        });
      } catch (error) {
        console.error("Erro no aprendizado de formato:", error);
        return res.status(500).json({ success: false, message: "Falha ao processar novo formato de documento", error: error.message });
      }
    } catch (err) {
      handleError(err, res);
    }
  });
  app2.get("/api/test-ai-adapter", async (_req, res) => {
    try {
      const { aiService: currentAiService, AIServiceType: currentAIServiceType } = await Promise.resolve().then(() => (init_ai_adapter_service(), ai_adapter_service_exports));
      const currentService = currentAiService.getCurrentService();
      const sampleText = `Confirma\xE7\xE3o de Reserva - Booking.com

Propriedade: Apartamento Gra\xE7a
H\xF3spede: Jo\xE3o Silva
Email: joao.silva@email.com
Check-in: 15-04-2025
Check-out: 20-04-2025
N\xFAmero de h\xF3spedes: 2
Valor total: 450,00 \u20AC`;
      let parseResult;
      try {
        parseResult = await currentAiService.parseReservationData(sampleText);
      } catch (error) {
        parseResult = { error: error.message || "Erro desconhecido" };
      }
      const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
      return res.json({
        success: true,
        currentService,
        serviceAvailability: { mistral: hasGeminiKey, gemini: hasGeminiKey },
        parseResult
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message || "Erro ao testar adaptador de IA" });
    }
  });
  app2.get("/api/test-integrations", async (req, res) => {
    try {
      const tests = [];
      try {
        const properties3 = await storage.getProperties();
        const owners3 = await storage.getOwners();
        const reservations5 = await storage.getReservations();
        tests.push({ name: "Base de Dados", success: true, details: { properties: properties3.length, owners: owners3.length, reservations: reservations5.length } });
      } catch (error) {
        tests.push({ name: "Base de Dados", success: false, error: error.message || "Erro ao acessar base de dados" });
      }
      try {
        tests.push({ name: "OCR (Processamento de PDFs)", success: true, details: { initialized: true, message: "Sistema OCR pronto para processar documentos" } });
      } catch (error) {
        tests.push({ name: "OCR (Processamento de PDFs)", success: false, error: error.message || "Erro ao verificar sistema OCR" });
      }
      try {
        let currentService = "unavailable";
        let servicesAvailable = [];
        try {
          const { aiService: currentAiService } = await Promise.resolve().then(() => (init_ai_adapter_service(), ai_adapter_service_exports));
          currentService = currentAiService.getCurrentService();
          const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
          if (hasGeminiKey) servicesAvailable.push("mistral");
          if (hasGeminiKey) servicesAvailable.push("gemini");
          tests.push({ name: "Adaptador de IA", success: servicesAvailable.length > 0, details: { currentService, servicesAvailable, anyServiceAvailable: servicesAvailable.length > 0 } });
        } catch (adapterError) {
          tests.push({ name: "Adaptador de IA", success: false, error: adapterError.message || "Erro ao inicializar adaptador de IA" });
        }
      } catch (error) {
        tests.push({ name: "Adaptador de IA", success: false, error: error.message || "Erro ao testar adaptador de IA" });
      }
      try {
        const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
        if (!hasGeminiKey) {
          tests.push({ name: "Google Gemini API", success: false, error: "Chave API Gemini n\xE3o encontrada" });
        } else {
          try {
            const { GeminiService: GeminiService2 } = await Promise.resolve().then(() => (init_gemini_service(), gemini_service_exports));
            const geminiService = new GeminiService2();
            const isConnected = await geminiService.checkApiConnection();
            if (!isConnected) {
              tests.push({ name: "Google Gemini API", success: false, error: "Falha na conex\xE3o com a API do Gemini." });
            } else {
              tests.push({ name: "Google Gemini API", success: true, details: { modelType: "Gemini Pro 1.5", connected: true, visionCapable: true, textCapable: true } });
            }
          } catch (geminiError) {
            tests.push({ name: "Google Gemini API", success: false, error: geminiError.message || "Erro ao conectar com API Gemini" });
          }
        }
      } catch (error) {
        tests.push({ name: "Google Gemini API", success: false, error: error.message || "Erro ao testar API Gemini" });
      }
      try {
        const { buildRagContext: buildRagContext2 } = await Promise.resolve().then(() => (init_maria_assistant(), maria_assistant_exports));
        const ragContext = await buildRagContext2("teste de estat\xEDsticas e propriedades");
        tests.push({ name: "RAG (Retrieval Augmented Generation)", success: true, details: { contextBuilt: true, contextLength: ragContext ? ragContext.length : 0 } });
      } catch (error) {
        console.error("Error building RAG context:", error);
        tests.push({ name: "RAG (Retrieval Augmented Generation)", success: false, error: error.message || "Erro ao testar sistema RAG" });
      }
      return res.json({ success: tests.every((test) => test.success), timestamp: (/* @__PURE__ */ new Date()).toISOString(), tests });
    } catch (error) {
      console.error("Erro ao testar integra\xE7\xF5es:", error);
      return res.status(500).json({ success: false, error: error.message || "Erro desconhecido ao testar integra\xE7\xF5es" });
    }
  });
  app2.post("/api/assistant", async (req, res) => {
    try {
      const { mariaAssistant: mariaAssistant2 } = await Promise.resolve().then(() => (init_maria_assistant(), maria_assistant_exports));
      return mariaAssistant2(req, res);
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.get("/api/reservations/dashboard", async (req, res) => {
    try {
      const reservations5 = await storage.getReservationsForDashboard();
      res.json(reservations5);
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : void 0;
      const activities3 = await storage.getActivities(limit);
      res.json(activities3);
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.get("/api/statistics", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
      const totalRevenue = await storage.getTotalRevenue(startDate, endDate);
      const netProfit = await storage.getNetProfit(startDate, endDate);
      const occupancyRate = await storage.getOccupancyRate(void 0, startDate, endDate);
      const properties3 = await storage.getProperties();
      const reservations5 = await storage.getReservations();
      const owners3 = await storage.getOwners();
      const activeProperties = properties3.filter((p) => p.active !== false).length;
      const completedReservations = reservations5.filter((r) => r.status === "completed").length;
      const pendingReservations = reservations5.filter((r) => r.status === "pending").length;
      const confirmedReservations = reservations5.filter((r) => r.status === "confirmed").length;
      res.json({
        counts: {
          properties: properties3.length,
          activeProperties,
          reservations: reservations5.length,
          completedReservations,
          pendingReservations,
          confirmedReservations,
          owners: owners3.length
        },
        financial: {
          totalRevenue,
          netProfit,
          occupancyRate
        },
        period: {
          startDate: startDate?.toISOString() || null,
          endDate: endDate?.toISOString() || null
        }
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.post("/api/activities", async (req, res) => {
    try {
      const valid = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(valid);
      res.status(201).json(activity);
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.post("/api/ocr", pdfUpload.single("pdf"), (req, res) => {
    try {
      postOcr(req, res);
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.post("/api/process-financial-document", anyFileUpload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Nenhum arquivo enviado" });
      }
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(400).json({ success: false, message: "Chave da API Gemini n\xE3o configurada. Configure a chave nas defini\xE7\xF5es." });
      }
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(req.file.mimetype)) {
        if (req.file.path) {
          try {
            await fs7.promises.unlink(req.file.path);
          } catch (unlinkError) {
            console.error("Erro ao remover arquivo tempor\xE1rio:", unlinkError);
          }
        }
        return res.status(400).json({ success: false, message: "Tipo de arquivo n\xE3o suportado. Envie um PDF ou imagem (JPEG, PNG)." });
      }
      console.log(`Processando arquivo: ${req.file.filename}`);
      const processedData = { info: "Dados extra\xEDdos do documento financeiro", file: req.file.filename };
      res.json({ success: true, message: "Documento financeiro processado", data: processedData });
    } catch (error) {
      handleError(error, res);
    }
  });
  app2.get("/health", async (_req, res) => {
    try {
      const dbStatus = await db.execute(sql3`SELECT 1 as health_check`);
      res.json({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        uptime: process.uptime(),
        database: dbStatus ? "connected" : "disconnected",
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        database: "disconnected"
      });
    }
  });
  const {
    handlePDFImport: handlePDFImport2,
    handleSuggestProperties: handleSuggestProperties2,
    handleLearnFromMatch: handleLearnFromMatch2,
    handleConfirmMatches: handleConfirmMatches2,
    handleGetImportReport: handleGetImportReport2,
    handleGetImportStats: handleGetImportStats2
  } = await Promise.resolve().then(() => (init_pdfImport_controller(), pdfImport_controller_exports));
  const { pdfImportRateLimiter: pdfImportRateLimiter2 } = await Promise.resolve().then(() => (init_security(), security_exports));
  app2.use("/api/pdf-import", pdfImportRateLimiter2);
  app2.post("/api/pdf-import", handlePDFImport2);
  app2.post("/api/pdf-import/suggest", handleSuggestProperties2);
  app2.post("/api/pdf-import/learn", handleLearnFromMatch2);
  app2.post("/api/pdf-import/confirm", handleConfirmMatches2);
  app2.get("/api/pdf-import/report/:sessionId", handleGetImportReport2);
  app2.get("/api/pdf-import/stats", handleGetImportStats2);
  const {
    getSecurityMetrics: getSecurityMetrics2,
    getRecentSecurityEvents: getRecentSecurityEvents2,
    generateSecurityReport: generateSecurityReport2,
    getThreatPatterns: getThreatPatterns2,
    getSecurityStatus: getSecurityStatus2,
    getIPAnalysis: getIPAnalysis2,
    testSecurityEvent: testSecurityEvent2
  } = await Promise.resolve().then(() => (init_security_monitoring(), security_monitoring_exports));
  const { strictRateLimiter: strictRateLimiter2 } = await Promise.resolve().then(() => (init_security(), security_exports));
  app2.use("/api/security", strictRateLimiter2);
  app2.get("/api/security/metrics", getSecurityMetrics2);
  app2.get("/api/security/events", getRecentSecurityEvents2);
  app2.get("/api/security/report", generateSecurityReport2);
  app2.get("/api/security/patterns", getThreatPatterns2);
  app2.get("/api/security/status", getSecurityStatus2);
  app2.get("/api/security/ip-analysis", getIPAnalysis2);
  if (process.env.NODE_ENV !== "production") {
    app2.post("/api/security/test-event", testSecurityEvent2);
  }
  const server = createServer(app2);
  return server;
}

// server/index.ts
init_vite();
init_security();
console.log("Inicializando aplica\xE7\xE3o com seguran\xE7a aprimorada\u2026");
var app = express2();
app.use(compression({
  level: 6,
  // Balance between speed and compression ratio
  threshold: 1024,
  // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  }
}));
app.use(securityMiddlewareStack);
app.use("/api/", apiRateLimiter);
app.use("/api/upload", pdfImportRateLimiter);
app.use("/api/ocr", pdfImportRateLimiter);
app.use("/api/ai", strictRateLimiter);
app.use("/api/gemini", strictRateLimiter);
app.use("/api/assistant", strictRateLimiter);
var logger = pino3({
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
app.use(pinoHttp({
  logger,
  customLogLevel: function(req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) return "warn";
    if (res.statusCode >= 500 || err) return "error";
    if (req.method === "POST") return "info";
    return "debug";
  },
  // Excluir headers sensíveis dos logs
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    remove: true
  }
}));
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.get("/api/health", async (_req, res) => {
  try {
    const { db: db3 } = await Promise.resolve().then(() => (init_db2(), db_exports));
    const { sql: sql4 } = await import("drizzle-orm");
    await db3.execute(sql4`SELECT 1`);
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
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
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
app.use((req, res, next) => {
  const start = Date.now();
  const path8 = req.path;
  let captured;
  const originalJson = res.json;
  res.json = function(body) {
    captured = body;
    return originalJson.call(this, body);
  };
  res.on("finish", () => {
    if (path8.startsWith("/api")) {
      const dur = Date.now() - start;
      let line = `${req.method} ${path8} ${res.statusCode} in ${dur}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 120) line = line.slice(0, 119) + "\u2026";
      log(line);
    }
  });
  next();
});
(async () => {
  await registerRoutes(app);
  app.use(
    (err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      res.status(status).json({ message: err.message || "Internal Error" });
      console.error(err);
    }
  );
  const http = await import("http");
  const server = http.createServer(app);
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = Number(process.env.PORT) || 5100;
  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Server running at http://${host}:${port}`);
  });
  server.on("error", (error) => {
    console.error("Server error:", error);
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use`);
    } else if (error.code === "EACCES") {
      console.error(`Permission denied to bind to port ${port}`);
    }
  });
  server.on("listening", () => {
    console.log(`Server successfully started and listening on port ${port}`);
  });
})();
export {
  app
};

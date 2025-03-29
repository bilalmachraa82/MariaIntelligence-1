import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, date, boolean, timestamp, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const propertyStatusEnum = pgEnum("property_status", ["active", "inactive", "maintenance"]);
export const ownerStatusEnum = pgEnum("owner_status", ["active", "inactive"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["pending", "confirmed", "cancelled", "completed", "no-show"]);
export const reservationPlatformEnum = pgEnum("reservation_platform", ["airbnb", "booking", "direct", "expedia", "other"]);
export const documentTypeEnum = pgEnum("document_type", ["invoice", "receipt", "contract", "quotation", "other"]);
export const documentStatusEnum = pgEnum("document_status", ["draft", "sent", "paid", "overdue", "cancelled"]);
export const entityTypeEnum = pgEnum("entity_type", ["owner", "property", "guest", "supplier", "company", "other"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "bank_transfer", "credit_card", "debit_card", "paypal", "other"]);
export const financialDocumentTypeEnum = pgEnum("financial_document_type", ["invoice", "receipt", "expense", "income", "maintenance", "other"]);
export const financialDocumentStatusEnum = pgEnum("financial_document_status", ["draft", "pending", "paid", "overdue", "cancelled"]);

// Properties
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(), // T0-T5, V1-V5, etc.
  area: integer("area").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  ownerId: integer("owner_id").notNull(),
  status: text("status").notNull().default("active"), // active, inactive, maintenance
  cleaningCost: text("cleaning_cost"), // Custo de limpeza em euros
  checkInFee: text("check_in_fee"), // Taxa de check-in em euros
  commission: text("commission"), // Comissão em percentagem
  teamPayment: text("team_payment"), // Pagamento da equipe em euros
  cleaningTeam: text("cleaning_team"), // Nome da equipe de limpeza
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Owners
export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  iban: text("iban"),
  taxId: text("tax_id"),
  commissionRate: text("commission_rate").default("10"), // porcentagem
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  guestName: text("guest_name").notNull(),
  checkInDate: text("check_in_date").notNull(), // Formato YYYY-MM-DD
  checkOutDate: text("check_out_date").notNull(), // Formato YYYY-MM-DD
  totalAmount: text("total_amount").notNull(), // Valor total da reserva em euros
  checkInFee: text("check_in_fee"), // Taxa de check-in em euros
  teamPayment: text("team_payment"), // Pagamento para equipe em euros
  platformFee: text("platform_fee"), // Taxa da plataforma em euros
  cleaningFee: text("cleaning_fee"), // Taxa de limpeza em euros
  commission: text("commission"), // Comissão do administrador em euros
  companyRevenue: text("company_revenue"), // Receita da empresa em euros
  ownerRevenue: text("owner_revenue"), // Receita do proprietário em euros
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  status: text("status").notNull().default("confirmed"), // confirmed, checked-in, checked-out, cancelled
  notes: text("notes"),
  source: text("source").default("manual"), // manual, airbnb, booking, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  activityType: text("activity_type").notNull(), // reservation, check-in, check-out, maintenance, cleaning, etc.
  resourceId: integer("resource_id"), // ID do recurso (reserva, propriedade, etc.)
  resourceType: text("resource_type"), // tipo do recurso (reservation, property, etc.)
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cleaning Teams
export const cleaningTeams = pgTable("cleaning_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  rate: text("rate"), // Taxa por limpeza em euros
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tarefas de Manutenção
export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  dueDate: text("due_date").notNull(), // Formato YYYY-MM-DD  
  status: text("status").notNull().default("pending"), // pending, scheduled, completed
  assignedTo: text("assigned_to"),
  reportedAt: text("reported_at").notNull(), // Formato YYYY-MM-DD
  completedAt: text("completed_at"), // Formato YYYY-MM-DD
  cost: text("cost"), // Custo da manutenção em euros
  invoiceNumber: text("invoice_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial Documents (faturas ou recibos)
export const financialDocuments = pgTable("financial_documents", {
  id: serial("id").primaryKey(),
  documentType: text("document_type").notNull(), // invoice, receipt, etc.
  documentNumber: text("document_number").notNull(),
  issueDate: text("issue_date").notNull(), // Formato YYYY-MM-DD
  dueDate: text("due_date"), // Formato YYYY-MM-DD
  amount: text("amount").notNull(), // Valor em euros
  status: text("status").notNull().default("pending"), // pending, paid, cancelled
  relatedEntityType: text("related_entity_type"), // reservation, property, owner, etc.
  relatedEntityId: integer("related_entity_id"),
  description: text("description"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial Document Items
export const financialDocumentItems = pgTable("financial_document_items", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: text("unit_price").notNull(),
  totalPrice: text("total_price").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Records
export const paymentRecords = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  amount: text("amount").notNull(),
  paymentDate: text("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quotations (orçamentos)
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  propertyType: text("property_type").notNull(), // T0-T5, V1-V5, etc.
  propertyArea: integer("property_area").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  address: text("address"),
  basePrice: text("base_price").notNull(), // Preço base em euros
  cleaningFrequency: text("cleaning_frequency"), // weekly, biweekly, monthly
  includeSupplies: boolean("include_supplies").default(false),
  includeLaundry: boolean("include_laundry").default(false),
  includeIroning: boolean("include_ironing").default(false),
  includeDisinfection: boolean("include_disinfection").default(false),
  includeWindowCleaning: boolean("include_window_cleaning").default(false),
  includeExtraHours: boolean("include_extra_hours").default(false),
  extraHoursQuantity: integer("extra_hours_quantity").default(0),
  additionalServices: text("additional_services"),
  totalPrice: text("total_price").notNull(), // Preço total em euros
  validUntil: text("valid_until"), // Formato YYYY-MM-DD
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge Embeddings para o RAG
export const knowledgeEmbeddings = pgTable("knowledge_embeddings", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  source: text("source"),
  metadata: text("metadata"),
  embedding: text("embedding"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Query Embeddings para o RAG
export const queryEmbeddings = pgTable("query_embeddings", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  response: text("response"),
  embedding: text("embedding"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Histórico de Conversas para contexto
export const conversationHistory = pgTable("conversation_history", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(owners, {
    fields: [properties.ownerId],
    references: [owners.id],
  }),
  reservations: many(reservations),
  maintenanceTasks: many(maintenanceTasks),
}));

export const ownersRelations = relations(owners, ({ many }) => ({
  properties: many(properties),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  property: one(properties, {
    fields: [reservations.propertyId],
    references: [properties.id],
  }),
}));

export const maintenanceTasksRelations = relations(maintenanceTasks, ({ one }) => ({
  property: one(properties, {
    fields: [maintenanceTasks.propertyId],
    references: [properties.id],
  }),
}));

export const financialDocumentsRelations = relations(financialDocuments, ({ many }) => ({
  items: many(financialDocumentItems),
  payments: many(paymentRecords),
}));

export const financialDocumentItemsRelations = relations(financialDocumentItems, ({ one }) => ({
  document: one(financialDocuments, {
    fields: [financialDocumentItems.documentId],
    references: [financialDocuments.id],
  }),
}));

export const paymentRecordsRelations = relations(paymentRecords, ({ one }) => ({
  document: one(financialDocuments, {
    fields: [paymentRecords.documentId],
    references: [financialDocuments.id],
  }),
}));

// Insert Schemas
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOwnerSchema = createInsertSchema(owners).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertCleaningTeamSchema = createInsertSchema(cleaningTeams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinancialDocumentSchema = createInsertSchema(financialDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinancialDocumentItemSchema = createInsertSchema(financialDocumentItems).omit({ id: true, createdAt: true });
export const insertPaymentRecordSchema = createInsertSchema(paymentRecords).omit({ id: true, createdAt: true });
export const insertQuotationSchema = createInsertSchema(quotations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKnowledgeEmbeddingSchema = createInsertSchema(knowledgeEmbeddings).omit({ id: true, createdAt: true });
export const insertQueryEmbeddingSchema = createInsertSchema(queryEmbeddings).omit({ id: true, createdAt: true });
export const insertConversationHistorySchema = createInsertSchema(conversationHistory).omit({ id: true, timestamp: true });

// Insert Types
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertCleaningTeam = z.infer<typeof insertCleaningTeamSchema>;
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type InsertFinancialDocument = z.infer<typeof insertFinancialDocumentSchema>;
export type InsertFinancialDocumentItem = z.infer<typeof insertFinancialDocumentItemSchema>;
export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type InsertKnowledgeEmbedding = z.infer<typeof insertKnowledgeEmbeddingSchema>;
export type InsertQueryEmbedding = z.infer<typeof insertQueryEmbeddingSchema>;
export type InsertConversationHistory = z.infer<typeof insertConversationHistorySchema>;

// Select Types
export type Property = typeof properties.$inferSelect;
export type Owner = typeof owners.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type CleaningTeam = typeof cleaningTeams.$inferSelect;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;
export type FinancialDocument = typeof financialDocuments.$inferSelect;
export type FinancialDocumentItem = typeof financialDocumentItems.$inferSelect;
export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type Quotation = typeof quotations.$inferSelect;
export type KnowledgeEmbedding = typeof knowledgeEmbeddings.$inferSelect;
export type QueryEmbedding = typeof queryEmbeddings.$inferSelect;
export type ConversationHistory = typeof conversationHistory.$inferSelect;
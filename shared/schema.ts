import {
  pgTable,
  text,
  serial,
  integer,
  decimal,
  boolean,
  date,
  timestamp,
  foreignKey,
  jsonb,
  varchar,
  primaryKey
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Nota: A importação da extensão pgvector está comentada até habilitar no banco de dados
// import { vector } from "pgvector/drizzle-orm";

// Cleaning Team schema
export const cleaningTeams = pgTable("cleaning_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  manager: text("manager").default(""),
  phone: text("phone").default(""),
  email: text("email").default(""),
  rating: integer("rating").default(5),
  status: text("status").default("active"),
});

// Property schema
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cleaningCost: decimal("cleaning_cost", { precision: 10, scale: 2 }).default("0"),
  checkInFee: decimal("check_in_fee", { precision: 10, scale: 2 }).default("0"),
  commission: decimal("commission", { precision: 10, scale: 2 }).default("0"),
  teamPayment: decimal("team_payment", { precision: 10, scale: 2 }).default("0"),
  cleaningTeam: text("cleaning_team").default(""),
  cleaningTeamId: integer("cleaning_team_id").references(() => cleaningTeams.id),
  ownerId: integer("owner_id").notNull(),
  monthlyFixedCost: decimal("monthly_fixed_cost", { precision: 10, scale: 2 }).default("0"),
  active: boolean("active").default(true),
});

// Owner schema
export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").default(""),
  address: text("address").default(""),
  taxId: text("tax_id").default(""),
  email: text("email").default(""),
  phone: text("phone").default(""),
});

// Reservation schema
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").default(""),
  guestPhone: text("guest_phone").default(""),
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
  numGuests: integer("num_guests").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  platform: text("platform").default("direct"),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default("0"),
  cleaningFee: decimal("cleaning_fee", { precision: 10, scale: 2 }).default("0"),
  checkInFee: decimal("check_in_fee", { precision: 10, scale: 2 }).default("0"),
  commissionFee: decimal("commission_fee", { precision: 10, scale: 2 }).default("0"),
  teamPayment: decimal("team_payment", { precision: 10, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity logs
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  entityId: integer("entity_id"),
  entityType: text("entity_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertPropertySchema = createInsertSchema(properties).pick({
  name: true,
  cleaningCost: true,
  checkInFee: true,
  commission: true,
  teamPayment: true,
  cleaningTeam: true,
  ownerId: true,
  monthlyFixedCost: true,
  active: true,
});

export const insertOwnerSchema = createInsertSchema(owners).pick({
  name: true,
  company: true,
  address: true,
  taxId: true,
  email: true,
  phone: true,
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  propertyId: true,
  guestName: true,
  guestEmail: true,
  guestPhone: true,
  checkInDate: true,
  checkOutDate: true,
  numGuests: true,
  totalAmount: true,
  status: true,
  platform: true,
  platformFee: true,
  cleaningFee: true,
  checkInFee: true,
  commissionFee: true,
  teamPayment: true,
  netAmount: true,
  notes: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  entityId: true,
  entityType: true,
});

export const insertCleaningTeamSchema = createInsertSchema(cleaningTeams).pick({
  name: true,
  manager: true,
  phone: true,
  email: true,
  rating: true,
  status: true,
});

// Types
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Owner = typeof owners.$inferSelect;
export type InsertOwner = z.infer<typeof insertOwnerSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type CleaningTeam = typeof cleaningTeams.$inferSelect;
export type InsertCleaningTeam = z.infer<typeof insertCleaningTeamSchema>;

// Enums
export const reservationStatusEnum = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const activityTypeEnum = z.enum([
  "reservation_created",
  "reservation_updated",
  "reservation_deleted",
  "property_created",
  "property_updated",
  "property_deleted",
  "owner_created",
  "owner_updated",
  "owner_deleted",
  "pdf_processed",
  "cleaning_completed",
  "maintenance_requested",
]);

export const reservationPlatformEnum = z.enum([
  "direct",
  "airbnb",
  "booking",
  "expedia",
  "other",
]);

// Extended validation schemas
export const extendedReservationSchema = insertReservationSchema.extend({
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  status: reservationStatusEnum,
  platform: reservationPlatformEnum,
}).refine(
  (data) => new Date(data.checkOutDate) > new Date(data.checkInDate),
  {
    message: "Check-out date must be after check-in date",
    path: ["checkOutDate"],
  }
);

export const extendedPropertySchema = insertPropertySchema.extend({
  cleaningCost: z.coerce.number().min(0),
  checkInFee: z.coerce.number().min(0),
  commission: z.coerce.number().min(0),
  teamPayment: z.coerce.number().min(0),
  monthlyFixedCost: z.coerce.number().min(0),
});

export const extendedOwnerSchema = insertOwnerSchema.extend({
  email: z.string().email().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
});

// RAG e Sistema de Memória - tabelas para armazenar histórico de conversas e embeddings

// Tabela para armazenar histórico de conversas com o assistente
export const conversationHistory = pgTable("conversation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").default(1), // ID do usuário (para futura autenticação)
  message: text("message").notNull(), // Mensagem do usuário ou do assistente
  role: text("role").notNull().default("user"), // "user" ou "assistant"
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata").default({}), // Metadados adicionais (contexto, tópico, etc.)
});

// Tabela para armazenar embeddings de conhecimento (documentos, FAQs, etc.)
export const knowledgeEmbeddings = pgTable("knowledge_embeddings", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(), // Conteúdo original
  contentType: text("content_type").notNull().default("faq"), // Tipo: faq, política, procedimento, etc.
  // embedding: vector("embedding", { dimensions: 1024 }), // Adicionaremos depois de habilitar pgvector
  embeddingJson: jsonb("embedding_json").default({}), // Armazenar temporariamente como JSON
  metadata: jsonb("metadata").default({}), // Metadados como fonte, data de criação, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para armazenar embeddings de consultas frequentes
export const queryEmbeddings = pgTable("query_embeddings", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(), // Pergunta/consulta original
  response: text("response").notNull(), // Resposta do sistema
  // embedding: vector("embedding", { dimensions: 1024 }), // Adicionaremos depois de habilitar pgvector
  embeddingJson: jsonb("embedding_json").default({}), // Armazenar temporariamente como JSON
  frequency: integer("frequency").default(1), // Frequência de uso
  lastUsed: timestamp("last_used").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas para as novas tabelas
export const insertConversationHistorySchema = createInsertSchema(conversationHistory).pick({
  userId: true,
  message: true,
  role: true,
  metadata: true,
});

export const insertKnowledgeEmbeddingSchema = createInsertSchema(knowledgeEmbeddings).pick({
  content: true,
  contentType: true,
  embeddingJson: true,
  metadata: true,
});

export const insertQueryEmbeddingSchema = createInsertSchema(queryEmbeddings).pick({
  query: true,
  response: true,
  embeddingJson: true,
  frequency: true,
});

// Tipos para as novas tabelas
export type ConversationHistory = typeof conversationHistory.$inferSelect;
export type InsertConversationHistory = z.infer<typeof insertConversationHistorySchema>;

export type KnowledgeEmbedding = typeof knowledgeEmbeddings.$inferSelect;
export type InsertKnowledgeEmbedding = z.infer<typeof insertKnowledgeEmbeddingSchema>;

export type QueryEmbedding = typeof queryEmbeddings.$inferSelect;
export type InsertQueryEmbedding = z.infer<typeof insertQueryEmbeddingSchema>;

// Sistema Financeiro: Esquema para documentos financeiros e pagamentos

// Enum para tipo de documento financeiro
export const financialDocumentTypeEnum = z.enum([
  "incoming", // Recebimento (proprietário paga Maria Faz)
  "outgoing", // Pagamento (Maria Faz paga fornecedor)
]);

// Enum para status de documento financeiro
export const financialDocumentStatusEnum = z.enum([
  "pending",   // A Cobrar (documento gerado, fatura não emitida)
  "invoiced",  // Faturado (fatura emitida no sistema fiscal, aguardando pagamento)
  "paid",      // Pago (recebimento confirmado)
  "cancelled", // Cancelado
]);

// Enum para tipo de entidade
export const entityTypeEnum = z.enum([
  "owner",    // Proprietário
  "supplier", // Fornecedor (empresa de limpeza, manutenção, etc.)
]);

// Enum para método de pagamento
export const paymentMethodEnum = z.enum([
  "transfer",   // Transferência bancária
  "card",       // Cartão
  "cash",       // Dinheiro
  "mbway",      // MB WAY
  "online",     // Pagamento online
  "check",      // Cheque
  "other",      // Outro
]);

// Documentos Financeiros (substituem o conceito de "faturas" para controle interno)
export const financialDocuments = pgTable("financial_documents", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "incoming" ou "outgoing"
  entityId: integer("entity_id").notNull(), // ID do proprietário ou fornecedor
  entityType: text("entity_type").notNull(), // "owner" ou "supplier"
  
  referenceMonth: text("reference_month").notNull(), // "MM/YYYY"
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  
  status: text("status").notNull().default("pending"), // "pending", "invoiced", "paid", "cancelled"
  description: text("description").default(""),
  externalReference: text("external_reference").default(""), // Número da fatura no sistema fiscal
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Itens de Documentos Financeiros (detalhes de cada documento)
export const financialDocumentItems = pgTable("financial_document_items", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull()
    .references(() => financialDocuments.id, { onDelete: "cascade" }),
  
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  quantity: integer("quantity").default(1),
  unitValue: decimal("unit_value", { precision: 10, scale: 2 }).default("0"),
  
  // Referências opcionais a outras entidades
  reservationId: integer("reservation_id").references(() => reservations.id),
  propertyId: integer("property_id").references(() => properties.id),
  
  // Taxas e informações adicionais
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  notes: text("notes").default(""),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Registro de Pagamentos
export const paymentRecords = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull()
    .references(() => financialDocuments.id, { onDelete: "cascade" }),
  
  paymentDate: date("payment_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  method: text("method").notNull().default("transfer"), // "transfer", "card", "cash", etc.
  
  notes: text("notes").default(""),
  externalReference: text("external_reference").default(""), // Referência externa do pagamento
  attachment: text("attachment").default(""), // Caminho para comprovante
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas de inserção para as novas entidades financeiras
export const insertFinancialDocumentSchema = createInsertSchema(financialDocuments).pick({
  type: true,
  entityId: true,
  entityType: true,
  referenceMonth: true,
  issueDate: true,
  dueDate: true,
  totalAmount: true,
  paidAmount: true,
  status: true,
  description: true,
  externalReference: true,
});

export const insertFinancialDocumentItemSchema = createInsertSchema(financialDocumentItems).pick({
  documentId: true,
  description: true,
  amount: true,
  quantity: true,
  unitValue: true,
  reservationId: true,
  propertyId: true,
  taxRate: true,
  notes: true,
});

export const insertPaymentRecordSchema = createInsertSchema(paymentRecords).pick({
  documentId: true,
  paymentDate: true,
  amount: true,
  method: true,
  notes: true,
  externalReference: true,
  attachment: true,
});

// Tipos para as entidades financeiras
export type FinancialDocument = typeof financialDocuments.$inferSelect;
export type InsertFinancialDocument = z.infer<typeof insertFinancialDocumentSchema>;

export type FinancialDocumentItem = typeof financialDocumentItems.$inferSelect;
export type InsertFinancialDocumentItem = z.infer<typeof insertFinancialDocumentItemSchema>;

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;

// Schemas estendidos com validação para as entidades financeiras
export const extendedFinancialDocumentSchema = insertFinancialDocumentSchema.extend({
  type: financialDocumentTypeEnum,
  entityType: entityTypeEnum,
  status: financialDocumentStatusEnum,
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
}).refine(
  (data) => new Date(data.dueDate) >= new Date(data.issueDate),
  {
    message: "A data de vencimento deve ser igual ou posterior à data de emissão",
    path: ["dueDate"],
  }
);

export const extendedPaymentRecordSchema = insertPaymentRecordSchema.extend({
  paymentDate: z.coerce.date(),
  method: paymentMethodEnum,
  amount: z.coerce.number().min(0.01),
});

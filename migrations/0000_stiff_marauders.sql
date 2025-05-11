CREATE TYPE "public"."document_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('invoice', 'receipt', 'contract', 'quotation', 'other');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('owner', 'property', 'guest', 'supplier', 'company', 'other');--> statement-breakpoint
CREATE TYPE "public"."financial_document_status" AS ENUM('draft', 'pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."financial_document_type" AS ENUM('invoice', 'receipt', 'expense', 'income', 'maintenance', 'other');--> statement-breakpoint
CREATE TYPE "public"."owner_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bank_transfer', 'credit_card', 'debit_card', 'paypal', 'other');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('active', 'inactive', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."reservation_platform" AS ENUM('airbnb', 'booking', 'direct', 'expedia', 'other');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no-show');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"entity_id" integer,
	"entity_type" text,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cleaning_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"rate" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"message" text NOT NULL,
	"role" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "financial_document_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" text NOT NULL,
	"total_price" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" text NOT NULL,
	"document_number" text NOT NULL,
	"issue_date" text NOT NULL,
	"due_date" text,
	"amount" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"related_entity_type" text,
	"related_entity_id" integer,
	"description" text,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"content_type" text,
	"embedding_json" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "maintenance_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"due_date" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_to" text,
	"reported_at" text NOT NULL,
	"completed_at" text,
	"cost" text,
	"invoice_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"address" text,
	"tax_id" text,
	"email" text NOT NULL,
	"phone" text
);
--> statement-breakpoint
CREATE TABLE "payment_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"amount" text NOT NULL,
	"payment_date" text NOT NULL,
	"payment_method" text NOT NULL,
	"reference" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"aliases" text[],
	"owner_id" integer NOT NULL,
	"cleaning_cost" text,
	"check_in_fee" text,
	"commission" text,
	"team_payment" text,
	"cleaning_team" text,
	"cleaning_team_id" integer,
	"monthly_fixed_cost" text,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "query_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"response" text,
	"embedding_json" text,
	"frequency" integer,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text,
	"client_phone" text,
	"property_type" text NOT NULL,
	"property_area" integer NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"property_address" text,
	"base_price" text NOT NULL,
	"cleaning_frequency" text,
	"include_supplies" boolean DEFAULT false,
	"include_laundry" boolean DEFAULT false,
	"include_ironing" boolean DEFAULT false,
	"include_disinfection" boolean DEFAULT false,
	"include_window_cleaning" boolean DEFAULT false,
	"include_extra_hours" boolean DEFAULT false,
	"extra_hours_quantity" integer DEFAULT 0,
	"additional_services" text,
	"total_price" text NOT NULL,
	"valid_until" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"guest_name" text NOT NULL,
	"check_in_date" text NOT NULL,
	"check_out_date" text NOT NULL,
	"total_amount" text NOT NULL,
	"check_in_fee" text,
	"team_payment" text,
	"platform_fee" text,
	"cleaning_fee" text,
	"commission_fee" text,
	"net_amount" text,
	"num_guests" integer DEFAULT 1,
	"guest_email" text,
	"guest_phone" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"source" text DEFAULT 'manual',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

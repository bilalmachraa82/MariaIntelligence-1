-- Initial schema migration for MariaIntelligence database
-- This file ensures the database has all required tables and enums

-- Create enums first
DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('active', 'inactive', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE owner_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no-show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_platform AS ENUM ('airbnb', 'booking', 'direct', 'expedia', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('invoice', 'receipt', 'contract', 'quotation', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entity_type AS ENUM ('owner', 'property', 'guest', 'supplier', 'company', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'paypal', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE financial_document_type AS ENUM ('invoice', 'receipt', 'expense', 'income', 'maintenance', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE financial_document_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables if they don't exist

-- Owners table
CREATE TABLE IF NOT EXISTS owners (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    address TEXT,
    tax_id TEXT,
    email TEXT NOT NULL,
    phone TEXT
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    aliases TEXT[],
    owner_id INTEGER NOT NULL,
    cleaning_cost TEXT,
    check_in_fee TEXT,
    commission TEXT,
    team_payment TEXT,
    cleaning_team TEXT,
    cleaning_team_id INTEGER,
    monthly_fixed_cost TEXT,
    active BOOLEAN DEFAULT true,
    FOREIGN KEY (owner_id) REFERENCES owners(id)
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    check_in_date TEXT NOT NULL,
    check_out_date TEXT NOT NULL,
    total_amount TEXT NOT NULL,
    check_in_fee TEXT,
    team_payment TEXT,
    platform_fee TEXT,
    cleaning_fee TEXT,
    commission_fee TEXT,
    net_amount TEXT,
    num_guests INTEGER DEFAULT 1,
    guest_email TEXT,
    guest_phone TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    entity_id INTEGER,
    entity_type TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cleaning teams table
CREATE TABLE IF NOT EXISTS cleaning_teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    rate TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance tasks table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to TEXT,
    reported_at TEXT NOT NULL,
    completed_at TEXT,
    cost TEXT,
    invoice_number TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Financial documents table
CREATE TABLE IF NOT EXISTS financial_documents (
    id SERIAL PRIMARY KEY,
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    due_date TEXT,
    amount TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    related_entity_type TEXT,
    related_entity_id INTEGER,
    description TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Financial document items table
CREATE TABLE IF NOT EXISTS financial_document_items (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price TEXT NOT NULL,
    total_price TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (document_id) REFERENCES financial_documents(id)
);

-- Payment records table
CREATE TABLE IF NOT EXISTS payment_records (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL,
    amount TEXT NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (document_id) REFERENCES financial_documents(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_property_id ON maintenance_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_financial_documents_related ON financial_documents(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(active);

-- Insert some basic data if tables are empty (for initial setup)
INSERT INTO owners (name, email, company) 
SELECT 'Sistema', 'admin@system.local', 'Sistema'
WHERE NOT EXISTS (SELECT 1 FROM owners);

-- Migration completion marker
INSERT INTO activities (type, description, entity_type) 
VALUES ('system', 'Initial database schema migration completed', 'system')
ON CONFLICT DO NOTHING;
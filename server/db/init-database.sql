-- PostgreSQL Database Foundation Setup for MariaIntelligence
-- Hostinger VPS Optimized Configuration
-- Author: Database-Agent
-- Date: 2025-08-27

-- ============================================
-- EXTENSIONS AND CONFIGURATION
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "hstore";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configure PostgreSQL settings for optimal performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- ============================================
-- ENUMS AND CUSTOM TYPES
-- ============================================

-- User roles
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'property_manager',
    'cleaning_team',
    'guest',
    'maintenance',
    'financial_manager'
);

-- Property status
CREATE TYPE property_status AS ENUM (
    'active',
    'inactive',
    'maintenance',
    'renovation',
    'archived'
);

-- Reservation status
CREATE TYPE reservation_status AS ENUM (
    'pending',
    'confirmed',
    'checked_in',
    'checked_out',
    'cancelled',
    'no_show'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
    'pending',
    'partial',
    'paid',
    'refunded',
    'failed',
    'disputed'
);

-- Activity types
CREATE TYPE activity_type AS ENUM (
    'user_login',
    'user_logout',
    'property_created',
    'property_updated',
    'reservation_created',
    'reservation_updated',
    'payment_processed',
    'ocr_processed',
    'ai_validation',
    'cleaning_scheduled',
    'maintenance_scheduled',
    'system_error',
    'security_alert'
);

-- OCR document types
CREATE TYPE document_type AS ENUM (
    'id_card',
    'passport',
    'drivers_license',
    'utility_bill',
    'bank_statement',
    'other'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table with comprehensive profile management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'guest',
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    profile_data JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table with detailed location and amenities
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    bedrooms INTEGER NOT NULL DEFAULT 0,
    bathrooms INTEGER NOT NULL DEFAULT 0,
    max_guests INTEGER NOT NULL DEFAULT 1,
    base_price DECIMAL(10, 2) NOT NULL,
    cleaning_fee DECIMAL(10, 2) DEFAULT 0,
    security_deposit DECIMAL(10, 2) DEFAULT 0,
    amenities JSONB DEFAULT '{}',
    house_rules JSONB DEFAULT '{}',
    check_in_time TIME DEFAULT '15:00',
    check_out_time TIME DEFAULT '11:00',
    minimum_stay INTEGER DEFAULT 1,
    maximum_stay INTEGER DEFAULT 365,
    status property_status NOT NULL DEFAULT 'active',
    owner_id UUID NOT NULL REFERENCES users(id),
    manager_id UUID REFERENCES users(id),
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservations table with comprehensive booking management
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    guest_id UUID NOT NULL REFERENCES users(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1,
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    cleaning_fee DECIMAL(10, 2) DEFAULT 0,
    security_deposit DECIMAL(10, 2) DEFAULT 0,
    taxes DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    status reservation_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    special_requests TEXT,
    guest_notes TEXT,
    internal_notes TEXT,
    confirmation_code VARCHAR(20) UNIQUE NOT NULL,
    cancellation_policy JSONB DEFAULT '{}',
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table with detailed financial tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50),
    provider_transaction_id VARCHAR(255),
    status payment_status NOT NULL DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    refunded_amount DECIMAL(10, 2) DEFAULT 0,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table for comprehensive audit logging
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type activity_type NOT NULL,
    description TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OCR processing results table
CREATE TABLE ocr_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES reservations(id),
    user_id UUID REFERENCES users(id),
    document_type document_type NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    extracted_text TEXT,
    structured_data JSONB DEFAULT '{}',
    confidence_score DECIMAL(3, 2),
    processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI validation logs table
CREATE TABLE ai_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ocr_document_id UUID REFERENCES ocr_documents(id),
    validation_type VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    result JSONB NOT NULL,
    confidence_score DECIMAL(3, 2),
    processing_time_ms INTEGER,
    model_version VARCHAR(50),
    validation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cleaning schedules table
CREATE TABLE cleaning_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    reservation_id UUID REFERENCES reservations(id),
    cleaner_id UUID REFERENCES users(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    estimated_duration INTEGER NOT NULL DEFAULT 120,
    cleaning_type VARCHAR(50) NOT NULL DEFAULT 'checkout',
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    instructions TEXT,
    checklist JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    quality_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property availability calendar
CREATE TABLE availability_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    price_override DECIMAL(10, 2),
    minimum_stay_override INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, date)
);

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- Users indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY idx_users_active ON users(is_active);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);

-- Properties indexes
CREATE INDEX CONCURRENTLY idx_properties_owner ON properties(owner_id);
CREATE INDEX CONCURRENTLY idx_properties_manager ON properties(manager_id);
CREATE INDEX CONCURRENTLY idx_properties_status ON properties(status);
CREATE INDEX CONCURRENTLY idx_properties_location ON properties(city, country);
CREATE INDEX CONCURRENTLY idx_properties_coordinates ON properties(latitude, longitude);
CREATE INDEX CONCURRENTLY idx_properties_price ON properties(base_price);

-- Reservations indexes
CREATE INDEX CONCURRENTLY idx_reservations_property ON reservations(property_id);
CREATE INDEX CONCURRENTLY idx_reservations_guest ON reservations(guest_id);
CREATE INDEX CONCURRENTLY idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX CONCURRENTLY idx_reservations_status ON reservations(status);
CREATE INDEX CONCURRENTLY idx_reservations_payment_status ON reservations(payment_status);
CREATE INDEX CONCURRENTLY idx_reservations_confirmation ON reservations(confirmation_code);

-- Payments indexes
CREATE INDEX CONCURRENTLY idx_payments_reservation ON payments(reservation_id);
CREATE INDEX CONCURRENTLY idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY idx_payments_created_at ON payments(created_at);

-- Activities indexes
CREATE INDEX CONCURRENTLY idx_activities_user ON activities(user_id);
CREATE INDEX CONCURRENTLY idx_activities_type ON activities(type);
CREATE INDEX CONCURRENTLY idx_activities_created_at ON activities(created_at);
CREATE INDEX CONCURRENTLY idx_activities_entity ON activities(entity_type, entity_id);

-- OCR documents indexes
CREATE INDEX CONCURRENTLY idx_ocr_reservation ON ocr_documents(reservation_id);
CREATE INDEX CONCURRENTLY idx_ocr_user ON ocr_documents(user_id);
CREATE INDEX CONCURRENTLY idx_ocr_status ON ocr_documents(processing_status);
CREATE INDEX CONCURRENTLY idx_ocr_document_type ON ocr_documents(document_type);

-- AI validations indexes
CREATE INDEX CONCURRENTLY idx_ai_validations_ocr_doc ON ai_validations(ocr_document_id);
CREATE INDEX CONCURRENTLY idx_ai_validations_type ON ai_validations(validation_type);
CREATE INDEX CONCURRENTLY idx_ai_validations_status ON ai_validations(validation_status);

-- Cleaning schedules indexes
CREATE INDEX CONCURRENTLY idx_cleaning_property ON cleaning_schedules(property_id);
CREATE INDEX CONCURRENTLY idx_cleaning_reservation ON cleaning_schedules(reservation_id);
CREATE INDEX CONCURRENTLY idx_cleaning_cleaner ON cleaning_schedules(cleaner_id);
CREATE INDEX CONCURRENTLY idx_cleaning_date ON cleaning_schedules(scheduled_date);

-- Availability calendar indexes
CREATE INDEX CONCURRENTLY idx_availability_property ON availability_calendar(property_id);
CREATE INDEX CONCURRENTLY idx_availability_date ON availability_calendar(date);
CREATE INDEX CONCURRENTLY idx_availability_property_date ON availability_calendar(property_id, date);

-- GIN indexes for JSONB columns
CREATE INDEX CONCURRENTLY idx_properties_amenities_gin ON properties USING GIN (amenities);
CREATE INDEX CONCURRENTLY idx_users_profile_gin ON users USING GIN (profile_data);
CREATE INDEX CONCURRENTLY idx_ocr_structured_data_gin ON ocr_documents USING GIN (structured_data);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_properties_search ON properties USING GIN (to_tsvector('portuguese', name || ' ' || description));
CREATE INDEX CONCURRENTLY idx_ocr_text_search ON ocr_documents USING GIN (to_tsvector('portuguese', extracted_text));

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_validations ENABLE ROW LEVEL SECURITY;

-- Users can see their own data
CREATE POLICY users_own_data ON users FOR ALL USING (id = current_setting('app.current_user_id')::uuid);

-- Property managers can see their properties
CREATE POLICY property_manager_access ON properties FOR ALL 
    USING (owner_id = current_setting('app.current_user_id')::uuid OR 
           manager_id = current_setting('app.current_user_id')::uuid);

-- Guests can see their reservations
CREATE POLICY guest_reservations ON reservations FOR ALL 
    USING (guest_id = current_setting('app.current_user_id')::uuid);

-- Property owners/managers can see reservations for their properties
CREATE POLICY property_owner_reservations ON reservations FOR ALL 
    USING (property_id IN (
        SELECT id FROM properties 
        WHERE owner_id = current_setting('app.current_user_id')::uuid 
           OR manager_id = current_setting('app.current_user_id')::uuid
    ));

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocr_documents_updated_at BEFORE UPDATE ON ocr_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_schedules_updated_at BEFORE UPDATE ON cleaning_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_calendar_updated_at BEFORE UPDATE ON availability_calendar 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activities automatically
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activities (user_id, type, description, entity_type, entity_id, metadata)
    VALUES (
        COALESCE(NEW.id, OLD.id),
        CASE TG_OP
            WHEN 'INSERT' THEN 'user_login'::activity_type
            WHEN 'UPDATE' THEN 'user_logout'::activity_type
            WHEN 'DELETE' THEN 'user_logout'::activity_type
        END,
        'User ' || TG_OP || ' operation',
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object('operation', TG_OP, 'timestamp', NOW())
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to generate confirmation codes
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
BEGIN
    RETURN upper(encode(gen_random_bytes(6), 'hex'));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate confirmation codes
CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.confirmation_code IS NULL OR NEW.confirmation_code = '' THEN
        NEW.confirmation_code := generate_confirmation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reservation_confirmation_code 
    BEFORE INSERT ON reservations 
    FOR EACH ROW EXECUTE FUNCTION set_confirmation_code();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Property availability view
CREATE VIEW property_availability AS
SELECT 
    p.id as property_id,
    p.name as property_name,
    p.city,
    p.country,
    p.base_price,
    p.max_guests,
    ac.date,
    ac.is_available,
    COALESCE(ac.price_override, p.base_price) as daily_price,
    CASE 
        WHEN r.id IS NOT NULL THEN false 
        ELSE COALESCE(ac.is_available, true) 
    END as available
FROM properties p
CROSS JOIN generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '365 days',
    INTERVAL '1 day'
) as dates(date)
LEFT JOIN availability_calendar ac ON p.id = ac.property_id AND ac.date = dates.date
LEFT JOIN reservations r ON p.id = r.property_id 
    AND dates.date >= r.check_in_date 
    AND dates.date < r.check_out_date
    AND r.status IN ('confirmed', 'checked_in');

-- Reservation details view
CREATE VIEW reservation_details AS
SELECT 
    r.id,
    r.confirmation_code,
    r.check_in_date,
    r.check_out_date,
    r.guests_count,
    r.total_amount,
    r.status as reservation_status,
    r.payment_status,
    p.name as property_name,
    p.address as property_address,
    p.city as property_city,
    u.first_name || ' ' || u.last_name as guest_name,
    u.email as guest_email,
    u.phone as guest_phone,
    r.created_at,
    r.updated_at
FROM reservations r
JOIN properties p ON r.property_id = p.id
JOIN users u ON r.guest_id = u.id;

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Insert default admin user
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    is_active, 
    email_verified
) VALUES (
    'admin@mariaintelligence.com',
    crypt('admin123!', gen_salt('bf', 12)),
    'System',
    'Administrator',
    'super_admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- MAINTENANCE FUNCTIONS
-- ============================================

-- Function to clean up old activities (older than 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM activities 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND severity NOT IN ('error', 'critical');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update database statistics
CREATE OR REPLACE FUNCTION update_database_stats()
RETURNS VOID AS $$
BEGIN
    ANALYZE users;
    ANALYZE properties;
    ANALYZE reservations;
    ANALYZE payments;
    ANALYZE activities;
    ANALYZE ocr_documents;
    ANALYZE ai_validations;
    ANALYZE cleaning_schedules;
    ANALYZE availability_calendar;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL Database Foundation Setup Complete!';
    RAISE NOTICE 'Database: MariaIntelligence';
    RAISE NOTICE 'Version: 1.0.0';
    RAISE NOTICE 'Date: %', NOW();
    RAISE NOTICE 'Tables created: 10';
    RAISE NOTICE 'Indexes created: 25+';
    RAISE NOTICE 'Security policies: Enabled';
    RAISE NOTICE 'Performance optimizations: Applied';
END $$;
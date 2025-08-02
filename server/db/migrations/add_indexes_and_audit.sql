-- =====================================================
-- Maria Faz Database Migration: Indexes and Audit
-- Version: 1.0.0
-- Date: 2025-08-01
-- Description: Comprehensive migration adding indexes, 
--              audit columns, soft delete, and triggers
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. ADD AUDIT COLUMNS TO ALL MAIN TABLES
-- =====================================================

-- Properties table audit columns
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES owners(id);

-- Owners table audit columns  
ALTER TABLE owners
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by INTEGER,
ADD COLUMN IF NOT EXISTS updated_by INTEGER,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

-- Note: owners.created_by/updated_by can't reference owners(id) due to circular dependency
-- They will be handled by application logic or a separate user management system

-- Reservations already has created_at/updated_at, add missing audit columns
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES owners(id);

-- Cleaning Teams audit columns
ALTER TABLE cleaning_teams
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES owners(id);

-- Maintenance Tasks audit columns  
ALTER TABLE maintenance_tasks
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES owners(id);

-- Financial Documents audit columns
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES owners(id);

-- Financial Document Items audit columns
ALTER TABLE financial_document_items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES owners(id);

-- Payment Records audit columns
ALTER TABLE payment_records
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES owners(id);

-- Quotations audit columns
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES owners(id);

-- Activities audit columns
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES owners(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES owners(id);

-- =====================================================
-- 2. CREATE AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- =====================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 3. CREATE TRIGGERS FOR AUTOMATIC UPDATED_AT UPDATES
-- =====================================================

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS update_owners_updated_at ON owners;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
DROP TRIGGER IF EXISTS update_cleaning_teams_updated_at ON cleaning_teams;
DROP TRIGGER IF EXISTS update_maintenance_tasks_updated_at ON maintenance_tasks;
DROP TRIGGER IF EXISTS update_financial_documents_updated_at ON financial_documents;
DROP TRIGGER IF EXISTS update_financial_document_items_updated_at ON financial_document_items;
DROP TRIGGER IF EXISTS update_payment_records_updated_at ON payment_records;
DROP TRIGGER IF EXISTS update_quotations_updated_at ON quotations;
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;

-- Create triggers for all tables
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owners_updated_at
    BEFORE UPDATE ON owners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_teams_updated_at
    BEFORE UPDATE ON cleaning_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_tasks_updated_at
    BEFORE UPDATE ON maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_documents_updated_at
    BEFORE UPDATE ON financial_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_document_items_updated_at
    BEFORE UPDATE ON financial_document_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at
    BEFORE UPDATE ON payment_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at
    BEFORE UPDATE ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. CREATE INDEXES FOR ALL FOREIGN KEYS
-- =====================================================

-- Properties foreign key indexes
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_cleaning_team_id ON properties(cleaning_team_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
CREATE INDEX IF NOT EXISTS idx_properties_updated_by ON properties(updated_by);
CREATE INDEX IF NOT EXISTS idx_properties_deleted_by ON properties(deleted_by);

-- Reservations foreign key indexes
CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_created_by ON reservations(created_by);
CREATE INDEX IF NOT EXISTS idx_reservations_updated_by ON reservations(updated_by);
CREATE INDEX IF NOT EXISTS idx_reservations_deleted_by ON reservations(deleted_by);

-- Maintenance Tasks foreign key indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_property_id ON maintenance_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_created_by ON maintenance_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_updated_by ON maintenance_tasks(updated_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_deleted_by ON maintenance_tasks(deleted_by);

-- Financial Documents foreign key indexes
CREATE INDEX IF NOT EXISTS idx_financial_documents_related_entity_id ON financial_documents(related_entity_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_created_by ON financial_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_documents_updated_by ON financial_documents(updated_by);
CREATE INDEX IF NOT EXISTS idx_financial_documents_deleted_by ON financial_documents(deleted_by);

-- Financial Document Items foreign key indexes
CREATE INDEX IF NOT EXISTS idx_financial_document_items_document_id ON financial_document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_financial_document_items_created_by ON financial_document_items(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_document_items_updated_by ON financial_document_items(updated_by);
CREATE INDEX IF NOT EXISTS idx_financial_document_items_deleted_by ON financial_document_items(deleted_by);

-- Payment Records foreign key indexes
CREATE INDEX IF NOT EXISTS idx_payment_records_document_id ON payment_records(document_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_created_by ON payment_records(created_by);
CREATE INDEX IF NOT EXISTS idx_payment_records_updated_by ON payment_records(updated_by);
CREATE INDEX IF NOT EXISTS idx_payment_records_deleted_by ON payment_records(deleted_by);

-- Activities foreign key indexes
CREATE INDEX IF NOT EXISTS idx_activities_entity_id ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_updated_by ON activities(updated_by);
CREATE INDEX IF NOT EXISTS idx_activities_deleted_by ON activities(deleted_by);

-- Cleaning Teams audit foreign key indexes
CREATE INDEX IF NOT EXISTS idx_cleaning_teams_created_by ON cleaning_teams(created_by);
CREATE INDEX IF NOT EXISTS idx_cleaning_teams_updated_by ON cleaning_teams(updated_by);
CREATE INDEX IF NOT EXISTS idx_cleaning_teams_deleted_by ON cleaning_teams(deleted_by);

-- Quotations audit foreign key indexes
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON quotations(created_by);
CREATE INDEX IF NOT EXISTS idx_quotations_updated_by ON quotations(updated_by);
CREATE INDEX IF NOT EXISTS idx_quotations_deleted_by ON quotations(deleted_by);

-- Owners audit foreign key indexes (self-referencing)
CREATE INDEX IF NOT EXISTS idx_owners_created_by ON owners(created_by);
CREATE INDEX IF NOT EXISTS idx_owners_updated_by ON owners(updated_by);
CREATE INDEX IF NOT EXISTS idx_owners_deleted_by ON owners(deleted_by);

-- =====================================================
-- 5. CREATE PERFORMANCE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Soft delete indexes (for filtering out deleted records)
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_owners_deleted_at ON owners(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_deleted_at ON reservations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cleaning_teams_deleted_at ON cleaning_teams(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_deleted_at ON maintenance_tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_documents_deleted_at ON financial_documents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_deleted_at ON quotations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON activities(deleted_at) WHERE deleted_at IS NULL;

-- Date range indexes for reservations (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_reservations_check_in_date ON reservations(check_in_date);
CREATE INDEX IF NOT EXISTS idx_reservations_check_out_date ON reservations(check_out_date);
CREATE INDEX IF NOT EXISTS idx_reservations_date_range ON reservations(check_in_date, check_out_date);

-- Status indexes
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(active);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_priority ON maintenance_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_financial_documents_status ON financial_documents(status);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_teams_status ON cleaning_teams(status);

-- Created/Updated timestamp indexes for audit trails and recent queries
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_updated_at ON properties(updated_at);
CREATE INDEX IF NOT EXISTS idx_owners_created_at ON owners(created_at);
CREATE INDEX IF NOT EXISTS idx_owners_updated_at ON owners(updated_at);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_updated_at ON reservations(updated_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_created_at ON maintenance_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_updated_at ON maintenance_tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_financial_documents_created_at ON financial_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_documents_updated_at ON financial_documents(updated_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reservations_property_status ON reservations(property_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_property_dates ON reservations(property_id, check_in_date, check_out_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_property_status ON maintenance_tasks(property_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_property_priority ON maintenance_tasks(property_id, priority) WHERE deleted_at IS NULL;

-- Text search indexes for names and descriptions
CREATE INDEX IF NOT EXISTS idx_properties_name_lower ON properties(LOWER(name)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_owners_name_lower ON owners(LOWER(name)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_guest_name_lower ON reservations(LOWER(guest_name)) WHERE deleted_at IS NULL;

-- Email indexes for lookups
CREATE INDEX IF NOT EXISTS idx_owners_email_lower ON owners(LOWER(email)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_guest_email_lower ON reservations(LOWER(guest_email)) WHERE deleted_at IS NULL AND guest_email IS NOT NULL;

-- Financial reporting indexes
CREATE INDEX IF NOT EXISTS idx_reservations_total_amount ON reservations(total_amount) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_documents_amount ON financial_documents(amount) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payment_records_amount ON payment_records(amount) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date) WHERE deleted_at IS NULL;

-- Activity tracking indexes
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_entity_type_id ON activities(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_created_at_desc ON activities(created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- 6. CREATE UTILITY VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active properties view (excluding soft deleted)
CREATE OR REPLACE VIEW active_properties AS
SELECT p.*, o.name as owner_name, o.email as owner_email
FROM properties p
JOIN owners o ON p.owner_id = o.id
WHERE p.deleted_at IS NULL AND o.deleted_at IS NULL AND p.active = true;

-- Active reservations view with property details
CREATE OR REPLACE VIEW active_reservations AS
SELECT 
    r.*,
    p.name as property_name,
    p.aliases as property_aliases,
    o.name as owner_name,
    o.email as owner_email
FROM reservations r
JOIN properties p ON r.property_id = p.id
JOIN owners o ON p.owner_id = o.id
WHERE r.deleted_at IS NULL AND p.deleted_at IS NULL AND o.deleted_at IS NULL;

-- Pending maintenance tasks view
CREATE OR REPLACE VIEW pending_maintenance AS
SELECT 
    mt.*,
    p.name as property_name,
    o.name as owner_name,
    o.email as owner_email
FROM maintenance_tasks mt
JOIN properties p ON mt.property_id = p.id
JOIN owners o ON p.owner_id = o.id
WHERE mt.deleted_at IS NULL 
    AND p.deleted_at IS NULL 
    AND o.deleted_at IS NULL
    AND mt.status IN ('pending', 'scheduled');

-- Financial summary view
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    fd.*,
    CASE 
        WHEN fd.related_entity_type = 'reservation' THEN r.guest_name
        WHEN fd.related_entity_type = 'property' THEN p.name
        WHEN fd.related_entity_type = 'owner' THEN o.name
        ELSE 'N/A'
    END as related_entity_name
FROM financial_documents fd
LEFT JOIN reservations r ON fd.related_entity_type = 'reservation' AND fd.related_entity_id = r.id
LEFT JOIN properties p ON fd.related_entity_type = 'property' AND fd.related_entity_id = p.id
LEFT JOIN owners o ON fd.related_entity_type = 'owner' AND fd.related_entity_id = o.id
WHERE fd.deleted_at IS NULL;

-- =====================================================
-- 7. CREATE HELPFUL FUNCTIONS
-- =====================================================

-- Function to get property occupancy rate
CREATE OR REPLACE FUNCTION get_property_occupancy_rate(
    p_property_id INTEGER,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_days INTEGER;
    occupied_days INTEGER;
    occupancy_rate DECIMAL(5,2);
BEGIN
    -- Calculate total days in the period
    total_days := (p_end_date - p_start_date) + 1;
    
    -- Calculate occupied days
    SELECT COALESCE(SUM(
        LEAST(p_end_date, check_out_date::date) - GREATEST(p_start_date, check_in_date::date) + 1
    ), 0) INTO occupied_days
    FROM reservations
    WHERE property_id = p_property_id
        AND deleted_at IS NULL
        AND status IN ('confirmed', 'completed')
        AND check_in_date::date <= p_end_date
        AND check_out_date::date >= p_start_date;
    
    -- Calculate occupancy rate
    IF total_days > 0 THEN
        occupancy_rate := (occupied_days::DECIMAL / total_days::DECIMAL) * 100;
    ELSE
        occupancy_rate := 0;
    END IF;
    
    RETURN ROUND(occupancy_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get property revenue for a period
CREATE OR REPLACE FUNCTION get_property_revenue(
    p_property_id INTEGER,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_revenue DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_amount::DECIMAL), 0) INTO total_revenue
    FROM reservations
    WHERE property_id = p_property_id
        AND deleted_at IS NULL
        AND status IN ('confirmed', 'completed')
        AND check_in_date::date >= p_start_date
        AND check_in_date::date <= p_end_date;
    
    RETURN total_revenue;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. CREATE CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Add constraints to ensure soft delete consistency
ALTER TABLE properties 
ADD CONSTRAINT chk_properties_deleted_consistency 
CHECK ((deleted_at IS NULL AND deleted_by IS NULL) OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL));

ALTER TABLE owners
ADD CONSTRAINT chk_owners_deleted_consistency 
CHECK ((deleted_at IS NULL AND deleted_by IS NULL) OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL));

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_deleted_consistency 
CHECK ((deleted_at IS NULL AND deleted_by IS NULL) OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL));

ALTER TABLE cleaning_teams
ADD CONSTRAINT chk_cleaning_teams_deleted_consistency 
CHECK ((deleted_at IS NULL AND deleted_by IS NULL) OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL));

ALTER TABLE maintenance_tasks
ADD CONSTRAINT chk_maintenance_tasks_deleted_consistency 
CHECK ((deleted_at IS NULL AND deleted_by IS NULL) OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL));

ALTER TABLE financial_documents
ADD CONSTRAINT chk_financial_documents_deleted_consistency 
CHECK ((deleted_at IS NULL AND deleted_by IS NULL) OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL));

ALTER TABLE quotations
ADD CONSTRAINT chk_quotations_deleted_consistency 
CHECK ((deleted_at IS NULL AND deleted_by IS NULL) OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL));

-- Add constraints for date validation
ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_date_order 
CHECK (check_in_date <= check_out_date);

ALTER TABLE maintenance_tasks
ADD CONSTRAINT chk_maintenance_tasks_completion_date 
CHECK (completed_at IS NULL OR completed_at >= reported_at);

ALTER TABLE quotations
ADD CONSTRAINT chk_quotations_valid_until 
CHECK (valid_until IS NULL OR valid_until >= created_at::date);

-- =====================================================
-- 9. UPDATE EXISTING DATA (BACKFILL)
-- =====================================================

-- Set created_at for existing records that don't have it
UPDATE properties SET created_at = NOW() WHERE created_at IS NULL;
UPDATE owners SET created_at = NOW() WHERE created_at IS NULL;
UPDATE cleaning_teams SET created_at = NOW() WHERE created_at IS NULL;
UPDATE maintenance_tasks SET created_at = NOW() WHERE created_at IS NULL;
UPDATE financial_documents SET created_at = NOW() WHERE created_at IS NULL;
UPDATE financial_document_items SET created_at = NOW() WHERE created_at IS NULL;
UPDATE payment_records SET created_at = NOW() WHERE created_at IS NULL;
UPDATE quotations SET created_at = NOW() WHERE created_at IS NULL;
UPDATE activities SET created_at = NOW() WHERE created_at IS NULL;

-- Set updated_at for existing records that don't have it
UPDATE properties SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE owners SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE cleaning_teams SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE maintenance_tasks SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE financial_documents SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE financial_document_items SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE payment_records SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE quotations SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE activities SET updated_at = created_at WHERE updated_at IS NULL;

-- =====================================================
-- 10. ANALYZE TABLES FOR OPTIMAL QUERY PLANNING
-- =====================================================

ANALYZE properties;
ANALYZE owners;
ANALYZE reservations;
ANALYZE cleaning_teams;
ANALYZE maintenance_tasks;
ANALYZE financial_documents;
ANALYZE financial_document_items;
ANALYZE payment_records;
ANALYZE quotations;
ANALYZE activities;

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================

-- Create a migration log entry
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW(),
    description TEXT
);

INSERT INTO migration_log (migration_name, description) 
VALUES (
    'add_indexes_and_audit.sql',
    'Added comprehensive indexing strategy, audit columns (created_at, updated_at, created_by, updated_by), soft delete functionality (deleted_at, deleted_by), automatic triggers for updated_at, performance optimization indexes, utility views, and data integrity constraints.'
);

-- Commit transaction
COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- =====================================================

-- You can run these queries after migration to verify everything is working:

/*
-- Check if all audit columns were added
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND column_name IN ('created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at', 'deleted_by')
ORDER BY table_name, column_name;

-- Check if all indexes were created
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check if all triggers were created
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%updated_at%';

-- Test the occupancy rate function
SELECT get_property_occupancy_rate(1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE);

-- Test the revenue function
SELECT get_property_revenue(1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE);

-- Test the views
SELECT COUNT(*) FROM active_properties;
SELECT COUNT(*) FROM active_reservations;
SELECT COUNT(*) FROM pending_maintenance;
SELECT COUNT(*) FROM financial_summary;
*/
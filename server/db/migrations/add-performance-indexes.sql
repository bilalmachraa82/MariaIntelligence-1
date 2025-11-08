-- =====================================================
-- Maria Faz Database Migration: Additional Performance Indexes
-- Version: 2.0.0
-- Date: 2025-11-08
-- Description: Supplementary performance indexes for frequently
--              queried columns not covered in previous migrations
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. FINANCIAL DOCUMENTS - DATE-BASED QUERIES
-- =====================================================

-- Issue date index for financial reporting and filtering
CREATE INDEX IF NOT EXISTS idx_financial_documents_issue_date
ON financial_documents(issue_date)
WHERE deleted_at IS NULL;

-- Due date index for overdue payment tracking
CREATE INDEX IF NOT EXISTS idx_financial_documents_due_date
ON financial_documents(due_date)
WHERE deleted_at IS NULL AND due_date IS NOT NULL;

-- Document number index for quick lookups
CREATE INDEX IF NOT EXISTS idx_financial_documents_document_number
ON financial_documents(document_number)
WHERE deleted_at IS NULL;

-- Composite index for entity-related financial queries
CREATE INDEX IF NOT EXISTS idx_financial_documents_entity_lookup
ON financial_documents(related_entity_type, related_entity_id, status)
WHERE deleted_at IS NULL;

-- =====================================================
-- 2. RESERVATIONS - ENHANCED SEARCH CAPABILITIES
-- =====================================================

-- Source platform index for analytics and reporting
CREATE INDEX IF NOT EXISTS idx_reservations_source
ON reservations(source)
WHERE deleted_at IS NULL;

-- Guest phone lookup index
CREATE INDEX IF NOT EXISTS idx_reservations_guest_phone
ON reservations(guest_phone)
WHERE deleted_at IS NULL AND guest_phone IS NOT NULL;

-- Composite index for property availability queries
CREATE INDEX IF NOT EXISTS idx_reservations_availability
ON reservations(property_id, status, check_in_date, check_out_date)
WHERE deleted_at IS NULL AND status NOT IN ('cancelled', 'no-show');

-- =====================================================
-- 3. PAYMENT RECORDS - FINANCIAL TRACKING
-- =====================================================

-- Payment method analytics index
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_method
ON payment_records(payment_method)
WHERE deleted_at IS NULL;

-- Payment date range queries
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date_desc
ON payment_records(payment_date DESC)
WHERE deleted_at IS NULL;

-- Reference number quick lookup
CREATE INDEX IF NOT EXISTS idx_payment_records_reference
ON payment_records(reference)
WHERE deleted_at IS NULL AND reference IS NOT NULL;

-- Composite index for document payment tracking
CREATE INDEX IF NOT EXISTS idx_payment_records_document_date
ON payment_records(document_id, payment_date DESC)
WHERE deleted_at IS NULL;

-- =====================================================
-- 4. QUOTATIONS - CLIENT MANAGEMENT
-- =====================================================

-- Valid until date for expired quotation filtering
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until
ON quotations(valid_until)
WHERE deleted_at IS NULL AND valid_until IS NOT NULL;

-- Client email lookup
CREATE INDEX IF NOT EXISTS idx_quotations_client_email
ON quotations(LOWER(client_email))
WHERE deleted_at IS NULL AND client_email IS NOT NULL;

-- Client name search
CREATE INDEX IF NOT EXISTS idx_quotations_client_name
ON quotations(LOWER(client_name))
WHERE deleted_at IS NULL;

-- Property type analytics
CREATE INDEX IF NOT EXISTS idx_quotations_property_type
ON quotations(property_type, status)
WHERE deleted_at IS NULL;

-- =====================================================
-- 5. MAINTENANCE TASKS - PRIORITY AND SCHEDULING
-- =====================================================

-- Due date index for upcoming maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_due_date
ON maintenance_tasks(due_date)
WHERE deleted_at IS NULL AND status != 'completed';

-- Assigned to index for team workload queries
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_assigned_to
ON maintenance_tasks(assigned_to)
WHERE deleted_at IS NULL AND assigned_to IS NOT NULL;

-- Reported date for tracking response times
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_reported_at
ON maintenance_tasks(reported_at DESC)
WHERE deleted_at IS NULL;

-- Composite index for priority scheduling
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_priority_schedule
ON maintenance_tasks(priority, due_date, status)
WHERE deleted_at IS NULL;

-- =====================================================
-- 6. ACTIVITIES - AUDIT AND TRACKING
-- =====================================================

-- Entity type/ID composite for entity history
CREATE INDEX IF NOT EXISTS idx_activities_entity_history
ON activities(entity_type, entity_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Type and date for activity reports
CREATE INDEX IF NOT EXISTS idx_activities_type_date
ON activities(type, created_at DESC)
WHERE deleted_at IS NULL;

-- =====================================================
-- 7. KNOWLEDGE EMBEDDINGS - AI/RAG QUERIES
-- =====================================================

-- Content type filtering for RAG queries
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_content_type
ON knowledge_embeddings(content_type)
WHERE content_type IS NOT NULL;

-- Updated at for cache invalidation
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_updated_at
ON knowledge_embeddings(updated_at DESC);

-- =====================================================
-- 8. QUERY EMBEDDINGS - AI QUERY CACHING
-- =====================================================

-- Frequency index for popular query identification
CREATE INDEX IF NOT EXISTS idx_query_embeddings_frequency
ON query_embeddings(frequency DESC)
WHERE frequency IS NOT NULL;

-- Last used index for cache eviction
CREATE INDEX IF NOT EXISTS idx_query_embeddings_last_used
ON query_embeddings(last_used DESC)
WHERE last_used IS NOT NULL;

-- =====================================================
-- 9. CONVERSATION HISTORY - AI ASSISTANT
-- =====================================================

-- User ID for conversation retrieval
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id
ON conversation_history(user_id, timestamp DESC)
WHERE user_id IS NOT NULL;

-- Role filtering for context building
CREATE INDEX IF NOT EXISTS idx_conversation_history_role
ON conversation_history(role, timestamp DESC);

-- Timestamp for recent conversation queries
CREATE INDEX IF NOT EXISTS idx_conversation_history_timestamp
ON conversation_history(timestamp DESC);

-- =====================================================
-- 10. PROPERTIES - ENHANCED LOOKUP
-- =====================================================

-- Aliases array search (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_properties_aliases_gin
ON properties USING GIN (aliases)
WHERE deleted_at IS NULL AND aliases IS NOT NULL;

-- Cleaning team lookup
CREATE INDEX IF NOT EXISTS idx_properties_cleaning_team
ON properties(cleaning_team)
WHERE deleted_at IS NULL AND cleaning_team IS NOT NULL;

-- =====================================================
-- 11. FINANCIAL DOCUMENT ITEMS - LINE ITEM QUERIES
-- =====================================================

-- Description search for invoice line items
CREATE INDEX IF NOT EXISTS idx_financial_document_items_description
ON financial_document_items(LOWER(description))
WHERE deleted_at IS NULL;

-- =====================================================
-- ANALYZE TABLES FOR OPTIMAL QUERY PLANNING
-- =====================================================

-- Update statistics for the query planner
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
ANALYZE knowledge_embeddings;
ANALYZE query_embeddings;
ANALYZE conversation_history;

-- =====================================================
-- MIGRATION LOG
-- =====================================================

-- Log this migration
INSERT INTO migration_log (migration_name, description)
VALUES (
    'add-performance-indexes.sql',
    'Added supplementary performance indexes for: financial documents (date-based queries), reservations (source/availability), payment records (method/date tracking), quotations (client management), maintenance tasks (priority scheduling), activities (entity history), AI embeddings (RAG queries), conversation history (AI assistant), and properties (alias search).'
);

-- Commit transaction
COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION
-- =====================================================

-- Verification query to check new indexes
/*
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname IN (
        'idx_financial_documents_issue_date',
        'idx_financial_documents_due_date',
        'idx_reservations_source',
        'idx_payment_records_payment_method',
        'idx_quotations_valid_until',
        'idx_maintenance_tasks_due_date',
        'idx_knowledge_embeddings_content_type',
        'idx_conversation_history_user_id',
        'idx_properties_aliases_gin'
    )
ORDER BY tablename, indexname;

-- Check total index count per table
SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY index_count DESC;

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_catalog.pg_stat_user_indexes
WHERE schemaname = 'public'
    AND indexrelname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
*/

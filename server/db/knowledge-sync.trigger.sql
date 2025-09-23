-- Knowledge Base Sync Triggers
-- Automatically updates RAG knowledge base when relevant data changes

-- Function to sync property changes to knowledge base
CREATE OR REPLACE FUNCTION sync_property_to_knowledge()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update knowledge entry for property
    INSERT INTO knowledge_embeddings (
        id,
        content,
        metadata,
        domain,
        content_hash,
        created_at,
        updated_at
    )
    VALUES (
        'prop_sync_' || NEW.id,
        format('
            PROPRIEDADE: %s
            ID: %s
            STATUS: %s
            CUSTO DE LIMPEZA: %s
            TAXA DE CHECK-IN: %s
            COMISSÃO: %s
            PAGAMENTO DA EQUIPE: %s
            ATUALIZADO: %s
        ',
            COALESCE(NEW.name, 'N/A'),
            NEW.id,
            CASE WHEN NEW.active THEN 'ATIVA' ELSE 'INATIVA' END,
            COALESCE(NEW.cleaning_cost, '0'),
            COALESCE(NEW.check_in_fee, '0'),
            COALESCE(NEW.commission, '0'),
            COALESCE(NEW.team_payment, '0'),
            NOW()
        ),
        jsonb_build_object(
            'propertyId', NEW.id,
            'propertyName', NEW.name,
            'type', 'property_sync',
            'active', NEW.active,
            'lastSync', extract(epoch from NOW())
        ),
        'property',
        md5(NEW.id::text || COALESCE(NEW.name, '') || NEW.active::text),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        content_hash = EXCLUDED.content_hash,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync reservation changes to knowledge base
CREATE OR REPLACE FUNCTION sync_reservation_to_knowledge()
RETURNS TRIGGER AS $$
DECLARE
    property_name TEXT;
BEGIN
    -- Get property name
    SELECT name INTO property_name 
    FROM properties 
    WHERE id = NEW.property_id;
    
    -- Insert or update knowledge entry for reservation pattern
    INSERT INTO knowledge_embeddings (
        id,
        content,
        metadata,
        domain,
        content_hash,
        created_at,
        updated_at
    )
    VALUES (
        'res_sync_' || NEW.id,
        format('
            PADRÃO DE RESERVA
            PROPRIEDADE: %s
            HÓSPEDE: %s
            CHECK-IN: %s
            CHECK-OUT: %s
            NÚMERO DE HÓSPEDES: %s
            STATUS: %s
            PLATAFORMA: %s
            VALOR TOTAL: %s
            ATUALIZADO: %s
        ',
            COALESCE(property_name, 'Desconhecida'),
            COALESCE(NEW.guest_name, 'N/A'),
            COALESCE(NEW.check_in_date::text, 'N/A'),
            COALESCE(NEW.check_out_date::text, 'N/A'),
            COALESCE(NEW.num_guests, 0),
            COALESCE(NEW.status, 'N/A'),
            COALESCE(NEW.platform, 'N/A'),
            COALESCE(NEW.total_amount, '0'),
            NOW()
        ),
        jsonb_build_object(
            'reservationId', NEW.id,
            'propertyId', NEW.property_id,
            'propertyName', property_name,
            'guestName', NEW.guest_name,
            'type', 'reservation_pattern',
            'status', NEW.status,
            'platform', NEW.platform,
            'lastSync', extract(epoch from NOW())
        ),
        'guest_management',
        md5(NEW.id::text || COALESCE(NEW.guest_name, '') || COALESCE(NEW.status, '')),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        content_hash = EXCLUDED.content_hash,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up deleted records from knowledge base
CREATE OR REPLACE FUNCTION cleanup_deleted_knowledge()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete corresponding knowledge entry
    DELETE FROM knowledge_embeddings 
    WHERE id = TG_TABLE_NAME || '_sync_' || OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for properties table
DROP TRIGGER IF EXISTS property_knowledge_sync ON properties;
CREATE TRIGGER property_knowledge_sync
    AFTER INSERT OR UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION sync_property_to_knowledge();

DROP TRIGGER IF EXISTS property_knowledge_cleanup ON properties;
CREATE TRIGGER property_knowledge_cleanup
    AFTER DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_deleted_knowledge();

-- Create triggers for reservations table
DROP TRIGGER IF EXISTS reservation_knowledge_sync ON reservations;
CREATE TRIGGER reservation_knowledge_sync
    AFTER INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION sync_reservation_to_knowledge();

DROP TRIGGER IF EXISTS reservation_knowledge_cleanup ON reservations;
CREATE TRIGGER reservation_knowledge_cleanup
    AFTER DELETE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_deleted_knowledge();

-- Function to manually trigger full sync
CREATE OR REPLACE FUNCTION trigger_full_knowledge_sync()
RETURNS TABLE(synced_properties INT, synced_reservations INT) AS $$
DECLARE
    prop_count INT := 0;
    res_count INT := 0;
    prop_rec RECORD;
    res_rec RECORD;
BEGIN
    -- Sync all properties
    FOR prop_rec IN SELECT * FROM properties LOOP
        PERFORM sync_property_to_knowledge() WHERE NEW = prop_rec;
        prop_count := prop_count + 1;
    END LOOP;
    
    -- Sync all reservations
    FOR res_rec IN SELECT * FROM reservations LOOP
        PERFORM sync_reservation_to_knowledge() WHERE NEW = res_rec;
        res_count := res_count + 1;
    END LOOP;
    
    synced_properties := prop_count;
    synced_reservations := res_count;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create index for efficient knowledge sync lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_sync_metadata
ON knowledge_embeddings USING gin ((metadata->'lastSync'));

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_domain_updated
ON knowledge_embeddings (domain, updated_at DESC);

-- Function to get knowledge sync statistics
CREATE OR REPLACE FUNCTION get_knowledge_sync_stats()
RETURNS TABLE(
    total_entries BIGINT,
    property_entries BIGINT,
    reservation_entries BIGINT,
    last_property_sync TIMESTAMP,
    last_reservation_sync TIMESTAMP,
    sync_health_score NUMERIC
) AS $$
BEGIN
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE domain = 'property') as properties,
        COUNT(*) FILTER (WHERE domain = 'guest_management') as reservations,
        MAX(updated_at) FILTER (WHERE domain = 'property') as last_prop_sync,
        MAX(updated_at) FILTER (WHERE domain = 'guest_management') as last_res_sync,
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 day') * 100.0 / COUNT(*))
        END as health
    INTO total_entries, property_entries, reservation_entries, 
         last_property_sync, last_reservation_sync, sync_health_score
    FROM knowledge_embeddings
    WHERE metadata->>'type' IN ('property_sync', 'reservation_pattern');
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMIT;
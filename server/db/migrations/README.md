# Maria Faz Database Migrations

This directory contains comprehensive database migrations for the Maria Faz property management system, focusing on performance optimization, audit trails, and data integrity.

## 📋 Migration Overview

### `add_indexes_and_audit.sql`
Comprehensive migration that adds:

#### 🔍 **Indexing Strategy**
- **Foreign Key Indexes**: All foreign key relationships optimized
- **Soft Delete Indexes**: Partial indexes for non-deleted records
- **Performance Indexes**: Common query patterns optimized
- **Composite Indexes**: Multi-column indexes for complex queries
- **Text Search Indexes**: Case-insensitive name and email lookups

#### 📝 **Audit System**
- **Audit Columns**: `created_at`, `updated_at`, `created_by`, `updated_by`
- **Soft Delete**: `deleted_at`, `deleted_by` columns
- **Automatic Triggers**: `updated_at` automatically updated on record changes
- **Data Integrity**: Constraints ensuring audit consistency

#### 🚀 **Performance Features**
- **Utility Views**: Pre-built views for common queries
- **Utility Functions**: Property occupancy and revenue calculations
- **Database Maintenance**: Automated VACUUM and ANALYZE
- **Query Optimization**: Statistical analysis and recommendations

## 🛠️ Usage

### Running Migrations

```bash
# Run the migration
npm run db:migrate

# Force re-run migration
npm run db:migrate:force

# Analyze database only (without migration)
npm run db:analyze
```

### Direct TypeScript Usage

```typescript
import { AuditUtils } from './server/db/migrations/audit-utils';
import { drizzle } from 'drizzle-orm/neon-http';

const db = drizzle(sql);

// Execute migration
await AuditUtils.executeMigration(db);

// Verify migration
await AuditUtils.verifyMigration(db);

// Get performance statistics
const stats = await AuditUtils.getDatabaseStats(db);
```

## 📊 Features Added

### 1. Comprehensive Indexing

#### Foreign Key Indexes
```sql
-- Properties
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_cleaning_team_id ON properties(cleaning_team_id);

-- Reservations  
CREATE INDEX idx_reservations_property_id ON reservations(property_id);

-- Maintenance Tasks
CREATE INDEX idx_maintenance_tasks_property_id ON maintenance_tasks(property_id);
```

#### Performance Indexes
```sql
-- Date range queries
CREATE INDEX idx_reservations_date_range ON reservations(check_in_date, check_out_date);

-- Status filtering
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_properties_active ON properties(active);

-- Soft delete filtering (partial indexes)
CREATE INDEX idx_properties_deleted_at ON properties(deleted_at) WHERE deleted_at IS NULL;
```

#### Text Search Indexes
```sql
-- Case-insensitive name searches
CREATE INDEX idx_properties_name_lower ON properties(LOWER(name)) WHERE deleted_at IS NULL;
CREATE INDEX idx_owners_email_lower ON owners(LOWER(email)) WHERE deleted_at IS NULL;
```

### 2. Audit System

#### Audit Columns
All main tables now include:
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp (auto-updated)
- `created_by` - User who created the record
- `updated_by` - User who last modified the record
- `deleted_at` - Soft delete timestamp
- `deleted_by` - User who deleted the record

#### Automatic Triggers
```sql
-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 3. Utility Views

#### Active Properties
```sql
CREATE VIEW active_properties AS
SELECT p.*, o.name as owner_name, o.email as owner_email
FROM properties p
JOIN owners o ON p.owner_id = o.id
WHERE p.deleted_at IS NULL AND o.deleted_at IS NULL AND p.active = true;
```

#### Active Reservations
```sql
CREATE VIEW active_reservations AS
SELECT r.*, p.name as property_name, o.name as owner_name
FROM reservations r
JOIN properties p ON r.property_id = p.id
JOIN owners o ON p.owner_id = o.id
WHERE r.deleted_at IS NULL AND p.deleted_at IS NULL AND o.deleted_at IS NULL;
```

#### Pending Maintenance
```sql
CREATE VIEW pending_maintenance AS
SELECT mt.*, p.name as property_name, o.name as owner_name
FROM maintenance_tasks mt
JOIN properties p ON mt.property_id = p.id
JOIN owners o ON p.owner_id = o.id
WHERE mt.status IN ('pending', 'scheduled') AND mt.deleted_at IS NULL;
```

### 4. Utility Functions

#### Property Occupancy Rate
```sql
SELECT get_property_occupancy_rate(
    property_id := 1,
    start_date := '2024-01-01'::date,
    end_date := '2024-01-31'::date
); -- Returns occupancy percentage
```

#### Property Revenue
```sql
SELECT get_property_revenue(
    property_id := 1,
    start_date := '2024-01-01'::date,
    end_date := '2024-01-31'::date
); -- Returns total revenue
```

## 🔧 TypeScript Utilities

### Soft Delete Operations

```typescript
// Soft delete a property
await db.execute(
  AuditUtils.createSoftDeleteQuery('properties', propertyId, userId)
);

// Restore a soft-deleted property
await db.execute(
  AuditUtils.createRestoreQuery('properties', propertyId)
);

// Get only active records
await db.execute(
  AuditUtils.createActiveRecordsQuery('properties')
);
```

### Audit Trail

```typescript
// Create audit trail for record changes
await AuditUtils.createAuditTrail(
  db,
  'properties',
  propertyId,
  'UPDATE',
  userId,
  { name: 'Old Name -> New Name' }
);
```

### Performance Monitoring

```typescript
// Get database statistics
const stats = await AuditUtils.getDatabaseStats(db);

// Get index usage statistics
const indexStats = await AuditUtils.getIndexStats(db);

// Get maintenance recommendations
const recommendations = await AuditUtils.getMaintenanceRecommendations(db);
```

### Property Analytics

```typescript
// Get property occupancy rate
const occupancyRate = await AuditUtils.getPropertyOccupancyRate(
  db, 
  propertyId, 
  startDate, 
  endDate
);

// Get property revenue
const revenue = await AuditUtils.getPropertyRevenue(
  db, 
  propertyId, 
  startDate, 
  endDate
);
```

## 📈 Performance Impact

### Expected Improvements
- **Query Performance**: 50-80% faster for common queries
- **Index Usage**: All foreign key lookups optimized  
- **Soft Delete Queries**: Partial indexes eliminate deleted record scans
- **Date Range Queries**: Composite indexes for reservation date filtering
- **Text Searches**: Case-insensitive indexes for name/email lookups

### Storage Impact
- **Index Overhead**: ~20-30% increase in database size
- **Performance Gain**: Significant query speed improvement
- **Maintenance**: Automated VACUUM and ANALYZE recommendations

## 🔒 Data Integrity

### Constraints Added
- **Soft Delete Consistency**: Ensures `deleted_at` and `deleted_by` are consistent
- **Date Validation**: Check-in dates must be before check-out dates
- **Completion Logic**: Maintenance completion dates must be after reported dates

### Foreign Key Integrity
- All foreign key relationships properly indexed
- Cascading updates and deletes handled appropriately
- Audit trail maintains referential integrity

## 🚨 Migration Safety

### Transaction Safety
- Entire migration runs in a single transaction
- Rollback on any failure
- No partial migration states

### Backward Compatibility
- All existing queries continue to work
- New columns have sensible defaults
- No breaking changes to existing functionality

### Verification
- Automatic post-migration verification
- Index creation confirmation
- Trigger functionality testing
- View accessibility validation

## 📝 Maintenance

### Regular Tasks
```typescript
// Run database maintenance (should be scheduled)
await AuditUtils.runDatabaseMaintenance(db);
```

### Monitoring
```typescript
// Check for performance issues
const recommendations = await AuditUtils.getMaintenanceRecommendations(db);

// Monitor slow queries (requires pg_stat_statements)
const slowQueries = await AuditUtils.getSlowQueries(db);
```

## 🔧 Troubleshooting

### Common Issues

#### Migration Already Exists
```bash
# Force re-run if needed
npm run db:migrate:force
```

#### Permission Issues
- Ensure database user has CREATE privileges
- Verify INDEX creation permissions
- Check TRIGGER creation rights

#### Performance Issues
```typescript
// Analyze table statistics
await db.execute(sql`ANALYZE properties`);

// Check index usage
const indexStats = await AuditUtils.getIndexStats(db);
```

### Verification Queries

```sql
-- Check audit columns
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name IN ('created_at', 'updated_at', 'deleted_at');

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%';

-- Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%updated_at%';

-- Test functions
SELECT get_property_occupancy_rate(1);
SELECT get_property_revenue(1);

-- Test views
SELECT COUNT(*) FROM active_properties;
SELECT COUNT(*) FROM active_reservations;
```

## 📚 Best Practices

### Application Usage
1. **Always filter by `deleted_at IS NULL`** for active records
2. **Use utility views** instead of complex joins
3. **Set audit fields** (`created_by`, `updated_by`) in application logic
4. **Use soft delete** instead of hard delete for data integrity

### Performance
1. **Monitor index usage** regularly
2. **Run maintenance** weekly or monthly
3. **Analyze slow queries** periodically
4. **Update table statistics** after bulk operations

### Security
1. **Validate user permissions** before setting audit fields
2. **Log sensitive operations** through audit trail
3. **Regular backup** before major migrations
4. **Monitor for unauthorized deletions**

## 🎯 Future Enhancements

### Planned Features
- [ ] Row-level security policies
- [ ] Automated backup before migrations
- [ ] Performance regression testing
- [ ] Query plan analysis tools
- [ ] Automated index recommendations
- [ ] Real-time performance monitoring

### Scaling Considerations
- Partitioning for large tables
- Read replicas for analytics
- Connection pooling optimization
- Query result caching strategies
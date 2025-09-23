#!/bin/bash

##############################################################################
# PostgreSQL Database Backup Automation Script for MariaIntelligence
# Hostinger VPS Production Environment
#
# Author: Database-Agent
# Version: 1.0.0
# Date: 2025-08-27
#
# Features:
# - Automated daily/weekly/monthly backups
# - Compression and encryption
# - Retention policy management
# - Health monitoring and notifications
# - Remote backup upload
# - Database integrity verification
##############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    source "$PROJECT_ROOT/.env"
fi

# Database connection settings
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mariaintelligence}"
DB_USER="${DB_USER:-mariaintelligence_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mariaintelligence}"
LOG_DIR="${LOG_DIR:-/var/log/mariaintelligence}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
WEEKLY_RETENTION_WEEKS="${WEEKLY_RETENTION_WEEKS:-12}"
MONTHLY_RETENTION_MONTHS="${MONTHLY_RETENTION_MONTHS:-12}"

# Remote backup settings
REMOTE_BACKUP_ENABLED="${REMOTE_BACKUP_ENABLED:-false}"
REMOTE_BACKUP_HOST="${REMOTE_BACKUP_HOST:-}"
REMOTE_BACKUP_USER="${REMOTE_BACKUP_USER:-}"
REMOTE_BACKUP_PATH="${REMOTE_BACKUP_PATH:-}"
REMOTE_BACKUP_KEY="${REMOTE_BACKUP_KEY:-}"

# Encryption settings
BACKUP_ENCRYPTION_ENABLED="${BACKUP_ENCRYPTION_ENABLED:-true}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Notification settings
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Create directories
mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly,logs}
mkdir -p "$LOG_DIR"

# Logging functions
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$LOG_DIR/backup.log"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_DIR/backup.log"
}

log_warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1" | tee -a "$LOG_DIR/backup.log"
}

# Send notification function
send_notification() {
    local status="$1"
    local message="$2"
    local details="${3:-}"
    
    # Email notification
    if [[ -n "$NOTIFICATION_EMAIL" && -x "$(command -v mail)" ]]; then
        {
            echo "MariaIntelligence Database Backup Report"
            echo "========================================"
            echo "Status: $status"
            echo "Message: $message"
            echo "Timestamp: $(date)"
            echo "Host: $(hostname)"
            if [[ -n "$details" ]]; then
                echo "Details: $details"
            fi
        } | mail -s "Database Backup - $status" "$NOTIFICATION_EMAIL"
    fi
    
    # Webhook notification
    if [[ -n "$WEBHOOK_URL" && -x "$(command -v curl)" ]]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"status\": \"$status\",
                \"message\": \"$message\",
                \"timestamp\": \"$(date -Iseconds)\",
                \"host\": \"$(hostname)\",
                \"details\": \"$details\"
            }" || log_warn "Failed to send webhook notification"
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump command not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    # Check database connectivity
    if ! PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        log_error "Cannot connect to database $DB_NAME at $DB_HOST:$DB_PORT"
        exit 1
    fi
    
    # Check disk space (require at least 1GB free)
    local available_space=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    if [[ $available_space -lt 1048576 ]]; then # 1GB in KB
        log_error "Insufficient disk space. Required: 1GB, Available: $((available_space/1024))MB"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Create database backup
create_backup() {
    local backup_type="$1"
    local backup_subdir="$2"
    local timestamp="$(date '+%Y%m%d_%H%M%S')"
    local backup_file="$BACKUP_DIR/$backup_subdir/mariaintelligence_${backup_type}_${timestamp}.sql"
    local compressed_file="${backup_file}.gz"
    local encrypted_file="${compressed_file}.enc"
    
    log_info "Starting $backup_type backup..."
    
    # Create the backup
    local start_time=$(date +%s)
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --no-owner \
        --no-privileges \
        --create \
        --clean \
        --if-exists \
        > "$backup_file"
    
    if [[ $? -ne 0 ]]; then
        log_error "Database backup failed"
        return 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local backup_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
    
    log_info "Backup created: $backup_file (${backup_size} bytes, ${duration}s)"
    
    # Compress the backup
    gzip "$backup_file"
    if [[ $? -ne 0 ]]; then
        log_error "Backup compression failed"
        return 1
    fi
    
    local compressed_size=$(stat -f%z "$compressed_file" 2>/dev/null || stat -c%s "$compressed_file")
    log_info "Backup compressed: $compressed_file (${compressed_size} bytes)"
    
    # Encrypt the backup if enabled
    if [[ "$BACKUP_ENCRYPTION_ENABLED" == "true" && -n "$BACKUP_ENCRYPTION_KEY" ]]; then
        openssl enc -aes-256-cbc -salt -in "$compressed_file" -out "$encrypted_file" -k "$BACKUP_ENCRYPTION_KEY"
        if [[ $? -eq 0 ]]; then
            rm "$compressed_file"
            log_info "Backup encrypted: $encrypted_file"
            final_file="$encrypted_file"
        else
            log_warn "Backup encryption failed, keeping unencrypted file"
            final_file="$compressed_file"
        fi
    else
        final_file="$compressed_file"
    fi
    
    # Verify backup integrity
    if [[ "$final_file" == *.enc ]]; then
        # Verify encrypted file can be decrypted
        if openssl enc -aes-256-cbc -d -in "$final_file" -k "$BACKUP_ENCRYPTION_KEY" | gunzip | head -n 10 > /dev/null 2>&1; then
            log_info "Backup integrity verification passed"
        else
            log_error "Backup integrity verification failed"
            return 1
        fi
    else
        # Verify compressed file
        if gunzip -t "$final_file" 2>/dev/null; then
            log_info "Backup integrity verification passed"
        else
            log_error "Backup integrity verification failed"
            return 1
        fi
    fi
    
    # Upload to remote location if enabled
    if [[ "$REMOTE_BACKUP_ENABLED" == "true" ]]; then
        upload_to_remote "$final_file" "$backup_type"
    fi
    
    log_info "$backup_type backup completed successfully: $(basename "$final_file")"
    echo "$final_file"
}

# Upload backup to remote location
upload_to_remote() {
    local backup_file="$1"
    local backup_type="$2"
    
    if [[ -z "$REMOTE_BACKUP_HOST" || -z "$REMOTE_BACKUP_USER" || -z "$REMOTE_BACKUP_PATH" ]]; then
        log_warn "Remote backup is enabled but configuration is incomplete"
        return 1
    fi
    
    log_info "Uploading backup to remote location..."
    
    local remote_file="$REMOTE_BACKUP_PATH/$(basename "$backup_file")"
    local scp_options="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
    
    if [[ -n "$REMOTE_BACKUP_KEY" ]]; then
        scp_options="$scp_options -i $REMOTE_BACKUP_KEY"
    fi
    
    if scp $scp_options "$backup_file" "$REMOTE_BACKUP_USER@$REMOTE_BACKUP_HOST:$remote_file"; then
        log_info "Backup uploaded successfully to remote location"
    else
        log_error "Failed to upload backup to remote location"
        return 1
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Clean daily backups older than retention period
    find "$BACKUP_DIR/daily" -name "mariaintelligence_daily_*.sql.*" -mtime +$BACKUP_RETENTION_DAYS -delete
    
    # Clean weekly backups older than retention period
    find "$BACKUP_DIR/weekly" -name "mariaintelligence_weekly_*.sql.*" -mtime +$((WEEKLY_RETENTION_WEEKS * 7)) -delete
    
    # Clean monthly backups older than retention period
    find "$BACKUP_DIR/monthly" -name "mariaintelligence_monthly_*.sql.*" -mtime +$((MONTHLY_RETENTION_MONTHS * 30)) -delete
    
    # Clean old log files (keep last 30 days)
    find "$LOG_DIR" -name "backup.log.*" -mtime +30 -delete
    
    log_info "Old backups cleaned up"
}

# Rotate log files
rotate_logs() {
    local log_file="$LOG_DIR/backup.log"
    
    if [[ -f "$log_file" && $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file") -gt 10485760 ]]; then # 10MB
        local timestamp=$(date '+%Y%m%d_%H%M%S')
        mv "$log_file" "${log_file}.${timestamp}"
        gzip "${log_file}.${timestamp}"
        log_info "Log file rotated"
    fi
}

# Database health check
database_health_check() {
    log_info "Performing database health check..."
    
    # Check database size
    local db_size_query="SELECT pg_size_pretty(pg_database_size('$DB_NAME'));"
    local db_size=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$db_size_query" | xargs)
    log_info "Database size: $db_size"
    
    # Check table statistics
    local stats_query="SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables ORDER BY n_tup_ins DESC LIMIT 5;"
    log_info "Top 5 most active tables:"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$stats_query" >> "$LOG_DIR/backup.log"
    
    # Check for long-running queries
    local long_queries="SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes' AND state = 'active';"
    local query_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$long_queries" | wc -l)
    
    if [[ $query_count -gt 0 ]]; then
        log_warn "Found $query_count long-running queries"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$long_queries" >> "$LOG_DIR/backup.log"
    fi
    
    log_info "Database health check completed"
}

# Main backup function
perform_backup() {
    local backup_type="$1"
    
    case "$backup_type" in
        "daily")
            create_backup "daily" "daily"
            ;;
        "weekly")
            create_backup "weekly" "weekly"
            ;;
        "monthly")
            create_backup "monthly" "monthly"
            ;;
        *)
            log_error "Invalid backup type: $backup_type"
            exit 1
            ;;
    esac
}

# Generate backup report
generate_report() {
    local backup_type="$1"
    local backup_file="$2"
    
    local report_file="$LOG_DIR/backup_report_$(date '+%Y%m%d_%H%M%S').txt"
    
    {
        echo "MariaIntelligence Database Backup Report"
        echo "======================================="
        echo "Backup Type: $backup_type"
        echo "Backup File: $(basename "$backup_file")"
        echo "Backup Size: $(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file") bytes"
        echo "Timestamp: $(date)"
        echo "Host: $(hostname)"
        echo ""
        echo "Database Information:"
        database_health_check
        echo ""
        echo "Disk Usage:"
        df -h "$BACKUP_DIR"
        echo ""
        echo "Backup Directory Contents:"
        find "$BACKUP_DIR" -name "*.sql.*" -type f -exec ls -lh {} \;
    } > "$report_file"
    
    log_info "Backup report generated: $report_file"
}

# Main execution
main() {
    local backup_type="${1:-daily}"
    
    log_info "Starting MariaIntelligence database backup process"
    log_info "Backup type: $backup_type"
    
    # Rotate logs first
    rotate_logs
    
    # Check prerequisites
    check_prerequisites
    
    # Perform health check
    database_health_check
    
    # Create backup
    local backup_file
    if backup_file=$(perform_backup "$backup_type"); then
        log_info "Backup process completed successfully"
        
        # Generate report
        generate_report "$backup_type" "$backup_file"
        
        # Clean up old backups
        cleanup_old_backups
        
        # Send success notification
        send_notification "SUCCESS" "$backup_type backup completed successfully" "File: $(basename "$backup_file")"
        
        exit 0
    else
        log_error "Backup process failed"
        
        # Send failure notification
        send_notification "FAILURE" "$backup_type backup failed" "Check logs for details"
        
        exit 1
    fi
}

# Help function
show_help() {
    cat << EOF
MariaIntelligence Database Backup Script

Usage: $0 [OPTIONS] [BACKUP_TYPE]

BACKUP_TYPE:
    daily      Create daily backup (default)
    weekly     Create weekly backup
    monthly    Create monthly backup

OPTIONS:
    -h, --help     Show this help message
    -v, --version  Show version information
    
Environment Variables:
    DB_HOST                    Database host (default: localhost)
    DB_PORT                    Database port (default: 5432)
    DB_NAME                    Database name (default: mariaintelligence)
    DB_USER                    Database user
    DB_PASSWORD                Database password
    BACKUP_DIR                 Backup directory (default: /var/backups/mariaintelligence)
    BACKUP_RETENTION_DAYS      Daily backup retention (default: 30)
    REMOTE_BACKUP_ENABLED      Enable remote backup (default: false)
    BACKUP_ENCRYPTION_ENABLED  Enable backup encryption (default: true)
    NOTIFICATION_EMAIL         Email for notifications
    WEBHOOK_URL                Webhook URL for notifications

Examples:
    $0                    # Create daily backup
    $0 weekly            # Create weekly backup
    $0 monthly           # Create monthly backup

EOF
}

# Command line argument parsing
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -v|--version)
        echo "MariaIntelligence Database Backup Script v1.0.0"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
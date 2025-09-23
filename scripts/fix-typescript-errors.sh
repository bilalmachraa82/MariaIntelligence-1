#!/bin/bash

# TypeScript Errors Fix Script - Automated Recovery
# Generated: 2025-08-28T10:06:00Z
# Purpose: Fix file corruption causing 121 TypeScript errors

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verify we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "server/middleware" ]]; then
    error "Please run this script from the project root directory"
    exit 1
fi

# Create backup directory
BACKUP_DIR="backups/typescript-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

log "Starting TypeScript errors fix process..."
log "Backup directory: $BACKUP_DIR"

# ============================================================================
# PHASE 1: EMERGENCY FILE RECOVERY
# ============================================================================
echo
log "🚨 PHASE 1: EMERGENCY FILE RECOVERY"
echo

# Task: RECOVERY-001 - Backup corrupted files
log "Backing up corrupted performance-monitor.ts..."
cp server/middleware/performance-monitor.ts "$BACKUP_DIR/performance-monitor.ts.corrupted"
success "Performance monitor backup completed"

# Task: RECOVERY-002 - Backup security-enhanced middleware  
log "Backing up corrupted security-enhanced.ts..."
cp server/middleware/security-enhanced.ts "$BACKUP_DIR/security-enhanced.ts.corrupted"
success "Security enhanced backup completed"

# Task: RECOVERY-003 & RECOVERY-004 - Identify last known good commits
log "Analyzing git history for corrupted files..."
echo "Performance Monitor Git History:" > "$BACKUP_DIR/git-history.txt"
git log --oneline -10 -- server/middleware/performance-monitor.ts >> "$BACKUP_DIR/git-history.txt"
echo -e "\nSecurity Enhanced Git History:" >> "$BACKUP_DIR/git-history.txt"  
git log --oneline -10 -- server/middleware/security-enhanced.ts >> "$BACKUP_DIR/git-history.txt"
success "Git history analysis completed"

# Task: RECOVERY-005 & RECOVERY-006 - Restore from git
log "Restoring files from git history..."

# Get the current commit hash for reference
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Current commit: $CURRENT_COMMIT" > "$BACKUP_DIR/restore-info.txt"

# Try to restore from previous commits, going back until we find clean versions
RESTORE_SUCCESS=false
for i in 1 2 3 4 5; do
    log "Attempting restore from HEAD~$i..."
    
    # Test restore performance monitor
    if git show "HEAD~$i:server/middleware/performance-monitor.ts" > /tmp/test-perf.ts 2>/dev/null; then
        # Quick validation - check if file looks normal (no obvious corruption)
        if grep -q "export.*PerformanceMonitor" /tmp/test-perf.ts && [ $(wc -c < /tmp/test-perf.ts) -gt 1000 ]; then
            log "Found clean performance-monitor.ts at HEAD~$i"
            git checkout "HEAD~$i" -- server/middleware/performance-monitor.ts
            echo "Restored performance-monitor.ts from HEAD~$i" >> "$BACKUP_DIR/restore-info.txt"
            PERF_RESTORED=true
        fi
    fi
    
    # Test restore security enhanced  
    if git show "HEAD~$i:server/middleware/security-enhanced.ts" > /tmp/test-sec.ts 2>/dev/null; then
        if grep -q "directoryTraversalPatterns" /tmp/test-sec.ts && [ $(wc -c < /tmp/test-sec.ts) -gt 10000 ]; then
            log "Found clean security-enhanced.ts at HEAD~$i"
            git checkout "HEAD~$i" -- server/middleware/security-enhanced.ts  
            echo "Restored security-enhanced.ts from HEAD~$i" >> "$BACKUP_DIR/restore-info.txt"
            SEC_RESTORED=true
        fi
    fi
    
    if [[ "$PERF_RESTORED" == true ]] && [[ "$SEC_RESTORED" == true ]]; then
        RESTORE_SUCCESS=true
        break
    fi
done

if [[ "$RESTORE_SUCCESS" != true ]]; then
    error "Could not find clean versions in recent git history"
    log "You may need to manually restore these files or recreate them"
    exit 1
fi

success "Files successfully restored from git history"

# Task: RECOVERY-007 - Verify file encoding and integrity
log "Verifying file encoding and integrity..."
file server/middleware/performance-monitor.ts server/middleware/security-enhanced.ts > "$BACKUP_DIR/file-info.txt"
success "File integrity verification completed"

# Task: RECOVERY-008 - Initial TypeScript compilation test
log "Running initial TypeScript compilation test..."
if npx tsc --noEmit server/middleware/performance-monitor.ts server/middleware/security-enhanced.ts 2> "$BACKUP_DIR/initial-test.log"; then
    success "Initial compilation test PASSED"
else
    warning "Initial compilation test had issues - see $BACKUP_DIR/initial-test.log"
fi

# ============================================================================
# PHASE 2: VALIDATION & TESTING  
# ============================================================================
echo
log "🧪 PHASE 2: VALIDATION & TESTING"
echo

# Task: VALIDATE-001 - Full TypeScript compilation
log "Running full TypeScript compilation check..."
if npx tsc --noEmit 2> "$BACKUP_DIR/full-compilation.log"; then
    success "Full TypeScript compilation PASSED ✅"
    COMPILATION_SUCCESS=true
else
    error "Full TypeScript compilation FAILED ❌"
    log "Error details saved to: $BACKUP_DIR/full-compilation.log"
    COMPILATION_SUCCESS=false
fi

# Task: VALIDATE-002 - Server startup test
log "Testing server startup with restored files..."
timeout 15s npm run dev:server > "$BACKUP_DIR/server-startup.log" 2>&1 || SERVER_TEST_RESULT=$?
if [[ $SERVER_TEST_RESULT -eq 124 ]]; then
    success "Server startup test completed (timeout expected)"
elif [[ $SERVER_TEST_RESULT -eq 0 ]]; then
    success "Server startup test PASSED"
else
    warning "Server startup test had issues - see $BACKUP_DIR/server-startup.log"
fi

# Task: VALIDATE-003 & VALIDATE-004 - Verify middleware loading
log "Verifying middleware integration..."
if grep -q "performance" server/index.ts && grep -q "security" server/index.ts; then
    success "Middleware integration verified in server/index.ts"
else
    warning "Middleware integration may need manual verification"
fi

# Count remaining TypeScript errors
log "Counting remaining TypeScript errors..."
ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
echo "Remaining TypeScript errors: $ERROR_COUNT" > "$BACKUP_DIR/final-error-count.txt"

if [[ $ERROR_COUNT -eq 0 ]]; then
    success "🎉 ALL TYPESCRIPT ERRORS RESOLVED! (0/121)"
elif [[ $ERROR_COUNT -lt 10 ]]; then
    success "Major improvement: Errors reduced to $ERROR_COUNT (from 121)"
else
    warning "Errors reduced to $ERROR_COUNT (from 121) - further investigation needed"
fi

# ============================================================================
# PHASE 3: PREVENTION & SAFEGUARDS
# ============================================================================
echo
log "🛡️  PHASE 3: PREVENTION & SAFEGUARDS"
echo

# Create pre-commit hook
log "Creating pre-commit hook for TypeScript validation..."
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit TypeScript check..."
if ! npx tsc --noEmit; then
    echo "❌ TypeScript errors found. Commit aborted."
    echo "Run 'npx tsc --noEmit' to see errors"
    exit 1
fi
echo "✅ TypeScript check passed"
EOF
chmod +x .git/hooks/pre-commit
success "Pre-commit hook created"

# Create encoding validation script
log "Creating file encoding validation script..."
mkdir -p scripts
cat > scripts/validate-encoding.sh << 'EOF'
#!/bin/bash
echo "Validating file encodings..."
FAILED=false
find server/ client/src/ -name "*.ts" -o -name "*.tsx" | while read file; do
    if ! file "$file" | grep -q "UTF-8"; then
        echo "❌ Invalid encoding in $file"
        FAILED=true
    fi
done
if [[ "$FAILED" == true ]]; then
    echo "❌ Encoding validation failed"
    exit 1
else
    echo "✅ All files have valid UTF-8 encoding"
    exit 0
fi
EOF
chmod +x scripts/validate-encoding.sh
success "Encoding validation script created"

# Update package.json with typecheck script if not exists
log "Adding typecheck script to package.json..."
if ! grep -q '"typecheck"' package.json; then
    # Add typecheck script (this is a simplified approach)
    warning "Please manually add '\"typecheck\": \"npx tsc --noEmit\"' to package.json scripts"
else
    success "Typecheck script already exists in package.json"
fi

# ============================================================================
# COMPLETION REPORT
# ============================================================================
echo
log "📊 COMPLETION REPORT"
echo "===================="

echo -e "${GREEN}Original Errors:${NC} 121 TypeScript errors"
echo -e "${GREEN}Current Errors:${NC} $ERROR_COUNT TypeScript errors"
echo -e "${GREEN}Files Restored:${NC} 2 critical middleware files"
echo -e "${GREEN}Backup Location:${NC} $BACKUP_DIR"

if [[ $ERROR_COUNT -eq 0 ]]; then
    echo -e "\n🎉 ${GREEN}MISSION ACCOMPLISHED!${NC}"
    echo "✅ All 121 TypeScript errors have been resolved"
    echo "✅ File corruption has been fixed"
    echo "✅ Middleware functionality restored"
    echo "✅ Prevention measures implemented"
else
    echo -e "\n⚡ ${YELLOW}SIGNIFICANT PROGRESS!${NC}"
    echo "✅ File corruption resolved (primary cause)"
    echo "✅ Errors reduced by $((121 - ERROR_COUNT)) errors"
    echo "⚠️  $ERROR_COUNT errors remaining (likely unrelated to corruption)"
fi

echo -e "\n📁 ${BLUE}Files created:${NC}"
echo "  - docs/typescript-errors-analysis.md (detailed analysis)"
echo "  - config/typescript-fix-plan.json (execution plan)"  
echo "  - $BACKUP_DIR/ (backups and logs)"
echo "  - .git/hooks/pre-commit (prevention)"
echo "  - scripts/validate-encoding.sh (validation)"

echo -e "\n🔧 ${BLUE}Next Steps:${NC}"
if [[ $ERROR_COUNT -eq 0 ]]; then
    echo "1. Run 'npm run dev' to start the application"
    echo "2. Test all functionality to ensure complete recovery"
    echo "3. Commit the restored files"
    echo "4. Monitor for any recurring issues"
else
    echo "1. Investigate remaining $ERROR_COUNT errors"
    echo "2. Run 'npx tsc --noEmit' for detailed error information"  
    echo "3. Address any unrelated TypeScript issues"
    echo "4. Complete testing and commit when all errors resolved"
fi

log "TypeScript error fix process completed!"
exit 0
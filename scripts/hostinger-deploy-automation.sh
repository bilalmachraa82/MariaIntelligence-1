#!/bin/bash

# MariaIntelligence Hostinger Deployment Automation Script
# Automates the complete deployment process to Hostinger VPS

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/config/vps-status.json"
ENV_FILE="$PROJECT_ROOT/.env.production"

# Load configuration from VPS status file
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: VPS configuration file not found at $CONFIG_FILE"
    exit 1
fi

# Default values (can be overridden)
VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/mariaintelligence_deployment}"
APP_NAME="mariaintelligence"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if SSH key exists
    if [ ! -f "$SSH_KEY" ]; then
        error "SSH key not found at $SSH_KEY"
        error "Run: ssh-keygen -t rsa -b 4096 -f $SSH_KEY -C 'mariaintelligence-deployment'"
        exit 1
    fi
    
    # Check if VPS host is configured
    if [ -z "$VPS_HOST" ]; then
        error "VPS_HOST environment variable not set"
        error "Set VPS_HOST=your-vps-ip or add it to your environment"
        exit 1
    fi
    
    # Check if project has required files
    local required_files=("package.json" "server/index.ts" "client/src/App.tsx")
    for file in "${required_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            error "Required file not found: $file"
            exit 1
        fi
    done
    
    # Test SSH connection
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" &>/dev/null; then
        error "SSH connection to VPS failed"
        error "Check your SSH key and VPS configuration"
        exit 1
    fi
    
    log "Prerequisites check passed"
}

# Setup VPS environment
setup_vps() {
    log "Setting up VPS environment..."
    
    # Copy and execute VPS setup script
    scp -i "$SSH_KEY" "$PROJECT_ROOT/scripts/setup-vps-environment.sh" "$VPS_USER@$VPS_HOST:/tmp/"
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "chmod +x /tmp/setup-vps-environment.sh && /tmp/setup-vps-environment.sh"
    
    log "VPS environment setup completed"
}

# Deploy application code
deploy_code() {
    log "Deploying application code..."
    
    # Create temporary deployment directory
    local temp_dir=$(mktemp -d)
    local deploy_archive="$temp_dir/${APP_NAME}-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # Create deployment package
    cd "$PROJECT_ROOT"
    tar -czf "$deploy_archive" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=logs \
        --exclude=uploads \
        --exclude=dist \
        --exclude=.swarm \
        --exclude=tests \
        --exclude=.claude* \
        .
    
    log "Created deployment package: $(basename $deploy_archive)"
    
    # Upload and extract on VPS
    scp -i "$SSH_KEY" "$deploy_archive" "$VPS_USER@$VPS_HOST:/tmp/"
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << EOF
        # Stop existing application
        pm2 stop $APP_NAME || true
        
        # Backup existing application
        if [ -d "/var/www/$APP_NAME" ]; then
            mv "/var/www/$APP_NAME" "/var/backups/$APP_NAME/backup-\$(date +%Y%m%d-%H%M%S)"
        fi
        
        # Create application directory
        mkdir -p /var/www/$APP_NAME
        
        # Extract new application
        cd /var/www/$APP_NAME
        tar -xzf /tmp/$(basename $deploy_archive)
        
        # Set correct ownership
        chown -R www-data:www-data /var/www/$APP_NAME
        
        # Clean up
        rm /tmp/$(basename $deploy_archive)
EOF
    
    # Clean up local temp directory
    rm -rf "$temp_dir"
    
    log "Code deployment completed"
}

# Install dependencies and build
build_application() {
    log "Installing dependencies and building application..."
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << 'EOF'
        cd /var/www/mariaintelligence
        
        # Install dependencies
        npm ci --production
        
        # Build client
        cd client
        npm ci
        npm run build
        
        # Return to root
        cd ..
        
        # Install server dependencies
        cd server
        npm ci --production
        
        # Build server
        npm run build || echo "Server build step skipped - using ts-node"
        
        cd ..
EOF
    
    log "Application build completed"
}

# Configure environment variables
configure_environment() {
    log "Configuring environment variables..."
    
    # Check if local .env.production exists
    if [ -f "$ENV_FILE" ]; then
        # Upload environment file
        scp -i "$SSH_KEY" "$ENV_FILE" "$VPS_USER@$VPS_HOST:/etc/$APP_NAME/.env"
        
        ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << EOF
            # Set correct permissions
            chown root:www-data /etc/$APP_NAME/.env
            chmod 640 /etc/$APP_NAME/.env
            
            # Create symlink in application directory
            ln -sf /etc/$APP_NAME/.env /var/www/$APP_NAME/.env
EOF
    else
        warn ".env.production file not found. Using template."
        ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << EOF
            # Copy template to active environment file
            cp /etc/$APP_NAME/.env.template /etc/$APP_NAME/.env
            
            # Create symlink in application directory
            ln -sf /etc/$APP_NAME/.env /var/www/$APP_NAME/.env
            
            echo "IMPORTANT: Update environment variables in /etc/$APP_NAME/.env"
EOF
    fi
    
    log "Environment configuration completed"
}

# Configure PM2 ecosystem
configure_pm2() {
    log "Configuring PM2 ecosystem..."
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << 'EOF'
        cd /var/www/mariaintelligence
        
        # Create PM2 ecosystem config
        cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'mariaintelligence',
    script: './server/index.ts',
    interpreter: 'node',
    interpreter_args: '-r ts-node/register -r tsconfig-paths/register',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/mariaintelligence/error.log',
    out_file: '/var/log/mariaintelligence/out.log',
    log_file: '/var/log/mariaintelligence/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    kill_timeout: 5000
  }]
};
EOFPM2

        # Install ts-node globally if not present
        npm list -g ts-node || npm install -g ts-node
        npm list -g tsconfig-paths || npm install -g tsconfig-paths
        
        # Set correct permissions
        chown www-data:www-data ecosystem.config.js
EOF
    
    log "PM2 ecosystem configuration completed"
}

# Start application
start_application() {
    log "Starting application..."
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << 'EOF'
        cd /var/www/mariaintelligence
        
        # Start application with PM2
        pm2 start ecosystem.config.js
        
        # Save PM2 configuration
        pm2 save
        
        # Setup PM2 startup
        pm2 startup
        
        # Show application status
        pm2 status
        pm2 logs mariaintelligence --lines 20
EOF
    
    log "Application started successfully"
}

# Configure SSL certificate
setup_ssl() {
    log "Setting up SSL certificate..."
    
    if [ -z "${DOMAIN:-}" ]; then
        warn "DOMAIN not set. Skipping SSL configuration."
        warn "Set DOMAIN environment variable and run SSL setup manually."
        return
    fi
    
    ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" << EOF
        # Install certbot
        apt update
        apt install -y certbot python3-certbot-nginx
        
        # Get SSL certificate
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Setup auto-renewal
        systemctl enable certbot.timer
        systemctl start certbot.timer
EOF
    
    log "SSL certificate configured"
}

# Run health checks
health_check() {
    log "Running deployment health checks..."
    
    local checks_passed=0
    local total_checks=5
    
    # Check if application is running
    if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "pm2 list | grep -q mariaintelligence.*online"; then
        log "✓ Application is running"
        ((checks_passed++))
    else
        error "✗ Application is not running"
    fi
    
    # Check HTTP response
    if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "curl -s http://localhost:3001/api/health | grep -q ok"; then
        log "✓ API health endpoint responding"
        ((checks_passed++))
    else
        warn "✗ API health endpoint not responding"
    fi
    
    # Check static files
    if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "[ -f /var/www/mariaintelligence/client/dist/index.html ]"; then
        log "✓ Client build files present"
        ((checks_passed++))
    else
        error "✗ Client build files missing"
    fi
    
    # Check logs
    if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "[ -f /var/log/mariaintelligence/combined.log ]"; then
        log "✓ Application logs are being written"
        ((checks_passed++))
    else
        warn "✗ Application logs not found"
    fi
    
    # Check firewall
    if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "ufw status | grep -q active"; then
        log "✓ Firewall is active"
        ((checks_passed++))
    else
        warn "✗ Firewall is not active"
    fi
    
    log "Health checks completed: $checks_passed/$total_checks passed"
    
    if [ $checks_passed -eq $total_checks ]; then
        log "🎉 Deployment completed successfully!"
        log "Your application should be accessible at:"
        log "  - HTTP: http://$VPS_HOST"
        if [ -n "${DOMAIN:-}" ]; then
            log "  - HTTPS: https://$DOMAIN"
        fi
    else
        warn "Deployment completed with warnings. Check the failed checks above."
    fi
}

# Main deployment function
deploy() {
    log "Starting MariaIntelligence deployment to Hostinger VPS..."
    
    check_prerequisites
    setup_vps
    deploy_code
    build_application
    configure_environment
    configure_pm2
    start_application
    
    # SSL setup is optional
    if [ -n "${DOMAIN:-}" ]; then
        setup_ssl
    fi
    
    health_check
    
    log "Deployment process completed!"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  deploy       Full deployment process"
    echo "  setup        Setup VPS environment only"
    echo "  code         Deploy code only"
    echo "  build        Build application only"
    echo "  start        Start application only"
    echo "  health       Run health checks only"
    echo "  ssl          Setup SSL certificate only"
    echo ""
    echo "Environment Variables:"
    echo "  VPS_HOST     VPS IP address (required)"
    echo "  VPS_USER     VPS username (default: root)"
    echo "  VPS_PORT     SSH port (default: 22)"
    echo "  SSH_KEY      Path to SSH private key"
    echo "  DOMAIN       Domain name for SSL certificate"
    echo ""
    echo "Examples:"
    echo "  VPS_HOST=1.2.3.4 $0 deploy"
    echo "  DOMAIN=myapp.com VPS_HOST=1.2.3.4 $0 deploy"
    echo "  VPS_HOST=1.2.3.4 $0 health"
}

# Main execution
case "${1:-}" in
    deploy)
        deploy
        ;;
    setup)
        check_prerequisites
        setup_vps
        ;;
    code)
        check_prerequisites
        deploy_code
        ;;
    build)
        check_prerequisites
        build_application
        ;;
    start)
        check_prerequisites
        configure_pm2
        start_application
        ;;
    health)
        check_prerequisites
        health_check
        ;;
    ssl)
        check_prerequisites
        setup_ssl
        ;;
    *)
        usage
        exit 1
        ;;
esac
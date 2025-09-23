#!/bin/bash

# SSL/TLS Automation Script for MariaIntelligence on Hostinger
# Automated Let's Encrypt certificate management with renewal and monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/logs/ssl-automation.log"
CONFIG_FILE="${PROJECT_ROOT}/config/ssl-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$*${NC}"; }

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$CONFIG_FILE")"

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source <(jq -r 'to_entries | .[] | "export " + .key + "=\"" + (.value | tostring) + "\""' "$CONFIG_FILE")
    else
        log_warn "SSL config file not found, using defaults"
        create_default_config
    fi
}

# Create default SSL configuration
create_default_config() {
    cat > "$CONFIG_FILE" << EOF
{
  "domain": "${HOSTINGER_DOMAIN:-mariaintelligence.com}",
  "email": "${SSL_EMAIL:-admin@mariaintelligence.com}",
  "webroot": "${PROJECT_ROOT}/public",
  "cert_path": "/etc/letsencrypt/live",
  "renewal_days": 30,
  "backup_enabled": true,
  "backup_path": "${PROJECT_ROOT}/backups/ssl",
  "monitoring_enabled": true,
  "webhook_url": "${SSL_WEBHOOK_URL:-}",
  "auto_renewal": true,
  "nginx_reload": true,
  "apache_reload": false
}
EOF
    log_info "Created default SSL configuration at $CONFIG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install Certbot if not present
install_certbot() {
    log_info "Checking Certbot installation..."
    
    if ! command -v certbot &> /dev/null; then
        log_info "Installing Certbot..."
        
        # Detect OS and install accordingly
        if [[ -f /etc/debian_version ]]; then
            apt-get update
            apt-get install -y certbot
            if command -v nginx &> /dev/null; then
                apt-get install -y python3-certbot-nginx
            fi
            if command -v apache2 &> /dev/null; then
                apt-get install -y python3-certbot-apache
            fi
        elif [[ -f /etc/redhat-release ]]; then
            yum install -y epel-release
            yum install -y certbot
            if command -v nginx &> /dev/null; then
                yum install -y python3-certbot-nginx
            fi
            if command -v httpd &> /dev/null; then
                yum install -y python3-certbot-apache
            fi
        else
            log_error "Unsupported OS. Please install Certbot manually."
            exit 1
        fi
        
        log_success "Certbot installed successfully"
    else
        log_info "Certbot is already installed"
    fi
}

# Check domain DNS resolution
check_dns() {
    local domain=$1
    log_info "Checking DNS resolution for $domain..."
    
    if ! nslookup "$domain" > /dev/null 2>&1; then
        log_error "DNS resolution failed for $domain"
        log_error "Please ensure your domain points to this server's IP address"
        exit 1
    fi
    
    log_success "DNS resolution successful for $domain"
}

# Create webroot directory if it doesn't exist
setup_webroot() {
    local webroot=$1
    
    if [[ ! -d "$webroot" ]]; then
        log_info "Creating webroot directory: $webroot"
        mkdir -p "$webroot"
        chown -R www-data:www-data "$webroot" 2>/dev/null || chown -R nginx:nginx "$webroot" 2>/dev/null || true
        chmod 755 "$webroot"
    fi
    
    # Test webroot accessibility
    echo "ssl-automation-test" > "$webroot/.ssl-test"
    if [[ -f "$webroot/.ssl-test" ]]; then
        rm "$webroot/.ssl-test"
        log_success "Webroot is accessible"
    else
        log_error "Webroot is not accessible: $webroot"
        exit 1
    fi
}

# Obtain SSL certificate
obtain_certificate() {
    local domain=$1
    local email=$2
    local webroot=$3
    
    log_info "Obtaining SSL certificate for $domain..."
    
    # Check if certificate already exists
    if [[ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
        local cert_expiry=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$domain/fullchain.pem" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$cert_expiry" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [[ $days_until_expiry -gt 30 ]]; then
            log_info "Certificate for $domain is valid for $days_until_expiry more days"
            return 0
        else
            log_warn "Certificate for $domain expires in $days_until_expiry days, renewing..."
        fi
    fi
    
    # Obtain or renew certificate
    local certbot_cmd="certbot certonly --webroot -w $webroot -d $domain --email $email --agree-tos --non-interactive"
    
    if $certbot_cmd; then
        log_success "SSL certificate obtained/renewed successfully for $domain"
        
        # Set proper permissions
        chmod 644 "/etc/letsencrypt/live/$domain/fullchain.pem"
        chmod 600 "/etc/letsencrypt/live/$domain/privkey.pem"
        
        # Create backup
        if [[ "$backup_enabled" == "true" ]]; then
            backup_certificate "$domain"
        fi
        
        # Reload web server
        reload_web_server
        
        # Send notification
        if [[ "$monitoring_enabled" == "true" ]]; then
            send_notification "success" "SSL certificate for $domain obtained/renewed successfully"
        fi
        
        return 0
    else
        log_error "Failed to obtain SSL certificate for $domain"
        
        # Send failure notification
        if [[ "$monitoring_enabled" == "true" ]]; then
            send_notification "error" "Failed to obtain SSL certificate for $domain"
        fi
        
        return 1
    fi
}

# Backup certificate
backup_certificate() {
    local domain=$1
    local backup_dir="$backup_path/$(date +%Y%m%d_%H%M%S)"
    
    log_info "Creating certificate backup for $domain..."
    
    mkdir -p "$backup_dir"
    
    if [[ -d "/etc/letsencrypt/live/$domain" ]]; then
        cp -r "/etc/letsencrypt/live/$domain" "$backup_dir/"
        cp -r "/etc/letsencrypt/archive/$domain" "$backup_dir/" 2>/dev/null || true
        
        # Create tarball
        tar -czf "$backup_path/ssl_backup_${domain}_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$backup_dir" .
        
        # Clean up temp directory
        rm -rf "$backup_dir"
        
        log_success "Certificate backup created successfully"
    else
        log_warn "No certificate found to backup for $domain"
    fi
}

# Reload web server
reload_web_server() {
    log_info "Reloading web server..."
    
    if [[ "$nginx_reload" == "true" ]] && command -v nginx &> /dev/null; then
        if nginx -t &> /dev/null; then
            systemctl reload nginx
            log_success "Nginx reloaded successfully"
        else
            log_error "Nginx configuration test failed"
            return 1
        fi
    fi
    
    if [[ "$apache_reload" == "true" ]] && command -v apache2 &> /dev/null; then
        if apache2ctl configtest &> /dev/null; then
            systemctl reload apache2
            log_success "Apache reloaded successfully"
        else
            log_error "Apache configuration test failed"
            return 1
        fi
    fi
}

# Check certificate status
check_certificate_status() {
    local domain=$1
    
    if [[ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
        local cert_info=$(openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -text -noout)
        local expiry_date=$(echo "$cert_info" | grep "Not After" | cut -d: -f2- | xargs)
        local issuer=$(echo "$cert_info" | grep "Issuer:" | cut -d: -f2- | xargs)
        
        log_info "Certificate Status for $domain:"
        log_info "  Issuer: $issuer"
        log_info "  Expires: $expiry_date"
        
        # Check if certificate is valid
        if openssl x509 -checkend 2592000 -in "/etc/letsencrypt/live/$domain/fullchain.pem" &> /dev/null; then
            log_success "Certificate is valid for more than 30 days"
            return 0
        else
            log_warn "Certificate expires within 30 days"
            return 1
        fi
    else
        log_error "No certificate found for $domain"
        return 1
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "$webhook_url" ]]; then
        local payload=$(jq -n \
            --arg status "$status" \
            --arg message "$message" \
            --arg domain "$domain" \
            --arg timestamp "$(date -Iseconds)" \
            '{
                "status": $status,
                "message": $message,
                "domain": $domain,
                "timestamp": $timestamp,
                "service": "mariaintelligence-ssl"
            }')
        
        if curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$webhook_url" &> /dev/null; then
            log_info "Notification sent successfully"
        else
            log_warn "Failed to send notification"
        fi
    fi
}

# Set up automatic renewal
setup_auto_renewal() {
    log_info "Setting up automatic certificate renewal..."
    
    # Create renewal script
    local renewal_script="/etc/cron.daily/ssl-renewal"
    
    cat > "$renewal_script" << EOF
#!/bin/bash
# Automatic SSL certificate renewal for MariaIntelligence

export PATH="/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin"

# Run certificate renewal
certbot renew --quiet --post-hook "$SCRIPT_DIR/ssl-automation.sh reload"

# Log renewal attempt
echo "\$(date): Automatic renewal check completed" >> "$LOG_FILE"
EOF
    
    chmod +x "$renewal_script"
    
    # Test cron job
    if crontab -l 2>/dev/null | grep -q "ssl-renewal"; then
        log_info "Renewal cron job already exists"
    else
        # Add cron job for twice daily renewal checks
        (crontab -l 2>/dev/null; echo "0 0,12 * * * $renewal_script") | crontab -
        log_success "Automatic renewal cron job added"
    fi
}

# Generate NGINX SSL configuration
generate_nginx_config() {
    local domain=$1
    local config_file="/etc/nginx/sites-available/$domain-ssl"
    
    log_info "Generating NGINX SSL configuration..."
    
    cat > "$config_file" << EOF
server {
    listen 80;
    server_name $domain;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
    
    # Let's Encrypt challenge
    location ^~ /.well-known/acme-challenge/ {
        root $webroot;
        try_files \$uri =404;
    }
}

server {
    listen 443 ssl http2;
    server_name $domain;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Application Configuration
    root $webroot;
    index index.html index.htm;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Static files
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
EOF
    
    # Enable the site
    ln -sf "$config_file" "/etc/nginx/sites-enabled/$domain-ssl"
    
    log_success "NGINX SSL configuration generated and enabled"
}

# Main execution function
main() {
    local command=${1:-"setup"}
    
    case "$command" in
        "setup")
            log_info "Starting SSL automation setup for MariaIntelligence..."
            
            load_config
            check_root
            install_certbot
            check_dns "$domain"
            setup_webroot "$webroot"
            obtain_certificate "$domain" "$email" "$webroot"
            
            if [[ "$auto_renewal" == "true" ]]; then
                setup_auto_renewal
            fi
            
            if command -v nginx &> /dev/null; then
                generate_nginx_config "$domain"
                reload_web_server
            fi
            
            log_success "SSL automation setup completed successfully!"
            ;;
            
        "renew")
            log_info "Renewing SSL certificates..."
            load_config
            obtain_certificate "$domain" "$email" "$webroot"
            ;;
            
        "check")
            log_info "Checking certificate status..."
            load_config
            check_certificate_status "$domain"
            ;;
            
        "reload")
            log_info "Reloading web server..."
            load_config
            reload_web_server
            ;;
            
        "backup")
            log_info "Creating certificate backup..."
            load_config
            backup_certificate "$domain"
            ;;
            
        "status")
            load_config
            echo -e "\n${BLUE}=== SSL Status Report ===${NC}"
            check_certificate_status "$domain"
            
            if [[ -f "$LOG_FILE" ]]; then
                echo -e "\n${BLUE}=== Recent Log Entries ===${NC}"
                tail -n 10 "$LOG_FILE"
            fi
            ;;
            
        "help"|"--help"|"-h")
            echo "SSL Automation Script for MariaIntelligence"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  setup   - Full SSL setup (default)"
            echo "  renew   - Renew certificates"
            echo "  check   - Check certificate status"
            echo "  reload  - Reload web server"
            echo "  backup  - Create certificate backup"
            echo "  status  - Show detailed status report"
            echo "  help    - Show this help message"
            echo ""
            echo "Configuration file: $CONFIG_FILE"
            echo "Log file: $LOG_FILE"
            ;;
            
        *)
            log_error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Trap errors and cleanup
trap 'log_error "Script failed at line $LINENO"' ERR

# Run main function
main "$@"
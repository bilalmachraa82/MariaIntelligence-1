# MariaIntelligence Security Foundation - Hostinger Deployment Guide

## 🚀 Complete Security Implementation for Production

This guide provides step-by-step instructions for deploying the enhanced security foundation on Hostinger VPS with automated SSL, intrusion detection, and threat response systems.

## 📋 Prerequisites

- Hostinger VPS with Ubuntu 20.04+ or CentOS 8+
- Root/sudo access
- Domain name configured to point to your server
- Node.js 18+ installed
- PM2 process manager
- Basic firewall knowledge

## 🔧 1. Initial Server Setup

### 1.1 Update System and Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential security tools
sudo apt install -y ufw fail2ban nginx certbot python3-certbot-nginx
sudo apt install -y htop curl wget git unzip

# Install Node.js 18+ if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

### 1.2 Configure Basic Firewall

```bash
# Reset UFW to defaults
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow essential services
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 5100/tcp  # Application port

# Enable UFW
sudo ufw enable

# Check status
sudo ufw status verbose
```

## 🛡️ 2. Deploy Enhanced Security Middleware

### 2.1 Upload Security Files to Server

```bash
# Create application directory
sudo mkdir -p /opt/mariaintelligence
sudo chown -R $USER:$USER /opt/mariaintelligence
cd /opt/mariaintelligence

# Clone or upload your application
# Replace with your actual repository or upload method
git clone <your-repo-url> .
# OR
# scp -r /local/path/to/app/* user@server:/opt/mariaintelligence/

# Install dependencies
npm ci --production

# Create necessary directories
mkdir -p logs/security config backups/ssl
chmod 755 logs config backups
```

### 2.2 Configure Environment Variables

```bash
# Create production environment file
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=5100
HOST=0.0.0.0

# Security Configuration
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_256_BITS_LONG
JWT_REFRESH_SECRET=YOUR_SUPER_SECURE_REFRESH_SECRET_256_BITS
SSL_EMAIL=admin@yourdomain.com
HOSTINGER_DOMAIN=yourdomain.com

# SSL and Security
SECURITY_ALERTS_ENABLED=true
SECURITY_WEBHOOK_URL=https://your-monitoring-webhook.com/alerts

# Rate Limiting Configuration
ALERT_EVENTS_PER_MINUTE=50
ALERT_CRITICAL_PER_HOUR=10
ALERT_UNIQUE_ATTACKERS=5
ALERT_RISK_SCORE=7.5
ALERT_COOLDOWN_MINUTES=15

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost:5432/mariaintelligence

# Monitoring
THREAT_RESPONSE_LOG_LEVEL=info
SECURITY_LOG_LEVEL=info
EOF

# Set secure permissions
chmod 600 .env.production

# Generate strong secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

## 🔒 3. SSL/TLS Configuration with Let's Encrypt

### 3.1 Configure SSL Automation

```bash
# Make SSL automation script executable
chmod +x ./scripts/ssl-automation.sh

# Configure SSL settings
cat > ./config/ssl-config.json << 'EOF'
{
  "domain": "yourdomain.com",
  "email": "admin@yourdomain.com",
  "webroot": "/opt/mariaintelligence/public",
  "cert_path": "/etc/letsencrypt/live",
  "renewal_days": 30,
  "backup_enabled": true,
  "backup_path": "/opt/mariaintelligence/backups/ssl",
  "monitoring_enabled": true,
  "webhook_url": "",
  "auto_renewal": true,
  "nginx_reload": true,
  "apache_reload": false
}
EOF

# Run SSL setup (requires sudo)
sudo ./scripts/ssl-automation.sh setup
```

### 3.2 Configure Nginx Reverse Proxy

```bash
# Remove default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# The SSL automation script should have created the configuration
# Verify it exists and test configuration
sudo nginx -t

# If successful, restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🛡️ 4. Fail2Ban Integration

### 4.1 Setup Fail2Ban for MariaIntelligence

```bash
# Copy fail2ban configuration
sudo cp ./config/fail2ban-integration.conf /etc/fail2ban/jail.local
sudo cp ./config/fail2ban-filters.conf /etc/fail2ban/filter.d/mariaintelligence.conf

# Create fail2ban filters for each threat type
sudo cat > /etc/fail2ban/filter.d/mariaintelligence-api.conf << 'EOF'
[Definition]
datepattern = "timestamp":\s*"%%Y-%%m-%%dT%%H:%%M:%%S
failregex = ^.*"ip":\s*"<HOST>".*"type":\s*"RATE_LIMIT_EXCEEDED".*$
ignoreregex =
EOF

sudo cat > /etc/fail2ban/filter.d/mariaintelligence-ddos.conf << 'EOF'
[Definition]
datepattern = "timestamp":\s*"%%Y-%%m-%%dT%%H:%%M:%%S
failregex = ^.*"ip":\s*"<HOST>".*"type":\s*"DDoS_DETECTED".*$
ignoreregex =
EOF

sudo cat > /etc/fail2ban/filter.d/mariaintelligence-xss.conf << 'EOF'
[Definition]
datepattern = "timestamp":\s*"%%Y-%%m-%%dT%%H:%%M:%%S
failregex = ^.*"ip":\s*"<HOST>".*"type":\s*"XSS_ATTEMPT".*$
ignoreregex =
EOF

# Restart and enable fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

## 🚀 5. Application Deployment with PM2

### 5.1 Create PM2 Configuration

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mariaintelligence-prod',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5100
    },
    instances: 2, // Adjust based on your VPS specs
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: './logs/app-error.log',
    out_file: './logs/app-out.log',
    log_file: './logs/app-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 3000,
    wait_ready: true,
    listen_timeout: 8000,
    
    // Advanced PM2 features
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above

# Monitor application
pm2 monit
```

## 🔍 6. Security Monitoring Setup

### 6.1 Configure Log Rotation

```bash
# Create logrotate configuration for security logs
sudo cat > /etc/logrotate.d/mariaintelligence << 'EOF'
/opt/mariaintelligence/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 mariaintelligence mariaintelligence
    postrotate
        /usr/bin/pm2 reload mariaintelligence-prod > /dev/null 2>&1 || true
    endscript
}

/opt/mariaintelligence/logs/security/*.json {
    daily
    missingok
    rotate 90
    compress
    delaycompress
    notifempty
    create 644 mariaintelligence mariaintelligence
}
EOF
```

### 6.2 Setup Security Monitoring Cron Jobs

```bash
# Create security monitoring script
cat > /opt/mariaintelligence/scripts/security-monitor.sh << 'EOF'
#!/bin/bash
cd /opt/mariaintelligence

# Generate daily security report
node -e "
const { securityAuditService } = require('./server/services/security-audit-enhanced.service');
securityAuditService.generateSecurityReport('24h')
  .then(report => console.log('Security report generated:', report.generatedAt))
  .catch(err => console.error('Failed to generate report:', err));
"

# Cleanup old threat intelligence data
find ./logs/security -name "*.json" -mtime +90 -delete

# Check disk space
DISK_USAGE=$(df /opt/mariaintelligence | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is $DISK_USAGE%" | logger -t mariaintelligence-security
fi

EOF

chmod +x /opt/mariaintelligence/scripts/security-monitor.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/mariaintelligence/scripts/security-monitor.sh") | crontab -
```

## 📊 7. Monitoring and Alerting

### 7.1 Configure Webhook Monitoring (Optional)

```bash
# Test webhook endpoint (replace with your actual monitoring service)
curl -X POST https://your-monitoring-webhook.com/test \
  -H "Content-Type: application/json" \
  -d '{
    "service": "mariaintelligence-security",
    "message": "Security system deployment test",
    "timestamp": "'$(date -Iseconds)'",
    "status": "success"
  }'
```

### 7.2 Setup System Health Monitoring

```bash
# Create health check script
cat > /opt/mariaintelligence/scripts/health-check.sh << 'EOF'
#!/bin/bash

# Check if application is running
if ! pm2 describe mariaintelligence-prod > /dev/null 2>&1; then
    echo "CRITICAL: Application is not running"
    exit 2
fi

# Check SSL certificate validity
CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem 2>/dev/null | cut -d= -f2)
if [ -n "$CERT_EXPIRY" ]; then
    EXPIRY_TIMESTAMP=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
    
    if [ $DAYS_UNTIL_EXPIRY -lt 7 ]; then
        echo "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
        exit 1
    fi
fi

# Check disk space
DISK_USAGE=$(df /opt/mariaintelligence | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "CRITICAL: Disk usage is $DISK_USAGE%"
    exit 2
fi

# Check fail2ban status
if ! systemctl is-active --quiet fail2ban; then
    echo "WARNING: Fail2ban is not running"
    exit 1
fi

echo "OK: All systems operational"
exit 0
EOF

chmod +x /opt/mariaintelligence/scripts/health-check.sh

# Add health check to cron (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/mariaintelligence/scripts/health-check.sh") | crontab -
```

## 🔄 8. Backup and Recovery

### 8.1 Automated Backup Script

```bash
# Create backup script
cat > /opt/mariaintelligence/scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/mariaintelligence/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mariaintelligence_backup_$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Backup application files (excluding node_modules and logs)
tar -czf "$BACKUP_DIR/$BACKUP_NAME/app.tar.gz" \
    --exclude="node_modules" \
    --exclude="logs" \
    --exclude="backups" \
    /opt/mariaintelligence

# Backup configuration files
cp -r /opt/mariaintelligence/config "$BACKUP_DIR/$BACKUP_NAME/"
cp /opt/mariaintelligence/.env.production "$BACKUP_DIR/$BACKUP_NAME/"

# Backup SSL certificates
if [ -d "/etc/letsencrypt" ]; then
    sudo tar -czf "$BACKUP_DIR/$BACKUP_NAME/ssl_certs.tar.gz" /etc/letsencrypt/
fi

# Backup security logs (last 7 days)
find /opt/mariaintelligence/logs/security -name "*.json" -mtime -7 -exec cp {} "$BACKUP_DIR/$BACKUP_NAME/" \;

# Create backup info file
cat > "$BACKUP_DIR/$BACKUP_NAME/backup_info.txt" << INFO
Backup Date: $(date)
Server: $(hostname)
Application Version: $(cat /opt/mariaintelligence/package.json | grep version | cut -d'"' -f4)
Node Version: $(node --version)
PM2 Status: $(pm2 describe mariaintelligence-prod | grep status)
INFO

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -type d -name "mariaintelligence_backup_*" -mtime +7 -exec rm -rf {} \; 2>/dev/null

echo "Backup completed: $BACKUP_NAME"
EOF

chmod +x /opt/mariaintelligence/scripts/backup.sh

# Schedule daily backups at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/mariaintelligence/scripts/backup.sh") | crontab -
```

## ⚡ 9. Performance Optimization

### 9.1 Optimize Node.js Application

```bash
# Create performance tuning script
cat > /opt/mariaintelligence/scripts/optimize.sh << 'EOF'
#!/bin/bash

# Set system limits for the application user
sudo tee -a /etc/security/limits.conf << LIMITS
mariaintelligence soft nofile 65536
mariaintelligence hard nofile 65536
mariaintelligence soft nproc 32768
mariaintelligence hard nproc 32768
LIMITS

# Optimize kernel parameters
sudo tee -a /etc/sysctl.conf << SYSCTL
# MariaIntelligence optimizations
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 30000
net.core.somaxconn = 65535
SYSCTL

# Apply kernel parameters
sudo sysctl -p

echo "System optimization applied"
EOF

chmod +x /opt/mariaintelligence/scripts/optimize.sh
./scripts/optimize.sh
```

## 🧪 10. Testing and Validation

### 10.1 Security Test Script

```bash
# Create comprehensive security test
cat > /opt/mariaintelligence/scripts/security-test.sh << 'EOF'
#!/bin/bash

echo "=== MariaIntelligence Security Test ==="
echo "Testing security components..."

# Test 1: Application accessibility
echo "1. Testing application accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5100/api/health)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Application is responding"
else
    echo "❌ Application health check failed (HTTP $HTTP_STATUS)"
fi

# Test 2: HTTPS redirect
echo "2. Testing HTTPS redirect..."
HTTPS_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" http://yourdomain.com)
if [ "$HTTPS_REDIRECT" = "301" ] || [ "$HTTPS_REDIRECT" = "302" ]; then
    echo "✅ HTTPS redirect is working"
else
    echo "❌ HTTPS redirect failed"
fi

# Test 3: SSL certificate
echo "3. Testing SSL certificate..."
if openssl s_client -connect yourdomain.com:443 </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "✅ SSL certificate is valid"
else
    echo "❌ SSL certificate validation failed"
fi

# Test 4: Fail2ban status
echo "4. Testing Fail2ban status..."
if sudo fail2ban-client status mariaintelligence-api > /dev/null 2>&1; then
    echo "✅ Fail2ban is active"
else
    echo "❌ Fail2ban is not configured or running"
fi

# Test 5: Security headers
echo "5. Testing security headers..."
HEADERS=$(curl -s -I https://yourdomain.com | grep -E "(X-Content-Type-Options|X-Frame-Options|Strict-Transport-Security)")
if [ -n "$HEADERS" ]; then
    echo "✅ Security headers are present"
else
    echo "❌ Security headers are missing"
fi

# Test 6: Rate limiting
echo "6. Testing rate limiting (this may take a moment)..."
RATE_LIMIT_TEST=$(for i in {1..20}; do curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/api/health; done | grep -c "429")
if [ "$RATE_LIMIT_TEST" -gt 0 ]; then
    echo "✅ Rate limiting is working"
else
    echo "⚠️  Rate limiting test inconclusive"
fi

echo "=== Security Test Complete ==="
EOF

chmod +x /opt/mariaintelligence/scripts/security-test.sh

# Run security test
./scripts/security-test.sh
```

## 🎯 11. Final Checklist

### ✅ Deployment Checklist

- [ ] Server updated and secured
- [ ] Firewall configured (UFW)
- [ ] Application deployed with PM2
- [ ] SSL certificates installed and auto-renewal configured
- [ ] Nginx reverse proxy configured
- [ ] Fail2ban configured with custom rules
- [ ] Security monitoring enabled
- [ ] Log rotation configured
- [ ] Backup system implemented
- [ ] Health monitoring setup
- [ ] Performance optimization applied
- [ ] Security tests passed

### 🔧 Post-Deployment Tasks

1. **Monitor Logs**: Check application and security logs regularly
   ```bash
   # View application logs
   pm2 logs mariaintelligence-prod
   
   # View security logs
   tail -f /opt/mariaintelligence/logs/security/security-audit-$(date +%Y-%m-%d).json
   
   # View fail2ban logs
   sudo tail -f /var/log/fail2ban.log
   ```

2. **Test Security Features**:
   - Attempt XSS injection to verify blocking
   - Test rate limiting by making rapid requests
   - Verify SSL certificate auto-renewal
   - Check fail2ban IP blocking

3. **Setup Monitoring Alerts**:
   - Configure webhook endpoints for critical alerts
   - Setup email notifications for security events
   - Monitor disk space and system resources

4. **Regular Maintenance**:
   - Update dependencies monthly
   - Review security logs weekly
   - Test backup restoration quarterly
   - Update threat intelligence feeds

## 📞 Troubleshooting

### Common Issues and Solutions

#### Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs mariaintelligence-prod --lines 50

# Restart application
pm2 restart mariaintelligence-prod
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo /opt/mariaintelligence/scripts/ssl-automation.sh status

# Manually renew certificate
sudo /opt/mariaintelligence/scripts/ssl-automation.sh renew

# Check Nginx configuration
sudo nginx -t
```

#### Fail2ban Not Working
```bash
# Check fail2ban status
sudo fail2ban-client status

# Check jail status
sudo fail2ban-client status mariaintelligence-api

# Restart fail2ban
sudo systemctl restart fail2ban
```

## 📚 Additional Resources

- [MariaIntelligence Security Documentation](../SECURITY_IMPLEMENTATION.md)
- [Hostinger VPS Management Guide](https://www.hostinger.com/tutorials/vps)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Fail2ban Configuration Guide](https://github.com/fail2ban/fail2ban/wiki)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

---

🔒 **Security is an ongoing process. Regularly review and update your security measures to protect against evolving threats.**
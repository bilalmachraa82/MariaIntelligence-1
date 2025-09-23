# VPS SSH Configuration Setup

## Overview
This document outlines the SSH configuration setup for MariaIntelligence deployment on Hostinger VPS with Ubuntu 24.04.

## SSH Key Generation and Configuration

### 1. Generate SSH Key Pair
```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/mariaintelligence_deployment -C "mariaintelligence-deployment"
```

### 2. Copy Public Key to VPS
```bash
# Method 1: Using ssh-copy-id
ssh-copy-id -i ~/.ssh/mariaintelligence_deployment.pub root@YOUR_VPS_IP

# Method 2: Manual copy
cat ~/.ssh/mariaintelligence_deployment.pub | ssh root@YOUR_VPS_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. Configure SSH Client (Local Machine)
Create or edit `~/.ssh/config`:
```
Host mariaintelligence-vps
    HostName YOUR_VPS_IP
    User root
    IdentityFile ~/.ssh/mariaintelligence_deployment
    Port 22
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### 4. Secure SSH Configuration (VPS Server)
Edit `/etc/ssh/sshd_config`:
```bash
# Disable root password authentication
PermitRootLogin yes
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Security settings
Protocol 2
PermitEmptyPasswords no
MaxAuthTries 3
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable unused authentication methods
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no
UsePAM yes

# Allow specific users only (optional)
AllowUsers root deploy

# Restrict SSH to specific IPs (optional)
# AllowUsers root@YOUR_IP
```

Restart SSH service:
```bash
systemctl restart sshd
```

## Deployment Automation Setup

### 1. GitHub Actions SSH Key Configuration
Add the private key to GitHub Secrets:
- Go to Repository Settings > Secrets and Variables > Actions
- Add new secret: `SSH_PRIVATE_KEY`
- Paste the content of `~/.ssh/mariaintelligence_deployment`

### 2. Additional Secrets for Deployment
```
VPS_HOST: YOUR_VPS_IP
VPS_USER: root
VPS_PATH: /var/www/mariaintelligence
```

### 3. Test SSH Connection
```bash
# From local machine
ssh mariaintelligence-vps "echo 'SSH connection successful'"

# Or with explicit key
ssh -i ~/.ssh/mariaintelligence_deployment root@YOUR_VPS_IP "whoami"
```

## Security Best Practices

### 1. SSH Hardening Checklist
- [x] Disable password authentication
- [x] Use SSH key authentication only
- [x] Configure fail2ban for SSH protection
- [x] Set up firewall rules (UFW)
- [x] Enable automatic security updates
- [x] Configure proper file permissions
- [x] Set up SSH connection timeouts

### 2. Monitoring SSH Access
```bash
# View SSH login attempts
journalctl -u sshd -f

# Check fail2ban status
fail2ban-client status sshd

# View active SSH connections
netstat -tnpa | grep :22
```

### 3. SSH Key Management
```bash
# List loaded SSH keys
ssh-add -l

# Add key to SSH agent
ssh-add ~/.ssh/mariaintelligence_deployment

# Remove all keys from agent
ssh-add -D
```

## Deployment Workflow Integration

### 1. Automated Deployment Script
The deployment process will use SSH for:
- Code repository cloning
- File synchronization
- Service management
- Configuration updates
- Log monitoring

### 2. SSH Commands for Deployment
```bash
# Clone/update repository
ssh mariaintelligence-vps "cd /var/www && git clone https://github.com/user/mariaintelligence.git || cd mariaintelligence && git pull"

# Install dependencies
ssh mariaintelligence-vps "cd /var/www/mariaintelligence && npm install --production"

# Build application
ssh mariaintelligence-vps "cd /var/www/mariaintelligence && npm run build"

# Restart services
ssh mariaintelligence-vps "pm2 restart mariaintelligence || pm2 start ecosystem.config.js"

# Check service status
ssh mariaintelligence-vps "pm2 status"
```

## Troubleshooting

### Common SSH Issues

#### Permission Denied (publickey)
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/mariaintelligence_deployment
chmod 700 ~/.ssh

# Verify public key on server
ssh mariaintelligence-vps "cat ~/.ssh/authorized_keys"
```

#### Connection Timeout
```bash
# Test connectivity
ping YOUR_VPS_IP

# Check if SSH port is open
nmap -p 22 YOUR_VPS_IP

# Verify firewall rules
ssh mariaintelligence-vps "ufw status"
```

#### Key Authentication Failed
```bash
# Debug SSH connection
ssh -v mariaintelligence-vps

# Check SSH agent
ssh-add -l

# Reload SSH agent
eval $(ssh-agent)
ssh-add ~/.ssh/mariaintelligence_deployment
```

## Backup and Recovery

### 1. SSH Key Backup
```bash
# Backup SSH keys
cp ~/.ssh/mariaintelligence_deployment* ~/backups/ssh/
```

### 2. Authorized Keys Backup (Server)
```bash
# Backup authorized_keys
cp ~/.ssh/authorized_keys ~/backups/ssh_authorized_keys_backup
```

### 3. Recovery Process
1. Restore SSH private key on local machine
2. Ensure correct permissions (600 for private key, 644 for public key)
3. Add key to SSH agent
4. Test connection
5. If server access is lost, use VPS console from Hostinger panel

## Next Steps

1. Complete VPS foundation setup using the setup script
2. Configure domain and SSL certificates
3. Set up automated deployment pipeline
4. Test full deployment workflow
5. Implement monitoring and alerting

## Security Contacts

- SSH configuration issues: Check VPS provider documentation
- Security vulnerabilities: Follow responsible disclosure
- Emergency access: Use VPS provider console access
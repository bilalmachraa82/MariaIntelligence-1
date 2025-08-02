# Security Implementation - Maria Faz Project

## Overview

This document describes the comprehensive security middleware implementation for the Maria Faz property management system. The security system provides multiple layers of protection against common web vulnerabilities and attacks.

## Security Components

### 1. Security Middleware (`server/middleware/security.ts`)

The main security middleware provides:

#### Helmet Configuration
- **Content Security Policy (CSP)** for XSS protection
- **HSTS** (HTTP Strict Transport Security) for HTTPS enforcement
- **X-Frame-Options** to prevent clickjacking
- **X-Content-Type-Options** to prevent MIME type sniffing
- **Referrer Policy** for privacy protection

#### Rate Limiting
- **API General**: 100 requests per 15 minutes
- **PDF Import**: 10 requests per hour
- **Sensitive Operations**: 20 requests per hour (AI services, OCR)

#### CORS Configuration
- Allowlist of specific origins
- Secure credentials handling
- Comprehensive headers validation

#### Request Validation
- Suspicious header detection
- Malicious User-Agent blocking
- IP-based blocking after repeated violations

#### Content Validation
- **XSS Protection**: Detects and blocks script injection attempts
- **SQL Injection Protection**: Prevents database manipulation attempts
- **Input Sanitization**: Validates all incoming data

#### File Upload Security
- MIME type validation (PDF, JPEG, PNG, WebP, HEIC, HEIF only)
- File size limits (20MB for PDFs, 10MB for images)
- Filename sanitization

### 2. Security Audit Service (`server/services/security-audit.service.ts`)

Comprehensive security monitoring and analysis:

#### Event Recording
- Real-time security event logging
- Persistent audit trail (7-day retention)
- JSON log file generation

#### Threat Pattern Detection
- SQL injection patterns
- XSS script detection
- Path traversal attempts
- Command injection detection
- Suspicious user agents
- Rate limit abuse patterns

#### Security Metrics
- Event statistics by type and severity
- Top attacking IPs identification
- Most targeted endpoints analysis
- Security score calculation (0-100)

#### Alert Generation
- Threshold-based alerting
- Pattern-match alerting
- Critical event notifications
- Automated response recommendations

### 3. Security Monitoring API (`server/api/security-monitoring.ts`)

RESTful endpoints for security monitoring:

#### Available Endpoints

```
GET /api/security/metrics          - Security dashboard metrics
GET /api/security/events           - Recent security events
GET /api/security/report           - Comprehensive security report
GET /api/security/patterns         - Threat pattern information
GET /api/security/status           - Security status summary
GET /api/security/ip-analysis      - IP-specific activity analysis
POST /api/security/test-event      - Test event creation (dev only)
```

## Security Features

### 1. Multi-layered Rate Limiting

```javascript
// Different limits for different operations
app.use('/api/', apiRateLimiter);              // 100 req/15min
app.use('/api/upload', pdfImportRateLimiter);  // 10 req/hour
app.use('/api/ocr', pdfImportRateLimiter);     // 10 req/hour
app.use('/api/ai', strictRateLimiter);         // 20 req/hour
app.use('/api/gemini', strictRateLimiter);     // 20 req/hour
app.use('/api/assistant', strictRateLimiter);  // 20 req/hour
```

### 2. Content Security Policy

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com"],
    // ... more directives
  }
}
```

### 3. IP Tracking and Blocking

- Automatic IP blocking after 20 failed requests within 1 hour
- Persistent tracking of suspicious activity
- Automatic cleanup of tracking data

### 4. Security Event Types

```javascript
export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  CORS_VIOLATION = 'CORS_VIOLATION',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  FILE_UPLOAD_REJECTED = 'FILE_UPLOAD_REJECTED',
  IP_BLOCKED = 'IP_BLOCKED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}
```

## Configuration

### Environment Variables

```bash
NODE_ENV=production                    # Enable production security features
MAX_UPLOAD_MB=20                      # Maximum file upload size
SECRET_KEY=your-secret-key            # Security token generation
```

### CORS Origins

Update `allowedOrigins` in `security.ts`:

```javascript
const allowedOrigins = [
  'https://mariafaz.vercel.app',           // Production
  'https://your-custom-domain.com',       // Custom domain
  'http://localhost:5173',                // Development
];
```

## Usage Examples

### 1. Basic Security Monitoring

```javascript
// Get security status
const response = await fetch('/api/security/status');
const status = await response.json();

console.log(`Security Score: ${status.data.securityScore}/100`);
console.log(`Threat Level: ${status.data.threatLevel}`);
```

### 2. Generate Security Report

```javascript
// Get 24-hour security report
const response = await fetch('/api/security/report?timeWindow=24h');
const report = await response.json();

console.log(`Total Events: ${report.data.totalEvents}`);
console.log(`Top Attacking IPs:`, report.data.topAttackingIPs);
```

### 3. Analyze Specific IP

```javascript
// Analyze suspicious IP activity
const response = await fetch('/api/security/ip-analysis?ip=192.168.1.100');
const analysis = await response.json();

console.log(`Risk Score: ${analysis.data.riskScore}/100`);
console.log(`Recommendations:`, analysis.data.recommendations);
```

## Testing

Run the security test suite:

```bash
# Test all security features
node test-security-middleware.js

# Test against different environment
TEST_URL=https://your-domain.com node test-security-middleware.js
```

### Test Coverage

The test suite covers:
- Rate limiting enforcement
- XSS protection
- SQL injection protection
- CORS policy enforcement
- File upload security
- Suspicious header detection
- Security monitoring endpoints

## Deployment Considerations

### Production Setup

1. **Enable HTTPS**: Security headers require HTTPS in production
2. **Configure Origins**: Update CORS allowlist for your domains
3. **Monitor Logs**: Set up log aggregation for security events
4. **Alert Integration**: Configure webhook/email alerts for critical events

### Performance Impact

- **Minimal overhead**: ~2-5ms per request
- **Memory usage**: ~10MB for audit service
- **Disk usage**: ~1MB per day for audit logs

### Monitoring Dashboard

The security system provides real-time metrics:

- Current security score (0-100)
- Threat level indicator
- Active security events
- Blocked IPs count
- Recent attack patterns

## Security Best Practices

### 1. Regular Updates

- Update dependency packages monthly
- Review security patterns quarterly
- Audit access logs weekly

### 2. Incident Response

1. **Detection**: Automated alerts for critical events
2. **Analysis**: Use IP analysis endpoint for investigation
3. **Response**: Temporary IP blocking, pattern updates
4. **Recovery**: Monitor metrics for effectiveness

### 3. Compliance

The implementation helps meet:
- **GDPR**: Data protection and privacy controls
- **OWASP Top 10**: Protection against common vulnerabilities
- **ISO 27001**: Security management best practices

## Troubleshooting

### Common Issues

1. **Rate Limit Too Restrictive**
   ```javascript
   // Adjust limits in security.ts
   max: 200, // Increase from 100
   ```

2. **CORS Errors**
   ```javascript
   // Add your domain to allowedOrigins
   allowedOrigins.push('https://your-domain.com');
   ```

3. **False Positive XSS Detection**
   ```javascript
   // Update XSS patterns to be more specific
   const xssPatterns = [
     /<script[^>]*>.*?<\/script>/gi, // More specific pattern
   ];
   ```

### Debug Mode

Enable detailed security logging:

```bash
NODE_ENV=development npm run dev
```

This will show all security events in the console with detailed information.

## Security Metrics

The system tracks comprehensive security metrics:

### Event Metrics
- Total security events (24h window)
- Events by type (rate limit, XSS, SQL injection, etc.)
- Events by severity (low, medium, high, critical)

### Attack Patterns
- Top attacking IP addresses
- Most targeted endpoints
- Threat pattern matches
- Geographic distribution (if IP geolocation enabled)

### Performance Metrics
- Response time impact
- False positive rate
- Alert accuracy
- System availability

## Future Enhancements

### Planned Features

1. **Geographic IP Blocking**: Block requests from specific countries
2. **Behavioral Analysis**: ML-based anomaly detection
3. **API Key Management**: Secure API key rotation
4. **Integration APIs**: Webhook notifications for external systems
5. **Advanced Reporting**: Weekly/monthly security reports
6. **Compliance Dashboard**: GDPR/SOC2 compliance tracking

### Integration Opportunities

- **Datadog/New Relic**: Metrics and alerting
- **Slack/Teams**: Real-time security notifications
- **CloudFlare**: Additional DDoS protection
- **Auth0**: Enhanced authentication security
- **Sentry**: Error tracking and performance monitoring

---

This security implementation provides enterprise-grade protection while maintaining excellent performance and usability. Regular monitoring and updates ensure continued effectiveness against evolving threats.
# Health Check Endpoint Documentation

Complete guide to the MariaIntelligence health check system for monitoring and diagnostics.

---

## Overview

MariaIntelligence provides a built-in health check endpoint for monitoring application status, uptime, and availability across all deployment platforms.

---

## Health Check Endpoint

### Endpoint Details

- **URL**: `/api/health`
- **Method**: `GET`
- **Authentication**: None (public endpoint)
- **Content-Type**: `application/json`

### Response Format

#### Successful Response (200 OK)

```json
{
  "status": "ok",
  "time": "2025-01-15T10:30:45.123Z"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Health status indicator (always "ok" when healthy) |
| `time` | string | ISO 8601 timestamp of the health check |

---

## Testing Health Checks

### Local Development

```bash
# Test with curl
curl http://localhost:5000/api/health

# Test with wget
wget -qO- http://localhost:5000/api/health

# Test with HTTPie
http GET http://localhost:5000/api/health

# Test with Node.js
node -e "require('http').get('http://localhost:5000/api/health', (res) => { res.on('data', d => console.log(d.toString())); })"
```

### Production

```bash
# Render
curl https://your-app.onrender.com/api/health

# Vercel
curl https://your-app.vercel.app/api/health

# Custom Domain
curl https://your-domain.com/api/health
```

### Expected Response

```bash
# Successful health check returns:
{"status":"ok","time":"2025-01-15T10:30:45.123Z"}

# HTTP Status Code: 200
```

---

## Platform-Specific Configuration

### Render

**Configuration** (render.yaml):
```yaml
healthCheckPath: /api/health

healthCheck:
  path: /api/health
  initialDelaySeconds: 30
```

**Manual Configuration**:
- Navigate to service in Render Dashboard
- Go to "Settings" → "Health & Alerts"
- Set **Health Check Path**: `/api/health`
- Set **Initial Delay**: `30` seconds

**Behavior**:
- Render pings health endpoint every 30 seconds
- If 3 consecutive checks fail, Render marks service as unhealthy
- Automatic restart on unhealthy status
- Alerts can be configured in dashboard

### Vercel

Health checks are handled automatically by Vercel's platform:
- Function execution monitoring
- Automatic failure detection
- No explicit configuration needed

**Testing Serverless Health**:
```bash
curl https://your-app.vercel.app/api/health
```

### Docker

**Dockerfile Health Check**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"
```

**Configuration Parameters**:
- **Interval**: 30 seconds between checks
- **Timeout**: 10 seconds max wait time
- **Start Period**: 40 seconds grace period on startup
- **Retries**: 3 consecutive failures mark unhealthy

**Checking Docker Health**:
```bash
# View health status
docker ps

# Inspect detailed health
docker inspect --format='{{json .State.Health}}' maria-intelligence | jq

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' maria-intelligence
```

### Docker Compose

**Configuration** (docker-compose.yml):
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Checking Health**:
```bash
# View service health
docker-compose ps

# View health status with details
docker-compose ps -a
```

### Kubernetes

**Liveness Probe** (example deployment.yaml):
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 20
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Load Balancers (Nginx, HAProxy)

**Nginx Health Check** (nginx.conf):
```nginx
upstream maria_backend {
    server localhost:5000 max_fails=3 fail_timeout=30s;

    # Health check module (nginx-plus or third-party)
    check interval=3000 rise=2 fall=3 timeout=1000 type=http;
    check_http_send "GET /api/health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx;
}
```

**HAProxy Health Check** (haproxy.cfg):
```cfg
backend maria_backend
    option httpchk GET /api/health
    http-check expect status 200
    server maria1 localhost:5000 check inter 10s fall 3 rise 2
```

---

## Monitoring Integration

### Uptime Monitoring Services

#### UptimeRobot

1. Add new monitor
2. **Monitor Type**: HTTP(s)
3. **URL**: `https://your-app-url/api/health`
4. **Interval**: 5 minutes
5. **Expected Status Code**: 200

#### Pingdom

1. Create new Uptime Check
2. **Check Type**: HTTP
3. **URL**: `https://your-app-url/api/health`
4. **Check Interval**: 1 minute
5. **String to expect**: `"status":"ok"`

#### StatusCake

1. Add new Uptime Test
2. **Test Type**: HTTP
3. **Website URL**: `https://your-app-url/api/health`
4. **Check Rate**: 1 minute
5. **Confirmation**: 2 checks

### Custom Monitoring Scripts

#### Bash Script (cron job)

```bash
#!/bin/bash
# health-check.sh - Run via cron every 5 minutes

URL="https://your-app-url/api/health"
EXPECTED_STATUS="ok"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$RESPONSE" -ne 200 ]; then
    echo "Health check failed! HTTP Status: $RESPONSE"
    # Send alert (email, Slack, etc.)
    # Example: curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"MariaIntelligence health check failed!"}' \
    #   YOUR_SLACK_WEBHOOK_URL
    exit 1
fi

echo "Health check passed"
```

**Cron setup**:
```bash
# Run every 5 minutes
*/5 * * * * /path/to/health-check.sh >> /var/log/maria-health.log 2>&1
```

#### Node.js Monitoring Script

```javascript
// monitor.js
import http from 'http';

const HEALTH_URL = 'http://localhost:5000/api/health';
const CHECK_INTERVAL = 60000; // 1 minute

function checkHealth() {
  http.get(HEALTH_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        const health = JSON.parse(data);
        console.log(`✅ Health check passed at ${health.time}`);
      } else {
        console.error(`❌ Health check failed: Status ${res.statusCode}`);
        // Send alert
      }
    });
  }).on('error', (err) => {
    console.error(`❌ Health check error: ${err.message}`);
    // Send alert
  });
}

// Run check immediately and then at intervals
checkHealth();
setInterval(checkHealth, CHECK_INTERVAL);
```

**Run with PM2**:
```bash
pm2 start monitor.js --name maria-monitor
```

#### Python Monitoring Script

```python
# monitor.py
import requests
import time
import logging

HEALTH_URL = 'http://localhost:5000/api/health'
CHECK_INTERVAL = 60  # seconds

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_health():
    try:
        response = requests.get(HEALTH_URL, timeout=5)

        if response.status_code == 200:
            data = response.json()
            logger.info(f"✅ Health check passed at {data['time']}")
        else:
            logger.error(f"❌ Health check failed: Status {response.status_code}")
            # Send alert

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Health check error: {e}")
        # Send alert

if __name__ == '__main__':
    while True:
        check_health()
        time.sleep(CHECK_INTERVAL)
```

---

## Troubleshooting

### Health Check Fails with 404

**Cause**: Server not running or endpoint not registered

**Solutions**:
1. Verify server is running: `curl http://localhost:5000`
2. Check server logs for startup errors
3. Verify endpoint is registered in `server/index.ts`
4. Test locally before production deployment

### Health Check Fails with 500

**Cause**: Server running but internal error

**Solutions**:
1. Check application logs
2. Verify database connection
3. Check environment variables are set
4. Review error stack trace in logs

### Health Check Timeout

**Cause**: Server not responding in time

**Solutions**:
1. Check server resource usage (CPU, memory)
2. Verify network connectivity
3. Increase timeout in health check configuration
4. Check for deadlocks or blocking operations

### Intermittent Health Check Failures

**Cause**: Server under heavy load or cold starts

**Solutions**:
1. Increase health check interval
2. Increase retries/failure threshold
3. Optimize server performance
4. Add caching layer
5. Scale up server resources

### Health Check Works Locally but Not in Production

**Cause**: Environment differences or firewall rules

**Solutions**:
1. Verify PORT environment variable matches
2. Check server binds to `0.0.0.0`, not `127.0.0.1`
3. Verify firewall/security group allows traffic
4. Check load balancer configuration
5. Verify SSL/TLS configuration

---

## Best Practices

### Interval Configuration

- **Development**: 10-30 seconds (fast feedback)
- **Staging**: 30-60 seconds (balance between detection and load)
- **Production**: 30-60 seconds (reliable monitoring)
- **Critical Systems**: 10-15 seconds (rapid detection)

### Timeout Settings

- **Local/LAN**: 3-5 seconds
- **Internet**: 5-10 seconds
- **Slow Networks**: 10-15 seconds

### Failure Thresholds

- **Aggressive**: 2 failures (rapid response, more false positives)
- **Balanced**: 3 failures (recommended)
- **Conservative**: 5 failures (fewer false positives, slower detection)

### Initial Delay

- **Fast Startup**: 10-20 seconds
- **Normal Startup**: 30-40 seconds
- **Slow Startup**: 60-90 seconds (database migrations, etc.)

---

## Advanced Health Checks

### Extended Health Check (Future Enhancement)

For comprehensive health monitoring, you can extend the health check endpoint to include:

```typescript
// Example extended health check (not implemented)
{
  "status": "ok",
  "time": "2025-01-15T10:30:45.123Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "gemini_api": "healthy"
  },
  "metrics": {
    "uptime": 86400,
    "memory_used_mb": 245,
    "cpu_usage_percent": 15
  }
}
```

---

## Summary

| Platform | Endpoint | Configuration | Recommended Interval |
|----------|----------|---------------|---------------------|
| Render | `/api/health` | render.yaml | 30 seconds |
| Vercel | `/api/health` | Automatic | N/A |
| Docker | `/api/health` | Dockerfile | 30 seconds |
| K8s | `/api/health` | deployment.yaml | 10 seconds |
| Manual | `/api/health` | nginx/haproxy | 10-30 seconds |

**Key Points**:
- Always use `/api/health` endpoint
- Set initial delay to 30-40 seconds for safe startup
- Configure 3 retries for production environments
- Monitor health check logs for patterns
- Integrate with alerting systems for production

---

**Last Updated**: 2025-01-15
**MariaIntelligence Version**: 1.0.0

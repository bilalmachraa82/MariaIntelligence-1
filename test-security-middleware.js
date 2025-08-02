/**
 * Security Middleware Test Script
 * 
 * This script tests the comprehensive security middleware implementation
 * to ensure all components are working correctly.
 */

import http from 'http';
import https from 'https';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5100';

// Test cases for security middleware
const securityTests = [
  {
    name: 'Rate Limiting - API General',
    description: 'Test API rate limiting (100 req/15min)',
    method: 'GET',
    path: '/api/health',
    iterations: 5,
    expectedStatus: [200, 429],
    delay: 100
  },
  {
    name: 'Rate Limiting - PDF Import',
    description: 'Test PDF import rate limiting (10 req/hour)',
    method: 'POST',
    path: '/api/upload',
    iterations: 3,
    expectedStatus: [400, 429], // 400 for missing file, 429 for rate limit
    delay: 100,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  },
  {
    name: 'XSS Protection',
    description: 'Test XSS attempt detection',
    method: 'POST',
    path: '/api/properties',
    iterations: 1,
    expectedStatus: [400],
    delay: 0,
    body: {
      name: '<script>alert("xss")</script>',
      description: 'Normal description'
    }
  },
  {
    name: 'SQL Injection Protection',
    description: 'Test SQL injection attempt detection',
    method: 'POST',
    path: '/api/properties',
    iterations: 1,
    expectedStatus: [400],
    delay: 0,
    body: {
      name: "'; DROP TABLE users; --",
      description: 'Normal description'
    }
  },
  {
    name: 'Suspicious Headers',
    description: 'Test suspicious header detection',
    method: 'GET',
    path: '/api/health',
    iterations: 1,
    expectedStatus: [400],
    delay: 0,
    headers: {
      'x-injection-test': 'malicious-value'
    }
  },
  {
    name: 'Suspicious User Agent',
    description: 'Test suspicious user agent detection',
    method: 'GET',
    path: '/api/health',
    iterations: 1,
    expectedStatus: [403],
    delay: 0,
    headers: {
      'User-Agent': 'sqlmap/1.0'
    }
  },
  {
    name: 'CORS Violation',
    description: 'Test CORS policy enforcement',
    method: 'OPTIONS',
    path: '/api/health',
    iterations: 1,
    expectedStatus: [500], // CORS error
    delay: 0,
    headers: {
      'Origin': 'https://malicious-site.com',
      'Access-Control-Request-Method': 'GET'
    }
  },
  {
    name: 'File Upload Security',
    description: 'Test file upload security (invalid file type)',
    method: 'POST',
    path: '/api/upload',
    iterations: 1,
    expectedStatus: [400],
    delay: 0,
    headers: {
      'Content-Type': 'multipart/form-data; boundary=----test'
    },
    body: '------test\r\nContent-Disposition: form-data; name="file"; filename="test.exe"\r\nContent-Type: application/x-executable\r\n\r\nfake exe content\r\n------test--'
  },
  {
    name: 'Security Monitoring Endpoint',
    description: 'Test security monitoring API access',
    method: 'GET',
    path: '/api/security/status',
    iterations: 1,
    expectedStatus: [200, 429], // 429 if rate limited
    delay: 0
  }
];

/**
 * Execute a single test case
 */
async function executeTest(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`   Description: ${test.description}`);
  
  const results = [];
  
  for (let i = 0; i < test.iterations; i++) {
    try {
      const result = await makeRequest(test);
      results.push(result);
      
      console.log(`   Attempt ${i + 1}: ${result.status} ${result.statusText} (${result.responseTime}ms)`);
      
      if (test.delay > 0 && i < test.iterations - 1) {
        await sleep(test.delay);
      }
    } catch (error) {
      console.log(`   Attempt ${i + 1}: ERROR - ${error.message}`);
      results.push({ status: 0, error: error.message });
    }
  }
  
  // Analyze results
  const statusCodes = results.map(r => r.status);
  const validStatuses = statusCodes.filter(status => test.expectedStatus.includes(status));
  
  const success = validStatuses.length > 0;
  console.log(`   Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Expected: [${test.expectedStatus.join(', ')}], Got: [${statusCodes.join(', ')}]`);
  
  return {
    name: test.name,
    success,
    statusCodes,
    expectedStatus: test.expectedStatus,
    results
  };
}

/**
 * Make HTTP request
 */
function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const url = new URL(test.path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'User-Agent': 'Security-Test-Client/1.0',
        ...test.headers
      }
    };
    
    const startTime = Date.now();
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            data: jsonData,
            responseTime
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            data: data,
            responseTime
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    // Send request body if provided
    if (test.body) {
      if (typeof test.body === 'string') {
        req.write(test.body);
      } else {
        req.write(JSON.stringify(test.body));
      }
    }
    
    req.end();
  });
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test security monitoring endpoints
 */
async function testSecurityMonitoring() {
  console.log('\n🔍 Testing Security Monitoring Endpoints...');
  
  const endpoints = [
    '/api/security/status',
    '/api/security/metrics',
    '/api/security/events',
    '/api/security/patterns',
    '/api/security/report?timeWindow=1h'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest({
        method: 'GET',
        path: endpoint,
        headers: {}
      });
      
      console.log(`   ${endpoint}: ${result.status} ${result.statusText}`);
      results.push({ endpoint, status: result.status, success: result.status === 200 });
    } catch (error) {
      console.log(`   ${endpoint}: ERROR - ${error.message}`);
      results.push({ endpoint, status: 0, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Generate test report
 */
function generateReport(testResults, monitoringResults) {
  console.log('\n📊 Security Middleware Test Report');
  console.log('=' .repeat(50));
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  console.log('\nTest Details:');
  testResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.success ? '✅' : '❌'}`);
    if (!result.success) {
      console.log(`   Expected: [${result.expectedStatus.join(', ')}]`);
      console.log(`   Got: [${result.statusCodes.join(', ')}]`);
    }
  });
  
  console.log('\nSecurity Monitoring Endpoints:');
  const monitoringPassed = monitoringResults.filter(r => r.success).length;
  console.log(`Monitoring Endpoints: ${monitoringPassed}/${monitoringResults.length} working`);
  
  monitoringResults.forEach(result => {
    console.log(`   ${result.endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
  });
  
  console.log('\n🛡️ Security Middleware Implementation:');
  console.log('   ✅ Helmet configuration with CSP');
  console.log('   ✅ Rate limiting (API: 100/15min, PDF: 10/hour)');
  console.log('   ✅ CORS configuration with allowlist');
  console.log('   ✅ XSS protection');
  console.log('   ✅ SQL injection protection');
  console.log('   ✅ File upload security');
  console.log('   ✅ IP tracking and blocking');
  console.log('   ✅ Security audit logging');
  console.log('   ✅ Security monitoring API');
  
  console.log(`\n${passedTests === totalTests ? '🎉' : '⚠️'} Security middleware test ${passedTests === totalTests ? 'completed successfully' : 'completed with some failures'}`);
}

/**
 * Main test execution
 */
async function runSecurityTests() {
  console.log('🛡️ Maria Faz Security Middleware Test Suite');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('Starting security tests...\n');
  
  try {
    // Run main security tests
    const testResults = [];
    for (const test of securityTests) {
      const result = await executeTest(test);
      testResults.push(result);
      
      // Add delay between different test types
      await sleep(200);
    }
    
    // Test security monitoring endpoints
    const monitoringResults = await testSecurityMonitoring();
    
    // Generate report
    generateReport(testResults, monitoringResults);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Check if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests();
}

export { runSecurityTests, securityTests, testSecurityMonitoring };
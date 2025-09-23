/**
 * Simplified AI Functionality Test
 * Quick validation of AI services without complex imports
 */

const axios = require('axios');

// Test configuration
const TEST_TIMEOUT = 30000;

// Environment variables validation
const API_KEYS = {
  GEMINI: process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  OPENROUTER: process.env.OPENROUTER_API_KEY,
  MISTRAL: process.env.MISTRAL_API_KEY,
  HUGGINGFACE: process.env.HF_TOKEN,
  PRIMARY_AI: process.env.PRIMARY_AI
};

console.log('🚀 Starting AI Functionality Tests...\n');

// Test Results Collection
const testResults = [];

function addTestResult(feature, status, message, performance, errors) {
  testResults.push({ feature, status, message, performance, errors });
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${emoji} ${feature}: ${message}`);
  if (performance) console.log(`   ⏱️  ${performance}ms`);
  if (errors && errors.length > 0) console.log(`   🐛 ${errors.join(', ')}`);
}

// Test 1: API Key Configuration Analysis
async function testAPIConfiguration() {
  const startTime = Date.now();
  
  try {
    const configuredServices = Object.entries(API_KEYS)
      .filter(([key, value]) => value && value !== '' && key !== 'PRIMARY_AI')
      .map(([key, _]) => key);
    
    const missingServices = Object.entries(API_KEYS)
      .filter(([key, value]) => (!value || value === '') && key !== 'PRIMARY_AI')
      .map(([key, _]) => key);
    
    const status = missingServices.length === 0 ? 'pass' : 'warning';
    const message = `${configuredServices.length}/4 AI services configured: ${configuredServices.join(', ')}`;
    const errors = missingServices.length > 0 ? [`Missing: ${missingServices.join(', ')}`] : undefined;
    
    addTestResult('API Configuration', status, message, Date.now() - startTime, errors);
    
    return configuredServices.length > 0;
  } catch (error) {
    addTestResult('API Configuration', 'fail', error.message, Date.now() - startTime, [error.message]);
    return false;
  }
}

// Test 2: Gemini API Connection
async function testGeminiConnection() {
  if (!API_KEYS.GEMINI) {
    addTestResult('Gemini Connection', 'skip', 'No API key configured');
    return false;
  }

  const startTime = Date.now();
  
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEYS.GEMINI}`,
      { timeout: TEST_TIMEOUT }
    );
    
    if (response.status === 200 && response.data.models) {
      const modelCount = response.data.models.length;
      addTestResult('Gemini Connection', 'pass', `Connected - ${modelCount} models available`, Date.now() - startTime);
      return true;
    } else {
      addTestResult('Gemini Connection', 'fail', `Invalid response: ${response.status}`, Date.now() - startTime);
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    addTestResult('Gemini Connection', 'fail', errorMsg, Date.now() - startTime, [errorMsg]);
    return false;
  }
}

// Test 3: OpenRouter API Connection
async function testOpenRouterConnection() {
  if (!API_KEYS.OPENROUTER) {
    addTestResult('OpenRouter Connection', 'skip', 'No API key configured');
    return false;
  }

  const startTime = Date.now();
  
  try {
    const response = await axios.get(
      'https://openrouter.ai/api/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${API_KEYS.OPENROUTER}`,
          'Content-Type': 'application/json'
        },
        timeout: TEST_TIMEOUT
      }
    );
    
    if (response.status === 200 && response.data.data) {
      const models = response.data.data;
      const ocrModels = models.filter(m => 
        m.id?.toLowerCase().includes('ocr') || 
        m.id?.toLowerCase().includes('vision') ||
        m.capabilities?.includes('vision')
      ).length;
      
      addTestResult('OpenRouter Connection', 'pass', `Connected - ${models.length} models (${ocrModels} vision/OCR)`, Date.now() - startTime);
      return true;
    } else {
      addTestResult('OpenRouter Connection', 'fail', `Invalid response: ${response.status}`, Date.now() - startTime);
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    addTestResult('OpenRouter Connection', 'fail', errorMsg, Date.now() - startTime, [errorMsg]);
    return false;
  }
}

// Test 4: Mistral API Connection
async function testMistralConnection() {
  if (!API_KEYS.MISTRAL) {
    addTestResult('Mistral Connection', 'skip', 'No API key configured');
    return false;
  }

  const startTime = Date.now();
  
  try {
    const response = await axios.get(
      'https://api.mistral.ai/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${API_KEYS.MISTRAL}`,
          'Content-Type': 'application/json'
        },
        timeout: TEST_TIMEOUT
      }
    );
    
    if (response.status === 200 && response.data.object === 'list') {
      const models = response.data.data || [];
      const visionModels = models.filter(m => 
        m.id?.includes('pixtral') || 
        m.capabilities?.includes('vision')
      ).length;
      
      addTestResult('Mistral Connection', 'pass', `Connected - ${models.length} models (${visionModels} vision)`, Date.now() - startTime);
      return true;
    } else {
      addTestResult('Mistral Connection', 'fail', `Invalid response: ${response.status}`, Date.now() - startTime);
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    addTestResult('Mistral Connection', 'fail', errorMsg, Date.now() - startTime, [errorMsg]);
    return false;
  }
}

// Test 5: Simple Gemini Text Generation
async function testGeminiTextGeneration() {
  if (!API_KEYS.GEMINI) {
    addTestResult('Gemini Text Generation', 'skip', 'No API key configured');
    return false;
  }

  const startTime = Date.now();
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEYS.GEMINI}`,
      {
        contents: [{
          parts: [{ text: "Say 'Hello World' in exactly two words." }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: TEST_TIMEOUT
      }
    );
    
    if (response.status === 200 && response.data.candidates) {
      const text = response.data.candidates[0]?.content?.parts?.[0]?.text || '';
      addTestResult('Gemini Text Generation', 'pass', `Generated ${text.length} characters: "${text.trim()}"`, Date.now() - startTime);
      return true;
    } else {
      addTestResult('Gemini Text Generation', 'fail', 'Invalid response structure', Date.now() - startTime);
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    addTestResult('Gemini Text Generation', 'fail', errorMsg, Date.now() - startTime, [errorMsg]);
    return false;
  }
}

// Test 6: Test Document Classification with Gemini
async function testDocumentClassification() {
  if (!API_KEYS.GEMINI) {
    addTestResult('Document Classification', 'skip', 'No Gemini API key configured');
    return false;
  }

  const startTime = Date.now();
  const sampleText = `
EXCITING LISBON SETE RIOS
Data entrada: 21/03/2025
Data saída: 23/03/2025
N.º noites: 2
Nome: Camila
N.º hóspedes: 4
País: Portugal
Site: Airbnb
Telefone: 351 925 073 494
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEYS.GEMINI}`,
      {
        contents: [{
          parts: [{ 
            text: `Classify this document type and return only a JSON object with: type (string), confidence (0-1 number). Document text: ${sampleText}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.1
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: TEST_TIMEOUT
      }
    );
    
    if (response.status === 200 && response.data.candidates) {
      const text = response.data.candidates[0]?.content?.parts?.[0]?.text || '';
      
      try {
        // Extract JSON from response
        const jsonMatch = text.match(/\{[^}]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.type && typeof parsed.confidence === 'number') {
            addTestResult('Document Classification', 'pass', `Classified as "${parsed.type}" (${Math.round(parsed.confidence * 100)}% confidence)`, Date.now() - startTime);
            return true;
          }
        }
        
        addTestResult('Document Classification', 'warning', 'Response not in expected JSON format', Date.now() - startTime, [text]);
        return false;
      } catch (jsonError) {
        addTestResult('Document Classification', 'warning', 'Could not parse JSON response', Date.now() - startTime, [text]);
        return false;
      }
    } else {
      addTestResult('Document Classification', 'fail', 'Invalid response structure', Date.now() - startTime);
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    addTestResult('Document Classification', 'fail', errorMsg, Date.now() - startTime, [errorMsg]);
    return false;
  }
}

// Test 7: Error Handling - Invalid API Key
async function testErrorHandling() {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(
      'https://generativelanguage.googleapis.com/v1/models?key=invalid-key-12345',
      { timeout: TEST_TIMEOUT }
    );
    
    // If we get here, something's wrong - invalid key should fail
    addTestResult('Error Handling', 'fail', 'Invalid API key was accepted', Date.now() - startTime);
    return false;
    
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 403) {
      addTestResult('Error Handling', 'pass', 'Invalid API key correctly rejected', Date.now() - startTime);
      return true;
    } else {
      addTestResult('Error Handling', 'warning', `Unexpected error: ${error.message}`, Date.now() - startTime);
      return false;
    }
  }
}

// Test 8: Rate Limiting Test
async function testRateLimiting() {
  if (!API_KEYS.GEMINI) {
    addTestResult('Rate Limiting', 'skip', 'No Gemini API key configured');
    return false;
  }

  const startTime = Date.now();
  
  try {
    // Make 3 rapid requests to test rate limiting behavior
    const promises = Array(3).fill(null).map(async (_, index) => {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEYS.GEMINI}`,
          {
            contents: [{ parts: [{ text: `Test request ${index + 1}` }] }],
            generationConfig: { maxOutputTokens: 5 }
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
          }
        );
        
        return { success: true, status: response.status, index };
      } catch (error) {
        return { 
          success: false, 
          status: error.response?.status, 
          error: error.message,
          index 
        };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const rateLimited = results.filter(r => r.status === 429).length;
    
    const message = `${successful}/3 requests succeeded${rateLimited > 0 ? `, ${rateLimited} rate limited` : ''}`;
    const status = successful > 0 ? 'pass' : 'fail';
    
    addTestResult('Rate Limiting', status, message, Date.now() - startTime);
    return successful > 0;
    
  } catch (error) {
    addTestResult('Rate Limiting', 'fail', error.message, Date.now() - startTime, [error.message]);
    return false;
  }
}

// Main Test Runner
async function runAllTests() {
  console.log('🔧 AI Service Configuration Check');
  console.log('=' .repeat(50));
  
  const configOk = await testAPIConfiguration();
  
  console.log('\n🌐 API Connection Tests');
  console.log('=' .repeat(50));
  
  const geminiOk = await testGeminiConnection();
  const openrouterOk = await testOpenRouterConnection();
  const mistralOk = await testMistralConnection();
  
  console.log('\n🤖 AI Functionality Tests');
  console.log('=' .repeat(50));
  
  const textGenOk = await testGeminiTextGeneration();
  const classificationOk = await testDocumentClassification();
  
  console.log('\n🛡️  Error Handling & Performance Tests');
  console.log('=' .repeat(50));
  
  const errorHandlingOk = await testErrorHandling();
  const rateLimitOk = await testRateLimiting();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(80));
  
  const totalTests = testResults.length;
  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const skipped = testResults.filter(r => r.status === 'skip').length;
  const warnings = testResults.filter(r => r.status === 'warning').length;
  
  console.log(`📈 Results: ${passed} passed, ${failed} failed, ${warnings} warnings, ${skipped} skipped`);
  console.log(`🎯 Success Rate: ${Math.round((passed / (totalTests - skipped)) * 100)}%`);
  
  // Identify critical issues
  const criticalFailures = testResults.filter(r => 
    r.status === 'fail' && 
    ['API Configuration', 'Gemini Connection', 'Error Handling'].includes(r.feature.split(' ')[0])
  );
  
  if (criticalFailures.length > 0) {
    console.log(`🚨 Critical Issues Found:`);
    criticalFailures.forEach(failure => {
      console.log(`   ❌ ${failure.feature}: ${failure.message}`);
    });
  }
  
  // Service availability summary
  const availableServices = [];
  if (geminiOk) availableServices.push('Gemini');
  if (openrouterOk) availableServices.push('OpenRouter');
  if (mistralOk) availableServices.push('Mistral');
  
  console.log(`🔧 Available AI Services: ${availableServices.join(', ')}`);
  console.log(`💡 Primary AI Service: ${API_KEYS.PRIMARY_AI || 'auto'}`);
  
  if (availableServices.length === 0) {
    console.log('⚠️  WARNING: No AI services are currently available!');
  } else if (availableServices.length === 1) {
    console.log('⚠️  WARNING: Only one AI service is available - consider configuring backups');
  } else {
    console.log('✅ Multiple AI services available - good redundancy');
  }
  
  console.log('\n🏁 Testing Complete');
  console.log('=' .repeat(80));
  
  // Return overall status
  return {
    totalTests,
    passed,
    failed,
    warnings,
    skipped,
    criticalFailures: criticalFailures.length,
    availableServices: availableServices.length,
    overallSuccess: criticalFailures.length === 0 && availableServices.length > 0
  };
}

// Execute tests if run directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      process.exit(results.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults };
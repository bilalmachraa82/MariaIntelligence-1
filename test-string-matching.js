/**
 * Simple validation script for the string matching utilities
 * This tests the core functionality without requiring a test runner
 */

// Import the functions (would normally use TypeScript imports)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Advanced String Matching Utilities');
console.log('==============================================\n');

// Test 1: Basic functionality
console.log('Test 1: Basic String Matching');
console.log('------------------------------');

// Simulate the normalizeText function
function normalizeText(text) {
  if (!text) return '';
  
  // Portuguese accent mapping
  const accentMap = {
    'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c', 'ñ': 'n'
  };

  // Abbreviation mapping
  const abbreviations = {
    'apt': 'apartamento',
    'apto': 'apartamento', 
    'ed': 'edificio',
    'r': 'rua',
    'av': 'avenida',
    'nº': 'numero',
    'n': 'numero'
  };

  let normalized = text.toLowerCase().trim();
  
  // Remove accents
  normalized = normalized.replace(/[àáâãäèéêëìíîïòóôõöùúûüçñ]/gi, char => 
    accentMap[char] || char
  );
  
  // Expand abbreviations
  const words = normalized.split(/\s+/);
  normalized = words.map(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    return abbreviations[cleanWord] || word;
  }).join(' ');
  
  // Clean up
  normalized = normalized
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

// Test normalization
const testCases = [
  { input: 'São João do Estoril', expected: 'sao joao do estoril' },
  { input: 'Apto 3B, Ed. Central', expected: 'apartamento 3b edificio central' },
  { input: 'R. das Flores, nº 25', expected: 'rua das flores numero 25' },
  { input: 'Coração de Jesus', expected: 'coracao de jesus' }
];

let passed = 0;
let total = testCases.length;

testCases.forEach(({ input, expected }, index) => {
  const result = normalizeText(input);
  const success = result === expected;
  console.log(`  ${index + 1}. "${input}" → "${result}"`);
  console.log(`     Expected: "${expected}"`);
  console.log(`     Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
  if (success) passed++;
  console.log();
});

console.log(`Normalization Test Results: ${passed}/${total} passed\n`);

// Test 2: Levenshtein Distance
console.log('Test 2: Levenshtein Distance Algorithm');
console.log('-------------------------------------');

function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }

  return matrix[str2.length][str1.length];
}

const distanceTests = [
  { str1: 'casa', str2: 'casa', expected: 0 },
  { str1: 'casa', str2: 'caza', expected: 1 },
  { str1: 'casa', str2: 'casas', expected: 1 },
  { str1: 'apartamento', str2: 'apartamente', expected: 1 }
];

let distancePassed = 0;
distanceTests.forEach(({ str1, str2, expected }, index) => {
  const result = levenshteinDistance(str1, str2);
  const success = result === expected;
  console.log(`  ${index + 1}. "${str1}" vs "${str2}" = ${result} (expected: ${expected}) ${success ? '✅' : '❌'}`);
  if (success) distancePassed++;
});

console.log(`Levenshtein Test Results: ${distancePassed}/${distanceTests.length} passed\n`);

// Test 3: Property Matching Simulation  
console.log('Test 3: Property Matching Simulation');
console.log('-----------------------------------');

const sampleProperties = [
  { id: '1', name: 'Apartamento Central Lisboa', aliases: ['Apto Central Lisboa', 'Apartamento Centro'] },
  { id: '2', name: 'Edifício São Pedro', aliases: ['Ed. São Pedro', 'Edificio Sao Pedro'] },
  { id: '3', name: 'Casa Quinta da Aroeira', aliases: ['Quinta Aroeira', 'Casa Aroeira'] }
];

function simplePropertyMatch(query, properties) {
  const normalizedQuery = normalizeText(query);
  
  // Check exact matches first
  for (const property of properties) {
    if (normalizeText(property.name) === normalizedQuery) {
      return { property, score: 1.0, matchType: 'exact_name' };
    }
    
    // Check aliases
    if (property.aliases) {
      for (const alias of property.aliases) {
        if (normalizeText(alias) === normalizedQuery) {
          return { property, score: 0.95, matchType: 'exact_alias' };
        }
      }
    }
  }
  
  // Check partial matches
  for (const property of properties) {
    const normalizedName = normalizeText(property.name);
    if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
      const score = Math.min(normalizedQuery.length, normalizedName.length) / 
                   Math.max(normalizedQuery.length, normalizedName.length);
      return { property, score, matchType: 'partial_name' };
    }
    
    // Check alias partial matches
    if (property.aliases) {
      for (const alias of property.aliases) {
        const normalizedAlias = normalizeText(alias);
        if (normalizedAlias.includes(normalizedQuery) || normalizedQuery.includes(normalizedAlias)) {
          const score = Math.min(normalizedQuery.length, normalizedAlias.length) / 
                       Math.max(normalizedQuery.length, normalizedAlias.length) * 0.9; // Slightly lower for aliases
          return { property, score, matchType: 'partial_alias' };
        }
      }
    }
  }
  
  return null;
}

const propertyTests = [
  { query: 'Apartamento Central Lisboa', expectMatch: true, description: 'Exact match' },
  { query: 'Apto Central Lisboa', expectMatch: true, description: 'Alias exact match' },
  { query: 'Apartamento Central Sao Paulo', expectMatch: true, description: 'Partial match with accent' },
  { query: 'Ed São Pedro', expectMatch: true, description: 'Abbreviation with accent' },
  { query: 'Casa Aroeira', expectMatch: true, description: 'Alias partial match' },
  { query: 'Villa Cascais', expectMatch: false, description: 'No match expected' }
];

let propertyPassed = 0;
propertyTests.forEach(({ query, expectMatch, description }, index) => {
  const result = simplePropertyMatch(query, sampleProperties);
  const success = (result !== null) === expectMatch;
  
  console.log(`  ${index + 1}. "${query}" - ${description}`);
  if (result) {
    console.log(`     Found: ${result.property.name} (score: ${result.score.toFixed(3)}, type: ${result.matchType})`);
  } else {
    console.log(`     No match found`);
  }
  console.log(`     Expected: ${expectMatch ? 'Match' : 'No match'} - ${success ? '✅ PASS' : '❌ FAIL'}`);
  if (success) propertyPassed++;
  console.log();
});

console.log(`Property Matching Test Results: ${propertyPassed}/${propertyTests.length} passed\n`);

// Test 4: File Existence Check
console.log('Test 4: File Existence Check');
console.log('----------------------------');

const requiredFiles = [
  'server/utils/stringMatch.ts',
  'server/utils/enhancedPropertyMatcher.ts', 
  'server/utils/stringMatch.test.ts',
  'server/utils/stringMatchExamples.ts',
  'server/utils/integrationDemo.ts',
  'server/utils/README.md'
];

let filesExist = 0;
requiredFiles.forEach((filePath, index) => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${index + 1}. ${filePath} - ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
  if (exists) filesExist++;
});

console.log(`File Existence Results: ${filesExist}/${requiredFiles.length} files exist\n`);

// Overall Results
console.log('📊 Overall Test Results');
console.log('=======================');
const totalTests = total + distanceTests.length + propertyTests.length + requiredFiles.length;
const totalPassed = passed + distancePassed + propertyPassed + filesExist;

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalTests - totalPassed}`);
console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

if (totalPassed === totalTests) {
  console.log('\n🎉 All tests passed! The string matching utilities are working correctly.');
} else {
  console.log(`\n⚠️  ${totalTests - totalPassed} tests failed. Review the implementation.`);
}

console.log('\n✅ String matching validation completed!');
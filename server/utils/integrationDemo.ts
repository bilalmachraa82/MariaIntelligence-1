/**
 * Integration Demo: Upgrading Existing Property Matching
 * 
 * This file shows how to integrate the new advanced string matching
 * algorithms with the existing property matching system.
 */

import { Property } from '../../shared/schema';
import { matchPropertyByAlias } from './matchPropertyByAlias';
import { matchPropertyByAliasEnhanced, enhancedMatchProperty } from './enhancedPropertyMatcher';

/**
 * Comparison between old and new matching algorithms
 */
export function compareMatchingAlgorithms(propertyName: string, properties: Property[]) {
  console.log(`\n🔍 Comparing matching algorithms for: "${propertyName}"`);
  console.log('=' .repeat(60));

  // Old algorithm
  console.log('\n📊 Original Algorithm (matchPropertyByAlias):');
  const oldResult = matchPropertyByAlias(propertyName, properties);
  if (oldResult) {
    console.log(`✅ Found: ${oldResult.name}`);
  } else {
    console.log('❌ No match found');
  }

  // New enhanced algorithm
  console.log('\n🚀 Enhanced Algorithm (matchPropertyByAliasEnhanced):');
  const newResult = matchPropertyByAliasEnhanced(propertyName, properties);
  if (newResult) {
    console.log(`✅ Found: ${newResult.name}`);
  } else {
    console.log('❌ No match found');
  }

  // Detailed enhanced matching
  console.log('\n🎯 Detailed Enhanced Matching:');
  const detailedResults = enhancedMatchProperty(propertyName, properties, {
    maxResults: 3,
    minConfidenceScore: 0.2
  });

  if (detailedResults.length > 0) {
    detailedResults.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match.property.name}`);
      console.log(`     Score: ${match.matchScore.toFixed(3)} (${match.confidence} confidence)`);
      console.log(`     Algorithm: ${match.matchDetails.bestMatch.algorithm}`);
      console.log(`     Matched: ${match.matchedField} - "${match.matchedValue}"`);
      console.log();
    });
  } else {
    console.log('❌ No matches found');
  }

  // Show comparison result
  const oldFound = oldResult !== undefined;
  const newFound = newResult !== undefined;
  const sameResult = oldFound && newFound && oldResult.id === newResult.id;

  console.log('📈 Comparison Summary:');
  if (sameResult) {
    console.log('✅ Both algorithms found the same property');
  } else if (oldFound && !newFound) {
    console.log('⚠️  Only old algorithm found a match');
  } else if (!oldFound && newFound) {
    console.log('🎉 New algorithm found a match where old algorithm failed');
  } else if (oldFound && newFound) {
    console.log('🤔 Algorithms found different properties');
    console.log(`   Old: ${oldResult.name}`);
    console.log(`   New: ${newResult.name}`);
  } else {
    console.log('❌ Neither algorithm found a match');
  }
}

/**
 * Migration guide for existing code
 */
export function migrationGuideExample() {
  console.log('\n📚 Migration Guide: Upgrading from Old to New System');
  console.log('=' .repeat(60));

  console.log(`
// OLD CODE:
import { matchPropertyByAlias } from './matchPropertyByAlias';

const property = matchPropertyByAlias(searchTerm, properties);
if (property) {
  console.log('Found:', property.name);
} else {
  console.log('Not found');
}

// NEW CODE (Drop-in replacement):
import { matchPropertyByAliasEnhanced } from './enhancedPropertyMatcher';

const property = matchPropertyByAliasEnhanced(searchTerm, properties);
if (property) {
  console.log('Found:', property.name);
} else {
  console.log('Not found');
}

// NEW CODE (Advanced usage):
import { enhancedMatchProperty } from './enhancedPropertyMatcher';

const matches = enhancedMatchProperty(searchTerm, properties, {
  maxResults: 5,
  minConfidenceScore: 0.6
});

matches.forEach(match => {
  console.log(\`Found: \${match.property.name} (confidence: \${match.confidence})\`);
});
  `);

  console.log('\n💡 Benefits of upgrading:');
  console.log('  • Better handling of Portuguese accents and abbreviations');
  console.log('  • Multiple matching algorithms for improved accuracy'); 
  console.log('  • Confidence scores for match quality assessment');
  console.log('  • Flexible word order and partial matching');
  console.log('  • Detailed matching information for debugging');
  console.log('  • Bulk operations for performance');
  console.log('  • Data validation and quality checking');
}

/**
 * Test cases that show improvement over old system
 */
export function improvementTestCases() {
  console.log('\n🧪 Test Cases Showing Improvements');
  console.log('=' .repeat(60));

  // Sample properties for testing 
  const testProperties: Property[] = [
    {
      id: '1',
      name: 'Apartamento Central São Paulo',
      aliases: ['Apto Central SP', 'Apartamento Centro'],
      address: 'Rua Augusta, 100',
      type: 'apartment',
      bedrooms: 2,
      bathrooms: 1,
      area: 75,
      price: 300000,
      currency: 'EUR',
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2', 
      name: 'Edifício Torre Norte',
      aliases: ['Ed. Torre Norte', 'Building North Tower'],
      address: 'Av. Paulista, 200',
      type: 'apartment',
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      price: 450000,
      currency: 'EUR',
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const testCases = [
    {
      name: 'Accent handling',
      query: 'Apartamento Central Sao Paulo',
      description: 'Should match despite missing accent in "São"'
    },
    {
      name: 'Abbreviation expansion',
      query: 'Apto Central',
      description: 'Should match "Apartamento Central" by expanding "Apto"'
    },
    {
      name: 'Word order flexibility',
      query: 'Central Apartamento',
      description: 'Should match despite different word order'
    },
    {
      name: 'Fuzzy matching',
      query: 'Torre Norte Edificio',
      description: 'Should match with fuzzy word matching'
    },
    {
      name: 'Partial matching',
      query: 'Torre Norte',
      description: 'Should match partial property name'
    }
  ];

  testCases.forEach(testCase => {
    console.log(`\n🔬 Test: ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.description}`);
    
    compareMatchingAlgorithms(testCase.query, testProperties);
  });
}

/**
 * Performance comparison between old and new systems
 */
export function performanceComparison() {
  console.log('\n⚡ Performance Comparison');
  console.log('=' .repeat(60));

  // Generate test data
  const largePropertySet: Property[] = [];
  for (let i = 0; i < 1000; i++) {
    largePropertySet.push({
      id: `${i}`,
      name: `Propriedade ${i} - Casa ${Math.random().toString(36).substring(7)}`,
      aliases: [`Prop ${i}`, `Casa ${i}`],
      address: `Rua ${i}`,
      type: 'house',
      bedrooms: 3,
      bathrooms: 2,
      area: 100,
      price: 200000,
      currency: 'EUR',
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const testQueries = [
    'Propriedade 500',
    'Casa 250', 
    'Prop 750'
  ];

  console.log(`Testing with ${largePropertySet.length} properties...\n`);

  testQueries.forEach(query => {
    console.log(`Query: "${query}"`);

    // Test old algorithm
    const oldStart = Date.now();
    const oldResult = matchPropertyByAlias(query, largePropertySet);
    const oldTime = Date.now() - oldStart;

    // Test new algorithm
    const newStart = Date.now();
    const newResult = matchPropertyByAliasEnhanced(query, largePropertySet);
    const newTime = Date.now() - newStart;

    console.log(`  Old Algorithm: ${oldTime}ms ${oldResult ? '✅' : '❌'}`);
    console.log(`  New Algorithm: ${newTime}ms ${newResult ? '✅' : '❌'}`);
    
    if (oldTime > 0 && newTime > 0) {
      const speedup = oldTime / newTime;
      if (speedup > 1) {
        console.log(`  🚀 New algorithm is ${speedup.toFixed(1)}x faster`);
      } else if (speedup < 1) {
        console.log(`  ⚠️  New algorithm is ${(1/speedup).toFixed(1)}x slower`);
      } else {
        console.log(`  ⚖️  Similar performance`);
      }
    }
    console.log();
  });
}

/**
 * Run complete integration demo
 */
export function runIntegrationDemo() {
  console.log('🔧 Advanced String Matching Integration Demo');
  console.log('===============================================');

  migrationGuideExample();
  improvementTestCases();
  performanceComparison();

  console.log('\n✅ Integration demo completed!');
  console.log('\n🎯 Next Steps:');
  console.log('  1. Review the test results above');
  console.log('  2. Update your imports to use enhanced matching');
  console.log('  3. Consider adding confidence score checks in your logic');
  console.log('  4. Test with your actual property data');
  console.log('  5. Monitor performance in production');
}

// Export for external use
export { compareMatchingAlgorithms };
/**
 * Practical Examples and Usage Patterns for Advanced String Matching
 * 
 * This file demonstrates how to use the string matching utilities in real-world
 * scenarios with Portuguese property names and common use cases.
 */

import { Property } from '../../shared/schema';
import { 
  matchStrings, 
  findBestMatches, 
  matchPropertyNames,
  normalizeText,
  type MatchOptions 
} from './stringMatch';
import { 
  enhancedMatchProperty, 
  searchProperties,
  validatePropertyNames,
  bulkMatchProperties,
  type PropertyMatchOptions 
} from './enhancedPropertyMatcher';

// Sample Portuguese property data for examples
const sampleProperties: Property[] = [
  {
    id: '1',
    name: 'Apartamento Central Lisboa',
    aliases: ['Apto Central Lisboa', 'Apartamento Centro', 'Flat Central'],
    address: 'Rua das Flores, 123',
    type: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    area: 75,
    price: 250000,
    currency: 'EUR',
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Edifício São Pedro Torre A',
    aliases: ['Ed. São Pedro A', 'Edificio Sao Pedro Torre A', 'Torre A São Pedro'],
    address: 'Avenida da República, 456',
    type: 'apartment',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    price: 380000,
    currency: 'EUR',
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Casa Quinta da Aroeira',
    aliases: ['Quinta Aroeira', 'Casa Aroeira', 'Villa Aroeira'],
    address: 'Quinta da Aroeira, Lote 789',
    type: 'house',
    bedrooms: 4,
    bathrooms: 3,
    area: 200,
    price: 650000,
    currency: 'EUR',
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Moradia T3 Cascais',
    aliases: ['Casa T3 Cascais', 'Moradia Cascais', 'House Cascais'],
    address: 'Rua do Sol, 321',
    type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    price: 520000,
    currency: 'EUR',
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Loft Príncipe Real',
    aliases: ['Loft Principe Real', 'Studio Príncipe Real', 'Atelier Príncipe Real'],
    address: 'Praça do Príncipe Real, 100',
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    area: 85,
    price: 320000,
    currency: 'EUR',
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Example 1: Basic String Matching
 * Demonstrates simple string comparison with Portuguese text
 */
export function basicStringMatchingExample() {
  console.log('=== Basic String Matching Examples ===\n');

  const examples = [
    { query: 'Apartamento Central', target: 'Apto Central' },
    { query: 'São Pedro', target: 'Sao Pedro' },
    { query: 'Príncipe Real', target: 'Principe Real' },
    { query: 'Quinta da Aroeira', target: 'Quinta Aroeira' }
  ];

  examples.forEach(({ query, target }) => {
    const result = matchStrings(query, target);
    console.log(`Query: "${query}" vs Target: "${target}"`);
    console.log(`Overall Score: ${result.overallScore.toFixed(3)}`);
    console.log(`Confidence: ${result.isHighConfidence ? 'High' : result.isMediumConfidence ? 'Medium' : 'Low'}`);
    console.log(`Best Algorithm: ${result.bestMatch.algorithm} (${result.bestMatch.score.toFixed(3)})`);
    console.log('---');
  });
}

/**
 * Example 2: Property Name Matching
 * Shows how to find properties using partial or fuzzy names
 */
export function propertyNameMatchingExample() {
  console.log('\n=== Property Name Matching Examples ===\n');

  const searchQueries = [
    'Apto Central',           // Abbreviation match
    'Ed São Pedro',          // Partial with accent
    'Casa Aroeira',          // Partial match
    'Loft Principe',         // Accent variation
    'T3 Cascais',            // Type + location
    'Central Lisboa'         // Reverse word order
  ];

  searchQueries.forEach(query => {
    console.log(`Searching for: "${query}"`);
    
    const matches = enhancedMatchProperty(query, sampleProperties, {
      maxResults: 3,
      minConfidenceScore: 0.3
    });

    if (matches.length > 0) {
      matches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.property.name}`);
        console.log(`     Score: ${match.matchScore.toFixed(3)} (${match.confidence})`);
        console.log(`     Matched: ${match.matchedField} - "${match.matchedValue}"`);
      });
    } else {
      console.log('  No matches found');
    }
    console.log('---');
  });
}

/**
 * Example 3: Advanced Search with Detailed Results
 * Demonstrates comprehensive search functionality
 */
export function advancedSearchExample() {
  console.log('\n=== Advanced Search Examples ===\n');

  const searchQuery = 'Apartamento Sao Pedro';
  
  const searchResults = searchProperties(searchQuery, sampleProperties, {
    includePartialMatches: true,
    maxResults: 10
  });

  console.log(`Search Query: "${searchQuery}"`);
  console.log(`Normalized Query: "${searchResults.normalizedQuery}"`);
  console.log(`Total Results: ${searchResults.totalResults}`);
  console.log();

  if (searchResults.highConfidenceMatches.length > 0) {
    console.log('High Confidence Matches:');
    searchResults.highConfidenceMatches.forEach(match => {
      console.log(`  • ${match.property.name} (${match.matchScore.toFixed(3)})`);
      console.log(`    Algorithm: ${match.matchDetails.bestMatch.algorithm}`);
      console.log(`    Matched Field: ${match.matchedField}`);
    });
    console.log();
  }

  if (searchResults.mediumConfidenceMatches.length > 0) {
    console.log('Medium Confidence Matches:');
    searchResults.mediumConfidenceMatches.forEach(match => {
      console.log(`  • ${match.property.name} (${match.matchScore.toFixed(3)})`);
    });
    console.log();
  }

  if (searchResults.lowConfidenceMatches.length > 0) {
    console.log('Low Confidence Matches:');
    searchResults.lowConfidenceMatches.forEach(match => {
      console.log(`  • ${match.property.name} (${match.matchScore.toFixed(3)})`);
    });
  }
}

/**
 * Example 4: Bulk Matching for Import/Export Scenarios
 * Shows how to match multiple property names at once
 */
export function bulkMatchingExample() {
  console.log('\n=== Bulk Matching Examples ===\n');

  // Simulate importing property names from external source
  const importedPropertyNames = [
    'Apt Central Lisbon',     // English variation
    'Building S Pedro A',     // English + abbreviation
    'Villa Aroeira',          // Alias match
    'House T3 Cascais',       // Type + location
    'Studio Prince Real'      // English translation
  ];

  console.log('Matching imported property names to existing properties:');
  console.log();

  const bulkResults = bulkMatchProperties(importedPropertyNames, sampleProperties, {
    minConfidenceScore: 0.4,
    maxResults: 2
  });

  bulkResults.forEach((matches, query) => {
    console.log(`Import Name: "${query}"`);
    
    if (matches.length > 0) {
      const bestMatch = matches[0];
      console.log(`  Best Match: ${bestMatch.property.name}`);
      console.log(`  Confidence: ${bestMatch.confidence} (${bestMatch.matchScore.toFixed(3)})`);
      console.log(`  Recommendation: ${getMatchingRecommendation(bestMatch)}`);
    } else {
      console.log('  No matches found - may be a new property');
    }
    console.log('---');
  });
}

/**
 * Example 5: Property Data Validation
 * Shows how to identify potential data quality issues
 */
export function dataValidationExample() {
  console.log('\n=== Data Validation Examples ===\n');

  // Add some problematic data for demonstration
  const testProperties = [
    ...sampleProperties,
    {
      id: '6',
      name: 'Apartamento Central Lisboa Duplicado', // Similar to existing
      aliases: ['Apto Central Lisboa Dup'],
      address: 'Rua Similar, 124',
      type: 'apartment' as const,
      bedrooms: 2,
      bathrooms: 1,
      area: 76,
      price: 251000,
      currency: 'EUR' as const,
      status: 'available' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '7',
      name: 'X', // Too short
      aliases: [],
      address: 'Unknown',
      type: 'apartment' as const,
      bedrooms: 1,
      bathrooms: 1,
      area: 50,
      price: 100000,
      currency: 'EUR' as const,
      status: 'available' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const validation = validatePropertyNames(testProperties);

  console.log('Property Data Validation Report:');
  console.log(`Total Properties: ${testProperties.length}`);
  console.log();

  if (validation.potentialDuplicates.length > 0) {
    console.log('Potential Duplicates:');
    validation.potentialDuplicates.forEach(dup => {
      console.log(`  • "${dup.property1.name}" vs "${dup.property2.name}"`);
      console.log(`    Similarity: ${dup.similarity.toFixed(3)}`);
    });
    console.log();
  }

  if (validation.missingAliases.length > 0) {
    console.log('Properties Missing Aliases:');
    validation.missingAliases.forEach(prop => {
      console.log(`  • ${prop.name}`);
    });
    console.log();
  }

  if (validation.suspiciousNames.length > 0) {
    console.log('Suspicious Property Names:');
    validation.suspiciousNames.forEach(prop => {
      console.log(`  • "${prop.name}" (length: ${prop.name.length})`);
    });
    console.log();
  }

  console.log('Recommendations:');
  validation.recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });
}

/**
 * Example 6: Custom Matching Options
 * Demonstrates how to tune matching behavior for specific use cases
 */
export function customOptionsExample() {
  console.log('\n=== Custom Matching Options Examples ===\n');

  const query = 'Apartamento Central';
  const targets = ['Apto Central', 'Apart. Central', 'Central Apartment'];

  // Strict matching (exact matches preferred)
  console.log('Strict Matching Configuration:');
  const strictOptions: MatchOptions = {
    weights: {
      exact: 0.50,        // High weight for exact matches
      jaroWinkler: 0.20,
      levenshtein: 0.15,
      ngram: 0.10,
      partial: 0.05
    },
    expandAbbreviations: false, // Don't expand abbreviations
    allowPartialMatch: false    // No partial matching
  };

  targets.forEach(target => {
    const result = matchStrings(query, target, strictOptions);
    console.log(`  "${target}": ${result.overallScore.toFixed(3)}`);
  });

  console.log();

  // Fuzzy matching (flexible matching preferred)
  console.log('Fuzzy Matching Configuration:');
  const fuzzyOptions: MatchOptions = {
    weights: {
      exact: 0.10,
      jaroWinkler: 0.35,  // High weight for similarity
      levenshtein: 0.25,
      ngram: 0.25,
      partial: 0.05
    },
    expandAbbreviations: true,  // Expand abbreviations
    allowPartialMatch: true,    // Allow partial matching
    wordOrderFlexible: true     // Flexible word order
  };

  targets.forEach(target => {
    const result = matchStrings(query, target, fuzzyOptions);
    console.log(`  "${target}": ${result.overallScore.toFixed(3)}`);
  });
}

/**
 * Helper function to generate matching recommendations
 */
function getMatchingRecommendation(match: any): string {
  if (match.confidence === 'high') {
    return 'Strong match - likely the same property';
  } else if (match.confidence === 'medium') {
    return 'Possible match - manual review recommended';
  } else {
    return 'Weak match - likely different property';
  }
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🏠 Advanced String Matching for Portuguese Property Names');
  console.log('===================================================\n');

  basicStringMatchingExample();
  propertyNameMatchingExample();
  advancedSearchExample();
  bulkMatchingExample();
  dataValidationExample();
  customOptionsExample();

  console.log('\n✅ All examples completed!');
}

/**
 * Performance benchmark example
 */
export function performanceBenchmarkExample() {
  console.log('\n=== Performance Benchmark ===\n');

  // Generate large dataset
  const largePropertySet: Property[] = [];
  for (let i = 0; i < 1000; i++) {
    largePropertySet.push({
      id: `prop_${i}`,
      name: `Propriedade ${i} - ${Math.random().toString(36).substring(7)}`,
      aliases: [`Prop ${i}`, `Property ${i}`],
      address: `Rua ${i}`,
      type: 'apartment',
      bedrooms: Math.floor(Math.random() * 5) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      area: Math.floor(Math.random() * 200) + 50,
      price: Math.floor(Math.random() * 500000) + 100000,
      currency: 'EUR',
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const queries = [
    'Propriedade 500',
    'Prop 250',
    'Property 750'
  ];

  console.log(`Testing with ${largePropertySet.length} properties...`);

  queries.forEach(query => {
    const startTime = Date.now();
    const matches = enhancedMatchProperty(query, largePropertySet, {
      maxResults: 10,
      minConfidenceScore: 0.3
    });
    const endTime = Date.now();

    console.log(`Query: "${query}"`);
    console.log(`  Time: ${endTime - startTime}ms`);
    console.log(`  Results: ${matches.length}`);
    if (matches.length > 0) {
      console.log(`  Best Match: ${matches[0].property.name} (${matches[0].matchScore.toFixed(3)})`);
    }
    console.log();
  });
}

// Export for use in other modules
export {
  sampleProperties,
  getMatchingRecommendation
};
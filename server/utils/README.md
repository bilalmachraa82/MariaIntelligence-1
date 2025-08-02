# Advanced String Matching Utilities for Property Names

## Overview

This module provides advanced string matching algorithms specifically designed for Portuguese property name comparison. It includes multiple algorithms, Portuguese language support, and comprehensive matching utilities.

## Features

### 🎯 Multiple Algorithms
- **Levenshtein Distance**: Edit distance for character-level differences
- **Jaro-Winkler Distance**: Optimized for name matching with prefix weighting
- **N-gram Similarity**: Bigram and trigram analysis for substring matching
- **Exact Matching**: Perfect matches after normalization
- **Partial Matching**: Substring and word-level partial matching

### 🇵🇹 Portuguese Language Support
- **Accent Normalization**: Handles á, ã, ç, etc.
- **Abbreviation Expansion**: Recognizes common Portuguese abbreviations
  - `apt` → `apartamento`
  - `ed` → `edifício` 
  - `r` → `rua`
  - `av` → `avenida`
  - And many more...
- **Case Insensitive**: Proper handling of Portuguese capitalization
- **Special Characters**: Handles Portuguese-specific punctuation

### ⚙️ Advanced Features
- **Combined Scoring**: Weighted combination of all algorithms
- **Confidence Levels**: High (≥0.8), Medium (≥0.6), Low (<0.6)
- **Word Order Flexibility**: Matches "Apartamento Central" with "Central Apartamento"
- **Partial Matching**: Finds "Central" in "Apartamento Central"
- **Batch Processing**: Efficient matching of multiple queries
- **Performance Optimized**: Handles large datasets efficiently

## Quick Start

### Basic String Matching

```typescript
import { matchStrings } from './stringMatch';

const result = matchStrings('Apartamento Central', 'Apto Central');
console.log(result.overallScore); // 0.87
console.log(result.isHighConfidence); // true
```

### Property Name Matching

```typescript
import { enhancedMatchProperty } from './enhancedPropertyMatcher';

const matches = enhancedMatchProperty('Apto Central', properties, {
  maxResults: 3,
  minConfidenceScore: 0.6
});

matches.forEach(match => {
  console.log(`${match.property.name} - ${match.confidence} confidence`);
});
```

### Bulk Matching

```typescript
import { bulkMatchProperties } from './enhancedPropertyMatcher';

const queries = ['Apto Central', 'Ed São Pedro', 'Casa Aroeira'];
const results = bulkMatchProperties(queries, properties);

results.forEach((matches, query) => {
  console.log(`Query: ${query}`);
  matches.forEach(match => {
    console.log(`  Match: ${match.property.name} (${match.matchScore.toFixed(3)})`);
  });
});
```

## API Reference

### Core Functions

#### `matchStrings(query, target, options?)`
Performs comprehensive string matching using all algorithms.

**Parameters:**
- `query` (string): Search query
- `target` (string): Target string to match against
- `options` (MatchOptions): Configuration options

**Returns:** `CombinedMatchResult`

#### `enhancedMatchProperty(propertyName, properties, options?)`
Enhanced property matching with confidence scoring.

**Parameters:**
- `propertyName` (string): Property name to search for
- `properties` (Property[]): Array of properties to search in
- `options` (PropertyMatchOptions): Matching configuration

**Returns:** `EnhancedPropertyMatch[]`

### Individual Algorithms

#### `levenshteinSimilarity(query, target, options?)`
Character-level edit distance matching.

#### `jaroWinklerSimilarity(query, target, options?)`
Name-optimized similarity with prefix bonus.

#### `ngramSimilarity(query, target, options?, n?)`
N-gram based substring matching (default n=2).

#### `exactMatch(query, target, options?)`
Perfect match after normalization.

#### `partialMatch(query, target, options?)`
Substring and word-level partial matching.

### Utility Functions

#### `normalizeText(text, options?)`
Normalizes text for comparison (accents, abbreviations, case).

#### `findBestMatches(query, candidates, options?, maxResults?)`
Finds best matches from a list of candidates.

#### `validatePropertyNames(properties)`
Validates property data for quality issues.

## Configuration Options

### MatchOptions

```typescript
interface MatchOptions {
  caseSensitive?: boolean;           // Default: false
  normalizeAccents?: boolean;        // Default: true
  expandAbbreviations?: boolean;     // Default: true
  allowPartialMatch?: boolean;       // Default: true
  wordOrderFlexible?: boolean;       // Default: true
  minLength?: number;                // Default: 2
  weights?: AlgorithmWeights;        // Algorithm weights
}
```

### PropertyMatchOptions

```typescript
interface PropertyMatchOptions extends MatchOptions {
  minConfidenceScore?: number;       // Default: 0.3
  maxResults?: number;               // Default: 5
  includePartialMatches?: boolean;   // Default: true
  preferExactMatches?: boolean;      // Default: true
  aliasWeight?: number;              // Default: 0.9
}
```

### Algorithm Weights

```typescript
interface AlgorithmWeights {
  levenshtein: number;    // Default: 0.25
  jaroWinkler: number;    // Default: 0.30
  ngram: number;          // Default: 0.25
  exact: number;          // Default: 0.15
  partial: number;        // Default: 0.05
}
```

## Portuguese Language Features

### Accent Handling
All Portuguese accents are automatically normalized:
- `São Pedro` matches `Sao Pedro`
- `Coração` matches `Coracao`
- `Açúcar` matches `Acucar`

### Abbreviation Expansion
Common Portuguese abbreviations are automatically expanded:

| Abbreviation | Expansion |
|--------------|-----------|
| `apt`, `apto` | `apartamento` |
| `ed` | `edifício` |
| `r` | `rua` |
| `av` | `avenida` |
| `pc` | `praça` |
| `lg` | `largo` |
| `nº`, `n` | `número` |
| `st` | `santo/santa` |

### Word Order Flexibility
Matches work regardless of word order:
- `Apartamento Central` matches `Central Apartamento`
- `Torre Norte` matches `Norte Torre`

## Performance

### Benchmarks
- **Small datasets** (< 100 properties): < 10ms
- **Medium datasets** (100-1000 properties): < 100ms  
- **Large datasets** (1000+ properties): < 1s

### Optimization Tips
1. Use `minConfidenceScore` to filter low-quality matches
2. Set appropriate `maxResults` to limit processing
3. Use batch operations for multiple queries
4. Consider caching results for repeated queries

## Integration with Existing Code

### Drop-in Replacement
Replace the existing `matchPropertyByAlias` function:

```typescript
// OLD
import { matchPropertyByAlias } from './matchPropertyByAlias';
const property = matchPropertyByAlias(searchTerm, properties);

// NEW (drop-in replacement)
import { matchPropertyByAliasEnhanced } from './enhancedPropertyMatcher';
const property = matchPropertyByAliasEnhanced(searchTerm, properties);
```

### Enhanced Usage
For more control and information:

```typescript
import { enhancedMatchProperty } from './enhancedPropertyMatcher';

const matches = enhancedMatchProperty(searchTerm, properties, {
  maxResults: 5,
  minConfidenceScore: 0.6
});

// Access detailed information
matches.forEach(match => {
  console.log(`Property: ${match.property.name}`);
  console.log(`Confidence: ${match.confidence}`);
  console.log(`Algorithm: ${match.matchDetails.bestMatch.algorithm}`);
  console.log(`Score: ${match.matchScore.toFixed(3)}`);
});
```

## Examples

See `stringMatchExamples.ts` for comprehensive usage examples including:
- Basic string matching
- Property name matching
- Advanced search with detailed results
- Bulk matching for import/export scenarios
- Data validation
- Custom matching options
- Performance benchmarks

## Testing

Run the comprehensive test suite:

```bash
npm test -- stringMatch.test.ts
```

The test suite includes:
- All algorithm implementations
- Portuguese language features
- Edge cases and error handling
- Performance tests
- Integration scenarios

## Files in This Module

- `stringMatch.ts` - Core string matching algorithms
- `enhancedPropertyMatcher.ts` - Property-specific matching utilities
- `stringMatch.test.ts` - Comprehensive test suite
- `stringMatchExamples.ts` - Usage examples and demos
- `integrationDemo.ts` - Integration with existing code
- `README.md` - This documentation

## License

Part of the MariaFaz property management system.
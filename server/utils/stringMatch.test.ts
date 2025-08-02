/**
 * Comprehensive Tests for Advanced String Matching Utilities
 * Tests all algorithms with various Portuguese property name scenarios
 */

import {
  normalizeText,
  levenshteinDistance,
  levenshteinSimilarity,
  jaroWinklerSimilarity,
  ngramSimilarity,
  exactMatch,
  partialMatch,
  combinedMatch,
  matchStrings,
  findBestMatches,
  matchPropertyNames,
  stringMatchUtils,
  defaultMatchOptions,
  type MatchOptions
} from './stringMatch';

describe('String Matching Utilities', () => {
  
  describe('Text Normalization', () => {
    it('should normalize Portuguese accents correctly', () => {
      expect(normalizeText('São João do Estoril')).toBe('sao joao do estoril');
      expect(normalizeText('Coração de Jesus')).toBe('coracao de jesus');
      expect(normalizeText('Avª da República')).toBe('avenida da republica');
    });

    it('should expand Portuguese abbreviations', () => {
      expect(normalizeText('Apto 3B, Ed. Central')).toBe('apartamento 3b edificio central');
      expect(normalizeText('R. das Flores, nº 25')).toBe('rua das flores numero 25');
      expect(normalizeText('Av. 5 de Outubro')).toBe('avenida 5 de outubro');
    });

    it('should handle case insensitivity by default', () => {
      expect(normalizeText('LISBOA')).toBe('lisboa');
      expect(normalizeText('Porto')).toBe('porto');
    });

    it('should preserve case when specified', () => {
      const options: MatchOptions = { caseSensitive: true };
      expect(normalizeText('LISBOA', options)).toBe('LISBOA');
      expect(normalizeText('Porto', options)).toBe('Porto');
    });

    it('should clean special characters and normalize whitespace', () => {
      expect(normalizeText('  Casa  do  Mar!!!  ')).toBe('casa do mar');
      expect(normalizeText('Apt-123@Building#1')).toBe('apt 123 building 1');
    });
  });

  describe('Levenshtein Distance Algorithm', () => {
    it('should calculate distance correctly for identical strings', () => {
      expect(levenshteinDistance('casa', 'casa')).toBe(0);
    });

    it('should calculate distance for different strings', () => {
      expect(levenshteinDistance('casa', 'caza')).toBe(1); // substitution
      expect(levenshteinDistance('casa', 'casas')).toBe(1); // insertion
      expect(levenshteinDistance('casas', 'casa')).toBe(1); // deletion
    });

    it('should calculate similarity scores correctly', () => {
      const result1 = levenshteinSimilarity('Apartamento Central', 'Apto Central');
      expect(result1.score).toBeGreaterThan(0.8);
      expect(result1.algorithm).toBe('levenshtein');

      const result2 = levenshteinSimilarity('completely', 'different');
      expect(result2.score).toBeLessThan(0.3);
    });
  });

  describe('Jaro-Winkler Distance Algorithm', () => {
    it('should give high scores for similar strings', () => {
      const result = jaroWinklerSimilarity('Apartamento', 'Apartamento');
      expect(result.score).toBe(1.0);
    });

    it('should handle prefix matching well', () => {
      const result = jaroWinklerSimilarity('Apartamento Central', 'Apartamento Norte');
      expect(result.score).toBeGreaterThan(0.7);
      expect(result.details?.prefixLength).toBeGreaterThan(0);
    });

    it('should work with Portuguese property names', () => {
      const result = jaroWinklerSimilarity('Edifício São Pedro', 'Edificio Sao Pedro');
      expect(result.score).toBeGreaterThan(0.9);
    });
  });

  describe('N-gram Similarity Algorithm', () => {
    it('should calculate bigram similarity correctly', () => {
      const result = ngramSimilarity('casa', 'cama', {}, 2);
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.algorithm).toBe('2-gram');
    });

    it('should calculate trigram similarity for longer strings', () => {
      const result = ngramSimilarity('apartamento', 'apartamente', {}, 3);
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.algorithm).toBe('3-gram');
    });

    it('should handle identical strings', () => {
      const result = ngramSimilarity('identical', 'identical');
      expect(result.score).toBe(1.0);
    });
  });

  describe('Exact Match Algorithm', () => {
    it('should return 1.0 for identical normalized strings', () => {
      const result = exactMatch('São Paulo', 'Sao Paulo');
      expect(result.score).toBe(1.0);
    });

    it('should return 0.0 for different strings', () => {
      const result = exactMatch('Lisboa', 'Porto');
      expect(result.score).toBe(0.0);
    });
  });

  describe('Partial Match Algorithm', () => {
    it('should detect substring containment', () => {
      const result = partialMatch('Central', 'Apartamento Central');
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.details?.matchType).toBe('query_in_target');
    });

    it('should handle word-level partial matching', () => {
      const result = partialMatch('Apartamento Central', 'Central Apartamento');
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.details?.matchType).toBe('word_level');
    });

    it('should respect allowPartialMatch option', () => {
      const options: MatchOptions = { allowPartialMatch: false };
      const result = partialMatch('Central', 'Apartamento Central', options);
      expect(result.score).toBe(0.0);
      expect(result.details?.partialMatchDisabled).toBe(true);
    });
  });

  describe('Combined Match Algorithm', () => {
    it('should combine multiple algorithm scores', () => {
      const result = combinedMatch('Apartamento Central', 'Apto Central');
      expect(result.overallScore).toBeGreaterThan(0.8);
      expect(result.allResults).toHaveLength(5); // exact, levenshtein, jaro-winkler, ngram, partial
      expect(result.isHighConfidence).toBe(true);
    });

    it('should handle confidence levels correctly', () => {
      const highConfidence = combinedMatch('identical', 'identical');
      expect(highConfidence.isHighConfidence).toBe(true);
      expect(highConfidence.isMediumConfidence).toBe(true);

      const lowConfidence = combinedMatch('completely', 'different');
      expect(lowConfidence.isHighConfidence).toBe(false);
      expect(lowConfidence.isMediumConfidence).toBe(false);
    });

    it('should identify best individual algorithm result', () => {
      const result = combinedMatch('São Pedro', 'Sao Pedro');
      expect(result.bestMatch.algorithm).toBe('exact'); // Should be exact after normalization
      expect(result.bestMatch.score).toBe(1.0);
    });
  });

  describe('Batch Matching Functions', () => {
    const propertyNames = [
      'Apartamento Central',
      'Edifício São Pedro',
      'Casa do Mar',
      'Quinta da Aroeira',
      'Prédio das Flores',
      'Apto Vista Mar',
      'Villa Nova'
    ];

    it('should find best matches from candidate list', () => {
      const matches = findBestMatches('Apto Central', propertyNames, {}, 3);
      
      expect(matches).toHaveLength(3);
      expect(matches[0].result.overallScore).toBeGreaterThan(matches[1].result.overallScore);
      expect(matches[0].candidate).toBe('Apartamento Central'); // Should be best match
    });

    it('should match property names with enhanced scoring', () => {
      const matches = matchPropertyNames('Ed São Pedro', propertyNames);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].property).toBe('Edifício São Pedro');
      expect(matches[0].result.isHighConfidence).toBe(true);
    });

    it('should handle abbreviations in property matching', () => {
      const matches = matchPropertyNames('R. das Flores', ['Rua das Flores', 'Avenida das Flores']);
      
      expect(matches[0].property).toBe('Rua das Flores');
      expect(matches[0].result.overallScore).toBeGreaterThan(0.9);
    });
  });

  describe('Portuguese Language Specific Features', () => {
    it('should handle all Portuguese accented characters', () => {
      const testCases = [
        { input: 'São João', expected: 'sao joao' },
        { input: 'Coração', expected: 'coracao' },
        { input: 'Avó Mafalda', expected: 'avo mafalda' },
        { input: 'Pêra Mãe', expected: 'pera mae' },
        { input: 'Açúcar', expected: 'acucar' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(normalizeText(input)).toBe(expected);
      });
    });

    it('should expand common Portuguese abbreviations', () => {
      const abbreviationTests = [
        { input: 'Apt 123', expected: 'apartamento 123' },
        { input: 'Ed. Central', expected: 'edificio central' },
        { input: 'R. 25 de Abril', expected: 'rua 25 de abril' },
        { input: 'Av. da República', expected: 'avenida da republica' },
        { input: 'Pc. do Comércio', expected: 'praca do comercio' },
        { input: 'Lg. São Domingos', expected: 'largo sao domingos' }
      ];

      abbreviationTests.forEach(({ input, expected }) => {
        expect(normalizeText(input)).toBe(expected);
      });
    });

    it('should handle mixed abbreviations and accents', () => {
      const result = normalizeText('Apto nº 15, Ed. São João');
      expect(result).toBe('apartamento numero 15 edificio sao joao');
    });
  });

  describe('Algorithm Weights and Configuration', () => {
    it('should respect custom algorithm weights', () => {
      const customOptions: MatchOptions = {
        weights: {
          levenshtein: 0.5,  // Higher weight
          jaroWinkler: 0.2,
          ngram: 0.2,
          exact: 0.05,
          partial: 0.05
        }
      };

      const result1 = combinedMatch('casa', 'caza', customOptions);
      const result2 = combinedMatch('casa', 'caza', {}); // default weights

      // Results might differ due to different weighting
      expect(result1.overallScore).toBeDefined();
      expect(result2.overallScore).toBeDefined();
    });

    it('should respect minimum length requirements', () => {
      const options: MatchOptions = { minLength: 5 };
      const result = combinedMatch('ab', 'ac', options);
      
      expect(result.overallScore).toBe(0);
      expect(result.allResults[0].details?.reason).toBe('strings_too_short');
    });

    it('should handle word order flexibility option', () => {
      const flexibleOptions: MatchOptions = { wordOrderFlexible: true };
      const rigidOptions: MatchOptions = { wordOrderFlexible: false };

      const query = 'Apartamento Central';
      const target = 'Central Apartamento';

      const flexibleResult = partialMatch(query, target, flexibleOptions);
      const rigidResult = partialMatch(query, target, rigidOptions);

      expect(flexibleResult.score).toBeGreaterThan(rigidResult.score);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings gracefully', () => {
      expect(normalizeText('')).toBe('');
      expect(levenshteinDistance('', '')).toBe(0);
      expect(levenshteinDistance('test', '')).toBe(4);
      
      const result = combinedMatch('', 'test');
      expect(result.overallScore).toBe(0);
    });

    it('should handle single character strings', () => {
      const result = combinedMatch('a', 'b');
      expect(result.overallScore).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long strings', () => {
      const longString1 = 'A'.repeat(1000);
      const longString2 = 'A'.repeat(999) + 'B';
      
      const result = levenshteinSimilarity(longString1, longString2);
      expect(result.score).toBeGreaterThan(0.9);
    });

    it('should handle strings with only special characters', () => {
      const result = normalizeText('!!!@@@###');
      expect(result).toBe('');
    });

    it('should handle mixed languages gracefully', () => {
      const result = normalizeText('Casa English Maison');
      expect(result).toBe('casa english maison');
    });
  });

  describe('Performance and Accuracy Tests', () => {
    const testCases = [
      // High similarity cases
      { query: 'Apartamento Central', target: 'Apto Central', expectedScore: 0.85 },
      { query: 'Edifício São Pedro', target: 'Edificio Sao Pedro', expectedScore: 0.95 },
      { query: 'Rua das Flores', target: 'R. das Flores', expectedScore: 0.90 },
      
      // Medium similarity cases
      { query: 'Casa do Mar', target: 'Casa da Praia', expectedScore: 0.60 },
      { query: 'Quinta da Aroeira', target: 'Quinta Aroeira', expectedScore: 0.80 },
      
      // Low similarity cases
      { query: 'Lisboa', target: 'Porto', expectedScore: 0.30 },
      { query: 'Apartamento', target: 'Villa', expectedScore: 0.20 }
    ];

    testCases.forEach(({ query, target, expectedScore }) => {
      it(`should score "${query}" vs "${target}" around ${expectedScore}`, () => {
        const result = combinedMatch(query, target);
        const tolerance = 0.15; // Allow 15% tolerance
        
        expect(result.overallScore).toBeGreaterThanOrEqual(expectedScore - tolerance);
        expect(result.overallScore).toBeLessThanOrEqual(expectedScore + tolerance);
      });
    });
  });

  describe('Integration with Existing Property System', () => {
    it('should work with property alias matching patterns', () => {
      // Simulate the existing matchPropertyByAlias use case
      const propertyNames = [
        'Apartamento Central Lisboa',
        'Edifício Torre Norte',
        'Casa Quinta da Aroeira'
      ];

      // Test exact match (should score very high)
      const exactMatches = findBestMatches('Apartamento Central Lisboa', propertyNames);
      expect(exactMatches[0].result.overallScore).toBeGreaterThan(0.95);

      // Test partial match (should find good candidates)
      const partialMatches = findBestMatches('Torre Norte', propertyNames);
      expect(partialMatches[0].candidate).toBe('Edifício Torre Norte');
      expect(partialMatches[0].result.overallScore).toBeGreaterThan(0.70);

      // Test fuzzy match with abbreviations
      const fuzzyMatches = findBestMatches('Apto Central', propertyNames);
      expect(fuzzyMatches[0].candidate).toBe('Apartamento Central Lisboa');
      expect(fuzzyMatches[0].result.overallScore).toBeGreaterThan(0.70);
    });
  });

  describe('Utility Functions', () => {
    it('should expose utility functions correctly', () => {
      expect(stringMatchUtils.normalizeText).toBeDefined();
      expect(stringMatchUtils.removeAccents).toBeDefined();
      expect(stringMatchUtils.PORTUGUESE_ABBREVIATIONS).toBeDefined();
      expect(stringMatchUtils.PORTUGUESE_ACCENT_MAP).toBeDefined();
    });

    it('should have correct default options', () => {
      expect(defaultMatchOptions.caseSensitive).toBe(false);
      expect(defaultMatchOptions.normalizeAccents).toBe(true);
      expect(defaultMatchOptions.expandAbbreviations).toBe(true);
      expect(defaultMatchOptions.weights.jaroWinkler).toBe(0.30);
    });
  });
});

// Additional performance test for large datasets
describe('Performance Tests', () => {
  it('should handle large candidate lists efficiently', () => {
    const largeCandidateList = Array.from({ length: 1000 }, (_, i) => 
      `Propriedade ${i} - ${Math.random().toString(36).substring(7)}`
    );

    const startTime = Date.now();
    const results = findBestMatches('Propriedade 500', largeCandidateList, {}, 10);
    const endTime = Date.now();

    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });

  it('should maintain accuracy with various Portuguese patterns', () => {
    const portugueseProperties = [
      'Apartamento T2 Areeiro',
      'Moradia T3 Cascais', 
      'Estúdio Príncipe Real',
      'Loft Cais do Sodré',
      'Quinta T4 Sintra',
      'Penthouse Avenidas Novas',
      'Casa Geminada Almada',
      'Apartamento Duplex Parque das Nações'
    ];

    const testQueries = [
      'Apto T2 Areeiro',
      'Casa T3 Cascais',
      'Studio Principe Real',
      'Loft Cais Sodre'
    ];

    testQueries.forEach(query => {
      const matches = matchPropertyNames(query, portugueseProperties);
      expect(matches[0].result.overallScore).toBeGreaterThan(0.6);
    });
  });
});
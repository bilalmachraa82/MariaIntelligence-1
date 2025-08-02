/**
 * Advanced String Matching Utilities for Property Name Comparison
 * 
 * This module provides multiple string matching algorithms specifically designed
 * for property name comparison with Portuguese language support.
 * 
 * Features:
 * - Levenshtein distance algorithm
 * - Jaro-Winkler distance for better name matching
 * - N-gram similarity algorithm
 * - Combined scoring system with confidence levels
 * - Portuguese language specific handling
 * - Accent normalization and abbreviation support
 * - Word order flexibility and partial matching
 */

// Type definitions
export interface MatchResult {
  score: number; // 0-1 confidence score
  algorithm: string;
  normalizedQuery: string;
  normalizedTarget: string;
  details?: Record<string, any>;
}

export interface CombinedMatchResult {
  overallScore: number; // 0-1 combined confidence
  bestMatch: MatchResult;
  allResults: MatchResult[];
  isHighConfidence: boolean; // score >= 0.8
  isMediumConfidence: boolean; // score >= 0.6
}

export interface MatchOptions {
  caseSensitive?: boolean;
  normalizeAccents?: boolean;
  expandAbbreviations?: boolean;
  allowPartialMatch?: boolean;
  wordOrderFlexible?: boolean;
  minLength?: number;
  weights?: AlgorithmWeights;
}

export interface AlgorithmWeights {
  levenshtein: number;
  jaroWinkler: number;
  ngram: number;
  exact: number;
  partial: number;
}

// Default configuration
const DEFAULT_OPTIONS: Required<MatchOptions> = {
  caseSensitive: false,
  normalizeAccents: true,
  expandAbbreviations: true,
  allowPartialMatch: true,
  wordOrderFlexible: true,
  minLength: 2,
  weights: {
    levenshtein: 0.25,
    jaroWinkler: 0.30,
    ngram: 0.25,
    exact: 0.15,
    partial: 0.05
  }
};

// Portuguese specific mappings
const PORTUGUESE_ACCENT_MAP: Record<string, string> = {
  'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c', 'ñ': 'n',
  'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
  'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
  'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
  'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
  'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
  'Ç': 'C', 'Ñ': 'N'
};

// Common Portuguese abbreviations for property names
const PORTUGUESE_ABBREVIATIONS: Record<string, string[]> = {
  // Building types
  'apt': ['apartamento', 'apto'],
  'apto': ['apartamento', 'apt'],
  'apartamento': ['apt', 'apto'],
  'ed': ['edificio', 'edifício'],
  'edificio': ['ed', 'edifício'],
  'edifício': ['ed', 'edificio'],
  'prd': ['predio', 'prédio'],
  'predio': ['prd', 'prédio'],
  'prédio': ['prd', 'predio'],
  
  // Locations
  'r': ['rua'],
  'rua': ['r'],
  'av': ['avenida'],
  'avenida': ['av'],
  'pc': ['praça', 'praca'],
  'praça': ['pc', 'praca'],
  'praca': ['pc', 'praça'],
  'lg': ['largo'],
  'largo': ['lg'],
  
  // Common words
  'nº': ['numero', 'número', 'n'],
  'numero': ['nº', 'número', 'n'],
  'número': ['nº', 'numero', 'n'],
  'n': ['nº', 'numero', 'número'],
  'st': ['santo', 'santa'],
  'santo': ['st'],
  'santa': ['st'],
  
  // Property features
  'wc': ['casa de banho', 'quarto de banho'],
  'qrt': ['quarto'],
  'quarto': ['qrt'],
  'slv': ['sala de visitas', 'sala'],
  'slj': ['sala de jantar'],
  'coz': ['cozinha'],
  'cozinha': ['coz']
};

/**
 * Normalize text for comparison
 */
export function normalizeText(text: string, options: MatchOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let normalized = text;

  // Convert to lowercase unless case sensitive
  if (!opts.caseSensitive) {
    normalized = normalized.toLowerCase();
  }

  // Remove accents if enabled
  if (opts.normalizeAccents) {
    normalized = removeAccents(normalized);
  }

  // Expand abbreviations if enabled
  if (opts.expandAbbreviations) {
    normalized = expandAbbreviations(normalized);
  }

  // Clean up whitespace and special characters
  normalized = normalized
    .replace(/[^\w\s]/g, ' ') // Replace non-word chars with spaces
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();

  return normalized;
}

/**
 * Remove Portuguese accents
 */
function removeAccents(text: string): string {
  return text.replace(/[àáâãäèéêëìíîïòóôõöùúûüçñ]/gi, char => 
    PORTUGUESE_ACCENT_MAP[char] || char
  );
}

/**
 * Expand Portuguese abbreviations
 */
function expandAbbreviations(text: string): string {
  const words = text.split(/\s+/);
  
  return words.map(word => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (PORTUGUESE_ABBREVIATIONS[cleanWord]) {
      // Return the first expansion (usually the full form)
      return PORTUGUESE_ABBREVIATIONS[cleanWord][0];
    }
    return word;
  }).join(' ');
}

/**
 * Levenshtein Distance Algorithm
 * Calculates the minimum number of single-character edits required
 * to change one string into another.
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );

  // Initialize first row and column
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  // Fill the matrix
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i] + 1,     // deletion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Levenshtein similarity score (0-1)
 */
export function levenshteinSimilarity(query: string, target: string, options: MatchOptions = {}): MatchResult {
  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  
  if (normalizedQuery === normalizedTarget) {
    return {
      score: 1.0,
      algorithm: 'levenshtein',
      normalizedQuery,
      normalizedTarget,
      details: { distance: 0, maxLength: Math.max(query.length, target.length) }
    };
  }

  const distance = levenshteinDistance(normalizedQuery, normalizedTarget);
  const maxLength = Math.max(normalizedQuery.length, normalizedTarget.length);
  const score = maxLength === 0 ? 0 : 1 - (distance / maxLength);

  return {
    score: Math.max(0, score),
    algorithm: 'levenshtein',
    normalizedQuery,
    normalizedTarget,
    details: { distance, maxLength }
  };
}

/**
 * Jaro Distance Algorithm
 * Measures similarity between two strings, giving more weight to common prefixes
 */
function jaroDistance(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0 || len2 === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const str1Matches = new Array(len1).fill(false);
  const str2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
}

/**
 * Jaro-Winkler Distance Algorithm
 * Extension of Jaro distance with prefix scaling
 */
export function jaroWinklerSimilarity(query: string, target: string, options: MatchOptions = {}): MatchResult {
  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  
  const jaroSim = jaroDistance(normalizedQuery, normalizedTarget);
  
  if (jaroSim < 0.7) {
    return {
      score: jaroSim,
      algorithm: 'jaro-winkler',
      normalizedQuery,
      normalizedTarget,
      details: { jaroScore: jaroSim, prefixLength: 0 }
    };
  }

  // Calculate common prefix length (up to 4 characters)
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(normalizedQuery.length, normalizedTarget.length));
  
  for (let i = 0; i < maxPrefix; i++) {
    if (normalizedQuery[i] === normalizedTarget[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  const jaroWinklerScore = jaroSim + (0.1 * prefixLength * (1 - jaroSim));

  return {
    score: Math.min(1.0, jaroWinklerScore),
    algorithm: 'jaro-winkler',
    normalizedQuery,
    normalizedTarget,
    details: { jaroScore: jaroSim, prefixLength }
  };
}

/**
 * N-gram Similarity Algorithm
 * Compares strings based on n-gram (typically bigram or trigram) overlap
 */
function createNGrams(text: string, n: number): string[] {
  if (text.length < n) return [text];
  
  const ngrams: string[] = [];
  for (let i = 0; i <= text.length - n; i++) {
    ngrams.push(text.slice(i, i + n));
  }
  return ngrams;
}

export function ngramSimilarity(query: string, target: string, options: MatchOptions = {}, n: number = 2): MatchResult {
  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  
  if (normalizedQuery === normalizedTarget) {
    return {
      score: 1.0,
      algorithm: `${n}-gram`,
      normalizedQuery,
      normalizedTarget,
      details: { ngramSize: n, overlap: 1.0 }
    };
  }

  const queryNgrams = createNGrams(normalizedQuery, n);
  const targetNgrams = createNGrams(normalizedTarget, n);
  
  if (queryNgrams.length === 0 || targetNgrams.length === 0) {
    return {
      score: 0,
      algorithm: `${n}-gram`,
      normalizedQuery,
      normalizedTarget,
      details: { ngramSize: n, overlap: 0 }
    };
  }

  // Calculate Jaccard similarity
  const querySet = new Set(queryNgrams);
  const targetSet = new Set(targetNgrams);
  
  const intersection = new Set([...querySet].filter(x => targetSet.has(x)));
  const union = new Set([...querySet, ...targetSet]);
  
  const jaccardSimilarity = intersection.size / union.size;
  
  // Also calculate weighted overlap based on frequency
  const queryFreq: Record<string, number> = {};
  const targetFreq: Record<string, number> = {};
  
  queryNgrams.forEach(ngram => queryFreq[ngram] = (queryFreq[ngram] || 0) + 1);
  targetNgrams.forEach(ngram => targetFreq[ngram] = (targetFreq[ngram] || 0) + 1);
  
  let overlapScore = 0;
  let totalWeight = 0;
  
  for (const ngram of intersection) {
    const weight = Math.min(queryFreq[ngram], targetFreq[ngram]);
    overlapScore += weight;
    totalWeight += Math.max(queryFreq[ngram], targetFreq[ngram]);
  }
  
  const weightedSimilarity = totalWeight > 0 ? overlapScore / totalWeight : 0;
  
  // Combine Jaccard and weighted similarity
  const combinedScore = (jaccardSimilarity + weightedSimilarity) / 2;

  return {
    score: combinedScore,
    algorithm: `${n}-gram`,
    normalizedQuery,
    normalizedTarget,
    details: { 
      ngramSize: n, 
      jaccardSimilarity, 
      weightedSimilarity, 
      overlap: combinedScore,
      intersectionSize: intersection.size,
      unionSize: union.size
    }
  };
}

/**
 * Exact match scoring
 */
export function exactMatch(query: string, target: string, options: MatchOptions = {}): MatchResult {
  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  
  const score = normalizedQuery === normalizedTarget ? 1.0 : 0.0;
  
  return {
    score,
    algorithm: 'exact',
    normalizedQuery,
    normalizedTarget,
    details: { isExactMatch: score === 1.0 }
  };
}

/**
 * Partial match scoring (substring containment)
 */
export function partialMatch(query: string, target: string, options: MatchOptions = {}): MatchResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!opts.allowPartialMatch) {
    return {
      score: 0,
      algorithm: 'partial',
      normalizedQuery: query,
      normalizedTarget: target,
      details: { partialMatchDisabled: true }
    };
  }

  const normalizedQuery = normalizeText(query, options);
  const normalizedTarget = normalizeText(target, options);
  
  if (normalizedQuery === normalizedTarget) {
    return {
      score: 1.0,
      algorithm: 'partial',
      normalizedQuery,
      normalizedTarget,
      details: { matchType: 'exact' }
    };
  }
  
  // Check if either string contains the other
  let score = 0;
  let matchType = 'none';
  
  if (normalizedTarget.includes(normalizedQuery)) {
    score = normalizedQuery.length / normalizedTarget.length;
    matchType = 'query_in_target';
  } else if (normalizedQuery.includes(normalizedTarget)) {
    score = normalizedTarget.length / normalizedQuery.length;
    matchType = 'target_in_query';
  }
  
  // Word-level partial matching for better results
  if (score === 0 && opts.wordOrderFlexible) {
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    const targetWords = normalizedTarget.split(/\s+/).filter(w => w.length > 0);
    
    let wordMatches = 0;
    let totalWords = Math.max(queryWords.length, targetWords.length);
    
    for (const queryWord of queryWords) {
      if (targetWords.some(targetWord => 
        targetWord.includes(queryWord) || queryWord.includes(targetWord)
      )) {
        wordMatches++;
      }
    }
    
    if (wordMatches > 0) {
      score = wordMatches / totalWords;
      matchType = 'word_level';
    }
  }

  return {
    score,
    algorithm: 'partial',
    normalizedQuery,
    normalizedTarget,
    details: { matchType, wordOrderFlexible: opts.wordOrderFlexible }
  };
}

/**
 * Combined scoring system that uses all algorithms
 */
export function combinedMatch(query: string, target: string, options: MatchOptions = {}): CombinedMatchResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Skip if strings are too short
  if (query.length < opts.minLength || target.length < opts.minLength) {
    const emptyResult: MatchResult = {
      score: 0,
      algorithm: 'combined',
      normalizedQuery: query,
      normalizedTarget: target,
      details: { reason: 'strings_too_short' }
    };
    
    return {
      overallScore: 0,
      bestMatch: emptyResult,
      allResults: [emptyResult],
      isHighConfidence: false,
      isMediumConfidence: false
    };
  }

  // Run all algorithms
  const results: MatchResult[] = [
    exactMatch(query, target, options),
    levenshteinSimilarity(query, target, options),
    jaroWinklerSimilarity(query, target, options),
    ngramSimilarity(query, target, options, 2), // bigrams
    partialMatch(query, target, options)
  ];

  // Add trigram analysis for longer strings
  if (Math.min(query.length, target.length) >= 3) {
    results.push(ngramSimilarity(query, target, options, 3));
  }

  // Calculate weighted score
  const weights = opts.weights!;
  let weightedScore = 0;
  let totalWeight = 0;

  results.forEach(result => {
    let weight = 0;
    switch (result.algorithm) {
      case 'exact':
        weight = weights.exact;
        break;
      case 'levenshtein':
        weight = weights.levenshtein;
        break;
      case 'jaro-winkler':
        weight = weights.jaroWinkler;
        break;
      case '2-gram':
      case '3-gram':
        weight = weights.ngram / 2; // Split weight between bigrams and trigrams
        break;
      case 'partial':
        weight = weights.partial;
        break;
      default:
        weight = 0.1;
    }
    
    weightedScore += result.score * weight;
    totalWeight += weight;
  });

  const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  
  // Find best individual result
  const bestMatch = results.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  return {
    overallScore: Math.max(0, Math.min(1, overallScore)),
    bestMatch,
    allResults: results,
    isHighConfidence: overallScore >= 0.8,
    isMediumConfidence: overallScore >= 0.6
  };
}

/**
 * Main string matching function - convenience wrapper
 */
export function matchStrings(query: string, target: string, options: MatchOptions = {}): CombinedMatchResult {
  return combinedMatch(query, target, options);
}

/**
 * Batch matching - find best matches from a list of candidates
 */
export function findBestMatches(
  query: string, 
  candidates: string[], 
  options: MatchOptions = {},
  maxResults: number = 5
): Array<{ candidate: string; result: CombinedMatchResult; index: number }> {
  
  const matches = candidates.map((candidate, index) => ({
    candidate,
    result: combinedMatch(query, candidate, options),
    index
  }));

  // Sort by overall score (descending)
  matches.sort((a, b) => b.result.overallScore - a.result.overallScore);

  // Return top matches
  return matches.slice(0, maxResults);
}

/**
 * Property-specific matching with enhanced scoring
 */
export function matchPropertyNames(
  queryProperty: string, 
  candidateProperties: string[], 
  options: MatchOptions = {}
): Array<{ property: string; result: CombinedMatchResult; index: number }> {
  
  // Enhanced options for property matching
  const propertyOptions: MatchOptions = {
    caseSensitive: false,
    normalizeAccents: true,
    expandAbbreviations: true,
    allowPartialMatch: true,
    wordOrderFlexible: true,
    minLength: 1, // Properties can be very short
    weights: {
      levenshtein: 0.20,
      jaroWinkler: 0.35, // Higher weight for property name similarities
      ngram: 0.25,
      exact: 0.15,
      partial: 0.05
    },
    ...options
  };

  return findBestMatches(queryProperty, candidateProperties, propertyOptions, 10)
    .map(match => ({
      property: match.candidate,
      result: match.result,
      index: match.index
    }));
}

// Export utility functions
export const stringMatchUtils = {
  normalizeText,
  removeAccents,
  expandAbbreviations,
  levenshteinDistance,
  createNGrams,
  PORTUGUESE_ABBREVIATIONS,
  PORTUGUESE_ACCENT_MAP,
  DEFAULT_OPTIONS
};

// Export default configuration
export { DEFAULT_OPTIONS as defaultMatchOptions };
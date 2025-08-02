/**
 * Enhanced Property Matcher using Advanced String Matching Algorithms
 * 
 * This module extends the existing matchPropertyByAlias functionality with
 * advanced string matching algorithms for better accuracy and Portuguese
 * language support.
 */

import { Property } from '../../shared/schema';
import { 
  matchPropertyNames, 
  combinedMatch, 
  type MatchOptions, 
  type CombinedMatchResult 
} from './stringMatch';

// Enhanced result type that includes matching details
export interface EnhancedPropertyMatch {
  property: Property;
  matchScore: number;
  matchDetails: CombinedMatchResult;
  matchedField: 'name' | 'alias';
  matchedValue: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PropertyMatchOptions extends MatchOptions {
  minConfidenceScore?: number;
  maxResults?: number;
  includePartialMatches?: boolean;
  preferExactMatches?: boolean;
  aliasWeight?: number; // Weight for alias matches vs name matches
}

// Default options for property matching
const DEFAULT_PROPERTY_OPTIONS: Required<PropertyMatchOptions> = {
  caseSensitive: false,
  normalizeAccents: true,
  expandAbbreviations: true,
  allowPartialMatch: true,
  wordOrderFlexible: true,
  minLength: 1,
  weights: {
    levenshtein: 0.20,
    jaroWinkler: 0.35, // Higher weight for property names
    ngram: 0.25,
    exact: 0.15,
    partial: 0.05
  },
  minConfidenceScore: 0.3,
  maxResults: 5,
  includePartialMatches: true,
  preferExactMatches: true,
  aliasWeight: 0.9 // Slightly lower weight for alias matches
};

/**
 * Enhanced property matching with advanced algorithms
 * @param propertyName Name of the property to search for
 * @param properties List of properties to search in
 * @param options Matching options
 * @returns Array of enhanced property matches sorted by score
 */
export function enhancedMatchProperty(
  propertyName: string,
  properties: Property[],
  options: PropertyMatchOptions = {}
): EnhancedPropertyMatch[] {
  if (!propertyName || !properties || properties.length === 0) {
    return [];
  }

  const opts = { ...DEFAULT_PROPERTY_OPTIONS, ...options };
  const results: EnhancedPropertyMatch[] = [];

  // Match against property names
  const nameMatches = matchPropertyNames(
    propertyName,
    properties.map(p => p.name),
    opts,
    properties.length
  );

  nameMatches.forEach(match => {
    const property = properties[match.index];
    if (match.result.overallScore >= opts.minConfidenceScore) {
      results.push({
        property,
        matchScore: match.result.overallScore,
        matchDetails: match.result,
        matchedField: 'name',
        matchedValue: property.name,
        confidence: getConfidenceLevel(match.result.overallScore)
      });
    }
  });

  // Match against aliases if they exist
  properties.forEach(property => {
    if (property.aliases && Array.isArray(property.aliases)) {
      const aliasMatches = matchPropertyNames(
        propertyName,
        property.aliases,
        opts,
        property.aliases.length
      );

      aliasMatches.forEach(aliasMatch => {
        if (aliasMatch.result.overallScore >= opts.minConfidenceScore) {
          // Apply alias weight
          const adjustedScore = aliasMatch.result.overallScore * opts.aliasWeight;
          
          results.push({
            property,
            matchScore: adjustedScore,
            matchDetails: {
              ...aliasMatch.result,
              overallScore: adjustedScore
            },
            matchedField: 'alias',
            matchedValue: aliasMatch.property,
            confidence: getConfidenceLevel(adjustedScore)
          });
        }
      });
    }
  });

  // Remove duplicates (same property matched by both name and alias)
  const uniqueResults = removeDuplicateProperties(results, opts.preferExactMatches);

  // Sort by match score (descending)
  uniqueResults.sort((a, b) => b.matchScore - a.matchScore);

  // Return top results
  return uniqueResults.slice(0, opts.maxResults);
}

/**
 * Find the best single property match (backward compatibility)
 * @param propertyName Name of the property to search for
 * @param properties List of properties to search in
 * @param options Matching options
 * @returns Best matching property or undefined
 */
export function findBestPropertyMatch(
  propertyName: string,
  properties: Property[],
  options: PropertyMatchOptions = {}
): Property | undefined {
  const matches = enhancedMatchProperty(propertyName, properties, { ...options, maxResults: 1 });
  return matches.length > 0 ? matches[0].property : undefined;
}

/**
 * Backward compatible wrapper for existing matchPropertyByAlias
 * @param propertyName Name of the property to search for
 * @param properties List of properties to search in
 * @returns Property found or undefined
 */
export function matchPropertyByAliasEnhanced(
  propertyName: string,
  properties: Property[]
): Property | undefined {
  return findBestPropertyMatch(propertyName, properties, {
    minConfidenceScore: 0.5, // Higher threshold for backward compatibility
    preferExactMatches: true
  });
}

/**
 * Advanced property search with detailed results
 * @param query Search query
 * @param properties List of properties to search in
 * @param options Search options
 * @returns Detailed search results with explanations
 */
export function searchProperties(
  query: string,
  properties: Property[],
  options: PropertyMatchOptions = {}
): {
  totalResults: number;
  highConfidenceMatches: EnhancedPropertyMatch[];
  mediumConfidenceMatches: EnhancedPropertyMatch[];
  lowConfidenceMatches: EnhancedPropertyMatch[];
  searchQuery: string;
  normalizedQuery: string;
  options: PropertyMatchOptions;
} {
  const opts = { ...DEFAULT_PROPERTY_OPTIONS, ...options, maxResults: properties.length };
  const allMatches = enhancedMatchProperty(query, properties, opts);
  
  // Group by confidence level
  const highConfidenceMatches = allMatches.filter(m => m.confidence === 'high');
  const mediumConfidenceMatches = allMatches.filter(m => m.confidence === 'medium');
  const lowConfidenceMatches = allMatches.filter(m => m.confidence === 'low');

  return {
    totalResults: allMatches.length,
    highConfidenceMatches,
    mediumConfidenceMatches,
    lowConfidenceMatches,
    searchQuery: query,
    normalizedQuery: allMatches[0]?.matchDetails.bestMatch.normalizedQuery || '',
    options: opts
  };
}

/**
 * Bulk property matching for multiple queries
 * @param queries Array of property names to search for
 * @param properties List of properties to search in
 * @param options Matching options
 * @returns Map of query to best matches
 */
export function bulkMatchProperties(
  queries: string[],
  properties: Property[],
  options: PropertyMatchOptions = {}
): Map<string, EnhancedPropertyMatch[]> {
  const results = new Map<string, EnhancedPropertyMatch[]>();
  
  queries.forEach(query => {
    const matches = enhancedMatchProperty(query, properties, options);
    results.set(query, matches);
  });

  return results;
}

/**
 * Get confidence level based on score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

/**
 * Remove duplicate properties, keeping the best match for each
 */
function removeDuplicateProperties(
  results: EnhancedPropertyMatch[],
  preferExactMatches: boolean
): EnhancedPropertyMatch[] {
  const propertyMap = new Map<string, EnhancedPropertyMatch>();

  results.forEach(result => {
    const propertyId = result.property.id || result.property.name;
    const existing = propertyMap.get(propertyId);

    if (!existing) {
      propertyMap.set(propertyId, result);
    } else {
      // Keep the better match
      let shouldReplace = result.matchScore > existing.matchScore;

      // If scores are very close, prefer exact matches and name matches
      if (Math.abs(result.matchScore - existing.matchScore) < 0.05) {
        if (preferExactMatches) {
          if (result.matchDetails.bestMatch.algorithm === 'exact' && 
              existing.matchDetails.bestMatch.algorithm !== 'exact') {
            shouldReplace = true;
          } else if (result.matchedField === 'name' && existing.matchedField === 'alias') {
            shouldReplace = true;
          }
        }
      }

      if (shouldReplace) {
        propertyMap.set(propertyId, result);
      }
    }
  });

  return Array.from(propertyMap.values());
}

/**
 * Validate property names for potential matching issues
 * @param properties List of properties to validate
 * @returns Validation report
 */
export function validatePropertyNames(properties: Property[]): {
  potentialDuplicates: Array<{ property1: Property; property2: Property; similarity: number }>;
  missingAliases: Property[];
  suspiciousNames: Property[];
  recommendations: string[];
} {
  const potentialDuplicates: Array<{ property1: Property; property2: Property; similarity: number }> = [];
  const missingAliases: Property[] = [];
  const suspiciousNames: Property[] = [];
  const recommendations: string[] = [];

  // Check for potential duplicates
  for (let i = 0; i < properties.length; i++) {
    for (let j = i + 1; j < properties.length; j++) {
      const prop1 = properties[i];
      const prop2 = properties[j];
      
      const similarity = combinedMatch(prop1.name, prop2.name);
      
      if (similarity.overallScore > 0.8 && prop1.id !== prop2.id) {
        potentialDuplicates.push({
          property1: prop1,
          property2: prop2,
          similarity: similarity.overallScore
        });
      }
    }
  }

  // Check for missing aliases and suspicious names
  properties.forEach(property => {
    // Properties with no aliases might need some
    if (!property.aliases || property.aliases.length === 0) {
      missingAliases.push(property);
    }

    // Very short or very long names might be problematic
    if (property.name.length < 3 || property.name.length > 100) {
      suspiciousNames.push(property);
    }
  });

  // Generate recommendations
  if (potentialDuplicates.length > 0) {
    recommendations.push(`Found ${potentialDuplicates.length} potential duplicate properties. Consider reviewing and merging if appropriate.`);
  }

  if (missingAliases.length > 0) {
    recommendations.push(`${missingAliases.length} properties have no aliases. Consider adding common abbreviations or alternative names.`);
  }

  if (suspiciousNames.length > 0) {
    recommendations.push(`${suspiciousNames.length} properties have unusual name lengths. Review for data quality issues.`);
  }

  return {
    potentialDuplicates,
    missingAliases,
    suspiciousNames,
    recommendations
  };
}

// Export utility functions for backward compatibility and testing
export const propertyMatchUtils = {
  getConfidenceLevel,
  removeDuplicateProperties,
  DEFAULT_PROPERTY_OPTIONS
};

// Export types
export type {
  PropertyMatchOptions,
  EnhancedPropertyMatch
};
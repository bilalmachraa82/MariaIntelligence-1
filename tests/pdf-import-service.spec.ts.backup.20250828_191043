/**
 * Comprehensive test suite for PDF Import Service
 * Tests all major functionality including property matching, fuzzy algorithms, and batch processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PDFImportService, pdfImportService } from '../server/services/pdfImportService';
import { Property } from '../shared/schema';

// Mock dependencies
vi.mock('../server/services/ai-adapter.service', () => ({
  aiService: {
    extractTextFromPDF: vi.fn(),
    processReservationDocument: vi.fn(),
  }
}));

vi.mock('../server/db/index', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  }
}));

vi.mock('../server/utils/matchPropertyByAlias', () => ({
  matchPropertyByAlias: vi.fn()
}));

describe('PDFImportService', () => {
  let service: PDFImportService;
  let mockProperties: Property[];

  beforeEach(() => {
    service = PDFImportService.getInstance();
    
    // Setup mock properties
    mockProperties = [
      {
        id: 1,
        name: 'EXCITING LISBON 5 DE OUTUBRO',
        aliases: ['5 de Outubro', 'Excitement Lisbon'],
        ownerId: 1,
        cleaningCost: '50',
        checkInFee: '20',
        commission: '15',
        teamPayment: '30',
        cleaningTeam: 'Team A',
        cleaningTeamId: 1,
        monthlyFixedCost: '100',
        active: true
      },
      {
        id: 2,
        name: 'Aroeira Apartment T2',
        aliases: ['Aroeira T2', 'Aroeira II'],
        ownerId: 1,
        cleaningCost: '60',
        checkInFee: '25',
        commission: '18',
        teamPayment: '35',
        cleaningTeam: 'Team B',
        cleaningTeamId: 2,
        monthlyFixedCost: '120',
        active: true
      },
      {
        id: 3,
        name: 'Casa dos Barcos T1',
        aliases: ['Barcos T1', 'Casa Barcos'],
        ownerId: 2,
        cleaningCost: '45',
        checkInFee: '15',
        commission: '12',
        teamPayment: '25',
        cleaningTeam: 'Team A',
        cleaningTeamId: 1,
        monthlyFixedCost: '90',
        active: true
      }
    ];

    // Mock database queries
    const { db } = require('../server/db/index');
    db.select.mockReturnValue(mockProperties);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property Name Normalization', () => {
    it('should normalize property names correctly', () => {
      const testCases = [
        {
          input: 'EXCITING LISBON 5 DE OUTUBRO',
          expected: 'exciting lisbon 5 de outubro'
        },
        {
          input: 'Aroeira Apt. T2',
          expected: 'aroeira apartment t2'
        },
        {
          input: 'Casa dos Barços (T1)',
          expected: 'casa dos barcos t1'
        },
        {
          input: 'R. da Praia, 123',
          expected: 'rua da praca 123'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        // Access private method via type assertion for testing
        const normalizedName = (service as any).normalizePropertyName(input);
        expect(normalizedName).toBe(expected);
      });
    });

    it('should handle empty and null inputs', () => {
      const normalizeMethod = (service as any).normalizePropertyName;
      
      expect(normalizeMethod('')).toBe('');
      expect(normalizeMethod(null)).toBe('');
      expect(normalizeMethod(undefined)).toBe('');
    });
  });

  describe('Fuzzy Matching Algorithms', () => {
    beforeEach(async () => {
      // Setup property cache
      await (service as any).updatePropertyCache();
      (service as any).propertiesList = mockProperties;
    });

    it('should calculate Levenshtein distance correctly', () => {
      const levenshteinMethod = (service as any).levenshteinDistance;
      
      expect(levenshteinMethod('', '')).toBe(0);
      expect(levenshteinMethod('abc', 'abc')).toBe(0);
      expect(levenshteinMethod('abc', 'ab')).toBe(1);
      expect(levenshteinMethod('abc', 'def')).toBe(3);
      expect(levenshteinMethod('kitten', 'sitting')).toBe(3);
    });

    it('should calculate fuzzy scores accurately', () => {
      const calculateFuzzyScore = (service as any).calculateFuzzyScore;
      
      // Exact match should return 1.0
      const exactScore = calculateFuzzyScore('exciting lisbon 5 de outubro', mockProperties[0]);
      expect(exactScore).toBe(1.0);

      // Alias match should return high score
      const aliasScore = calculateFuzzyScore('5 de outubro', mockProperties[0]);
      expect(aliasScore).toBeGreaterThan(0.9);

      // Partial match should return moderate score
      const partialScore = calculateFuzzyScore('exciting lisbon', mockProperties[0]);
      expect(partialScore).toBeGreaterThan(0.5);
      expect(partialScore).toBeLessThan(0.9);

      // No match should return low score
      const noMatchScore = calculateFuzzyScore('completely different name', mockProperties[0]);
      expect(noMatchScore).toBeLessThan(0.3);
    });

    it('should handle token-based matching', () => {
      const calculateTokenScore = (service as any).calculateTokenScore;
      
      // Same tokens should return 1.0
      expect(calculateTokenScore('casa dos barcos', 'casa dos barcos')).toBe(1.0);
      
      // Partial token overlap should return appropriate score
      const partialScore = calculateTokenScore('casa barcos', 'casa dos barcos');
      expect(partialScore).toBeGreaterThan(0.5);
      expect(partialScore).toBeLessThan(1.0);
      
      // No token overlap should return 0
      expect(calculateTokenScore('completely different', 'casa dos barcos')).toBe(0);
    });
  });

  describe('Property Matching', () => {
    beforeEach(async () => {
      await (service as any).updatePropertyCache();
      (service as any).propertiesList = mockProperties;
    });

    it('should find exact property matches', async () => {
      const result = await (service as any).findPropertyMatch('EXCITING LISBON 5 DE OUTUBRO', 0.7);
      
      expect(result.property).toBeTruthy();
      expect(result.property?.id).toBe(1);
      expect(result.matchScore).toBe(1.0);
      expect(result.matchType).toBe('exact');
    });

    it('should find alias matches', async () => {
      const result = await (service as any).findPropertyMatch('5 de Outubro', 0.7);
      
      expect(result.property).toBeTruthy();
      expect(result.property?.id).toBe(1);
      expect(result.matchScore).toBeGreaterThan(0.9);
    });

    it('should provide suggestions for partial matches', async () => {
      const result = await (service as any).findPropertyMatch('Exciting Lisbon', 0.9);
      
      expect(result.suggestions).toBeTruthy();
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].property.id).toBe(1);
    });

    it('should handle unmatched properties', async () => {
      const result = await (service as any).findPropertyMatch('Non-existent Property', 0.7);
      
      expect(result.property).toBeNull();
      expect(result.matchType).toBe('none');
      expect(result.matchScore).toBe(0);
    });

    it('should cache property matches', async () => {
      const propertyName = 'Test Property';
      
      // First call
      await (service as any).findPropertyMatch(propertyName, 0.7);
      
      // Second call should use cache
      const result = await (service as any).findPropertyMatch(propertyName, 0.7);
      
      expect(result).toBeTruthy();
      // Verify cache was used (you could add cache hit counters for more detailed testing)
    });
  });

  describe('Date Normalization', () => {
    it('should normalize various date formats', () => {
      const normalizeDateMethod = (service as any).normalizeDate;
      
      const testCases = [
        { input: '2025-01-15', expected: '2025-01-15' },
        { input: '15/01/2025', expected: '2025-01-15' },
        { input: '15-01-2025', expected: '2025-01-15' },
        { input: '15/01/25', expected: '2025-01-15' },
        { input: '15 Jan 2025', expected: '2025-01-15' },
        { input: '15 January 2025', expected: '2025-01-15' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeDateMethod(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle invalid dates gracefully', () => {
      const normalizeDateMethod = (service as any).normalizeDate;
      
      expect(normalizeDateMethod('')).toBe('');
      expect(normalizeDateMethod('invalid date')).toBe('');
      expect(normalizeDateMethod('32/13/2025')).toBe('');
    });
  });

  describe('Platform Detection', () => {
    it('should detect Booking.com platform', () => {
      const detectPlatformMethod = (service as any).detectPlatform;
      
      const bookingText = `
        Your booking confirmation
        Booking.com
        Confirmation number: 12345
        Genius Level 2
      `;
      
      expect(detectPlatformMethod(bookingText)).toBe('booking');
    });

    it('should detect Airbnb platform', () => {
      const detectPlatformMethod = (service as any).detectPlatform;
      
      const airbnbText = `
        Your Airbnb reservation
        Itinerary for your trip
        Reservation code: ABC123
      `;
      
      expect(detectPlatformMethod(airbnbText)).toBe('airbnb');
    });

    it('should return null for unknown platforms', () => {
      const detectPlatformMethod = (service as any).detectPlatform;
      
      const unknownText = `
        Some generic reservation text
        Property: Test Property
        Guest: John Doe
      `;
      
      expect(detectPlatformMethod(unknownText)).toBeNull();
    });
  });

  describe('Property Suggestions', () => {
    beforeEach(async () => {
      await (service as any).updatePropertyCache();
      (service as any).propertiesList = mockProperties;
    });

    it('should provide relevant property suggestions', async () => {
      const suggestions = await service.getPropertySuggestions('Exciting Lisboa', 3);
      
      expect(suggestions).toBeTruthy();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(3);
      expect(suggestions[0].property.id).toBe(1); // Should suggest the Lisbon property
    });

    it('should limit suggestions to requested number', async () => {
      const suggestions = await service.getPropertySuggestions('Casa', 2);
      
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it('should sort suggestions by score', async () => {
      const suggestions = await service.getPropertySuggestions('Casa', 5);
      
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
      }
    });
  });

  describe('Learning from Matches', () => {
    beforeEach(async () => {
      await (service as any).updatePropertyCache();
      (service as any).propertiesList = mockProperties;
    });

    it('should learn from high-confidence matches', async () => {
      const { db } = require('../server/db/index');
      
      await service.learnFromMatch('New Alias for Lisbon', mockProperties[0], 0.8);
      
      // Verify that update was called
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalled();
    });

    it('should not learn from low-confidence matches', async () => {
      const { db } = require('../server/db/index');
      
      await service.learnFromMatch('Probably Wrong Match', mockProperties[0], 0.5);
      
      // Verify that update was not called
      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe('Pattern Extraction', () => {
    it('should extract reservation data using patterns', async () => {
      const extractWithPatternsMethod = (service as any).extractWithPatterns;
      
      const testText = `
        Property: EXCITING LISBON 5 DE OUTUBRO
        Guest: John Doe
        Check-in: 15/01/2025
        Check-out: 20/01/2025
        Guests: 2
      `;
      
      const propertyPatterns = [/Property:\s*(.+?)(?:\n|$)/i];
      const result = extractWithPatternsMethod(testText, propertyPatterns);
      
      expect(result).toBe('EXCITING LISBON 5 DE OUTUBRO');
    });

    it('should handle missing patterns gracefully', async () => {
      const extractWithPatternsMethod = (service as any).extractWithPatterns;
      
      const testText = 'No matching patterns here';
      const patterns = [/Property:\s*(.+?)(?:\n|$)/i];
      
      expect(extractWithPatternsMethod(testText, patterns)).toBe('');
    });
  });

  describe('Report Generation', () => {
    it('should generate accurate import reports', () => {
      const generateImportReportMethod = (service as any).generateImportReport;
      
      const mockReservations = [
        { status: 'matched', confidence: 0.9 },
        { status: 'matched', confidence: 0.8 },
        { status: 'suggested', confidence: 0.6 },
        { status: 'unmatched', confidence: 0.2 },
      ].map(data => ({
        ...data,
        propertyMatch: { originalName: `Property ${Math.random()}` }
      }));
      
      const report = generateImportReportMethod(mockReservations, 5000);
      
      expect(report.totalReservations).toBe(4);
      expect(report.matchedReservations).toBe(2);
      expect(report.suggestedReservations).toBe(1);
      expect(report.unmatchedReservations).toBe(1);
      expect(report.processingTime).toBe(5000);
      expect(report.confidenceDistribution.high).toBe(2);
      expect(report.confidenceDistribution.medium).toBe(1);
      expect(report.confidenceDistribution.low).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      const { aiService } = require('../server/services/ai-adapter.service');
      
      // Mock AI service responses
      aiService.extractTextFromPDF.mockResolvedValue(`
        EXCITING LISBON 5 DE OUTUBRO
        Guest: João Silva
        Check-in: 15/01/2025
        Check-out: 20/01/2025
        Guests: 2 adults
        Booking reference: BK123456
      `);
      
      aiService.processReservationDocument.mockResolvedValue({
        success: true,
        data: {
          propertyName: 'EXCITING LISBON 5 DE OUTUBRO',
          guestName: 'João Silva',
          checkInDate: '2025-01-15',
          checkOutDate: '2025-01-20',
          totalGuests: 2,
          bookingReference: 'BK123456'
        }
      });
    });

    it('should process PDF files end-to-end', async () => {
      await (service as any).updatePropertyCache();
      (service as any).propertiesList = mockProperties;
      
      const pdfFiles = [
        {
          content: 'base64-encoded-pdf-content',
          filename: 'reservation1.pdf'
        }
      ];
      
      const result = await service.importFromPDFs(pdfFiles);
      
      expect(result.success).toBe(true);
      expect(result.reservations.length).toBeGreaterThan(0);
      expect(result.report).toBeTruthy();
      expect(result.report.totalReservations).toBeGreaterThan(0);
    });

    it('should handle batch processing', async () => {
      await (service as any).updatePropertyCache();
      (service as any).propertiesList = mockProperties;
      
      const pdfFiles = Array.from({ length: 15 }, (_, i) => ({
        content: `base64-content-${i}`,
        filename: `reservation${i}.pdf`
      }));
      
      const result = await service.importFromPDFs(pdfFiles, { batchSize: 5 });
      
      expect(result.success).toBe(true);
      expect(result.reservations.length).toBe(15);
    });

    it('should handle errors gracefully', async () => {
      const { aiService } = require('../server/services/ai-adapter.service');
      aiService.extractTextFromPDF.mockRejectedValue(new Error('PDF extraction failed'));
      
      const pdfFiles = [
        {
          content: 'invalid-base64-content',
          filename: 'invalid.pdf'
        }
      ];
      
      const result = await service.importFromPDFs(pdfFiles);
      
      expect(result.success).toBe(true); // Should still succeed overall
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence Scoring', () => {
    beforeEach(async () => {
      await (service as any).updatePropertyCache();
      (service as any).propertiesList = mockProperties;
    });

    it('should assign appropriate confidence scores', async () => {
      const testCases = [
        { input: 'EXCITING LISBON 5 DE OUTUBRO', expected: 1.0 },
        { input: '5 de Outubro', expected: 0.95 },
        { input: 'Exciting Lisbon', expected: 0.6 },
        { input: 'Random Property Name', expected: 0.0 }
      ];

      for (const { input, expected } of testCases) {
        const result = await (service as any).findPropertyMatch(input, 0.0);
        expect(result.matchScore).toBeCloseTo(expected, 1);
      }
    });

    it('should handle confidence thresholds correctly', async () => {
      const match = await (service as any).findPropertyMatch('Exciting Lisbon', 0.8);
      const status = (service as any).determineMatchStatus(match, 0.8);
      
      if (match.matchScore >= 0.8) {
        expect(status).toBe('matched');
      } else if (match.matchScore >= 0.4) {
        expect(status).toBe('suggested');
      } else {
        expect(status).toBe('unmatched');
      }
    });
  });
});

describe('Performance Tests', () => {
  let service: PDFImportService;

  beforeEach(() => {
    service = PDFImportService.getInstance();
  });

  it('should handle large property lists efficiently', async () => {
    // Create a large mock property list
    const largePropertyList = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Property ${i + 1}`,
      aliases: [`Alias ${i + 1}A`, `Alias ${i + 1}B`],
      ownerId: 1,
      cleaningCost: '50',
      checkInFee: '20',
      commission: '15',
      teamPayment: '30',
      cleaningTeam: 'Team A',
      cleaningTeamId: 1,
      monthlyFixedCost: '100',
      active: true
    }));

    (service as any).propertiesList = largePropertyList;
    
    const startTime = Date.now();
    await (service as any).findPropertyMatch('Property 500', 0.7);
    const endTime = Date.now();
    
    // Should complete within reasonable time (less than 1 second)
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it('should cache property matches for performance', async () => {
    (service as any).propertiesList = [
      {
        id: 1,
        name: 'Test Property',
        aliases: [],
        ownerId: 1,
        cleaningCost: '50',
        checkInFee: '20',
        commission: '15',
        teamPayment: '30',
        cleaningTeam: 'Team A',
        cleaningTeamId: 1,
        monthlyFixedCost: '100',
        active: true
      }
    ];

    const propertyName = 'Test Property';
    
    // First call - should compute and cache
    const startTime1 = Date.now();
    await (service as any).findPropertyMatch(propertyName, 0.7);
    const endTime1 = Date.now();
    
    // Second call - should use cache
    const startTime2 = Date.now();
    await (service as any).findPropertyMatch(propertyName, 0.7);
    const endTime2 = Date.now();
    
    // Cached call should be faster
    expect(endTime2 - startTime2).toBeLessThan(endTime1 - startTime1);
  });
});
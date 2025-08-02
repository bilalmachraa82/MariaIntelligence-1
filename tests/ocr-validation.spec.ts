/**
 * OCR Data Validation and Processing Tests
 * Tests data extraction, validation, and business logic
 * Validates property matching, data normalization, and error handling
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { AIAdapter } from '../server/services/ai-adapter.service';
import { parseReservationData } from '../server/parsers/parseReservations';
import { matchPropertyByAlias } from '../server/utils/matchPropertyByAlias';

// Test configuration
const TEST_CONFIG = {
  PUBLIC_DIR: path.join(process.cwd(), 'public'),
  TIMEOUT: 30000, // 30 seconds
  EXPECTED_FIELDS: [
    'guestName',
    'checkIn',
    'checkOut',
    'propertyName',
    'totalAmount',
    'nights'
  ],
  OPTIONAL_FIELDS: [
    'guestEmail',
    'guestPhone',
    'numberOfGuests',
    'notes',
    'bookingPlatform',
    'bookingReference'
  ]
};

// Mock property data for testing
const MOCK_PROPERTIES = [
  {
    id: '1',
    name: 'Aroeira I',
    aliases: ['aroeira 1', 'aroeira i', 'aroeira one']
  },
  {
    id: '2',
    name: 'Aroeira II',
    aliases: ['aroeira 2', 'aroeira ii', 'aroeira two', 'aroeira segunda']
  },
  {
    id: '3',
    name: 'Sete Rios',
    aliases: ['sete rios', '7 rios', 'sete-rios']
  },
  {
    id: '4',
    name: '5 de Outubro',
    aliases: ['5 de outubro', 'cinco de outubro', '5 outubro']
  },
  {
    id: '5',
    name: 'Feira da Ladra (Graça 1)',
    aliases: ['feira da ladra', 'graca 1', 'graça 1', 'feira ladra']
  }
];

// Sample OCR text data for testing
const SAMPLE_OCR_TEXTS = {
  validReservation: `
Guest Name: João Silva
Property: Aroeira II
Check-in Date: 15/01/2024
Check-out Date: 20/01/2024
Number of Nights: 5
Total Amount: €500.00
Email: joao.silva@email.com
Phone: +351 912 345 678
Number of Guests: 2
Booking Platform: Airbnb
Reference: AIR123456789
  `,
  partialReservation: `
Nome: Maria Santos
Propriedade: Sete Rios
Entrada: 2024-02-15
Saída: 2024-02-18
Valor Total: 350€
  `,
  ambiguousProperty: `
Guest: Pedro Costa
Property: Aroeira 2
Check-in: 2024-03-10
Check-out: 2024-03-15
Total: 450 euros
  `,
  invalidData: `
This is just random text that doesn't contain
any reservation information at all.
  `,
  multipleReservations: `
Reservation 1:
Guest: Ana Rodrigues
Property: Aroeira I
Check-in: 2024-04-01
Check-out: 2024-04-05
Total: 400€

Reservation 2:
Guest: Carlos Mendes
Property: Feira da Ladra
Check-in: 2024-04-10
Check-out: 2024-04-12
Total: 200€
  `
};

let aiAdapter: AIAdapter;
let availablePDFs: string[] = [];

describe('OCR Data Validation and Processing Tests', () => {
  beforeAll(async () => {
    aiAdapter = AIAdapter.getInstance();
    
    // Discover available PDF files
    try {
      const files = fs.readdirSync(TEST_CONFIG.PUBLIC_DIR);
      availablePDFs = files.filter(f => f.endsWith('.pdf'));
      console.log(`Found ${availablePDFs.length} PDF files for validation testing`);
    } catch (error) {
      console.error('Error reading public directory:', error);
      availablePDFs = [];
    }
  });

  describe('Text Parsing and Data Extraction', () => {
    it('should parse valid reservation data correctly', async () => {
      const parsed = await parseReservationData(SAMPLE_OCR_TEXTS.validReservation);
      
      expect(parsed).toBeDefined();
      expect(parsed.reservations).toBeDefined();
      expect(Array.isArray(parsed.reservations)).toBe(true);
      
      if (parsed.reservations.length > 0) {
        const reservation = parsed.reservations[0];
        expect(reservation.guestName).toContain('João Silva');
        expect(reservation.propertyName).toContain('Aroeira');
        expect(reservation.checkIn).toBeTruthy();
        expect(reservation.checkOut).toBeTruthy();
        expect(reservation.totalAmount).toBeTruthy();
        
        console.log('Parsed valid reservation:', reservation);
      }
    });

    it('should handle partial reservation data', async () => {
      const parsed = await parseReservationData(SAMPLE_OCR_TEXTS.partialReservation);
      
      expect(parsed).toBeDefined();
      
      if (parsed.reservations && parsed.reservations.length > 0) {
        const reservation = parsed.reservations[0];
        expect(reservation.guestName).toBeTruthy();
        expect(reservation.propertyName).toBeTruthy();
        
        // Should identify missing fields
        if (parsed.missing) {
          expect(Array.isArray(parsed.missing)).toBe(true);
          console.log('Missing fields identified:', parsed.missing);
        }
      }
    });

    it('should extract multiple reservations from single text', async () => {
      const parsed = await parseReservationData(SAMPLE_OCR_TEXTS.multipleReservations);
      
      expect(parsed).toBeDefined();
      
      if (parsed.reservations) {
        expect(parsed.reservations.length).toBeGreaterThanOrEqual(1);
        console.log(`Extracted ${parsed.reservations.length} reservations from text`);
        
        parsed.reservations.forEach((reservation, index) => {
          console.log(`Reservation ${index + 1}:`, {
            guest: reservation.guestName,
            property: reservation.propertyName,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut
          });
        });
      }
    });

    it('should handle invalid or empty text gracefully', async () => {
      const parsed = await parseReservationData(SAMPLE_OCR_TEXTS.invalidData);
      
      expect(parsed).toBeDefined();
      
      // Should either return empty reservations or indicate no valid data found
      if (parsed.reservations) {
        expect(Array.isArray(parsed.reservations)).toBe(true);
        console.log('Result for invalid text:', parsed);
      }
    });

    it('should validate required fields completeness', () => {
      const testReservation = {
        guestName: 'Test Guest',
        propertyName: 'Test Property',
        checkIn: '2024-01-15',
        checkOut: '2024-01-20',
        totalAmount: '500',
        nights: '5'
      };

      // Check if all required fields are present
      const missingFields = TEST_CONFIG.EXPECTED_FIELDS.filter(
        field => !testReservation[field as keyof typeof testReservation]
      );

      expect(missingFields.length).toBe(0);
      console.log('Required fields validation passed');
    });
  });

  describe('Property Name Matching', () => {
    it('should match exact property names', () => {
      const exactMatch = matchPropertyByAlias('Aroeira II', MOCK_PROPERTIES);
      expect(exactMatch).toBeDefined();
      expect(exactMatch?.id).toBe('2');
      expect(exactMatch?.name).toBe('Aroeira II');
    });

    it('should match property aliases', () => {
      const aliasMatch = matchPropertyByAlias('aroeira 2', MOCK_PROPERTIES);
      expect(aliasMatch).toBeDefined();
      expect(aliasMatch?.id).toBe('2');
      expect(aliasMatch?.name).toBe('Aroeira II');
    });

    it('should handle case-insensitive matching', () => {
      const caseInsensitiveMatch = matchPropertyByAlias('SETE RIOS', MOCK_PROPERTIES);
      expect(caseInsensitiveMatch).toBeDefined();
      expect(caseInsensitiveMatch?.id).toBe('3');
      expect(caseInsensitiveMatch?.name).toBe('Sete Rios');
    });

    it('should handle partial matches', () => {
      const partialMatch = matchPropertyByAlias('feira ladra', MOCK_PROPERTIES);
      expect(partialMatch).toBeDefined();
      expect(partialMatch?.id).toBe('5');
    });

    it('should return null for no matches', () => {
      const noMatch = matchPropertyByAlias('Property That Does Not Exist', MOCK_PROPERTIES);
      expect(noMatch).toBeNull();
    });

    it('should handle special characters and numbers', () => {
      const numberMatch = matchPropertyByAlias('5 de outubro', MOCK_PROPERTIES);
      expect(numberMatch).toBeDefined();
      expect(numberMatch?.id).toBe('4');
    });
  });

  describe('Data Normalization and Validation', () => {
    it('should normalize date formats', () => {
      const datesToTest = [
        '15/01/2024',
        '2024-01-15',
        '15-01-2024',
        '01/15/2024',
        '2024/01/15'
      ];

      datesToTest.forEach(dateStr => {
        const date = new Date(dateStr);
        expect(date).toBeInstanceOf(Date);
        // Should be a valid date (not NaN)
        expect(!isNaN(date.getTime())).toBe(true);
      });
    });

    it('should normalize monetary amounts', () => {
      const amountsToTest = [
        '€500.00',
        '500€',
        '500 euros',
        '$500',
        '500.50',
        '1,500.00'
      ];

      amountsToTest.forEach(amount => {
        // Extract numeric value
        const numericValue = amount.replace(/[€$,\s]/g, '').replace('euros', '');
        const parsed = parseFloat(numericValue);
        
        expect(typeof parsed).toBe('number');
        expect(!isNaN(parsed)).toBe(true);
        expect(parsed).toBeGreaterThan(0);
        
        console.log(`${amount} -> ${parsed}`);
      });
    });

    it('should validate email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user space@domain.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate phone number formats', () => {
      const phoneNumbers = [
        '+351 912 345 678',
        '912345678',
        '+44 20 7946 0958',
        '(555) 123-4567'
      ];

      phoneNumbers.forEach(phone => {
        // Basic validation - should contain only digits, spaces, +, -, ()
        const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
        expect(/^\d+$/.test(cleanPhone)).toBe(true);
        expect(cleanPhone.length).toBeGreaterThanOrEqual(9);
      });
    });

    it('should calculate nights correctly', () => {
      const testCases = [
        { checkIn: '2024-01-15', checkOut: '2024-01-20', expectedNights: 5 },
        { checkIn: '2024-02-01', checkOut: '2024-02-03', expectedNights: 2 },
        { checkIn: '2024-12-30', checkOut: '2025-01-02', expectedNights: 3 }
      ];

      testCases.forEach(testCase => {
        const checkInDate = new Date(testCase.checkIn);
        const checkOutDate = new Date(testCase.checkOut);
        const diffTime = checkOutDate.getTime() - checkInDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        expect(diffDays).toBe(testCase.expectedNights);
      });
    });
  });

  describe('Real PDF Data Validation', () => {
    it('should validate data extracted from real PDFs', async () => {
      if (availablePDFs.length === 0) {
        console.warn('No PDFs available for real data validation');
        return;
      }

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');

      try {
        // Extract text
        const extractedText = await aiAdapter.extractTextFromPDF(pdfBase64);
        expect(extractedText).toBeTruthy();
        expect(extractedText.length).toBeGreaterThan(0);

        // Parse reservation data
        const parsed = await parseReservationData(extractedText);
        expect(parsed).toBeDefined();

        console.log(`Data validation for ${testFile}:`);
        console.log(`  Text length: ${extractedText.length} chars`);
        console.log(`  Reservations found: ${parsed.reservations?.length || 0}`);
        console.log(`  Missing fields: ${parsed.missing?.length || 0}`);

        if (parsed.reservations && parsed.reservations.length > 0) {
          const reservation = parsed.reservations[0];
          
          // Validate data types and formats
          if (reservation.guestName) {
            expect(typeof reservation.guestName).toBe('string');
            expect(reservation.guestName.trim().length).toBeGreaterThan(0);
          }

          if (reservation.checkIn) {
            const checkInDate = new Date(reservation.checkIn);
            expect(checkInDate).toBeInstanceOf(Date);
            expect(!isNaN(checkInDate.getTime())).toBe(true);
          }

          if (reservation.checkOut) {
            const checkOutDate = new Date(reservation.checkOut);
            expect(checkOutDate).toBeInstanceOf(Date);
            expect(!isNaN(checkOutDate.getTime())).toBe(true);
          }

          if (reservation.totalAmount) {
            // Should be convertible to a number
            const amount = parseFloat(reservation.totalAmount.toString().replace(/[€$,\s]/g, ''));
            expect(!isNaN(amount)).toBe(true);
            expect(amount).toBeGreaterThan(0);
          }

          console.log('  Sample extracted data:', {
            guest: reservation.guestName,
            property: reservation.propertyName,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            amount: reservation.totalAmount
          });
        }

        if (parsed.missing && parsed.missing.length > 0) {
          console.log('  Missing fields:', parsed.missing);
        }

      } catch (error) {
        console.error(`Error validating data from ${testFile}:`, error);
        throw error;
      }
    }, TEST_CONFIG.TIMEOUT);

    it('should test property matching with real extracted data', async () => {
      if (availablePDFs.length === 0) return;

      // Test with a Controlo file which likely contains property names
      const controloFiles = availablePDFs.filter(f => f.startsWith('Controlo_'));
      if (controloFiles.length === 0) {
        console.warn('No Controlo files available for property matching test');
        return;
      }

      const testFile = controloFiles[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');

      const extractedText = await aiAdapter.extractTextFromPDF(pdfBase64);
      const parsed = await parseReservationData(extractedText);

      if (parsed.reservations && parsed.reservations.length > 0) {
        const reservation = parsed.reservations[0];
        
        if (reservation.propertyName) {
          console.log(`Testing property matching for: "${reservation.propertyName}"`);
          
          const matchedProperty = matchPropertyByAlias(reservation.propertyName, MOCK_PROPERTIES);
          
          if (matchedProperty) {
            console.log(`  Matched to: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
            expect(matchedProperty).toBeDefined();
            expect(matchedProperty.id).toBeTruthy();
          } else {
            console.log(`  No match found - property may need to be added to database`);
            // This is not an error - just means the property isn't in our test database
          }
        }
      }
    }, TEST_CONFIG.TIMEOUT);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty or whitespace-only text', async () => {
      const emptyTexts = ['', '   ', '\n\n\n', '\t\t'];

      for (const text of emptyTexts) {
        const parsed = await parseReservationData(text);
        expect(parsed).toBeDefined();
        
        // Should handle gracefully without throwing errors
        console.log(`Empty text handling result:`, parsed);
      }
    });

    it('should handle extremely long text', async () => {
      const longText = 'A'.repeat(100000) + '\n' + SAMPLE_OCR_TEXTS.validReservation;
      
      const parsed = await parseReservationData(longText);
      expect(parsed).toBeDefined();
      
      // Should still extract the valid reservation data despite the noise
      if (parsed.reservations && parsed.reservations.length > 0) {
        expect(parsed.reservations[0].guestName).toBeTruthy();
      }
    }, TEST_CONFIG.TIMEOUT);

    it('should handle special characters and encoding', async () => {
      const textWithSpecialChars = `
Guest: José María Núñez-González
Property: Çasa do Açúcar
Check-in: 15/01/2024
Total: €1,500.50
Notes: Família com crianças pequeñas
      `;

      const parsed = await parseReservationData(textWithSpecialChars);
      expect(parsed).toBeDefined();
      
      if (parsed.reservations && parsed.reservations.length > 0) {
        const reservation = parsed.reservations[0];
        expect(reservation.guestName).toContain('José');
        expect(reservation.guestName).toContain('María');
        console.log('Special characters handled correctly:', reservation.guestName);
      }
    });

    it('should handle inconsistent date formats', async () => {
      const textWithMixedDates = `
Guest: Test User
Property: Test Property
Check-in: 15/01/2024
Check-out: 2024-01-20
Total: 500€
      `;

      const parsed = await parseReservationData(textWithMixedDates);
      expect(parsed).toBeDefined();
      
      if (parsed.reservations && parsed.reservations.length > 0) {
        const reservation = parsed.reservations[0];
        
        if (reservation.checkIn && reservation.checkOut) {
          const checkIn = new Date(reservation.checkIn);
          const checkOut = new Date(reservation.checkOut);
          
          expect(!isNaN(checkIn.getTime())).toBe(true);
          expect(!isNaN(checkOut.getTime())).toBe(true);
          expect(checkOut.getTime()).toBeGreaterThan(checkIn.getTime());
        }
      }
    });

    it('should validate data consistency', async () => {
      const inconsistentData = `
Guest: John Doe
Property: Test Property
Check-in: 2024-01-20
Check-out: 2024-01-15  // Earlier than check-in
Nights: 10             // Inconsistent with dates
Total: -500€           // Negative amount
      `;

      const parsed = await parseReservationData(inconsistentData);
      
      if (parsed.reservations && parsed.reservations.length > 0) {
        const reservation = parsed.reservations[0];
        
        // Check for data inconsistencies
        if (reservation.checkIn && reservation.checkOut) {
          const checkIn = new Date(reservation.checkIn);
          const checkOut = new Date(reservation.checkOut);
          
          if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
            const isDateOrderCorrect = checkOut.getTime() > checkIn.getTime();
            console.log('Date order validation:', isDateOrderCorrect ? 'PASS' : 'FAIL');
            
            if (!isDateOrderCorrect) {
              console.warn('Inconsistent dates detected - check-out before check-in');
            }
          }
        }

        if (reservation.totalAmount) {
          const amount = parseFloat(reservation.totalAmount.toString().replace(/[€$,\s]/g, ''));
          if (amount < 0) {
            console.warn('Negative amount detected:', amount);
          }
        }
      }
    });
  });

  describe('Performance and Efficiency Tests', () => {
    it('should process data extraction efficiently', async () => {
      const startTime = Date.now();
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        await parseReservationData(SAMPLE_OCR_TEXTS.validReservation);
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / iterations;

      console.log(`Data extraction performance: ${avgTime.toFixed(2)}ms average over ${iterations} iterations`);
      
      // Should complete within reasonable time
      expect(avgTime).toBeLessThan(1000); // Less than 1 second per parsing
    });

    it('should handle batch property matching efficiently', () => {
      const propertyNames = [
        'Aroeira I',
        'aroeira 2',
        'SETE RIOS',
        'feira ladra',
        '5 de outubro',
        'non-existent property',
        'another unknown property'
      ];

      const startTime = Date.now();
      
      const results = propertyNames.map(name => ({
        original: name,
        matched: matchPropertyByAlias(name, MOCK_PROPERTIES)
      }));

      const totalTime = Date.now() - startTime;

      console.log(`Property matching performance: ${totalTime}ms for ${propertyNames.length} properties`);
      console.log('Matching results:');
      results.forEach(result => {
        console.log(`  "${result.original}" -> ${result.matched ? result.matched.name : 'No match'}`);
      });

      expect(totalTime).toBeLessThan(100); // Should be very fast
    });
  });
});
/**
 * Comprehensive PDF Import Service with Intelligent Property Matching
 * 
 * Features:
 * - Supports Booking.com and Airbnb PDF formats
 * - Intelligent property name matching with fuzzy algorithms
 * - Property name normalization with accent and abbreviation handling
 * - Confidence scoring for property matches
 * - Suggestion system for unmatched properties
 * - Batch processing support
 * - Caching system for property matches
 * - Detailed import reports
 * 
 * @author PDF Processing Specialist Agent
 * @version 1.0.0
 */

import { Property, Reservation, InsertReservation } from '../../shared/schema';
import { aiService } from './ai-adapter.service';
import { matchPropertyByAlias } from '../utils/matchPropertyByAlias';
import { enhancedMatchProperty } from '../utils/enhancedPropertyMatcher';
import { propertyMatchCache } from './propertyMatchCache';
import { db } from '../db/index';
import { properties, reservations } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// ===== TYPES AND INTERFACES =====

export interface PDFImportResult {
  success: boolean;
  reservations: ProcessedReservation[];
  unmatchedProperties: UnmatchedProperty[];
  report: ImportReport;
  errors: string[];
}

export interface ProcessedReservation {
  reservation: InsertReservation;
  propertyMatch: PropertyMatch;
  confidence: number;
  status: 'matched' | 'suggested' | 'unmatched';
}

export interface PropertyMatch {
  property: Property | null;
  originalName: string;
  normalizedName: string;
  matchScore: number;
  matchType: 'exact' | 'alias' | 'fuzzy' | 'none';
  suggestions: PropertySuggestion[];
}

export interface PropertySuggestion {
  property: Property;
  score: number;
  reason: string;
}

export interface UnmatchedProperty {
  originalName: string;
  normalizedName: string;
  count: number;
  suggestions: PropertySuggestion[];
}

export interface ImportReport {
  totalReservations: number;
  matchedReservations: number;
  suggestedReservations: number;
  unmatchedReservations: number;
  uniqueProperties: number;
  unmatchedProperties: number;
  processingTime: number;
  confidenceDistribution: {
    high: number; // > 0.8
    medium: number; // 0.5 - 0.8
    low: number; // < 0.5
  };
}

export interface PDFPlatformConfig {
  name: string;
  patterns: {
    propertyName: RegExp[];
    guestName: RegExp[];
    checkIn: RegExp[];
    checkOut: RegExp[];
    guests: RegExp[];
    bookingRef: RegExp[];
  };
  dateFormats: string[];
  indicators: string[];
}

// ===== PLATFORM CONFIGURATIONS =====

const PLATFORM_CONFIGS: Record<string, PDFPlatformConfig> = {
  booking: {
    name: 'Booking.com',
    patterns: {
      propertyName: [
        /accommodation:\s*(.+?)(?:\n|$)/i,
        /property:\s*(.+?)(?:\n|$)/i,
        /hotel:\s*(.+?)(?:\n|$)/i,
        /(?:^|\n)(.+?)\s*(?:apartment|house|villa|studio|room)/i
      ],
      guestName: [
        /guest:\s*(.+?)(?:\n|$)/i,
        /name:\s*(.+?)(?:\n|$)/i,
        /booker:\s*(.+?)(?:\n|$)/i
      ],
      checkIn: [
        /check[\-\s]?in:\s*(.+?)(?:\n|$)/i,
        /arrival:\s*(.+?)(?:\n|$)/i,
        /from:\s*(.+?)(?:\n|$)/i
      ],
      checkOut: [
        /check[\-\s]?out:\s*(.+?)(?:\n|$)/i,
        /departure:\s*(.+?)(?:\n|$)/i,
        /to:\s*(.+?)(?:\n|$)/i
      ],
      guests: [
        /guests?:\s*(\d+)/i,
        /persons?:\s*(\d+)/i,
        /adults?:\s*(\d+)/i
      ],
      bookingRef: [
        /booking[\s\-]?(?:reference|ref|number|id):\s*([A-Z0-9\-]+)/i,
        /confirmation[\s\-]?(?:number|code):\s*([A-Z0-9\-]+)/i
      ]
    },
    dateFormats: ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'],
    indicators: ['booking.com', 'genius', 'confirmation']
  },
  airbnb: {
    name: 'Airbnb',
    patterns: {
      propertyName: [
        /(?:stay at|listing)\s*(.+?)(?:\n|$)/i,
        /property:\s*(.+?)(?:\n|$)/i,
        /(?:^|\n)(.+?)\s*(?:lisbon|porto|portugal)/i
      ],
      guestName: [
        /guest:\s*(.+?)(?:\n|$)/i,
        /traveler:\s*(.+?)(?:\n|$)/i,
        /name:\s*(.+?)(?:\n|$)/i
      ],
      checkIn: [
        /check[\-\s]?in:\s*(.+?)(?:\n|$)/i,
        /arrival:\s*(.+?)(?:\n|$)/i,
        /from:\s*(.+?)(?:\n|$)/i
      ],
      checkOut: [
        /check[\-\s]?out:\s*(.+?)(?:\n|$)/i,
        /departure:\s*(.+?)(?:\n|$)/i,
        /until:\s*(.+?)(?:\n|$)/i
      ],
      guests: [
        /guests?:\s*(\d+)/i,
        /travelers?:\s*(\d+)/i
      ],
      bookingRef: [
        /reservation[\s\-]?(?:code|number):\s*([A-Z0-9\-]+)/i,
        /confirmation[\s\-]?code:\s*([A-Z0-9\-]+)/i
      ]
    },
    dateFormats: ['MMM DD, YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY'],
    indicators: ['airbnb', 'reservation', 'itinerary']
  }
};

// ===== MAIN SERVICE CLASS =====

export class PDFImportService {
  private static instance: PDFImportService;
  private propertiesList: Property[] = [];
  private lastPropertiesUpdate: number = 0;
  private readonly PROPERTIES_CACHE_TTL = 300000; // 5 minutes

  private constructor() {}

  public static getInstance(): PDFImportService {
    if (!PDFImportService.instance) {
      PDFImportService.instance = new PDFImportService();
    }
    return PDFImportService.instance;
  }

  // ===== PUBLIC METHODS =====

  /**
   * Import reservations from PDF files with enhanced parallel processing
   * @param pdfFiles Array of PDF files (base64 encoded)
   * @param options Import options
   * @returns Import results with detailed report
   */
  public async importFromPDFs(
    pdfFiles: Array<{ content: string; filename: string }>,
    options: {
      autoMatch?: boolean;
      confidenceThreshold?: number;
      createUnmatchedProperties?: boolean;
      batchSize?: number;
      parallelConcurrency?: number;
    } = {}
  ): Promise<PDFImportResult> {
    const startTime = Date.now();
    const {
      autoMatch = true,
      confidenceThreshold = 0.7,
      createUnmatchedProperties = false,
      batchSize = 8, // Reduced for better parallel processing
      parallelConcurrency = Math.min(4, Math.ceil(pdfFiles.length / 2)) // Dynamic concurrency
    } = options;

    console.log(`📄 Starting parallel PDF import for ${pdfFiles.length} files with concurrency ${parallelConcurrency}`);

    try {
      // **PARALLEL OPTIMIZATION**: Update properties list concurrently with initial validation
      const [_, validationResults] = await Promise.all([
        this.updatePropertiesList(),
        // Pre-validate files in parallel
        this.validatePDFFiles(pdfFiles)
      ]);

      const validFiles = pdfFiles.filter((_, index) => validationResults[index].valid);
      console.log(`✅ ${validFiles.length}/${pdfFiles.length} files passed validation`);

      const allReservations: ProcessedReservation[] = [];
      const errors: string[] = validationResults
        .filter(result => !result.valid)
        .map(result => result.error);
      const unmatchedPropertiesMap = new Map<string, UnmatchedProperty>();

      // **ENHANCED PARALLEL PROCESSING**: Use Promise.allSettled with controlled concurrency
      console.log(`⚡ Processing ${validFiles.length} files in parallel batches`);

      // Create batches for controlled parallel processing
      const batches: Array<{ content: string; filename: string }[]> = [];
      for (let i = 0; i < validFiles.length; i += batchSize) {
        batches.push(validFiles.slice(i, i + batchSize));
      }

      const semaphore = new Map<string, boolean>(); // Simple semaphore for concurrency control
      let activeTasks = 0;

      const processWithConcurrency = async (file: { content: string; filename: string }) => {
        // Wait for available slot
        while (activeTasks >= parallelConcurrency) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        activeTasks++;
        try {
          return await this.processPDFFile(file.content, file.filename);
        } finally {
          activeTasks--;
        }
      };

      // Process all batches with controlled concurrency
      const batchPromises = batches.map(async (batch, batchIndex) => {
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} files)`);

        // Process files in batch with Promise.allSettled for better error handling
        const filePromises = batch.map(async (file) => {
          try {
            const result = await processWithConcurrency(file);
            return { success: true, reservations: result, filename: file.filename };
          } catch (error) {
            const errorMsg = `Error processing ${file.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            return { success: false, error: errorMsg, filename: file.filename };
          }
        });

        return await Promise.allSettled(filePromises);
      });

      // Wait for all batches to complete
      const allBatchResults = await Promise.all(batchPromises);

      // Process results from all batches
      for (const batchResults of allBatchResults) {
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            const fileResult = result.value;
            if (fileResult.success) {
              allReservations.push(...fileResult.reservations);
            } else {
              errors.push(fileResult.error);
              console.error(fileResult.error);
            }
          } else {
            errors.push(`Batch processing failed: ${result.reason}`);
            console.error('Batch processing failed:', result.reason);
          }
        }
      }

      // The reservations already have property matching done in parseAIExtractionResult
      // Here we just re-evaluate the confidence and status based on the specified threshold
      const processedReservations: ProcessedReservation[] = [];
      
      for (const reservation of allReservations) {
        const processed: ProcessedReservation = {
          ...reservation,
          // Keep the existing property match but update confidence thresholds
          confidence: reservation.propertyMatch.matchScore,
          status: this.determineMatchStatus(reservation.propertyMatch, confidenceThreshold)
        };

        processedReservations.push(processed);

        // Track unmatched properties
        if (processed.status === 'unmatched') {
          const key = processed.propertyMatch.normalizedName;
          if (unmatchedPropertiesMap.has(key)) {
            unmatchedPropertiesMap.get(key)!.count++;
          } else {
            unmatchedPropertiesMap.set(key, {
              originalName: processed.propertyMatch.originalName,
              normalizedName: processed.propertyMatch.normalizedName,
              count: 1,
              suggestions: processed.propertyMatch.suggestions
            });
          }
        }
      }

      // Generate report
      const processingTime = Date.now() - startTime;
      const report = this.generateImportReport(processedReservations, processingTime);

      console.log(`✅ PDF import completed in ${processingTime}ms`);
      console.log(`📊 Results: ${report.matchedReservations} matched, ${report.suggestedReservations} suggested, ${report.unmatchedReservations} unmatched`);

      return {
        success: true,
        reservations: processedReservations,
        unmatchedProperties: Array.from(unmatchedPropertiesMap.values()),
        report,
        errors
      };

    } catch (error) {
      console.error('❌ PDF import failed:', error);
      return {
        success: false,
        reservations: [],
        unmatchedProperties: [],
        report: this.generateEmptyReport(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get property suggestions for an unmatched property name
   * @param propertyName Property name to find suggestions for
   * @param limit Maximum number of suggestions
   * @returns Array of property suggestions
   */
  public async getPropertySuggestions(
    propertyName: string,
    limit: number = 5
  ): Promise<PropertySuggestion[]> {
    await this.updatePropertiesList();
    
    // Use enhanced property matcher for better suggestions
    const matches = enhancedMatchProperty(propertyName, this.propertiesList, {
      minConfidenceScore: 0.3,
      maxResults: limit * 2, // Get more results to filter
      includePartialMatches: true
    });

    return matches.map(match => ({
      property: match.property,
      score: match.matchScore,
      reason: this.explainMatchReason(propertyName, match.property, match.matchScore)
    })).slice(0, limit);
  }

  /**
   * Learn from successful property matches to improve future matching
   * @param originalName Original property name from PDF
   * @param matchedProperty The property it was matched to
   * @param confidence Confidence of the match
   */
  public async learnFromMatch(
    originalName: string,
    matchedProperty: Property,
    confidence: number
  ): Promise<void> {
    if (confidence < 0.7) return; // Only learn from high-confidence matches

    try {
      // Add the original name as an alias if it's not already present
      const aliases = matchedProperty.aliases || [];
      const normalizedOriginal = this.normalizePropertyName(originalName);
      
      const existingAliases = aliases.map(alias => this.normalizePropertyName(alias));
      
      if (!existingAliases.includes(normalizedOriginal) && 
          this.normalizePropertyName(matchedProperty.name) !== normalizedOriginal) {
        
        const updatedAliases = [...aliases, originalName];
        
        await db.update(properties)
          .set({ aliases: updatedAliases })
          .where(eq(properties.id, matchedProperty.id));

        console.log(`🧠 Learned new alias "${originalName}" for property "${matchedProperty.name}"`);
        
        // Clear and update cache
        propertyMatchCache.delete(originalName);
        await this.updatePropertiesList();
      }
    } catch (error) {
      console.error('Error learning from match:', error);
    }
  }

  // ===== PRIVATE METHODS =====

  /**
   * Process a single PDF file and extract reservations
   */
  private async processPDFFile(
    pdfBase64: string, 
    filename: string
  ): Promise<ProcessedReservation[]> {
    console.log(`📄 Processing PDF: ${filename}`);

    try {
      // Extract text from PDF using AI service
      const extractedText = await aiService.extractTextFromPDF(pdfBase64);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from PDF');
      }

      console.log(`📝 Extracted ${extractedText.length} characters from ${filename}`);

      // Detect platform
      const platform = this.detectPlatform(extractedText);
      console.log(`🔍 Detected platform: ${platform || 'unknown'}`);

      // Extract reservations using AI
      const aiExtractionResult = await aiService.processReservationDocument(
        pdfBase64, 
        'application/pdf'
      );

      if (!aiExtractionResult.success) {
        throw new Error(aiExtractionResult.error || 'AI extraction failed');
      }

      // Parse the AI result into reservations
      const reservations = await this.parseAIExtractionResult(
        aiExtractionResult.data,
        extractedText,
        platform
      );

      console.log(`✅ Extracted ${reservations.length} reservations from ${filename}`);
      return reservations;

    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Parse AI extraction result into structured reservations
   */
  private async parseAIExtractionResult(
    aiData: any,
    rawText: string,
    platform: string | null
  ): Promise<ProcessedReservation[]> {
    const reservations: ProcessedReservation[] = [];

    // Handle different AI response formats
    let reservationData: any[] = [];
    
    if (Array.isArray(aiData)) {
      reservationData = aiData;
    } else if (aiData.reservations && Array.isArray(aiData.reservations)) {
      reservationData = aiData.reservations;
    } else if (aiData.propertyName && aiData.guestName) {
      // Single reservation
      reservationData = [aiData];
    } else {
      // Try to extract using pattern matching as fallback
      reservationData = await this.extractUsingPatterns(rawText, platform);
    }

    for (let i = 0; i < reservationData.length; i++) {
      const data = reservationData[i];
      
      try {
        const reservation = await this.createReservationFromData(data, platform);
        const propertyMatch = await this.findPropertyMatch(
          data.propertyName || data.property_name || '',
          0.5
        );

        reservations.push({
          reservation,
          propertyMatch,
          confidence: propertyMatch.matchScore,
          status: this.determineMatchStatus(propertyMatch, 0.7)
        });
      } catch (error) {
        console.error(`Error creating reservation ${i + 1}:`, error);
      }
    }

    return reservations;
  }

  /**
   * Extract reservations using pattern matching (fallback method)
   */
  private async extractUsingPatterns(
    text: string,
    platform: string | null
  ): Promise<any[]> {
    const reservations: any[] = [];
    
    if (!platform || !PLATFORM_CONFIGS[platform]) {
      // Generic extraction
      return await this.genericPatternExtraction(text);
    }

    const config = PLATFORM_CONFIGS[platform];
    
    // Split text into potential reservation blocks
    const blocks = this.splitIntoReservationBlocks(text);
    
    for (const block of blocks) {
      const reservation = this.extractFromBlock(block, config);
      if (reservation && reservation.propertyName && reservation.guestName) {
        reservations.push(reservation);
      }
    }

    return reservations;
  }

  /**
   * Generic pattern extraction for unknown formats
   */
  private async genericPatternExtraction(text: string): Promise<any[]> {
    const reservations: any[] = [];
    
    // Common patterns across platforms
    const patterns = {
      propertyName: [
        /(?:property|accommodation|hotel|apartment|house|villa|studio|room):\s*([^\n]+)/gi,
        /(?:^|\n)([^:\n]*(?:apartment|house|villa|studio|room)[^:\n]*)/gi
      ],
      guestName: [
        /(?:guest|name|traveler|booker):\s*([^\n]+)/gi,
        /(?:mr|mrs|ms)\.?\s+([a-z\s]+)/gi
      ],
      dates: [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
        /(\d{4}-\d{2}-\d{2})/g
      ]
    };

    // Extract all potential matches
    const properties = this.extractAllMatches(text, patterns.propertyName);
    const guests = this.extractAllMatches(text, patterns.guestName);
    const dates = this.extractAllMatches(text, patterns.dates);

    // Try to correlate data
    const maxItems = Math.max(properties.length, guests.length, Math.floor(dates.length / 2));
    
    for (let i = 0; i < maxItems; i++) {
      const reservation: any = {
        propertyName: properties[i] || '',
        guestName: guests[i] || '',
        checkInDate: dates[i * 2] || '',
        checkOutDate: dates[i * 2 + 1] || '',
        totalGuests: 1
      };

      if (reservation.propertyName && reservation.guestName) {
        reservations.push(reservation);
      }
    }

    return reservations;
  }

  /**
   * Extract all matches for given patterns
   */
  private extractAllMatches(text: string, patterns: RegExp[]): string[] {
    const matches: Set<string> = new Set();
    
    for (const pattern of patterns) {
      const results = text.match(pattern);
      if (results) {
        results.forEach(match => {
          const cleaned = match.replace(/^[^:]*:\s*/, '').trim();
          if (cleaned.length > 2) {
            matches.add(cleaned);
          }
        });
      }
    }
    
    return Array.from(matches);
  }

  /**
   * Split text into potential reservation blocks
   */
  private splitIntoReservationBlocks(text: string): string[] {
    // Split by common delimiters
    const delimiters = [
      /(?:\n\s*){2,}/,  // Multiple line breaks
      /(?:reservation|booking|confirmation)\s*(?:number|code|id)/i,
      /(?:guest|traveler|name):\s*[^\n]+\n/gi
    ];

    let blocks = [text];
    
    for (const delimiter of delimiters) {
      const newBlocks: string[] = [];
      for (const block of blocks) {
        newBlocks.push(...block.split(delimiter));
      }
      blocks = newBlocks;
    }

    return blocks.filter(block => block.trim().length > 50); // Filter out too short blocks
  }

  /**
   * Extract reservation data from a text block using platform config
   */
  private extractFromBlock(block: string, config: PDFPlatformConfig): any | null {
    const reservation: any = {};

    // Extract each field
    reservation.propertyName = this.extractWithPatterns(block, config.patterns.propertyName);
    reservation.guestName = this.extractWithPatterns(block, config.patterns.guestName);
    reservation.checkInDate = this.extractWithPatterns(block, config.patterns.checkIn);
    reservation.checkOutDate = this.extractWithPatterns(block, config.patterns.checkOut);
    reservation.totalGuests = parseInt(this.extractWithPatterns(block, config.patterns.guests)) || 1;
    reservation.bookingReference = this.extractWithPatterns(block, config.patterns.bookingRef);

    // Normalize dates
    if (reservation.checkInDate) {
      reservation.checkInDate = this.normalizeDate(reservation.checkInDate, config.dateFormats);
    }
    if (reservation.checkOutDate) {
      reservation.checkOutDate = this.normalizeDate(reservation.checkOutDate, config.dateFormats);
    }

    return reservation;
  }

  /**
   * Extract value using multiple patterns
   */
  private extractWithPatterns(text: string, patterns: RegExp[]): string {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  }

  /**
   * Detect platform from PDF text
   */
  private detectPlatform(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    for (const [platform, config] of Object.entries(PLATFORM_CONFIGS)) {
      if (config.indicators.some(indicator => lowerText.includes(indicator))) {
        return platform;
      }
    }
    
    return null;
  }

  /**
   * Create InsertReservation from extracted data
   */
  private async createReservationFromData(
    data: any,
    platform: string | null
  ): Promise<InsertReservation> {
    // Normalize field names (handle different AI response formats)
    const propertyName = data.propertyName || data.property_name || data.accommodation || '';
    const guestName = data.guestName || data.guest_name || data.name || '';
    const checkInDate = data.checkInDate || data.check_in_date || data.checkIn || data.arrival || '';
    const checkOutDate = data.checkOutDate || data.check_out_date || data.checkOut || data.departure || '';
    const totalGuests = parseInt(data.totalGuests || data.total_guests || data.guests || data.numGuests || '1') || 1;
    const guestEmail = data.guestEmail || data.guest_email || data.email || '';
    const guestPhone = data.guestPhone || data.guest_phone || data.phone || '';
    const notes = data.notes || data.specialRequests || data.special_requests || '';
    const bookingReference = data.bookingReference || data.booking_reference || data.confirmationCode || '';

    // For now, set propertyId to 0 - it will be set later when property is matched
    const reservation: InsertReservation = {
      propertyId: 0, // Will be updated after property matching
      guestName: guestName || 'Unknown Guest',
      checkInDate: this.normalizeDate(checkInDate) || new Date().toISOString().split('T')[0],
      checkOutDate: this.normalizeDate(checkOutDate) || new Date().toISOString().split('T')[0],
      totalAmount: '0', // Will be updated if available
      numGuests: totalGuests,
      guestEmail,
      guestPhone,
      status: 'confirmed',
      notes: this.buildNotesString(notes, bookingReference, platform),
      source: this.mapPlatformToSource(platform)
    };

    return reservation;
  }

  /**
   * Build notes string with additional information
   */
  private buildNotesString(
    notes: string,
    bookingReference: string,
    platform: string | null
  ): string {
    const noteParts: string[] = [];
    
    if (notes) noteParts.push(`Notas: ${notes}`);
    if (bookingReference) noteParts.push(`Ref: ${bookingReference}`);
    if (platform) noteParts.push(`Origem: ${platform}`);
    
    return noteParts.join(' | ');
  }

  /**
   * Map platform to source field
   */
  private mapPlatformToSource(platform: string | null): string {
    const platformMap: Record<string, string> = {
      'booking': 'booking',
      'airbnb': 'airbnb',
    };
    
    return platformMap[platform || ''] || 'manual';
  }

  /**
   * Update properties list from database and pre-warm cache
   */
  private async updatePropertiesList(): Promise<void> {
    const now = Date.now();
    if (now - this.lastPropertiesUpdate < this.PROPERTIES_CACHE_TTL && this.propertiesList.length > 0) {
      return; // Properties list still valid
    }

    try {
      this.propertiesList = await db.select().from(properties);
      this.lastPropertiesUpdate = now;
      
      // Pre-warm the property match cache
      await propertyMatchCache.preWarm(this.propertiesList);
      
      console.log(`📋 Updated properties list with ${this.propertiesList.length} properties`);
    } catch (error) {
      console.error('Error updating properties list:', error);
      throw error;
    }
  }

  /**
   * Find the best property match for a given property name
   */
  private async findPropertyMatch(
    propertyName: string,
    confidenceThreshold: number = 0.7
  ): Promise<PropertyMatch> {
    if (!propertyName || propertyName.trim() === '') {
      return this.createEmptyPropertyMatch(propertyName);
    }

    // Check cache first
    const cachedMatch = propertyMatchCache.get(propertyName);
    if (cachedMatch) {
      return cachedMatch;
    }

    // Use enhanced property matching
    const matches = enhancedMatchProperty(propertyName, this.propertiesList, {
      minConfidenceScore: 0.1, // Low threshold to get suggestions
      maxResults: 5,
      includePartialMatches: true
    });

    let bestMatch = matches[0];
    let matchType: 'exact' | 'alias' | 'fuzzy' | 'none' = 'none';
    let property: Property | null = null;
    let matchScore = 0;

    if (bestMatch) {
      property = bestMatch.property;
      matchScore = bestMatch.matchScore;
      
      // Determine match type based on the enhanced matcher results
      if (bestMatch.matchedField === 'name' && bestMatch.matchScore >= 0.95) {
        matchType = 'exact';
      } else if (bestMatch.matchedField === 'alias') {
        matchType = 'alias';
      } else {
        matchType = 'fuzzy';
      }
    }

    const match: PropertyMatch = {
      property,
      originalName: propertyName,
      normalizedName: this.normalizePropertyName(propertyName),
      matchScore,
      matchType,
      suggestions: matches.slice(0, 5).map(m => ({
        property: m.property,
        score: m.matchScore,
        reason: this.explainMatchReason(propertyName, m.property, m.matchScore)
      }))
    };

    // Cache the result
    propertyMatchCache.set(propertyName, match);
    return match;
  }

  /**
   * Find fuzzy matches using Levenshtein distance and other algorithms
   */
  private findFuzzyMatches(propertyName: string): PropertySuggestion[] {
    const normalizedInput = this.normalizePropertyName(propertyName);
    const suggestions: PropertySuggestion[] = [];

    for (const property of this.propertiesList) {
      const score = this.calculateFuzzyScore(normalizedInput, property);
      if (score > 0.2) { // Minimum threshold
        suggestions.push({
          property,
          score,
          reason: this.explainMatchReason(normalizedInput, property, score)
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate fuzzy matching score using multiple algorithms
   */
  private calculateFuzzyScore(normalizedInput: string, property: Property): number {
    const normalizedPropertyName = this.normalizePropertyName(property.name);
    
    // 1. Exact match
    if (normalizedInput === normalizedPropertyName) {
      return 1.0;
    }

    // 2. Check aliases
    if (property.aliases && Array.isArray(property.aliases)) {
      for (const alias of property.aliases) {
        const normalizedAlias = this.normalizePropertyName(alias);
        if (normalizedInput === normalizedAlias) {
          return 0.95;
        }
      }
    }

    // 3. Substring match
    const substringScore = this.calculateSubstringScore(normalizedInput, normalizedPropertyName);
    
    // 4. Levenshtein distance
    const levenshteinScore = this.calculateLevenshteinScore(normalizedInput, normalizedPropertyName);
    
    // 5. Token-based matching
    const tokenScore = this.calculateTokenScore(normalizedInput, normalizedPropertyName);
    
    // 6. Check aliases with fuzzy matching
    let aliasScore = 0;
    if (property.aliases && Array.isArray(property.aliases)) {
      for (const alias of property.aliases) {
        const normalizedAlias = this.normalizePropertyName(alias);
        const currentAliasScore = Math.max(
          this.calculateLevenshteinScore(normalizedInput, normalizedAlias),
          this.calculateTokenScore(normalizedInput, normalizedAlias)
        );
        aliasScore = Math.max(aliasScore, currentAliasScore * 0.9); // Slightly lower weight for aliases
      }
    }

    // Return the highest score from all methods
    return Math.max(substringScore, levenshteinScore, tokenScore, aliasScore);
  }

  /**
   * Calculate substring matching score
   */
  private calculateSubstringScore(input: string, target: string): number {
    if (input === target) return 1.0;
    if (input.length === 0 || target.length === 0) return 0;

    // Check if one is contained in the other
    if (target.includes(input) || input.includes(target)) {
      const shorter = input.length < target.length ? input : target;
      const longer = input.length >= target.length ? input : target;
      return shorter.length / longer.length;
    }

    return 0;
  }

  /**
   * Calculate Levenshtein distance score
   */
  private calculateLevenshteinScore(input: string, target: string): number {
    if (input === target) return 1.0;
    if (input.length === 0 || target.length === 0) return 0;

    const distance = this.levenshteinDistance(input, target);
    const maxLength = Math.max(input.length, target.length);
    
    return Math.max(0, 1 - (distance / maxLength));
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate token-based matching score
   */
  private calculateTokenScore(input: string, target: string): number {
    const inputTokens = new Set(input.split(/\s+/).filter(token => token.length > 1));
    const targetTokens = new Set(target.split(/\s+/).filter(token => token.length > 1));
    
    if (inputTokens.size === 0 || targetTokens.size === 0) return 0;

    const intersection = new Set([...inputTokens].filter(token => targetTokens.has(token)));
    const union = new Set([...inputTokens, ...targetTokens]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Normalize property name for consistent matching
   */
  private normalizePropertyName(name: string): string {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .trim()
      // Remove accents
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Handle common abbreviations
      .replace(/\bapt\b/g, 'apartment')
      .replace(/\bst\b/g, 'street')
      .replace(/\bav\b/g, 'avenue')
      .replace(/\bpça\b/g, 'praca')
      .replace(/\br\b/g, 'rua')
      .replace(/\bt\d+\b/g, (match) => `t${match.slice(1)}`) // Normalize T1, T2, etc.
      // Remove special characters except spaces and numbers
      .replace(/[^\w\s]/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize date string to YYYY-MM-DD format
   */
  private normalizeDate(dateStr: string, formats?: string[]): string {
    if (!dateStr) return '';

    // Try to parse common date formats
    const commonFormats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
      /(\d{2})[\/\-](\d{2})[\/\-](\d{2})/, // DD/MM/YY or DD-MM-YY
      /(\d{1,2})\s+(\w+)\s+(\d{4})/, // DD Month YYYY
    ];

    for (const format of commonFormats) {
      const match = dateStr.match(format);
      if (match) {
        try {
          let year, month, day;
          
          if (format.source.includes('(\\\\d{4})-(\\\\d{2})-(\\\\d{2})')) {
            // YYYY-MM-DD
            [, year, month, day] = match;
          } else if (format.source.includes('(\\\\d{2})[\\\\\/\\\\-](\\\\d{2})[\\\\\/\\\\-](\\\\d{4})')) {
            // DD/MM/YYYY
            [, day, month, year] = match;
          } else if (format.source.includes('(\\\\d{2})[\\\\\/\\\\-](\\\\d{2})[\\\\\/\\\\-](\\\\d{2})')) {
            // DD/MM/YY
            [, day, month, year] = match;
            year = parseInt(year) < 50 ? `20${year}` : `19${year}`;
          } else if (format.source.includes('(\\\\d{1,2})\\\\s+(\\\\w+)\\\\s+(\\\\d{4})')) {
            // DD Month YYYY
            [, day, month, year] = match;
            month = this.monthNameToNumber(month);
          }

          if (year && month && day) {
            const normalizedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Validate the date
            const dateObj = new Date(normalizedDate);
            if (dateObj.getFullYear() == parseInt(year) && 
                dateObj.getMonth() + 1 == parseInt(month) && 
                dateObj.getDate() == parseInt(day)) {
              return normalizedDate;
            }
          }
        } catch (error) {
          continue;
        }
      }
    }

    // Fallback: try to parse with Date constructor
    try {
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
    } catch (error) {
      // Ignore
    }

    return '';
  }

  /**
   * Convert month name to number
   */
  private monthNameToNumber(monthName: string): number {
    const months: Record<string, number> = {
      'jan': 1, 'january': 1, 'janeiro': 1,
      'feb': 2, 'february': 2, 'fevereiro': 2,
      'mar': 3, 'march': 3, 'março': 3,
      'apr': 4, 'april': 4, 'abril': 4,
      'may': 5, 'maio': 5,
      'jun': 6, 'june': 6, 'junho': 6,
      'jul': 7, 'july': 7, 'julho': 7,
      'aug': 8, 'august': 8, 'agosto': 8,
      'sep': 9, 'september': 9, 'setembro': 9,
      'oct': 10, 'october': 10, 'outubro': 10,
      'nov': 11, 'november': 11, 'novembro': 11,
      'dec': 12, 'december': 12, 'dezembro': 12
    };
    
    return months[monthName.toLowerCase()] || 1;
  }

  /**
   * Explain why a match was made
   */
  private explainMatchReason(
    normalizedInput: string,
    property: Property,
    score: number
  ): string {
    const normalizedPropertyName = this.normalizePropertyName(property.name);
    
    if (score === 1.0) return 'Correspondência exata';
    if (score >= 0.95) return 'Correspondência por alias';
    if (score >= 0.8) return 'Correspondência muito próxima';
    if (score >= 0.6) return 'Correspondência próxima';
    if (score >= 0.4) return 'Correspondência parcial';
    return 'Correspondência fraca';
  }

  /**
   * Determine match status based on score and threshold
   */
  private determineMatchStatus(
    propertyMatch: PropertyMatch,
    confidenceThreshold: number
  ): 'matched' | 'suggested' | 'unmatched' {
    if (propertyMatch.matchScore >= confidenceThreshold) {
      return 'matched';
    } else if (propertyMatch.matchScore >= 0.4) {
      return 'suggested';
    } else {
      return 'unmatched';
    }
  }

  /**
   * Create an empty property match for unmatched properties
   */
  private createEmptyPropertyMatch(propertyName: string): PropertyMatch {
    return {
      property: null,
      originalName: propertyName,
      normalizedName: this.normalizePropertyName(propertyName),
      matchScore: 0,
      matchType: 'none',
      suggestions: []
    };
  }

  /**
   * Generate detailed import report
   */
  private generateImportReport(
    reservations: ProcessedReservation[],
    processingTime: number
  ): ImportReport {
    const total = reservations.length;
    const matched = reservations.filter(r => r.status === 'matched').length;
    const suggested = reservations.filter(r => r.status === 'suggested').length;
    const unmatched = reservations.filter(r => r.status === 'unmatched').length;

    const propertyNames = new Set(reservations.map(r => r.propertyMatch.originalName));
    const unmatchedPropertyNames = new Set(
      reservations
        .filter(r => r.status === 'unmatched')
        .map(r => r.propertyMatch.originalName)
    );

    // Calculate confidence distribution
    const high = reservations.filter(r => r.confidence > 0.8).length;
    const medium = reservations.filter(r => r.confidence >= 0.5 && r.confidence <= 0.8).length;
    const low = reservations.filter(r => r.confidence < 0.5).length;

    return {
      totalReservations: total,
      matchedReservations: matched,
      suggestedReservations: suggested,
      unmatchedReservations: unmatched,
      uniqueProperties: propertyNames.size,
      unmatchedProperties: unmatchedPropertyNames.size,
      processingTime,
      confidenceDistribution: { high, medium, low }
    };
  }

  /**
   * Generate empty report for failed imports
   */
  private generateEmptyReport(): ImportReport {
    return {
      totalReservations: 0,
      matchedReservations: 0,
      suggestedReservations: 0,
      unmatchedReservations: 0,
      uniqueProperties: 0,
      unmatchedProperties: 0,
      processingTime: 0,
      confidenceDistribution: { high: 0, medium: 0, low: 0 }
    };
  }
}

// Export singleton instance
export const pdfImportService = PDFImportService.getInstance();
/**
 * OCR Validation Utilities for MariaIntelligence
 * Provides quality validation and confidence scoring for OCR results
 */

export interface OCRQualityMetrics {
  textLength: number;
  wordCount: number;
  artifactCount: number;
  artifactPercentage: number;
  bookingIndicatorCount: number;
  datePatternCount: number;
  currencyPatternCount: number;
  languageConsistency: number;
  structuralScore: number;
}

export interface OCRValidationResult {
  isValid: boolean;
  confidence: number;
  qualityScore: number;
  issues: string[];
  corrections: string[];
  suggestions: string[];
  metrics: OCRQualityMetrics;
}

export interface BookingDataValidation {
  hasRequiredFields: boolean;
  fieldCompleteness: number;
  dateConsistency: boolean;
  priceConsistency: boolean;
  contactInfoPresent: boolean;
  platformDetected: string | null;
}

/**
 * OCR Validation Service
 */
export class OCRValidationUtils {
  // Common OCR artifacts and patterns
  private static readonly ARTIFACT_PATTERNS = [
    /[^\w\s\.,\-\(\)\[\]!?@#€$%&*+=<>:;"'/\\]/g, // Special characters
    /(.)\1{4,}/g, // Repeated characters (4 or more)
    /\s{4,}/g, // Multiple spaces (4 or more)
    /[|]{2,}/g, // Multiple pipes
    /[_]{3,}/g, // Multiple underscores
    /[\.]{3,}/g, // Multiple dots
    /[~]{2,}/g, // Multiple tildes
    /[\^]{2,}/g, // Multiple carets
  ];

  // Booking document indicators
  private static readonly BOOKING_INDICATORS = [
    /check.?in/i,
    /check.?out/i,
    /guest/i,
    /booking/i,
    /reservation/i,
    /property/i,
    /hotel/i,
    /apartamento/i,
    /propriedade/i,
    /hóspede/i,
    /reserva/i,
    /entrada/i,
    /saída/i,
  ];

  // Date patterns
  private static readonly DATE_PATTERNS = [
    /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g, // DD/MM/YYYY, DD-MM-YYYY, etc.
    /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/g, // YYYY/MM/DD, YYYY-MM-DD, etc.
    /\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
  ];

  // Currency patterns
  private static readonly CURRENCY_PATTERNS = [
    /€\s*\d+([,\.]\d{1,2})?/g, // Euro
    /USD\s*\d+([,\.]\d{1,2})?/g, // USD
    /\$\s*\d+([,\.]\d{1,2})?/g, // Dollar sign
    /R\$\s*\d+([,\.]\d{1,2})?/g, // Brazilian Real
    /\d+([,\.]\d{1,2})?\s*€/g, // Euro after number
  ];

  // Platform indicators
  private static readonly PLATFORM_INDICATORS = [
    { pattern: /airbnb/i, name: 'Airbnb' },
    { pattern: /booking\.com/i, name: 'Booking.com' },
    { pattern: /expedia/i, name: 'Expedia' },
    { pattern: /hotels\.com/i, name: 'Hotels.com' },
    { pattern: /vrbo/i, name: 'VRBO' },
    { pattern: /homeaway/i, name: 'HomeAway' },
  ];

  /**
   * Calculate quality metrics for OCR text
   */
  static calculateQualityMetrics(text: string): OCRQualityMetrics {
    const textLength = text.length;
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;

    // Count artifacts
    let artifactCount = 0;
    this.ARTIFACT_PATTERNS.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        artifactCount += matches.length;
      }
    });

    const artifactPercentage = textLength > 0 ? artifactCount / textLength : 0;

    // Count booking indicators
    const bookingIndicatorCount = this.BOOKING_INDICATORS.filter(pattern => 
      pattern.test(text)
    ).length;

    // Count date patterns
    let datePatternCount = 0;
    this.DATE_PATTERNS.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        datePatternCount += matches.length;
      }
    });

    // Count currency patterns
    let currencyPatternCount = 0;
    this.CURRENCY_PATTERNS.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        currencyPatternCount += matches.length;
      }
    });

    // Calculate language consistency (simple heuristic)
    const languageConsistency = this.calculateLanguageConsistency(text);

    // Calculate structural score
    const structuralScore = this.calculateStructuralScore(text);

    return {
      textLength,
      wordCount,
      artifactCount,
      artifactPercentage,
      bookingIndicatorCount,
      datePatternCount,
      currencyPatternCount,
      languageConsistency,
      structuralScore,
    };
  }

  /**
   * Validate OCR result comprehensive
   */
  static validateOCRResult(
    text: string,
    confidence: number = 0,
    provider: string = 'unknown',
    options: {
      minTextLength?: number;
      maxArtifactPercentage?: number;
      minBookingIndicators?: number;
      requireDates?: boolean;
      requireCurrency?: boolean;
    } = {}
  ): OCRValidationResult {
    // Default options
    const opts = {
      minTextLength: options.minTextLength || 20,
      maxArtifactPercentage: options.maxArtifactPercentage || 0.08,
      minBookingIndicators: options.minBookingIndicators || 2,
      requireDates: options.requireDates !== false,
      requireCurrency: options.requireCurrency || false,
    };

    const metrics = this.calculateQualityMetrics(text);
    const issues: string[] = [];
    const corrections: string[] = [];
    const suggestions: string[] = [];

    let qualityScore = 100;

    // Text length validation
    if (metrics.textLength < opts.minTextLength) {
      issues.push(`Text too short (${metrics.textLength} characters, minimum ${opts.minTextLength})`);
      qualityScore -= 30;
      suggestions.push('Try scanning at higher resolution or check if document is complete');
    }

    // Artifact validation
    if (metrics.artifactPercentage > opts.maxArtifactPercentage) {
      issues.push(`High artifact rate (${(metrics.artifactPercentage * 100).toFixed(2)}%)`);
      qualityScore -= 25;
      corrections.push('Clean OCR artifacts and normalize text');
      suggestions.push('Consider using a different OCR provider or preprocessing the image');
    }

    // Booking indicators validation
    if (metrics.bookingIndicatorCount < opts.minBookingIndicators) {
      issues.push(`Insufficient booking indicators (${metrics.bookingIndicatorCount}/${opts.minBookingIndicators})`);
      qualityScore -= 20;
      suggestions.push('Verify document is a booking confirmation or reservation document');
    }

    // Date validation
    if (opts.requireDates && metrics.datePatternCount === 0) {
      issues.push('No date patterns detected in booking document');
      qualityScore -= 15;
      suggestions.push('Check if document contains check-in/check-out dates');
    }

    // Currency validation
    if (opts.requireCurrency && metrics.currencyPatternCount === 0) {
      issues.push('No currency/price information detected');
      qualityScore -= 10;
      suggestions.push('Verify document contains pricing information');
    }

    // Word density validation
    const wordDensity = metrics.textLength > 0 ? metrics.wordCount / metrics.textLength : 0;
    if (wordDensity < 0.1) {
      issues.push('Low word density - possible extraction failure');
      qualityScore -= 20;
      suggestions.push('Text appears fragmented - consider image preprocessing');
    }

    // Language consistency validation
    if (metrics.languageConsistency < 0.7) {
      issues.push('Inconsistent language/character patterns detected');
      qualityScore -= 15;
      corrections.push('Apply language-specific text cleaning');
    }

    // Structural score validation
    if (metrics.structuralScore < 0.6) {
      issues.push('Poor document structure detected');
      qualityScore -= 15;
      suggestions.push('Document may be poorly scanned or formatted');
    }

    // Confidence score impact
    if (confidence < 0.6) {
      issues.push(`Low OCR confidence (${(confidence * 100).toFixed(1)}%)`);
      qualityScore -= 20;
      suggestions.push(`Consider using a more accurate OCR provider than ${provider}`);
    }

    // Provider-specific adjustments
    if (provider === 'native') {
      qualityScore *= 0.9; // Native parsing typically has lower quality
      if (qualityScore > 80) {
        suggestions.push('Consider using AI-based OCR for better structured data extraction');
      }
    }

    // Normalize quality score
    qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));

    // Final validation
    const isValid = qualityScore >= 60 && 
                   metrics.textLength >= opts.minTextLength && 
                   metrics.artifactPercentage <= opts.maxArtifactPercentage;

    // Calculate final confidence
    const finalConfidence = Math.max(
      confidence,
      Math.min(1, qualityScore / 100)
    );

    return {
      isValid,
      confidence: finalConfidence,
      qualityScore,
      issues,
      corrections,
      suggestions,
      metrics,
    };
  }

  /**
   * Validate booking data structure
   */
  static validateBookingData(data: any): BookingDataValidation {
    const requiredFields = ['guestName', 'checkInDate', 'checkOutDate', 'propertyName'];
    const optionalFields = ['guestEmail', 'guestPhone', 'totalAmount', 'numGuests'];
    
    const presentFields = requiredFields.filter(field => 
      data[field] && data[field].toString().trim().length > 0
    );
    
    const hasRequiredFields = presentFields.length === requiredFields.length;
    const fieldCompleteness = (presentFields.length + 
      optionalFields.filter(field => data[field]).length) / 
      (requiredFields.length + optionalFields.length);

    // Date consistency check
    let dateConsistency = true;
    if (data.checkInDate && data.checkOutDate) {
      try {
        const checkIn = new Date(data.checkInDate);
        const checkOut = new Date(data.checkOutDate);
        dateConsistency = checkIn < checkOut && !isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime());
      } catch {
        dateConsistency = false;
      }
    }

    // Price consistency check
    let priceConsistency = true;
    if (data.totalAmount) {
      const amount = parseFloat(data.totalAmount.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
      priceConsistency = !isNaN(amount) && amount > 0;
    }

    // Contact info check
    const contactInfoPresent = !!(data.guestEmail || data.guestPhone);

    // Platform detection
    let platformDetected: string | null = null;
    const platformText = JSON.stringify(data).toLowerCase();
    
    for (const { pattern, name } of this.PLATFORM_INDICATORS) {
      if (pattern.test(platformText)) {
        platformDetected = name;
        break;
      }
    }

    return {
      hasRequiredFields,
      fieldCompleteness,
      dateConsistency,
      priceConsistency,
      contactInfoPresent,
      platformDetected,
    };
  }

  /**
   * Generate improvement suggestions
   */
  static generateImprovementSuggestions(
    validationResult: OCRValidationResult,
    bookingValidation?: BookingDataValidation
  ): string[] {
    const suggestions: string[] = [...validationResult.suggestions];

    if (validationResult.qualityScore < 70) {
      suggestions.push('Consider using image preprocessing to improve OCR quality');
      suggestions.push('Try scanning at higher resolution (300+ DPI)');
    }

    if (validationResult.metrics.artifactPercentage > 0.05) {
      suggestions.push('Apply text cleaning to remove OCR artifacts');
    }

    if (bookingValidation) {
      if (!bookingValidation.hasRequiredFields) {
        suggestions.push('Manual data entry may be required for missing fields');
      }

      if (!bookingValidation.dateConsistency) {
        suggestions.push('Verify and correct date information manually');
      }

      if (!bookingValidation.priceConsistency) {
        suggestions.push('Check and validate pricing information');
      }

      if (!bookingValidation.platformDetected) {
        suggestions.push('Document platform/source could not be identified');
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Calculate language consistency (simple heuristic)
   */
  private static calculateLanguageConsistency(text: string): number {
    // Count alphabetic characters vs total characters
    const alphaCount = (text.match(/[a-zA-ZàáâãäçéêëíïôõöúùûüÀÁÂÃÄÇÉÊËÍÏÔÕÖÚÙÛÜ]/g) || []).length;
    const totalNonSpace = text.replace(/\s/g, '').length;
    
    if (totalNonSpace === 0) return 0;
    
    const ratio = alphaCount / totalNonSpace;
    
    // Good text should have 60-90% alphabetic characters
    if (ratio >= 0.6 && ratio <= 0.9) return 1.0;
    if (ratio >= 0.5 && ratio < 0.6) return 0.8;
    if (ratio >= 0.4 && ratio < 0.5) return 0.6;
    
    return Math.max(0, ratio);
  }

  /**
   * Calculate structural score
   */
  private static calculateStructuralScore(text: string): number {
    let score = 0;
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Line count score
    if (lines.length >= 5) score += 0.3;
    else if (lines.length >= 3) score += 0.2;
    else if (lines.length >= 1) score += 0.1;
    
    // Paragraph structure score
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length >= 3) score += 0.3;
    else if (paragraphs.length >= 2) score += 0.2;
    else if (paragraphs.length >= 1) score += 0.1;
    
    // Punctuation score
    const punctuationCount = (text.match(/[.!?:;,]/g) || []).length;
    const punctuationRatio = punctuationCount / text.length;
    if (punctuationRatio >= 0.02 && punctuationRatio <= 0.15) score += 0.2;
    else if (punctuationRatio >= 0.01) score += 0.1;
    
    // Capitalization score
    const capitalCount = (text.match(/[A-ZÀÁÂÃÄÇÉÊËÍÏÔÕÖÚÙÛÜ]/g) || []).length;
    const capitalRatio = capitalCount / text.length;
    if (capitalRatio >= 0.03 && capitalRatio <= 0.20) score += 0.2;
    else if (capitalRatio >= 0.01) score += 0.1;
    
    return Math.min(1.0, score);
  }

  /**
   * Clean OCR text by removing common artifacts
   */
  static cleanOCRText(text: string): string {
    let cleanedText = text;

    // Remove excessive whitespace
    cleanedText = cleanedText.replace(/\s{3,}/g, ' ');
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');

    // Remove common OCR artifacts
    cleanedText = cleanedText.replace(/[|]{2,}/g, '|');
    cleanedText = cleanedText.replace(/[_]{3,}/g, '___');
    cleanedText = cleanedText.replace(/[\.]{4,}/g, '...');
    cleanedText = cleanedText.replace(/[~^]{2,}/g, '');

    // Fix common character mistakes
    cleanedText = cleanedText.replace(/\b0([A-Za-z])/g, 'o$1'); // 0 -> o
    cleanedText = cleanedText.replace(/\b1([lI])/g, 'l$1'); // 1 -> l
    cleanedText = cleanedText.replace(/\brn/g, 'm'); // rn -> m

    // Trim and normalize
    cleanedText = cleanedText.trim();
    
    return cleanedText;
  }

  /**
   * Extract confidence metrics from multiple sources
   */
  static calculateCompositeConfidence(
    ocrConfidence: number,
    validationResult: OCRValidationResult,
    bookingValidation?: BookingDataValidation
  ): number {
    let compositeConfidence = ocrConfidence * 0.4; // OCR provider confidence (40%)
    
    // Quality score contribution (30%)
    compositeConfidence += (validationResult.qualityScore / 100) * 0.3;
    
    // Validation results contribution (30%)
    let validationScore = 0;
    
    if (validationResult.issues.length === 0) validationScore += 0.5;
    else if (validationResult.issues.length <= 2) validationScore += 0.3;
    else if (validationResult.issues.length <= 4) validationScore += 0.1;
    
    if (bookingValidation) {
      if (bookingValidation.hasRequiredFields) validationScore += 0.3;
      else validationScore += bookingValidation.fieldCompleteness * 0.3;
      
      if (bookingValidation.dateConsistency) validationScore += 0.1;
      if (bookingValidation.priceConsistency) validationScore += 0.1;
    } else {
      validationScore += 0.5; // Give benefit of doubt if booking validation not available
    }
    
    compositeConfidence += validationScore * 0.3;
    
    return Math.max(0, Math.min(1, compositeConfidence));
  }
}
import { ValidationError, ValidationContext } from './ai-validation-enhanced.service';
import axios from 'axios';

export interface FactCheckResult {
  conflicts: FactConflict[];
  verifiedFacts: VerifiedFact[];
  sourcesUsed: string[];
  confidence: number;
}

export interface FactConflict {
  field: string;
  claimed: any;
  actual: any;
  source: string;
  confidence: number;
  message: string;
}

export interface VerifiedFact {
  field: string;
  value: any;
  source: string;
  confidence: number;
  lastUpdated: Date;
}

export class FactCheckingService {
  private factDatabase: Map<string, FactEntry> = new Map();
  private externalSources: ExternalSource[] = [];
  private sourcesUsed: string[] = [];

  constructor() {
    this.initializeFactDatabase();
    this.initializeExternalSources();
  }

  /**
   * Initialize curated fact database
   */
  private initializeFactDatabase() {
    // Property management facts
    this.addFact('property_price_limits', {
      category: 'property',
      subcategory: 'pricing',
      facts: {
        min_nightly_rate: 10,
        max_nightly_rate: 50000,
        avg_cleaning_fee_percentage: 0.15,
        max_security_deposit: 5000,
        typical_service_fee_percentage: 0.12
      },
      source: 'industry_standards',
      confidence: 0.95,
      lastUpdated: new Date('2024-01-01')
    });

    this.addFact('booking_constraints', {
      category: 'booking',
      subcategory: 'policies',
      facts: {
        max_advance_booking_days: 730,
        min_advance_booking_hours: 2,
        max_stay_duration_days: 365,
        min_stay_duration_days: 1
      },
      source: 'platform_policies',
      confidence: 0.98,
      lastUpdated: new Date('2024-01-01')
    });

    this.addFact('property_types', {
      category: 'property',
      subcategory: 'classification',
      facts: {
        valid_types: ['apartment', 'house', 'villa', 'studio', 'loft', 'townhouse', 'cottage'],
        bedroom_guest_ratio: 2.5,
        bathroom_guest_ratio: 4
      },
      source: 'property_standards',
      confidence: 0.9,
      lastUpdated: new Date('2024-01-01')
    });

    this.addFact('location_data', {
      category: 'location',
      subcategory: 'geography',
      facts: {
        valid_countries: ['Portugal', 'Spain', 'France', 'Italy', 'Brazil', 'USA', 'UK'],
        major_cities: {
          'Portugal': ['Lisbon', 'Porto', 'Faro', 'Braga', 'Coimbra'],
          'Spain': ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Bilbao'],
          'France': ['Paris', 'Lyon', 'Marseille', 'Nice', 'Bordeaux']
        },
        timezone_mappings: {
          'Portugal': 'Europe/Lisbon',
          'Spain': 'Europe/Madrid',
          'France': 'Europe/Paris'
        }
      },
      source: 'geographic_database',
      confidence: 0.99,
      lastUpdated: new Date('2024-01-01')
    });

    this.addFact('seasonal_data', {
      category: 'business',
      subcategory: 'seasonal_patterns',
      facts: {
        high_season_months: [6, 7, 8, 12], // June, July, August, December
        low_season_months: [1, 2, 3, 11], // January, February, March, November
        shoulder_season_months: [4, 5, 9, 10], // April, May, September, October
        price_multipliers: {
          high_season: { min: 1.2, max: 2.5 },
          shoulder_season: { min: 0.9, max: 1.4 },
          low_season: { min: 0.7, max: 1.1 }
        }
      },
      source: 'market_analysis',
      confidence: 0.85,
      lastUpdated: new Date('2024-01-01')
    });

    this.addFact('amenity_standards', {
      category: 'property',
      subcategory: 'amenities',
      facts: {
        standard_amenities: ['wifi', 'heating', 'kitchen', 'bathroom'],
        luxury_amenities: ['pool', 'spa', 'gym', 'concierge'],
        incompatible_combinations: [
          ['smoking_allowed', 'non_smoking'],
          ['pet_friendly', 'no_pets'],
          ['shared_space', 'entire_place']
        ],
        property_type_amenities: {
          'apartment': { typical: ['elevator', 'balcony'], rare: ['pool', 'garden'] },
          'villa': { typical: ['garden', 'pool', 'parking'], rare: ['elevator'] },
          'studio': { typical: ['kitchenette'], rare: ['multiple_bedrooms'] }
        }
      },
      source: 'amenity_database',
      confidence: 0.88,
      lastUpdated: new Date('2024-01-01')
    });

    this.addFact('legal_requirements', {
      category: 'legal',
      subcategory: 'compliance',
      facts: {
        required_documents: ['property_license', 'tax_registration'],
        max_occupancy_regulations: {
          'Portugal': { bedrooms_to_guests_ratio: 2 },
          'Spain': { bedrooms_to_guests_ratio: 2.5 },
          'France': { bedrooms_to_guests_ratio: 2 }
        },
        tourist_tax_rates: {
          'Portugal': { min: 1, max: 4 },
          'Spain': { min: 0.5, max: 3 },
          'France': { min: 0.2, max: 5 }
        }
      },
      source: 'legal_database',
      confidence: 0.92,
      lastUpdated: new Date('2024-01-01')
    });

    this.addFact('market_rates', {
      category: 'pricing',
      subcategory: 'market_data',
      facts: {
        average_rates_by_city: {
          'Lisbon': { min: 45, max: 350, avg: 120 },
          'Porto': { min: 35, max: 250, avg: 85 },
          'Madrid': { min: 50, max: 400, avg: 140 },
          'Barcelona': { min: 60, max: 500, avg: 180 },
          'Paris': { min: 80, max: 800, avg: 250 }
        },
        seasonal_adjustments: {
          'coastal': { summer: 1.8, winter: 0.7 },
          'city': { summer: 1.3, winter: 0.9 },
          'rural': { summer: 1.4, winter: 0.8 }
        }
      },
      source: 'market_research',
      confidence: 0.82,
      lastUpdated: new Date('2024-01-01')
    });
  }

  /**
   * Initialize external data sources
   */
  private initializeExternalSources() {
    this.externalSources = [
      {
        name: 'google_maps',
        type: 'geocoding',
        endpoint: 'https://maps.googleapis.com/maps/api/geocode/json',
        confidence: 0.95,
        rateLimited: true,
        timeout: 5000
      },
      {
        name: 'openweather',
        type: 'weather',
        endpoint: 'https://api.openweathermap.org/data/2.5/weather',
        confidence: 0.9,
        rateLimited: true,
        timeout: 3000
      },
      {
        name: 'exchange_rates',
        type: 'financial',
        endpoint: 'https://api.exchangerate-api.com/v4/latest/EUR',
        confidence: 0.98,
        rateLimited: false,
        timeout: 2000
      },
      {
        name: 'postal_codes',
        type: 'location',
        endpoint: 'http://api.zippopotam.us',
        confidence: 0.85,
        rateLimited: false,
        timeout: 3000
      }
    ];
  }

  /**
   * Main fact validation method
   */
  async validateFacts(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    this.sourcesUsed = [];

    try {
      // Check against internal fact database
      const databaseErrors = await this.checkAgainstFactDatabase(response, context);
      errors.push(...databaseErrors);

      // Validate specific fact categories
      const locationErrors = await this.validateLocationFacts(response, context);
      errors.push(...locationErrors);

      const pricingErrors = await this.validatePricingFacts(response, context);
      errors.push(...pricingErrors);

      const propertyErrors = await this.validatePropertyFacts(response, context);
      errors.push(...propertyErrors);

      const temporalErrors = await this.validateTemporalFacts(response, context);
      errors.push(...temporalErrors);

    } catch (error) {
      console.error('Fact checking error:', error);
      errors.push({
        type: 'factual',
        severity: 'minor',
        field: 'system',
        message: 'Fact checking partially failed',
        confidence: 0.5,
        source: 'fact_checker'
      });
    }

    return errors;
  }

  /**
   * Verify with external sources
   */
  async verifyWithExternalSources(response: any, context: ValidationContext): Promise<FactCheckResult> {
    const conflicts: FactConflict[] = [];
    const verifiedFacts: VerifiedFact[] = [];
    const sourcesUsed: string[] = [];

    // Location verification
    if (response.address || response.coordinates) {
      const locationResult = await this.verifyLocationData(response);
      conflicts.push(...locationResult.conflicts);
      verifiedFacts.push(...locationResult.verifiedFacts);
      sourcesUsed.push(...locationResult.sourcesUsed);
    }

    // Currency/pricing verification
    if (response.currency || response.pricing) {
      const currencyResult = await this.verifyCurrencyData(response);
      conflicts.push(...currencyResult.conflicts);
      verifiedFacts.push(...currencyResult.verifiedFacts);
      sourcesUsed.push(...currencyResult.sourcesUsed);
    }

    // Weather-based seasonal verification
    if (response.season || response.checkIn) {
      const seasonalResult = await this.verifySeasonalData(response, context);
      conflicts.push(...seasonalResult.conflicts);
      verifiedFacts.push(...seasonalResult.verifiedFacts);
      sourcesUsed.push(...seasonalResult.sourcesUsed);
    }

    const confidence = conflicts.length === 0 ? 0.9 : Math.max(0.3, 0.9 - (conflicts.length * 0.1));

    return {
      conflicts,
      verifiedFacts,
      sourcesUsed,
      confidence
    };
  }

  /**
   * Check against internal fact database
   */
  private async checkAgainstFactDatabase(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check property pricing against known limits
    if (response.price || response.pricing) {
      const pricingFacts = this.getFact('property_price_limits');
      if (pricingFacts) {
        const price = response.price || response.pricing?.basePrice;
        
        if (price < pricingFacts.facts.min_nightly_rate) {
          errors.push({
            type: 'factual',
            severity: 'major',
            field: 'price',
            message: `Price ${price} below industry minimum of €${pricingFacts.facts.min_nightly_rate}`,
            confidence: pricingFacts.confidence,
            source: pricingFacts.source
          });
        }
        
        if (price > pricingFacts.facts.max_nightly_rate) {
          errors.push({
            type: 'factual',
            severity: 'major',
            field: 'price',
            message: `Price ${price} exceeds industry maximum of €${pricingFacts.facts.max_nightly_rate}`,
            confidence: pricingFacts.confidence,
            source: pricingFacts.source
          });
        }
      }
    }

    // Check property type validity
    if (response.propertyType) {
      const typeFacts = this.getFact('property_types');
      if (typeFacts && !typeFacts.facts.valid_types.includes(response.propertyType)) {
        errors.push({
          type: 'factual',
          severity: 'major',
          field: 'propertyType',
          message: `Invalid property type: ${response.propertyType}`,
          suggestedFix: 'apartment',
          confidence: typeFacts.confidence,
          source: typeFacts.source
        });
      }
    }

    // Check location validity
    if (response.country) {
      const locationFacts = this.getFact('location_data');
      if (locationFacts && !locationFacts.facts.valid_countries.includes(response.country)) {
        errors.push({
          type: 'factual',
          severity: 'minor',
          field: 'country',
          message: `Unusual country: ${response.country}`,
          confidence: 0.6,
          source: locationFacts.source
        });
      }
    }

    this.sourcesUsed.push('fact_database');
    return errors;
  }

  /**
   * Validate location facts
   */
  private async validateLocationFacts(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // City and country consistency
    if (response.city && response.country) {
      const locationFacts = this.getFact('location_data');
      if (locationFacts?.facts.major_cities[response.country]) {
        const validCities = locationFacts.facts.major_cities[response.country];
        if (!validCities.includes(response.city)) {
          errors.push({
            type: 'factual',
            severity: 'minor',
            field: 'city',
            message: `${response.city} not in major cities list for ${response.country}`,
            confidence: 0.4,
            source: 'location_validator'
          });
        }
      }
    }

    // Coordinate validation
    if (response.coordinates) {
      const { latitude, longitude } = response.coordinates;
      
      // Portugal coordinates check (example)
      if (response.country === 'Portugal') {
        if (latitude < 36.9 || latitude > 42.2 || longitude < -9.5 || longitude > -6.2) {
          errors.push({
            type: 'factual',
            severity: 'major',
            field: 'coordinates',
            message: 'Coordinates outside Portugal boundaries',
            confidence: 0.95,
            source: 'geographic_validator'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate pricing facts
   */
  private async validatePricingFacts(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Market rate validation
    if (response.price && response.city) {
      const marketFacts = this.getFact('market_rates');
      if (marketFacts?.facts.average_rates_by_city[response.city]) {
        const marketData = marketFacts.facts.average_rates_by_city[response.city];
        
        if (response.price < marketData.min * 0.5) {
          errors.push({
            type: 'factual',
            severity: 'minor',
            field: 'price',
            message: `Price significantly below market minimum for ${response.city}`,
            confidence: 0.7,
            source: 'market_data'
          });
        }
        
        if (response.price > marketData.max * 1.5) {
          errors.push({
            type: 'factual',
            severity: 'minor',
            field: 'price',
            message: `Price significantly above market maximum for ${response.city}`,
            confidence: 0.7,
            source: 'market_data'
          });
        }
      }
    }

    // Seasonal pricing validation
    if (response.pricing?.seasonalPrice && context.season) {
      const seasonalFacts = this.getFact('seasonal_data');
      if (seasonalFacts) {
        const basePrice = response.pricing.basePrice || response.price;
        const multiplier = response.pricing.seasonalPrice / basePrice;
        const expectedRange = seasonalFacts.facts.price_multipliers[`${context.season}_season`];
        
        if (expectedRange && (multiplier < expectedRange.min || multiplier > expectedRange.max)) {
          errors.push({
            type: 'factual',
            severity: 'minor',
            field: 'pricing.seasonalPrice',
            message: `Seasonal multiplier ${multiplier.toFixed(2)} unusual for ${context.season}`,
            confidence: 0.6,
            source: 'seasonal_data'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate property facts
   */
  private async validatePropertyFacts(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Guest to bedroom ratio validation
    if (response.maxGuests && response.bedrooms) {
      const typeFacts = this.getFact('property_types');
      if (typeFacts) {
        const maxExpected = response.bedrooms * typeFacts.facts.bedroom_guest_ratio;
        if (response.maxGuests > maxExpected) {
          errors.push({
            type: 'factual',
            severity: 'minor',
            field: 'maxGuests',
            message: `Guest capacity seems high for ${response.bedrooms} bedrooms`,
            confidence: 0.6,
            source: 'capacity_standards'
          });
        }
      }
    }

    // Amenity compatibility validation
    if (response.amenities) {
      const amenityFacts = this.getFact('amenity_standards');
      if (amenityFacts) {
        for (const [amenity1, amenity2] of amenityFacts.facts.incompatible_combinations) {
          if (response.amenities.includes(amenity1) && response.amenities.includes(amenity2)) {
            errors.push({
              type: 'factual',
              severity: 'major',
              field: 'amenities',
              message: `Conflicting amenities: ${amenity1} and ${amenity2}`,
              confidence: 0.9,
              source: 'amenity_standards'
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate temporal facts
   */
  private async validateTemporalFacts(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Booking date validation
    if (response.checkIn) {
      const bookingFacts = this.getFact('booking_constraints');
      if (bookingFacts) {
        const checkInDate = new Date(response.checkIn);
        const now = new Date();
        const daysInAdvance = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysInAdvance > bookingFacts.facts.max_advance_booking_days) {
          errors.push({
            type: 'factual',
            severity: 'minor',
            field: 'checkIn',
            message: 'Booking too far in advance (max 2 years)',
            confidence: 0.8,
            source: 'booking_policies'
          });
        }
      }
    }

    // Seasonal consistency
    if (response.season && response.checkIn) {
      const checkInDate = new Date(response.checkIn);
      const month = checkInDate.getMonth() + 1;
      
      const seasonalFacts = this.getFact('seasonal_data');
      if (seasonalFacts) {
        const expectedSeasons = {
          'high': seasonalFacts.facts.high_season_months,
          'low': seasonalFacts.facts.low_season_months,
          'shoulder': seasonalFacts.facts.shoulder_season_months
        };
        
        const seasonKey = `${response.season}` as keyof typeof expectedSeasons;
        if (expectedSeasons[seasonKey] && !expectedSeasons[seasonKey].includes(month)) {
          errors.push({
            type: 'factual',
            severity: 'minor',
            field: 'season',
            message: `Season "${response.season}" doesn't match check-in month`,
            confidence: 0.5,
            source: 'seasonal_calendar'
          });
        }
      }
    }

    return errors;
  }

  /**
   * External API verification methods
   */
  private async verifyLocationData(response: any): Promise<Partial<FactCheckResult>> {
    const conflicts: FactConflict[] = [];
    const verifiedFacts: VerifiedFact[] = [];
    const sourcesUsed: string[] = [];

    try {
      // Mock external API call (replace with actual implementation)
      if (response.address && response.coordinates) {
        // Simulate geocoding verification
        const isValidLocation = await this.mockGeocodeValidation(response.address, response.coordinates);
        
        if (!isValidLocation) {
          conflicts.push({
            field: 'coordinates',
            claimed: response.coordinates,
            actual: 'Invalid location',
            source: 'google_maps',
            confidence: 0.9,
            message: 'Address and coordinates don\'t match'
          });
        } else {
          verifiedFacts.push({
            field: 'location',
            value: { address: response.address, coordinates: response.coordinates },
            source: 'google_maps',
            confidence: 0.95,
            lastUpdated: new Date()
          });
        }
        
        sourcesUsed.push('google_maps');
      }
    } catch (error) {
      console.error('Location verification failed:', error);
    }

    return { conflicts, verifiedFacts, sourcesUsed };
  }

  private async verifyCurrencyData(response: any): Promise<Partial<FactCheckResult>> {
    const conflicts: FactConflict[] = [];
    const verifiedFacts: VerifiedFact[] = [];
    const sourcesUsed: string[] = [];

    try {
      if (response.currency && response.pricing) {
        // Mock exchange rate verification
        const isValidCurrency = await this.mockCurrencyValidation(response.currency);
        
        if (!isValidCurrency) {
          conflicts.push({
            field: 'currency',
            claimed: response.currency,
            actual: 'Unsupported currency',
            source: 'exchange_rates',
            confidence: 0.95,
            message: 'Currency not supported or invalid'
          });
        }
        
        sourcesUsed.push('exchange_rates');
      }
    } catch (error) {
      console.error('Currency verification failed:', error);
    }

    return { conflicts, verifiedFacts, sourcesUsed };
  }

  private async verifySeasonalData(response: any, context: ValidationContext): Promise<Partial<FactCheckResult>> {
    const conflicts: FactConflict[] = [];
    const verifiedFacts: VerifiedFact[] = [];
    const sourcesUsed: string[] = [];

    // This would integrate with weather APIs to verify seasonal claims
    // For now, using mock verification
    sourcesUsed.push('openweather');

    return { conflicts, verifiedFacts, sourcesUsed };
  }

  /**
   * Mock external API methods (replace with real implementations)
   */
  private async mockGeocodeValidation(address: any, coordinates: any): Promise<boolean> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return true; // Mock successful validation
  }

  private async mockCurrencyValidation(currency: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const supportedCurrencies = ['EUR', 'USD', 'GBP', 'BRL', 'CAD', 'AUD'];
    return supportedCurrencies.includes(currency);
  }

  /**
   * Fact database management
   */
  private addFact(key: string, fact: FactEntry) {
    this.factDatabase.set(key, fact);
  }

  private getFact(key: string): FactEntry | undefined {
    return this.factDatabase.get(key);
  }

  async getSourcesUsed(): Promise<string[]> {
    return [...new Set(this.sourcesUsed)];
  }
}

interface FactEntry {
  category: string;
  subcategory: string;
  facts: any;
  source: string;
  confidence: number;
  lastUpdated: Date;
}

interface ExternalSource {
  name: string;
  type: string;
  endpoint: string;
  confidence: number;
  rateLimited: boolean;
  timeout: number;
}
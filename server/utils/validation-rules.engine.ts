import { ValidationError, ValidationContext } from '../services/ai-validation-enhanced.service';

export class ValidationRulesEngine {
  private rulesAppliedCount = 0;
  private businessRules: BusinessRule[] = [];
  private dataTypeRules: DataTypeRule[] = [];
  private formatRules: FormatRule[] = [];

  constructor() {
    this.initializeBusinessRules();
    this.initializeDataTypeRules();
    this.initializeFormatRules();
  }

  /**
   * Initialize 20+ comprehensive business rules
   */
  private initializeBusinessRules() {
    this.businessRules = [
      // Property Management Rules
      {
        id: 'property_price_range',
        name: 'Property Price Range Validation',
        category: 'property',
        validate: (response: any, context: ValidationContext) => {
          if (response.price && (response.price < 0 || response.price > 50000)) {
            return [{
              type: 'business',
              severity: 'critical',
              field: 'price',
              message: 'Property price must be between €0 and €50,000 per night',
              suggestedFix: Math.min(Math.max(response.price, 50), 2000).toString(),
              confidence: 0.95,
              source: 'property_price_validator'
            }];
          }
          return [];
        }
      },
      {
        id: 'guest_capacity_limit',
        name: 'Guest Capacity Validation',
        category: 'property',
        validate: (response: any, context: ValidationContext) => {
          if (response.maxGuests && (response.maxGuests < 1 || response.maxGuests > 50)) {
            return [{
              type: 'business',
              severity: 'major',
              field: 'maxGuests',
              message: 'Guest capacity must be between 1 and 50',
              suggestedFix: Math.min(Math.max(response.maxGuests, 1), 20).toString(),
              confidence: 0.9,
              source: 'capacity_validator'
            }];
          }
          return [];
        }
      },
      {
        id: 'booking_date_future',
        name: 'Future Booking Date Validation',
        category: 'booking',
        validate: (response: any, context: ValidationContext) => {
          const errors: ValidationError[] = [];
          if (response.checkIn) {
            const checkInDate = new Date(response.checkIn);
            const today = new Date();
            if (checkInDate <= today) {
              errors.push({
                type: 'business',
                severity: 'critical',
                field: 'checkIn',
                message: 'Check-in date must be in the future',
                suggestedFix: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                confidence: 0.98,
                source: 'date_validator'
              });
            }
          }
          return errors;
        }
      },
      {
        id: 'booking_duration_limit',
        name: 'Booking Duration Validation',
        category: 'booking',
        validate: (response: any, context: ValidationContext) => {
          if (response.checkIn && response.checkOut) {
            const checkIn = new Date(response.checkIn);
            const checkOut = new Date(response.checkOut);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            
            if (nights > 365) {
              return [{
                type: 'business',
                severity: 'major',
                field: 'duration',
                message: 'Booking duration cannot exceed 365 nights',
                confidence: 0.92,
                source: 'duration_validator'
              }];
            }
            if (nights < 1) {
              return [{
                type: 'business',
                severity: 'critical',
                field: 'duration',
                message: 'Check-out must be after check-in date',
                confidence: 0.98,
                source: 'duration_validator'
              }];
            }
          }
          return [];
        }
      },
      {
        id: 'minimum_advance_booking',
        name: 'Minimum Advance Booking',
        category: 'booking',
        validate: (response: any, context: ValidationContext) => {
          if (response.checkIn) {
            const checkIn = new Date(response.checkIn);
            const now = new Date();
            const hoursAdvance = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
            
            if (hoursAdvance < 24) {
              return [{
                type: 'business',
                severity: 'major',
                field: 'checkIn',
                message: 'Bookings must be made at least 24 hours in advance',
                confidence: 0.85,
                source: 'advance_booking_validator'
              }];
            }
          }
          return [];
        }
      },
      {
        id: 'seasonal_pricing_validation',
        name: 'Seasonal Pricing Consistency',
        category: 'pricing',
        validate: (response: any, context: ValidationContext) => {
          if (response.pricing && context.season) {
            const basePrice = response.pricing.basePrice || response.price;
            const seasonalMultipliers = {
              'summer': { min: 1.2, max: 2.5 },
              'winter': { min: 0.8, max: 1.8 },
              'spring': { min: 0.9, max: 1.6 },
              'fall': { min: 0.85, max: 1.5 }
            };
            
            const multiplier = seasonalMultipliers[context.season as keyof typeof seasonalMultipliers];
            if (multiplier && response.pricing.seasonalPrice) {
              const actualMultiplier = response.pricing.seasonalPrice / basePrice;
              if (actualMultiplier < multiplier.min || actualMultiplier > multiplier.max) {
                return [{
                  type: 'business',
                  severity: 'minor',
                  field: 'seasonalPrice',
                  message: `Seasonal pricing for ${context.season} seems unusual`,
                  confidence: 0.7,
                  source: 'seasonal_pricing_validator'
                }];
              }
            }
          }
          return [];
        }
      },
      {
        id: 'cleaning_fee_reasonable',
        name: 'Cleaning Fee Validation',
        category: 'pricing',
        validate: (response: any, context: ValidationContext) => {
          if (response.cleaningFee && response.price) {
            const feeRatio = response.cleaningFee / response.price;
            if (feeRatio > 0.5) {
              return [{
                type: 'business',
                severity: 'major',
                field: 'cleaningFee',
                message: 'Cleaning fee should not exceed 50% of nightly rate',
                suggestedFix: (response.price * 0.3).toFixed(2),
                confidence: 0.8,
                source: 'cleaning_fee_validator'
              }];
            }
          }
          return [];
        }
      },
      {
        id: 'security_deposit_limit',
        name: 'Security Deposit Validation',
        category: 'pricing',
        validate: (response: any, context: ValidationContext) => {
          if (response.securityDeposit) {
            if (response.securityDeposit > 5000) {
              return [{
                type: 'business',
                severity: 'major',
                field: 'securityDeposit',
                message: 'Security deposit cannot exceed €5,000',
                suggestedFix: '1000',
                confidence: 0.9,
                source: 'security_deposit_validator'
              }];
            }
          }
          return [];
        }
      },
      {
        id: 'property_address_completeness',
        name: 'Address Completeness Validation',
        category: 'property',
        validate: (response: any, context: ValidationContext) => {
          const errors: ValidationError[] = [];
          if (response.address) {
            const requiredFields = ['street', 'city', 'postalCode', 'country'];
            for (const field of requiredFields) {
              if (!response.address[field] || response.address[field].trim() === '') {
                errors.push({
                  type: 'business',
                  severity: 'major',
                  field: `address.${field}`,
                  message: `Address ${field} is required`,
                  confidence: 0.95,
                  source: 'address_validator'
                });
              }
            }
          }
          return errors;
        }
      },
      {
        id: 'contact_info_validation',
        name: 'Contact Information Validation',
        category: 'property',
        validate: (response: any, context: ValidationContext) => {
          const errors: ValidationError[] = [];
          if (response.contact) {
            if (response.contact.phone && !/^\+?[\d\s\-\(\)]{7,15}$/.test(response.contact.phone)) {
              errors.push({
                type: 'business',
                severity: 'major',
                field: 'contact.phone',
                message: 'Invalid phone number format',
                confidence: 0.85,
                source: 'contact_validator'
              });
            }
            if (response.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response.contact.email)) {
              errors.push({
                type: 'business',
                severity: 'critical',
                field: 'contact.email',
                message: 'Invalid email format',
                confidence: 0.98,
                source: 'contact_validator'
              });
            }
          }
          return errors;
        }
      },
      {
        id: 'amenities_consistency',
        name: 'Amenities Consistency Validation',
        category: 'property',
        validate: (response: any, context: ValidationContext) => {
          const errors: ValidationError[] = [];
          if (response.amenities) {
            // Check for conflicting amenities
            const conflicts = [
              ['petFriendly', 'noPets'],
              ['smoking', 'noSmoking'],
              ['pool', 'noPool']
            ];
            
            for (const [amenity1, amenity2] of conflicts) {
              if (response.amenities.includes(amenity1) && response.amenities.includes(amenity2)) {
                errors.push({
                  type: 'business',
                  severity: 'major',
                  field: 'amenities',
                  message: `Conflicting amenities: ${amenity1} and ${amenity2}`,
                  confidence: 0.95,
                  source: 'amenities_validator'
                });
              }
            }
          }
          return errors;
        }
      },
      {
        id: 'cancellation_policy_validity',
        name: 'Cancellation Policy Validation',
        category: 'policy',
        validate: (response: any, context: ValidationContext) => {
          if (response.cancellationPolicy) {
            const validPolicies = ['flexible', 'moderate', 'strict', 'super_strict', 'long_term'];
            if (!validPolicies.includes(response.cancellationPolicy)) {
              return [{
                type: 'business',
                severity: 'major',
                field: 'cancellationPolicy',
                message: 'Invalid cancellation policy',
                suggestedFix: 'moderate',
                confidence: 0.9,
                source: 'policy_validator'
              }];
            }
          }
          return [];
        }
      },
      {
        id: 'minimum_stay_reasonable',
        name: 'Minimum Stay Validation',
        category: 'policy',
        validate: (response: any, context: ValidationContext) => {
          if (response.minimumStay) {
            if (response.minimumStay > 30) {
              return [{
                type: 'business',
                severity: 'minor',
                field: 'minimumStay',
                message: 'Minimum stay over 30 nights may limit bookings',
                confidence: 0.7,
                source: 'minimum_stay_validator'
              }];
            }
            if (response.minimumStay < 1) {
              return [{
                type: 'business',
                severity: 'major',
                field: 'minimumStay',
                message: 'Minimum stay must be at least 1 night',
                suggestedFix: '1',
                confidence: 0.95,
                source: 'minimum_stay_validator'
              }];
            }
          }
          return [];
        }
      },
      {
        id: 'property_type_amenities_match',
        name: 'Property Type and Amenities Match',
        category: 'property',
        validate: (response: any, context: ValidationContext) => {
          const errors: ValidationError[] = [];
          if (response.propertyType && response.amenities) {
            const typeAmenityRules = {
              'apartment': { required: [], invalid: ['pool', 'garden', 'garage'] },
              'house': { required: [], invalid: [] },
              'villa': { required: ['garden'], invalid: [] },
              'studio': { required: [], invalid: ['multipleRooms'] }
            };
            
            const rules = typeAmenityRules[response.propertyType as keyof typeof typeAmenityRules];
            if (rules) {
              for (const invalidAmenity of rules.invalid) {
                if (response.amenities.includes(invalidAmenity)) {
                  errors.push({
                    type: 'business',
                    severity: 'minor',
                    field: 'amenities',
                    message: `${invalidAmenity} is unusual for ${response.propertyType}`,
                    confidence: 0.6,
                    source: 'property_type_validator'
                  });
                }
              }
            }
          }
          return errors;
        }
      },
      {
        id: 'financial_calculation_accuracy',
        name: 'Financial Calculation Validation',
        category: 'pricing',
        validate: (response: any, context: ValidationContext) => {
          const errors: ValidationError[] = [];
          if (response.pricing) {
            const { basePrice, cleaningFee = 0, serviceFee = 0, taxes = 0, total } = response.pricing;
            
            if (total) {
              const calculatedTotal = basePrice + cleaningFee + serviceFee + taxes;
              const difference = Math.abs(total - calculatedTotal);
              
              if (difference > 0.01) {
                errors.push({
                  type: 'business',
                  severity: 'critical',
                  field: 'pricing.total',
                  message: 'Total price calculation is incorrect',
                  suggestedFix: calculatedTotal.toFixed(2),
                  confidence: 0.99,
                  source: 'financial_validator'
                });
              }
            }
          }
          return errors;
        }
      },
      {
        id: 'availability_date_consistency',
        name: 'Availability Date Consistency',
        category: 'availability',
        validate: (response: any, context: ValidationContext) => {
          const errors: ValidationError[] = [];
          if (response.availability && Array.isArray(response.availability)) {
            for (let i = 0; i < response.availability.length; i++) {
              const period = response.availability[i];
              if (period.startDate && period.endDate) {
                const start = new Date(period.startDate);
                const end = new Date(period.endDate);
                
                if (start >= end) {
                  errors.push({
                    type: 'business',
                    severity: 'critical',
                    field: `availability[${i}]`,
                    message: 'End date must be after start date',
                    confidence: 0.98,
                    source: 'availability_validator'
                  });
                }
              }
            }
          }
          return errors;
        }
      },
      {
        id: 'image_url_accessibility',
        name: 'Image URL Validation',
        category: 'media',
        validate: (response: any, context: ValidationContext) => {
          const errors: ValidationError[] = [];
          if (response.images && Array.isArray(response.images)) {
            for (let i = 0; i < response.images.length; i++) {
              const imageUrl = response.images[i];
              if (typeof imageUrl === 'string' && !imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i)) {
                errors.push({
                  type: 'business',
                  severity: 'minor',
                  field: `images[${i}]`,
                  message: 'Invalid image URL format',
                  confidence: 0.8,
                  source: 'media_validator'
                });
              }
            }
          }
          return errors;
        }
      },
      {
        id: 'review_score_range',
        name: 'Review Score Validation',
        category: 'reviews',
        validate: (response: any, context: ValidationContext) => {
          if (response.reviewScore && (response.reviewScore < 1 || response.reviewScore > 5)) {
            return [{
              type: 'business',
              severity: 'major',
              field: 'reviewScore',
              message: 'Review score must be between 1 and 5',
              suggestedFix: Math.min(Math.max(response.reviewScore, 1), 5).toFixed(1),
              confidence: 0.95,
              source: 'review_validator'
            }];
          }
          return [];
        }
      },
      {
        id: 'host_response_time',
        name: 'Host Response Time Validation',
        category: 'host',
        validate: (response: any, context: ValidationContext) => {
          if (response.hostResponseTime) {
            const validTimes = ['within an hour', 'within a few hours', 'within a day', 'a few days or more'];
            if (!validTimes.includes(response.hostResponseTime)) {
              return [{
                type: 'business',
                severity: 'minor',
                field: 'hostResponseTime',
                message: 'Invalid host response time format',
                suggestedFix: 'within a few hours',
                confidence: 0.8,
                source: 'host_validator'
              }];
            }
          }
          return [];
        }
      },
      {
        id: 'location_coordinate_validation',
        name: 'Location Coordinates Validation',
        category: 'location',
        validate: (response: any, context: ValidationContext) => {
          const errors: ValidationError[] = [];
          if (response.coordinates) {
            const { latitude, longitude } = response.coordinates;
            if (latitude < -90 || latitude > 90) {
              errors.push({
                type: 'business',
                severity: 'critical',
                field: 'coordinates.latitude',
                message: 'Latitude must be between -90 and 90',
                confidence: 0.99,
                source: 'coordinate_validator'
              });
            }
            if (longitude < -180 || longitude > 180) {
              errors.push({
                type: 'business',
                severity: 'critical',
                field: 'coordinates.longitude',
                message: 'Longitude must be between -180 and 180',
                confidence: 0.99,
                source: 'coordinate_validator'
              });
            }
          }
          return errors;
        }
      }
    ];
  }

  /**
   * Initialize data type validation rules
   */
  private initializeDataTypeRules() {
    this.dataTypeRules = [
      {
        field: 'price',
        expectedType: 'number',
        validator: (value: any) => typeof value === 'number' && value >= 0
      },
      {
        field: 'maxGuests',
        expectedType: 'number',
        validator: (value: any) => typeof value === 'number' && Number.isInteger(value) && value > 0
      },
      {
        field: 'checkIn',
        expectedType: 'string',
        validator: (value: any) => typeof value === 'string' && !isNaN(Date.parse(value))
      },
      {
        field: 'checkOut',
        expectedType: 'string',
        validator: (value: any) => typeof value === 'string' && !isNaN(Date.parse(value))
      },
      {
        field: 'available',
        expectedType: 'boolean',
        validator: (value: any) => typeof value === 'boolean'
      }
    ];
  }

  /**
   * Initialize format validation rules
   */
  private initializeFormatRules() {
    this.formatRules = [
      {
        field: 'email',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format'
      },
      {
        field: 'phone',
        pattern: /^\+?[\d\s\-\(\)]{7,15}$/,
        message: 'Invalid phone number format'
      },
      {
        field: 'postalCode',
        pattern: /^[\d\w\s\-]{3,10}$/,
        message: 'Invalid postal code format'
      },
      {
        field: 'url',
        pattern: /^https?:\/\/.+/,
        message: 'Invalid URL format'
      }
    ];
  }

  /**
   * Apply all business rules
   */
  async applyBusinessRules(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const allErrors: ValidationError[] = [];
    this.rulesAppliedCount = 0;

    for (const rule of this.businessRules) {
      try {
        const errors = rule.validate(response, context);
        allErrors.push(...errors);
        this.rulesAppliedCount++;
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
      }
    }

    return allErrors;
  }

  /**
   * Validate data types
   */
  async validateDataTypes(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    for (const rule of this.dataTypeRules) {
      if (response.hasOwnProperty(rule.field)) {
        const value = response[rule.field];
        if (!rule.validator(value)) {
          errors.push({
            type: 'syntax',
            severity: 'major',
            field: rule.field,
            message: `Expected ${rule.expectedType} for field ${rule.field}`,
            confidence: 0.9,
            source: 'data_type_validator'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate formats
   */
  async validateFormats(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    const checkFormat = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          checkFormat(value, fieldPath);
        } else if (typeof value === 'string') {
          for (const rule of this.formatRules) {
            if (key.includes(rule.field) || fieldPath.includes(rule.field)) {
              if (!rule.pattern.test(value)) {
                errors.push({
                  type: 'syntax',
                  severity: 'major',
                  field: fieldPath,
                  message: rule.message,
                  confidence: 0.85,
                  source: 'format_validator'
                });
              }
            }
          }
        }
      }
    };

    checkFormat(response);
    return errors;
  }

  /**
   * Validate semantics
   */
  async validateSemantics(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Contextual semantic validation
    if (context.domain === 'property_management') {
      // Check if property-related fields make semantic sense
      if (response.bedrooms && response.maxGuests) {
        const maxExpectedGuests = response.bedrooms * 3; // Rough heuristic
        if (response.maxGuests > maxExpectedGuests) {
          errors.push({
            type: 'semantic',
            severity: 'minor',
            field: 'maxGuests',
            message: `High guest count (${response.maxGuests}) for ${response.bedrooms} bedrooms`,
            confidence: 0.6,
            source: 'semantic_validator'
          });
        }
      }

      // Check price vs property type correlation
      if (response.price && response.propertyType) {
        const priceRanges = {
          'studio': { min: 30, max: 150 },
          'apartment': { min: 50, max: 300 },
          'house': { min: 80, max: 500 },
          'villa': { min: 150, max: 1000 }
        };

        const range = priceRanges[response.propertyType as keyof typeof priceRanges];
        if (range && (response.price < range.min || response.price > range.max)) {
          errors.push({
            type: 'semantic',
            severity: 'minor',
            field: 'price',
            message: `Price ${response.price} seems unusual for ${response.propertyType}`,
            confidence: 0.5,
            source: 'semantic_validator'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate consistency
   */
  async validateConsistency(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Internal field consistency
    if (response.checkIn && response.checkOut && response.nights) {
      const checkIn = new Date(response.checkIn);
      const checkOut = new Date(response.checkOut);
      const calculatedNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (Math.abs(calculatedNights - response.nights) > 0) {
        errors.push({
          type: 'consistency',
          severity: 'major',
          field: 'nights',
          message: 'Nights value inconsistent with check-in/check-out dates',
          suggestedFix: calculatedNights.toString(),
          confidence: 0.95,
          source: 'consistency_validator'
        });
      }
    }

    // Pricing consistency
    if (response.pricing && response.price) {
      if (Math.abs(response.pricing.basePrice - response.price) > 0.01) {
        errors.push({
          type: 'consistency',
          severity: 'minor',
          field: 'pricing.basePrice',
          message: 'Base price in pricing object differs from main price field',
          confidence: 0.7,
          source: 'consistency_validator'
        });
      }
    }

    return errors;
  }

  /**
   * Property-specific validation rules
   */
  async validatePropertySpecificRules(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Property type specific validations
    if (context.propertyType === 'villa' && !response.garden && !response.pool) {
      errors.push({
        type: 'business',
        severity: 'minor',
        field: 'amenities',
        message: 'Villas typically have gardens or pools',
        confidence: 0.4,
        source: 'property_specific_validator'
      });
    }

    return errors;
  }

  /**
   * Financial validation rules
   */
  async validateFinancialRules(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Tax validation
    if (response.pricing?.taxes) {
      const basePrice = response.pricing.basePrice || response.price;
      const taxRate = response.pricing.taxes / basePrice;
      
      if (taxRate > 0.3) {
        errors.push({
          type: 'business',
          severity: 'major',
          field: 'pricing.taxes',
          message: 'Tax rate exceeds 30%, please verify',
          confidence: 0.8,
          source: 'financial_validator'
        });
      }
    }

    // Currency consistency
    if (response.currency && response.pricing) {
      const supportedCurrencies = ['EUR', 'USD', 'GBP', 'BRL'];
      if (!supportedCurrencies.includes(response.currency)) {
        errors.push({
          type: 'business',
          severity: 'minor',
          field: 'currency',
          message: 'Unsupported currency detected',
          suggestedFix: 'EUR',
          confidence: 0.7,
          source: 'financial_validator'
        });
      }
    }

    return errors;
  }

  /**
   * Booking validation rules
   */
  async validateBookingRules(response: any, context: ValidationContext): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Guest count validation
    if (response.guestCount && response.maxGuests && response.guestCount > response.maxGuests) {
      errors.push({
        type: 'business',
        severity: 'critical',
        field: 'guestCount',
        message: 'Guest count exceeds property maximum',
        suggestedFix: response.maxGuests.toString(),
        confidence: 0.99,
        source: 'booking_validator'
      });
    }

    // Special requirements validation
    if (response.specialRequests && response.specialRequests.length > 500) {
      errors.push({
        type: 'business',
        severity: 'minor',
        field: 'specialRequests',
        message: 'Special requests text is unusually long',
        confidence: 0.6,
        source: 'booking_validator'
      });
    }

    return errors;
  }

  getRulesAppliedCount(): number {
    return this.rulesAppliedCount;
  }
}

interface BusinessRule {
  id: string;
  name: string;
  category: string;
  validate: (response: any, context: ValidationContext) => ValidationError[];
}

interface DataTypeRule {
  field: string;
  expectedType: string;
  validator: (value: any) => boolean;
}

interface FormatRule {
  field: string;
  pattern: RegExp;
  message: string;
}
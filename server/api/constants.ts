/**
 * Constantes para o sistema Maria Faz
 * Este arquivo contém valores estáticos usados em vários componentes
 */

// Constantes para propriedades e seus preços
export const PROPERTY_TYPES = {
  APARTMENT_T0T1: "apartment_t0t1",
  APARTMENT_T2: "apartment_t2",
  APARTMENT_T3: "apartment_t3",
  APARTMENT_T4: "apartment_t4",
  APARTMENT_T5: "apartment_t5",
  HOUSE_V1: "house_v1",
  HOUSE_V2: "house_v2",
  HOUSE_V3: "house_v3",
  HOUSE_V4: "house_v4",
  HOUSE_V5: "house_v5",
};

// Preços base por tipo de imóvel conforme tabela oficial
export const BASE_PRICES = {
  [PROPERTY_TYPES.APARTMENT_T0T1]: 47,
  [PROPERTY_TYPES.APARTMENT_T2]: 60,
  [PROPERTY_TYPES.APARTMENT_T3]: 70,
  [PROPERTY_TYPES.APARTMENT_T4]: 80,
  [PROPERTY_TYPES.APARTMENT_T5]: 90,
  [PROPERTY_TYPES.HOUSE_V1]: 75,
  [PROPERTY_TYPES.HOUSE_V2]: 95,
  [PROPERTY_TYPES.HOUSE_V3]: 115,
  [PROPERTY_TYPES.HOUSE_V4]: 135,
  [PROPERTY_TYPES.HOUSE_V5]: 150,
};

// Valores de extras fixos
export const EXTRA_PRICES = {
  DUPLEX: 10,
  BBQ: 10,
  EXTERIOR_AREA: 10,
  GLASS_GARDEN: 10,
};

// Área exterior mínima para aplicar sobretaxa
export const EXTERIOR_AREA_THRESHOLD = 15;
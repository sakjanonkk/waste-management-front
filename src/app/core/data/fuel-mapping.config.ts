// Fuel Price API Configuration
export const FUEL_API_URL = 'https://api.chnwt.dev/thai-oil-api/latest';

// Cache duration: 20 hours (in milliseconds)
export const CACHE_DURATION_MS = 72000000;

// Mapping from database fuel_category to API fuel types
export const FUEL_TYPE_MAPPING: Record<string, string> = {
  'GASOLINE': 'gasohol_95',
  'DIESEL': 'diesel',
  'LPG': 'lpg',
  'NGV': 'ngv',
  'PREMIUM_DIESEL': 'premium_diesel',
};

// Default fallback prices (Baht per liter) if API fails
export const DEFAULT_FUEL_PRICES: Record<string, number> = {
  'gasohol_95': 35.0,
  'gasoline_95': 43.0,
  'diesel': 33.0,
  'premium_diesel': 42.0,
  'lpg': 18.0,
  'ngv': 15.0,
};

// Stations to include in average calculation (can be customized)
export const PREFERRED_STATIONS = ['ptt', 'bcp', 'shell', 'esso', 'caltex'];

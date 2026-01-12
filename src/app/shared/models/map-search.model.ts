export interface MapSearchResult {
  label: string;
  latitude: number;
  longitude: number;
  address?: string;
  provider?: 'nominatim' | 'google';
  raw?: unknown;
}

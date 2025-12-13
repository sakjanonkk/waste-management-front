export interface GeocodingRequest {
  latitude: number;
  longitude: number;
}

export interface GeocodingData {
  place_name: string;
  address: string;
  route: string;
  neighborhood: string;
  sublocality: string;
  locality: string;
  province: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

export interface GeocodingResponse {
  success: boolean;
  data?: GeocodingData;
  message?: string;
}

export interface LocationSelection {
  latitude: number;
  longitude: number;
  address: string;
  placeName: string;
}

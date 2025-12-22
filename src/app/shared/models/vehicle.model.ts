export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
export type FuelCategory = 'GASOLINE' | 'DIESEL';

export interface Vehicle {
  id: number;
  
  // Frontend field names (for compatibility)
  vehicle_reg_num?: string;
  regular_capacity?: number;
  recycle_capacity?: number;
  fuel_category?: FuelCategory;
  depreciation_thb?: number;
  
  // Backend field names (actual API response)
  registration_number?: string;
  regular_waste_capacity_kg?: number;
  recyclable_waste_capacity_kg?: number;
  fuel_type?: string;
  depreciation_value_per_year?: number;
  
  // Common fields
  status: VehicleStatus | string; // Allow lowercase from server
  vehicle_type?: string | null;
  image?: string; // from backend
  image_url?: string | null;
  current_driver_id?: number | null;
  current_driver?: {
    id: number;
    prefix: string;
    firstname: string;
    lastname: string;
  } | null;
  problem_reported?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface VehicleListResponse {
  success: boolean;
  data: {
    vehicles: Vehicle[];
    pagination: {
      total: number;
      page: number;
      per_page: number;
    };
  };
}

export interface VehicleResponse {
  success: boolean;
  data: Vehicle;
}
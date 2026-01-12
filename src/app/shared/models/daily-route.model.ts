export interface RoutePlan {
  route_id: number;
  route_date: string;
  driver_id: number;
  vehicle_id: number;
  point_ids: number[];
  estimated_distance_km: number;
  fuel_cost?: number;
  fixed_cost?: number;
  total_cost?: number;
}

export interface GenerateTodayResult {
  route_date: string;
  routes: RoutePlan[];
  summary?: {
    total_cost: number;
    total_fixed_cost: number;
    total_fuel_cost: number;
    total_vehicles: number;
    total_vehicles_available: number;
    total_distance_m: number;
  };
}

export interface StopView {
  stop_seq: number;
  point_id: number;
  point_name: string;
  latitude: number;
  longitude: number;
}

export interface RouteView {
  route_id: number;
  route_date: string;
  driver_id: number;
  vehicle_id: number;
  estimated_distance_km: number;
  fuel_cost_estimate_thb?: number;
  depreciation_estimate_thb?: number;
  fixed_cost?: number;
  regular_capacity?: number;
  recycle_capacity?: number;
  stops: StopView[];
}

export interface TodayRoutesViewResult {
  route_date: string;
  routes: RouteView[];
}

export interface RouteDirectionsView {
  route_id: number;
  vehicle_id: number;
  polylines: string[];
}

export interface TodayRoutesDirectionsResult {
  route_date: string;
  routes: RouteDirectionsView[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CollectionPoint {
  point_id: number;
  point_name: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'INACTIVE';
  point_image?: string;
  address?: string;
  problem_reported?: string;
  regular_capacity: number;
  recycle_capacity: number;
}

export interface CollectionPointListResponse {
  success: boolean;
  data: CollectionPoint[];
  total: number;
}

export interface CollectionPointResponse {
  success: boolean;
  data: CollectionPoint;
}

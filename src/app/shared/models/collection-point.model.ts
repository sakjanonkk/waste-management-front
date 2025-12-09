export interface CollectionPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive';
  image?: string;
  address?: string;
  problem_reported?: string;
  regular_capacity: number;
  recycle_capacity: number;
  created_at?: string;
  updated_at?: string;
}

export interface CollectionPointListResponse {
  success: boolean;
  data: {
    collection_points: CollectionPoint[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
    };
  };
}

export interface CollectionPointResponse {
  success: boolean;
  data: CollectionPoint;
}

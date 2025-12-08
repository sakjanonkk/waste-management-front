export type StaffRole = 'DRIVER' | 'COLLECTOR' | 'ADMIN';
export type StaffStatus = 'ACTIVE' | 'INACTIVE';

export interface Staff {
  id: number;
  prefix: string;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  role: StaffRole;
  status: StaffStatus | '';
  phone_number?: string;
  s_image?: string; // URL/Base64 for profile image
  picture?: string; // URL for uploaded image from backend
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface StaffListResponse {
  success: boolean;
  data: Staff[];
  total?: number;
}

export interface StaffResponse {
  success: boolean;
  data: Staff;
}

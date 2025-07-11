// frontend/src/types.ts

// Location type
export interface Location {
  id: number;
  name: string;
  address?: string;
}

// Material type
export interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
}

// Inventory type
export interface Inventory {
  id: number;
  material_id: number;
  location_id: number;
  quantity: number;
  last_updated: string;
  materials: Material;
  locations: Location;
}

// Packing Slip Form Item type (for form data)
export interface PackingSlipFormItem {
  material_id: string;  // string for form input
  gross_weight: string; // string for form input
  tare_weight: string;  // string for form input
  remarks?: string;
  ticket_number?: string;
}

// Packing Slip Item type (for API responses)
export interface PackingSlipItem {
  id: number;           // Added id field
  material_id: number;  // number from database
  material_name?: string;
  material?: Material;
  gross_weight: number; // number from database
  tare_weight: number;  // number from database
  net_weight?: number;  // optional calculated field
  remarks?: string;
  ticket_number?: string;
}

// Packing Slip type
export interface PackingSlip {
  id: string;
  slip_type: string;
  status: string;
  created_at: Date; 
  packing_slip_items: PackingSlipItem[];
  from_name?: string;
  to_name?: string;
  truck_number?: string;
  trailer_number?: string;
  po_number?: string;
  seal_number?: string;
  location_id?: number;
  user_id?: number;
}

// Form data types
export interface PackingSlipFormData {
  slip_type: string;
  location_id: string;
  status: string;
  from_name: string;
  to_name: string;
  truck_number: string;
  trailer_number: string;
  po_number: string;
  seal_number: string;
  items: PackingSlipFormItem[]; // Use FormItem here
}

export interface ReclassifyFormData {
  from_material_id: string;
  to_material_id: string;
  quantity: string;
  location_id: string;
}
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

// Packing Slip Item type
export interface PackingSlipItem {
  id: number;
  packing_slip_id: number;
  material_id: number;
  gross_weight: number;
  tare_weight: number;
    net_weight: number; // ADD THIS LINE

  remarks?: string;
  ticket_number?: string;
  materials?: Material;
}

// Packing Slip type
export interface PackingSlip {
  id: number;
  slip_type: string;
  status: string;
  from_name?: string;
  to_name?: string;
  date_time: string;
  truck_number?: string;
  trailer_number?: string;
  po_number?: string;
  seal_number?: string;
  location_id: number;
  packing_slip_items: PackingSlipItem[];
  locations?: Location;
}

// Form data types
export interface PackingSlipFormData {
  slip_type: string;
  location_id: string;
  items: {
    material_id: string;
    gross_weight: string;
    tare_weight: string;
    net_weight: number;
    remarks?: string;
    ticket_number?: string;
  }[];
}

export interface ReclassifyFormData {
  material_id: string;
  from_location_id: string;
  to_location_id: string;
  quantity: string;
}
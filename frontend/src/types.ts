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
  date_time: Date; 
  packing_slip_items: PackingSlipItem[];
  from_name?: string;
  to_name?: string;
  truck_number?: string;
  trailer_number?: string;
  po_number?: string;
  seal_number?: string;
  location_id?: number;
  user_id?: number;
  location_name?: string;
  location?: Location;
  deleted_at?: string | null;

  // New required fields
  customerAddress: string | null;
  carrierName: string | null;
  // New additions to packing slip
  vesselNumber?: string | null;
  voyageNumber?: string | null;
  containerNumber?: string | null;
  multiPoNotes?: string[];
  pickupNumber?: string | null;
  deliveryNumber?: string | null;
  deliveryDateTime?: Date | null;
  orderNumber?: string | null;
  careOf?: string | null;
  slipGroupId?: number | null;
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
   // NEW optional advanced info
  vesselNumber?: string;
  voyageNumber?: string;
  containerNumber?: string;
  multiPoNotes?: string[]; // This can be edited as a string input and split on comma
  customerAddress?: string;
  carrierName?: string;
  pickupNumber?: string;
  deliveryNumber?: string;
  deliveryDateTime?: Date | null; // Use `Date | null` since it's a date input
  orderNumber?: string;
  careOf?: string;
  slipGroupId?: number | null; // If you use it in the form, otherwise omit
}

export interface ReclassifyFormData {
  from_material_id: string;
  to_material_id: string;
  quantity: string;
  location_id: string;
}

// Audit Log
export interface AuditLogEntry {
  timestamp: string;
  change: number;
  source: 'Packing Slip' | 'Reclassification' | 'Manual Adjustment';
  packingSlipId?: number;
  remarks?: string | null;
  reason?: string | null;
  load?: string | null;
  direction?: 'From' | 'To';
  unit?: string;
  movedTo?: string;
  movedFrom?: string;
  slipType?: 'Inbound' | 'Outbound';
  snapshot_quantity?: number;
}

export interface InventoryItem {
  id: number;
  quantity: number;
  last_updated: string;
  materials: Material;
  locations?: { id: number };
}

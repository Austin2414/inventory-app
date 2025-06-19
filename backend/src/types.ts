// src/types.ts
export interface BasicParams {
  [key: string]: string;
}

export interface InventoryUpdateBody {
  quantity: number;
}

// src/types.ts
export type InventoryParams = {
  materialId: string;
  locationId: string;
};

export type InventoryBody = {
  material_id: number;
  location_id: number;
  quantity: number;
};

export type LocationBody = {
  name: string;
  address?: string;
};

export type MaterialBody = {
  name: string;
  category: string;
  unit?: string;
};
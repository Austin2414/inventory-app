// frontend/src/services/api.ts
import axios from 'axios';
import { PackingSlipFormData } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      return Promise.reject({
        message: error.response.data.error || 'Request failed',
        details: error.response.data.details,
        status: error.response.status
      });
    } else if (error.request) {
      return Promise.reject({
        message: 'No response from server',
        details: 'The backend might be down'
      });
    } else {
      return Promise.reject({
        message: 'Request error',
        details: error.message
      });
    }
  }
);

// Locations API
export const getLocations = () => api.get('/locations');
export const createLocation = (data: { name: string; address?: string }) => 
  api.post('/locations', data);

// Materials API
export const getMaterials = () => api.get('/materials');
export const createMaterial = (data: { name: string; category: string; unit?: string }) => 
  api.post('/materials', data);

// Inventory API
export const getInventory = () => api.get('/inventory');
export const createInventory = (data: { material_id: number; location_id: number; quantity: number }) => 
  api.post('/inventory', data);

// Packing Slips API - CRITICAL FIXES
export const getPackingSlip = (id: number) => api.get(`/packing-slips/${id}`);
export const createPackingSlip = (data: any) => api.post('/packing-slips', data);
export const getPackingSlips = (includeDeleted: boolean = false) =>
  api.get('/packing-slips/', {
    params: {
      includeDeleted
    }
  });
export const deletePackingSlip = (id: number) =>
  api.delete(`/packing-slips/${id}`);
export async function updatePackingSlip(id: number, formData: PackingSlipFormData) {
  return await fetch(`/api/packing-slips/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
}


// Reclassification API
export const reclassifyInventory = (data: any) => 
  api.post('/inventory/reclassify', data);

// Inventoryadjustment API
export const createInventoryAdjustment = (data: {
  material_id: number;
  location_id: number;
  change: number;
  reason?: string;
}) => api.post('/inventory-adjustments', data);

// Audit Log API
export const getAuditLog = (locationId: number, materialId: number) =>
  api.get(`/inventory/${locationId}/material/${materialId}/audit-log`);

export default api;
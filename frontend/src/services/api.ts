// frontend/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
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
export const updatePackingSlip = (id: number, data: any) => api.patch(`/packing-slips/${id}`, data); // Changed to PATCH
export const deletePackingSlip = (id: number) => api.delete(`/packing-slips/${id}`);
export const createPackingSlip = (data: any) => api.post('/packing-slips', data);
export const getPackingSlips = () => api.get('/packing-slips/');

// Reclassification API
export const reclassifyInventory = (data: any) => 
  api.post('/inventory/reclassify', data);

export default api;
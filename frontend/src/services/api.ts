// frontend/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // Your backend URL
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      return Promise.reject({
        message: error.response.data.error || 'Request failed',
        details: error.response.data.details,
        status: error.response.status
      });
    } else if (error.request) {
      // No response received
      return Promise.reject({
        message: 'No response from server',
        details: 'The backend might be down'
      });
    } else {
      // Request setup error
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

// Packing Slips API
// Add these to your API service
export const getPackingSlip = (id: number) => api.get(`/packing-slips/${id}`);
export const updatePackingSlip = (id: number, data: any) => api.put(`/packing-slips/${id}`, data);
export const updatePackingSlipStatus = (id: number, status: string) => 
  api.put(`/packing-slips/${id}/status`, { status });
export const deletePackingSlip = (id: number) => api.delete(`/packing-slips/${id}`);export const createPackingSlip = (data: any) => // Use the PackingSlipFormData type here
  api.post('/packing-slips', data);
export const getPackingSlips = () => api.get('/packing-slips/all');

// Reclassification API
export const reclassifyInventory = (data: any) => // Use the ReclassifyFormData type here
  api.post('/inventory/reclassify', data);

export default api;
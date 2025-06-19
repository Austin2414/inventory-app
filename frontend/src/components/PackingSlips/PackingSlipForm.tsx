// src/components/PackingSlips/PackingSlipForm.tsx
import React, { useState, useEffect } from 'react';
import { createPackingSlip } from '../../services/api';
import { Location, Material } from '../../types';

interface PackingSlipItem {
  material_id: string;
  gross_weight: string;
  tare_weight: string;
  remarks?: string;
  ticket_number?: string;
}

type PackingSlipFormProps = {
  id?: number;
  onSave: () => void;
  onEditDraft?: (id: number) => void;
};

const PackingSlipForm = ({ id, onSave, onEditDraft }: PackingSlipFormProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [formData, setFormData] = useState({
    slip_type: 'outbound',
    location_id: '',
    status: 'draft',
    items: [{ material_id: '', gross_weight: '', tare_weight: '' }] as PackingSlipItem[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch locations and materials on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you'd use your API service here
        const locResponse = await fetch('http://localhost:3001/locations');
        const locData = await locResponse.json();
        setLocations(locData);
        
        const matResponse = await fetch('http://localhost:3001/materials');
        const matData = await matResponse.json();
        setMaterials(matData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load required data');
      }
    };
    
    fetchData();
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { material_id: '', gross_weight: '', tare_weight: '' }]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      await createPackingSlip({
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          material_id: parseInt(item.material_id),
          gross_weight: parseFloat(item.gross_weight),
          tare_weight: parseFloat(item.tare_weight)
        }))
      });
      
      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        slip_type: 'outbound',
        location_id: '',
        status: 'draft',
        items: [{ material_id: '', gross_weight: '', tare_weight: '' }]
      });
    } catch (error) {
      // Handle TypeScript's 'unknown' type
      let errorMessage = 'Failed to create packing slip. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.error('Error creating packing slip:', error);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-header bg-info text-white">
        <h2 className="mb-0">Create Packing Slip</h2>
      </div>
      <div className="card-body">
        {success && (
          <div className="alert alert-success">
            Packing slip created successfully!
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Type:</label>
              <select 
                className="form-select"
                value={formData.slip_type} 
                onChange={e => setFormData({...formData, slip_type: e.target.value})}
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
            
            <div className="col-md-6">
              <label className="form-label">Status:</label>
              <select 
                className="form-select"
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Location:</label>
            <select
              className="form-select"
              value={formData.location_id}
              onChange={e => setFormData({...formData, location_id: e.target.value})}
              required
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} {location.address ? `(${location.address})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <h4 className="mt-4">Items</h4>
          
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Gross Weight</th>
                  <th>Tare Weight</th>
                  <th>Net Weight</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={item.material_id}
                        onChange={e => handleItemChange(index, 'material_id', e.target.value)}
                        required
                      >
                        <option value="">Select Material</option>
                        {materials.map(material => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.category})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={item.gross_weight}
                        onChange={e => handleItemChange(index, 'gross_weight', e.target.value)}
                        step="0.01"
                        min="0"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={item.tare_weight}
                        onChange={e => handleItemChange(index, 'tare_weight', e.target.value)}
                        step="0.01"
                        min="0"
                        required
                      />
                    </td>
                    <td className="align-middle">
                      {item.gross_weight && item.tare_weight ? 
                        (parseFloat(item.gross_weight) - parseFloat(item.tare_weight)).toFixed(2) : 
                        '0.00'
                      }
                    </td>
                    <td className="align-middle">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length <= 1}
                        title="Remove item"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="d-flex justify-content-between mt-3">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary"
              onClick={handleAddItem}
            >
              + Add Item
            </button>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Packing Slip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackingSlipForm;
export {};
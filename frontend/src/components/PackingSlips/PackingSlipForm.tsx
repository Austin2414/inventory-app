import React, { useState, useEffect } from 'react';
import { 
  Location, 
  Material, 
  PackingSlipFormData, 
  PackingSlipFormItem,
  PackingSlip
} from '../../types';
import { getLocations, getMaterials } from '../../services/api';

// FIX: Update interface to match number types
interface PackingSlipFormData {
  slip_type: string;
  location_id: number; // Changed to number
  status: string;
  from_name: string;
  to_name: string;
  truck_number: string;
  trailer_number: string;
  po_number: string;
  seal_number: string;
  items: PackingSlipFormItem[];
}

// FIX: Update item interface
interface PackingSlipFormItem {
  material_id: number; // Changed to number
  gross_weight: number; // Changed to number
  tare_weight: number; // Changed to number
  remarks: string;
  ticket_number: string;
}

interface PackingSlipFormProps {
  id?: number;
  onSave?: () => void;
  onEditDraft?: (id: number) => void;
  onSubmit: (formData: PackingSlipFormData) => void;
  isSubmitting: boolean;
  error?: string | null;
  success?: boolean;
  editData?: PackingSlip | null;
}

const PackingSlipForm: React.FC<PackingSlipFormProps> = ({ 
  onSubmit, 
  isSubmitting,
  error,
  success,
  editData
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [formError, setFormError] = useState<string | null>(null); // FIX: Added error state

  // Initialize form data with proper types
  const [formData, setFormData] = useState<PackingSlipFormData>({
    slip_type: 'outbound',
    location_id: 0, // Number type
    status: 'draft',
    from_name: '',
    to_name: '',
    truck_number: '',
    trailer_number: '',
    po_number: '',
    seal_number: '',
    items: [{ 
      material_id: 0, // Number type
      gross_weight: 0, // Number type
      tare_weight: 0, // Number type
      remarks: '',
      ticket_number: ''
    }]
  });

  // Fetch locations and materials
  useEffect(() => {
    const fetchData = async () => {
      try {
        const locResponse = await getLocations();
        setLocations(locResponse.data);
        
        const matResponse = await getMaterials();
        setMaterials(matResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setFormError('Failed to load required data'); // FIX: Use setFormError
      }
    };
    
    fetchData();
  }, []);

  // Handle edit data
  useEffect(() => {
    if (editData) {
      setFormData({
        slip_type: editData.slip_type,
        location_id: editData.location_id, // Already number
        status: editData.status,
        from_name: editData.from_name || '',
        to_name: editData.to_name || '',
        truck_number: editData.truck_number || '',
        trailer_number: editData.trailer_number || '',
        po_number: editData.po_number || '',
        seal_number: editData.seal_number || '',
        items: editData.packing_slip_items.map(item => ({
          material_id: item.material_id, // Already number
          gross_weight: item.gross_weight, // Already number
          tare_weight: item.tare_weight, // Already number
          remarks: item.remarks || '',
          ticket_number: item.ticket_number || ''
        }))
      });
    }
  }, [editData]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items, 
        { 
          material_id: 0, 
          gross_weight: 0, 
          tare_weight: 0,
          remarks: '',
          ticket_number: ''
        }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: keyof PackingSlipFormItem, value: string) => {
    const newItems = [...formData.items];
    const numericValue = field.includes('_id') || field.includes('weight') 
      ? parseFloat(value) || 0
      : value;
      
    newItems[index] = { ...newItems[index], [field]: numericValue };
    setFormData({ ...formData, items: newItems });
  };

  const handleChange = (field: keyof PackingSlipFormData, value: string) => {
    const numericValue = field === 'location_id' 
      ? parseInt(value) || 0
      : value;
      
    setFormData({ ...formData, [field]: numericValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (formData.location_id === 0) {
      setFormError('Location is required');
      return;
    }
    
    if (formData.items.some(item => item.material_id === 0)) {
      setFormError('All items must have a material selected');
      return;
    }
    
    setFormError(null);
    onSubmit(formData);
  };

  return (
    <div className="card mt-4">
      <div className="card-header bg-info text-white">
        <h2 className="mb-0">{editData ? 'Edit Packing Slip' : 'Create Packing Slip'}</h2>
      </div>
      <div className="card-body">
        {success && <div className="alert alert-success">Packing slip {editData ? 'updated' : 'created'} successfully!</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {formError && <div className="alert alert-danger">{formError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Type:</label>
              <select 
                className="form-select"
                value={formData.slip_type} 
                onChange={e => handleChange('slip_type', e.target.value)}
                disabled={editData?.status === 'completed'}
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
                onChange={e => handleChange('status', e.target.value)}
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
              onChange={e => handleChange('location_id', e.target.value)}
              required
              disabled={editData?.status === 'completed'}
            >
              <option value="0">Select Location</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} {location.address ? `(${location.address})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* Shipment Information */}
          <div className="border p-3 mb-4 rounded">
            <h5 className="mb-3">Shipment Information</h5>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Customer Name:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.to_name}
                  onChange={e => handleChange('to_name', e.target.value)}
                  disabled={editData?.status === 'completed'}
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">From Name:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.from_name}
                  onChange={e => handleChange('from_name', e.target.value)}
                  disabled={editData?.status === 'completed'}
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Truck Number:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.truck_number}
                  onChange={e => handleChange('truck_number', e.target.value)}
                  disabled={editData?.status === 'completed'}
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">Trailer Number:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.trailer_number}
                  onChange={e => handleChange('trailer_number', e.target.value)}
                  disabled={editData?.status === 'completed'}
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">PO Number:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.po_number}
                  onChange={e => handleChange('po_number', e.target.value)}
                  disabled={editData?.status === 'completed'}
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">Seal Number:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.seal_number}
                  onChange={e => handleChange('seal_number', e.target.value)}
                  disabled={editData?.status === 'completed'}
                />
              </div>
            </div>
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
                        disabled={editData?.status === 'completed'}
                      >
                        <option value="0">Select Material</option>
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
                        disabled={editData?.status === 'completed'}
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
                        disabled={editData?.status === 'completed'}
                      />
                    </td>
                    <td className="align-middle">
                      {(item.gross_weight - item.tare_weight).toFixed(2)}
                    </td>
                    <td className="align-middle">
                      {formData.items.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveItem(index)}
                          disabled={editData?.status === 'completed'}
                          title="Remove item"
                        >
                          ×
                        </button>
                      )}
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
              disabled={editData?.status === 'completed'}
            >
              + Add Item
            </button>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || editData?.status === 'completed'}
            >
              {isSubmitting 
                ? (editData ? 'Updating...' : 'Creating...') 
                : (editData ? 'Update Packing Slip' : 'Create Packing Slip')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackingSlipForm;
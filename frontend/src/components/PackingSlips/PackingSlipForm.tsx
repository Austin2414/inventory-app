import React, { useState, useEffect } from 'react';
import { 
  Location, 
  Material, 
  PackingSlipFormData, 
  PackingSlipFormItem,
  PackingSlip
} from '../../types';
import { getLocations, getMaterials } from '../../services/api'; // Use centralized API service

interface PackingSlipFormProps {
  id?: number;
  onSave: () => void;
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
  
  // Initialize form data with all required fields
  const [formData, setFormData] = useState<PackingSlipFormData>({
    slip_type: 'outbound',
    location_id: '',
    status: 'draft',
    from_name: '',
    to_name: '',
    truck_number: '',
    trailer_number: '',
    po_number: '',
    seal_number: '',
    items: [{ 
      material_id: '', 
      gross_weight: '', 
      tare_weight: '',
      remarks: '',
      ticket_number: ''
    }]
  });

  // Fetch locations and materials using API service
  useEffect(() => {
    const fetchData = async () => {
      try {
        const locResponse = await getLocations();
        setLocations(locResponse.data);
        
        const matResponse = await getMaterials();
        setMaterials(matResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Populate form when in edit mode
  useEffect(() => {
    if (editData) {
      setFormData({
        slip_type: editData.slip_type,
        location_id: String(editData.location_id),
        status: editData.status,
        from_name: editData.from_name || '',
        to_name: editData.to_name || '',
        truck_number: editData.truck_number || '',
        trailer_number: editData.trailer_number || '',
        po_number: editData.po_number || '',
        seal_number: editData.seal_number || '',
        items: editData.packing_slip_items.map(item => ({
          material_id: String(item.material_id),
          gross_weight: String(item.gross_weight),
          tare_weight: String(item.tare_weight),
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
          material_id: '', 
          gross_weight: '', 
          tare_weight: '',
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
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleChange = (field: keyof PackingSlipFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card mt-4">
      <div className="card-header bg-info text-white">
        <h2 className="mb-0">{editData ? 'Edit Packing Slip' : 'Create Packing Slip'}</h2>
      </div>
      <div className="card-body">
        {success && (
          <div className="alert alert-success">
            Packing slip {editData ? 'updated' : 'created'} successfully!
          </div>
        )}
        {error && <div className="alert alert-danger">{error}</div>}
        
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
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location.id} value={String(location.id)}>
                  {location.name} {location.address ? `(${location.address})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* Shipment Information Section */}
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

          <div className="table-responsive mb-4">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Material</th>
                  <th>Gross Weight</th>
                  <th>Tare Weight</th>
                  <th>Net Weight</th>
                  <th>Ticket #</th>
                  <th>Remarks</th>
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
                        <option value="">Select Material</option>
                        {materials.map(material => (
                          <option key={material.id} value={String(material.id)}>
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
                      {item.gross_weight && item.tare_weight ? 
                        (Number(item.gross_weight) - Number(item.tare_weight)).toFixed(2) : 
                        '0.00'
                      }
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={item.ticket_number}
                        onChange={e => handleItemChange(index, 'ticket_number', e.target.value)}
                        disabled={editData?.status === 'completed'}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={item.remarks}
                        onChange={e => handleItemChange(index, 'remarks', e.target.value)}
                        disabled={editData?.status === 'completed'}
                      />
                    </td>
                    <td className="align-middle text-center">
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
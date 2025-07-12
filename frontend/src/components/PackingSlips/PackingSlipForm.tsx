// src/components/PackingSlips/PackingSlipForm.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Location, Material, PackingSlipFormData, PackingSlipFormItem, PackingSlip } from '../../types';
import { getLocations, getMaterials, deletePackingSlip } from '../../services/api';

interface PackingSlipFormProps {
  id?: number;
  onSave: () => void;
  editData?: PackingSlip | null;
  isSubmitting: boolean;
  onSubmit: (formData: PackingSlipFormData) => void;
  error?: string | null;
  success?: boolean;
}

const PackingSlipForm: React.FC<PackingSlipFormProps> = ({
  onSave,
  onSubmit,
  editData,
  isSubmitting,
  error,
  success,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

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
    items: [
      {
        material_id: '',
        gross_weight: '',
        tare_weight: '',
        remarks: '',
        ticket_number: '',
      },
    ],
  });

  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!editData?.id) return;
    const confirm = window.confirm('Delete this draft packing slip?');
    if (!confirm) return;
    await deletePackingSlip(Number(editData.id));
    navigate('/packing-slips', { replace: true });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locRes = await getLocations();
        const matRes = await getMaterials();
        setLocations(locRes.data);
        setMaterials(matRes.data);
      } catch (err) {
        console.error('Failed to fetch:', err);
      }
    };
    fetchData();
  }, []);

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
          ticket_number: item.ticket_number || '',
        })),
      });
    }
  }, [editData]);

  const handleChange = (field: keyof PackingSlipFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof PackingSlipFormItem, value: string) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        material_id: '',
        gross_weight: '',
        tare_weight: '',
        remarks: '',
        ticket_number: '',
      }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.to_name || formData.items.length === 0) {
      alert('Customer name and at least one item are required.');
      return;
    }

    try {
      const method = editData && editData.status === 'draft' ? 'PATCH' : 'POST';
      const url = editData && editData.status === 'draft'
        ? `/api/packing-slips/${editData.id}`
        : '/api/packing-slips';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('Save error:', err);
        alert(err.message || 'Failed to save packing slip');
        return;
      }

      const result = await response.json();
      console.log('Save success:', result);
      window.location.reload(); // Full reload to reflect changes
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="card mt-4 shadow-sm">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">{editData ? 'Edit Packing Slip' : 'Create Packing Slip'}</h5>
      </div>

      <div className="card-body">
        {success && <div className="alert alert-success">Packing slip saved successfully!</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row mb-4">
            {/* Shipment Info */}
            <div className="col-md-6">
              <div className="card h-100 shadow-sm">
                <div className="card-header bg-light">
                  <strong>Shipment Info</strong>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Customer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.to_name}
                      onChange={e => handleChange('to_name', e.target.value)}
                      disabled={editData?.status === 'completed'}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">From Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.from_name}
                      onChange={e => handleChange('from_name', e.target.value)}
                      disabled={editData?.status === 'completed'}
                    />
                  </div>
                  <div className="row">
                    <div className="col">
                      <label className="form-label">Truck #</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.truck_number}
                        onChange={e => handleChange('truck_number', e.target.value)}
                        disabled={editData?.status === 'completed'}
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Trailer #</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.trailer_number}
                        onChange={e => handleChange('trailer_number', e.target.value)}
                        disabled={editData?.status === 'completed'}
                      />
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col">
                      <label className="form-label">PO #</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.po_number}
                        onChange={e => handleChange('po_number', e.target.value)}
                        disabled={editData?.status === 'completed'}
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Seal #</label>
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
              </div>
            </div>

            {/* Slip Info */}
            <div className="col-md-6">
              <div className="card h-100 shadow-sm">
                <div className="card-header bg-light">
                  <strong>Slip Info</strong>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Slip Type</label>
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

                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={e => handleChange('status', e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <select
                      className="form-select"
                      value={formData.location_id}
                      onChange={e => handleChange('location_id', e.target.value)}
                      disabled={editData?.status === 'completed'}
                      required
                    >
                      <option value="">Select Location</option>
                      {locations.map(location => (
                        <option key={location.id} value={String(location.id)}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Item Table */}
          <div className="table-responsive mb-4">
            <table className="table table-bordered table-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '30%' }}>Material</th>
                  <th style={{ width: '10%' }}>Gross</th>
                  <th style={{ width: '10%' }}>Tare</th>
                  <th style={{ width: '10%' }}>Net</th>
                  <th>Ticket #</th>
                  <th>Remarks</th>
                  <th style={{ width: '5%' }}></th>
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
                        <option value="">Select</option>
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
                        disabled={editData?.status === 'completed'}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={
                          item.gross_weight && item.tare_weight
                            ? new Intl.NumberFormat().format(
                                Number(item.gross_weight) - Number(item.tare_weight)
                              )
                            : '0'
                        }
                        readOnly
                        tabIndex={-1}
                      />
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
                    <td className="text-center">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveItem(index)}
                          disabled={editData?.status === 'completed'}
                          title="Remove"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleAddItem}
                disabled={editData?.status === 'completed'}
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="d-flex justify-content-between mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/packing-slips')}
            >
              Cancel
            </button>

            <div>
              {editData?.status === 'draft' && (
                <button
                  type="button"
                  className="btn btn-outline-danger me-2"
                  onClick={handleDelete}
                >
                  Delete Draft
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || editData?.status === 'completed'}
              >
                {isSubmitting
                  ? editData
                    ? 'Updating...'
                    : 'Creating...'
                  : editData
                  ? 'Update Packing Slip'
                  : 'Create Packing Slip'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PackingSlipForm;

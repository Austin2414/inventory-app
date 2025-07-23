// src/components/PackingSlips/PackingSlipForm.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Location, Material, PackingSlipFormData, PackingSlipFormItem, PackingSlip } from '../../types';
import { getLocations, getMaterials, deletePackingSlip } from '../../services/api';
import Select from 'react-select';
import { Collapse } from 'react-bootstrap';

function formatDateTimeLocal(date: Date | string) {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState<PackingSlipFormData>({
    slip_type: 'outbound',
    location_id: '',
    status: 'draft',
    from_name: '',
    customerAddress: '',
    carrierName: '',
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

    // New optional fields
    vesselNumber: '',
    voyageNumber: '',
    containerNumber: '',
    multiPoNotes: [],
    pickupNumber: '',
    deliveryNumber: '',
    deliveryDateTime: null,
    orderNumber: '',
    careOf: '',
    slipGroupId: null,
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
        customerAddress: editData.customerAddress || '',
        carrierName: editData.carrierName || '',
        pickupNumber: editData.pickupNumber || '',
        deliveryNumber: editData.deliveryNumber || '',
        deliveryDateTime: editData.deliveryDateTime ? new Date(editData.deliveryDateTime) : null,
        orderNumber: editData.orderNumber || '',
        careOf: editData.careOf || '',
        vesselNumber: editData.vesselNumber || '',
        voyageNumber: editData.voyageNumber || '',
        containerNumber: editData.containerNumber || '',
        multiPoNotes: editData.multiPoNotes || [],
        slipGroupId: editData.slipGroupId ?? null,
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

    // Basic validation
    if (!formData.to_name.trim()) {
      alert('Customer name is required.');
      return;
    }
    if (!formData.location_id) {
      alert('Location must be selected.');
      return;
    }
    if (formData.items.length === 0) {
      alert('At least one item must be added.');
      return;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.material_id) {
        alert(`Material is required for item ${i + 1}.`);
        return;
      }
      const gross = Number(item.gross_weight);
      const tare = Number(item.tare_weight);

      if (!item.gross_weight || isNaN(gross) || gross <= 0) {
        alert(`Gross weight must be a positive number for item ${i + 1}.`);
        return;
      }
      if (item.tare_weight === '' || isNaN(tare) || tare < 0) {
        alert(`Tare weight must be zero or greater for item ${i + 1}.`);
        return;
      }
      if (tare > gross) {
        alert(`Tare weight cannot be greater than gross weight for item ${i + 1}.`);
        return;
      }
    }

    // Confirm if marking as completed
    if (formData.status === 'completed') {
      const confirmed = window.confirm(
        'Are you sure you want to mark this packing slip as completed? This cannot be changed.'
      );
      if (!confirmed) return;
    }

    try {
      const method = editData && editData.status === 'draft' ? 'PATCH' : 'POST';
      const url =
        editData && editData.status === 'draft'
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

      // Redirect logic
      if (editData && editData.status === 'draft') {
        // Editing: refresh current page
        window.location.reload();
      } else if (formData.status === 'completed') {
        // New and completed: redirect to specific slip
        window.location.href = `/packing-slips/${result.id}`;
      } else {
        // New and draft: go to list
        window.location.href = '/packing-slips';
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong. Please try again.');
    }
  };




  return (
  <>
  <div className="card mt-3 shadow-sm">
    <div className="card-header bg-info text-white py-2 px-3">
      <h6 className="mb-0">{editData ? 'Edit Packing Slip' : 'Create Packing Slip'}</h6>
    </div>

    <div className="card-body py-3 px-3">
      {error && <div className="alert alert-danger small">{error}</div>}

      <form onSubmit={handleSubmit} className="small">
        <div className="row mb-3 gx-3">
          {/* Shipment Info */}
          <div className="col-md-6">
            <div className="card shadow-sm mb-2">
              <div className="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                <strong>Shipment Info</strong>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowAdvanced(prev => !prev)}
                >
                  {showAdvanced ? 'Hide Extra Info' : 'Add Extra Info'}
                </button>
              </div>

              <div className="card-body py-2 px-3">
                {/* Basic Fields */}
                <div className="mb-2">
                  <label className="form-label mb-1">Customer Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.to_name}
                    onChange={e => handleChange('to_name', e.target.value)}
                    disabled={editData?.status === 'completed'}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label mb-1">Customer Address</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.customerAddress}
                    onChange={e => handleChange('customerAddress', e.target.value)}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label mb-1">Carrier Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.carrierName}
                    onChange={e => handleChange('carrierName', e.target.value)}
                    required
                  />
                </div>


                <div className="row gx-2">
                  <div className="col-6 mb-2">
                    <label className="form-label mb-1">Truck #</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.truck_number}
                      onChange={e => handleChange('truck_number', e.target.value)}
                      disabled={editData?.status === 'completed'}
                    />
                  </div>
                  <div className="col-6 mb-2">
                    <label className="form-label mb-1">Trailer #</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.trailer_number}
                      onChange={e => handleChange('trailer_number', e.target.value)}
                      disabled={editData?.status === 'completed'}
                    />
                  </div>
                </div>

                <div className="row gx-2">
                  <div className="col-6 mb-2">
                    <label className="form-label mb-1">PO #</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.po_number}
                      onChange={e => handleChange('po_number', e.target.value)}
                      disabled={editData?.status === 'completed'}
                    />
                  </div>
                  <div className="col-6 mb-2">
                    <label className="form-label mb-1">Seal #</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.seal_number}
                      onChange={e => handleChange('seal_number', e.target.value)}
                      disabled={editData?.status === 'completed'}
                    />
                  </div>
                </div>

                {/* Advanced Collapsible Section */}
                <Collapse in={showAdvanced}>
                  <div className="mt-3">
                    <div className="mb-2">
                      <label className="form-label mb-1">Vessel Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.vesselNumber || ''}
                        onChange={e => handleChange('vesselNumber', e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label mb-1">Voyage Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.voyageNumber || ''}
                        onChange={e => handleChange('voyageNumber', e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label mb-1">Container Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.containerNumber || ''}
                        onChange={e => handleChange('containerNumber', e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label mb-1">Multi-PO #s (comma separated)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.multiPoNotes?.join(', ') || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            multiPoNotes: e.target.value.split(',').map(s => s.trim()),
                          }))
                        }
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label mb-1">Pickup Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.pickupNumber || ''}
                        onChange={e => handleChange('pickupNumber', e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label mb-1">Delivery Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.deliveryNumber || ''}
                        onChange={e => handleChange('deliveryNumber', e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label mb-1">Delivery Date/Time</label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={
                          formData.deliveryDateTime
                            ? formatDateTimeLocal(formData.deliveryDateTime)
                            : ''
                        }
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            deliveryDateTime: e.target.value ? new Date(e.target.value) : null,
                          }))
                        }
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label mb-1">Order Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.orderNumber || ''}
                        onChange={e => handleChange('orderNumber', e.target.value)}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label mb-1">Care Of</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.careOf || ''}
                        onChange={e => handleChange('careOf', e.target.value)}
                      />
                    </div>
                  </div>
                </Collapse>
              </div>
            </div>
          </div>

          {/* Slip Info */}
          <div className="col-md-6">
            <div className="card shadow-sm mb-2">
              <div className="card-header bg-light py-2">
                <strong>Slip Info</strong>
              </div>
              <div className="card-body py-2 px-3">
                <div className="mb-2">
                  <label className="form-label mb-1">Slip Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.slip_type}
                    onChange={e => handleChange('slip_type', e.target.value)}
                    disabled={editData?.status === 'completed'}
                  >
                    <option value="outbound">Outbound</option>
                    <option value="inbound">Inbound</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label mb-1">Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.status}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label mb-1">Location</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.location_id}
                    onChange={e => handleChange('location_id', e.target.value)}
                    disabled={editData?.status === 'completed'}
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map(location => (
                      <option key={location.id} value={String(location.id)}>
                        {location.address || location.name}
                      </option>

                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="table-responsive mb-2">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '28%' }}>Material</th>
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
                  <td>{index + 1}</td>
                  <td style={{ overflow: 'visible' }}>
                    <div style={{ position: 'relative', zIndex: 10 }}>
                      <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        menuShouldScrollIntoView={false}
                        value={materials
                          .map(mat => ({ value: String(mat.id), label: mat.name }))
                          .find(opt => opt.value === String(item.material_id))}
                        onChange={(selectedOption) =>
                          handleItemChange(index, 'material_id', selectedOption?.value || '')
                        }
                        options={materials.map(mat => ({ value: String(mat.id), label: mat.name }))}
                        isDisabled={editData?.status === 'completed'}
                        placeholder="Select material..."
                        filterOption={(option, inputValue) =>
                          option.label.toLowerCase().includes(inputValue.toLowerCase())
                        }
                        styles={{
                          menuPortal: base => ({ ...base, zIndex: 9999 }),
                          control: (base, state) => ({
                            ...base,
                            minHeight: '32px',
                            fontSize: '0.875rem',
                            borderRadius: '6px',
                            borderColor: state.isFocused ? '#0d6efd' : '#ced4da',
                            boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13,110,253,.25)' : 'none',
                            '&:hover': {
                              borderColor: '#0d6efd',
                            },
                          }),
                          valueContainer: base => ({
                            ...base,
                            padding: '0 8px',
                          }),
                          input: base => ({
                            ...base,
                            margin: 0,
                            padding: 0,
                          }),
                          indicatorsContainer: base => ({
                            ...base,
                            height: '32px',
                          }),
                          menu: base => ({
                            ...base,
                            fontSize: '0.8rem',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            border: '1px solid #dee2e6',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                          }),
                          option: (base, { isFocused, isSelected }) => ({
                            ...base,
                            padding: '6px 10px',
                            fontSize: '0.8rem',
                            backgroundColor: isSelected
                              ? '#0d6efd'
                              : isFocused
                              ? '#e9f5ff'
                              : 'white',
                            color: isSelected ? 'white' : '#212529',
                            cursor: 'pointer',
                          }),
                        }}
                      />
                    </div>
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

          {/* Add Item */}
          <div className="text-start">
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

        {/* Footer Buttons */}
        <div className="d-flex justify-content-between mt-3">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (editData) {
                navigate('/packing-slips');
              } else {
                window.location.reload();
              }
            }}
          >
            Cancel
          </button>

          <div>
            {editData?.status === 'draft' && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm me-2"
                onClick={handleDelete}
              >
                Delete Draft
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-sm"
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
  </>
);

};

export default PackingSlipForm;
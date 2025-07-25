import React, { useEffect, useState } from 'react';
import { getMaterials, createInventoryAdjustment } from '../../services/api';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import { SlipOption } from '../../types';

const InventoryAdjustmentForm = () => {
  const [materials, setMaterials] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState({
    material_id: '',
    change: '',
    reason: '',
    linked_slip_id: null as number | null,
  });
  const [linkedSlip, setLinkedSlip] = useState<SlipOption | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getMaterials().then(res => setMaterials(res.data));
  }, []);

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: m.name,
  }));

  const selectedMaterial = materialOptions.find(
    o => String(o.value) === formData.material_id
  ) || null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selected: any) => {
    setFormData(prev => ({
      ...prev,
      material_id: selected ? String(selected.value) : '',
    }));
  };

  const handleSlipSelectChange = (selected: SlipOption | null) => {
    setLinkedSlip(selected);
    setFormData(prev => ({
      ...prev,
      linked_slip_id: selected?.value ?? null,
    }));
  };

  const loadSlipOptions = async (inputValue: string): Promise<SlipOption[]> => {
    if (!inputValue.trim()) return [];

    const response = await fetch(`/api/packing-slips/search?q=${encodeURIComponent(inputValue)}`);
    const data = await response.json();

    return data.map((slip: any) => ({
      value: slip.id,
      label: `Slip #${slip.id} – ${slip.to_name || slip.from_name || 'No Name'} (${new Date(slip.date_time).toLocaleDateString()})`,
      slip,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);
    setIsSubmitting(true);

    try {
      await createInventoryAdjustment({
        material_id: Number(formData.material_id),
        location_id: 1,
        change: Number(formData.change),
        reason: formData.reason,
        linked_slip_id: formData.linked_slip_id ?? null,
      });

      setSuccess(true);
      setFormData({
        material_id: '',
        change: '',
        reason: '',
        linked_slip_id: null,
      });
      setLinkedSlip(null);
    } catch (err) {
      setError('Failed to apply inventory adjustment');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card mt-4 shadow">
      <div className="card-header bg-info text-white">
        <h2 className="mb-0" style={{ fontSize: '1.2rem' }}>⚖️ Manual Inventory Adjustment</h2>
      </div>
      <div className="card-body" style={{ fontSize: '1rem' }}>
        {success && <div className="alert alert-success">Inventory successfully adjusted!</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '1rem' }}>Material</label>
            <Select
              options={materialOptions}
              value={selectedMaterial}
              onChange={handleSelectChange}
              placeholder="Select material"
              isClearable
              styles={{
                control: base => ({ ...base, minHeight: '38px', fontSize: '1rem' }),
                menu: base => ({ ...base, fontSize: '1rem' }),
                option: base => ({ ...base, fontSize: '1rem' }),
              }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '1rem' }}>Adjustment Amount (lbs)</label>
            <input
              type="number"
              name="change"
              value={formData.change}
              onChange={handleChange}
              className="form-control"
              step="0.01"
              required
              style={{ fontSize: '1rem' }}
            />
            <div className="form-text" style={{ fontSize: '0.9rem' }}>Use a negative number to subtract from inventory.</div>
          </div>

          <div className="mb-3">
            <label className="form-label">Link to Packing Slip (optional)</label>
            <AsyncSelect
              cacheOptions
              loadOptions={loadSlipOptions}
              defaultOptions
              value={linkedSlip}
              onChange={handleSlipSelectChange}
              placeholder="Search by Slip ID or Customer Name"
            />
          </div>

          {linkedSlip && (
            <div className="mt-2">
              <a
                href={`/packing-slips/${linkedSlip.value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-decoration-underline"
              >
                View linked slip
              </a>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '1rem' }}>Reason</label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g., Correction, loss, shrinkage"
              style={{ fontSize: '1rem' }}
            />
          </div>

          <div className="d-flex justify-content-end">
            <button 
              type="submit" 
              className="btn btn-info"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryAdjustmentForm;


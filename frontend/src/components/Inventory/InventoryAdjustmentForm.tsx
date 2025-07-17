import React, { useEffect, useState } from 'react';
import { getMaterials, createInventoryAdjustment } from '../../services/api';
import Select from 'react-select';

const InventoryAdjustmentForm = () => {
  const [materials, setMaterials] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState({
    material_id: '',
    change: '',
    reason: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getMaterials().then(res => setMaterials(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption: any) => {
    setFormData(prev => ({
      ...prev,
      material_id: selectedOption ? String(selectedOption.value) : ''
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
        reason: formData.reason
      });
      setSuccess(true);
      setFormData({ material_id: '', change: '', reason: '' });
    } catch (err) {
      setError('Failed to apply inventory adjustment');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const materialOptions = materials.map(m => ({ value: m.id, label: m.name }));

  const selectedMaterial = materialOptions.find(o => String(o.value) === formData.material_id) || null;

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


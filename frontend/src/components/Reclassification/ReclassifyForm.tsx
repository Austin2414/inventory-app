import React, { useEffect, useState } from 'react';
import { reclassifyInventory, getMaterials } from '../../services/api';
import Select from 'react-select';

const ReclassifyForm = () => {
  const [materials, setMaterials] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState({
    from_material_id: '',
    to_material_id: '',
    quantity: '',
    load: '',
    reason: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getMaterials().then(res => setMaterials(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFromSelectChange = (selectedOption: any) => {
    setFormData(prev => ({
      ...prev,
      from_material_id: selectedOption ? String(selectedOption.value) : ''
    }));
  };

  const handleToSelectChange = (selectedOption: any) => {
    setFormData(prev => ({
      ...prev,
      to_material_id: selectedOption ? String(selectedOption.value) : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await reclassifyInventory({
        from_material_id: Number(formData.from_material_id),
        to_material_id: Number(formData.to_material_id),
        quantity: Number(formData.quantity),
        location_id: 1, // Replace with dynamic location ID if needed
        load: formData.load,
        reason: formData.reason
      });
      setSuccess(true);
      setFormData({
        from_material_id: '',
        to_material_id: '',
        quantity: '',
        load: '',
        reason: ''
      });
    } catch (err) {
      setError('Failed to reclassify inventory. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const materialOptions = materials.map(m => ({ value: m.id, label: m.name }));

  const selectedFromMaterial = materialOptions.find(o => String(o.value) === formData.from_material_id) || null;
  const selectedToMaterial = materialOptions.find(o => String(o.value) === formData.to_material_id) || null;

  return (
    <div className="card mt-4 shadow">
      <div className="card-header bg-warning text-dark">
        <h2 className="mb-0" style={{ fontSize: '1.2rem' }}>🔁 Reclassify Material</h2>
      </div>
      <div className="card-body" style={{ fontSize: '1rem' }}>
        {success && <div className="alert alert-success">Inventory reclassified successfully!</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '1rem' }}>From Material</label>
            <Select
              options={materialOptions}
              value={selectedFromMaterial}
              onChange={handleFromSelectChange}
              placeholder="Select material to convert FROM"
              isClearable
              styles={{
                control: base => ({ ...base, minHeight: '38px', fontSize: '1rem' }),
                menu: base => ({ ...base, fontSize: '1rem' }),
                option: base => ({ ...base, fontSize: '1rem' }),
              }}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '1rem' }}>To Material</label>
            <Select
              options={materialOptions}
              value={selectedToMaterial}
              onChange={handleToSelectChange}
              placeholder="Select material to convert TO"
              isClearable
              styles={{
                control: base => ({ ...base, minHeight: '38px', fontSize: '1rem' }),
                menu: base => ({ ...base, fontSize: '1rem' }),
                option: base => ({ ...base, fontSize: '1rem' }),
              }}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '1rem' }}>Quantity (lbs)</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="form-control"
              min="0"
              step="0.01"
              required
              style={{ fontSize: '1rem' }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '1rem' }}>Load (optional)</label>
            <input
              type="text"
              name="load"
              value={formData.load}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Liberty Recycling #25/Public"
              style={{ fontSize: '1rem' }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '1rem' }}>Reason (optional)</label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Upgrade/Downgrade"
              style={{ fontSize: '1rem' }}
            />
          </div>

          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-warning"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Reclassify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReclassifyForm;


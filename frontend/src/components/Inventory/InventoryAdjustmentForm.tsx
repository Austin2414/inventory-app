import React, { useEffect, useState } from 'react';
import { getMaterials, createInventoryAdjustment } from '../../services/api';

const InventoryAdjustmentForm = () => {
  const [materials, setMaterials] = useState([]);
  const [formData, setFormData] = useState({
    material_id: '',
    change: '',
    reason: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMaterials().then(res => setMaterials(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);
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
    }
  };

  return (
    <div className="card mt-4 shadow">
      <div className="card-header bg-info text-white">
        <h2 className="mb-0">⚖️ Manual Inventory Adjustment</h2>
      </div>
      <div className="card-body">
        {success && <div className="alert alert-success">Inventory successfully adjusted!</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Material</label>
            <select
              name="material_id"
              className="form-select"
              value={formData.material_id}
              onChange={handleChange}
              required
            >
              <option value="">Select material</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Adjustment Amount (lbs)</label>
            <input
              type="number"
              name="change"
              value={formData.change}
              onChange={handleChange}
              className="form-control"
              step="0.01"
              required
            />
            <div className="form-text">Use a negative number to subtract from inventory.</div>
          </div>

          <div className="mb-3">
            <label className="form-label">Reason</label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g., Correction, loss, shrinkage"
            />
          </div>

          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-info">
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryAdjustmentForm;

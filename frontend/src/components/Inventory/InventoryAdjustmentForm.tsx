import React, { useEffect, useState } from 'react';
import { getMaterials, getLocations, createInventoryAdjustment } from '../../services/api';

const InventoryAdjustmentForm = () => {
  const [materials, setMaterials] = useState([]);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    material_id: '',
    location_id: '',
    change: '',
    reason: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMaterials().then(res => setMaterials(res.data));
    getLocations().then(res => setLocations(res.data));
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
        location_id: Number(formData.location_id),
        change: Number(formData.change),
        reason: formData.reason
      });
      setSuccess(true);
      setFormData({ material_id: '', location_id: '', change: '', reason: '' });
    } catch (err) {
      setError('Failed to adjust inventory');
      console.error(err);
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-header bg-info text-white">
        <h2 className="mb-0">Manual Inventory Adjustment</h2>
      </div>
      <div className="card-body">
        {success && <div className="alert alert-success">Inventory updated!</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Material</label>
            <select name="material_id" value={formData.material_id} onChange={handleChange} className="form-control" required>
              <option value="">Select material</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label>Location</label>
            <select name="location_id" value={formData.location_id} onChange={handleChange} className="form-control" required>
              <option value="">Select location</option>
              {locations.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label>Change (+/-)</label>
            <input type="number" name="change" value={formData.change} onChange={handleChange} className="form-control" required />
          </div>

          <div className="mb-3">
            <label>Reason (optional)</label>
            <input type="text" name="reason" value={formData.reason} onChange={handleChange} className="form-control" />
          </div>

          <button type="submit" className="btn btn-info">Apply Adjustment</button>
        </form>
      </div>
    </div>
  );
};

export default InventoryAdjustmentForm;

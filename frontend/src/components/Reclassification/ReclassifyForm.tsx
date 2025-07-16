import React, { useEffect, useState } from 'react';
import { reclassifyInventory, getMaterials } from '../../services/api';

const ReclassifyForm = () => {
  const [materials, setMaterials] = useState([]);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        location_id: 1, // You can replace this with a dynamic location ID if needed
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

  return (
    <div className="card mt-4 shadow">
      <div className="card-header bg-warning text-dark">
        <h2 className="mb-0">🔁 Reclassify Material</h2>
      </div>
      <div className="card-body">
        {success && <div className="alert alert-success">Inventory reclassified successfully!</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">From Material</label>
            <select 
              name="from_material_id" 
              className="form-select" 
              value={formData.from_material_id}
              onChange={handleChange}
              required
            >
              <option value="">Select material to convert FROM</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">To Material</label>
            <select 
              name="to_material_id" 
              className="form-select" 
              value={formData.to_material_id}
              onChange={handleChange}
              required
            >
              <option value="">Select material to convert TO</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Quantity (lbs)</label>
            <input 
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="form-control"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Load (optional)</label>
            <input 
              type="text"
              name="load"
              value={formData.load}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Liberty Recycling #25/Public"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Reason (optional)</label>
            <input 
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Upgrade/Downgrade"
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

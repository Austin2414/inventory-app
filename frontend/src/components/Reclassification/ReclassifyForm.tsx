import React, { useEffect, useState } from 'react';
import { getMaterials, reclassifyInventory } from '../../services/api';
import { Material, ReclassifyFormData } from '../../types';

const ReclassifyForm = () => {
  const [formData, setFormData] = useState<ReclassifyFormData>({
    from_material_id: '',
    to_material_id: '',
    quantity: '',
    location_id: '1' // hardcoded for now — you mentioned MVP is single location
  });

  const [materials, setMaterials] = useState<Material[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
  const fetchMaterials = async () => {
    try {
      const response = await getMaterials();
      setMaterials(response.data); // ✅ fixes the type error
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      setError('Failed to load materials.');
    }
  };

  fetchMaterials();
}, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await reclassifyInventory(formData);
      setSuccess(true);
      setFormData({
        from_material_id: '',
        to_material_id: '',
        quantity: '',
        location_id: '1'
      });
    } catch (err) {
      console.error('Reclassification error:', err);
      setError('Failed to reclassify inventory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-header bg-warning text-dark">
        <h2 className="mb-0">Reclassify Inventory</h2>
      </div>
      <div className="card-body">
        {success && <div className="alert alert-success">Inventory reclassified successfully!</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">From Material:</label>
              <select
                className="form-select"
                name="from_material_id"
                value={formData.from_material_id}
                onChange={handleChange}
                required
              >
                <option value="">Select material</option>
                {materials.map(mat => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">To Material:</label>
              <select
                className="form-select"
                name="to_material_id"
                value={formData.to_material_id}
                onChange={handleChange}
                required
              >
                <option value="">Select material</option>
                {materials.map(mat => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Quantity:</label>
              <input
                type="number"
                className="form-control"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button
              type="submit"
              className="btn btn-warning"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Reclassify Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReclassifyForm;

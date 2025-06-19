import React, { useState } from 'react';
import { reclassifyInventory } from '../../services/api';
import { ReclassifyFormData } from '../../types';

const ReclassifyForm = () => {
  const [formData, setFormData] = useState<ReclassifyFormData>({
    material_id: '',
    from_location_id: '',
    to_location_id: '',
    quantity: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Reset form after successful submission
      setFormData({
        material_id: '',
        from_location_id: '',
        to_location_id: '',
        quantity: ''
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
        {success && (
          <div className="alert alert-success">
            Inventory reclassified successfully!
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Material ID:</label>
              <input 
                type="number" 
                className="form-control"
                name="material_id"
                value={formData.material_id}
                onChange={handleChange}
                required
              />
            </div>
            
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
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">From Location ID:</label>
              <input 
                type="number" 
                className="form-control"
                name="from_location_id"
                value={formData.from_location_id}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="col-md-6">
              <label className="form-label">To Location ID:</label>
              <input 
                type="number" 
                className="form-control"
                name="to_location_id"
                value={formData.to_location_id}
                onChange={handleChange}
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
export {};
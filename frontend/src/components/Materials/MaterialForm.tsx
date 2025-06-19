// src/components/Materials/MaterialForm.tsx
import React, { useState } from 'react';
import { createMaterial } from '../../services/api';

const MaterialForm = () => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('lb');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createMaterial({ name, category, unit });
      setName('');
      setCategory('');
      setUnit('lb');
      alert('Material created successfully!');
    } catch (error) {
      console.error('Error creating material:', error);
      alert('Failed to create material');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h2>Create New Material</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name:</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Category:</label>
            <input
              type="text"
              className="form-control"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Unit:</label>
            <select 
              className="form-select"
              value={unit}
              onChange={e => setUnit(e.target.value)}
            >
              <option value="lb">Pounds (lb)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="ton">Tons</option>
              <option value="piece">Piece</option>
            </select>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Material'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MaterialForm;
export {};
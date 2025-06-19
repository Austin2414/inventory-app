// src/components/Locations/LocationForm.tsx
import React, { useState } from 'react';
import { createLocation } from '../../services/api';

const LocationForm = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createLocation({ name, address });
      setName('');
      setAddress('');
      alert('Location created successfully!');
    } catch (error) {
      console.error('Error creating location:', error);
      alert('Failed to create location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h2>Create New Location</h2>
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
            <label className="form-label">Address:</label>
            <input
              type="text"
              className="form-control"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Location'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LocationForm;
export {};
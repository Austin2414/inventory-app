import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this
import { getPackingSlips } from '../../services/api';
import PackingSlipForm from './PackingSlipForm';
import PackingSlipView from './PackingSlipView';
import PackingSlipList from './PackingSlipList';
import { PackingSlip } from '../../types';

const PackingSlipManager: React.FC = () => {
  const navigate = useNavigate(); // Add this
  const [view, setView] = useState<'list' | 'form' | 'view'>('list');
  const [packingSlips, setPackingSlips] = useState<PackingSlip[]>([]);
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPackingSlips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPackingSlips();
      setPackingSlips(response.data);
    } catch (err) {
      setError('Failed to load packing slips. Please try again.');
      console.error('Error fetching packing slips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackingSlips();
  }, []);

  const handleCreateSuccess = () => {
    setIsSubmitting(false);
    fetchPackingSlips();
    setView('list');
  };

  const handleFormSubmit = () => {
    setIsSubmitting(true);
  };

  // Handle view navigation
  const handleViewSlip = (id: number) => {
    setSelectedSlipId(id);
    setView('view');
    navigate(`/packing-slips/${id}`); // Add this line
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3">Loading packing slips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={fetchPackingSlips}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Packing Slips</h1>
        
        {view === 'list' && (
          <button 
            className="btn btn-primary"
            onClick={() => setView('form')}
          >
            + Create New Slip
          </button>
        )}
      </div>

      {/* Form View */}
      {view === 'form' && (
        <PackingSlipForm 
          onSubmit={() => {
            handleFormSubmit();
            handleCreateSuccess();
          }}
          onSave={() => setView('list')}
          isSubmitting={isSubmitting}
          error={null}
          success={false}
        />
      )}

      {/* Single Slip View */}
      {view === 'view' && selectedSlipId && (
        <PackingSlipView />
      )}

      {/* List View */}
      {view === 'list' && (
        <PackingSlipList 
          slips={packingSlips}
          onView={handleViewSlip} // Updated to use new handler
        />
      )}
    </div>
  );
};

export default PackingSlipManager;
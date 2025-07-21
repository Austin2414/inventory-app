import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPackingSlips } from '../../services/api';
import PackingSlipForm from './PackingSlipForm';
import PackingSlipView from './PackingSlipView';
import PackingSlipList from './PackingSlipList';
import { PackingSlip } from '../../types';

const PackingSlipManager: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'form' | 'view'>('list');
  const [packingSlips, setPackingSlips] = useState<PackingSlip[]>([]);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const fetchPackingSlips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPackingSlips(true); // Fetch ALL slips including deleted
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

  const handleViewSlip = (id: string) => {
    setSelectedSlipId(id);
    setView('view');
    navigate(`/packing-slips/${id}`);
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

      {view === 'list' && (
        <PackingSlipList 
          slips={packingSlips}
          onView={handleViewSlip}
          includeDeleted={includeDeleted}
          setIncludeDeleted={setIncludeDeleted}
        />
      )}
    </div>
  );
};

export default PackingSlipManager;

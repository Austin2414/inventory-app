import React, { useState, useEffect } from 'react';
import PackingSlipForm from './PackingSlipForm';
import PackingSlipList from './PackingSlipList';
import PackingSlipView from './PackingSlipView';
import { PackingSlipFormData, PackingSlip } from '../../types';
import axios from 'axios';

const PackingSlipManager: React.FC = () => {
  const [view, setView] = useState<'form' | 'list' | 'view'>('form');
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);
  const [packingSlips, setPackingSlips] = useState<PackingSlip[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Define showForm state based on view
  const showForm = view === 'form';

  // Fetch packing slips
  useEffect(() => {
    const fetchPackingSlips = async () => {
      try {
        const response = await axios.get('http://localhost:3001/packing-slips');
        setPackingSlips(response.data);
      } catch (error) {
        console.error('Failed to fetch packing slips', error);
      }
    };

    fetchPackingSlips();
  }, []);

  // Define onEditDraft handler
  const handleEditDraft = (id: number) => {
    setSelectedSlipId(id);
    setView('form');
  };

  const handleCreatePackingSlip = async (formData: PackingSlipFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      
      console.log("[MANAGER] Sending to API:", formData);
      
      // Add default location if missing
      if (!formData.location_id) {
        formData.location_id = "1";
      }

      // Convert items to proper types
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          material_id: item.material_id.toString(),
          gross_weight: item.gross_weight.toString(),
          tare_weight: item.tare_weight.toString()
        }))
      };

      const response = await axios.post('/packing-slips', payload);
      console.log("[MANAGER] Response received:", response.data);
      
      // Handle success
      setPackingSlips(prev => [...prev, response.data]);
      setView('list');
      setSuccess(true);
      
    } catch (error) {
      let errorMessage = "Failed to create packing slip";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("[MANAGER] API error:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <div className="btn-group">
          <button 
            className={`btn ${view === 'form' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setSelectedSlipId(null);
              setView('form');
            }}
          >
            Create New
          </button>
          <button 
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setView('list')}
          >
            View Drafts & Completed
          </button>
        </div>
      </div>

      {view === 'form' && (
        <PackingSlipForm 
          onSave={() => setView('list')}
          onSubmit={handleCreatePackingSlip}
          onEditDraft={handleEditDraft}
          isSubmitting={isSubmitting}
          error={error}
          success={success}
          editData={selectedSlipId 
            ? packingSlips.find(slip => slip.id === selectedSlipId)
            : undefined
          }
        />
      )}
      
      {view === 'list' && (
        <PackingSlipList 
          slips={packingSlips}
          onView={(id: number) => {
            setSelectedSlipId(id);
            setView('view');
          }}
          onEdit={handleEditDraft}
        />
      )}
      
      {view === 'view' && selectedSlipId && (
        <PackingSlipView 
          id={selectedSlipId} 
          onBack={() => setView('list')}
        />
      )}
    </div>
  );
};

export default PackingSlipManager;
// src/components/PackingSlips/PackingSlipView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PackingSlip, PackingSlipItem } from '../../types';
import { getPackingSlip } from '../../services/api';

const PackingSlipView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [slip, setSlip] = useState<PackingSlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSlip = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching slip with ID:', id);
        
        if (!id) {
          throw new Error('Missing packing slip ID');
        }
        
        const slipId = parseInt(id);
        if (isNaN(slipId)) {
          throw new Error('Invalid packing slip ID');
        }
        
        const response = await getPackingSlip(slipId);
        console.log('Received slip data:', response.data);
        setSlip(response.data);
      } catch (err) {
        // Proper error handling for TypeScript
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to load packing slip details';
        
        setError(errorMessage);
        console.error('API Error:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlip();
  }, [id]);

  if (isLoading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading packing slip details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-4">
        <p>{error}</p>
        <button 
          className="btn btn-secondary mt-2"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!slip) {
    return (
      <div className="alert alert-warning my-4">
        Packing slip not found
        <button 
          className="btn btn-outline-secondary ms-3"
          onClick={() => navigate('/packing-slips')}
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <div>
          <h2 className="mb-0">Packing Slip #{slip.id || 'N/A'}</h2>
          <div className="d-flex gap-3 mt-2">
            <span className="badge bg-light text-dark">
              {slip.slip_type?.toUpperCase() || 'UNKNOWN TYPE'}
            </span>
            <span className={`badge ${slip.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
              {slip.status?.toUpperCase() || 'UNKNOWN STATUS'}
            </span>
          </div>
        </div>
        <button 
          className="btn btn-light"
          onClick={() => navigate(-1)}
        >
          &larr; Back to List
        </button>
      </div>
      
      <div className="card-body">
        {/* Header Information */}
        <div className="row mb-4 border-bottom pb-3">
          <div className="col-md-4">
            <div className="mb-2">
              <label className="form-label fw-bold">Customer:</label>
              <p className="mb-0">{slip.to_name || 'N/A'}</p>
            </div>
            <div>
              <label className="form-label fw-bold">From:</label>
              <p className="mb-0">{slip.from_name || 'N/A'}</p>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="mb-2">
              <label className="form-label fw-bold">PO Number:</label>
              <p className="mb-0">{slip.po_number || 'N/A'}</p>
            </div>
            <div>
              <label className="form-label fw-bold">Location:</label>
              <p className="mb-0">Location #{slip.location_id || 'N/A'}</p>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="mb-2">
              <label className="form-label fw-bold">Truck:</label>
              <p className="mb-0">{slip.truck_number || 'N/A'}</p>
            </div>
            <div>
              <label className="form-label fw-bold">Trailer:</label>
              <p className="mb-0">{slip.trailer_number || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <h4 className="mb-3">Items</h4>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>Material ID</th>
                <th>Gross Weight</th>
                <th>Tare Weight</th>
                <th>Net Weight</th>
                <th>Ticket #</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {(slip.packing_slip_items || []).map((item: PackingSlipItem) => (
                <tr key={item.id}>
                  <td>{item.material_id || 'N/A'}</td>
                  <td>{item.gross_weight?.toString() || '0.00'} lb</td>
                  <td>{item.tare_weight?.toString() || '0.00'} lb</td>
                  <td>
                    {(
                      (item.gross_weight || 0) - 
                      (item.tare_weight || 0)
                    ).toFixed(2)} lb
                  </td>
                  <td>{item.ticket_number || '-'}</td>
                  <td>{item.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Additional Information */}
        <div className="mt-4 border-top pt-3">
          <h5>Additional Information</h5>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label fw-bold">Seal Number:</label>
              <p>{slip.seal_number || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">Created At:</label>
              <p>
                {slip.created_at ? 
                  new Date(slip.created_at).toLocaleString() : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackingSlipView;
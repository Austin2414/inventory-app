// src/components/PackingSlips/PackingSlipView.tsx
import React, { useState, useEffect } from 'react';
import { getPackingSlip } from '../../services/api';
import { PackingSlip } from '../../types';

const PackingSlipView = ({ id, onBack }: { id: number, onBack: () => void }) => {
  const [slip, setSlip] = useState<PackingSlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlip = async () => {
      try {
        setIsLoading(true);
        const response = await getPackingSlip(id);
        setSlip(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching packing slip:', error);
        setError('Failed to load packing slip details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSlip();
  }, [id]);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
        <button className="btn btn-link" onClick={onBack}>
          Back to list
        </button>
      </div>
    );
  }

  if (!slip) {
    return (
      <div className="alert alert-warning">
        Packing slip not found
        <button className="btn btn-link" onClick={onBack}>
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h2 className="mb-0">Packing Slip #{slip.id}</h2>
        <button className="btn btn-light" onClick={onBack}>
          Back to List
        </button>
      </div>
      
      <div className="card-body">
        <div className="row mb-4">
          <div className="col-md-3">
            <strong>Type:</strong> {slip.slip_type}
          </div>
          <div className="col-md-3">
            <strong>Status:</strong> 
            <span className={`badge ${slip.status === 'completed' ? 'bg-success' : 'bg-warning'} ms-2`}>
              {slip.status}
            </span>
          </div>
          <div className="col-md-3">
            <strong>Location:</strong> {slip.locations?.name || 'N/A'}
          </div>
          <div className="col-md-3">
            <strong>Date:</strong> {new Date(slip.date_time).toLocaleString()}
          </div>
        </div>
        
        <h4>Items</h4>
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Material</th>
                <th>Gross Weight</th>
                <th>Tare Weight</th>
                <th>Net Weight</th>
              </tr>
            </thead>
            <tbody>
              {slip.packing_slip_items.map(item => (
                <tr key={item.id}>
                  <td>{item.materials?.name || 'Unknown Material'}</td>
                  <td>{item.gross_weight}</td>
                  <td>{item.tare_weight}</td>
                  <td>{(item.gross_weight - item.tare_weight).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PackingSlipView;
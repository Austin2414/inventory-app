// src/components/PackingSlips/PackingSlipList.tsx
import React, { useState, useEffect } from 'react';
import { getPackingSlips } from '../../services/api';
import { PackingSlip } from '../../types';

const PackingSlipList = ({ onView, onEdit }: { 
  onView: (id: number) => void, 
  onEdit: (id: number) => void 
}) => {
  const [slips, setSlips] = useState<PackingSlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'completed'>('all');

  useEffect(() => {
    const fetchSlips = async () => {
      try {
        setIsLoading(true);
        const response = await getPackingSlips();
        setSlips(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching packing slips:', error);
        setError('Failed to load packing slips. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSlips();
  }, []);

  const filteredSlips = slips.filter(slip => {
    if (filter === 'all') return true;
    return slip.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-warning text-dark';
      case 'completed': return 'bg-success text-white';
      default: return 'bg-secondary text-white';
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
        <h2 className="mb-0">Packing Slips</h2>
        <div className="btn-group">
          <button 
            className={`btn btn-sm ${filter === 'all' ? 'btn-light' : 'btn-outline-light'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`btn btn-sm ${filter === 'draft' ? 'btn-light' : 'btn-outline-light'}`}
            onClick={() => setFilter('draft')}
          >
            Drafts
          </button>
          <button 
            className={`btn btn-sm ${filter === 'completed' ? 'btn-light' : 'btn-outline-light'}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : filteredSlips.length === 0 ? (
          <div className="alert alert-info">
            No packing slips found
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Items</th>
                  <th>Total Net Weight</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
      {filteredSlips.map(slip => (
        <tr key={slip.id}>
          <td>{slip.id}</td>
          <td>{slip.slip_type}</td>
          <td>{slip.locations?.name || 'N/A'}</td>
          <td>{slip.packing_slip_items.length}</td>
          <td>
            {slip.packing_slip_items.reduce(
              (total, item) => total + (item.gross_weight - item.tare_weight), 
              0
            ).toFixed(2)}
          </td>
          <td>
            <span className={`badge ${getStatusBadge(slip.status)}`}>
              {slip.status}
            </span>
          </td>
          <td>{new Date(slip.date_time).toLocaleDateString()}</td>
          <td>
            {slip.status === 'draft' ? (
              <button 
                className="btn btn-sm btn-outline-primary me-2"
                onClick={() => onEdit(slip.id)}
              >
                Edit
              </button>
            ) : (
              <button 
                className="btn btn-sm btn-outline-info me-2"
                onClick={() => onView(slip.id)}
              >
                View
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackingSlipList;
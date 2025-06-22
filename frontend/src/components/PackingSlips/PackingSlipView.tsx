// src/components/PackingSlips/PackingSlipView.tsx
import React, { useState, useEffect } from 'react';
import { PackingSlip, PackingSlipItem } from '../../types'; // Ensure these imports exist

interface PackingSlipViewProps {
  id: number;
  onBack: () => void;
}

const PackingSlipView: React.FC<PackingSlipViewProps> = ({ id, onBack }) => {
  const [slip, setSlip] = useState<PackingSlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlip = async () => {
      try {
        const response = await fetch(`http://localhost:3001/packing-slips/${id}`);
        const data = await response.json();
        setSlip(data);
      } catch (err) {
        setError('Failed to load packing slip details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlip();
  }, [id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!slip) return <div>Packing slip not found</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Packing Slip #{slip.id}</h2>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <button className="btn btn-secondary" onClick={onBack}>
            Back to List
          </button>
        </div>
        
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Type</label>
            <p>{slip.slip_type}</p>
          </div>
          <div className="col-md-6">
            <label className="form-label">Status</label>
            <p>{slip.status}</p>
          </div>
        </div>

        <h4>Items</h4>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Material</th>
              <th>Gross Weight</th>
              <th>Tare Weight</th>
              <th>Net Weight</th>
            </tr>
          </thead>
          <tbody>
            {slip.packing_slip_items?.map((item: PackingSlipItem) => (
              <tr key={item.id}>
                <td>{item.material_id}</td> {/* Simplified for now */}
                <td>{item.gross_weight}</td>
                <td>{item.tare_weight}</td>
                <td>
                  {/* Fixed: Ensure values are numbers before arithmetic */}
                  {(Number(item.gross_weight) - Number(item.tare_weight)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PackingSlipView;
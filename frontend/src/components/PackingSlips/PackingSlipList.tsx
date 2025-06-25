// src/components/PackingSlips/PackingSlipList.tsx
import React from 'react';
import { PackingSlip } from '../../types'; // Make sure this import exists

interface PackingSlipListProps {
  slips: PackingSlip[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
}

const PackingSlipList: React.FC<PackingSlipListProps> = ({ slips, onView, onEdit }) => {
  return (
    <div className="table-responsive">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
            <th>Total Net Weight</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {slips.map(slip => (
            <tr key={slip.id}>
              <td>{slip.id}</td>
              <td>{slip.slip_type}</td>
              <td>{slip.status}</td>
              <td>{new Date(slip.created_at).toLocaleDateString()}</td>
              <td>
                {/* Fixed: Ensure values are numbers before arithmetic */}
                {slip.packing_slip_items.reduce(
                  (total, item) => total + 
                    (Number(item.gross_weight) - Number(item.tare_weight)), 
                  0
                ).toFixed(2)}
              </td>
              <td>
                <button className="btn btn-warning" onClick={() => onEdit(slip.id)}>
                  View/Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PackingSlipList;
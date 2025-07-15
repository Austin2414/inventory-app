import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PackingSlip } from '../../types';

interface PackingSlipListProps {
  slips: PackingSlip[];
  onView: (id: string) => void;
}

const PackingSlipList: React.FC<PackingSlipListProps> = ({ slips, onView }) => {
  const navigate = useNavigate();

  if (slips.length === 0) return <div>No packing slips found</div>;

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Customer</th>
            <th>PO Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {slips.map(slip => (
            <tr key={slip.id}>
              <td>{slip.id}</td>
              <td>{slip.slip_type.charAt(0).toUpperCase() + slip.slip_type.slice(1)}</td>
              <td>
                <span className={`badge ${slip.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                  {slip.status.charAt(0).toUpperCase() + slip.status.slice(1)}
                </span>
              </td>
              <td>{slip.to_name || 'N/A'}</td>
              <td>{slip.po_number || 'N/A'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => onView(slip.id)}
                >
                  {slip.status === 'completed' ? 'View' : 'View/Edit'}
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
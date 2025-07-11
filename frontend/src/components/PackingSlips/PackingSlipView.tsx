// src/components/PackingSlips/PackingSlipView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PackingSlip, PackingSlipItem } from '../../types';
import { getPackingSlip, deletePackingSlip} from '../../services/api';
import PackingSlipForm from './PackingSlipForm';
import { updatePackingSlip } from '../../services/api';

const PackingSlipView: React.FC = () => {
  const [slip, setSlip] = useState<PackingSlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
  const formatDate = (dateString: string | Date) => {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
  };
  const handleDelete = async () => {
  if (!slip?.id) return;

  const confirmDelete = window.confirm(
    'Are you sure you want to delete this packing slip? This cannot be undone.'
  );

  if (!confirmDelete) return;

  try {
    await deletePackingSlip(Number(slip.id));
    navigate('/packing-slips', { replace: true }); // auto-reload list
  } catch (err) {
    console.error('Failed to delete packing slip:', err);
    alert('Error deleting packing slip.');
  }
};

  useEffect(() => {
    const fetchSlip = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!id) throw new Error('Missing packing slip ID');
        const slipId = parseInt(id);
        if (isNaN(slipId)) throw new Error('Invalid packing slip ID');

        const response = await getPackingSlip(slipId);
        setSlip(response.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load packing slip details';
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
        <button className="btn btn-secondary mt-2" onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  if (!slip) {
    return (
      <div className="alert alert-warning my-4">
        Packing slip not found
        <button className="btn btn-outline-secondary ms-3" onClick={() => navigate('/packing-slips')}>
          Back to List
        </button>
      </div>
    );
  }

  // Editable form for draft slips
  if (slip.status === 'draft') {
    return (
      <PackingSlipForm
        editData={slip}
        onSubmit={async (formData) => {
          try {
            await updatePackingSlip(Number(slip.id), formData);
            navigate('/packing-slips');
          } catch (err) {
            console.error('Failed to update slip:', err);
          }
        }}
        isSubmitting={false}
        onSave={() => {
          // Reload current page or navigate to list after success
          window.location.reload();
          // or: navigate('/packing-slips');
        }}
      />
    );
  }

  // Render completed slip view
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <div>
          <h2 className="mb-1">Customer: {slip.to_name || 'N/A'}</h2>
            <small className="text-light">
              Packing Slip #{slip.id || 'N/A'} • {formatDate(slip.date_time) || 'No date'}
            </small>
          <div className="d-flex gap-3 mt-2">
            <span className="badge bg-light text-dark">{slip.slip_type?.toUpperCase() || 'UNKNOWN TYPE'}</span>
            <span className={`badge ${slip.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
              {slip.status?.toUpperCase() || 'UNKNOWN STATUS'}
            </span>
          </div>
        </div>

        <div>
          <button className="btn btn-light me-2" onClick={() => navigate(-1)}>
            &larr; Back to List
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>

      </div>

      <div className="card-body">
        {/* Header Information */}
        <div className="row mb-4 border-bottom pb-3">
          <div className="col-md-4">
            <div className="mb-2">
              <label className="form-label fw-bold">From:</label>
              <p className="mb-0">{slip.from_name || 'N/A'}</p>
            </div>
            <div>
              <label className="form-label fw-bold">PO Number:</label>
              <p className="mb-0">{slip.po_number || 'N/A'}</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="mb-2">
              <label className="form-label fw-bold">Location:</label>
              <p className="mb-0">Location #{slip.location_id || 'N/A'}</p>
            </div>
            <div>
              <label className="form-label fw-bold">Seal Number:</label>
              <p className="mb-0">{slip.seal_number || 'N/A'}</p>
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
            <thead className="table-primary text-white">
              <tr>
                <th>Material</th>
                <th>Gross Weight</th>
                <th>Tare Weight</th>
                <th>Net Weight</th>
                <th>Ticket #</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {(slip.packing_slip_items || []).map((item: PackingSlipItem) => {
                const gross = typeof item.gross_weight === 'number' ? item.gross_weight : null;
                const tare = typeof item.tare_weight === 'number' ? item.tare_weight : 0; // Default to 0
                const net = gross != null ? gross - tare : null;

                return (
                  <tr key={item.id}>
                    <td>{item.material_name || '-'}</td>
                    <td>{gross != null ? `${formatNumber(gross)} lb` : '-'}</td>
                    <td>{formatNumber(tare)} lb</td>
                    <td>{net != null ? `${formatNumber(net)} lb` : '-'}</td>
                    <td>{item.ticket_number || '-'}</td>
                    <td>{item.remarks || '-'}</td>
                  </tr>
                );
              })}
            </tbody>


          </table>
          {slip.packing_slip_items.length > 0 && (
            <div className="text-end fw-bold mt-2 me-1">
              Total Net Weight:{' '}
              {formatNumber(
                slip.packing_slip_items.reduce(
                  (sum, item) => sum + ((item.gross_weight || 0) - (item.tare_weight || 0)),
                  0
                )
              )} lb

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PackingSlipView;

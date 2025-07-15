import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PackingSlip, PackingSlipItem } from '../../types';
import { getPackingSlip, deletePackingSlip, updatePackingSlip } from '../../services/api';
import PackingSlipForm from './PackingSlipForm';

const PackingSlipView: React.FC = () => {
  const [slip, setSlip] = useState<PackingSlip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const slipRef = useRef<HTMLDivElement>(null);

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
    const confirm = window.confirm('Delete this packing slip? This cannot be undone.');
    if (!confirm) return;
    await deletePackingSlip(Number(slip.id));
    navigate('/packing-slips', { replace: true });
  };

  const handlePrint = () => {
    if (!slipRef.current) return;
    const printContents = slipRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // restore interactivity
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
        const msg = err instanceof Error ? err.message : 'Failed to load packing slip';
        setError(msg);
        console.error(msg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlip();
  }, [id]);

  if (isLoading) {
    return <div className="text-center mt-5">Loading...</div>;
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

  if (slip.status === 'draft') {
    return (
      <PackingSlipForm
        editData={slip}
        onSubmit={async (formData) => {
          await updatePackingSlip(Number(slip.id), formData);
          navigate('/packing-slips');
        }}
        isSubmitting={false}
        onSave={() => window.location.reload()}
      />
    );
  }

  return (
  <div className="d-flex flex-column min-vh-100">
    <div className="container mt-3 flex-grow-1">
      {/* Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-2 d-print-none">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <button className="btn btn-outline-primary btn-sm me-2" onClick={handlePrint}>
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Printable Section */}
      <div className="border rounded bg-white p-2 shadow-sm" ref={slipRef}>
        {/* Header */}
        <div className="mb-3 border-bottom pb-2">
          <div className="d-flex justify-content-between align-items-start flex-wrap">
            <div>
              <h5 className="text-primary mb-1">Cross Metals LLC</h5>
              {slip.location?.address && (
                <div className="text-muted small">{slip.location.address}</div>
              )}
              <div className="text-muted small">Packing Slip #{slip.id}</div>
              <div className="text-muted small">{formatDate(slip.date_time)}</div>
            </div>
            <div className="text-end">
              <div className="badge bg-secondary me-2">{slip.slip_type?.toUpperCase()}</div>
              <div
                className={`badge ${
                  slip.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'
                }`}
              >
                {slip.status?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>


        {/* Customer Info */}
        <div className="mb-2">
          <strong>Customer:</strong> <span className="fw-normal">{slip.to_name || 'N/A'}</span>
        </div>

        {/* Shipment Info */}
        <div className="row mb-2">
          <div className="col-md-6 small">
            <p className="mb-1"><strong>Truck #:</strong> {slip.truck_number || 'N/A'}</p>
            <p className="mb-1"><strong>Trailer #:</strong> {slip.trailer_number || 'N/A'}</p>
          </div>
          <div className="col-md-6 small">
            <p className="mb-1"><strong>PO #:</strong> {slip.po_number || 'N/A'}</p>
            <p className="mb-1"><strong>Seal #:</strong> {slip.seal_number || 'N/A'}</p>
          </div>
        </div>

        {/* Items Table */}
        <h6 className="mb-2">Items</h6>
        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle mb-2">
            <thead className="table-light small">
              <tr>
                <th style={{ width: '2rem' }}>#</th>
                <th style={{ minWidth: '100px' }}>Material</th>
                <th style={{ minWidth: '80px' }}>Gross (lb)</th>
                <th style={{ minWidth: '80px' }}>Tare (lb)</th>
                <th style={{ minWidth: '80px' }}>Net (lb)</th>
                <th style={{ minWidth: '45px' }}>Ticket #</th>
                {slip.slip_type === 'inbound' && <th style= {{ minWidth: '100px' }}>Remarks</th>}
              </tr>
            </thead>


            <tbody className="small">
              {Object.entries(
                slip.packing_slip_items.reduce((groups, item) => {
                  const key = item.material_name || 'Unknown';
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(item);
                  return groups;
                }, {} as Record<string, typeof slip.packing_slip_items>)
              ).map(([materialName, items]) => {
                const subtotal = items.reduce(
                  (sum, item) => {
                    const gross = item.gross_weight || 0;
                    const tare = item.tare_weight || 0;
                    const net = gross - tare;
                    return {
                      gross: sum.gross + gross,
                      tare: sum.tare + tare,
                      net: sum.net + net
                    };
                  },
                  { gross: 0, tare: 0, net: 0 }
                );

                return (
                  <React.Fragment key={materialName}>
                    {items.map((item, index) => {
                      const gross = item.gross_weight || 0;
                      const tare = item.tare_weight || 0;
                      const net = gross - tare;
                      return (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.material_name || '-'}</td>
                          <td>{formatNumber(gross)}</td>
                          <td>{formatNumber(tare)}</td>
                          <td>{formatNumber(net)}</td>
                          <td>{item.ticket_number || '-'}</td>
                          {slip.slip_type === 'inbound' && <td>{item.remarks || '-'}</td>}
                        </tr>
                      );
                    })}
                    {items.length > 1 && (
                      <tr className="fw-bold text-end text-nowrap">
                        <td colSpan={2}>Subtotal:</td>
                        <td>{formatNumber(subtotal.gross)}</td>
                        <td>{formatNumber(subtotal.tare)}</td>
                        <td>{formatNumber(subtotal.net)}</td>
                        <td></td>
                        {slip.slip_type === 'inbound' && <td></td>}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Grand Total Row */}
              <tr className="fw-bold text-end text-nowrap">
                <td colSpan={2}>
                  Total ({slip.packing_slip_items.length} items):
                </td>
                <td>
                  {formatNumber(
                    slip.packing_slip_items.reduce((sum, item) => sum + (item.gross_weight || 0), 0)
                  )}
                </td>
                <td>
                  {formatNumber(
                    slip.packing_slip_items.reduce((sum, item) => sum + (item.tare_weight || 0), 0)
                  )}
                </td>
                <td>
                  {formatNumber(
                    slip.packing_slip_items.reduce((sum, item) => {
                      const gross = item.gross_weight || 0;
                      const tare = item.tare_weight || 0;
                      return sum + (gross - tare);
                    }, 0)
                  )}
                </td>
                <td></td>
                {slip.slip_type === 'inbound' && <td></td>}
              </tr>
            </tbody>


          </table>
        </div>
      </div>
    </div>

    {/* Delete button - hidden on print */}
    <div className="d-print-none p-2">
      <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
        Delete Packing Slip
      </button>
    </div>
  </div>
);


};

export default PackingSlipView;

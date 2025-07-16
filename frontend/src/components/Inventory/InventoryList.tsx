// src/components/Inventory/InventoryList.tsx
import React, { useEffect, useState } from 'react';
import { getInventory, getAuditLog } from '../../services/api'; // we'll add getAuditLog
import { Modal, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuditLogEntry, InventoryItem } from '../../types';

const InventoryList = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<InventoryItem | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getInventory();
        setInventory(res.data);
      } catch (err) {
        console.error('Error fetching inventory:', err);
      }
    };
    fetchData();
  }, []);

  const handleMaterialClick = async (item: InventoryItem) => {
    setSelectedMaterial(item);
    setShowAuditModal(true);
    setLoadingAudit(true);
    setAuditError(null);

    try {
      // Assuming you have locationId available, else default to 1
      // You may need to adjust this to get locationId from your state or item
      const locationId = item.locations?.id ?? 1;

      const res = await getAuditLog(locationId, item.materials.id);
      setAuditLog(res.data);
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setAuditError('Failed to load audit log.');
      setAuditLog([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  return (
    <>
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">📦 Current Inventory</h3>
        </div>
        <div className="card-body p-0">
          <table className="table table-hover table-striped mb-0">
            <thead className="table-light">
              <tr>
                <th>Material</th>
                <th>Category</th>
                <th className="text-end">Quantity</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id}>
                    <td
                      style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
                      onClick={() => handleMaterialClick(item)}
                      title="Click to view audit log"
                    >
                      {item.materials.name}
                    </td>
                    <td>{item.materials.category.charAt(0).toUpperCase() + item.materials.category.slice(1)}</td>
                    <td className="text-end">
                      {item.quantity.toLocaleString()} {item.materials.unit}
                    </td>
                    <td>{formatDate(item.last_updated)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Modal */}
      <Modal show={showAuditModal} onHide={() => setShowAuditModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            Audit Log for: {selectedMaterial?.materials.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingAudit ? (
            <div className="d-flex justify-content-center my-5">
              <Spinner animation="border" role="status" />
            </div>
          ) : auditError ? (
            <div className="alert alert-danger">{auditError}</div>
          ) : auditLog.length === 0 ? (
            <div className="text-center text-muted">No audit log entries found.</div>
          ) : (
            <table className="table table-hover table-striped table-sm mb-0">
              <thead className="table-light small">
                <tr>
                  <th>Date/Time</th>
                  <th className="text-end">Change</th>
                  <th>Source</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry, i) => (
                  <tr key={i} style={{ cursor: 'default' }}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(entry.timestamp)}</td>
                    <td className="text-end" style={{ fontWeight: '600' }}>
                      {entry.change > 0 ? `+${entry.change.toLocaleString()}` : entry.change.toLocaleString()} {entry.unit ?? 'lb'}
                    </td>
                    <td>{entry.source}</td>
                    <td>
                      {entry.source === 'Packing Slip' && entry.packingSlipId ? (
                        <Link
                          to={`/packing-slips/${entry.packingSlipId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none"
                          style={{ fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          Slip #{entry.packingSlipId}
                        </Link>
                      ) : entry.source === 'Reclassification' ? (
                        <>
                          {entry.reason && (
                            <div className="text-muted small">Reason: {entry.reason}</div>
                          )}

                          {entry.load && (
                            <div className="text-muted small">Load: {entry.load}</div>
                          )}

                          {entry.movedTo && (
                            <div className="text-muted small">
                              → Moved to: <strong>{entry.movedTo}</strong>
                            </div>
                          )}

                          {entry.movedFrom && (
                            <div className="text-muted small">
                              ← Moved from: <strong>{entry.movedFrom}</strong>
                            </div>
                          )}

                        </>
                      ) : (
                        <span>{entry.remarks ?? '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAuditModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventoryList;

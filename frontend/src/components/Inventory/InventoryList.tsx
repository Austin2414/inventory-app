// src/components/Inventory/InventoryList.tsx
import React, { useEffect, useState } from 'react';
import { getInventory, getAuditLog } from '../../services/api';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuditLogEntry, InventoryItem } from '../../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const InventoryList = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<InventoryItem | null>(null);

  // Add sort/search/filter for audit log
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSortField, setAuditSortField] = useState<'timestamp' | 'change'>('timestamp');
  const [auditSortDir, setAuditSortDir] = useState<'asc' | 'desc'>('desc');
  const [auditStartDate, setAuditStartDate] = useState<Date | null>(null);
  const [auditEndDate, setAuditEndDate] = useState<Date | null>(null);

  // Adding search/sort/filter options
  const [searchQuery, setSearchQuery]= useState('');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'updated_at'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const navigate = useNavigate();
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

  const handlePackingSlipClick = (slipId: number) => {
    navigate(`/packing-slips/${slipId}`);
  };

  const materialList = inventory.map(item => item.materials);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = Array.from(
    new Set(materialList.map(m => m.category).filter(Boolean))
);
 const filteredInventory = [...inventory]
    .filter(item =>
      item.materials.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(item =>
      selectedCategory === 'All' ||
      item.materials.category.toLowerCase() === selectedCategory.toLowerCase()
    )
    .sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.materials.name.toLowerCase();
          bVal = b.materials.name.toLowerCase();
          break;
        case 'quantity':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case 'updated_at':
          aVal = new Date(a.last_updated).getTime();
          bVal = new Date(b.last_updated).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
  });


  return (
    <>
      <style>
        {`
          .audit-clickable {
            color: #343a40;
            cursor: pointer;
            font-weight: 500;
            text-decoration: none;
          }
          .audit-clickable:hover {
            text-decoration: underline;
            color: #212529;
          }
        `}
      </style>

      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">📦 Current Inventory</h3>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <input
            type="text"
            placeholder="Search materials..."
            className="form-control me-2"
            style={{ maxWidth: '250px' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <select
            className="form-select"
            style={{ maxWidth: '200px' }}
            value={sortField}
            onChange={e => setSortField(e.target.value as any)}
          >
            <option value="name">Sort by Name</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="updated_at">Sort by Last Updated</option>
          </select>

          <button
            className="btn btn-outline-secondary"
            onClick={() =>
              setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
            }
            title="Toggle sort direction"
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="card-body p-0">
          <table className="table table-hover table-striped mb-0">
            <colgroup>
              <col style={{ width: '30%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>

            <thead className="table-light">
              <tr>
                <th>Material</th>
                <th>
                  Category
                  <select
                    className="form-select form-select-sm d-inline-block ms-2"
                    style={{ width: 'auto' }}
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                  >
                    <option value="All">All</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </th>


                <th className="text-end">Quantity</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    No materials match your search.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isFerrous = item.materials.category.toLowerCase() === 'ferrous';
                  const displayQuantity = isFerrous
                    ? `${(item.quantity / 2240).toFixed(2)} GT`
                    : `${item.quantity.toLocaleString()} ${item.materials.unit}`;

                  return (
                    <tr key={item.id}>
                      <td
                        onClick={() => handleMaterialClick(item)}
                        title="Click to view audit log"
                        className="audit-clickable"
                      >
                        {item.materials.name}
                      </td>
                      <td>{item.materials.category.charAt(0).toUpperCase() + item.materials.category.slice(1)}</td>
                      <td className="text-end">{displayQuantity}</td>
                      <td>{formatDate(item.last_updated)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

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
            <div>
              {/* Filters */}
              <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                <input
                  type="text"
                  className="form-control"
                  style={{ maxWidth: '250px' }}
                  placeholder="Search details..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                />

                <div style={{ maxWidth: '140px' }}>
                  <DatePicker
                    selected={auditStartDate}
                    onChange={(date: Date | null) => setAuditStartDate(date)}
                    selectsStart
                    startDate={auditStartDate}
                    endDate={auditEndDate}
                    placeholderText="Start Date"
                    className="form-control"
                    isClearable
                    maxDate={auditEndDate || undefined}
                  />
                </div>

                <div style={{ maxWidth: '140px' }}>
                  <DatePicker
                    selected={auditEndDate}
                    onChange={(date: Date | null) => setAuditEndDate(date)}
                    selectsEnd
                    startDate={auditStartDate}
                    endDate={auditEndDate}
                    placeholderText="End Date"
                    className="form-control"
                    isClearable
                    minDate={auditStartDate || undefined}
                  />
                </div>
              </div>

              {/* Audit Table */}
              <table className="table table-hover table-striped table-sm mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '22%' }} />
                </colgroup>
                <thead className="table-light small">
                  <tr>
                    <th>Date/Time</th>
                    <th className="text-center">Change</th>
                    <th className="text-center">Inventory After</th>
                    <th>Source</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog
                    .filter(entry => {
                      const searchMatch = JSON.stringify(entry).toLowerCase().includes(auditSearch.toLowerCase());
                      const entryDate = new Date(entry.timestamp);
                      const afterStart = auditStartDate ? entryDate >= auditStartDate : true;
                      const beforeEnd = auditEndDate ? entryDate <= new Date(auditEndDate.getTime() + 86399999) : true;
                      return searchMatch && afterStart && beforeEnd;
                    })
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((entry, i) => {
                      const isPackingSlip = entry.source === 'Packing Slip';
                      const isOutbound = isPackingSlip && entry.slipType === 'Outbound';
                      const isPositive = entry.change > 0;
                      const isReversal = entry.reason?.toLowerCase().includes('reversal');
                      const isFerrous = selectedMaterial?.materials.category.toLowerCase() === 'ferrous';
                      const unitLabel = isFerrous ? 'GT' : (entry.unit ?? 'lb');
                      const convertedChange = isFerrous ? entry.change / 2240 : entry.change;
                      const displayValue = isOutbound && isPositive
                        ? `-${convertedChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : isPositive
                        ? `+${convertedChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : convertedChange.toLocaleString(undefined, { maximumFractionDigits: 2 });

                      return (
                        <tr
                          key={i}
                          style={{ cursor: 'default' }}
                          className={isReversal ? 'table-danger fw-semibold fst-italic' : ''}
                        >
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(entry.timestamp)}</td>
                          <td className="text-center fw-semibold">{`${displayValue} ${unitLabel}`}</td>
                          <td className="text-center fw-semibold">
                            {typeof entry.snapshot_quantity === 'number' ? (
                              isFerrous
                                ? `${(entry.snapshot_quantity / 2240).toFixed(2)} GT`
                                : `${entry.snapshot_quantity.toLocaleString()} ${entry.unit ?? 'lb'}`
                            ) : '-'}
                          </td>
                          <td>{entry.source}</td>
                          <td>
                            {isPackingSlip && entry.packingSlipId ? (
                              <span
                                onClick={() => handlePackingSlipClick(entry.packingSlipId!)}
                                style={{ cursor: 'pointer', textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                {isReversal ? `Reversal: Slip #${entry.packingSlipId}` : `Slip #${entry.packingSlipId}`}
                                {entry.packingSlip && (
                                  <>
                                    {' – '}
                                    {(entry.packingSlip.slip_type === 'Inbound'
                                      ? entry.packingSlip.from_name
                                      : entry.packingSlip.to_name) || 'Unknown Customer'}
                                  </>
                                )}
                              </span>
                            ) : entry.source === 'Reclassification' ? (
                              <>
                                {entry.load && (
                                  <div className="text-muted small">Load: {entry.load}</div>
                                )}
                                {entry.reason && (
                                  <div className="text-muted small">Reason: {entry.reason}</div>
                                )}
                                {entry.linked_slip && (
                                  <div className="text-muted small">
                                    Linked Slip:{' '}
                                    <a
                                      href={`/packing-slip/${entry.linked_slip.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-decoration-none modern-link"
                                    >
                                      #{entry.linked_slip.id} — {entry.linked_slip.from_name}
                                    </a>
                                  </div>
                                )}
                                {entry.direction === 'From' && entry.movedTo && (
                                  <div className="text-muted small">
                                    → Moved to: <strong>{entry.movedTo}</strong>
                                  </div>
                                )}
                                {entry.direction === 'To' && entry.movedFrom && (
                                  <div className="text-muted small">
                                    ← Moved from: <strong>{entry.movedFrom}</strong>
                                  </div>
                                )}
                              </>
                            ) : entry.source === 'Manual Adjustment' ? (
                              <>
                                {entry.reason ? (
                                  <div className="text-muted small">Reason: {entry.reason}</div>
                                ) : (
                                  <div className="text-muted small fst-italic">No reason provided</div>
                                )}
                                {entry.linked_slip && (
                                  <div
                                    style={{ cursor: 'pointer', textDecoration: 'none' }}
                                    onClick={() => handlePackingSlipClick(entry.linked_slip.id)}
                                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                  >
                                    Linked Slip #{entry.linked_slip.id}
                                    {' – '}
                                    {(entry.linked_slip.slip_type === 'Inbound'
                                      ? entry.linked_slip.from_name
                                      : entry.linked_slip.to_name) || 'Unknown Customer'}
                                  </div>
                                )}
                              </>
                            ) : entry.remarks ? (
                              <div className="text-muted small">Remarks: {entry.remarks}</div>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}

                  {/* No filtered entries */}
                  {auditLog.filter(entry => {
                    const searchMatch = JSON.stringify(entry).toLowerCase().includes(auditSearch.toLowerCase());
                    const entryDate = new Date(entry.timestamp);
                    const afterStart = auditStartDate ? entryDate >= auditStartDate : true;
                    const beforeEnd = auditEndDate ? entryDate <= new Date(auditEndDate.getTime() + 86399999) : true;
                    return searchMatch && afterStart && beforeEnd;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        🔍 No audit log entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
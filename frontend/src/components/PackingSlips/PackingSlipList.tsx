import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PackingSlip } from '../../types';

interface PackingSlipListProps {
  slips: PackingSlip[];
  onView: (id: string) => void;
  includeDeleted: boolean;
  setIncludeDeleted: (value: boolean) => void;
}

const PackingSlipList: React.FC<PackingSlipListProps> = ({
  slips,
  onView,
  includeDeleted,
  setIncludeDeleted
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Use Date | null for date pickers
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const filteredSlips = useMemo(() => {
    let result = [...slips];

    // Search filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        slip =>
          slip.id.toLowerCase().includes(lower) ||
          (slip.to_name && slip.to_name.toLowerCase().includes(lower)) ||
          (slip.po_number && slip.po_number.toLowerCase().includes(lower))
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(slip => slip.slip_type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(slip => {
        if (filterStatus === 'deleted') return !!slip.deleted_at;
        return slip.status === filterStatus;
      });
    }

    // Apply includeDeleted filter only if status filter is not 'deleted'
    if (!includeDeleted && filterStatus !== 'deleted') {
      result = result.filter(slip => !slip.deleted_at);
    }

    // Filter by date range
    if (startDate || endDate) {
      result = result.filter(slip => {
        const slipDate = new Date(slip.date_time);

        const from = startDate
          ? new Date(new Date(startDate).setHours(0, 0, 0, 0))
          : null;

        const to = endDate
          ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
          : null;

        return (!from || slipDate >= from) && (!to || slipDate <= to);
      });
    }

    // Sort by ID descending (newest first)
    result.sort((a, b) => Number(b.id) - Number(a.id));
    return result;
  }, [slips, searchTerm, filterStatus, filterType, startDate, endDate, includeDeleted]);

  if (slips.length === 0) return <div>No packing slips found</div>;

  return (
    <>
      {/* Filters row without checkbox */}
      <div className="d-flex flex-wrap gap-2 mb-2 align-items-center">
        <input
          type="text"
          className="form-control"
          placeholder="Search by ID, Customer, or PO"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: 250 }}
        />
        <select
          className="form-select"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ maxWidth: 150 }}
        >
          <option value="all">All Types</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
        <select
          className="form-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ maxWidth: 150 }}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
          <option value="deleted">Deleted</option>
        </select>
        <div className="d-flex align-items-center gap-2" style={{ maxWidth: 350 }}>
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className="form-control"
            isClearable
            maxDate={endDate || undefined}
          />
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            placeholderText="End Date"
            className="form-control"
            isClearable
            minDate={startDate || undefined}
          />
        </div>
      </div>

      {/* Checkbox on right above table */}
      <div className="d-flex justify-content-end mb-2">
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="includeDeleted"
            checked={includeDeleted}
            onChange={e => setIncludeDeleted(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="includeDeleted">
            Include Deleted
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th style={{ width: '12%' }}>Type</th>
              <th style={{ width: '12%' }}>Status</th>
              <th style={{ width: '20%' }}>Customer</th>
              <th style={{ width: '15%' }}>PO Number</th>
              <th style={{ width: '15%' }}>Date</th>
              <th style={{ width: '18%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSlips.map(slip => (
              <tr key={slip.id}>
                <td>{slip.id}</td>
                <td>{slip.slip_type.charAt(0).toUpperCase() + slip.slip_type.slice(1)}</td>
                <td>
                  <span
                    className={`badge ${
                      slip.deleted_at
                        ? 'bg-danger'
                        : slip.status === 'completed'
                        ? 'bg-success'
                        : 'bg-warning'
                    }`}
                  >
                    {slip.deleted_at
                      ? 'Deleted'
                      : slip.status.charAt(0).toUpperCase() + slip.status.slice(1)}
                  </span>
                </td>
                <td>{slip.to_name || 'N/A'}</td>
                <td>{slip.po_number || 'N/A'}</td>
                <td>{new Date(slip.date_time).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onView(slip.id)}
                    disabled={!!slip.deleted_at}
                  >
                    {slip.status === 'completed' ? 'View' : 'View/Edit'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PackingSlipList;

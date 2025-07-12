import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Dashboard</h1>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card h-100 shadow" onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
            <div className="card-body">
              <h4 className="card-title">📦 Inventory</h4>
              <p className="card-text">View and manage your current inventory.</p>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100 shadow" onClick={() => navigate('/packing-slips')} style={{ cursor: 'pointer' }}>
            <div className="card-body">
              <h4 className="card-title">🧾 Packing Slips</h4>
              <p className="card-text">Create and manage packing slips for all loads.</p>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100 shadow" onClick={() => navigate('/reclassify')} style={{ cursor: 'pointer' }}>
            <div className="card-body">
              <h4 className="card-title">🔁 Reclassify</h4>
              <p className="card-text">Move material between types at the same location.</p>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100 shadow" onClick={() => navigate('/inventory-adjustments')} style={{ cursor: 'pointer' }}>
            <div className="card-body">
              <h4 className="card-title">⚖️ Manual Adjustment</h4>
              <p className="card-text">Adjust inventory quantity as needed (admin only).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

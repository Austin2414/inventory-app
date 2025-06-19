import React from 'react';
import { Link } from 'react-router-dom';
import PackingSlipManager from './PackingSlips/PackingSlipManager';

const HomePage = () => {
  return (
    <div className="mt-5">
      <h1 className="text-center mb-5">Inventory Management System</h1>
      
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">Inventory</h5>
              <p className="card-text">View current inventory levels</p>
              <Link to="/inventory" className="btn btn-primary">
                View Inventory
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">Packing Slips</h5>
              <p className="card-text">Create new packing slips</p>
              <Link to="/packing-slips" className="btn btn-info">
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">Reclassify</h5>
              <p className="card-text">Move inventory between locations</p>
              <Link to="/reclassify" className="btn btn-warning">
                Reclassify Inventory
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">Locations</h5>
              <p className="card-text">Manage warehouse locations</p>
              <Link to="/locations" className="btn btn-secondary">
                View Locations
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">Materials</h5>
              <p className="card-text">Manage materials and categories</p>
              <Link to="/materials" className="btn btn-secondary">
                View Materials
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
export {};
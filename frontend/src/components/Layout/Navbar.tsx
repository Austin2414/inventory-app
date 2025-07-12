// src/components/Layout/Navbar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 shadow">
      <NavLink className="navbar-brand fw-bold" to="/">
        🏭 CrossMetalsLLC
      </NavLink>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <NavLink to="/inventory" className="nav-link">
              Inventory
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/packing-slips" className="nav-link">
              Packing Slips
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/reclassify" className="nav-link">
              Reclassify
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/inventory-adjustments" className="nav-link">
              Manual Adjustments
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

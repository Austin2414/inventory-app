// src/components/Layout/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">Inventory App</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/inventory">Inventory</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/packing-slips/new">Packing Slips</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/reclassify">Reclassify</Link>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Management
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                <li><Link className="dropdown-item" to="/locations">Locations</Link></li>
                <li><Link className="dropdown-item" to="/materials">Materials</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><Link className="dropdown-item" to="/locations/new">Add Location</Link></li>
                <li><Link className="dropdown-item" to="/materials/new">Add Material</Link></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
export {};
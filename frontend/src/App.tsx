// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import InventoryList from './components/Inventory/InventoryList';
import PackingSlipManager from './components/PackingSlips/PackingSlipManager'; // Add this import
import PackingSlipForm from './components/PackingSlips/PackingSlipForm';
import ReclassifyForm from './components/Reclassification/ReclassifyForm';
import LocationList from './components/Locations/LocationList';
import MaterialList from './components/Materials/MaterialList';
import LocationForm from './components/Locations/LocationForm';
import MaterialForm from './components/Materials/MaterialForm';
import HomePage from './components/HomePage';
import 'bootstrap/dist/css/bootstrap.min.css';
import PackingSlipViewPage from './components/PackingSlips/PackingSlipViewPage';
import InventoryAdjustmentForm from './components/Inventory/InventoryAdjustmentForm';


function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/packing-slips" element={<PackingSlipManager />} />
          <Route path="/packing-slips/:id" element={<PackingSlipViewPage />} />
          <Route path="/reclassify" element={<ReclassifyForm />} />
          <Route path="/locations" element={<LocationList />} />
          <Route path="/locations/new" element={<LocationForm />} />
          <Route path="/materials" element={<MaterialList />} />
          <Route path="/materials/new" element={<MaterialForm />} />
          <Route path="/inventory-adjustments" element={<InventoryAdjustmentForm />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
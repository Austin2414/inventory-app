// src/components/Inventory/InventoryList.tsx
import React, { useEffect, useState } from 'react';
import { getInventory } from '../../services/api';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
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

  return (
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
              inventory.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.materials.name}</td>
                  <td>{item.materials.category}</td>
                  <td className="text-end">{item.quantity.toLocaleString()} {item.materials.unit}</td>
                  <td>{formatDate(item.last_updated)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryList;

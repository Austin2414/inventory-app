// src/components/Inventory/InventoryList.tsx
import React, { useEffect, useState } from 'react';
import { getInventory } from '../../services/api';
import { Inventory } from '../../types';

const InventoryList = () => {
  // 1. Proper state declarations with all setters
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        const response = await getInventory();
        setInventory(response.data);
        setError(null);
      } catch (error) {
        // 2. Handle 'unknown' error type
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setError(`Failed to load inventory data: ${errorMessage}`);
        console.error('Error fetching inventory:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  if (isLoading) {
    return <div className="text-center my-5">Loading inventory...</div>;
  }

  if (error) {
    return <div className="alert alert-danger my-4">{error}</div>;
  }

  if (inventory.length === 0) {
    return <div className="alert alert-info my-4">No inventory items found</div>;
  }

  return (
    <div className="card mt-4">
      <div className="card-header bg-primary text-white">
        <h2 className="mb-0">Current Inventory</h2>
      </div>
      <div className="card-body p-0">
        <table className="table table-striped mb-0">
          <thead className="thead-dark">
            <tr>
              <th>Material</th>
              <th>Category</th>
              <th>Location</th>
              <th>Quantity</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                <td>{item.materials.name}</td>
                <td>{item.materials.category}</td>
                <td>{item.locations.name}</td>
                <td>{item.quantity} {item.materials.unit}</td>
                <td>{new Date(item.last_updated).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryList;
export {};
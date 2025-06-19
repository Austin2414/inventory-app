import React, { useEffect, useState } from 'react';
import { getMaterials } from '../../services/api';
import { Material } from '../../types';

const MaterialList = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await getMaterials();
        setMaterials(response.data);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  if (isLoading) {
    return <div>Loading materials...</div>;
  }

  return (
    <div className="card mt-4">
      <div className="card-header bg-secondary text-white">
        <h2 className="mb-0">Materials</h2>
      </div>
      <div className="card-body">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(material => (
              <tr key={material.id}>
                <td>{material.id}</td>
                <td>{material.name}</td>
                <td>{material.category}</td>
                <td>{material.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialList;
export {};
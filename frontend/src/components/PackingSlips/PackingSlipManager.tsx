// src/components/PackingSlips/PackingSlipManager.tsx
import React, { useState } from 'react';
import PackingSlipForm from './PackingSlipForm';
import PackingSlipList from './PackingSlipList';
import PackingSlipView from './PackingSlipView';

const PackingSlipManager = () => {
  const [view, setView] = useState<'form' | 'list' | 'view'>('form');
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <div className="btn-group">
          <button 
            className={`btn ${view === 'form' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setView('form')}
          >
            Create New
          </button>
          <button 
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setView('list')}
          >
            View Drafts & Completed
          </button>
        </div>
      </div>

      {view === 'form' && (
        <PackingSlipForm 
          onSave={() => setView('list')}
          onEditDraft={(id: number) => { // Added type annotation
            setSelectedSlipId(id);
            setView('form');
          }}
        />
      )}
      
      {view === 'list' && (
        <PackingSlipList 
          onView={(id: number) => { // Added type annotation
            setSelectedSlipId(id);
            setView('view');
          }}
          onEdit={(id: number) => { // Added type annotation
            setSelectedSlipId(id);
            setView('form');
          }}
        />
      )}
      
      {view === 'view' && selectedSlipId && (
        <PackingSlipView 
          id={selectedSlipId} 
          onBack={() => setView('list')}
        />
      )}
    </div>
  );
};

export default PackingSlipManager;
export {};
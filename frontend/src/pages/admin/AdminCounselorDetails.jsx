import React from 'react';
import { useParams, Link } from 'react-router-dom';

export default function AdminCounselorDetails() {
  const { id } = useParams();

  return (
    <div className="admin-page" style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>
          Counselor Profile Overview {id && <span>(ID: {id})</span>}
        </h1>
        {id && <Link to=".." style={{ color: '#4b5563', textDecoration: 'none' }}>&larr; Back</Link>}
      </header>

      <div style={{ backgroundColor: '#ffffff', padding: '3rem 2rem', borderRadius: '8px', border: '1px dashed #d1d5db', textAlign: 'center', color: '#6b7280' }}>
        <p style={{ fontSize: '1.1rem' }}>Loading counselor workload and assigned cases...</p>
      </div>
    </div>
  );
}

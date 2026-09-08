import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Implementation pending for User Management API
      // const res = await api.get('/admin/users');
      // setUsers(res.data.data);
      setUsers([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="admin-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>
          User Management
        </h1>
        <p style={{ color: '#6b7280' }}>Manage authorized administrative staff</p>
      </header>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ backgroundColor: '#ffffff', padding: '3rem 2rem', borderRadius: '8px', border: '1px dashed #d1d5db', textAlign: 'center', color: '#6b7280' }}>
        <p style={{ fontSize: '1.1rem' }}>User Management implementation coming in Phase 2.</p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';

export default function AdminVictims() {
  const [victims, setVictims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [error, setError] = useState('');

  const fetchVictims = async () => {
    try {
      setLoading(true);
      const url = districtFilter 
        ? `/admin/victims?status=${statusFilter}&district=${districtFilter}` 
        : `/admin/victims?status=${statusFilter}`;

      const res = await api.get(url);
      setVictims(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVictims();
  }, [districtFilter, statusFilter]);

  // Compute age from dob
  const getAge = (dobString) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  return (
    <div className="admin-page" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Pending Victim Requests</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Review registration details and approve or reject pending requests.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontSize: '0.875rem' }}
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
          </select>

          <select 
            value={districtFilter} 
            onChange={(e) => setDistrictFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontSize: '0.875rem' }}
          >
            <option value="">All Districts</option>
            <option value="Krishna">Krishna</option>
            <option value="Guntur">Guntur</option>
            <option value="NTR">NTR</option>
            <option value="Eluru">Eluru</option>
            <option value="West Godavari">West Godavari</option>
            <option value="Bhimavaram">Bhimavaram</option>
            <option value="Patna">Patna</option>
          </select>
        </div>
      </div>

      {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>{error}</div>}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading pending registrations...</p>
      ) : (
        <>
          {victims.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
              <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                {districtFilter ? 'No pending registrations found for this district.' : 'No pending registrations found.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {victims.map(v => (
                <div key={v._id} style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: '48px', height: '48px', backgroundColor: '#e5e7eb', borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}>
                      {v.userId?.profileImage ? (
                        <img src={v.userId.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                          <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>{v.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#2563eb', fontWeight: '600' }}>{v.userId?.registrationId || 'No registration ID'}</p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{v.gender || 'Unknown'}, {getAge(v.dob)}</p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{v.socialCategory}</p>
                    </div>
                  </div>
                  
                  <div style={{ padding: '1rem 1.5rem', flex: 1 }}>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>District:</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{v.userId?.district || 'N/A'}</span>
                    </div>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>FIR Number:</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{v.caseInfo?.firDetails?.firNumber || 'N/A'}</span>
                    </div>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Status:</span>
                      <span style={{ 
                        padding: '0.125rem 0.5rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: v.userId?.status === 'active' ? '#d1fae5' : v.userId?.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: v.userId?.status === 'active' ? '#065f46' : v.userId?.status === 'pending' ? '#92400e' : '#991b1b'
                      }}>
                        {(v.userId?.status || 'UNKNOWN').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem' }}>
                    <Link 
                      to={`/admin/victims/${v._id}`} 
                      style={{ width: '100%', textAlign: 'center', backgroundColor: '#2563eb', border: '1px solid #2563eb', color: 'white', textDecoration: 'none', padding: '0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '500' }}
                    >
                      VIEW REQUEST
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

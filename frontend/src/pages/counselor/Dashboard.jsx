import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignedCases, setAssignedCases] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const res = await api.get('/counselor/profile');
        if (mounted) {
          setProfile(res.data.data);
          setError('');
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Unable to load counselor profile');
        }
      }
    };

    const fetchAssignedCases = async () => {
      try {
        setLoading(true);
        const response = await api.get('/counselor/assigned-cases');
        if (mounted) {
          setAssignedCases(response.data.data || []);
          setError('');
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Unable to load assigned cases');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    fetchAssignedCases();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Welcome, {profile?.name || 'Counselor'}</h1>
        <p style={{ color: '#4b5563' }}>Here is your overview for today.</p>
      </header>

      {loading && <div>Loading assigned cases...</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      <section style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>MY ASSIGNED CASES</h2>

        {!loading && assignedCases.length === 0 && (
          <div className="empty-state-card" style={{ color: '#6b7280', padding: '1rem' }}>
            No cases have been assigned to you yet.
          </div>
        )}

        {!loading && assignedCases.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {assignedCases.map((caseItem) => (
              <article key={caseItem._id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '1rem', background: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#111827' }}>CASE ID: #{caseItem.caseId || caseItem._id}</div>
                    <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>REQUEST TYPE: {caseItem.category || 'Request Type'}</div>
                    <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>STATUS: Assigned</div>
                    <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>ASSIGNED DATE: {caseItem.assignedAt ? new Date(caseItem.assignedAt).toLocaleDateString() : 'N/A'}</div>
                    <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>VICTIM REQUEST: {caseItem.description || 'No description provided'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (caseItem?._id) {
                        navigate(`/counselor/case-report/${caseItem._id}`);
                      }
                    }}
                    style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.7rem 1rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    [ VIEW CASE ]
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

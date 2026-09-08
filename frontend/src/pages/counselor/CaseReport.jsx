import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

const display = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return value;
};

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString();
};

export default function CaseReport() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchReport = async () => {
      if (!id) {
        setError('Case report not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setReport(null);

      try {
        const response = await api.get(`/counselor/assigned-cases/${id}`);
        if (mounted) {
          setReport(response.data.data);
        }
      } catch (err) {
        if (!mounted) {
          return;
        }
        const status = err.response?.status;
        if (status === 403) {
          setError('You are not authorized to view this case.');
        } else if (status === 404) {
          setError('Case report not found.');
        } else {
          setError('Unable to load the case report. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      mounted = false;
    };
  }, [id]);

  const caseInfo = report?.case;
  const victim = report?.victim;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Case Report</h1>
          <p style={{ color: '#4b5563' }}>Assigned victim case details for counseling review.</p>
        </div>
        <Link to="/counselor/dashboard" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
          &larr; Back to Dashboard
        </Link>
      </header>

      {loading && <div>Loading case report...</div>}
      {!loading && error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>{error}</div>}
      {!loading && !error && !caseInfo && (
        <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>Case report not found.</div>
      )}

      {!loading && !error && caseInfo && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Case Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Case ID</p>
                <p style={{ fontWeight: '600' }}>{display(caseInfo.caseId || caseInfo._id)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Category</p>
                <p style={{ fontWeight: '500' }}>{display(caseInfo.category)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Status</p>
                <p style={{ fontWeight: '500' }}>{display(caseInfo.status)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Assigned Date</p>
                <p style={{ fontWeight: '500' }}>{formatDate(caseInfo.assignedAt)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Created</p>
                <p style={{ fontWeight: '500' }}>{formatDate(caseInfo.createdAt)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Updated</p>
                <p style={{ fontWeight: '500' }}>{formatDate(caseInfo.updatedAt)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Support required</p>
                <p style={{ fontWeight: '500' }}>
                  {Array.isArray(caseInfo.supportRequired) && caseInfo.supportRequired.length > 0
                    ? caseInfo.supportRequired.join(', ')
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Description</p>
              <p style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '4px', border: '1px solid #f3f4f6', marginTop: '0.25rem' }}>
                {display(caseInfo.description)}
              </p>
            </div>
          </section>

          <section style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              FIR Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>FIR filed</p>
                <p style={{ fontWeight: '500' }}>{caseInfo.firDetails?.isFiled ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>FIR number</p>
                <p style={{ fontWeight: '500' }}>{display(caseInfo.firDetails?.firNumber)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Police station</p>
                <p style={{ fontWeight: '500' }}>{display(caseInfo.firDetails?.policeStation)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>FIR district</p>
                <p style={{ fontWeight: '500' }}>{display(caseInfo.firDetails?.district)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>FIR state</p>
                <p style={{ fontWeight: '500' }}>{display(caseInfo.firDetails?.state)}</p>
              </div>
            </div>
          </section>

          <section style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Victim Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Name</p>
                <p style={{ fontWeight: '500' }}>{display(victim?.name)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Email</p>
                <p style={{ fontWeight: '500' }}>{display(victim?.email)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Phone</p>
                <p style={{ fontWeight: '500' }}>{display(victim?.phone)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Gender</p>
                <p style={{ fontWeight: '500' }}>{display(victim?.gender)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Date of birth</p>
                <p style={{ fontWeight: '500' }}>{formatDate(victim?.dob)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Profession</p>
                <p style={{ fontWeight: '500' }}>{display(victim?.profession)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>State</p>
                <p style={{ fontWeight: '500' }}>{display(victim?.state)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>District</p>
                <p style={{ fontWeight: '500' }}>{display(victim?.district)}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Address</p>
                <p style={{ fontWeight: '500' }}>{display(victim?.address)}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Emergency contacts</p>
                {victim?.emergencyContacts?.length ? (
                  victim.emergencyContacts.map((contact, index) => (
                    <p key={index} style={{ fontWeight: '500', margin: '0.25rem 0' }}>
                      {display(contact.name)} ({display(contact.relationship)}) - {display(contact.phone)}
                    </p>
                  ))
                ) : (
                  <p style={{ fontWeight: '500' }}>N/A</p>
                )}
              </div>
            </div>
          </section>

          <section style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Documents
            </h2>
            {caseInfo.documents && caseInfo.documents.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                {caseInfo.documents.map((doc, idx) => (
                  <li key={doc.fileName || idx}>
                    {doc.fileName ? (
                      <a
                        href={`/api/v1/counselor/documents/${encodeURIComponent(doc.fileName)}?token=${encodeURIComponent(token || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', textDecoration: 'none', color: '#2563eb', fontWeight: '500' }}
                      >
                        {display(doc.originalName || doc.fileName)}
                      </a>
                    ) : (
                      <span style={{ color: '#6b7280' }}>{display(doc.originalName)}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No documents uploaded.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

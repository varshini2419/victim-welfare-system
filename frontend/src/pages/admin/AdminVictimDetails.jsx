import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminVictimDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeCounselors, setActiveCounselors] = useState([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState('');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/victims/${id}`);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCounselors = async () => {
    try {
      const res = await api.get('/admin/counselors/active');
      setActiveCounselors(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchActiveCounselors();
  }, [id]);

  const handleApprove = async () => {
    if (!caseInfoHasAdminDocument()) {
      alert('Upload at least one victim or case-related document before final approval.');
      return;
    }

    if (!window.confirm('Approve this victim registration request?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      
      const response = await api.post(`/admin/cases/${data.caseInfo._id}/approve`);
      
      const deliveryStatus = response.data.data.otpDeliveryStatus;
      alert(deliveryStatus === 'sent'
        ? 'Victim approved successfully. OTP has been sent to the registered mobile number.'
        : 'Victim approved successfully, but OTP delivery failed. Please retry sending the OTP.');
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const caseInfoHasAdminDocument = () => Boolean(data?.caseInfo?.documents?.some(document => document.uploadedBy));

  const handleAssignCounselor = async () => {
    if (!selectedCounselorId) {
      alert('Please select a counselor before approving the request.');
      return;
    }

    try {
      setActionLoading(true);
      const caseId = data?.caseInfo?._id;
      if (!caseId) {
        throw new Error('Case not loaded');
      }

      await api.put(`/admin/requests/${caseId}/assign-counselor`, {
        counselorId: selectedCounselorId
      });

      await fetchDetails();
      alert('Request approved and counselor assigned successfully.');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setActionLoading(true);
      const response = await api.post(`/admin/cases/${data.caseInfo._id}/resend-otp`);
      alert(response.data.data.otpDeliveryStatus === 'sent'
        ? 'A new OTP has been sent to the registered mobile number.'
        : 'Victim remains approved, but OTP delivery failed.');
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (selectedFiles.length === 0) {
      alert('Select at least one FIR or case document.');
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append('documents', file));
      await api.post(`/admin/cases/${data.caseInfo._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFiles([]);
      await fetchDetails();
      alert('Case documents uploaded successfully.');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Rejection reason is required.');
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/admin/cases/${data.caseInfo._id}/reject`, { reason: rejectReason });
      alert('Case rejected successfully.');
      setShowRejectModal(false);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading details...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: '2rem' }}>No data found.</div>;

  const { victim, caseInfo } = data;
  const isPending = victim.userId?.status === 'pending' && caseInfo?.status === 'pending';
  const displayStatus = victim.userId?.status === 'active' && caseInfo?.status === 'open'
    ? 'APPROVED'
    : (victim.userId?.status || caseInfo?.status || 'unknown').toUpperCase();

  return (
    <div className="admin-page" style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>
            Victim Case Review
          </h1>
          <p style={{ color: '#4b5563' }}>Registration ID: {victim.userId?.registrationId || 'N/A'}</p>
        </div>
        <Link to="/admin/victims" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>&larr; Back to Victims</Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Registration Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Registration ID</p>
                <p style={{ fontWeight: '500' }}>{victim.userId?.registrationId || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Full Name</p>
                <p style={{ fontWeight: '500' }}>{victim.name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Email Address</p>
                <p style={{ fontWeight: '500' }}>{victim.userId?.email}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Phone Number</p>
                <p style={{ fontWeight: '500' }}>{victim.phone || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Gender / Age</p>
                <p style={{ fontWeight: '500' }}>{victim.gender || 'N/A'} / {victim.dob ? new Date().getFullYear() - new Date(victim.dob).getFullYear() : 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Profession</p>
                <p style={{ fontWeight: '500' }}>{victim.profession || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Submitted</p>
                <p style={{ fontWeight: '500' }}>{victim.userId?.createdAt ? new Date(victim.userId.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>State</p>
                <p style={{ fontWeight: '500' }}>{victim.userId?.state}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>District</p>
                <p style={{ fontWeight: '500' }}>{victim.district || victim.userId?.district || 'Not Specified'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>PIN Code</p>
                <p style={{ fontWeight: '500' }}>{victim.pinCode || 'Not provided'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Related Person Details</p>
                {victim.emergencyContacts?.length ? victim.emergencyContacts.map((contact, index) => (
                  <p key={index} style={{ fontWeight: '500', margin: '0.25rem 0' }}>{contact.name} ({contact.relationship}) - {contact.phone}</p>
                )) : <p style={{ fontWeight: '500' }}>N/A</p>}
              </div>
            </div>

            {victim.userId?.profileImage && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Victim Image</p>
                <img
                  src={`http://localhost:5000${victim.userId.profileImage}`}
                  alt="Victim"
                  style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {caseInfo && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                Case Information
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {caseInfo.caseId && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Official Case ID</p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#111827' }}>{caseInfo.caseId}</p>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>FIR Number</p>
                  <p style={{ fontWeight: '500' }}>{caseInfo.firDetails?.firNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Police Station</p>
                  <p style={{ fontWeight: '500' }}>{caseInfo.firDetails?.policeStation || 'Not provided'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>FIR District</p>
                  <p style={{ fontWeight: '500' }}>{caseInfo.firDetails?.firDistrict || 'Not provided'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>FIR State</p>
                  <p style={{ fontWeight: '500' }}>{caseInfo.firDetails?.firState || 'Not provided'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Category</p>
                  <p style={{ fontWeight: '500' }}>{caseInfo.category}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Description provided during registration</p>
                  <p style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '4px', border: '1px solid #f3f4f6', marginTop: '0.25rem' }}>
                    {caseInfo.description || 'No description provided.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Case Status
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '9999px', 
                fontSize: '0.875rem',
                fontWeight: '600',
                backgroundColor: victim.userId?.status === 'active' ? '#d1fae5' : victim.userId?.status === 'pending' ? '#fef3c7' : '#fee2e2',
                color: victim.userId?.status === 'active' ? '#065f46' : victim.userId?.status === 'pending' ? '#92400e' : '#991b1b'
              }}>
                {displayStatus}
              </span>
            </div>
            
            {caseInfo?.status === 'rejected' && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#991b1b' }}>
                <strong>Rejection Reason:</strong> {caseInfo.rejectionReason}
              </div>
            )}

            {isPending && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                <p style={{ margin: 0, color: caseInfoHasAdminDocument() ? '#047857' : '#92400e', fontSize: '0.875rem', fontWeight: '600' }}>
                  {caseInfoHasAdminDocument() ? 'Required case document uploaded.' : 'Required before final approval: upload a FIR or case document.'}
                </p>
                <button 
                  onClick={handleApprove}
                  disabled={actionLoading || !caseInfoHasAdminDocument()}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: actionLoading || !caseInfoHasAdminDocument() ? '#a7f3d0' : '#10b981', color: 'white', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: actionLoading || !caseInfoHasAdminDocument() ? 'not-allowed' : 'pointer' }}
                >
                  {actionLoading ? 'Processing...' : 'FINAL APPROVE'}
                </button>
                <button 
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', color: '#dc2626', fontWeight: 'bold', borderRadius: '6px', border: '1px solid #dc2626', cursor: 'pointer' }}
                >
                  REJECT
                </button>
              </div>
            )}

            {!isPending && caseInfo?.status === 'open' && victim.userId?.otpDeliveryStatus === 'failed' && (
              <button
                onClick={handleResendOtp}
                disabled={actionLoading}
                style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
              >
                {actionLoading ? 'Sending...' : 'RESEND OTP'}
              </button>
            )}
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Identity & Documents
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aadhaar Number</p>
              <p style={{ fontWeight: '500', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{victim.aadhaarNumber || 'Not Provided'}</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>PAN Number</p>
              <p style={{ fontWeight: '500', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{victim.panNumber || 'Not Provided'}</p>
            </div>
            <div>
              {isPending && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 0.75rem', fontWeight: '600', color: '#92400e' }}>Required before final approval</p>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={event => setSelectedFiles(Array.from(event.target.files || []))}
                    style={{ display: 'block', width: '100%', marginBottom: '0.75rem' }}
                  />
                  <button
                    onClick={handleUploadDocuments}
                    disabled={uploadLoading || selectedFiles.length === 0}
                    style={{ padding: '0.5rem 0.75rem', backgroundColor: uploadLoading || selectedFiles.length === 0 ? '#d1d5db' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: uploadLoading || selectedFiles.length === 0 ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                  >
                    {uploadLoading ? 'Uploading...' : 'UPLOAD CASE DOCUMENTS'}
                  </button>
                </div>
              )}
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Registration Documents</p>
              {caseInfo?.documents && caseInfo.documents.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {caseInfo.documents.map((doc, idx) => (
                    <li key={idx}>
                      <a href={`http://localhost:5000/api/v1/admin/documents/${doc.fileName}?token=${localStorage.getItem('token')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', textDecoration: 'none', color: '#2563eb', fontSize: '0.875rem' }}>
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        {doc.originalName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No documents uploaded.</p>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Assign Counselor
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label htmlFor="activeCounselorSelect" style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                Select a counselor:
              </label>

              <select
                id="activeCounselorSelect"
                value={selectedCounselorId}
                onChange={(e) => setSelectedCounselorId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', backgroundColor: 'white' }}
              >
                <option value="">Select Counselor</option>
                {activeCounselors.map(counselor => (
                  <option key={counselor._id} value={counselor._id}>
                    {counselor.name}
                  </option>
                ))}
              </select>

              {selectedCounselorId && (
                <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  {(() => {
                    const counselor = activeCounselors.find(c => c._id === selectedCounselorId);
                    if (!counselor) return null;
                    return (
                      <div>
                        <p style={{ margin: '0 0 0.4rem', fontWeight: '700', color: '#111827' }}>Selected Counselor: {counselor.name}</p>
                        <p style={{ margin: '0 0 0.2rem', color: '#4b5563' }}>{counselor.profession || 'Counselor'}</p>
                        <p style={{ margin: 0, color: '#4b5563' }}>{counselor.qualification || 'Not specified'}</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <button
                type="button"
                onClick={handleAssignCounselor}
                disabled={actionLoading || !selectedCounselorId}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: actionLoading || !selectedCounselorId ? '#d1d5db' : '#2563eb', color: 'white', fontWeight: '700', border: 'none', borderRadius: '6px', cursor: actionLoading || !selectedCounselorId ? 'not-allowed' : 'pointer' }}
              >
                {actionLoading ? 'Assigning...' : 'Approve & Assign'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Reject Case</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection (required)..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '100px', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReject} disabled={actionLoading} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', backgroundColor: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

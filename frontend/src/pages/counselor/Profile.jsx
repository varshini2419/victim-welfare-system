import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const defaultProfile = {
  name: 'Counselor',
  profession: 'Mental Health Counselor',
  qualification: 'Psychology & Counseling',
  qualifications: [],
  about: 'Professional counselor profile details will appear here.',
  specialization: 'General counseling',
  district: 'Not available',
  state: 'Not available',
  phone: 'Not available',
  gender: 'Not available',
  experience: 0,
  verificationStatus: 'approved',
  maxCaseload: 0,
  currentCaseload: 0,
  profileImage: ''
};

const getProfileImage = (profileImage) => {
  if (!profileImage) return null;
  if (profileImage.startsWith('http')) return profileImage;
  return `http://localhost:5000${profileImage}`;
};

export default function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/counselor/profile');
      const data = { ...defaultProfile, ...res.data.data };
      setProfile(data);
      setPreviewImage(getProfileImage(data.profileImage) || '');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load counselor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('name', profile.name || '');
      formData.append('profession', profile.profession || '');
      formData.append('qualification', profile.qualification || '');
      formData.append('about', profile.about || '');
      formData.append('phone', profile.phone || '');
      formData.append('district', profile.district || '');
      formData.append('state', profile.state || '');
      formData.append('gender', profile.gender || 'Not available');
      formData.append('experience', String(profile.experience || 0));
      formData.append('specialization', profile.specialization || 'General counseling');

      if (selectedImage) {
        formData.append('profileImage', selectedImage);
      }

      await api.put('/counselor/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Profile updated successfully.');
      setSelectedImage(null);
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const qualificationText = Array.isArray(profile.qualifications) && profile.qualifications.length > 0
    ? profile.qualifications.join(', ')
    : profile.qualification || 'Not specified';

  const stats = [
    { label: 'Current Caseload', value: `${profile.currentCaseload || 0}/${profile.maxCaseload || 0}` },
    { label: 'Experience', value: `${profile.experience || 0} years` },
    { label: 'Verification', value: (profile.verificationStatus || 'approved').toUpperCase() },
    { label: 'Location', value: `${profile.district || 'Not available'}, ${profile.state || 'Not available'}` }
  ];

  if (loading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
          Loading counselor profile...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1280px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ margin: 0, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Counselor Account</p>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Counselor Profile</h1>
        </div>
        <Link to="/counselor/dashboard" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>← Back to dashboard</Link>
      </header>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '0.9rem 1rem', color: '#991b1b', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '0.9rem 1rem', color: '#166534', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', border: '1px solid #dbeafe', borderRadius: '22px', padding: '1.4rem', boxShadow: '0 18px 35px rgba(37, 99, 235, 0.10)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '190px', height: '190px', borderRadius: '50%', padding: '6px', background: 'linear-gradient(135deg, #bfdbfe, #dbeafe, #eff6ff)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #ffffff' }}>
                {previewImage ? (
                  <img src={previewImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '3.3rem', fontWeight: 800, color: '#1d4ed8' }}>
                    {profile.name ? profile.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() : 'C'}
                  </div>
                )}
              </div>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #93c5fd', borderRadius: '999px', background: '#eff6ff', color: '#1d4ed8', padding: '0.65rem 1rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
              Upload photo
              <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            </label>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <input
                value={profile.name || ''}
                onChange={(event) => updateField('name', event.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', width: '100%', maxWidth: '420px', outline: 'none', padding: 0 }}
              />
              <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '999px', padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 800 }}>
                {String(profile.verificationStatus || 'approved').toUpperCase()}
              </span>
            </div>

            <input
              value={profile.profession || ''}
              onChange={(event) => updateField('profession', event.target.value)}
              style={{ display: 'block', width: '100%', maxWidth: '520px', border: '1px solid #dbeafe', borderRadius: '10px', padding: '0.7rem 0.9rem', color: '#1d4ed8', fontWeight: 700, fontSize: '1rem', background: '#f8fbff', marginBottom: '0.8rem' }}
            />

            <input
              value={profile.qualification || ''}
              onChange={(event) => updateField('qualification', event.target.value)}
              style={{ display: 'block', width: '100%', maxWidth: '620px', border: '1px solid #dbeafe', borderRadius: '10px', padding: '0.7rem 0.9rem', color: '#475569', fontSize: '0.96rem', background: '#f8fbff' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              {stats.map((item) => (
                <div key={item.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 0.9rem' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', fontWeight: 700 }}>{item.label}</div>
                  <div style={{ marginTop: '0.3rem', fontWeight: 700, color: '#0f172a' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem', marginTop: '1.5rem' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>About</div>
            <textarea
              value={profile.about || ''}
              onChange={(event) => updateField('about', event.target.value)}
              rows={4}
              style={{ width: '100%', marginTop: '0.75rem', resize: 'vertical', border: '1px solid #dbeafe', background: '#fff', borderRadius: '10px', padding: '0.8rem 0.9rem', color: '#334155', lineHeight: 1.6, fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Specialization</div>
            <input
              value={profile.specialization || ''}
              onChange={(event) => updateField('specialization', event.target.value)}
              style={{ width: '100%', marginTop: '0.75rem', border: '1px solid #dbeafe', borderRadius: '10px', padding: '0.7rem 0.9rem', fontWeight: 700, color: '#0f172a', background: '#fff' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Phone</div>
            <input value={profile.phone || ''} onChange={(event) => updateField('phone', event.target.value)} style={{ width: '100%', marginTop: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 0.9rem', fontWeight: 700, color: '#0f172a', background: '#fff' }} />
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Gender</div>
            <select value={profile.gender || 'Not available'} onChange={(event) => updateField('gender', event.target.value)} style={{ width: '100%', marginTop: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 0.9rem', fontWeight: 700, color: '#0f172a', background: '#fff' }}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>District</div>
            <input value={profile.district || ''} onChange={(event) => updateField('district', event.target.value)} style={{ width: '100%', marginTop: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 0.9rem', fontWeight: 700, color: '#0f172a', background: '#fff' }} />
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>State</div>
            <input value={profile.state || ''} onChange={(event) => updateField('state', event.target.value)} style={{ width: '100%', marginTop: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.7rem 0.9rem', fontWeight: 700, color: '#0f172a', background: '#fff' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              borderRadius: '12px',
              padding: '0.9rem 1.5rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.8 : 1,
              boxShadow: '0 12px 20px rgba(37, 99, 235, 0.25)'
            }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

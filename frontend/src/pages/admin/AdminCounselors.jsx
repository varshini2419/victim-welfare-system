import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import './AdminCounselors.css';

const PROFESSION_SUGGESTIONS = [
  'Career Counselor',
  'Student Counselor',
  'Mental Health Counselor',
  'Educational Consultant',
  'Career Advisor',
  'Clinical Psychologist',
  'Rehabilitation Caseworker'
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function AdminCounselors() {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    profession: '',
    qualification: '',
    about: '',
    phone: '',
    email: '',
    district: '',
    state: '',
    experience: '',
    status: 'active',
    password: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch counselors from API
  const fetchCounselors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/counselors');
      setCounselors(res.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch counselors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  // Filter and search computation
  const filteredCounselors = useMemo(() => {
    return counselors.filter(c => {
      // Status filter
      const currentStatus = c.status || 'active';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchProf = (c.profession || '').toLowerCase().includes(q);
        const matchDist = (c.district || '').toLowerCase().includes(q);
        const matchState = (c.state || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchQual = (c.qualification || '').toLowerCase().includes(q);
        return matchName || matchProf || matchDist || matchState || matchEmail || matchQual;
      }

      return true;
    });
  }, [counselors, statusFilter, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    const total = counselors.length;
    const active = counselors.filter(c => (c.status || 'active') === 'active').length;
    const inactive = counselors.filter(c => (c.status || 'active') === 'inactive').length;
    return { total, active, inactive };
  }, [counselors]);

  // Image change handler with preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormErrors(prev => ({
        ...prev,
        profileImage: 'Unsupported format. Only JPG, JPEG, PNG, and WEBP files are allowed.'
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormErrors(prev => ({
        ...prev,
        profileImage: 'Image size exceeds maximum limit of 2MB.'
      }));
      return;
    }

    // Clear error
    setFormErrors(prev => {
      const copy = { ...prev };
      delete copy.profileImage;
      return copy;
    });

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field-specific error as user types
    if (formErrors[name]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Form validation
  const validateForm = (isEdit = false) => {
    const errors = {};

    if (!isEdit && !imageFile && !imagePreview) {
      errors.profileImage = 'Counselor profile image is required.';
    }

    if (!formData.name.trim()) {
      errors.name = 'Full Name is required.';
    }

    if (!formData.profession.trim()) {
      errors.profession = 'Profession / Job Title is required.';
    }

    if (!formData.qualification.trim()) {
      errors.qualification = 'Qualification is required.';
    }

    if (!formData.about.trim()) {
      errors.about = 'About / Professional Description is required.';
    } else if (formData.about.trim().length < 10) {
      errors.about = 'Description must be at least 10 characters long.';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone Number is required.';
    } else {
      const cleanPhone = formData.phone.trim().replace(/[\s-]/g, '');
      const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Enter a valid 10-digit Indian mobile number.';
      }
    }

    if (!formData.email.trim()) {
      errors.email = 'Email Address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Enter a valid email address.';
      }
    }

    if (!formData.district.trim()) {
      errors.district = 'District is required.';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required.';
    }

    if (
      formData.experience === '' ||
      formData.experience === null ||
      isNaN(formData.experience) ||
      Number(formData.experience) < 0
    ) {
      errors.experience = 'Experience must be a positive number (0 or higher).';
    }

    if (!isEdit) {
      if (!formData.password) {
        errors.password = 'Login password is required.';
      } else if (formData.password.length < 4) {
        errors.password = 'Password must be at least 4 characters.';
      }
    } else if (formData.password && formData.password.length < 4) {
      errors.password = 'Password must be at least 4 characters if provided.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      profession: '',
      qualification: '',
      about: '',
      phone: '',
      email: '',
      district: '',
      state: '',
      experience: '',
      status: 'active',
      password: ''
    });
    setImageFile(null);
    setImagePreview('');
    setFormErrors({});
    setShowPassword(false);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (counselor) => {
    setSelectedCounselor(counselor);
    setFormData({
      name: counselor.name || '',
      profession: counselor.profession || '',
      qualification: counselor.qualification || '',
      about: counselor.about || '',
      phone: counselor.phone || '',
      email: counselor.email || '',
      district: counselor.district || '',
      state: counselor.state || '',
      experience: counselor.experience !== undefined ? counselor.experience : '',
      status: counselor.status || 'active',
      password: '' // empty means keep existing
    });
    setImageFile(null);
    setImagePreview(counselor.profileImage || '');
    setFormErrors({});
    setShowPassword(false);
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const openViewModal = (counselor) => {
    setSelectedCounselor(counselor);
    setIsViewModalOpen(true);
  };

  // Open Delete Confirmation
  const openDeleteModal = (counselor) => {
    setSelectedCounselor(counselor);
    setIsDeleteModalOpen(true);
  };

  // Submit Add Counselor
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('profession', formData.profession.trim());
      data.append('qualification', formData.qualification.trim());
      data.append('about', formData.about.trim());
      data.append('phone', formData.phone.trim());
      data.append('email', formData.email.trim());
      data.append('district', formData.district.trim());
      data.append('state', formData.state.trim());
      data.append('experience', formData.experience);
      data.append('status', formData.status);
      data.append('password', formData.password);
      if (imageFile) {
        data.append('profileImage', imageFile);
      }

      await api.post('/admin/counselors', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Counselor created successfully!', 'success');
      setIsAddModalOpen(false);
      fetchCounselors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create counselor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Counselor
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('profession', formData.profession.trim());
      data.append('qualification', formData.qualification.trim());
      data.append('about', formData.about.trim());
      data.append('phone', formData.phone.trim());
      data.append('email', formData.email.trim());
      data.append('district', formData.district.trim());
      data.append('state', formData.state.trim());
      data.append('experience', formData.experience);
      data.append('status', formData.status);
      if (formData.password.trim()) {
        data.append('password', formData.password.trim());
      }
      if (imageFile) {
        data.append('profileImage', imageFile);
      }

      await api.put(`/admin/counselors/${selectedCounselor._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Counselor updated successfully!', 'success');
      setIsEditModalOpen(false);
      fetchCounselors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update counselor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!selectedCounselor) return;

    try {
      setSubmitting(true);
      await api.delete(`/admin/counselors/${selectedCounselor._id}`);
      showToast('Counselor deleted successfully!', 'success');
      setIsDeleteModalOpen(false);
      setSelectedCounselor(null);
      fetchCounselors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete counselor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="counselor-mgmt-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`counselor-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="counselor-mgmt-header">
        <div className="header-title-area">
          <h1>Counselor Management</h1>
          <p>Manage, add, edit, and monitor all counselors.</p>
        </div>
        <button className="btn-add-counselor" onClick={openAddModal}>
          <span>+</span>
          <span>Add Counselor</span>
        </button>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="counselor-controls-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="counselor-search-input"
            placeholder="Search by name, profession, district, state, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs-group">
          <button
            className={`filter-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>All Counselors</span>
            <span className="filter-count-badge">{counts.total}</span>
          </button>
          <button
            className={`filter-tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <span>Active</span>
            <span className="filter-count-badge">{counts.active}</span>
          </button>
          <button
            className={`filter-tab-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            <span>Inactive</span>
            <span className="filter-count-badge">{counts.inactive}</span>
          </button>
        </div>
      </div>

      {/* Counselor Cards Display */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
          <p style={{ fontWeight: '600' }}>Loading counselors...</p>
        </div>
      ) : filteredCounselors.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">👥</div>
          <h3>No Counselors Found</h3>
          <p>
            {searchQuery.trim() || statusFilter !== 'all'
              ? 'No counselors match your search criteria. Try adjusting filters.'
              : 'No counselors registered yet. Click "+ Add Counselor" to create your first counselor account.'}
          </p>
          <button className="btn-add-counselor" onClick={openAddModal}>
            + Add Counselor
          </button>
        </div>
      ) : (
        <div className="counselors-grid">
          {filteredCounselors.map((counselor) => {
            const isActive = (counselor.status || 'active') === 'active';
            const initials = (counselor.name || 'C')
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={counselor._id} className="counselor-card">
                {/* Header: Avatar, Name & Profession */}
                <div className="counselor-card-header">
                  <div className="card-avatar-wrapper">
                    {counselor.profileImage ? (
                      <img
                        src={counselor.profileImage}
                        alt={counselor.name}
                        className="card-avatar-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="card-avatar-fallback"
                      style={{ display: counselor.profileImage ? 'none' : 'flex' }}
                    >
                      {initials}
                    </div>
                  </div>

                  <h3 className="card-counselor-name">{counselor.name}</h3>
                  <span className="card-counselor-profession">
                    {counselor.profession || 'Counselor'}
                  </span>
                </div>

                {/* Details List */}
                <div className="card-details-list">
                  <div className="detail-row">
                    <span className="detail-icon">🎓</span>
                    <span className="detail-text" title={counselor.qualification}>
                      {counselor.qualification || 'Not specified'}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">⭐</span>
                    <span className="detail-text">
                      <strong>{counselor.experience || 0} Years</strong> Experience
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">📍</span>
                    <span className="detail-text" title={`${counselor.district}, ${counselor.state}`}>
                      {counselor.district || 'All'}, {counselor.state || 'All'}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">📞</span>
                    <span className="detail-text">{counselor.phone || 'N/A'}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">✉️</span>
                    <span className="detail-text" title={counselor.email}>
                      {counselor.email || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="card-status-row">
                  <span className={`counselor-status-pill ${isActive ? 'active' : 'inactive'}`}>
                    <span className="status-dot"></span>
                    <span>{isActive ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>

                {/* Card Actions: View, Edit, Delete */}
                <div className="card-actions-row">
                  <button
                    className="card-action-btn btn-card-view"
                    onClick={() => openViewModal(counselor)}
                  >
                    <span>👁️</span>
                    <span>View</span>
                  </button>
                  <button
                    className="card-action-btn btn-card-edit"
                    onClick={() => openEditModal(counselor)}
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button
                    className="card-action-btn btn-card-delete"
                    onClick={() => openDeleteModal(counselor)}
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          ADD COUNSELOR MODAL
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="counselor-modal-overlay" onClick={() => !submitting && setIsAddModalOpen(false)}>
          <div className="counselor-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>+ Add New Counselor</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                disabled={submitting}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="modal-body-form" noValidate>
              {/* Profile Image with Live Preview */}
              <div className="form-field-group">
                <label className="form-label">
                  Counselor Profile Image <span className="required-star">*</span>
                </label>
                <div className={`image-upload-wrapper ${formErrors.profileImage ? 'has-error' : ''}`}>
                  <div className="preview-circle">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" />
                    ) : (
                      <span className="preview-placeholder">👤</span>
                    )}
                  </div>
                  <div className="image-upload-controls">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleImageChange}
                      className="file-input-custom"
                    />
                    <span className="file-format-hint">
                      Formats accepted: JPG, JPEG, PNG, WEBP (Max 2MB)
                    </span>
                  </div>
                </div>
                {formErrors.profileImage && (
                  <span className="field-error-msg">{formErrors.profileImage}</span>
                )}
              </div>

              <div className="form-grid-two-col">
                {/* Full Name */}
                <div className="form-field-group">
                  <label className="form-label">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Dr. Ramesh Kumar"
                    className={`form-input ${formErrors.name ? 'has-error' : ''}`}
                  />
                  {formErrors.name && <span className="field-error-msg">{formErrors.name}</span>}
                </div>

                {/* Profession / Job Title */}
                <div className="form-field-group">
                  <label className="form-label">
                    Profession / Job Title <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    list="profession-suggestions"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    placeholder="e.g. Mental Health Counselor"
                    className={`form-input ${formErrors.profession ? 'has-error' : ''}`}
                  />
                  <datalist id="profession-suggestions">
                    {PROFESSION_SUGGESTIONS.map((prof, i) => (
                      <option key={i} value={prof} />
                    ))}
                  </datalist>
                  {formErrors.profession && (
                    <span className="field-error-msg">{formErrors.profession}</span>
                  )}
                </div>
              </div>

              <div className="form-grid-two-col">
                {/* Qualification */}
                <div className="form-field-group">
                  <label className="form-label">
                    Qualification <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    placeholder="e.g. M.Sc Psychology, PhD"
                    className={`form-input ${formErrors.qualification ? 'has-error' : ''}`}
                  />
                  {formErrors.qualification && (
                    <span className="field-error-msg">{formErrors.qualification}</span>
                  )}
                </div>

                {/* Experience */}
                <div className="form-field-group">
                  <label className="form-label">
                    Years of Experience <span className="required-star">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g. 5"
                    className={`form-input ${formErrors.experience ? 'has-error' : ''}`}
                  />
                  {formErrors.experience && (
                    <span className="field-error-msg">{formErrors.experience}</span>
                  )}
                </div>
              </div>

              {/* About Description */}
              <div className="form-field-group">
                <label className="form-label">
                  About / Professional Description <span className="required-star">*</span>
                </label>
                <textarea
                  rows="3"
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  placeholder="Describe the counselor's background, expertise, and therapeutic accomplishments..."
                  className={`form-textarea ${formErrors.about ? 'has-error' : ''}`}
                />
                {formErrors.about && <span className="field-error-msg">{formErrors.about}</span>}
              </div>

              <div className="form-grid-two-col">
                {/* Phone Number */}
                <div className="form-field-group">
                  <label className="form-label">
                    Phone Number <span className="required-star">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 9876543210"
                    className={`form-input ${formErrors.phone ? 'has-error' : ''}`}
                  />
                  {formErrors.phone && <span className="field-error-msg">{formErrors.phone}</span>}
                </div>

                {/* Email Address */}
                <div className="form-field-group">
                  <label className="form-label">
                    Email Address <span className="required-star">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="counselor@aarohan.gov.in"
                    className={`form-input ${formErrors.email ? 'has-error' : ''}`}
                  />
                  {formErrors.email && <span className="field-error-msg">{formErrors.email}</span>}
                </div>
              </div>

              <div className="form-grid-two-col">
                {/* District */}
                <div className="form-field-group">
                  <label className="form-label">
                    District <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="e.g. Visakhapatnam"
                    className={`form-input ${formErrors.district ? 'has-error' : ''}`}
                  />
                  {formErrors.district && (
                    <span className="field-error-msg">{formErrors.district}</span>
                  )}
                </div>

                {/* State */}
                <div className="form-field-group">
                  <label className="form-label">
                    State <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Andhra Pradesh"
                    className={`form-input ${formErrors.state ? 'has-error' : ''}`}
                  />
                  {formErrors.state && <span className="field-error-msg">{formErrors.state}</span>}
                </div>
              </div>

              <div className="form-grid-two-col">
                {/* Counselor Status */}
                <div className="form-field-group">
                  <label className="form-label">
                    Counselor Status <span className="required-star">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="active">Active (Can log in immediately)</option>
                    <option value="inactive">Inactive (Login disabled)</option>
                  </select>
                </div>

                {/* Login Password */}
                <div className="form-field-group">
                  <label className="form-label">
                    Counselor Login Password <span className="required-star">*</span>
                  </label>
                  <div className="password-input-box">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 4 characters"
                      className={`form-input ${formErrors.password ? 'has-error' : ''}`}
                    />
                    <button
                      type="button"
                      className="btn-toggle-password"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                  {formErrors.password && (
                    <span className="field-error-msg">{formErrors.password}</span>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit-primary" disabled={submitting}>
                  {submitting ? 'Creating Counselor...' : 'Create Counselor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT COUNSELOR MODAL
          ========================================================================= */}
      {isEditModalOpen && (
        <div className="counselor-modal-overlay" onClick={() => !submitting && setIsEditModalOpen(false)}>
          <div className="counselor-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>✏️ Edit Counselor Details</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
                disabled={submitting}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body-form" noValidate>
              {/* Profile Image with Live Preview */}
              <div className="form-field-group">
                <label className="form-label">Profile Image (Optional: Change)</label>
                <div className={`image-upload-wrapper ${formErrors.profileImage ? 'has-error' : ''}`}>
                  <div className="preview-circle">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" />
                    ) : (
                      <span className="preview-placeholder">👤</span>
                    )}
                  </div>
                  <div className="image-upload-controls">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleImageChange}
                      className="file-input-custom"
                    />
                    <span className="file-format-hint">
                      Leave unchanged or select a new image (JPG, PNG, WEBP)
                    </span>
                  </div>
                </div>
                {formErrors.profileImage && (
                  <span className="field-error-msg">{formErrors.profileImage}</span>
                )}
              </div>

              <div className="form-grid-two-col">
                {/* Full Name */}
                <div className="form-field-group">
                  <label className="form-label">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.name ? 'has-error' : ''}`}
                  />
                  {formErrors.name && <span className="field-error-msg">{formErrors.name}</span>}
                </div>

                {/* Profession */}
                <div className="form-field-group">
                  <label className="form-label">
                    Profession / Job Title <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    list="edit-profession-suggestions"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.profession ? 'has-error' : ''}`}
                  />
                  <datalist id="edit-profession-suggestions">
                    {PROFESSION_SUGGESTIONS.map((prof, i) => (
                      <option key={i} value={prof} />
                    ))}
                  </datalist>
                  {formErrors.profession && (
                    <span className="field-error-msg">{formErrors.profession}</span>
                  )}
                </div>
              </div>

              <div className="form-grid-two-col">
                {/* Qualification */}
                <div className="form-field-group">
                  <label className="form-label">
                    Qualification <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.qualification ? 'has-error' : ''}`}
                  />
                  {formErrors.qualification && (
                    <span className="field-error-msg">{formErrors.qualification}</span>
                  )}
                </div>

                {/* Experience */}
                <div className="form-field-group">
                  <label className="form-label">
                    Years of Experience <span className="required-star">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.experience ? 'has-error' : ''}`}
                  />
                  {formErrors.experience && (
                    <span className="field-error-msg">{formErrors.experience}</span>
                  )}
                </div>
              </div>

              {/* About Description */}
              <div className="form-field-group">
                <label className="form-label">
                  About / Professional Description <span className="required-star">*</span>
                </label>
                <textarea
                  rows="3"
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  className={`form-textarea ${formErrors.about ? 'has-error' : ''}`}
                />
                {formErrors.about && <span className="field-error-msg">{formErrors.about}</span>}
              </div>

              <div className="form-grid-two-col">
                {/* Phone */}
                <div className="form-field-group">
                  <label className="form-label">
                    Phone Number <span className="required-star">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.phone ? 'has-error' : ''}`}
                  />
                  {formErrors.phone && <span className="field-error-msg">{formErrors.phone}</span>}
                </div>

                {/* Email */}
                <div className="form-field-group">
                  <label className="form-label">
                    Email Address <span className="required-star">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.email ? 'has-error' : ''}`}
                  />
                  {formErrors.email && <span className="field-error-msg">{formErrors.email}</span>}
                </div>
              </div>

              <div className="form-grid-two-col">
                {/* District */}
                <div className="form-field-group">
                  <label className="form-label">
                    District <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.district ? 'has-error' : ''}`}
                  />
                  {formErrors.district && (
                    <span className="field-error-msg">{formErrors.district}</span>
                  )}
                </div>

                {/* State */}
                <div className="form-field-group">
                  <label className="form-label">
                    State <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`form-input ${formErrors.state ? 'has-error' : ''}`}
                  />
                  {formErrors.state && <span className="field-error-msg">{formErrors.state}</span>}
                </div>
              </div>

              <div className="form-grid-two-col">
                {/* Status */}
                <div className="form-field-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Password (Optional in Edit) */}
                <div className="form-field-group">
                  <label className="form-label">
                    New Password <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Leave blank to keep current)</span>
                  </label>
                  <div className="password-input-box">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Leave blank to keep existing"
                      className={`form-input ${formErrors.password ? 'has-error' : ''}`}
                    />
                    <button
                      type="button"
                      className="btn-toggle-password"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                  {formErrors.password && (
                    <span className="field-error-msg">{formErrors.password}</span>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Counselor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW COUNSELOR MODAL
          ========================================================================= */}
      {isViewModalOpen && selectedCounselor && (
        <div className="counselor-modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="counselor-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>👤 Counselor Profile</h2>
              <button className="modal-close-btn" onClick={() => setIsViewModalOpen(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body-form">
              <div className="view-profile-header">
                <div className="view-profile-avatar">
                  {selectedCounselor.profileImage ? (
                    <img
                      src={selectedCounselor.profileImage}
                      alt={selectedCounselor.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="card-avatar-fallback"
                    style={{ display: selectedCounselor.profileImage ? 'none' : 'flex' }}
                  >
                    {(selectedCounselor.name || 'C').slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="view-profile-info">
                  <h3>{selectedCounselor.name}</h3>
                  <span className="card-counselor-profession">
                    {selectedCounselor.profession || 'Counselor'}
                  </span>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span
                      className={`counselor-status-pill ${
                        (selectedCounselor.status || 'active') === 'active' ? 'active' : 'inactive'
                      }`}
                    >
                      <span className="status-dot"></span>
                      <span>
                        {(selectedCounselor.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="view-grid-details">
                <div className="view-item-box">
                  <label>Qualification</label>
                  <p>{selectedCounselor.qualification || 'Not Specified'}</p>
                </div>

                <div className="view-item-box">
                  <label>Experience</label>
                  <p>{selectedCounselor.experience || 0} Years</p>
                </div>

                <div className="view-item-box">
                  <label>Email Address</label>
                  <p>{selectedCounselor.email || 'N/A'}</p>
                </div>

                <div className="view-item-box">
                  <label>Phone Number</label>
                  <p>{selectedCounselor.phone || 'N/A'}</p>
                </div>

                <div className="view-item-box">
                  <label>District &amp; State</label>
                  <p>
                    {selectedCounselor.district || 'All'}, {selectedCounselor.state || 'All'}
                  </p>
                </div>

                <div className="view-item-box">
                  <label>Caseload Capacity</label>
                  <p>
                    {selectedCounselor.currentCaseload || 0} / {selectedCounselor.maxCaseload || 15}{' '}
                    Active Cases
                  </p>
                </div>
              </div>

              <div className="view-about-section">
                <label>About / Professional Description</label>
                <p>
                  {selectedCounselor.about ||
                    'No detailed professional description provided for this counselor.'}
                </p>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-submit-primary"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedCounselor);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {isDeleteModalOpen && selectedCounselor && (
        <div className="counselor-modal-overlay" onClick={() => !submitting && setIsDeleteModalOpen(false)}>
          <div className="counselor-modal-content delete-dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-warning-icon">⚠️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Delete Counselor?
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete counselor{' '}
              <strong style={{ color: '#0f172a' }}>{selectedCounselor.name}</strong> (
              {selectedCounselor.email})?
              <br />
              <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '600' }}>
                This action cannot be undone and will remove their login access.
              </span>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete Counselor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

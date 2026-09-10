import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { ANDHRA_PRADESH_DISTRICTS } from '../../constants/districts';
import { WELFARE_SPECIALIZATIONS, WELFARE_OFFICER_ROLE } from '../../constants/welfare';
import './AdminWelfare.css';

const emptyForm = { name: '', officerId: '', phone: '', email: '', password: '', state: 'Andhra Pradesh', district: '', specializations: [], status: 'active' };
const errorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

export default function AdminWelfare() {
  const [officers, setOfficers] = useState([]);
  const [stats, setStats] = useState({ totalOfficers: 0, activeOfficers: 0, assignedVictims: 0, availableOfficers: 0 });
  const [filters, setFilters] = useState({ search: '', state: 'all', district: 'all', specialization: 'all', status: 'all' });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [eligibleVictims, setEligibleVictims] = useState([]);
  const [selectedVictimId, setSelectedVictimId] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const fetchData = async () => {
    try {
      setLoading(true); setPageError('');
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== 'all'));
      const [officerResponse, statsResponse] = await Promise.all([
        api.get('/admin/welfare-officers', { params }), api.get('/admin/welfare-officers/stats')
      ]);
      setOfficers(officerResponse.data.data || []); setStats(statsResponse.data.data || {});
    } catch (error) { setPageError(errorMessage(error, 'Failed to load welfare officers.')); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(fetchData, 250);
    return () => clearTimeout(timer);
  }, [filters.search, filters.state, filters.district, filters.specialization, filters.status]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const openAdd = () => { setFormData({ ...emptyForm }); setFormErrors({}); setSelectedOfficer(null); setModal('add'); };
  const openEdit = officer => {
    setSelectedOfficer(officer);
    setFormData({ name: officer.name || '', officerId: officer.officerId || '', phone: officer.phone || '', email: officer.email || '', password: '', state: officer.state || '', district: officer.district || '', specializations: officer.specializations || [], status: officer.status || 'inactive' });
    setFormErrors({}); setModal('edit');
  };
  const openView = async officer => {
    try { const response = await api.get(`/admin/welfare-officers/${officer._id}`); setSelectedOfficer(response.data.data); setModal('view'); }
    catch (error) { showToast(errorMessage(error, 'Failed to load officer details.'), 'error'); }
  };
  const openAssign = async officer => {
    if (officer.status !== 'active') { showToast('Inactive officers cannot receive new assignments.', 'error'); return; }
    try {
      setSelectedOfficer(officer); setSelectedVictimId(''); setAssignmentLoading(true);
      const response = await api.get(`/admin/welfare-officers/${officer._id}/eligible-victims`);
      setEligibleVictims(response.data.data || []); setModal('assign');
    } catch (error) { showToast(errorMessage(error, 'Failed to load eligible victims.'), 'error'); }
    finally { setAssignmentLoading(false); }
  };
  const updateStatus = async officer => {
    const nextStatus = officer.status === 'active' ? 'inactive' : 'active';
    try { await api.patch(`/admin/welfare-officers/${officer._id}/status`, { status: nextStatus }); showToast(`Officer ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`); fetchData(); }
    catch (error) { showToast(errorMessage(error, 'Failed to update officer status.'), 'error'); }
  };
  const handleFormChange = event => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: value })); setFormErrors(previous => ({ ...previous, [name]: '' }));
  };
  const toggleSpecialization = specialization => {
    setFormData(previous => ({ ...previous, specializations: previous.specializations.includes(specialization) ? previous.specializations.filter(item => item !== specialization) : [...previous.specializations, specialization] }));
    setFormErrors(previous => ({ ...previous, specializations: '' }));
  };
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required.';
    if (!formData.officerId.trim()) errors.officerId = 'Officer ID is required.';
    if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(formData.phone.replace(/[\s-]/g, ''))) errors.phone = 'Enter a valid Indian mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = 'Enter a valid email address.';
    if (modal === 'add' && formData.password.length < 4) errors.password = 'Password must be at least 4 characters.';
    if (!formData.state.trim()) errors.state = 'State is required.';
    if (!formData.district) errors.district = 'District is required.';
    if (!formData.specializations.length) errors.specializations = 'Select at least one specialization.';
    setFormErrors(errors); return Object.keys(errors).length === 0;
  };
  const submitForm = async event => {
    event.preventDefault(); if (!validateForm()) return;
    try {
      setSubmitting(true); const payload = { ...formData, officerType: WELFARE_OFFICER_ROLE };
      if (modal === 'add') { await api.post('/admin/welfare-officers', payload); showToast('Welfare officer created successfully.'); }
      else { await api.put(`/admin/welfare-officers/${selectedOfficer._id}`, payload); showToast('Welfare officer updated successfully.'); }
      setModal(null); fetchData();
    } catch (error) { showToast(errorMessage(error, 'Unable to save welfare officer.'), 'error'); }
    finally { setSubmitting(false); }
  };
  const assignVictim = async event => {
    event.preventDefault(); if (!selectedVictimId) return;
    try { setSubmitting(true); await api.post(`/admin/welfare-officers/${selectedOfficer._id}/assignments`, { victimId: selectedVictimId }); showToast('Victim assigned successfully.'); setModal(null); fetchData(); }
    catch (error) { showToast(errorMessage(error, 'Unable to assign victim.'), 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="welfare-officer-page">
      {toast && <div className={`welfare-toast ${toast.type}`}>{toast.message}</div>}
      <header className="welfare-officer-header"><div><h1>Welfare Oversight</h1><p>Manage welfare and rehabilitation officers</p></div><button className="welfare-primary-button" type="button" onClick={openAdd}>+ Add Officer</button></header>
      {pageError && <div className="welfare-error">{pageError}</div>}
      <section className="welfare-stat-grid" aria-label="Welfare officer statistics">
        <div className="welfare-stat-card"><span>Total Officers</span><strong>{stats.totalOfficers || 0}</strong></div><div className="welfare-stat-card"><span>Active Officers</span><strong>{stats.activeOfficers || 0}</strong></div><div className="welfare-stat-card"><span>Assigned Victims</span><strong>{stats.assignedVictims || 0}</strong></div><div className="welfare-stat-card"><span>Available Officers</span><strong>{stats.availableOfficers || 0}</strong></div>
      </section>
      <section className="welfare-panel">
        <div className="welfare-filter-grid">
          <input className="welfare-input" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Search officer name, ID, or email" />
          <input className="welfare-input" value={filters.state === 'all' ? '' : filters.state} onChange={event => setFilters({ ...filters, state: event.target.value || 'all' })} placeholder="State" />
          <select className="welfare-select" value={filters.district} onChange={event => setFilters({ ...filters, district: event.target.value })}><option value="all">All Districts</option>{ANDHRA_PRADESH_DISTRICTS.map(district => <option key={district} value={district}>{district}</option>)}</select>
          <select className="welfare-select" value={filters.specialization} onChange={event => setFilters({ ...filters, specialization: event.target.value })}><option value="all">All Specializations</option>{WELFARE_SPECIALIZATIONS.map(item => <option key={item} value={item}>{item}</option>)}</select>
          <select className="welfare-select" value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
        {loading ? <div className="welfare-empty">Loading welfare officers...</div> : officers.length === 0 ? <div className="welfare-empty">No welfare officers added yet.</div> : <div className="welfare-table-wrap"><table className="welfare-table"><thead><tr><th>Officer Name</th><th>Officer ID</th><th>State</th><th>District</th><th>Specialization</th><th>Assigned Victims</th><th>Status</th><th>Actions</th></tr></thead><tbody>{officers.map(officer => <tr key={officer._id}><td><strong>{officer.name}</strong><br /><small>{officer.email}</small></td><td>{officer.officerId}</td><td>{officer.state}</td><td>{officer.district}</td><td>{(officer.specializations || []).map(item => <span className="welfare-tag" key={item}>{item}</span>)}</td><td>{officer.assignedVictims || 0}</td><td><span className={`welfare-status ${officer.status}`}>{officer.status === 'active' ? 'Active' : 'Inactive'}</span></td><td><div className="welfare-actions"><button type="button" onClick={() => openView(officer)}>View</button><button type="button" onClick={() => openEdit(officer)}>Edit</button><button type="button" onClick={() => updateStatus(officer)}>{officer.status === 'active' ? 'Deactivate' : 'Activate'}</button><button type="button" disabled={officer.status !== 'active'} onClick={() => openAssign(officer)}>Assign Victims</button></div></td></tr>)}</tbody></table></div>}
      </section>

      {(modal === 'add' || modal === 'edit') && <div className="welfare-modal-overlay" onClick={() => !submitting && setModal(null)}><form className="welfare-modal" onSubmit={submitForm} onClick={event => event.stopPropagation()}><div className="welfare-modal-header"><h2>{modal === 'add' ? 'Add Welfare Officer' : 'Edit Welfare Officer'}</h2><button className="welfare-close" type="button" onClick={() => setModal(null)}>×</button></div><div className="welfare-form-grid">
        {modal === 'add' && <div className="welfare-field"><label>Initial Password *</label><input className="welfare-input" type="password" name="password" value={formData.password} onChange={handleFormChange} autoComplete="new-password" />{formErrors.password && <small>{formErrors.password}</small>}</div>}
        <div className="welfare-field"><label>Full Name *</label><input className="welfare-input" name="name" value={formData.name} onChange={handleFormChange} />{formErrors.name && <small>{formErrors.name}</small>}</div><div className="welfare-field"><label>Officer ID *</label><input className="welfare-input" name="officerId" value={formData.officerId} onChange={handleFormChange} />{formErrors.officerId && <small>{formErrors.officerId}</small>}</div><div className="welfare-field"><label>Mobile Number *</label><input className="welfare-input" name="phone" value={formData.phone} onChange={handleFormChange} />{formErrors.phone && <small>{formErrors.phone}</small>}</div><div className="welfare-field"><label>Email *</label><input className="welfare-input" type="email" name="email" value={formData.email} onChange={handleFormChange} />{formErrors.email && <small>{formErrors.email}</small>}</div><div className="welfare-field"><label>State *</label><input className="welfare-input" name="state" value={formData.state} onChange={handleFormChange} />{formErrors.state && <small>{formErrors.state}</small>}</div><div className="welfare-field"><label>District *</label><select className="welfare-select" name="district" value={formData.district} onChange={handleFormChange}><option value="">Select District</option>{ANDHRA_PRADESH_DISTRICTS.map(district => <option key={district} value={district}>{district}</option>)}</select>{formErrors.district && <small>{formErrors.district}</small>}</div><div className="welfare-field"><label>Officer Type</label><input className="welfare-input" value={WELFARE_OFFICER_ROLE} readOnly /></div><div className="welfare-field"><label>Status *</label><select className="welfare-select" name="status" value={formData.status} onChange={handleFormChange}><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div className="welfare-field full"><label>Specialization *</label><div className="welfare-specializations">{WELFARE_SPECIALIZATIONS.map(item => <label key={item}><input type="checkbox" checked={formData.specializations.includes(item)} onChange={() => toggleSpecialization(item)} />{item}</label>)}</div>{formErrors.specializations && <small>{formErrors.specializations}</small>}</div>
      </div><div className="welfare-modal-footer"><button className="welfare-secondary-button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="welfare-primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Officer'}</button></div></form></div>}

      {modal === 'view' && selectedOfficer && <div className="welfare-modal-overlay" onClick={() => setModal(null)}><div className="welfare-modal large" onClick={event => event.stopPropagation()}><div className="welfare-modal-header"><h2>Welfare Officer Details</h2><button className="welfare-close" type="button" onClick={() => setModal(null)}>×</button></div><div className="welfare-detail-grid"><div><span>Full Name</span><strong>{selectedOfficer.name}</strong></div><div><span>Officer ID</span><strong>{selectedOfficer.officerId}</strong></div><div><span>Email</span><strong>{selectedOfficer.email}</strong></div><div><span>Mobile</span><strong>{selectedOfficer.phone}</strong></div><div><span>State</span><strong>{selectedOfficer.state}</strong></div><div><span>District</span><strong>{selectedOfficer.district}</strong></div><div><span>Officer Type</span><strong>{selectedOfficer.officerType}</strong></div><div><span>Status</span><strong>{selectedOfficer.status}</strong></div><div><span>Specializations</span><strong>{(selectedOfficer.specializations || []).join(', ')}</strong></div><div><span>Assigned Victims</span><strong>{selectedOfficer.assignedVictims?.length || 0}</strong></div></div><h3>Assigned Victims</h3>{selectedOfficer.assignedVictims?.length ? <div className="welfare-table-wrap"><table className="welfare-table"><thead><tr><th>Victim</th><th>Case ID</th><th>Risk Level</th><th>Support Required</th><th>Assignment Status</th></tr></thead><tbody>{selectedOfficer.assignedVictims.map(item => <tr key={item._id}><td>{item.victimId?.name}</td><td>{item.caseId || item._id}</td><td>{item.riskLevel}{item.distressScore !== null && ` (${item.distressScore})`}</td><td>{(item.supportRequired || []).join(', ') || 'Not specified'}</td><td>{item.status}</td></tr>)}</tbody></table></div> : <div className="welfare-empty">No victims assigned.</div>}</div></div>}

      {modal === 'assign' && selectedOfficer && <div className="welfare-modal-overlay" onClick={() => !submitting && setModal(null)}><form className="welfare-modal" onSubmit={assignVictim} onClick={event => event.stopPropagation()}><div className="welfare-modal-header"><h2>Assign Victim</h2><button className="welfare-close" type="button" onClick={() => setModal(null)}>×</button></div><p>Select an eligible victim for <strong>{selectedOfficer.name}</strong>.</p>{assignmentLoading ? <div className="welfare-empty">Loading eligible victims...</div> : eligibleVictims.length === 0 ? <div className="welfare-empty">No eligible victims available.</div> : <div className="welfare-victim-list">{eligibleVictims.map(item => <label className={`welfare-victim-option ${selectedVictimId === item.victimId?._id ? 'selected' : ''}`} key={item._id}><input type="radio" name="victim" value={item.victimId?._id} checked={selectedVictimId === item.victimId?._id} onChange={event => setSelectedVictimId(event.target.value)} /><span><strong>{item.victimId?.name}</strong><br /><small>{item.caseId || item._id} · {item.category} · {(item.supportRequired || []).join(', ') || 'No support category specified'}</small></span></label>)}</div>}<div className="welfare-modal-footer"><button className="welfare-secondary-button" type="button" onClick={() => setModal(null)}>Cancel</button><button className="welfare-primary-button" type="submit" disabled={submitting || !selectedVictimId}>Assign Victim</button></div></form></div>}
    </div>
  );
}

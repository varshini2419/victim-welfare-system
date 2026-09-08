import React, { useState } from 'react';
import api from '../../utils/api';
import RegistrationSuccess from '../../components/public/RegistrationSuccess';
import { Link } from 'react-router-dom';

export default function Register() {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [successId, setSuccessId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '', dob: '', gender: '', socialCategory: '', profession: '',
    phone: '', email: '', address: '', state: '', district: '',
    emergencyContacts: [{ name: '', relationship: '', phone: '' }],
    aadhaar: '', pan: '',
    category: '', description: '', supportRequired: [],
    firIsFiled: false, firNumber: '', policeStation: '', firDistrict: '', firState: '',
    immediateDanger: false, consentToProcess: false
  });
  
  const [documents, setDocuments] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmergencyChange = (index, field, value) => {
    const updated = [...formData.emergencyContacts];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, emergencyContacts: updated }));
  };

  const addEmergencyContact = () => {
    if (formData.emergencyContacts.length < 2) {
      setFormData(prev => ({ ...prev, emergencyContacts: [...prev.emergencyContacts, { name: '', relationship: '', phone: '' }] }));
    }
  };

  const removeEmergencyContact = (index) => {
    setFormData(prev => ({ ...prev, emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index) }));
  };

  const handleSupportChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const current = [...prev.supportRequired];
      if (checked) current.push(value);
      else return { ...prev, supportRequired: current.filter(item => item !== value) };
      return { ...prev, supportRequired: current };
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      if (!isValidType) setError('Invalid file type. Only JPG, PNG, and PDF are allowed.');
      if (!isValidSize) setError('File size must not exceed 5MB.');
      return isValidType && isValidSize;
    });

    if (documents.length + validFiles.length > 5) {
      setError('You can only upload a maximum of 5 documents.');
      return;
    }
    
    setDocuments(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    setError('');
    
    // Regex Helpers
    const isPhoneValid = (p) => /^\d{10}$/.test(p);
    const isAadhaarValid = (a) => /^\d{12}$/.test(a);
    const isPanValid = (p) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(p);

    if (step === 1) {
      if (!formData.name || !formData.dob || !formData.gender || !formData.socialCategory || !formData.profession) {
        setError('Please fill all required personal information.');
        return false;
      }
      if (formData.aadhaar && !isAadhaarValid(formData.aadhaar)) {
        setError('Aadhaar number must contain exactly 12 digits.');
        return false;
      }
      if (formData.pan && !isPanValid(formData.pan)) {
        setError('Enter a valid PAN number.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.phone || !formData.email || !formData.state || !formData.district || !formData.address) {
        setError('Please fill all required contact & location fields.');
        return false;
      }
      if (!isPhoneValid(formData.phone)) {
        setError('Enter a valid 10-digit mobile number for Victim Phone.');
        return false;
      }
      for (const ec of formData.emergencyContacts) {
        if (ec.name || ec.relationship || ec.phone) {
          if (!ec.name || !ec.relationship || !ec.phone) {
            setError('Please provide complete emergency contact details (Name, Relationship, Phone).');
            return false;
          }
          if (!isPhoneValid(ec.phone)) {
            setError('Enter a valid 10-digit mobile number for Emergency Contacts.');
            return false;
          }
        }
      }
    } else if (step === 3) {
      if (!formData.category || !formData.description) {
        setError('Please fill Case Type and Description.');
        return false;
      }
      if (formData.firIsFiled && (!formData.firNumber || !formData.policeStation)) {
        setError('FIR Number and Police Station are required if an FIR is filed.');
        return false;
      }
    } else if (step === 5) {
      if (!formData.consentToProcess) {
        setError('You must accept the consent declaration to submit.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1);
  };
  const prevStep = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('dob', formData.dob);
      data.append('gender', formData.gender);
      data.append('socialCategory', formData.socialCategory);
      data.append('profession', formData.profession);
      data.append('phone', formData.phone);
      data.append('email', formData.email);
      data.append('address', formData.address);
      data.append('state', formData.state);
      data.append('district', formData.district);
      if (formData.aadhaar) data.append('aadhaar', formData.aadhaar);
      if (formData.pan) data.append('pan', formData.pan);

      const validEmergencyContacts = formData.emergencyContacts.filter(ec => ec.name && ec.relationship && ec.phone);
      data.append('emergencyContacts', JSON.stringify(validEmergencyContacts));

      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('supportRequired', JSON.stringify(formData.supportRequired));
      
      data.append('firDetails', JSON.stringify({
        isFiled: formData.firIsFiled,
        firNumber: formData.firNumber,
        policeStation: formData.policeStation,
        district: formData.firDistrict,
        state: formData.firState
      }));

      data.append('immediateDanger', formData.immediateDanger);
      data.append('consentToProcess', formData.consentToProcess);

      documents.forEach(file => {
        data.append('documents', file);
      });

      // Submit via API
      const res = await api.post('/auth/register/victim', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessId(res.data.registrationId);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed due to server/network error.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <RegistrationSuccess registrationId={successId} />;
  }

  const inputStyle = { width: '100%', padding: '0.625rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', marginBottom: '1rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      <header style={{ backgroundColor: '#111827', padding: '1rem 2rem', display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.25rem' }}>AAROHAN</Link>
        <span style={{ color: '#9ca3af', marginLeft: '1rem' }}>| Victim Registration</span>
      </header>

      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
        
        {/* Stepper Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', backgroundColor: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {['Personal', 'Contact', 'Incident', 'Documents', 'Review'].map((label, i) => (
            <div key={i} style={{ textAlign: 'center', opacity: step === i + 1 ? 1 : 0.5 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: step >= i + 1 ? '#2563eb' : '#e5e7eb', color: step >= i + 1 ? 'white' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', fontWeight: 'bold' }}>
                {i + 1}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>{label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Personal Information</h2>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} type="text" name="name" value={formData.name} onChange={handleChange} required />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Date of Birth *</label>
                  <input style={inputStyle} type="date" name="dob" value={formData.dob} onChange={handleChange} required />
                </div>
                <div>
                  <label style={labelStyle}>Gender *</label>
                  <select style={inputStyle} name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Social Category *</label>
                  <select style={inputStyle} name="socialCategory" value={formData.socialCategory} onChange={handleChange} required>
                    <option value="">Select</option>
                    <option value="SC">SC</option><option value="ST">ST</option>
                    <option value="OBC">OBC</option><option value="EWS">EWS</option>
                    <option value="General">General</option><option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Current Profession *</label>
                  <input style={inputStyle} type="text" name="profession" value={formData.profession} onChange={handleChange} required />
                </div>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '2rem 0 1rem', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Identity (Optional)</h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Information provided here is encrypted and securely stored.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Aadhaar Number</label>
                  <input style={inputStyle} type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} placeholder="12-digit number" />
                </div>
                <div>
                  <label style={labelStyle}>PAN Number</label>
                  <input style={inputStyle} type="text" name="pan" value={formData.pan} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Contact & Location</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Mobile Number *</label>
                  <input style={inputStyle} type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input style={inputStyle} type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>State *</label>
                  <input style={inputStyle} type="text" name="state" value={formData.state} onChange={handleChange} required />
                </div>
                <div>
                  <label style={labelStyle}>District *</label>
                  <input style={inputStyle} type="text" name="district" value={formData.district} onChange={handleChange} required />
                </div>
              </div>
              
              <label style={labelStyle}>Full Address *</label>
              <textarea style={{...inputStyle, resize: 'vertical', minHeight: '80px'}} name="address" value={formData.address} onChange={handleChange} required />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#374151', margin: 0 }}>Emergency Contacts (Up to 2)</h3>
                {formData.emergencyContacts.length < 2 && (
                  <button type="button" onClick={addEmergencyContact} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>+ Add Another Contact</button>
                )}
              </div>
              
              {formData.emergencyContacts.map((ec, index) => (
                <div key={index} style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#6b7280' }}>Contact {index + 1}</span>
                    {formData.emergencyContacts.length > 1 && (
                      <button type="button" onClick={() => removeEmergencyContact(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Remove</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input style={inputStyle} type="text" value={ec.name} onChange={(e) => handleEmergencyChange(index, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Relationship</label>
                      <input style={inputStyle} type="text" value={ec.relationship} onChange={(e) => handleEmergencyChange(index, 'relationship', e.target.value)} />
                    </div>
                  </div>
                  <label style={labelStyle}>Emergency Phone (10 digits)</label>
                  <input style={{...inputStyle, marginBottom: 0}} type="tel" value={ec.phone} onChange={(e) => handleEmergencyChange(index, 'phone', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Incident Information</h2>
              
              <label style={labelStyle}>Case Type *</label>
              <select style={inputStyle} name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Select Case Type</option>
                <option value="Sexual Violence">Sexual Violence</option>
                <option value="Physical Violence">Physical Violence</option>
                <option value="Murder / Attempted Murder">Murder / Attempted Murder</option>
                <option value="Grievous Hurt">Grievous Hurt</option>
                <option value="Arson / Property Damage">Arson / Property Damage</option>
                <option value="Caste-Based Violence / Humiliation">Caste-Based Violence / Humiliation</option>
                <option value="Threat / Intimidation">Threat / Intimidation</option>
                <option value="Witness Threat">Witness Threat</option>
                <option value="Land / Property Related">Land / Property Related</option>
                <option value="Other SC/ST (PoA) Act Related Case">Other SC/ST (PoA) Act Related Case</option>
              </select>

              <label style={labelStyle}>Case Description *</label>
              <textarea style={{...inputStyle, minHeight: '120px'}} name="description" value={formData.description} onChange={handleChange} placeholder="Provide details of the incident..." required />

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Support Required (Check all that apply)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['Counseling', 'Legal Guidance', 'Medical Support', 'Safety / Shelter Support', 'Welfare Assistance'].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <input type="checkbox" name="supportRequired" value={s} checked={formData.supportRequired.includes(s)} onChange={handleSupportChange} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', color: '#111827', cursor: 'pointer' }}>
                  <input type="checkbox" name="firIsFiled" checked={formData.firIsFiled} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem' }} />
                  Has an FIR been registered?
                </label>
                
                {formData.firIsFiled && (
                  <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>FIR Number *</label>
                      <input style={inputStyle} type="text" name="firNumber" value={formData.firNumber} onChange={handleChange} />
                    </div>
                    <div>
                      <label style={labelStyle}>Police Station *</label>
                      <input style={inputStyle} type="text" name="policeStation" value={formData.policeStation} onChange={handleChange} />
                    </div>
                    <div>
                      <label style={labelStyle}>FIR District</label>
                      <input style={inputStyle} type="text" name="firDistrict" value={formData.firDistrict} onChange={handleChange} />
                    </div>
                    <div>
                      <label style={labelStyle}>FIR State</label>
                      <input style={inputStyle} type="text" name="firState" value={formData.firState} onChange={handleChange} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Supporting Documents</h2>
              <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                Upload any relevant documents such as FIR copies, medical reports, or identification. 
                <br />Allowed: PDF, JPG, PNG (Max 5MB each, up to 5 files).
              </p>

              <div style={{ border: '2px dashed #d1d5db', padding: '2rem', textAlign: 'center', borderRadius: '8px', backgroundColor: '#f9fafb', marginBottom: '1.5rem' }}>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
                <label htmlFor="file-upload" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>
                  Browse Files
                </label>
              </div>

              {documents.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {documents.map((file, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button type="button" onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Review & Consent</h2>
              
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #d1d5db', paddingBottom: '0.5rem' }}>Personal Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <div><span style={{ color: '#6b7280' }}>Name:</span> <strong>{formData.name}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>DOB:</span> <strong>{formData.dob}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>Gender:</span> <strong>{formData.gender}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>Social Category:</span> <strong>{formData.socialCategory}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>Profession:</span> <strong>{formData.profession}</strong></div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #d1d5db', paddingBottom: '0.5rem' }}>Contact & Location</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <div><span style={{ color: '#6b7280' }}>Mobile:</span> <strong>{formData.phone}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>Email:</span> <strong>{formData.email}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>State:</span> <strong>{formData.state}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>District:</span> <strong>{formData.district}</strong></div>
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#6b7280' }}>Address:</span> <strong>{formData.address}</strong></div>
                  {formData.emergencyContacts.map((ec, i) => ec.name && (
                    <div key={i} style={{ gridColumn: '1 / -1', marginTop: '0.5rem', backgroundColor: '#e5e7eb', padding: '0.5rem', borderRadius: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Emergency {i+1}:</span> <strong>{ec.name} ({ec.relationship}) - {ec.phone}</strong>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #d1d5db', paddingBottom: '0.5rem' }}>Identity</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <div><span style={{ color: '#6b7280' }}>Aadhaar:</span> <strong>{formData.aadhaar ? `********${formData.aadhaar.slice(-4)}` : 'Not provided'}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>PAN:</span> <strong>{formData.pan ? `XXXXX${formData.pan.slice(5,9)}X` : 'Not provided'}</strong></div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #d1d5db', paddingBottom: '0.5rem' }}>Case Information</h3>
                <div style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}><span style={{ color: '#6b7280' }}>Case Type:</span> <strong>{formData.category}</strong></div>
                  <div style={{ marginBottom: '0.5rem' }}><span style={{ color: '#6b7280' }}>Description:</span> <strong>{formData.description}</strong></div>
                  <div style={{ marginBottom: '0.5rem' }}><span style={{ color: '#6b7280' }}>Support Required:</span> <strong>{formData.supportRequired.length ? formData.supportRequired.join(', ') : 'None specified'}</strong></div>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: formData.firIsFiled ? '#dcfce7' : '#f3f4f6', borderRadius: '4px' }}>
                    <span style={{ color: '#6b7280' }}>FIR Status:</span> <strong>{formData.firIsFiled ? 'Filed' : 'Not Filed'}</strong>
                    {formData.firIsFiled && (
                      <div style={{ marginTop: '0.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div><span style={{ color: '#6b7280' }}>Number:</span> <strong>{formData.firNumber}</strong></div>
                        <div><span style={{ color: '#6b7280' }}>Station:</span> <strong>{formData.policeStation}</strong></div>
                      </div>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #d1d5db', paddingBottom: '0.5rem' }}>Documents ({documents.length})</h3>
                {documents.length > 0 ? (
                  <ul style={{ fontSize: '0.875rem', paddingLeft: '1.5rem', margin: 0, color: '#374151' }}>
                    {documents.map((d, i) => <li key={i}>{d.name} <span style={{color: '#6b7280'}}>({(d.size/1024/1024).toFixed(2)} MB)</span></li>)}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>No documents attached.</p>
                )}
              </div>

              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="immediateDanger" checked={formData.immediateDanger} onChange={handleChange} style={{ marginTop: '0.25rem', width: '1.25rem', height: '1.25rem' }} />
                  <div>
                    <strong style={{ color: '#991b1b', display: 'block', marginBottom: '0.25rem' }}>Are you currently in immediate danger?</strong>
                    <span style={{ fontSize: '0.875rem', color: '#b91c1c' }}>Check this box if you require emergency assistance. We will flag your registration as CRITICAL. <strong>If you are in immediate physical danger, please also dial 112 immediately.</strong></span>
                  </div>
                </label>
              </div>

              <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '1rem' }}>Declaration of Consent</h3>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem', lineHeight: '1.5' }}>
                  I hereby declare that the information provided is true to the best of my knowledge. I consent to the AAROHAN Administration storing and processing my personal data for the purpose of welfare assessment, legal guidance, and support provision. I understand my data will be handled confidentially under the existing legal frameworks.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="consentToProcess" checked={formData.consentToProcess} onChange={handleChange} required style={{ width: '1.25rem', height: '1.25rem' }} />
                  <strong style={{ color: '#111827', fontSize: '0.875rem' }}>I agree to the Declaration of Consent *</strong>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            {step > 1 ? (
              <button type="button" onClick={prevStep} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Back</button>
            ) : <div />}
            
            {step < 5 ? (
              <button type="button" onClick={nextStep} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Continue</button>
            ) : (
              <button type="submit" disabled={loading} style={{ padding: '0.75rem 2rem', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
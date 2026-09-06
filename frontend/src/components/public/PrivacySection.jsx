import React from 'react';

export default function PrivacySection() {
  return (
    <section className="section-container">
      <div className="privacy-box">
        <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🔒</div>
        <h2 className="section-title" style={{marginTop: 0}}>YOUR PRIVACY MATTERS</h2>
        <h3 style={{color: '#be123c', fontSize: '1.25rem', marginBottom: '1.5rem'}}>Private support information is not intended for public access.</h3>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'left', maxWidth: '800px', margin: '0 auto'}}>
          <ul style={{lineHeight: 1.8, color: '#4c1d95', margin: 0, paddingLeft: '1.5rem'}}>
            <li>Privacy by design</li>
            <li>Strict role-based access</li>
            <li>Data minimization</li>
            <li>Secure authentication</li>
          </ul>
          <ul style={{lineHeight: 1.8, color: '#4c1d95', margin: 0, paddingLeft: '1.5rem'}}>
            <li>Consent-based sharing</li>
            <li>Comprehensive audit logging</li>
            <li>Mandatory human review</li>
            <li>Protection of sensitive information</li>
          </ul>
        </div>
        
        <p style={{marginTop: '2rem', fontSize: '0.9rem', color: '#831843'}}>
          * Official case and legal records remain strictly with the competent authorities.
        </p>
      </div>
    </section>
  );
}

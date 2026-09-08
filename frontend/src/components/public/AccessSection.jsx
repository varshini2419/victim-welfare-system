import React from 'react';
import { Link } from 'react-router-dom';

export default function AccessSection() {
  return (
    <section className="section-container" style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
      <div className="access-box">
        <h2 className="section-title" style={{color: 'white', marginTop: 0}}>ACCESS AAROHAN</h2>
        <p style={{fontSize: '1.25rem', marginBottom: '2rem', color: '#d1d5db'}}>
          Users with authorized access can sign in to their designated portal below.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn-primary" style={{fontSize: '1.125rem', padding: '0.875rem 2rem'}}>
            VICTIM PORTAL LOGIN
          </Link>
          <Link to="/admin/login" style={{fontSize: '1.125rem', padding: '0.875rem 2rem', backgroundColor: '#334155', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold'}}>
            ADMINISTRATION PORTAL
          </Link>
        </div>
      </div>
    </section>
  );
}

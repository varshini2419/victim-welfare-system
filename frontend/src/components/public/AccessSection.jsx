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
        <Link to="/login" className="btn-primary" style={{fontSize: '1.25rem', padding: '1rem 3rem'}}>
          LOGIN TO AAROHAN
        </Link>
      </div>
    </section>
  );
}

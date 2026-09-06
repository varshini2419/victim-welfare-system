import React from 'react';

export default function HelplineSection() {
  return (
    <section className="section-container bg-gray" style={{textAlign: 'center', padding: '3rem 5%'}}>
      <h2 className="section-title" style={{marginBottom: '1rem'}}>NEED SUPPORT?</h2>
      <p style={{fontSize: '1.25rem', color: '#111827', fontWeight: 600}}>
        Official AAROHAN / NHAA Helpline: 1800-XXX-XXXX
      </p>
      <p style={{color: '#6b7280', marginTop: '0.5rem'}}>
        For emergency assistance, please contact your local law enforcement immediately.
      </p>
    </section>
  );
}

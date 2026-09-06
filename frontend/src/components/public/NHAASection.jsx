import React from 'react';

export default function NHAASection() {
  return (
    <section className="section-container bg-gray">
      <div className="nhaa-box">
        <h2 className="section-title" style={{marginTop: 0}}>NATIONAL HELPLINE AGAINST ATROCITIES (NHAA)</h2>
        <p className="section-text" style={{maxWidth: '900px'}}>
          The National Helpline Against Atrocities (NHAA) is an official government initiative for the prevention of atrocities against SC/ST communities. It provides a formal complaint and support mechanism, ensuring dignity and justice.
        </p>
        <p className="section-text" style={{maxWidth: '900px', fontWeight: 600, color: '#1a1a47'}}>
          AAROHAN is proposed as a complementary psychosocial support and wellbeing-monitoring layer that can work alongside authorized government mechanisms like the NHAA.
        </p>
        <a href="https://nhaa.gov.in" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{display: 'inline-block', marginTop: '1.5rem'}}>
          VISIT OFFICIAL NHAA
        </a>
      </div>
    </section>
  );
}

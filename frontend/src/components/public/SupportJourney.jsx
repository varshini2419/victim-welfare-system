import React from 'react';

export default function SupportJourney() {
  const steps = ['Concern', 'Wellbeing Check', 'AI-Assisted Signal Detection', 'Human Review', 'Counselling', 'Additional Support', 'Follow-Up', 'Recovery & Continued Monitoring'];
  
  return (
    <section className="section-container bg-gray">
      <h2 className="section-title">FROM DISTRESS TO SUPPORT</h2>
      <p className="section-text" style={{marginBottom: '3rem'}}>
        A human-centered journey designed to ensure no one falls through the cracks of the system.
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', color: '#1a1a47', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              {step}
            </div>
            {index < steps.length - 1 && (
              <span style={{ color: '#9ca3af', fontSize: '1.5rem' }}>➔</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

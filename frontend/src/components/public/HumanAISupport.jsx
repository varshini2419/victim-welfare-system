import React from 'react';

export default function HumanAISupport() {
  return (
    <section className="section-container bg-gray" style={{textAlign: 'center'}}>
      <h2 className="section-title">AI WITH HUMAN SUPPORT</h2>
      <h3 style={{fontSize: '1.75rem', color: '#1d4ed8', marginBottom: '2rem'}}>AI SUPPORTS. HUMANS DECIDE.</h3>
      
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a47', marginBottom: '2rem'}}>
        <div>🤖<br/>AI</div>
        <div style={{color: '#9ca3af'}}>+</div>
        <div>👨‍⚕️<br/>Qualified Professionals</div>
        <div style={{color: '#9ca3af'}}>+</div>
        <div>🏥<br/>Support Services</div>
        <div style={{color: '#9ca3af'}}>=</div>
        <div style={{color: '#15803d'}}>Better Continuous Support</div>
      </div>
      
      <p className="section-text">
        AI assists with identifying patterns and concerning wellbeing indicators over time. However, it is NOT a replacement for a psychologist, doctor, police officer, lawyer, or government authority.
      </p>
      <p className="section-text" style={{fontWeight: 600}}>
        Human professionals review all flagged indicators and make the final decisions regarding appropriate support.
      </p>
    </section>
  );
}

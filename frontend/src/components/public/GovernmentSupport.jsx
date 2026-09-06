import React from 'react';

export default function GovernmentSupport() {
  const supports = [
    { title: 'Counselling', icon: '🫂', desc: 'Psychological first aid and long-term therapy.' },
    { title: 'Legal Aid', icon: '⚖️', desc: 'Assistance with case filing and legal representation.' },
    { title: 'Medical Support', icon: '🏥', desc: 'Specialized medical referrals and trauma care.' },
    { title: 'Financial Support', icon: '💰', desc: 'Victim compensation and immediate relief facilitation.' },
    { title: 'Rehabilitation', icon: '🏗️', desc: 'Skill training and socioeconomic integration.' },
    { title: 'Safety & Protection', icon: '🛡️', desc: 'Coordination with law enforcement for security.' },
  ];

  return (
    <section className="section-container">
      <h2 className="section-title">GOVERNMENT & SUPPORT ECOSYSTEM</h2>
      <p className="section-text">
        AAROHAN does not replace existing services. Instead, it acts as an intelligent bridge, identifying support needs through wellbeing monitoring and facilitating appropriate referrals to the broader government ecosystem where authorized.
      </p>
      
      <div className="program-grid">
        {supports.map((item, index) => (
          <div key={index} className="program-card" style={{borderTopColor: '#f59e0b'}}>
            <div className="program-icon" aria-hidden="true">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

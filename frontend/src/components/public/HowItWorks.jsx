import React from 'react';

export default function HowItWorks() {
  const steps = [
    { num: '01', title: 'CONNECT', desc: 'Authorized Support / Referral' },
    { num: '02', title: 'ONBOARD', desc: 'AAROHAN Onboarding & Profile Creation' },
    { num: '03', title: 'MONITOR', desc: 'Daily Wellbeing Interaction via Chat/Voice' },
    { num: '04', title: 'ANALYZE', desc: 'AI Wellbeing & Distress Trend Analysis' },
    { num: '05', title: 'REVIEW', desc: 'Human Review of System Flags' },
    { num: '06', title: 'SUPPORT', desc: 'Counselling & Support Referral' },
    { num: '07', title: 'FOLLOW-UP', desc: 'Continued Monitoring & Recovery' }
  ];

  return (
    <section className="section-container">
      <h2 className="section-title">HOW AAROHAN WORKS</h2>
      <div className="flowchart">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flow-step">
              <span className="flow-num">{step.num}</span>
              <div className="flow-text-container">
                <div className="flow-text">{step.title}</div>
                <div style={{fontSize: '0.9rem', color: '#e5e7eb', marginTop: '0.2rem'}}>{step.desc}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flow-arrow" aria-hidden="true">↓</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

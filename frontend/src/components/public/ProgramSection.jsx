import React from 'react';

export default function ProgramSection() {
  const cards = [
    { icon: '🧠', title: 'Mental Health Monitoring', desc: 'Continuous tracking of emotional wellbeing and psychosocial health indicators over time.' },
    { icon: '🤖', title: 'AI-Assisted Distress Detection', desc: 'Advanced natural language processing to identify subtle signs of distress or escalating crisis.' },
    { icon: '👨‍⚕️', title: 'Counselling Support', desc: 'Direct connection to qualified psychologists and trauma-informed human counselors.' },
    { icon: '📅', title: 'Daily Wellbeing Updates', desc: 'Simple, accessible check-ins to maintain a steady pulse on the user’s situation.' },
    { icon: '📞', title: 'Voice / IVR Support', desc: 'Accessible voice-based interactions for those unable to use standard text interfaces.' },
    { icon: '🤝', title: 'Welfare & Rehabilitation', desc: 'Facilitated referrals to government relief schemes and holistic rehabilitation services.' },
  ];

  return (
    <section className="section-container bg-gray">
      <h2 className="section-title">OUR PROGRAM</h2>
      <div className="program-grid">
        {cards.map((card, index) => (
          <div key={index} className="program-card">
            <div className="program-icon" aria-hidden="true">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

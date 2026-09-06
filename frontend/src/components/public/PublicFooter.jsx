import React from 'react';

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>AAROHAN</h3>
          <p>Supporting Wellbeing.<br/>Strengthening Recovery.</p>
        </div>
        
        <div className="footer-column">
          <h4>ABOUT</h4>
          <ul>
            <li><a href="#about">About AAROHAN</a></li>
            <li><a href="#program">Our Program</a></li>
            <li><a href="#howitworks">How It Works</a></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>SUPPORT</h4>
          <ul>
            <li><a href="#support">Counselling</a></li>
            <li><a href="#welfare">Welfare Support</a></li>
            <li><a href="#ecosystem">Government Support</a></li>
            <li><a href="#helpline">Helpline</a></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>INFORMATION</h4>
          <ul>
            <li><a href="#privacy">Privacy</a></li>
            <li><a href="#accessibility">Accessibility</a></li>
            <li><a href="#terms">Terms</a></li>
            <li><a href="#disclaimer">Disclaimer</a></li>
          </ul>
        </div>
        
        <div className="footer-column">
          <h4>OFFICIAL LINKS</h4>
          <ul>
            <li><a href="https://nhaa.gov.in" target="_blank" rel="noopener noreferrer">NHAA</a></li>
            <li><a href="#gov">Relevant Official Sources</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} AAROHAN</p>
        <p style={{marginTop: '0.5rem', fontStyle: 'italic'}}>
          * Proposed AI-assisted psychosocial support and wellbeing monitoring system. Not an official government certification unless authorized.
        </p>
      </div>
    </footer>
  );
}

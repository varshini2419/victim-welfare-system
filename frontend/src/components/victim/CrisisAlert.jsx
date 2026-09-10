import React from 'react';
import './CrisisAlert.css';

export default function CrisisAlert({ message }) {
  return (
    <div className="crisis-alert">
      <strong>🚨 Crisis Detected:</strong> {message || 'Immediate assistance required.'}
    </div>
  );
}

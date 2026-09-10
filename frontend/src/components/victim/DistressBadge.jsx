import React from 'react';
import './DistressBadge.css';

/**
 * Displays a coloured badge based on the distress score.
 * Scores:
 *   < 30  → green (low)
 *   30‑60 → yellow (moderate)
 *   > 60  → red (high)
 */
export default function DistressBadge({ score }) {
  if (score == null) return null;
  let colorClass = 'low';
  if (score >= 60) colorClass = 'high';
  else if (score >= 30) colorClass = 'moderate';
  return (
    <span className={`distress-badge ${colorClass}`}>Distress: {score}</span>
  );
}

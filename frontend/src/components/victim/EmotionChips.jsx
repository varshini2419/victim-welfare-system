import React from 'react';
import './EmotionChips.css';

// Simple mapping of emotion names to emojis (extend as needed)
const emotionMap = {
  fear: '😨',
  sadness: '😢',
  anger: '😠',
  joy: '😊',
  neutral: '😐',
  surprise: '😲',
  disgust: '🤢',
  // add more mappings as required
};

export default function EmotionChips({ emotions = [] }) {
  if (!emotions.length) return null;
  return (
    <div className="emotion-chips">
      {emotions.map((emo, idx) => (
        <span key={idx} className="emotion-chip">
          {emotionMap[emo] || emo} {emo}
        </span>
      ))}
    </div>
  );
}

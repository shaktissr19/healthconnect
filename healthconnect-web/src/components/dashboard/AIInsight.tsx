'use client';
import React from 'react';

interface AIInsightProps {
  text?: string;
}

export default function AIInsight({ text }: AIInsightProps) {
  return (
    <div style={{ background: '#1a2942', borderRadius: '12px', padding: '16px', border: '1px solid #14B8A6' }}>
      <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
        🤖 {text || 'Your health metrics are trending in a positive direction.'}
      </p>
    </div>
  );
}

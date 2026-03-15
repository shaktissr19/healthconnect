'use client';
export default function SkeletonCard() {
  return (
    <div style={{ background: '#1a2942', borderRadius: '12px', padding: '20px', border: '1px solid #2a3a52', opacity: 0.5 }}>
      <div style={{ background: '#2a3a52', height: '16px', borderRadius: '4px', marginBottom: '8px' }}></div>
      <div style={{ background: '#2a3a52', height: '12px', borderRadius: '4px', width: '60%' }}></div>
    </div>
  );
}

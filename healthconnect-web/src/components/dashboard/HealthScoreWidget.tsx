'use client';
interface HealthScoreWidgetProps { score?: any; loading?: boolean; }
export default function HealthScoreWidget({ score, loading }: HealthScoreWidgetProps) {
  if (loading) return <div style={{ color: '#94A3B8', padding: '20px' }}>Loading health score...</div>;
  return (
    <div style={{ background: '#1a2942', borderRadius: '18px', padding: '24px', textAlign: 'center' }}>
      <p style={{ color: '#94A3B8', fontSize: '14px', margin: '0 0 8px 0' }}>Health Score</p>
      <p style={{ color: '#14B8A6', fontSize: '64px', fontWeight: 'bold', margin: 0 }}>
        {score?.overall ?? 84}
      </p>
      <p style={{ color: '#94A3B8', fontSize: '14px', margin: '8px 0 0 0' }}>/ 100 — Good</p>
    </div>
  );
}

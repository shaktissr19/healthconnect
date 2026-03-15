'use client';
interface RiskAlertProps { text?: string; }
export default function RiskAlert({ text }: RiskAlertProps) {
  if (!text) return null;
  return (
    <div style={{ background: '#2d1a1a', borderRadius: '12px', padding: '16px', border: '1px solid #F43F5E' }}>
      <p style={{ color: '#F43F5E', fontSize: '14px', margin: 0 }}>⚠️ {text}</p>
    </div>
  );
}

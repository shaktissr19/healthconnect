'use client';
interface KPICardProps {
  color?: string;
  label?: string;
  value?: string | number;
  sub?: string;
  trend?: string;
}
export default function KPICard({ color, label, value, sub, trend }: KPICardProps) {
  return (
    <div style={{ background: '#1a2942', borderRadius: '12px', padding: '20px', border: '1px solid #2a3a52' }}>
      <p style={{ color: '#94A3B8', fontSize: '12px', margin: '0 0 8px 0' }}>{label}</p>
      <p style={{ color: '#E2E8F0', fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{value ?? '-'}</p>
      {sub && <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>{sub}</p>}
      {trend && <p style={{ color: '#22C55E', fontSize: '12px', margin: 0 }}>↑ {trend}</p>}
    </div>
  );
}

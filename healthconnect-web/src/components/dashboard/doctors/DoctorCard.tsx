'use client';
interface DoctorCardProps { doctor?: any; variant?: string; }
export default function DoctorCard({ doctor, variant }: DoctorCardProps) {
  return (
    <div style={{ background: '#1a2942', borderRadius: '12px', padding: '20px', border: '1px solid #2a3a52' }}>
      <p style={{ color: '#E2E8F0', fontWeight: 'bold', margin: '0 0 4px 0' }}>{doctor?.name ?? 'Doctor'}</p>
      <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>{doctor?.specialization}</p>
    </div>
  );
}

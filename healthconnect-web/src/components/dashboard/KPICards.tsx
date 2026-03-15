'use client';
interface KPICardsProps { data?: any; }
export default function KPICards({ data }: KPICardsProps) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}></div>;
}

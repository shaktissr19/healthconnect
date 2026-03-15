'use client';

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <>
      <style>{`
        .cs-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; text-align:center; padding:40px; }
        .cs-badge { background:rgba(20,184,166,0.1); border:1px solid rgba(20,184,166,0.25); color:#14B8A6; padding:6px 16px; border-radius:100px; font-size:11px; font-weight:700; font-family:'JetBrains Mono',monospace; letter-spacing:.08em; text-transform:uppercase; margin-bottom:24px; display:inline-block; }
        .cs-icon  { font-size:52px; margin-bottom:20px; filter:grayscale(0.3); }
        .cs-title { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; color:#E2E8F0; margin:0 0 10px; }
        .cs-sub   { font-size:14px; color:#475569; max-width:380px; line-height:1.6; }
        .cs-dots  { display:flex; gap:8px; margin-top:32px; }
        .cs-dot   { width:8px; height:8px; border-radius:50%; background:rgba(20,184,166,0.3); animation:cs-pulse 1.4s ease-in-out infinite; }
        .cs-dot:nth-child(2) { animation-delay:.2s; }
        .cs-dot:nth-child(3) { animation-delay:.4s; }
        @keyframes cs-pulse { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }
      `}</style>
      <div className="cs-wrap">
        <span className="cs-badge">Coming Soon</span>
        <div className="cs-icon">
          {title === 'Find Doctors'   ? '🩺' :
           title === 'Communities'    ? '🫂' :
           title === 'Settings'       ? '⚙️' :
           title === 'Subscription'   ? '💎' : '🚧'}
        </div>
        <h2 className="cs-title">{title}</h2>
        <p className="cs-sub">
          We're building something great here. This feature will be available in the next update.
        </p>
        <div className="cs-dots">
          <div className="cs-dot" />
          <div className="cs-dot" />
          <div className="cs-dot" />
        </div>
      </div>
    </>
  );
}

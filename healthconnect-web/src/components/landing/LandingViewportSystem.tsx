'use client';

export default function LandingViewportSystem(){
  return <style>{`
    :root{--hc-content:1180px;--hc-wide:1380px;--hc-immersive:1520px}
    #my-health-story,#health-communities-story,#doctor-platform-story,#care-discovery,#knowledge-hub,#plans,#trust-privacy{scroll-margin-top:76px}

    html{scrollbar-width:thin;scrollbar-color:#8297A5 transparent}
    html::-webkit-scrollbar{width:9px;height:9px}
    html::-webkit-scrollbar-track{background:transparent}
    html::-webkit-scrollbar-thumb{background:#8297A5;border-radius:999px;border:2px solid transparent;background-clip:padding-box}
    html::-webkit-scrollbar-thumb:hover{background:#657E8E;border:2px solid transparent;background-clip:padding-box}
    body::-webkit-scrollbar{width:9px}
    body::-webkit-scrollbar-track{background:transparent}
    body::-webkit-scrollbar-thumb{background:#8297A5;border-radius:999px;border:2px solid transparent;background-clip:padding-box}
    body::-webkit-scrollbar-thumb:hover{background:#657E8E;border:2px solid transparent;background-clip:padding-box}
  `}</style>;
}

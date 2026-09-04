'use client';

import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/landing/Footer';

export type InfoSection = { title: string; body: React.ReactNode };

export default function PublicInfoPage({eyebrow,title,intro,sections}:{eyebrow:string;title:string;intro:string;sections:InfoSection[]}){
  return <div style={{background:'#F8FAFC',minHeight:'100vh'}}><PublicNavbar/><main style={{padding:'104px 24px 70px',fontFamily:"'DM Sans',Arial,sans-serif"}}><div style={{maxWidth:920,margin:'0 auto'}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.16em',color:'#0D9488',marginBottom:10}}>{eyebrow}</div><h1 style={{fontFamily:"'Sora','DM Sans',sans-serif",fontSize:'clamp(2.3rem,5vw,4.6rem)',lineHeight:1.03,letterSpacing:'-.045em',color:'#0F172A',margin:'0 0 17px'}}>{title}</h1><p style={{fontSize:15,lineHeight:1.75,color:'#64748B',maxWidth:760,margin:'0 0 34px'}}>{intro}</p><div style={{display:'grid',gap:13}}>{sections.map((section,index)=><section key={section.title} style={{background:'#fff',border:'1px solid #E1E8EF',borderRadius:16,padding:'22px 24px'}}><div style={{display:'grid',gridTemplateColumns:'34px 1fr',gap:12}}><div style={{fontFamily:"'Sora',sans-serif",fontSize:10,color:'#0D9488',fontWeight:900,paddingTop:3}}>{String(index+1).padStart(2,'0')}</div><div><h2 style={{fontFamily:"'Sora',sans-serif",fontSize:17,color:'#0F172A',margin:'0 0 8px'}}>{section.title}</h2><div style={{fontSize:12.5,lineHeight:1.72,color:'#52677D'}}>{section.body}</div></div></div></section>)}</div></div></main><Footer/></div>;
}

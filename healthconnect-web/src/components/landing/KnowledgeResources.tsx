'use client';
import Link from 'next/link';

const ARTICLES = [
  {
    photo:'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&q=80',
    cat:'Diabetes', catColor:'#1A6BB5',
    title:'HbA1c — What Your Diabetes Numbers Really Mean for Indians',
    // FIX: was '/learn' — now links to the specific article slug
    href:'/learn/hba1c-what-your-diabetes-numbers-really-mean',
  },
  {
    photo:'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&q=80',
    cat:'Cardiology', catColor:'#E11D48',
    title:'Why Heart Attacks in Young Indians Are Rising: What You Need to Know',
    href:'/learn/heart-attacks-young-indians',
  },
  {
    photo:'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&q=80',
    cat:'Women Health', catColor:'#7C3AED',
    title:'PCOD & PCOS: The Complete Guide for Indian Women',
    href:'/learn/pcos-complete-guide-indian-women',
  },
  {
    photo:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80',
    cat:'Mental Health', catColor:'#059669',
    title:'Managing Anxiety and Depression: Breaking the Stigma in India',
    href:'/learn/mental-health-india-breaking-stigma',
  },
];

const STORIES = [
  {
    q:'"I uploaded 3 years of reports in one go. My cardiologist saw everything before I sat down. First time I didn\'t have to repeat my entire history."',
    name:'Priya Sharma', role:'Patient · New Delhi',
    col:'#1A6BB5', initials:'PS',
    photo:'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&q=80',
  },
  {
    q:'"12 appointment requests in my first week. Patient timelines save me 10 minutes per consultation. I see more patients and give better care."',
    name:'Dr. Arvind Mehta', role:'Cardiologist · Mumbai',
    col:'#7C3AED', initials:'AM',
    photo:'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&q=80',
  },
  {
    q:'"Anonymous posting meant I could ask the embarrassing questions. A verified endocrinologist answered within hours. This community changed everything."',
    name:'Sunita Rao', role:'Community Member · Bengaluru',
    col:'#059669', initials:'SR',
    photo:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80',
  },
];

function Avatar({ initials, color, photo }: { initials: string; color: string; photo: string }) {
  return (
    <div style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:`2px solid ${color}30`, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <img src={photo} alt={initials} style={{ width:'100%', height:'100%', objectFit:'cover' }}
        onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
      />
    </div>
  );
}

export default function KnowledgeResources() {
  return (
    // No CTA section — removed "Take control / Your health deserves" entirely
    <section style={{ background:'#fff', padding:'72px 0 72px', borderTop:'1px solid #E8F0F8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .kr-card{background:#fff;border-radius:8px;overflow:hidden;border:1px solid #E8F0F8;transition:all 0.22s ease;display:flex;flex-direction:column;cursor:pointer;text-decoration:none;}
        .kr-card:hover{transform:translateY(-4px);box-shadow:0 14px 44px rgba(15,30,60,0.1);}
        .kr-story{background:#fff;border-radius:12px;padding:24px;border:1px solid #E8F0F8;transition:all 0.2s;}
        .kr-story:hover{box-shadow:0 6px 28px rgba(15,30,60,0.07);transform:translateY(-2px);}
        .kr-h2{font-family:'Sora',sans-serif;font-size:clamp(2.1rem,3.4vw,3.8rem)!important;font-weight:900;color:#0A1628;letter-spacing:-0.03em;line-height:1.1;margin:0;}
        @media(max-width:1024px){.kr-4col{grid-template-columns:1fr 1fr!important;}}
        @media(max-width:768px){
          .kr-4col{grid-template-columns:1fr!important;}
          .kr-3col{grid-template-columns:1fr!important;}
          .kr-pad{padding:0 24px!important;}
        }
      `}</style>

      <div className="kr-pad" style={{ maxWidth:1280, margin:'0 auto', padding:'0 48px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:36 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:28, height:1, background:'#1A6BB5' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'#1A6BB5', letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>Knowledge Hub</span>
            </div>
            <h2 className="kr-h2">Health knowledge<br/>you can trust.</h2>
          </div>
          <Link href="/learn" style={{ fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:700, color:'#1A6BB5', textDecoration:'none', textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', padding:'12px 24px', border:'1.5px solid #1A6BB5', transition:'all 0.2s' }}>
            Visit Learn Hub →
          </Link>
        </div>

        {/* 4 article cards */}
        <div className="kr-4col" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:52 }}>
          {ARTICLES.map((a,i) => (
            <Link key={i} href={a.href} className="kr-card">
              <div style={{ height:160, backgroundImage:`url(${a.photo})`, backgroundSize:'cover', backgroundPosition:'center' }}/>
              <div style={{ padding:'16px', flex:1, display:'flex', flexDirection:'column' }}>
                <div style={{ display:'inline-flex', alignItems:'center', background:`${a.catColor}12`, padding:'3px 9px', borderRadius:999, marginBottom:10, width:'fit-content' }}>
                  <span style={{ fontSize:10, fontWeight:700, color:a.catColor, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Sans',sans-serif" }}>{a.cat}</span>
                </div>
                <h4 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:800, color:'#0A1628', lineHeight:1.4, margin:'0 0 10px', flex:1 }}>{a.title}</h4>
                <span style={{ fontSize:12, fontWeight:700, color:'#1A6BB5', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:4 }}>Read more →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Stories */}
        <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(1.6rem,2.4vw,2.4rem)', fontWeight:900, color:'#0A1628', letterSpacing:'-0.025em', margin:'0 0 22px' }}>
          Real people. Real stories.
        </h3>
        <div className="kr-3col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
          {STORIES.map((st,i)=>(
            <div key={i} className="kr-story">
              <div style={{ fontSize:28, color:`${st.col}20`, lineHeight:1, fontFamily:'Georgia,serif', marginBottom:-2 }}>"</div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, lineHeight:1.72, color:'#2C4A6A', fontStyle:'italic', margin:'0 0 18px', fontWeight:500 }}>{st.q}</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Avatar initials={st.initials} color={st.col} photo={st.photo}/>
                <div>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:800, color:'#0A1628' }}>{st.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:'#6B87A8' }}>{st.role}</div>
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:1 }}>
                  {[1,2,3,4,5].map(n=><span key={n} style={{ color:'#F59E0B', fontSize:11 }}>★</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

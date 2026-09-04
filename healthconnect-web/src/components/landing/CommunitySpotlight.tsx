'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import communityApiV2 from '@/lib/communityApiV2';

const emoji: Record<string,string> = { Diabetes:'🩸','Heart Health':'❤️','Mental Wellness':'🧠','PCOS/PCOD':'🌸','Cancer Support':'🎗️',Thyroid:'🦋',Arthritis:'🦴',Hypertension:'💊','Kidney Health':'🫘',Respiratory:'🫁','Nutrition & Diet':'🥗','Senior Care':'👴',General:'🌿' };

export default function CommunitySpotlight(){
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    const load=async()=>{
      try{
        let result:any=await communityApiV2.list({featured:true,limit:3});
        let communities=Array.isArray(result?.communities)?result.communities:[];
        if(communities.length<3){result=await communityApiV2.list({limit:3});communities=Array.isArray(result?.communities)?result.communities:[];}
        if(alive)setItems(communities.slice(0,3));
      }catch{if(alive)setItems([])}finally{if(alive)setLoading(false)}
    };
    void load();
    return()=>{alive=false};
  },[]);

  return <section className="community-home">
    <style>{`
      .community-home{background:#07162A;padding:48px 28px 52px;font-family:'DM Sans',Arial,sans-serif;color:#fff;position:relative;overflow:hidden}.community-home:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 8% 8%,rgba(52,211,153,.15),transparent 28%),radial-gradient(circle at 92% 92%,rgba(56,189,248,.08),transparent 25%);pointer-events:none}.community-inner{max-width:1280px;margin:0 auto;position:relative;z-index:1}.community-layout{display:grid;grid-template-columns:.9fr 1.1fr;gap:34px;align-items:center}.community-kicker{font-size:10px;font-weight:900;letter-spacing:.18em;color:#6EE7B7;margin-bottom:8px}.community-title{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,3.1vw,3.45rem);line-height:1.04;letter-spacing:-.045em;margin:0 0 12px;color:#F7FBFF}.community-copy{font-size:13px;line-height:1.65;color:#B7CCE0;margin:0 0 16px;max-width:540px}.community-usp{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:17px}.community-usp span{font-size:9px;font-weight:800;color:#D7FAEF;border:1px solid rgba(110,231,183,.17);background:rgba(16,185,129,.07);padding:8px 9px;border-radius:9px}.community-cta{display:inline-flex;text-decoration:none;color:#062017;background:#6EE7B7;border-radius:9px;padding:10px 15px;font-size:10px;font-weight:900}.community-note{font-size:9px;color:#7F9AB5;line-height:1.45;margin-top:11px}
      .community-demo{display:grid;grid-template-columns:1.08fr .92fr;gap:10px}.post-card{background:#F8FBFF;color:#10233C;border-radius:16px;padding:17px;min-height:260px}.post-top{display:flex;align-items:center;gap:9px;margin-bottom:12px}.post-avatar{width:35px;height:35px;border-radius:50%;display:grid;place-items:center;background:#ECFDF5;color:#047857;font-weight:900}.post-top b{font-size:11px}.post-top span{display:block;font-size:8px;color:#64748B;margin-top:2px}.post-card h3{font-family:'Sora',sans-serif;font-size:16px;line-height:1.35;margin:0 0 9px}.post-card p{font-size:10px;line-height:1.55;color:#475569;margin:0 0 13px}.post-actions{display:flex;gap:12px;font-size:8px;color:#64748B;border-top:1px solid #E5EDF4;padding-top:10px}.safety-card{display:grid;gap:10px}.safety-box{background:rgba(255,255,255,.055);border:1px solid rgba(148,163,184,.15);border-radius:14px;padding:15px}.safety-box strong{display:block;font-size:11px;color:#DFFBF3;margin-bottom:5px}.safety-box p{font-size:8.5px;line-height:1.45;color:#97B2CB;margin:0}.live-title{font-size:8px;font-weight:900;letter-spacing:.12em;color:#7F9AB5;margin-bottom:8px}.live-list{display:grid;gap:7px}.live-community{display:flex;align-items:center;gap:8px;text-decoration:none;color:#EAF6FF;background:rgba(255,255,255,.045);border:1px solid rgba(148,163,184,.12);padding:8px;border-radius:10px}.live-community i{font-style:normal;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:rgba(52,211,153,.1)}.live-community b{display:block;font-size:9px}.live-community small{display:block;font-size:7px;color:#7F9AB5;margin-top:2px}.community-empty{font-size:9px;color:#8EA6BF;padding:9px;border:1px dashed rgba(148,163,184,.2);border-radius:9px}
      @media(max-width:960px){.community-layout{grid-template-columns:1fr}.community-demo{max-width:760px}}
      @media(max-width:620px){.community-home{padding:42px 14px}.community-usp,.community-demo{grid-template-columns:1fr}.post-card{min-height:0}}
    `}</style>

    <div className="community-inner"><div className="community-layout">
      <div><div className="community-kicker">HEALTH COMMUNITIES · A HEALTHCONNECT DIFFERENTIATOR</div><h2 className="community-title">A place to ask, share and keep going between visits.</h2><p className="community-copy">HealthConnect brings health communities into the same platform where people already find doctors, hospitals and manage My Health. That makes peer support part of the journey instead of another disconnected destination.</p><div className="community-usp"><span>Anonymous posting where allowed</span><span>Membership rules & moderation</span><span>Reports and safety controls</span><span>Q&A events and ongoing support</span></div><Link href="/communities" className="community-cta">Explore Health Communities →</Link><div className="community-note">Community discussion supports peer learning and does not replace personal medical advice.</div></div>

      <div className="community-demo">
        <div className="post-card"><div className="post-top"><div className="post-avatar">A</div><div><b>Anonymous member</b><span>Diabetes Support · community post</span></div></div><h3>“How do others handle dinner when glucose readings keep changing?”</h3><p>Anonymous posting can hide a member's public identity from other community participants where that option is enabled, while moderation and reporting remain available.</p><div className="post-actions"><span>♡ 18</span><span>💬 7 replies</span><span>Report</span></div></div>
        <div className="safety-card"><div className="safety-box"><strong>🤝 Community, not a comment section</strong><p>Condition-focused spaces have membership rules, moderation and reporting built into the workflow.</p></div><div className="safety-box"><strong>🎙 Q&A & events</strong><p>Community events help useful conversations continue beyond a single post.</p></div><div><div className="live-title">LIVE COMMUNITIES</div><div className="live-list">{loading?[1,2,3].map(i=><div className="community-empty" key={i}>Loading community…</div>):items.length?items.map(c=><Link key={c.id} href={`/communities/${c.slug||c.id}`} className="live-community"><i>{c.emoji||emoji[c.category]||'🌿'}</i><div><b>{c.name}</b><small>{Number(c.member_count||c.memberCount||0).toLocaleString('en-IN')} members · {Number(c.post_count||c.postCount||0).toLocaleString('en-IN')} posts</small></div></Link>):<div className="community-empty">Community directory temporarily unavailable.</div>}</div></div></div>
      </div>
    </div></div>
  </section>;
}

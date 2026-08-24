'use client';

import Link from 'next/link';

const stories = [
  {initials:'AS',name:'Anjali',topic:'Managing Diabetes',text:'Small changes helped me stay consistent between appointments.'},
  {initials:'RM',name:'Ramesh',topic:'Heart Health',text:'I learned what to ask at my next follow-up instead of waiting with questions.'},
  {initials:'MK',name:'Meera',topic:'Thyroid Support',text:'Hearing from people with similar experiences helped me feel more prepared.'},
  {initials:'VK',name:'Vikram',topic:'Back & Joint Care',text:'Practical peer experience helped me stay motivated with the plan.'},
];

export default function CommunityBenefits(){
  return <section className="cb-section" id="health-communities-story">
    <style>{`
      .cb-section{font-family:'DM Sans',Arial,sans-serif;background:linear-gradient(180deg,#F7F4FF 0%,#FCFAFF 100%);padding:64px 28px 70px;color:#10233C;border-top:1px solid #E8E0F5;border-bottom:1px solid #E7E0F1}.cb-wrap{max-width:1280px;margin:0 auto}.cb-head{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.7fr);gap:60px;align-items:end;margin-bottom:28px}.cb-kicker{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#7C3AED;margin-bottom:10px}.cb-head h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.45rem,4vw,4.25rem);line-height:1.01;letter-spacing:-.05em;margin:0;max-width:760px}.cb-head p{margin:0;color:#645B78;font-size:14px;line-height:1.65;max-width:460px}.cb-panel{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(390px,.95fr);gap:32px;background:#fff;border:1px solid #E2D9F0;border-radius:24px;padding:32px;box-shadow:0 16px 38px rgba(69,48,103,.08)}.cb-network{position:relative;min-height:390px;border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 47%,#F1EAFE 0 18%,#F7F3FE 42%,#FBFAFE 72%);border:1px solid #EEE7F7}.cb-network:before,.cb-network:after{content:'';position:absolute;left:11%;right:11%;top:49%;height:1px;background:repeating-linear-gradient(90deg,#BFAFE0 0 7px,transparent 7px 12px);opacity:.85;transform:rotate(8deg)}.cb-network:after{transform:rotate(-8deg)}.cb-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:94px;height:94px;border-radius:50%;background:linear-gradient(135deg,#7C3AED,#A78BFA);display:grid;place-items:center;color:#fff;font-family:'Sora',sans-serif;font-size:14px;font-weight:900;box-shadow:0 14px 34px rgba(124,58,237,.22);z-index:2;text-align:center}.cb-story{position:absolute;width:205px;background:#fff;border:1px solid #E5DDF1;border-radius:14px;padding:12px;box-shadow:0 10px 26px rgba(69,48,103,.08);z-index:3}.cb-story:nth-of-type(2){left:24px;top:30px}.cb-story:nth-of-type(3){left:36px;bottom:28px}.cb-story:nth-of-type(4){right:24px;top:36px}.cb-story:nth-of-type(5){right:32px;bottom:30px}.cb-story-head{display:flex;gap:8px;align-items:center;margin-bottom:7px}.cb-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#F0EAFE;color:#6D28D9;font-size:9px;font-weight:900;flex:0 0 34px}.cb-story b{display:block;font-size:10px;color:#27324B}.cb-story small{display:block;font-size:8px;color:#8A7E9D;margin-top:1px}.cb-story p{font-size:9px;line-height:1.45;color:#5C6678;margin:0}.cb-network-note{position:absolute;left:50%;bottom:15px;transform:translateX(-50%);font-size:9px;font-weight:850;color:#6D28D9;background:#F4EEFF;border:1px solid #DED1F5;border-radius:999px;padding:7px 10px;z-index:4;white-space:nowrap}.cb-copy{display:flex;flex-direction:column;justify-content:center}.cb-copy h3{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2rem,2.8vw,3rem);line-height:1.04;letter-spacing:-.04em;margin:0 0 12px}.cb-body{font-size:14px;line-height:1.62;color:#645F73;margin:0 0 20px}.cb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:22px}.cb-grid>div{border-left:1px solid #E4DCF0;padding-left:13px}.cb-grid b{display:block;font-size:10.5px;color:#432D66;margin-bottom:8px}.cb-grid span{display:block;font-size:10px;color:#6B6478;line-height:1.45;margin-bottom:7px}.cb-grid span:before{content:'✓';color:#7C3AED;font-weight:900;margin-right:6px}.cb-cta{align-self:flex-start;display:inline-flex;text-decoration:none;background:#7C3AED;color:#fff;border-radius:10px;padding:11px 16px;font-size:11px;font-weight:900;box-shadow:0 8px 18px rgba(124,58,237,.18)}.cb-safety{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}.cb-safety span{font-size:9px;font-weight:800;color:#665778;padding:6px 8px;border-radius:999px;background:#F5F0FB;border:1px solid #E8DFF4}
      @media(max-width:980px){.cb-head{grid-template-columns:1fr;gap:12px}.cb-panel{grid-template-columns:1fr}.cb-network{min-height:370px}}
      @media(max-width:650px){.cb-section{padding:44px 12px 50px}.cb-head h2{font-size:2.55rem}.cb-panel{padding:18px;border-radius:18px}.cb-network{min-height:470px}.cb-story{width:165px}.cb-story:nth-of-type(2){left:10px;top:20px}.cb-story:nth-of-type(3){left:10px;bottom:25px}.cb-story:nth-of-type(4){right:10px;top:26px}.cb-story:nth-of-type(5){right:10px;bottom:30px}.cb-center{width:82px;height:82px}.cb-grid{grid-template-columns:1fr}.cb-grid>div{border-left:0;border-top:1px solid #E4DCF0;padding:11px 0 0}}
    `}</style>
    <div className="cb-wrap">
      <div className="cb-head"><div><div className="cb-kicker">Health Communities · support between visits</div><h2>A community is more than a screen. It is people helping people stay connected.</h2></div><p>HealthConnect Communities are condition-focused spaces for peer experience, questions and ongoing support. They complement professional care; they do not replace it.</p></div>
      <div className="cb-panel">
        <div className="cb-network" aria-label="Connected HealthConnect community members">
          <div className="cb-center">HEALTH<br/>COMMUNITY</div>
          {stories.map(s=><article className="cb-story" key={s.name}><div className="cb-story-head"><span className="cb-avatar">{s.initials}</span><div><b>{s.name}</b><small>{s.topic}</small></div></div><p>{s.text}</p></article>)}
          <div className="cb-network-note">Real people · shared experience · support between visits</div>
        </div>
        <div className="cb-copy">
          <div className="cb-kicker">WHY COMMUNITIES MATTER</div><h3>Support that stays with you after the consultation ends.</h3>
          <p className="cb-body">People often leave an appointment with new questions, a long-term plan or the need to hear how others manage everyday challenges. Communities create a structured place for that ongoing connection.</p>
          <div className="cb-grid">
            <div><b>What members can do</b><span>Join condition-focused spaces</span><span>Ask questions and share experience</span><span>Participate anonymously where enabled</span></div>
            <div><b>How it works</b><span>Choose a relevant community</span><span>Read, ask and respond inside the group</span><span>Use reporting and moderation controls when needed</span></div>
            <div><b>Why it helps</b><span>Feel less isolated between visits</span><span>Learn practical questions to discuss with clinicians</span><span>Stay engaged with long-term health goals</span></div>
          </div>
          <Link href="/communities" className="cb-cta">Explore Health Communities →</Link>
          <div className="cb-safety"><span>Condition-focused</span><span>Moderated</span><span>Reporting controls</span><span>Privacy-aware participation</span></div>
        </div>
      </div>
    </div>
  </section>;
}

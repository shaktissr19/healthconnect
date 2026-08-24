'use client';

import Link from 'next/link';

const members=[
  {name:'Anjali',topic:'Diabetes',text:'Small changes are easier to stick with when others share what worked for them.'},
  {name:'Ramesh',topic:'Heart Health',text:'I knew what questions to take back to my next follow-up.'},
  {name:'Meera',topic:'Thyroid Support',text:'It helps to hear from people living through something similar.'},
  {name:'Vikram',topic:'Back & Joint Care',text:'Peer experience helped me stay motivated between appointments.'},
];

export default function CommunityBenefits(){
  return <section className="ec-section" id="health-communities-story">
    <style>{`
      .ec-section{font-family:'DM Sans',Arial,sans-serif;background:linear-gradient(115deg,#F3EEFF 0%,#FAF8FF 58%,#FFFFFF 100%);padding:96px 0;color:#10233C}.ec-wrap{max-width:1340px;margin:0 auto;padding:0 34px;display:grid;grid-template-columns:1.03fr .97fr;gap:90px;align-items:center}.ec-visual{position:relative;min-height:440px}.ec-orbit{position:absolute;left:50%;top:50%;width:300px;height:300px;transform:translate(-50%,-50%);border:1px dashed #CCB9ED;border-radius:50%}.ec-orbit.small{width:190px;height:190px}.ec-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:92px;height:92px;border-radius:50%;display:grid;place-items:center;text-align:center;background:linear-gradient(135deg,#6D28D9,#8B5CF6);color:#fff;font-family:'Sora',sans-serif;font-size:12px;font-weight:900;box-shadow:0 16px 36px rgba(109,40,217,.23);z-index:4}.ec-person{position:absolute;width:66px;height:66px;border-radius:50%;display:grid;place-items:center;background:#fff;border:4px solid #E7DDF8;color:#6D28D9;font-size:11px;font-weight:900;box-shadow:0 10px 24px rgba(76,51,112,.10);z-index:3}.ec-person.p1{left:12%;top:16%}.ec-person.p2{left:8%;bottom:17%}.ec-person.p3{right:11%;top:15%}.ec-person.p4{right:8%;bottom:16%}.ec-thread{position:absolute;width:215px;background:#fff;border:1px solid #E7DDF5;border-radius:16px;padding:12px 14px;box-shadow:0 12px 26px rgba(69,48,103,.08);z-index:5}.ec-thread.t1{left:1%;top:2%}.ec-thread.t2{right:0;top:2%}.ec-thread.t3{left:3%;bottom:1%}.ec-thread.t4{right:0;bottom:1%}.ec-thread b{display:block;font-size:9.5px;color:#3E2B5B;margin-bottom:3px}.ec-thread small{display:block;font-size:7.5px;color:#8B7D9E;margin-bottom:5px}.ec-thread p{font-size:8px;line-height:1.42;color:#665E72;margin:0}.ec-copy .ec-kicker{font-size:10px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:#7C3AED;margin-bottom:11px}.ec-copy h2{font-family:'Sora','DM Sans',sans-serif;font-size:clamp(2.7rem,4vw,4.35rem);line-height:1.02;letter-spacing:-.052em;margin:0 0 17px;color:#0B1D32;max-width:650px}.ec-copy>p{font-size:15px;line-height:1.68;color:#5F5870;margin:0 0 29px;max-width:610px}.ec-benefits{display:grid;gap:17px;margin-bottom:30px}.ec-benefit{display:grid;grid-template-columns:42px 1fr;gap:13px;align-items:start}.ec-benefit-icon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#E9DDFC;color:#7C3AED;font-size:15px;font-weight:900}.ec-benefit b{display:block;font-size:13px;color:#3D2B5C;margin-bottom:3px}.ec-benefit span{display:block;font-size:11.5px;line-height:1.48;color:#71677E;max-width:500px}.ec-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.ec-cta{display:inline-flex;align-items:center;text-decoration:none;background:#7C3AED;color:#fff;border-radius:10px;padding:12px 17px;font-size:11.5px;font-weight:900;box-shadow:0 8px 18px rgba(124,58,237,.18)}.ec-note{font-size:9.5px;font-weight:800;color:#6A5C78;background:#F7F2FD;border:1px solid #E8DFF5;border-radius:999px;padding:8px 10px}
      @media(max-width:980px){.ec-wrap{grid-template-columns:1fr;gap:50px}.ec-visual{min-height:410px}.ec-copy{max-width:760px}}
      @media(max-width:650px){.ec-section{padding:68px 0}.ec-wrap{padding:0 16px}.ec-copy h2{font-size:2.6rem}.ec-visual{min-height:500px}.ec-thread{width:165px}.ec-person{width:56px;height:56px}.ec-person.p1{left:8%;top:22%}.ec-person.p2{left:7%;bottom:22%}.ec-person.p3{right:7%;top:21%}.ec-person.p4{right:6%;bottom:21%}.ec-orbit{width:250px;height:250px}.ec-orbit.small{width:155px;height:155px}}
    `}</style>
    <div className="ec-wrap">
      <div className="ec-visual" aria-label="HealthConnect members connected through condition-focused communities">
        <div className="ec-orbit"/><div className="ec-orbit small"/><div className="ec-hub">HEALTH<br/>COMMUNITY</div>
        <span className="ec-person p1">AS</span><span className="ec-person p2">RM</span><span className="ec-person p3">MK</span><span className="ec-person p4">VK</span>
        {members.map((m,i)=><article className={`ec-thread t${i+1}`} key={m.name}><b>{m.name}</b><small>{m.topic}</small><p>{m.text}</p></article>)}
      </div>
      <div className="ec-copy">
        <div className="ec-kicker">Health Communities</div>
        <h2>Support between appointments matters too.</h2>
        <p>HealthConnect Communities are condition-focused spaces where people can exchange lived experience, ask practical questions and stay connected between visits. They complement professional care; they do not replace it.</p>
        <div className="ec-benefits">
          <div className="ec-benefit"><span className="ec-benefit-icon">1</span><div><b>People who understand</b><span>Learn from others living through similar health journeys instead of relying only on generic information.</span></div></div>
          <div className="ec-benefit"><span className="ec-benefit-icon">2</span><div><b>Support between visits</b><span>Stay engaged when the next consultation may be days or weeks away, and return to care with better questions.</span></div></div>
          <div className="ec-benefit"><span className="ec-benefit-icon">3</span><div><b>Safer participation</b><span>Moderation, reporting controls and privacy-aware participation help keep conversations more constructive.</span></div></div>
        </div>
        <div className="ec-actions"><Link href="/communities" className="ec-cta">Explore Health Communities →</Link><span className="ec-note">Condition-focused · moderated · privacy-aware</span></div>
      </div>
    </div>
  </section>;
}

export default function LandingColorSystem(){
  return <style>{`
    :root{
      --hc-page-canvas:#C9D5DF;
      --hc-ink:#102E45;
      --hc-navy:#17384A;
      --hc-blue:#2F5BEA;
      --hc-violet:#7357D8;
      --hc-teal:#0F766E;
      --hc-coral:#C45A31;
      --hc-gold:#D29A32;
    }

    body{background:var(--hc-page-canvas)}
    main{background:var(--hc-page-canvas)}

    /* Brand mark + stronger navbar actions */
    .hc-brand-logo{font-size:0!important;background:#F7FAFC url('/brand/healthconnect-mark.svg') center/35px 35px no-repeat!important;color:transparent!important;border:1px solid rgba(255,255,255,.82)!important;box-shadow:0 7px 18px rgba(5,24,38,.18)!important}
    .hc-signin{background:#2F5BEA!important;border-color:#6F8FF2!important;color:#fff!important;box-shadow:0 7px 18px rgba(47,91,234,.22)!important}
    .hc-signin:hover{background:#244CCB!important;border-color:#8BA4F5!important}
    .hc-signup{background:#F4C868!important;border-color:#F4C868!important;color:#17354A!important}

    /* Platform tour / section navigator */
    main .journey-root{background:#C9D5DF}
    main .journey-nav-wrap{padding-top:22px;padding-bottom:18px}
    main .journey-nav{background:#17384A;border:1px solid #294C60;box-shadow:0 14px 30px rgba(17,48,64,.16)}
    main .journey-pill{box-shadow:inset 0 0 0 1px rgba(16,46,69,.08)}

    /* My Health — visible section band + stronger product tiles */
    main .mhx-section{background:#C9D8E3!important;border-top:1px solid #AFC1CD!important;border-bottom:1px solid #AFC1CD!important}
    main .mhx-canvas{background:linear-gradient(112deg,#EAF3F7 0%,#DFEDF2 55%,#CFE4E6 100%)!important;border-color:#9FB7C5!important;box-shadow:0 24px 50px rgba(19,48,68,.16)!important}
    main .mhx-content{background:linear-gradient(90deg,rgba(238,246,249,.99) 0%,rgba(231,241,245,.98) 80%,rgba(231,241,245,.12) 100%)!important}
    main .mhx-head p{font-size:15.5px!important;color:#405C70!important}
    main .mhx-title p{font-size:13.5px!important;color:#425E72!important}
    main .mhx-score{background:linear-gradient(135deg,#CFE1F8 0%,#E8F0FB 100%)!important;border-color:#86A8D2!important;box-shadow:0 10px 22px rgba(35,76,118,.13)!important}
    main .mhx-card-head b{font-size:12px!important}
    main .mhx-score-foot{font-size:8.8px!important;color:#536E82!important}
    main .mhx-appointment{background:#F3CDB9!important;border-color:#D9916C!important;box-shadow:0 8px 18px rgba(155,75,39,.09)!important}
    main .mhx-context{background:#C6E2D5!important;border-color:#76B99B!important;box-shadow:0 8px 18px rgba(35,111,78,.08)!important}
    main .mhx-preview-copy b{font-size:12.3px!important}
    main .mhx-preview-copy span{font-size:10.2px!important;color:#435F70!important}
    main .mhx-feature{min-height:82px!important;padding:11px!important;box-shadow:0 7px 16px rgba(23,53,74,.07)!important}
    main .mhx-feature:nth-child(1){background:#C9D8FA!important;border-color:#7897E8!important}
    main .mhx-feature:nth-child(2){background:#DFD1F5!important;border-color:#9D7EDB!important}
    main .mhx-feature:nth-child(3){background:#C9E4EA!important;border-color:#65AFC2!important}
    main .mhx-feature:nth-child(4){background:#F4DCB7!important;border-color:#D89B3B!important}
    main .mhx-feature:nth-child(5){background:#CBE4D6!important;border-color:#69AA87!important}
    main .mhx-feature:nth-child(6){background:#F2D1C0!important;border-color:#D98259!important}
    main .mhx-feature-icon{background:rgba(255,255,255,.90)!important}
    main .mhx-feature b{font-size:12.3px!important;color:#102F49!important}
    main .mhx-feature p{font-size:10.4px!important;line-height:1.34!important;color:#405A6B!important}
    main .mhx-continuity{background:#24445E!important;border-color:#24445E!important;box-shadow:0 9px 19px rgba(21,52,75,.13)!important}
    main .mhx-continuity strong{font-size:10.4px!important;color:#fff!important}
    main .mhx-continuity span{font-size:9.7px!important;color:#E5EEF5!important;border-left-color:#49687E!important}
    main .mhx-photo-badge{font-size:9.8px!important;color:#17354A!important}

    /* Health Communities — stronger section/background separation and saturated cards */
    main .hc-community-showcase{background:#C7D6E2!important;border-top:1px solid #AEBFCD!important;border-bottom:1px solid #AEBFCD!important}
    main .hc-community-head p{font-size:16px!important;color:#405B70!important}
    main .hc-community-stage{background:linear-gradient(110deg,#F2E4D3 0%,#F2E4D3 48%,#DCE6EC 64%,#C8DCE4 100%)!important;border-color:#A9BDC9!important;box-shadow:0 19px 40px rgba(23,56,76,.13)!important}
    main .hc-community-content{background:linear-gradient(90deg,rgba(244,231,215,.98) 0%,rgba(244,231,215,.95) 78%,rgba(244,231,215,0) 100%)!important}
    main .hc-community-content>p{font-size:14.4px!important;color:#435E70!important}
    main .hc-community-feature{padding:11px 12px!important;box-shadow:0 7px 16px rgba(30,55,73,.07)!important}
    main .hc-community-feature:nth-child(1){background:#BFDCD2!important;border-color:#68A994!important}
    main .hc-community-feature:nth-child(2){background:#C7D5F4!important;border-color:#7D99E5!important}
    main .hc-community-feature:nth-child(3){background:#DCCEF1!important;border-color:#9E82D8!important}
    main .hc-community-feature-icon{background:rgba(255,255,255,.88)!important}
    main .hc-community-feature b{font-size:13.2px!important;color:#112F47!important}
    main .hc-community-feature span span{font-size:11.5px!important;line-height:1.38!important;color:#425F72!important}
    main .hc-community-action{font-size:12.5px!important;padding:11px 14px!important}
    main .hc-community-safety{font-size:11.3px!important;color:#4A6374!important}
    main .hc-community-visual-label{font-size:9.8px!important;padding:6px 9px!important;box-shadow:0 7px 16px rgba(18,49,67,.13)!important}
    main .hc-community-statsbar{background:#24445E!important;border-color:#24445E!important;box-shadow:0 10px 22px rgba(24,52,75,.14)!important}
    main .hc-community-statslabel{font-size:11px!important;color:#EAF2F7!important}
    main .hc-community-stat{border-left-color:#496A82!important}
    main .hc-community-stat strong{font-size:19px!important;color:#fff!important}
    main .hc-community-stat span{font-size:10.5px!important;color:#C9D9E4!important}
    main .hc-community-view{font-size:11.6px!important;color:#FFD16A!important;border-left-color:#496A82!important}
    main .hc-community-popular{background:linear-gradient(120deg,#152F45 0%,#203F59 100%)!important;border-color:#152F45!important;box-shadow:0 18px 38px rgba(18,43,63,.22)!important}
    main .hc-community-popular-head h3{font-size:18.5px!important}
    main .hc-community-popular-head a{font-size:11.8px!important;background:#F4C868!important;color:#17354A!important}
    main .hc-community-popular-card:nth-child(1){background:#F0C7D2!important;border-color:#CE7890!important}
    main .hc-community-popular-card:nth-child(2){background:#C8D9F3!important;border-color:#7198D5!important}
    main .hc-community-popular-card:nth-child(3){background:#D9C9F0!important;border-color:#9779CE!important}
    main .hc-community-popular-card:nth-child(4){background:#C7E0CF!important;border-color:#6DA582!important}
    main .hc-community-popular-card b{font-size:12.4px!important;color:#17354A!important}
    main .hc-community-popular-card small{font-size:10.3px!important;color:#3E596B!important}

    /* Doctor Platform — lavender chapter, light stage, saturated story states */
    main .doctor-platform-section{background:#DED5E9;border-top:1px solid #C7BAD6;border-bottom:1px solid #C7BAD6}
    main .doctor-platform-stage{background:linear-gradient(110deg,#F8F4FB 0%,#F8F4FB 47%,#E6EBF5 63%,#D2E1EE 100%);border-color:#BDB1CD;box-shadow:0 17px 38px rgba(48,42,77,.12)}
    main .doctor-story{box-shadow:inset 0 0 0 1px rgba(30,55,80,.03),0 8px 18px rgba(42,45,80,.07)}
    main .doctor-story-tab{background:#EEE9F4;border-color:#BCAECB}

    /* Care Discovery */
    main .care-discovery{background:#EBD7BE;border-top:1px solid #D6B995;border-bottom:1px solid #D6B995}
    main .care-card.doctor{background:#BED3EE;border-color:#8AAED7}
    main .care-card.hospital{background:#DEC7A9;border-color:#BD9668}

    /* Knowledge Hub */
    main .knowledge-section{background:#CADBEA;border-top:1px solid #AEC6DA;border-bottom:1px solid #AEC6DA}
    main .knowledge-all{background:#B9CDE7;border-color:#85AAD2}
    main .knowledge-disclaimer{background:#BACBD8;border-color:#96B0C2}

    /* Platform Numbers */
    main .pn-section{background:#DDD4E8;border-top:1px solid #C4B7D2;border-bottom:1px solid #C4B7D2}
    main .pn-cards{border-color:#B4A6C3;box-shadow:0 17px 38px rgba(40,34,65,.13)}

    /* Membership */
    main .landing-membership,main .hc-plans{background:#EBD8CF}
    main .hc-plans{border-top:1px solid #D5BEB3;border-bottom:1px solid #D5BEB3}
    main .hc-plan-card.patient{background:#C9D8FA;border-color:#8FAAE5}
    main .hc-plan-card.doctor{background:#DDCEF3;border-color:#A98AD8}
    main .hc-plan-note{background:#EFE5DE;border-color:#D3BCB0}

    /* Trust */
    main .trust-section{background:#D1E0DA;border-top:1px solid #B5CCC3;border-bottom:1px solid #B5CCC3}
    main .trust-card{box-shadow:0 11px 24px rgba(27,56,50,.085)}
    main .trust-story{background:linear-gradient(120deg,#17384A 0%,#244B61 52%,#31566F 100%);box-shadow:0 15px 32px rgba(20,49,70,.16)}

    /* Closing CTA */
    main .final-photo-section{background:#C8D8E7;border-top:1px solid #AFC2D4}
    main .final-photo{box-shadow:0 20px 44px rgba(16,45,67,.20)}

    main .mhx-section,
    main .hc-community-showcase,
    main .doctor-platform-section,
    main .care-discovery,
    main .knowledge-section,
    main .pn-section,
    main .hc-plans,
    main .trust-section,
    main .final-photo-section{position:relative}

    @media(max-width:700px){
      main .journey-nav-wrap{padding-top:16px;padding-bottom:14px}
      main .mhx-feature b{font-size:12px!important}
      main .mhx-feature p{font-size:10.2px!important}
    }
  `}</style>;
}

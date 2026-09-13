export default function LandingColorSystem(){
  return <style>{`
    :root{
      --hc-page-canvas:#CFDCE2;
      --hc-ink:#102E45;
      --hc-navy:#17384A;
      --hc-blue:#2F5BEA;
      --hc-violet:#6B6287;
      --hc-teal:#2F7D75;
      --hc-coral:#8B5A43;
      --hc-gold:#D2A85C;
    }

    body{background:var(--hc-page-canvas);color:var(--hc-ink)}
    main{background:var(--hc-page-canvas)}

    /* Brand + navbar actions */
    .hc-brand-logo{font-size:0!important;background:#F7FAFC url('/brand/healthconnect-mark.svg') center/35px 35px no-repeat!important;color:transparent!important;border:1px solid rgba(255,255,255,.82)!important;box-shadow:0 7px 18px rgba(5,24,38,.18)!important}
    .hc-signin{background:#274D64!important;border-color:#6E8CA0!important;color:#fff!important;box-shadow:0 7px 18px rgba(39,77,100,.18)!important}
    .hc-signin:hover{background:#315A73!important;border-color:#8AA5B7!important}
    .hc-signup{background:#E7C36F!important;border-color:#E7C36F!important;color:#17354A!important}

    /* Platform tour */
    .platform-tour-nav{background:#D2DFE5!important}
    main .journey-root{background:#D2DFE5}
    main .journey-nav-wrap{padding-top:22px;padding-bottom:18px}
    main .journey-nav{background:#17384A;border:1px solid #294C60;box-shadow:0 14px 30px rgba(17,48,64,.16)}
    main .journey-pill{box-shadow:inset 0 0 0 1px rgba(16,46,69,.08)}

    /* My Health, Communities, Doctor Platform and Care Discovery own their palettes. */

    /* Knowledge Hub */
    main .knowledge-section{background:#C5D5DF;border-top:1px solid #A9BECC;border-bottom:1px solid #A9BECC}
    main .knowledge-all{background:#173F5B;border-color:#244F70;color:#fff}
    main .knowledge-disclaimer{background:#B5C8D3;border-color:#9DB4C1}

    /* Platform overview */
    main .pn-section{background:#D8D8E2;border-top:1px solid #C2C3CE;border-bottom:1px solid #C2C3CE}
    main .pn-cards{border-color:#B8BCC6;box-shadow:0 17px 38px rgba(40,44,55,.11)}

    /* Membership */
    main .landing-membership,main .hc-plans{background:#E9DED2}
    main .hc-plans{border-top:1px solid #D2C5B8;border-bottom:1px solid #D2C5B8}
    main .hc-plan-card.patient{background:#D9E4F1;border-color:#AFC0D4}
    main .hc-plan-card.doctor{background:#E1DDEB;border-color:#BEB6D0}
    main .hc-plan-note{background:#F0E9E2;border-color:#D3C7BF}

    /* Trust */
    main .trust-section{background:#D6E2DA;border-top:1px solid #BECFC5;border-bottom:1px solid #BECFC5}
    main .trust-card{box-shadow:0 11px 24px rgba(27,56,50,.075)}
    main .trust-story{background:linear-gradient(120deg,#17384A 0%,#244B61 52%,#31566F 100%);box-shadow:0 15px 32px rgba(20,49,70,.16)}

    /* Closing CTA */
    main .final-photo-section{background:#C8D8E3;border-top:1px solid #B0C3D0}
    main .final-photo{box-shadow:0 20px 44px rgba(16,45,67,.18)}

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
    }
  `}</style>;
}

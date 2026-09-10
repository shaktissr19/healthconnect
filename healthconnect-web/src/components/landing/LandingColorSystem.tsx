export default function LandingColorSystem(){
  return <style>{`
    :root{
      --hc-page-canvas:#D6E0E8;
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

    /* Platform tour / section navigator */
    main .journey-root{background:#D6E0E8}
    main .journey-nav-wrap{padding-top:22px;padding-bottom:18px}
    main .journey-nav{background:#17384A;border:1px solid #294C60;box-shadow:0 14px 30px rgba(17,48,64,.16)}
    main .journey-pill{box-shadow:inset 0 0 0 1px rgba(16,46,69,.08)}

    /* My Health — warm chapter, dark product workspace */
    main .mh-section{background:#F0E2D2;border-top:1px solid #DECBB7;border-bottom:1px solid #DECBB7}
    main .mh-stage{background:#102E4A;border-color:#244968;box-shadow:0 22px 48px rgba(16,46,74,.22)}
    main .mh-score{background:linear-gradient(135deg,#FFFFFF 0%,#E7F0FF 100%);border-color:#B7CBE8}

    /* Communities — blue/cyan chapter, warm content stage, strong popular band */
    main .hc-community-showcase{background:#DCE9F0;border-top:1px solid #C4D6E0;border-bottom:1px solid #C4D6E0}
    main .hc-community-stage{background:linear-gradient(110deg,#FFF9F2 0%,#FFF9F2 48%,#EDF2F6 64%,#D7E6EC 100%);border-color:#C1D0D9;box-shadow:0 17px 38px rgba(29,61,79,.10)}
    main .hc-community-content{background:linear-gradient(90deg,rgba(255,249,242,.98) 0%,rgba(255,249,242,.94) 78%,rgba(255,249,242,0) 100%)}
    main .hc-community-statsbar{background:#C9D9E8;border-color:#AFC4D7}
    main .hc-community-stat{border-left-color:#AFC4D7}
    main .hc-community-popular{background:#21364F;border-color:#21364F;box-shadow:0 16px 34px rgba(25,48,72,.18)}
    main .hc-community-popular-card{box-shadow:0 5px 13px rgba(10,30,49,.08)}

    /* Doctor Platform — lavender chapter, light stage, saturated story states */
    main .doctor-platform-section{background:#E7E0F0;border-top:1px solid #D0C5E0;border-bottom:1px solid #D0C5E0}
    main .doctor-platform-stage{background:linear-gradient(110deg,#FFFDFC 0%,#FFFDFC 47%,#EEF0F8 63%,#DCE7F2 100%);border-color:#C9C2D7;box-shadow:0 17px 38px rgba(48,42,77,.10)}
    main .doctor-story{box-shadow:inset 0 0 0 1px rgba(30,55,80,.03),0 8px 18px rgba(42,45,80,.06)}
    main .doctor-story-tab{background:#F6F3FA;border-color:#C9C2D7}

    /* Care Discovery — warm sand chapter, unmistakably tinted cards */
    main .care-discovery{background:#F3E4D2;border-top:1px solid #DEC9AE;border-bottom:1px solid #DEC9AE}
    main .care-card.doctor{background:#CEDFF4;border-color:#AFC7E2}
    main .care-card.hospital{background:#E8D7C0;border-color:#D3B997}

    /* Knowledge Hub — steel-blue chapter with editorial cards */
    main .knowledge-section{background:#D9E6F2;border-top:1px solid #C1D4E5;border-bottom:1px solid #C1D4E5}
    main .knowledge-all{background:#C7D9EE;border-color:#9FBCE0}
    main .knowledge-disclaimer{background:#C6D5E2;border-color:#AFC3D3}

    /* Platform Numbers — lavender-gray chapter around photographic cards */
    main .pn-section{background:#E5DEED;border-top:1px solid #CEC2DA;border-bottom:1px solid #CEC2DA}
    main .pn-cards{border-color:#BEB3CB;box-shadow:0 17px 38px rgba(40,34,65,.13)}

    /* Membership — rose/sand chapter with blue and violet product cards */
    main .landing-membership,main .hc-plans{background:#F2E3DC}
    main .hc-plans{border-top:1px solid #DEC9C0;border-bottom:1px solid #DEC9C0}
    main .hc-plan-card.patient{background:#D8E4FF;border-color:#AEC2F0}
    main .hc-plan-card.doctor{background:#E6DAF8;border-color:#C7B5E9}
    main .hc-plan-note{background:#F9F3EE;border-color:#DCCAC0}

    /* Trust — muted sage chapter, colored assurance cards, dark privacy story */
    main .trust-section{background:#DFEBE6;border-top:1px solid #C5D8D0;border-bottom:1px solid #C5D8D0}
    main .trust-card{box-shadow:0 11px 24px rgba(27,56,50,.075)}
    main .trust-story{background:linear-gradient(120deg,#17384A 0%,#244B61 52%,#31566F 100%);box-shadow:0 15px 32px rgba(20,49,70,.16)}

    /* Closing CTA — cool blue frame around the dark photographic CTA */
    main .final-photo-section{background:#D7E2EE;border-top:1px solid #BECDDC}
    main .final-photo{box-shadow:0 20px 44px rgba(16,45,67,.20)}

    /* Strong section-band separation without white gutters */
    main .mh-section,
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

// src/theme.ts
// ============================================================
// SINGLE SOURCE OF TRUTH — HealthConnect India Design System
// ============================================================
//
// HOW TO USE:
//   import { theme as t } from '@/theme';
//   style={{ background: t.features.sectionBg }}
//   style={{ color: t.features.titleColor }}
//   style={{ fontSize: t.features.titleSize }}
//
// HOW TO CHANGE ANYTHING:
//   Edit this file only. Every component reads from here.
//   No component file needs to be touched for visual changes.
//
// TOKEN COVERAGE PER SECTION:
//   sectionBg        — outer section background
//   sectionPad       — section padding (vertical horizontal)
//   label            — small all-caps label above heading
//   titleColor       — main h2 heading color
//   titleSize        — main h2 font size (use clamp for responsive)
//   titleWeight      — heading font weight
//   subtitleColor    — paragraph below heading
//   subtitleSize     — paragraph font size
//   cardBg           — card tile background
//   cardBorder       — card tile border
//   cardRadius       — card corner radius
//   cardPad          — card internal padding
//   cardHoverBorder  — card border on hover
//   cardTitleColor   — text inside card — primary (name/title)
//   cardTitleSize    — text inside card — primary font size
//   cardTextColor    — text inside card — secondary (description)
//   cardTextSize     — text inside card — secondary font size
//   accentColor      — teal accent used in this section
//   accentBorder     — teal border used in this section
// ============================================================

export const theme = {

  // ── Global tokens ─────────────────────────────────────────
  // Shared across all sections. Change once, applies everywhere.
  global: {
    // Fonts — use actual font names, NOT var() references
    fontHeading:     'Poppins, sans-serif',
    fontBody:        'Nunito, sans-serif',
    fontMono:        'JetBrains Mono, monospace',

    // Brand accent
    accent:          '#14B8A6',
    accentDark:      '#0D9488',
    accentDarker:    '#0F766E',
    accentGlow:      'rgba(13,148,136,0.20)',
    accentBorder:    'rgba(13,148,136,0.30)',
    accentGlowHover: 'rgba(13,148,136,0.40)',

    // Status / semantic
    green:           '#22C55E',
    greenBg:         'rgba(34,197,94,0.10)',
    greenBorder:     'rgba(34,197,94,0.20)',
    amber:           '#F59E0B',
    amberBg:         'rgba(245,158,11,0.10)',
    rose:            '#F43F5E',
    roseBg:          'rgba(244,63,94,0.10)',
    violet:          '#8B5CF6',
    violetBg:        'rgba(139,92,246,0.10)',

    // Button styles — primary CTA
    btnPrimaryBg:    'linear-gradient(135deg,#0D9488,#14B8A6)',
    btnPrimaryColor: '#FFFFFF',
    btnPrimaryRadius:'11px',
    btnPrimaryPad:   '11px 28px',
    btnPrimaryFont:  '14px',
    btnPrimaryWeight:'700',
    btnPrimaryGlow:  '0 6px 24px rgba(13,148,136,0.40)',

    // Button styles — secondary/ghost
    btnGhostBg:      'rgba(255,255,255,0.04)',
    btnGhostBorder:  'rgba(255,255,255,0.15)',
    btnGhostColor:   '#E2E8F0',
    btnGhostRadius:  '11px',
    btnGhostPad:     '11px 24px',

    // Badge / pill — small section label
    badgeBg:         'rgba(20,184,166,0.10)',
    badgeBorder:     'rgba(20,184,166,0.25)',
    badgeColor:      '#14B8A6',
    badgePad:        '4px 14px',
    badgeRadius:     '100px',
    badgeFont:       '11px',
    badgeWeight:     '600',
    badgeSpacing:    '0.12em',
  },

  // ── Navbar ────────────────────────────────────────────────
  navbar: {
    bg:              '#0A1628',
    borderBottom:    '1px solid rgba(20,184,166,0.12)',
    height:          '68px',
    pad:             '0 5%',

    // Logo
    logoText:        '#FFFFFF',
    logoSub:         '#14B8A6',
    logoIconBg:      'linear-gradient(135deg,#0D9488,#14B8A6)',
    logoIconRadius:  '10px',
    logoIconSize:    '36px',

    // Links
    linkColor:       'rgba(255,255,255,0.65)',
    linkHover:       '#FFFFFF',
    linkActive:      '#14B8A6',
    linkSize:        '13.5px',
    linkWeight:      '500',
    linkSpacing:     '0px',

    // CTA button in navbar
    ctaBg:           'linear-gradient(135deg,#0D9488,#14B8A6)',
    ctaColor:        '#FFFFFF',
    ctaRadius:       '9px',
    ctaPad:          '8px 20px',
    ctaFont:         '13px',
  },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    sectionBg:       'linear-gradient(160deg,#0C1929 0%,#122236 40%,#162B3F 70%,#1C3248 100%)',
    sectionPad:      '100px 5% 40px',
    minHeight:       '100vh',

    // Left panel (carousel text side)
    panelBg:         'linear-gradient(160deg,#243C58 0%,#284462 50%,#223A54 100%)',
    panelBorder:     '1.5px solid rgba(20,184,166,0.25)',
    panelRadius:     '24px',
    panelPad:        '28px 28px 20px',

    // Badge above heading
    badgeBg:         'rgba(20,184,166,0.12)',
    badgeBorder:     'rgba(20,184,166,0.28)',
    badgeColor:      '#14B8A6',

    // Heading
    titleColor:      '#F0F6FF',
    titleSize:       'clamp(24px,3.2vw,46px)',
    titleWeight:     '900',
    titleSpacing:    '-1px',

    // Subtitle
    subtitleColor:   '#A8BFCF',
    subtitleSize:    'clamp(13px,1.2vw,15px)',
    subtitleWeight:  '400',

    // Mockup card (dashboard preview)
    mockupBg:        'linear-gradient(145deg,#0F2233,#0B1A28)',
    mockupBorder:    '1.5px solid rgba(255,255,255,0.18)',
    mockupRadius:    '16px',

    // Stat pills inside mockup
    statValueColor:  '#F0F8FF',
    statValueSize:   '16px',
    statValueWeight: '800',
    statLabelColor:  'rgba(255,255,255,0.60)',
    statLabelSize:   '9px',

    // Carousel nav dots
    dotColor:        'rgba(255,255,255,0.18)',
    dotActiveRadius: '4px',
    dotRadius:       '4px',
    dotHeight:       '7px',

    // Progress bar
    progressBg:      'rgba(255,255,255,0.06)',
    progressRadius:  '1px',

    // Ambient orbs
    orbOpacity:      '1',
  },

  // ── Stats Ticker ──────────────────────────────────────────
  statsTicker: {
    bg:              'linear-gradient(90deg,#0A1520,#0E1E30,#0A1520)',
    borderTop:       '1px solid rgba(20,184,166,0.08)',
    borderBottom:    '1px solid rgba(20,184,166,0.15)',
    pad:             '12px 0',

    valueColor:      '#14B8A6',
    valueSize:       '13px',
    valueWeight:     '700',
    labelColor:      'rgba(148,163,184,0.60)',
    labelSize:       '11px',
    labelWeight:     '500',
    separatorColor:  'rgba(20,184,166,0.20)',
    iconColor:       '#14B8A6',
    iconSize:        '14px',
  },

  // ── Features ──────────────────────────────────────────────
  features: {
    sectionBg:       '#1A2E45',
    sectionPad:      '80px 5%',

    // Section header
    label:           'Platform Features',
    labelColor:      '#14B8A6',
    titleColor:      '#F0F6FF',
    titleSize:       'clamp(28px,4vw,50px)',
    titleWeight:     '800',
    subtitleColor:   '#94A3B8',
    subtitleSize:    '16px',
    subtitleWeight:  '400',
    subtitleMaxW:    '520px',

    // Cards
    cardBg:          'rgba(255,255,255,0.04)',
    cardBorder:      'rgba(255,255,255,0.08)',
    cardHoverBorder: 'rgba(20,184,166,0.35)',
    cardRadius:      '18px',
    cardPad:         '24px',

    // Card icon circle
    iconBg:          'rgba(20,184,166,0.12)',
    iconSize:        '44px',
    iconRadius:      '12px',
    iconColor:       '#14B8A6',
    iconFontSize:    '20px',

    // Card text
    cardTitleColor:  '#F0F6FF',
    cardTitleSize:   '16px',
    cardTitleWeight: '700',
    cardTextColor:   '#94A3B8',
    cardTextSize:    '13.5px',
    cardTextWeight:  '400',
    cardTextLineH:   '1.6',

    // Card accent tag
    tagColor:        '#14B8A6',
    tagBg:           'rgba(20,184,166,0.10)',
    tagBorder:       'rgba(20,184,166,0.20)',
  },

  // ── Doctor Discovery ──────────────────────────────────────
  doctorDiscovery: {
    sectionBg:       '#162035',
    sectionPad:      '60px 5%',

    label:           'Verified Doctors',
    labelColor:      '#14B8A6',
    titleColor:      '#E2E8F0',
    titleSize:       'clamp(22px,3vw,36px)',
    titleWeight:     '800',
    subtitleColor:   '#94A3B8',
    subtitleSize:    '14px',
    subtitleMaxW:    '480px',

    // Doctor cards
    cardBg:          'rgba(255,255,255,0.07)',
    cardBorder:      'rgba(255,255,255,0.12)',
    cardHoverBorder: 'rgba(20,184,166,0.40)',
    cardRadius:      '16px',
    cardPad:         '20px',

    // Doctor avatar
    avatarSize:      '56px',
    avatarRadius:    '50%',
    avatarBg:        'linear-gradient(135deg,#0D9488,#14B8A6)',
    avatarColor:     '#FFFFFF',
    avatarFont:      '18px',
    avatarWeight:    '700',

    // Doctor info
    cardNameColor:   '#E2E8F0',
    cardNameSize:    '15px',
    cardNameWeight:  '700',
    cardSpecColor:   '#14B8A6',
    cardSpecSize:    '12px',
    cardSpecWeight:  '600',
    cardTextColor:   '#94A3B8',
    cardTextSize:    '12px',

    // Rating star
    ratingColor:     '#F59E0B',
    ratingSize:      '12px',

    // Verified badge
    verifiedBg:      'rgba(20,184,166,0.10)',
    verifiedColor:   '#14B8A6',
    verifiedBorder:  'rgba(20,184,166,0.25)',
    verifiedSize:    '10px',
  },

  // ── Communities ───────────────────────────────────────────
  communities: {
    sectionBg:       '#1D2D44',
    sectionPad:      '60px 5%',

    label:           'Health Communities',
    labelColor:      '#14B8A6',
    titleColor:      '#E2E8F0',
    titleSize:       'clamp(22px,3vw,36px)',
    titleWeight:     '800',
    subtitleColor:   '#94A3B8',
    subtitleSize:    '14px',
    subtitleMaxW:    '480px',

    // Community cards
    cardBg:          'rgba(255,255,255,0.05)',
    cardBorder:      'rgba(255,255,255,0.10)',
    cardHoverBorder: 'rgba(20,184,166,0.35)',
    cardRadius:      '14px',
    cardPad:         '16px',

    // Community icon circle
    iconSize:        '40px',
    iconRadius:      '10px',

    // Text
    cardNameColor:   '#E2E8F0',
    cardNameSize:    '13px',
    cardNameWeight:  '700',
    cardTextColor:   '#94A3B8',
    cardTextSize:    '11px',
    categoryColor:   '#64748B',
    categorySize:    '10px',

    // Stats (members / posts)
    statColor:       '#94A3B8',
    statSize:        '11px',
    statValueColor:  '#E2E8F0',
    statValueWeight: '700',

    // Private badge
    privateBg:       'rgba(139,92,246,0.10)',
    privateColor:    '#8B5CF6',
    privateBorder:   'rgba(139,92,246,0.20)',
    privateSize:     '9px',

    // Stats strip (below cards)
    stripBg:         'rgba(20,184,166,0.08)',
    stripBorder:     'rgba(20,184,166,0.20)',
    stripRadius:     '14px',
    stripPad:        '18px 28px',
    stripValueColor: '#14B8A6',
    stripValueSize:  '22px',
    stripValueWeight:'800',
    stripLabelColor: '#94A3B8',
    stripLabelSize:  '11px',

    // CTA buttons
    ctaPrimaryBg:    'linear-gradient(135deg,#0D9488,#14B8A6)',
    ctaPrimaryColor: '#FFFFFF',
    ctaSecondaryBg:  'rgba(20,184,166,0.08)',
    ctaSecondaryBorder: 'rgba(20,184,166,0.25)',
    ctaSecondaryColor: '#14B8A6',
    ctaRadius:       '10px',
    ctaPad:          '11px 28px',
    ctaFont:         '13px',
  },

  // ── Knowledge Hub ─────────────────────────────────────────
  knowledgeHub: {
    sectionBg:       '#152030',
    sectionPad:      '60px 5%',

    label:           'Knowledge Hub',
    labelColor:      '#14B8A6',
    titleColor:      '#E2E8F0',
    titleSize:       'clamp(22px,3vw,36px)',
    titleWeight:     '800',
    subtitleColor:   '#94A3B8',
    subtitleSize:    '14px',
    subtitleMaxW:    '480px',

    // Tab bar
    tabActiveBg:     'rgba(20,184,166,0.10)',
    tabActiveColor:  '#14B8A6',
    tabActiveBorder: 'rgba(20,184,166,0.25)',
    tabInactiveColor:'#64748B',
    tabRadius:       '8px',
    tabPad:          '6px 14px',
    tabFont:         '12px',

    // Article cards
    cardBg:          'rgba(255,255,255,0.05)',
    cardBorder:      'rgba(255,255,255,0.10)',
    cardHoverBorder: 'rgba(20,184,166,0.35)',
    cardRadius:      '14px',
    cardPad:         '20px',

    // Card content
    cardTitleColor:  '#E2E8F0',
    cardTitleSize:   '14px',
    cardTitleWeight: '700',
    cardTextColor:   '#64748B',
    cardTextSize:    '12.5px',
    cardTextLineH:   '1.6',

    // Tags
    tagColor:        '#5EEAD4',
    tagBg:           'rgba(94,234,212,0.08)',
    tagBorder:       'rgba(94,234,212,0.20)',
    tagSize:         '10px',
    tagRadius:       '100px',
    tagPad:          '2px 8px',

    // Type badge (Article, Video, Research)
    typeBadgeRadius: '6px',
    typeBadgePad:    '2px 8px',
    typeBadgeSize:   '10px',

    // Meta (author, read time)
    metaColor:       '#64748B',
    metaSize:        '11px',
    verifiedColor:   '#14B8A6',
    verifiedSize:    '11px',

    // Featured card accent
    featuredBg:      'linear-gradient(145deg,rgba(13,148,136,0.12),rgba(139,92,246,0.06),rgba(255,255,255,0.04))',
    featuredBorder:  'rgba(20,184,166,0.25)',
  },

  // ── Hospital Map ──────────────────────────────────────────
  hospitalMap: {
    sectionBg:       '#1A2B40',
    sectionPad:      '80px 5%',

    label:           'Hospital Network',
    labelColor:      '#14B8A6',
    titleColor:      '#E2E8F0',
    titleSize:       'clamp(28px,4vw,48px)',
    titleWeight:     '800',
    subtitleColor:   '#94A3B8',
    subtitleSize:    '14px',
    subtitleMaxW:    '480px',

    // Map container
    mapBg:           'rgba(255,255,255,0.03)',
    mapBorder:       'rgba(255,255,255,0.08)',
    mapRadius:       '20px',

    // Hospital pins
    pinColor:        '#14B8A6',
    pinGlow:         'rgba(20,184,166,0.60)',
    pinSize:         '10px',

    // Stat cards beside map
    statCardBg:      'rgba(255,255,255,0.06)',
    statCardBorder:  'rgba(255,255,255,0.10)',
    statCardRadius:  '12px',
    statCardPad:     '16px',
    statValueColor:  '#14B8A6',
    statValueSize:   '28px',
    statValueWeight: '800',
    statLabelColor:  '#94A3B8',
    statLabelSize:   '12px',
  },

  // ── Pricing ───────────────────────────────────────────────
  pricing: {
    sectionBg:       '#111E30',
    sectionPad:      '60px 5%',

    label:           'Simple Pricing',
    labelColor:      '#14B8A6',
    titleColor:      '#F0F6FF',
    titleSize:       'clamp(28px,4vw,50px)',
    titleWeight:     '800',
    subtitleColor:   '#94A3B8',
    subtitleSize:    '15px',
    subtitleMaxW:    '500px',

    // Plan cards
    cardBg:          'rgba(255,255,255,0.04)',
    cardBorder:      'rgba(255,255,255,0.08)',
    cardHoverBorder: 'rgba(20,184,166,0.35)',
    cardRadius:      '20px',
    cardPad:         '32px',

    // Featured/popular card
    featuredBorder:  'rgba(20,184,166,0.45)',
    featuredBg:      'rgba(20,184,166,0.06)',
    featuredGlow:    '0 0 40px rgba(20,184,166,0.12)',
    featuredBadgeBg: 'linear-gradient(135deg,#0D9488,#14B8A6)',
    featuredBadgeColor: '#FFFFFF',

    // Plan name
    cardTitleColor:  '#F0F6FF',
    cardTitleSize:   '18px',
    cardTitleWeight: '700',

    // Price
    priceColor:      '#F0F6FF',
    priceSize:       '44px',
    priceWeight:     '800',
    priceSpacing:    '-1px',
    priceSubColor:   '#94A3B8',
    priceSubSize:    '14px',

    // Feature list
    featureColor:    '#94A3B8',
    featureSize:     '13.5px',
    featureLineH:    '1.7',
    checkColor:      '#22C55E',
    checkSize:       '14px',

    // CTA button
    ctaBg:           'linear-gradient(135deg,#0D9488,#14B8A6)',
    ctaColor:        '#FFFFFF',
    ctaRadius:       '11px',
    ctaPad:          '13px 0',
    ctaFont:         '14px',
    ctaWeight:       '700',
    ctaGlow:         '0 6px 24px rgba(13,148,136,0.40)',
  },

  // ── Testimonials ──────────────────────────────────────────
  testimonials: {
    sectionBg:       '#1C2E46',
    sectionPad:      '80px 5%',

    label:           'What People Say',
    labelColor:      '#14B8A6',
    titleColor:      '#E2E8F0',
    titleSize:       'clamp(28px,4vw,48px)',
    titleWeight:     '800',
    subtitleColor:   '#94A3B8',
    subtitleSize:    '14px',

    // Quote cards
    cardBg:          'rgba(255,255,255,0.05)',
    cardBorder:      'rgba(255,255,255,0.09)',
    cardRadius:      '18px',
    cardPad:         '28px',
    quoteMarkColor:  'rgba(20,184,166,0.25)',
    quoteMarkSize:   '48px',

    // Quote text
    quoteColor:      '#94A3B8',
    quoteSize:       '14px',
    quoteWeight:     '400',
    quoteLineH:      '1.75',

    // Author
    nameColor:       '#E2E8F0',
    nameSize:        '14px',
    nameWeight:      '700',
    roleColor:       '#64748B',
    roleSize:        '12px',

    // Avatar
    avatarSize:      '40px',
    avatarRadius:    '50%',
    avatarBg:        'linear-gradient(135deg,#0D9488,#8B5CF6)',

    // Stars
    starColor:       '#F59E0B',
    starSize:        '13px',

    // Metric stats (e.g. 4.9 / 12,000+)
    metricColor:     '#14B8A6',
    metricSize:      '32px',
    metricWeight:    '800',
    metricLabelColor:'#94A3B8',
    metricLabelSize: '12px',
  },

  // ── Landing CTA ───────────────────────────────────────────
  landingCTA: {
    sectionBg:       'linear-gradient(160deg,#0C1929,#122236)',
    sectionPad:      '60px 5%',

    // Badge
    badgeBg:         'rgba(34,197,94,0.08)',
    badgeBorder:     'rgba(34,197,94,0.20)',
    badgeColor:      '#22C55E',
    badgeDotColor:   '#22C55E',

    // Heading
    titleColor:      '#F0F6FF',
    titleSize:       'clamp(24px,4vw,48px)',
    titleWeight:     '900',
    titleSpacing:    '-1.5px',
    accentColor:     '#14B8A6',         // gradient text on "Today"
    accentGrad:      'linear-gradient(135deg,#14B8A6,#5EEAD4)',

    // Subtitle
    subtitleColor:   '#94A3B8',
    subtitleSize:    '14px',
    subtitleMaxW:    '500px',

    // Bullet points
    bulletIconSize:  '14px',
    bulletTextColor: '#94A3B8',
    bulletTextSize:  '12px',

    // CTA primary
    ctaPrimaryBg:    'linear-gradient(135deg,#0D9488,#14B8A6)',
    ctaPrimaryColor: '#FFFFFF',
    ctaPrimaryRadius:'11px',
    ctaPrimaryPad:   '11px 32px',
    ctaPrimaryFont:  '13px',
    ctaPrimaryWeight:'700',
    ctaPrimaryGlow:  '0 6px 24px rgba(13,148,136,0.40)',

    // CTA secondary
    ctaSecondaryBg:    'rgba(255,255,255,0.04)',
    ctaSecondaryBorder:'rgba(255,255,255,0.15)',
    ctaSecondaryColor: '#E2E8F0',
    ctaSecondaryRadius:'11px',
    ctaSecondaryPad:   '11px 28px',
    ctaSecondaryFont:  '13px',

    // Social proof
    trustColor:      '#64748B',
    trustSize:       '13px',
    starColor:       '#F59E0B',
    avatarBorder:    '#122236',
    avatarBg:        'linear-gradient(135deg,#0D9488,#8B5CF6)',
  },

  // ── Compliance ────────────────────────────────────────────
  compliance: {
    sectionBg:       '#152030',
    sectionPad:      '80px 5%',

    label:           'Privacy & Compliance',
    labelColor:      '#14B8A6',
    titleColor:      '#E2E8F0',
    titleSize:       'clamp(28px,4vw,48px)',
    titleWeight:     '800',
    subtitleColor:   '#94A3B8',
    subtitleSize:    '14px',
    subtitleMaxW:    '480px',

    // Cards
    cardBg:          'rgba(255,255,255,0.07)',
    cardBorder:      'rgba(255,255,255,0.12)',
    cardHoverBorder: 'rgba(20,184,166,0.35)',
    cardRadius:      '16px',
    cardPad:         '24px',

    // Card header
    cardTitleColor:  '#E2E8F0',
    cardTitleSize:   '15px',
    cardTitleWeight: '700',

    // List items
    listItemColor:   '#94A3B8',
    listItemSize:    '13px',
    listItemLineH:   '1.65',
    checkColor:      '#14B8A6',
    checkSize:       '13px',

    // Badge (DPDP, HIPAA etc)
    badgeBg:         'rgba(20,184,166,0.10)',
    badgeColor:      '#14B8A6',
    badgeBorder:     'rgba(20,184,166,0.25)',
    badgeSize:       '10px',
    badgeRadius:     '6px',
    badgePad:        '2px 8px',
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    bg:              '#0A1525',
    borderTop:       '1px solid rgba(20,184,166,0.10)',
    pad:             '72px 5% 32px',

    // Logo area
    logoText:        '#FFFFFF',
    logoSub:         '#14B8A6',
    logoDescColor:   '#64748B',
    logoDescSize:    '13px',

    // Column headings
    headingColor:    '#F0F6FF',
    headingSize:     '13px',
    headingWeight:   '700',
    headingSpacing:  '0.08em',

    // Links
    linkColor:       '#64748B',
    linkHover:       '#14B8A6',
    linkSize:        '13.5px',
    linkWeight:      '400',
    linkLineH:       '2.0',

    // Divider
    dividerColor:    'rgba(255,255,255,0.06)',

    // Bottom bar
    copyColor:       '#374151',   // FIX: was too dark; use '#4B5563' for visibility
    copySize:        '12.5px',
    copyWeight:      '400',

    // Social icons
    socialIconBg:    'rgba(255,255,255,0.06)',
    socialIconBorder:'rgba(255,255,255,0.10)',
    socialIconColor: '#64748B',
    socialIconHover: '#14B8A6',
    socialIconSize:  '32px',
    socialIconRadius:'8px',
  },

} as const;

export type Theme = typeof theme;

// ── Quick reference — what each section uses ──────────────────────────────
// Navbar:           t.navbar.bg / linkColor / ctaBg
// Hero:             t.hero.sectionBg / titleColor / panelBg / mockupBg
// StatsTicker:      t.statsTicker.bg / valueColor / labelColor
// Features:         t.features.sectionBg / titleColor / cardBg / cardTitleColor
// DoctorDiscovery:  t.doctorDiscovery.sectionBg / cardBg / cardNameColor / cardSpecColor
// Communities:      t.communities.sectionBg / cardBg / stripBg / ctaPrimaryBg
// KnowledgeHub:     t.knowledgeHub.sectionBg / cardBg / tagColor / featuredBg
// HospitalMap:      t.hospitalMap.sectionBg / mapBg / pinColor / statValueColor
// Pricing:          t.pricing.sectionBg / cardBg / priceColor / featuredBorder
// Testimonials:     t.testimonials.sectionBg / cardBg / quoteColor / metricColor
// LandingCTA:       t.landingCTA.sectionBg / titleColor / ctaPrimaryBg
// Compliance:       t.compliance.sectionBg / cardBg / listItemColor / badgeBg
// Footer:           t.footer.bg / headingColor / linkColor / copyColor

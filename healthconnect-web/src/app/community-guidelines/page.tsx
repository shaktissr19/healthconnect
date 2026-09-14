import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function CommunityGuidelinesPage(){
  return <PublicInfoPage eyebrow="COMMUNITY GUIDELINES" title="Supportive spaces need clear boundaries." intro="HealthConnect communities are designed for peer support, learning and constructive participation. These guidelines describe the baseline expectations for members and moderators." sections={[
    {title:'Peer support, not diagnosis',body:<>Community posts may share lived experience and general information, but they should not be presented as a personal diagnosis, prescription or replacement for professional medical advice.</>},
    {title:'Respect and safety',body:<>Harassment, threats, hateful conduct, sexual exploitation, spam, impersonation and deliberate attempts to intimidate or shame another member are not permitted.</>},
    {title:'Privacy',body:<>Do not publish another person’s medical records, contact details or identifying health information without appropriate permission. Members should avoid sharing information they would not want visible to other community participants.</>},
    {title:'Health misinformation',body:<>Content that promotes clearly unsafe medical practices, fraudulent cures or dangerous instructions may be restricted or removed. HealthConnect may add context, limit distribution or escalate moderation when safety requires it.</>},
    {title:'Reporting and moderation',body:<>Members can report content or behaviour that appears unsafe or violates community rules. Moderation decisions may include warnings, content removal, temporary restrictions or removal from a community.</>},
    {title:'Emergencies',body:<>HealthConnect communities are not emergency services. Anyone facing a medical emergency should contact the appropriate local emergency service or seek urgent in-person medical care.</>},
  ]}/>;
}

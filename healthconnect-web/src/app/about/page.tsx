import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function AboutPage(){
  return <PublicInfoPage eyebrow="ABOUT HEALTHCONNECT" title="Healthcare journeys work better when the pieces connect." intro="HealthConnect India is being built as a shared digital layer for patients, doctors, hospitals and health communities. The platform focuses on making discovery simple while keeping the information and workflows around care connected." sections={[
    {title:'For patients',body:<>Find doctors and hospitals, manage health records, medicines, reports and appointments, and participate in health communities from one account.</>},
    {title:'For doctors',body:<>Maintain a provider presence, publish availability, manage appointments, review patient-shared health context and coordinate hospital affiliations.</>},
    {title:'For hospitals',body:<>Publish hospital information, departments, facilities, affiliated doctors and hospital-specific OPD while coordinating appointment operations.</>},
    {title:'For health communities',body:<>Support condition-focused discussion with membership rules, anonymous-post controls, moderation, reporting and community events.</>},
    {title:'Our product principle',body:<>Use clear, familiar language for Indian healthcare users. Make provider discovery easy first, then help the care journey remain connected afterwards.</>},
  ]}/>;
}

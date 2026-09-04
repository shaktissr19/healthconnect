import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function TermsPage(){
  return <PublicInfoPage eyebrow="TERMS OF USE" title="Clear expectations for using HealthConnect." intro="These terms describe the current platform rules for healthcare discovery, accounts, appointments, communities and health-information features." sections={[
    {title:'Healthcare information',body:<>HealthConnect supports discovery, records, appointments, communities and care coordination. Content on the platform is not a substitute for emergency services, diagnosis or treatment decisions by a qualified clinician.</>},
    {title:'Account responsibility',body:<>Users are responsible for keeping sign-in credentials secure and for providing accurate information when creating patient, doctor or hospital accounts.</>},
    {title:'Provider information',body:<>Provider profiles and verification status are based on information available to HealthConnect and the platform’s review processes. Users should still exercise appropriate judgement when choosing healthcare providers.</>},
    {title:'Appointments',body:<>Appointment availability and status depend on provider schedules and provider actions. HealthConnect coordinates the workflow but does not guarantee that every requested appointment will be accepted or completed.</>},
    {title:'Communities',body:<>Community participation must not be used for harassment, spam, misinformation or unsafe conduct. HealthConnect may moderate, restrict or remove content and memberships when platform safety requires it.</>},
    {title:'Platform changes',body:<>Features and policies may evolve as HealthConnect develops. Material changes to platform behaviour, privacy practices or these terms should be reflected transparently in the product.</>},
  ]}/>;
}

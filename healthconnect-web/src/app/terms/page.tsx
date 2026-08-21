import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function TermsPage(){
  return <PublicInfoPage eyebrow="TERMS OF USE" title="Clear expectations for using HealthConnect." intro="These product terms summarise how the current platform is intended to be used. They are not a substitute for a final lawyer-reviewed commercial Terms of Service before public launch." sections={[
    {title:'Healthcare information',body:<>HealthConnect supports discovery, records, appointments, communities and care coordination. Content on the platform is not a substitute for emergency services, diagnosis or treatment decisions by a qualified clinician.</>},
    {title:'Account responsibility',body:<>Users are responsible for keeping sign-in credentials secure and for providing accurate information when creating patient, doctor or hospital accounts.</>},
    {title:'Provider information',body:<>Provider profiles and verification status are based on the information and review processes available to HealthConnect. Users should still exercise appropriate judgement when choosing healthcare providers.</>},
    {title:'Appointments',body:<>Appointment availability and status depend on provider schedules and provider actions. HealthConnect coordinates the workflow but does not guarantee that every requested appointment will be accepted or completed.</>},
    {title:'Communities',body:<>Community participation must not be used for harassment, spam, misinformation or unsafe conduct. HealthConnect may moderate, restrict or remove content and memberships when platform safety requires it.</>},
    {title:'Platform changes',body:<>Features may change as HealthConnect develops. Material legal or privacy terms should be updated transparently before commercial launch and when platform behaviour materially changes.</>},
  ]}/>;
}

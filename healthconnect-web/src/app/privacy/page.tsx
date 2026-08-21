import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function PrivacyPage(){
  return <PublicInfoPage eyebrow="PRIVACY POLICY" title="Your health information should be handled with clear boundaries." intro="This page explains the current HealthConnect product approach to personal information. It is written to describe implemented platform behaviour and should be reviewed by legal counsel before a formal public commercial launch." sections={[
    {title:'Information HealthConnect stores',body:<>Account identity, role information and the health or provider information you choose to add may be stored so the platform can provide its services. Different account roles store different profile information.</>},
    {title:'Health information access',body:<>Patient health information is not intended to become publicly searchable. Authenticated and role-aware workflows control access, and patient sharing or consent choices apply where a care workflow requires another provider to view information.</>},
    {title:'Provider profiles',body:<>Doctor and hospital profiles contain information intended for public discovery when published, such as name, specialty, hospital services, verification status, availability or OPD information.</>},
    {title:'Health communities',body:<>Public community content may be visible without an account. Anonymous posting hides the poster’s identity from other community members where anonymous posting is allowed, while the platform retains moderation and safety controls.</>},
    {title:'Security',body:<>HealthConnect uses authenticated sessions, role-based access and application security controls. The platform should not describe itself as formally certified or compliant with a particular external standard unless that status has been independently established.</>},
    {title:'Your choices',body:<>You can manage profile information through your account and use the Data & Privacy and Data Deletion pages for the currently supported privacy-request paths.</>},
  ]}/>;
}

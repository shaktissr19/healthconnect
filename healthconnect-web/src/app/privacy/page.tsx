import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function PrivacyPage(){
  return <PublicInfoPage eyebrow="PRIVACY POLICY" title="Your health information should be handled with clear boundaries." intro="This notice explains how HealthConnect currently separates public discovery information, authenticated account information and health-related data across the platform." sections={[
    {title:'Information HealthConnect stores',body:<>Account identity, role information and the health or provider information you choose to add may be stored so the platform can provide its services. Different account roles store different profile information.</>},
    {title:'Health information access',body:<>Patient health information is not intended to become publicly searchable. Authenticated and role-aware workflows control access, and patient sharing or consent choices apply where a care workflow requires another provider to view information.</>},
    {title:'Provider profiles',body:<>Doctor and hospital profiles contain information intended for public discovery when published, such as name, specialty, hospital services, verification status, availability or OPD information.</>},
    {title:'Health communities',body:<>Public community content may be visible without an account. Anonymous posting hides the poster’s identity from other community members where anonymous posting is allowed, while the platform retains the internal controls required for moderation and safety.</>},
    {title:'Security and access controls',body:<>HealthConnect uses authenticated sessions, role-aware permissions and application security controls to separate public and private platform experiences.</>},
    {title:'Your choices',body:<>You can manage supported profile and privacy settings through your account and review the Data & Privacy page for additional guidance about public, private and anonymous platform data.</>},
  ]}/>;
}

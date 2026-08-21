import Link from 'next/link';
import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function DataPrivacyPage(){
  return <PublicInfoPage eyebrow="DATA & PRIVACY" title="Know what is public, what is private and what you control." intro="HealthConnect contains both public discovery information and private account information. This page separates those concepts so users can understand the product before signing in." sections={[
    {title:'Public discovery data',body:<>Published doctor, hospital, community and Knowledge Hub information may be visible without authentication because those surfaces are designed for healthcare discovery and education.</>},
    {title:'Private patient data',body:<>Patient profile details, health history, reports, medicines, symptoms, vitals and other personal health information belong inside authenticated My Health workflows and are not intended to be publicly browsable.</>},
    {title:'Consent and care workflows',body:<>When a patient shares information into a doctor or care workflow, HealthConnect should expose only the information permitted by that workflow and the patient’s supported sharing choices.</>},
    {title:'Anonymous community participation',body:<>Anonymous posts are designed so other community members do not receive the poster’s identity. The platform can still retain the internal association required for abuse prevention, moderation and safety.</>},
    {title:'Account settings',body:<>Profile and privacy settings are managed from the relevant authenticated dashboard. HealthConnect should continue moving privacy choices into visible account controls instead of relying on hidden assumptions.</>},
    {title:'Deletion',body:<><p style={{margin:'0 0 8px'}}>The current deletion guidance is documented separately.</p><Link href="/data-deletion" style={{color:'#0D9488',fontWeight:800}}>View Data Deletion →</Link></>},
  ]}/>;
}

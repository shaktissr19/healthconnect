import Link from 'next/link';
import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function DataDeletionPage(){
  return <PublicInfoPage eyebrow="DATA DELETION" title="Account and health-data deletion should be deliberate and verifiable." intro="HealthConnect should not promise an automated deletion workflow until one exists end to end. This page documents the current product position transparently." sections={[
    {title:'Before deletion',body:<>Review information in your account and consider whether you need copies of reports, prescriptions or other records before requesting permanent removal.</>},
    {title:'Current product state',body:<>A complete self-service account-deletion workflow is not yet exposed publicly. HealthConnect therefore does not display a false “Delete everything” control that is not backed by a verified server-side process.</>},
    {title:'What the final workflow should do',body:<>The production deletion workflow should authenticate the requester, confirm scope, preserve only information that must legally or operationally remain, record the request and confirm completion.</>},
    {title:'Interim account management',body:<><p style={{margin:'0 0 8px'}}>Use the authenticated dashboard to manage profile information and account settings while the formal deletion workflow is completed.</p><Link href="/?home=1&auth=login" style={{color:'#0D9488',fontWeight:800}}>Sign In →</Link></>},
    {title:'Privacy information',body:<><p style={{margin:'0 0 8px'}}>Read the current description of public, private and anonymous data behaviour.</p><Link href="/data-privacy" style={{color:'#0D9488',fontWeight:800}}>Data & Privacy →</Link></>},
  ]}/>;
}

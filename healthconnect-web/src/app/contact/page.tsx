import Link from 'next/link';
import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function ContactPage(){
  return <PublicInfoPage eyebrow="CONTACT & SUPPORT" title="Start with the support path that matches what you are trying to do." intro="HealthConnect keeps public help focused on real product paths. We do not publish placeholder phone numbers, emails or social accounts." sections={[
    {title:'Account access',body:<><p style={{margin:'0 0 8px'}}>If you cannot sign in, use the password-recovery option from the HealthConnect Sign In screen.</p><Link href="/?home=1&auth=login" style={{color:'#0D9488',fontWeight:800}}>Open Sign In →</Link></>},
    {title:'Patient help',body:<><p style={{margin:'0 0 8px'}}>Sign in to My Health for profile, records, appointments and account settings.</p><Link href="/?home=1&auth=login" style={{color:'#0D9488',fontWeight:800}}>Open My Health →</Link></>},
    {title:'Doctor or hospital access',body:<><p style={{margin:'0 0 8px'}}>Use the same universal Sign In. HealthConnect routes your verified account to the correct provider dashboard automatically.</p><Link href="/?home=1&auth=login" style={{color:'#0D9488',fontWeight:800}}>Provider Sign In →</Link></>},
    {title:'Community safety',body:<><p style={{margin:'0 0 8px'}}>Use the in-product Report action on posts or comments. Community reports enter the moderation workflow rather than relying on an external contact form.</p><Link href="/communities" style={{color:'#0D9488',fontWeight:800}}>Open Communities →</Link></>},
    {title:'Data and privacy requests',body:<><p style={{margin:'0 0 8px'}}>Review how HealthConnect handles account information and the current data-deletion process.</p><Link href="/data-privacy" style={{color:'#0D9488',fontWeight:800}}>Data & Privacy →</Link></>},
  ]}/>;
}

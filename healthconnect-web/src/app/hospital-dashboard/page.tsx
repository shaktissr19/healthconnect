import HospitalDashboardV3 from '@/components/hospital/HospitalDashboardV3';
import EmailVerificationBanner from '@/components/dashboard/EmailVerificationBanner';

export default function HospitalDashboardPage() {
  return (
    <>
      <EmailVerificationBanner />
      <HospitalDashboardV3 />
    </>
  );
}

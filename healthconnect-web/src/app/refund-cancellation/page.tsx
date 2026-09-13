import PublicInfoPage from '@/components/landing/PublicInfoPage';

export default function RefundCancellationPage(){
  return <PublicInfoPage eyebrow="BILLING POLICY" title="Refunds, cancellations and membership changes." intro="This page explains the operating framework for HealthConnect platform memberships and payment-related support. Final payable amount, renewal terms and any provider-specific consultation terms should always be shown before payment confirmation." sections={[
    {title:'Platform membership',body:<>HealthConnect Patient and Doctor memberships cover access to platform features. Doctor consultation fees are separate from platform membership charges.</>},
    {title:'Cancellation',body:<>Where recurring billing is enabled, a user may request cancellation of future renewals from Membership & Billing or through HealthConnect support. Access may continue until the end of the already-paid membership period unless the checkout terms state otherwise.</>},
    {title:'Refund review',body:<>Duplicate charges, failed-but-debited transactions and confirmed technical billing errors should be reviewed for correction or refund. Other refund requests are assessed against the checkout terms, service status and applicable law.</>},
    {title:'Consultation payments',body:<>Consultation charges are separate from HealthConnect membership. Provider-specific cancellation or refund conditions should be displayed during booking when consultation payments are enabled.</>},
    {title:'Payment failures',body:<>A failed, pending or reversed payment must not activate paid entitlements until the payment provider confirms the final successful state. HealthConnect may keep the account available while showing the correct membership status.</>},
    {title:'Support',body:<>For billing questions, contact HealthConnect Support with the account email, payment date and transaction reference. Do not send card numbers, UPI PINs, OTPs or passwords to support.</>},
  ]}/>;
}

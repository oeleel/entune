import Link from 'next/link';

import { DoctorPlaceholderPage } from '@/components/doctor-desktop/doctor-placeholder-page';

export default function LiveTranslationPage() {
  return (
    <DoctorPlaceholderPage
      title="Live translation"
      description="Real-time interpretation during an active visit."
    >
      <p className="entune-dd-muted">
        After you start a session from the dashboard, open the doctor console for
        live translation controls.
      </p>
      <div className="entune-dd-actions">
        <Link href="/dashboard" className="entune-dd-btn entune-dd-btn-teal no-underline">
          Go to dashboard
        </Link>
        <Link href="/session/doctor" className="entune-dd-link self-center">
          Doctor session (needs visitId)
        </Link>
      </div>
    </DoctorPlaceholderPage>
  );
}

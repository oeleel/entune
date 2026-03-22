import Link from 'next/link';

import { DoctorPlaceholderPage } from '@/components/doctor-desktop/doctor-placeholder-page';

export default function StartSessionPage() {
  return (
    <DoctorPlaceholderPage
      title="Start session"
      description="Begin a new visit and share a join code with your patient."
    >
      <p className="entune-dd-muted">
        The full start flow lives on your dashboard today: create a visit, pick
        languages, and go live.
      </p>
      <div className="entune-dd-actions">
        <Link href="/dashboard" className="entune-dd-btn entune-dd-btn-teal">
          Open dashboard
        </Link>
      </div>
    </DoctorPlaceholderPage>
  );
}

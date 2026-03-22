import Link from 'next/link';

import { PatientRoleIcon, ProviderRoleIcon } from '@/components/marketing/icons';

export function HomeRoleCards() {
  return (
    <div className="entune-role-cards">
      <Link href="/login" className="entune-role-card entune-role-card-doctor">
        <div className="entune-role-icon entune-role-icon-doctor">
          <ProviderRoleIcon />
        </div>
        <h2 className="entune-role-title">Provider</h2>
        <p className="entune-role-desc">Sign in to start a session</p>
      </Link>
      <Link href="/join" className="entune-role-card entune-role-card-patient">
        <div className="entune-role-icon entune-role-icon-patient">
          <PatientRoleIcon />
        </div>
        <h2 className="entune-role-title">Patient</h2>
        <p className="entune-role-desc">Join with your provider&apos;s code</p>
      </Link>
    </div>
  );
}

import Link from 'next/link';

import { DoctorPlaceholderPage } from '@/components/doctor-desktop/doctor-placeholder-page';

export default function ForgotPasswordPage() {
  return (
    <DoctorPlaceholderPage
      title="Forgot password?"
      description="Enter the email on your account and we’ll send a reset link."
    >
      <form className="max-w-sm" action="#" method="post">
        <div className="entune-dd-field">
          <label htmlFor="fp-email">Email</label>
          <input
            id="fp-email"
            className="entune-dd-input"
            type="email"
            name="email"
            placeholder="you@hospital.org"
            autoComplete="email"
          />
        </div>
        <div className="entune-dd-actions">
          <button type="button" className="entune-dd-btn entune-dd-btn-teal">
            Send reset link
          </button>
        </div>
      </form>
      <p className="entune-dd-muted entune-dd-follow-link">
        <Link href="/login" className="entune-dd-link">
          ← Back to sign in
        </Link>
      </p>
    </DoctorPlaceholderPage>
  );
}

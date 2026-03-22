import Link from 'next/link';

import { DoctorPlaceholderPage } from '@/components/doctor-desktop/doctor-placeholder-page';

export default function SignupPage() {
  return (
    <DoctorPlaceholderPage
      title="Sign up"
      description="Create a provider account for your organization."
    >
      <form className="max-w-sm space-y-0" action="#" method="post">
        <div className="entune-dd-field">
          <label htmlFor="su-name">Full name</label>
          <input
            id="su-name"
            className="entune-dd-input"
            type="text"
            name="name"
            placeholder="Dr. Jane Smith"
            autoComplete="name"
          />
        </div>
        <div className="entune-dd-field">
          <label htmlFor="su-email">Work email</label>
          <input
            id="su-email"
            className="entune-dd-input"
            type="email"
            name="email"
            placeholder="you@hospital.org"
            autoComplete="email"
          />
        </div>
        <div className="entune-dd-field">
          <label htmlFor="su-password">Password</label>
          <input
            id="su-password"
            className="entune-dd-input"
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        <div className="entune-dd-actions">
          <button type="button" className="entune-dd-btn entune-dd-btn-teal">
            Create account
          </button>
        </div>
      </form>
      <p className="entune-dd-muted entune-dd-follow-link">
        Already registered?{' '}
        <Link href="/login" className="entune-dd-link">
          Sign in
        </Link>
      </p>
    </DoctorPlaceholderPage>
  );
}

'use client';

import Link from 'next/link';

import { DoctorPlaceholderPage } from '@/components/doctor-desktop/doctor-placeholder-page';
import { useI18n } from '@/components/providers/i18n-provider';

export default function SignupPage() {
  const { t } = useI18n();
  return (
    <DoctorPlaceholderPage
      title={t('signup.title')}
      description={t('signup.description')}
    >
      <form className="max-w-sm space-y-0" action="#" method="post">
        <div className="entune-dd-field">
          <label htmlFor="su-name">{t('signup.fullName')}</label>
          <input
            id="su-name"
            className="entune-dd-input"
            type="text"
            name="name"
            placeholder={t('signup.fullNamePlaceholder')}
            autoComplete="name"
          />
        </div>
        <div className="entune-dd-field">
          <label htmlFor="su-email">{t('signup.workEmail')}</label>
          <input
            id="su-email"
            className="entune-dd-input"
            type="email"
            name="email"
            placeholder={t('signup.workEmailPlaceholder')}
            autoComplete="email"
          />
        </div>
        <div className="entune-dd-field">
          <label htmlFor="su-password">{t('signup.password')}</label>
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
            {t('signup.create')}
          </button>
        </div>
      </form>
      <p className="entune-dd-muted entune-dd-follow-link">
        {t('signup.haveAccount')}{' '}
        <Link href="/login" className="entune-dd-link">
          {t('signup.signIn')}
        </Link>
      </p>
    </DoctorPlaceholderPage>
  );
}

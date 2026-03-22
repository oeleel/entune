'use client';

import Link from 'next/link';

import { DoctorPlaceholderPage } from '@/components/doctor-desktop/doctor-placeholder-page';
import { useI18n } from '@/components/providers/i18n-provider';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  return (
    <DoctorPlaceholderPage
      title={t('forgot.title')}
      description={t('forgot.description')}
    >
      <form className="max-w-sm" action="#" method="post">
        <div className="entune-dd-field">
          <label htmlFor="fp-email">{t('forgot.email')}</label>
          <input
            id="fp-email"
            className="entune-dd-input"
            type="email"
            name="email"
            placeholder={t('forgot.emailPlaceholder')}
            autoComplete="email"
          />
        </div>
        <div className="entune-dd-actions">
          <button type="button" className="entune-dd-btn entune-dd-btn-teal">
            {t('forgot.send')}
          </button>
        </div>
      </form>
      <p className="entune-dd-muted entune-dd-follow-link">
        <Link href="/login" className="entune-dd-link">
          {t('forgot.backToSignIn')}
        </Link>
      </p>
    </DoctorPlaceholderPage>
  );
}

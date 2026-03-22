'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { joinSession } from '@/lib/api';
import type { PatientUiLanguage } from '@/lib/patient-languages';
import { useI18n } from '@/components/providers/i18n-provider';
import { MarketingBackLink } from '@/components/marketing/marketing-back-link';
import { MarketingInnerHeader } from '@/components/marketing/marketing-inner-header';
import { PatientLanguageSelect } from '@/components/marketing/patient-language-select';

export default function JoinPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientLanguage, setPatientLanguage] = useState<PatientUiLanguage>('ko-KR');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim() || !patientName.trim() || !patientEmail.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      const { visitId } = await joinSession(
        joinCode.trim(),
        patientName.trim(),
        patientEmail.trim(),
        patientLanguage
      );
      router.push(`/session/patient?visitId=${visitId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('join.errorGeneric')
      );
      setIsJoining(false);
    }
  }

  return (
    <main className="entune-page entune-page-enter relative flex min-h-screen flex-col items-center justify-center px-6 pb-12 pt-24">
      <MarketingBackLink />
      <div className="flex w-full max-w-[380px] flex-col items-center">
        <MarketingInnerHeader />

        <div className="entune-form-box">
          <h1 className="entune-form-title">{t('join.title')}</h1>
          <p className="entune-form-sub">{t('join.sub')}</p>

          <form onSubmit={handleJoin}>
            {error && <p className="entune-error">{error}</p>}

            <input
              className="entune-code-input"
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t('join.codePlaceholder')}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              required
            />

            <div className="entune-field">
              <label htmlFor="patientName">{t('join.name')}</label>
              <input
                id="patientName"
                className="entune-input"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder={t('join.namePlaceholder')}
                autoComplete="name"
                required
              />
            </div>
            <div className="entune-field">
              <label htmlFor="patientEmail">{t('join.email')}</label>
              <input
                id="patientEmail"
                className="entune-input"
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder={t('join.emailPlaceholder')}
                autoComplete="email"
                required
              />
            </div>

            <PatientLanguageSelect
              label={t('join.yourLanguage')}
              value={patientLanguage}
              onChange={setPatientLanguage}
            />

            <button
              type="submit"
              className="entune-btn entune-btn-red"
              disabled={isJoining}
            >
              {isJoining ? t('join.joining') : t('join.join')}
            </button>
          </form>

          <p className="entune-help">{t('join.help')}</p>

          <p className="entune-help">
            {t('join.providerPrompt')}{' '}
            <Link href="/login">{t('join.signInInstead')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

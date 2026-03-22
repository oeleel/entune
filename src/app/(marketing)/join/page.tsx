'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { joinSession } from '@/lib/api';
import { useI18n } from '@/components/providers/i18n-provider';

export default function JoinPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
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
        patientEmail.trim()
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
    <main className="entune-page relative flex min-h-screen items-center justify-center px-6">
      {/* Gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'linear-gradient(180deg, var(--entune-bg) 0%, hsl(0,50%,50%,0.04) 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-[var(--entune-bg2)] border border-[var(--entune-border)] rounded-2xl p-8 text-center animate-[entune-fade-up_0.5s_ease_both]">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/LogoFr.png"
              alt=""
              width={100}
              height={392}
              priority
              className="h-14 w-auto"
            />
            <span
              className="text-4xl font-bold tracking-[0.08em] lowercase text-[var(--entune-text)]"
            >
              entune
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-white mb-1">{t('join.title')}</h1>
          <p className="text-sm text-[var(--entune-text-mid)] mb-8">{t('join.sub')}</p>

          <form onSubmit={handleJoin}>
            {error && <p className="text-sm text-[var(--entune-red)] mb-4">{error}</p>}

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

            <button
              type="submit"
              className="entune-btn entune-btn-red"
              disabled={isJoining}
            >
              {isJoining ? t('join.joining') : t('join.join')}
            </button>
          </form>
        </div>

        <p className="text-xs text-[var(--entune-text-dim)] text-center mt-6">
          {t('join.providerPrompt')}{' '}
          <Link href="/login" className="text-[var(--entune-teal)] hover:underline">
            {t('join.signInInstead')}
          </Link>
        </p>
      </div>
    </main>
  );
}

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useI18n } from '@/components/providers/i18n-provider';
import { MarketingBackLink } from '@/components/marketing/marketing-back-link';
import { MarketingInnerHeader } from '@/components/marketing/marketing-inner-header';

function LoginForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const authError = searchParams.get('error') === 'auth';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError(t('login.signInUnavailable'));
      return;
    }
    setIsLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <main className="entune-page entune-page-enter relative flex min-h-screen flex-col items-center justify-center px-6 pb-12 pt-24">
      <MarketingBackLink />
      <div className="flex w-full max-w-[380px] flex-col items-center">
        <MarketingInnerHeader />

        <div className="entune-form-box">
          <h1 className="entune-form-title">{t('login.title')}</h1>
          <p className="entune-form-sub">{t('login.sub')}</p>

          {authError && (
            <p className="entune-error">{t('login.authFailed')}</p>
          )}
          {error && <p className="entune-error">{error}</p>}

          <button
            type="button"
            className="entune-btn-oauth"
            onClick={handleGoogleSignIn}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t('login.google')}
          </button>

          <div className="entune-or">
            <span>{t('login.or')}</span>
          </div>

          <form onSubmit={handleEmailAuth}>
            <div className="entune-field">
              <label htmlFor="email">{t('login.email')}</label>
              <input
                id="email"
                className="entune-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
                autoComplete="email"
              />
            </div>
            <div className="entune-field">
              <label htmlFor="password">{t('login.password')}</label>
              <input
                id="password"
                className="entune-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="entune-btn entune-btn-teal"
              disabled={isLoading}
            >
              {isLoading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <p className="entune-help">
            <Link href="/forgot-password">{t('login.forgotPassword')}</Link>
            <span aria-hidden className="mx-2 opacity-40">
              ·
            </span>
            <Link href="/signup">{t('login.newSignup')}</Link>
          </p>

          <p className="entune-help">
            {t('login.patientPrompt')}{' '}
            <Link href="/join">{t('login.joinInstead')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

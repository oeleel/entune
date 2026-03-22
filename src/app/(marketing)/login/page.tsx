'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const authError = searchParams.get('error') === 'auth';
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) {
      setError('Authentication service is not configured. Please try again later.');
      return;
    }
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('Unable to start Google sign-in. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  return (
    <main className="entune-page relative flex min-h-screen items-center justify-center px-6">
      {/* Gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'linear-gradient(180deg, var(--entune-bg) 0%, hsl(174,50%,42%,0.06) 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="bg-[var(--entune-bg2)] border border-[var(--entune-border)] rounded-2xl p-8 text-center animate-[entune-fade-up_0.5s_ease_both]">
          {/* Logo */}
          <div
            className="text-2xl font-light tracking-[0.12em] lowercase text-[var(--entune-text)] mb-6"
            style={{ fontFamily: 'var(--font-entune-display), ui-serif, Georgia, serif' }}
          >
            entune
          </div>

          <h1 className="text-2xl font-semibold text-white mb-1">Sign in to Entune</h1>
          <p className="text-sm text-[var(--entune-text-mid)] mb-8">
            Medical interpretation, reimagined.
          </p>

          {authError && (
            <p className="text-sm text-[var(--entune-red)] mb-4">
              Sign-in failed. Please try again.
            </p>
          )}
          {error && <p className="text-sm text-[var(--entune-red)] mb-4">{error}</p>}

          <button
            type="button"
            className="entune-btn-oauth w-full"
            onClick={handleGoogleSignIn}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
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
            Continue with Google
          </button>
        </div>

        {/* Footer text */}
        <p className="text-xs text-[var(--entune-text-dim)] text-center mt-6 leading-relaxed">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>

        <p className="text-xs text-[var(--entune-text-dim)] text-center mt-4">
          Are you a patient?{' '}
          <Link href="/join" className="text-[var(--entune-teal)] hover:underline">
            Join a session instead
          </Link>
        </p>
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

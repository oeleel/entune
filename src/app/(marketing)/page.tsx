'use client';

import { useI18n } from '@/components/providers/i18n-provider';
import { HomeRoleCards } from '@/components/marketing/home-role-cards';
import { LogoFr } from '@/components/marketing/logo-fr';

export default function Home() {
  const { t } = useI18n();

  return (
    <main className="entune-page entune-page-enter flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="entune-hero-brand">
        <LogoFr variant="hero" />
        <div className="entune-wordmark">entune</div>
      </div>
      <div className="entune-tagline">{t('home.tagline')}</div>

      <HomeRoleCards />

      <div className="entune-footer-line">{t('home.footer')}</div>
    </main>
  );
}

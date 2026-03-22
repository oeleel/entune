import { HomeRoleCards } from '@/components/marketing/home-role-cards';
import { LogoFr } from '@/components/marketing/logo-fr';

export default function Home() {
  return (
    <main className="entune-page entune-page-enter flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="entune-hero-brand">
        <LogoFr variant="hero" />
        <div className="entune-wordmark">entune</div>
      </div>
      <div className="entune-tagline">Where every patient is understood</div>

      <HomeRoleCards />

      <div className="entune-footer-line">
        Secure <span>·</span> HIPAA-Compliant <span>·</span> Real-time Translation
      </div>
    </main>
  );
}

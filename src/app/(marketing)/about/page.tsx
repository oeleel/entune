import Link from 'next/link';
import {
  Languages,
  HeartPulse,
  AudioLines,
  FileText,
  MessageSquare,
  BookOpen,
  Mic,
  Brain,
  Subtitles,
} from 'lucide-react';

import { NavBar } from '@/components/landing/nav-bar';

const STATS = [
  { number: '25M+', label: 'Americans with limited English proficiency' },
  { number: '4x', label: 'more likely to experience a medical error' },
  { number: '$3B+', label: 'medical interpreter industry' },
];

const FEATURES = [
  {
    icon: Languages,
    title: 'Real-Time Translation',
    description:
      'Live bilingual subtitles powered by Claude AI — each person speaks in their language and reads the translation on screen.',
  },
  {
    icon: HeartPulse,
    title: 'Cultural Intelligence',
    description:
      'Detects culturally specific health concepts like 화병 and nervios, flagging them with clinical context for providers.',
  },
  {
    icon: AudioLines,
    title: 'Ambient Listening',
    description:
      'No buttons to press — just speak naturally. Deepgram captures and transcribes everything in real time.',
  },
  {
    icon: FileText,
    title: 'Dual Reports',
    description:
      'Doctor gets a SOAP note; patient gets a simplified summary with medications, follow-ups, and warning signs — each in their language.',
  },
  {
    icon: MessageSquare,
    title: 'Visit Memory',
    description:
      'AI chat lets patients ask questions about past visits in their preferred language. Every visit is remembered.',
  },
  {
    icon: BookOpen,
    title: 'Medical Precision',
    description:
      'Patient-facing translations simplify jargon; provider-facing translations preserve clinical precision.',
  },
];

const STEPS = [
  {
    icon: Mic,
    title: 'Speak naturally in your language',
  },
  {
    icon: Brain,
    title: 'AI translates with medical precision & cultural awareness',
  },
  {
    icon: Subtitles,
    title: 'See the translation, understand the context',
  },
];

export default function AboutPage() {
  return (
    <main className="entune-page">
      <NavBar />

      {/* Hero */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 40%, hsla(174,50%,42%,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <h1
            className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight animate-[entune-fade-up_0.6s_ease_both]"
          >
            Where every patient is understood.
          </h1>
          <p
            className="mt-6 text-lg md:text-xl font-normal text-[var(--entune-text-mid)] max-w-2xl mx-auto leading-relaxed animate-[entune-fade-up_0.6s_ease_0.1s_both]"
          >
            Real-time medical interpretation with cultural intelligence.
            Breaking language barriers in healthcare.
          </p>
          <div className="mt-10 animate-[entune-fade-up_0.6s_ease_0.2s_both]">
            <Link
              href="/login"
              className="inline-block text-lg font-semibold bg-[var(--entune-teal)] text-[var(--entune-bg)] px-8 py-4 rounded-xl hover:shadow-[0_8px_32px_rgba(135,211,218,0.3)] hover:-translate-y-0.5 transition-all"
            >
              Start a Visit
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.number}
              className="bg-[var(--entune-bg2)] border border-[var(--entune-border)] rounded-2xl p-8 text-center"
            >
              <div
                className="text-3xl font-bold text-[var(--entune-teal)] mb-2"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {stat.number}
              </div>
              <p className="text-sm text-[var(--entune-text-mid)] leading-relaxed">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 pb-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-white text-center mb-12">
            Built for the moments that matter most
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="space-y-3">
                <feature.icon className="w-6 h-6 text-[var(--entune-teal)]" />
                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--entune-text-mid)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-white text-center mb-16">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-[var(--entune-border)]" />
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-full bg-[var(--entune-teal)] flex items-center justify-center text-[var(--entune-bg)] text-xl font-bold mb-4 relative z-10">
                  {i + 1}
                </div>
                <step.icon className="w-5 h-5 text-[var(--entune-teal)] mb-2" />
                <p className="text-sm text-[var(--entune-text-mid)] leading-relaxed max-w-[220px]">
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cultural Bridging Showcase */}
      <section id="cultural" className="px-6 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Cultural intelligence, not just translation
          </h2>
          <p className="text-[var(--entune-text-mid)] mb-10 max-w-xl mx-auto leading-relaxed">
            Many health concepts don&apos;t translate directly. Entune detects culturally
            specific terms and gives providers the clinical context they need.
          </p>
          {/* Example cultural flag card — 화병 */}
          <div className="bg-[var(--entune-bg2)] border border-amber-500/30 rounded-2xl p-6 text-left max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                Cultural Flag
              </span>
              <span className="text-xs text-[var(--entune-text-dim)]">Korean</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-1">
              화병 <span className="text-[var(--entune-text-mid)] font-normal text-base">(Hwa-byung)</span>
            </h3>
            <p className="text-sm text-[var(--entune-text-mid)] mb-3">
              Literally &quot;fire disease.&quot; A culture-bound syndrome of suppressed anger
              manifesting as chest tightness, insomnia, and fatigue.
            </p>
            <div className="border-t border-[var(--entune-border)] pt-3 mt-3">
              <p className="text-xs text-[var(--entune-text-dim)]">
                <span className="text-amber-400 font-semibold">Screen for:</span>{' '}
                depression, anxiety, somatic symptom disorder
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-[var(--entune-bg2)] border-t border-[var(--entune-border)] px-6 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--entune-teal)]/20 bg-[var(--entune-teal)]/5 text-[var(--entune-teal)] text-sm font-medium">
            Built at HooHacks 2026
          </div>
          <div className="text-sm text-[var(--entune-text-mid)]">
            Made by{' '}
            <span className="text-white">Leo</span>,{' '}
            <span className="text-white">Daniel</span>,{' '}
            <span className="text-white">Hailey</span> &{' '}
            <span className="text-white">Elliot</span>
          </div>
          <p className="text-xs text-[var(--entune-text-dim)]">
            Powered by{' '}
            <a href="https://anthropic.com" className="text-[var(--entune-teal)] hover:underline">Claude</a>,{' '}
            <a href="https://deepgram.com" className="text-[var(--entune-teal)] hover:underline">Deepgram</a> &{' '}
            <a href="https://supabase.com" className="text-[var(--entune-teal)] hover:underline">Supabase</a>
          </p>
        </div>
      </footer>
    </main>
  );
}

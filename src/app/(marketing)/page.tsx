import Link from 'next/link';
import {
  Languages,
  HeartPulse,
  AudioLines,
  FileText,
  MessageSquare,
  BookOpen,
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

export default function Home() {
  return (
    <main className="entune-page">
      <NavBar />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center">
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
      <section className="px-6 pb-24">
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
      <section className="px-6 pb-32">
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
    </main>
  );
}

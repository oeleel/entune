'use client';

import { Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { CulturalFlag } from '@/lib/types';

type Tier = 'info' | 'clinical' | 'safety';

function getTier(flag: CulturalFlag): Tier {
  if (flag.safetyNote) return 'safety';
  if (flag.screenFor.length > 0) return 'clinical';
  return 'info';
}

const TIER_STYLES: Record<
  Tier,
  { bg: string; border: string; icon: string; badge: string; label: string }
> = {
  info: {
    bg: 'bg-teal-950/60',
    border: 'border-l-teal-400',
    icon: 'text-teal-400',
    badge: 'bg-teal-400/15 text-teal-300 ring-teal-400/30',
    label: 'Cultural Context',
  },
  clinical: {
    bg: 'bg-amber-950/60',
    border: 'border-l-amber-400',
    icon: 'text-amber-400',
    badge: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
    label: 'Clinical Significance',
  },
  safety: {
    bg: 'bg-red-950/60',
    border: 'border-l-red-400',
    icon: 'text-red-400',
    badge: 'bg-red-400/15 text-red-300 ring-red-400/30',
    label: 'Safety Alert',
  },
};

const TIER_ICON: Record<Tier, typeof Info> = {
  info: Info,
  clinical: AlertTriangle,
  safety: ShieldAlert,
};

export function CulturalFlagCard({ flag }: { flag: CulturalFlag }) {
  const tier = getTier(flag);
  const s = TIER_STYLES[tier];
  const Icon = TIER_ICON[tier];

  return (
    <div
      role={tier === 'safety' ? 'alert' : 'status'}
      aria-live={tier === 'safety' ? 'assertive' : 'polite'}
      className={`
        cultural-flag ${s.bg} ${s.border}
        border-l-4 rounded-lg p-4
        animate-in slide-in-from-bottom-2 fade-in duration-300
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 shrink-0 ${s.icon}`} aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {s.label}
        </span>
        <span
          className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${s.badge}`}
        >
          {flag.term}
        </span>
      </div>

      {/* Literal meaning */}
      <p className="text-xs text-muted-foreground mb-1">
        Literal: &ldquo;{flag.literal}&rdquo;
      </p>

      {/* Clinical context */}
      <p className="text-sm leading-relaxed">{flag.clinicalContext}</p>

      {/* Screen-for badges */}
      {flag.screenFor.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            Screen for:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {flag.screenFor.map((item, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-foreground/80"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Safety note */}
      {flag.safetyNote && (
        <div className="mt-3 bg-red-500/15 border border-red-400/30 rounded-md px-3 py-2">
          <p className="text-xs font-semibold text-red-300 mb-0.5">Safety Note</p>
          <p className="text-sm text-red-200">{flag.safetyNote}</p>
        </div>
      )}
    </div>
  );
}

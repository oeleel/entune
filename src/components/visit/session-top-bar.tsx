'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SupportedLanguage } from '@/lib/types';

const LANGUAGE_NATIVE: Record<SupportedLanguage, string> = {
  'en-US': 'English',
  'ko-KR': '한국어',
  'es-ES': 'Español',
};

function AudioLevelBars({ level }: { level: number }) {
  const barCount = 4;
  return (
    <div className="flex items-end gap-[2px] h-3.5" aria-label={`Audio level: ${Math.round(level * 100)}%`}>
      {Array.from({ length: barCount }, (_, i) => {
        const threshold = (i + 1) / barCount;
        const active = level >= threshold * 0.6;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-75"
            style={{
              height: `${40 + (i + 1) * 15}%`,
              backgroundColor: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
              opacity: active ? 1 : 0.25,
            }}
          />
        );
      })}
    </div>
  );
}

type SessionTopBarProps = {
  patientLanguage: SupportedLanguage;
  providerLanguage: SupportedLanguage;
  isRecording: boolean;
  audioLevel?: number;
  onEndVisit?: () => void;
  isEnding?: boolean;
};

export function SessionTopBar({
  patientLanguage,
  providerLanguage,
  isRecording,
  audioLevel = 0,
  onEndVisit,
  isEnding,
}: SessionTopBarProps) {
  const [fontScale, setFontScale] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--transcript-font-size',
      fontScale === 'large' ? '1.25rem' : '1rem'
    );
    return () => {
      document.documentElement.style.removeProperty('--transcript-font-size');
    };
  }, [fontScale]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 border-b bg-background flex items-center px-4 gap-3">
      {/* Logo */}
      <span className="text-sm font-semibold tracking-wider text-foreground shrink-0">
        Entune
      </span>

      {/* Language pair — centered */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {LANGUAGE_NATIVE[providerLanguage]}
        </Badge>
        <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
        <Badge variant="secondary" className="text-xs">
          {LANGUAGE_NATIVE[patientLanguage]}
        </Badge>
      </div>

      {/* Right side — font toggle + recording + end visit */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Font size toggle */}
        <button
          onClick={() => setFontScale((s) => (s === 'normal' ? 'large' : 'normal'))}
          className="h-8 min-w-[44px] px-2 rounded-md border text-xs font-medium hover:bg-muted transition-colors"
          aria-label={fontScale === 'normal' ? 'Increase font size' : 'Decrease font size'}
          title={fontScale === 'normal' ? 'Increase font size' : 'Decrease font size'}
        >
          {fontScale === 'normal' ? 'A+' : 'A'}
        </button>

        {isRecording && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <AudioLevelBars level={audioLevel} />
            <span className="hidden sm:inline">Listening</span>
          </span>
        )}
        {onEndVisit && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onEndVisit}
            disabled={isEnding}
            className="text-xs h-8 min-w-[44px]"
          >
            {isEnding ? 'Ending...' : 'End Visit'}
          </Button>
        )}
      </div>
    </header>
  );
}

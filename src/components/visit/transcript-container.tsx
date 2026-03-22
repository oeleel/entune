'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';

import { TranscriptEntryCard } from '@/components/visit/transcript-entry';
import { CulturalFlagCard } from '@/components/visit/cultural-flag-card';
import type { TranscriptEntry, SupportedLanguage } from '@/lib/types';

const SCROLL_THRESHOLD = 50;

type TranscriptContainerProps = {
  transcript: TranscriptEntry[];
  patientLanguage: SupportedLanguage;
  providerLanguage: SupportedLanguage;
  emptyMessage?: string;
  interimText?: string;
  /** Which side is viewing — determines which language is shown larger */
  role?: 'provider' | 'patient';
};

export function TranscriptContainer({
  transcript,
  patientLanguage,
  providerLanguage,
  emptyMessage = 'Waiting for conversation to begin...',
  interimText,
  role = 'provider',
}: TranscriptContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const isAutoScrollingRef = useRef(false);
  const [showJump, setShowJump] = useState(false);

  const handleScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = dist <= SCROLL_THRESHOLD;
    isAtBottomRef.current = atBottom;
    setShowJump(!atBottom);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-scroll on new entries
  useEffect(() => {
    if (!isAtBottomRef.current || !anchorRef.current) return;
    isAutoScrollingRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        anchorRef.current?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 400);
      });
    });
  }, [transcript, interimText]);

  const jumpToLatest = useCallback(() => {
    isAutoScrollingRef.current = true;
    anchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      isAutoScrollingRef.current = false;
      isAtBottomRef.current = true;
      setShowJump(false);
    }, 400);
  }, []);

  return (
    <div className="relative" style={{ height: 'calc(100vh - 96px)' }}>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto px-6 py-4"
        style={{ scrollBehavior: 'smooth' }}
        aria-live="polite"
        aria-label="Live transcript"
      >
        {transcript.length === 0 && !interimText ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {transcript.map((entry, i) => (
                <div key={i}>
                  <TranscriptEntryCard
                    textOriginal={entry.textEnglish}
                    textTranslated={entry.textPatientLang}
                    originalLanguage={providerLanguage}
                    translatedLanguage={patientLanguage}
                    timestamp={entry.timestamp}
                    role={role}
                  />
                  {entry.culturalFlag && (
                    <div className="pt-2">
                      <CulturalFlagCard flag={entry.culturalFlag} />
                    </div>
                  )}
                </div>
              ))}
              {interimText && (
                <div className="rounded-lg p-3 bg-muted/30 border border-dashed border-muted-foreground/20">
                  <p className="transcript-text text-muted-foreground italic">{interimText}</p>
                </div>
              )}
            </div>
          </>
        )}
        <div ref={anchorRef} />
      </div>

      {/* Jump to latest pill */}
      {showJump && transcript.length > 0 && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 shadow-lg text-sm flex items-center gap-1.5 animate-in fade-in duration-200 min-h-[44px]"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          Jump to latest
        </button>
      )}
    </div>
  );
}

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
};

export function TranscriptContainer({
  transcript,
  patientLanguage,
  providerLanguage,
  emptyMessage = 'Waiting for conversation to begin...',
  interimText,
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
      >
        {transcript.length === 0 && !interimText ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {transcript.map((entry, i) => (
              <div key={i}>
                <TranscriptEntryCard
                  textOriginal={entry.textEnglish}
                  textTranslated={entry.textPatientLang}
                  originalLanguage={providerLanguage}
                  translatedLanguage={patientLanguage}
                />
                {entry.culturalFlag && (
                  <div className="py-2 px-2">
                    <CulturalFlagCard flag={entry.culturalFlag} />
                  </div>
                )}
              </div>
            ))}
            {interimText && (
              <div className="py-4 opacity-50">
                <p className="transcript-text italic">{interimText}</p>
              </div>
            )}
          </>
        )}
        <div ref={anchorRef} />
      </div>

      {/* Jump to latest pill */}
      {showJump && transcript.length > 0 && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full px-4 py-2 shadow-lg text-sm flex items-center gap-1.5 animate-in fade-in duration-200"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          Jump to latest
        </button>
      )}
    </div>
  );
}

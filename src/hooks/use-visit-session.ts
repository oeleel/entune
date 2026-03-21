'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  VisitSession,
  LanguagePair,
  TranscriptEntry,
  CulturalFlag,
} from '@/lib/types';

export function useVisitSession() {
  const [session, setSession] = useState<VisitSession | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startSession = useCallback((languagePair: LanguagePair) => {
    const newSession: VisitSession = {
      id: uuidv4(),
      languagePair,
      transcript: [],
      culturalFlags: [],
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    setSession(newSession);
    setIsActive(true);
    return newSession;
  }, []);

  const addTranscriptEntry = useCallback((entry: TranscriptEntry) => {
    setSession((prev) => {
      if (!prev) return prev;
      const culturalFlags = entry.culturalFlag
        ? [...prev.culturalFlags, entry.culturalFlag]
        : prev.culturalFlags;
      return {
        ...prev,
        transcript: [...prev.transcript, entry],
        culturalFlags,
      };
    });
  }, []);

  const endSession = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, endedAt: new Date().toISOString() };
    });
    setIsActive(false);
  }, []);

  return {
    session,
    isActive,
    startSession,
    addTranscriptEntry,
    endSession,
  };
}

'use client';

import { useState, useCallback, useRef } from 'react';
import { createSpeechRecognition } from '@/lib/speech';
import { createClient } from '@/lib/supabase/client';
import type { SupportedLanguage, TranslationResponse } from '@/lib/types';

export function useHoldToSpeak(
  visitId: string | null,
  patientLanguage: SupportedLanguage,
  providerLanguage: SupportedLanguage
) {
  const [isHolding, setIsHolding] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastResult, setLastResult] = useState<TranslationResponse | null>(null);
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null);
  const accumulatedTextRef = useRef('');

  const startHolding = useCallback(() => {
    accumulatedTextRef.current = '';
    setIsHolding(true);

    const recognition = createSpeechRecognition({
      language: patientLanguage,
      continuous: true,
      interimResults: true,
      onResult: (text, isFinal) => {
        if (isFinal) {
          accumulatedTextRef.current += (accumulatedTextRef.current ? ' ' : '') + text;
        }
      },
      onError: (error) => {
        console.error('Speech recognition error:', error);
      },
    });

    if (recognition) {
      recognitionRef.current = recognition;
      recognition.start();
    }
  }, [patientLanguage]);

  const stopHolding = useCallback(async () => {
    setIsHolding(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Wait a moment for final results
    await new Promise((resolve) => setTimeout(resolve, 300));

    const text = accumulatedTextRef.current.trim();
    if (!text || !visitId) return;

    setIsTranslating(true);

    try {
      // Call translate API
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLanguage: patientLanguage,
          targetLanguage: providerLanguage,
          speaker: 'patient',
        }),
      });

      if (!res.ok) throw new Error('Translation failed');

      const result: TranslationResponse = await res.json();
      setLastResult(result);

      // Insert into Supabase
      const supabase = createClient();
      await supabase.from('transcript_entries').insert({
        visit_id: visitId,
        speaker: 'patient',
        original_text: result.originalText,
        translated_text: result.translatedText,
        cultural_flag: result.culturalFlag,
      });
    } catch (error) {
      console.error('Hold-to-speak translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [visitId, patientLanguage, providerLanguage]);

  return {
    isHolding,
    isTranslating,
    lastResult,
    startHolding,
    stopHolding,
  };
}

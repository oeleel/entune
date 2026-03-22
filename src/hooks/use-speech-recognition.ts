'use client';

import { useState, useCallback, useRef } from 'react';
import { createSpeechRecognition } from '@/lib/speech';
import type { SupportedLanguage } from '@/lib/types';

export type SpeechMode = 'continuous' | 'push-to-talk';

export function useSpeechRecognition(
  language: SupportedLanguage,
  mode: SpeechMode = 'continuous'
) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null);

  const startListening = useCallback(() => {
    const recognition = createSpeechRecognition({
      language,
      continuous: mode === 'continuous',
      interimResults: true,
      onResult: (text, isFinal) => {
        if (isFinal) {
          setTranscript((prev) => (prev ? `${prev} ${text}` : text));
          setInterimTranscript('');
        } else {
          setInterimTranscript(text);
        }
      },
      onError: (error) => {
        console.warn('Speech recognition error:', error);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (recognition) {
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  }, [language, mode]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  };
}

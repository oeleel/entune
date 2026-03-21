// Web Speech API wrapper
// NOTE: Only works in Chrome (and some Chromium-based browsers).
// Requires HTTPS in production (localhost works for dev).

import type { SupportedLanguage } from './types';

interface SpeechRecognitionConfig {
  language: SupportedLanguage;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// Web Speech API types (not in standard TS lib)
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

export function createSpeechRecognition(config: SpeechRecognitionConfig) {
  // Browser compatibility check
  const SpeechRecognition =
    (typeof window !== 'undefined' &&
      ((window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition)) as
      | (new () => {
          lang: string;
          continuous: boolean;
          interimResults: boolean;
          onresult: ((event: SpeechRecognitionEvent) => void) | null;
          onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
          abort: () => void;
        })
      | undefined;

  if (!SpeechRecognition) {
    console.error('Speech Recognition is not supported in this browser. Use Chrome.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = config.language;
  recognition.continuous = config.continuous ?? true;
  recognition.interimResults = config.interimResults ?? true;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const result = event.results[event.resultIndex];
    if (result) {
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      config.onResult?.(transcript, isFinal);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    config.onError?.(event.error);
  };

  recognition.onend = () => {
    config.onEnd?.();
  };

  return recognition;
}

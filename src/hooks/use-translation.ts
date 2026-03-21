'use client';

import { useState, useCallback } from 'react';
import { translate } from '@/lib/api';
import type { TranslationRequest, TranslationResponse } from '@/lib/types';

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastTranslation, setLastTranslation] = useState<TranslationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translateText = useCallback(async (request: TranslationRequest) => {
    setIsTranslating(true);
    setError(null);
    try {
      const response = await translate(request);
      setLastTranslation(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation failed';
      setError(message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { isTranslating, lastTranslation, error, translateText };
}

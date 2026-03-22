'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DeepgramResult } from '@/lib/types';

export type DeepgramEntry = {
  text: string;
  speaker: number;
  isFinal: boolean;
  detectedLanguage?: string;
  timestamp: string;
};

// --- Exported pure functions (testable) ---

export function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseDeepgramMessage(data: any): DeepgramResult | null {
  const alt = data.channel?.alternatives?.[0];
  if (!alt || !alt.transcript) return null;

  return {
    transcript: alt.transcript,
    confidence: alt.confidence || 0,
    words: alt.words || [],
    isFinal: data.is_final || false,
    speechFinal: data.speech_final || false,
    speaker: alt.words?.[0]?.speaker,
    detectedLanguage: data.channel?.detected_language,
  };
}

export function createTranscriptEntry(result: DeepgramResult): DeepgramEntry {
  return {
    text: result.transcript,
    speaker: result.speaker ?? -1,
    isFinal: result.isFinal,
    detectedLanguage: result.detectedLanguage,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Determines speaker role from Deepgram's detected language.
 * If the detected language matches the patient's language → patient.
 * Everything else → provider (default).
 */
export function detectSpeakerRole(
  detectedLanguage: string | undefined,
  providerLang: string,
  patientLang: string
): 'provider' | 'patient' {
  if (!detectedLanguage) return 'provider';
  const patientBase = patientLang.split('-')[0]; // 'ko', 'es'
  if (detectedLanguage.startsWith(patientBase)) return 'patient';
  return 'provider';
}

// --- Hook ---

export function useDeepgramTranscript(visitId?: string | null) {
  const [transcript, setTranscript] = useState<DeepgramEntry[]>([]);
  const [interimText, setInterimText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      const result = parseDeepgramMessage(data);
      if (!result) return;

      if (!result.isFinal) {
        setInterimText(result.transcript);
        return;
      }

      setInterimText('');
      const entry = createTranscriptEntry(result);
      setTranscript((prev) => [...prev, entry]);
    },
    []
  );

  const startListening = useCallback(async () => {
    if (wsRef.current) return;

    try {
      const tokenRes = await fetch('/api/deepgram/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: visitId || undefined }),
      });
      if (!tokenRes.ok) {
        throw new Error('Failed to get Deepgram token');
      }
      const { key, wsUrl } = await tokenRes.json();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const ws = new WebSocket(wsUrl, ['token', key]);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);

        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const float32Data = event.inputBuffer.getChannelData(0);
          const int16 = float32ToInt16(float32Data);
          ws.send(int16.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      ws.onmessage = (event) => {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'Results') {
          handleMessage(parsed);
        }
      };

      ws.onerror = () => {
        setError('Deepgram connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start audio';
      setError(msg);
    }
  }, [handleMessage]);

  const stopListening = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    transcript,
    interimText,
    isConnected,
    error,
    startListening,
    stopListening,
  };
}

import { describe, it, expect } from 'vitest';
import {
  float32ToInt16,
  processCalibrationResult,
  createTranscriptEntry,
  parseDeepgramMessage,
} from '../use-deepgram-transcript';
import type { DeepgramResult, SpeakerMap } from '@/lib/types';

// --- float32ToInt16 ---

describe('float32ToInt16', () => {
  it('converts silence (zeros) correctly', () => {
    const input = new Float32Array([0, 0, 0]);
    const result = float32ToInt16(input);

    expect(result).toBeInstanceOf(Int16Array);
    expect(result.length).toBe(3);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
  });

  it('converts max positive value to Int16 max (0x7FFF)', () => {
    const input = new Float32Array([1.0]);
    const result = float32ToInt16(input);
    expect(result[0]).toBe(0x7fff); // 32767
  });

  it('converts max negative value to Int16 min (-0x8000)', () => {
    const input = new Float32Array([-1.0]);
    const result = float32ToInt16(input);
    expect(result[0]).toBe(-0x8000); // -32768
  });

  it('clamps values beyond [-1, 1] range', () => {
    const input = new Float32Array([2.0, -2.0]);
    const result = float32ToInt16(input);
    expect(result[0]).toBe(0x7fff);
    expect(result[1]).toBe(-0x8000);
  });

  it('preserves relative amplitude for mid-range values', () => {
    const input = new Float32Array([0.5, -0.5]);
    const result = float32ToInt16(input);
    // 0.5 * 0x7FFF ≈ 16383
    expect(result[0]).toBeGreaterThan(16000);
    expect(result[0]).toBeLessThan(17000);
    // -0.5 * 0x8000 = -16384
    expect(result[1]).toBeLessThan(-16000);
    expect(result[1]).toBeGreaterThan(-17000);
  });
});

// --- parseDeepgramMessage ---

describe('parseDeepgramMessage', () => {
  it('parses a final result with speaker and language', () => {
    const data = {
      type: 'Results',
      is_final: true,
      speech_final: true,
      channel: {
        alternatives: [
          {
            transcript: 'Hello doctor',
            confidence: 0.98,
            words: [
              { word: 'Hello', start: 0, end: 0.5, confidence: 0.99, speaker: 0 },
              { word: 'doctor', start: 0.5, end: 1.0, confidence: 0.97, speaker: 0 },
            ],
          },
        ],
        detected_language: 'en',
      },
    };

    const result = parseDeepgramMessage(data);

    expect(result).not.toBeNull();
    expect(result!.transcript).toBe('Hello doctor');
    expect(result!.confidence).toBe(0.98);
    expect(result!.isFinal).toBe(true);
    expect(result!.speechFinal).toBe(true);
    expect(result!.speaker).toBe(0);
    expect(result!.detectedLanguage).toBe('en');
    expect(result!.words).toHaveLength(2);
  });

  it('returns null when no transcript text', () => {
    const data = {
      type: 'Results',
      is_final: true,
      channel: {
        alternatives: [{ transcript: '', confidence: 0, words: [] }],
      },
    };

    expect(parseDeepgramMessage(data)).toBeNull();
  });

  it('returns null when no alternatives', () => {
    const data = { type: 'Results', channel: {} };
    expect(parseDeepgramMessage(data)).toBeNull();
  });

  it('handles interim results (is_final=false)', () => {
    const data = {
      type: 'Results',
      is_final: false,
      speech_final: false,
      channel: {
        alternatives: [
          {
            transcript: 'Hel',
            confidence: 0.7,
            words: [{ word: 'Hel', start: 0, end: 0.2, confidence: 0.7, speaker: 1 }],
          },
        ],
      },
    };

    const result = parseDeepgramMessage(data);
    expect(result).not.toBeNull();
    expect(result!.isFinal).toBe(false);
    expect(result!.transcript).toBe('Hel');
  });

  it('handles missing speaker in words', () => {
    const data = {
      type: 'Results',
      is_final: true,
      channel: {
        alternatives: [
          {
            transcript: 'test',
            confidence: 0.9,
            words: [{ word: 'test', start: 0, end: 0.5, confidence: 0.9 }],
          },
        ],
      },
    };

    const result = parseDeepgramMessage(data);
    expect(result).not.toBeNull();
    expect(result!.speaker).toBeUndefined();
  });
});

// --- processCalibrationResult ---

describe('processCalibrationResult', () => {
  it('maps first speaker to provider during doctor-speaking phase', () => {
    const result: DeepgramResult = {
      transcript: 'I am the doctor',
      confidence: 0.9,
      words: [],
      isFinal: true,
      speechFinal: true,
      speaker: 0,
    };

    const state = processCalibrationResult(result, 'doctor-speaking', {}, null);

    expect(state.nextCalibrationState).toBe('patient-speaking');
    expect(state.speakerMapUpdate).toEqual({ 0: 'provider' });
    expect(state.doctorSpeakerId).toBe(0);
    expect(state.addToTranscript).toBe(false);
  });

  it('maps different speaker to patient during patient-speaking phase', () => {
    const result: DeepgramResult = {
      transcript: '안녕하세요',
      confidence: 0.85,
      words: [],
      isFinal: true,
      speechFinal: true,
      speaker: 1,
    };

    const speakerMap: SpeakerMap = { 0: 'provider' };
    const state = processCalibrationResult(result, 'patient-speaking', speakerMap, 0);

    expect(state.nextCalibrationState).toBe('complete');
    expect(state.speakerMapUpdate).toEqual({ 1: 'patient' });
    expect(state.addToTranscript).toBe(false);
  });

  it('ignores same speaker during patient-speaking phase', () => {
    const result: DeepgramResult = {
      transcript: 'Still the doctor',
      confidence: 0.9,
      words: [],
      isFinal: true,
      speechFinal: true,
      speaker: 0,
    };

    const speakerMap: SpeakerMap = { 0: 'provider' };
    const state = processCalibrationResult(result, 'patient-speaking', speakerMap, 0);

    expect(state.nextCalibrationState).toBe('patient-speaking'); // no change
    expect(state.speakerMapUpdate).toBeNull();
    expect(state.addToTranscript).toBe(false);
  });

  it('adds to transcript in complete state with role mapping', () => {
    const result: DeepgramResult = {
      transcript: 'How are you feeling?',
      confidence: 0.95,
      words: [],
      isFinal: true,
      speechFinal: true,
      speaker: 0,
      detectedLanguage: 'en',
    };

    const speakerMap: SpeakerMap = { 0: 'provider', 1: 'patient' };
    const state = processCalibrationResult(result, 'complete', speakerMap, 0);

    expect(state.nextCalibrationState).toBe('complete');
    expect(state.addToTranscript).toBe(true);
  });

  it('handles undefined speaker in complete state', () => {
    const result: DeepgramResult = {
      transcript: 'Unknown speaker',
      confidence: 0.8,
      words: [],
      isFinal: true,
      speechFinal: true,
      speaker: undefined,
    };

    const speakerMap: SpeakerMap = { 0: 'provider', 1: 'patient' };
    const state = processCalibrationResult(result, 'complete', speakerMap, 0);

    expect(state.addToTranscript).toBe(true);
    expect(state.nextCalibrationState).toBe('complete');
  });

  it('passes through in waiting state', () => {
    const result: DeepgramResult = {
      transcript: 'test',
      confidence: 0.9,
      words: [],
      isFinal: true,
      speechFinal: true,
      speaker: 0,
    };

    const state = processCalibrationResult(result, 'waiting', {}, null);

    expect(state.nextCalibrationState).toBe('waiting');
    expect(state.addToTranscript).toBe(true); // transcript still gets added
  });
});

// --- createTranscriptEntry ---

describe('createTranscriptEntry', () => {
  it('creates entry with mapped role from speakerMap', () => {
    const result: DeepgramResult = {
      transcript: 'I have a headache',
      confidence: 0.92,
      words: [],
      isFinal: true,
      speechFinal: true,
      speaker: 1,
      detectedLanguage: 'ko',
    };

    const speakerMap: SpeakerMap = { 0: 'provider', 1: 'patient' };
    const entry = createTranscriptEntry(result, speakerMap);

    expect(entry.text).toBe('I have a headache');
    expect(entry.speaker).toBe(1);
    expect(entry.role).toBe('patient');
    expect(entry.isFinal).toBe(true);
    expect(entry.detectedLanguage).toBe('ko');
    expect(entry.timestamp).toBeDefined();
  });

  it('sets role to null for unknown speaker ID', () => {
    const result: DeepgramResult = {
      transcript: 'Unknown',
      confidence: 0.8,
      words: [],
      isFinal: true,
      speechFinal: true,
      speaker: 99,
    };

    const speakerMap: SpeakerMap = { 0: 'provider', 1: 'patient' };
    const entry = createTranscriptEntry(result, speakerMap);

    expect(entry.role).toBeNull();
    expect(entry.speaker).toBe(99);
  });

  it('sets speaker to -1 and role to null when speaker is undefined', () => {
    const result: DeepgramResult = {
      transcript: 'No speaker',
      confidence: 0.75,
      words: [],
      isFinal: true,
      speechFinal: true,
      speaker: undefined,
    };

    const entry = createTranscriptEntry(result, {});

    expect(entry.speaker).toBe(-1);
    expect(entry.role).toBeNull();
  });
});

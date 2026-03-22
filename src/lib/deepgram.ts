import type { DeepgramConfig } from './types';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_API_BASE = 'https://api.deepgram.com/v1';

export const DEFAULT_DEEPGRAM_CONFIG: DeepgramConfig = {
  model: 'nova-3',
  language: 'multi',
  diarize: false,
  interim_results: true,
  encoding: 'linear16',
  sample_rate: 16000,
};

/**
 * Creates a short-lived Deepgram API key scoped to transcription only.
 * The browser uses this to connect directly to Deepgram,
 * keeping the main API key server-side.
 */
export async function createTemporaryApiKey(
  ttlSeconds: number = 600
): Promise<{ key: string; expiresAt: string }> {
  if (!DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  const projectId = await getProjectId();

  const res = await fetch(`${DEEPGRAM_API_BASE}/projects/${projectId}/keys`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: `entune-temp-${Date.now()}`,
      scopes: ['usage:write'],
      time_to_live_in_seconds: ttlSeconds,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create temp key: ${res.status} ${body}`);
  }

  const data = await res.json();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  return { key: data.key, expiresAt };
}

async function getProjectId(): Promise<string> {
  if (!DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY not configured');
  }

  const res = await fetch(`${DEEPGRAM_API_BASE}/projects`, {
    headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to get Deepgram projects: ${res.status}`);
  }

  const data = await res.json();
  if (!data.projects?.length) {
    throw new Error('No Deepgram projects found');
  }

  return data.projects[0].project_id;
}

/**
 * Returns the WebSocket URL for Deepgram live transcription.
 * The client connects directly using the temp API key.
 */
export function getDeepgramWebSocketUrl(config: DeepgramConfig = DEFAULT_DEEPGRAM_CONFIG): string {
  const params = new URLSearchParams({
    model: config.model,
    language: config.language,
    diarize: String(config.diarize),
    interim_results: String(config.interim_results),
    encoding: config.encoding,
    sample_rate: String(config.sample_rate),
    punctuate: 'true',
    smart_format: 'true',
  });

  return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
}

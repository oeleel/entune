'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TranscriptEntry, CulturalFlag } from '@/lib/types';

export function useRealtimeTranscript(visitId: string | null) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitId) return;

    const supabase = createClient();

    // Fetch existing entries
    supabase
      .from('transcript_entries')
      .select('*')
      .eq('visit_id', visitId)
      .order('timestamp', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(`Failed to load transcript: ${fetchError.message}`);
          return;
        }
        if (data) {
          setTranscript(
            data.map((e) => ({
              textEnglish: e.original_text,
              textPatientLang: e.translated_text,
              culturalFlag: e.cultural_flag as CulturalFlag | null,
              audioUrl: null,
              timestamp: e.timestamp,
            }))
          );
        }
      });

    // Subscribe to new entries
    const channel = supabase
      .channel(`transcript:${visitId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcript_entries',
          filter: `visit_id=eq.${visitId}`,
        },
        (payload) => {
          const e = payload.new as Record<string, unknown>;
          const entry: TranscriptEntry = {
            textEnglish: e.original_text as string,
            textPatientLang: e.translated_text as string,
            culturalFlag: e.cultural_flag as CulturalFlag | null,
            audioUrl: null,
            timestamp: e.timestamp as string,
          };
          setTranscript((prev) => [...prev, entry]);
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Transcript realtime error:', { status, err });
          setError(`Realtime connection error: ${err?.message || 'Check that Realtime is enabled for the transcript_entries table in Supabase Dashboard'}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visitId]);

  return { transcript, error };
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TranscriptEntry, CulturalFlag } from '@/lib/types';

export function useRealtimeTranscript(visitId: string | null) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  useEffect(() => {
    if (!visitId) return;

    const supabase = createClient();

    // Fetch existing entries
    supabase
      .from('transcript_entries')
      .select('*')
      .eq('visit_id', visitId)
      .order('timestamp', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setTranscript(
            data.map((e) => ({
              originalText: e.original_text,
              translatedText: e.translated_text,
              speaker: e.speaker as 'patient' | 'provider',
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
            originalText: e.original_text as string,
            translatedText: e.translated_text as string,
            speaker: e.speaker as 'patient' | 'provider',
            culturalFlag: e.cultural_flag as CulturalFlag | null,
            audioUrl: null,
            timestamp: e.timestamp as string,
          };
          setTranscript((prev) => [...prev, entry]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visitId]);

  return { transcript };
}

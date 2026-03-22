'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SessionStatus } from '@/lib/types';

export function useSessionStatus(visitId: string | null) {
  const [status, setStatus] = useState<SessionStatus>('waiting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitId) return;

    const supabase = createClient();

    // Fetch current status
    supabase
      .from('visits')
      .select('status')
      .eq('id', visitId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(`Failed to load session status: ${fetchError.message}`);
          return;
        }
        if (data) {
          setStatus(data.status as SessionStatus);
        }
      });

    // Subscribe to status changes
    const channel = supabase
      .channel(`visit-status:${visitId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'visits',
          filter: `id=eq.${visitId}`,
        },
        (payload) => {
          const newStatus = (payload.new as Record<string, unknown>).status as SessionStatus;
          setStatus(newStatus);
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          setError(`Realtime connection error: ${err?.message || 'unknown'}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visitId]);

  return { status, error };
}

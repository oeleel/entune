'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SessionStatus } from '@/lib/types';

export function useSessionStatus(visitId: string | null) {
  const [status, setStatus] = useState<SessionStatus>('waiting');
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef<SessionStatus>('waiting');

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
          const s = data.status as SessionStatus;
          statusRef.current = s;
          setStatus(s);
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
          statusRef.current = newStatus;
          setStatus(newStatus);
        }
      )
      .subscribe((subStatus, err) => {
        if (subStatus === 'CHANNEL_ERROR') {
          console.error('Session status realtime error:', { subStatus, err });
          setError(`Realtime connection error: ${err?.message || 'Check that Realtime is enabled for the visits table in Supabase Dashboard'}`);
        }
      });

    // Polling fallback: check every 3s while session isn't ended
    const interval = setInterval(async () => {
      if (statusRef.current === 'ended') return;
      const { data } = await supabase
        .from('visits')
        .select('status')
        .eq('id', visitId)
        .single();
      if (data && data.status !== statusRef.current) {
        const s = data.status as SessionStatus;
        statusRef.current = s;
        setStatus(s);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [visitId]);

  return { status, error };
}

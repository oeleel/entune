'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SessionStatus } from '@/lib/types';

export function useSessionStatus(visitId: string | null) {
  const [status, setStatus] = useState<SessionStatus>('waiting');

  useEffect(() => {
    if (!visitId) return;

    const supabase = createClient();

    // Fetch current status
    supabase
      .from('visits')
      .select('status')
      .eq('id', visitId)
      .single()
      .then(({ data }) => {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visitId]);

  return { status };
}

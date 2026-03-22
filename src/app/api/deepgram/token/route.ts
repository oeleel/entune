import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDeepgramWebSocketUrl, DEFAULT_DEEPGRAM_CONFIG } from '@/lib/deepgram';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { visitId } = body;

    // Auth: either authenticated doctor OR patient with valid active visitId
    if (visitId) {
      // Patient path — verify session is active
      const supabase = createAdminClient();
      const { data: visit } = await supabase
        .from('visits')
        .select('id, status')
        .eq('id', visitId)
        .single();

      if (!visit || visit.status !== 'active') {
        return NextResponse.json({ error: 'Visit not found or not active' }, { status: 404 });
      }
    } else {
      // Doctor path — require auth
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }

    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'DEEPGRAM_API_KEY not configured' }, { status: 500 });
    }

    const wsUrl = getDeepgramWebSocketUrl(DEFAULT_DEEPGRAM_CONFIG);
    const expiresAt = new Date(Date.now() + 600 * 1000).toISOString();

    return NextResponse.json({ key, wsUrl, expiresAt });
  } catch (error) {
    console.error('Deepgram token error:', error);
    return NextResponse.json(
      { error: 'Failed to create Deepgram token' },
      { status: 500 }
    );
  }
}

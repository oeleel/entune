import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { visitIds } = body as { visitIds: string[] };

    if (!Array.isArray(visitIds) || visitIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: visitIds (non-empty array)' },
        { status: 400 }
      );
    }

    // Delete only visits owned by the authenticated user
    // Cascade handles transcript_entries and visit_summaries
    const { data, error } = await supabase
      .from('visits')
      .delete()
      .in('id', visitIds)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Failed to delete visits:', error);
      return NextResponse.json({ error: 'Failed to delete visits' }, { status: 500 });
    }

    const deleted = (data ?? []).map((row: { id: string }) => row.id);

    return NextResponse.json({ deleted, count: deleted.length });
  } catch (error) {
    console.error('Visit delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

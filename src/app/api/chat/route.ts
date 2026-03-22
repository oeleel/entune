import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatWithHistory } from '@/lib/claude';
import type { ChatRequest, ChatResponse } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { message, preferredLanguage, visitId } = body;

    if (!message || !preferredLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: message, preferredLanguage' },
        { status: 400 }
      );
    }

    // Verify auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Fetch visits — scoped to single visit if visitId provided, otherwise all
    let visitsQuery = supabase
      .from('visits')
      .select('id, language_patient, language_provider, started_at, ended_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (visitId) {
      visitsQuery = visitsQuery.eq('id', visitId);
    } else {
      visitsQuery = visitsQuery.limit(20);
    }

    const { data: visits } = await visitsQuery;

    const visitIds = visits?.map((v) => v.id) ?? [];

    // Fetch summaries (include doctor/patient reports)
    const { data: summaries } = visitIds.length > 0
      ? await supabase
          .from('visit_summaries')
          .select('visit_id, summary_data, doctor_report, patient_report, generated_at')
          .in('visit_id', visitIds)
      : { data: [] };

    // Fetch transcript entries for context
    const { data: transcripts } = visitIds.length > 0
      ? await supabase
          .from('transcript_entries')
          .select('visit_id, speaker, original_text, translated_text, cultural_flag, timestamp')
          .in('visit_id', visitIds)
          .order('timestamp', { ascending: true })
          .limit(visitId ? 500 : 200)
      : { data: [] };

    // Serialize visit history for Claude
    let visitHistory = '';

    if (!visits || visits.length === 0) {
      visitHistory = 'No visit history available for this user.';
    } else {
      for (const visit of visits) {
        visitHistory += `\n--- Visit ${visit.id} ---\n`;
        visitHistory += `Date: ${visit.started_at}\n`;
        visitHistory += `Languages: ${visit.language_patient} (patient) / ${visit.language_provider} (provider)\n`;

        const summary = summaries?.find((s) => s.visit_id === visit.id);
        if (summary?.summary_data) {
          const sd = summary.summary_data as Record<string, unknown>;
          visitHistory += `Summary: ${JSON.stringify(sd, null, 2)}\n`;
        }
        if (summary?.doctor_report) {
          visitHistory += `Doctor Report: ${JSON.stringify(summary.doctor_report, null, 2)}\n`;
        }
        if (summary?.patient_report) {
          visitHistory += `Patient Report: ${JSON.stringify(summary.patient_report, null, 2)}\n`;
        }

        const visitTranscripts = transcripts?.filter((t) => t.visit_id === visit.id);
        if (visitTranscripts && visitTranscripts.length > 0) {
          visitHistory += 'Key transcript excerpts:\n';
          const limit = visitId ? visitTranscripts.length : 20;
          for (const t of visitTranscripts.slice(0, limit)) {
            visitHistory += `  [${t.speaker}] ${t.original_text} → ${t.translated_text}\n`;
          }
        }
      }
    }

    const { reply, referencedVisitIds } = await chatWithHistory(
      message,
      preferredLanguage,
      visitHistory
    );

    const response: ChatResponse = { reply, referencedVisitIds };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Chat failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

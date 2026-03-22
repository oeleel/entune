'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useHoldToSpeak } from '@/hooks/use-hold-to-speak';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupportedLanguage, PatientReport } from '@/lib/types';

function PatientSessionContent() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');

  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);

  const { status } = useSessionStatus(visitId);
  const { transcript } = useRealtimeTranscript(visitId);
  const { isHolding, isTranslating, startHolding, stopHolding } = useHoldToSpeak(
    visitId,
    patientLang,
    providerLang
  );

  // Fetch visit details for language pair
  useEffect(() => {
    if (!visitId) return;
    const supabase = createClient();
    supabase
      .from('visits')
      .select('language_patient, language_provider')
      .eq('id', visitId)
      .single()
      .then(({ data }) => {
        if (data) {
          setPatientLang(data.language_patient as SupportedLanguage);
          setProviderLang(data.language_provider as SupportedLanguage);
        }
      });
  }, [visitId]);

  // When session ends, fetch patient report
  useEffect(() => {
    if (status !== 'ended' || !visitId) return;
    const supabase = createClient();
    supabase
      .from('visit_summaries')
      .select('patient_report')
      .eq('visit_id', visitId)
      .single()
      .then(({ data }) => {
        if (data?.patient_report) {
          setPatientReport(data.patient_report as PatientReport);
        }
      });
  }, [status, visitId]);

  // Filter to show only provider messages as subtitles
  const providerMessages = transcript.filter((t) => t.speaker === 'provider');

  if (!visitId) {
    return <p>No visit ID provided.</p>;
  }

  return (
    <div>
      <h1>Patient Session</h1>

      {status === 'waiting' && (
        <p>Connecting to doctor...</p>
      )}

      {status === 'active' && (
        <div>
          <h2>Doctor is speaking:</h2>
          <div>
            {providerMessages.map((entry, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p>{entry.translatedText}</p>
              </div>
            ))}
            {providerMessages.length === 0 && <p>Waiting for doctor to speak...</p>}
          </div>

          <hr />

          <div>
            <button
              onMouseDown={startHolding}
              onMouseUp={stopHolding}
              onTouchStart={startHolding}
              onTouchEnd={stopHolding}
              disabled={isTranslating}
              style={{
                padding: '24px 48px',
                fontSize: '1.2em',
                cursor: isTranslating ? 'wait' : 'pointer',
              }}
            >
              {isTranslating
                ? 'Translating...'
                : isHolding
                  ? 'Listening... (release to send)'
                  : 'Hold to Speak'}
            </button>
          </div>
        </div>
      )}

      {status === 'ended' && (
        <div>
          <h2>Session Ended</h2>
          {patientReport ? (
            <div>
              <h3>Your Visit Summary</h3>
              <p>{patientReport.summary}</p>

              {patientReport.medications.length > 0 && (
                <>
                  <h4>Medications</h4>
                  <ul>
                    {patientReport.medications.map((med, i) => (
                      <li key={i}>
                        <strong>{med.name}</strong>: {med.instructions}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {patientReport.followUps.length > 0 && (
                <>
                  <h4>Follow-ups</h4>
                  <ul>
                    {patientReport.followUps.map((fu, i) => (
                      <li key={i}>
                        {fu.item}{fu.date ? ` — ${fu.date}` : ''}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {patientReport.warningSignsToWatchFor.length > 0 && (
                <>
                  <h4>Warning Signs to Watch For</h4>
                  <ul>
                    {patientReport.warningSignsToWatchFor.map((sign, i) => (
                      <li key={i}>{sign}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <p>Loading your report...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientSessionPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PatientSessionContent />
    </Suspense>
  );
}

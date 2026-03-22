'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useHoldToSpeak } from '@/hooks/use-hold-to-speak';
import { createClient } from '@/lib/supabase/client';
import type { SupportedLanguage, PatientReport } from '@/lib/types';

export default function PatientSessionPage() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');

  const { status } = useSessionStatus(visitId);
  const { transcript } = useRealtimeTranscript(visitId);

  const [patientLanguage, setPatientLanguage] = useState<SupportedLanguage>('ko-KR');
  const [providerLanguage, setProviderLanguage] = useState<SupportedLanguage>('en-US');
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);

  const { isHolding, isTranslating, startHolding, stopHolding } = useHoldToSpeak(
    visitId,
    patientLanguage,
    providerLanguage
  );

  // Fetch visit languages
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
          setPatientLanguage(data.language_patient as SupportedLanguage);
          setProviderLanguage(data.language_provider as SupportedLanguage);
        }
      });
  }, [visitId]);

  // Fetch patient report when session ends
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

  if (!visitId) return <p>Missing visit ID.</p>;

  // Filter to show doctor messages translated into patient language
  const doctorMessages = transcript.filter((t) => t.speaker === 'provider');
  const patientMessages = transcript.filter((t) => t.speaker === 'patient');

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Patient Session</h1>

      {status === 'active' && (
        <>
          {/* Doctor's translated speech as subtitles */}
          <div style={{ marginBottom: '1rem' }}>
            <h2>Doctor says:</h2>
            <div style={{ minHeight: '60px', background: '#e8f4fd', borderRadius: '4px', padding: '0.75rem' }}>
              {doctorMessages.length === 0 ? (
                <p style={{ color: '#999' }}>Waiting for doctor to speak...</p>
              ) : (
                <p style={{ fontSize: '1.25rem' }}>
                  {doctorMessages[doctorMessages.length - 1].translatedText}
                </p>
              )}
            </div>
          </div>

          {/* Hold to speak button */}
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <button
              onMouseDown={startHolding}
              onMouseUp={stopHolding}
              onTouchStart={startHolding}
              onTouchEnd={stopHolding}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                fontSize: '1rem',
                background: isHolding ? '#ef4444' : isTranslating ? '#f59e0b' : '#3b82f6',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isHolding ? 'Listening...' : isTranslating ? 'Translating...' : 'Hold to Speak'}
            </button>
          </div>

          {/* Full transcript */}
          <details>
            <summary>Full Transcript ({transcript.length} messages)</summary>
            <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
              {transcript.map((entry, i) => (
                <div key={i} style={{ marginBottom: '0.5rem', padding: '0.25rem', background: entry.speaker === 'provider' ? '#e8f4fd' : '#f0fde8', borderRadius: '4px' }}>
                  <strong>{entry.speaker === 'provider' ? 'Doctor' : 'You'}:</strong>{' '}
                  {entry.translatedText}
                </div>
              ))}
            </div>
          </details>
        </>
      )}

      {status === 'ended' && (
        <div>
          <h2>Session Complete</h2>
          {patientReport ? (
            <div>
              <h3>Your Visit Summary</h3>
              <p>{patientReport.summary}</p>

              {patientReport.medications.length > 0 && (
                <>
                  <h4>Medications</h4>
                  <ul>
                    {patientReport.medications.map((med, i) => (
                      <li key={i}><strong>{med.name}:</strong> {med.instructions}</li>
                    ))}
                  </ul>
                </>
              )}

              {patientReport.followUps.length > 0 && (
                <>
                  <h4>Follow-ups</h4>
                  <ul>
                    {patientReport.followUps.map((fu, i) => (
                      <li key={i}>{fu.item}{fu.date ? ` (${fu.date})` : ''}</li>
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
            <p>Loading your visit summary...</p>
          )}
        </div>
      )}

      {status === 'waiting' && (
        <p>Waiting for session to start...</p>
      )}
    </div>
  );
}

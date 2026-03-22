'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useHoldToSpeak } from '@/hooks/use-hold-to-speak';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updatePatientSessionLanguage } from '@/lib/api';
import { PatientLanguageSelect } from '@/components/marketing/patient-language-select';
import { toPatientUiLanguage, type PatientUiLanguage } from '@/lib/patient-languages';
import type { SupportedLanguage, PatientReport } from '@/lib/types';

function PatientSessionContent() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');

  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);

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
          const p = data.language_patient as SupportedLanguage;
          setPatientLang((p === 'es-ES' ? 'es-ES' : 'ko-KR') as SupportedLanguage);
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

  async function handlePatientLanguageChange(next: PatientUiLanguage) {
    setPatientLang(next);
    setLanguageError(null);
    if (!visitId || status === 'ended') return;
    try {
      await updatePatientSessionLanguage(visitId, next);
    } catch (e) {
      setLanguageError(e instanceof Error ? e.message : 'Could not update language');
    }
  }

  // Filter to show only provider messages as subtitles
  const providerMessages = transcript.filter((t) => t.speaker === 'provider');

  if (!visitId) {
    return (
      <p className="entune-marketing min-h-screen p-6 text-[var(--entune-text)]">
        No visit ID provided.
      </p>
    );
  }

  const languageLocked = status === 'ended';

  return (
    <div className="entune-marketing min-h-screen px-4 py-6 text-[var(--entune-text)]">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="entune-form-title m-0 text-left">Patient session</h1>
            <p className="m-0 mt-1 text-left text-sm text-[var(--entune-text-mid)]">
              Translation follows the language you choose below.
            </p>
          </div>
          <div className="w-full sm:w-64 sm:shrink-0">
            <PatientLanguageSelect
              id="sessionPatientLanguage"
              label="Your language"
              value={toPatientUiLanguage(patientLang)}
              onChange={handlePatientLanguageChange}
              disabled={languageLocked}
            />
            {languageError && (
              <p className="mt-2 text-sm text-[#f0a8a8]">{languageError}</p>
            )}
            {languageLocked && (
              <p className="mt-2 text-xs text-[var(--entune-text-dim)]">
                Language is fixed after the session ends.
              </p>
            )}
          </div>
        </header>

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

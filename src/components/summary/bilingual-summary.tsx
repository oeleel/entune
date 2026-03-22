'use client';

import { useState, type ReactNode } from 'react';
import type { DoctorReport, PatientReport, CulturalFlag, SupportedLanguage } from '@/lib/types';

type BilingualSummaryProps = {
  doctorReport: DoctorReport;
  patientReport: PatientReport;
};

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'en-US': 'English',
  'ko-KR': '한국어',
  'es-ES': 'Español',
};

function CulturalConceptsSection({ culturalFlags }: { culturalFlags: CulturalFlag[] }) {
  if (culturalFlags.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Cultural Concepts Discussed</h2>
      <div className="space-y-3">
        {culturalFlags.map((flag, i) => (
          <div key={i} className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-base">{flag.term}</span>
              <span className="text-sm text-muted-foreground">({flag.literal})</span>
            </div>
            <p className="text-sm mb-1">{flag.clinicalContext}</p>
            {flag.safetyNote && (
              <p className="text-sm text-red-600 font-medium">{flag.safetyNote}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function BilingualGrid({
  left,
  right,
  activeTab,
}: {
  left: ReactNode;
  right: ReactNode;
  activeTab: 0 | 1;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={activeTab === 0 ? '' : 'hidden lg:block'}>{left}</div>
      <div className={activeTab === 1 ? '' : 'hidden lg:block'}>{right}</div>
    </div>
  );
}

export function BilingualSummary({ doctorReport, patientReport }: BilingualSummaryProps) {
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const providerLang = doctorReport.languagePair.provider;
  const patientLang = doctorReport.languagePair.patient;

  return (
    <div className="space-y-6">
      {/* Cultural Concepts — first section */}
      <CulturalConceptsSection culturalFlags={doctorReport.culturalFlags} />

      {/* Language Toggle Tabs (for mobile) */}
      <div className="flex gap-1 border-b lg:hidden" role="tablist" aria-label="Language selection">
        <button
          role="tab"
          aria-selected={activeTab === 0}
          onClick={() => setActiveTab(0)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 0
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          {LANGUAGE_LABELS[providerLang]}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 1}
          onClick={() => setActiveTab(1)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 1
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          {LANGUAGE_LABELS[patientLang]}
        </button>
      </div>

      {/* Visit Details */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Visit Details</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Subjective</p>
            <p>{doctorReport.subjective}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Objective</p>
            <p>{doctorReport.objective}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Assessment</p>
            <p>{doctorReport.assessment}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase mb-1">Plan</p>
            <p>{doctorReport.plan}</p>
          </div>
        </div>
      </section>

      {/* Key Discussion — bilingual */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Key Discussion</h2>
        <BilingualGrid
          activeTab={activeTab}
          left={<p>{patientReport.summaryEnglish || patientReport.summary}</p>}
          right={<p>{patientReport.summary}</p>}
        />
      </section>

      {/* Medications — bilingual with left border accent */}
      {patientReport.medications.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Medications</h2>
          <div className="space-y-3">
            {patientReport.medications.map((med, i) => (
              <div key={i} className="border-l-4 border-primary pl-4 py-2">
                <p className="font-semibold">{med.name}</p>
                <BilingualGrid
                  activeTab={activeTab}
                  left={
                    <p className="text-sm text-muted-foreground">
                      {med.instructionsEnglish || med.instructions}
                    </p>
                  }
                  right={
                    <p className="text-sm text-muted-foreground">{med.instructions}</p>
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Follow-Up — bilingual */}
      {patientReport.followUps.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Follow-Up</h2>
          <div className="space-y-2">
            {patientReport.followUps.map((fu, i) => (
              <div key={i} className="border-b pb-2 last:border-0">
                <BilingualGrid
                  activeTab={activeTab}
                  left={<p className="text-sm">{fu.itemEnglish || fu.item}</p>}
                  right={<p className="text-sm">{fu.item}</p>}
                />
                {fu.date && (
                  <p className="text-xs text-muted-foreground mt-1">{fu.date}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Warning Signs — red-50 bg, red-200 border */}
      {patientReport.warningSignsToWatchFor.length > 0 && (
        <section className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3 text-red-700">Warning Signs</h2>
          <ul className="space-y-2">
            {patientReport.warningSignsToWatchFor.map((sign, i) => (
              <li key={i}>
                <BilingualGrid
                  activeTab={activeTab}
                  left={
                    <p className="text-sm">
                      {patientReport.warningSignsEnglish?.[i] || sign}
                    </p>
                  }
                  right={<p className="text-sm">{sign}</p>}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

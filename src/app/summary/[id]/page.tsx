'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SummaryView } from '@/components/summary/summary-view';
import type { VisitSummary } from '@/lib/types';

// Placeholder summary data — will be replaced with real Supabase fetch
const placeholderSummary: VisitSummary = {
  visitId: 'demo-1',
  patientLanguage: 'ko-KR',
  providerLanguage: 'en-US',
  chiefComplaint: 'Chronic chest tightness and insomnia related to suppressed emotional distress',
  chiefComplaintTranslated: '만성적인 가슴 답답함과 억눌린 감정적 고통으로 인한 불면증',
  medications: [
    {
      name: 'Melatonin 3mg',
      instructions: 'Take one tablet 30 minutes before bedtime',
      instructionsTranslated: '취침 30분 전에 1정 복용하세요',
    },
  ],
  followUps: [
    {
      item: 'Follow-up appointment in 2 weeks',
      itemTranslated: '2주 후 후속 진료 예약',
      date: '2026-04-03',
    },
    {
      item: 'Referral to behavioral health counselor',
      itemTranslated: '행동건강 상담사에게 의뢰',
    },
  ],
  warningSignsToWatchFor: [
    {
      sign: 'Chest pain that worsens with physical activity',
      signTranslated: '신체 활동 시 악화되는 흉통',
    },
    {
      sign: 'Persistent insomnia lasting more than 2 weeks',
      signTranslated: '2주 이상 지속되는 불면증',
    },
  ],
  additionalNotes: 'Cultural context: Patient described symptoms consistent with Hwa-byung (화병), a culturally recognized syndrome of suppressed anger. Consider culturally sensitive approach to treatment.',
  additionalNotesTranslated: '문화적 맥락: 환자가 화병과 일치하는 증상을 설명했습니다. 문화적으로 민감한 치료 접근 방식을 고려하세요.',
  generatedAt: new Date().toISOString(),
};

export default function SummaryPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Entune — Visit Summary</h1>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
          <Button variant="outline" size="sm" disabled>
            Download PDF
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <SummaryView summary={placeholderSummary} />
        <Separator className="my-6" />
        <p className="text-xs text-muted-foreground text-center">
          Generated at {new Date(placeholderSummary.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

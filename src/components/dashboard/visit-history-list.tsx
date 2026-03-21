'use client';

import { VisitCard } from './visit-card';

type Visit = {
  id: string;
  languagePatient: string;
  languageProvider: string;
  startedAt: string;
  chiefComplaint?: string;
};

export function VisitHistoryList({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No visits yet. Start your first visit to see it here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => (
        <VisitCard key={visit.id} visit={visit} />
      ))}
    </div>
  );
}

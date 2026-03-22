'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import type { TranscriptEntry } from '@/lib/types';

export function TranscriptDisplay({ entries }: { entries: TranscriptEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Waiting for speech...
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-3 p-4">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="rounded-lg p-3 bg-muted/40"
          >
            <div className="text-sm">{entry.textEnglish}</div>
            {entry.textEnglish !== entry.textPatientLang && (
              <div className="text-sm text-muted-foreground mt-1">
                &rarr; {entry.textPatientLang}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

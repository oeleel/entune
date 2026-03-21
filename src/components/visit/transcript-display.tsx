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
            className={`rounded-lg p-3 ${
              entry.speaker === 'provider'
                ? 'bg-blue-50 border-l-4 border-blue-500'
                : 'bg-green-50 border-l-4 border-green-500'
            }`}
          >
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              {entry.speaker}
            </div>
            <div className="text-sm">{entry.originalText}</div>
            <div className="text-sm text-muted-foreground mt-1">
              → {entry.translatedText}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

'use client';

import { Button } from '@/components/ui/button';

export function RecordingControls({
  isListening,
  onStart,
  onStop,
}: {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {isListening ? (
        <Button variant="destructive" onClick={onStop} className="gap-2">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          Stop Listening
        </Button>
      ) : (
        <Button onClick={onStart} className="gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Start Listening
        </Button>
      )}
      {isListening && (
        <span className="text-sm text-muted-foreground animate-pulse">
          Listening...
        </span>
      )}
    </div>
  );
}

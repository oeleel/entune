import { Mic, MicOff, Pause, Play, Volume2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SessionBottomBarProps = {
  isListening: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  onToggleVolume?: () => void;
};

export function SessionBottomBar({
  isListening,
  isPaused,
  onTogglePause,
  onToggleVolume,
}: SessionBottomBarProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-12 border-t bg-background flex items-center px-4">
      {/* Left — mic status */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1">
        {isListening && !isPaused ? (
          <>
            <Mic className="w-4 h-4 text-primary" />
            <span>Listening...</span>
          </>
        ) : (
          <>
            <MicOff className="w-4 h-4" />
            <span>Paused</span>
          </>
        )}
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onTogglePause}
          aria-label={isPaused ? 'Resume listening' : 'Pause listening'}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </Button>
        {onToggleVolume && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleVolume}
            aria-label="Toggle volume"
          >
            <Volume2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </footer>
  );
}

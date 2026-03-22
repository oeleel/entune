import { ArrowLeftRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SupportedLanguage } from '@/lib/types';

const LANGUAGE_NATIVE: Record<SupportedLanguage, string> = {
  'en-US': 'English',
  'ko-KR': '한국어',
  'es-ES': 'Español',
};

type SessionTopBarProps = {
  patientLanguage: SupportedLanguage;
  providerLanguage: SupportedLanguage;
  isRecording: boolean;
  onEndVisit?: () => void;
  isEnding?: boolean;
};

export function SessionTopBar({
  patientLanguage,
  providerLanguage,
  isRecording,
  onEndVisit,
  isEnding,
}: SessionTopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 border-b bg-background flex items-center px-4 gap-3">
      {/* Logo */}
      <span className="text-sm font-semibold tracking-wider text-foreground shrink-0">
        Entune
      </span>

      {/* Language pair — centered */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {LANGUAGE_NATIVE[providerLanguage]}
        </Badge>
        <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
        <Badge variant="secondary" className="text-xs">
          {LANGUAGE_NATIVE[patientLanguage]}
        </Badge>
      </div>

      {/* Right side — recording + end visit */}
      <div className="flex items-center gap-3 shrink-0">
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs text-red-500">
            <span className="recording-dot inline-block w-2 h-2 rounded-full bg-red-500" />
            Recording
          </span>
        )}
        {onEndVisit && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onEndVisit}
            disabled={isEnding}
            className="text-xs h-7"
          >
            {isEnding ? 'Ending...' : 'End Visit'}
          </Button>
        )}
      </div>
    </header>
  );
}

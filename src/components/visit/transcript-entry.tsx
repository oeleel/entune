import type { SupportedLanguage } from '@/lib/types';

const LANG_ATTR: Record<SupportedLanguage, string> = {
  'en-US': 'en',
  'ko-KR': 'ko',
  'es-ES': 'es',
};

type TranscriptEntryProps = {
  textOriginal: string;
  textTranslated: string;
  originalLanguage: SupportedLanguage;
  translatedLanguage: SupportedLanguage;
};

export function TranscriptEntryCard({
  textOriginal,
  textTranslated,
  originalLanguage,
  translatedLanguage,
}: TranscriptEntryProps) {
  return (
    <div className="py-4 border-b border-border/40 last:border-b-0">
      <div className="mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Original
        </span>
        <p className="transcript-text mt-1" lang={LANG_ATTR[originalLanguage]}>
          {textOriginal}
        </p>
      </div>
      {textOriginal !== textTranslated && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Translation
          </span>
          <p className="transcript-text mt-1" lang={LANG_ATTR[translatedLanguage]}>
            {textTranslated}
          </p>
        </div>
      )}
    </div>
  );
}

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
  timestamp?: string;
  /** Which side is viewing — determines which language is shown larger */
  role?: 'provider' | 'patient';
};

export function TranscriptEntryCard({
  textOriginal,
  textTranslated,
  originalLanguage,
  translatedLanguage,
  timestamp,
  role = 'provider',
}: TranscriptEntryProps) {
  const isPatient = role === 'patient';
  const primaryText = isPatient ? textTranslated : textOriginal;
  const secondaryText = isPatient ? textOriginal : textTranslated;
  const primaryLang = isPatient ? translatedLanguage : originalLanguage;
  const secondaryLang = isPatient ? originalLanguage : translatedLanguage;

  return (
    <div className="rounded-lg p-3 bg-muted/40">
      {timestamp && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
      <p className="transcript-text text-[length:var(--transcript-font-size,1rem)]" lang={LANG_ATTR[primaryLang]}>
        {primaryText}
      </p>
      {primaryText !== secondaryText && (
        <p className="text-[length:calc(var(--transcript-font-size,1rem)*0.8)] text-muted-foreground mt-1" lang={LANG_ATTR[secondaryLang]}>
          &rarr; {secondaryText}
        </p>
      )}
    </div>
  );
}

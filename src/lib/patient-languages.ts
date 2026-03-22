import type { SupportedLanguage } from '@/lib/types';

/** Languages patients can choose (join + session UI). */
export type PatientUiLanguage = 'ko-KR' | 'es-ES';

export const PATIENT_LANGUAGES: { value: PatientUiLanguage; label: string }[] = [
  { value: 'ko-KR', label: 'Korean (한국어)' },
  { value: 'es-ES', label: 'Spanish (Español)' },
];

export function isPatientUiLanguage(v: string): v is PatientUiLanguage {
  return v === 'ko-KR' || v === 'es-ES';
}

/** Map stored visit language to a patient-UI option (legacy English → Korean). */
export function toPatientUiLanguage(lang: SupportedLanguage): PatientUiLanguage {
  return lang === 'es-ES' ? 'es-ES' : 'ko-KR';
}

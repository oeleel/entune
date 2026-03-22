'use client';

import type { PatientUiLanguage } from '@/lib/patient-languages';
import { PATIENT_LANGUAGES } from '@/lib/patient-languages';

type PatientLanguageSelectProps = {
  id?: string;
  value: PatientUiLanguage;
  onChange: (value: PatientUiLanguage) => void;
  label: string;
  disabled?: boolean;
};

export function PatientLanguageSelect({
  id = 'patientLanguage',
  value,
  onChange,
  label,
  disabled = false,
}: PatientLanguageSelectProps) {
  return (
    <div className="entune-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="entune-input entune-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as PatientUiLanguage)}
      >
        {PATIENT_LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}

'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SupportedLanguage } from '@/lib/types';
import { PATIENT_LANGUAGES } from '@/lib/patient-languages';

export function LanguageSelector({
  value,
  onChange,
  label,
}: {
  value: SupportedLanguage;
  onChange: (value: SupportedLanguage) => void;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={(v) => onChange(v as SupportedLanguage)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PATIENT_LANGUAGES.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

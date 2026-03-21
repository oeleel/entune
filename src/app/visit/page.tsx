'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AuthGuard } from '@/components/shared/auth-guard';
import { LanguageSelector } from '@/components/visit/language-selector';
import { RecordingControls } from '@/components/visit/recording-controls';
import { TranscriptDisplay } from '@/components/visit/transcript-display';
import { CulturalFlagCard } from '@/components/visit/cultural-flag-card';
import { AudioPlayer } from '@/components/visit/audio-player';
import type { SupportedLanguage, TranscriptEntry, CulturalFlag } from '@/lib/types';

function VisitContent() {
  const [patientLanguage, setPatientLanguage] = useState<SupportedLanguage>('ko-KR');
  const [isListening, setIsListening] = useState(false);
  const [audioUrl] = useState<string | null>(null);

  // Placeholder data — Daniel will wire real speech recognition + translation
  const placeholderEntries: TranscriptEntry[] = [];
  const placeholderFlags: CulturalFlag[] = [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Entune — Visit</h1>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Language Selection */}
        <div className="flex items-end gap-6">
          <LanguageSelector
            value={patientLanguage}
            onChange={setPatientLanguage}
            label="Patient Language"
          />
          <div className="space-y-1">
            <label className="text-sm font-medium">Provider Language</label>
            <div className="h-9 px-3 flex items-center border rounded-md bg-muted text-sm">
              English (en-US)
            </div>
          </div>
          <RecordingControls
            isListening={isListening}
            onStart={() => setIsListening(true)}
            onStop={() => setIsListening(false)}
          />
          <AudioPlayer audioUrl={audioUrl} />
        </div>

        <Separator />

        {/* Transcript + Cultural Flags */}
        <div className="grid grid-cols-3 gap-6">
          {/* Provider Side */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Provider (English)</CardTitle>
            </CardHeader>
            <CardContent>
              <TranscriptDisplay
                entries={placeholderEntries.filter((e) => e.speaker === 'provider')}
              />
            </CardContent>
          </Card>

          {/* Patient Side */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">
                Patient ({patientLanguage})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TranscriptDisplay
                entries={placeholderEntries.filter((e) => e.speaker === 'patient')}
              />
            </CardContent>
          </Card>

          {/* Cultural Flags */}
          <div className="col-span-1 space-y-3">
            <h3 className="text-sm font-semibold">Cultural Flags</h3>
            {placeholderFlags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cultural context flags will appear here when detected...
              </p>
            ) : (
              placeholderFlags.map((flag, i) => (
                <CulturalFlagCard key={i} flag={flag} />
              ))
            )}
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button size="lg" variant="destructive">
            End Visit &amp; Generate Summary
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VisitPage() {
  return (
    <AuthGuard>
      <VisitContent />
    </AuthGuard>
  );
}

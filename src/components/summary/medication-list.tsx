'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Medication = {
  name: string;
  instructions: string;
  instructionsTranslated: string;
};

export function MedicationList({ medications }: { medications: Medication[] }) {
  if (medications.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {medications.map((med, i) => (
            <div key={i} className="border rounded-lg p-3">
              <p className="font-semibold">{med.name}</p>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <p className="text-sm text-muted-foreground">{med.instructions}</p>
                <p className="text-sm text-muted-foreground">{med.instructionsTranslated}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

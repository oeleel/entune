'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Visit = {
  id: string;
  languagePatient: string;
  languageProvider: string;
  startedAt: string;
  chiefComplaint?: string;
};

export function VisitCard({ visit }: { visit: Visit }) {
  return (
    <Link href={`/summary/${visit.id}`}>
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{new Date(visit.startedAt).toLocaleDateString()}</span>
            <div className="flex gap-1">
              <Badge variant="outline">{visit.languagePatient}</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="outline">{visit.languageProvider}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {visit.chiefComplaint ?? 'View visit summary'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

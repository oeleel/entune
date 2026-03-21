'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CulturalFlag } from '@/lib/types';

export function CulturalFlagCard({ flag }: { flag: CulturalFlag }) {
  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>Cultural Flag</span>
          <Badge variant="outline" className="text-amber-700 border-amber-400">
            {flag.term}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Literal: {flag.literal}
        </p>
        <p className="text-sm">{flag.clinicalContext}</p>
        {flag.screenFor.length > 0 && (
          <div>
            <p className="text-xs font-semibold">Screen for:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {flag.screenFor.map((item, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {flag.safetyNote && (
          <div className="bg-red-100 text-red-800 text-xs p-2 rounded">
            Safety: {flag.safetyNote}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

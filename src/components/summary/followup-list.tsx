'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FollowUp = {
  item: string;
  itemTranslated: string;
  date?: string;
};

export function FollowupList({ followUps }: { followUps: FollowUp[] }) {
  if (followUps.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-Up Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {followUps.map((fu, i) => (
            <div key={i} className="grid grid-cols-2 gap-4 border-b pb-2 last:border-0">
              <div>
                <p className="text-sm">{fu.item}</p>
                {fu.date && (
                  <p className="text-xs text-muted-foreground">Date: {fu.date}</p>
                )}
              </div>
              <p className="text-sm">{fu.itemTranslated}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MedicationList } from './medication-list';
import { FollowupList } from './followup-list';
import type { VisitSummary } from '@/lib/types';

export function SummaryView({ summary }: { summary: VisitSummary }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chief Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Provider Language</p>
              <p>{summary.chiefComplaint}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Patient Language</p>
              <p>{summary.chiefComplaintTranslated}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MedicationList medications={summary.medications} />

      <FollowupList followUps={summary.followUps} />

      {summary.warningSignsToWatchFor.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Warning Signs to Watch For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.warningSignsToWatchFor.map((ws, i) => (
                <div key={i} className="grid grid-cols-2 gap-4">
                  <p>{ws.sign}</p>
                  <p>{ws.signTranslated}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {summary.additionalNotes && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <p>{summary.additionalNotes}</p>
                <p>{summary.additionalNotesTranslated}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

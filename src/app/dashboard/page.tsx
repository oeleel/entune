'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AuthGuard } from '@/components/shared/auth-guard';
import { UserNav } from '@/components/shared/user-nav';
import { VisitHistoryList } from '@/components/dashboard/visit-history-list';
import { ChatInterface } from '@/components/dashboard/chat-interface';
import { useUser } from '@/hooks/use-user';
import { useChat } from '@/hooks/use-chat';

function DashboardContent() {
  const { user } = useUser();
  const { messages, isLoading, sendMessage } = useChat(
    user?.id ?? '',
    user?.preferredLanguage ?? 'en-US'
  );

  if (!user) return null;

  // Placeholder visits for the shell — will be replaced with real Supabase data
  const placeholderVisits = [
    {
      id: 'demo-1',
      languagePatient: 'ko-KR',
      languageProvider: 'en-US',
      startedAt: '2026-03-20T10:30:00Z',
      chiefComplaint: 'Patient reports chronic chest tightness and insomnia',
    },
    {
      id: 'demo-2',
      languagePatient: 'es-ES',
      languageProvider: 'en-US',
      startedAt: '2026-03-19T14:00:00Z',
      chiefComplaint: 'Patient reports recurring stomach pain and anxiety',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Entune</h1>
        <UserNav user={user} />
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              Welcome, {user.name.split(' ')[0]}
            </h2>
            <p className="text-muted-foreground">Your health visit dashboard</p>
          </div>
          <Link href="/visit">
            <Button size="lg">Start New Visit</Button>
          </Link>
        </div>

        <Separator />

        <section>
          <h3 className="text-lg font-semibold mb-4">Your Visit History</h3>
          <VisitHistoryList visits={placeholderVisits} />
        </section>

        <Separator />

        <section>
          <h3 className="text-lg font-semibold mb-4">Ask About Your Visits</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Ask questions about your past visits in any language. The AI will
            respond using only information from your documented visits.
          </p>
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
          />
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

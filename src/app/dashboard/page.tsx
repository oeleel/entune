'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { createSession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Globe,
  Plus,
  Search,
  Flag,
  FileText,
} from 'lucide-react';
import type { SupportedLanguage } from '@/lib/types';

const LANGUAGE_LABELS: Record<string, string> = {
  'en-US': 'English',
  'ko-KR': 'Korean',
  'es-ES': 'Spanish',
};

const LANG_SHORT: Record<string, string> = {
  'en-US': 'EN',
  'ko-KR': 'KO',
  'es-ES': 'ES',
};

type Visit = {
  id: string;
  language_patient: string;
  language_provider: string;
  status: string;
  patient_name: string | null;
  started_at: string;
  ended_at: string | null;
};

function formatDuration(start: string, end: string | null): string {
  const endTime = end ? new Date(end).getTime() : Date.now();
  const mins = Math.round((endTime - new Date(start).getTime()) / 60000);
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Calendar;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function VisitCard({ visit, onClick }: { visit: Visit; onClick: () => void }) {
  const isActive = visit.status === 'active';
  const isEnded = visit.status === 'ended';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Top row: date + status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium">
            {new Date(visit.started_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(visit.started_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Badge
          variant={isActive ? 'default' : isEnded ? 'secondary' : 'outline'}
          className={isActive ? 'animate-pulse' : ''}
        >
          {visit.status}
        </Badge>
      </div>

      {/* Patient name */}
      {visit.patient_name && (
        <p className="text-sm font-medium mb-2 truncate">
          {visit.patient_name}
        </p>
      )}

      {/* Info row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {LANG_SHORT[visit.language_patient] || visit.language_patient}
          {' \u2192 '}
          {LANG_SHORT[visit.language_provider] || visit.language_provider}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDuration(visit.started_at, visit.ended_at)}
        </span>
      </div>

      {/* Summary indicator for ended visits */}
      {isEnded && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-primary">
          <FileText className="h-3 w-3" />
          <span>Report available</span>
        </div>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('visits')
      .select(
        'id, language_patient, language_provider, status, patient_name, started_at, ended_at'
      )
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .then(({ data }) => {
        if (data) setVisits(data);
      });
  }, [user]);

  const filteredVisits = useMemo(
    () =>
      visits.filter((v) =>
        search
          ? v.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
            LANGUAGE_LABELS[v.language_patient]
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
            v.id.includes(search)
          : true
      ),
    [visits, search]
  );

  // Stats
  const now = new Date();
  const thisMonth = filteredVisits.filter((v) => {
    const d = new Date(v.started_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  async function handleStartSession() {
    setIsCreating(true);
    try {
      const { visitId, joinCode: code } = await createSession(
        patientLang,
        providerLang
      );
      setJoinCode(code);
      setTimeout(() => {
        router.push(`/session/doctor?visitId=${visitId}&joinCode=${code}`);
      }, 3000);
    } catch (err) {
      console.error('Failed to create session:', err);
      setIsCreating(false);
    }
  }

  if (!user) return null;

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user.name.split(' ')[0]}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="lg" />}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a New Session</DialogTitle>
              <DialogDescription>
                Select languages and share the join code with your patient.
              </DialogDescription>
            </DialogHeader>

            {!joinCode ? (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Patient Language
                  </label>
                  <Select
                    value={patientLang}
                    onValueChange={(v) =>
                      setPatientLang(v as SupportedLanguage)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko-KR">Korean</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Provider Language
                  </label>
                  <Select
                    value={providerLang}
                    onValueChange={(v) =>
                      setProviderLang(v as SupportedLanguage)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English</SelectItem>
                      <SelectItem value="ko-KR">Korean</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartSession}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Share this code with your patient:
                </p>
                <p className="text-5xl font-mono font-bold tracking-[0.3em] text-primary">
                  {joinCode}
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to session...
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Visits"
          value={visits.length}
          icon={Calendar}
        />
        <StatCard
          label="This Month"
          value={thisMonth.length}
          icon={Clock}
        />
        <StatCard
          label="Languages Used"
          value={
            new Set(
              visits.flatMap((v) => [v.language_patient, v.language_provider])
            ).size
          }
          icon={Globe}
        />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by patient name, language, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Visit card grid */}
      {filteredVisits.length === 0 ? (
        <div className="rounded-xl border py-16 text-center text-muted-foreground">
          {visits.length === 0
            ? 'No visits yet. Start a new session to begin.'
            : 'No visits match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.map((v) => (
            <VisitCard
              key={v.id}
              visit={v}
              onClick={() => router.push(`/dashboard/visit/${v.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

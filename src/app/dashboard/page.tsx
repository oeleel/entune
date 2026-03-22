'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { createSession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { UserNav } from '@/components/shared/user-nav';
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import type { SupportedLanguage } from '@/lib/types';

const LANGUAGE_LABELS: Record<string, string> = {
  'en-US': 'English',
  'ko-KR': 'Korean',
  'es-ES': 'Spanish',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  waiting: 'outline',
  active: 'default',
  ended: 'secondary',
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

type SortKey = 'started_at' | 'patient_name' | 'languages' | 'status';
type SortDir = 'asc' | 'desc';

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />;
  return sortDir === 'asc'
    ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
    : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
}

function DashboardContent() {
  const { user } = useUser();
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('started_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('visits')
      .select('id, language_patient, language_provider, status, patient_name, started_at, ended_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .then(({ data }) => {
        if (data) setVisits(data);
      });
  }, [user]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [search]);

  const filteredVisits = visits.filter((v) =>
    search
      ? v.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.language_patient.toLowerCase().includes(search.toLowerCase()) ||
        v.id.includes(search)
      : true
  );

  const sortedVisits = useMemo(() => {
    const sorted = [...filteredVisits];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'started_at':
          cmp = new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
          break;
        case 'patient_name':
          cmp = (a.patient_name || '').localeCompare(b.patient_name || '');
          break;
        case 'languages': {
          const langA = `${a.language_patient} ${a.language_provider}`;
          const langB = `${b.language_patient} ${b.language_provider}`;
          cmp = langA.localeCompare(langB);
          break;
        }
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredVisits, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === sortedVisits.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedVisits.map((v) => v.id)));
    }
  }

  const allSelected = sortedVisits.length > 0 && selectedIds.size === sortedVisits.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < sortedVisits.length;

  async function handleBulkDelete() {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const ids = [...selectedIds];
      const { error } = await supabase.from('visits').delete().in('id', ids);
      if (!error) {
        setVisits((prev) => prev.filter((v) => !selectedIds.has(v.id)));
        setSelectedIds(new Set());
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  async function handleStartSession() {
    setIsCreating(true);
    try {
      const { visitId, joinCode: code } = await createSession(patientLang, providerLang);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Entune</h1>
            <p className="text-sm text-muted-foreground">Doctor Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button size="lg" />}>
                + New Session
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
                      <label className="text-sm font-medium">Patient Language</label>
                      <Select value={patientLang} onValueChange={(v) => setPatientLang(v as SupportedLanguage)}>
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
                      <label className="text-sm font-medium">Provider Language</label>
                      <Select value={providerLang} onValueChange={(v) => setProviderLang(v as SupportedLanguage)}>
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
                    <p className="text-sm text-muted-foreground">Share this code with your patient:</p>
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
            <UserNav user={user} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Past Visits</h2>
            <span className="text-sm text-muted-foreground">
              {visits.length} visit{visits.length !== 1 ? 's' : ''}
            </span>
          </div>

          <Input
            type="text"
            placeholder="Search by patient name, language, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} visit{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete selected
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {selectedIds.size} visit{selectedIds.size !== 1 ? 's' : ''}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the selected visits, including their transcripts and reports. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {sortedVisits.length === 0 ? (
            <div className="rounded-lg border py-12 text-center text-muted-foreground">
              {visits.length === 0
                ? 'No visits yet. Start a new session to begin.'
                : 'No visits match your search.'}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onCheckedChange={() => toggleSelectAll()}
                        aria-label="Select all visits"
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        className="inline-flex items-center font-medium hover:text-foreground"
                        onClick={() => handleSort('started_at')}
                      >
                        Date
                        <SortIcon column="started_at" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="inline-flex items-center font-medium hover:text-foreground"
                        onClick={() => handleSort('patient_name')}
                      >
                        Patient
                        <SortIcon column="patient_name" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="inline-flex items-center font-medium hover:text-foreground"
                        onClick={() => handleSort('languages')}
                      >
                        Languages
                        <SortIcon column="languages" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="inline-flex items-center font-medium hover:text-foreground"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        <SortIcon column="status" sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVisits.map((v) => (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer"
                      data-state={selectedIds.has(v.id) ? 'selected' : undefined}
                      onClick={() => router.push(`/dashboard/visit/${v.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(v.id)}
                          onCheckedChange={() => toggleSelect(v.id)}
                          aria-label={`Select visit ${v.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {new Date(v.started_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(v.started_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {v.patient_name || <span className="text-muted-foreground">--</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {LANGUAGE_LABELS[v.language_patient] || v.language_patient}
                        {' \u2192 '}
                        {LANGUAGE_LABELS[v.language_provider] || v.language_provider}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[v.status] || 'outline'}>
                          {v.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
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

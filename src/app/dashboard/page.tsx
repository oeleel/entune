'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { createSession, deleteVisits } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Plus,
  Search,
  FileText,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import type { SupportedLanguage } from '@/lib/types';

const LANGUAGE_LABELS: Record<string, string> = {
  'en-US': 'English',
  'ko-KR': 'Korean',
  'es-ES': 'Spanish',
};

const LANG_FLAG: Record<string, string> = {
  'en-US': '\u{1F1FA}\u{1F1F8}',
  'ko-KR': '\u{1F1F0}\u{1F1F7}',
  'es-ES': '\u{1F1EA}\u{1F1F8}',
};

const LANG_SHORT: Record<string, string> = {
  'en-US': 'ENG',
  'ko-KR': 'KOR',
  'es-ES': 'ES',
};

type Visit = {
  id: string;
  language_patient: string;
  language_provider: string;
  status: string;
  patient_name: string | null;
  patient_email: string | null;
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


function VisitCard({
  visit,
  onClick,
  selectMode,
  selected,
  onToggleSelect,
  onReportClick,
}: {
  visit: Visit;
  onClick: () => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onReportClick?: () => void;
}) {
  const isEnded = visit.status === 'ended';

  return (
    <button
      onClick={selectMode ? onToggleSelect : onClick}
      className={cn(
        'w-full h-full text-left rounded-xl border bg-card p-3 flex flex-col justify-between transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selectMode && selected && 'border-primary ring-2 ring-primary/20',
        !selectMode && 'hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30'
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {selectMode && (
            <div
              role="checkbox"
              aria-checked={selected}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              className="shrink-0"
            >
              <Checkbox checked={selected} tabIndex={-1} className="pointer-events-none" />
            </div>
          )}
          <p className="text-base font-bold truncate min-w-0">
            {visit.patient_name || 'Unknown Patient'}
          </p>
        </div>
        {/* Date */}
        <p className="text-xs text-muted-foreground text-right shrink-0">
          {new Date(visit.started_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          {' \u00B7 '}
          {new Date(visit.started_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>

      {visit.patient_email && (
        <p className="text-xs text-muted-foreground truncate">
          {visit.patient_email}
        </p>
      )}

      {/* Language row */}
      <div className="flex items-center text-sm text-muted-foreground mt-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="text-sm">{LANG_FLAG[visit.language_patient]}</span>
          <span className="font-medium text-xs">{LANG_SHORT[visit.language_patient] || visit.language_patient}</span>
          <span className="text-muted-foreground/60 text-xs">&rarr;</span>
          <span className="text-sm">{LANG_FLAG[visit.language_provider]}</span>
          <span className="font-medium text-xs">{LANG_SHORT[visit.language_provider] || visit.language_provider}</span>
        </span>
      </div>

      {/* Bottom row: report + duration */}
      <div className="flex items-center justify-between mt-1.5">
        {isEnded ? (
          <span
            role="link"
            tabIndex={0}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onReportClick?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                onReportClick?.();
              }
            }}
          >
            <FileText className="h-3 w-3" />
            Report available
          </span>
        ) : (
          <div />
        )}
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDuration(visit.started_at, visit.ended_at)}
        </span>
      </div>
    </button>
  );
}

// --- Calendar helpers ---

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function MonthCalendar({
  visits,
  onSelectDate,
  selectedDate,
}: {
  visits: Visit[];
  onSelectDate: (dateKey: string | null) => void;
  selectedDate: string | null;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const visitsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of visits) {
      const key = toDateKey(new Date(v.started_at));
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [visits]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthLabel = new Date(year, month).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function prevMonth() {
    onSelectDate(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    onSelectDate(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const todayKey = toDateKey(now);

  return (
    <div className="rounded-xl border bg-card p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-2">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`sp-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count = visitsByDate[dateKey] || 0;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(isSelected ? null : dateKey)}
              className={cn(
                'relative flex flex-col items-center justify-center py-2 rounded-md text-sm transition-colors',
                isToday && !isSelected && 'font-bold text-primary',
                isSelected && 'bg-primary text-primary-foreground',
                !isSelected && count > 0 && 'hover:bg-muted',
                !isSelected && count === 0 && 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              {day}
              {count > 0 && (
                <span
                  className={cn(
                    'mt-0.5 h-1.5 w-1.5 rounded-full',
                    isSelected ? 'bg-primary-foreground' : 'bg-primary'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Empty state ---

function EmptyState({ hasVisits }: { hasVisits: boolean }) {
  return (
    <div className="rounded-xl border py-16 text-center text-muted-foreground">
      {hasVisits
        ? 'No visits match your search.'
        : 'No visits yet. Start a new session to begin.'}
    </div>
  );
}

// --- Main page ---

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarPage, setCalendarPage] = useState(0);
  const CARDS_PER_PAGE = 8;

  // Delete / select mode state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; name?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('visits')
      .select(
        'id, language_patient, language_provider, status, patient_name, patient_email, started_at, ended_at'
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
            v.patient_email?.toLowerCase().includes(search.toLowerCase()) ||
            LANGUAGE_LABELS[v.language_patient]
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
            v.id.includes(search)
          : true
      ),
    [visits, search]
  );

  const calendarVisits = useMemo(() => {
    setCalendarPage(0);
    if (!selectedDate) return filteredVisits;
    return filteredVisits.filter(
      (v) => toDateKey(new Date(v.started_at)) === selectedDate
    );
  }, [filteredVisits, selectedDate]);

  const totalCalendarPages = Math.max(1, Math.ceil(calendarVisits.length / CARDS_PER_PAGE));
  const paginatedVisits = calendarVisits.slice(
    calendarPage * CARDS_PER_PAGE,
    (calendarPage + 1) * CARDS_PER_PAGE
  );

  // --- Selection helpers ---

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelectMode() {
    if (selectMode) {
      exitSelectMode();
    } else {
      setSelectMode(true);
    }
  }

  // --- Delete handler ---

  async function handleDelete(ids: string[]) {
    setIsDeleting(true);
    try {
      const { count } = await deleteVisits(ids);
      // Optimistically remove from state
      setVisits((prev) => prev.filter((v) => !ids.includes(v.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
      toast.success(
        count === 1 ? 'Visit deleted' : `${count} visits deleted`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete visits'
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

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
      alert(err instanceof Error ? err.message : 'Failed to create session');
      setIsCreating(false);
    }
  }

  async function handleOpenReport(visitId: string, patientName: string | null) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('visit_summaries')
        .select('doctor_report')
        .eq('visit_id', visitId)
        .single();

      if (!data?.doctor_report) {
        toast.error('Report not found for this visit.');
        return;
      }

      const { createElement } = await import('react');
      const { DoctorReportPdf } = await import('@/lib/pdf/doctor-report-pdf');
      const { pdf } = await import('@react-pdf/renderer');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(
        createElement(DoctorReportPdf, { report: data.doctor_report, patientName }) as any
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to generate report.');
    }
  }

  if (!user) return <DashboardSkeleton />;

  return (
    <div className="p-6 md:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="lg" className="h-12 px-6 text-base" />}>
            <Plus className="mr-2 h-5 w-5" />
            New Session
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {!joinCode ? (
              <div className="space-y-5">
                <DialogHeader className="text-center items-center">
                  <DialogTitle className="text-xl">New Session</DialogTitle>
                  <DialogDescription>
                    Choose the languages for this visit.
                  </DialogDescription>
                </DialogHeader>

                {/* Language selectors — centered around arrow */}
                <div className="flex items-end justify-center gap-4">
                  <div className="space-y-1.5 w-[160px]">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center block">
                      Patient
                    </label>
                    <Select
                      value={patientLang}
                      onValueChange={(v) =>
                        setPatientLang(v as SupportedLanguage)
                      }
                    >
                      <SelectTrigger className="w-full">
                        {LANGUAGE_LABELS[patientLang] || patientLang}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko-KR">Korean</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-muted-foreground pb-2">&rarr;</span>
                  <div className="space-y-1.5 w-[160px]">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center block">
                      Provider
                    </label>
                    <Select
                      value={providerLang}
                      onValueChange={(v) =>
                        setProviderLang(v as SupportedLanguage)
                      }
                    >
                      <SelectTrigger className="w-full">
                        {LANGUAGE_LABELS[providerLang] || providerLang}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English</SelectItem>
                        <SelectItem value="ko-KR">Korean</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartSession}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Start Session'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-xl">Session Created</DialogTitle>
                  <DialogDescription>
                    Share this code with your patient to join.
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-xl bg-muted/50 border py-6 px-4">
                  <p className="text-5xl font-mono font-bold tracking-[0.3em] text-primary">
                    {joinCode}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                  Redirecting to session...
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Select toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by patient name, email, language, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 text-base rounded-xl border-2 focus-visible:border-primary"
          />
        </div>
        <Button
          variant={selectMode ? 'default' : 'outline'}
          size="lg"
          className="h-12 shrink-0"
          onClick={toggleSelectMode}
        >
          <CheckSquare className="mr-2 h-4 w-4" />
          Select
        </Button>
      </div>

      {/* View tabs */}
      <Tabs defaultValue={0}>
        <TabsList className="mb-4">
          <TabsTrigger value={0}>
            <CalendarDays className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value={1}>
            <Table2 className="h-4 w-4" />
            Table
          </TabsTrigger>
        </TabsList>

        {/* Calendar view */}
        <TabsContent value={0}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 lg:items-start">
            <MonthCalendar
              visits={filteredVisits}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <div>
              {selectedDate && (
                <p className="text-sm text-muted-foreground mb-3">
                  {calendarVisits.length} visit
                  {calendarVisits.length !== 1 ? 's' : ''} on{' '}
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(
                    'en-US',
                    { month: 'long', day: 'numeric', year: 'numeric' }
                  )}
                </p>
              )}
              {calendarVisits.length === 0 ? (
                <div className="rounded-xl border py-16 text-center text-muted-foreground">
                  {selectedDate
                    ? 'No visits on this date.'
                    : visits.length === 0
                      ? 'No visits yet. Start a new session to begin.'
                      : 'Select a date to filter visits.'}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-4 gap-4 sm:auto-rows-[1fr]">
                    {paginatedVisits.map((v) => (
                      <ContextMenu key={v.id}>
                        <ContextMenuTrigger className="flex">
                          <VisitCard
                            visit={v}
                            onClick={() => router.push(`/dashboard/visit/${v.id}`)}
                            selectMode={selectMode}
                            selected={selectedIds.has(v.id)}
                            onToggleSelect={() => toggleSelect(v.id)}
                            onReportClick={() => handleOpenReport(v.id, v.patient_name)}
                          />
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => router.push(`/dashboard/visit/${v.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => {
                              setSelectMode(true);
                              setSelectedIds((prev) => new Set(prev).add(v.id));
                            }}
                          >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Select
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            variant="destructive"
                            onClick={() =>
                              setDeleteTarget({
                                ids: [v.id],
                                name: v.patient_name || undefined,
                              })
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Visit
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                  {totalCalendarPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCalendarPage((p) => p - 1)}
                        disabled={calendarPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {calendarPage + 1} / {totalCalendarPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCalendarPage((p) => p + 1)}
                        disabled={calendarPage >= totalCalendarPages - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Table view */}
        <TabsContent value={1}>
          {filteredVisits.length === 0 ? (
            <EmptyState hasVisits={visits.length > 0} />
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectMode && (
                      <TableHead className="w-10">
                        <div
                          role="checkbox"
                          aria-checked={
                            filteredVisits.length > 0 &&
                            filteredVisits.every((v) => selectedIds.has(v.id))
                          }
                          onClick={() => {
                            const allSelected =
                              filteredVisits.length > 0 &&
                              filteredVisits.every((v) => selectedIds.has(v.id));
                            if (allSelected) {
                              setSelectedIds(new Set());
                            } else {
                              setSelectedIds(
                                new Set(filteredVisits.map((v) => v.id))
                              );
                            }
                          }}
                        >
                          <Checkbox
                            checked={
                              filteredVisits.length > 0 &&
                              filteredVisits.every((v) => selectedIds.has(v.id))
                            }
                            tabIndex={-1}
                            className="pointer-events-none"
                          />
                        </div>
                      </TableHead>
                    )}
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Languages</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((v) => (
                    <ContextMenu key={v.id}>
                      <ContextMenuTrigger
                        render={
                          <TableRow
                            className="cursor-pointer"
                            onClick={() =>
                              selectMode
                                ? toggleSelect(v.id)
                                : router.push(`/dashboard/visit/${v.id}`)
                            }
                          />
                        }
                      >
                        {selectMode && (
                          <TableCell className="w-10">
                            <div
                              role="checkbox"
                              aria-checked={selectedIds.has(v.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelect(v.id);
                              }}
                            >
                              <Checkbox checked={selectedIds.has(v.id)} tabIndex={-1} className="pointer-events-none" />
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          {new Date(v.started_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          {new Date(v.started_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>{v.patient_name || '\u2014'}</TableCell>
                        <TableCell className="text-muted-foreground">{v.patient_email || '\u2014'}</TableCell>
                        <TableCell>
                          {LANG_SHORT[v.language_patient] || v.language_patient}
                          {' \u2192 '}
                          {LANG_SHORT[v.language_provider] || v.language_provider}
                        </TableCell>
                        <TableCell>
                          {formatDuration(v.started_at, v.ended_at)}
                        </TableCell>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => router.push(`/dashboard/visit/${v.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => {
                            setSelectMode(true);
                            setSelectedIds((prev) => new Set(prev).add(v.id));
                          }}
                        >
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Select
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          variant="destructive"
                          onClick={() =>
                            setDeleteTarget({
                              ids: [v.id],
                              name: v.patient_name || undefined,
                            })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Visit
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

      </Tabs>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg">
          <span className="text-sm font-medium tabular-nums">
            {selectedIds.size} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedIds(new Set(filteredVisits.map((v) => v.id)))}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              setDeleteTarget({ ids: Array.from(selectedIds) })
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={exitSelectMode}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget && deleteTarget.ids.length === 1
                ? deleteTarget.name
                  ? `Delete visit with ${deleteTarget.name}?`
                  : 'Delete this visit?'
                : `Delete ${deleteTarget?.ids.length} visits?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              {deleteTarget && deleteTarget.ids.length === 1
                ? 'this visit'
                : 'these visits'}
              , including transcripts, reports, and all associated data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget.ids);
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

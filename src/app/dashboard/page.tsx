'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { useUser } from '@/hooks/use-user';
import { useChat } from '@/hooks/use-chat';
import { createClient } from '@/lib/supabase/client';
import { createSession } from '@/lib/api';
import type { SupportedLanguage } from '@/lib/types';

type Visit = {
  id: string;
  language_patient: string;
  language_provider: string;
  status: string;
  patient_name: string | null;
  started_at: string;
  ended_at: string | null;
};

function DashboardContent() {
  const { user } = useUser();
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [search, setSearch] = useState('');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');

  const { messages, isLoading, sendMessage, clearMessages } = useChat(
    user?.id ?? '',
    user?.preferredLanguage ?? 'en-US',
    selectedVisitId ?? undefined
  );

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

  const filteredVisits = visits.filter((v) =>
    search
      ? v.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.language_patient.toLowerCase().includes(search.toLowerCase()) ||
        v.id.includes(search)
      : true
  );

  async function handleStartSession() {
    try {
      const { visitId, joinCode: code } = await createSession(patientLang, providerLang);
      setJoinCode(code);
      // Navigate to doctor session after showing code briefly
      setTimeout(() => {
        router.push(`/session/doctor?visitId=${visitId}&joinCode=${code}`);
      }, 2000);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  }

  function handleVisitClick(visitId: string) {
    if (selectedVisitId === visitId) {
      setSelectedVisitId(null);
      clearMessages();
    } else {
      setSelectedVisitId(visitId);
      clearMessages();
    }
  }

  if (!user) return null;

  return (
    <div>
      <h1>Entune Dashboard</h1>
      <p>Welcome, {user.name}</p>

      <hr />

      <h2>Start New Session</h2>
      <div>
        <label>
          Patient Language:{' '}
          <select value={patientLang} onChange={(e) => setPatientLang(e.target.value as SupportedLanguage)}>
            <option value="ko-KR">Korean</option>
            <option value="es-ES">Spanish</option>
            <option value="en-US">English</option>
          </select>
        </label>
        <label>
          {' '}Provider Language:{' '}
          <select value={providerLang} onChange={(e) => setProviderLang(e.target.value as SupportedLanguage)}>
            <option value="en-US">English</option>
            <option value="ko-KR">Korean</option>
            <option value="es-ES">Spanish</option>
          </select>
        </label>
        <button onClick={handleStartSession}>Start Session</button>
      </div>
      {joinCode && (
        <div>
          <strong>Join Code: {joinCode}</strong>
          <p>Share this code with the patient. Redirecting to session...</p>
        </div>
      )}

      <hr />

      <h2>Past Visits</h2>
      <input
        type="text"
        placeholder="Search visits..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Patient Language</th>
            <th>Provider Language</th>
            <th>Patient</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredVisits.map((v) => (
            <tr
              key={v.id}
              onClick={() => handleVisitClick(v.id)}
              style={{ cursor: 'pointer', background: selectedVisitId === v.id ? '#eee' : undefined }}
            >
              <td>{new Date(v.started_at).toLocaleDateString()}</td>
              <td>{v.language_patient}</td>
              <td>{v.language_provider}</td>
              <td>{v.patient_name || '—'}</td>
              <td>{v.status}</td>
            </tr>
          ))}
          {filteredVisits.length === 0 && (
            <tr>
              <td colSpan={5}>No visits found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedVisitId && (
        <>
          <hr />
          <h2>Chat about Visit</h2>
          <div>
            {messages.map((m) => (
              <div key={m.id}>
                <strong>{m.role}:</strong> {m.content}
              </div>
            ))}
            {isLoading && <p>Thinking...</p>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('chatInput') as HTMLInputElement;
              if (input.value.trim()) {
                sendMessage(input.value.trim());
                input.value = '';
              }
            }}
          >
            <input name="chatInput" type="text" placeholder="Ask about this visit..." />
            <button type="submit" disabled={isLoading}>Send</button>
          </form>
        </>
      )}
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinSession } from '@/lib/api';

export default function JoinPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      const { visitId } = await joinSession(
        joinCode.trim(),
        patientName.trim() || undefined,
        patientEmail.trim() || undefined
      );
      router.push(`/session/patient?visitId=${visitId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
      setIsJoining(false);
    }
  }

  return (
    <main>
      <h1>Join a Session</h1>
      <p>Enter the 6-digit code from your doctor.</p>

      <form onSubmit={handleJoin}>
        <div>
          <label>
            Join Code:{' '}
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Name (optional):{' '}
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Your name"
            />
          </label>
        </div>
        <div>
          <label>
            Email (optional):{' '}
            <input
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </label>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={isJoining}>
          {isJoining ? 'Joining...' : 'Join Session'}
        </button>
      </form>
    </main>
  );
}

import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Entune</h1>
      <p>Real-time bilingual translation for healthcare visits.</p>
      <div>
        <Link href="/login">
          <button>I&apos;m a Doctor</button>
        </Link>
        <Link href="/join">
          <button>I&apos;m a Patient</button>
        </Link>
      </div>
    </main>
  );
}

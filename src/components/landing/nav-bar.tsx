'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0b1a2b]/80 backdrop-blur-xl border-b border-white/6'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/about"
          className="flex items-center gap-2 text-xl font-bold tracking-[0.08em] lowercase text-[var(--entune-text)] hover:text-[var(--entune-teal)] transition-colors"
          style={{ fontFamily: 'var(--font-entune-display), ui-serif, Georgia, serif' }}
        >
          <Image
            src="/LogoFr.png"
            alt=""
            width={100}
            height={392}
            className="h-7 w-auto"
          />
          entune
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--entune-text-mid)] hover:text-[var(--entune-text)] transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold bg-[var(--entune-teal)] text-[var(--entune-bg)] px-5 py-2.5 rounded-xl hover:shadow-[0_6px_24px_rgba(135,211,218,0.25)] hover:-translate-y-px transition-all"
          >
            Start a Visit
          </Link>
        </div>
      </div>
    </nav>
  );
}

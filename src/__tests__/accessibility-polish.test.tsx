import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TranscriptContainer } from '@/components/visit/transcript-container';
import { TranscriptEntryCard } from '@/components/visit/transcript-entry';
import { CulturalFlagCard } from '@/components/visit/cultural-flag-card';
import { SessionTopBar } from '@/components/visit/session-top-bar';
import type { CulturalFlag, TranscriptEntry } from '@/lib/types';

afterEach(cleanup);

// --- aria-live on transcript container ---

describe('Accessibility — Transcript Container', () => {
  it('has aria-live="polite" on the scrollable region', () => {
    const { container } = render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );
    const scrollDiv = container.querySelector('[aria-live="polite"]');
    expect(scrollDiv).not.toBeNull();
    expect(scrollDiv!.getAttribute('aria-live')).toBe('polite');
  });

  it('has aria-label describing the live region', () => {
    const { container } = render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );
    const scrollDiv = container.querySelector('[aria-label="Live transcript"]');
    expect(scrollDiv).not.toBeNull();
  });
});

// --- lang attributes ---

describe('Accessibility — Language Attributes', () => {
  it('sets lang="ko" on Korean text', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello"
        textTranslated="안녕하세요"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />
    );
    expect(screen.getByText('안녕하세요')).toHaveAttribute('lang', 'ko');
  });

  it('sets lang="es" on Spanish text', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello"
        textTranslated="Hola"
        originalLanguage="en-US"
        translatedLanguage="es-ES"
      />
    );
    expect(screen.getByText('Hola')).toHaveAttribute('lang', 'es');
  });
});

// --- Cultural flag card accessibility ---

describe('Accessibility — Cultural Flag Cards', () => {
  const safetyFlag: CulturalFlag = {
    term: 'susto',
    originalLanguage: 'es-ES',
    literal: 'Fright sickness',
    clinicalContext: 'Latin American folk illness.',
    screenFor: ['PTSD'],
    safetyNote: 'Assess for suicidal ideation.',
  };

  it('safety-critical flags have role="alert"', () => {
    render(<CulturalFlagCard flag={safetyFlag} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('non-safety flags have role="status"', () => {
    const infoFlag: CulturalFlag = {
      term: '체했다',
      originalLanguage: 'ko-KR',
      literal: 'Food is stuck',
      clinicalContext: 'Korean indigestion concept.',
      screenFor: [],
      safetyNote: null,
    };
    render(<CulturalFlagCard flag={infoFlag} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// --- Touch targets ---

describe('Accessibility — Touch Targets', () => {
  it('font-size toggle button has min-w-[44px] for touch target', () => {
    const { container } = render(
      <SessionTopBar
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        isRecording={false}
      />
    );
    const fontBtn = screen.getByLabelText(/font size/i);
    expect(fontBtn.classList.contains('min-w-[44px]')).toBe(true);
    expect(fontBtn.classList.contains('h-8')).toBe(true);
  });

  it('End Visit button has min-w-[44px] for touch target', () => {
    render(
      <SessionTopBar
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        isRecording={false}
        onEndVisit={() => {}}
      />
    );
    const endBtn = screen.getByText('End Visit');
    expect(endBtn.classList.contains('min-w-[44px]')).toBe(true);
  });
});

// --- Font-size toggle ---

describe('Accessibility — Font Size Toggle', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--transcript-font-size');
  });

  it('shows A+ label initially (normal font size)', () => {
    render(
      <SessionTopBar
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        isRecording={false}
      />
    );
    expect(screen.getByText('A+')).toBeInTheDocument();
  });

  it('toggles to large font and shows A label after click', () => {
    render(
      <SessionTopBar
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        isRecording={false}
      />
    );
    const btn = screen.getByLabelText(/font size/i);
    fireEvent.click(btn);
    expect(screen.getByText('A')).toBeInTheDocument();
    // CSS variable should be set to large
    expect(
      document.documentElement.style.getPropertyValue('--transcript-font-size')
    ).toBe('1.25rem');
  });

  it('toggles back to normal font size on second click', () => {
    render(
      <SessionTopBar
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        isRecording={false}
      />
    );
    const btn = screen.getByLabelText(/font size/i);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.getByText('A+')).toBeInTheDocument();
    expect(
      document.documentElement.style.getPropertyValue('--transcript-font-size')
    ).toBe('1rem');
  });

  it('font-size button has accessible label describing the action', () => {
    render(
      <SessionTopBar
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        isRecording={false}
      />
    );
    const btn = screen.getByLabelText('Increase font size');
    expect(btn).toBeInTheDocument();
  });
});

// --- Keyboard navigation ---

describe('Accessibility — Keyboard Navigation', () => {
  it('font-size toggle is focusable via Tab (is a button)', () => {
    render(
      <SessionTopBar
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        isRecording={false}
      />
    );
    const btn = screen.getByLabelText(/font size/i);
    expect(btn.tagName).toBe('BUTTON');
  });

  it('End Visit button is focusable (is a button element)', () => {
    render(
      <SessionTopBar
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        isRecording={false}
        onEndVisit={() => {}}
      />
    );
    const btn = screen.getByText('End Visit');
    expect(btn.tagName).toBe('BUTTON');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TranscriptContainer } from '@/components/visit/transcript-container';
import { TranscriptEntryCard } from '@/components/visit/transcript-entry';
import type { TranscriptEntry } from '@/lib/types';

// Mock scrollIntoView for happy-dom
beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

function makeEntry(overrides: Partial<TranscriptEntry> = {}): TranscriptEntry {
  return {
    textEnglish: 'I have been feeling dizzy lately.',
    textPatientLang: '최근에 어지러움을 느끼고 있어요.',
    culturalFlag: null,
    audioUrl: null,
    timestamp: new Date().toISOString(),
    speaker: 'patient',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TranscriptEntryCard
// ---------------------------------------------------------------------------

describe('TranscriptEntryCard — labels and structure', () => {
  it('renders "Original" label with original text', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello doctor"
        textTranslated="안녕하세요 의사 선생님"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />,
    );

    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Hello doctor')).toBeInTheDocument();
  });

  it('renders "Translation" label with translated text', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello doctor"
        textTranslated="안녕하세요 의사 선생님"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />,
    );

    expect(screen.getByText('Translation')).toBeInTheDocument();
    expect(screen.getByText('안녕하세요 의사 선생님')).toBeInTheDocument();
  });

  it('applies .transcript-text class to both original and translated text', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello doctor"
        textTranslated="안녕하세요 의사 선생님"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />,
    );

    const original = screen.getByText('Hello doctor');
    const translated = screen.getByText('안녕하세요 의사 선생님');
    expect(original).toHaveClass('transcript-text');
    expect(translated).toHaveClass('transcript-text');
  });

  it('sets correct lang attributes for bilingual accessibility (en-US → en, ko-KR → ko)', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello doctor"
        textTranslated="안녕하세요 의사 선생님"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />,
    );

    expect(screen.getByText('Hello doctor')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('안녕하세요 의사 선생님')).toHaveAttribute('lang', 'ko');
  });

  it('sets lang="es" for Spanish language (es-ES → es)', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello"
        textTranslated="Hola"
        originalLanguage="en-US"
        translatedLanguage="es-ES"
      />,
    );

    expect(screen.getByText('Hola')).toHaveAttribute('lang', 'es');
  });

  it('renders Original section before Translation section in DOM order', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello doctor"
        textTranslated="안녕하세요 의사 선생님"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />,
    );

    const original = screen.getByText('Original');
    const translation = screen.getByText('Translation');

    expect(
      original.compareDocumentPosition(translation) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('hides translation section when original equals translated (one child section only)', () => {
    const { container } = render(
      <TranscriptEntryCard
        textOriginal="Hello"
        textTranslated="Hello"
        originalLanguage="en-US"
        translatedLanguage="en-US"
      />,
    );

    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.queryByText('Translation')).not.toBeInTheDocument();
    // Only Original section rendered (no Translation div)
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.children).toHaveLength(1);
  });

  it('renders border-b separator and two content sections for bilingual entry', () => {
    const { container } = render(
      <TranscriptEntryCard
        textOriginal="Hello"
        textTranslated="안녕하세요"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    // Spec: "Faint border-b between entries"
    expect(wrapper).toHaveClass('border-b');
    // Two child divs: Original section + Translation section
    expect(wrapper.children).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// TranscriptContainer — rendering
// ---------------------------------------------------------------------------

describe('TranscriptContainer — rendering', () => {
  it('shows default empty message when transcript is empty', () => {
    render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    expect(screen.getByText('Waiting for conversation to begin...')).toBeInTheDocument();
  });

  it('shows custom empty message when provided', () => {
    render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        emptyMessage="Listening... speak naturally."
      />,
    );

    expect(screen.getByText('Listening... speak naturally.')).toBeInTheDocument();
  });

  it('does not show empty message when transcript has entries', () => {
    const entries = [makeEntry({ textEnglish: 'Hello', textPatientLang: '안녕하세요' })];

    render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    expect(screen.queryByText('Waiting for conversation to begin...')).not.toBeInTheDocument();
  });

  it('does not show empty message when only interim text is present', () => {
    render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        interimText="Speaking now..."
      />,
    );

    expect(screen.queryByText('Waiting for conversation to begin...')).not.toBeInTheDocument();
  });

  it('renders transcript entries with Original/Translation labels', () => {
    const entries: TranscriptEntry[] = [
      makeEntry({ textEnglish: 'I feel dizzy', textPatientLang: '어지러워요' }),
    ];

    render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('I feel dizzy')).toBeInTheDocument();
    expect(screen.getByText('Translation')).toBeInTheDocument();
    expect(screen.getByText('어지러워요')).toBeInTheDocument();
  });

  it('renders correct number of entries for a multi-entry transcript', () => {
    const entries = Array.from({ length: 4 }, (_, i) =>
      makeEntry({ textEnglish: `Entry ${i + 1}`, textPatientLang: `항목 ${i + 1}` }),
    );

    render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    expect(screen.getAllByText('Original')).toHaveLength(4);
    expect(screen.getAllByText('Translation')).toHaveLength(4);
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByText(`Entry ${i}`)).toBeInTheDocument();
      expect(screen.getByText(`항목 ${i}`)).toBeInTheDocument();
    }
  });

  it('passes provider language as original and patient language as translated via lang attrs', () => {
    const entries = [
      makeEntry({ textEnglish: 'Take this twice daily.', textPatientLang: '하루에 두 번 복용하세요.' }),
    ];

    render(
      <TranscriptContainer
        transcript={entries}
        providerLanguage="en-US"
        patientLanguage="ko-KR"
      />,
    );

    expect(screen.getByText('Take this twice daily.')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('하루에 두 번 복용하세요.')).toHaveAttribute('lang', 'ko');
  });

  it('renders interim text in italic when provided', () => {
    render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        interimText="speaking..."
      />,
    );

    const interim = screen.getByText('speaking...');
    expect(interim).toBeInTheDocument();
    expect(interim).toHaveClass('italic');
  });

  it('renders both transcript entries and interim text simultaneously', () => {
    const entries = [makeEntry({ textEnglish: 'Hello', textPatientLang: '안녕하세요' })];

    render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        interimText="Speaking..."
      />,
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    expect(screen.getByText('Speaking...')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TranscriptContainer — Auto-scroll
// ---------------------------------------------------------------------------

describe('TranscriptContainer — Auto-scroll', () => {
  it('auto-scrolls to bottom when new transcript entry is added', () => {
    const entries = [makeEntry({ textEnglish: 'First', textPatientLang: '첫 번째' })];

    const { rerender } = render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    // Clear initial scrollIntoView calls from mount
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    // Add a new entry (simulates new transcript arriving)
    const updatedEntries = [
      ...entries,
      makeEntry({ textEnglish: 'Second', textPatientLang: '두 번째' }),
    ];

    rerender(
      <TranscriptContainer
        transcript={updatedEntries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    // Advance through double-rAF + setTimeout(400ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});

// ---------------------------------------------------------------------------
// TranscriptContainer — Jump to latest pill
// ---------------------------------------------------------------------------

describe('TranscriptContainer — Jump to latest pill', () => {
  it('does not show jump pill when at bottom (initial state)', () => {
    const entries = [makeEntry()];

    render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    expect(screen.queryByText('Jump to latest')).not.toBeInTheDocument();
  });

  it('shows jump pill when user scrolls up (not at bottom)', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ textEnglish: `Entry ${i}`, textPatientLang: `항목 ${i}` }),
    );

    const { container } = render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    // Advance past the auto-scroll guard (rAF + 400ms setTimeout)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;

    // Simulate scroll position away from bottom
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, configurable: true });

    fireEvent.scroll(scrollContainer);

    expect(screen.getByText('Jump to latest')).toBeInTheDocument();
  });

  it('hides jump pill when user scrolls back to bottom', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ textEnglish: `Entry ${i}`, textPatientLang: `항목 ${i}` }),
    );

    const { container } = render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;

    // Scroll away → pill appears
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, configurable: true });
    fireEvent.scroll(scrollContainer);
    expect(screen.getByText('Jump to latest')).toBeInTheDocument();

    // Scroll back to bottom → pill disappears
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 1600, configurable: true });
    fireEvent.scroll(scrollContainer);
    expect(screen.queryByText('Jump to latest')).not.toBeInTheDocument();
  });

  it('calls scrollIntoView when jump pill is clicked', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ textEnglish: `Entry ${i}`, textPatientLang: `항목 ${i}` }),
    );

    const { container } = render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;

    // Scroll away to show pill
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, configurable: true });
    fireEvent.scroll(scrollContainer);

    const jumpButton = screen.getByText('Jump to latest');
    fireEvent.click(jumpButton);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('hides jump pill after clicking it (dismissal via timeout)', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ textEnglish: `Entry ${i}`, textPatientLang: `항목 ${i}` }),
    );

    const { container } = render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, configurable: true });
    fireEvent.scroll(scrollContainer);

    expect(screen.getByText('Jump to latest')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Jump to latest'));

    // Advance past the 400ms timeout that clears showJump
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByText('Jump to latest')).not.toBeInTheDocument();
  });
});

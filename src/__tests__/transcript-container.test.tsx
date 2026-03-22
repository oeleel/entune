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

describe('TranscriptEntryCard — labels and structure', () => {
  it('renders "Original" label with original text', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello doctor"
        textTranslated="안녕하세요 의사 선생님"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />
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
      />
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
      />
    );

    const original = screen.getByText('Hello doctor');
    const translated = screen.getByText('안녕하세요 의사 선생님');
    expect(original).toHaveClass('transcript-text');
    expect(translated).toHaveClass('transcript-text');
  });

  it('sets correct lang attributes for bilingual accessibility', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello doctor"
        textTranslated="안녕하세요 의사 선생님"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />
    );

    expect(screen.getByText('Hello doctor')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('안녕하세요 의사 선생님')).toHaveAttribute('lang', 'ko');
  });

  it('renders faint border separator between entries', () => {
    const { container } = render(
      <TranscriptEntryCard
        textOriginal="Hello"
        textTranslated="안녕하세요"
        originalLanguage="en-US"
        translatedLanguage="ko-KR"
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    // Verify the entry wrapper has border-b with reduced opacity (faint)
    expect(wrapper).toHaveClass('border-b');
    expect(wrapper).toHaveClass('border-border/40');
    // last:border-b-0 removes border on the final entry
    expect(wrapper).toHaveClass('last:border-b-0');
    // Verify structure: wrapper contains two child divs (original + translation)
    const sections = wrapper.children;
    expect(sections.length).toBe(2);
  });

  it('hides translation section when original equals translated', () => {
    render(
      <TranscriptEntryCard
        textOriginal="Hello"
        textTranslated="Hello"
        originalLanguage="en-US"
        translatedLanguage="en-US"
      />
    );

    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.queryByText('Translation')).not.toBeInTheDocument();
  });
});

describe('TranscriptContainer — layout and rendering', () => {
  it('renders between fixed top/bottom bars (calc height)', () => {
    const { container } = render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );

    const outer = container.firstElementChild as HTMLElement;
    expect(outer.style.height).toBe('calc(100vh - 96px)');
  });

  it('shows empty message when transcript is empty', () => {
    render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );

    expect(screen.getByText('Waiting for conversation to begin...')).toBeInTheDocument();
  });

  it('renders custom empty message', () => {
    render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        emptyMessage="No entries yet"
      />
    );

    expect(screen.getByText('No entries yet')).toBeInTheDocument();
  });

  it('renders transcript entries with Original/Translation labels', () => {
    const entries: TranscriptEntry[] = [
      makeEntry({
        textEnglish: 'I feel dizzy',
        textPatientLang: '어지러워요',
      }),
    ];

    render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );

    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('I feel dizzy')).toBeInTheDocument();
    expect(screen.getByText('Translation')).toBeInTheDocument();
    expect(screen.getByText('어지러워요')).toBeInTheDocument();
  });

  it('renders multiple transcript entries', () => {
    const entries: TranscriptEntry[] = [
      makeEntry({ textEnglish: 'First entry', textPatientLang: '첫 번째' }),
      makeEntry({ textEnglish: 'Second entry', textPatientLang: '두 번째' }),
    ];

    render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );

    expect(screen.getByText('First entry')).toBeInTheDocument();
    expect(screen.getByText('Second entry')).toBeInTheDocument();
  });

  it('renders interim text in italic when provided', () => {
    render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
        interimText="speaking..."
      />
    );

    const interim = screen.getByText('speaking...');
    expect(interim).toBeInTheDocument();
    expect(interim).toHaveClass('italic');
  });

  it('scrollable container is a direct child of the outer wrapper', () => {
    const { container } = render(
      <TranscriptContainer
        transcript={[]}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );

    const outer = container.firstElementChild as HTMLElement;
    const scrollArea = outer.firstElementChild as HTMLElement;
    // The scroll container must be the direct child of the positioned wrapper
    // and must have both full height and overflow scrolling
    expect(scrollArea).toHaveClass('h-full');
    expect(scrollArea).toHaveClass('overflow-y-auto');
    expect(scrollArea.style.scrollBehavior).toBe('smooth');
  });
});

describe('TranscriptContainer — Auto-scroll', () => {
  it('auto-scrolls to bottom when new transcript entry is added', () => {
    const entries = [makeEntry({ textEnglish: 'First', textPatientLang: '첫 번째' })];

    const { rerender } = render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
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
      />
    );

    // Advance through double-rAF + setTimeout(400ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});

describe('TranscriptContainer — Jump to latest pill', () => {
  it('does not show jump pill when at bottom (initial state)', () => {
    const entries = [makeEntry()];

    render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );

    expect(screen.queryByText('Jump to latest')).not.toBeInTheDocument();
  });

  it('shows jump pill when user scrolls up (not at bottom)', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ textEnglish: `Entry ${i}`, textPatientLang: `항목 ${i}` })
    );

    const { container } = render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
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

  it('calls scrollIntoView when jump pill is clicked', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ textEnglish: `Entry ${i}`, textPatientLang: `항목 ${i}` })
    );

    const { container } = render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );

    // Advance past the auto-scroll guard
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;

    // Simulate being scrolled up
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, configurable: true });
    fireEvent.scroll(scrollContainer);

    const jumpButton = screen.getByText('Jump to latest');
    fireEvent.click(jumpButton);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('hides jump pill after clicking it (dismissal)', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ textEnglish: `Entry ${i}`, textPatientLang: `항목 ${i}` })
    );

    const { container } = render(
      <TranscriptContainer
        transcript={entries}
        patientLanguage="ko-KR"
        providerLanguage="en-US"
      />
    );

    // Advance past auto-scroll guard
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 400, configurable: true });
    fireEvent.scroll(scrollContainer);

    // Pill should be visible
    expect(screen.getByText('Jump to latest')).toBeInTheDocument();

    // Click to dismiss
    fireEvent.click(screen.getByText('Jump to latest'));

    // Advance past the 400ms timeout that clears showJump
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByText('Jump to latest')).not.toBeInTheDocument();
  });
});

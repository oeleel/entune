import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CulturalFlagCard } from '@/components/visit/cultural-flag-card';
import type { CulturalFlag } from '@/lib/types';

// --- Test fixtures ---

const informationalFlag: CulturalFlag = {
  term: '체했다',
  originalLanguage: 'ko-KR',
  literal: 'The food is stuck',
  clinicalContext: 'Korean folk concept of indigestion caused by emotional stress.',
  screenFor: [],
  safetyNote: null,
};

const clinicalFlag: CulturalFlag = {
  term: '화병',
  originalLanguage: 'ko-KR',
  literal: 'Fire illness',
  clinicalContext:
    'Hwa-byung is a Korean cultural syndrome involving suppressed anger manifesting as physical symptoms.',
  screenFor: ['depression', 'anxiety', 'somatic symptom disorder'],
  safetyNote: null,
};

const safetyFlag: CulturalFlag = {
  term: 'susto',
  originalLanguage: 'es-ES',
  literal: 'Fright sickness',
  clinicalContext:
    'Susto is a Latin American folk illness triggered by a frightening event, causing soul loss.',
  screenFor: ['PTSD', 'acute stress disorder'],
  safetyNote:
    'Assess for suicidal ideation — patients with chronic susto may develop severe depression.',
};

// --- Tier determination with exact class assertions ---

describe('CulturalFlagCard — Tier Determination', () => {
  it('renders informational tier with teal bg and teal left border', () => {
    const { container } = render(<CulturalFlagCard flag={informationalFlag} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.classList.contains('bg-teal-950/60')).toBe(true);
    expect(card.classList.contains('border-l-teal-400')).toBe(true);
  });

  it('renders clinical tier with amber bg and amber left border', () => {
    const { container } = render(<CulturalFlagCard flag={clinicalFlag} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.classList.contains('bg-amber-950/60')).toBe(true);
    expect(card.classList.contains('border-l-amber-400')).toBe(true);
  });

  it('renders safety-critical tier with red bg and red left border', () => {
    const { container } = render(<CulturalFlagCard flag={safetyFlag} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.classList.contains('bg-red-950/60')).toBe(true);
    expect(card.classList.contains('border-l-red-400')).toBe(true);
  });
});

// --- Visual Structure ---

describe('CulturalFlagCard — Visual Structure', () => {
  it('has border-l-4 for left border accent', () => {
    const { container } = render(<CulturalFlagCard flag={clinicalFlag} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.classList.contains('border-l-4')).toBe(true);
  });

  it('displays the tier label matching the severity', () => {
    render(<CulturalFlagCard flag={informationalFlag} />);
    expect(screen.getByText('Cultural Context')).toBeInTheDocument();
  });

  it('displays Clinical Significance label for clinical tier', () => {
    render(<CulturalFlagCard flag={clinicalFlag} />);
    expect(screen.getByText('Clinical Significance')).toBeInTheDocument();
  });

  it('displays Safety Alert label for safety tier', () => {
    render(<CulturalFlagCard flag={safetyFlag} />);
    expect(screen.getByText('Safety Alert')).toBeInTheDocument();
  });

  it('displays the cultural term prominently', () => {
    render(<CulturalFlagCard flag={clinicalFlag} />);
    expect(screen.getByText('화병')).toBeInTheDocument();
  });

  it('displays the literal translation', () => {
    render(<CulturalFlagCard flag={clinicalFlag} />);
    expect(screen.getByText(/Fire illness/)).toBeInTheDocument();
  });

  it('displays clinical context', () => {
    render(<CulturalFlagCard flag={clinicalFlag} />);
    expect(screen.getByText(/Korean cultural syndrome/)).toBeInTheDocument();
  });

  it('displays screenFor items for clinical tier', () => {
    render(<CulturalFlagCard flag={clinicalFlag} />);
    expect(screen.getByText('depression')).toBeInTheDocument();
    expect(screen.getByText('anxiety')).toBeInTheDocument();
    expect(screen.getByText('somatic symptom disorder')).toBeInTheDocument();
  });

  it('displays safety note for safety-critical tier', () => {
    render(<CulturalFlagCard flag={safetyFlag} />);
    expect(screen.getByText(/suicidal ideation/)).toBeInTheDocument();
  });

  it('does not show screenFor section for informational tier', () => {
    render(<CulturalFlagCard flag={informationalFlag} />);
    expect(screen.queryByText('Screen for:')).not.toBeInTheDocument();
  });

  it('does not show safety note section when safetyNote is null', () => {
    render(<CulturalFlagCard flag={informationalFlag} />);
    expect(screen.queryByText('Safety Note')).not.toBeInTheDocument();
  });
});

// --- Icons ---

describe('CulturalFlagCard — Icons', () => {
  it('renders an SVG icon for each tier', () => {
    const { container: infoContainer } = render(
      <CulturalFlagCard flag={informationalFlag} />
    );
    expect(infoContainer.querySelector('svg')).not.toBeNull();

    const { container: clinicalContainer } = render(
      <CulturalFlagCard flag={clinicalFlag} />
    );
    expect(clinicalContainer.querySelector('svg')).not.toBeNull();

    const { container: safetyContainer } = render(
      <CulturalFlagCard flag={safetyFlag} />
    );
    expect(safetyContainer.querySelector('svg')).not.toBeNull();
  });

  it('icons are hidden from assistive tech (aria-hidden)', () => {
    const { container } = render(<CulturalFlagCard flag={clinicalFlag} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });
});

// --- Animation ---

describe('CulturalFlagCard — Animation', () => {
  it('has the cultural-flag CSS class and animate-in utilities', () => {
    const { container } = render(<CulturalFlagCard flag={informationalFlag} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.classList.contains('cultural-flag')).toBe(true);
    expect(card.classList.contains('animate-in')).toBe(true);
    expect(card.classList.contains('slide-in-from-bottom-2')).toBe(true);
    expect(card.classList.contains('fade-in')).toBe(true);
    expect(card.classList.contains('duration-300')).toBe(true);
  });
});

// --- Accessibility ---

describe('CulturalFlagCard — Accessibility', () => {
  it('safety tier has role="alert" for urgent screen reader announcement', () => {
    render(<CulturalFlagCard flag={safetyFlag} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('non-safety tiers use role="status" for polite announcements', () => {
    const { unmount } = render(<CulturalFlagCard flag={informationalFlag} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    unmount();
    // Also verify clinical tier uses role="status"
    render(<CulturalFlagCard flag={clinicalFlag} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('informational tier has aria-live="polite"', () => {
    const { container } = render(<CulturalFlagCard flag={informationalFlag} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.getAttribute('aria-live')).toBe('polite');
  });

  it('clinical tier has aria-live="polite"', () => {
    const { container } = render(<CulturalFlagCard flag={clinicalFlag} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.getAttribute('aria-live')).toBe('polite');
  });

  it('safety-critical tier uses aria-live="assertive"', () => {
    const { container } = render(<CulturalFlagCard flag={safetyFlag} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.getAttribute('aria-live')).toBe('assertive');
  });
});

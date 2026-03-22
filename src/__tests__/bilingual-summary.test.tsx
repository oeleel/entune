import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BilingualSummary } from '@/components/summary/bilingual-summary';
import type { DoctorReport, PatientReport, CulturalFlag } from '@/lib/types';

const mockCulturalFlags: CulturalFlag[] = [
  {
    term: '화병',
    originalLanguage: 'ko-KR',
    literal: 'Fire disease',
    clinicalContext: 'Culture-bound syndrome involving anger suppression leading to somatic symptoms',
    screenFor: ['depression', 'anxiety', 'somatization'],
    safetyNote: null,
  },
  {
    term: 'nervios',
    originalLanguage: 'es-ES',
    literal: 'Nerves',
    clinicalContext: 'Distress idiom common in Latin American cultures',
    screenFor: ['anxiety', 'PTSD'],
    safetyNote: 'May mask suicidal ideation',
  },
];

const mockDoctorReport: DoctorReport = {
  visitId: 'visit-123',
  subjective: 'Patient reports chronic headaches and irritability for 3 months.',
  objective: 'BP 130/85, HR 78. No focal neurological deficits.',
  assessment: 'Tension-type headache with possible culture-bound stress syndrome.',
  plan: 'Start low-dose amitriptyline 10mg nightly. Return in 2 weeks for follow-up.',
  culturalConsiderations: 'Patient describes symptoms consistent with 화병 (hwabyeong). Consider culturally sensitive approach.',
  culturalFlags: mockCulturalFlags,
  languagePair: { patient: 'ko-KR', provider: 'en-US' },
  generatedAt: '2026-03-22T10:00:00Z',
};

const mockPatientReport: PatientReport = {
  visitId: 'visit-123',
  summary: '의사 선생님이 두통과 스트레스에 대해 상담했습니다.',
  summaryEnglish: 'The doctor discussed your headaches and stress.',
  medications: [
    {
      name: 'Amitriptyline 10mg',
      instructions: '매일 밤 취침 전 1정 복용',
      instructionsEnglish: 'Take 1 tablet nightly before bed',
    },
  ],
  followUps: [
    {
      item: '2주 후 내원하세요',
      itemEnglish: 'Return in 2 weeks',
      date: '2026-04-05',
    },
  ],
  warningSignsToWatchFor: ['심한 두통이 갑자기 발생하면', '시야가 흐려지면'],
  warningSignsEnglish: ['Sudden severe headache', 'Blurred vision'],
  language: 'ko-KR',
  generatedAt: '2026-03-22T10:00:00Z',
};

describe('BilingualSummary — Layout', () => {
  it('renders bilingual content in both columns with lg:grid-cols-2 layout', () => {
    const { container } = render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    // Bilingual grid sections have responsive 2-column layout
    const gridContainers = container.querySelectorAll('[class*="lg:grid-cols-2"]');
    // Key Discussion, Medications, Follow-Up, Warning Signs each have a bilingual grid
    expect(gridContainers.length).toBeGreaterThanOrEqual(4);

    // Verify both language contents are in the DOM (both columns rendered)
    expect(screen.getByText(/doctor discussed your headaches/i)).toBeInTheDocument();
    expect(screen.getByText(/의사 선생님이 두통/)).toBeInTheDocument();
  });

  it('renders language toggle tabs with correct language labels', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveTextContent('English');
    expect(tabs[1]).toHaveTextContent('한국어');
    // First tab is selected by default
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('switches selected tab and toggles content visibility when clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    const tabs = screen.getAllByRole('tab');

    // Initially: English tab selected, Korean content hidden on mobile
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    // The patient-language (right) columns should have 'hidden' class
    const rightColumns = container.querySelectorAll('[class*="lg:grid-cols-2"] > :nth-child(2)');
    expect(rightColumns.length).toBeGreaterThanOrEqual(1);
    expect(rightColumns[0].className).toContain('hidden');

    // Click Korean tab
    await user.click(tabs[1]);

    // Now Korean tab selected
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');

    // After clicking Korean tab: left (English) columns should be hidden
    const leftColumns = container.querySelectorAll('[class*="lg:grid-cols-2"] > :first-child');
    expect(leftColumns.length).toBeGreaterThanOrEqual(1);
    expect(leftColumns[0].className).toContain('hidden');
  });

  it('renders Spanish label when patient language is es-ES', () => {
    const spanishDoctorReport: DoctorReport = {
      ...mockDoctorReport,
      culturalFlags: [],
      languagePair: { patient: 'es-ES', provider: 'en-US' },
    };

    render(
      <BilingualSummary
        doctorReport={spanishDoctorReport}
        patientReport={{ ...mockPatientReport, language: 'es-ES' }}
      />
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveTextContent('English');
    expect(tabs[1]).toHaveTextContent('Español');
  });
});

describe('BilingualSummary — Cultural Concepts Section (at top)', () => {
  it('renders Cultural Concepts Discussed section as the first content section', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    const heading = screen.getByRole('heading', { name: /cultural concepts/i });
    expect(heading).toBeInTheDocument();

    // Must be the first heading in DOM order
    const allHeadings = screen.getAllByRole('heading');
    expect(allHeadings[0]).toHaveTextContent(/cultural concepts/i);
  });

  it('renders each cultural flag with term, literal translation, and clinical context', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    // 화병
    expect(screen.getByText('화병')).toBeInTheDocument();
    expect(screen.getByText(/fire disease/i)).toBeInTheDocument();
    expect(screen.getByText(/anger suppression/i)).toBeInTheDocument();

    // nervios
    expect(screen.getByText('nervios')).toBeInTheDocument();
    expect(screen.getByText(/nerves/i)).toBeInTheDocument();
    expect(screen.getByText(/distress idiom/i)).toBeInTheDocument();
  });

  it('shows safety note when cultural flag has one', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    // nervios has a safety note — must render with red styling
    const safetyNote = screen.getByText(/may mask suicidal ideation/i);
    expect(safetyNote).toBeInTheDocument();
    expect(safetyNote.className).toContain('text-red-600');
  });

  it('does not render Cultural Concepts section when no cultural flags exist', () => {
    const reportNoCulture = {
      ...mockDoctorReport,
      culturalFlags: [],
    };

    render(
      <BilingualSummary
        doctorReport={reportNoCulture}
        patientReport={mockPatientReport}
      />
    );

    expect(screen.queryByRole('heading', { name: /cultural concepts/i })).not.toBeInTheDocument();
  });
});

describe('BilingualSummary — Sections', () => {
  it('renders Visit Details section with all four SOAP fields', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    expect(screen.getByRole('heading', { name: /visit details/i })).toBeInTheDocument();
    expect(screen.getByText(/chronic headaches and irritability/i)).toBeInTheDocument();
    expect(screen.getByText(/BP 130\/85/i)).toBeInTheDocument();
    expect(screen.getByText(/tension-type headache/i)).toBeInTheDocument();
    // Plan field must also be rendered
    expect(screen.getByText(/start low-dose amitriptyline/i)).toBeInTheDocument();
  });

  it('renders Key Discussion section with English in left column and Korean in right', () => {
    const { container } = render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    expect(screen.getByRole('heading', { name: /key discussion/i })).toBeInTheDocument();
    // English summary (summaryEnglish) in left column
    expect(screen.getByText(/doctor discussed your headaches/i)).toBeInTheDocument();
    // Korean summary in right column
    expect(screen.getByText(/의사 선생님이 두통/)).toBeInTheDocument();
  });

  it('renders Medications section with left border accent on each item', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    expect(screen.getByRole('heading', { name: /medications/i })).toBeInTheDocument();
    const medName = screen.getByText('Amitriptyline 10mg');
    expect(medName).toBeInTheDocument();

    // The medication wrapper must have left border accent
    const medItem = medName.closest('[class*="border-l"]');
    expect(medItem).not.toBeNull();
    expect(medItem!.className).toMatch(/border-l-4/);
  });

  it('renders medication instructions in both languages', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    // English instructions
    expect(screen.getByText(/take 1 tablet nightly before bed/i)).toBeInTheDocument();
    // Korean instructions
    expect(screen.getByText(/매일 밤 취침 전 1정 복용/)).toBeInTheDocument();
  });

  it('renders Follow-Up section with date and bilingual items', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    const followUpHeading = screen.getByRole('heading', { name: /follow-up/i });
    expect(followUpHeading).toBeInTheDocument();
    // Query within the follow-up section specifically
    const followUpSection = followUpHeading.closest('section')!;
    expect(within(followUpSection).getByText(/2주 후 내원하세요/)).toBeInTheDocument();
    expect(within(followUpSection).getByText(/return in 2 weeks/i)).toBeInTheDocument();
    expect(within(followUpSection).getByText(/2026-04-05/)).toBeInTheDocument();
  });

  it('renders Follow-Up items without date when date is not provided', () => {
    const reportNoDate = {
      ...mockPatientReport,
      followUps: [{ item: '혈액 검사', itemEnglish: 'Blood test' }],
    };

    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={reportNoDate}
      />
    );

    expect(screen.getByText(/blood test/i)).toBeInTheDocument();
    expect(screen.getByText(/혈액 검사/)).toBeInTheDocument();
    // No date element rendered
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it('renders Warning Signs section with red-50 background and red-200 border', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    const warningHeading = screen.getByRole('heading', { name: /warning signs/i });
    expect(warningHeading).toBeInTheDocument();

    // The section wrapping warning signs must have red styling
    const warningSection = warningHeading.closest('section');
    expect(warningSection).not.toBeNull();
    expect(warningSection!.className).toContain('bg-red-50');
    expect(warningSection!.className).toContain('border-red-200');
  });

  it('renders warning signs in both languages', () => {
    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={mockPatientReport}
      />
    );

    // Korean warning signs
    expect(screen.getByText(/심한 두통이 갑자기/)).toBeInTheDocument();
    expect(screen.getByText(/시야가 흐려지면/)).toBeInTheDocument();

    // English warning signs
    expect(screen.getByText(/sudden severe headache/i)).toBeInTheDocument();
    expect(screen.getByText(/blurred vision/i)).toBeInTheDocument();
  });
});

describe('BilingualSummary — Empty States', () => {
  it('does not render Medications section when no medications', () => {
    const reportNoMeds = { ...mockPatientReport, medications: [] };

    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={reportNoMeds}
      />
    );

    expect(screen.queryByRole('heading', { name: /medications/i })).not.toBeInTheDocument();
  });

  it('does not render Follow-Up section when no follow-ups', () => {
    const reportNoFollowUps = { ...mockPatientReport, followUps: [] };

    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={reportNoFollowUps}
      />
    );

    expect(screen.queryByRole('heading', { name: /follow-up/i })).not.toBeInTheDocument();
  });

  it('does not render Warning Signs section when no warnings', () => {
    const reportNoWarnings = {
      ...mockPatientReport,
      warningSignsToWatchFor: [],
      warningSignsEnglish: [],
    };

    render(
      <BilingualSummary
        doctorReport={mockDoctorReport}
        patientReport={reportNoWarnings}
      />
    );

    expect(screen.queryByRole('heading', { name: /warning signs/i })).not.toBeInTheDocument();
  });
});

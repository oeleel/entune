import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock useUser hook
let mockUser: { id: string; name: string; email: string; avatarUrl: string | null; preferredLanguage: string } | null = {
  id: 'u1',
  name: 'Dr. Kim',
  email: 'kim@test.com',
  avatarUrl: null,
  preferredLanguage: 'en-US',
};

vi.mock('@/hooks/use-user', () => ({
  useUser: () => ({ user: mockUser, isLoading: false }),
}));

// Mock supabase client — return visit data
const mockVisits = [
  {
    id: 'v1',
    language_patient: 'ko-KR',
    language_provider: 'en-US',
    status: 'ended',
    patient_name: 'Park Soo-jin',
    started_at: '2026-03-20T10:00:00Z',
    ended_at: '2026-03-20T10:30:00Z',
  },
  {
    id: 'v2',
    language_patient: 'es-ES',
    language_provider: 'en-US',
    status: 'active',
    patient_name: 'Maria Lopez',
    started_at: '2026-03-22T09:00:00Z',
    ended_at: null,
  },
];

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: mockVisits }),
        }),
      }),
    }),
  })),
}));

vi.mock('@/lib/api', () => ({
  createSession: vi.fn(),
}));

import DashboardPage from '@/app/dashboard/page';

describe('DashboardPage — quick stats and visit grid', () => {
  beforeEach(() => {
    mockUser = {
      id: 'u1',
      name: 'Dr. Kim',
      email: 'kim@test.com',
      avatarUrl: null,
      preferredLanguage: 'en-US',
    };
  });

  it('renders welcome message with user first name', async () => {
    render(<DashboardPage />);

    expect(await screen.findByText(/Welcome back, Dr/)).toBeInTheDocument();
  });

  it('renders quick stats with correct values (Total Visits = 2)', async () => {
    render(<DashboardPage />);

    // Wait for data to load
    await screen.findByText('Total Visits');

    // Total Visits stat should show count of mock visits
    const totalLabel = screen.getByText('Total Visits');
    const totalCard = totalLabel.closest('.rounded-xl') as HTMLElement;
    expect(within(totalCard).getByText('2')).toBeInTheDocument();

    // Other stat labels present
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Languages Used')).toBeInTheDocument();
  });

  it('renders visit card grid with responsive column classes', async () => {
    const { container } = render(<DashboardPage />);

    // Wait for visits to load
    await screen.findByText('Park Soo-jin');

    // Grid should have responsive columns: 1 mobile, 2 tablet, 3 desktop
    const grid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
    expect(grid).not.toBeNull();
  });

  it('renders visit cards showing patient name', async () => {
    render(<DashboardPage />);

    expect(await screen.findByText('Park Soo-jin')).toBeInTheDocument();
    expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
  });

  it('renders visit cards with language pair and duration', async () => {
    render(<DashboardPage />);

    await screen.findByText('Park Soo-jin');

    // Korean visit card should show KO → EN language pair
    const parkCard = screen.getByText('Park Soo-jin').closest('button') as HTMLElement;
    expect(within(parkCard).getByText(/KO/)).toBeInTheDocument();
    expect(within(parkCard).getByText(/EN/)).toBeInTheDocument();

    // Duration for v1: started 10:00, ended 10:30 = 30 min
    expect(within(parkCard).getByText('30 min')).toBeInTheDocument();

    // Spanish visit card
    const mariaCard = screen.getByText('Maria Lopez').closest('button') as HTMLElement;
    expect(within(mariaCard).getByText(/ES/)).toBeInTheDocument();
  });

  it('renders status badge on visit cards', async () => {
    render(<DashboardPage />);

    await screen.findByText('Park Soo-jin');

    expect(screen.getByText('ended')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders visit cards as interactive buttons with hover lift', async () => {
    render(<DashboardPage />);

    await screen.findByText('Park Soo-jin');

    // Each visit renders as a button (interactive, clickable)
    const parkButton = screen.getByText('Park Soo-jin').closest('button');
    const mariaButton = screen.getByText('Maria Lopez').closest('button');
    expect(parkButton).not.toBeNull();
    expect(mariaButton).not.toBeNull();
    // Hover lift class applied
    expect(parkButton).toHaveClass('hover:-translate-y-0.5');
  });

  it('filters visits by patient name when search input is used', async () => {
    render(<DashboardPage />);

    await screen.findByText('Park Soo-jin');

    const searchInput = screen.getByPlaceholderText(/Search by patient name/);
    fireEvent.change(searchInput, { target: { value: 'Park' } });

    // Park should still be visible, Maria should be filtered out
    expect(screen.getByText('Park Soo-jin')).toBeInTheDocument();
    expect(screen.queryByText('Maria Lopez')).not.toBeInTheDocument();
  });

  it('shows "No visits match" when search has no results', async () => {
    render(<DashboardPage />);

    await screen.findByText('Park Soo-jin');

    const searchInput = screen.getByPlaceholderText(/Search by patient name/);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No visits match your search.')).toBeInTheDocument();
  });

  it('shows "Report available" indicator on ended visits', async () => {
    render(<DashboardPage />);

    await screen.findByText('Park Soo-jin');

    expect(screen.getByText('Report available')).toBeInTheDocument();
  });

  it('shows "New Session" button', async () => {
    render(<DashboardPage />);

    expect(await screen.findByText('New Session')).toBeInTheDocument();
  });

  it('navigates to visit detail page when card is clicked', async () => {
    render(<DashboardPage />);

    await screen.findByText('Park Soo-jin');

    const parkCard = screen.getByText('Park Soo-jin').closest('button') as HTMLElement;
    fireEvent.click(parkCard);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/visit/v1');
  });

  it('returns null when user is not authenticated', () => {
    mockUser = null;
    const { container } = render(<DashboardPage />);

    expect(container.innerHTML).toBe('');
  });
});

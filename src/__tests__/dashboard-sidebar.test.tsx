import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock useUser hook
type MockUser = {
  user: { id: string; name: string; email: string; avatarUrl: string | null; preferredLanguage: string } | null;
  loading: boolean;
  isLoading: boolean;
};

let mockUserReturn: MockUser = {
  user: { id: '1', name: 'Dr. Smith', email: 'dr@test.com', avatarUrl: null, preferredLanguage: 'en-US' },
  loading: false,
  isLoading: false,
};

vi.mock('@/hooks/use-user', () => ({
  useUser: () => mockUserReturn,
}));

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { signOut: vi.fn() },
  })),
}));

import { DashboardSidebar, MobileTabBar } from '@/components/dashboard/dashboard-sidebar';
import DashboardLayout from '@/app/dashboard/layout';
import { usePathname } from 'next/navigation';

describe('DashboardSidebar', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    mockUserReturn = {
      user: { id: '1', name: 'Dr. Smith', email: 'dr@test.com', avatarUrl: null, preferredLanguage: 'en-US' },
      loading: false,
      isLoading: false,
    };
  });

  it('renders all four nav items with correct labels', () => {
    render(<DashboardSidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Visits')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders nav items as links with correct href paths', () => {
    render(<DashboardSidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    const visitsLink = screen.getByRole('link', { name: /visits/i });
    const chatLink = screen.getByRole('link', { name: /chat/i });
    const settingsLink = screen.getByRole('link', { name: /settings/i });

    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(visitsLink).toHaveAttribute('href', '/dashboard/visits');
    expect(chatLink).toHaveAttribute('href', '/dashboard/chat');
    expect(settingsLink).toHaveAttribute('href', '/dashboard/settings');
  });

  it('highlights the active nav item with teal styling on /dashboard', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<DashboardSidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.className).toContain('bg-teal-50');
    expect(dashboardLink.className).toContain('text-teal-500');
  });

  it('highlights Visits and deactivates Dashboard on /dashboard/visits', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/visits');
    render(<DashboardSidebar />);

    const visitsLink = screen.getByRole('link', { name: /visits/i });
    expect(visitsLink.className).toContain('bg-teal-50');
    expect(visitsLink.className).toContain('text-teal-500');

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.className).not.toContain('bg-teal-50');
    expect(dashboardLink.className).toContain('text-muted-foreground');
  });

  it('renders user name and email when user is authenticated', () => {
    render(<DashboardSidebar />);

    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('dr@test.com')).toBeInTheDocument();
  });

  it('computes user initials from full name for avatar fallback', () => {
    mockUserReturn = {
      user: { id: '1', name: 'Jane Kim', email: 'jane@test.com', avatarUrl: null, preferredLanguage: 'en-US' },
      loading: false,
      isLoading: false,
    };
    render(<DashboardSidebar />);

    // Verifies getInitials correctly extracts "JK" from "Jane Kim"
    expect(screen.getByText('JK')).toBeInTheDocument();
    expect(screen.queryByText('DS')).not.toBeInTheDocument();
  });

  it('does not render user section when user is null', () => {
    mockUserReturn = { user: null, loading: false, isLoading: false };
    render(<DashboardSidebar />);

    expect(screen.queryByText('Dr. Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('dr@test.com')).not.toBeInTheDocument();
  });

  it('wraps all nav links inside an accessible navigation landmark', () => {
    render(<DashboardSidebar />);

    const nav = screen.getByRole('navigation', { name: 'Dashboard navigation' });
    const linksInNav = within(nav).getAllByRole('link');
    // 4 nav items + 1 logo link = 5 links inside the nav
    expect(linksInNav.length).toBe(5);
    expect(within(nav).getByRole('link', { name: /visits/i })).toHaveAttribute('href', '/dashboard/visits');
  });

  it('sets aria-hidden on decorative nav icons', () => {
    render(<DashboardSidebar />);

    const nav = screen.getByRole('navigation', { name: 'Dashboard navigation' });
    const svgs = nav.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBe(4);
  });

  it('adds title attribute to nav links for collapsed tooltip', () => {
    render(<DashboardSidebar />);

    expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
    expect(screen.getByTitle('Visits')).toBeInTheDocument();
    expect(screen.getByTitle('Chat')).toBeInTheDocument();
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
  });
});

describe('MobileTabBar', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
  });

  it('renders all four nav items horizontally with labels', () => {
    render(<MobileTabBar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Visits')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active item with teal text color', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/chat');
    render(<MobileTabBar />);

    const chatLink = screen.getByRole('link', { name: /chat/i });
    expect(chatLink.className).toContain('text-teal-500');

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.className).toContain('text-muted-foreground');
  });

  it('renders each link with icon followed by label text in DOM order', () => {
    render(<MobileTabBar />);

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      // Each link should have flex-col layout (icon above label)
      expect(link).toHaveClass('flex-col');
      // First child should be the SVG icon, second should be the span label
      const svg = link.querySelector('svg');
      const span = link.querySelector('span');
      expect(svg).not.toBeNull();
      expect(span).not.toBeNull();
      // Icon appears before label in DOM
      expect(
        svg!.compareDocumentPosition(span!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });

  it('wraps all mobile nav links inside an accessible navigation landmark', () => {
    render(<MobileTabBar />);

    const nav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    const linksInNav = within(nav).getAllByRole('link');
    expect(linksInNav.length).toBe(4);
    expect(within(nav).getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/dashboard/settings');
  });

  it('sets aria-hidden on decorative mobile tab icons', () => {
    render(<MobileTabBar />);

    const nav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    const svgs = nav.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBe(4);
  });
});

describe('DashboardLayout — responsive structure', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    mockUserReturn = {
      user: { id: '1', name: 'Dr. Smith', email: 'dr@test.com', avatarUrl: null, preferredLanguage: 'en-US' },
      loading: false,
      isLoading: false,
    };
  });

  it('renders aside with desktop width lg:w-60 (240px) and tablet width md:w-16 (64px)', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Page content</div>
      </DashboardLayout>,
    );

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    // Desktop: 240px (w-60 = 60 * 4px)
    expect(aside).toHaveClass('lg:w-60');
    // Tablet: 64px (w-16 = 16 * 4px)
    expect(aside).toHaveClass('md:w-16');
  });

  it('hides sidebar on mobile and shows it from md breakpoint', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Page content</div>
      </DashboardLayout>,
    );

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('hidden');
    expect(aside).toHaveClass('md:flex');
  });

  it('renders mobile tab bar only on small screens (md:hidden)', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Page content</div>
      </DashboardLayout>,
    );

    // Mobile tab bar container should be hidden on md+
    const mobileBar = container.querySelector('.md\\:hidden');
    expect(mobileBar).not.toBeNull();
    // Should contain the mobile navigation
    const mobileNav = within(mobileBar as HTMLElement).getByRole('navigation', { name: 'Mobile navigation' });
    expect(mobileNav).toBeInTheDocument();
  });

  it('renders page content in main element', () => {
    render(
      <DashboardLayout>
        <div>Page content</div>
      </DashboardLayout>,
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(within(main).getByText('Page content')).toBeInTheDocument();
  });
});

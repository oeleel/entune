'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, MessageSquare, Settings } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Visits', href: '/dashboard/visits', icon: CalendarDays },
  { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
] as const;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <nav aria-label="Dashboard navigation" className="flex flex-col h-full bg-card border-r">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Entune
        </Link>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-500'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="sidebar-label">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* User section at bottom */}
      {user && (
        <div className="border-t p-4 flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="sidebar-label min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      )}
    </nav>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile navigation" className="flex items-center justify-around py-2">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'text-teal-500'
                : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

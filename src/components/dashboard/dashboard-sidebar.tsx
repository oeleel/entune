'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardHeader() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-card">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image
          src="/LogoFr.png"
          alt=""
          width={100}
          height={392}
          className="h-7 w-auto shrink-0 dark:invert-0 invert"
        />
        <span className="text-xl font-bold tracking-[0.08em] lowercase text-foreground">
          entune
        </span>
      </Link>

      {/* User avatar */}
      {user && (
        <UserPopover user={user} theme={theme} setTheme={setTheme} />
      )}
    </header>
  );
}

function UserPopover({
  user,
  theme,
  setTheme,
}: {
  user: { name: string; email: string; avatarUrl: string | null };
  theme: string | undefined;
  setTheme: (t: string) => void;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button className="flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-muted transition-colors" />
        }
      >
        <Avatar className="h-8 w-8 shrink-0">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="hidden sm:block min-w-0 text-left">
          <p className="text-sm font-medium truncate">{user.name}</p>
        </div>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-56 !p-1 !gap-0">
        {/* User info */}
        <div className="px-3 py-2 text-sm">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>

        <div className="my-1 border-t" />

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <div className="my-1 border-t" />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </PopoverContent>
    </Popover>
  );
}

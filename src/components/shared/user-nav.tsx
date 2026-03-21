'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';

export function UserNav({ user }: { user: UserProfile }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl && (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="h-8 w-8 rounded-full"
        />
      )}
      <span className="text-sm font-medium">{user.name}</span>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}

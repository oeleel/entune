import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
};

export function MarketingShell({ children, className }: MarketingShellProps) {
  return (
    <div className={cn('entune-marketing relative min-h-screen overflow-x-hidden', className)}>
      <div className="entune-bg-glow" aria-hidden />
      {children}
    </div>
  );
}

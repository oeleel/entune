import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DoctorPlaceholderPageProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function DoctorPlaceholderPage({
  title,
  description,
  children,
  className,
}: DoctorPlaceholderPageProps) {
  return (
    <div className={cn('entune-dd-placeholder', className)}>
      <h1 className="entune-dd-title">{title}</h1>
      {description ? <p className="entune-dd-lede">{description}</p> : null}
      <div className="entune-dd-card">{children ?? <p className="entune-dd-muted">Content coming soon.</p>}</div>
    </div>
  );
}

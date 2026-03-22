'use client';

import type { ReactNode } from 'react';

import { useI18n } from '@/components/providers/i18n-provider';
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
  const { t } = useI18n();
  return (
    <div className={cn('entune-dd-placeholder', className)}>
      <h1 className="entune-dd-title">{title}</h1>
      {description ? <p className="entune-dd-lede">{description}</p> : null}
      <div className="entune-dd-card">
        {children ?? <p className="entune-dd-muted">{t('common.comingSoon')}</p>}
      </div>
    </div>
  );
}

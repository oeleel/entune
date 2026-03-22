'use client';

import Link from 'next/link';

import { useI18n } from '@/components/providers/i18n-provider';

export function MarketingBackLink() {
  const { t } = useI18n();

  return (
    <Link href="/" className="entune-back-btn">
      {t('common.back')}
    </Link>
  );
}

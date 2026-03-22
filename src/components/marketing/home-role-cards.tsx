'use client';

import Link from 'next/link';

import { useI18n } from '@/components/providers/i18n-provider';
import { PatientRoleIcon, ProviderRoleIcon } from '@/components/marketing/icons';

export function HomeRoleCards() {
  const { t } = useI18n();

  return (
    <div className="entune-role-cards">
      <Link href="/login" className="entune-role-card entune-role-card-doctor">
        <div className="entune-role-icon entune-role-icon-doctor">
          <ProviderRoleIcon />
        </div>
        <h2 className="entune-role-title">{t('home.providerTitle')}</h2>
        <p className="entune-role-desc">{t('home.providerDesc')}</p>
      </Link>
      <Link href="/join" className="entune-role-card entune-role-card-patient">
        <div className="entune-role-icon entune-role-icon-patient">
          <PatientRoleIcon />
        </div>
        <h2 className="entune-role-title">{t('home.patientTitle')}</h2>
        <p className="entune-role-desc">{t('home.patientDesc')}</p>
      </Link>
    </div>
  );
}

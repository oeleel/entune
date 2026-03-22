import { DoctorPlaceholderPage } from '@/components/doctor-desktop/doctor-placeholder-page';

export default function SettingsPage() {
  return (
    <DoctorPlaceholderPage
      title="Settings"
      description="Language defaults, notifications, and account preferences."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--entune-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
          <div>
            <p className="m-0 text-[15px] font-medium text-[var(--entune-text)]">
              Email notifications
            </p>
            <p className="m-0 mt-1 text-[13px] text-[var(--entune-text-dim)]">
              Session summaries and alerts
            </p>
          </div>
          <span className="text-[13px] font-medium uppercase tracking-wide text-[var(--entune-text-mid)]">
            Soon
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--entune-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
          <div>
            <p className="m-0 text-[15px] font-medium text-[var(--entune-text)]">
              Default languages
            </p>
            <p className="m-0 mt-1 text-[13px] text-[var(--entune-text-dim)]">
              Provider and patient language presets
            </p>
          </div>
          <span className="text-[13px] font-medium uppercase tracking-wide text-[var(--entune-text-mid)]">
            Soon
          </span>
        </div>
      </div>
    </DoctorPlaceholderPage>
  );
}

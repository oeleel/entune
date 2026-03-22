import { DoctorPlaceholderPage } from '@/components/doctor-desktop/doctor-placeholder-page';

export default function AppointmentsPage() {
  return (
    <DoctorPlaceholderPage
      title="Previous appointments"
      description="Review past visits and session notes."
    >
      <ul className="list-none space-y-3 p-0 m-0">
        {['No past appointments yet'].map((line) => (
          <li
            key={line}
            className="rounded-lg border border-[var(--entune-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-[15px] text-[var(--entune-text-mid)]"
          >
            {line}
          </li>
        ))}
      </ul>
    </DoctorPlaceholderPage>
  );
}

import { DoctorPlaceholderPage } from '@/components/doctor-desktop/doctor-placeholder-page';

export default function VisitsPage() {
  return (
    <DoctorPlaceholderPage
      title="Visits with users"
      description="Patients and sessions tied to your account."
    >
      <p className="entune-dd-muted">
        When you run live sessions, they will appear here with patient identifiers
        you choose to save.
      </p>
    </DoctorPlaceholderPage>
  );
}

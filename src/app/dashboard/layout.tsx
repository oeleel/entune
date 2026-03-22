import { AuthGuard } from '@/components/shared/auth-guard';
import { DashboardSidebar, MobileTabBar } from '@/components/dashboard/dashboard-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar: collapsed icon-only at md (64px), full at lg (240px) */}
        <aside className="hidden md:flex md:w-16 lg:w-60 shrink-0">
          <DashboardSidebar />
        </aside>

        {/* Main content — bottom padding on mobile for tab bar */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden border-t bg-card z-10">
          <MobileTabBar />
        </div>
      </div>
    </AuthGuard>
  );
}

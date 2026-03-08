import { getSessionUser } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar userName={user.name} userRole={user.role} />
      <main className="md:ml-64">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}

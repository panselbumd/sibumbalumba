import { getSessionProfile } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

export default async function InternalDashboardPage() {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-medium">Internal Dashboard</h1>
      <p className="text-sm text-gray-500 mt-1">
        Masuk sebagai role: <span className="font-medium">{profile.role}</span>
      </p>
    </main>
  );
}

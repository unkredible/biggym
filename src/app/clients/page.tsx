import { redirect } from "next/navigation";
import { currentContext, isStaffRole } from "@/lib/gym";
import ClientList from "./ClientList";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || !isStaffRole(ctx.role)) redirect("/dashboard");

  return (
    <main>
      <div className="row spread">
        <h1>Clients</h1>
        <a href="/dashboard">← dashboard</a>
      </div>
      <ClientList />
    </main>
  );
}

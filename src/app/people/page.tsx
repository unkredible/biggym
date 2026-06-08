import { redirect } from "next/navigation";
import { currentContext, isStaffRole } from "@/lib/gym";
import PeopleManager from "./PeopleManager";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || !isStaffRole(ctx.role)) redirect("/dashboard");

  return (
    <main>
      <div className="row spread">
        <h1>People</h1>
        <a href="/dashboard">← dashboard</a>
      </div>
      <p className="muted">Staff and clients, grouped by permission.</p>
      <PeopleManager />
    </main>
  );
}

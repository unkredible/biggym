import { redirect } from "next/navigation";
import { currentContext } from "@/lib/gym";
import CalendarManager from "./CalendarManager";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || !(ctx.isSuper || ctx.role === "gym_admin")) redirect("/dashboard");

  return (
    <main>
      <div className="row spread">
        <h1>Calendar</h1>
        <a href="/dashboard">← dashboard</a>
      </div>
      <p className="muted">Create one-off or recurring events for your gym.</p>
      <CalendarManager />
    </main>
  );
}

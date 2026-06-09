import { redirect } from "next/navigation";
import { currentContext } from "@/lib/gym";
import { prisma } from "@/lib/db";
import CalendarManager from "./CalendarManager";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || !(ctx.isSuper || ctx.role === "gym_admin")) redirect("/dashboard");

  const [locations, plans] = await Promise.all([
    prisma.gymLocation.findMany({
      where: { gymId: ctx.gymId, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    prisma.plan.findMany({
      where: { gymId: ctx.gymId, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main>
      <div className="row spread">
        <h1>Calendar</h1>
        <a href="/dashboard">← dashboard</a>
      </div>
      <p className="muted">Create one-off or recurring events for your gym.</p>
      <CalendarManager locations={locations} plans={plans} />
    </main>
  );
}

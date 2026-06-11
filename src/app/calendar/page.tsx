import { redirect } from "next/navigation";
import { IconCalendar } from "@/components/icons";
import { currentContext } from "@/lib/gym";
import { prisma } from "@/lib/db";
import CalendarManager from "./CalendarManager";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || !(ctx.isSuper || ctx.role === "gym_admin")) redirect("/dashboard");

  const [locations, plans, trainers] = await Promise.all([
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
    prisma.membership.findMany({
      where: { gymId: ctx.gymId, role: { in: ["trainer", "gym_admin"] }, active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);

  return (
    <main>
      <div className="section-hero">
        <span className="sh-ic"><IconCalendar width={26} height={26} /></span>
        <div>
          <div className="sh-t">Calendario</div>
          <div className="sh-s">Crea eventi singoli o ricorrenti per la palestra</div>
        </div>
      </div>
      <CalendarManager locations={locations} plans={plans} trainers={trainers} />
    </main>
  );
}

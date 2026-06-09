import { redirect, notFound } from "next/navigation";
import { currentContext } from "@/lib/gym";
import { prisma } from "@/lib/db";
import StaffEditForm from "./StaffEditForm";

export const dynamic = "force-dynamic";

export default async function StaffDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || ctx.role !== "gym_admin") redirect("/dashboard");

  const m = await prisma.membership.findFirst({
    where: { id: params.id, gymId: ctx.gymId },
    select: { id: true, fullName: true, email: true, role: true, active: true, userId: true },
  });
  if (!m || m.role === "client") notFound();

  return (
    <main>
      <div className="row spread">
        <h1>{m.fullName}</h1>
        <a href="/people">← people</a>
      </div>
      <p className="muted">
        <code>{m.email}</code> · <span className="badge">{m.role}</span>
      </p>
      <StaffEditForm
        id={m.id}
        fullName={m.fullName}
        role={m.role}
        active={m.active}
        isSelf={m.userId === ctx.userId}
      />
    </main>
  );
}

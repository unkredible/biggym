import { redirect } from "next/navigation";
import { currentContext } from "@/lib/gym";
import { prisma } from "@/lib/db";
import StaffInviteForm from "./StaffInviteForm";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || ctx.role !== "gym_admin") redirect("/dashboard");

  const [members, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { gymId: ctx.gymId },
      orderBy: { createdAt: "asc" },
      select: { id: true, fullName: true, email: true, role: true, active: true },
    }),
    prisma.staffInvite.findMany({
      where: { gymId: ctx.gymId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true },
    }),
  ]);

  return (
    <main>
      <div className="row spread">
        <h1>Staff</h1>
        <a href="/dashboard">← dashboard</a>
      </div>

      <StaffInviteForm />

      <h2>Members ({members.length})</h2>
      {members.map((m) => (
        <div className="card" key={m.id}>
          <div className="row spread">
            <strong>{m.fullName}</strong>
            <span className="badge">{m.role}</span>
          </div>
          <p className="muted" style={{ margin: "0.3rem 0 0" }}>
            {m.email} {m.active ? "" : "· inactive"}
          </p>
        </div>
      ))}

      {invites.length > 0 && (
        <>
          <h2>Pending invites ({invites.length})</h2>
          {invites.map((i) => (
            <div className="card" key={i.id}>
              <div className="row spread">
                <span>{i.email}</span>
                <span className="badge">{i.role}</span>
              </div>
            </div>
          ))}
        </>
      )}
    </main>
  );
}

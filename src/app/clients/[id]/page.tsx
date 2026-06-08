import { redirect, notFound } from "next/navigation";
import { currentContext, isStaffRole } from "@/lib/gym";
import { prisma } from "@/lib/db";
import ProgramEditor from "./ProgramEditor";
import ClientEditForm from "./ClientEditForm";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await currentContext();
  if (!ctx) redirect("/login");
  if (!ctx.gymId || !isStaffRole(ctx.role)) redirect("/dashboard");

  const client = await prisma.client.findFirst({
    where: { id: params.id, gymId: ctx.gymId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      city: true,
      fiscalCode: true,
      birthDate: true,
      onboardingStatus: true,
      userId: true,
    },
  });
  if (!client) notFound();

  return (
    <main>
      <div className="row spread">
        <h1>{client.fullName}</h1>
        <a href="/people">← people</a>
      </div>
      <p className="muted">
        <span className="badge">{client.onboardingStatus}</span>{" "}
        {client.userId ? "· has login" : "· no login yet"}
      </p>

      <h2>Details</h2>
      <ClientEditForm
        id={client.id}
        fullName={client.fullName}
        email={client.email ?? ""}
        phone={client.phone ?? ""}
        city={client.city ?? ""}
        fiscalCode={client.fiscalCode ?? ""}
        birthDate={client.birthDate ? client.birthDate.toISOString().slice(0, 10) : ""}
        onboardingStatus={client.onboardingStatus}
      />

      <h2>Workout program</h2>
      <ProgramEditor clientId={client.id} />
    </main>
  );
}

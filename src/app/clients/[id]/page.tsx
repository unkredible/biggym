import { redirect, notFound } from "next/navigation";
import { currentContext, isStaffRole } from "@/lib/gym";
import { prisma } from "@/lib/db";
import ClientDocs from "./ClientDocs";
import ClientEditForm from "./ClientEditForm";
import TrainerSelect from "./TrainerSelect";

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
      assignedTrainerId: true,
    },
  });
  if (!client) notFound();

  const trainers = await prisma.membership.findMany({
    where: { gymId: ctx.gymId, role: { in: ["trainer", "gym_admin"] }, active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, role: true },
  });

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

      <h2>Trainer</h2>
      <TrainerSelect
        clientId={client.id}
        trainers={trainers}
        current={client.assignedTrainerId}
      />

      <h2>Workout cards</h2>
      <ClientDocs clientId={client.id} />
    </main>
  );
}

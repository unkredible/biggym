import { prisma } from "@/lib/db";
import ConfirmForm from "./ConfirmForm";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await prisma.clientInvite.findUnique({
    where: { token: params.token },
    include: { gym: true },
  });

  const invalid =
    !invite || invite.expiresAt < new Date();

  if (invalid) {
    return (
      <main>
        <h1>Invitation</h1>
        <p>This invitation link is invalid or has expired. Ask your gym to send a new one.</p>
      </main>
    );
  }

  if (invite!.acceptedAt) {
    return (
      <main>
        <h1>Already confirmed</h1>
        <p>You&apos;ve already confirmed your membership at {invite!.gym.name}. 🎉</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Join {invite!.gym.name}</h1>
      <p className="muted">
        Confirm your membership for <code>{invite!.email}</code>.
      </p>
      <ConfirmForm
        token={params.token}
        defaultName={invite!.fullName ?? ""}
        gymName={invite!.gym.name}
      />
    </main>
  );
}
